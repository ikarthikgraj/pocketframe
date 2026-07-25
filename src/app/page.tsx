import Link from "next/link";
import { repositories } from "@/lib/db";

export default function Home() {
  const projects = repositories().listProjects();
  return <main className="landing page"><header className="landing-header"><Link className="brand" href="/"><span className="brand-mark">P</span><span>PocketFrame</span></Link><Link className="button" href="/projects/new">Create Project</Link></header><section className="project-index"><div><p className="eyebrow">AI Trailer Production Studio</p><h1>Bring stories to the screen.</h1><p>Manage every trailer from synopsis to final cut in one focused production workspace.</p></div><div className="section-heading"><h2>Projects</h2><span className="project-count">{projects.length} total</span></div>{projects.length === 0 ? <div className="empty-projects"><h3>Your studio is ready.</h3><p>Create a project to build a story plan, review narration, and approve every shot.</p><Link className="button" href="/projects/new">Create your first project</Link></div> : <ul className="project-list">{projects.map((project) => <li key={project.id}><div><strong>{project.title}</strong><span>{project.status.split("_").join(" ")} · {project.approvedScenes}/{project.totalScenes} shots approved</span></div><Link className="secondary-link" href={`/projects/${project.id}`}>Open project →</Link></li>)}</ul>}</section></main>;
}
