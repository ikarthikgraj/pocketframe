import Link from "next/link";
import { notFound } from "next/navigation";
import { repositories } from "@/lib/db";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { nextWorkflowTab } from "@/lib/workflow";
import { StoryPlanningSetup } from "@/components/story-planning-setup";
import { VoiceSceneCards } from "@/components/voice-scene-cards";
import { ShotSceneCards } from "@/components/shot-scene-cards";
import { FinalCutPanel } from "@/components/final-cut-panel";
import { ProjectWorkspaceOverview } from "@/components/project-workspace-overview";
import { activityTimeline, deriveMilestones, displayProjectStatus, nextRecommendedAction, overallProgress, productionPipeline, productionTeam } from "@/lib/production-ux";
export default async function ProjectWorkspace({ params }: { params: Promise<{ projectId: string }> }) {
  const project = repositories().getProject((await params).projectId); if (!project) notFound();
  const scenes = repositories().listScenes(project.id);
  const audioVersions = Object.fromEntries(scenes.map((scene) => [scene.id, repositories().listAudioVersions(scene.id)]));
  const versions = Object.fromEntries(scenes.map((scene) => [scene.id, repositories().listSceneVersions(scene.id)])); const readiness = repositories().getRenderReadiness(project.id); const render = repositories().getLatestRenderVersion(project.id);
  const ux = { project, scenes, audioVersions, versions, render };
  const milestones = deriveMilestones(ux);
  const storyReady = milestones.storyComplete;
  const voiceReady = milestones.voiceComplete;
  const shotsReady = milestones.shotsComplete;
  const initialTab = nextWorkflowTab({ storyReady, voiceReady, shotsReady });
  const story = <StoryPlanningSetup projectId={project.id} project={{ title: project.title, synopsis: project.synopsis, genre: project.genre, languageCode: project.languageCode }} productionBible={project.productionBible} scenes={scenes} status={project.status} />;
  const duration = project.productionBible?.trailerDurationSeconds ? `${project.productionBible.trailerDurationSeconds}s trailer` : "Trailer duration pending";
  return <div className="workspace-shell"><header className="app-header"><Link className="brand" href="/"><span className="brand-mark">PF</span><span>PocketFrame <small>AI TRAILER STUDIO</small></span></Link><div className="header-project"><strong>{project.title}</strong><span className="status-badge status-neutral">{displayProjectStatus(project.status)}</span></div></header><main className="workspace-content"><WorkspaceTabs initialTab={initialTab} overview={<ProjectWorkspaceOverview title={project.title} genre={project.genre} language={project.languageCode} trailerDuration={duration} progress={overallProgress(milestones)} stage={displayProjectStatus(project.status)} action={nextRecommendedAction(ux)} pipeline={productionPipeline(ux)} roles={productionTeam(ux)} activity={activityTimeline(ux)} />} stages={[{ name: "Story", ready: storyReady, content: story }, { name: "Voice", ready: storyReady, blockedMessage: "Complete Story Planning first. Voice direction depends on the approved production plan.", content: <VoiceSceneCards scenes={scenes} audioVersions={audioVersions} voiceBible={project.voiceBible} /> }, { name: "Shots", ready: voiceReady, blockedMessage: "Approve narration for every scene first. Silent shots are timed to approved narration.", content: <ShotSceneCards scenes={scenes} versions={versions} /> }, { name: "Final Cut", ready: readiness.ready, blockedMessage: "Approve one shot for every scene first. Final assembly only uses approved media.", content: <FinalCutPanel projectId={project.id} title={project.title} scenes={scenes} ready={readiness.ready} render={render} /> }]} /></main></div>;
}
