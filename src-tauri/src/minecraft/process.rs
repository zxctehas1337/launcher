use std::fs;
use std::io::Read;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::thread;

use tauri::{AppHandle, Emitter, Runtime};

use super::classpath::{build_classpath, offline_uuid_for_username};
use super::types::{LaunchOptions, LogEvent, ProgressEvent};
use super::version::{get_asset_index_id, get_main_class};

use serde_json::Value;

/// Параметры для запуска Java процесса
pub struct JavaLaunchParams {
    pub launch_dir: PathBuf,
    pub version_id: String,
    pub version_jar_path: PathBuf,
    pub natives_dir: PathBuf,
    pub assets_dir: PathBuf,
    pub game_dir: PathBuf,
    pub effective_version_json: Value,
}

/// Создание и настройка Java команды
pub fn build_java_command(
    params: &JavaLaunchParams,
    options: &LaunchOptions,
) -> anyhow::Result<Command> {
    let classpath = build_classpath(
        &params.launch_dir,
        &params.effective_version_json,
        &params.version_jar_path,
    )?;
    let classpath_separator = if cfg!(target_os = "windows") { ";" } else { ":" };

    let java_cmd = options.java_path.clone().unwrap_or_else(|| "java".to_string());
    let asset_index_id = get_asset_index_id(&params.effective_version_json);
    let main_class = get_main_class(&params.effective_version_json);

    let mut cmd = Command::new(&java_cmd);
    cmd.current_dir(&params.launch_dir);

    cmd.arg(format!(
        "-Djava.library.path={}",
        params.natives_dir.to_string_lossy()
    ));
    cmd.arg("-cp");
    cmd.arg(classpath.join(classpath_separator));
    cmd.arg(main_class);

    cmd.arg("--username");
    cmd.arg(&options.username);
    cmd.arg("--uuid");
    cmd.arg(offline_uuid_for_username(&options.username));
    cmd.arg("--accessToken");
    cmd.arg("0");
    cmd.arg("--userType");
    cmd.arg("mojang");
    cmd.arg("--version");
    cmd.arg(&params.version_id);
    cmd.arg("--gameDir");
    cmd.arg(params.game_dir.to_string_lossy().to_string());
    cmd.arg("--assetsDir");
    cmd.arg(params.assets_dir.to_string_lossy().to_string());
    cmd.arg("--assetIndex");
    cmd.arg(asset_index_id);

    // Скрываем консоль на Windows
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    Ok(cmd)
}

/// Запуск Java процесса и настройка мониторинга логов
pub fn spawn_and_monitor<R: Runtime>(
    mut child: Child,
    params: &JavaLaunchParams,
    app: &AppHandle<R>,
) -> anyhow::Result<()> {
    let logs_dir = params.launch_dir.join("run").join("logs");
    let _ = fs::create_dir_all(&logs_dir);
    let java_log_path = logs_dir.join("launcher-java.log");

    // Записываем начальную информацию в лог
    let _ = fs::write(
        &java_log_path,
        format!(
            "version_id={}\nassets_dir={}\ngame_dir={}\n\n",
            params.version_id,
            params.assets_dir.to_string_lossy(),
            params.game_dir.to_string_lossy()
        ),
    );

    // Мониторинг stdout
    let app_for_stdout = app.clone();
    let java_log_path_out = java_log_path.clone();
    if let Some(mut out) = child.stdout.take() {
        thread::spawn(move || {
            let mut buf = Vec::new();
            let _ = out.read_to_end(&mut buf);
            if !buf.is_empty() {
                let text = String::from_utf8_lossy(&buf).to_string();
                let _ = fs::OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open(&java_log_path_out)
                    .and_then(|mut f| std::io::Write::write_all(&mut f, text.as_bytes()));
                let _ = app_for_stdout.emit(
                    "minecraft-log",
                    LogEvent {
                        message: "[java stdout] (written to launcher-java.log)".into(),
                    },
                );
                println!("[minecraft.launch] java stdout captured ({} bytes)", buf.len());
            }
        });
    }

    // Мониторинг stderr
    let app_for_stderr = app.clone();
    let java_log_path_err = java_log_path.clone();
    if let Some(mut err) = child.stderr.take() {
        thread::spawn(move || {
            let mut buf = Vec::new();
            let _ = err.read_to_end(&mut buf);
            if !buf.is_empty() {
                let text = String::from_utf8_lossy(&buf).to_string();
                let _ = fs::OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open(&java_log_path_err)
                    .and_then(|mut f| std::io::Write::write_all(&mut f, text.as_bytes()));
                let _ = app_for_stderr.emit(
                    "minecraft-log",
                    LogEvent {
                        message: "[java stderr] (written to launcher-java.log)".into(),
                    },
                );
                println!("[minecraft.launch] java stderr captured ({} bytes)", buf.len());
            }
        });
    }

    // Ожидание завершения процесса
    let app_for_wait = app.clone();
    thread::spawn(move || {
        match child.wait() {
            Ok(status) => {
                println!("[minecraft.launch] java process exited: {}", status);
                let _ = app_for_wait.emit(
                    "minecraft-log",
                    LogEvent {
                        message: format!("Java exited: {} (see launcher-java.log)", status),
                    },
                );
            }
            Err(e) => {
                println!("[minecraft.launch] java wait error: {}", e);
            }
        }
    });

    Ok(())
}

/// Отправка событий прогресса запуска
pub fn emit_launch_progress<R: Runtime>(app: &AppHandle<R>, java_cmd: &str) -> anyhow::Result<()> {
    app.emit(
        "minecraft-log",
        LogEvent {
            message: format!("Using java: {}", java_cmd),
        },
    )?;
    app.emit(
        "minecraft-progress",
        ProgressEvent {
            stage: "launching".into(),
            progress: 50.0,
            current: None,
        },
    )?;
    Ok(())
}

/// Отправка событий успешного запуска
pub fn emit_launch_success<R: Runtime>(app: &AppHandle<R>) -> anyhow::Result<()> {
    app.emit(
        "minecraft-log",
        LogEvent {
            message: "✓ Java process started!".into(),
        },
    )?;
    app.emit(
        "minecraft-log",
        LogEvent {
            message: "⏳ Launching Minecraft...".into(),
        },
    )?;
    app.emit(
        "minecraft-log",
        LogEvent {
            message: "The game window will appear shortly".into(),
        },
    )?;
    app.emit("minecraft-loading", serde_json::json!({ "loading": true }))?;
    Ok(())
}

/// Отправка событий перед запуском
pub fn emit_pre_launch<R: Runtime>(app: &AppHandle<R>, username: &str) -> anyhow::Result<()> {
    app.emit(
        "minecraft-log",
        LogEvent {
            message: format!("Username: {}", username),
        },
    )?;
    app.emit(
        "minecraft-log",
        LogEvent {
            message: "Launching Minecraft with java...".into(),
        },
    )?;
    app.emit(
        "minecraft-progress",
        ProgressEvent {
            stage: "launching".into(),
            progress: 100.0,
            current: None,
        },
    )?;
    app.emit(
        "minecraft-log",
        LogEvent {
            message: "Starting Java...".into(),
        },
    )?;
    app.emit(
        "minecraft-log",
        LogEvent {
            message: "⏳ Minecraft is loading, please wait...".into(),
        },
    )?;
    app.emit(
        "minecraft-log",
        LogEvent {
            message: "This may take some seconds on first launch".into(),
        },
    )?;
    Ok(())
}
