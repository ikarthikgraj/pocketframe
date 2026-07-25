import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { productionBibleSchema } from "../src/lib/domain/contracts";
import { runMigrations } from "../src/lib/db/migrate";
import { createRepositories } from "../src/lib/db/repositories";
import { MockStoryPlanner } from "../src/lib/planning/planner";
import { normalizeSynopsis, segmentSynopsis } from "../src/lib/synopsis/segment";
import { SynopsisReconstructionError, validateSynopsisReconstruction } from "../src/lib/synopsis/validate";

const synopsis = "When Mira receives a voice note from her missing brother, she returns to the hill town they once called home. The message ends with a warning: do not trust the man at the station. As a storm traps her overnight, Mira must decide whether to follow the voice or escape the secret waiting in the dark.";

test("exact narration chunks reconstruct the normalized synopsis", () => {
  const chunks = segmentSynopsis(`  ${synopsis.replace(" The message", "\n The message")}  `, 6);
  assert.equal(chunks.join(""), normalizeSynopsis(synopsis));
  assert.throws(() => validateSynopsisReconstruction(synopsis, ["Changed text."]), SynopsisReconstructionError);
});

test("Production Bible contract accepts required planning fields and rejects invalid output", () => {
  const result = productionBibleSchema.safeParse({ premise: { text: "A premise", groundedness: "FROM_SYNOPSIS" } });
  assert.equal(result.success, false);
  const planned = new MockStoryPlanner();
  const project = { id: "p1", title: "The Last Voice Note", synopsis, genre: "Thriller", languageCode: "en-IN", status: "DRAFT" as const, references: [], productionBible: null, voiceBible: null, createdAt: "now", updatedAt: "now" };
  return planned.plan(project, segmentSynopsis(synopsis)).then(({ productionBible, scenes }) => assert.equal(productionBible.sceneCount, scenes.length));
});

test("mock scene generation persists the bible and exact scenes", async () => {
  const database = new Database(":memory:"); database.pragma("foreign_keys = ON"); runMigrations(database);
  const repo = createRepositories(database); const project = repo.createProject({ title: "The Last Voice Note", synopsis, genre: "Thriller", languageCode: "en-IN" });
  const planned = await new MockStoryPlanner().plan(project, segmentSynopsis(synopsis));
  repo.replacePlanning(project.id, planned.productionBible, planned.voiceBible, planned.scenes);
  const scenes = repo.listScenes(project.id);
  assert.equal(repo.getProject(project.id)?.status, "BIBLE_READY");
  assert.equal(scenes.map((scene) => scene.exactText).join(""), normalizeSynopsis(synopsis));
  assert.equal(scenes.at(-1)?.emotion, "Urgency");
  database.close();
});
