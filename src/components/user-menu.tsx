"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

export function UserMenu() {
  const [open, setOpen] = useState(false); const [logout, setLogout] = useState(false); const root = useRef<HTMLDivElement>(null); const router = useRouter();
  useEffect(() => { const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); }; const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; document.addEventListener("mousedown", close); window.addEventListener("keydown", escape); return () => { document.removeEventListener("mousedown", close); window.removeEventListener("keydown", escape); }; }, []);
  function finishLogout() { localStorage.removeItem("pocketframe-demo-preferences"); setLogout(false); setOpen(false); router.push("/"); }
  return <div className="user-menu" ref={root}><button type="button" className="user-menu-trigger" aria-haspopup="menu" aria-expanded={open} aria-label="Open Demo User menu" onClick={() => setOpen((value) => !value)}><span aria-hidden="true">●</span></button>{open && <div className="user-menu-popover" role="menu"><div className="user-menu-profile"><span className="avatar-placeholder" aria-hidden="true">DU</span><span><strong>Demo User</strong><small>Creative Producer</small></span></div><Link href="/profile" role="menuitem" onClick={() => setOpen(false)}>Profile</Link><Link href="/settings" role="menuitem" onClick={() => setOpen(false)}>Settings</Link><button type="button" role="menuitem" onClick={() => setLogout(true)}>Logout</button></div>}<ConfirmationDialog open={logout} title="Exit the current workspace?" message="Your projects and generated media will remain saved." confirmLabel="Logout" onCancel={() => setLogout(false)} onConfirm={finishLogout} /></div>;
}
