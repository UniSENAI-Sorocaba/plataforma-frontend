export type CertificateStatus = "VALID" | "REVOKED" | "EXPIRED";

export type CertificateCategory = "EXTENSAO" | "PROJETO_INTEGRADOR" | "WORKSHOP";

export interface Certificate {
  id: string;
  title: string;
  category: CertificateCategory;
  studentName: string;
  studentRa: string;
  hours: number;
  issueDate: string;
  hash: string;
  qrCodeUrl: string;
  status: CertificateStatus;
  issuer: string;
}

export interface ValidationResult {
  isValid: boolean;
  status: CertificateStatus | "NOT_FOUND" | "INVALID_FORMAT";
  certificate?: Certificate;
  message: string;
  validatedAt?: string;
}

