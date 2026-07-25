"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

export function ProjectCardActions({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const [menuOpen, setMenuOpen] = useState(false); const [confirming, setConfirming] = useState(false); const [working, setWorking] = useState(false); const [error, setError] = useState<string>(); const router = useRouter();
  async function remove() { setWorking(true); setError(undefined); const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" }); const data = await response.json().catch(() => ({})); setWorking(false); if (!response.ok) return setError(data.error?.message ?? "Could not delete this project."); setConfirming(false); router.refresh(); }
  return <div className="project-card-actions"><Link className="button open-project" href={`/projects/${projectId}`}>Open Project</Link><div className="project-more-menu"><button type="button" className="secondary" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>More</button>{menuOpen && <div role="menu" className="project-more-popover"><button type="button" role="menuitem" className="danger-link" onClick={() => { setMenuOpen(false); setConfirming(true); }}>Delete Project</button></div>}</div>{error && <p className="error" role="alert">{error}</p>}<ConfirmationDialog open={confirming} title="Delete project?" message="This permanently removes the project and its local media files." confirmLabel={working ? "Deleting…" : "Delete Project"} danger onCancel={() => !working && setConfirming(false)} onConfirm={() => void remove()}><p><strong>{projectTitle}</strong></p></ConfirmationDialog></div>;
}
