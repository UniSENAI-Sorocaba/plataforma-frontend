import type {
  ImpactActorRole,
  ImpactAggregateRecord,
  ImpactDraftInput,
  ImpactDraftValidationResult,
  ImpactLifecycleStatus,
  ImpactPermission,
  ImpactPublicFilterParams,
  ImpactPublicResponse,
  ImpactValidationErrors,
} from "./impact-types";

/**
 * Limites oficiais de BE-019 (contracts/impact.openapi.json)
 */
export const IMPACT_CONSTRAINTS = {
  TITLE_MIN: 1,
  TITLE_MAX: 200,
  SUMMARY_MIN: 1,
  SUMMARY_MAX: 10000,
  SOURCE_REF_MIN: 1,
  SOURCE_REF_MAX: 512,
  RESPONSIBLE_REF_MIN: 1,
  RESPONSIBLE_REF_MAX: 200,
  CORRELATION_ID_REGEX: /^[A-Za-z0-9._-]{1,64}$/,
  ISO_DATE_REGEX: /^\d{4}-\d{2}-\d{2}$/,
  ETAG_REGEX: /^"[1-9][0-9]*"$/,
} as const;

const ROLE_PERMISSIONS: Record<ImpactActorRole, readonly ImpactPermission[]> = {
  PUBLIC_VISITOR: ["READ_PUBLIC"],
  STUDENT_MEMBER: ["READ_PUBLIC", "READ"],
  FACULTY_ADVISOR: [
    "READ_PUBLIC",
    "READ",
    "CREATE",
    "REVISE",
    "APPROVE",
    "PUBLISH",
    "WITHDRAW",
  ],
  COORDINATION: [
    "READ_PUBLIC",
    "READ",
    "CREATE",
    "REVISE",
    "APPROVE",
    "PUBLISH",
    "WITHDRAW",
  ],
  AUDITOR: ["READ_PUBLIC", "READ", "AUDIT"],
};

const ALLOWED_DRAFT_KEYS = new Set(["title", "summary", "provenance"]);
const ALLOWED_PROVENANCE_KEYS = new Set([
  "sourceReference",
  "responsibleReference",
  "periodStart",
  "periodEnd",
]);

/**
 * Verifica se o papel do ator possui a permissão exigida pela operação (BE-019 / BE-010).
 */
export function canActorPerformImpactAction(
  role: ImpactActorRole,
  permission: ImpactPermission
): boolean {
  const allowed = ROLE_PERMISSIONS[role];
  if (!allowed) {
    return false;
  }
  return allowed.includes(permission);
}

/**
 * Sanitiza ou gera um X-Correlation-Id compatível com ImpactRequestFilter.java (BE-019).
 */
export function sanitizeCorrelationId(
  candidate?: string | null,
  fallbackId = "corr-fe016-default"
): string {
  if (
    typeof candidate === "string" &&
    IMPACT_CONSTRAINTS.CORRELATION_ID_REGEX.test(candidate)
  ) {
    return candidate;
  }
  return fallbackId;
}

/**
 * Formata o cabeçalho ETag a partir do número de revisão (BE-019).
 */
export function formatRevisionEtag(revision: number): string {
  return `"${revision}"`;
}

/**
 * Valida cabeçalho If-Match para controle de concorrência otimista (BE-019).
 * Retorna "MISSING_OR_INVALID" (428), "MISMATCH" (412) ou "MATCH" (200).
 */
export function evaluateIfMatchHeader(
  ifMatchHeader: string | undefined,
  currentRevision: number
): "MATCH" | "MISSING_OR_INVALID" | "MISMATCH" {
  if (
    !ifMatchHeader ||
    !IMPACT_CONSTRAINTS.ETAG_REGEX.test(ifMatchHeader.trim())
  ) {
    return "MISSING_OR_INVALID";
  }
  const expected = formatRevisionEtag(currentRevision);
  return ifMatchHeader.trim() === expected ? "MATCH" : "MISMATCH";
}

/**
 * Verifica se uma string está no formato YYYY-MM-DD e corresponde a uma data de calendário válida.
 */
export function isValidIsoDateString(value: string): boolean {
  if (!IMPACT_CONSTRAINTS.ISO_DATE_REGEX.test(value)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/**
 * Valida payload de criação/revisão de rascunho de impacto (AC-01 / DraftInput / ProvenanceInput).
 * Rejeita campos extras inesperados (additionalProperties: false), origem/responsável vazios e período invertido.
 */
export function validateImpactDraftInput(
  rawInput: unknown
): ImpactDraftValidationResult {
  const errors: ImpactValidationErrors = {};

  if (!rawInput || typeof rawInput !== "object" || Array.isArray(rawInput)) {
    return {
      isValid: false,
      errors: { form: "O corpo da requisição de rascunho deve ser um objeto JSON válido." },
    };
  }

  const record = rawInput as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!ALLOWED_DRAFT_KEYS.has(key)) {
      return {
        isValid: false,
        errors: {
          form: `Campo adicional não permitido no contrato de rascunho: "${key}".`,
        },
      };
    }
  }

  const title = typeof record.title === "string" ? record.title.trim() : "";
  const summary = typeof record.summary === "string" ? record.summary.trim() : "";

  if (title.length < IMPACT_CONSTRAINTS.TITLE_MIN) {
    errors.title = "O título público do impacto é obrigatório.";
  } else if (title.length > IMPACT_CONSTRAINTS.TITLE_MAX) {
    errors.title = `O título deve ter no máximo ${IMPACT_CONSTRAINTS.TITLE_MAX} caracteres.`;
  }

  if (summary.length < IMPACT_CONSTRAINTS.SUMMARY_MIN) {
    errors.summary = "O resumo público aprovado do impacto é obrigatório.";
  } else if (summary.length > IMPACT_CONSTRAINTS.SUMMARY_MAX) {
    errors.summary = `O resumo deve ter no máximo ${IMPACT_CONSTRAINTS.SUMMARY_MAX} caracteres.`;
  }

  const rawProvenance = record.provenance;
  if (
    !rawProvenance ||
    typeof rawProvenance !== "object" ||
    Array.isArray(rawProvenance)
  ) {
    errors.sourceReference = "A origem rastreável do rascunho é obrigatória (AC-01).";
    errors.responsibleReference = "O responsável pela origem é obrigatório (AC-01).";
    errors.periodStart = "A data inicial do período é obrigatória (AC-01).";
    errors.periodEnd = "A data final do período é obrigatória (AC-01).";
    return { isValid: false, errors };
  }

  const provRecord = rawProvenance as Record<string, unknown>;
  for (const key of Object.keys(provRecord)) {
    if (!ALLOWED_PROVENANCE_KEYS.has(key)) {
      return {
        isValid: false,
        errors: {
          form: `Campo adicional não permitido em provenance: "${key}".`,
        },
      };
    }
  }

  const sourceReference =
    typeof provRecord.sourceReference === "string"
      ? provRecord.sourceReference.trim()
      : "";
  const responsibleReference =
    typeof provRecord.responsibleReference === "string"
      ? provRecord.responsibleReference.trim()
      : "";
  const periodStart =
    typeof provRecord.periodStart === "string"
      ? provRecord.periodStart.trim()
      : "";
  const periodEnd =
    typeof provRecord.periodEnd === "string" ? provRecord.periodEnd.trim() : "";

  if (sourceReference.length < IMPACT_CONSTRAINTS.SOURCE_REF_MIN) {
    errors.sourceReference =
      "A referência de origem é obrigatória para registrar rascunho de impacto (AC-01).";
  } else if (sourceReference.length > IMPACT_CONSTRAINTS.SOURCE_REF_MAX) {
    errors.sourceReference = `A referência de origem deve ter no máximo ${IMPACT_CONSTRAINTS.SOURCE_REF_MAX} caracteres.`;
  }

  if (responsibleReference.length < IMPACT_CONSTRAINTS.RESPONSIBLE_REF_MIN) {
    errors.responsibleReference =
      "A identificação do docente/responsável é obrigatória (AC-01).";
  } else if (
    responsibleReference.length > IMPACT_CONSTRAINTS.RESPONSIBLE_REF_MAX
  ) {
    errors.responsibleReference = `O responsável deve ter no máximo ${IMPACT_CONSTRAINTS.RESPONSIBLE_REF_MAX} caracteres.`;
  }

  const isStartValid = isValidIsoDateString(periodStart);
  const isEndValid = isValidIsoDateString(periodEnd);

  if (!periodStart) {
    errors.periodStart = "Informe a data inicial do período de referência.";
  } else if (!isStartValid) {
    errors.periodStart = "Data inicial inválida. Utilize o formato AAAA-MM-DD.";
  }

  if (!periodEnd) {
    errors.periodEnd = "Informe a data final do período de referência.";
  } else if (!isEndValid) {
    errors.periodEnd = "Data final inválida. Utilize o formato AAAA-MM-DD.";
  }

  if (isStartValid && isEndValid && periodStart > periodEnd) {
    errors.periodEnd =
      "O período é inválido: a data final deve ser igual ou posterior à data inicial (AC-01).";
  }

  const isValid = Object.keys(errors).length === 0;
  if (!isValid) {
    return { isValid: false, errors };
  }

  const sanitized: ImpactDraftInput = {
    title,
    summary,
    provenance: {
      sourceReference,
      responsibleReference,
      periodStart,
      periodEnd,
    },
  };

  return {
    isValid: true,
    errors: {},
    sanitized,
  };
}

/**
 * Determina o estado de ciclo de vida do registro de impacto para exibição administrativa.
 */
export function resolveImpactLifecycleStatus(
  record: ImpactAggregateRecord
): ImpactLifecycleStatus {
  if (
    record.publishedVersion !== null &&
    record.teacherPublicationOptIn &&
    record.versions.some(
      (v) => v.version === record.publishedVersion && v.approved
    )
  ) {
    return "PUBLISHED";
  }

  if (record.withdrawnAt !== null && record.publishedVersion === null) {
    return "WITHDRAWN";
  }

  const hasAnyApprovedVersion = record.versions.some((v) => v.approved);
  if (hasAnyApprovedVersion) {
    return "APPROVED_UNPUBLISHED";
  }

  return "DRAFT";
}

/**
 * Projeta um registro interno para o DTO público estrito (PublicResponse — BE-019 / FE-016).
 *
 * Regras críticas de segurança e privacidade verificadas:
 * 1. AC-02: Se `publishedVersion === null` (rascunho ou aprovado sem publicação) ou se o docente
 *    não habilitou `teacherPublicationOptIn`, retorna `null` (nunca renderiza).
 * 2. AC-03: Busca estritamente a versão apontada por `publishedVersion` e exige `approved === true`.
 *    Se existir uma revisão posterior (`latestVersion > publishedVersion`) ainda em rascunho ou não publicada,
 *    ela é ignorada e somente a versão aprovada/publicada é projetada.
 * 3. AC-04: Se o impacto foi retirado (`publishedVersion === null`), retorna `null`.
 * 4. AC-S4-07 / AC-PORTAL-001-04: Jamais copia `provenance`, `sourceReference`, `responsibleReference`,
 *    `internalStudentHours`, `internalStudentGrades` ou `internalUnapprovedMetrics`.
 * 5. AC-S3-09 / AC-PORTAL-001-05: Só inclui legendas/fotos públicas se `teacherPhotoPublicationAuthorized === true`.
 */
export function toPublicImpactDto(
  record: ImpactAggregateRecord
): ImpactPublicResponse | null {
  if (record.publishedVersion === null || !record.teacherPublicationOptIn) {
    return null;
  }

  const publishedVersionEntry = record.versions.find(
    (v) => v.version === record.publishedVersion
  );

  if (!publishedVersionEntry || !publishedVersionEntry.approved) {
    return null;
  }

  const dto: ImpactPublicResponse = {
    id: record.id,
    version: publishedVersionEntry.version,
    title: publishedVersionEntry.title,
    summary: publishedVersionEntry.summary,
    course: record.course,
    semester: record.semester,
    ods: [...record.ods],
    modality: record.modality,
    projectGrade: record.projectGrade,
    authorizedPhotoCaptions: record.teacherPhotoPublicationAuthorized
      ? [...record.internalPhotoAttachments]
      : [],
    publishedAt: record.publishedAt ?? undefined,
  };

  return dto;
}

/**
 * Filtra uma lista de registros internos, retornando EXCLUSIVAMENTE os DTOs públicos
 * aprovados e efetivamente publicados, aplicando filtros opcionais de busca, curso, semestre e ODS.
 */
export function filterPublishedImpactsForVisitor(
  records: readonly ImpactAggregateRecord[],
  filters: ImpactPublicFilterParams = {}
): ImpactPublicResponse[] {
  const queryNormalized = (filters.query ?? "").trim().toLowerCase();
  const courseFilter = (filters.course ?? "").trim();
  const semesterFilter = (filters.semester ?? "").trim();
  const odsFilter =
    typeof filters.ods === "number" && !Number.isNaN(filters.ods)
      ? filters.ods
      : null;

  const publishedList: ImpactPublicResponse[] = [];

  for (const record of records) {
    const publicDto = toPublicImpactDto(record);
    if (!publicDto) {
      continue;
    }

    if (courseFilter && publicDto.course !== courseFilter) {
      continue;
    }

    if (semesterFilter && publicDto.semester !== semesterFilter) {
      continue;
    }

    if (odsFilter !== null && !(publicDto.ods ?? []).includes(odsFilter)) {
      continue;
    }

    if (queryNormalized) {
      const haystack = `${publicDto.title} ${publicDto.summary} ${publicDto.course ?? ""}`.toLowerCase();
      if (!haystack.includes(queryNormalized)) {
        continue;
      }
    }

    publishedList.push(publicDto);
  }

  return publishedList;
}

