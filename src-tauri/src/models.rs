use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub done: bool,
    pub est_minutes: i32,
    pub notes: Option<String>,
    pub project: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DayBlock {
    pub id: String,
    pub task_id: Option<String>,
    pub date: String, // YYYY-MM-DD
    pub start_slot: i32,
    pub end_slot: i32,
}
