import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { activityTimeline, blockedStageExplanation, deriveMilestones, nextRecommendedAction, overallProgress, productionTeam } from "../src/lib/production-ux";

const base = (overrides: Record<string, unknown> = {}) => ({
  project: { status: "VOICE_REVIEW", productionBible: {}, voiceBible: {}, createdAt: "2026-01-01T08:00:00.000Z", updatedAt: "2026-01-01T09:00:00.000Z" },
  scenes: [{ id: "one", sceneNumber: 1, status: "TTS_APPROVED", approvedVersionId: null, createdAt: "2026-01-01T08:00:00.000Z", updatedAt: "2026-01-01T09:00:00.000Z" }, { id: "two", sceneNumber: 2, status: "TTS_APPROVED", approvedVersionId: null, createdAt: "2026-01-01T08:00:00.000Z", updatedAt: "2026-01-01T09:00:00.000Z" }],
  audioVersions: { one: [{ status: "APPROVED", createdAt: "2026-01-01T09:00:00.000Z", approvedAt: "2026-01-01T09:10:00.000Z" }], two: [{ status: "APPROVED", createdAt: "2026-01-01T09:01:00.000Z", approvedAt: "2026-01-01T09:11:00.000Z" }] },
  versions: { one: [], two: [] },
  ...overrides,
});

test("progress uses real story, voice, shots, and final milestones", () => {
  const input = base(); const milestones = deriveMilestones(input);
  assert.equal(milestones.storyComplete, true);
  assert.equal(milestones.voiceComplete, true);
  assert.equal(milestones.shotsComplete, false);
  assert.equal(overallProgress(milestones), 50);
  const complete = deriveMilestones(base({ scenes: [{ id: "one", sceneNumber: 1, status: "APPROVED", approvedVersionId: "v1", createdAt: "2026-01-01T08:00:00.000Z", updatedAt: "2026-01-01T09:00:00.000Z" }], audioVersions: { one: [{ status: "APPROVED", createdAt: "2026-01-01T09:00:00.000Z", approvedAt: "2026-01-01T09:10:00.000Z" }] }, versions: { one: [{ status: "APPROVED", createdAt: "2026-01-01T09:15:00.000Z", updatedAt: "2026-01-01T09:15:00.000Z", errorMessage: null }] }, render: { status: "COMPLETE", createdAt: "2026-01-01T09:20:00.000Z", startedAt: "2026-01-01T09:20:00.000Z", completedAt: "2026-01-01T09:30:00.000Z", errorMessage: null } }));
  assert.equal(overallProgress(complete), 100);
});

test("next action and blockers explain real workflow dependencies", () => {
  const planning = base({ project: { status: "BIBLE_READY", productionBible: {}, voiceBible: {}, createdAt: "2026-01-01T08:00:00.000Z", updatedAt: "2026-01-01T09:00:00.000Z" } });
  assert.equal(nextRecommendedAction(planning).title, "Review the Production Bible");
  const voiceIncomplete = base({ audioVersions: { one: [], two: [] } });
  assert.match(blockedStageExplanation("Shots", deriveMilestones(voiceIncomplete)) ?? "", /Approve voice narration/);
  assert.match(blockedStageExplanation("Final Cut", deriveMilestones(planning)) ?? "", /Approve one shot/);
});

test("team status and activity timeline are derived from persisted records", () => {
  const input = base({ versions: { one: [{ status: "READY", createdAt: "2026-01-01T09:40:00.000Z", updatedAt: "2026-01-01T09:40:00.000Z", errorMessage: null }], two: [] } });
  assert.equal(productionTeam(input).find((role) => role.role === "Visual Director")?.status, "Ready");
  const activity = activityTimeline(input);
  assert.equal(activity[0]?.action, "Shot version ready for review");
  assert.ok(activity.some((item) => item.action === "Narration approved"));
});

test("workspace keeps one main and one sub-stage mounted at a time", () => {
  const tabs = readFileSync(join(process.cwd(), "src/components/workspace-tabs.tsx"), "utf8");
  const subtabs = readFileSync(join(process.cwd(), "src/components/production-experience.tsx"), "utf8");
  assert.match(tabs, /activeStage\.content/);
  assert.match(subtabs, /selected\?\.content/);
  assert.match(subtabs, /BeginnerHint/);
});
