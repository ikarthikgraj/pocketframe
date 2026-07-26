import Link from "next/link";
import { StageStatus } from "@/components/production-experience";
import type { ProductionStatus } from "@/lib/production-ux";

export function ProjectWorkspaceHeader({ title, genre, language, stage }: { title: string; genre: string; language: string; stage: string }) {
  return (
    <div className="workspace-title-header">
      <Link className="back-link" href="/projects">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to My Projects
      </Link>
      <div className="workspace-title-row">
        <div className="title-with-meta">
          <h1>{title}</h1>
          <div className="title-tags">
            <span className="genre-tag">{genre}</span>
            <span className="lang-tag">{language}</span>
          </div>
        </div>
        <StageStatus status={stage as ProductionStatus} />
      </div>
    </div>
  );
}
