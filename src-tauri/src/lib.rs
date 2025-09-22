// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod models;

use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
pub fn run() -> tauri::Result<()> {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();
            let db = db::init_db(handle).expect("failed to initialize database");
            app.manage(db);
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
            commands::update_setting,
            commands::llm_enrich,
            commands::llm_plan,
            commands::llm_refine
        ])
        .run(tauri::generate_context!())?;
    Ok(())
}
