import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { GENRES, LANGUAGES } from "../src/components/project-form";
import { runMigrations } from "../src/lib/db/migrate";
import { createRepositories } from "../src/lib/db/repositories";
import { assertSilentVisualPrompt } from "../src/lib/video/prompt";

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
