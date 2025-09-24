-- Add is_today column to tasks table
ALTER TABLE tasks ADD COLUMN is_today INTEGER NOT NULL DEFAULT 0;
