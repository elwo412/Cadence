use rusqlite::Connection;
use std::fs;
use std::sync::Mutex;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

#[cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
pub mod commands;
pub mod db;
pub mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() -> tauri::Result<()> {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();
            let db = db::init_db(&handle).expect("failed to initialize database");
            app.manage(db);

            if app.get_webview_window("main").is_none() {
                let url = if cfg!(debug_assertions) {
                    WebviewUrl::default()
                } else {
                    WebviewUrl::App("index.html".into())
                };

                WebviewWindowBuilder::new(app, "main", url)
                    .title("Cadence")
                    .inner_size(1200.0, 800.0)
                    .transparent(false)
                    .build()?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_tasks,
            commands::add_task,
            commands::update_task,
            commands::delete_task,
            commands::get_blocks_for_date,
            commands::save_blocks_for_date,
            commands::get_settings,
            commands::update_setting,
            commands::get_platform,
            commands::llm_enrich,
            commands::llm_plan,
            commands::llm_refine
        ])
        .run(tauri::generate_context!())?;
    Ok(())
}
