import Link from "next/link";
import { GlobalHeader } from "@/components/global-header";
import { TrailerStudioHeroVisual } from "@/components/trailer-studio-hero-visual";

export default function Home() {
  return (
    <main className="public-page landing-page"><GlobalHeader current="landing" /><section className="landing-hero"><div className="hero-copy"><p className="eyebrow">AI TRAILER PRODUCTION PLATFORM</p><h1>Turn a synopsis into a cinematic trailer.</h1><p>Plan the story, generate narration, review visual shots, and export a finished vertical trailer from one guided workspace.</p><div className="hero-actions"><Link className="button button-large" href="/projects/new">Create New Trailer</Link><Link className="button secondary button-large" href="/projects">My Projects</Link></div><small>Human review at every stage.</small></div><TrailerStudioHeroVisual /></section><section className="landing-steps" aria-label="Four production steps">{[["01", "Story", "Build a production-ready plan."], ["02", "Voice", "Generate exact synopsis narration."], ["03", "Shots", "Review silent visual versions."], ["04", "Final Cut", "Export the approved trailer."]].map(([number, title, text]) => <article key={title}><span>{number}</span><h2>{title}</h2><p>{text}</p></article>)}</section>
    </main>
  );
}
