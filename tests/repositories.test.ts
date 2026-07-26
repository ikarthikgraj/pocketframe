import assert from "node:assert/strict"; import test from "node:test"; import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import Database from "better-sqlite3";
import { runMigrations } from "../src/lib/db/migrate"; import { createRepositories } from "../src/lib/db/repositories";
test("projects, scenes, and versions persist through reopening the database", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pocketframe-test-")); const databasePath = path.join(directory, "pocketframe.sqlite"); const first = new Database(databasePath); first.pragma("foreign_keys = ON"); runMigrations(first);
  const repository = createRepositories(first); const project = repository.createProject({ title: "Test", synopsis: "Exact text.", genre: "Drama", languageCode: "en-IN" }); const scene = repository.createScene(project.id, { sceneNumber: 1, exactText: "Exact text." }); const version = repository.createSceneVersion({ sceneId: scene.id, provider: "manual", prompt: "Prompt", negativePrompt: "Negative", status: "READY" }); assert.equal(version.versionNumber, 1); assert.equal(repository.listProjects()[0]?.totalScenes, 1); first.close();
  const second = new Database(databasePath); second.pragma("foreign_keys = ON"); runMigrations(second); const reopened = createRepositories(second); assert.equal(reopened.getProject(project.id)?.title, "Test"); assert.equal(reopened.listScenes(project.id)[0]?.exactText, "Exact text."); assert.equal(reopened.listSceneVersions(scene.id)[0]?.provider, "manual"); second.close(); fs.rmSync(directory, { recursive: true, force: true });
});test("deleteProject removes the project and all cascaded data", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pocketframe-delete-test-"));
  const databasePath = path.join(directory, "pocketframe.sqlite");
  const db = new Database(databasePath);
  db.pragma("foreign_keys = ON");
  runMigrations(db);
  const repo = createRepositories(db);
  const project = repo.createProject({ title: "Delete Me", synopsis: "To be deleted.", genre: "Action", languageCode: "en-US" });
  repo.createScene(project.id, { sceneNumber: 1, exactText: "Scene to delete." });

  assert.equal(repo.listProjects().length, 1);
  const deleted = repo.deleteProject(project.id);
  assert.equal(deleted, true);
  assert.equal(repo.listProjects().length, 0);
  assert.equal(repo.getProject(project.id), undefined);

  db.close();
  fs.rmSync(directory, { recursive: true, force: true });
});
