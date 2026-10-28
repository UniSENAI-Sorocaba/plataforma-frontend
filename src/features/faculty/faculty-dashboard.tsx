"use client";

import Link from "next/link";
import { useState } from "react";
import {
  calculateHoursSummary,
  INITIAL_FACULTY_REQUESTS,
  submitFacultyDecision,
} from "./faculty-service";
import type { ProjectRequest } from "./types";

export function FacultyDashboard() {
  const [requests, setRequests] = useState<ProjectRequest[]>(INITIAL_FACULTY_REQUESTS);
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
      <header className="faculty-header">
        <Link className="faculty-brand" href="/" aria-label="UniSENAI, início">
          <span className="faculty-brand-mark">U</span>
          <span>UniSENAI <small>ÁREA DOCENTE</small></span>
        </Link>
        <nav aria-label="Navegação docente" className="faculty-nav">
          <a className="selected" href="#solicitacoes">Solicitações</a>
          <a href="#horas">Horas</a>
        </nav>
        <span className="faculty-avatar" aria-label="Perfil docente">D</span>
      </header>

      <section className="faculty-intro" aria-labelledby="faculty-title">
        <p className="faculty-eyebrow">PAINEL DOCENTE</p>
        <h1 id="faculty-title">Acompanhe os projetos dos seus alunos.</h1>
        <p>Revise as solicitações, registre sua decisão e acompanhe as horas informadas.</p>
      </section>

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

      <section className="hours-overview" id="horas" aria-label="Resumo de horas">
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

      <section className="requests-section" id="solicitacoes" aria-labelledby="requests-title">
        <div className="requests-heading">
          <div>
            <p className="faculty-eyebrow">REVISÃO</p>
            <h2 id="requests-title">Solicitações de projeto</h2>
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
