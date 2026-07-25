import Link from "next/link";
import { notFound } from "next/navigation";
import { repositories } from "@/lib/db";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { nextWorkflowTab } from "@/lib/workflow";
import { StoryPlanningSetup } from "@/components/story-planning-setup";
import { VoiceSceneCards } from "@/components/voice-scene-cards";
import { ShotSceneCards } from "@/components/shot-scene-cards";
import { FinalCutPanel } from "@/components/final-cut-panel";
export default async function ProjectWorkspace({ params }: { params: Promise<{ projectId: string }> }) {
  const project = repositories().getProject((await params).projectId); if (!project) notFound();
  const scenes = repositories().listScenes(project.id);
  const audioVersions = Object.fromEntries(scenes.map((scene) => [scene.id, repositories().listAudioVersions(scene.id)]));
  const versions = Object.fromEntries(scenes.map((scene) => [scene.id, repositories().listSceneVersions(scene.id)])); const readiness = repositories().getRenderReadiness(project.id); const render = repositories().getLatestRenderVersion(project.id);
  const status = project.status.split("_").map((word) => word[0] + word.slice(1).toLowerCase()).join(" ");
  const storyReady = project.status !== "DRAFT" && project.status !== "ANALYZING" && project.status !== "BIBLE_READY";
  const voiceReady = scenes.length > 0 && scenes.every((scene) => audioVersions[scene.id]?.some((version) => version.status === "APPROVED"));
  const shotsReady = scenes.length > 0 && scenes.every((scene) => scene.approvedVersionId);
  const initialTab = nextWorkflowTab({ storyReady, voiceReady, shotsReady });
  const story = <><section className="project-overview"><div className="section-heading"><div><p className="eyebrow">Story source</p><h2>Original synopsis</h2></div><div className="overview-meta"><span>{project.genre}</span><span>{project.languageCode}</span></div></div><p className="synopsis">{project.synopsis}</p></section><StoryPlanningSetup projectId={project.id} productionBible={project.productionBible} scenes={scenes} status={project.status} /></>;
  return <div className="workspace-shell"><header className="app-header"><Link className="brand" href="/"><span className="brand-mark">PF</span><span>PocketFrame <small>AI TRAILER STUDIO</small></span></Link><div className="header-project"><strong>{project.title}</strong><span className="status-badge status-neutral">{status}</span></div></header><main className="workspace-content"><WorkspaceTabs initialTab={initialTab} stages={[{ name: "Story", ready: storyReady, content: story }, { name: "Voice", ready: storyReady, blockedMessage: "Approve the Production Bible to unlock Voice.", content: <VoiceSceneCards scenes={scenes} audioVersions={audioVersions} voiceBible={project.voiceBible} /> }, { name: "Shots", ready: voiceReady, blockedMessage: "Approve narration for every scene to unlock Shots.", content: <ShotSceneCards scenes={scenes} versions={versions} /> }, { name: "Final Cut", ready: readiness.ready, blockedMessage: "Approve every shot to unlock Final Cut.", content: <FinalCutPanel projectId={project.id} title={project.title} scenes={scenes} ready={readiness.ready} render={render} /> }]} /></main></div>;
}
