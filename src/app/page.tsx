import Link from "next/link";
import { repositories } from "@/lib/db";

export default function Home() {
  const projects = repositories().listProjects();

  return (
    <main className="landing-page page">
      {/* Header */}
      <header className="landing-header fade-in">
        <Link className="brand" href="/">
          <span className="brand-mark">PF</span>
          <span>
            PocketFrame <small>AI TRAILER STUDIO</small>
          </span>
        </Link>
        <a className="button secondary" href="#projects">
          My Projects ({projects.length})
        </a>
      </header>

      {/* Hero Banner */}
      <section className="hero-banner fade-in">
        <div className="hero-content">
          <span className="hero-badge">⚡ Instant AI Video Trailer Pipeline</span>
          <h1>Turn Audio Series Synopses into Cinematic 30–40s Trailers</h1>
          <p>
            An end-to-end studio workflow: convert raw show synopses into production bibles, single-file voice narrations, and AI video clips using Sora, Kling, & Seedance.
          </p>
          <div className="hero-actions">
            <Link className="button large primary-glow" href="/projects/new">
              Start New Project →
            </Link>
          </div>
        </div>

        {/* 4-Step How It Works Infographic */}
        <div className="how-it-works-grid">
          <div className="step-card">
            <span className="step-num">01</span>
            <h3>Story Planning</h3>
            <p>Paste synopsis & auto-generate 4 grounded scene beats.</p>
          </div>
          <div className="step-card">
            <span className="step-num">02</span>
            <h3>Voice Narration</h3>
            <p>Review combined script & generate one unified MP3 narration.</p>
          </div>
          <div className="step-card">
            <span className="step-num">03</span>
            <h3>Visual Clips</h3>
            <p>AI Studio: auto prompts, reference image upload, models (Sora, Kling, Seedance).</p>
          </div>
          <div className="step-card">
            <span className="step-num">04</span>
            <h3>Final Cut</h3>
            <p>Stitch 1080x1920 MP4 trailer with subtitles & music.</p>
          </div>
        </div>
      </section>

      {/* Projects List */}
      <section id="projects" className="project-index fade-in-delay">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Studio Workspace</p>
            <h2>My Projects</h2>
          </div>
          <span className="project-count">{projects.length} project{projects.length === 1 ? "" : "s"}</span>
        </div>

        {projects.length === 0 ? (
          <div className="empty-projects-card">
            <div className="empty-icon">🎬</div>
            <h3>No projects yet</h3>
            <p>Get started by creating your first AI trailer project from a show synopsis.</p>
            <Link className="button primary-glow" href="/projects/new">
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <div className="project-card" key={project.id}>
                <div className="project-card-header">
                  <strong>{project.title}</strong>
                  <span className={`status-badge status-${project.status.toLowerCase().replace(/_/g, "-")}`}>
                    {project.status.split("_").join(" ")}
                  </span>
                </div>
                <div className="project-card-body">
                  <p>
                    {project.approvedScenes} of {project.totalScenes} visual clips approved
                  </p>
                </div>
                <div className="project-card-footer">
                  <Link className="secondary-link" href={`/projects/${project.id}`}>
                    Open Studio Workspace →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
