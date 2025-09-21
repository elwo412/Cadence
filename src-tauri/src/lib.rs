use rusqlite::Connection;
use std::fs;
use std::sync::Mutex;
use tauri::Manager;

mod commands;
mod models;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir().expect("failed to get app data dir");
            if !data_dir.exists() {
                fs::create_dir_all(&data_dir).expect("failed to create app data dir");
            }
            let db_path = data_dir.join("cadence.db");

            let conn = Connection::open(&db_path).expect("failed to open database");

            conn.execute_batch(
                "
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    done INTEGER NOT NULL DEFAULT 0,
                    est_minutes INTEGER NOT NULL,
                    notes TEXT,
                    project TEXT,
                    tags TEXT
                );
                CREATE TABLE IF NOT EXISTS day_blocks (
                    id TEXT PRIMARY KEY,
                    task_id TEXT,
                    date TEXT NOT NULL,
                    start_slot INTEGER NOT NULL,
                    end_slot INTEGER NOT NULL,
                    FOREIGN KEY (task_id) REFERENCES tasks (id)
                );
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
                ",
            )
            .expect("failed to create tables");

            app.manage(commands::AppState {
                db: Mutex::new(conn),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::get_tasks,
            commands::add_task,
            commands::update_task,
            commands::delete_task,
            commands::get_blocks_for_date,
            commands::save_blocks_for_date,
            commands::get_settings,
            commands::update_setting
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
