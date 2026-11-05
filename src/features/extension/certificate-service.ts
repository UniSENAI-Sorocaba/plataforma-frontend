import type { Certificate, ValidationResult } from "./types";

export const DEMO_CERTIFICATES: Certificate[] = [
  {
    id: "cert-ext-2026-001",
    title: "Programa de Robótica Educacional na Comunidade",
    category: "EXTENSAO",
    studentName: "Kaique Silva",
    studentRa: "RA-2026-10492",
    hours: 40,
    issueDate: "15 de Outubro de 2026",
    hash: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    qrCodeUrl: "https://plataforma.sorocaba.senai.br/certificados/validar?hash=a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    status: "VALID",
    issuer: "Diretoria Acadêmica e de Extensão UniSENAI Sorocaba",
  },
  {
    id: "cert-pi-2026-002",
    title: "Projeto Integrador: Monitoramento e Eficiência Hídrica",
    category: "PROJETO_INTEGRADOR",
    studentName: "Kaique Silva",
    studentRa: "RA-2026-10492",
    hours: 60,
    issueDate: "20 de Junho de 2026",
    hash: "f9e8d7c6b5a43210fedcba9876543210fedcba9876543210fedcba9876543210",
    qrCodeUrl: "https://plataforma.sorocaba.senai.br/certificados/validar?hash=f9e8d7c6b5a43210fedcba9876543210fedcba9876543210fedcba9876543210",
    status: "VALID",
    issuer: "Coordenação de Projetos Integradores UniSENAI",
  },
  {
    id: "cert-ext-2025-099",
    title: "Workshop de Manufatura Aditiva e Impressão 3D",
    category: "WORKSHOP",
    studentName: "Mariana Costa",
    studentRa: "RA-2025-08123",
    hours: 16,
    issueDate: "10 de Novembro de 2025",
    hash: "7777888899990000aaaabbbbccccddddeeeeffff000011112222333344445555",
    qrCodeUrl: "https://plataforma.sorocaba.senai.br/certificados/validar?hash=7777888899990000aaaabbbbccccddddeeeeffff000011112222333344445555",
    status: "REVOKED",
    issuer: "Diretoria Acadêmica UniSENAI Sorocaba",
  },
];

export function isValidHashFormat(hash: string): boolean {
  const sanitized = hash.trim().toLowerCase();
  // SHA-256 standard format: 64 hex characters
  return /^[a-f0-9]{32,64}$/.test(sanitized);
}

export function validateCertificateHash(
  hashInput: string,
  registry: Certificate[] = DEMO_CERTIFICATES
): ValidationResult {
  const trimmed = hashInput.trim();

  // If input is a full URL, extract the query param 'hash'
  let extractedHash = trimmed;
  if (trimmed.includes("hash=")) {
    const match = trimmed.match(/[?&]hash=([a-fA-F0-9]+)/);
    if (match) {
      extractedHash = match[1];
    }
  }

  if (!extractedHash) {
    return {
      isValid: false,
      status: "INVALID_FORMAT",
      message: "Por favor, informe o código hash ou cole o link do QR Code do certificado.",
    };
  }

  if (!isValidHashFormat(extractedHash)) {
    return {
      isValid: false,
      status: "INVALID_FORMAT",
      message: "O código hash informado é inválido. Certificados autênticos possuem chave hash em formato hexadecimal.",
    };
  }

  const certificate = registry.find(
    (cert) => cert.hash.toLowerCase() === extractedHash.toLowerCase()
  );

  const timestamp = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (!certificate) {
    return {
      isValid: false,
      status: "NOT_FOUND",
      message: "Certificado não localizado nos registros oficiais. Verifique o código e tente novamente.",
      validatedAt: timestamp,
    };
  }

  if (certificate.status === "REVOKED") {
    return {
      isValid: false,
      status: "REVOKED",
      certificate,
      message: "Atenção: Este certificado foi REVOGADO pela diretoria acadêmica e não possui validade legal.",
      validatedAt: timestamp,
    };
  }

  if (certificate.status === "EXPIRED") {
    return {
      isValid: false,
      status: "EXPIRED",
      certificate,
      message: "Atenção: A validade deste certificado expirou conforme regulamento institucional.",
      validatedAt: timestamp,
    };
  }

  return {
    isValid: true,
    status: "VALID",
    certificate,
    message: "Certificado autêntico verificado com sucesso junto aos registros oficiais do UniSENAI Sorocaba.",
    validatedAt: timestamp,
  };
}

export function generateCertificateDownloadContent(certificate: Certificate): {
  filename: string;
  mimeType: string;
  content: string;
} {
  const content = [
    "==================================================================",
    "                   UNISENAI SOROCABA - CERTIFICADO OFICIAL        ",
    "==================================================================",
    "",
    `TÍTULO DA ATIVIDADE: ${certificate.title}`,
    `CATEGORIA: ${certificate.category}`,
    `ESTUDANTE: ${certificate.studentName}`,
    `REGISTRO ACADÊMICO: ${certificate.studentRa}`,
    `CARGA HORÁRIA: ${certificate.hours} horas complementares`,
    `DATA DE EMISSÃO: ${certificate.issueDate}`,
    `EMISSOR: ${certificate.issuer}`,
    `STATUS: ${certificate.status}`,
    "",
    "--- AUTENTICIDADE CRIPTOGRÁFICA ---",
    `HASH SHA-256: ${certificate.hash}`,
    `VALIDAÇÃO PÚBLICA (QR CODE): ${certificate.qrCodeUrl}`,
    "",
    "Este documento eletrônico possui validade comprovada conforme SPEC-EXT-003",
    "e pode ser autenticado a qualquer momento pelo portal público da instituição.",
    "==================================================================",
  ].join("\n");

  const safeTitle = certificate.title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .substring(0, 30);

  return {
    filename: `certificado-${safeTitle}-${certificate.id}.txt`,
    mimeType: "text/plain;charset=utf-8",
    content,
  };
}

