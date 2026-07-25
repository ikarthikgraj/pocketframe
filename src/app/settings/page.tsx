import { GlobalHeader } from "@/components/global-header";
import { LocalPreferencesPage } from "@/components/local-preferences-page";
export default function SettingsPage() { return <main className="public-page"><GlobalHeader /><div className="preferences-page"><LocalPreferencesPage mode="settings" /></div></main>; }
