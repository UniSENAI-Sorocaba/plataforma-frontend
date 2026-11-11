"use client";

import Link from "next/link";
import { useState } from "react";
import type { AdminDashboardData } from "./types";

interface AdminDashboardProps {
  initialData: AdminDashboardData;
}

export function AdminDashboard({ initialData }: AdminDashboardProps) {
  const [data] = useState<AdminDashboardData>(initialData);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleActionClick = (actionName: string) => {
    setFeedback(`Módulo "${actionName}" aberto para inspeção.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="admin-layout">
      {/* Topbar Institucional */}
      <header className="admin-topbar" role="banner">
        <Link className="admin-brand" href="/" aria-label="UniSENAI - Início">
          <span className="brand-badge-box brand-badge-box--dark">U</span>
          <div>
            <strong>UniSENAI</strong>
            <small>PAINEL DO ADMINISTRADOR</small>
          </div>
        </Link>

        <nav className="admin-nav" aria-label="Navegação administrativa">
          <a href="#inicio" className="active">Visão Geral</a>
          <a href="#usuarios">Usuários & RBAC</a>
          <a href="#servicos">Serviços</a>
          <a href="#auditoria">Auditoria</a>
          <a href="#configuracoes">Configurações</a>
        </nav>

        <div className="admin-user-box">
          <span className="user-avatar user-avatar--admin" aria-hidden="true">
            {data.profile.initials}
          </span>
          <div className="user-details">
            <span className="user-name">{data.profile.name}</span>
            <span className="user-role-badge user-role-badge--admin">Admin</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="admin-main" id="inicio">
        {/* Banner de Boas-Vindas */}
        <section className="admin-hero" aria-labelledby="admin-hero-title">
          <div>
            <p className="eyebrow eyebrow--dark">GOVERNANÇA & INFRAESTRUTURA DA PLATAFORMA</p>
            <h1 id="admin-hero-title">Controle Central de Operações do Sistema</h1>
            <p className="hero-description">
              Monitore a integridade dos serviços, gerencie permissões de acesso RBAC e audite a conformidade de segurança no ambiente <strong>{data.environment}</strong>.
            </p>
          </div>
          <div className="hero-status-pill hero-status-pill--admin">
            <span className="status-dot status-dot--online" aria-hidden="true" />
            <span>Versão {data.systemVersion} · Produção</span>
          </div>
        </section>

        {feedback && (
          <div className="alert alert--info" role="status" aria-live="polite">
            <span className="alert-icon" aria-hidden="true">ℹ</span>
            <span>{feedback}</span>
          </div>
        )}

        {/* Métricas Principais */}
        <section aria-labelledby="metrics-title" className="indicators-section">
          <h2 id="metrics-title" className="visually-hidden">Métricas Globais do Sistema</h2>
          <div className="indicator-grid">
            {data.metrics.map((metric) => (
              <div className="indicator-card" key={metric.label}>
                <div className="indicator-header">
                  <span className="indicator-label">{metric.label}</span>
                  {metric.status && (
                    <span className={`badge badge--${metric.status}`}>
                      {metric.status === "healthy" ? "Normal" : "Info"}
                    </span>
                  )}
                </div>
                <div className="indicator-value">{metric.value}</div>
                <p className="indicator-desc">{metric.subtext}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Atalhos de Gestão */}
        <section className="shortcuts-section" aria-labelledby="admin-shortcuts-heading">
          <div className="section-title-bar">
            <div>
              <p className="eyebrow eyebrow--dark">CONTROLE OPERACIONAL</p>
              <h2 id="admin-shortcuts-heading">Ações Administrativas</h2>
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
                    handleActionClick(sc.title);
                  }
                }}
              >
                <div className="action-card-header">
                  <span className="action-icon" aria-hidden="true">{sc.icon}</span>
                  {sc.badge && <span className="action-tag">{sc.badge}</span>}
                </div>
                <h3>{sc.title}</h3>
                <p>{sc.description}</p>
                <span className="action-link-label">
                  Gerenciar <span aria-hidden="true">→</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Status de Microsserviços e Integrações */}
        <section className="classes-section" id="servicos" aria-labelledby="services-heading">
          <div className="section-title-bar">
            <div>
              <p className="eyebrow eyebrow--dark">INFRAESTRUTURA & SAÚDE</p>
              <h2 id="services-heading">Status dos Microsserviços</h2>
            </div>
          </div>

          <div className="classes-table-container">
            <table className="classes-table">
              <thead>
                <tr>
                  <th scope="col">Serviço</th>
                  <th scope="col">Camada</th>
                  <th scope="col">Status</th>
                  <th scope="col">Latência</th>
                  <th scope="col">Uptime</th>
                  <th scope="col" className="text-right">Operação</th>
                </tr>
              </thead>
              <tbody>
                {data.services.map((srv) => (
                  <tr key={srv.name}>
                    <td><strong>{srv.name}</strong></td>
                    <td><span className="badge badge--info">{srv.category}</span></td>
                    <td>
                      <span className="status-badge status-badge--active">
                        <span className="status-dot status-dot--online" aria-hidden="true" />
                        {srv.status}
                      </span>
                    </td>
                    <td><code>{srv.latency}</code></td>
                    <td>{srv.uptime}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn-action-small"
                        onClick={() => handleActionClick(`Healthcheck de ${srv.name}`)}
                      >
                        Ping / Testar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Logs Recentes de Auditoria */}
        <section className="classes-section" id="auditoria" aria-labelledby="audit-heading">
          <div className="section-title-bar">
            <div>
              <p className="eyebrow eyebrow--dark">RASTREABILIDADE & SEGURANÇA (OWASP)</p>
              <h2 id="audit-heading">Eventos Recentes de Auditoria</h2>
            </div>
            <span className="badge badge--info">{data.auditLogs.length} eventos monitorados</span>
          </div>

          <div className="classes-table-container">
            <table className="classes-table">
              <thead>
                <tr>
                  <th scope="col">Data / Hora</th>
                  <th scope="col">Usuário / Identificador</th>
                  <th scope="col">Perfil</th>
                  <th scope="col">Ação Registrada</th>
                  <th scope="col">Resultado</th>
                  <th scope="col">IP Origem</th>
                </tr>
              </thead>
              <tbody>
                {data.auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td><small>{log.timestamp}</small></td>
                    <td><strong>{log.actor}</strong></td>
                    <td><span className="user-role-badge">{log.role}</span></td>
                    <td>{log.action}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          log.result === "Sucesso"
                            ? "status-badge--active"
                            : "status-badge--warning"
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>
                    <td><code>{log.ipAddress}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="admin-footer">
        <p>UniSENAI Sorocaba · Painel Administrativo de Governança e Segurança da Informação</p>
      </footer>
    </div>
  );
}
