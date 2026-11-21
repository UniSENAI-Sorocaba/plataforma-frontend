"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { logout } from "@/features/auth/auth-service";
import type { AuthUser, UserRole } from "@/features/auth/types";

const ROLE_LABELS: Record<UserRole, string> = { ALUNO: "Estudante", DOCENTE: "Docente", COORDENADOR: "Coordenação", ADMIN: "Administração" };
const MENU_ITEMS = [
  { href: "/", label: "Visão geral", description: "Seu ponto de partida" },
  { href: "/projects", label: "Projetos", description: "Projetos publicados" },
  { href: "/projects/requests", label: "Minhas solicitações", description: "Acompanhe suas inscrições" },
  { href: "/extension", label: "Extensão", description: "Editais e oportunidades" },
];

function readUser(): AuthUser {
  if (typeof window === "undefined") return { id: "current", name: "estudante", role: "ALUNO" };
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem("plataforma.currentUser") ?? "{}") as Partial<AuthUser>;
    return { id: parsed.id || "current", name: parsed.name || "estudante", email: parsed.email, role: parsed.role || "ALUNO" };
  } catch { return { id: "current", name: "estudante", role: "ALUNO" }; }
}

export function AuthenticatedShell({ active, children }: { active: "projects" | "requests" | "extension"; children: React.ReactNode }) {
  const router = useRouter();
  const user = readUser();
  const firstName = useMemo(() => user.name.trim().split(/\s+/)[0] || "estudante", [user.name]);
  const initials = useMemo(() => user.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U", [user.name]);
  async function handleLogout() { await logout(); router.push("/login"); }

  return <main className="authenticated-home">
    <a className="skip-link" href="#conteudo-autenticado">Pular para o conteúdo</a>
    <header className="app-shell-header"><Link href="/" className="site-brand" aria-label="UniSENAI Sorocaba — início"><span className="brand-mark" aria-hidden="true">U</span><span><strong>UniSENAI</strong><small>Plataforma Digital</small></span></Link><div className="app-header-actions"><span className="role-chip">{ROLE_LABELS[user.role]}</span><div className="user-menu-summary"><span className="user-avatar" aria-hidden="true">{initials}</span><span>{firstName}</span></div><button type="button" className="logout-button" onClick={() => void handleLogout()}>Sair</button></div></header>
    <div className="app-shell-layout" id="conteudo-autenticado"><aside className="app-sidebar" aria-label="Menu da plataforma"><p className="sidebar-kicker">Navegação</p><nav className="app-menu">{MENU_ITEMS.map((item, index) => { const isActive = (active === "projects" && item.href === "/projects") || (active === "requests" && item.href === "/projects/requests") || (active === "extension" && item.href === "/extension"); return <Link key={item.href} href={item.href} className={isActive ? "app-menu-link app-menu-link-active" : "app-menu-link"}><span className="app-menu-index">0{index + 1}</span><span><strong>{item.label}</strong><small>{item.description}</small></span></Link>; })}</nav><div className="sidebar-footer"><span className="status-dot" aria-hidden="true" /><span><strong>Ambiente operacional</strong><small>Acesso seguro ativo</small></span></div></aside><section className="authenticated-page-content">{children}</section></div>
    <footer className="site-footer authenticated-footer"><span>© 2026 UniSENAI Sorocaba</span><span>Plataforma Digital Institucional</span></footer>
  </main>;
}
