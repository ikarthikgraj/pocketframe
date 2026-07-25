import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const migrations = [
  { id: "001_initial_schema", file: "schema.sql" },
  {
    id: "002_planning_fields",
    sql: `ALTER TABLE scenes ADD COLUMN mood TEXT;
      ALTER TABLE scenes ADD COLUMN camera_intent TEXT;
      ALTER TABLE scenes ADD COLUMN estimated_duration_seconds REAL;
      ALTER TABLE scenes ADD COLUMN prompt_notes TEXT;`,
  },
];

export function runMigrations(database: Database.Database) {
  database.exec("CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)");
  for (const migration of migrations) {
    const applied = database.prepare("SELECT 1 FROM schema_migrations WHERE id = ?").get(migration.id);
    if (applied) continue;
    const sql = "file" in migration
      ? fs.readFileSync(path.join(process.cwd(), "db", migration.file!), "utf8")
      : migration.sql;
    database.transaction(() => {
      database.exec(sql);
      database.prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)")
        .run(migration.id, new Date().toISOString());
    })();
  }
}
