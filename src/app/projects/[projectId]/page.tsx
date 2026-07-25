import Link from "next/link";
import { notFound } from "next/navigation";
import { repositories } from "@/lib/db";
import { WorkspaceStepper } from "@/components/workspace-stepper";
import { StoryPlanningSetup } from "@/components/story-planning-setup";
import { VoiceSceneCards } from "@/components/voice-scene-cards";
import { ShotSceneCards } from "@/components/shot-scene-cards";
export default async function ProjectWorkspace({ params }: { params: Promise<{ projectId: string }> }) {
  const project = repositories().getProject((await params).projectId); if (!project) notFound();
  const scenes = repositories().listScenes(project.id);
  const voiceActive = project.status === "VOICE_REVIEW" || project.status === "SHOT_GENERATION";
  const shotsActive = ["SHOT_GENERATION", "SHOT_REVIEW", "READY_TO_RENDER"].includes(project.status);
  const audioVersions = Object.fromEntries(scenes.map((scene) => [scene.id, repositories().listAudioVersions(scene.id)]));
  const versions = Object.fromEntries(scenes.map((scene) => [scene.id, repositories().listSceneVersions(scene.id)])); const allApproved = scenes.length > 0 && scenes.every((scene) => scene.approvedVersionId && versions[scene.id].filter((version) => version.status === "APPROVED").length === 1);
  return <main className="page"><header><div><Link href="/">← Projects</Link><h1>{project.title}</h1><p>Status: {project.status}</p></div></header><WorkspaceStepper current={shotsActive ? "Shots" : voiceActive ? "Voice" : "Setup"} /><section><h2>Setup</h2><h3>Original synopsis</h3><p className="synopsis">{project.synopsis}</p><dl><dt>Genre</dt><dd>{project.genre}</dd><dt>Language</dt><dd>{project.languageCode}</dd></dl></section><StoryPlanningSetup projectId={project.id} productionBible={project.productionBible} scenes={scenes} status={project.status} />{voiceActive && <VoiceSceneCards scenes={scenes} audioVersions={audioVersions} />}{shotsActive && <ShotSceneCards scenes={scenes} versions={versions} />}<section className="export-gate"><h2>Export</h2><p>{allApproved ? "All scenes have one approved video version. Stitching is implemented in the next phase." : "Final Render is disabled until every scene has exactly one approved video version."}</p><button disabled>Final Render</button></section><footer className="workspace-footer">Current step: {shotsActive ? "Shots" : voiceActive ? "Voice" : "Setup"} · Next action: {shotsActive ? "review and approve one video version per scene" : project.status === "BIBLE_READY" ? "approve Production Bible" : voiceActive ? "generate and approve every scene voice" : "generate Production Bible"}.</footer></main>;
}
