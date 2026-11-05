"use client";

import React, { useState } from "react";
import type { Team, TeamMember } from "./types";
import {
  INITIAL_TEAM_STATE,
  inviteMember,
  acceptInvitation,
  rejectInvitation,
  removeMemberWithJustification,
  requestParticipation,
  approveParticipationRequest,
  denyParticipationRequest,
} from "./team-service";

export function TeamManagement() {
  const [team, setTeam] = useState<Team>(INITIAL_TEAM_STATE);

  // Estados para Solicitação de Participação (Fluxo Oficial do Aluno)
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentRa, setStudentRa] = useState("");
  const [hasExistingPi, setHasExistingPi] = useState(false);

  // Estados para Convites
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  // Feedback geral
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Remoção de integrante com justificativa obrigatória pelo docente
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [removalJustification, setRemovalJustification] = useState("");

  // Negação de solicitação com justificativa
  const [denyingRequestId, setDenyingRequestId] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  /* -------------------------------------------------------------
     Ações do Fluxo Oficial (Caderno do PO - 22/10/2026):
     ------------------------------------------------------------- */
  const handleRequestParticipation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const result = requestParticipation(team, {
      studentName,
      studentEmail,
      studentRa,
      activePiCount: hasExistingPi ? 1 : 0,
    });

    if (result.success && result.team) {
      setTeam(result.team);
      setFeedback({ type: "success", text: result.message });
      setStudentName("");
      setStudentEmail("");
      setStudentRa("");
      setHasExistingPi(false);
    } else {
      setFeedback({ type: "error", text: result.message });
    }
    setIsSubmitting(false);
  };

  const handleApproveRequest = (requestId: string) => {
    setFeedback(null);
    const result = approveParticipationRequest(team, requestId);
    if (result.success && result.team) {
      setTeam(result.team);
      setFeedback({ type: "success", text: result.message });
    } else {
      setFeedback({ type: "error", text: result.message });
    }
  };

  const handleConfirmDeny = (requestId: string) => {
    if (!denyReason.trim()) {
      setFeedback({
        type: "error",
        text: "Por favor, preencha o motivo da negação da solicitação de vaga.",
      });
      return;
    }

    setFeedback(null);
    const result = denyParticipationRequest(team, requestId, denyReason);
    if (result.success && result.team) {
      setTeam(result.team);
      setFeedback({ type: "success", text: result.message });
      setDenyingRequestId(null);
      setDenyReason("");
    } else {
      setFeedback({ type: "error", text: result.message });
    }
  };

  const confirmRemove = () => {
    if (!memberToRemove) return;
    if (!removalJustification.trim() || removalJustification.trim().length < 5) {
      setFeedback({
        type: "error",
        text: "A remoção de integrantes pelo docente exige justificativa obrigatória com no mínimo 5 caracteres.",
      });
      return;
    }

    setFeedback(null);
    const result = removeMemberWithJustification(team, {
      memberId: memberToRemove.id,
      justification: removalJustification,
    });

    if (result.success && result.team) {
      setTeam(result.team);
      setFeedback({ type: "success", text: result.message });
      setMemberToRemove(null);
      setRemovalJustification("");
    } else {
      setFeedback({ type: "error", text: result.message });
    }
  };

  /* -------------------------------------------------------------
     Ações do Fluxo Complementar de Convites:
     ------------------------------------------------------------- */
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    const result = inviteMember(team, inviteName, inviteEmail);
    if (result.success && result.team) {
      setTeam(result.team);
      setFeedback({ type: "success", text: result.message });
      setInviteName("");
      setInviteEmail("");
    } else {
      setFeedback({ type: "error", text: result.message });
    }
    setIsSubmitting(false);
  };

  const handleAcceptInvite = (invitationId: string) => {
    setFeedback(null);
    const result = acceptInvitation(team, invitationId);
    if (result.success && result.team) {
      setTeam(result.team);
      setFeedback({ type: "success", text: result.message });
    } else {
      setFeedback({ type: "error", text: result.message });
    }
  };

  const handleRejectInvite = (invitationId: string) => {
    setFeedback(null);
    const result = rejectInvitation(team, invitationId);
    if (result.success && result.team) {
      setTeam(result.team);
      setFeedback({ type: "success", text: result.message });
    } else {
      setFeedback({ type: "error", text: result.message });
    }
  };

  const pendingRequests = team.participationRequests.filter((r) => r.status === "PENDING");
  const pendingInvitations = team.invitations.filter((i) => i.status === "PENDING");

  return (
    <div className="team-container">
      {/* Banner da Equipe */}
      <section className="team-banner" aria-labelledby="team-title">
        <div className="team-banner-header">
          <div>
            <div className="team-badges-row">
              <span className="team-term-badge">{team.academicTerm}</span>
              <span className="team-status-badge">{team.status}</span>
              {team.isRegistrationPeriodOpen ? (
                <span className="team-reg-badge reg-open">Inscrições Abertas</span>
              ) : (
                <span className="team-reg-badge reg-closed">Inscrições Encerradas</span>
              )}
            </div>
            <h1 id="team-title" className="team-title">
              {team.name}
            </h1>
            <p className="team-project-subtitle">
              <strong>Projeto:</strong> {team.projectTitle}
            </p>
            <p className="team-teacher-info">
              <strong>Docente:</strong> {team.responsibleTeacher}
            </p>
          </div>
          <div className="team-stats-box" aria-label="Estatísticas da equipe">
            <span className="team-stat-value">
              {team.members.length} / {team.maxMembers}
            </span>
            <span className="team-stat-label">Integrantes</span>
          </div>
        </div>
      </section>

      {/* Banner de Feedback Acessível */}
      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`team-alert ${
            feedback.type === "error" ? "team-alert-error" : "team-alert-success"
          }`}
        >
          <span className="team-alert-icon" aria-hidden="true">
            {feedback.type === "error" ? "⚠" : "✓"}
          </span>
          <span className="team-alert-text">{feedback.text}</span>
        </div>
      )}

      {/* SEÇÃO 1: Solicitações de Participação (Decisão Docente - Caderno PO) */}
      <section className="team-card" aria-labelledby="requests-heading">
        <header className="card-header">
          <div>
            <h2 id="requests-heading" className="card-title">
              Solicitações de Vaga no Projeto ({pendingRequests.length} pendentes)
            </h2>
            <p className="card-subtitle">
              Conforme o caderno oficial do PO, alunos solicitam participação e o docente responsável analisa a aprovação ou negação.
            </p>
          </div>
        </header>

        {pendingRequests.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma solicitação de participação pendente no momento.</p>
          </div>
        ) : (
          <ul className="requests-list" role="list">
            {pendingRequests.map((req) => (
              <li key={req.id} className="request-item">
                <div className="request-info">
                  <span className="request-name">{req.studentName}</span>
                  <span className="request-meta">
                    {req.studentEmail} • {req.studentRa} • Solicitado em {req.requestedAt}
                  </span>
                </div>
                <div className="request-actions">
                  <button
                    type="button"
                    onClick={() => handleApproveRequest(req.id)}
                    className="btn-action btn-approve"
                    aria-label={`Aprovar participação de ${req.studentName}`}
                  >
                    Aprovar Aluno
                  </button>
                  <button
                    type="button"
                    onClick={() => setDenyingRequestId(req.id)}
                    className="btn-action btn-deny"
                    aria-label={`Negar participação de ${req.studentName}`}
                  >
                    Negar Vaga
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modal / Campo inline para Justificativa de Negação de Vaga */}
      {denyingRequestId && (
        <section className="removal-modal-card" role="region" aria-label="Justificativa de negação">
          <h3 className="modal-title">Justificativa da Negação de Participação</h3>
          <p className="modal-description">
            Informe a razão da negação para registro institucional e feedback ao aluno:
          </p>
          <textarea
            className="form-textarea"
            rows={2}
            placeholder="Ex: Vagas preenchidas ou perfil do aluno incompatível com o escopo."
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
          />
          <div className="modal-actions-row">
            <button
              type="button"
              className="btn-action btn-deny"
              onClick={() => handleConfirmDeny(denyingRequestId)}
            >
              Confirmar Negação
            </button>
            <button
              type="button"
              className="btn-action btn-cancel"
              onClick={() => {
                setDenyingRequestId(null);
                setDenyReason("");
              }}
            >
              Cancelar
            </button>
          </div>
        </section>
      )}

      {/* SEÇÃO 2: Integrantes Atuais e Remoção com Justificativa */}
      <section className="team-card" aria-labelledby="members-heading">
        <header className="card-header">
          <h2 id="members-heading" className="card-title">
            Integrantes Ativos ({team.members.length})
          </h2>
          <p className="card-subtitle">
            Membros vinculados ao projeto de PI. Docentes podem remover integrantes com justificativa obrigatória.
          </p>
        </header>

        <ul className="members-list" role="list">
          {team.members.map((member) => (
            <li key={member.id} className="member-item">
              <div className="member-avatar" aria-hidden="true">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="member-details">
                <div className="member-name-row">
                  <span className="member-name">{member.name}</span>
                  <span
                    className={`member-role-badge ${
                      member.role === "Líder" ? "role-leader" : "role-member"
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
                <span className="member-email">{member.email}</span>
                <span className="member-joined">Vinculado desde: {member.joinedAt}</span>
              </div>
              <div className="member-actions">
                {member.role !== "Líder" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMemberToRemove(member);
                      setRemovalJustification("");
                    }}
                    className="btn-action btn-remove"
                    aria-label={`Remover ${member.name} da equipe`}
                  >
                    Remover
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Modal de Confirmação de Remoção com Justificativa Obrigatória */}
      {memberToRemove && (
        <section
          className="removal-modal-card"
          role="dialog"
          aria-labelledby="removal-modal-title"
          aria-modal="true"
        >
          <h3 id="removal-modal-title" className="modal-title">
            Confirmar Remoção de Integrante
          </h3>
          <p className="modal-description">
            Conforme regra do PO, a remoção de <strong>{memberToRemove.name}</strong> exige justificativa obrigatória registrada pelo docente:
          </p>
          <div className="form-group">
            <label htmlFor="removal-reason" className="form-label">
              Justificativa da Remoção (obrigatória) <span className="req">*</span>
            </label>
            <textarea
              id="removal-reason"
              className="form-textarea"
              rows={3}
              placeholder="Descreva o motivo da saída (ex.: desistência do estudante, remanejamento ou inatividade comprovada)."
              value={removalJustification}
              onChange={(e) => setRemovalJustification(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions-row">
            <button
              type="button"
              className="btn-action btn-remove-confirm"
              onClick={confirmRemove}
            >
              Confirmar Remoção com Justificativa
            </button>
            <button
              type="button"
              className="btn-action btn-cancel"
              onClick={() => {
                setMemberToRemove(null);
                setRemovalJustification("");
              }}
            >
              Cancelar
            </button>
          </div>
        </section>
      )}

      {/* SEÇÃO 3: Formulário do Aluno para Solicitar Participação */}
      <section className="team-card" aria-labelledby="request-form-heading">
        <header className="card-header">
          <h2 id="request-form-heading" className="card-title">
            Solicitar Vaga neste Projeto (Inscrição de Estudante)
          </h2>
          <p className="card-subtitle">
            Estudantes podem solicitar vaga respeitando o limite institucional de no máximo 1 Projeto Integrador ativo.
          </p>
        </header>

        <form onSubmit={handleRequestParticipation} className="team-form" noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="student-name" className="form-label">
                Nome Completo <span className="req">*</span>
              </label>
              <input
                id="student-name"
                type="text"
                required
                placeholder="Ex: Lucas Ferreira"
                className="form-input"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                disabled={isSubmitting || team.members.length >= team.maxMembers}
              />
            </div>

            <div className="form-group">
              <label htmlFor="student-email" className="form-label">
                E-mail Institucional <span className="req">*</span>
              </label>
              <input
                id="student-email"
                type="email"
                required
                placeholder="estudante@aluno.unisenai.edu.br"
                className="form-input"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                disabled={isSubmitting || team.members.length >= team.maxMembers}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="student-ra" className="form-label">
                Registro Acadêmico (RA) <span className="req">*</span>
              </label>
              <input
                id="student-ra"
                type="text"
                required
                placeholder="RA-2026-XXXX"
                className="form-input"
                value={studentRa}
                onChange={(e) => setStudentRa(e.target.value)}
                disabled={isSubmitting || team.members.length >= team.maxMembers}
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hasExistingPi}
                  onChange={(e) => setHasExistingPi(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span>Já possuo outro Projeto Integrador ativo neste semestre</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn-team-submit"
            disabled={isSubmitting || team.members.length >= team.maxMembers}
          >
            {isSubmitting ? "Enviando..." : "Solicitar Participação na Equipe"}
          </button>
        </form>
      </section>

      {/* SEÇÃO 4: Convites Enviados (Fluxo Complementar Mantido) */}
      <section className="team-card" aria-labelledby="invitations-heading">
        <header className="card-header">
          <h2 id="invitations-heading" className="card-title">
            Convites Diretos de Estudante ({pendingInvitations.length} pendentes)
          </h2>
          <p className="card-subtitle">
            Fluxo complementar entre estudantes da mesma turma com aceite ou recusa direta.
          </p>
        </header>

        {pendingInvitations.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum convite pendente emitido pela equipe.</p>
          </div>
        ) : (
          <ul className="invitations-list" role="list">
            {pendingInvitations.map((inv) => (
              <li key={inv.id} className="invitation-item">
                <div className="invitation-info">
                  <span className="invitation-name">{inv.name}</span>
                  <span className="invitation-meta">
                    {inv.email} • Enviado em {inv.sentAt}
                  </span>
                </div>
                <div className="invitation-actions">
                  <button
                    type="button"
                    onClick={() => handleAcceptInvite(inv.id)}
                    className="btn-action btn-accept"
                    aria-label={`Aceitar convite de ${inv.name}`}
                  >
                    Aceitar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectInvite(inv.id)}
                    className="btn-action btn-reject"
                    aria-label={`Recusar convite de ${inv.name}`}
                  >
                    Recusar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleInvite} className="team-form invite-form-bottom" noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="invite-name" className="form-label">
                Convidar Colega (Nome)
              </label>
              <input
                id="invite-name"
                type="text"
                placeholder="Nome do colega"
                className="form-input"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                disabled={isSubmitting || team.members.length >= team.maxMembers}
              />
            </div>
            <div className="form-group">
              <label htmlFor="invite-email" className="form-label">
                E-mail Institucional do Colega
              </label>
              <input
                id="invite-email"
                type="email"
                placeholder="colega@aluno.unisenai.edu.br"
                className="form-input"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isSubmitting || team.members.length >= team.maxMembers}
              />
            </div>
          </div>
          <button
            type="submit"
            className="btn-secondary-submit"
            disabled={isSubmitting || team.members.length >= team.maxMembers}
          >
            Enviar Convite Complementar
          </button>
        </form>
      </section>
    </div>
  );
}
