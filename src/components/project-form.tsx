"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
export const GENRES = ["Romance", "Thriller", "Mystery", "Horror", "Fantasy", "Drama", "Action", "Crime", "Sci-Fi", "Historical", "Family Drama", "Comedy", "Supernatural", "Other"] as const;
export const LANGUAGES = ["English", "Hindi", "Hinglish", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Punjabi", "Gujarati", "Urdu", "Other"] as const;
const languageCodes: Record<string, string> = { English: "en-IN", Hindi: "hi-IN", Hinglish: "en-IN", Tamil: "ta-IN", Telugu: "te-IN", Kannada: "kn-IN", Malayalam: "ml-IN", Bengali: "bn-IN", Marathi: "mr-IN", Punjabi: "pa-IN", Gujarati: "gu-IN", Urdu: "ur-IN" };
export function ProjectForm() {
  const router = useRouter(); const [error, setError] = useState<string>(); const [submitting, setSubmitting] = useState(false); const [genre, setGenre] = useState<string>("Thriller"); const [language, setLanguage] = useState<string>("English"); const [characters, setCharacters] = useState(0); const [duration, setDuration] = useState("30–40 sec"); const [references, setReferences] = useState<File[]>([]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(undefined); setSubmitting(true);
    const form = new FormData(event.currentTarget); const genreValue = genre === "Other" ? String(form.get("customGenre") ?? "").trim() : genre; const languageValue = language === "Other" ? String(form.get("customLanguage") ?? "").trim() : languageCodes[language];
    const response = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.get("title"), synopsis: form.get("synopsis"), genre: genreValue, languageCode: languageValue || String(form.get("customLanguage") ?? "").trim() }) });
    const data = await response.json(); setSubmitting(false);
    if (!response.ok) return setError(data.error?.message ?? "Could not create project.");
    const uploadFailures: string[] = [];
    for (const file of references) {
      const reference = new FormData(); reference.set("file", file); reference.set("displayName", file.name.replace(/\.[^.]+$/, "")); reference.set("type", "Style"); reference.set("description", "");
      const upload = await fetch(`/api/projects/${data.project.id}/references`, { method: "POST", body: reference });
      if (!upload.ok) uploadFailures.push(file.name);
    }
    if (uploadFailures.length) return setError(`Project created, but ${uploadFailures.join(", ")} could not upload. You can add it in Story.`);
    router.push(`/projects/${data.project.id}`);
  }
  return <form className="form" onSubmit={submit}><label>Show title<input name="title" required maxLength={160} placeholder="The show title" /></label><label className="synopsis-field">Synopsis<textarea name="synopsis" required rows={9} onChange={(event) => setCharacters(event.target.value.length)} placeholder="Paste the existing show synopsis exactly as published." /><small>{characters.toLocaleString()} characters</small></label><div className="form-grid"><label>Genre<select aria-label="Genre" value={genre} onChange={(event) => setGenre(event.target.value)}>{GENRES.map((item) => <option key={item}>{item}</option>)}</select>{genre === "Other" && <input name="customGenre" required maxLength={100} placeholder="Custom genre" />}</label><label>Language<select aria-label="Language" value={language} onChange={(event) => setLanguage(event.target.value)}>{LANGUAGES.map((item) => <option key={item}>{item}</option>)}</select>{language === "Other" && <input name="customLanguage" required maxLength={35} placeholder="Custom language" />}</label></div><fieldset className="new-project-duration"><legend>Trailer duration</legend><div>{["30–40 sec", "45–60 sec"].map((option) => <button type="button" key={option} className={duration === option ? "selected" : "secondary"} onClick={() => setDuration(option)} aria-pressed={duration === option}>{option}</button>)}</div><small>Production timing is finalised from approved narration.</small></fieldset><label className="new-project-references">Optional visual references <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple onChange={(event) => setReferences(Array.from(event.target.files ?? []).slice(0, 3))} /><small>{references.length ? `${references.length} of 3 references ready to upload` : "Add up to 3 images now, or upload later in Story."}</small></label>{error && <p className="error" role="alert">{error}</p>}<button type="submit" disabled={submitting}>{submitting ? "Creating…" : "Create New Trailer"}</button></form>;
}
