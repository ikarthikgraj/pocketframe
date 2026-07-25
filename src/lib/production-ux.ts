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
  if (tab === "Shots" && !milestones.voiceComplete) return "Approve narration for every scene first. Silent shots are timed to approved narration.";
  if (tab === "Final Cut" && !milestones.shotsComplete) return "Approve one shot for every scene first. Final assembly only uses approved media.";
  return undefined;
}

export function nextRecommendedAction(input: ProductionUxInput): RecommendedAction {
  const milestones = deriveMilestones(input);
  if (!input.project.productionBible) return { title: "Create the Production Bible", reason: "Characters, environments, and scene planning begin with this synopsis-grounded plan.", buttonLabel: "Open Story Planning", targetTab: "Story" };
  if (!milestones.storyComplete) return { title: "Review the Production Bible", reason: "Voice direction and scene planning depend on an approved production plan.", buttonLabel: "Review Story Plan", targetTab: "Story" };
  const unapprovedVoice = input.scenes.find((scene) => !input.audioVersions[scene.id]?.some((version) => version.status === "APPROVED"));
  if (unapprovedVoice) {
    const hasAudio = input.audioVersions[unapprovedVoice.id]?.length;
    return { title: `${hasAudio ? "Approve" : "Generate"} Scene ${unapprovedVoice.sceneNumber} narration`, reason: "Every silent shot is matched to the approved narration duration.", buttonLabel: "Open Voice Review", targetTab: "Voice" };
  }
  const unapprovedShot = input.scenes.find((scene) => !scene.approvedVersionId && !input.versions[scene.id]?.some((version) => version.status === "APPROVED"));
  if (unapprovedShot) {
    const hasReadyShot = input.versions[unapprovedShot.id]?.some((version) => version.status === "READY");
    return { title: `${hasReadyShot ? "Review" : "Generate"} Scene ${unapprovedShot.sceneNumber} shot`, reason: "Final assembly uses exactly one approved silent shot for every narration scene.", buttonLabel: "Open Shot Review", targetTab: "Shots" };
  }
  if (input.render?.status !== "COMPLETE") return { title: "Export the trailer", reason: "All approved narration and shots are ready for final assembly.", buttonLabel: "Open Final Cut", targetTab: "Final Cut" };
  return { title: "Review the final trailer", reason: "Your approved trailer is ready to play and download.", buttonLabel: "Open Final Cut", targetTab: "Final Cut" };
}

export function productionPipeline(input: ProductionUxInput): PipelineItem[] {
  const m = deriveMilestones(input);
  const bible = Boolean(input.project.productionBible);
  const hasReadyAudio = Object.values(input.audioVersions).flat().some((item) => item.status === "READY");
  const hasReadyShot = Object.values(input.versions).flat().some((item) => item.status === "READY");
  const hasRunningShot = Object.values(input.versions).flat().some((item) => runningVideo(item.status));
  const hasFailedShot = Object.values(input.versions).flat().some((item) => item.status === "FAILED");
  const storyStatus: ProductionStatus = bible ? "Complete" : input.project.status === "ANALYZING" ? "Running" : "Ready";
  const storyMessage = bible ? "Source saved" : input.project.status === "ANALYZING" ? "Analyzing the synopsis" : "Ready for source input";
  const planningStatus: ProductionStatus = !bible ? "Waiting" : !m.storyComplete ? "Review Required" : "Complete";
  const voiceStatus: ProductionStatus = !m.storyComplete ? "Blocked" : m.voiceComplete ? "Complete" : hasReadyAudio ? "Review Required" : "Ready";
  const shotStatus: ProductionStatus = !m.voiceComplete ? "Blocked" : m.shotsComplete ? "Complete" : hasRunningShot ? "Running" : hasReadyShot ? "Review Required" : hasFailedShot ? "Failed" : "Ready";
  const finalStatus: ProductionStatus = input.render?.status === "COMPLETE" ? "Complete" : input.render?.status === "FAILED" ? "Failed" : input.render?.status === "RENDERING" ? "Running" : m.shotsComplete ? "Ready" : "Blocked";
  return [
    { number: 1, name: "Story Input", status: storyStatus, message: storyMessage },
    { number: 2, name: "Story Analysis", status: bible ? "Complete" : input.project.status === "ANALYZING" ? "Running" : "Waiting", message: bible ? "Synopsis analyzed" : "Waiting for analysis" },
    { number: 3, name: "Production Bible", status: planningStatus, message: planningStatus === "Review Required" ? "Approval required" : bible ? "Plan available" : "Waiting for analysis" },
    { number: 4, name: "Character Discovery", status: bible ? (m.storyComplete ? "Complete" : "Review Required") : "Waiting", message: bible ? "Character references prepared" : "Waiting for the plan" },
    { number: 5, name: "Environment Discovery", status: bible ? (m.storyComplete ? "Complete" : "Review Required") : "Waiting", message: bible ? "Environment references prepared" : "Waiting for the plan" },
    { number: 6, name: "Scene Planning", status: planningStatus, message: bible ? `${m.totalScenes} scenes planned` : "Waiting for analysis" },
    { number: 7, name: "Voice Direction", status: !bible ? "Blocked" : "Complete", message: bible ? "Voice Bible ready" : "Waiting for story planning" },
    { number: 8, name: "Narration Generation", status: voiceStatus, message: m.voiceComplete ? "All narration approved" : hasReadyAudio ? "Narration ready to review" : !m.storyComplete ? "Complete Story Planning first" : "Ready to generate" },
    { number: 9, name: "Silent Shot Generation", status: shotStatus, message: m.shotsComplete ? "All shots approved" : hasRunningShot ? "Generating silent shots" : !m.voiceComplete ? "Approve narration first" : "Ready to generate" },
    { number: 10, name: "Shot Review", status: shotStatus === "Running" ? "Waiting" : shotStatus, message: m.shotsComplete ? "All versions approved" : hasReadyShot ? "Version review required" : !m.voiceComplete ? "Approve narration first" : "Waiting for a shot" },
    { number: 11, name: "Final Assembly", status: finalStatus, message: finalStatus === "Blocked" ? "Approve every shot first" : finalStatus === "Running" ? "Assembling approved media" : finalStatus === "Complete" ? "Trailer assembled" : "Ready to assemble" },
    { number: 12, name: "Trailer Export", status: finalStatus, message: finalStatus === "Complete" ? "MP4 ready" : finalStatus === "Failed" ? "Export failed — retry available" : finalStatus === "Running" ? "Encoding MP4" : finalStatus === "Blocked" ? "Waiting for approved shots" : "Ready to export" },
  ];
}

export function productionTeam(input: ProductionUxInput): TeamRole[] {
  const m = deriveMilestones(input);
  const next = nextRecommendedAction(input);
  return [
    { role: "Story Analyst", task: !input.project.productionBible ? "Preparing the Production Bible" : m.storyComplete ? "Production Bible and scene plan complete" : "Waiting for Production Bible approval", status: !input.project.productionBible ? (input.project.status === "ANALYZING" ? "Running" : "Ready") : m.storyComplete ? "Complete" : "Review Required" },
    { role: "Visual Director", task: !m.voiceComplete ? "Waiting for approved narration" : m.shotsComplete ? "All silent shots approved" : next.targetTab === "Shots" ? next.title : "Ready for silent shots", status: !m.voiceComplete ? "Blocked" : m.shotsComplete ? "Complete" : "Ready" },
    { role: "Voice Director", task: !m.storyComplete ? "Waiting for story planning" : m.voiceComplete ? "All narration approved" : next.targetTab === "Voice" ? next.title : "Narration review in progress", status: !m.storyComplete ? "Blocked" : m.voiceComplete ? "Complete" : "Review Required" },
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
