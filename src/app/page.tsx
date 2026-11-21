"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { AuthenticatedHome } from "@/features/portal/authenticated-home";

export const dynamic = "force-dynamic";

import { EmptyState, StatusBadge, SuccessState } from "@/components/feedback-states";

export default function Home() {
  const authenticated = useSyncExternalStore(
    () => () => undefined,
    () => Boolean(window.sessionStorage.getItem("plataforma.accessToken")),
    () => false,
  );
  if (authenticated) return <AuthenticatedHome />;

  return (
    <main className="home-main">
      <a className="skip-link" href="#conteudo-principal">Pular para o conteúdo</a>
      <header className="site-header">
        <Link href="/" className="site-brand" aria-label="UniSENAI Sorocaba — início">
          <span className="brand-mark" aria-hidden="true">U</span>
          <span>
            <strong>UniSENAI</strong>
            <small>Sorocaba</small>
          </span>
        </Link>
        <nav aria-label="Navegação principal">
          <a href="#visao-geral">Visão geral</a>
          <a href="#modulos">Módulos</a>
          <Link href="/login" className="btn btn-primary btn-small">Entrar</Link>
        </nav>
      </header>

      <div id="conteudo-principal">
        <section className="home-hero" data-enter aria-labelledby="home-title">
          <div className="hero-copy">
            <p className="eyebrow">Plataforma acadêmica · 2026</p>
            <h1 id="home-title">Projetos que conectam sala, comunidade e futuro.</h1>
            <p className="hero-lede">Um espaço único para acompanhar projetos integradores, extensão universitária e o impacto que nasce em Sorocaba.</p>
            <div className="hero-actions">
              <Link href="/login" className="btn btn-primary">Acessar a plataforma <span aria-hidden="true">↗</span></Link>
              <a href="#visao-geral" className="text-link">Conhecer a plataforma <span aria-hidden="true">↓</span></a>
            </div>
            <div className="hero-proof" aria-label="Status da plataforma">
              <span className="status-dot" aria-hidden="true" />
              <span><strong>Ambiente operacional</strong><small>Base pronta para os próximos projetos</small></span>
            </div>
          </div>

          <div className="platform-preview" aria-label="Prévia da plataforma digital" data-dealt-moment>
            <div className="preview-topbar"><span className="preview-brand"><span className="mini-mark">U</span> Plataforma Digital</span><span className="preview-avatar">AS</span></div>
            <div className="preview-body">
              <div className="preview-greeting"><span className="preview-kicker">Visão geral</span><strong>Olá, Ana.</strong><span>O que está acontecendo nos seus projetos.</span></div>
              <div className="preview-stats"><div><span>Projetos ativos</span><strong>08</strong><small>+2 neste mês</small></div><div><span>Horas de extensão</span><strong>124h</strong><small>Meta semestral</small></div></div>
              <div className="preview-project"><div><span className="preview-label">Projeto em destaque</span><strong>Educação maker na rede pública</strong><span className="preview-meta"><i /> Em andamento · Projeto Integrador</span></div><span className="preview-arrow" aria-hidden="true">↗</span></div>
            </div>
          </div>
        </section>

        <section id="visao-geral" className="overview-section" aria-labelledby="overview-title">
          <div className="section-intro"><p className="eyebrow">Uma visão compartilhada</p><h2 id="overview-title">Do primeiro rascunho ao impacto publicado.</h2></div>
          <div className="overview-body"><p>A plataforma organiza o trabalho acadêmico para que cada pessoa saiba o próximo passo — e para que bons projetos encontrem a comunidade que precisa deles.</p><span className="section-index">01 / 03</span></div>
        </section>

        <section id="modulos" className="modules-section" aria-labelledby="modules-title">
          <div className="section-heading"><div><p className="eyebrow">Um sistema, três frentes</p><h2 id="modules-title">Tudo o que move a experiência acadêmica.</h2></div><StatusBadge>Base operacional</StatusBadge></div>
          <div className="module-grid">
            <article className="module-card module-card-primary"><span className="module-number">01</span><h3>Projetos Integradores</h3><p>Propostas, equipes, entregas e decisões em um fluxo que todos conseguem acompanhar.</p><Link href="/login" className="module-link">Acessar projetos <span aria-hidden="true">↗</span></Link></article>
            <article className="module-card"><span className="module-number">02</span><h3>Extensão Universitária</h3><p>Registre horas, agendas e certificados com o contexto que dá sentido a cada atividade.</p><span className="module-state">Em preparação</span></article>
            <article className="module-card"><span className="module-number">03</span><h3>Portal de impacto</h3><p>Projetos publicados ganham visibilidade e mostram como a universidade transforma territórios.</p><span className="module-state">Em preparação</span></article>
          </div>
        </section>

        <section className="foundation-panel" aria-labelledby="status-title">
          <div className="panel-heading"><div><p className="eyebrow">Próximo capítulo</p><h2 id="status-title">A estrutura está pronta para crescer com a comunidade.</h2></div><span className="section-index">03 / 03</span></div>
          <div className="feedback-row"><SuccessState title="Estrutura inicial disponível" description="Os módulos de Projetos, Extensão e Portal serão conectados às APIs nas próximas fases." /><EmptyState title="Nenhum projeto publicado ainda" description="Quando o catálogo público estiver disponível, os projetos aprovados aparecerão aqui." /></div>
        </section>
      </div>

      <footer className="site-footer"><span>© 2026 UniSENAI Sorocaba</span><span>Plataforma Digital Institucional</span><Link href="/login">Entrar na plataforma <span aria-hidden="true">↗</span></Link></footer>
    </main>
  );
}
