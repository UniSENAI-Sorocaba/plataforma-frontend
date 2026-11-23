"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { AppToast } from "@/components/app-toast";
import { logout } from "@/features/auth/auth-service";
import type { AuthUser, UserRole } from "@/features/auth/types";
import { listPublicProjects, type Project } from "@/features/academic-pi/projects-api";
import { listOwnParticipationRequests, type ParticipationRequest } from "@/features/academic-pi/participation-api";
import { listExtensionOpportunities, type ExtensionOpportunity } from "@/features/extension/opportunities-api";
import { navigationForRole, ROLE_LABELS } from "@/features/auth/role-navigation";

const ROLE_HOME_COPY: Record<UserRole, { eyebrow: string; description: string; summary: [string, string, string][]; title: string }> = {
  ALUNO: { eyebrow: "Visão geral · Estudante", description: "Seu próximo passo acadêmico começa aqui. Acompanhe projetos, oportunidades e as decisões que precisam da sua atenção.", summary: [["Projetos publicados", "catalog", "Catálogo disponível para consulta"], ["Editais abertos", "opportunities", "Oportunidades no período atual"], ["Solicitações pendentes", "requests", "Acompanhe suas inscrições"]], title: "Continue de onde parou." },
  DOCENTE: { eyebrow: "Visão geral · Docente", description: "Organize as revisões acadêmicas e acompanhe as decisões pendentes nos projetos sob sua responsabilidade.", summary: [["Projetos sob responsabilidade", "—", "Consulte seus projetos"], ["Atividades para revisar", "—", "Registre decisões acadêmicas"], ["Avaliações atribuídas", "—", "Acompanhe os próximos prazos"]], title: "Suas decisões acadêmicas." },
  COORDENADOR: { eyebrow: "Visão geral · Coordenação", description: "Acompanhe a operação acadêmica, as participações e as avaliações que precisam de coordenação institucional.", summary: [["Projetos em gestão", "—", "Acompanhe o ciclo dos projetos"], ["Editais publicados", "—", "Gerencie oportunidades"], ["Pendências institucionais", "—", "Revise as próximas decisões"]], title: "Governança em movimento." },
  ADMIN: { eyebrow: "Visão geral · Administração", description: "Mantenha os acessos e a operação da plataforma organizados para as equipes acadêmicas.", summary: [["Acessos", "—", "Usuários e permissões"], ["Catálogo", "—", "Conteúdo publicado"], ["Saúde operacional", "—", "Controles administrativos"]], title: "A plataforma sob controle." },
};

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

function currentAcademicTerm(): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", year: "numeric", month: "numeric" }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? String(new Date().getFullYear());
  const month = Number(parts.find((part) => part.type === "month")?.value ?? 1);
  return `${year}.${month <= 6 ? 1 : 2}`;
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [requests, setRequests] = useState<ParticipationRequest[]>([]);
  const [opportunities, setOpportunities] = useState<ExtensionOpportunity[]>([]);
  const menuItems = navigationForRole(user.role);
  const roleCopy = ROLE_HOME_COPY[user.role];
  useEffect(() => {
    let cancelled = false;
    if (user.role !== "ALUNO") return () => { cancelled = true; };
    void Promise.all([
      listPublicProjects(),
      listOwnParticipationRequests().catch(() => [] as ParticipationRequest[]),
      listExtensionOpportunities().catch(() => [] as ExtensionOpportunity[]),
    ]).then(([loadedProjects, loadedRequests, loadedOpportunities]) => {
      if (cancelled) return;
      setProjects(loadedProjects);
      setRequests(loadedRequests);
      setOpportunities(loadedOpportunities);
    });
    return () => { cancelled = true; };
  }, [user.role]);

  const firstName = user.name.trim().split(/\s+/)[0] || "estudante";
  const initials = user.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";

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
        <aside className="app-sidebar" aria-label="Menu da plataforma"><p className="sidebar-kicker">Navegação</p><nav className="app-menu">{menuItems.map((item, index) => <Link key={item.href} href={item.href} className={index === 0 ? "app-menu-link app-menu-link-active" : "app-menu-link"}><span className="app-menu-index">{String(index + 1).padStart(2, "0")}</span><span><strong>{item.label}</strong><small>{item.description}</small></span></Link>)}</nav></aside>

        <section className="authenticated-content" aria-labelledby="authenticated-title">
          <div className="authenticated-hero" data-enter><div><p className="eyebrow">{roleCopy.eyebrow}</p><h1 id="authenticated-title">Olá, {firstName}.</h1><p>{roleCopy.description}</p></div><div className="hero-signal" data-dealt-moment><span className="signal-line" /><strong>{currentAcademicTerm()}</strong><small>Período acadêmico em andamento</small></div></div>
          <section className="home-summary-grid" aria-label={`Resumo de ${ROLE_LABELS[user.role].toLowerCase()}`}>{roleCopy.summary.map(([label, value, detail], index) => <article className={`home-summary-card${index === 0 ? " home-summary-card-dark" : ""}`} key={label}><span>{label}</span><strong>{value === "catalog" ? projects.length : value === "opportunities" ? opportunities.filter((opportunity) => opportunity.status === "PUBLISHED" && new Date(opportunity.startsAt) <= new Date() && new Date(opportunity.endsAt) > new Date()).length : value === "requests" ? requests.filter((request) => request.status === "PENDING").length : value}</strong><small>{detail}</small></article>)}</section>
          <section className="home-next-section" aria-labelledby="next-action-title"><div className="home-section-heading"><div><p className="eyebrow">Próximo movimento</p><h2 id="next-action-title">{roleCopy.title}</h2></div><span className="section-index">01 / 02</span></div><div className="next-action-card"><div><span className="project-classification">{ROLE_LABELS[user.role]}</span><h3>{user.role === "ALUNO" ? (projects[0]?.title ?? "Nenhum projeto disponível ainda") : "Acesse seu painel de trabalho"}</h3><p>{user.role === "ALUNO" ? "Explore o catálogo e acompanhe suas solicitações." : "As opções do menu foram filtradas para as tarefas do seu perfil."}</p></div><Link href={menuItems[1]?.href ?? "/"} className="btn btn-primary">Abrir painel <span aria-hidden="true">↗</span></Link></div></section>
          <section className="home-modules-section" aria-labelledby="modules-title"><div className="home-section-heading"><div><p className="eyebrow">Acesso rápido</p><h2 id="modules-title">O que você precisa hoje?</h2></div><span className="section-index">02 / 02</span></div><div className="home-module-grid">{menuItems.slice(1, 3).map((item, index) => <Link href={item.href} className="home-module-card" key={item.href}><span className="module-number">{String(index + 1).padStart(2, "0")}</span><h3>{item.label}</h3><p>{item.description}</p><span className="module-link">Acessar <span aria-hidden="true">↗</span></span></Link>)}</div></section>
        </section>
      </div>
      <footer className="site-footer authenticated-footer"><span>© 2026 UniSENAI Sorocaba</span><span>Plataforma Digital Institucional</span></footer>
      {toastVisible && <AppToast title="Login realizado com sucesso" message="Sua sessão está pronta. Bem-vindo à plataforma." onDismiss={dismissToast} />}
    </main>
  );
}
