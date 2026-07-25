import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { runMigrations } from "../src/lib/db/migrate";
import { createRepositories } from "../src/lib/db/repositories";
import { MockVideoProvider } from "../src/lib/video/mock-provider";
import { ManualUploadProvider } from "../src/lib/video/manual-provider";

function setup() {
  const database = new Database(":memory:"); runMigrations(database); const repo = createRepositories(database);
  const project = repo.createProject({ title: "Shots", synopsis: "Exact narration.", genre: "Drama", languageCode: "en-IN" });
  const scene = repo.createScene(project.id, { sceneNumber: 1, exactText: "Exact narration." });
  repo.createAudioVersion({ sceneId: scene.id, provider: "mock", model: "fixture", audioPath: "audio.wav", durationMs: 1_000 }); repo.approveTts(scene.id);
  return { database, repo, project, scene: repo.getScene(scene.id)! };
}

test("video providers expose queued, generating, and ready job states", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pocketframe-video-")); const provider = new MockVideoProvider();
  const job = await provider.submit({ sceneId: "scene", versionNumber: 1, prompt: "A quiet doorway.", negativePrompt: "No text.", targetDurationMs: 500, outputPath: path.join(directory, "mock.mp4") });
  assert.equal((await provider.getStatus(job)).status, "QUEUED"); await new Promise((resolve) => setTimeout(resolve, 120)); assert.equal((await provider.getStatus(job)).status, "GENERATING"); await new Promise((resolve) => setTimeout(resolve, 220)); const ready = await provider.getStatus(job); assert.equal(ready.status, "READY"); assert.ok(fs.existsSync(ready.videoPath!));
  const manual = new ManualUploadProvider(); assert.equal((await manual.getStatus(await manual.submit({ sceneId: "scene", versionNumber: 2, prompt: "", negativePrompt: "", targetDurationMs: 500, outputPath: ready.videoPath! }))).status, "READY"); fs.rmSync(directory, { recursive: true, force: true });
});

test("scene versions increment, retain regeneration and upload history, and approval is exclusive", () => {
  const { database, repo, project, scene } = setup();
  const first = repo.createSceneVersion({ sceneId: scene.id, provider: "mock", prompt: "First", negativePrompt: "No text", status: "READY", videoPath: "projects/a/videos/v1.mp4", durationMs: 1_200 });
  const second = repo.createSceneVersion({ sceneId: scene.id, provider: "mock", prompt: "Regenerated", negativePrompt: "No text", status: "READY", videoPath: "projects/a/videos/v2.mp4", durationMs: 1_200 });
  const upload = repo.createSceneVersion({ sceneId: scene.id, provider: "manual", prompt: "Replacement", negativePrompt: "Manual", status: "READY", videoPath: "projects/a/videos/v3.mp4", durationMs: 1_200 });
  assert.deepEqual(repo.listSceneVersions(scene.id).map((version) => version.versionNumber), [1, 2, 3]); assert.equal(repo.countProviderVersions(scene.id), 2);
  assert.equal(repo.approveSceneVersion(first.id)?.status, "APPROVED"); assert.equal(repo.approveSceneVersion(second.id)?.status, "APPROVED"); const versions = repo.listSceneVersions(scene.id); assert.equal(versions.find((version) => version.id === first.id)?.status, "READY"); assert.equal(versions.find((version) => version.id === second.id)?.status, "APPROVED"); assert.equal(repo.getScene(scene.id)?.approvedVersionId, second.id); assert.equal(repo.getProject(project.id)?.status, "READY_TO_RENDER");
  assert.equal(repo.rejectSceneVersion(upload.id, "Not usable")?.status, "REJECTED"); assert.equal(repo.listSceneVersions(scene.id).find((version) => version.id === upload.id)?.status, "REJECTED"); database.close();
});

test("final render readiness is gated until every scene has exactly one approved version", () => {
  const { database, repo, project, scene } = setup(); const other = repo.createScene(project.id, { sceneNumber: 2, exactText: "Second exact narration." }); repo.createAudioVersion({ sceneId: other.id, provider: "mock", model: "fixture", audioPath: "audio2.wav", durationMs: 1_000 }); repo.approveTts(other.id);
  const first = repo.createSceneVersion({ sceneId: scene.id, provider: "manual", prompt: "One", negativePrompt: "No", status: "READY" }); repo.approveSceneVersion(first.id); assert.notEqual(repo.getProject(project.id)?.status, "READY_TO_RENDER");
  const second = repo.createSceneVersion({ sceneId: other.id, provider: "manual", prompt: "Two", negativePrompt: "No", status: "READY" }); repo.approveSceneVersion(second.id); assert.equal(repo.getProject(project.id)?.status, "READY_TO_RENDER"); database.close();
});
