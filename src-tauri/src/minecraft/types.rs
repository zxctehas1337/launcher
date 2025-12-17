use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub(crate) struct WipeResult {
    pub(crate) success: bool,
    pub(crate) deleted: Vec<String>,
    pub(crate) errors: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LaunchOptions {
    pub username: String,
    #[serde(alias = "javaPath")]
    pub java_path: Option<String>,
}

#[derive(Serialize, Clone)]
pub(crate) struct ProgressEvent {
    pub(crate) stage: String,
    pub(crate) progress: f64,
    pub(crate) current: Option<String>,
}

#[derive(Serialize, Clone)]
pub(crate) struct LogEvent {
    pub(crate) message: String,
}
