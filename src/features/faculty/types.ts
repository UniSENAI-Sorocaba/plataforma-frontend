export type DecisionStatus = "Aguardando análise" | "Aprovado" | "Ajuste solicitado / Reprovado";

export interface ProjectRequest {
  id: string;
  student: string;
  project: string;
  submitted: string;
  hours: number;
  status: DecisionStatus;
  decision?: "approved" | "rejected";
  reason?: string;
  decidedAt?: string;
}

export interface DecisionSubmission {
  requestId: string;
  decision: "approved" | "rejected";
  reason: string;
}

export interface HoursSummary {
  pendingRequestsCount: number;
  pendingHours: number;
  approvedHours: number;
}
