import { GlobalHeader } from "@/components/global-header";
import { EmptyProjectsState, ProjectsHeader } from "@/components/project-directory";
import { ProjectFilterTabs } from "@/components/project-filter-tabs";
import { repositories } from "@/lib/db";

export default function ProjectsPage() {
  const projects = repositories().listProjects();
  return <main className="public-page projects-page"><GlobalHeader current="projects" /><section className="projects-content"><ProjectsHeader />{projects.length ? <ProjectFilterTabs projects={projects} /> : <EmptyProjectsState />}</section></main>;
}
