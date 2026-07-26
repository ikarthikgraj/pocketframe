"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProjectReference } from "@/lib/db/repositories";

export function SceneReferenceSelector({
  sceneId,
  projectId,
  references,
  selectedReferenceIds,
  disabled,
  onError,
}: {
  sceneId: string;
  projectId: string;
  references: ProjectReference[];
  selectedReferenceIds: string[];
  disabled?: boolean;
  onError?: (message: string) => void;
}) {
  const [selected, setSelected] = useState(selectedReferenceIds);

  async function toggle(referenceId: string) {
    const next = selected.includes(referenceId) ? selected.filter((id) => id !== referenceId) : [...selected, referenceId];
    setSelected(next);
    const response = await fetch(`/api/scenes/${sceneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referenceIds: next }),
    });
    if (!response.ok) {
      setSelected(selected);
      const data = await response.json().catch(() => ({}));
      onError?.(data.error?.message ?? "Could not update scene references.");
    }
  }

  return (
    <fieldset className="scene-reference-selector" disabled={disabled}>
      <legend>Visual References</legend>
      {references.length ? (
        <div className="scene-reference-squares">
          {references.map((reference) => {
            const isChecked = selected.includes(reference.id);
            return (
              <label key={reference.id} className={`reference-square-card ${isChecked ? "selected" : ""}`} title={reference.displayName}>
                <input type="checkbox" checked={isChecked} onChange={() => void toggle(reference.id)} className="visually-hidden" />
                <div className="square-img-wrap">
                  <Image unoptimized width={54} height={54} src={`/api/projects/${projectId}/references?referenceId=${reference.id}`} alt={reference.displayName} />
                  {isChecked && <span className="square-check-badge">✓</span>}
                </div>
              </label>
            );
          })}
        </div>
      ) : (
        <p className="no-refs-text">No project references added.</p>
      )}
    </fieldset>
  );
}
