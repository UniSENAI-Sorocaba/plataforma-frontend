"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import { logout } from "@/features/auth/auth-service";
import type { AuthUser } from "@/features/auth/types";
import { navigationForRole, ROLE_LABELS, type NavigationKey } from "@/features/auth/role-navigation";

const defaultUser: AuthUser = { id: "current", name: "estudante", role: "ALUNO" };

function parseUser(serialized: string | null): AuthUser {
  if (!serialized) return defaultUser;
  try {
    const parsed = JSON.parse(serialized) as Partial<AuthUser>;
    return { id: parsed.id || "current", name: parsed.name || "estudante", email: parsed.email, role: parsed.role || "ALUNO" };
  } catch { return { id: "current", name: "estudante", role: "ALUNO" }; }
}

const subscribeToUser = (onChange: () => void) => {
  window.addEventListener("plataforma:login-success", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("plataforma:login-success", onChange);
    window.removeEventListener("storage", onChange);
  };
};

const userSnapshot = () => (typeof window === "undefined" ? null : window.sessionStorage.getItem("plataforma.currentUser"));

export function AuthenticatedShell({ active, children }: { active: NavigationKey; children: React.ReactNode }) {
  const router = useRouter();
  const serializedUser = useSyncExternalStore(subscribeToUser, userSnapshot, () => null);
  const user = parseUser(serializedUser);
  const firstName = useMemo(() => user.name.trim().split(/\s+/)[0] || "estudante", [user.name]);
  const initials = useMemo(() => user.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U", [user.name]);
  async function handleLogout() { await logout(); router.push("/login"); }

  const menuItems = navigationForRole(user.role);
  return <main className="authenticated-home">
    <a className="skip-link" href="#conteudo-autenticado">Pular para o conteúdo</a>
    <header className="app-shell-header"><Link href="/" className="site-brand" aria-label="UniSENAI Sorocaba — início"><span className="brand-mark" aria-hidden="true">U</span><span><strong>UniSENAI</strong><small>Plataforma Digital</small></span></Link><div className="app-header-actions"><span className="role-chip">{ROLE_LABELS[user.role]}</span><div className="user-menu-summary"><span className="user-avatar" aria-hidden="true">{initials}</span><span>{firstName}</span></div><button type="button" className="logout-button" onClick={() => void handleLogout()}>Sair</button></div></header>
    <div className="app-shell-layout" id="conteudo-autenticado"><aside className="app-sidebar" aria-label="Menu da plataforma"><p className="sidebar-kicker">Navegação</p><nav className="app-menu">{menuItems.map((item, index) => { const isActive = active === item.key; return <Link key={item.href} href={item.href} className={isActive ? "app-menu-link app-menu-link-active" : "app-menu-link"}><span className="app-menu-index">{String(index + 1).padStart(2, "0")}</span><span><strong>{item.label}</strong><small>{item.description}</small></span></Link>; })}</nav></aside><section className="authenticated-page-content">{children}</section></div>
    <footer className="site-footer authenticated-footer"><span>© 2026 UniSENAI Sorocaba</span><span>Plataforma Digital Institucional</span></footer>
  </main>;
}
