import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { getConfig } from "@/lib/config";
import { runMigrations } from "./migrate";
import { createRepositories } from "./repositories";
import { seedNovaProject, seedDramaProject } from "@/lib/nova";

let database: Database.Database | undefined;

function ensureInitialProjects(db: Database.Database) {
  try {
    const row = db.prepare("SELECT COUNT(*) AS count FROM projects").get() as { count: number } | undefined;
    if (row && row.count === 0) {
      const repo = createRepositories(db);
      const dramaSynopsis = `Abhinav, a simple sales executive trapped in a humiliating marriage, silently suffers taunts from his mother-in-law and struggles to fund his ailing mother’s treatment. Just when life seems hopeless, he discovers a shocking truth—his biological father, Randhir Raichand, a powerful billionaire, has mysteriously disappeared, leaving behind a vast empire and countless enemies. As Abhinav reluctantly steps into this hidden legacy, he faces betrayals, conspiracies, and a dangerous invention that many are willing to kill for. Meanwhile, his wife Ishita, torn between her failing company and her haunting past with ex-lover Rajvir, begins doubting Abhinav, especially after manipulated rumors and planted scandals threaten to destroy his reputation. Despite this, Abhinav secretly uses his newfound power to protect Ishita while hiding his true identity from her, fearing she will leave him if she discovers he is rich. Will Abhinav be able to hide his true identity from Ishita forever? Will Abhinav be able to find out about the secret invention of Randhir Raichand?`;
      const dramaProj = repo.createProject({
        title: "The Raichands (Beghar Billionaire)",
        synopsis: dramaSynopsis,
        genre: "Drama",
        languageCode: "Hindi"
      });
      seedDramaProject(repo, dramaProj.id);

      const novaProj = repo.createProject({
        title: "Number One Nova",
        synopsis: "As a punishment, Nova is forced to live as Kaveri. A fierce warrior trapped in a body marked by betrayal.",
        genre: "Sci-Fi / Fantasy",
        languageCode: "Hindi"
      });
      seedNovaProject(repo, novaProj.id);
    }
  } catch (err) {
    console.warn("Could not ensure initial demo projects:", err);
  }
}

export function getDatabase(): Database.Database {
  if (!database) {
    const { dataDirectory } = getConfig();
    fs.mkdirSync(dataDirectory, { recursive: true });
    database = new Database(path.join(dataDirectory, "pocketframe.sqlite"));
    database.pragma("foreign_keys = ON");
    runMigrations(database);
    ensureInitialProjects(database);
  }
  return database;
}

export function closeDatabaseForTests() {
  database?.close();
  database = undefined;
}
