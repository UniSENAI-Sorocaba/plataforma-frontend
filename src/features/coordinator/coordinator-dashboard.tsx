"use client";

import Link from "next/link";
import { useState } from "react";
import type { CoordinatorDashboardData } from "./types";

interface CoordinatorDashboardProps {
  initialData: CoordinatorDashboardData;
}

export function CoordinatorDashboard({ initialData }: CoordinatorDashboardProps) {
  const [data] = useState<CoordinatorDashboardData>(initialData);
  const [filterPeriod, setFilterPeriod] = useState<string>("todos");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const filteredClasses = data.classes.filter((c) => {
    if (filterPeriod === "todos") return true;
    return c.period.toLowerCase() === filterPeriod.toLowerCase();
  });

  const handleSimulateAction = (actionName: string) => {
    setActionFeedback(`Ação "${actionName}" iniciada com sucesso.`);
    setTimeout(() => {
      setActionFeedback(null);
    }, 4000);
  };

  return (
    <div className="coordinator-layout">
      {/* Topbar Institucional */}
      <header className="coordinator-topbar" role="banner">
        <Link className="coordinator-brand" href="/" aria-label="UniSENAI - Início">
          <span className="brand-badge-box">U</span>
          <div>
            <strong>UniSENAI</strong>
            <small>COORDENAÇÃO ACADÊMICA</small>
          </div>
        </Link>

        <nav className="coordinator-nav" aria-label="Navegação da coordenação">
          <a href="#inicio" className="active">Início</a>
          <a href="#turmas">Turmas & Cursos</a>
          <a href="#projetos">Projetos</a>
          <a href="#importacao">Importação CSV</a>
          <a href="#relatorios">Relatórios</a>
        </nav>

        <div className="coordinator-user-box">
          <span className="user-avatar" aria-hidden="true">
            {data.profile.initials}
          </span>
          <div className="user-details">
            <span className="user-name">{data.profile.name}</span>
            <span className="user-role-badge">Coordenador</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="coordinator-main" id="inicio">
        {/* Banner de Boas-Vindas */}
        <section className="coordinator-hero" aria-labelledby="hero-title">
          <div>
            <p className="eyebrow">COORDENAÇÃO DE CURSO · {data.profile.course.toUpperCase()}</p>
            <h1 id="hero-title">Painel de Gestão e Acompanhamento Acadêmico</h1>
            <p className="hero-description">
              Supervisione turmas, acompanhe o ciclo de Projetos Integradores e gerencie o corpo discente no período letivo <strong>{data.term}</strong>.
            </p>
          </div>
          <div className="hero-status-pill">
            <span className="status-dot status-dot--online" aria-hidden="true" />
            <span>Ano Letivo {data.term} · {data.profile.campus}</span>
          </div>
        </section>

        {actionFeedback && (
          <div className="alert alert--info" role="status" aria-live="polite">
            <span className="alert-icon" aria-hidden="true">ℹ</span>
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* Indicadores Principais */}
        <section aria-labelledby="indicators-title" className="indicators-section">
          <h2 id="indicators-title" className="visually-hidden">Indicadores Gerais da Coordenação</h2>
          <div className="indicator-grid">
            {data.indicators.map((ind) => (
              <div className="indicator-card" key={ind.label}>
                <div className="indicator-header">
                  <span className="indicator-label">{ind.label}</span>
                  {ind.badge && (
                    <span className={`badge badge--${ind.badgeType || "info"}`}>
                      {ind.badge}
                    </span>
                  )}
                </div>
                <div className="indicator-value">{ind.value}</div>
                <p className="indicator-desc">{ind.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Acesso Rápido */}
        <section className="shortcuts-section" aria-labelledby="shortcuts-heading">
          <div className="section-title-bar">
            <div>
              <p className="eyebrow">AÇÕES E FLUXOS</p>
              <h2 id="shortcuts-heading">Acesso Rápido da Coordenação</h2>
            </div>
          </div>

          <div className="shortcut-cards-grid">
            {data.shortcuts.map((sc) => (
              <a
                href={sc.href}
                className="action-card"
                key={sc.title}
                onClick={(e) => {
                  if (sc.href.startsWith("#")) {
                    e.preventDefault();
                    handleSimulateAction(sc.title);
                  }
                }}
              >
                <div className="action-card-header">
                  <span className="action-icon" aria-hidden="true">{sc.icon}</span>
                  {sc.tag && <span className="action-tag">{sc.tag}</span>}
                </div>
                <h3>{sc.title}</h3>
                <p>{sc.description}</p>
                <span className="action-link-label">
                  Acessar <span aria-hidden="true">→</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Gestão de Turmas */}
        <section className="classes-section" id="turmas" aria-labelledby="classes-heading">
          <div className="section-title-bar">
            <div>
              <p className="eyebrow">TURMAS SOB RESPONSABILIDADE</p>
              <h2 id="classes-heading">Quadro de Turmas e Projetos</h2>
            </div>

            <div className="classes-filter" role="group" aria-label="Filtrar turmas por turno">
              <label htmlFor="filter-period" className="visually-hidden">Filtrar por turno</label>
              <select
                id="filter-period"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="select-filter"
              >
                <option value="todos">Todos os turnos</option>
                <option value="noturno">Noturno</option>
                <option value="matutino">Matutino</option>
              </select>
            </div>
          </div>

          <div className="classes-table-container">
            <table className="classes-table">
              <thead>
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Turma / Descrição</th>
                  <th scope="col">Turno</th>
                  <th scope="col">Alunos</th>
                  <th scope="col">Projetos Ativos</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((cls) => (
                  <tr key={cls.id}>
                    <td><code>{cls.code}</code></td>
                    <td>
                      <strong>{cls.name}</strong>
                      <div className="subtext">{cls.semester}</div>
                    </td>
                    <td>{cls.period}</td>
                    <td>{cls.totalStudents}</td>
                    <td><strong>{cls.activeProjects}</strong></td>
                    <td>
                      <span className={`status-badge status-badge--${cls.status === "Ativa" ? "active" : "neutral"}`}>
                        {cls.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn-action-small"
                        onClick={() => handleSimulateAction(`Visualizar detalhes de ${cls.code}`)}
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="coordinator-footer">
        <p>UniSENAI Sorocaba · Painel da Coordenação Acadêmica · Projeto Integrador & Extensão</p>
      </footer>
    </div>
  );
}
