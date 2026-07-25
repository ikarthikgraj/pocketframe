import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { runMigrations } from "../src/lib/db/migrate";
import { createRepositories } from "../src/lib/db/repositories";
import { normalizeVideoDuration, supportedVideoDurations } from "../src/lib/video/duration";

function setup() {
  const database = new Database(":memory:"); database.pragma("foreign_keys = ON"); runMigrations(database);
  const repo = createRepositories(database); const project = repo.createProject({ title: "Final workflow", synopsis: "Exact source text.", genre: "Drama", languageCode: "en-IN", defaultVideoDurationSeconds: 10 });
  const scene = repo.createScene(project.id, { sceneNumber: 1, exactText: "Exact source text." });
  const audio = repo.createAudioVersion({ sceneId: scene.id, provider: "mock", model: "fixture", audioPath: "audio.wav", durationMs: 1_000 }); repo.approveAudioVersion(audio.id);
  return { database, repo, project, scene, audio };
}

test("previous shot versions are view-only and cannot be selected or approved", () => {
  const { database, repo, scene } = setup();
  const first = repo.createSceneVersion({ sceneId: scene.id, provider: "mock", prompt: "First", negativePrompt: "No", status: "READY" });
  const second = repo.createSceneVersion({ sceneId: scene.id, provider: "mock", prompt: "Second", negativePrompt: "No", status: "READY" });
  assert.equal(repo.approveSceneVersion(first.id), undefined); assert.equal(repo.approveSceneVersion(second.id)?.status, "APPROVED");
  const third = repo.createSceneVersion({ sceneId: scene.id, provider: "manual", prompt: "Third", negativePrompt: "No", status: "READY" });
  assert.equal(repo.getScene(scene.id)?.approvedVersionId, null); assert.equal(repo.getSceneVersion(second.id)?.approvedAt !== null, true); assert.equal(repo.approveSceneVersion(second.id), undefined); assert.equal(repo.approveSceneVersion(third.id)?.status, "APPROVED");
  database.close();
});

test("duration values are constrained and old values normalize safely", () => {
  assert.deepEqual(supportedVideoDurations, [4, 6, 8, 10, 12]);
  for (const value of supportedVideoDurations) assert.equal(normalizeVideoDuration(value, supportedVideoDurations), value);
  assert.equal(normalizeVideoDuration(9, supportedVideoDurations), 8); assert.equal(normalizeVideoDuration("unsupported", supportedVideoDurations), 4);
  const { database, repo, scene, project } = setup(); database.prepare("UPDATE scenes SET video_duration_seconds = 11 WHERE id = ?").run(scene.id);
  assert.equal(repo.getScene(scene.id)?.videoDurationSeconds, 10); assert.equal(repo.getProject(project.id)?.defaultVideoDurationSeconds, 10); database.close();
});

test("unapproving narration or a shot removes readiness without deleting media", () => {
  const { database, repo, scene, audio } = setup(); const video = repo.createSceneVersion({ sceneId: scene.id, provider: "manual", prompt: "Current", negativePrompt: "No", status: "READY" }); repo.approveSceneVersion(video.id);
  assert.equal(repo.getRenderReadiness(scene.projectId).ready, true); assert.equal(repo.unapproveAudioVersion(audio.id)?.status, "READY"); assert.equal(repo.getRenderReadiness(scene.projectId).ready, false); assert.equal(repo.getAudioVersion(audio.id)?.audioPath, "audio.wav");
  repo.approveAudioVersion(audio.id); assert.equal(repo.unapproveSceneVersion(video.id)?.status, "READY"); assert.equal(repo.getRenderReadiness(scene.projectId).ready, false); assert.equal(repo.getSceneVersion(video.id)?.status, "READY"); database.close();
});

test("Final Cut lock, direct-route guard, Home label, and compact user menu are present", () => {
  const tabs = readFileSync(join(process.cwd(), "src/components/workspace-tabs.tsx"), "utf8"); const page = readFileSync(join(process.cwd(), "src/app/projects/[projectId]/page.tsx"), "utf8"); const header = readFileSync(join(process.cwd(), "src/components/global-header.tsx"), "utf8"); const home = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8"); const menu = readFileSync(join(process.cwd(), "src/components/user-menu.tsx"), "utf8");
  assert.match(tabs, /LockedFinalCutTab/); assert.match(page, /redirect\(/); assert.match(page, /Approve all narration and shots to unlock Final Cut/); assert.match(header, /UserMenu/); assert.match(header, /Go to PocketFrame home/); assert.match(home, /current="home"/); assert.doesNotMatch(home, /My Projects/); assert.match(menu, /Profile/); assert.match(menu, /Settings/); assert.match(menu, /Logout/); assert.match(menu, /localStorage\.removeItem/);
});

test("project deletion is scoped, cascades only selected records, and uses a safe media path", () => {
  const { database, repo, project, scene } = setup(); const other = repo.createProject({ title: "Keep", synopsis: "Other source.", genre: "Drama", languageCode: "en-IN" }); repo.createScene(other.id, { sceneNumber: 1, exactText: "Other source." });
  repo.createSceneVersion({ sceneId: scene.id, provider: "manual", prompt: "Version", negativePrompt: "No", status: "READY" }); assert.equal(repo.deleteProject(project.id)?.id, project.id); assert.equal(repo.getProject(project.id), undefined); assert.equal(repo.listScenes(project.id).length, 0); assert.equal(repo.getProject(other.id)?.title, "Keep");
  const route = readFileSync(join(process.cwd(), "src/app/api/projects/[projectId]/route.ts"), "utf8"); assert.match(route, /startsWith/); assert.match(route, /fs\.rm/); database.close();
});

test("practical correction components expose approval, history, duration, and delete controls", () => {
  for (const file of ["shot-version-history.tsx", "shot-duration-slider.tsx", "unapprove-button.tsx", "locked-final-cut-tab.tsx", "project-card-actions.tsx", "confirmation-dialog.tsx"]) assert.ok(readFileSync(join(process.cwd(), "src/components", file), "utf8").length > 0);
  const shots = readFileSync(join(process.cwd(), "src/components/shot-scene-cards.tsx"), "utf8"); const history = readFileSync(join(process.cwd(), "src/components/shot-version-history.tsx"), "utf8"); const voice = readFileSync(join(process.cwd(), "src/components/voice-scene-cards.tsx"), "utf8"); assert.match(history, /Previous versions are view-only/); assert.match(shots, /Generate Shot/); assert.match(voice, /UnapproveButton/);
});
