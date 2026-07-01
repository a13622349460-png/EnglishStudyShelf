import Database from "better-sqlite3";
import { databasePath, ensureRuntimeDirs } from "./paths.js";

let db: Database.Database | null = null;

export function getDb() {
  if (db) {
    return db;
  }

  ensureRuntimeDirs();
  db = new Database(databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}

function migrate(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      file_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reading_progress (
      book_id TEXT PRIMARY KEY,
      page_number INTEGER NOT NULL,
      total_pages INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vocabulary (
      id TEXT PRIMARY KEY,
      book_id TEXT,
      text TEXT NOT NULL,
      note TEXT,
      explanation TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS explanation_cache (
      cache_key TEXT PRIMARY KEY,
      book_id TEXT,
      selection TEXT NOT NULL,
      mode TEXT NOT NULL,
      explanation TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_used_at TEXT NOT NULL,
      hit_count INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL
    );
  `);
}

