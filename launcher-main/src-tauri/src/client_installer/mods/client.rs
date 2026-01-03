use std::fs;

use anyhow::Result;
use tauri::{AppHandle, Emitter, Runtime};

use super::super::{ClientInstaller, InstallProgress};

impl ClientInstaller {
    /// Читает сохранённую дату обновления клиента
    fn get_saved_updated_at(&self) -> Option<String> {
        let file = self.base_dir.join("client-updated-at.txt");
        fs::read_to_string(file).ok().map(|s| s.trim().to_string())
    }

    /// Сохраняет дату обновления клиента
    fn save_updated_at(&self, updated_at: &str) -> Result<()> {
        let file = self.base_dir.join("client-updated-at.txt");
        fs::write(file, updated_at)?;
        Ok(())
    }

    pub(super) async fn install_shakedown_client<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        user_id: Option<i32>,
    ) -> Result<()> {
        let _ = app.emit(
            "client-install-progress",
            InstallProgress {
                stage: "client-info".to_string(),
                progress: 0.0,
                message: "Проверка версии...".to_string(),
            },
        );

        let version_info = self.get_latest_version(user_id).await?;
        println!(
            "[install_shakedown_client] latest: version={}, url={}, updated_at={:?}",
            version_info.version, version_info.download_url, version_info.updated_at
        );
        
        let saved_updated_at = self.get_saved_updated_at();
        println!("[install_shakedown_client] saved_updated_at={:?}", saved_updated_at);

        // Определяем имя файла, которое должно быть установлено, из URL
        let default_filename = format!("exosware-client-{}.jar", version_info.version);
        let client_filename = version_info
            .download_url
            .split('/')
            .last()
            .unwrap_or(&default_filename);

        let client_jar_path = self.mods_dir.join(client_filename);

        // Проверяем, установлен ли уже именно тот jar, который ожидается
        let client_exists_in_mods = client_jar_path
            .metadata()
            .map(|m| m.is_file() && m.len() >= 1000)
            .unwrap_or(false);

        // Проверяем, нужно ли обновление - сравниваем по дате updated_at
        let needs_update = match (&version_info.updated_at, &saved_updated_at) {
            (Some(server_date), Some(local_date)) => {
                // Сравниваем ISO даты как строки (они сортируются правильно)
                if server_date > local_date {
                    println!(
                        "[install_shakedown_client] newer update available: server={} > local={}",
                        server_date, local_date
                    );
                    true
                } else if !client_exists_in_mods {
                    println!(
                        "[install_shakedown_client] client jar missing at {:?}",
                        client_jar_path
                    );
                    true
                } else {
                    println!(
                        "[install_shakedown_client] client is up-to-date (server={}, local={})",
                        server_date, local_date
                    );
                    false
                }
            }
            (Some(_), None) => {
                // Нет локальной даты - нужно скачать
                println!("[install_shakedown_client] no local updated_at found, need to download");
                true
            }
            (None, _) => {
                // Сервер не вернул дату - проверяем по наличию файла
                if !client_exists_in_mods {
                    println!("[install_shakedown_client] no server date, client jar missing");
                    true
                } else {
                    println!("[install_shakedown_client] no server date, but client exists");
                    false
                }
            }
        };

        if !needs_update {
            println!(
                "[install_shakedown_client] client up-to-date, skipping download (path={:?})",
                client_jar_path
            );
            let _ = app.emit(
                "client-install-progress",
                InstallProgress {
                    stage: "client".to_string(),
                    progress: 100.0,
                    message: format!("Клиент актуален ({})", version_info.version),
                },
            );
            return Ok(());
        }

        println!(
            "[install_shakedown_client] update needed: client_exists={}",
            client_exists_in_mods
        );

        let _ = app.emit(
            "client-install-progress",
            InstallProgress {
                stage: "client".to_string(),
                progress: 0.0,
                message: format!("Установка клиента {}...", version_info.version),
            },
        );

        println!("📦 Installing ShakeDown client to: {:?}", self.mods_dir);
        println!("📦 Mods directory exists: {}", self.mods_dir.exists());

        // Убеждаемся, что папка mods существует
        if !self.mods_dir.exists() {
            fs::create_dir_all(&self.mods_dir)?;
            println!("✓ Created mods directory: {:?}", self.mods_dir);
        }

        // Удаляем ВСЕ старые версии клиента перед установкой новой
        println!("🔍 Removing ALL old client versions before installing new one...");
        let target_filename_lower = client_filename.to_lowercase();
        
        if let Ok(entries) = fs::read_dir(&self.mods_dir) {
            for entry in entries.flatten() {
                let file_name = entry.file_name();
                let name = file_name.to_string_lossy().to_lowercase();
                let path = entry.path();

                // Удаляем ВСЕ JAR файлы клиента (shakedown/arizon/exosware)
                // кроме того, который мы собираемся скачать
                let is_client_jar = name.ends_with(".jar")
                    && (name.contains("shakedown")
                        || name.contains("arizon")
                        || name.contains("exosware"));
                
                let is_target_file = name == target_filename_lower;

                if is_client_jar && !is_target_file {
                    println!("🗑️  Removing old client JAR: {:?} (target: {})", path, client_filename);
                    if let Err(e) = fs::remove_file(&path) {
                        println!("⚠️  Failed to remove {:?}: {}", path, e);
                    }
                }
                // Удаляем распакованные файлы клиента (папки и файлы конфигурации)
                else if name.contains("arizon") || name == "com" || name == "meta-inf" {
                    println!("🗑️  Removing unpacked client files: {:?}", path);
                    if path.is_dir() {
                        let _ = fs::remove_dir_all(path);
                    } else {
                        let _ = fs::remove_file(path);
                    }
                }
            }
        }

        println!("📥 Target path: {:?}", client_jar_path);
        println!("📥 Download URL: {}", version_info.download_url);

        // Скачиваем JAR-файл напрямую в папку mods (force=true т.к. версия новая)
        self.download_file_force(&version_info.download_url, &client_jar_path, app, "client", true)
            .await?;

        println!(
            "[install_shakedown_client] download_file finished, verifying path={:?}",
            client_jar_path
        );

        println!("✓ Downloaded client JAR to: {:?}", client_jar_path);

        // Проверяем, что файл действительно существует
        if client_jar_path.exists() {
            if let Ok(metadata) = fs::metadata(&client_jar_path) {
                println!("✓ File verified: {} bytes", metadata.len());
            }
        } else {
            println!("❌ ERROR: File does not exist after download!");
            return Err(anyhow::anyhow!("Client file not found after download"));
        }

        // Сохраняем версию и дату обновления
        let version_file = self.base_dir.join("client-version.txt");
        fs::write(version_file, &version_info.version)?;
        
        // Сохраняем дату обновления для будущих проверок
        if let Some(updated_at) = &version_info.updated_at {
            self.save_updated_at(updated_at)?;
            println!("✓ Saved updated_at: {}", updated_at);
        }

        println!("✓ ShakeDown client {} installed successfully", version_info.version);

        let _ = app.emit(
            "client-install-progress",
            InstallProgress {
                stage: "client".to_string(),
                progress: 100.0,
                message: format!("Клиент {} установлен", version_info.version),
            },
        );

        Ok(())
    }
}
