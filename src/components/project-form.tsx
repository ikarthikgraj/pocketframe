"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
export function ProjectForm() {
  const router = useRouter(); const [error, setError] = useState<string>(); const [submitting, setSubmitting] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(undefined); setSubmitting(true);
    const response = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    const data = await response.json(); setSubmitting(false);
    if (!response.ok) return setError(data.error?.message ?? "Could not create project.");
    router.push(`/projects/${data.project.id}`);
  }
  return <form className="form" onSubmit={submit}><label>Show title<input name="title" required maxLength={160} /></label><label>Exact synopsis<textarea name="synopsis" required rows={7} /></label><label>Genre<input name="genre" required maxLength={100} placeholder="Romantic thriller" /></label><label>Language<input name="languageCode" required defaultValue="en-IN" maxLength={35} /></label>{error && <p className="error" role="alert">{error}</p>}<button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create Project"}</button></form>;
}
