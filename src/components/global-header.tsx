"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

type GlobalHeaderProps = {
  current?: "landing" | "projects" | "new";
};

export function GlobalHeader({ current }: GlobalHeaderProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const showHomeBtn = current ? current !== "landing" : pathname !== "/";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="global-header">
      <Link className="brand" href="/" aria-label="Go to PocketFrame home">
        <span className="brand-mark">PF</span>
        <span>PocketFrame <small>AI TRAILER STUDIO</small></span>
      </Link>
      <div className="header-right-actions">
        {showHomeBtn && (
          <Link className="header-home-btn" href="/" title="Go to Home" aria-label="Go to Home">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Home</span>
          </Link>
        )}

        <div className="user-menu-container" ref={menuRef}>
          <button
            type="button"
            className="user-profile-button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-label="User account menu"
          >
            <span className="user-avatar">SU</span>
            <span className="user-name">Super User</span>
            <svg
              className={`dropdown-chevron ${isOpen ? "open" : ""}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.5 4.5L6 8L9.5 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {isOpen && (
            <div className="user-dropdown-menu" role="menu">
              <div className="user-dropdown-info">
                <div className="user-dropdown-name">Super User</div>
                <div className="user-dropdown-role">Administrator</div>
              </div>
              <div className="user-dropdown-divider" />
              <button
                type="button"
                className="user-dropdown-item logout-item"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  alert("Logged out successfully");
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

