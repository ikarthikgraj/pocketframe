"use client";

import { useState } from "react";

type Preferences = { displayName: string; role: string; language: string; genre: string; videoModel: string; shotDuration: number; demoMode: boolean };
const defaults: Preferences = { displayName: "Demo User", role: "Creative Producer", language: "English", genre: "Thriller", videoModel: "Seedance 2.0 Fast", shotDuration: 8, demoMode: true };
const key = "pocketframe-demo-preferences";

export function LocalPreferencesPage({ mode }: { mode: "profile" | "settings" }) {
  const [values, setValues] = useState<Preferences>(() => { if (typeof window === "undefined") return defaults; try { return { ...defaults, ...JSON.parse(localStorage.getItem(key) ?? "{}") }; } catch { return defaults; } }); const [saved, setSaved] = useState(false);
  function update<K extends keyof Preferences>(name: K, value: Preferences[K]) { setValues((current) => ({ ...current, [name]: value })); setSaved(false); }
  function save() { localStorage.setItem(key, JSON.stringify(values)); setSaved(true); }
  const profile = mode === "profile";
  return <section className="local-preferences-card"><p className="eyebrow">Local demo profile</p><h1>{profile ? "Profile" : "Settings"}</h1><p>{profile ? "These local details are only used in this browser." : "Choose practical defaults for new trailer work."}</p><div className="form-grid">{profile ? <><label>Display name<input value={values.displayName} onChange={(event) => update("displayName", event.target.value)} /></label><label>Role<input value={values.role} onChange={(event) => update("role", event.target.value)} /></label></> : <><label>Default language<input value={values.language} onChange={(event) => update("language", event.target.value)} /></label><label>Default genre<input value={values.genre} onChange={(event) => update("genre", event.target.value)} /></label><label>Preferred video model<select value={values.videoModel} onChange={(event) => update("videoModel", event.target.value)}><option>Seedance 2.0 Fast</option><option>Kling V3 Pro</option><option>Veo 3.1</option></select></label><label>Default shot duration<select value={values.shotDuration} onChange={(event) => update("shotDuration", Number(event.target.value))}>{[4, 6, 8, 10, 12].map((value) => <option value={value} key={value}>{value} seconds</option>)}</select></label><label className="toggle-label"><input type="checkbox" checked={values.demoMode} onChange={(event) => update("demoMode", event.target.checked)} /> Enable demo mode</label></>}</div>{profile && <dl className="profile-summary"><div><dt>Preferred language</dt><dd>{values.language}</dd></div><div><dt>Preferred video model</dt><dd>{values.videoModel}</dd></div></dl>}<div className="actions"><button type="button" onClick={save}>Save local preferences</button>{saved && <span className="status-badge status-approved">Saved locally</span>}</div></section>;
}
