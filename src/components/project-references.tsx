"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { ProjectReference } from "@/lib/db/repositories";
import type { ProjectReferenceType } from "@/lib/domain/contracts";

type FormValues = { displayName: string; type: ProjectReferenceType; description: string; file?: File };

export function ProjectReferences({ projectId, references }: { projectId: string; references: ProjectReference[] }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [replace, setReplace] = useState<ProjectReference>(); const [working, setWorking] = useState(false); const [error, setError] = useState<string>();
  async function submit(values: FormValues) {
    if (!values.file) return setError("Choose an image to continue.");
    setWorking(true); setError(undefined); const form = new FormData(); form.set("file", values.file); form.set("displayName", values.displayName); form.set("type", values.type); form.set("description", values.description); if (replace) form.set("replaceId", replace.id);
    const response = await fetch(`/api/projects/${projectId}/references`, { method: "POST", body: form }); const data = await response.json().catch(() => ({})); setWorking(false);
    if (!response.ok) return setError(data.error?.message ?? "Could not save this reference.");
    setOpen(false); setReplace(undefined); router.refresh();
  }
  async function remove(reference: ProjectReference) {
    setWorking(true); setError(undefined); const response = await fetch(`/api/projects/${projectId}/references?referenceId=${encodeURIComponent(reference.id)}`, { method: "DELETE" }); const data = await response.json().catch(() => ({})); setWorking(false);
    if (!response.ok) return setError(data.error?.message ?? "Could not remove this reference.");
    router.refresh();
  }
  return <section className="project-references-panel">
    <div className="section-heading"><div><p className="eyebrow">Visual References</p><h2>Visual References</h2><p>Add up to three reusable visual references. Choose which scenes use each reference.</p></div><div className="reference-heading-actions"><span className="reference-count">{references.length} of 3 added</span><button type="button" onClick={() => { setReplace(undefined); setOpen(true); }} disabled={working || references.length >= 3}>Add Reference</button></div></div>
    {error && <p className="error" role="alert">{error}</p>}
    {references.length ? <div className="reference-card-grid">{references.map((reference) => <ReferenceCard key={reference.id} projectId={projectId} reference={reference} disabled={working} onReplace={() => { setReplace(reference); setOpen(true); }} onRemove={() => void remove(reference)} />)}</div> : <p className="reference-empty">No references added. This project will continue without them unless you add one.</p>}
    {open && <ReferenceUploadForm reference={replace} working={working} onCancel={() => { setOpen(false); setReplace(undefined); }} onSubmit={submit} />}
  </section>;
}

export function ReferenceCard({ projectId, reference, disabled, onReplace, onRemove }: { projectId: string; reference: ProjectReference; disabled: boolean; onReplace: () => void; onRemove: () => void }) {
  return <article className="reference-card"><Image unoptimized width={62} height={62} src={`/api/projects/${projectId}/references/${reference.id}/image`} alt={reference.displayName} /><div className="reference-card-body"><strong>{reference.displayName}</strong><span>{reference.type}</span>{reference.description && <p>{reference.description}</p>}<div className="reference-card-actions"><button type="button" className="secondary" onClick={onReplace} disabled={disabled}>Replace</button><button type="button" className="danger" onClick={onRemove} disabled={disabled}>Remove</button></div></div></article>;
}

export function ReferenceUploadForm({ reference, working, onCancel, onSubmit }: { reference?: ProjectReference; working: boolean; onCancel: () => void; onSubmit: (values: FormValues) => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement>(null); const [displayName, setDisplayName] = useState(reference?.displayName ?? ""); const [type, setType] = useState<ProjectReferenceType>(reference?.type ?? "Character"); const [description, setDescription] = useState(reference?.description ?? ""); const [file, setFile] = useState<File>();
  return <form className="reference-upload-form" onSubmit={(event) => { event.preventDefault(); void onSubmit({ displayName, type, description, file }); }}><strong>{reference ? "Replace visual reference" : "Add visual reference"}</strong><div className="reference-form-grid"><label>Image<input ref={fileRef} required type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0])} /></label><label>Reference name<input required maxLength={120} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="e.g. Carter" /></label><label>Type<select value={type} onChange={(event) => setType(event.target.value as ProjectReferenceType)}><option>Character</option><option>Environment</option><option>Prop</option><option>Style</option></select></label><label>Description <small>(optional)</small><input maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short visual note" /></label></div><div className="actions"><button type="submit" disabled={working}>{working ? "Saving…" : reference ? "Replace reference" : "Add reference"}</button><button type="button" className="secondary" onClick={onCancel} disabled={working}>Cancel</button></div></form>;
}
