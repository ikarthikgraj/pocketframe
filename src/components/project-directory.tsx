"use client";

import Link from "next/link";
import { useState } from "react";
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
  return (
    <div className="projects-simple-header">
      <div>
        <h1>My Projects</h1>
        <p>Manage active trailer productions and open workspace.</p>
      </div>
      <Link className="button" href="/projects/new">
        + Create New Trailer
      </Link>
    </div>
  );
}

export function ProjectCard({ project, onDelete }: { project: ProjectListItem; onDelete?: (id: string) => void }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const calculateProgress = () => {
    if (project.status === "COMPLETE") return 100;
    if (project.status === "READY_TO_RENDER" || project.status === "RENDERING") return 60;
    if (project.status === "FAILED") return 35;
    if (project.status === "SHOT_GENERATION" || project.status === "SHOT_REVIEW") return 50;
    if (project.status === "VOICE_REVIEW") return 35;
    if (project.status === "DRAFT" || project.status === "ANALYZING" || project.status === "BIBLE_READY") return 20;
    if (project.totalScenes > 0) {
      return Math.min(60, Math.max(15, Math.round((project.approvedScenes / project.totalScenes) * 60)));
    }
    return 15;
  };

  const progress = calculateProgress();

  const openDeleteModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMsg(null);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (res.ok) {
        setShowConfirmModal(false);
        onDelete?.(project.id);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error?.message || "Failed to delete project. Please try again.");
        setIsDeleting(false);
      }
    } catch {
      setErrorMsg("Error deleting project. Please check network connection.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <article className="project-card-simple">
        <div className="project-card-top-row">
          <h2>{project.title}</h2>
          <span className={`status-badge status-${project.status.toLowerCase().replaceAll("_", "-")}`}>
            {statusLabel(project.status)}
          </span>
        </div>

        <p className="project-meta-line">
          {project.genre} · {project.languageCode} · {project.totalScenes} {project.totalScenes === 1 ? "Scene" : "Scenes"}
        </p>

        <div className="project-progress-mini">
          <div className="progress-bar-bg">
            <i className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="project-card-bottom-row">
          <span className="updated-date">Updated {formatUpdated(project.updatedAt)}</span>
          <div className="card-btn-group">
            <Link className="button card-open-btn" href={`/projects/${project.id}`}>
              Open Project →
            </Link>
            <button
              type="button"
              className="delete-project-icon-btn"
              onClick={openDeleteModal}
              title={`Delete ${project.title}`}
              aria-label={`Delete ${project.title}`}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      </article>

      {showConfirmModal && (
        <div className="modal-backdrop" onClick={() => !isDeleting && setShowConfirmModal(false)}>
          <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby={`delete-title-${project.id}`}>
            <div className="confirm-modal-header">
              <div className="confirm-modal-icon-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </div>
              <div>
                <h3 id={`delete-title-${project.id}`}>Delete Project</h3>
                <p className="confirm-modal-subtitle">This action cannot be undone.</p>
              </div>
            </div>

            <div className="confirm-modal-body">
              <p>
                Are you sure you want to delete <strong>{project.title}</strong>? All scenes, narration, and visual versions will be permanently removed.
              </p>
              {errorMsg && <p className="error confirm-modal-error">{errorMsg}</p>}
            </div>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setShowConfirmModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button-danger-solid"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function EmptyProjectsState() {
  return (
    <section className="empty-projects-card">
      <span className="empty-icon" aria-hidden="true">✦</span>
      <h2>No Active Projects</h2>
      <p>Create your first trailer production from a raw synopsis.</p>
      <Link className="button primary-glow" href="/projects/new">
        + Create New Trailer
      </Link>
    </section>
  );
}
