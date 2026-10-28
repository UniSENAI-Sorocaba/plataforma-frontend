import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import {
  isValidHashFormat,
  validateCertificateHash,
  generateCertificateDownloadContent,
  DEMO_CERTIFICATES,
} from "../src/features/extension/certificate-service.ts";

test("mantém a rota SSR de certificados", async () => {
  await assert.doesNotReject(
    access(new URL("../src/app/certificados/page.tsx", import.meta.url))
  );
});

test("validação do formato do hash criptográfico (SHA-256)", () => {
  // 64 caracteres hexadecimais válidos
  assert.equal(
    isValidHashFormat("a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0"),
    true
  );
  // Hash em maiúsculas (sanitizado)
  assert.equal(
    isValidHashFormat("A1B2C3D4E5F67890123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0"),
    true
  );
  // Inválido por caracteres não hexadecimais
  assert.equal(isValidHashFormat("xyz123"), false);
  // Inválido por comprimento menor que o mínimo
  assert.equal(isValidHashFormat("12345"), false);
  // Vazio
  assert.equal(isValidHashFormat(""), false);
});

test("validação de certificado autêntico via hash", () => {
  const validHash = "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0";
  const result = validateCertificateHash(validHash, DEMO_CERTIFICATES);

  assert.equal(result.isValid, true);
  assert.equal(result.status, "VALID");
  assert.ok(result.certificate);
  assert.equal(result.certificate.studentName, "Kaique Silva");
  assert.equal(result.certificate.hours, 40);
  assert.match(result.message, /autêntico/i);
});

test("validação extraindo hash de link de QR Code", () => {
  const qrCodeUrl = "https://plataforma.sorocaba.senai.br/certificados/validar?hash=f9e8d7c6b5a43210fedcba9876543210fedcba9876543210fedcba9876543210";
  const result = validateCertificateHash(qrCodeUrl, DEMO_CERTIFICATES);

  assert.equal(result.isValid, true);
  assert.equal(result.status, "VALID");
  assert.ok(result.certificate);
  assert.equal(result.certificate.title, "Projeto Integrador: Monitoramento e Eficiência Hídrica");
});

test("rejeição de certificado inexistente", () => {
  const unknownHash = "0000000000000000000000000000000000000000000000000000000000000000";
  const result = validateCertificateHash(unknownHash, DEMO_CERTIFICATES);

  assert.equal(result.isValid, false);
  assert.equal(result.status, "NOT_FOUND");
  assert.match(result.message, /não localizado/i);
});

test("rejeição com alerta formal para certificado revogado", () => {
  const revokedHash = "7777888899990000aaaabbbbccccddddeeeeffff000011112222333344445555";
  const result = validateCertificateHash(revokedHash, DEMO_CERTIFICATES);

  assert.equal(result.isValid, false);
  assert.equal(result.status, "REVOKED");
  assert.match(result.message, /REVOGADO/i);
});

test("geração de arquivo para download com metadados e hash", () => {
  const cert = DEMO_CERTIFICATES[0];
  const file = generateCertificateDownloadContent(cert);

  assert.ok(file.filename.endsWith(".txt"));
  assert.match(file.content, /UNISENAI SOROCABA - CERTIFICADO OFICIAL/);
  assert.match(file.content, /Kaique Silva/);
  assert.match(file.content, /HASH SHA-256:/);
  assert.match(file.content, new RegExp(cert.hash));
});

