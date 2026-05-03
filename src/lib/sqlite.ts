import Database from "better-sqlite3";
import path from "path";

const dbPath = (process.env.DATABASE_URL || `file:${path.join(process.cwd(), "dev.db")}`)
  .replace(/^file:/, "");

const globalForDb = globalThis as unknown as { _sqliteDb: Database.Database };

export function getDb(): Database.Database {
  if (!globalForDb._sqliteDb) {
    globalForDb._sqliteDb = new Database(dbPath);
    globalForDb._sqliteDb.pragma("journal_mode = WAL");
    globalForDb._sqliteDb.pragma("busy_timeout = 15000");
    globalForDb._sqliteDb.pragma("foreign_keys = ON");
  }
  return globalForDb._sqliteDb;
}
