import Link from "next/link";
import { notFound } from "next/navigation";
import { repositories } from "@/lib/db";
import { WorkspaceStepper } from "@/components/workspace-stepper";
import { StoryPlanningSetup } from "@/components/story-planning-setup";
import { VoiceSceneCards } from "@/components/voice-scene-cards";
import { ShotSceneCards } from "@/components/shot-scene-cards";
import { FinalCutPanel } from "@/components/final-cut-panel";
export default async function ProjectWorkspace({ params }: { params: Promise<{ projectId: string }> }) {
  const project = repositories().getProject((await params).projectId); if (!project) notFound();
  const scenes = repositories().listScenes(project.id);
  const voiceActive = project.status === "VOICE_REVIEW" || project.status === "SHOT_GENERATION";
  const shotsActive = ["SHOT_GENERATION", "SHOT_REVIEW", "READY_TO_RENDER"].includes(project.status);
  const audioVersions = Object.fromEntries(scenes.map((scene) => [scene.id, repositories().listAudioVersions(scene.id)]));
  const versions = Object.fromEntries(scenes.map((scene) => [scene.id, repositories().listSceneVersions(scene.id)])); const readiness = repositories().getRenderReadiness(project.id); const render = repositories().getLatestRenderVersion(project.id);
  return <main className="page"><header><div><Link href="/">← Projects</Link><h1>{project.title}</h1><p>Status: {project.status}</p></div></header><WorkspaceStepper current={project.status === "COMPLETE" || project.status === "RENDERING" || project.status === "READY_TO_RENDER" ? "Export" : shotsActive ? "Shots" : voiceActive ? "Voice" : "Setup"} /><section><h2>Setup</h2><h3>Original synopsis</h3><p className="synopsis">{project.synopsis}</p><dl><dt>Genre</dt><dd>{project.genre}</dd><dt>Language</dt><dd>{project.languageCode}</dd></dl></section><StoryPlanningSetup projectId={project.id} productionBible={project.productionBible} scenes={scenes} status={project.status} />{voiceActive && <VoiceSceneCards scenes={scenes} audioVersions={audioVersions} />}{shotsActive && <ShotSceneCards scenes={scenes} versions={versions} />}<FinalCutPanel projectId={project.id} title={project.title} scenes={scenes} ready={readiness.ready} render={render} /><footer className="workspace-footer">Current step: {project.status === "COMPLETE" || project.status === "RENDERING" || project.status === "READY_TO_RENDER" ? "Export" : shotsActive ? "Shots" : voiceActive ? "Voice" : "Setup"}.</footer></main>;
}
