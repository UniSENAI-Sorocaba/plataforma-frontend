import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

import {
  AssetsDomainError,
  checkinNotebook,
  checkoutNotebook,
  createRoomBooking,
  decideRoomBooking,
  getInitialAssetsPrototypeState,
  isValidPatrimonyQrCode,
  reportDamageIncident,
  resolveDamageIncident,
  togglePoCriterionValidation,
} from "../src/features/assets/assets-service.ts";

test("FE-023: garante que os arquivos do protótipo de patrimônio existem nas fronteiras corretas", async () => {
  await assert.doesNotReject(
    access(new URL("../src/app/prototipos/patrimonio/page.tsx", import.meta.url))
  );
  await assert.doesNotReject(
    access(new URL("../src/features/assets/assets-prototype.tsx", import.meta.url))
  );
  await assert.doesNotReject(
    access(new URL("../src/features/assets/assets-service.ts", import.meta.url))
  );
  await assert.doesNotReject(
    access(new URL("../src/features/assets/assets-types.ts", import.meta.url))
  );
  await assert.doesNotReject(
    access(new URL("../src/features/assets/README.md", import.meta.url))
  );
});

test("US14 (FE-023): valida QR Code patrimonial e ciclo completo de check-out e check-in de notebook", () => {
  assert.equal(isValidPatrimonyQrCode("PAT-NB-2027-001"), true);
  assert.equal(isValidPatrimonyQrCode("QR-INVALIDO-123"), false);

  const initial = getInitialAssetsPrototypeState();

  // Check-out de notebook disponível (PAT-NB-2027-001)
  const afterCheckout = checkoutNotebook(initial, {
    qrCode: "PAT-NB-2027-001",
    borrowerName: "Matheus Henrique Koop Boff",
    borrowerId: "RA-20261001",
    borrowerRole: "STUDENT",
    purpose: "Desenvolvimento de sistema embarcado do PI",
    nowIso: "2026-11-20T14:00:00.000Z",
  });

  const nb1 = afterCheckout.notebooks.find((n) => n.qrCode === "PAT-NB-2027-001");
  assert.equal(nb1?.status, "CHECKED_OUT");
  assert.equal(nb1?.currentBorrowerId, "RA-20261001");

  // Tentativa de novo check-out do mesmo notebook deve falhar
  assert.throws(
    () =>
      checkoutNotebook(afterCheckout, {
        qrCode: "PAT-NB-2027-001",
        borrowerName: "Outro Aluno",
        borrowerId: "RA-20269999",
        borrowerRole: "STUDENT",
        purpose: "Uso concorrente não autorizado",
      }),
    (err) => err instanceof AssetsDomainError && err.code === "ASSET_ALREADY_CHECKED_OUT"
  );

  // Tentativa de check-out de notebook em manutenção (PAT-NB-2027-003) deve falhar
  assert.throws(
    () =>
      checkoutNotebook(afterCheckout, {
        qrCode: "PAT-NB-2027-003",
        borrowerName: "Matheus Boff",
        borrowerId: "RA-20261001",
        borrowerRole: "STUDENT",
        purpose: "Tentativa em equipamento bloqueado",
      }),
    (err) => err instanceof AssetsDomainError && err.code === "ASSET_IN_MAINTENANCE"
  );

  // Check-in devolve a disponibilidade do notebook
  const afterCheckin = checkinNotebook(afterCheckout, {
    qrCode: "PAT-NB-2027-001",
    returnConditionNote: "Devolvido sem avarias.",
    nowIso: "2026-11-20T18:00:00.000Z",
  });
  const nb1Returned = afterCheckin.notebooks.find((n) => n.qrCode === "PAT-NB-2027-001");
  assert.equal(nb1Returned?.status, "AVAILABLE");
  assert.equal(nb1Returned?.currentBorrowerId, undefined);
});

test("US15 (FE-023): agendamento de salas detecta conflitos de horário e exige justificativa na recusa", () => {
  const initial = getInitialAssetsPrototypeState();

  // Conflito com reserva inicial em 2026-11-25 das 18:30 às 20:30 no room-iot
  assert.throws(
    () =>
      createRoomBooking(initial, {
        roomId: "room-iot",
        requesterName: "Giovani Miamoto",
        requesterId: "RA-20261005",
        projectOrActivity: "Teste concorrente no mesmo laboratório",
        dateIso: "2026-11-25",
        startTime: "19:00",
        endTime: "21:00",
      }),
    (err) => err instanceof AssetsDomainError && err.code === "ROOM_SCHEDULE_CONFLICT"
  );

  // Reserva válida em horário livre
  const afterBooking = createRoomBooking(initial, {
    roomId: "room-iot",
    requesterName: "Matheus Boff",
    requesterId: "RA-20261001",
    projectOrActivity: "Calibração de sensores fora do horário",
    dateIso: "2026-11-26",
    startTime: "18:30",
    endTime: "20:30",
  });

  const created = afterBooking.bookings[0];
  assert.equal(created.status, "PENDING_APPROVAL");

  // Recusa sem justificativa deve falhar
  assert.throws(
    () => decideRoomBooking(afterBooking, created.bookingId, "REJECTED", ""),
    (err) => err instanceof AssetsDomainError && err.code === "REJECTION_NOTE_REQUIRED"
  );

  // Aprovação atualiza status para APPROVED
  const afterApproval = decideRoomBooking(
    afterBooking,
    created.bookingId,
    "APPROVED",
    "Autorizado pela coordenação."
  );
  assert.equal(afterApproval.bookings[0].status, "APPROVED");
});

test("US15 e PG-019 (FE-023): registro de avaria grave bloqueia ativo para manutenção até resolução e PO valida checklist", () => {
  const initial = getInitialAssetsPrototypeState();

  const afterIncident = reportDamageIncident(initial, {
    targetType: "NOTEBOOK",
    targetId: "nb-001",
    reporterName: "Prof. Orientador",
    severity: "CRITICA",
    description: "Tela com falha de backlight impedindo uso em bancada.",
    photoEvidenceRef: "evidencia-tela-nb001.png",
  });

  const nb1Locked = afterIncident.notebooks.find((n) => n.assetId === "nb-001");
  assert.equal(nb1Locked?.status, "MAINTENANCE");

  const newIncidentId = afterIncident.incidents[0].incidentId;
  const afterResolution = resolveDamageIncident(
    afterIncident,
    newIncidentId,
    "Substituição do cabo flat do display concluída com sucesso."
  );

  const nb1Restored = afterResolution.notebooks.find((n) => n.assetId === "nb-001");
  assert.equal(nb1Restored?.status, "AVAILABLE");
  assert.equal(afterResolution.incidents[0].status, "RESOLVED");

  // Checklist do PO
  const toggled = togglePoCriterionValidation(afterResolution, "PO-PAT-01");
  const item = toggled.poChecklist.find((c) => c.criterionId === "PO-PAT-01");
  assert.equal(item?.validatedByPo, false);
});
