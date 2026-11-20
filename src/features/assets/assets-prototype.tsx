"use client";

import React, { useState } from "react";
import { Alert } from "@/components/alert";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import type {
  AssetsPrototypeState,
  IncidentSeverity,
  NotebookStatus,
} from "./assets-types";
import {
  checkinNotebook,
  checkoutNotebook,
  createRoomBooking,
  decideRoomBooking,
  getInitialAssetsPrototypeState,
  reportDamageIncident,
  resolveDamageIncident,
  togglePoCriterionValidation,
} from "./assets-service";

type ActiveTab = "NOTEBOOKS" | "ROOMS" | "INCIDENTS" | "PO_VALIDATION";

function getNotebookStatusBadge(status: NotebookStatus) {
  switch (status) {
    case "AVAILABLE":
      return <Badge variant="success">Disponível</Badge>;
    case "CHECKED_OUT":
      return <Badge variant="warning">Emprestado (Check-out)</Badge>;
    case "MAINTENANCE":
      return <Badge variant="neutral">Bloqueado • Manutenção</Badge>;
  }
}

export function AssetsPrototype() {
  const [state, setState] = useState<AssetsPrototypeState>(() =>
    getInitialAssetsPrototypeState()
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>("NOTEBOOKS");
  const [feedback, setFeedback] = useState<{
    variant: "info" | "success" | "warning" | "error";
    title: string;
    message: string;
  } | null>(null);

  // Estado do formulário de Check-out (US14)
  const [qrCodeInput, setQrCodeInput] = useState("PAT-NB-2027-001");
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerId, setBorrowerId] = useState("");
  const [borrowerRole, setBorrowerRole] = useState<"STUDENT" | "FACULTY">(
    "STUDENT"
  );
  const [purpose, setPurpose] = useState("");

  // Estado do formulário de Agendamento de Salas (US15)
  const [selectedRoomId, setSelectedRoomId] = useState("room-iot");
  const [bookingRequester, setBookingRequester] = useState("");
  const [bookingRequesterId, setBookingRequesterId] = useState("");
  const [bookingActivity, setBookingActivity] = useState("");
  const [bookingDate, setBookingDate] = useState("2026-11-26");
  const [bookingStart, setBookingStart] = useState("18:30");
  const [bookingEnd, setBookingEnd] = useState("21:00");

  // Estado do formulário de Ocorrências / Avarias (US15)
  const [incidentTargetType, setIncidentTargetType] = useState<
    "NOTEBOOK" | "ROOM"
  >("NOTEBOOK");
  const [incidentTargetId, setIncidentTargetId] = useState("nb-001");
  const [incidentReporter, setIncidentReporter] = useState("");
  const [incidentSeverity, setIncidentSeverity] =
    useState<IncidentSeverity>("ALTA");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [incidentPhotoRef, setIncidentPhotoRef] = useState(
    "evidencia-avaria-patrimonio.jpg"
  );

  const validatedCount = state.poChecklist.filter(
    (c) => c.validatedByPo
  ).length;
  const allPoValidated = validatedCount === state.poChecklist.length;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const next = checkoutNotebook(state, {
        qrCode: qrCodeInput,
        borrowerName,
        borrowerId,
        borrowerRole,
        purpose,
      });
      setState(next);
      setBorrowerName("");
      setBorrowerId("");
      setPurpose("");
      setFeedback({
        variant: "success",
        title: "Check-out registrado com sucesso (US14)",
        message: `Empréstimo do notebook ${qrCodeInput.toUpperCase()} vinculado a ${borrowerName} (${borrowerId}).`,
      });
    } catch (err) {
      setFeedback({
        variant: "error",
        title: "Não foi possível realizar o check-out",
        message:
          err instanceof Error ? err.message : "Erro ao validar empréstimo.",
      });
    }
  };

  const handleQuickCheckin = (qrCode: string) => {
    try {
      const next = checkinNotebook(state, {
        qrCode,
        returnConditionNote:
          "Devolvido no armário inteligente após conferência de QR Code.",
      });
      setState(next);
      setFeedback({
        variant: "success",
        title: "Check-in concluído (US14)",
        message: `O notebook ${qrCode} foi devolvido e já está disponível no inventário.`,
      });
    } catch (err) {
      setFeedback({
        variant: "error",
        title: "Erro no check-in",
        message:
          err instanceof Error ? err.message : "Falha ao registrar devolução.",
      });
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const next = createRoomBooking(state, {
        roomId: selectedRoomId,
        requesterName: bookingRequester,
        requesterId: bookingRequesterId,
        projectOrActivity: bookingActivity,
        dateIso: bookingDate,
        startTime: bookingStart,
        endTime: bookingEnd,
      });
      setState(next);
      setBookingRequester("");
      setBookingRequesterId("");
      setBookingActivity("");
      setFeedback({
        variant: "success",
        title: "Solicitação de reserva enviada (US15)",
        message:
          "O agendamento fora do horário foi validado sem conflitos e aguarda aprovação da coordenação.",
      });
    } catch (err) {
      setFeedback({
        variant: "error",
        title: "Conflito ou erro no agendamento de sala",
        message:
          err instanceof Error ? err.message : "Falha ao validar agendamento.",
      });
    }
  };

  const handleBookingDecision = (
    bookingId: string,
    decision: "APPROVED" | "REJECTED"
  ) => {
    try {
      const next = decideRoomBooking(
        state,
        bookingId,
        decision,
        decision === "APPROVED"
          ? "Autorizado pela coordenação de laboratórios."
          : "Indisponibilidade técnica do laboratório no turno solicitado."
      );
      setState(next);
      setFeedback({
        variant: decision === "APPROVED" ? "success" : "warning",
        title:
          decision === "APPROVED" ? "Reserva Aprovada" : "Reserva Recusada",
        message: `O status do agendamento foi atualizado para ${decision}.`,
      });
    } catch (err) {
      setFeedback({
        variant: "error",
        title: "Erro ao atualizar reserva",
        message: err instanceof Error ? err.message : "Operação inválida.",
      });
    }
  };

  const handleIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const next = reportDamageIncident(state, {
        targetType: incidentTargetType,
        targetId: incidentTargetId,
        reporterName: incidentReporter,
        severity: incidentSeverity,
        description: incidentDescription,
        photoEvidenceRef: incidentPhotoRef,
      });
      setState(next);
      setIncidentReporter("");
      setIncidentDescription("");
      setFeedback({
        variant:
          incidentSeverity === "ALTA" || incidentSeverity === "CRITICA"
            ? "warning"
            : "success",
        title: "Ocorrência patrimonial registrada (US15)",
        message:
          incidentSeverity === "ALTA" || incidentSeverity === "CRITICA"
            ? "Avaria grave registrada com evidência fotográfica. O ativo foi movido preventivamente para Manutenção."
            : "Ocorrência registrada com evidência fotográfica no histórico do ativo.",
      });
    } catch (err) {
      setFeedback({
        variant: "error",
        title: "Erro ao registrar avaria",
        message:
          err instanceof Error ? err.message : "Dados de ocorrência inválidos.",
      });
    }
  };

  const handleResolveIncident = (incidentId: string) => {
    try {
      const next = resolveDamageIncident(
        state,
        incidentId,
        "Reparo concluído pela equipe de suporte e ativo liberado após testes."
      );
      setState(next);
      setFeedback({
        variant: "success",
        title: "Ocorrência resolvida (US15)",
        message:
          "O reparo foi documentado e o patrimônio voltou ao status Disponível.",
      });
    } catch (err) {
      setFeedback({
        variant: "error",
        title: "Erro ao resolver ocorrência",
        message:
          err instanceof Error ? err.message : "Falha na resolução da avaria.",
      });
    }
  };

  return (
    <div className="proposal-form">
      {/* Cabeçalho do Protótipo FE-023 / PG-019 */}
      <header className="proposal-header">
        <div className="proposal-header-main">
          <p className="eyebrow">
            Protótipo Fase 2 (2027.1) • Gestão Patrimonial (FE-023 / PG-019)
          </p>
          <h1>Inventário de Notebooks, Salas e Ocorrências</h1>
          <p className="proposal-lead">
            Protótipo navegável de alta fidelidade funcional para validação do
            Product Owner (PO), cobrindo empréstimos por QR Code (US14),
            reserva de laboratórios fora do horário e relato de avarias (US15).
          </p>
        </div>

        <div className="draft-status-bar" aria-live="polite">
          <Badge variant={allPoValidated ? "success" : "warning"} size="sm">
            {allPoValidated
              ? "Protótipo Validado pelo PO (5/5)"
              : `Validação do PO: ${validatedCount}/${state.poChecklist.length}`}
          </Badge>
          <span className="char-counter">
            Épico: <strong>EP05-PAT</strong> • Release Alvo: 2027.1
          </span>
        </div>
      </header>

      {/* Aviso de Governança de Protótipo (Fase 2 / PG-019) */}
      <Alert
        variant="info"
        title="Ambiente de Prototipação e Homologação com o PO (Fase 2 • 2027.1)"
      >
        Este módulo integra o backlog futuro (<strong>PG-019</strong>:
        refinamento das <code>US14</code> e <code>US15</code> para 2027.1). As
        operações abaixo executam em memória com validação completa de regras
        de negócio, sem persistência em produção.
      </Alert>

      {feedback ? (
        <Alert
          variant={feedback.variant}
          title={feedback.title}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      ) : null}

      {/* Navegação por Abas Acessível */}
      <nav
        className="form-fieldset"
        aria-label="Seções do Protótipo de Patrimônio"
      >
        <div className="draft-buttons" role="tablist">
          <Button
            type="button"
            role="tab"
            aria-selected={activeTab === "NOTEBOOKS"}
            variant={activeTab === "NOTEBOOKS" ? "primary" : "outline"}
            onClick={() => setActiveTab("NOTEBOOKS")}
          >
            1. Notebooks & QR Code (US14)
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={activeTab === "ROOMS"}
            variant={activeTab === "ROOMS" ? "primary" : "outline"}
            onClick={() => setActiveTab("ROOMS")}
          >
            2. Salas Fora do Horário (US15)
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={activeTab === "INCIDENTS"}
            variant={activeTab === "INCIDENTS" ? "primary" : "outline"}
            onClick={() => setActiveTab("INCIDENTS")}
          >
            3. Avarias & Ocorrências (US15)
          </Button>
          <Button
            type="button"
            role="tab"
            aria-selected={activeTab === "PO_VALIDATION"}
            variant={activeTab === "PO_VALIDATION" ? "primary" : "outline"}
            onClick={() => setActiveTab("PO_VALIDATION")}
          >
            4. Termo de Validação do PO ({validatedCount}/
            {state.poChecklist.length})
          </Button>
        </div>
      </nav>

      {/* ABA 1: INVENTÁRIO DE NOTEBOOKS & QR CODE (US14) */}
      {activeTab === "NOTEBOOKS" ? (
        <section
          className="proposal-form"
          aria-labelledby="tab-notebooks-heading"
        >
          <div className="form-fieldset">
            <div className="fieldset-header-row">
              <div>
                <h2 id="tab-notebooks-heading" className="fieldset-legend">
                  Inventário de Notebooks com QR Code (US14)
                </h2>
                <p className="fieldset-hint">
                  Controle de disponibilidade em tempo real, check-out por
                  leitura de etiqueta QR e check-in com histórico auditável.
                </p>
              </div>
              <Badge variant="neutral">
                Total: {state.notebooks.length} equipamentos
              </Badge>
            </div>

            <div className="team-members-list">
              {state.notebooks.map((nb) => (
                <article
                  key={nb.assetId}
                  className="team-member-card"
                  aria-label={`Notebook ${nb.qrCode}`}
                >
                  <div className="member-card-header">
                    <div>
                      <strong className="member-number">
                        {nb.qrCode} — {nb.model}
                      </strong>
                      <p className="form-helper">
                        Patrimônio: <code>{nb.patrimonyNumber}</code> • Série:{" "}
                        <code>{nb.serialNumber}</code> • Local: {nb.location}
                      </p>
                    </div>
                    <div className="draft-buttons">
                      {getNotebookStatusBadge(nb.status)}
                      {nb.status === "AVAILABLE" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setQrCodeInput(nb.qrCode)}
                        >
                          Selecionar QR Code
                        </Button>
                      ) : null}
                      {nb.status === "CHECKED_OUT" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleQuickCheckin(nb.qrCode)}
                        >
                          Registrar Check-in (Devolução)
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {nb.currentBorrowerName ? (
                    <p className="form-helper">
                      <strong>Responsável atual:</strong>{" "}
                      {nb.currentBorrowerName} ({nb.currentBorrowerId})
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>

          <form onSubmit={handleCheckoutSubmit} className="form-fieldset">
            <h3 className="fieldset-legend">
              Novo Empréstimo (Check-out por QR Code)
            </h3>
            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="nb-qr-input" className="form-label">
                  Etiqueta QR Code do Notebook{" "}
                  <span className="required-indicator">*</span>
                </label>
                <input
                  id="nb-qr-input"
                  type="text"
                  className="form-input"
                  value={qrCodeInput}
                  onChange={(e) => setQrCodeInput(e.target.value)}
                  placeholder="Ex.: PAT-NB-2027-001"
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label htmlFor="nb-role-select" className="form-label">
                  Perfil do Solicitante
                </label>
                <select
                  id="nb-role-select"
                  className="form-select"
                  value={borrowerRole}
                  onChange={(e) =>
                    setBorrowerRole(e.target.value as "STUDENT" | "FACULTY")
                  }
                >
                  <option value="STUDENT">Discente (Aluno Matriculado)</option>
                  <option value="FACULTY">Docente / Pesquisador</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="nb-borrower-name" className="form-label">
                  Nome do Responsável{" "}
                  <span className="required-indicator">*</span>
                </label>
                <input
                  id="nb-borrower-name"
                  type="text"
                  className="form-input"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="Ex.: Matheus Henrique Koop Boff"
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label htmlFor="nb-borrower-id" className="form-label">
                  RA / Matrícula Institucional{" "}
                  <span className="required-indicator">*</span>
                </label>
                <input
                  id="nb-borrower-id"
                  type="text"
                  className="form-input"
                  value={borrowerId}
                  onChange={(e) => setBorrowerId(e.target.value)}
                  placeholder="Ex.: RA-20261001"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="nb-purpose" className="form-label">
                Finalidade Acadêmica / Laboratório{" "}
                <span className="required-indicator">*</span>
              </label>
              <input
                id="nb-purpose"
                type="text"
                className="form-input"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Ex.: Desenvolvimento e testes do protótipo de PI no Bloco C"
                required
              />
            </div>

            <div className="actions-right">
              <Button type="submit" variant="primary">
                Confirmar Check-out de Notebook
              </Button>
            </div>
          </form>

          <div className="form-fieldset">
            <h3 className="fieldset-legend">
              Histórico de Empréstimos e Responsáveis ({state.loans.length})
            </h3>
            <div className="team-members-list">
              {state.loans.map((loan) => (
                <div key={loan.loanId} className="team-member-card">
                  <div className="member-card-header">
                    <strong>
                      {loan.qrCode} • {loan.borrowerName} ({loan.borrowerId})
                    </strong>
                    <Badge
                      variant={loan.checkedInAtIso ? "success" : "warning"}
                    >
                      {loan.checkedInAtIso ? "Devolvido" : "Em Uso"}
                    </Badge>
                  </div>
                  <p className="form-helper">
                    <strong>Finalidade:</strong> {loan.purpose}
                  </p>
                  <p className="form-helper">
                    Retirada:{" "}
                    {new Date(loan.checkedOutAtIso).toLocaleString("pt-BR")}
                    {loan.checkedInAtIso
                      ? ` • Devolução: ${new Date(loan.checkedInAtIso).toLocaleString("pt-BR")}`
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ABA 2: AGENDAMENTO DE SALAS FORA DO HORÁRIO (US15) */}
      {activeTab === "ROOMS" ? (
        <section className="proposal-form" aria-labelledby="tab-rooms-heading">
          <form onSubmit={handleBookingSubmit} className="form-fieldset">
            <h2 id="tab-rooms-heading" className="fieldset-legend">
              Solicitar Reserva de Sala / Laboratório Fora do Horário (US15)
            </h2>
            <p className="fieldset-hint">
              O sistema verifica automaticamente conflitos de horário na mesma
              sala e exige aprovação da coordenação.
            </p>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="room-select" className="form-label">
                  Laboratório / Espaço{" "}
                  <span className="required-indicator">*</span>
                </label>
                <select
                  id="room-select"
                  className="form-select"
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                >
                  {state.rooms.map((room) => (
                    <option key={room.roomId} value={room.roomId}>
                      {room.code} — {room.name} (Cap.: {room.capacity} • Janela:{" "}
                      {room.allowedAfterHoursWindow})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group flex-1">
                <label htmlFor="booking-date" className="form-label">
                  Data da Reserva <span className="required-indicator">*</span>
                </label>
                <input
                  id="booking-date"
                  type="date"
                  className="form-input"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="booking-start" className="form-label">
                  Horário de Início{" "}
                  <span className="required-indicator">*</span>
                </label>
                <input
                  id="booking-start"
                  type="time"
                  className="form-input"
                  value={bookingStart}
                  onChange={(e) => setBookingStart(e.target.value)}
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label htmlFor="booking-end" className="form-label">
                  Horário de Término{" "}
                  <span className="required-indicator">*</span>
                </label>
                <input
                  id="booking-end"
                  type="time"
                  className="form-input"
                  value={bookingEnd}
                  onChange={(e) => setBookingEnd(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="booking-requester" className="form-label">
                  Responsável pela Solicitação{" "}
                  <span className="required-indicator">*</span>
                </label>
                <input
                  id="booking-requester"
                  type="text"
                  className="form-input"
                  value={bookingRequester}
                  onChange={(e) => setBookingRequester(e.target.value)}
                  placeholder="Nome completo do aluno líder ou docente"
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label htmlFor="booking-requester-id" className="form-label">
                  RA / Matrícula <span className="required-indicator">*</span>
                </label>
                <input
                  id="booking-requester-id"
                  type="text"
                  className="form-input"
                  value={bookingRequesterId}
                  onChange={(e) => setBookingRequesterId(e.target.value)}
                  placeholder="Ex.: RA-20261001"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="booking-activity" className="form-label">
                Projeto / Atividade Planejada{" "}
                <span className="required-indicator">*</span>
              </label>
              <input
                id="booking-activity"
                type="text"
                className="form-input"
                value={bookingActivity}
                onChange={(e) => setBookingActivity(e.target.value)}
                placeholder="Ex.: Ensaio de integração de sensores do PI-2026-014"
                required
              />
            </div>

            <div className="actions-right">
              <Button type="submit" variant="primary">
                Solicitar Agendamento de Laboratório
              </Button>
            </div>
          </form>

          <div className="form-fieldset">
            <h3 className="fieldset-legend">
              Agenda de Reservas e Aprovação da Coordenação (
              {state.bookings.length})
            </h3>
            <div className="team-members-list">
              {state.bookings.map((bk) => (
                <article key={bk.bookingId} className="team-member-card">
                  <div className="member-card-header">
                    <div>
                      <strong className="member-number">
                        {bk.roomName} • {bk.dateIso} ({bk.startTime} às{" "}
                        {bk.endTime})
                      </strong>
                      <p className="form-helper">
                        Solicitante: {bk.requesterName} ({bk.requesterId}) •{" "}
                        {bk.projectOrActivity}
                      </p>
                    </div>
                    <div className="draft-buttons">
                      <Badge
                        variant={
                          bk.status === "APPROVED"
                            ? "success"
                            : bk.status === "REJECTED"
                              ? "neutral"
                              : "warning"
                        }
                      >
                        {bk.status === "APPROVED" && "Aprovada"}
                        {bk.status === "PENDING_APPROVAL" &&
                          "Aguardando Coordenação"}
                        {bk.status === "REJECTED" && "Recusada"}
                      </Badge>
                      {bk.status === "PENDING_APPROVAL" ? (
                        <>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              handleBookingDecision(bk.bookingId, "APPROVED")
                            }
                          >
                            Aprovar Reserva
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleBookingDecision(bk.bookingId, "REJECTED")
                            }
                          >
                            Recusar
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {bk.reviewerNote ? (
                    <p className="form-helper">
                      <strong>Parecer:</strong> {bk.reviewerNote}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ABA 3: GESTÃO DE OCORRÊNCIAS E AVARIAS (US15) */}
      {activeTab === "INCIDENTS" ? (
        <section
          className="proposal-form"
          aria-labelledby="tab-incidents-heading"
        >
          <form onSubmit={handleIncidentSubmit} className="form-fieldset">
            <h2 id="tab-incidents-heading" className="fieldset-legend">
              Registrar Avaria Física ou Ocorrência Patrimonial (US15)
            </h2>
            <p className="fieldset-hint">
              Avarias classificadas como <strong>Alta</strong> ou{" "}
              <strong>Crítica</strong> movem automaticamente o notebook afetado
              para o status de <strong>Manutenção</strong> até sua resolução.
            </p>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="inc-target-type" className="form-label">
                  Tipo de Patrimônio
                </label>
                <select
                  id="inc-target-type"
                  className="form-select"
                  value={incidentTargetType}
                  onChange={(e) => {
                    const nextType = e.target.value as "NOTEBOOK" | "ROOM";
                    setIncidentTargetType(nextType);
                    setIncidentTargetId(
                      nextType === "NOTEBOOK"
                        ? state.notebooks[0]?.assetId || "nb-001"
                        : state.rooms[0]?.roomId || "room-iot"
                    );
                  }}
                >
                  <option value="NOTEBOOK">Notebook do Inventário</option>
                  <option value="ROOM">Sala / Laboratório</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label htmlFor="inc-target-id" className="form-label">
                  Ativo Afetado <span className="required-indicator">*</span>
                </label>
                <select
                  id="inc-target-id"
                  className="form-select"
                  value={incidentTargetId}
                  onChange={(e) => setIncidentTargetId(e.target.value)}
                >
                  {incidentTargetType === "NOTEBOOK"
                    ? state.notebooks.map((nb) => (
                        <option key={nb.assetId} value={nb.assetId}>
                          {nb.qrCode} — {nb.model}
                        </option>
                      ))
                    : state.rooms.map((rm) => (
                        <option key={rm.roomId} value={rm.roomId}>
                          {rm.code} — {rm.name}
                        </option>
                      ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="inc-reporter" className="form-label">
                  Relatado por <span className="required-indicator">*</span>
                </label>
                <input
                  id="inc-reporter"
                  type="text"
                  className="form-input"
                  value={incidentReporter}
                  onChange={(e) => setIncidentReporter(e.target.value)}
                  placeholder="Nome do docente, técnico ou aluno"
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor="inc-severity" className="form-label">
                  Severidade da Avaria
                </label>
                <select
                  id="inc-severity"
                  className="form-select"
                  value={incidentSeverity}
                  onChange={(e) =>
                    setIncidentSeverity(e.target.value as IncidentSeverity)
                  }
                >
                  <option value="BAIXA">Baixa (Cosmética / Sem impacto)</option>
                  <option value="MEDIA">Média (Desgaste parcial)</option>
                  <option value="ALTA">
                    Alta (Bloqueia empréstimo para manutenção)
                  </option>
                  <option value="CRITICA">
                    Crítica (Inoperante • Quarentena imediata)
                  </option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="inc-desc" className="form-label">
                Descrição Técnica da Avaria{" "}
                <span className="required-indicator">*</span>
              </label>
              <input
                id="inc-desc"
                type="text"
                className="form-input"
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                placeholder="Descreva o defeito físico ou ocorrência verificada (mínimo 10 caracteres)"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="inc-photo" className="form-label">
                Arquivo de Evidência Fotográfica{" "}
                <span className="required-indicator">*</span>
              </label>
              <input
                id="inc-photo"
                type="text"
                className="form-input"
                value={incidentPhotoRef}
                onChange={(e) => setIncidentPhotoRef(e.target.value)}
                placeholder="Ex.: foto-avaria-teclado-nb001.jpg"
                required
              />
            </div>

            <div className="actions-right">
              <Button type="submit" variant="primary">
                Registrar Ocorrência Patrimonial
              </Button>
            </div>
          </form>

          <div className="form-fieldset">
            <h3 className="fieldset-legend">
              Histórico de Ocorrências e Resolução ({state.incidents.length})
            </h3>
            <div className="team-members-list">
              {state.incidents.map((inc) => (
                <article key={inc.incidentId} className="team-member-card">
                  <div className="member-card-header">
                    <div>
                      <strong className="member-number">
                        {inc.targetLabel} • Severidade: {inc.severity}
                      </strong>
                      <p className="form-helper">
                        Relatado por {inc.reporterName} em{" "}
                        {new Date(inc.createdAtIso).toLocaleString("pt-BR")} •
                        Evidência: <code>{inc.photoEvidenceRef}</code>
                      </p>
                    </div>
                    <div className="draft-buttons">
                      <Badge
                        variant={
                          inc.status === "RESOLVED" ? "success" : "warning"
                        }
                      >
                        {inc.status === "RESOLVED"
                          ? "Resolvida"
                          : "Em Manutenção / Aberta"}
                      </Badge>
                      {inc.status !== "RESOLVED" ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleResolveIncident(inc.incidentId)}
                        >
                          Concluir Reparo e Liberar Ativo
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <p className="form-helper">
                    <strong>Descrição:</strong> {inc.description}
                  </p>
                  {inc.resolutionNote ? (
                    <p className="form-helper">
                      <strong>Resolução:</strong> {inc.resolutionNote}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ABA 4: CHECKLIST DE VALIDAÇÃO DO PO (FE-023 / PG-019) */}
      {activeTab === "PO_VALIDATION" ? (
        <section
          className="form-fieldset"
          aria-labelledby="tab-po-validation-heading"
        >
          <div className="fieldset-header-row">
            <div>
              <h2 id="tab-po-validation-heading" className="fieldset-legend">
                Matriz de Validação do Product Owner (FE-023 • PG-019)
              </h2>
              <p className="fieldset-hint">
                Critérios funcionais consolidados para homologação do protótipo
                de Gestão Patrimonial rumo à Fase 2 (2027.1).
              </p>
            </div>
            <Badge variant={allPoValidated ? "success" : "warning"}>
              {validatedCount} de {state.poChecklist.length} critérios
              homologados
            </Badge>
          </div>

          <div className="team-members-list">
            {state.poChecklist.map((item) => (
              <div key={item.criterionId} className="team-member-card">
                <div className="member-card-header">
                  <div>
                    <strong className="member-number">
                      [{item.criterionId} • {item.userStoryRef}] {item.title}
                    </strong>
                    <p className="form-helper">{item.description}</p>
                  </div>
                  <Button
                    type="button"
                    variant={item.validatedByPo ? "secondary" : "outline"}
                    size="sm"
                    onClick={() =>
                      setState((prev) =>
                        togglePoCriterionValidation(prev, item.criterionId)
                      )
                    }
                  >
                    {item.validatedByPo
                      ? "✓ Validado pelo PO"
                      : "Marcar como Validado"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
