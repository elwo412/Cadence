use crate::models::{
    DayBlock, EnrichResponse, OpenAIRequest, OpenAIMessage, OpenAIResponse, ParsedTask,
    PlanWithAIResponse, RefineResponse, ResponseFormat, Task,
};
use rusqlite::{params, Connection, OptionalExtension};
use std::sync::Mutex;
use tauri::State;

pub struct AppState {
    pub db: Mutex<Connection>,
}

#[tauri::command]
pub fn get_tasks(state: State<AppState>) -> Result<Vec<Task>, String> {
    let conn = state.db.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, title, done, est_minutes, notes, project, tags FROM tasks")
        .map_err(|e| e.to_string())?;

    let task_iter = stmt
        .query_map([], |row| {
            let tags_str: Option<String> = row.get(6)?;
            let tags: Option<Vec<String>> = match tags_str {
                Some(s) => serde_json::from_str(&s).unwrap_or(None),
                None => None,
            };

            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                done: row.get::<_, i32>(2)? != 0,
                est_minutes: row.get(3)?,
                notes: row.get(4)?,
                project: row.get(5)?,
                tags,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut tasks = Vec::new();
    for task in task_iter {
        tasks.push(task.map_err(|e| e.to_string())?);
    }
    Ok(tasks)
}

#[tauri::command]
pub fn add_task(task: Task, state: State<AppState>) -> Result<(), String> {
    let tags_str = task
        .tags
        .map(|tags| serde_json::to_string(&tags).unwrap_or_else(|_| "[]".to_string()));

    let conn = state.db.lock().unwrap();
    conn.execute(
        "INSERT INTO tasks (id, title, done, est_minutes, notes, project, tags) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            task.id,
            task.title,
            task.done,
            task.est_minutes,
            task.notes,
            task.project,
            tags_str,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn update_task(task: Task, state: State<AppState>) -> Result<(), String> {
    let tags_str = task
        .tags
        .map(|tags| serde_json::to_string(&tags).unwrap_or_else(|_| "[]".to_string()));

    let conn = state.db.lock().unwrap();
    conn.execute(
        "UPDATE tasks SET title = ?1, done = ?2, est_minutes = ?3, notes = ?4, project = ?5, tags = ?6 WHERE id = ?7",
        params![
            task.title,
            task.done,
            task.est_minutes,
            task.notes,
            task.project,
            tags_str,
            task.id,
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_task(id: String, state: State<AppState>) -> Result<(), String> {
    let mut conn = state.db.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    tx.execute("DELETE FROM day_blocks WHERE task_id = ?1", params![&id])
        .map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM tasks WHERE id = ?1", params![&id])
        .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_blocks_for_date(date: String, state: State<AppState>) -> Result<Vec<DayBlock>, String> {
    let conn = state.db.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT id, task_id, date, start_slot, end_slot FROM day_blocks WHERE date = ?1")
        .map_err(|e| e.to_string())?;

    let block_iter = stmt
        .query_map(params![date], |row| {
            Ok(DayBlock {
                id: row.get(0)?,
                task_id: row.get(1)?,
                date: row.get(2)?,
                start_slot: row.get(3)?,
                end_slot: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut blocks = Vec::new();
    for block in block_iter {
        blocks.push(block.map_err(|e| e.to_string())?);
    }
    Ok(blocks)
}

#[tauri::command]
pub fn save_blocks_for_date(
    date: String,
    blocks: Vec<DayBlock>,
    state: State<AppState>,
) -> Result<(), String> {
    let mut conn = state.db.lock().unwrap();
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    tx.execute("DELETE FROM day_blocks WHERE date = ?1", params![date])
        .map_err(|e| e.to_string())?;

    for block in blocks {
        tx.execute(
            "INSERT INTO day_blocks (id, task_id, date, start_slot, end_slot) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![block.id, block.task_id, block.date, block.start_slot, block.end_slot],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_settings(
    state: State<AppState>,
) -> Result<std::collections::HashMap<String, String>, String> {
    let conn = state.db.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT key, value FROM settings")
        .map_err(|e| e.to_string())?;

    let mut settings = std::collections::HashMap::new();
    let rows = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
        .map_err(|e| e.to_string())?;

    for row in rows {
        let (key, value): (String, String) = row.map_err(|e| e.to_string())?;
        settings.insert(key, value);
    }

    Ok(settings)
}

#[tauri::command]
pub fn update_setting(key: String, value: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().unwrap();
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn llm_enrich(
    tasks: Vec<ParsedTask>,
    sys_prompt: String,
    state: State<'_, AppState>,
) -> Result<EnrichResponse, String> {
    let api_key = {
        let conn = state.db.lock().unwrap();
        let api_key_result: Result<Option<String>, rusqlite::Error> = conn
            .query_row(
                "SELECT value FROM settings WHERE key = 'apiKey'",
                [],
                |row| row.get(0),
            )
            .optional();

        api_key_result
            .map_err(|e| e.to_string())?
    };

    let api_key = api_key.ok_or_else(|| "OpenAI API key not found in settings".to_string())?;

    let client = reqwest::Client::new();

    let user_content =
        serde_json::to_string(&tasks).map_err(|e| format!("Serialization error: {}", e))?;

    let request = OpenAIRequest {
        model: "gpt-4o-mini",
        messages: vec![
            OpenAIMessage {
                role: "system",
                content: sys_prompt,
            },
            OpenAIMessage {
                role: "user",
                content: user_content,
            },
        ],
        response_format: ResponseFormat {
            response_type: "json_object",
        },
    };

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    if response.status().is_success() {
        let text = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response text: {}", e))?;
        let openai_response: OpenAIResponse =
            serde_json::from_str(&text).map_err(|e| format!("JSON parsing error: {}", e))?;
        let enriched_content = openai_response
            .choices
            .get(0)
            .ok_or("No choices in response")?
            .message
            .content
            .clone();
        serde_json::from_str(&enriched_content)
            .map_err(|e| format!("Final content parsing error: {}", e))
    } else {
        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|_| "Could not read error body".to_string());
        Err(format!("API Error: {} - {}", status, text))
    }
}

#[tauri::command]
pub async fn llm_plan(
    messages: Vec<OpenAIMessage<'_>>,
    sys_prompt: String,
    state: State<'_, AppState>,
) -> Result<PlanWithAIResponse, String> {
    let api_key = {
        let conn = state.db.lock().unwrap();
        let api_key_result: Result<Option<String>, rusqlite::Error> = conn
            .query_row(
                "SELECT value FROM settings WHERE key = 'apiKey'",
                [],
                |row| row.get(0),
            )
            .optional();

        api_key_result.map_err(|e| e.to_string())?
    };

    let api_key = api_key.ok_or_else(|| "OpenAI API key not found in settings".to_string())?;

    let client = reqwest::Client::new();

    let mut all_messages = vec![OpenAIMessage {
        role: "system",
        content: sys_prompt,
    }];
    all_messages.extend(messages);

    let request = OpenAIRequest {
        model: "gpt-4o-mini",
        messages: all_messages,
        response_format: ResponseFormat {
            response_type: "json_object",
        },
    };

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    if response.status().is_success() {
        let text = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response text: {}", e))?;
        let openai_response: OpenAIResponse =
            serde_json::from_str(&text).map_err(|e| format!("JSON parsing error: {}", e))?;
        let content = openai_response
            .choices
            .get(0)
            .ok_or("No choices in response")?
            .message
            .content
            .clone();
        serde_json::from_str(&content).map_err(|e| format!("Final content parsing error: {}", e))
    } else {
        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|_| "Could not read error body".to_string());
        Err(format!("API Error: {} - {}", status, text))
    }
}

#[tauri::command]
pub async fn llm_refine(
    existing: Vec<ParsedTask>,
    notes: Option<String>,
    sys_prompt: String,
    state: State<'_, AppState>,
) -> Result<RefineResponse, String> {
    let api_key: Option<String> = {
        let conn = state.db.lock().unwrap();
        conn.query_row(
            "SELECT value FROM settings WHERE key = 'apiKey'",
            [],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
    };

    let api_key = api_key.ok_or_else(|| "OpenAI API key not found in settings".to_string())?;

    let client = reqwest::Client::new();

    let mut user_content =
        serde_json::to_string(&existing).map_err(|e| format!("Serialization error: {}", e))?;
    if let Some(note_str) = notes {
        user_content = format!("{}\n\nNotes: {}", user_content, note_str);
    }

    let request = OpenAIRequest {
        model: "gpt-4o-mini",
        messages: vec![
            OpenAIMessage {
                role: "system",
                content: sys_prompt,
            },
            OpenAIMessage {
                role: "user",
                content: user_content,
            },
        ],
        response_format: ResponseFormat {
            response_type: "json_object",
        },
    };

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(api_key)
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Request error: {}", e))?;

    if response.status().is_success() {
        let text = response
            .text()
            .await
            .map_err(|e| format!("Failed to read response text: {}", e))?;
        let openai_response: OpenAIResponse =
            serde_json::from_str(&text).map_err(|e| format!("JSON parsing error: {}", e))?;
        let content = openai_response
            .choices
            .get(0)
            .ok_or("No choices in response")?
            .message
            .content
            .clone();
        serde_json::from_str(&content).map_err(|e| format!("Final content parsing error: {}", e))
    } else {
        let status = response.status();
        let text = response
            .text()
            .await
            .unwrap_or_else(|_| "Could not read error body".to_string());
        Err(format!("API Error: {} - {}", status, text))
    }
}
