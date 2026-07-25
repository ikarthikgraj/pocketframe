import Link from "next/link";
import { notFound } from "next/navigation";
import { repositories } from "@/lib/db";
import { WorkspaceStepper } from "@/components/workspace-stepper";
import { StoryPlanningSetup } from "@/components/story-planning-setup";
export default async function ProjectWorkspace({ params }: { params: Promise<{ projectId: string }> }) {
  const project = repositories().getProject((await params).projectId); if (!project) notFound();
  const scenes = repositories().listScenes(project.id);
  return <main className="page"><header><div><Link href="/">← Projects</Link><h1>{project.title}</h1><p>Status: {project.status}</p></div></header><WorkspaceStepper /><section><h2>Setup</h2><h3>Original synopsis</h3><p className="synopsis">{project.synopsis}</p><dl><dt>Genre</dt><dd>{project.genre}</dd><dt>Language</dt><dd>{project.languageCode}</dd></dl></section><StoryPlanningSetup projectId={project.id} productionBible={project.productionBible} scenes={scenes} status={project.status} /><footer className="workspace-footer">Current step: Setup · Next action: {project.status === "BIBLE_READY" ? "approve Production Bible" : project.status === "VOICE_REVIEW" ? "voice review (Phase 3)" : "generate Production Bible"}.</footer></main>;
}
