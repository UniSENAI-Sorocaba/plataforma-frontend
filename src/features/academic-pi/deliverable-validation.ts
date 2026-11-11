import type {
  DeliverableCandidateFile,
  DeliverableFileFormat,
  DeliverableUploadPolicy,
  DeliverableValidationResult,
  PhotoPublicationStatus,
  ProjectActorRole,
  ProjectEditingContext,
} from "./deliverable-types";

export const DEFAULT_UPLOAD_POLICY: DeliverableUploadPolicy = {
  provisionalMaxDocumentBytes: 25 * 1024 * 1024, // 25 MB (parametrizável conforme SPEC-PI-004)
  provisionalMaxImageBytes: 10 * 1024 * 1024, // 10 MB (parametrizável conforme SPEC-PI-004)
  minBytes: 1,
  presignedUrlTtlSeconds: 15 * 60, // 15 minutos (BE-012)
  allowedExtensions: [".pdf", ".docx", ".png", ".jpg", ".jpeg", ".webp"],
  allowedMimeTypes: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "image/webp",
  ],
};

const EXTENSION_TO_FORMAT: Record<string, DeliverableFileFormat> = {
  ".pdf": "PDF",
  ".docx": "DOCX",
  ".png": "IMAGE",
  ".jpg": "IMAGE",
  ".jpeg": "IMAGE",
  ".webp": "IMAGE",
};

const MIME_TO_FORMAT: Record<string, DeliverableFileFormat> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "image/png": "IMAGE",
  "image/jpeg": "IMAGE",
  "image/webp": "IMAGE",
};

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function extractFileExtension(fileName: string): string {
  const trimmed = fileName.trim().toLowerCase();
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === trimmed.length - 1) {
    return "";
  }
  return trimmed.slice(lastDot);
}

/**
 * AC-PI-004-03: Valida a assinatura binária (magic bytes) do arquivo além da extensão e MIME.
 */
export function detectFormatFromHeaderBytes(
  headerBytes: Uint8Array
): DeliverableFileFormat | null {
  if (headerBytes.length >= 5) {
    // %PDF- (0x25 0x50 0x44 0x46 0x2D)
    if (
      headerBytes[0] === 0x25 &&
      headerBytes[1] === 0x50 &&
      headerBytes[2] === 0x44 &&
      headerBytes[3] === 0x46 &&
      headerBytes[4] === 0x2d
    ) {
      return "PDF";
    }
  }

  if (headerBytes.length >= 4) {
    // DOCX (container OpenXML ZIP: PK\x03\x04 -> 0x50 0x4B 0x03 0x04)
    if (
      headerBytes[0] === 0x50 &&
      headerBytes[1] === 0x4b &&
      headerBytes[2] === 0x03 &&
      headerBytes[3] === 0x04
    ) {
      return "DOCX";
    }
  }

  if (headerBytes.length >= 8) {
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      headerBytes[0] === 0x89 &&
      headerBytes[1] === 0x50 &&
      headerBytes[2] === 0x4e &&
      headerBytes[3] === 0x47 &&
      headerBytes[4] === 0x0d &&
      headerBytes[5] === 0x0a &&
      headerBytes[6] === 0x1a &&
      headerBytes[7] === 0x0a
    ) {
      return "IMAGE";
    }
  }

  if (headerBytes.length >= 3) {
    // JPEG: FF D8 FF
    if (
      headerBytes[0] === 0xff &&
      headerBytes[1] === 0xd8 &&
      headerBytes[2] === 0xff
    ) {
      return "IMAGE";
    }
  }

  if (headerBytes.length >= 12) {
    // WEBP: RIFF....WEBP
    const isRiff =
      headerBytes[0] === 0x52 &&
      headerBytes[1] === 0x49 &&
      headerBytes[2] === 0x46 &&
      headerBytes[3] === 0x46;
    const isWebp =
      headerBytes[8] === 0x57 &&
      headerBytes[9] === 0x45 &&
      headerBytes[10] === 0x42 &&
      headerBytes[11] === 0x50;
    if (isRiff && isWebp) {
      return "IMAGE";
    }
  }

  return null;
}

/**
 * AC-PI-004-01: Leitura autorizada apenas para alunos vinculados ao projeto, docentes e administradores.
 */
export function canActorViewDeliverables(role: ProjectActorRole): boolean {
  return (
    role === "STUDENT_MEMBER" ||
    role === "FACULTY_ADVISOR" ||
    role === "ADMIN"
  );
}

/**
 * AC-PI-004-02: Alteração ou envio permitido somente a atores autorizados e antes do início da avaliação.
 */
export function canActorModifyDeliverables(
  context: ProjectEditingContext
): { allowed: boolean; reason?: string } {
  if (!canActorViewDeliverables(context.actorRole) || context.actorRole === "ADMIN") {
    return {
      allowed: false,
      reason:
        "Apenas integrantes vinculados ao projeto ou o docente orientador podem enviar ou substituir entregáveis (AC-PI-004-01).",
    };
  }

  if (context.evaluationStarted) {
    return {
      allowed: false,
      reason:
        "A janela de edição deste projeto foi encerrada porque o período de avaliação já foi iniciado (AC-PI-004-02).",
    };
  }

  return { allowed: true };
}

/**
 * AC-PI-004-04: Imagens permanecem restritas internamente até decisão do docente responsável.
 */
export function resolveInitialPhotoPublicationStatus(
  format: DeliverableFileFormat
): PhotoPublicationStatus {
  return format === "IMAGE" ? "PENDING_FACULTY_DECISION" : "NOT_APPLICABLE";
}

/**
 * Validação completa do arquivo candidato antes de solicitar URL pré-assinada (FE-011 / BE-012 / SPEC-PI-004).
 */
export function validateDeliverableCandidate(
  file: DeliverableCandidateFile,
  context: ProjectEditingContext,
  policy: DeliverableUploadPolicy = DEFAULT_UPLOAD_POLICY
): DeliverableValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const permissionCheck = canActorModifyDeliverables(context);
  if (!permissionCheck.allowed && permissionCheck.reason) {
    errors.push(permissionCheck.reason);
  }

  if (!file.name || file.name.trim().length === 0) {
    errors.push("O nome do arquivo é obrigatório.");
  }

  const extension = extractFileExtension(file.name || "");
  const formatByExtension = extension ? EXTENSION_TO_FORMAT[extension] : undefined;

  if (!extension || !policy.allowedExtensions.includes(extension) || !formatByExtension) {
    errors.push(
      `Formato não suportado (${extension || "sem extensão"}). Formatos aceitos pela SPEC-PI-004: PDF (.pdf), Word (.docx) e Imagens (.png, .jpg, .jpeg, .webp).`
    );
  }

  const normalizedMime = (file.type || "").trim().toLowerCase();
  const formatByMime = normalizedMime ? MIME_TO_FORMAT[normalizedMime] : undefined;

  if (!normalizedMime || !policy.allowedMimeTypes.includes(normalizedMime) || !formatByMime) {
    errors.push(
      `Content-Type inválido (${normalizedMime || "desconhecido"}). O arquivo deve possuir MIME oficial compatível com PDF, DOCX ou imagem.`
    );
  }

  if (formatByExtension && formatByMime && formatByExtension !== formatByMime) {
    errors.push(
      `Divergência entre extensão (${extension}) e tipo MIME (${normalizedMime}). Verifique se o arquivo não foi renomeado indevidamente.`
    );
  }

  if (file.headerBytes && file.headerBytes.length > 0) {
    const signatureFormat = detectFormatFromHeaderBytes(file.headerBytes);
    if (!signatureFormat) {
      errors.push(
        "Assinatura binária do arquivo é inválida ou não corresponde a um documento PDF, DOCX ou imagem autêntica (AC-PI-004-03)."
      );
    } else if (formatByExtension && signatureFormat !== formatByExtension) {
      errors.push(
        `O conteúdo real do arquivo (${signatureFormat}) diverge da extensão informada (${extension}) (AC-PI-004-03).`
      );
    }
  }

  const detectedFormat = formatByExtension || formatByMime;

  if (!Number.isFinite(file.size) || file.size < policy.minBytes) {
    errors.push("O arquivo selecionado está vazio (0 bytes) e não pode ser enviado.");
  } else if (detectedFormat) {
    const maxBytes =
      detectedFormat === "IMAGE"
        ? policy.provisionalMaxImageBytes
        : policy.provisionalMaxDocumentBytes;

    if (file.size > maxBytes) {
      errors.push(
        `O arquivo (${formatBytes(file.size)}) excede o limite máximo permitido de ${formatBytes(maxBytes)} para ${detectedFormat === "IMAGE" ? "imagens" : "documentos"}.`
      );
    }
  }

  if (detectedFormat === "IMAGE" && errors.length === 0) {
    warnings.push(
      "Atenção (AC-PI-004-04): Imagens e fotografias permanecem visíveis apenas internamente para a equipe e docentes. A publicação no catálogo público depende de autorização expressa do docente responsável (considerando menores de idade e terceiros)."
    );
  }

  return {
    isValid: errors.length === 0,
    detectedFormat: errors.length === 0 ? detectedFormat : undefined,
    errors,
    warnings,
  };
}

/**
 * Calcula o hash SHA-256 em hexadecimal (BE-013) usando Web Crypto API padrão.
 */
export async function computeSha256Hex(data: Uint8Array): Promise<string> {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", copy.buffer);
  const byteArray = new Uint8Array(digest);
  return Array.from(byteArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
