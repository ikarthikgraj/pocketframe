import { ProjectForm } from "@/components/project-form";
import { GlobalHeader } from "@/components/global-header";
export default function NewProjectPage() { return <main className="public-page creation-page"><GlobalHeader current="new" /><section className="creation-intro"><p className="eyebrow">New production</p><h1>Create New Trailer</h1><p>Start with the show title and synopsis. PocketFrame will guide the production step by step.</p></section><section className="creation-card"><ProjectForm /></section></main>; }
