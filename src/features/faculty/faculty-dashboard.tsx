"use client";

import Link from "next/link";
import { useState } from "react";
import {
  calculateHoursSummary,
  MOCK_FACULTY_HOME_DATA,
  submitFacultyDecision,
} from "./faculty-service";
import type { FacultyHomeData, ProjectRequest } from "./types";

interface FacultyDashboardProps {
  initialData?: FacultyHomeData;
}

export function FacultyDashboard({ initialData = MOCK_FACULTY_HOME_DATA }: FacultyDashboardProps) {
  const [data] = useState<FacultyHomeData>(initialData);
  const [requests, setRequests] = useState<ProjectRequest[]>(initialData.requests);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const hoursSummary = calculateHoursSummary(requests);

  const handleDecisionSubmit = async (e: React.FormEvent<HTMLFormElement>, requestId: string) => {
    e.preventDefault();
    setFeedback(null);

    const formData = new FormData(e.currentTarget);
    const decision = formData.get(`decision-${requestId}`) as "approved" | "rejected";
    const reason = (formData.get(`reason-${requestId}`) as string) || "";

    if (!decision) {
      setFeedback({ type: "error", message: "Selecione uma decisão antes de enviar." });
      return;
    }

    try {
      const updated = await submitFacultyDecision(requests, { requestId, decision, reason });
      setRequests(updated);
      setFeedback({
        type: "success",
        message: `Decisão para o projeto ${requestId} registrada com sucesso (${decision === "approved" ? "Aprovado" : "Ajuste solicitado"}).`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao registrar decisão.";
      setFeedback({ type: "error", message });
    }
  };

  return (
    <main className="faculty-page">
      {/* Top Navigation Bar */}
      <header className="faculty-header">
        <Link className="faculty-brand" href="/" aria-label="UniSENAI, início">
          <span className="faculty-brand-mark">U</span>
          <span>UniSENAI <small>ÁREA DOCENTE</small></span>
        </Link>
        <nav aria-label="Navegação docente" className="faculty-nav">
          <a className="selected" href="#inicio">Início</a>
          <a href="#projetos">Projetos Orientados</a>
          <a href="#solicitacoes">Solicitações</a>
          <a href="#horas">Horas</a>
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="faculty-avatar" aria-label={`Perfil de ${data.profile.name}`}>
            {data.profile.initial}
          </span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--ink)" }}>
            {data.profile.name}
          </span>
        </div>
      </header>

      {/* Welcome Banner */}
      <section className="faculty-intro" id="inicio" aria-labelledby="faculty-title">
        <p className="faculty-eyebrow">AMBIENTE DO PROFESSOR · {data.profile.department}</p>
        <h1 id="faculty-title">Painel de Orientação e Gestão Acadêmica</h1>
        <p>Acompanhe seus projetos orientados, revise solicitações de alunos e valide horas de extensão.</p>
      </section>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            backgroundColor: feedback.type === "success" ? "#e6f4ea" : "#fce8e6",
            color: feedback.type === "success" ? "#137333" : "#c5221f",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Quick Shortcuts */}
      <section aria-label="Acesso rápido docente">
        <div className="faculty-shortcuts">
          {data.shortcuts.map((shortcut) => (
            <a className="faculty-shortcut" href={shortcut.href} key={shortcut.title}>
              <div className="faculty-shortcut-header">
                <span className="faculty-shortcut-icon" aria-hidden="true">{shortcut.icon}</span>
                {shortcut.badge && <span className="faculty-badge">{shortcut.badge}</span>}
              </div>
              <h3>{shortcut.title}</h3>
              <p>{shortcut.description}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Supervised Projects Section */}
      <section id="projetos" aria-labelledby="supervised-title" style={{ paddingTop: "20px" }}>
        <div className="requests-heading">
          <div>
            <p className="faculty-eyebrow">ORIENTAÇÃO</p>
            <h2 id="supervised-title">Projetos sob sua Responsabilidade</h2>
          </div>
          <span className="request-count">{data.supervisedProjects.length} ativos</span>
        </div>
        <div className="supervised-grid">
          {data.supervisedProjects.map((project) => (
            <article className="supervised-card" key={project.id}>
              <div className="supervised-meta">
                <span>{project.id} · {project.semester}</span>
                <span className="status-pill" style={{ backgroundColor: "#eef5fa", color: "#0071b6" }}>
                  {project.status}
                </span>
              </div>
              <h3>{project.title}</h3>
              <p style={{ margin: "0 0 8px", fontSize: "11px", color: "var(--muted)" }}>Equipe de alunos:</p>
              <ul className="team-list">
                {project.team.map((member) => (
                  <li className="team-pill" key={member}>{member}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* Hours Overview Section */}
      <section className="hours-overview" id="horas" aria-label="Resumo de horas" style={{ marginTop: "40px" }}>
        <div>
          <span className="hours-label">Solicitações aguardando</span>
          <strong>{hoursSummary.pendingRequestsCount}</strong>
        </div>
        <div>
          <span className="hours-label">Horas em análise</span>
          <strong>{hoursSummary.pendingHours} <small>h</small></strong>
        </div>
        <div>
          <span className="hours-label">Horas validadas / aprovadas</span>
          <strong style={{ color: "#137333" }}>{hoursSummary.approvedHours} <small>h</small></strong>
        </div>
        <p>Cálculo interativo e atualização automática; dados integrados com a camada mock do contrato BE-014.</p>
      </section>

      {/* Requests Review Section */}
      <section className="requests-section" id="solicitacoes" aria-labelledby="requests-title">
        <div className="requests-heading">
          <div>
            <p className="faculty-eyebrow">REVISÃO</p>
            <h2 id="requests-title">Solicitações de Projeto</h2>
          </div>
          <span className="request-count">{hoursSummary.pendingRequestsCount} aguardando</span>
        </div>
        <div className="request-list">
          {requests.map((request) => {
            const isDecided = request.status !== "Aguardando análise";
            return (
              <article className="request-card" key={request.id}>
                <div className="request-meta">
                  <span>{request.id}</span>
                  <span
                    className="status-pill"
                    style={
                      request.status === "Aprovado"
                        ? { backgroundColor: "#e6f4ea", color: "#137333" }
                        : request.status === "Ajuste solicitado / Reprovado"
                        ? { backgroundColor: "#fce8e6", color: "#c5221f" }
                        : {}
                    }
                  >
                    {request.status}
                  </span>
                </div>
                <h3>{request.project}</h3>
                <p className="student-line">
                  Solicitado por <strong>{request.student}</strong> · {request.submitted}
                </p>
                <div className="request-hours">
                  <span>Horas informadas</span>
                  <strong>{request.hours} h</strong>
                </div>

                {isDecided ? (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: "#f9f9f9",
                      fontSize: "12px",
                    }}
                  >
                    <strong>Decisão registrada:</strong> {request.status}
                    {request.reason && <p style={{ margin: "6px 0 0", color: "#555" }}>Motivo: {request.reason}</p>}
                  </div>
                ) : (
                  <form
                    className="decision-form"
                    onSubmit={(e) => handleDecisionSubmit(e, request.id)}
                  >
                    <label htmlFor={`decision-${request.id}`}>Decisão</label>
                    <select
                      id={`decision-${request.id}`}
                      name={`decision-${request.id}`}
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>
                        Selecione uma decisão
                      </option>
                      <option value="approved">Aprovar</option>
                      <option value="rejected">Solicitar ajuste / reprovar</option>
                    </select>

                    <label htmlFor={`reason-${request.id}`}>Motivo ou observação</label>
                    <textarea
                      id={`reason-${request.id}`}
                      name={`reason-${request.id}`}
                      rows={3}
                      placeholder="Descreva o motivo da decisão (obrigatório para reprovação)"
                    />
                    <button type="submit">Registrar decisão</button>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <footer className="faculty-footer">
        UniSENAI Sorocaba <span>•</span> Painel docente
      </footer>
    </main>
  );
}
