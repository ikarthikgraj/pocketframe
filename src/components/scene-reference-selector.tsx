"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProjectReference } from "@/lib/db/repositories";

export function SceneReferenceSelector({ sceneId, projectId, references, selectedReferenceIds, disabled, onError }: { sceneId: string; projectId: string; references: ProjectReference[]; selectedReferenceIds: string[]; disabled?: boolean; onError?: (message: string) => void }) {
  const [selected, setSelected] = useState(selectedReferenceIds);
  async function toggle(referenceId: string) {
    const next = selected.includes(referenceId) ? selected.filter((id) => id !== referenceId) : [...selected, referenceId];
    setSelected(next); const response = await fetch(`/api/scenes/${sceneId}/references`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ referenceIds: next }) });
    if (!response.ok) { setSelected(selected); const data = await response.json().catch(() => ({})); onError?.(data.error?.message ?? "Could not update scene references."); }
  }
  return <fieldset className="scene-reference-selector" disabled={disabled}><legend>References for this scene</legend><small>Only selected references will be sent with this scene.</small>{references.length ? <div className="scene-reference-chips">{references.map((reference) => <label key={reference.id} className={selected.includes(reference.id) ? "selected" : ""}><input type="checkbox" checked={selected.includes(reference.id)} onChange={() => void toggle(reference.id)} /><Image unoptimized width={22} height={22} src={`/api/projects/${projectId}/references/${reference.id}/image`} alt="" /><span>{reference.displayName}</span></label>)}</div> : <p>No project references added. This scene will generate without visual references.</p>}</fieldset>;
}
