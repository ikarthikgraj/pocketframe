import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const migrationId = "001_initial_schema";

export function runMigrations(database: Database.Database) {
  database.exec("CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  const applied = database.prepare("SELECT 1 FROM schema_migrations WHERE id = ?").get(migrationId);
  if (applied) return;

  const schema = fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8");
  const migrate = database.transaction(() => {
    database.exec(schema);
    database.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)")
      .run(migrationId, new Date().toISOString());
  });
  migrate();
}
