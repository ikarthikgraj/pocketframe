import Link from "next/link";

type GlobalHeaderProps = {
  current?: "landing" | "projects" | "new";
};

export function GlobalHeader({ current }: GlobalHeaderProps) {
  return (
    <header className="global-header">
      <Link className="brand" href="/" aria-label="PocketFrame home">
        <span className="brand-mark">PF</span>
        <span>PocketFrame <small>AI TRAILER STUDIO</small></span>
      </Link>
      <nav className="global-nav" aria-label="Main navigation">
        {current !== "landing" && <Link className="nav-link" href="/">Landing</Link>}
        {current !== "projects" && <Link className="nav-link" href="/projects">My Projects</Link>}
        {current !== "new" && <Link className="button header-action" href="/projects/new">New Trailer</Link>}
      </nav>
    </header>
  );
}
