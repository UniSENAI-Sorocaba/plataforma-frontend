/**
 * Tipos e contratos de domínio para Publicação e Vitrine de Impacto Comunitário (FE-016).
 *
 * Alinhado a:
 * - SPEC-PORTAL-002 (Impacto comunitário) e SPEC-PORTAL-001 (Catálogo público)
 * - Pacote S4-extensao-impacto-publicacao.md (AC-S4-07, AC-S4-08, AC-S4-09)
 * - Regras oficiais do Caderno de Validações (official-validation-decisions.md)
 * - Contrato proposto de BE-019 (contracts/impact.openapi.json — OpenAPI 3.1)
 */

export type ImpactActorRole =
  | "PUBLIC_VISITOR"
  | "STUDENT_MEMBER"
  | "FACULTY_ADVISOR"
  | "COORDINATION"
  | "AUDITOR";

export type ImpactPermission =
  | "READ_PUBLIC"
  | "READ"
  | "CREATE"
  | "REVISE"
  | "APPROVE"
  | "PUBLISH"
  | "WITHDRAW"
  | "AUDIT";

export type ImpactLifecycleStatus =
  | "DRAFT"
  | "APPROVED_UNPUBLISHED"
  | "PUBLISHED"
  | "WITHDRAWN";

export type ImpactActionType =
  | "CREATE"
  | "REVISE"
  | "APPROVE"
  | "PUBLISH"
  | "WITHDRAW";

/**
 * Schema ProvenanceInput (BE-019 OpenAPI 3.1)
 * Rascunho exige origem, responsável e período válido (AC-01).
 */
export interface ImpactProvenanceInput {
  sourceReference: string;
  responsibleReference: string;
  periodStart: string;
  periodEnd: string;
}

/**
 * Schema DraftInput (BE-019 OpenAPI 3.1)
 */
export interface ImpactDraftInput {
  title: string;
  summary: string;
  provenance: ImpactProvenanceInput;
}

/**
 * Schema PublicationInput (BE-019 OpenAPI 3.1)
 */
export interface ImpactPublicationInput {
  version: number;
}

/**
 * Schema PublicResponse (BE-019 OpenAPI 3.1) + metadados públicos aprovados do projeto.
 *
 * Allowlist estrita (AC-02, AC-03, AC-S4-07, AC-S4-08, AC-PORTAL-001-04, AC-PORTAL-001-05):
 * - NUNCA contém provenance, sourceReference, responsibleReference, createdBy ou approvedBy.
 * - NUNCA contém horas individuais (individualStudentHours) ou notas individuais (individualStudentGrades).
 * - NUNCA contém métricas não aprovadas pelo PO (unapprovedMetrics).
 * - NUNCA contém fotos sem autorização explícita do docente responsável.
 */
export interface ImpactPublicResponse {
  id: string;
  version: number;
  title: string;
  summary: string;
  course?: string;
  semester?: string;
  ods?: number[];
  modality?: "PI" | "EXTENSAO";
  projectGrade?: number | null;
  authorizedPhotoCaptions?: string[];
  publishedAt?: string;
}

/**
 * Schema VersionResponse (BE-019 OpenAPI 3.1)
 */
export interface ImpactVersionResponse {
  version: number;
  title: string;
  summary: string;
  approved: boolean;
}

/**
 * Schema VersionsPage (BE-019 OpenAPI 3.1)
 */
export interface ImpactVersionsPage {
  items: ImpactVersionResponse[];
  page: number;
  size: number;
  totalElements: number;
}

/**
 * Schema ManagementResponse (BE-019 OpenAPI 3.1)
 */
export interface ImpactManagementResponse {
  id: string;
  revision: number;
  publishedVersion: number | null;
  latestVersion: number;
  etag: string;
  correlationId: string;
  cacheControl: "no-store";
}

/**
 * Schema ProvenanceResponse (BE-019 OpenAPI 3.1 — restrito à permissão AUDIT / AC-05)
 */
export interface ImpactProvenanceResponse {
  id: string;
  version: number;
  sourceReference: string;
  responsibleReference: string;
  periodStart: string;
  periodEnd: string;
  createdBy: string;
  createdAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

/**
 * Item do Schema HistoryResponse (BE-019 OpenAPI 3.1 — restrito à permissão AUDIT)
 */
export interface ImpactHistoryEvent {
  impactId: string;
  revision: number;
  action: ImpactActionType;
  version: number;
  actor: string;
  at: string;
  correlationId: string;
  result: "SUCCESS";
}

/**
 * Schema HistoryResponse (BE-019 OpenAPI 3.1)
 */
export interface ImpactHistoryResponse {
  items: ImpactHistoryEvent[];
  page: number;
  size: number;
  totalElements: number;
}

/**
 * Schema Problem (RFC 9457 — application/problem+json em BE-019)
 */
export interface ImpactProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  correlationId: string;
}

/**
 * Registro interno completo de uma versão (armazenado no servidor/store, nunca exposto diretamente ao público).
 */
export interface ImpactInternalVersionRecord {
  version: number;
  title: string;
  summary: string;
  approved: boolean;
  provenance: ImpactProvenanceInput;
  createdBy: string;
  createdAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

/**
 * Entidade agregada interna de Impacto (suporta múltiplas versões, ponteiro explícito publishedVersion,
 * opção de publicação do docente e dados internos protegidos para verificação de não vazamento).
 */
export interface ImpactAggregateRecord {
  id: string;
  revision: number;
  publishedVersion: number | null;
  latestVersion: number;
  withdrawnAt: string | null;
  publishedAt: string | null;
  teacherPublicationOptIn: boolean;
  teacherPhotoPublicationAuthorized: boolean;
  course: string;
  semester: string;
  ods: number[];
  modality: "PI" | "EXTENSAO";
  projectGrade: number | null;
  internalPhotoAttachments: string[];
  internalStudentGrades: Record<string, number>;
  internalStudentHours: Record<string, number>;
  internalUnapprovedMetrics: string[];
  versions: ImpactInternalVersionRecord[];
  history: ImpactHistoryEvent[];
}

export interface ImpactValidationErrors {
  title?: string;
  summary?: string;
  sourceReference?: string;
  responsibleReference?: string;
  periodStart?: string;
  periodEnd?: string;
  form?: string;
}

export interface ImpactDraftValidationResult {
  isValid: boolean;
  errors: ImpactValidationErrors;
  sanitized?: ImpactDraftInput;
}

export interface ImpactPublicFilterParams {
  query?: string;
  course?: string;
  semester?: string;
  ods?: number | null;
}

export interface ImpactRequestContext {
  actorId: string;
  actorRole: ImpactActorRole;
  ifMatch?: string;
  correlationId?: string;
  nowIso?: string;
}

