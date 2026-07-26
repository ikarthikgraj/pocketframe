"use client";

import { useMemo, useState } from "react";
import type { ProjectListItem } from "@/lib/db/repositories";
import { ProjectCard } from "@/components/project-directory";

type Filter = "All" | "In Progress" | "Ready to Render" | "Complete";
const filters: Filter[] = ["All", "In Progress", "Ready to Render", "Complete"];
const matches = (project: ProjectListItem, filter: Filter) => filter === "All" || (filter === "In Progress" ? !["READY_TO_RENDER", "COMPLETE"].includes(project.status) : filter === "Ready to Render" ? project.status === "READY_TO_RENDER" : project.status === "COMPLETE");

export function ProjectFilterTabs({ projects: initialProjects }: { projects: ProjectListItem[] }) {
  const [projectsList, setProjectsList] = useState<ProjectListItem[]>(initialProjects);
  const [active, setActive] = useState<Filter>("All");

  const handleDelete = (deletedId: string) => {
    setProjectsList((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const visible = useMemo(() => projectsList.filter((project) => matches(project, active)), [projectsList, active]);
  const emptyCopy: Record<Exclude<Filter, "All">, [string, string]> = {
    "In Progress": ["No projects in progress.", "Start a trailer or continue a saved production."],
    "Ready to Render": ["No projects ready to render.", "Approved narration and shots will appear here."],
    Complete: ["No completed projects yet.", "Completed trailers will appear here after export."],
  };
  return <><nav className="project-filter-tabs" aria-label="Project filters">{filters.map((filter) => <button key={filter} type="button" onClick={() => setActive(filter)} className={active === filter ? "is-active" : ""} aria-pressed={active === filter}>{filter} <span>{projectsList.filter((project) => matches(project, filter)).length}</span></button>)}</nav>{visible.length ? <div className="project-card-grid">{visible.map((project) => <ProjectCard project={project} key={project.id} onDelete={handleDelete} />)}</div> : <section className="filter-empty-state"><h2>{emptyCopy[active as Exclude<Filter, "All">]?.[0] ?? "No projects yet."}</h2><p>{emptyCopy[active as Exclude<Filter, "All">]?.[1] ?? "Create your first trailer production from a synopsis."}</p></section>}</>;
}

