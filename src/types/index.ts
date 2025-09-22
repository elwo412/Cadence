use crate::models::{DayBlock, ParsedTask, Task};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub kind: String, // "focus" | "break"
    pub minutes: i32,
    pub completed: bool,
    pub taskIds: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub breakMin: i32,
    pub apiKey: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: String,
    pub title: String,
    pub done: bool,
    pub est_minutes: i32,
    pub notes: Option<String>,
    pub project: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DayBlock {
    pub id: String,
    pub task_id: Option<String>,
    pub date: String,
    pub start_slot: i32,
    pub end_slot: i32,
}
