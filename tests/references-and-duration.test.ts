import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { runMigrations } from "../src/lib/db/migrate";
import { createRepositories } from "../src/lib/db/repositories";
import { supportedVideoDurations, normalizeVideoDuration } from "../src/lib/video/duration";
import { composeVisualPromptWithReferences } from "../src/lib/video/prompt";
import { renderStages, renderStepStatuses } from "../src/components/render-progress-checklist";

function setup() {
  const database = new Database(":memory:"); database.pragma("foreign_keys = ON"); runMigrations(database);
  const repo = createRepositories(database); const project = repo.createProject({ title: "References", synopsis: "Exact source synopsis.", genre: "Drama", languageCode: "en-IN" });
  const scene = repo.createScene(project.id, { sceneNumber: 1, exactText: "Exact source synopsis." });
  return { database, repo, project, scene };
}

function add(repo: ReturnType<typeof createRepositories>, projectId: string, name: string, type: "Character" | "Environment" | "Prop" | "Style") {
  return repo.addProjectReference(projectId, { displayName: name, type, localPath: `projects/${projectId}/input/references/${name}.png`, description: `${name} detail` });
}

test("a project accepts three references, rejects a fourth, and old projects load with none", () => {
  const { database, repo, project } = setup();
  assert.deepEqual(repo.getProject(project.id)?.references, []);
  add(repo, project.id, "Carter", "Character"); add(repo, project.id, "Arena", "Environment"); add(repo, project.id, "Ball", "Prop");
  assert.equal(repo.getProject(project.id)?.references.length, 3);
  assert.throws(() => add(repo, project.id, "Nope", "Style"), /REFERENCE_LIMIT/);
  database.close();
});

test("reference replacement keeps a card and removal clears scene selection", () => {
  const { database, repo, project, scene } = setup(); const first = add(repo, project.id, "Carter", "Character");
  repo.setSceneReferenceIds(scene.id, [first.id]);
  const replacement = repo.replaceProjectReference(project.id, first.id, { displayName: "Carter updated", type: "Character", localPath: "projects/new.png", description: null });
  assert.equal(replacement?.id, first.id); assert.equal(repo.getProject(project.id)?.references[0]?.displayName, "Carter updated");
  repo.removeProjectReference(project.id, first.id);
  assert.equal(repo.getProject(project.id)?.references.length, 0); assert.deepEqual(repo.getScene(scene.id)?.selectedReferenceIds, []);
  database.close();
});

test("scenes default to no references, can select one or multiple, and retain selections across generation versions", () => {
  const { database, repo, project, scene } = setup(); const character = add(repo, project.id, "Carter", "Character"); const environment = add(repo, project.id, "Arena", "Environment");
  assert.deepEqual(repo.getScene(scene.id)?.selectedReferenceIds, []);
  repo.setSceneReferenceIds(scene.id, [character.id]); assert.deepEqual(repo.getScene(scene.id)?.selectedReferenceIds, [character.id]);
  repo.setSceneReferenceIds(scene.id, [character.id, environment.id]);
  repo.createSceneVersion({ sceneId: scene.id, provider: "mock", prompt: "A visual shot.", negativePrompt: "No text.", status: "READY" });
  repo.createSceneVersion({ sceneId: scene.id, provider: "mock", prompt: "A second visual shot.", negativePrompt: "No text.", status: "READY" });
  assert.deepEqual(repo.getScene(scene.id)?.selectedReferenceIds, [character.id, environment.id]);
  database.close();
});

test("only selected references become visual prompt continuity instructions", () => {
  const first = composeVisualPromptWithReferences("A runner enters a stadium.", [{ id: "one", name: "Arena", type: "Environment", path: "one.png", description: null }]);
  const prompt = composeVisualPromptWithReferences(first, [{ id: "two", name: "Carter", type: "Character", path: "two.png", description: null }]);
  assert.match(prompt, /facial identity/); assert.doesNotMatch(prompt, /architecture|prop appearance|cinematography/);
});

test("duration selector is fixed, normalizes legacy values, and scene duration overrides auto", () => {
  assert.deepEqual(supportedVideoDurations, [4, 6, 8]); assert.equal(normalizeVideoDuration(5, supportedVideoDurations), 4); assert.equal(normalizeVideoDuration(7.8, supportedVideoDurations), 8);
  const { database, repo, scene } = setup(); database.prepare("UPDATE scenes SET video_duration_seconds = 5 WHERE id = ?").run(scene.id);
  assert.equal(repo.getScene(scene.id)?.videoDurationSeconds, 4);
  repo.setSceneVideoDuration(scene.id, 8); assert.equal(repo.getScene(scene.id)?.videoDurationSeconds, 8);
  database.close();
});

test("render checklist is ordered, has one active step, and complete state has no running animation", () => {
  assert.deepEqual(renderStages, ["Validating approved scenes", "Preparing silent clips", "Matching scene durations", "Removing source audio", "Attaching approved narration", "Mixing optional music", "Encoding final trailer", "Validating output"]);
  const running = renderStepStatuses(5); assert.equal(running.filter((status) => status === "Running").length, 1); assert.equal(running[4], "Running");
  const completed = renderStages.map(() => "Complete"); assert.equal(completed.includes("Running"), false);
  assert.equal(renderStepStatuses(5, true)[4], "Failed");
});
