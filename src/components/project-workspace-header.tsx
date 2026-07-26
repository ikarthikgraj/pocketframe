"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StageStatus } from "@/components/production-experience";
import type { ProductionStatus } from "@/lib/production-ux";

export function ProjectWorkspaceHeader({
  projectId,
  title: initialTitle,
  genre,
  language,
  stage,
}: {
  projectId: string;
  title: string;
  genre: string;
  language: string;
  stage: string;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error?.message || "Failed to update project title.");
      }
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update project title.");
    } finally {
      setSaving(false);
    }
  }

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
          {isEditing ? (
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px" }}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--brand, #e53935)",
                  background: "#ffffff",
                  color: "#1f1d1b",
                  minWidth: "240px",
                }}
                disabled={saving}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSave();
                  if (e.key === "Escape") {
                    setTitle(initialTitle);
                    setIsEditing(false);
                  }
                }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !title.trim()}
                style={{ padding: "4px 12px", minHeight: "32px", fontSize: "12px", fontWeight: "700" }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setTitle(initialTitle);
                  setIsEditing(false);
                }}
                disabled={saving}
                style={{ padding: "4px 10px", minHeight: "32px", fontSize: "12px" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <h1 style={{ margin: 0 }}>{title}</h1>
              <button
                type="button"
                className="secondary"
                onClick={() => setIsEditing(true)}
                title="Edit project title"
                aria-label="Edit project title"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px 8px",
                  minHeight: "28px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  color: "var(--text-secondary)",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Title
              </button>
            </div>
          )}
          {error && <small className="error" style={{ display: "block", marginTop: 4 }}>{error}</small>}
          <div className="title-tags" style={{ marginTop: "4px" }}>
            <span className="genre-tag">{genre}</span>
            <span className="lang-tag">{language}</span>
          </div>
        </div>
        <StageStatus status={stage as ProductionStatus} />
      </div>
    </div>
  );
}
