import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { getConfig } from "@/lib/config";
import { runMigrations } from "./migrate";

let database: Database.Database | undefined;

export function getDatabase(): Database.Database {
  if (!database) {
    const { dataDirectory } = getConfig();
    fs.mkdirSync(dataDirectory, { recursive: true });
    database = new Database(path.join(dataDirectory, "pocketframe.sqlite"));
    database.pragma("foreign_keys = ON");
    runMigrations(database);
  }
  return database;
}

export function closeDatabaseForTests() {
  database?.close();
  database = undefined;
}
