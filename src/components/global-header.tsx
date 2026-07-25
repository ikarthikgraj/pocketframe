import Link from "next/link";
import { UserMenu } from "@/components/user-menu";

type GlobalHeaderProps = {
  current?: "home" | "projects" | "new";
};

export function GlobalHeader({ current }: GlobalHeaderProps) {
  return (
    <header className="global-header" data-current={current}>
      <Link className="brand" href="/" aria-label="Go to PocketFrame home">
        <span className="brand-mark">PF</span>
        <span>PocketFrame <small>AI TRAILER STUDIO</small></span>
      </Link>
      <div className="global-nav"><UserMenu /></div>
    </header>
  );
}
