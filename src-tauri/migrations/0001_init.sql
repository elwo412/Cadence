-- migrations/0001_init.sql
-- Initial schema setup

PRAGMA foreign_keys = ON;

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
