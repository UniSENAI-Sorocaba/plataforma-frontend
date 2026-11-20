"use client";

import React, { useMemo, useRef, useState } from "react";
import { Alert } from "@/components/alert";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Textarea } from "@/components/textarea";
import {
  approveImpactVersion,
  createImpactDraft,
  createInitialImpactStore,
  ImpactContractError,
  listPublicImpacts,
  publishImpactVersion,
  readImpactHistory,
  readImpactProvenance,
  reviseImpactVersion,
  setTeacherPhotoAuthorization,
  withdrawImpactPublication,
} from "./impact-client";
import type {
  ImpactActorRole,
  ImpactHistoryEvent,
  ImpactLifecycleStatus,
  ImpactProblemDetails,
  ImpactProvenanceResponse,
  ImpactValidationErrors,
} from "./impact-types";
import {
  formatRevisionEtag,
  IMPACT_CONSTRAINTS,
  resolveImpactLifecycleStatus,
  validateImpactDraftInput,
} from "./impact-validation";

const ACTOR_PROFILES: readonly {
  role: ImpactActorRole;
  actorId: string;
  label: string;
  description: string;
}[] = [
  {
    role: "PUBLIC_VISITOR",
    actorId: "",
    label: "Visitante Anônimo (Portal Público)",
    description:
      "Visualiza exclusivamente a vitrine pública (versões aprovadas e publicadas). Operações de gestão e auditoria retornam 401.",
  },
  {
    role: "FACULTY_ADVISOR",
    actorId: "prof.marcos.almeida",
    label: "Docente Responsável (CREATE / REVISE / APPROVE / PUBLISH / WITHDRAW)",
    description:
      "Cria rascunhos com origem obrigatória, aprova versões, publica na vitrine, autoriza fotos e retira publicação.",
  },
  {
    role: "STUDENT_MEMBER",
    actorId: "aluno.integrante.pi",
    label: "Estudante Vinculado (Somente Leitura Interna)",
    description:
      "Consulta informações permitidas do projeto, mas não possui permissão para aprovar, publicar, retirar ou auditar proveniência (403).",
  },
  {
    role: "AUDITOR",
    actorId: "auditor.governanca.unisenai",
    label: "Auditor Autorizado (Permissão AUDIT — AC-05)",
    description:
      "Autorizado a consultar a proveniência (origem, responsável, período) e o histórico de eventos com correlationId.",
  },
];

const COURSES = [
  "Engenharia de Software",
  "Engenharia Mecatrônica",
  "Análise e Desenvolvimento de Sistemas",
  "Engenharia de Produção",
] as const;

const SEMESTERS = ["2026.2", "2026.1"] as const;

const ODS_LABELS: Record<number, string> = {
  3: "ODS 3 • Saúde e Bem-Estar",
  4: "ODS 4 • Educação de Qualidade",
  7: "ODS 7 • Energia Limpa e Acessível",
  8: "ODS 8 • Trabalho Decente e Crescimento",
  9: "ODS 9 • Indústria, Inovação e Infraestrutura",
  10: "ODS 10 • Redução das Desigualdades",
  11: "ODS 11 • Cidades e Comunidades Sustentáveis",
  12: "ODS 12 • Consumo e Produção Responsáveis",
  16: "ODS 16 • Paz, Justiça e Instituições Eficazes",
};

function getStatusBadgeProps(status: ImpactLifecycleStatus): {
  label: string;
  variant: "success" | "warning" | "neutral" | "danger";
} {
  switch (status) {
    case "PUBLISHED":
      return { label: "Publicado na Vitrine", variant: "success" };
    case "APPROVED_UNPUBLISHED":
      return {
        label: "Aprovado • Aguardando Publicação (Oculto)",
        variant: "warning",
      };
    case "WITHDRAWN":
      return { label: "Retirado da Vitrine (Oculto)", variant: "danger" };
    case "DRAFT":
    default:
      return { label: "Rascunho Não Aprovado (Oculto)", variant: "neutral" };
  }
}

export function ImpactShowcase() {
  const [store, setStore] = useState(() => createInitialImpactStore());
  const [storeTick, setStoreTick] = useState(0);

  // Filtros da vitrine pública
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedOds, setSelectedOds] = useState<string>("");

  // Simulador de governança e ciclo de vida (BE-019 / SPEC-PORTAL-002)
  const [activeRole, setActiveRole] =
    useState<ImpactActorRole>("FACULTY_ADVISOR");
  const [selectedImpactId, setSelectedImpactId] = useState<string>(
    "10000000-0000-4000-8000-000000000001"
  );

  // Estado de feedback acessível
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
    problem?: ImpactProblemDetails;
  } | null>(null);

  // Estado de inspeção de auditoria (AC-05)
  const [inspectedProvenance, setInspectedProvenance] =
    useState<ImpactProvenanceResponse | null>(null);
  const [inspectedHistory, setInspectedHistory] = useState<
    ImpactHistoryEvent[] | null
  >(null);

  // Formulário de criação de rascunho / revisão de versão (AC-01 / AC-03)
  const [formMode, setFormMode] = useState<"CREATE" | "REVISE">("CREATE");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftSourceRef, setDraftSourceRef] = useState("");
  const [draftResponsibleRef, setDraftResponsibleRef] = useState("");
  const [draftPeriodStart, setDraftPeriodStart] = useState("2026-08-01");
  const [draftPeriodEnd, setDraftPeriodEnd] = useState("2026-11-30");
  const [draftCourse, setDraftCourse] = useState<string>(COURSES[0]);
  const [draftModality, setDraftModality] = useState<"PI" | "EXTENSAO">(
    "EXTENSAO"
  );
  const [fieldErrors, setFieldErrors] = useState<ImpactValidationErrors>({});

  const titleRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const sourceRefInput = useRef<HTMLInputElement>(null);
  const responsibleRefInput = useRef<HTMLInputElement>(null);
  const periodStartRef = useRef<HTMLInputElement>(null);
  const periodEndRef = useRef<HTMLInputElement>(null);
  const correlationSeqRef = useRef(1);

  function nextCorrelationId(prefix: string): string {
    const current = correlationSeqRef.current;
    correlationSeqRef.current += 1;
    return `${prefix}-${current}`;
  }

  const activeProfile = useMemo(
    () =>
      ACTOR_PROFILES.find((p) => p.role === activeRole) ?? ACTOR_PROFILES[0],
    [activeRole]
  );

  // Projeção pública filtrada (FE-016: renderiza EXCLUSIVAMENTE conteúdos publicados e aprovados)
  const publicListing = useMemo(() => {
    void storeTick;
    return listPublicImpacts(store, {
      query: searchQuery,
      course: selectedCourse,
      semester: selectedSemester,
      ods: selectedOds ? Number(selectedOds) : null,
    });
  }, [
    store,
    storeTick,
    searchQuery,
    selectedCourse,
    selectedSemester,
    selectedOds,
  ]);

  const allInternalRecords = useMemo(() => {
    void storeTick;
    return Array.from(store.records.values());
  }, [store, storeTick]);

  const selectedRecord = useMemo(() => {
    void storeTick;
    return store.records.get(selectedImpactId) ?? allInternalRecords[0] ?? null;
  }, [store, storeTick, selectedImpactId, allInternalRecords]);

  const statusCounts = useMemo(() => {
    const counts: Record<ImpactLifecycleStatus, number> = {
      PUBLISHED: 0,
      APPROVED_UNPUBLISHED: 0,
      DRAFT: 0,
      WITHDRAWN: 0,
    };
    for (const rec of allInternalRecords) {
      counts[resolveImpactLifecycleStatus(rec)] += 1;
    }
    return counts;
  }, [allInternalRecords]);

  function refreshStore() {
    setStore({
      records: new Map(store.records),
      sequence: store.sequence,
    });
    setStoreTick((t) => t + 1);
  }

  function handleContractError(err: unknown, fallbackTitle: string) {
    if (err instanceof ImpactContractError) {
      setFeedback({
        type: "error",
        title: `${err.problem.title} (HTTP ${err.status})`,
        message: err.problem.detail,
        problem: err.problem,
      });
      return;
    }
    setFeedback({
      type: "error",
      title: fallbackTitle,
      message:
        err instanceof Error
          ? err.message
          : "Ocorreu um erro inesperado ao processar a operação.",
    });
  }

  function handleApproveVersion(recordId: string, versionNumber: number) {
    const record = store.records.get(recordId);
    if (!record) return;

    try {
      const response = approveImpactVersion(store, recordId, versionNumber, {
        actorId: activeProfile.actorId,
        actorRole: activeProfile.role,
        ifMatch: formatRevisionEtag(record.revision),
        correlationId: nextCorrelationId("corr-ui-approve"),
      });
      refreshStore();
      setFeedback({
        type: "success",
        title: `Versão v${versionNumber} aprovada com sucesso`,
        message: `A versão v${versionNumber} foi marcada como aprovada (ETag ${response.etag}). Conforme AC-02, a aprovação é separada da publicação: o item só entra na vitrine pública após acionar "Publicar Versão".`,
      });
    } catch (err) {
      handleContractError(err, "Falha ao aprovar versão");
    }
  }

  function handlePublishVersion(recordId: string, versionNumber: number) {
    const record = store.records.get(recordId);
    if (!record) return;

    try {
      const response = publishImpactVersion(store, recordId, versionNumber, {
        actorId: activeProfile.actorId,
        actorRole: activeProfile.role,
        ifMatch: formatRevisionEtag(record.revision),
        correlationId: nextCorrelationId("corr-ui-publish"),
      });
      refreshStore();
      setFeedback({
        type: "success",
        title: `Versão v${versionNumber} publicada na Vitrine Pública`,
        message: `O ponteiro explícito de publicação agora aponta para v${response.publishedVersion} (ETag ${response.etag}, Cache-Control: ${response.cacheControl}). O conteúdo já está visível para visitantes no portal.`,
      });
    } catch (err) {
      handleContractError(err, "Falha ao publicar versão");
    }
  }

  function handleWithdrawImpact(recordId: string) {
    const record = store.records.get(recordId);
    if (!record) return;

    try {
      const response = withdrawImpactPublication(store, recordId, {
        actorId: activeProfile.actorId,
        actorRole: activeProfile.role,
        ifMatch: formatRevisionEtag(record.revision),
        correlationId: nextCorrelationId("corr-ui-withdraw"),
      });
      refreshStore();
      setFeedback({
        type: "warning",
        title: "Publicação retirada da Vitrine Pública (AC-04)",
        message: `O impacto foi removido imediatamente da exposição pública (publishedVersion: null, ETag ${response.etag}, Cache-Control: no-store). As versões anteriores e a origem permanecem preservadas internamente para auditoria.`,
      });
    } catch (err) {
      handleContractError(err, "Falha ao retirar publicação");
    }
  }

  function handleTogglePhotoAuthorization(recordId: string, nextValue: boolean) {
    try {
      setTeacherPhotoAuthorization(store, recordId, nextValue, {
        actorId: activeProfile.actorId,
        actorRole: activeProfile.role,
        correlationId: nextCorrelationId("corr-ui-photo"),
      });
      refreshStore();
      setFeedback({
        type: "info",
        title: nextValue
          ? "Publicação de fotos autorizada pelo docente (AC-S3-09)"
          : "Fotos restritas ao escopo interno (AC-S3-09)",
        message: nextValue
          ? "As evidências fotográficas aprovadas pelo docente responsável agora são exibidas no card público."
          : "As evidências fotográficas foram ocultadas da vitrine pública, permanecendo restritas internamente.",
      });
    } catch (err) {
      handleContractError(err, "Falha ao alterar autorização de fotos");
    }
  }

  function handleInspectAudit(recordId: string, versionNumber: number) {
    try {
      const prov = readImpactProvenance(store, recordId, versionNumber, {
        actorId: activeProfile.actorId,
        actorRole: activeProfile.role,
        correlationId: nextCorrelationId("corr-ui-prov"),
      });
      const hist = readImpactHistory(store, recordId, {
        actorId: activeProfile.actorId,
        actorRole: activeProfile.role,
        correlationId: nextCorrelationId("corr-ui-hist"),
      });
      setInspectedProvenance(prov);
      setInspectedHistory(hist.items);
      setFeedback({
        type: "info",
        title: `Rastreabilidade e Proveniência carregadas (Versão v${versionNumber})`,
        message: `Origem "${prov.sourceReference}" e histórico de ${hist.totalElements} evento(s) verificados com permissão AUDIT (AC-05).`,
      });
    } catch (err) {
      setInspectedProvenance(null);
      setInspectedHistory(null);
      handleContractError(
        err,
        "Acesso negado à consulta de proveniência/histórico"
      );
    }
  }

  function focusFirstInvalidField(errors: ImpactValidationErrors) {
    if (errors.title) {
      titleRef.current?.focus();
    } else if (errors.summary) {
      summaryRef.current?.focus();
    } else if (errors.sourceReference) {
      sourceRefInput.current?.focus();
    } else if (errors.responsibleReference) {
      responsibleRefInput.current?.focus();
    } else if (errors.periodStart) {
      periodStartRef.current?.focus();
    } else if (errors.periodEnd) {
      periodEndRef.current?.focus();
    }
  }

  function handleDraftSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const candidatePayload = {
      title: draftTitle,
      summary: draftSummary,
      provenance: {
        sourceReference: draftSourceRef,
        responsibleReference: draftResponsibleRef,
        periodStart: draftPeriodStart,
        periodEnd: draftPeriodEnd,
      },
    };

    const validation = validateImpactDraftInput(candidatePayload);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      focusFirstInvalidField(validation.errors);
      return;
    }

    setFieldErrors({});

    try {
      if (formMode === "CREATE") {
        const created = createImpactDraft(
          store,
          candidatePayload,
          {
            actorId: activeProfile.actorId,
            actorRole: activeProfile.role,
            correlationId: nextCorrelationId("corr-ui-create"),
          },
          {
            course: draftCourse,
            semester: "2026.2",
            ods: [4, 9],
            modality: draftModality,
          }
        );
        refreshStore();
        setSelectedImpactId(created.id);
        setFeedback({
          type: "success",
          title: "Rascunho de impacto registrado com origem rastreável (AC-01)",
          message: `Registro criado com revisão ${created.revision} (ETag ${created.etag}). Conforme AC-02, este rascunho nasce com publishedVersion = null e NÃO aparece na vitrine pública até ser aprovado e publicado.`,
        });
      } else if (selectedRecord) {
        const revised = reviseImpactVersion(
          store,
          selectedRecord.id,
          candidatePayload,
          {
            actorId: activeProfile.actorId,
            actorRole: activeProfile.role,
            ifMatch: formatRevisionEtag(selectedRecord.revision),
            correlationId: nextCorrelationId("corr-ui-revise"),
          }
        );
        refreshStore();
        setFeedback({
          type: "success",
          title: `Nova versão v${revised.latestVersion} criada em rascunho (AC-03)`,
          message:
            revised.publishedVersion !== null
              ? `A versão v${revised.latestVersion} foi salva como rascunho não aprovado. A vitrine pública continua exibindo a versão aprovada v${revised.publishedVersion} sem interromper ou expor o rascunho!`
              : `A versão v${revised.latestVersion} foi adicionada como rascunho não aprovado (ETag ${revised.etag}).`,
        });
      }

      setDraftTitle("");
      setDraftSummary("");
      setDraftSourceRef("");
      setDraftResponsibleRef("");
    } catch (err) {
      handleContractError(err, "Erro ao salvar rascunho de impacto");
    }
  }

  function handleResetFilters() {
    setSearchQuery("");
    setSelectedCourse("");
    setSelectedSemester("");
    setSelectedOds("");
  }

  return (
    <div className="proposal-form">
      <header className="proposal-header">
        <div className="proposal-header-main">
          <p className="eyebrow">Portal Público & Governança • FE-016</p>
          <h1>Impacto Comunitário e Publicação Controlada</h1>
          <p className="proposal-lead">
            Vitrine institucional de Projetos Integradores e Extensão Universitária.
            Renderiza exclusivamente versões aprovadas e com publicação ativa pelo
            docente responsável, garantindo proteção de dados individuais e
            rastreabilidade de origem (<code>SPEC-PORTAL-002</code> /{" "}
            <code>BE-019</code>).
          </p>
        </div>

        <div className="draft-status-bar" aria-label="Resumo de conformidade da vitrine">
          <Badge variant="success">
            {publicListing.totalPublished} de {publicListing.totalInternalRecords} Publicados
          </Badge>
          <span className="form-helper">
            Cabeçalho de resposta: <code>Cache-Control: {publicListing.headers["Cache-Control"]}</code>
          </span>
          <span className="form-helper">
            Ocultos da vitrine: {statusCounts.DRAFT} rascunho(s),{" "}
            {statusCounts.APPROVED_UNPUBLISHED} aprovado(s) sem publicação e{" "}
            {statusCounts.WITHDRAWN} retirado(s).
          </span>
        </div>
      </header>

      {feedback ? (
        <Alert
          variant={feedback.type}
          title={feedback.title}
          onClose={() => setFeedback(null)}
        >
          <p style={{ margin: 0 }}>{feedback.message}</p>
          {feedback.problem ? (
            <p className="form-helper" style={{ marginTop: "0.35rem" }}>
              RFC 9457 Problem Details • Status:{" "}
              <code>{feedback.problem.status}</code> • Correlation-ID:{" "}
              <code>{feedback.problem.correlationId}</code>
            </p>
          ) : null}
        </Alert>
      ) : null}

      {/* SEÇÃO 1: VITRINE PÚBLICA (VISÃO DO VISITANTE ANÔNIMO — FE-016) */}
      <section
        className="form-fieldset"
        aria-labelledby="vitrine-publica-heading"
      >
        <div className="fieldset-header-row">
          <div>
            <h2 id="vitrine-publica-heading" style={{ margin: 0 }}>
              1. Vitrine Pública de Impacto Comunitário
            </h2>
            <p className="fieldset-hint">
              Conteúdo servido para visitantes anônimos (<code>GET /api/v1/impacts/&#123;id&#125;</code>).
              Rascunhos, versões aprovadas não publicadas, conteúdos retirados,
              horas/notas individuais e fotos não autorizadas jamais são renderizados.
            </p>
          </div>
          <Badge variant="info">Allowlist Pública Ativa</Badge>
        </div>

        {/* Barra de Filtros da Vitrine Pública */}
        <div className="impact-filter-bar" role="search" aria-label="Filtrar projetos publicados">
          <div className="form-group">
            <label htmlFor="filter-search" className="form-label">
              Buscar por título ou resumo
            </label>
            <input
              id="filter-search"
              type="search"
              className="form-input"
              placeholder="Ex.: hortas, reabilitação, sensores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="filter-course" className="form-label">
              Curso
            </label>
            <select
              id="filter-course"
              className="form-select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              <option value="">Todos os cursos</option>
              {COURSES.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="filter-semester" className="form-label">
              Semestre
            </label>
            <select
              id="filter-semester"
              className="form-select"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              <option value="">Todos os semestres</option>
              {SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="filter-ods" className="form-label">
              ODS (Agenda 2030)
            </label>
            <select
              id="filter-ods"
              className="form-select"
              value={selectedOds}
              onChange={(e) => setSelectedOds(e.target.value)}
            >
              <option value="">Todos os ODS</option>
              {Object.entries(ODS_LABELS).map(([num, label]) => (
                <option key={num} value={num}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="impact-filter-actions">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
            >
              Limpar filtros
            </Button>
          </div>
        </div>

        {/* Lista de Cards Públicos Renderizados */}
        {publicListing.items.length === 0 ? (
          <div className="impact-empty-state" role="status" aria-live="polite">
            <h3>Nenhum impacto publicado corresponde aos filtros selecionados</h3>
            <p className="form-helper">
              Apenas projetos com versão aprovada e opção de publicação ativa
              aparecem nesta vitrine. Verifique os filtros ou publique uma versão
              aprovada no painel de governança abaixo.
            </p>
          </div>
        ) : (
          <div className="impact-public-grid" aria-label="Impactos comunitários publicados">
            {publicListing.items.map((item) => (
              <article
                key={item.id}
                className="impact-public-card"
                aria-labelledby={`public-impact-title-${item.id}`}
              >
                <div className="impact-card-top">
                  <div className="impact-badge-row">
                    <Badge variant="success">
                      Versão Publicada v{item.version}
                    </Badge>
                    {item.modality ? (
                      <Badge variant="info">
                        {item.modality === "EXTENSAO"
                          ? "Extensão Universitária"
                          : "Projeto Integrador"}
                      </Badge>
                    ) : null}
                    {item.semester ? (
                      <Badge variant="neutral">{item.semester}</Badge>
                    ) : null}
                  </div>
                  {typeof item.projectGrade === "number" ? (
                    <span
                      className="impact-aggregate-grade"
                      title="Nota agregada do projeto autorizada para exibição pública (SPEC-PORTAL-002)"
                    >
                      Nota do Projeto: <strong>{item.projectGrade.toFixed(1)}</strong>
                    </span>
                  ) : null}
                </div>

                <h3 id={`public-impact-title-${item.id}`} className="impact-card-title">
                  {item.title}
                </h3>

                {item.course ? (
                  <p className="impact-card-meta">
                    <strong>Curso:</strong> {item.course}
                  </p>
                ) : null}

                <p className="impact-card-summary">{item.summary}</p>

                {item.ods && item.ods.length > 0 ? (
                  <div className="impact-ods-list" aria-label="Objetivos de Desenvolvimento Sustentável">
                    {item.ods.map((odsNumber) => (
                      <span key={odsNumber} className="impact-ods-pill">
                        ODS {odsNumber}
                      </span>
                    ))}
                  </div>
                ) : null}

                {item.authorizedPhotoCaptions &&
                item.authorizedPhotoCaptions.length > 0 ? (
                  <div className="impact-photos-box">
                    <p className="impact-photos-title">
                      Registros Fotográficos Autorizados pelo Docente (AC-S3-09):
                    </p>
                    <ul className="impact-photos-list">
                      {item.authorizedPhotoCaptions.map((caption, idx) => (
                        <li key={idx}>{caption}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="form-helper">
                    <em>
                      Sem fotografias públicas exibidas (requer autorização explícita do
                      docente responsável — AC-PORTAL-001-05).
                    </em>
                  </p>
                )}

                <footer className="impact-card-footer">
                  <span className="form-helper">
                    ID Público: <code>{item.id.slice(-6)}</code> • Dados individuais e
                    proveniência interna omitidos por allowlist (<code>AC-S4-07</code>).
                  </span>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* SEÇÃO 2: PAINEL DE GOVERNANÇA DO CICLO DE VIDA (BE-019 / SPEC-PORTAL-002) */}
      <section
        className="form-fieldset"
        aria-labelledby="governanca-impacto-heading"
      >
        <div className="fieldset-header-row">
          <div>
            <h2 id="governanca-impacto-heading" style={{ margin: 0 }}>
              2. Governança de Publicação, Versionamento e Auditoria (BE-019)
            </h2>
            <p className="fieldset-hint">
              Simule as transições de estado entre rascunho, aprovação, publicação
              e retirada, validando que o visitante público jamais visualiza conteúdo
              não aprovado ou retirado.
            </p>
          </div>
          <Badge variant="neutral">Contrato OpenAPI 3.1</Badge>
        </div>

        {/* Seletor de Perfil (RBAC) */}
        <div className="impact-role-selector">
          <label htmlFor="actor-role-select" className="form-label">
            Perfil Ativo na Simulação (Controle de Acesso Server-Side BE-010 / BE-019):
          </label>
          <select
            id="actor-role-select"
            className="form-select"
            value={activeRole}
            onChange={(e) => {
              setActiveRole(e.target.value as ImpactActorRole);
              setInspectedProvenance(null);
              setInspectedHistory(null);
            }}
          >
            {ACTOR_PROFILES.map((profile) => (
              <option key={profile.role} value={profile.role}>
                {profile.label}
              </option>
            ))}
          </select>
          <p className="form-helper" style={{ marginTop: "0.35rem" }}>
            {activeProfile.description}
          </p>
        </div>

        {/* Tabela/Lista de todos os registros no repositório para demonstrar o filtro de publicação */}
        <div className="impact-records-list" role="region" aria-label="Registros no repositório de impacto">
          {allInternalRecords.map((rec) => {
            const lifecycle = resolveImpactLifecycleStatus(rec);
            const badgeProps = getStatusBadgeProps(lifecycle);
            const isSelected = selectedRecord?.id === rec.id;

            return (
              <div
                key={rec.id}
                className={`impact-record-item ${isSelected ? "is-selected" : ""}`}
              >
                <div className="impact-record-main">
                  <div className="impact-badge-row">
                    <Badge variant={badgeProps.variant}>{badgeProps.label}</Badge>
                    <Badge variant="neutral">
                      ETag: {formatRevisionEtag(rec.revision)}
                    </Badge>
                    <Badge variant="info">
                      Versão Publicada:{" "}
                      {rec.publishedVersion !== null
                        ? `v${rec.publishedVersion}`
                        : "Nenhuma (null)"}
                    </Badge>
                    <Badge variant="neutral">
                      Última Versão: v{rec.latestVersion}
                    </Badge>
                  </div>

                  <h3 className="impact-record-title">
                    {rec.versions[rec.versions.length - 1]?.title}
                  </h3>

                  <p className="form-helper">
                    Curso: <strong>{rec.course}</strong> ({rec.semester}) •{" "}
                    {rec.versions.length} versão(ões) registrada(s)
                  </p>
                </div>

                <div className="impact-record-actions">
                  <Button
                    type="button"
                    variant={isSelected ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedImpactId(rec.id);
                      setInspectedProvenance(null);
                      setInspectedHistory(null);
                    }}
                    aria-pressed={isSelected}
                  >
                    {isSelected ? "Selecionado" : "Gerenciar Versões"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detalhe de versões e ações do registro selecionado */}
        {selectedRecord ? (
          <div className="impact-version-inspector" aria-label="Versões do impacto selecionado">
            <div className="fieldset-header-row">
              <div>
                <h3>
                  Versões de:{" "}
                  {selectedRecord.versions[selectedRecord.versions.length - 1]?.title}
                </h3>
                <p className="form-helper">
                  ID: <code>{selectedRecord.id}</code> • Revisão atual:{" "}
                  <code>{selectedRecord.revision}</code> • Ponteiro{" "}
                  <code>publishedVersion</code>:{" "}
                  <strong>
                    {selectedRecord.publishedVersion !== null
                      ? `v${selectedRecord.publishedVersion}`
                      : "null (não exposto na vitrine)"}
                  </strong>
                </p>
              </div>

              <div className="draft-buttons">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleTogglePhotoAuthorization(
                      selectedRecord.id,
                      !selectedRecord.teacherPhotoPublicationAuthorized
                    )
                  }
                >
                  {selectedRecord.teacherPhotoPublicationAuthorized
                    ? "Revogar Exibição de Fotos (AC-S3-09)"
                    : "Autorizar Fotos Públicas (AC-S3-09)"}
                </Button>

                {selectedRecord.publishedVersion !== null ? (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleWithdrawImpact(selectedRecord.id)}
                  >
                    Retirar Publicação (DELETE /publication)
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="impact-versions-grid">
              {selectedRecord.versions.map((ver) => {
                const isCurrentlyPublished =
                  selectedRecord.publishedVersion === ver.version &&
                  selectedRecord.teacherPublicationOptIn;

                return (
                  <div key={ver.version} className="impact-version-card">
                    <div className="impact-card-top">
                      <div className="impact-badge-row">
                        <Badge variant="neutral">Versão v{ver.version}</Badge>
                        <Badge variant={ver.approved ? "success" : "warning"}>
                          {ver.approved ? "Aprovada" : "Rascunho (Não Aprovada)"}
                        </Badge>
                        {isCurrentlyPublished ? (
                          <Badge variant="info">Ativa na Vitrine Pública</Badge>
                        ) : null}
                      </div>
                    </div>

                    <h4>{ver.title}</h4>
                    <p className="impact-card-summary">{ver.summary}</p>

                    <div className="impact-version-buttons">
                      {!ver.approved ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            handleApproveVersion(selectedRecord.id, ver.version)
                          }
                        >
                          Aprovar v{ver.version} (AC-02)
                        </Button>
                      ) : null}

                      {!isCurrentlyPublished ? (
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            handlePublishVersion(selectedRecord.id, ver.version)
                          }
                        >
                          Publicar v{ver.version} (AC-03)
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleInspectAudit(selectedRecord.id, ver.version)
                        }
                      >
                        Auditar Origem/Histórico v{ver.version} (AC-05)
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Painel de Proveniência e Histórico (AC-05 — visível apenas após sucesso com permissão AUDIT) */}
            {inspectedProvenance ? (
              <div
                className="impact-audit-panel"
                role="region"
                aria-label="Dados de proveniência e histórico de auditoria"
              >
                <h4>
                  Rastreabilidade de Origem (AC-05 • Versão v
                  {inspectedProvenance.version})
                </h4>
                <div className="impact-audit-grid">
                  <p>
                    <strong>Referência de Origem:</strong>{" "}
                    <code>{inspectedProvenance.sourceReference}</code>
                  </p>
                  <p>
                    <strong>Responsável:</strong>{" "}
                    {inspectedProvenance.responsibleReference}
                  </p>
                  <p>
                    <strong>Período de Execução:</strong>{" "}
                    {inspectedProvenance.periodStart} a{" "}
                    {inspectedProvenance.periodEnd}
                  </p>
                  <p>
                    <strong>Criado por:</strong> {inspectedProvenance.createdBy}{" "}
                    em {inspectedProvenance.createdAt}
                  </p>
                  <p>
                    <strong>Aprovado por:</strong>{" "}
                    {inspectedProvenance.approvedBy ?? "Pendente"}
                    {inspectedProvenance.approvedAt
                      ? ` em ${inspectedProvenance.approvedAt}`
                      : ""}
                  </p>
                </div>

                {inspectedHistory && inspectedHistory.length > 0 ? (
                  <div style={{ marginTop: "1rem" }}>
                    <h5>Histórico de Eventos Comprometidos (BE-019):</h5>
                    <ul className="impact-history-list">
                      {inspectedHistory.map((ev) => (
                        <li key={ev.revision}>
                          Revisão <code>#{ev.revision}</code> • Ação:{" "}
                          <strong>{ev.action}</strong> (v{ev.version}) • Ator:{" "}
                          <code>{ev.actor}</code> • Correlation-ID:{" "}
                          <code>{ev.correlationId}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* SEÇÃO 3: FORMULÁRIO DE RASCUNHO / NOVA VERSÃO COM ORIGEM OBRIGATÓRIA (AC-01 / AC-03) */}
      <form
        className="form-fieldset"
        onSubmit={handleDraftSubmit}
        noValidate
        aria-labelledby="form-rascunho-impacto-heading"
      >
        <div className="fieldset-header-row">
          <div>
            <h2 id="form-rascunho-impacto-heading" style={{ margin: 0 }}>
              3. Registrar Rascunho ou Nova Versão de Impacto (AC-01 / AC-03)
            </h2>
            <p className="fieldset-hint">
              Todo rascunho exige referência de origem, responsável e período válido
              (<code>AC-01</code>). Rascunhos criados ou revisados permanecem ocultos
              da vitrine pública até aprovação e publicação explícitas.
            </p>
          </div>

          <div className="draft-buttons" role="group" aria-label="Modo do formulário">
            <Button
              type="button"
              variant={formMode === "CREATE" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFormMode("CREATE")}
              aria-pressed={formMode === "CREATE"}
            >
              Novo Registro (POST /impacts)
            </Button>
            <Button
              type="button"
              variant={formMode === "REVISE" ? "primary" : "outline"}
              size="sm"
              onClick={() => setFormMode("REVISE")}
              aria-pressed={formMode === "REVISE"}
            >
              Nova Versão no Selecionado (POST /versions)
            </Button>
          </div>
        </div>

        {formMode === "REVISE" && selectedRecord ? (
          <Alert variant="info" title="Modo de Revisão de Versão (AC-03)">
            Você está criando a versão{" "}
            <strong>v{selectedRecord.latestVersion + 1}</strong> para o impacto{" "}
            <code>{selectedRecord.id}</code>. Se já houver uma versão publicada
            ativa (v{selectedRecord.publishedVersion ?? "nenhuma"}), ela{" "}
            <strong>permanecerá inalterada na vitrine pública</strong> enquanto a
            nova versão estiver em rascunho.
          </Alert>
        ) : null}

        {formMode === "CREATE" ? (
          <div className="impact-form-row">
            <div className="form-group">
              <label htmlFor="draft-course" className="form-label">
                Curso Vinculado
              </label>
              <select
                id="draft-course"
                className="form-select"
                value={draftCourse}
                onChange={(e) => setDraftCourse(e.target.value)}
              >
                {COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="draft-modality" className="form-label">
                Modalidade Acadêmica
              </label>
              <select
                id="draft-modality"
                className="form-select"
                value={draftModality}
                onChange={(e) =>
                  setDraftModality(e.target.value as "PI" | "EXTENSAO")
                }
              >
                <option value="EXTENSAO">Extensão Universitária</option>
                <option value="PI">Projeto Integrador (PI)</option>
              </select>
            </div>
          </div>
        ) : null}

        <Input
          ref={titleRef}
          id="impact-draft-title"
          label="Título Público do Impacto"
          required
          maxLength={IMPACT_CONSTRAINTS.TITLE_MAX}
          placeholder="Ex.: Laboratório Aberto de Manufatura Digital para Escolas Técnicas"
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          error={fieldErrors.title}
          helperText="Entre 1 e 200 caracteres. Exibido no portal somente após aprovação e publicação."
        />

        <Textarea
          ref={summaryRef}
          id="impact-draft-summary"
          label="Resumo Público Aprovável"
          required
          rows={4}
          maxLength={IMPACT_CONSTRAINTS.SUMMARY_MAX}
          currentLength={draftSummary.length}
          placeholder="Descreva os resultados institucionais aprovados para divulgação pública, sem incluir notas ou horas individuais de estudantes..."
          value={draftSummary}
          onChange={(e) => setDraftSummary(e.target.value)}
          error={fieldErrors.summary}
          helperText="Não inclua CPF, notas individuais ou métricas não homologadas pelo PO (SPEC-PORTAL-002)."
        />

        <div className="impact-form-row">
          <Input
            ref={sourceRefInput}
            id="impact-source-reference"
            label="Referência de Origem (Proveniência Interna • AC-01)"
            required
            maxLength={IMPACT_CONSTRAINTS.SOURCE_REF_MAX}
            placeholder="Ex.: REL-EXT-2026-301-SOROCABA"
            value={draftSourceRef}
            onChange={(e) => setDraftSourceRef(e.target.value)}
            error={fieldErrors.sourceReference}
            helperText="Obrigatório para rastreabilidade. Nunca é exposto no DTO público."
          />

          <Input
            ref={responsibleRefInput}
            id="impact-responsible-reference"
            label="Docente ou Coordenação Responsável (AC-01)"
            required
            maxLength={IMPACT_CONSTRAINTS.RESPONSIBLE_REF_MAX}
            placeholder="Ex.: Prof. Dr. Marcos Vinícius Almeida"
            value={draftResponsibleRef}
            onChange={(e) => setDraftResponsibleRef(e.target.value)}
            error={fieldErrors.responsibleReference}
            helperText="Identificação institucional do responsável pela validação."
          />
        </div>

        <div className="impact-form-row">
          <Input
            ref={periodStartRef}
            id="impact-period-start"
            type="date"
            label="Data Inicial do Período (AC-01)"
            required
            value={draftPeriodStart}
            onChange={(e) => setDraftPeriodStart(e.target.value)}
            error={fieldErrors.periodStart}
          />

          <Input
            ref={periodEndRef}
            id="impact-period-end"
            type="date"
            label="Data Final do Período (AC-01)"
            required
            value={draftPeriodEnd}
            onChange={(e) => setDraftPeriodEnd(e.target.value)}
            error={fieldErrors.periodEnd}
            helperText="Deve ser igual ou posterior à data inicial."
          />
        </div>

        <div className="form-actions-footer">
          <span className="form-helper">
            Perfil em execução: <strong>{activeProfile.label}</strong>
          </span>
          <div className="actions-right">
            <Button type="submit" variant="primary">
              {formMode === "CREATE"
                ? "Salvar Rascunho de Impacto"
                : "Registrar Nova Versão em Rascunho"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

