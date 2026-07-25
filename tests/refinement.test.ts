import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { GENRES, LANGUAGES } from "../src/components/project-form";
import { runMigrations } from "../src/lib/db/migrate";
import { createRepositories } from "../src/lib/db/repositories";
import { assertSilentVisualPrompt } from "../src/lib/video/prompt";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { VIDEO_MODELS, normalizeVideoModel, videoModelLabel } from "../src/lib/video/models";

test("genre and language selects include required choices and Other", () => {
  assert.deepEqual(GENRES, ["Romance", "Thriller", "Mystery", "Horror", "Fantasy", "Drama", "Action", "Crime", "Sci-Fi", "Historical", "Family Drama", "Comedy", "Supernatural", "Other"]);
  assert.deepEqual(LANGUAGES, ["English", "Hindi", "Hinglish", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Punjabi", "Gujarati", "Urdu", "Other"]);
});

test("visual prompts reject audio instructions while exact narration remains unconstrained", () => {
  const forbidden = ["narration", "narrator", "voice-over", "voiceover", "dialogue", "says", "speaking", "soundtrack", "music", "sound effect", "audio", "we hear"];
  for (const word of forbidden) assert.throws(() => assertSilentVisualPrompt(`A cinematic scene where ${word} is present.`));
  assert.equal(assertSilentVisualPrompt("A lone figure crosses a rain-soaked station platform, slow push-in, cool practical lighting."), "A lone figure crosses a rain-soaked station platform, slow push-in, cool practical lighting.");
});

test("silent shots are approved before late-stage narration and initial planning creates no TTS", () => {
  const database = new Database(":memory:"); runMigrations(database); const repo = createRepositories(database);
  const project = repo.createProject({ title: "Late voice", synopsis: "Exact source text.", genre: "Drama", languageCode: "en-IN" });
  const scene = repo.createScene(project.id, { sceneNumber: 1, exactText: "Exact source text." });
  assert.equal(repo.listAudioVersions(scene.id).length, 0);
  database.prepare("UPDATE projects SET story_bible_json = '{}' WHERE id = ?").run(project.id);
  // Directly exercise approval state without altering existing media storage.
  database.prepare("UPDATE projects SET status = 'SHOT_GENERATION' WHERE id = ?").run(project.id);
  const video = repo.createSceneVersion({ sceneId: scene.id, provider: "manual", prompt: "A visual only shot.", negativePrompt: "No audio.", videoPath: "projects/test/video.mp4", durationMs: 2000, status: "READY" });
  repo.approveSceneVersion(video.id);
  assert.equal(repo.getProject(project.id)?.status, "VOICE_REVIEW");
  repo.createAudioVersion({ sceneId: scene.id, provider: "mock", model: "fixture", audioPath: "projects/test/audio.wav", durationMs: 1000 });
  repo.approveTts(scene.id);
  assert.equal(repo.getProject(project.id)?.status, "READY_TO_RENDER");
  database.close();
});

test("narration revisions preserve the original, retain audio history, and gate rendering on current script audio", () => {
  const database = new Database(":memory:"); runMigrations(database); const repo = createRepositories(database);
  const project = repo.createProject({ title: "Revision", synopsis: "Exact source text.", genre: "Drama", languageCode: "en-IN" }); const scene = repo.createScene(project.id, { sceneNumber: 1, exactText: "Exact source text." });
  const first = repo.createAudioVersion({ sceneId: scene.id, provider: "mock", model: "fixture", audioPath: "first.wav", durationMs: 1000 });
  repo.approveAudioVersion(first.id); const revised = repo.updateNarrationScript(scene.id, "User edited narration.")!;
  assert.equal(revised.originalNarrationText, "Exact source text."); assert.equal(revised.currentNarrationText, "User edited narration."); assert.equal(repo.getRenderReadiness(project.id).ready, false);
  const second = repo.createAudioVersion({ sceneId: scene.id, provider: "mock", model: "fixture", audioPath: "second.wav", durationMs: 1000 });
  assert.equal(repo.selectAudioVersion(second.id)?.status, "SELECTED"); assert.equal(repo.rejectAudioVersion(first.id), undefined);
  assert.equal(repo.approveAudioVersion(second.id)?.status, "TTS_APPROVED"); assert.equal(repo.listAudioVersions(scene.id).length, 2); assert.equal(repo.listAudioVersions(scene.id).filter((audio) => audio.status === "APPROVED").length, 1);
  database.close();
});

test("refinement components expose home navigation, hero visual, filters, slider, and current video model labels", () => {
  const home = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8"); const header = readFileSync(join(process.cwd(), "src/components/global-header.tsx"), "utf8"); const workspace = readFileSync(join(process.cwd(), "src/app/projects/[projectId]/page.tsx"), "utf8"); const tabs = readFileSync(join(process.cwd(), "src/components/workspace-tabs.tsx"), "utf8"); const voice = readFileSync(join(process.cwd(), "src/components/voice-scene-cards.tsx"), "utf8"); const finalCut = readFileSync(join(process.cwd(), "src/components/final-cut-panel.tsx"), "utf8");
  assert.match(home, /TrailerStudioHeroVisual/); assert.doesNotMatch(home, /Production flow/); assert.match(header, /Go to PocketFrame home/); assert.match(workspace, /Go to PocketFrame home/); assert.match(tabs, /WorkflowTabIcon/); assert.doesNotMatch(tabs, /tab-check/); assert.match(voice, /Edit Script/); assert.match(voice, /Restore Original/); assert.match(finalCut, /final-cut-grid/);
  assert.deepEqual(VIDEO_MODELS.map((model) => model.label), ["Seedance 2.0 Fast", "Kling V3 Pro", "Veo 3.1"]); assert.equal(normalizeVideoModel("Sora Video Engine"), "seedance-2-fast"); assert.equal(videoModelLabel("Kling AI 1.5"), "Kling V3 Pro");
});
