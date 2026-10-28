"use client";

import React, { useEffect, useState } from "react";
import { Alert } from "@/components/alert";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Textarea } from "@/components/textarea";
import {
  clearProposalDraft,
  formatDateTime,
  loadProposalDraft,
  saveProposalDraft,
} from "./draft-storage";
import type { ProposalFormData, ProposalModality, TeamMember, ValidationErrors } from "./types";
import {
  AVAILABLE_MODALITIES,
  FIELD_LIMITS,
  getInitialProposalData,
  ODS_LIST,
  validateProposal,
} from "./validation";

export function ProposalForm() {
  const [formData, setFormData] = useState<ProposalFormData>(getInitialProposalData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [draftNotice, setDraftNotice] = useState<{
    text: string;
    variant: "info" | "success" | "warning" | "error";
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [protocolNumber, setProtocolNumber] = useState<string | null>(null);

  // Recupera rascunho salvo após montagem no cliente
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft = loadProposalDraft();
      if (draft.hasDraft && draft.data) {
        setFormData(draft.data);
        setHasSavedDraft(true);
        setDraftNotice({
          variant: "info",
          text: `Rascunho recuperado automaticamente. Última alteração salva em ${formatDateTime(draft.savedAt)}.`,
        });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleFieldChange = <K extends keyof ProposalFormData>(field: K, value: ProposalFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleMemberChange = (index: number, key: keyof TeamMember, val: string) => {
    setFormData((prev) => {
      const updatedMembers = [...prev.teamMembers];
      updatedMembers[index] = { ...updatedMembers[index], [key]: val };
      return { ...prev, teamMembers: updatedMembers };
    });

    const errorKey = `member_${index}_${key}` as keyof ValidationErrors;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[errorKey];
        return copy;
      });
    }
  };

  const handleAddMember = () => {
    if (formData.teamMembers.length >= FIELD_LIMITS.MEMBERS_MAX) return;
    const newId = `member-${Date.now()}`;
    setFormData((prev) => ({
      ...prev,
      teamMembers: [...prev.teamMembers, { id: newId, name: "", email: "", ra: "" }],
    }));
  };

  const handleRemoveMember = (index: number) => {
    if (formData.teamMembers.length <= FIELD_LIMITS.MEMBERS_MIN) return;
    setFormData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index),
    }));
  };

  const handleToggleOds = (odsId: string) => {
    setFormData((prev) => {
      const exists = prev.ods.includes(odsId);
      const updatedOds = exists
        ? prev.ods.filter((id) => id !== odsId)
        : [...prev.ods, odsId];
      return { ...prev, ods: updatedOds };
    });

    if (errors.ods) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.ods;
        return copy;
      });
    }
  };

  const handleSaveDraft = () => {
    setIsSavingDraft(true);
    const result = saveProposalDraft(formData);
    setIsSavingDraft(false);

    if (result.success) {
      setHasSavedDraft(true);
      setDraftNotice({
        variant: "success",
        text: `Rascunho preservado com sucesso às ${formatDateTime(result.savedAt)}! Suas alterações estão seguras no navegador.`,
      });
    } else {
      setDraftNotice({
        variant: "error",
        text: result.error ?? "Não foi possível salvar o rascunho.",
      });
    }
  };

  const handleDiscardDraft = () => {
    if (window.confirm("Deseja realmente descartar este rascunho? Todos os dados não enviados serão perdidos.")) {
      clearProposalDraft();
      setFormData(getInitialProposalData());
      setErrors({});
      setHasSavedDraft(false);
      setDraftNotice({
        variant: "warning",
        text: "Rascunho descartado. O formulário foi redefinido.",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateProposal(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setDraftNotice({
        variant: "error",
        text: "Existem campos obrigatórios ou inválidos na proposta. Por favor, revise as marcações abaixo.",
      });

      // Foca no primeiro campo com erro
      const firstErrorKey = Object.keys(validation.errors)[0];
      if (firstErrorKey) {
        const element = document.getElementById(firstErrorKey);
        element?.focus();
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setIsSubmitting(true);
    // Simula submissão bem-sucedida para o backend (BE-007)
    setTimeout(() => {
      const generatedProtocol = `PI-SENAI-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      clearProposalDraft();
      setHasSavedDraft(false);
      setProtocolNumber(generatedProtocol);
      setSubmissionSuccess(true);
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 700);
  };

  const handleResetForNewSubmission = () => {
    setFormData(getInitialProposalData());
    setErrors({});
    setSubmissionSuccess(false);
    setProtocolNumber(null);
    setDraftNotice(null);
  };

  if (submissionSuccess) {
    return (
      <section className="proposal-success-card" aria-labelledby="success-title">
        <div className="success-icon" aria-hidden="true">✓</div>
        <h2 id="success-title">Proposta Submetida com Sucesso!</h2>
        <p className="success-subtitle">
          Sua proposta de Projeto Integrador foi enviada e validada de acordo com o edital vigente.
        </p>

        <div className="protocol-box">
          <span className="protocol-label">Número de Protocolo Institucional:</span>
          <strong className="protocol-value">{protocolNumber}</strong>
        </div>

        <div className="summary-section">
          <h3>Resumo da Proposta</h3>
          <p><strong>Título:</strong> {formData.title}</p>
          <p><strong>Modalidade:</strong> {AVAILABLE_MODALITIES.find((m) => m.value === formData.modality)?.label}</p>
          <p><strong>Tema:</strong> {formData.theme}</p>
          <p><strong>Integrantes:</strong> {formData.teamMembers.map((m) => m.name).join(", ")}</p>
        </div>

        <div className="success-actions">
          <Button variant="primary" onClick={handleResetForNewSubmission}>
            Submeter Outra Proposta
          </Button>
        </div>
      </section>
    );
  }

  return (
    <form className="proposal-form" onSubmit={handleSubmit} noValidate>
      <header className="proposal-header">
        <div className="proposal-header-main">
          <p className="eyebrow">Academic PI • FE-006</p>
          <h1 id="form-heading">Submissão de Proposta de Projeto Integrador</h1>
          <p className="proposal-lead">
            Preencha todos os campos obrigatórios. Você pode salvar um rascunho a qualquer momento e continuar depois.
          </p>
        </div>

        <div className="draft-status-bar" aria-live="polite">
          {hasSavedDraft ? (
            <Badge variant="warning">Rascunho Preservado</Badge>
          ) : (
            <Badge variant="neutral">Novo Formulário</Badge>
          )}
          <div className="draft-buttons">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              isLoading={isSavingDraft}
            >
              Salvar Rascunho
            </Button>
            {hasSavedDraft ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDiscardDraft}
              >
                Descartar Rascunho
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {draftNotice ? (
        <Alert
          variant={draftNotice.variant}
          onClose={() => setDraftNotice(null)}
          className="mb-6"
        >
          {draftNotice.text}
        </Alert>
      ) : null}

      {/* 1. DADOS BÁSICOS */}
      <fieldset className="form-fieldset">
        <legend className="fieldset-legend">1. Informações Básicas da Proposta</legend>

        <Input
          id="title"
          label="Título da Proposta"
          required
          maxLength={FIELD_LIMITS.TITLE_MAX}
          value={formData.title}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          error={errors.title}
          helperText={`Entre ${FIELD_LIMITS.TITLE_MIN} e ${FIELD_LIMITS.TITLE_MAX} caracteres.`}
          placeholder="Ex.: Sistema Inteligente para Otimização de Consumo Energético Industrial"
        />

        <div className="form-row">
          <Input
            id="theme"
            label="Tema / Área de Concentração"
            required
            value={formData.theme}
            onChange={(e) => handleFieldChange("theme", e.target.value)}
            error={errors.theme}
            placeholder="Ex.: Automação Industrial e IoT"
            className="flex-1"
          />

          <div className="form-group flex-1">
            <label htmlFor="modality" className="form-label">
              Modalidade
              <span className="required-indicator" aria-hidden="true"> *</span>
            </label>
            <select
              id="modality"
              className="form-select"
              value={formData.modality}
              onChange={(e) => handleFieldChange("modality", e.target.value as ProposalModality)}
            >
              {AVAILABLE_MODALITIES.map((mod) => (
                <option key={mod.value} value={mod.value}>
                  {mod.label}
                </option>
              ))}
            </select>
            {errors.modality ? (
              <span className="form-error" role="alert">
                {errors.modality}
              </span>
            ) : null}
          </div>
        </div>
      </fieldset>

      {/* 2. ESCOPO E DETALHAMENTO */}
      <fieldset className="form-fieldset">
        <legend className="fieldset-legend">2. Detalhamento e Justificativa Acadêmica</legend>

        <Textarea
          id="problemStatement"
          label="Problema a Resolver"
          required
          maxLength={FIELD_LIMITS.TEXT_MAX}
          currentLength={formData.problemStatement.length}
          value={formData.problemStatement}
          onChange={(e) => handleFieldChange("problemStatement", e.target.value)}
          error={errors.problemStatement}
          helperText={`Mínimo ${FIELD_LIMITS.TEXT_MIN} caracteres.`}
          placeholder="Descreva o contexto do problema, as dores identificadas e o impacto negativo da ausência de solução."
          rows={4}
        />

        <Textarea
          id="objectives"
          label="Objetivos (Gerais e Específicos)"
          required
          maxLength={FIELD_LIMITS.TEXT_MAX}
          currentLength={formData.objectives.length}
          value={formData.objectives}
          onChange={(e) => handleFieldChange("objectives", e.target.value)}
          error={errors.objectives}
          helperText={`Mínimo ${FIELD_LIMITS.TEXT_MIN} caracteres.`}
          placeholder="O que o projeto pretende atingir? Quais são as metas técnicas e entregáveis previstos?"
          rows={4}
        />

        <Textarea
          id="justification"
          label="Justificativa e Relevância"
          required
          maxLength={FIELD_LIMITS.TEXT_MAX}
          currentLength={formData.justification.length}
          value={formData.justification}
          onChange={(e) => handleFieldChange("justification", e.target.value)}
          error={errors.justification}
          helperText={`Mínimo ${FIELD_LIMITS.TEXT_MIN} caracteres.`}
          placeholder="Por que esta proposta é relevante para a indústria ou sociedade? Qual a viabilidade de execução?"
          rows={4}
        />
      </fieldset>

      {/* 3. ALINHAMENTO COM ODS */}
      <fieldset className="form-fieldset" aria-describedby={errors.ods ? "ods-error" : undefined}>
        <legend className="fieldset-legend">
          3. Objetivos de Desenvolvimento Sustentável (ODS)
          <span className="required-indicator" aria-hidden="true"> *</span>
        </legend>
        <p className="fieldset-hint">
          Selecione uma ou mais metas da Agenda 2030 relacionadas à sua proposta.
        </p>

        {errors.ods ? (
          <span id="ods-error" className="form-error mb-4" role="alert">
            {errors.ods}
          </span>
        ) : null}

        <div className="ods-grid" role="group" aria-label="Lista de Objetivos de Desenvolvimento Sustentável">
          {ODS_LIST.map((ods) => {
            const isChecked = formData.ods.includes(ods.id);
            return (
              <label
                key={ods.id}
                className={`ods-card ${isChecked ? "ods-card-selected" : ""}`}
              >
                <input
                  type="checkbox"
                  className="ods-checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleOds(ods.id)}
                  aria-label={`ODS ${ods.id}: ${ods.title}`}
                />
                <span className="ods-number">ODS {ods.id}</span>
                <span className="ods-title">{ods.title}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* 4. EQUIPE DO PROJETO */}
      <fieldset className="form-fieldset">
        <div className="fieldset-header-row">
          <legend className="fieldset-legend">
            4. Equipe do Projeto ({formData.teamMembers.length}/{FIELD_LIMITS.MEMBERS_MAX} alunos)
            <span className="required-indicator" aria-hidden="true"> *</span>
          </legend>

          {formData.teamMembers.length < FIELD_LIMITS.MEMBERS_MAX ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMember}
            >
              + Adicionar Integrante
            </Button>
          ) : null}
        </div>

        {errors.teamMembers ? (
          <span className="form-error mb-4" role="alert">
            {errors.teamMembers}
          </span>
        ) : null}

        <div className="team-members-list">
          {formData.teamMembers.map((member, idx) => (
            <div key={member.id} className="team-member-card">
              <div className="member-card-header">
                <span className="member-number">Integrante #{idx + 1}</span>
                {formData.teamMembers.length > FIELD_LIMITS.MEMBERS_MIN ? (
                  <button
                    type="button"
                    className="member-remove-btn"
                    onClick={() => handleRemoveMember(idx)}
                    aria-label={`Remover integrante #${idx + 1}`}
                  >
                    Remover
                  </button>
                ) : (
                  <Badge variant="neutral" size="sm">Líder / Autor</Badge>
                )}
              </div>

              <div className="member-fields-grid">
                <Input
                  id={`member_${idx}_name`}
                  label="Nome Completo"
                  required
                  value={member.name}
                  onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                  error={errors[`member_${idx}_name`]}
                  placeholder="Nome do aluno"
                />

                <Input
                  id={`member_${idx}_email`}
                  label="E-mail Institucional"
                  type="email"
                  required
                  value={member.email}
                  onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                  error={errors[`member_${idx}_email`]}
                  placeholder="aluno@senaisp.edu.br"
                />

                <Input
                  id={`member_${idx}_ra`}
                  label="Registro Acadêmico (RA)"
                  required
                  value={member.ra}
                  onChange={(e) => handleMemberChange(idx, "ra", e.target.value)}
                  error={errors[`member_${idx}_ra`]}
                  placeholder="Ex.: 202610482"
                />
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      {/* AÇÕES FINAIS */}
      <footer className="form-actions-footer">
        <div className="actions-left">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            isLoading={isSavingDraft}
          >
            Salvar Rascunho
          </Button>
        </div>

        <div className="actions-right">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
          >
            Submeter Proposta de PI
          </Button>
        </div>
      </footer>
    </form>
  );
}
