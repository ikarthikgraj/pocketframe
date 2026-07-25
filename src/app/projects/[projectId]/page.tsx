import Link from "next/link";
import { notFound } from "next/navigation";
import { repositories } from "@/lib/db";
import { WorkspaceStepper } from "@/components/workspace-stepper";
export default async function ProjectWorkspace({ params }: { params: Promise<{ projectId: string }> }) {
  const project = repositories().getProject((await params).projectId); if (!project) notFound();
  return <main className="page"><header><div><Link href="/">← Projects</Link><h1>{project.title}</h1><p>Status: {project.status}</p></div></header><WorkspaceStepper /><section><h2>Setup</h2><h3>Original synopsis</h3><p className="synopsis">{project.synopsis}</p><dl><dt>Genre</dt><dd>{project.genre}</dd><dt>Language</dt><dd>{project.languageCode}</dd></dl><p>Project creation is complete. Analysis, voice, shots, and export are introduced in later phases.</p></section><footer className="workspace-footer">Current step: Setup · Next action: analyze synopsis (not available in Phase 1).</footer></main>;
}
