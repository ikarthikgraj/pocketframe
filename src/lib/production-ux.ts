import type { WorkflowTab } from "@/lib/workflow";

export type ProductionStatus = "Waiting" | "Ready" | "Running" | "Review Required" | "Complete" | "Failed" | "Blocked";

export type ProductionUxInput = {
  project: { status: string; productionBible: unknown | null; voiceBible: unknown | null; createdAt: string; updatedAt: string };
  scenes: Array<{ id: string; sceneNumber: number; status: string; approvedVersionId: string | null; createdAt: string; updatedAt: string }>;
  audioVersions: Record<string, Array<{ status: string; createdAt: string; approvedAt: string | null }>>;
  versions: Record<string, Array<{ status: string; createdAt: string; updatedAt: string; errorMessage: string | null }>>;
  render?: { status: string; createdAt: string; startedAt: string | null; completedAt: string | null; errorMessage: string | null };
};

export type Milestones = { storyComplete: boolean; voiceComplete: boolean; shotsComplete: boolean; finalComplete: boolean; voiceApproved: number; shotsApproved: number; totalScenes: number };
export type PipelineItem = { number: number; name: string; status: ProductionStatus; message: string };
export type RecommendedAction = { title: string; reason: string; buttonLabel: string; targetTab: WorkflowTab; blocker?: string };
export type ActivityItem = { timestamp: string; action: string; sceneNumber?: number; tone: "complete" | "review" | "running" | "failed" | "neutral" };
export type TeamRole = { role: string; task: string; status: ProductionStatus };

const runningVideo = (status: string) => status === "QUEUED" || status === "GENERATING";
const title = (value: string) => value.split("_").map((word) => word[0] + word.slice(1).toLowerCase()).join(" ");

export function deriveMilestones(input: ProductionUxInput): Milestones {
  const totalScenes = input.scenes.length;
  const storyComplete = Boolean(input.project.productionBible) && !["DRAFT", "ANALYZING", "BIBLE_READY"].includes(input.project.status);
  const voiceApproved = input.scenes.filter((scene) => input.audioVersions[scene.id]?.some((version) => version.status === "APPROVED")).length;
  const shotsApproved = input.scenes.filter((scene) => scene.approvedVersionId || input.versions[scene.id]?.some((version) => version.status === "APPROVED")).length;
  return {
    storyComplete,
    voiceComplete: totalScenes > 0 && voiceApproved === totalScenes,
    shotsComplete: totalScenes > 0 && shotsApproved === totalScenes,
    finalComplete: input.render?.status === "COMPLETE",
    voiceApproved,
    shotsApproved,
    totalScenes,
  };
}

export function overallProgress(milestones: Pick<Milestones, "storyComplete" | "voiceComplete" | "shotsComplete" | "finalComplete">) {
  return (milestones.storyComplete ? 25 : 0) + (milestones.voiceComplete ? 25 : 0) + (milestones.shotsComplete ? 35 : 0) + (milestones.finalComplete ? 15 : 0);
}

export function blockedStageExplanation(tab: WorkflowTab, milestones: Milestones) {
  if (tab === "Voice" && !milestones.storyComplete) return "Complete Story Planning first. Voice direction depends on the approved production plan.";
  if (tab === "Shots" && !milestones.voiceComplete) return "Approve voice narration first. Visual shots are timed to approved narration.";
  if (tab === "Final Cut" && !milestones.shotsComplete) return "Approve one shot for every scene first. Final assembly uses approved shots.";
  return undefined;
}

export function nextRecommendedAction(input: ProductionUxInput): RecommendedAction {
  const milestones = deriveMilestones(input);
  if (!input.project.productionBible) return { title: "Create the Production Bible", reason: "Characters, environments, and scene planning begin with this synopsis-grounded plan.", buttonLabel: "Open Story Planning", targetTab: "Story" };
  if (!milestones.storyComplete) return { title: "Review the Production Bible", reason: "Voice direction and scene planning depend on an approved production plan.", buttonLabel: "Review Story Plan", targetTab: "Story" };
  const unapprovedVoice = input.scenes.find((scene) => !input.audioVersions[scene.id]?.some((version) => version.status === "APPROVED"));
  if (unapprovedVoice) {
    const hasAudio = input.audioVersions[unapprovedVoice.id]?.length;
    return { title: `${hasAudio ? "Approve" : "Generate"} voice narration`, reason: "Visual shots are matched to the approved narration duration.", buttonLabel: "Open Voice Review", targetTab: "Voice" };
  }
  const unapprovedShot = input.scenes.find((scene) => !scene.approvedVersionId && !input.versions[scene.id]?.some((version) => version.status === "APPROVED"));
  if (unapprovedShot) {
    const hasReadyShot = input.versions[unapprovedShot.id]?.some((version) => version.status === "READY");
    return { title: `${hasReadyShot ? "Review" : "Generate"} Scene ${unapprovedShot.sceneNumber} shot`, reason: "Final assembly uses approved visual shots for each scene beat.", buttonLabel: "Open Shots Studio", targetTab: "Shots" };
  }
  if (input.render?.status !== "COMPLETE") return { title: "Export the 30–40s trailer", reason: "All approved narration and shots are ready for final assembly.", buttonLabel: "Open Final Cut", targetTab: "Final Cut" };
  return { title: "Review the final trailer", reason: "Your approved trailer is ready to play and download.", buttonLabel: "Open Final Cut", targetTab: "Final Cut" };
}

export function productionPipeline(input: ProductionUxInput): PipelineItem[] {
  const m = deriveMilestones(input);
  const bible = Boolean(input.project.productionBible);
  const hasReadyAudio = Object.values(input.audioVersions).flat().some((item) => item.status === "READY");
  const hasReadyShot = Object.values(input.versions).flat().some((item) => item.status === "READY");
  const hasRunningShot = Object.values(input.versions).flat().some((item) => runningVideo(item.status));

  const storyStatus: ProductionStatus = bible ? (m.storyComplete ? "Complete" : "Review Required") : input.project.status === "ANALYZING" ? "Running" : "Ready";
  const voiceStatus: ProductionStatus = !m.storyComplete ? "Blocked" : m.voiceComplete ? "Complete" : hasReadyAudio ? "Review Required" : "Ready";
  const clipStatus: ProductionStatus = !m.voiceComplete ? "Blocked" : m.shotsComplete ? "Complete" : hasRunningShot ? "Running" : hasReadyShot ? "Review Required" : "Ready";
  const finalStatus: ProductionStatus = input.render?.status === "COMPLETE" ? "Complete" : input.render?.status === "FAILED" ? "Failed" : input.render?.status === "RENDERING" ? "Running" : m.shotsComplete ? "Ready" : "Blocked";

  return [
    { number: 1, name: "Story Planning", status: storyStatus, message: bible ? `${m.totalScenes} scenes planned (30–40s)` : "Ready for analysis" },
    { number: 2, name: "Voice Narration", status: voiceStatus, message: m.voiceComplete ? "Single narration MP3 approved" : "Ready to generate" },
    { number: 3, name: "Shots", status: clipStatus, message: m.shotsComplete ? "All scene shots approved" : "Visual shot review ready" },
    { number: 4, name: "Final Cut Export", status: finalStatus, message: finalStatus === "Complete" ? "Trailer MP4 ready" : "Ready to render" },
  ];
}

export function productionTeam(input: ProductionUxInput): TeamRole[] {
  const m = deriveMilestones(input);
  const next = nextRecommendedAction(input);
  return [
    { role: "Story Analyst", task: !input.project.productionBible ? "Preparing the Production Bible" : m.storyComplete ? "Production Bible and scene plan complete" : "Waiting for Production Bible approval", status: !input.project.productionBible ? (input.project.status === "ANALYZING" ? "Running" : "Ready") : m.storyComplete ? "Complete" : "Review Required" },
    { role: "Voice Director", task: !m.storyComplete ? "Waiting for story planning" : m.voiceComplete ? "Single narration MP3 approved" : next.targetTab === "Voice" ? next.title : "Narration review in progress", status: !m.storyComplete ? "Blocked" : m.voiceComplete ? "Complete" : "Review Required" },
    { role: "Visual Director", task: !m.voiceComplete ? "Waiting for approved narration" : m.shotsComplete ? "All visual shots approved" : next.targetTab === "Shots" ? next.title : "Ready for visual shots", status: !m.voiceComplete ? "Blocked" : m.shotsComplete ? "Complete" : "Ready" },
    { role: "Trailer Editor", task: input.render?.status === "COMPLETE" ? "Trailer export complete" : !m.shotsComplete ? "Waiting for approved shots" : input.render?.status === "RENDERING" ? "Assembling approved media" : "Ready for final assembly", status: input.render?.status === "COMPLETE" ? "Complete" : !m.shotsComplete ? "Waiting" : input.render?.status === "RENDERING" ? "Running" : "Ready" },
  ];
}

export function activityTimeline(input: ProductionUxInput): ActivityItem[] {
  const events: ActivityItem[] = [{ timestamp: input.project.createdAt, action: "Project created", tone: "neutral" }];
  if (input.project.productionBible) events.push({ timestamp: input.project.updatedAt, action: "Production Bible generated", tone: "complete" });
  for (const scene of input.scenes) {
    for (const audio of input.audioVersions[scene.id] ?? []) {
      events.push({ timestamp: audio.createdAt, action: "Narration version generated", sceneNumber: scene.sceneNumber, tone: "running" });
      if (audio.status === "APPROVED" && audio.approvedAt) events.push({ timestamp: audio.approvedAt, action: "Narration approved", sceneNumber: scene.sceneNumber, tone: "complete" });
    }
    for (const version of input.versions[scene.id] ?? []) {
      const action = version.status === "APPROVED" ? "Shot approved" : version.status === "REJECTED" ? "Shot rejected" : version.status === "FAILED" ? "Shot generation failed" : version.status === "READY" ? "Shot version ready for review" : "Shot version generated";
      events.push({ timestamp: version.updatedAt || version.createdAt, action, sceneNumber: scene.sceneNumber, tone: version.status === "FAILED" ? "failed" : version.status === "APPROVED" ? "complete" : version.status === "READY" || version.status === "REJECTED" ? "review" : "running" });
    }
  }
  if (input.render) {
    events.push({ timestamp: input.render.startedAt ?? input.render.createdAt, action: "Final render started", tone: "running" });
    if (input.render.status === "COMPLETE" && input.render.completedAt) events.push({ timestamp: input.render.completedAt, action: "Final trailer completed", tone: "complete" });
    if (input.render.status === "FAILED" && input.render.completedAt) events.push({ timestamp: input.render.completedAt, action: "Final render failed", tone: "failed" });
  }
  return events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function displayProjectStatus(status: string) { return title(status); }
