import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

import {
  approveImpactVersion,
  createImpactDraft,
  createInitialImpactStore,
  fetchPublicImpactFromApi,
  ImpactContractError,
  listPublicImpacts,
  publishImpactVersion,
  readImpactHistory,
  readImpactProvenance,
  readImpactVersions,
  readPublicImpact,
  reviseImpactVersion,
  setTeacherPhotoAuthorization,
  withdrawImpactPublication,
} from "../src/features/portal/impact-client.ts";
import {
  canActorPerformImpactAction,
  evaluateIfMatchHeader,
  filterPublishedImpactsForVisitor,
  formatRevisionEtag,
  sanitizeCorrelationId,
  toPublicImpactDto,
  validateImpactDraftInput,
} from "../src/features/portal/impact-validation.ts";

const VALID_DRAFT_INPUT = {
  title: "Monitoramento Hídrico Comunitário em Bacias Urbanas",
  summary:
    "Rede colaborativa de coleta e divulgação de indicadores básicos de qualidade da água junto a escolas técnicas de Sorocaba.",
  provenance: {
    sourceReference: "REL-EXT-2026-777-HIDRICO",
    responsibleReference: "Prof. Dr. Marcos Vinícius Almeida",
    periodStart: "2026-08-01",
    periodEnd: "2026-11-15",
  },
};

const FACULTY_CTX = {
  actorId: "prof.marcos.almeida",
  actorRole: "FACULTY_ADVISOR",
  correlationId: "corr-test-faculty-01",
};

const AUDITOR_CTX = {
  actorId: "auditor.unisenai",
  actorRole: "AUDITOR",
  correlationId: "corr-test-auditor-01",
};

const STUDENT_CTX = {
  actorId: "aluno.pi.2026",
  actorRole: "STUDENT_MEMBER",
  correlationId: "corr-test-student-01",
};

const VISITOR_CTX = {
  actorId: "",
  actorRole: "PUBLIC_VISITOR",
  correlationId: "corr-test-visitor-01",
};

test("garante que os arquivos da issue FE-016 existem nas fronteiras corretas", async () => {
  await assert.doesNotReject(
    access(new URL("../src/app/impacto/page.tsx", import.meta.url))
  );
  await assert.doesNotReject(
    access(new URL("../src/features/portal/impact-showcase.tsx", import.meta.url))
  );
  await assert.doesNotReject(
    access(
      new URL("../src/features/portal/impact-validation.ts", import.meta.url)
    )
  );
  await assert.doesNotReject(
    access(new URL("../src/features/portal/impact-client.ts", import.meta.url))
  );
  await assert.doesNotReject(
    access(new URL("../src/features/portal/impact-types.ts", import.meta.url))
  );
  await assert.doesNotReject(
    access(new URL("../src/components/alert.tsx", import.meta.url))
  );
  await assert.doesNotReject(
    access(new URL("../src/components/badge.tsx", import.meta.url))
  );
  await assert.doesNotReject(
    access(new URL("../src/components/button.tsx", import.meta.url))
  );
  await assert.doesNotReject(
    access(new URL("../src/components/input.tsx", import.meta.url))
  );
  await assert.doesNotReject(
    access(new URL("../src/components/textarea.tsx", import.meta.url))
  );
});

test("AC-01 (BE-019): rascunho exige origem, responsável e período válido e rejeita campos extras", () => {
  const validResult = validateImpactDraftInput(VALID_DRAFT_INPUT);
  assert.equal(validResult.isValid, true);
  assert.deepEqual(validResult.errors, {});

  // Origem vazia e período invertido devem falhar
  const invalidResult = validateImpactDraftInput({
    title: "Projeto teste",
    summary: "Resumo válido",
    provenance: {
      sourceReference: "   ",
      responsibleReference: "",
      periodStart: "2026-11-20",
      periodEnd: "2026-08-01",
    },
  });
  assert.equal(invalidResult.isValid, false);
  assert.ok(invalidResult.errors.sourceReference);
  assert.ok(invalidResult.errors.responsibleReference);
  assert.ok(invalidResult.errors.periodEnd);

  // Campos adicionais não permitidos (additionalProperties: false)
  const extraFieldResult = validateImpactDraftInput({
    ...VALID_DRAFT_INPUT,
    unexpectedSecretField: "nao-permitido",
  });
  assert.equal(extraFieldResult.isValid, false);
  assert.match(extraFieldResult.errors.form ?? "", /não permitido/i);
});

test("AC-02 (FE-016 / BE-019): rascunho e versão aprovada sem publicação nunca aparecem na vitrine pública", () => {
  const store = createInitialImpactStore([]);

  // 1. Cria rascunho (v1, approved: false, publishedVersion: null)
  const created = createImpactDraft(store, VALID_DRAFT_INPUT, FACULTY_CTX);
  assert.equal(created.publishedVersion, null);
  assert.equal(created.latestVersion, 1);
  assert.equal(created.cacheControl, "no-store");

  // Consulta pública de rascunho deve retornar null na projeção e 404 na API
  assert.equal(toPublicImpactDto(store.records.get(created.id)), null);
  assert.throws(
    () => readPublicImpact(store, created.id),
    (err) => err instanceof ImpactContractError && err.status === 404
  );
  assert.equal(listPublicImpacts(store).items.length, 0);

  // Tentativa de publicar versão não aprovada deve retornar 409 Conflict
  assert.throws(
    () =>
      publishImpactVersion(store, created.id, 1, {
        ...FACULTY_CTX,
        ifMatch: created.etag,
      }),
    (err) => err instanceof ImpactContractError && err.status === 409
  );

  // 2. Aprova versão 1 (approved: true, mas publishedVersion continua null)
  const approved = approveImpactVersion(store, created.id, 1, {
    ...FACULTY_CTX,
    ifMatch: created.etag,
  });
  assert.equal(approved.publishedVersion, null);

  // Mesmo aprovado, sem publicação explícita não pode aparecer no portal público (AC-02)
  assert.throws(
    () => readPublicImpact(store, created.id),
    (err) => err instanceof ImpactContractError && err.status === 404
  );
  assert.equal(listPublicImpacts(store).items.length, 0);
});

test("AC-03 (FE-016 / BE-019): publicação exibe apenas a versão aprovada e ignora rascunhos posteriores até nova aprovação/publicação", () => {
  const store = createInitialImpactStore([]);

  const created = createImpactDraft(store, VALID_DRAFT_INPUT, FACULTY_CTX);
  const approvedV1 = approveImpactVersion(store, created.id, 1, {
    ...FACULTY_CTX,
    ifMatch: created.etag,
  });
  const publishedV1 = publishImpactVersion(store, created.id, 1, {
    ...FACULTY_CTX,
    ifMatch: approvedV1.etag,
  });

  assert.equal(publishedV1.publishedVersion, 1);

  // Agora deve aparecer na consulta pública e na vitrine
  const publicReadV1 = readPublicImpact(store, created.id);
  assert.equal(publicReadV1.data.version, 1);
  assert.equal(publicReadV1.data.title, VALID_DRAFT_INPUT.title);
  assert.equal(publicReadV1.headers["Cache-Control"], "no-store");

  // Cria revisão v2 em rascunho (não aprovada)
  const revisedV2 = reviseImpactVersion(
    store,
    created.id,
    {
      title: "[RASCUNHO INTERNO V2] Título em edição",
      summary: "Resumo em edição da v2 que não pode vazar no portal.",
      provenance: VALID_DRAFT_INPUT.provenance,
    },
    {
      ...FACULTY_CTX,
      ifMatch: publishedV1.etag,
    }
  );

  assert.equal(revisedV2.latestVersion, 2);
  assert.equal(revisedV2.publishedVersion, 1);

  // A vitrine pública DEVE continuar servindo a versão 1 aprovada (AC-03)
  const publicDuringV2Draft = readPublicImpact(store, created.id);
  assert.equal(publicDuringV2Draft.data.version, 1);
  assert.equal(publicDuringV2Draft.data.title, VALID_DRAFT_INPUT.title);

  // Aprovar e publicar v2 atualiza o ponteiro público para v2
  const approvedV2 = approveImpactVersion(store, created.id, 2, {
    ...FACULTY_CTX,
    ifMatch: revisedV2.etag,
  });
  const publishedV2 = publishImpactVersion(store, created.id, 2, {
    ...FACULTY_CTX,
    ifMatch: approvedV2.etag,
  });
  assert.equal(publishedV2.publishedVersion, 2);

  const publicAfterV2Publish = readPublicImpact(store, created.id);
  assert.equal(publicAfterV2Publish.data.version, 2);
  assert.equal(
    publicAfterV2Publish.data.title,
    "[RASCUNHO INTERNO V2] Título em edição"
  );
});

test("AC-04 e AC-S4-09: retirada remove imediatamente a exposição pública preservando versões e histórico para auditoria", () => {
  const store = createInitialImpactStore();
  const publishedId = "10000000-0000-4000-8000-000000000001";

  // Antes da retirada está visível
  const before = readPublicImpact(store, publishedId);
  assert.equal(before.data.version, 1);

  const record = store.records.get(publishedId);
  const withdrawn = withdrawImpactPublication(store, publishedId, {
    ...FACULTY_CTX,
    ifMatch: formatRevisionEtag(record.revision),
  });
  assert.equal(withdrawn.publishedVersion, null);
  assert.equal(withdrawn.cacheControl, "no-store");

  // Após retirada, GET público retorna 404 e não aparece na listagem
  assert.throws(
    () => readPublicImpact(store, publishedId),
    (err) => err instanceof ImpactContractError && err.status === 404
  );
  assert.equal(
    listPublicImpacts(store).items.some((i) => i.id === publishedId),
    false
  );

  // Versões e histórico permanecem preservados internamente (AC-04)
  const versions = readImpactVersions(store, publishedId, FACULTY_CTX);
  assert.equal(versions.totalElements, 2);

  const history = readImpactHistory(store, publishedId, AUDITOR_CTX);
  assert.equal(history.items[history.items.length - 1].action, "WITHDRAW");
});

test("AC-05, AC-S4-07 e AC-S3-09: protege dados individuais/proveniência na allowlist pública, controla fotos e restringe AUDIT", () => {
  const store = createInitialImpactStore();
  const publishedId = "10000000-0000-4000-8000-000000000001";

  const publicResponse = readPublicImpact(store, publishedId).data;
  const serialized = JSON.stringify(publicResponse);

  // Garantias de privacidade (AC-S4-07 / SPEC-PORTAL-002):
  assert.equal("provenance" in publicResponse, false);
  assert.equal("internalStudentGrades" in publicResponse, false);
  assert.equal("internalStudentHours" in publicResponse, false);
  assert.equal("internalUnapprovedMetrics" in publicResponse, false);
  assert.equal(serialized.includes("REL-EXT-2026-014-UNISENAI-SOROCABA"), false);
  assert.equal(serialized.includes("RA-2026101"), false);
  assert.equal(serialized.includes("450 moradores"), false);

  // Controle de direito de imagem pelo docente responsável (AC-S3-09 / AC-PORTAL-001-05):
  assert.equal((publicResponse.authorizedPhotoCaptions ?? []).length, 2);
  setTeacherPhotoAuthorization(store, publishedId, false, FACULTY_CTX);
  const afterRevokePhotos = readPublicImpact(store, publishedId).data;
  assert.deepEqual(afterRevokePhotos.authorizedPhotoCaptions, []);

  // Proveniência e histórico exigem permissão AUDIT (AC-05):
  assert.equal(canActorPerformImpactAction("PUBLIC_VISITOR", "AUDIT"), false);
  assert.equal(canActorPerformImpactAction("STUDENT_MEMBER", "AUDIT"), false);
  assert.equal(canActorPerformImpactAction("FACULTY_ADVISOR", "AUDIT"), false);
  assert.equal(canActorPerformImpactAction("AUDITOR", "AUDIT"), true);

  assert.throws(
    () => readImpactProvenance(store, publishedId, 1, VISITOR_CTX),
    (err) => err instanceof ImpactContractError && err.status === 401
  );
  assert.throws(
    () => readImpactProvenance(store, publishedId, 1, STUDENT_CTX),
    (err) => err instanceof ImpactContractError && err.status === 403
  );

  const provenance = readImpactProvenance(store, publishedId, 1, AUDITOR_CTX);
  assert.equal(provenance.sourceReference, "REL-EXT-2026-014-UNISENAI-SOROCABA");
  assert.equal(provenance.periodStart, "2026-08-01");
  assert.equal(provenance.periodEnd, "2026-10-10");
});

test("BE-019: valida If-Match (412/428), sanitiza X-Correlation-Id e filtra vitrine por curso, semestre e ODS", async () => {
  const store = createInitialImpactStore();
  const publishedId = "10000000-0000-4000-8000-000000000001";

  assert.equal(evaluateIfMatchHeader(undefined, 3), "MISSING_OR_INVALID");
  assert.equal(evaluateIfMatchHeader("invalido", 3), "MISSING_OR_INVALID");
  assert.equal(evaluateIfMatchHeader('"99"', 3), "MISMATCH");
  assert.equal(evaluateIfMatchHeader('"3"', 3), "MATCH");

  // Sem If-Match -> 428
  assert.throws(
    () =>
      withdrawImpactPublication(store, publishedId, {
        ...FACULTY_CTX,
        ifMatch: undefined,
      }),
    (err) => err instanceof ImpactContractError && err.status === 428
  );

  // If-Match desatualizado -> 412
  assert.throws(
    () =>
      withdrawImpactPublication(store, publishedId, {
        ...FACULTY_CTX,
        ifMatch: '"1"',
      }),
    (err) => err instanceof ImpactContractError && err.status === 412
  );

  // Sanitização de X-Correlation-Id
  assert.equal(
    sanitizeCorrelationId("valor invalido com espacos", "corr-fallback"),
    "corr-fallback"
  );
  assert.equal(
    sanitizeCorrelationId("corr_valido-123.ok", "corr-fallback"),
    "corr_valido-123.ok"
  );

  // Filtros combinados na vitrine pública (apenas sobre os 2 publicados do seed de 5 registros)
  const allRecords = Array.from(store.records.values());
  assert.equal(allRecords.length, 5);
  assert.equal(filterPublishedImpactsForVisitor(allRecords).length, 2);
  assert.equal(
    filterPublishedImpactsForVisitor(allRecords, {
      course: "Engenharia Mecatrônica",
    }).length,
    1
  );
  assert.equal(
    filterPublishedImpactsForVisitor(allRecords, { ods: 11 }).length,
    1
  );
  assert.equal(
    filterPublishedImpactsForVisitor(allRecords, { query: "inexistente-xyz" })
      .length,
    0
  );

  // Adaptador HTTP descarta campos extras da API e aplica allowlist
  const dtoFromHttp = await fetchPublicImpactFromApi(
    "https://api.example.test",
    publishedId,
    {
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            id: publishedId,
            version: 1,
            title: "Título Público HTTP",
            summary: "Resumo Público HTTP",
            sourceReference: "NAO_DEVE_VAZAR",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
              "X-Correlation-Id": "corr-http-200",
            },
          }
        ),
    }
  );
  assert.deepEqual(dtoFromHttp, {
    id: publishedId,
    version: 1,
    title: "Título Público HTTP",
    summary: "Resumo Público HTTP",
  });
  assert.equal("sourceReference" in dtoFromHttp, false);
});

