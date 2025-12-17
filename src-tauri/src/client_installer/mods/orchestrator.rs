use std::fs;

use anyhow::Result;
use tauri::{AppHandle, Emitter, Runtime};

use super::super::{ClientInstaller, InstallProgress};

impl ClientInstaller {
    pub async fn install_all_mods<R: Runtime>(
        &self,
        app: &AppHandle<R>,
        user_id: Option<i32>,
    ) -> Result<()> {
        println!("[install_all_mods] begin: user_id={:?}", user_id);
        self.ensure_directories()?;

        println!("[install_all_mods] ensured directories");

        let _ = app.emit(
            "client-install-progress",
            InstallProgress {
                stage: "init".to_string(),
                progress: 0.0,
                message: "Подготовка к запуску...".to_string(),
            },
        );

        // Сначала устанавливаем launch файлы (gradlew и т.д.)
        println!("[install_all_mods] install_launch_files start");
        self.install_launch_files(app).await?;
        println!("[install_all_mods] install_launch_files done");

        // Затем устанавливаем моды
        println!("[install_all_mods] install_fabric_api start");
        self.install_fabric_api(app).await?;
        println!("[install_all_mods] install_fabric_api done");

        println!("[install_all_mods] install_sodium start");
        self.install_sodium(app).await?;
        println!("[install_all_mods] install_sodium done");

        let _ = self.cleanup_viafabric_leftovers();

        println!("[install_all_mods] install_shakedown_client start");
        self.install_shakedown_client(app, user_id).await?;
        println!("[install_all_mods] install_shakedown_client done");

        let _ = app.emit(
            "client-install-progress",
            InstallProgress {
                stage: "complete".to_string(),
                progress: 100.0,
                message: "Запуск завершён".to_string(),
            },
        );

        println!("[install_all_mods] complete");
        Ok(())
    }

    pub fn check_mods_installed(&self) -> bool {
        // Проверяем наличие runtime файлов
        let version_id = "Fabric 1.21.4";
        let version_dir = self.launch_dir.join("versions").join(version_id);
        let version_json_path = version_dir.join(format!("{version_id}.json"));
        let version_jar_path = version_dir.join(format!("{version_id}.jar"));
        let assets_dir = self.launch_dir.join("assets");
        let libraries_dir = self.launch_dir.join("libraries");

        let runtime_exists = version_json_path.exists()
            && version_jar_path.exists()
            && assets_dir.exists()
            && libraries_dir.exists();

        if !runtime_exists {
            return false;
        }

        // Проверяем наличие папки mods
        if !self.mods_dir.exists() {
            return false;
        }

        let required_mods = ["fabric-api", "sodium", "shakedown"];
        let mut found_mods = vec![false; required_mods.len()];

        if let Ok(entries) = fs::read_dir(&self.mods_dir) {
            for entry in entries.flatten() {
                let file_name = entry.file_name();
                let name = file_name.to_string_lossy().to_lowercase();

                // Проверяем только JAR файлы
                if !name.ends_with(".jar") {
                    continue;
                }

                for (i, mod_name) in required_mods.iter().enumerate() {
                    if name.contains(mod_name) || (mod_name == &"shakedown" && name.contains("arizon"))
                    {
                        found_mods[i] = true;
                    }
                }
            }
        }

        // Все необходимые моды должны быть установлены
        found_mods.iter().all(|&found| found)
    }
}
