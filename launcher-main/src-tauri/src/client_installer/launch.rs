use std::fs;
use std::path::Path;

use anyhow::Result;
use tauri::{AppHandle, Emitter, Runtime};

use super::{ClientInstaller, InstallProgress, LAUNCH_ZIP_URL};

impl ClientInstaller {
    pub(crate) async fn install_launch_files<R: Runtime>(&self, app: &AppHandle<R>) -> Result<()> {
        let _ = app.emit(
            "client-install-progress",
            InstallProgress {
                stage: "launch".to_string(),
                progress: 0.0,
                message: "Подготовка файлов запуска...".to_string(),
            },
        );

        let launch_zip_path = self.base_dir.join("launch.zip");

        // Проверяем, установлены ли уже runtime файлы (libraries/assets/versions)
        // Не привязываемся к конкретному version_id, т.к. он может отличаться в архиве.
        let assets_dir = self.launch_dir.join("assets");
        let libraries_dir = self.launch_dir.join("libraries");
        let versions_dir = self.launch_dir.join("versions");

        let has_any_version = if let Ok(entries) = fs::read_dir(&versions_dir) {
            entries
                .flatten()
                .filter(|e| e.path().is_dir())
                .any(|e| {
                    let dir = e.path();
                    if let Ok(files) = fs::read_dir(&dir) {
                        let mut has_json = false;
                        let mut has_jar = false;
                        for f in files.flatten() {
                            let name = f.file_name().to_string_lossy().to_lowercase();
                            if name.ends_with(".json") {
                                has_json = true;
                            }
                            if name.ends_with(".jar") {
                                has_jar = true;
                            }
                            if has_json && has_jar {
                                return true;
                            }
                        }
                    }
                    false
                })
        } else {
            false
        };

        let runtime_exists = assets_dir.exists() && libraries_dir.exists() && has_any_version;

        if runtime_exists {
            let _ = app.emit(
                "client-install-progress",
                InstallProgress {
                    stage: "launch".to_string(),
                    progress: 100.0,
                    message: "Файлы уже установлены".to_string(),
                },
            );
            return Ok(());
        }

        // Скачиваем launch.zip
        self.download_file(LAUNCH_ZIP_URL, &launch_zip_path, app, "Game")
            .await?;

        let _ = app.emit(
            "client-install-progress",
            InstallProgress {
                stage: "launch".to_string(),
                progress: 70.0,
                message: "Оптимизация файлов...".to_string(),
            },
        );

        // Распаковываем во временную директорию
        let temp_extract_dir = self.base_dir.join("temp_launch");
        if temp_extract_dir.exists() {
            fs::remove_dir_all(&temp_extract_dir)?;
        }
        fs::create_dir_all(&temp_extract_dir)?;

        let file = fs::File::open(&launch_zip_path)?;
        let mut archive = zip::ZipArchive::new(file)?;
        archive.extract(&temp_extract_dir)?;

        println!("📦 Extracted launch.zip to temp directory");

        // Ищем папку с файлами (может быть launchMode или другая)
        let mut source_dir = None;
        if let Ok(entries) = fs::read_dir(&temp_extract_dir) {
            for entry in entries.flatten() {
                if entry.path().is_dir() {
                    // Проверяем, что это папка с runtime-контентом (versions/libraries)
                    let versions = entry.path().join("versions");
                    let libraries = entry.path().join("libraries");

                    if versions.exists() && libraries.exists() {
                        source_dir = Some(entry.path());
                        println!("✓ Found runtime root in: {:?}", entry.path());
                        break;
                    }
                }
            }
        }

        // Если не нашли подпапку, используем саму temp директорию
        let source = source_dir.unwrap_or(temp_extract_dir.clone());

        println!("📁 Copying launch files from: {:?}", source);
        println!("📁 Copying launch files to: {:?}", self.launch_dir);
        println!("⚠️  Skipping 'run' directory to preserve mods");

        // Копируем файлы из source в launch_dir
        self.copy_dir_contents(&source, &self.launch_dir)?;

        // Удаляем временные файлы
        fs::remove_dir_all(temp_extract_dir)?;
        fs::remove_file(launch_zip_path)?;

        let _ = app.emit(
            "client-install-progress",
            InstallProgress {
                stage: "launch".to_string(),
                progress: 100.0,
                message: "Файлы установлены".to_string(),
            },
        );

        Ok(())
    }

    fn copy_dir_contents(&self, src: &Path, dst: &Path) -> Result<()> {
        if !dst.exists() {
            fs::create_dir_all(dst)?;
        }

        for entry in fs::read_dir(src)? {
            let entry = entry?;
            let src_path = entry.path();
            let file_name = entry.file_name();

            // Skip the 'run' directory completely - we manage it separately for mods
            if file_name == "run" {
                println!("⏭️  Skipping 'run' directory from launch.zip");
                continue;
            }

            let dst_path = dst.join(&file_name);

            if src_path.is_dir() {
                self.copy_dir_contents(&src_path, &dst_path)?;
            } else {
                fs::copy(&src_path, &dst_path)?;
            }
        }

        Ok(())
    }
}
