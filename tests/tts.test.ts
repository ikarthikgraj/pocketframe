import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { voiceBibleSchema } from "../src/lib/domain/contracts";
import { runMigrations } from "../src/lib/db/migrate";
import { createRepositories } from "../src/lib/db/repositories";
import { MockStoryPlanner } from "../src/lib/planning/planner";
import { segmentSynopsis, normalizeSynopsis } from "../src/lib/synopsis/segment";
import { MockTtsProvider } from "../src/lib/tts/mock-provider";
import { measureAudioDurationMs, targetVideoDurationMs } from "../src/lib/tts/duration";

const synopsis = "Mira follows a warning from her missing brother. A storm closes the road before dawn.";

test("voice bible schema and directions persist without changing exact narration", async () => {
  const database = new Database(":memory:"); runMigrations(database); const repo = createRepositories(database);
  const project = repo.createProject({ title: "Test", synopsis, genre: "Thriller", languageCode: "en-IN" }); const plan = await new MockStoryPlanner().plan(project, segmentSynopsis(synopsis));
  assert.equal(voiceBibleSchema.safeParse(plan.voiceBible).success, true); repo.replacePlanning(project.id, plan.productionBible, plan.voiceBible, plan.scenes);
  const scenes = repo.listScenes(project.id); assert.equal(scenes.map((scene) => scene.exactText).join(""), normalizeSynopsis(synopsis)); assert.ok(scenes.every((scene) => scene.intensity && scene.pace && scene.deliveryPrompt)); database.close();
});

test("mock audio versions are append-only and approval gates project readiness", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pocketframe-tts-")); const database = new Database(":memory:"); runMigrations(database); const repo = createRepositories(database);
  const project = repo.createProject({ title: "Test", synopsis, genre: "Thriller", languageCode: "en-IN" }); const plan = await new MockStoryPlanner().plan(project, segmentSynopsis(synopsis, 1)); repo.replacePlanning(project.id, plan.productionBible, plan.voiceBible, plan.scenes); repo.approveProductionBible(project.id);
  const scene = repo.listScenes(project.id)[0]!; const output = path.join(directory, "scene-01-v1.wav"); const result = await new MockTtsProvider().synthesize({ exactText: scene.exactText, performancePrompt: "Speak exactly.", outputPath: output, languageCode: "en-IN", quality: "preview" }); const durationMs = await measureAudioDurationMs(result.audioPath);
  const first = repo.createAudioVersion({ sceneId: scene.id, provider: result.provider, model: result.model, audioPath: "projects/test/audio/scene-01-v1.wav", durationMs }); const second = repo.createAudioVersion({ sceneId: scene.id, provider: result.provider, model: result.model, audioPath: "projects/test/audio/scene-01-v2.wav", durationMs });
  assert.equal(first.versionNumber, 1); assert.equal(second.versionNumber, 2); assert.equal(repo.getProject(project.id)?.status, "VOICE_REVIEW"); assert.equal(repo.approveTts(scene.id)?.status, "TTS_APPROVED"); assert.equal(repo.getProject(project.id)?.status, "VOICE_REVIEW");
  for (const remainingScene of repo.listScenes(project.id).slice(1)) { repo.createAudioVersion({ sceneId: remainingScene.id, provider: result.provider, model: result.model, audioPath: `projects/test/audio/scene-${remainingScene.sceneNumber}.wav`, durationMs }); repo.approveTts(remainingScene.id); }
  assert.equal(repo.getProject(project.id)?.status, "SHOT_GENERATION"); assert.equal(targetVideoDurationMs(durationMs), durationMs + 1_200); database.close(); fs.rmSync(directory, { recursive: true, force: true });
});
