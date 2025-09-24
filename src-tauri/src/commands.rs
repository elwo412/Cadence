use crate::db::Database;
use crate::models::{DayBlock, EnrichResponse, PlanWithAIResponse, RefineResponse, Task};
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize)]
pub struct CommandError {
    pub message: String,
}

impl From<rusqlite::Error> for CommandError {
    fn from(error: rusqlite::Error) -> Self {
        CommandError {
            message: error.to_string(),
        }
    }
}

impl From<serde_json::Error> for CommandError {
    fn from(error: serde_json::Error) -> Self {
        CommandError {
            message: error.to_string(),
        }
    }
}

impl From<reqwest::Error> for CommandError {
    fn from(error: reqwest::Error) -> Self {
        CommandError {
            message: error.to_string(),
        }
    }
}

impl From<String> for CommandError {
    fn from(message: String) -> Self {
        CommandError { message }
    }
}

impl<'a> From<&'a str> for CommandError {
    fn from(message: &'a str) -> Self {
        CommandError {
            message: message.to_string(),
        }
    }
}

#[tauri::command]
pub fn get_tasks(db: State<Database>) -> Result<Vec<Task>, CommandError> {
    let conn = db.0.lock().unwrap();
    let mut stmt =
        conn.prepare("SELECT id, title, done, is_today, est_minutes, notes, project, tags FROM tasks")?;
    let task_iter = stmt.query_map(params![], |row| {
        let tags_json: Option<String> = row.get(7)?;
        let tags: Option<Vec<String>> = match tags_json {
            Some(json) if !json.is_empty() => match serde_json::from_str(&json) {
                Ok(tags) => Some(tags),
                Err(_) => Some(vec![]),
            },
            _ => Some(vec![]),
        };

        Ok(Task {
            id: row.get(0)?,
            title: row.get(1)?,
            done: row.get(2)?,
            is_today: row.get(3)?,
            est_minutes: row.get(4)?,
            notes: row.get(5)?,
            project: row.get(6)?,
            tags,
        })
    })?;

    let mut tasks = Vec::new();
    for task in task_iter {
        tasks.push(task?);
    }

    Ok(tasks)
}

#[tauri::command]
pub fn add_task(task: Task, db: State<Database>) -> Result<(), CommandError> {
    let conn = db.0.lock().unwrap();
    let tags_json = serde_json::to_string(&task.tags)?;
    conn.execute(
        "INSERT INTO tasks (id, title, done, is_today, est_minutes, notes, project, tags) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            task.id,
            task.title,
            task.done,
            task.is_today,
            task.est_minutes,
            task.notes,
            task.project,
            tags_json
        ],
    )?;
    Ok(())
}

#[tauri::command]
pub fn update_task(task: Task, db: State<Database>) -> Result<(), CommandError> {
    let conn = db.0.lock().unwrap();
    let tags_json = serde_json::to_string(&task.tags)?;
    conn.execute(
        "UPDATE tasks SET title = ?2, done = ?3, is_today = ?4, est_minutes = ?5, notes = ?6, project = ?7, tags = ?8 WHERE id = ?1",
        params![
            task.id,
            task.title,
            task.done,
            task.is_today,
            task.est_minutes,
            task.notes,
            task.project,
            tags_json
        ],
    )?;
    Ok(())
}

#[tauri::command]
pub fn delete_task(id: String, db: State<Database>) -> Result<(), CommandError> {
    let conn = db.0.lock().unwrap();
    conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])?;
    Ok(())
}

#[tauri::command]
pub fn get_blocks_for_date(date: String, db: State<Database>) -> Result<Vec<DayBlock>, CommandError> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, task_id, date, start_slot, end_slot FROM day_blocks WHERE date = ?1")?;
    let block_iter = stmt.query_map(params![date], |row| {
        Ok(DayBlock {
            id: row.get(0)?,
            task_id: row.get(1)?,
            date: row.get(2)?,
            start_slot: row.get(3)?,
            end_slot: row.get(4)?,
        })
    })?;

    let mut blocks = Vec::new();
    for block in block_iter {
        blocks.push(block?);
    }
    Ok(blocks)
}

#[tauri::command]
pub fn save_blocks_for_date(
    date: String,
    blocks: Vec<DayBlock>,
    db: State<Database>,
) -> Result<(), CommandError> {
    let mut conn = db.0.lock().unwrap();
    let tx = conn.transaction()?;
    tx.execute("DELETE FROM day_blocks WHERE date = ?1", params![date])?;
    for block in blocks {
        tx.execute(
            "INSERT INTO day_blocks (id, task_id, date, start_slot, end_slot) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![block.id, block.task_id, block.date, block.start_slot, block.end_slot],
        )?;
    }
    tx.commit()?;
    Ok(())
}

#[tauri::command]
pub fn purge_all_data(db: State<Database>) -> Result<(), CommandError> {
    let conn = db.0.lock().unwrap();
    conn.execute_batch("
        PRAGMA foreign_keys = ON;
        DROP TABLE IF EXISTS day_blocks;
        DROP TABLE IF EXISTS tasks;
    ")?;
    Ok(())
}


#[tauri::command]
pub fn get_settings(db: State<Database>) -> Result<std::collections::HashMap<String, String>, CommandError> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT key, value FROM settings")?;
    let setting_iter = stmt.query_map(params![], |row| {
        Ok((row.get(0)?, row.get(1)?))
    })?;
    let mut settings = std::collections::HashMap::new();
    for setting in setting_iter {
        let (key, value) = setting?;
        settings.insert(key, value);
    }
    Ok(settings)
}

#[tauri::command]
pub fn update_setting(key: String, value: String, db: State<Database>) -> Result<(), CommandError> {
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
        params![key, value],
    )?;
    Ok(())
}

#[derive(Serialize)]
struct EnrichRequest {
    model: String,
    messages: Vec<Message>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Message {
    role: String,
    content: String,
}

#[tauri::command]
pub async fn llm_enrich(
    task_title: String,
    db: State<'_, Database>,
) -> Result<EnrichResponse, CommandError> {
    let api_key: Option<String> = {
        let conn = db.0.lock().unwrap();
        conn.query_row("SELECT value FROM settings WHERE key = 'apiKey'", [], |row| {
            row.get(0)
        })
        .optional()?
    };

    let api_key = api_key.ok_or("OpenAI API key not found in settings")?;

    let client = reqwest::Client::new();
    let request = EnrichRequest {
        model: "gpt-4-turbo-preview".to_string(),
        messages: vec![
            Message {
                role: "system".to_string(),
                content: "You are a helpful assistant. The user will provide a task title, and you will enrich it by generating a short description (1-2 sentences) and suggesting 3-5 relevant tags. Format the output as a JSON object with 'notes' and 'tags' keys.".to_string(),
            },
            Message {
                role: "user".to_string(),
                content: task_title,
            },
        ],
    };

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&request)
        .send()
        .await?;

    if response.status().is_success() {
        let text = response.text().await?;
        let json_response: serde_json::Value = serde_json::from_str(&text)?;
        let enriched_content = json_response["choices"][0]["message"]["content"]
            .as_str()
            .ok_or("No content in response")?;
        Ok(serde_json::from_str(enriched_content)?)
    } else {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        Err(format!("API Error: {} - {}", status, text).into())
    }
}

#[derive(Serialize)]
struct PlanRequest {
    model: String,
    messages: Vec<Message>,
}

#[tauri::command]
pub async fn llm_plan(
    tasks: Vec<Task>,
    db: State<'_, Database>,
) -> Result<PlanWithAIResponse, CommandError> {
    let api_key: Option<String> = {
        let conn = db.0.lock().unwrap();
        conn.query_row("SELECT value FROM settings WHERE key = 'apiKey'", [], |row| {
            row.get(0)
        })
        .optional()?
    };
    let api_key = api_key.ok_or("OpenAI API key not found in settings")?;

    let client = reqwest::Client::new();
    let tasks_json = serde_json::to_string(&tasks)?;

    let request = PlanRequest {
        model: "gpt-4-turbo-preview".to_string(),
        messages: vec![
            Message {
                role: "system".to_string(),
                content: "You are a helpful assistant. The user will provide a list of tasks. Your job is to suggest a plausible schedule by assigning a 'start_slot' and 'end_slot' for each task. Today is a normal workday. The user wants to start work at 9am. Slots are 30-minute intervals, so 9am is slot 18, 9:30am is 19, etc. The output should be a JSON object with a 'blocks' key, containing a list of objects, each with 'task_id', 'start_slot', and 'end_slot'.".to_string(),
            },
            Message {
                role: "user".to_string(),
                content: tasks_json,
            },
        ],
    };

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&request)
        .send()
        .await?;

    if response.status().is_success() {
        let text = response.text().await?;
        let json_response: serde_json::Value = serde_json::from_str(&text)?;
        let content = json_response["choices"][0]["message"]["content"]
            .as_str()
            .ok_or("No content in response")?;
        Ok(serde_json::from_str(content)?)
    } else {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        Err(format!("API Error: {} - {}", status, text).into())
    }
}

#[derive(Serialize)]
struct RefineRequest {
    model: String,
    messages: Vec<Message>,
}

#[tauri::command]
pub async fn llm_refine(
    existing: String,
    instruction: String,
    db: State<'_, Database>,
) -> Result<RefineResponse, CommandError> {
    let api_key: Option<String> = {
        let conn = db.0.lock().unwrap();
        conn.query_row("SELECT value FROM settings WHERE key = 'apiKey'", [], |row| {
            row.get(0)
        })
        .optional()?
    };

    let api_key = api_key.ok_or("OpenAI API key not found in settings")?;

    let client = reqwest::Client::new();

    let request = RefineRequest {
        model: "gpt-4-turbo-preview".to_string(),
        messages: vec![
            Message {
                role: "system".to_string(),
                content: "You are a helpful assistant. The user will provide an existing schedule and an instruction. You will refine the schedule based on the instruction. The output should be a JSON object with a 'blocks' key, containing the new list of blocks.".to_string(),
            },
            Message {
                role: "user".to_string(),
                content: format!("Existing schedule: {}. Instruction: {}", existing, instruction),
            },
        ],
    };

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&request)
        .send()
        .await?;

    if response.status().is_success() {
        let text = response.text().await?;
        let json_response: serde_json::Value = serde_json::from_str(&text)?;
        let content = json_response["choices"][0]["message"]["content"]
            .as_str()
            .ok_or("No choices in response")?;
        Ok(serde_json::from_str(content)?)
    } else {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        Err(format!("API Error: {} - {}", status, text).into())
    }
}
