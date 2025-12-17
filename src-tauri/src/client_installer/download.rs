use std::fs;
use std::io::Write;
use std::path::Path;

use anyhow::Result;
use futures_util::StreamExt;
use tauri::{AppHandle, Emitter, Runtime};

use super::{ClientInstaller, InstallProgress};

impl ClientInstaller {
    /// Скачивает файл. Если force=true, удаляет существующий файл и качает заново.
    pub(super) async fn download_file_force<R: Runtime>(
        &self,
        url: &str,
        dest: &Path,
        app: &AppHandle<R>,
        stage: &str,
        force: bool,
    ) -> Result<()> {
        println!("📥 Скачивание: {} -> {:?} (force={})", url, dest, force);

        // Проверяем размер существующего файла
        if dest.exists() {
            if force {
                println!("🗑️  Принудительное удаление старого файла: {:?}", dest);
                fs::remove_file(dest)?;
            } else if let Ok(metadata) = fs::metadata(dest) {
                let size = metadata.len();
                println!("⚠️  Файл уже существует: {:?} ({} байт)", dest, size);

                // Если файл пустой или слишком маленький, удаляем и скачиваем заново
                if size < 1000 {
                    println!("🗑️  Файл слишком маленький, удаляем и скачиваем заново");
                    fs::remove_file(dest)?;
                } else {
                    println!("⏭️  Файл выглядит нормально, пропускаем скачивание");
                    return Ok(());
                }
            }
        }

        if let Some(parent) = dest.parent() {
            fs::create_dir_all(parent)?;
            println!("📁 Создана папка: {:?}", parent);
        }

        let response = self.client.get(url).send().await?;
        let status = response.status();
        println!("📡 Статус скачивания: {}", status);

        if !status.is_success() {
            return Err(anyhow::anyhow!("Ошибка скачивания: статус {}", status));
        }

        let total_size = response.content_length().unwrap_or(0);
        println!(
            "📦 Размер файла: {} байт ({:.2} MB)",
            total_size,
            total_size as f64 / 1024.0 / 1024.0
        );

        let mut downloaded: u64 = 0;
        let mut file = fs::File::create(dest)?;

        let mut stream = response.bytes_stream();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk?;
            file.write_all(&chunk)?;
            downloaded += chunk.len() as u64;

            if total_size > 0 {
                let progress = (downloaded as f64 / total_size as f64) * 100.0;
                let _ = app.emit(
                    "client-install-progress",
                    InstallProgress {
                        stage: stage.to_string(),
                        progress,
                        message: format!("{}: {:.1}%", stage, progress),
                    },
                );
            }
        }

        println!("✅ Файл скачан: {:?} ({} байт)", dest, downloaded);

        // Проверяем, что файл действительно записан
        if let Ok(metadata) = fs::metadata(dest) {
            println!("✓ Проверка: файл на диске {} байт", metadata.len());
            if metadata.len() == 0 {
                return Err(anyhow::anyhow!("Ошибка: скачанный файл пустой!"));
            }
        }

        Ok(())
    }

    /// Скачивает файл (без принудительного обновления)
    pub(super) async fn download_file<R: Runtime>(
        &self,
        url: &str,
        dest: &Path,
        app: &AppHandle<R>,
        stage: &str,
    ) -> Result<()> {
        self.download_file_force(url, dest, app, stage, false).await
    }
}
