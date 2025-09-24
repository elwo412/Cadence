pub mod migrations;

use rusqlite::Connection;
use std::{fs, sync::Mutex};
use tauri::{AppHandle, Manager};
use chrono::Local;

pub struct Database(pub Mutex<Connection>);

fn backup_db(db_path: &std::path::Path) -> Result<(), std::io::Error> {
    if db_path.exists() {
        let timestamp = Local::now().format("%Y%m%d%H%M");
        let backup_path = db_path.with_extension(format!("backup.{}.db", timestamp));
        fs::copy(db_path, backup_path)?;
    }
    Ok(())
}

pub fn init_db(handle: &AppHandle) -> Result<Database, rusqlite::Error> {
    let app_data_dir = handle
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    if !app_data_dir.exists() {
        fs::create_dir_all(&app_data_dir).expect("failed to create app data dir");
    }
    let db_path = app_data_dir.join("cadence.db");

    // Backup database before running migrations
    backup_db(&db_path).expect("failed to backup database");

    let mut conn = Connection::open(&db_path)?;

    migrations::run_migrations(&mut conn)?;

    Ok(Database(Mutex::new(conn)))
}
