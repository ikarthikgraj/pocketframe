import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { WORKFLOW_TABS, nextWorkflowTab } from "../src/lib/workflow";
import { GENRES, LANGUAGES } from "../src/components/project-form";

test("workflow tabs follow Story, Voice, Shots, Final Cut", () => {
  assert.deepEqual(WORKFLOW_TABS, ["Story", "Voice", "Shots", "Final Cut"]);
  assert.equal(nextWorkflowTab({ storyReady: false, voiceReady: false, shotsReady: false }), "Story");
  assert.equal(nextWorkflowTab({ storyReady: true, voiceReady: false, shotsReady: false }), "Voice");
  assert.equal(nextWorkflowTab({ storyReady: true, voiceReady: true, shotsReady: false }), "Shots");
  assert.equal(nextWorkflowTab({ storyReady: true, voiceReady: true, shotsReady: true }), "Final Cut");
});

test("project creation exposes dropdown choices for genre and language", () => {
  assert.ok(GENRES.includes("Other"));
  assert.ok(LANGUAGES.includes("Other"));
  const source = readFileSync(join(process.cwd(), "src/components/project-form.tsx"), "utf8");
  assert.match(source, /<select aria-label="Genre"/);
  assert.match(source, /<select aria-label="Language"/);
});

test("workspace renders only the selected stage and shots use a horizontal scene selector", () => {
  const tabs = readFileSync(join(process.cwd(), "src/components/workspace-tabs.tsx"), "utf8");
  const shots = readFileSync(join(process.cwd(), "src/components/shot-scene-cards.tsx"), "utf8");
  const styles = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
  assert.match(tabs, /activeStage\.content/);
  assert.match(shots, /setSelectedSceneId/);
  assert.match(styles, /\.scene-selector \{ display: flex/);
});
