import { GlobalHeader } from "@/components/global-header";
import { LocalPreferencesPage } from "@/components/local-preferences-page";
export default function ProfilePage() { return <main className="public-page"><GlobalHeader /><div className="preferences-page"><LocalPreferencesPage mode="profile" /></div></main>; }
