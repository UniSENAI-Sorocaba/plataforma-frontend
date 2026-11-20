import type {
  AssetsPrototypeState,
  CheckinNotebookInput,
  CheckoutNotebookInput,
  CreateRoomBookingInput,
  DamageIncident,
  NotebookAsset,
  NotebookLoanRecord,
  ReportDamageIncidentInput,
  RoomBooking,
} from "./assets-types";

export class AssetsDomainError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AssetsDomainError";
    this.code = code;
  }
}

const QR_CODE_REGEX = /^PAT-(NB|SALA)-\d{4}-\d{3}$/;
const TIME_HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidPatrimonyQrCode(qrCode: string): boolean {
  return QR_CODE_REGEX.test(qrCode.trim().toUpperCase());
}

export function getInitialAssetsPrototypeState(): AssetsPrototypeState {
  return {
    notebooks: [
      {
        assetId: "nb-001",
        qrCode: "PAT-NB-2027-001",
        model: "Dell Latitude 5440 (i7 / 16GB / 512GB NVMe)",
        serialNumber: "SN-DL5440-8821",
        patrimonyNumber: "SENAI-801142",
        location: "Armário Inteligente B1 • Bloco C",
        status: "AVAILABLE",
        lastUpdatedIso: "2026-11-18T10:00:00.000Z",
      },
      {
        assetId: "nb-002",
        qrCode: "PAT-NB-2027-002",
        model: "Lenovo ThinkPad T14 Gen 4 (Ryzen 7 / 16GB)",
        serialNumber: "SN-TP14G4-9043",
        patrimonyNumber: "SENAI-801143",
        location: "Armário Inteligente B1 • Bloco C",
        status: "CHECKED_OUT",
        currentBorrowerName: "Lucas Silva",
        currentBorrowerId: "RA-20261002",
        lastUpdatedIso: "2026-11-19T14:30:00.000Z",
      },
      {
        assetId: "nb-003",
        qrCode: "PAT-NB-2027-003",
        model: "Dell Precision 3581 Workstation (i7 / RTX A1000)",
        serialNumber: "SN-DP3581-1109",
        patrimonyNumber: "SENAI-801144",
        location: "Suporte Técnico • Manutenção",
        status: "MAINTENANCE",
        lastUpdatedIso: "2026-11-17T16:15:00.000Z",
      },
    ],
    loans: [
      {
        loanId: "loan-001",
        assetId: "nb-002",
        qrCode: "PAT-NB-2027-002",
        borrowerName: "Lucas Silva",
        borrowerId: "RA-20261002",
        borrowerRole: "STUDENT",
        purpose: "Compilação de firmware embarcado para Projeto Integrador",
        checkedOutAtIso: "2026-11-19T14:30:00.000Z",
      },
    ],
    rooms: [
      {
        roomId: "room-iot",
        code: "LAB-C201",
        name: "Laboratório de IoT e Indústria 4.0",
        capacity: 24,
        allowedAfterHoursWindow: "18:00 às 22:30",
      },
      {
        roomId: "room-maker",
        code: "LAB-A105",
        name: "Espaço Maker e Prototipagem Rápida",
        capacity: 18,
        allowedAfterHoursWindow: "17:30 às 22:00",
      },
      {
        roomId: "room-robotics",
        code: "LAB-B304",
        name: "Laboratório de Robótica e Automação",
        capacity: 20,
        allowedAfterHoursWindow: "18:00 às 22:30",
      },
    ],
    bookings: [
      {
        bookingId: "bk-001",
        roomId: "room-iot",
        roomName: "Laboratório de IoT e Indústria 4.0",
        requesterName: "Matheus Henrique Koop Boff",
        requesterId: "RA-20261001",
        projectOrActivity: "PI-2026-014 • Bancada de Sensores Industriais",
        dateIso: "2026-11-25",
        startTime: "18:30",
        endTime: "20:30",
        status: "APPROVED",
        reviewerNote: "Reserva autorizada pela coordenação de laboratório.",
        createdAtIso: "2026-11-18T11:20:00.000Z",
      },
    ],
    incidents: [
      {
        incidentId: "inc-001",
        targetType: "NOTEBOOK",
        targetId: "nb-003",
        targetLabel: "PAT-NB-2027-003 • Dell Precision 3581",
        reporterName: "Prof. Ricardo Almeida",
        severity: "ALTA",
        description: "Conector USB-C lateral com mau contato intermitente durante alimentação.",
        photoEvidenceRef: "evidencia-usbc-nb003.jpg",
        status: "IN_REPAIR",
        createdAtIso: "2026-11-17T16:15:00.000Z",
      },
    ],
    poChecklist: [
      {
        criterionId: "PO-PAT-01",
        userStoryRef: "US14",
        title: "Inventário de Notebooks com QR Code e Rastreabilidade",
        description:
          "Permite identificar cada notebook por QR Code padronizado (PAT-NB-YYYY-NNN), consultar status (Disponível, Emprestado, Em Manutenção) e auditar histórico de responsáveis.",
        validatedByPo: true,
      },
      {
        criterionId: "PO-PAT-02",
        userStoryRef: "US14",
        title: "Fluxo de Check-out e Check-in com Bloqueio de Indisponíveis",
        description:
          "Impede empréstimo concorrente de notebook já emprestado ou bloqueado por manutenção, exigindo identificação institucional (RA/Matrícula) e finalidade acadêmica.",
        validatedByPo: true,
      },
      {
        criterionId: "PO-PAT-03",
        userStoryRef: "US15",
        title: "Agendamento de Salas Fora do Horário com Detecção de Conflito",
        description:
          "Valida janela de horário (início < término), bloqueia sobreposição de reservas na mesma sala/data e suporta aprovação ou recusa justificada pela coordenação.",
        validatedByPo: true,
      },
      {
        criterionId: "PO-PAT-04",
        userStoryRef: "US15",
        title: "Gestão de Ocorrências/Avarias com Evidência Fotográfica e Quarentena",
        description:
          "Registra avarias físicas com referência de foto e move automaticamente o equipamento para manutenção quando a severidade é Alta ou Crítica.",
        validatedByPo: true,
      },
      {
        criterionId: "PO-PAT-05",
        userStoryRef: "PG-019",
        title: "Enquadramento no Planejamento 2027.1 (Backlog Fase 2)",
        description:
          "Protótipo isolado da superfície pública de indexação (noindex) e alinhado ao refinamento US14–18 para homologação do Product Owner.",
        validatedByPo: true,
      },
    ],
  };
}

/**
 * US14: Realiza check-out (empréstimo) de notebook mediante leitura de QR Code e validação de status.
 */
export function checkoutNotebook(
  state: AssetsPrototypeState,
  input: CheckoutNotebookInput
): AssetsPrototypeState {
  const normalizedQr = (input.qrCode || "").trim().toUpperCase();
  if (!isValidPatrimonyQrCode(normalizedQr)) {
    throw new AssetsDomainError(
      "INVALID_QR_CODE",
      "Código QR patrimonial inválido. Utilize o formato institucional PAT-NB-YYYY-NNN (US14)."
    );
  }

  const borrowerName = (input.borrowerName || "").trim();
  const borrowerId = (input.borrowerId || "").trim();
  const purpose = (input.purpose || "").trim();

  if (borrowerName.length < 3) {
    throw new AssetsDomainError(
      "INVALID_BORROWER_NAME",
      "Informe o nome completo do responsável pelo empréstimo (mínimo 3 caracteres)."
    );
  }

  if (borrowerId.length < 4) {
    throw new AssetsDomainError(
      "INVALID_BORROWER_ID",
      "Informe o RA ou matrícula institucional válida do responsável."
    );
  }

  if (purpose.length < 5) {
    throw new AssetsDomainError(
      "INVALID_PURPOSE",
      "Descreva a finalidade acadêmica do empréstimo (mínimo 5 caracteres)."
    );
  }

  const assetIndex = state.notebooks.findIndex((n) => n.qrCode === normalizedQr);
  if (assetIndex === -1) {
    throw new AssetsDomainError(
      "ASSET_NOT_FOUND",
      `Nenhum notebook encontrado no inventário para o QR Code ${normalizedQr}.`
    );
  }

  const asset = state.notebooks[assetIndex];
  if (asset.status === "CHECKED_OUT") {
    throw new AssetsDomainError(
      "ASSET_ALREADY_CHECKED_OUT",
      `O notebook ${normalizedQr} já está emprestado para ${asset.currentBorrowerName || "outro usuário"} (US14).`
    );
  }

  if (asset.status === "MAINTENANCE") {
    throw new AssetsDomainError(
      "ASSET_IN_MAINTENANCE",
      `O notebook ${normalizedQr} encontra-se bloqueado para manutenção devido a avaria registrada (US14 / US15).`
    );
  }

  const nowIso = input.nowIso || new Date().toISOString();
  const updatedAsset: NotebookAsset = {
    ...asset,
    status: "CHECKED_OUT",
    currentBorrowerName: borrowerName,
    currentBorrowerId: borrowerId,
    lastUpdatedIso: nowIso,
  };

  const newLoan: NotebookLoanRecord = {
    loanId: `loan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    assetId: asset.assetId,
    qrCode: asset.qrCode,
    borrowerName,
    borrowerId,
    borrowerRole: input.borrowerRole,
    purpose,
    checkedOutAtIso: nowIso,
  };

  const updatedNotebooks = [...state.notebooks];
  updatedNotebooks[assetIndex] = updatedAsset;

  return {
    ...state,
    notebooks: updatedNotebooks,
    loans: [newLoan, ...state.loans],
  };
}

/**
 * US14: Realiza check-in (devolução) de notebook emprestado, registrando condição de retorno.
 */
export function checkinNotebook(
  state: AssetsPrototypeState,
  input: CheckinNotebookInput
): AssetsPrototypeState {
  const normalizedQr = (input.qrCode || "").trim().toUpperCase();
  const assetIndex = state.notebooks.findIndex((n) => n.qrCode === normalizedQr);

  if (assetIndex === -1) {
    throw new AssetsDomainError(
      "ASSET_NOT_FOUND",
      `Nenhum notebook encontrado para o QR Code ${normalizedQr}.`
    );
  }

  const asset = state.notebooks[assetIndex];
  if (asset.status !== "CHECKED_OUT") {
    throw new AssetsDomainError(
      "ASSET_NOT_CHECKED_OUT",
      `O notebook ${normalizedQr} não possui empréstimo ativo para devolução.`
    );
  }

  const nowIso = input.nowIso || new Date().toISOString();
  const nextStatus = input.requiresMaintenance ? "MAINTENANCE" : "AVAILABLE";

  const updatedAsset: NotebookAsset = {
    ...asset,
    status: nextStatus,
    currentBorrowerName: undefined,
    currentBorrowerId: undefined,
    lastUpdatedIso: nowIso,
  };

  const updatedNotebooks = [...state.notebooks];
  updatedNotebooks[assetIndex] = updatedAsset;

  let activeLoanClosed = false;
  const updatedLoans = state.loans.map((loan) => {
    if (!activeLoanClosed && loan.qrCode === normalizedQr && !loan.checkedInAtIso) {
      activeLoanClosed = true;
      return {
        ...loan,
        checkedInAtIso: nowIso,
        returnConditionNote:
          input.returnConditionNote?.trim() || "Devolvido em condições normais de uso.",
      };
    }
    return loan;
  });

  return {
    ...state,
    notebooks: updatedNotebooks,
    loans: updatedLoans,
  };
}

function parseTimeMinutes(hhmm: string): number | null {
  const trimmed = (hhmm || "").trim();
  const match = TIME_HHMM_REGEX.exec(trimmed);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * US15: Verifica sobreposição de horário para reservas ativas (PENDING_APPROVAL ou APPROVED) na mesma sala e data.
 */
export function hasRoomScheduleConflict(
  bookings: readonly RoomBooking[],
  roomId: string,
  dateIso: string,
  startTime: string,
  endTime: string
): RoomBooking | null {
  const startMin = parseTimeMinutes(startTime);
  const endMin = parseTimeMinutes(endTime);
  if (startMin === null || endMin === null) {
    return null;
  }

  for (const existing of bookings) {
    if (
      existing.roomId !== roomId ||
      existing.dateIso !== dateIso ||
      existing.status === "REJECTED"
    ) {
      continue;
    }

    const existingStart = parseTimeMinutes(existing.startTime);
    const existingEnd = parseTimeMinutes(existing.endTime);
    if (existingStart === null || existingEnd === null) {
      continue;
    }

    if (startMin < existingEnd && endMin > existingStart) {
      return existing;
    }
  }

  return null;
}

/**
 * US15: Solicita agendamento de sala/laboratório fora do horário regular.
 */
export function createRoomBooking(
  state: AssetsPrototypeState,
  input: CreateRoomBookingInput
): AssetsPrototypeState {
  const room = state.rooms.find((r) => r.roomId === input.roomId);
  if (!room) {
    throw new AssetsDomainError("ROOM_NOT_FOUND", "Sala ou laboratório inválido.");
  }

  const requesterName = (input.requesterName || "").trim();
  const requesterId = (input.requesterId || "").trim();
  const projectOrActivity = (input.projectOrActivity || "").trim();
  const dateIso = (input.dateIso || "").trim();

  if (requesterName.length < 3 || requesterId.length < 4) {
    throw new AssetsDomainError(
      "INVALID_REQUESTER",
      "Informe o nome e o RA/matrícula do responsável pela reserva da sala."
    );
  }

  if (projectOrActivity.length < 5) {
    throw new AssetsDomainError(
      "INVALID_BOOKING_ACTIVITY",
      "Informe o projeto ou atividade vinculada ao uso do laboratório (mínimo 5 caracteres)."
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    throw new AssetsDomainError(
      "INVALID_BOOKING_DATE",
      "Informe uma data válida no formato AAAA-MM-DD."
    );
  }

  const startMin = parseTimeMinutes(input.startTime);
  const endMin = parseTimeMinutes(input.endTime);

  if (startMin === null || endMin === null || startMin >= endMin) {
    throw new AssetsDomainError(
      "INVALID_TIME_RANGE",
      "O horário de término deve ser posterior ao horário de início da reserva (US15)."
    );
  }

  const conflict = hasRoomScheduleConflict(
    state.bookings,
    room.roomId,
    dateIso,
    input.startTime,
    input.endTime
  );

  if (conflict) {
    throw new AssetsDomainError(
      "ROOM_SCHEDULE_CONFLICT",
      `Conflito de horário detectado no ${room.name} em ${dateIso} entre ${conflict.startTime} e ${conflict.endTime} (Reserva: ${conflict.projectOrActivity}).`
    );
  }

  const nowIso = input.nowIso || new Date().toISOString();
  const newBooking: RoomBooking = {
    bookingId: `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    roomId: room.roomId,
    roomName: room.name,
    requesterName,
    requesterId,
    projectOrActivity,
    dateIso,
    startTime: input.startTime.trim(),
    endTime: input.endTime.trim(),
    status: "PENDING_APPROVAL",
    createdAtIso: nowIso,
  };

  return {
    ...state,
    bookings: [newBooking, ...state.bookings],
  };
}

/**
 * US15: Aprova ou recusa reserva de sala fora do horário.
 */
export function decideRoomBooking(
  state: AssetsPrototypeState,
  bookingId: string,
  decision: "APPROVED" | "REJECTED",
  reviewerNote: string
): AssetsPrototypeState {
  const index = state.bookings.findIndex((b) => b.bookingId === bookingId);
  if (index === -1) {
    throw new AssetsDomainError("BOOKING_NOT_FOUND", "Reserva não encontrada.");
  }

  const trimmedNote = (reviewerNote || "").trim();
  if (decision === "REJECTED" && trimmedNote.length < 5) {
    throw new AssetsDomainError(
      "REJECTION_NOTE_REQUIRED",
      "A recusa de reserva de sala exige justificativa mínima de 5 caracteres."
    );
  }

  const updated = [...state.bookings];
  updated[index] = {
    ...updated[index],
    status: decision,
    reviewerNote:
      trimmedNote ||
      (decision === "APPROVED"
        ? "Aprovado pela coordenação para uso fora do horário."
        : undefined),
  };

  return {
    ...state,
    bookings: updated,
  };
}

/**
 * US15: Registra ocorrência/avaria física com referência de evidência fotográfica
 * e coloca o notebook automaticamente em manutenção se a severidade for ALTA ou CRITICA.
 */
export function reportDamageIncident(
  state: AssetsPrototypeState,
  input: ReportDamageIncidentInput
): AssetsPrototypeState {
  const reporterName = (input.reporterName || "").trim();
  const description = (input.description || "").trim();
  const photoEvidenceRef = (input.photoEvidenceRef || "").trim();

  if (reporterName.length < 3) {
    throw new AssetsDomainError(
      "INVALID_REPORTER",
      "Informe o nome do responsável pelo relato da ocorrência."
    );
  }

  if (description.length < 10) {
    throw new AssetsDomainError(
      "INVALID_INCIDENT_DESCRIPTION",
      "Descreva detalhadamente a avaria física identificada (mínimo 10 caracteres)."
    );
  }

  if (
    !photoEvidenceRef ||
    !/\.(png|jpg|jpeg|webp|pdf)$/i.test(photoEvidenceRef)
  ) {
    throw new AssetsDomainError(
      "INVALID_PHOTO_EVIDENCE",
      "Informe um arquivo de evidência fotográfica válido (.png, .jpg, .jpeg, .webp) para documentar a avaria (US15)."
    );
  }

  let targetLabel = "";
  let updatedNotebooks = state.notebooks;
  const nowIso = input.nowIso || new Date().toISOString();

  if (input.targetType === "NOTEBOOK") {
    const nbIndex = state.notebooks.findIndex((n) => n.assetId === input.targetId);
    if (nbIndex === -1) {
      throw new AssetsDomainError(
        "TARGET_ASSET_NOT_FOUND",
        "Notebook selecionado para ocorrência não foi encontrado."
      );
    }
    const nb = state.notebooks[nbIndex];
    targetLabel = `${nb.qrCode} • ${nb.model}`;

    if (input.severity === "ALTA" || input.severity === "CRITICA") {
      updatedNotebooks = [...state.notebooks];
      updatedNotebooks[nbIndex] = {
        ...nb,
        status: "MAINTENANCE",
        lastUpdatedIso: nowIso,
      };
    }
  } else {
    const room = state.rooms.find((r) => r.roomId === input.targetId);
    if (!room) {
      throw new AssetsDomainError(
        "TARGET_ROOM_NOT_FOUND",
        "Sala ou laboratório selecionado para ocorrência não foi encontrado."
      );
    }
    targetLabel = `${room.code} • ${room.name}`;
  }

  const newIncident: DamageIncident = {
    incidentId: `inc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    targetType: input.targetType,
    targetId: input.targetId,
    targetLabel,
    reporterName,
    severity: input.severity,
    description,
    photoEvidenceRef,
    status:
      input.severity === "ALTA" || input.severity === "CRITICA"
        ? "IN_REPAIR"
        : "OPEN",
    createdAtIso: nowIso,
  };

  return {
    ...state,
    notebooks: updatedNotebooks,
    incidents: [newIncident, ...state.incidents],
  };
}

/**
 * US15: Registra a resolução de uma avaria e libera o notebook para uso caso estivesse em manutenção.
 */
export function resolveDamageIncident(
  state: AssetsPrototypeState,
  incidentId: string,
  resolutionNote: string,
  nowIso: string = new Date().toISOString()
): AssetsPrototypeState {
  const index = state.incidents.findIndex((i) => i.incidentId === incidentId);
  if (index === -1) {
    throw new AssetsDomainError("INCIDENT_NOT_FOUND", "Ocorrência não encontrada.");
  }

  const trimmedNote = (resolutionNote || "").trim();
  if (trimmedNote.length < 5) {
    throw new AssetsDomainError(
      "RESOLUTION_NOTE_REQUIRED",
      "Informe o parecer técnico de resolução da avaria (mínimo 5 caracteres)."
    );
  }

  const incident = state.incidents[index];
  const updatedIncidents = [...state.incidents];
  updatedIncidents[index] = {
    ...incident,
    status: "RESOLVED",
    resolvedAtIso: nowIso,
    resolutionNote: trimmedNote,
  };

  let updatedNotebooks = state.notebooks;
  if (incident.targetType === "NOTEBOOK") {
    const stillHasOpenSevereIncident = updatedIncidents.some(
      (i) =>
        i.targetType === "NOTEBOOK" &&
        i.targetId === incident.targetId &&
        i.status !== "RESOLVED" &&
        (i.severity === "ALTA" || i.severity === "CRITICA")
    );

    if (!stillHasOpenSevereIncident) {
      updatedNotebooks = state.notebooks.map((nb) =>
        nb.assetId === incident.targetId && nb.status === "MAINTENANCE"
          ? { ...nb, status: "AVAILABLE", lastUpdatedIso: nowIso }
          : nb
      );
    }
  }

  return {
    ...state,
    notebooks: updatedNotebooks,
    incidents: updatedIncidents,
  };
}

export function togglePoCriterionValidation(
  state: AssetsPrototypeState,
  criterionId: string
): AssetsPrototypeState {
  return {
    ...state,
    poChecklist: state.poChecklist.map((item) =>
      item.criterionId === criterionId
        ? { ...item, validatedByPo: !item.validatedByPo }
        : item
    ),
  };
}
