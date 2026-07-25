import { GlobalHeader } from "@/components/global-header";
import { EmptyProjectsState, ProjectCard, ProjectsHeader } from "@/components/project-directory";
import { repositories } from "@/lib/db";

export default function ProjectsPage() {
  const projects = repositories().listProjects();
  return <main className="public-page projects-page"><GlobalHeader current="projects" /><section className="projects-content"><ProjectsHeader /><div className="project-filters" aria-label="Project filters"><button type="button" className="selected">All</button><button type="button" disabled>In Progress</button><button type="button" disabled>Ready to Render</button><button type="button" disabled>Complete</button></div>{projects.length ? <div className="project-list">{projects.map((project) => <ProjectCard project={project} key={project.id} />)}</div> : <EmptyProjectsState />}</section></main>;
}
