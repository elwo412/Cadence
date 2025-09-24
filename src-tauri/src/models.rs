use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub done: bool,
    pub is_today: bool,
    pub est_minutes: i32,
    pub notes: Option<String>,
    pub project: Option<String>,
    pub tags: Option<Vec<String>>,
    pub due: Option<String>, // YYYY-MM-DD
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DayBlock {
    pub id: String,
    pub task_id: String,
    pub date: String, // YYYY-MM-DD
    pub start_slot: i32,
    pub end_slot: i32,
}

// --- From frontend `types/composer.ts` ---

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ParsedTask {
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub est: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub priority: Option<i32>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EnrichResponse {
    pub tasks: Vec<ParsedTask>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PlanWithAIResponse {
    pub assistant_text: String,
    pub proposed_tasks: Vec<ParsedTask>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub questions: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RefineSuggestion {
    pub kind: String, // "update" | "split" | "merge"
    #[serde(rename = "targetIds")]
    pub target_ids: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updates: Option<ParsedTask>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub split: Option<Vec<ParsedTask>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RefineResponse {
    pub assistant_text: String,
    pub suggestions: Vec<RefineSuggestion>,
}
