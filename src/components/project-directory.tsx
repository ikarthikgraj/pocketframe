import Link from "next/link";
import type { ProjectListItem } from "@/lib/db/repositories";

const statusCopy: Record<string, string> = {
  DRAFT: "Story in progress",
  ANALYZING: "Story in progress",
  BIBLE_READY: "Story review",
  VOICE_REVIEW: "Voice review",
  SHOT_GENERATION: "Shots in progress",
  SHOT_REVIEW: "Shots in progress",
  READY_TO_RENDER: "Ready to render",
  RENDERING: "Final Cut in progress",
  COMPLETE: "Trailer complete",
  FAILED: "Needs attention",
};

function formatUpdated(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function statusLabel(status: string) {
  return statusCopy[status] ?? status.replaceAll("_", " ");
}

export function ProjectsHeader() {
  return <div className="projects-heading"><div><p className="eyebrow">Trailer productions</p><h1>My Projects</h1><p>Manage trailer productions and continue where you left off.</p></div><Link className="button" href="/projects/new">Create New Trailer</Link></div>;
}

export function ProjectCard({ project }: { project: ProjectListItem }) {
  const progress = project.totalScenes ? Math.round((project.approvedScenes / project.totalScenes) * 100) : 0;
  const readiness = project.status === "COMPLETE" ? "Complete" : project.status === "READY_TO_RENDER" ? "Ready to render" : "In progress";
  return <article className="project-card"><div className="project-card-title"><h2>{project.title}</h2><span className={`status-badge status-${project.status.toLowerCase().replaceAll("_", "-")}`}>{statusLabel(project.status)}</span></div><p className="project-card-genre">{project.genre} · {project.languageCode}</p><dl className="project-card-details"><div><dt>Stage</dt><dd>{statusLabel(project.status)}</dd></div><div><dt>Readiness</dt><dd>{readiness}</dd></div><div><dt>Scenes</dt><dd>{project.totalScenes}</dd></div><div><dt>Updated</dt><dd>{formatUpdated(project.updatedAt)}</dd></div></dl><div className="project-card-progress"><div><span>Progress</span><strong>{progress}%</strong></div><span><i style={{ width: `${progress}%` }} /></span></div><Link className="button open-project" href={`/projects/${project.id}`}>Open Project</Link></article>;
}

export function EmptyProjectsState() {
  return <section className="empty-projects-card"><span className="empty-icon" aria-hidden="true">✦</span><h2>No projects yet</h2><p>Create your first trailer production from a synopsis.</p><Link className="button" href="/projects/new">Create New Trailer</Link></section>;
}
