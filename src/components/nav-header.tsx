"use client";

import { useEffect, useState } from "react";
import type { AuthUser } from "@/features/auth/auth-layout.mock";

interface NavHeaderProps {
  user: AuthUser;
}

export default function NavHeader({ user }: NavHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const body = document.body;
    body.classList.toggle("menu-open", isMenuOpen);

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      body.classList.remove("menu-open");
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <header className="topbar" role="banner">
      <button
        className="menu-btn"
        id="menuBtn"
        type="button"
        aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={isMenuOpen}
        aria-controls="sidebar"
        onClick={() => setIsMenuOpen((prev) => !prev)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>

      <div className="topbar__user">
        <div className="topbar__avatar" aria-hidden="true">{initials}</div>
        <div className="topbar__user-info">
          <b>{user.name}</b>
          <span>Engenharia de Software</span>
        </div>
        <span className="topbar__role-badge">{user.role.toUpperCase()}</span>
      </div>

      <button type="button" className="topbar__logout" aria-label="Sair da conta">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        <span>Sair</span>
      </button>
    </header>
  );
}
