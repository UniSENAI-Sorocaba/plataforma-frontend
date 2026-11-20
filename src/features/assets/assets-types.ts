/**
 * Tipos e contratos do Protótipo de Gestão Patrimonial (FE-023 / PG-019).
 * Rastreabilidade: Épico EP05-PAT (US14 — Inventário de Notebooks e QR Code;
 * US15 — Agendamento de Salas fora do horário e Gestão de Ocorrências/Avarias).
 * Planejamento: Fase 2 (2027.1).
 */

export type NotebookStatus = "AVAILABLE" | "CHECKED_OUT" | "MAINTENANCE";

export type BookingStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export type IncidentSeverity = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

export type IncidentStatus = "OPEN" | "IN_REPAIR" | "RESOLVED";

export interface NotebookAsset {
  assetId: string;
  qrCode: string;
  model: string;
  serialNumber: string;
  patrimonyNumber: string;
  location: string;
  status: NotebookStatus;
  currentBorrowerName?: string;
  currentBorrowerId?: string;
  lastUpdatedIso: string;
}

export interface NotebookLoanRecord {
  loanId: string;
  assetId: string;
  qrCode: string;
  borrowerName: string;
  borrowerId: string;
  borrowerRole: "STUDENT" | "FACULTY";
  purpose: string;
  checkedOutAtIso: string;
  checkedInAtIso?: string;
  returnConditionNote?: string;
}

export interface LabRoom {
  roomId: string;
  code: string;
  name: string;
  capacity: number;
  allowedAfterHoursWindow: string;
}

export interface RoomBooking {
  bookingId: string;
  roomId: string;
  roomName: string;
  requesterName: string;
  requesterId: string;
  projectOrActivity: string;
  dateIso: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: BookingStatus;
  reviewerNote?: string;
  createdAtIso: string;
}

export interface DamageIncident {
  incidentId: string;
  targetType: "NOTEBOOK" | "ROOM";
  targetId: string;
  targetLabel: string;
  reporterName: string;
  severity: IncidentSeverity;
  description: string;
  photoEvidenceRef: string;
  status: IncidentStatus;
  createdAtIso: string;
  resolvedAtIso?: string;
  resolutionNote?: string;
}

export interface PoValidationItem {
  criterionId: string;
  userStoryRef: "US14" | "US15" | "PG-019";
  title: string;
  description: string;
  validatedByPo: boolean;
}

export interface AssetsPrototypeState {
  notebooks: NotebookAsset[];
  loans: NotebookLoanRecord[];
  rooms: LabRoom[];
  bookings: RoomBooking[];
  incidents: DamageIncident[];
  poChecklist: PoValidationItem[];
}

export interface CheckoutNotebookInput {
  qrCode: string;
  borrowerName: string;
  borrowerId: string;
  borrowerRole: "STUDENT" | "FACULTY";
  purpose: string;
  nowIso?: string;
}

export interface CheckinNotebookInput {
  qrCode: string;
  returnConditionNote?: string;
  requiresMaintenance?: boolean;
  nowIso?: string;
}

export interface CreateRoomBookingInput {
  roomId: string;
  requesterName: string;
  requesterId: string;
  projectOrActivity: string;
  dateIso: string;
  startTime: string;
  endTime: string;
  nowIso?: string;
}

export interface ReportDamageIncidentInput {
  targetType: "NOTEBOOK" | "ROOM";
  targetId: string;
  reporterName: string;
  severity: IncidentSeverity;
  description: string;
  photoEvidenceRef: string;
  nowIso?: string;
}
