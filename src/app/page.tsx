import Link from "next/link";
import { repositories } from "@/lib/db";

export default function Home() {
  const projects = repositories().listProjects();
  return <main className="page"><header><h1>PocketFrame</h1><Link className="button" href="/projects/new">Create Project</Link></header><section><h2>Projects</h2>{projects.length === 0 ? <p>No projects yet. Create one to start the trailer workflow.</p> : <ul className="project-list">{projects.map((project) => <li key={project.id}><div><strong>{project.title}</strong><span>{project.status} · {project.approvedScenes}/{project.totalScenes} shots approved</span></div><Link href={`/projects/${project.id}`}>Open</Link></li>)}</ul>}</section></main>;
}
