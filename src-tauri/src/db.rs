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

    create_tables_if_not_exist(&conn)?;
    run_migrations(&conn)?;

    Ok(Database(Mutex::new(conn)))
}

fn create_tables_if_not_exist(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            done INTEGER NOT NULL DEFAULT 0,
            is_today INTEGER NOT NULL DEFAULT 0,
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
    Ok(())
}

fn run_migrations(conn: &Connection) -> Result<(), rusqlite::Error> {
    // --- Migrations ---
    // Each migration should be idempotent (safe to run multiple times).

    // Version 1: Add is_today to tasks table if it doesn't exist
    // This is for users who have a database from before this column was added.
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM pragma_table_info('tasks') WHERE name = 'is_today'")?;
    let column_exists: i64 = stmt.query_row([], |row| row.get(0))?;

    if column_exists == 0 {
        conn.execute(
            "ALTER TABLE tasks ADD COLUMN is_today INTEGER NOT NULL DEFAULT 0",
            [],
        )?;
    }

    // Version 2: Add due date to tasks table
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM pragma_table_info('tasks') WHERE name = 'due'")?;
    let column_exists: i64 = stmt.query_row([], |row| row.get(0))?;

    if column_exists == 0 {
        conn.execute("ALTER TABLE tasks ADD COLUMN due TEXT", [])?;
    }

    // Future migrations can be added here...

    Ok(())
}
