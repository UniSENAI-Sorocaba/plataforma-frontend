"use client";

import React, { useState } from "react";
import type { Team, TeamMember } from "./types";
import {
  INITIAL_TEAM_STATE,
  inviteMember,
  acceptInvitation,
  rejectInvitation,
  removeMember,
} from "./team-service";

export function TeamManagement() {
  const [team, setTeam] = useState<Team>(INITIAL_TEAM_STATE);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAccept = (invitationId: string) => {
    setFeedback(null);
    const result = acceptInvitation(team, invitationId);
    if (result.success && result.team) {
      setTeam(result.team);
      setFeedback({ type: "success", text: result.message });
    } else {
      setFeedback({ type: "error", text: result.message });
    }
  };

  const handleReject = (invitationId: string) => {
    setFeedback(null);
    const result = rejectInvitation(team, invitationId);
    if (result.success && result.team) {
      setTeam(result.team);
      setFeedback({ type: "success", text: result.message });
    } else {
      setFeedback({ type: "error", text: result.message });
    }
  };

  const confirmRemove = () => {
    if (!memberToRemove) return;
    setFeedback(null);
    const result = removeMember(team, memberToRemove.id);
    if (result.success && result.team) {
      setTeam(result.team);
      setFeedback({ type: "success", text: result.message });
    } else {
      setFeedback({ type: "error", text: result.message });
    }
    setMemberToRemove(null);
  };

  const pendingInvitations = team.invitations.filter((i) => i.status === "PENDING");

  return (
    <div className="team-container">
      {/* Team header and summary */}
      <section className="team-banner" aria-labelledby="team-title">
        <div className="team-banner-header">
          <div>
            <span className="team-term-badge">{team.academicTerm}</span>
            <h1 id="team-title" className="team-title">
              {team.name}
            </h1>
            <p className="team-project-subtitle">
              <strong>Projeto:</strong> {team.projectTitle}
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

      {/* Accessible feedback banner */}
      {feedback && (
        <div
          role="alert"
          aria-live="polite"
          className={`feedback-alert feedback-${feedback.type}`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            className="feedback-close-btn"
            onClick={() => setFeedback(null)}
            aria-label="Fechar mensagem de aviso"
          >
            ×
          </button>
        </div>
      )}

      <div className="team-content-grid">
        {/* Left Column: Members List */}
        <div className="team-main-col">
          <section className="team-card" aria-labelledby="members-heading">
            <div className="card-header">
              <h2 id="members-heading" className="card-title">
                Integrantes da Equipe
              </h2>
              <span className="card-badge">{team.members.length} ativos</span>
            </div>

            <div className="members-list" role="list">
              {team.members.map((member) => (
                <article
                  key={member.id}
                  className="member-item"
                  role="listitem"
                  aria-labelledby={`member-name-${member.id}`}
                >
                  <div className="member-avatar" aria-hidden="true">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="member-info">
                    <div className="member-name-row">
                      <h3 id={`member-name-${member.id}`} className="member-name">
                        {member.name}
                      </h3>
                      <span
                        className={`role-badge ${
                          member.role === "Líder" ? "role-leader" : "role-member"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                    <p className="member-email">{member.email}</p>
                    <p className="member-joined">Entrou em: {member.joinedAt}</p>
                  </div>
                  <div className="member-actions">
                    {member.role !== "Líder" ? (
                      <button
                        type="button"
                        className="btn-danger-outline"
                        onClick={() => setMemberToRemove(member)}
                        aria-label={`Remover ${member.name} da equipe`}
                      >
                        Remover
                      </button>
                    ) : (
                      <span className="role-locked-hint">Liderança fixa</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Pending & Processed Invitations */}
          <section className="team-card" aria-labelledby="invitations-heading">
            <div className="card-header">
              <h2 id="invitations-heading" className="card-title">
                Histórico de Convites
              </h2>
              <span className="card-badge">
                {pendingInvitations.length} pendente(s)
              </span>
            </div>

            {team.invitations.length === 0 ? (
              <p className="empty-state">Nenhum convite emitido até o momento.</p>
            ) : (
              <div className="invitations-list" role="list">
                {team.invitations.map((inv) => (
                  <article
                    key={inv.id}
                    className="invitation-item"
                    role="listitem"
                    aria-labelledby={`inv-name-${inv.id}`}
                  >
                    <div className="inv-info">
                      <h3 id={`inv-name-${inv.id}`} className="inv-name">
                        {inv.name}
                      </h3>
                      <p className="inv-email">{inv.email}</p>
                      <p className="inv-date">Enviado em: {inv.sentAt}</p>
                    </div>
                    <div className="inv-status-actions">
                      <span
                        className={`status-pill status-${inv.status.toLowerCase()}`}
                      >
                        {inv.status === "PENDING"
                          ? "Aguardando Resposta"
                          : inv.status === "ACCEPTED"
                          ? "Aceito"
                          : "Recusado"}
                      </span>
                      {inv.status === "PENDING" && (
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="btn-success-small"
                            onClick={() => handleAccept(inv.id)}
                            aria-label={`Aceitar convite de ${inv.name}`}
                          >
                            Simular Aceite
                          </button>
                          <button
                            type="button"
                            className="btn-secondary-small"
                            onClick={() => handleReject(inv.id)}
                            aria-label={`Recusar convite de ${inv.name}`}
                          >
                            Recusar
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Invite Form & Rules */}
        <aside className="team-side-col">
          <section className="team-card" aria-labelledby="invite-heading">
            <h2 id="invite-heading" className="card-title">
              Convidar Integrante
            </h2>
            <p className="card-desc">
              Envie um convite para um colega da turma participar da sua equipe no
              Projeto Integrador.
            </p>

            <form onSubmit={handleInvite} className="team-form" noValidate>
              <div className="form-group">
                <label htmlFor="student-name" className="form-label">
                  Nome Completo <span className="req">*</span>
                </label>
                <input
                  id="student-name"
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  className="form-input"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  disabled={team.members.length >= team.maxMembers || isSubmitting}
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
                  placeholder="aluno@aluno.unisenai.edu.br"
                  className="form-input"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={team.members.length >= team.maxMembers || isSubmitting}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={team.members.length >= team.maxMembers || isSubmitting}
              >
                {isSubmitting ? "Enviando convite..." : "Enviar Convite"}
              </button>

              {team.members.length >= team.maxMembers && (
                <p className="field-hint text-warning" role="status">
                  Equipe completa. Para convidar novos membros, remova algum integrante.
                </p>
              )}
            </form>
          </section>

          {/* Integration Note */}
          <section className="integration-card" aria-label="Informações sobre integração">
            <h3 className="integration-title">Regras e Integração (FE-009 / BE-008)</h3>
            <ul className="rules-list">
              <li>Convites são verificados para evitar duplicidade de envio.</li>
              <li>O limite da equipe para este semestre é de até {team.maxMembers} estudantes.</li>
              <li>Apenas líderes e administradores podem convidar e gerenciar membros.</li>
              <li>
                A integração HTTP final está vinculada ao endpoint de convites da issue <code>BE-008</code> (SPEC-PI-001).
              </li>
            </ul>
          </section>
        </aside>
      </div>

      {/* Confirmation Modal for Member Removal */}
      {memberToRemove && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-remove-title"
        >
          <div className="modal-dialog">
            <h2 id="modal-remove-title" className="modal-title">
              Confirmar Remoção
            </h2>
            <p className="modal-body">
              Tem certeza de que deseja remover <strong>{memberToRemove.name}</strong> da
              equipe <em>{team.name}</em>?
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setMemberToRemove(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={confirmRemove}
                autoFocus
              >
                Sim, Remover Integrante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
