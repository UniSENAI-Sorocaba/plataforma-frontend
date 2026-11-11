"use client";

import React, { useRef, useState } from "react";
import { Alert } from "@/components/alert";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { ProgressBar } from "@/components/progress-bar";
import type {
  ConfirmedDeliverableRecord,
  DeliverableCandidateFile,
  DeliverableCategory,
  DeliverableUploadStage,
  PresignedUploadAuthorization,
  ProjectActorRole,
  ProjectEditingContext,
  UploadProgressSnapshot,
} from "./deliverable-types";
import {
  confirmDeliverableUpload,
  executePresignedUpload,
  getCategoryLabel,
  requestPresignedUploadUrl,
  UploadCanceledError,
} from "./deliverable-upload-client";
import {
  canActorModifyDeliverables,
  canActorViewDeliverables,
  computeSha256Hex,
  DEFAULT_UPLOAD_POLICY,
  formatBytes,
  validateDeliverableCandidate,
} from "./deliverable-validation";

const INITIAL_PROJECT_CONTEXT: ProjectEditingContext = {
  projectId: "PI-2026-014",
  projectTitle: "Monitoramento Preditivo de Motores Elétricos Industriais",
  semester: "2026.2",
  actorRole: "STUDENT_MEMBER",
  evaluationStarted: false,
  evaluationStartsAtIso: "2026-11-25T22:00:00.000Z",
};

const INITIAL_DELIVERABLES: ConfirmedDeliverableRecord[] = [
  {
    deliverableId: "deliv_m2k9p1_8f4a2c",
    projectId: "PI-2026-014",
    category: "RELATORIO_TECNICO",
    fileName: "relatorio-parcial-arquitetura-sensores.pdf",
    mimeType: "application/pdf",
    format: "PDF",
    sizeBytes: 1_482_910,
    sha256: "8f4a2c91e07b3d54a1198c6e4b2f901a77d3c5e8910b4a6c2d8e1f0a3b5c7d9e",
    objectKey:
      "private/academic-pi/PI-2026-014/deliverables/upl_init01/relatorio-parcial-arquitetura-sensores.pdf",
    correlationId: "corr_init_99481a",
    idempotencyKey: "idem_init_01",
    confirmedAtIso: "2026-10-28T14:20:00.000Z",
    status: "CONFIRMED",
    visibility: "PROJECT_MEMBERS_FACULTY_AND_ADMIN",
    photoPublicationStatus: "NOT_APPLICABLE",
    notes: "Entrega parcial contendo diagrama de blocos e especificação de telemetria.",
  },
];

interface SelectedArtifact {
  candidate: DeliverableCandidateFile;
  rawBytes: Uint8Array;
  sha256: string;
}

export function DeliverableUpload() {
  const [context, setContext] = useState<ProjectEditingContext>(
    INITIAL_PROJECT_CONTEXT
  );
  const [category, setCategory] =
    useState<DeliverableCategory>("RELATORIO_TECNICO");
  const [notes, setNotes] = useState("");
  const [selectedArtifact, setSelectedArtifact] =
    useState<SelectedArtifact | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [stage, setStage] = useState<DeliverableUploadStage>("IDLE");
  const [progress, setProgress] = useState<UploadProgressSnapshot>({
    stage: "IDLE",
    percentage: 0,
    uploadedBytes: 0,
    totalBytes: 0,
    message: "",
  });
  const [activeAuth, setActiveAuth] =
    useState<PresignedUploadAuthorization | null>(null);
  const [lastConfirmed, setLastConfirmed] =
    useState<ConfirmedDeliverableRecord | null>(null);
  const [deliverables, setDeliverables] =
    useState<ConfirmedDeliverableRecord[]>(INITIAL_DELIVERABLES);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    variant: "info" | "success" | "warning" | "error";
    title: string;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const canView = canActorViewDeliverables(context.actorRole);
  const modifyPermission = canActorModifyDeliverables(context);

  const prepareArtifact = async (
    candidate: DeliverableCandidateFile,
    rawBytes: Uint8Array
  ) => {
    setFeedbackBanner(null);
    setLastConfirmed(null);
    setActiveAuth(null);
    setStage("VALIDATING");

    const validation = validateDeliverableCandidate(
      candidate,
      context,
      DEFAULT_UPLOAD_POLICY
    );
    setValidationErrors(validation.errors);
    setValidationWarnings(validation.warnings);

    const sha256 =
      rawBytes.byteLength > 0 ? await computeSha256Hex(rawBytes) : "";

    setSelectedArtifact({
      candidate,
      rawBytes,
      sha256,
    });

    if (!validation.isValid) {
      setStage("ERROR");
    } else {
      setStage("IDLE");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawBytes = new Uint8Array(arrayBuffer);
    const headerBytes = rawBytes.slice(0, 16);

    const candidate: DeliverableCandidateFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      headerBytes,
    };

    await prepareArtifact(candidate, rawBytes);
  };

  const handleLoadSampleArtifact = async (
    sampleType: "PDF_VALID" | "IMAGE_VALID" | "INVALID_OVERSIZE"
  ) => {
    if (sampleType === "PDF_VALID") {
      // Assinatura %PDF-1.7 + conteúdo de demonstração
      const encoder = new TextEncoder();
      const rawBytes = encoder.encode(
        "%PDF-1.7\n1 0 obj\n<< /Title (Relatorio Final PI 2026.2) >>\nendobj\n%%EOF"
      );
      const candidate: DeliverableCandidateFile = {
        name: "relatorio-final-prototipo-iot.pdf",
        size: 2_845_120, // 2.71 MB simulados dentro do limite de 25 MB
        type: "application/pdf",
        headerBytes: rawBytes.slice(0, 16),
      };
      setCategory("RELATORIO_TECNICO");
      await prepareArtifact(candidate, rawBytes);
      return;
    }

    if (sampleType === "IMAGE_VALID") {
      // Assinatura PNG oficial: 89 50 4E 47 0D 0A 1A 0A
      const rawBytes = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52,
      ]);
      const candidate: DeliverableCandidateFile = {
        name: "bancada-teste-motor-weg.png",
        size: 1_920_512, // 1.83 MB dentro do limite de 10 MB para imagens
        type: "image/png",
        headerBytes: rawBytes.slice(0, 16),
      };
      setCategory("REGISTRO_FOTOGRAFICO");
      await prepareArtifact(candidate, rawBytes);
      return;
    }

    // INVALID_OVERSIZE: arquivo .exe renomeado e acima de 25 MB
    const rawBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
    const candidate: DeliverableCandidateFile = {
      name: "instalador-nao-autorizado.pdf",
      size: 32 * 1024 * 1024, // 32 MB (acima do limite de 25 MB)
      type: "application/pdf",
      headerBytes: rawBytes,
    };
    await prepareArtifact(candidate, rawBytes);
  };

  const handleStartUpload = async () => {
    if (!selectedArtifact) {
      return;
    }

    setFeedbackBanner(null);
    setLastConfirmed(null);

    const validation = validateDeliverableCandidate(
      selectedArtifact.candidate,
      context,
      DEFAULT_UPLOAD_POLICY
    );
    setValidationErrors(validation.errors);
    setValidationWarnings(validation.warnings);

    if (!validation.isValid || !validation.detectedFormat) {
      setStage("ERROR");
      return;
    }

    try {
      setStage("REQUESTING_URL");
      setProgress({
        stage: "REQUESTING_URL",
        percentage: 5,
        uploadedBytes: 0,
        totalBytes: selectedArtifact.candidate.size,
        message:
          "Solicitando URL S3 pré-assinada curta e restrita (TTL 15 min • BE-012)...",
      });

      const auth = requestPresignedUploadUrl(
        selectedArtifact.candidate,
        context,
        DEFAULT_UPLOAD_POLICY
      );
      setActiveAuth(auth);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setStage("UPLOADING");
      await executePresignedUpload({
        auth,
        totalBytes: selectedArtifact.candidate.size,
        signal: controller.signal,
        stepDelayMs: 260,
        steps: 5,
        onProgress: (snapshot) => {
          setProgress(snapshot);
        },
      });

      setStage("CONFIRMING");
      setProgress({
        stage: "CONFIRMING",
        percentage: 100,
        uploadedBytes: selectedArtifact.candidate.size,
        totalBytes: selectedArtifact.candidate.size,
        message:
          "Confirmando metadados e integridade criptográfica SHA-256 (BE-013)...",
      });

      const confirmed = confirmDeliverableUpload(
        {
          uploadId: auth.uploadId,
          projectId: context.projectId,
          category,
          fileName: selectedArtifact.candidate.name,
          mimeType: selectedArtifact.candidate.type,
          format: validation.detectedFormat,
          sizeBytes: selectedArtifact.candidate.size,
          sha256: selectedArtifact.sha256,
          objectKey: auth.objectKey,
          correlationId: auth.correlationId,
          idempotencyKey: `idem_${auth.uploadId}`,
          notes,
        },
        auth,
        selectedArtifact.sha256
      );

      setStage("CONFIRMED");
      setLastConfirmed(confirmed);
      setDeliverables((prev) => [confirmed, ...prev]);
      setFeedbackBanner({
        variant: "success",
        title: "Entregável confirmado com sucesso!",
        message: `O artefato "${confirmed.fileName}" teve seu hash SHA-256 verificado e foi registrado no projeto ${confirmed.projectId}.`,
      });
    } catch (err) {
      if (err instanceof UploadCanceledError) {
        setStage("CANCELED");
        setProgress((prev) => ({
          ...prev,
          stage: "CANCELED",
          message:
            "Transmissão interrompida pelo usuário. O objeto temporário foi descartado.",
        }));
        setFeedbackBanner({
          variant: "warning",
          title: "Upload cancelado",
          message:
            "O envio foi interrompido com segurança antes da confirmação (FE-011). Você pode tentar enviar novamente ou escolher outro arquivo.",
        });
        return;
      }

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Ocorreu um erro inesperado durante o envio do entregável.";
      setStage("ERROR");
      setFeedbackBanner({
        variant: "error",
        title: "Falha no envio do entregável",
        message: errorMessage,
      });
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleResetSelection = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSelectedArtifact(null);
    setValidationErrors([]);
    setValidationWarnings([]);
    setStage("IDLE");
    setActiveAuth(null);
    setLastConfirmed(null);
    setFeedbackBanner(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRoleChange = (newRole: ProjectActorRole) => {
    const updated: ProjectEditingContext = {
      ...context,
      actorRole: newRole,
    };
    setContext(updated);
    if (selectedArtifact) {
      const check = validateDeliverableCandidate(
        selectedArtifact.candidate,
        updated,
        DEFAULT_UPLOAD_POLICY
      );
      setValidationErrors(check.errors);
      setValidationWarnings(check.warnings);
    }
  };

  const handleToggleEvaluationStarted = () => {
    const updated: ProjectEditingContext = {
      ...context,
      evaluationStarted: !context.evaluationStarted,
    };
    setContext(updated);
    if (selectedArtifact) {
      const check = validateDeliverableCandidate(
        selectedArtifact.candidate,
        updated,
        DEFAULT_UPLOAD_POLICY
      );
      setValidationErrors(check.errors);
      setValidationWarnings(check.warnings);
    }
  };

  return (
    <div className="proposal-form">
      {/* Cabeçalho do Módulo e Status da Janela de Edição */}
      <header className="proposal-header">
        <div className="proposal-header-main">
          <p className="eyebrow">
            Projetos Integradores • Entregáveis (FE-011)
          </p>
          <h1>Upload e Confirmação de Entregáveis</h1>
          <p className="proposal-lead">
            Envie relatórios técnicos, documentações e registros visuais do
            projeto com verificação de assinatura binária, progresso em tempo
            real, cancelamento seguro e confirmação SHA-256.
          </p>
        </div>

        <div className="draft-status-bar" aria-live="polite">
          <Badge
            variant={context.evaluationStarted ? "danger" : "success"}
            size="sm"
          >
            {context.evaluationStarted
              ? "Janela Encerrada (Avaliação Iniciada)"
              : "Janela de Edição Aberta"}
          </Badge>
          <span className="char-counter">
            Projeto: <strong>{context.projectId}</strong> • Semestre{" "}
            {context.semester}
          </span>
        </div>
      </header>

      {/* Painel de Simulação de Regras de Negócio (SPEC-PI-004 / BE-012 / BE-013) */}
      <section
        className="form-fieldset simulation-toolbar"
        aria-label="Controles de Simulação de Cenários de Aceite (SPEC-PI-004)"
      >
        <div className="fieldset-header-row">
          <div>
            <h2 className="fieldset-legend">
              Ambiente de Validação e Contratos (Protótipo Integrável)
            </h2>
            <p className="fieldset-hint">
              Simule os cenários de aceite da <strong>SPEC-PI-004</strong>,{" "}
              <strong>BE-012</strong> (URL S3 restrita) e{" "}
              <strong>BE-013</strong> (hash SHA-256 e autorização).
            </p>
          </div>
          <Badge variant="info" size="sm">
            Contrato S3 + SHA-256 Ativo
          </Badge>
        </div>

        <div className="form-row">
          <div className="form-group flex-1">
            <label htmlFor="sim-actor-role" className="form-label">
              Papel do Ator Autenticado (AC-PI-004-01)
            </label>
            <select
              id="sim-actor-role"
              className="form-select"
              value={context.actorRole}
              onChange={(e) =>
                handleRoleChange(e.target.value as ProjectActorRole)
              }
              disabled={stage === "UPLOADING"}
            >
              <option value="STUDENT_MEMBER">
                Aluno Integrante Vinculado ao Projeto (Leitura + Upload)
              </option>
              <option value="FACULTY_ADVISOR">
                Docente Responsável / Orientador (Leitura + Upload + Decisão de Fotos)
              </option>
              <option value="ADMIN">
                Administrador / Coordenação (Somente Leitura)
              </option>
              <option value="UNLINKED_USER">
                Aluno Não Vinculado / Visitante (Acesso Bloqueado — 403)
              </option>
            </select>
          </div>

          <div className="form-group flex-1">
            <span className="form-label">
              Período de Avaliação (AC-PI-004-02)
            </span>
            <div className="draft-buttons">
              <Button
                type="button"
                variant={context.evaluationStarted ? "primary" : "outline"}
                size="sm"
                onClick={handleToggleEvaluationStarted}
                disabled={stage === "UPLOADING"}
              >
                {context.evaluationStarted
                  ? "Reabrir Janela de Edição (Antes da Avaliação)"
                  : "Simular Início da Avaliação (Bloquear Alterações)"}
              </Button>
            </div>
            <span className="form-helper">
              Arquivos só podem ser enviados ou substituídos até o início da
              avaliação.
            </span>
          </div>
        </div>
      </section>

      {/* Bloqueio de visualização para usuários não vinculados (AC-PI-004-01) */}
      {!canView ? (
        <Alert
          variant="error"
          title="Acesso Negado ao Escopo do Projeto (403 • AC-PI-004-01)"
        >
          Usuários não vinculados à equipe do projeto ou visitantes anônimos não
          possuem permissão para consultar metadados, baixar arquivos ou gerar
          URLs pré-assinadas de entregáveis.
        </Alert>
      ) : (
        <>
          {feedbackBanner ? (
            <Alert
              variant={feedbackBanner.variant}
              title={feedbackBanner.title}
              onClose={() => setFeedbackBanner(null)}
            >
              {feedbackBanner.message}
            </Alert>
          ) : null}

          {/* Regras e Limites Explícitos (FE-011 / SPEC-PI-004) */}
          <section
            className="form-fieldset"
            aria-labelledby="limits-rules-heading"
          >
            <h2 id="limits-rules-heading" className="fieldset-legend">
              Limites, Formatos e Regras de Armazenamento
            </h2>
            <ul className="policy-rules-list">
              <li>
                <strong>Formatos oficiais aceitos (AC-PI-004-03):</strong>{" "}
                Documentos <code>.pdf</code>, <code>.docx</code> e Imagens{" "}
                <code>.png</code>, <code>.jpg/.jpeg</code>, <code>.webp</code>{" "}
                (com inspeção da assinatura binária real além da extensão).
              </li>
              <li>
                <strong>Limites de tamanho parametrizados (SPEC-PI-004):</strong>{" "}
                Até{" "}
                <strong>
                  {formatBytes(DEFAULT_UPLOAD_POLICY.provisionalMaxDocumentBytes)}
                </strong>{" "}
                para documentos PDF/DOCX e até{" "}
                <strong>
                  {formatBytes(DEFAULT_UPLOAD_POLICY.provisionalMaxImageBytes)}
                </strong>{" "}
                para imagens <em>(parâmetro contratual ajustável pelo PO)</em>.
              </li>
              <li>
                <strong>Segurança e Integridade (BE-012 / BE-013):</strong>{" "}
                Envio direto via URL S3 privada com TTL de{" "}
                <strong>15 minutos</strong> e confirmação vinculada ao checksum{" "}
                <code>SHA-256</code> do arquivo.
              </li>
              <li>
                <strong>Direito de Imagem (AC-PI-004-04):</strong> Fotografias
                enviadas permanecem restritas internamente e só são publicadas
                no catálogo público mediante decisão expressa do docente
                responsável, considerando menores de idade e terceiros.
              </li>
            </ul>
          </section>

          {/* Formulário de Seleção e Upload */}
          <fieldset
            className="form-fieldset"
            disabled={!modifyPermission.allowed || stage === "UPLOADING"}
          >
            <legend className="fieldset-legend">
              Novo Envio ou Substituição de Entregável
            </legend>

            {!modifyPermission.allowed && modifyPermission.reason ? (
              <Alert variant="warning" title="Envio bloqueado neste estado">
                {modifyPermission.reason}
              </Alert>
            ) : null}

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="deliverable-category" className="form-label">
                  Categoria do Entregável{" "}
                  <span className="required-indicator" aria-hidden="true">
                    *
                  </span>
                </label>
                <select
                  id="deliverable-category"
                  className="form-select"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as DeliverableCategory)
                  }
                >
                  <option value="RELATORIO_TECNICO">
                    Relatório Técnico (Parcial / Final)
                  </option>
                  <option value="DOCUMENTACAO_PROJETO">
                    Documentação Complementar (.DOCX / .PDF)
                  </option>
                  <option value="REGISTRO_FOTOGRAFICO">
                    Registro Fotográfico / Evidência Visual
                  </option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label htmlFor="deliverable-notes" className="form-label">
                  Observações da Entrega (Opcional)
                </label>
                <input
                  id="deliverable-notes"
                  type="text"
                  className="form-input"
                  placeholder="Ex.: Versão revisada com diagramas atualizados"
                  value={notes}
                  maxLength={200}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Seleção de Arquivo + Atalhos de Amostra */}
            <div className="form-group">
              <label htmlFor="deliverable-file-input" className="form-label">
                Arquivo do Entregável{" "}
                <span className="required-indicator" aria-hidden="true">
                  *
                </span>
              </label>
              <div className="upload-dropzone">
                <input
                  ref={fileInputRef}
                  id="deliverable-file-input"
                  type="file"
                  accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="form-input"
                  aria-describedby="file-limits-helper"
                />
                <p id="file-limits-helper" className="form-helper">
                  Selecione um arquivo do seu computador ou utilize os artefatos
                  de teste abaixo para validar o comportamento de limites e
                  assinatura binária:
                </p>
                <div className="draft-buttons">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadSampleArtifact("PDF_VALID")}
                  >
                    Carregar Amostra PDF Válida (2.71 MB)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadSampleArtifact("IMAGE_VALID")}
                  >
                    Carregar Amostra Imagem PNG (1.83 MB)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadSampleArtifact("INVALID_OVERSIZE")}
                  >
                    Testar Arquivo Inválido / Acima do Limite (32 MB)
                  </Button>
                </div>
              </div>
            </div>

            {/* Resumo do Arquivo Selecionado e Validações */}
            {selectedArtifact ? (
              <div
                className="team-member-card"
                aria-label="Detalhes do arquivo selecionado"
              >
                <div className="member-card-header">
                  <div>
                    <strong className="member-number">
                      {selectedArtifact.candidate.name}
                    </strong>
                    <p className="form-helper">
                      Tamanho:{" "}
                      <strong>
                        {formatBytes(selectedArtifact.candidate.size)}
                      </strong>{" "}
                      • MIME:{" "}
                      <code>
                        {selectedArtifact.candidate.type || "desconhecido"}
                      </code>
                    </p>
                  </div>
                  <Badge
                    variant={
                      validationErrors.length > 0 ? "danger" : "success"
                    }
                    size="sm"
                  >
                    {validationErrors.length > 0
                      ? "Rejeitado na Validação"
                      : "Pronto para Envio"}
                  </Badge>
                </div>

                {selectedArtifact.sha256 ? (
                  <p className="form-helper">
                    Checksum SHA-256 calculado no cliente:{" "}
                    <code className="hash-code">{selectedArtifact.sha256}</code>
                  </p>
                ) : null}

                {validationErrors.length > 0 ? (
                  <Alert
                    variant="error"
                    title="O arquivo não atende aos critérios de validação (FE-011 / SPEC-PI-004)"
                  >
                    <ul className="validation-list">
                      {validationErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </Alert>
                ) : null}

                {validationWarnings.length > 0 ? (
                  <Alert
                    variant="warning"
                    title="Política de Publicação de Imagem (AC-PI-004-04)"
                  >
                    <ul className="validation-list">
                      {validationWarnings.map((warn, idx) => (
                        <li key={idx}>{warn}</li>
                      ))}
                    </ul>
                  </Alert>
                ) : null}
              </div>
            ) : null}
          </fieldset>

          {/* Barra de Progresso e Botão de Cancelamento (FE-011) */}
          {stage === "REQUESTING_URL" ||
          stage === "UPLOADING" ||
          stage === "CONFIRMING" ||
          stage === "CANCELED" ? (
            <section
              className="form-fieldset"
              aria-label="Progresso da transmissão do entregável"
            >
              <div className="fieldset-header-row">
                <h2 className="fieldset-legend">
                  Status da Transmissão Direta (S3 Presigned)
                </h2>
                <Badge
                  variant={stage === "CANCELED" ? "warning" : "info"}
                  size="sm"
                >
                  {stage === "REQUESTING_URL" && "Autorizando URL S3"}
                  {stage === "UPLOADING" && "Em Progresso"}
                  {stage === "CONFIRMING" && "Verificando SHA-256"}
                  {stage === "CANCELED" && "Cancelado pelo Usuário"}
                </Badge>
              </div>

              <ProgressBar
                value={progress.percentage}
                max={100}
                label={`Envio de ${selectedArtifact?.candidate.name || "entregável"}`}
                statusText={`${progress.message} (${formatBytes(progress.uploadedBytes)} de ${formatBytes(progress.totalBytes)})`}
                variant={stage === "CANCELED" ? "warning" : "primary"}
              />

              {activeAuth ? (
                <div className="form-helper">
                  <span>
                    Escopo S3: <code>{activeAuth.bucketScope}</code> • Correlação:{" "}
                    <code>{activeAuth.correlationId}</code> • Expira em:{" "}
                    {new Date(activeAuth.expiresAtIso).toLocaleTimeString(
                      "pt-BR"
                    )}
                  </span>
                </div>
              ) : null}

              {stage === "UPLOADING" ? (
                <div className="draft-buttons">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancelUpload}
                  >
                    Cancelar Upload Agora
                  </Button>
                </div>
              ) : null}
            </section>
          ) : null}

          {/* Ações Principais de Envio */}
          <div className="form-actions-footer">
            <div>
              {selectedArtifact && stage !== "UPLOADING" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetSelection}
                >
                  Limpar Seleção
                </Button>
              ) : null}
            </div>

            <div className="actions-right">
              {stage === "UPLOADING" ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancelUpload}
                >
                  Cancelar Envio em Andamento
                </Button>
              ) : null}

              <Button
                type="button"
                variant="primary"
                size="lg"
                isLoading={
                  stage === "REQUESTING_URL" ||
                  stage === "UPLOADING" ||
                  stage === "CONFIRMING"
                }
                disabled={
                  !selectedArtifact ||
                  validationErrors.length > 0 ||
                  !modifyPermission.allowed ||
                  stage === "UPLOADING"
                }
                onClick={handleStartUpload}
              >
                {stage === "CANCELED"
                  ? "Tentar Enviar Novamente"
                  : "Iniciar Upload e Confirmar Entregável"}
              </Button>
            </div>
          </div>

          {/* Comprovante de Confirmação Recente (FE-011 / BE-013) */}
          {lastConfirmed ? (
            <section
              className="proposal-success-card"
              aria-labelledby="confirmed-receipt-heading"
            >
              <div className="success-icon" aria-hidden="true">
                ✓
              </div>
              <h2 id="confirmed-receipt-heading">
                Comprovante de Entregável Confirmado
              </h2>
              <p className="success-subtitle">
                O arquivo foi persistido de forma permanente no bucket privado do
                projeto (AWS S3 sem redundância extra conforme SPEC-PI-004) e
                validado via checksum SHA-256.
              </p>

              <div className="protocol-box">
                <span className="protocol-label">
                  ID do Entregável Confirmado
                </span>
                <strong className="protocol-value">
                  {lastConfirmed.deliverableId}
                </strong>
              </div>

              <div className="summary-section">
                <h3>Metadados Verificados (BE-013)</h3>
                <p>
                  <strong>Arquivo:</strong> {lastConfirmed.fileName} (
                  {formatBytes(lastConfirmed.sizeBytes)} • {lastConfirmed.format})
                </p>
                <p>
                  <strong>Categoria:</strong>{" "}
                  {getCategoryLabel(lastConfirmed.category)}
                </p>
                <p>
                  <strong>SHA-256 Verificado:</strong>{" "}
                  <code className="hash-code">{lastConfirmed.sha256}</code>
                </p>
                <p>
                  <strong>Object Key S3:</strong>{" "}
                  <code className="hash-code">{lastConfirmed.objectKey}</code>
                </p>
                <p>
                  <strong>Correlação:</strong>{" "}
                  <code>{lastConfirmed.correlationId}</code>
                </p>
                <p>
                  <strong>Visibilidade:</strong> Equipe vinculada, docente
                  orientador e administração (AC-PI-004-01)
                </p>
                {lastConfirmed.format === "IMAGE" ? (
                  <p>
                    <strong>Publicação de Imagem (AC-PI-004-04):</strong>{" "}
                    Aguardando decisão do docente responsável (avaliação de
                    menores/terceiros).
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}

          {/* Lista de Entregáveis Confirmados do Projeto */}
          <section
            className="form-fieldset"
            aria-labelledby="deliverables-history-heading"
          >
            <div className="fieldset-header-row">
              <h2 id="deliverables-history-heading" className="fieldset-legend">
                Entregáveis Confirmados do Projeto ({deliverables.length})
              </h2>
              <Badge variant="neutral" size="sm">
                Escopo Isolado • {context.projectId}
              </Badge>
            </div>

            <div className="team-members-list">
              {deliverables.map((item) => (
                <article
                  key={item.deliverableId}
                  className="team-member-card"
                  aria-label={`Entregável ${item.fileName}`}
                >
                  <div className="member-card-header">
                    <div>
                      <strong className="member-number">{item.fileName}</strong>
                      <p className="form-helper">
                        {getCategoryLabel(item.category)} •{" "}
                        {formatBytes(item.sizeBytes)} • Confirmado em{" "}
                        {new Date(item.confirmedAtIso).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="draft-buttons">
                      <Badge variant="success" size="sm">
                        SHA-256 Confirmado
                      </Badge>
                      {item.photoPublicationStatus ===
                      "PENDING_FACULTY_DECISION" ? (
                        <Badge variant="warning" size="sm">
                          Foto: Aguarda Decisão Docente
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <p className="form-helper">
                    ID: <code>{item.deliverableId}</code> • SHA-256:{" "}
                    <code className="hash-code">
                      {item.sha256.slice(0, 24)}...{item.sha256.slice(-8)}
                    </code>
                  </p>
                  {item.notes ? (
                    <p className="form-helper">
                      <strong>Observação:</strong> {item.notes}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

