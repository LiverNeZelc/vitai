import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const globalForDatabase = globalThis as typeof globalThis & {
  sqlite?: Database.Database;
};

function createDatabase(): Database.Database {
  const databasePath = resolve(
    process.cwd(),
    process.env.SQLITE_PATH ?? "data/leads.sqlite",
  );

  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new Database(databasePath);
  database.pragma("busy_timeout = 5000");
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      interest TEXT NOT NULL CHECK (interest IN ('subscription', 'single_order', 'question')),
      comment TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      utm_term TEXT,
      gclid TEXT,
      page_url TEXT,
      referrer TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS leads_phone_created_at_idx
      ON leads (phone, created_at DESC);
  `);

  return database;
}

export function getDatabase(): Database.Database {
  if (!globalForDatabase.sqlite) {
    globalForDatabase.sqlite = createDatabase();
  }

  return globalForDatabase.sqlite;
}
