use std::fs;
use std::path::{Path, PathBuf};

use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};

const SERVER_URL: &str = "https://shakedown.vercel.app";
const LAUNCH_ZIP_URL: &str = "https://github.com/zxctehas1337/1/releases/download/Beta/launch.zip";
const FABRIC_API_URL: &str = "https://cdn.modrinth.com/data/P7dR8mSH/versions/KEv54FjE/fabric-api-0.111.0%2B1.21.4.jar";
const FABRIC_API_VERSION: &str = "0.111.0+1.21.4";
const SODIUM_URL: &str = "https://cdn.modrinth.com/data/AANobbMI/versions/c3YkZvne/sodium-fabric-0.6.13%2Bmc1.21.4.jar";
const SODIUM_VERSION: &str = "0.6.13+mc1.21.4";

mod download;
mod version;
mod mods;
mod launch;

#[derive(Serialize, Clone)]
pub struct InstallProgress {
    pub stage: String,
    pub progress: f64,
    pub message: String,
}

#[derive(Deserialize, Debug)]
pub struct VersionInfo {
    pub version: String,
    #[serde(alias = "downloadUrl", alias = "download_url")]
    pub download_url: String,
    pub changelog: Option<String>,
    #[serde(alias = "updatedAt", alias = "updated_at")]
    pub updated_at: Option<String>,
}

#[derive(Deserialize, Debug)]
struct ApiResponse {
    success: bool,
    data: Option<VersionInfo>,
    message: Option<String>,
}

pub struct ClientInstaller {
    base_dir: PathBuf,
    launch_dir: PathBuf,
    mods_dir: PathBuf,
    client: Client,
}

impl ClientInstaller {
    pub fn new(base_dir: PathBuf) -> Self {
        let launch_dir = base_dir.join("launch");
        // Моды должны быть в папке launch/run/mods
        // gradlew runClient запускается из launch/ и использует run/ как runDir
        let mods_dir = launch_dir.join("run").join("mods");
        
        Self {
            base_dir,
            launch_dir,
            mods_dir,
            client: Client::new(),
        }
    }

    pub fn get_mods_dir(&self) -> &Path {
        &self.mods_dir
    }

    pub fn ensure_directories(&self) -> Result<()> {
        fs::create_dir_all(&self.base_dir)?;
        fs::create_dir_all(&self.launch_dir)?;
        fs::create_dir_all(&self.mods_dir)?;
        println!("✓ Ensured directories exist:");
        println!("  - Base: {:?}", self.base_dir);
        println!("  - Launch: {:?}", self.launch_dir);
        println!("  - Mods: {:?}", self.mods_dir);
        Ok(())
    }
}