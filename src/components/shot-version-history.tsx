"use client";

import type { SceneVersion } from "@/lib/db/repositories";
import { videoModelLabel } from "@/lib/video/models";

const status = (version: SceneVersion) => version.status === "READY" && version.approvedAt ? "Previously approved" : ({ QUEUED: "Pending", GENERATING: "Generating", READY: "Ready for review", APPROVED: "Approved", REJECTED: "Rejected", FAILED: "Failed" }[version.status]);
const stamp = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));

export function ShotVersionHistory({ versions, currentVersionId, previewVersionId, onPreview }: { versions: SceneVersion[]; currentVersionId?: string; previewVersionId?: string; onPreview: (id: string) => void }) {
  if (!versions.length) return null;
  return <section className="shot-version-history"><p className="field-label">Version history</p><p className="history-helper">Previous versions are view-only.</p>{versions.map((version) => <button type="button" key={version.id} className={`shot-history-row ${version.id === previewVersionId ? "is-previewing" : ""}`} onClick={() => onPreview(version.id)} aria-label={`Preview version ${version.versionNumber}`}><span><strong>v{version.versionNumber}{version.id === currentVersionId ? " · Current review" : ""}</strong><small>{status(version)} · {stamp(version.createdAt)}</small></span><span><small>{version.provider} · {videoModelLabel(version.model)}</small><small>{version.durationMs ? `${(version.durationMs / 1000).toFixed(1)} sec` : "Duration pending"}</small></span><span className="history-prompt">{version.prompt ?? "No prompt saved"}</span></button>)}</section>;
}
