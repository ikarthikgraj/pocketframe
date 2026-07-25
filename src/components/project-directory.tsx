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
  return <article className="project-list-card"><div className="project-card-main"><div><div className="project-card-title"><h2>{project.title}</h2><span className={`status-badge status-${project.status.toLowerCase().replaceAll("_", "-")}`}>{statusLabel(project.status)}</span></div><p>{project.genre} · {project.languageCode}</p></div><div className="project-card-meta"><span>{project.totalScenes} scenes</span><span>Updated {formatUpdated(project.updatedAt)}</span></div></div><div className="project-card-progress"><div><span>Production progress</span><strong>{progress}%</strong></div><span><i style={{ width: `${progress}%` }} /></span></div><Link className="button secondary open-project" href={`/projects/${project.id}`}>Open</Link></article>;
}

export function EmptyProjectsState() {
  return <section className="empty-projects-card"><span className="empty-icon" aria-hidden="true">✦</span><h2>No projects yet</h2><p>Create your first trailer production from a synopsis.</p><Link className="button" href="/projects/new">Create New Trailer</Link></section>;
}
