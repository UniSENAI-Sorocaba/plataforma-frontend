"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { AuthenticatedHome } from "@/features/portal/authenticated-home";

export const dynamic = "force-dynamic";


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
          </div>

          <div className="platform-preview" aria-label="Prévia da plataforma digital" data-dealt-moment>
            <div className="preview-topbar"><span className="preview-brand"><span className="mini-mark">U</span> Plataforma Digital</span><span className="preview-avatar">AS</span></div>
            <div className="preview-body">
              <div className="preview-greeting"><span className="preview-kicker">Visão geral</span><strong>Seu espaço acadêmico.</strong><span>O que está acontecendo nos seus projetos.</span></div>
              <div className="preview-stats"><div><span>Projetos publicados</span><strong>—</strong><small>Dados da plataforma</small></div><div><span>Editais abertos</span><strong>—</strong><small>Oportunidades do período</small></div></div>
              <div className="preview-project"><div><span className="preview-label">Seu próximo movimento</span><strong>Acompanhe seus projetos</strong><span className="preview-meta"><i /> Dados atualizados pela plataforma</span></div><span className="preview-arrow" aria-hidden="true">↗</span></div>
            </div>
          </div>
        </section>

        <section id="visao-geral" className="overview-section" aria-labelledby="overview-title">
          <div className="section-intro"><p className="eyebrow">Uma visão compartilhada</p><h2 id="overview-title">Do primeiro rascunho ao impacto publicado.</h2></div>
          <div className="overview-body"><p>A plataforma organiza o trabalho acadêmico para que cada pessoa saiba o próximo passo — e para que bons projetos encontrem a comunidade que precisa deles.</p><span className="section-index">01 / 03</span></div>
        </section>

        <section id="modulos" className="modules-section" aria-labelledby="modules-title">
          <div className="section-heading"><div><p className="eyebrow">Um sistema, três frentes</p><h2 id="modules-title">Tudo o que move a experiência acadêmica.</h2></div></div>
          <div className="module-grid">
            <article className="module-card module-card-primary"><span className="module-number">01</span><h3>Projetos Integradores</h3><p>Propostas, equipes, entregas e decisões em um fluxo que todos conseguem acompanhar.</p><Link href="/login" className="module-link">Acessar projetos <span aria-hidden="true">↗</span></Link></article>
            <article className="module-card"><span className="module-number">02</span><h3>Extensão Universitária</h3><p>Registre horas, agendas e certificados com o contexto que dá sentido a cada atividade.</p><span className="module-state">Em preparação</span></article>
            <article className="module-card"><span className="module-number">03</span><h3>Portal de impacto</h3><p>Projetos publicados ganham visibilidade e mostram como a universidade transforma territórios.</p><span className="module-state">Em preparação</span></article>
          </div>
        </section>

      </div>

      <footer className="site-footer"><span>© 2026 UniSENAI Sorocaba</span><span>Plataforma Digital Institucional</span><Link href="/login">Entrar na plataforma <span aria-hidden="true">↗</span></Link></footer>
    </main>
  );
}
