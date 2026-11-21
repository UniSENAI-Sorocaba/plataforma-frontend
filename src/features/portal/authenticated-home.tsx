"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { AppModal } from "@/components/app-modal";
import { logout } from "@/features/auth/auth-service";
import type { AuthUser, UserRole } from "@/features/auth/types";

const ROLE_LABELS: Record<UserRole, string> = { ALUNO: "Estudante", DOCENTE: "Docente", COORDENADOR: "Coordenação", ADMIN: "Administração" };
const MENU_ITEMS = [
  { href: "/", label: "Visão geral", description: "Seu ponto de partida" },
  { href: "/projects", label: "Projetos", description: "Projetos publicados" },
  { href: "/projects/requests", label: "Minhas solicitações", description: "Acompanhe suas inscrições" },
  { href: "/extension", label: "Extensão", description: "Editais e oportunidades" },
];

function readCurrentUser(): AuthUser {
  if (typeof window === "undefined") return { id: "current", name: "estudante", role: "ALUNO" };
  const stored = window.sessionStorage.getItem("plataforma.currentUser");
  if (!stored) return { id: "current", name: "estudante", role: "ALUNO" };
  try {
    const parsed = JSON.parse(stored) as Partial<AuthUser>;
    return { id: parsed.id || "current", name: parsed.name || "estudante", email: parsed.email, role: parsed.role || "ALUNO" };
  } catch {
    return { id: "current", name: "estudante", role: "ALUNO" };
  }
}

export function AuthenticatedHome() {
  const router = useRouter();
  const user = readCurrentUser();
  const toastVisible = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("plataforma:login-success", onStoreChange);
      return () => window.removeEventListener("plataforma:login-success", onStoreChange);
    },
    () => window.sessionStorage.getItem("plataforma.loginSuccess") === "1",
    () => false,
  );
  useEffect(() => { window.sessionStorage.removeItem("plataforma.loginSuccess"); }, []);
  const dismissToast = useCallback(() => {
    window.sessionStorage.removeItem("plataforma.loginSuccess");
    window.dispatchEvent(new Event("plataforma:login-success"));
  }, []);

  const firstName = useMemo(() => user.name.trim().split(/\s+/)[0] || "estudante", [user.name]);
  const initials = useMemo(() => user.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U", [user.name]);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <main className="authenticated-home">
      <a className="skip-link" href="#conteudo-autenticado">Pular para o conteúdo</a>
      <header className="app-shell-header">
        <Link href="/" className="site-brand" aria-label="UniSENAI Sorocaba — início"><span className="brand-mark" aria-hidden="true">U</span><span><strong>UniSENAI</strong><small>Plataforma Digital</small></span></Link>
        <div className="app-header-actions"><span className="role-chip">{ROLE_LABELS[user.role]}</span><div className="user-menu-summary"><span className="user-avatar" aria-hidden="true">{initials}</span><span>{firstName}</span></div><button type="button" className="logout-button" onClick={() => void handleLogout()}>Sair</button></div>
      </header>

      <div className="app-shell-layout" id="conteudo-autenticado">
        <aside className="app-sidebar" aria-label="Menu da plataforma"><p className="sidebar-kicker">Navegação</p><nav className="app-menu">{MENU_ITEMS.map((item, index) => <Link key={item.href} href={item.href} className={index === 0 ? "app-menu-link app-menu-link-active" : "app-menu-link"}><span className="app-menu-index">0{index + 1}</span><span><strong>{item.label}</strong><small>{item.description}</small></span></Link>)}</nav><div className="sidebar-footer"><span className="status-dot" aria-hidden="true" /><span><strong>Ambiente operacional</strong><small>Acesso seguro ativo</small></span></div></aside>

        <section className="authenticated-content" aria-labelledby="authenticated-title">
          <div className="authenticated-hero" data-enter><div><p className="eyebrow">Visão geral · {ROLE_LABELS[user.role]}</p><h1 id="authenticated-title">Olá, {firstName}.</h1><p>Seu próximo passo acadêmico começa aqui. Acompanhe projetos, oportunidades e as decisões que precisam da sua atenção.</p></div><div className="hero-signal" data-dealt-moment><span className="signal-line" /><strong>2026.1</strong><small>Período acadêmico em andamento</small></div></div>
          <section className="home-summary-grid" aria-label="Resumo acadêmico"><article className="home-summary-card home-summary-card-dark"><span>Projetos ativos</span><strong>03</strong><small>2 com atividade recente</small></article><article className="home-summary-card"><span>Horas de extensão</span><strong>24h</strong><small>Meta semestral em acompanhamento</small></article><article className="home-summary-card"><span>Solicitações pendentes</span><strong>01</strong><small>Uma decisão aguarda retorno</small></article></section>
          <section className="home-next-section" aria-labelledby="next-action-title"><div className="home-section-heading"><div><p className="eyebrow">Próximo movimento</p><h2 id="next-action-title">Continue de onde parou.</h2></div><span className="section-index">01 / 02</span></div><div className="next-action-card"><div><span className="project-classification">Projeto integrador · Em andamento</span><h3>Educação maker na rede pública</h3><p>Acompanhe a próxima entrega e mantenha sua equipe alinhada ao cronograma do período.</p></div><Link href="/projects" className="btn btn-primary">Ver projetos <span aria-hidden="true">↗</span></Link></div></section>
          <section className="home-modules-section" aria-labelledby="modules-title"><div className="home-section-heading"><div><p className="eyebrow">Acesso rápido</p><h2 id="modules-title">O que você precisa hoje?</h2></div><span className="section-index">02 / 02</span></div><div className="home-module-grid"><Link href="/projects/requests" className="home-module-card"><span className="module-number">01</span><h3>Minhas solicitações</h3><p>Veja o status das suas inscrições e acompanhe as próximas ações.</p><span className="module-link">Acompanhar <span aria-hidden="true">↗</span></span></Link><Link href="/extension" className="home-module-card"><span className="module-number">02</span><h3>Extensão universitária</h3><p>Encontre editais abertos e oportunidades para registrar novas horas.</p><span className="module-link">Explorar editais <span aria-hidden="true">↗</span></span></Link></div></section>
        </section>
      </div>
      <footer className="site-footer authenticated-footer"><span>© 2026 UniSENAI Sorocaba</span><span>Plataforma Digital Institucional</span></footer>
      {toastVisible && <AppModal title="Login realizado com sucesso" message="Sua sessão está pronta. Bem-vindo à plataforma." onClose={dismissToast} />}
    </main>
  );
}
