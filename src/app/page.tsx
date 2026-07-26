import Link from "next/link";
import { GlobalHeader } from "@/components/global-header";
import { TrailerStudioHeroVisual } from "@/components/trailer-studio-hero-visual";
import { GuidedWorkflowShowcase } from "@/components/guided-workflow-showcase";

export default function Home() {
  return (
    <main className="public-page landing-page">
      <GlobalHeader current="landing" />
      <section className="landing-hero">
        <div className="hero-copy">
          <div className="hero-pill-badge">
            <span className="pulse-dot" /> AI TRAILER PRODUCTION PLATFORM
          </div>
          <h1>
            Turn a synopsis into a <span className="text-gradient">cinematic trailer.</span>
          </h1>
          <p>
            Plan the story, generate narration, review visual shots, and export a finished vertical trailer from one guided workspace.
          </p>
          <div className="hero-actions">
            <Link className="button button-hero primary-glow" href="/projects/new">
              Create New Trailer <span className="arrow-icon">→</span>
            </Link>
            <Link className="button button-hero secondary-glow" href="/projects">
              <span className="btn-icon">📁</span> My Projects
            </Link>
          </div>
          <div className="hero-trust-row">
            <span><i className="trust-icon">✦</i> 9:16 Vertical Native</span>
            <span><i className="trust-icon">✦</i> AI Voice Direction</span>
            <span><i className="trust-icon">✦</i> Human-in-the-Loop</span>
          </div>
        </div>
        <TrailerStudioHeroVisual />
      </section>

      <GuidedWorkflowShowcase />
    </main>
  );
}

