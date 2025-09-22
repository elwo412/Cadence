use rusqlite::Connection;
use std::fs;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

pub struct Database(pub Mutex<Connection>);

pub fn init_db(handle: &AppHandle) -> Result<Database, rusqlite::Error> {
    let app_data_dir = handle
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir).expect("failed to create app data dir");
    }
    let db_path = app_data_dir.join("cadence.db");

    let conn = Connection::open(&db_path)?;

    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            done INTEGER NOT NULL DEFAULT 0,
            est_minutes INTEGER,
            notes TEXT,
            project TEXT,
            tags TEXT,
            created_at TEXT
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
    )?;

    Ok(Database(Mutex::new(conn)))
}
