import type {
  ImpactActorRole,
  ImpactAggregateRecord,
  ImpactHistoryEvent,
  ImpactHistoryResponse,
  ImpactManagementResponse,
  ImpactPermission,
  ImpactProblemDetails,
  ImpactProvenanceResponse,
  ImpactPublicFilterParams,
  ImpactPublicResponse,
  ImpactRequestContext,
  ImpactVersionsPage,
} from "./impact-types";

const CORRELATION_ID_REGEX = /^[A-Za-z0-9._-]{1,64}$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ETAG_REGEX = /^"[1-9][0-9]*"$/;

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

function sanitizeCorrelation(
  candidate?: string | null,
  fallbackId = "corr-fe016-default"
): string {
  if (typeof candidate === "string" && CORRELATION_ID_REGEX.test(candidate)) {
    return candidate;
  }
  return fallbackId;
}

function formatEtag(revision: number): string {
  return `"${revision}"`;
}

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_REGEX.test(value)) {
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

function parseAndValidateDraft(rawInput: unknown): {
  valid: boolean;
  errorDetail?: string;
  sanitized?: {
    title: string;
    summary: string;
    provenance: {
      sourceReference: string;
      responsibleReference: string;
      periodStart: string;
      periodEnd: string;
    };
  };
} {
  if (!rawInput || typeof rawInput !== "object" || Array.isArray(rawInput)) {
    return {
      valid: false,
      errorDetail: "O corpo da requisição de rascunho deve ser um objeto JSON válido.",
    };
  }

  const record = rawInput as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!ALLOWED_DRAFT_KEYS.has(key)) {
      return {
        valid: false,
        errorDetail: `Campo adicional não permitido no contrato de rascunho: "${key}".`,
      };
    }
  }

  const title = typeof record.title === "string" ? record.title.trim() : "";
  const summary = typeof record.summary === "string" ? record.summary.trim() : "";

  if (title.length < 1 || title.length > 200) {
    return {
      valid: false,
      errorDetail: "O título público do impacto é obrigatório (1..200 caracteres).",
    };
  }

  if (summary.length < 1 || summary.length > 10000) {
    return {
      valid: false,
      errorDetail: "O resumo público do impacto é obrigatório (1..10000 caracteres).",
    };
  }

  const rawProvenance = record.provenance;
  if (
    !rawProvenance ||
    typeof rawProvenance !== "object" ||
    Array.isArray(rawProvenance)
  ) {
    return {
      valid: false,
      errorDetail: "A origem rastreável (provenance) é obrigatória (AC-01).",
    };
  }

  const provRecord = rawProvenance as Record<string, unknown>;
  for (const key of Object.keys(provRecord)) {
    if (!ALLOWED_PROVENANCE_KEYS.has(key)) {
      return {
        valid: false,
        errorDetail: `Campo adicional não permitido em provenance: "${key}".`,
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

  if (sourceReference.length < 1 || sourceReference.length > 512) {
    return {
      valid: false,
      errorDetail: "A referência de origem é obrigatória (AC-01).",
    };
  }

  if (responsibleReference.length < 1 || responsibleReference.length > 200) {
    return {
      valid: false,
      errorDetail: "O responsável pela origem é obrigatório (AC-01).",
    };
  }

  if (!isValidIsoDate(periodStart) || !isValidIsoDate(periodEnd)) {
    return {
      valid: false,
      errorDetail: "As datas do período devem estar no formato AAAA-MM-DD (AC-01).",
    };
  }

  if (periodStart > periodEnd) {
    return {
      valid: false,
      errorDetail:
        "O período é inválido: a data final deve ser igual ou posterior à data inicial (AC-01).",
    };
  }

  return {
    valid: true,
    sanitized: {
      title,
      summary,
      provenance: {
        sourceReference,
        responsibleReference,
        periodStart,
        periodEnd,
      },
    },
  };
}

function projectPublicDto(
  record: ImpactAggregateRecord
): ImpactPublicResponse | null {
  if (record.publishedVersion === null || !record.teacherPublicationOptIn) {
    return null;
  }

  const publishedEntry = record.versions.find(
    (v) => v.version === record.publishedVersion
  );

  if (!publishedEntry || !publishedEntry.approved) {
    return null;
  }

  return {
    id: record.id,
    version: publishedEntry.version,
    title: publishedEntry.title,
    summary: publishedEntry.summary,
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
}

/**
 * Erro contratual estruturado segundo a RFC 9457 (application/problem+json de BE-019).
 */
export class ImpactContractError extends Error {
  public readonly status: number;
  public readonly problem: ImpactProblemDetails;
  public readonly cacheControl = "no-store" as const;

  constructor(
    status: number,
    title: string,
    detail: string,
    correlationId: string,
    instance?: string
  ) {
    super(detail);
    this.name = "ImpactContractError";
    this.status = status;
    this.problem = {
      type: "about:blank",
      title,
      status,
      detail,
      ...(instance ? { instance } : {}),
      correlationId: sanitizeCorrelation(correlationId),
    };
  }
}

/**
 * Repositório isolado por instância (sem estado mutável global em escopo de módulo — previne SEG-06 em SSR).
 */
export interface ImpactStore {
  records: Map<string, ImpactAggregateRecord>;
  sequence: number;
}

const INITIAL_RECORDS_SEED: readonly ImpactAggregateRecord[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    revision: 3,
    publishedVersion: 1,
    latestVersion: 2,
    withdrawnAt: null,
    publishedAt: "2026-10-15T14:30:00Z",
    teacherPublicationOptIn: true,
    teacherPhotoPublicationAuthorized: true,
    course: "Engenharia de Software",
    semester: "2026.2",
    ods: [4, 9, 11],
    modality: "EXTENSAO",
    projectGrade: 9.6,
    internalPhotoAttachments: [
      "Oficina de robótica sustentável com estudantes da rede pública de Sorocaba (autorizada pelo docente responsável)",
      "Bancada de sensores IoT instalada na horta escolar comunitária",
    ],
    internalStudentGrades: {
      "RA-2026101": 9.8,
      "RA-2026102": 9.4,
    },
    internalStudentHours: {
      "RA-2026101": 48,
      "RA-2026102": 44,
    },
    internalUnapprovedMetrics: [
      "Estimativa interna preliminar de 450 moradores indiretos (aguardando definição oficial do PO)",
    ],
    versions: [
      {
        version: 1,
        title: "Automação de Hortas Escolares e Educação Ambiental em Sorocaba",
        summary:
          "Implantação de sistema aberto de irrigação assistida por sensores de umidade em escolas públicas parceiras, acompanhado de oficinas práticas de programação e sustentabilidade para estudantes do ensino fundamental.",
        approved: true,
        provenance: {
          sourceReference: "REL-EXT-2026-014-UNISENAI-SOROCABA",
          responsibleReference:
            "Prof. Dr. Marcos Vinícius Almeida (Docente Responsável)",
          periodStart: "2026-08-01",
          periodEnd: "2026-10-10",
        },
        createdBy: "prof.marcos.almeida",
        createdAt: "2026-10-12T10:00:00Z",
        approvedBy: "coord.extensao.sorocaba",
        approvedAt: "2026-10-14T16:20:00Z",
      },
      {
        version: 2,
        title:
          "[RASCUNHO EM REVISÃO v2] Automação de Hortas Escolares — Expansão Semestral",
        summary:
          "Texto em edição da versão 2 ainda não aprovada: este conteúdo não pode substituir a versão 1 na vitrine pública enquanto não passar por aprovação e publicação explícita (AC-03).",
        approved: false,
        provenance: {
          sourceReference: "REL-EXT-2026-014-ADITIVO-V2",
          responsibleReference:
            "Prof. Dr. Marcos Vinícius Almeida (Docente Responsável)",
          periodStart: "2026-10-11",
          periodEnd: "2026-11-30",
        },
        createdBy: "prof.marcos.almeida",
        createdAt: "2026-10-25T09:15:00Z",
        approvedBy: null,
        approvedAt: null,
      },
    ],
    history: [
      {
        impactId: "10000000-0000-4000-8000-000000000001",
        revision: 1,
        action: "CREATE",
        version: 1,
        actor: "prof.marcos.almeida",
        at: "2026-10-12T10:00:00Z",
        correlationId: "corr-seed-101",
        result: "SUCCESS",
      },
      {
        impactId: "10000000-0000-4000-8000-000000000001",
        revision: 2,
        action: "APPROVE",
        version: 1,
        actor: "coord.extensao.sorocaba",
        at: "2026-10-14T16:20:00Z",
        correlationId: "corr-seed-102",
        result: "SUCCESS",
      },
      {
        impactId: "10000000-0000-4000-8000-000000000001",
        revision: 3,
        action: "PUBLISH",
        version: 1,
        actor: "prof.marcos.almeida",
        at: "2026-10-15T14:30:00Z",
        correlationId: "corr-seed-103",
        result: "SUCCESS",
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    revision: 3,
    publishedVersion: 1,
    latestVersion: 1,
    withdrawnAt: null,
    publishedAt: "2026-10-20T11:00:00Z",
    teacherPublicationOptIn: true,
    teacherPhotoPublicationAuthorized: false,
    course: "Engenharia Mecatrônica",
    semester: "2026.2",
    ods: [3, 9, 10],
    modality: "PI",
    projectGrade: 9.4,
    internalPhotoAttachments: [
      "Foto interna de teste com voluntários (restrita internamente — sem autorização de publicação pública pelo docente)",
    ],
    internalStudentGrades: {
      "RA-2026201": 9.5,
      "RA-2026202": 9.3,
    },
    internalStudentHours: {
      "RA-2026201": 60,
      "RA-2026202": 60,
    },
    internalUnapprovedMetrics: [],
    versions: [
      {
        version: 1,
        title: "Dispositivo Assistivo de Baixo Custo para Reabilitação Motora",
        summary:
          "Desenvolvimento de órtese articulada impressa em manufatura aditiva em parceria com centro de reabilitação regional, com documentação técnica aberta para reprodução em laboratórios acadêmicos.",
        approved: true,
        provenance: {
          sourceReference: "ATA-PI-2026-089-MECATRONICA",
          responsibleReference:
            "Profa. Dra. Helena Costa (Docente Orientadora)",
          periodStart: "2026-07-15",
          periodEnd: "2026-10-18",
        },
        createdBy: "profa.helena.costa",
        createdAt: "2026-10-18T15:00:00Z",
        approvedBy: "profa.helena.costa",
        approvedAt: "2026-10-19T17:40:00Z",
      },
    ],
    history: [
      {
        impactId: "10000000-0000-4000-8000-000000000002",
        revision: 1,
        action: "CREATE",
        version: 1,
        actor: "profa.helena.costa",
        at: "2026-10-18T15:00:00Z",
        correlationId: "corr-seed-201",
        result: "SUCCESS",
      },
      {
        impactId: "10000000-0000-4000-8000-000000000002",
        revision: 2,
        action: "APPROVE",
        version: 1,
        actor: "profa.helena.costa",
        at: "2026-10-19T17:40:00Z",
        correlationId: "corr-seed-202",
        result: "SUCCESS",
      },
      {
        impactId: "10000000-0000-4000-8000-000000000002",
        revision: 3,
        action: "PUBLISH",
        version: 1,
        actor: "profa.helena.costa",
        at: "2026-10-20T11:00:00Z",
        correlationId: "corr-seed-203",
        result: "SUCCESS",
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    revision: 2,
    publishedVersion: null,
    latestVersion: 1,
    withdrawnAt: null,
    publishedAt: null,
    teacherPublicationOptIn: true,
    teacherPhotoPublicationAuthorized: false,
    course: "Análise e Desenvolvimento de Sistemas",
    semester: "2026.2",
    ods: [8, 12],
    modality: "EXTENSAO",
    projectGrade: 9.1,
    internalPhotoAttachments: [],
    internalStudentGrades: { "RA-2026301": 9.1 },
    internalStudentHours: { "RA-2026301": 36 },
    internalUnapprovedMetrics: [],
    versions: [
      {
        version: 1,
        title:
          "Plataforma de Gestão de Resíduos Eletrônicos para Cooperativas Locais",
        summary:
          "Versão já aprovada tecnicamente, porém ainda NÃO publicada na vitrine externa. Conforme AC-02, aprovação e publicação são etapas separadas e este item permanece oculto para visitantes anônimos.",
        approved: true,
        provenance: {
          sourceReference: "PROC-EXT-2026-112-COOP",
          responsibleReference: "Prof. Me. Ricardo Tavares",
          periodStart: "2026-08-10",
          periodEnd: "2026-10-22",
        },
        createdBy: "prof.ricardo.tavares",
        createdAt: "2026-10-22T13:00:00Z",
        approvedBy: "coord.ads.sorocaba",
        approvedAt: "2026-10-24T10:30:00Z",
      },
    ],
    history: [
      {
        impactId: "10000000-0000-4000-8000-000000000003",
        revision: 1,
        action: "CREATE",
        version: 1,
        actor: "prof.ricardo.tavares",
        at: "2026-10-22T13:00:00Z",
        correlationId: "corr-seed-301",
        result: "SUCCESS",
      },
      {
        impactId: "10000000-0000-4000-8000-000000000003",
        revision: 2,
        action: "APPROVE",
        version: 1,
        actor: "coord.ads.sorocaba",
        at: "2026-10-24T10:30:00Z",
        correlationId: "corr-seed-302",
        result: "SUCCESS",
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    revision: 1,
    publishedVersion: null,
    latestVersion: 1,
    withdrawnAt: null,
    publishedAt: null,
    teacherPublicationOptIn: false,
    teacherPhotoPublicationAuthorized: false,
    course: "Engenharia de Produção",
    semester: "2026.2",
    ods: [7, 9],
    modality: "PI",
    projectGrade: null,
    internalPhotoAttachments: [],
    internalStudentGrades: { "RA-2026401": 8.7 },
    internalStudentHours: { "RA-2026401": 20 },
    internalUnapprovedMetrics: ["Redução preliminar não auditada"],
    versions: [
      {
        version: 1,
        title: "Diagnóstico Energético em Microindústrias Metalúrgicas",
        summary:
          "Rascunho inicial submetido para revisão docente. Não aprovado e não publicado: bloqueado na vitrine pública (AC-02).",
        approved: false,
        provenance: {
          sourceReference: "RASCUNHO-PI-2026-204",
          responsibleReference: "Prof. Dr. André Lemos",
          periodStart: "2026-09-01",
          periodEnd: "2026-11-15",
        },
        createdBy: "prof.andre.lemos",
        createdAt: "2026-10-26T18:00:00Z",
        approvedBy: null,
        approvedAt: null,
      },
    ],
    history: [
      {
        impactId: "10000000-0000-4000-8000-000000000004",
        revision: 1,
        action: "CREATE",
        version: 1,
        actor: "prof.andre.lemos",
        at: "2026-10-26T18:00:00Z",
        correlationId: "corr-seed-401",
        result: "SUCCESS",
      },
    ],
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    revision: 4,
    publishedVersion: null,
    latestVersion: 1,
    withdrawnAt: "2026-10-27T09:00:00Z",
    publishedAt: null,
    teacherPublicationOptIn: false,
    teacherPhotoPublicationAuthorized: false,
    course: "Engenharia de Software",
    semester: "2026.1",
    ods: [4, 16],
    modality: "EXTENSAO",
    projectGrade: 9.0,
    internalPhotoAttachments: [],
    internalStudentGrades: { "RA-2026501": 9.0 },
    internalStudentHours: { "RA-2026501": 40 },
    internalUnapprovedMetrics: [],
    versions: [
      {
        version: 1,
        title: "Capacitação em Segurança Digital para Associações de Bairro",
        summary:
          "Conteúdo que esteve publicado anteriormente e foi retirado pelo responsável para revisão de dados. Conforme AC-04, a retirada remove imediatamente a exposição pública preservando o histórico interno.",
        approved: true,
        provenance: {
          sourceReference: "REL-EXT-2026-005-SEG",
          responsibleReference: "Profa. Ma. Camila Ferreira",
          periodStart: "2026-03-01",
          periodEnd: "2026-06-20",
        },
        createdBy: "profa.camila.ferreira",
        createdAt: "2026-06-22T10:00:00Z",
        approvedBy: "coord.extensao.sorocaba",
        approvedAt: "2026-06-25T14:00:00Z",
      },
    ],
    history: [
      {
        impactId: "10000000-0000-4000-8000-000000000005",
        revision: 1,
        action: "CREATE",
        version: 1,
        actor: "profa.camila.ferreira",
        at: "2026-06-22T10:00:00Z",
        correlationId: "corr-seed-501",
        result: "SUCCESS",
      },
      {
        impactId: "10000000-0000-4000-8000-000000000005",
        revision: 2,
        action: "APPROVE",
        version: 1,
        actor: "coord.extensao.sorocaba",
        at: "2026-06-25T14:00:00Z",
        correlationId: "corr-seed-502",
        result: "SUCCESS",
      },
      {
        impactId: "10000000-0000-4000-8000-000000000005",
        revision: 3,
        action: "PUBLISH",
        version: 1,
        actor: "profa.camila.ferreira",
        at: "2026-06-26T09:00:00Z",
        correlationId: "corr-seed-503",
        result: "SUCCESS",
      },
      {
        impactId: "10000000-0000-4000-8000-000000000005",
        revision: 4,
        action: "WITHDRAW",
        version: 1,
        actor: "profa.camila.ferreira",
        at: "2026-10-27T09:00:00Z",
        correlationId: "corr-seed-504",
        result: "SUCCESS",
      },
    ],
  },
];

function cloneRecord(record: ImpactAggregateRecord): ImpactAggregateRecord {
  return {
    ...record,
    ods: [...record.ods],
    internalPhotoAttachments: [...record.internalPhotoAttachments],
    internalStudentGrades: { ...record.internalStudentGrades },
    internalStudentHours: { ...record.internalStudentHours },
    internalUnapprovedMetrics: [...record.internalUnapprovedMetrics],
    versions: record.versions.map((v) => ({
      ...v,
      provenance: { ...v.provenance },
    })),
    history: record.history.map((h) => ({ ...h })),
  };
}

/**
 * Cria uma instância isolada de store com dados demonstrativos que cobrem todos os estados de FE-016 / BE-019.
 */
export function createInitialImpactStore(
  seed: readonly ImpactAggregateRecord[] = INITIAL_RECORDS_SEED
): ImpactStore {
  const records = new Map<string, ImpactAggregateRecord>();
  for (const item of seed) {
    records.set(item.id, cloneRecord(item));
  }
  return {
    records,
    sequence: seed.length + 1,
  };
}

function assertAuthorized(
  context: ImpactRequestContext,
  permission: ImpactPermission,
  correlationId: string
): void {
  if (context.actorRole === "PUBLIC_VISITOR" || !context.actorId.trim()) {
    throw new ImpactContractError(
      401,
      "Não autenticado",
      "Autenticação institucional obrigatória para executar esta operação.",
      correlationId
    );
  }

  const allowed = ROLE_PERMISSIONS[context.actorRole] ?? [];
  if (!allowed.includes(permission)) {
    throw new ImpactContractError(
      403,
      "Acesso negado",
      `O perfil "${context.actorRole}" não possui a permissão "${permission}" exigida para esta operação.`,
      correlationId
    );
  }
}

function assertIfMatch(
  ifMatch: string | undefined,
  currentRevision: number,
  correlationId: string
): void {
  if (!ifMatch || !ETAG_REGEX.test(ifMatch.trim())) {
    throw new ImpactContractError(
      428,
      "Precondição obrigatória",
      'Cabeçalho If-Match ausente ou em formato inválido (esperado ETag como "\\"1\\"").',
      correlationId
    );
  }
  const expected = formatEtag(currentRevision);
  if (ifMatch.trim() !== expected) {
    throw new ImpactContractError(
      412,
      "Conflito de revisão (Precondition Failed)",
      `A revisão informada (${ifMatch}) diverge da revisão atual ("${currentRevision}"). Recarregue o registro antes de salvar.`,
      correlationId
    );
  }
}

function toManagementResponse(
  record: ImpactAggregateRecord,
  correlationId: string
): ImpactManagementResponse {
  return {
    id: record.id,
    revision: record.revision,
    publishedVersion: record.publishedVersion,
    latestVersion: record.latestVersion,
    etag: formatEtag(record.revision),
    correlationId,
    cacheControl: "no-store",
  };
}

/**
 * POST /api/v1/impacts — Cria novo rascunho de impacto exigindo origem, responsável e período (AC-01).
 * O rascunho nasce com approved: false e publishedVersion: null (AC-02).
 */
export function createImpactDraft(
  store: ImpactStore,
  rawInput: unknown,
  context: ImpactRequestContext,
  metadata?: {
    course?: string;
    semester?: string;
    ods?: number[];
    modality?: "PI" | "EXTENSAO";
  }
): ImpactManagementResponse {
  const correlationId = sanitizeCorrelation(
    context.correlationId,
    `corr-create-${store.sequence}`
  );
  assertAuthorized(context, "CREATE", correlationId);

  const validation = parseAndValidateDraft(rawInput);
  if (!validation.valid || !validation.sanitized) {
    throw new ImpactContractError(
      400,
      "Erro de validação do rascunho",
      validation.errorDetail ?? "Dados de rascunho inválidos.",
      correlationId
    );
  }

  const id = `10000000-0000-4000-8000-${String(store.sequence).padStart(12, "0")}`;
  store.sequence += 1;
  const nowIso = context.nowIso ?? new Date().toISOString();

  const newRecord: ImpactAggregateRecord = {
    id,
    revision: 1,
    publishedVersion: null,
    latestVersion: 1,
    withdrawnAt: null,
    publishedAt: null,
    teacherPublicationOptIn: false,
    teacherPhotoPublicationAuthorized: false,
    course: metadata?.course ?? "Engenharia de Software",
    semester: metadata?.semester ?? "2026.2",
    ods: metadata?.ods?.length ? [...metadata.ods] : [4, 9],
    modality: metadata?.modality ?? "EXTENSAO",
    projectGrade: null,
    internalPhotoAttachments: [],
    internalStudentGrades: {},
    internalStudentHours: {},
    internalUnapprovedMetrics: [],
    versions: [
      {
        version: 1,
        title: validation.sanitized.title,
        summary: validation.sanitized.summary,
        approved: false,
        provenance: { ...validation.sanitized.provenance },
        createdBy: context.actorId,
        createdAt: nowIso,
        approvedBy: null,
        approvedAt: null,
      },
    ],
    history: [
      {
        impactId: id,
        revision: 1,
        action: "CREATE",
        version: 1,
        actor: context.actorId,
        at: nowIso,
        correlationId,
        result: "SUCCESS",
      },
    ],
  };

  store.records.set(id, newRecord);
  return toManagementResponse(newRecord, correlationId);
}

/**
 * POST /api/v1/impacts/{id}/versions — Cria nova versão em rascunho sem alterar a versão publicada vigente (AC-03).
 */
export function reviseImpactVersion(
  store: ImpactStore,
  id: string,
  rawInput: unknown,
  context: ImpactRequestContext
): ImpactManagementResponse {
  const correlationId = sanitizeCorrelation(
    context.correlationId,
    `corr-revise-${store.sequence}`
  );
  assertAuthorized(context, "REVISE", correlationId);

  const record = store.records.get(id);
  if (!record) {
    throw new ImpactContractError(
      404,
      "Impacto não encontrado",
      `Nenhum registro de impacto encontrado para o identificador "${id}".`,
      correlationId
    );
  }

  assertIfMatch(context.ifMatch, record.revision, correlationId);

  const validation = parseAndValidateDraft(rawInput);
  if (!validation.valid || !validation.sanitized) {
    throw new ImpactContractError(
      400,
      "Erro de validação da revisão",
      validation.errorDetail ?? "Dados da nova versão inválidos.",
      correlationId
    );
  }

  const nextVersion = record.latestVersion + 1;
  const nextRevision = record.revision + 1;
  const nowIso = context.nowIso ?? new Date().toISOString();

  record.latestVersion = nextVersion;
  record.revision = nextRevision;
  record.versions.push({
    version: nextVersion,
    title: validation.sanitized.title,
    summary: validation.sanitized.summary,
    approved: false,
    provenance: { ...validation.sanitized.provenance },
    createdBy: context.actorId,
    createdAt: nowIso,
    approvedBy: null,
    approvedAt: null,
  });

  const event: ImpactHistoryEvent = {
    impactId: record.id,
    revision: nextRevision,
    action: "REVISE",
    version: nextVersion,
    actor: context.actorId,
    at: nowIso,
    correlationId,
    result: "SUCCESS",
  };
  record.history.push(event);

  return toManagementResponse(record, correlationId);
}

/**
 * POST /api/v1/impacts/{id}/versions/{version}/approval — Aprova uma versão imutável sem publicá-la automaticamente (AC-02).
 */
export function approveImpactVersion(
  store: ImpactStore,
  id: string,
  version: number,
  context: ImpactRequestContext
): ImpactManagementResponse {
  const correlationId = sanitizeCorrelation(
    context.correlationId,
    `corr-approve-${version}`
  );
  assertAuthorized(context, "APPROVE", correlationId);

  const record = store.records.get(id);
  if (!record) {
    throw new ImpactContractError(
      404,
      "Impacto não encontrado",
      `Nenhum registro de impacto encontrado para o identificador "${id}".`,
      correlationId
    );
  }

  assertIfMatch(context.ifMatch, record.revision, correlationId);

  const targetVersion = record.versions.find((v) => v.version === version);
  if (!targetVersion) {
    throw new ImpactContractError(
      404,
      "Versão não encontrada",
      `A versão ${version} não existe no impacto "${id}".`,
      correlationId
    );
  }

  if (targetVersion.approved) {
    throw new ImpactContractError(
      409,
      "Versão já aprovada",
      `A versão ${version} já se encontra aprovada.`,
      correlationId
    );
  }

  const nowIso = context.nowIso ?? new Date().toISOString();
  targetVersion.approved = true;
  targetVersion.approvedBy = context.actorId;
  targetVersion.approvedAt = nowIso;

  record.revision += 1;
  record.history.push({
    impactId: record.id,
    revision: record.revision,
    action: "APPROVE",
    version,
    actor: context.actorId,
    at: nowIso,
    correlationId,
    result: "SUCCESS",
  });

  return toManagementResponse(record, correlationId);
}

/**
 * PUT /api/v1/impacts/{id}/publication — Publica explicitamente uma versão previamente aprovada (AC-02, AC-03).
 * Rejeita com 409 se a versão não estiver aprovada.
 */
export function publishImpactVersion(
  store: ImpactStore,
  id: string,
  version: number,
  context: ImpactRequestContext
): ImpactManagementResponse {
  const correlationId = sanitizeCorrelation(
    context.correlationId,
    `corr-publish-${version}`
  );
  assertAuthorized(context, "PUBLISH", correlationId);

  if (!Number.isInteger(version) || version < 1) {
    throw new ImpactContractError(
      400,
      "Versão inválida",
      "O número da versão para publicação deve ser um inteiro positivo.",
      correlationId
    );
  }

  const record = store.records.get(id);
  if (!record) {
    throw new ImpactContractError(
      404,
      "Impacto não encontrado",
      `Nenhum registro de impacto encontrado para o identificador "${id}".`,
      correlationId
    );
  }

  assertIfMatch(context.ifMatch, record.revision, correlationId);

  const targetVersion = record.versions.find((v) => v.version === version);
  if (!targetVersion) {
    throw new ImpactContractError(
      404,
      "Versão não encontrada",
      `A versão ${version} não existe no impacto "${id}".`,
      correlationId
    );
  }

  if (!targetVersion.approved) {
    throw new ImpactContractError(
      409,
      "Publicação bloqueada: versão não aprovada",
      `A versão ${version} ainda está em rascunho e não foi aprovada. Somente versões aprovadas podem ser publicadas no portal (AC-02 / AC-03).`,
      correlationId
    );
  }

  const nowIso = context.nowIso ?? new Date().toISOString();
  record.publishedVersion = version;
  record.teacherPublicationOptIn = true;
  record.publishedAt = nowIso;
  record.withdrawnAt = null;
  record.revision += 1;

  record.history.push({
    impactId: record.id,
    revision: record.revision,
    action: "PUBLISH",
    version,
    actor: context.actorId,
    at: nowIso,
    correlationId,
    result: "SUCCESS",
  });

  return toManagementResponse(record, correlationId);
}

/**
 * DELETE /api/v1/impacts/{id}/publication — Retira a exposição pública imediatamente sem apagar versões ou histórico (AC-04).
 */
export function withdrawImpactPublication(
  store: ImpactStore,
  id: string,
  context: ImpactRequestContext
): ImpactManagementResponse {
  const correlationId = sanitizeCorrelation(
    context.correlationId,
    "corr-withdraw"
  );
  assertAuthorized(context, "WITHDRAW", correlationId);

  const record = store.records.get(id);
  if (!record) {
    throw new ImpactContractError(
      404,
      "Impacto não encontrado",
      `Nenhum registro de impacto encontrado para o identificador "${id}".`,
      correlationId
    );
  }

  assertIfMatch(context.ifMatch, record.revision, correlationId);

  if (record.publishedVersion === null) {
    throw new ImpactContractError(
      409,
      "Impacto não está publicado",
      "Não há versão publicada ativa para retirar neste registro.",
      correlationId
    );
  }

  const withdrawnVersion = record.publishedVersion;
  const nowIso = context.nowIso ?? new Date().toISOString();

  record.publishedVersion = null;
  record.teacherPublicationOptIn = false;
  record.withdrawnAt = nowIso;
  record.revision += 1;

  record.history.push({
    impactId: record.id,
    revision: record.revision,
    action: "WITHDRAW",
    version: withdrawnVersion,
    actor: context.actorId,
    at: nowIso,
    correlationId,
    result: "SUCCESS",
  });

  return toManagementResponse(record, correlationId);
}

/**
 * Alterna a autorização do docente responsável para exibição pública de fotos na versão publicada (AC-PORTAL-001-05 / AC-S3-09).
 */
export function setTeacherPhotoAuthorization(
  store: ImpactStore,
  id: string,
  authorized: boolean,
  context: ImpactRequestContext
): ImpactManagementResponse {
  const correlationId = sanitizeCorrelation(
    context.correlationId,
    "corr-photo-auth"
  );
  assertAuthorized(context, "PUBLISH", correlationId);

  const record = store.records.get(id);
  if (!record) {
    throw new ImpactContractError(
      404,
      "Impacto não encontrado",
      `Nenhum registro de impacto encontrado para o identificador "${id}".`,
      correlationId
    );
  }

  record.teacherPhotoPublicationAuthorized = authorized;
  return toManagementResponse(record, correlationId);
}

/**
 * GET /api/v1/impacts/{id} — Consulta pública anônima (FE-016 / BE-019).
 * Retorna 404 para rascunho, aprovado não publicado ou retirado (AC-02, AC-03, AC-04).
 * Retorna sempre Cache-Control: no-store e X-Correlation-Id sanitizado.
 */
export function readPublicImpact(
  store: ImpactStore,
  id: string,
  correlationId?: string
): {
  data: ImpactPublicResponse;
  headers: { "Cache-Control": "no-store"; "X-Correlation-Id": string };
} {
  const sanitizedCorr = sanitizeCorrelation(correlationId, "corr-public-read");
  const record = store.records.get(id);

  if (!record) {
    throw new ImpactContractError(
      404,
      "Conteúdo público não disponível",
      "O impacto solicitado não existe ou não possui versão publicada.",
      sanitizedCorr
    );
  }

  const dto = projectPublicDto(record);
  if (!dto) {
    throw new ImpactContractError(
      404,
      "Conteúdo público não disponível",
      "Rascunhos, versões aprovadas aguardando publicação e conteúdos retirados não são expostos publicamente (AC-02 / AC-04).",
      sanitizedCorr
    );
  }

  return {
    data: dto,
    headers: {
      "Cache-Control": "no-store",
      "X-Correlation-Id": sanitizedCorr,
    },
  };
}

/**
 * Lista impactos para a vitrine pública filtrando estritamente itens publicados e aprovados (FE-016).
 */
export function listPublicImpacts(
  store: ImpactStore,
  filters: ImpactPublicFilterParams = {},
  correlationId?: string
): {
  items: ImpactPublicResponse[];
  totalPublished: number;
  totalInternalRecords: number;
  headers: { "Cache-Control": "no-store"; "X-Correlation-Id": string };
} {
  const sanitizedCorr = sanitizeCorrelation(correlationId, "corr-public-list");
  const allRecords = Array.from(store.records.values());
  const queryNormalized = (filters.query ?? "").trim().toLowerCase();
  const courseFilter = (filters.course ?? "").trim();
  const semesterFilter = (filters.semester ?? "").trim();
  const odsFilter =
    typeof filters.ods === "number" && !Number.isNaN(filters.ods)
      ? filters.ods
      : null;

  let totalPublished = 0;
  const items: ImpactPublicResponse[] = [];

  for (const record of allRecords) {
    const publicDto = projectPublicDto(record);
    if (!publicDto) {
      continue;
    }
    totalPublished += 1;

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
      const haystack =
        `${publicDto.title} ${publicDto.summary} ${publicDto.course ?? ""}`.toLowerCase();
      if (!haystack.includes(queryNormalized)) {
        continue;
      }
    }

    items.push(publicDto);
  }

  return {
    items,
    totalPublished,
    totalInternalRecords: allRecords.length,
    headers: {
      "Cache-Control": "no-store",
      "X-Correlation-Id": sanitizedCorr,
    },
  };
}

/**
 * GET /api/v1/impacts/{id}/versions — Lista versões de um impacto com paginação limitada (permissão READ).
 */
export function readImpactVersions(
  store: ImpactStore,
  id: string,
  context: ImpactRequestContext,
  page = 0,
  size = 25
): ImpactVersionsPage {
  const correlationId = sanitizeCorrelation(
    context.correlationId,
    "corr-versions"
  );
  assertAuthorized(context, "READ", correlationId);

  if (page < 0 || size < 1 || size > 100) {
    throw new ImpactContractError(
      400,
      "Paginação inválida",
      "Os parâmetros page (>= 0) e size (1..100) devem respeitar os limites do contrato.",
      correlationId
    );
  }

  const record = store.records.get(id);
  if (!record) {
    throw new ImpactContractError(
      404,
      "Impacto não encontrado",
      `Nenhum registro de impacto encontrado para o identificador "${id}".`,
      correlationId
    );
  }

  const start = page * size;
  const items = record.versions.slice(start, start + size).map((v) => ({
    version: v.version,
    title: v.title,
    summary: v.summary,
    approved: v.approved,
  }));

  return {
    items,
    page,
    size,
    totalElements: record.versions.length,
  };
}

/**
 * GET /api/v1/impacts/{id}/versions/{version}/provenance — Consulta de origem/responsável/período restrita a AUDIT (AC-05).
 */
export function readImpactProvenance(
  store: ImpactStore,
  id: string,
  version: number,
  context: ImpactRequestContext
): ImpactProvenanceResponse {
  const correlationId = sanitizeCorrelation(
    context.correlationId,
    "corr-provenance"
  );
  assertAuthorized(context, "AUDIT", correlationId);

  const record = store.records.get(id);
  if (!record) {
    throw new ImpactContractError(
      404,
      "Impacto não encontrado",
      `Nenhum registro de impacto encontrado para o identificador "${id}".`,
      correlationId
    );
  }

  const targetVersion = record.versions.find((v) => v.version === version);
  if (!targetVersion) {
    throw new ImpactContractError(
      404,
      "Versão não encontrada",
      `A versão ${version} não existe no impacto "${id}".`,
      correlationId
    );
  }

  return {
    id: record.id,
    version: targetVersion.version,
    sourceReference: targetVersion.provenance.sourceReference,
    responsibleReference: targetVersion.provenance.responsibleReference,
    periodStart: targetVersion.provenance.periodStart,
    periodEnd: targetVersion.provenance.periodEnd,
    createdBy: targetVersion.createdBy,
    createdAt: targetVersion.createdAt,
    approvedBy: targetVersion.approvedBy,
    approvedAt: targetVersion.approvedAt,
  };
}

/**
 * GET /api/v1/impacts/{id}/history — Consulta de histórico de eventos restrita a AUDIT (BE-019).
 */
export function readImpactHistory(
  store: ImpactStore,
  id: string,
  context: ImpactRequestContext,
  page = 0,
  size = 25
): ImpactHistoryResponse {
  const correlationId = sanitizeCorrelation(
    context.correlationId,
    "corr-history"
  );
  assertAuthorized(context, "AUDIT", correlationId);

  if (page < 0 || size < 1 || size > 100) {
    throw new ImpactContractError(
      400,
      "Paginação inválida",
      "Os parâmetros page (>= 0) e size (1..100) devem respeitar os limites do contrato.",
      correlationId
    );
  }

  const record = store.records.get(id);
  if (!record) {
    throw new ImpactContractError(
      404,
      "Impacto não encontrado",
      `Nenhum registro de impacto encontrado para o identificador "${id}".`,
      correlationId
    );
  }

  const start = page * size;
  const items = record.history.slice(start, start + size).map((h) => ({ ...h }));

  return {
    items,
    page,
    size,
    totalElements: record.history.length,
  };
}

/**
 * Adaptador HTTP para consumo real de GET /api/v1/impacts/{id} quando BE-019 estiver ativo no ambiente.
 * Inclui timeout de 10s (SEG-05), Cache-Control: no-store e sanitização por allowlist do DTO público.
 */
export async function fetchPublicImpactFromApi(
  baseUrl: string,
  id: string,
  options?: {
    correlationId?: string;
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
  }
): Promise<ImpactPublicResponse> {
  const fetchFn = options?.fetchImpl ?? fetch;
  const correlationId = sanitizeCorrelation(
    options?.correlationId,
    "corr-http-impact"
  );
  const timeoutMs = options?.timeoutMs ?? 10_000;
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const url = `${normalizedBase}/api/v1/impacts/${encodeURIComponent(id)}`;

  const response = await fetchFn(url, {
    method: "GET",
    headers: {
      Accept: "application/json, application/problem+json",
      "X-Correlation-Id": correlationId,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    let detail = `Falha ao consultar impacto público (HTTP ${response.status}).`;
    let title = "Erro de requisição";
    try {
      const problemBody =
        (await response.json()) as Partial<ImpactProblemDetails>;
      if (typeof problemBody.detail === "string" && problemBody.detail.trim()) {
        detail = problemBody.detail;
      }
      if (typeof problemBody.title === "string" && problemBody.title.trim()) {
        title = problemBody.title;
      }
    } catch {
      // Mantém mensagem padrão sanitizada
    }
    throw new ImpactContractError(
      response.status,
      title,
      detail,
      response.headers.get("X-Correlation-Id") ?? correlationId
    );
  }

  const raw = (await response.json()) as Record<string, unknown>;
  if (
    typeof raw.id !== "string" ||
    typeof raw.version !== "number" ||
    typeof raw.title !== "string" ||
    typeof raw.summary !== "string"
  ) {
    throw new ImpactContractError(
      503,
      "Contrato de resposta inválido",
      "A resposta da API de impacto não atende ao schema PublicResponse.",
      correlationId
    );
  }

  // Allowlist estrita na fronteira HTTP: descarta qualquer propriedade interna que eventualmente venha do servidor
  return {
    id: raw.id,
    version: raw.version,
    title: raw.title,
    summary: raw.summary,
  };
}
