use rusqlite::{params, Connection, Transaction};
use std::collections::HashSet;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct Migration {
    pub id: i64,
    pub name: &'static str,
    pub sql: &'static str,
}

pub const MIGRATIONS: &[Migration] = &[
    Migration {
        id: 1,
        name: "init",
        sql: include_str!("../../migrations/0001_init.sql"),
    },
    Migration {
        id: 2,
        name: "add_is_today",
        sql: include_str!("../../migrations/0002_add_is_today.sql"),
    },
    Migration {
        id: 3,
        name: "add_due",
        sql: include_str!("../../migrations/0003_add_due.sql"),
    },
];

fn baseline_if_needed(tx: &Transaction) -> rusqlite::Result<()> {
    let applied_count: i64 =
        tx.query_row("SELECT count(*) FROM schema_migrations", [], |r| r.get(0))?;
    if applied_count > 0 {
        return Ok(()); // Not a pre-migration DB, or baselined already.
    }

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    // For pre-existing databases, check if columns from migrations 2 & 3 already exist.
    // If so, insert baseline records into schema_migrations so we don't re-apply them.
    let is_today_exists: i64 = tx
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('tasks') WHERE name = 'is_today'",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    if is_today_exists > 0 {
        tx.execute(
            "INSERT OR IGNORE INTO schema_migrations (id, name, applied_at) VALUES (?1, ?2, ?3)",
            params![2, "add_is_today", now],
        )?;
    }

    let due_exists: i64 = tx
        .query_row(
            "SELECT COUNT(*) FROM pragma_table_info('tasks') WHERE name = 'due'",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    if due_exists > 0 {
        tx.execute(
            "INSERT OR IGNORE INTO schema_migrations (id, name, applied_at) VALUES (?1, ?2, ?3)",
            params![3, "add_due", now],
        )?;
    }

    Ok(())
}

pub fn run_migrations(conn: &mut Connection) -> rusqlite::Result<()> {
    // Hardening pragmas for desktop sqlite
    conn.execute_batch(
        r#"
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
    "#,
    )?;

    conn.execute_batch(
        r#"
      CREATE TABLE IF NOT EXISTS schema_migrations(
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL
      );
    "#,
    )?;

    let tx = conn.transaction()?;

    baseline_if_needed(&tx)?;

    let mut stmt = tx.prepare("SELECT id FROM schema_migrations")?;
    let applied: HashSet<i64> = stmt
        .query_map([], |row| row.get::<_, i64>(0))?
        .collect::<Result<_, _>>()?;

    drop(stmt);

    for m in MIGRATIONS {
        if applied.contains(&m.id) {
            continue;
        }
        tx.execute_batch(m.sql)?;
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
        tx.execute(
            "INSERT INTO schema_migrations(id, name, applied_at) VALUES(?1,?2,?3)",
            params![m.id, m.name, now],
        )?;
    }

    tx.commit()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn has_column(conn: &Connection, table: &str, column: &str) -> bool {
        let mut stmt = conn
            .prepare("SELECT COUNT(*) FROM pragma_table_info(?) WHERE name = ?")
            .unwrap();
        let count: i64 = stmt.query_row(params![table, column], |r| r.get(0)).unwrap();
        count > 0
    }

    #[test]
    fn test_migrations_fresh_install() {
        let mut conn = Connection::open_in_memory().unwrap();
        run_migrations(&mut conn).unwrap();

        // Check if all tables are created
        let mut stmt = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
            .unwrap();
        let tables: Vec<String> = stmt
            .query_map([], |row| row.get(0))
            .unwrap()
            .map(|r| r.unwrap())
            .collect();
        assert!(tables.contains(&"tasks".to_string()));
        assert!(tables.contains(&"day_blocks".to_string()));
        assert!(tables.contains(&"settings".to_string()));
        assert!(tables.contains(&"schema_migrations".to_string()));

        // Check if all migrations were applied
        let mut stmt = conn
            .prepare("SELECT COUNT(*) FROM schema_migrations")
            .unwrap();
        let migration_count: i64 = stmt.query_row([], |row| row.get(0)).unwrap();
        assert_eq!(migration_count, MIGRATIONS.len() as i64);

        // Check if columns from migrations were added
        assert!(has_column(&conn, "tasks", "is_today"));
        assert!(has_column(&conn, "tasks", "due"));
    }

    #[test]
    fn test_migrations_idempotency() {
        let mut conn = Connection::open_in_memory().unwrap();
        run_migrations(&mut conn).unwrap();
        run_migrations(&mut conn).unwrap(); // Run a second time

        // Check that migrations were applied only once
        let mut stmt = conn
            .prepare("SELECT COUNT(*) FROM schema_migrations")
            .unwrap();
        let migration_count: i64 = stmt.query_row([], |row| row.get(0)).unwrap();
        assert_eq!(migration_count, MIGRATIONS.len() as i64);
    }

    #[test]
    fn test_migrations_upgrade_from_v1() {
        // Simulate a DB that only has the initial schema (pre-is_today)
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "
            CREATE TABLE tasks (id TEXT PRIMARY KEY, title TEXT);
            CREATE TABLE day_blocks (id TEXT PRIMARY KEY);
            CREATE TABLE settings (key TEXT PRIMARY KEY);
            ",
        )
        .unwrap();

        assert!(!has_column(&conn, "tasks", "is_today"));
        assert!(!has_column(&conn, "tasks", "due"));

        run_migrations(&mut conn).unwrap();

        // After migrations, the columns should exist.
        assert!(has_column(&conn, "tasks", "is_today"));
        assert!(has_column(&conn, "tasks", "due"));

        // And the migrations should be marked as applied.
        let mut stmt = conn
            .prepare("SELECT COUNT(*) FROM schema_migrations")
            .unwrap();
        let migration_count: i64 = stmt.query_row([], |row| row.get(0)).unwrap();
        assert_eq!(migration_count, MIGRATIONS.len() as i64);
    }

     #[test]
    fn test_migrations_upgrade_from_v2_with_baseline() {
        // Simulate a DB that has `is_today` but not `due`, and no schema_migrations table
        let mut conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "
            CREATE TABLE tasks (id TEXT PRIMARY KEY, title TEXT, is_today INTEGER);
            ",
        )
        .unwrap();

        assert!(has_column(&conn, "tasks", "is_today"));
        assert!(!has_column(&conn, "tasks", "due"));

        run_migrations(&mut conn).unwrap();

        assert!(has_column(&conn, "tasks", "due"));

        // Check baselining worked: 2 migrations should have run (1 and 3)
        // and one should have been baselined (2). So total should be 3.
        let applied_count: i64 = conn
            .query_row("SELECT count(*) FROM schema_migrations", [], |r| r.get(0))
            .unwrap();
        assert_eq!(applied_count, MIGRATIONS.len() as i64);

        // Check that migration 2 was baselined and not re-run (we can't really check re-run, but we can check if it's there)
        let m2_applied: i64 = conn.query_row("SELECT count(*) FROM schema_migrations WHERE id=2", [], |r| r.get(0)).unwrap();
        assert_eq!(m2_applied, 1);
    }
}
