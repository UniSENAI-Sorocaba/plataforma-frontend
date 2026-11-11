import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

import {
  confirmDeliverableUpload,
  executePresignedUpload,
  isPresignedUrlExpired,
  requestPresignedUploadUrl,
  UploadCanceledError,
  UploadContractError,
} from "../src/features/academic-pi/deliverable-upload-client.ts";
import {
  canActorModifyDeliverables,
  canActorViewDeliverables,
  computeSha256Hex,
  DEFAULT_UPLOAD_POLICY,
  detectFormatFromHeaderBytes,
  validateDeliverableCandidate,
} from "../src/features/academic-pi/deliverable-validation.ts";

const VALID_PDF_HEADER = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const VALID_DOCX_HEADER = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
const VALID_PNG_HEADER = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const INVALID_EXE_HEADER = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);

const BASE_CONTEXT = {
  projectId: "PI-2026-014",
  projectTitle: "Monitoramento Preditivo Industrial",
  semester: "2026.2",
  actorRole: "STUDENT_MEMBER",
  evaluationStarted: false,
  evaluationStartsAtIso: "2026-11-25T22:00:00.000Z",
};

test("garante que os arquivos da issue FE-011 existem nas fronteiras corretas", async () => {
  await assert.doesNotReject(
    access(new URL("../src/app/academic-pi/entregaveis/page.tsx", import.meta.url))
  );
  await assert.doesNotReject(
    access(new URL("../src/features/academic-pi/deliverable-upload.tsx", import.meta.url))
  );
  await assert.doesNotReject(
    access(new URL("../src/features/academic-pi/deliverable-validation.ts", import.meta.url))
  );
  await assert.doesNotReject(
    access(new URL("../src/features/academic-pi/deliverable-upload-client.ts", import.meta.url))
  );
  await assert.doesNotReject(
    access(new URL("../src/features/academic-pi/deliverable-types.ts", import.meta.url))
  );
  await assert.doesNotReject(
    access(new URL("../src/components/progress-bar.tsx", import.meta.url))
  );
});

test("AC-PI-004-03: valida formatos oficiais (PDF, DOCX e PNG) e assinatura binária real", () => {
  assert.equal(detectFormatFromHeaderBytes(VALID_PDF_HEADER), "PDF");
  assert.equal(detectFormatFromHeaderBytes(VALID_DOCX_HEADER), "DOCX");
  assert.equal(detectFormatFromHeaderBytes(VALID_PNG_HEADER), "IMAGE");
  assert.equal(detectFormatFromHeaderBytes(INVALID_EXE_HEADER), null);

  const pdfResult = validateDeliverableCandidate(
    {
      name: "entrega-final.pdf",
      size: 2 * 1024 * 1024,
      type: "application/pdf",
      headerBytes: VALID_PDF_HEADER,
    },
    BASE_CONTEXT
  );
  assert.equal(pdfResult.isValid, true);
  assert.equal(pdfResult.detectedFormat, "PDF");

  // Arquivo executável disfarçado de PDF deve falhar na inspeção de bytes
  const spoofedResult = validateDeliverableCandidate(
    {
      name: "malware.pdf",
      size: 1024 * 100,
      type: "application/pdf",
      headerBytes: INVALID_EXE_HEADER,
    },
    BASE_CONTEXT
  );
  assert.equal(spoofedResult.isValid, false);
  assert.ok(
    spoofedResult.errors.some((e) => /Assinatura binária/i.test(e)),
    "deve rejeitar assinatura binária falsificada"
  );
});

test("FE-011 / SPEC-PI-004: rejeita arquivos vazios ou acima do limite parametrizado e alerta sobre fotos", () => {
  const emptyResult = validateDeliverableCandidate(
    {
      name: "vazio.pdf",
      size: 0,
      type: "application/pdf",
      headerBytes: VALID_PDF_HEADER,
    },
    BASE_CONTEXT
  );
  assert.equal(emptyResult.isValid, false);
  assert.ok(emptyResult.errors.some((e) => /vazio/i.test(e)));

  const oversizeDoc = validateDeliverableCandidate(
    {
      name: "relatorio-gigante.docx",
      size: DEFAULT_UPLOAD_POLICY.provisionalMaxDocumentBytes + 1024,
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      headerBytes: VALID_DOCX_HEADER,
    },
    BASE_CONTEXT
  );
  assert.equal(oversizeDoc.isValid, false);
  assert.ok(oversizeDoc.errors.some((e) => /excede o limite máximo/i.test(e)));

  // Imagem válida deve emitir aviso de autorização docente (AC-PI-004-04)
  const imageResult = validateDeliverableCandidate(
    {
      name: "equipe-prototipo.png",
      size: 1024 * 500,
      type: "image/png",
      headerBytes: VALID_PNG_HEADER,
    },
    BASE_CONTEXT
  );
  assert.equal(imageResult.isValid, true);
  assert.equal(imageResult.detectedFormat, "IMAGE");
  assert.equal(imageResult.warnings.length, 1);
  assert.match(imageResult.warnings[0], /AC-PI-004-04/);
});

test("AC-PI-004-01 e AC-PI-004-02: respeita isolamento de papéis e bloqueia edição após início da avaliação", () => {
  assert.equal(canActorViewDeliverables("STUDENT_MEMBER"), true);
  assert.equal(canActorViewDeliverables("FACULTY_ADVISOR"), true);
  assert.equal(canActorViewDeliverables("ADMIN"), true);
  assert.equal(canActorViewDeliverables("UNLINKED_USER"), false);

  const lockedContext = {
    ...BASE_CONTEXT,
    evaluationStarted: true,
  };
  const lockCheck = canActorModifyDeliverables(lockedContext);
  assert.equal(lockCheck.allowed, false);
  assert.match(lockCheck.reason || "", /AC-PI-004-02/);
});

test("FE-011 / BE-012: reporta progresso em etapas e permite cancelamento imediato via AbortController", async () => {
  const file = {
    name: "relatorio-tecnico.pdf",
    size: 500_000,
    type: "application/pdf",
    headerBytes: VALID_PDF_HEADER,
  };

  const auth = requestPresignedUploadUrl(file, BASE_CONTEXT, DEFAULT_UPLOAD_POLICY, 1_700_000_000_000);
  assert.equal(auth.bucketScope, "PRIVATE");
  assert.equal(auth.ttlSeconds, 900);
  assert.equal(isPresignedUrlExpired(auth, 1_700_000_000_000 + 899_000), false);
  assert.equal(isPresignedUrlExpired(auth, 1_700_000_000_000 + 901_000), true);

  const recordedPercentages = [];
  await executePresignedUpload({
    auth: requestPresignedUploadUrl(file, BASE_CONTEXT, DEFAULT_UPLOAD_POLICY),
    totalBytes: file.size,
    stepDelayMs: 5,
    steps: 4,
    onProgress: (snap) => {
      recordedPercentages.push(snap.percentage);
    },
  });
  assert.deepEqual(recordedPercentages, [25, 50, 75, 100]);

  // Teste de cancelamento durante o envio
  const abortController = new AbortController();
  const cancelAuth = requestPresignedUploadUrl(file, BASE_CONTEXT, DEFAULT_UPLOAD_POLICY);

  await assert.rejects(
    async () => {
      await executePresignedUpload({
        auth: cancelAuth,
        totalBytes: file.size,
        signal: abortController.signal,
        stepDelayMs: 10,
        steps: 5,
        onProgress: (snap) => {
          if (snap.percentage >= 40) {
            abortController.abort();
          }
        },
      });
    },
    (err) => err instanceof UploadCanceledError
  );
});

test("BE-013: confirma entregável com SHA-256, rejeita hash divergente e preserva idempotência", async () => {
  const file = {
    name: "foto-bancada.png",
    size: 2048,
    type: "image/png",
    headerBytes: VALID_PNG_HEADER,
  };
  const nowMs = Date.now();
  const auth = requestPresignedUploadUrl(file, BASE_CONTEXT, DEFAULT_UPLOAD_POLICY, nowMs);
  const sha256 = await computeSha256Hex(VALID_PNG_HEADER);

  const payload = {
    uploadId: auth.uploadId,
    projectId: BASE_CONTEXT.projectId,
    category: "REGISTRO_FOTOGRAFICO",
    fileName: file.name,
    mimeType: file.type,
    format: "IMAGE",
    sizeBytes: file.size,
    sha256,
    objectKey: auth.objectKey,
    correlationId: auth.correlationId,
    idempotencyKey: `idem_test_${auth.uploadId}`,
  };

  // 1. Rejeita se o hash no storage divergir do hash enviado pelo cliente
  assert.throws(
    () =>
      confirmDeliverableUpload(
        payload,
        auth,
        "0000000000000000000000000000000000000000000000000000000000000000",
        nowMs
      ),
    (err) => err instanceof UploadContractError && err.code === "SHA256_MISMATCH"
  );

  // 2. Confirma com sucesso e define status de publicação de foto pendente do docente
  const confirmedFirst = confirmDeliverableUpload(payload, auth, sha256, nowMs);
  assert.equal(confirmedFirst.status, "CONFIRMED");
  assert.equal(confirmedFirst.sha256, sha256);
  assert.equal(confirmedFirst.photoPublicationStatus, "PENDING_FACULTY_DECISION");

  // 3. Chamada repetida com mesma idempotencyKey e mesmo hash retorna o mesmo registro
  const confirmedSecond = confirmDeliverableUpload(payload, auth, sha256, nowMs + 1000);
  assert.equal(confirmedSecond.deliverableId, confirmedFirst.deliverableId);
});
