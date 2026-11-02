import type {
  ConfirmedDeliverableRecord,
  DeliverableCandidateFile,
  DeliverableCategory,
  DeliverableConfirmationPayload,
  DeliverableUploadPolicy,
  PresignedUploadAuthorization,
  ProjectEditingContext,
  UploadProgressSnapshot,
} from "./deliverable-types";

export class UploadCanceledError extends Error {
  constructor(message = "Upload cancelado pelo usuário.") {
    super(message);
    this.name = "UploadCanceledError";
  }
}

export class UploadContractError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "UploadContractError";
    this.code = code;
  }
}

const idempotentConfirmations = new Map<string, ConfirmedDeliverableRecord>();

function sanitizeKeySegment(fileName: string): string {
  return fileName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_");
}

/**
 * BE-012: Verifica se a URL pré-assinada expirou (TTL padrão de 15 minutos).
 */
export function isPresignedUrlExpired(
  auth: PresignedUploadAuthorization,
  nowMs: number = Date.now()
): boolean {
  const expiresAtMs = Date.parse(auth.expiresAtIso);
  if (Number.isNaN(expiresAtMs)) {
    return true;
  }
  return nowMs >= expiresAtMs;
}

/**
 * BE-012: Solicita URL pré-assinada curta e restrita ao escopo privado do projeto.
 * No modo protótipo, valida autorização, escopo, formato e limites antes de emitir o token S3 simulado.
 */
export function requestPresignedUploadUrl(
  file: DeliverableCandidateFile,
  context: ProjectEditingContext,
  policy: DeliverableUploadPolicy,
  nowMs: number = Date.now()
): PresignedUploadAuthorization {
  if (
    context.actorRole !== "STUDENT_MEMBER" &&
    context.actorRole !== "FACULTY_ADVISOR"
  ) {
    throw new UploadContractError(
      "UNAUTHORIZED_ACTOR",
      "Apenas integrantes vinculados ao projeto ou o docente orientador podem gerar URL pré-assinada (BE-012 / AC-PI-004-01)."
    );
  }

  if (context.evaluationStarted) {
    throw new UploadContractError(
      "EDITING_WINDOW_CLOSED",
      "A janela de edição deste projeto foi encerrada após o início da avaliação (AC-PI-004-02)."
    );
  }

  const normalizedMime = (file.type || "").trim().toLowerCase();
  if (!policy.allowedMimeTypes.includes(normalizedMime)) {
    throw new UploadContractError(
      "INVALID_MIME_TYPE",
      `Tipo MIME não permitido (${normalizedMime || "desconhecido"}) ao gerar URL S3 (BE-012).`
    );
  }

  const isImage = normalizedMime.startsWith("image/");
  const maxBytes = isImage
    ? policy.provisionalMaxImageBytes
    : policy.provisionalMaxDocumentBytes;

  if (!Number.isFinite(file.size) || file.size < policy.minBytes || file.size > maxBytes) {
    throw new UploadContractError(
      "INVALID_FILE_SIZE",
      "Tamanho do arquivo fora dos limites permitidos pela política de upload S3 (BE-012)."
    );
  }

  const uploadId = `upl_${nowMs.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const correlationId = `corr_${nowMs.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const safeName = sanitizeKeySegment(file.name);
  const objectKey = `private/academic-pi/${context.projectId}/deliverables/${uploadId}/${safeName}`;
  const expiresAtIso = new Date(
    nowMs + policy.presignedUrlTtlSeconds * 1000
  ).toISOString();

  return {
    uploadId,
    objectKey,
    presignedUrl: `https://s3.sa-east-1.amazonaws.com/unisenai-pi-private/${objectKey}?X-Amz-Expires=${policy.presignedUrlTtlSeconds}&X-Correlation-Id=${correlationId}`,
    expiresAtIso,
    ttlSeconds: policy.presignedUrlTtlSeconds,
    bucketScope: "PRIVATE",
    correlationId,
    expectedMimeType: normalizedMime,
    expectedSizeBytes: file.size,
  };
}

export interface ExecuteUploadOptions {
  auth: PresignedUploadAuthorization;
  totalBytes: number;
  signal?: AbortSignal;
  stepDelayMs?: number;
  steps?: number;
  onProgress?: (snapshot: UploadProgressSnapshot) => void;
}

/**
 * FE-011 / BE-012: Executa a transmissão para a URL pré-assinada reportando progresso
 * detalhado e permitindo cancelamento imediato via AbortSignal.
 */
export async function executePresignedUpload({
  auth,
  totalBytes,
  signal,
  stepDelayMs = 140,
  steps = 5,
  onProgress,
}: ExecuteUploadOptions): Promise<void> {
  if (signal?.aborted) {
    throw new UploadCanceledError();
  }

  if (isPresignedUrlExpired(auth)) {
    throw new UploadContractError(
      "PRESIGNED_URL_EXPIRED",
      "A URL temporária de upload expirou (TTL de 15 minutos excedido). Solicite um novo envio (BE-012)."
    );
  }

  const totalSteps = Math.max(1, steps);

  for (let step = 1; step <= totalSteps; step += 1) {
    if (signal?.aborted) {
      throw new UploadCanceledError();
    }

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, stepDelayMs);
      if (signal) {
        const onAbort = () => {
          clearTimeout(timer);
          reject(new UploadCanceledError());
        };
        signal.addEventListener("abort", onAbort, { once: true });
      }
    });

    if (signal?.aborted) {
      throw new UploadCanceledError();
    }

    const percentage = Math.round((step / totalSteps) * 100);
    const uploadedBytes =
      step === totalSteps
        ? totalBytes
        : Math.round((step / totalSteps) * totalBytes);

    onProgress?.({
      stage: "UPLOADING",
      percentage,
      uploadedBytes,
      totalBytes,
      message: `Enviando objeto criptografado ao storage privado (${percentage}%)...`,
    });
  }
}

/**
 * BE-013: Confirma o entregável verificando integridade SHA-256, correspondência de metadados,
 * expiração da URL e idempotência por chave.
 */
export function confirmDeliverableUpload(
  payload: DeliverableConfirmationPayload,
  auth: PresignedUploadAuthorization,
  computedStorageSha256: string = payload.sha256,
  nowMs: number = Date.now()
): ConfirmedDeliverableRecord {
  if (isPresignedUrlExpired(auth, nowMs)) {
    throw new UploadContractError(
      "PRESIGNED_URL_EXPIRED",
      "Não foi possível confirmar o entregável porque a janela da URL pré-assinada expirou (BE-012 / BE-013)."
    );
  }

  if (
    payload.objectKey !== auth.objectKey ||
    payload.sizeBytes !== auth.expectedSizeBytes ||
    payload.mimeType.trim().toLowerCase() !== auth.expectedMimeType
  ) {
    throw new UploadContractError(
      "METADATA_MISMATCH",
      "Os metadados enviados na confirmação divergem do que foi autorizado na URL pré-assinada (BE-013)."
    );
  }

  const normalizedClientHash = payload.sha256.trim().toLowerCase();
  const normalizedStorageHash = computedStorageSha256.trim().toLowerCase();

  if (!/^[a-f0-9]{64}$/.test(normalizedClientHash)) {
    throw new UploadContractError(
      "INVALID_SHA256_FORMAT",
      "O checksum SHA-256 informado não possui 64 caracteres hexadecimais válidos (BE-013)."
    );
  }

  if (normalizedClientHash !== normalizedStorageHash) {
    throw new UploadContractError(
      "SHA256_MISMATCH",
      "Falha de integridade: o hash SHA-256 calculado diverge do objeto recebido no storage (BE-013)."
    );
  }

  const existing = idempotentConfirmations.get(payload.idempotencyKey);
  if (existing) {
    if (existing.sha256 !== normalizedClientHash) {
      throw new UploadContractError(
        "IDEMPOTENCY_CONFLICT",
        "Chave de idempotência já utilizada para um artefato com hash diferente (BE-013)."
      );
    }
    return existing;
  }

  const record: ConfirmedDeliverableRecord = {
    deliverableId: `deliv_${nowMs.toString(36)}_${normalizedClientHash.slice(0, 6)}`,
    projectId: payload.projectId,
    category: payload.category,
    fileName: payload.fileName,
    mimeType: payload.mimeType,
    format: payload.format,
    sizeBytes: payload.sizeBytes,
    sha256: normalizedClientHash,
    objectKey: payload.objectKey,
    correlationId: payload.correlationId,
    idempotencyKey: payload.idempotencyKey,
    confirmedAtIso: new Date(nowMs).toISOString(),
    status: "CONFIRMED",
    visibility: "PROJECT_MEMBERS_FACULTY_AND_ADMIN",
    photoPublicationStatus:
      payload.format === "IMAGE" ? "PENDING_FACULTY_DECISION" : "NOT_APPLICABLE",
    notes: payload.notes?.trim() || undefined,
  };

  idempotentConfirmations.set(payload.idempotencyKey, record);
  return record;
}

export function getCategoryLabel(category: DeliverableCategory): string {
  switch (category) {
    case "RELATORIO_TECNICO":
      return "Relatório Técnico (Parcial / Final)";
    case "DOCUMENTACAO_PROJETO":
      return "Documentação Complementar (.DOCX / .PDF)";
    case "REGISTRO_FOTOGRAFICO":
      return "Registro Fotográfico / Evidência Visual";
  }
}
