/**
 * Tipos e contratos de domínio para Entregáveis de Projeto Integrador (FE-011).
 * Alinhado a SPEC-PI-004, CONTRACT-PI-001 e dependências BE-012 / BE-013.
 */

export type DeliverableFileFormat = "PDF" | "DOCX" | "IMAGE";

export type DeliverableCategory =
  | "RELATORIO_TECNICO"
  | "DOCUMENTACAO_PROJETO"
  | "REGISTRO_FOTOGRAFICO";

export type DeliverableUploadStage =
  | "IDLE"
  | "VALIDATING"
  | "REQUESTING_URL"
  | "UPLOADING"
  | "CONFIRMING"
  | "CONFIRMED"
  | "CANCELED"
  | "ERROR";

export type PhotoPublicationStatus =
  | "NOT_APPLICABLE"
  | "PENDING_FACULTY_DECISION"
  | "APPROVED_BY_FACULTY"
  | "DENIED_BY_FACULTY";

export type ProjectActorRole =
  | "STUDENT_MEMBER"
  | "FACULTY_ADVISOR"
  | "ADMIN"
  | "UNLINKED_USER";

export interface DeliverableCandidateFile {
  name: string;
  size: number;
  type: string;
  headerBytes?: Uint8Array;
}

export interface DeliverableUploadPolicy {
  /**
   * Limites parametrizáveis (SPEC-PI-004 indica que o limite final depende
   * de aprovação oficial do contrato/PO; o cliente respeita o valor injetado pelo contrato).
   */
  provisionalMaxDocumentBytes: number;
  provisionalMaxImageBytes: number;
  minBytes: number;
  presignedUrlTtlSeconds: number;
  allowedExtensions: readonly string[];
  allowedMimeTypes: readonly string[];
}

export interface ProjectEditingContext {
  projectId: string;
  projectTitle: string;
  semester: string;
  actorRole: ProjectActorRole;
  evaluationStarted: boolean;
  evaluationStartsAtIso: string;
}

export interface DeliverableValidationResult {
  isValid: boolean;
  detectedFormat?: DeliverableFileFormat;
  errors: string[];
  warnings: string[];
}

/**
 * Contrato de resposta de autorização de upload pré-assinado no S3 (BE-012).
 */
export interface PresignedUploadAuthorization {
  uploadId: string;
  objectKey: string;
  presignedUrl: string;
  expiresAtIso: string;
  ttlSeconds: number;
  bucketScope: "PRIVATE";
  correlationId: string;
  expectedMimeType: string;
  expectedSizeBytes: number;
}

/**
 * Payload de confirmação de entregável com verificação de SHA-256 (BE-013).
 */
export interface DeliverableConfirmationPayload {
  uploadId: string;
  projectId: string;
  category: DeliverableCategory;
  fileName: string;
  mimeType: string;
  format: DeliverableFileFormat;
  sizeBytes: number;
  sha256: string;
  objectKey: string;
  correlationId: string;
  idempotencyKey: string;
  notes?: string;
}

/**
 * Registro confirmado de entregável (BE-013 / SPEC-PI-004).
 */
export interface ConfirmedDeliverableRecord {
  deliverableId: string;
  projectId: string;
  category: DeliverableCategory;
  fileName: string;
  mimeType: string;
  format: DeliverableFileFormat;
  sizeBytes: number;
  sha256: string;
  objectKey: string;
  correlationId: string;
  idempotencyKey: string;
  confirmedAtIso: string;
  status: "CONFIRMED" | "EXPIRED" | "REVOKED";
  visibility: "PROJECT_MEMBERS_FACULTY_AND_ADMIN";
  photoPublicationStatus: PhotoPublicationStatus;
  notes?: string;
}

export interface UploadProgressSnapshot {
  stage: DeliverableUploadStage;
  percentage: number;
  uploadedBytes: number;
  totalBytes: number;
  message: string;
}

