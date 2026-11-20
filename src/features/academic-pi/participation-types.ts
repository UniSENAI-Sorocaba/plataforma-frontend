export type ParticipationRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";

export const participationStatusLabel: Record<ParticipationRequestStatus, string> = {
  PENDING: "Em análise",
  APPROVED: "Aprovada",
  REJECTED: "Recusada",
  WITHDRAWN: "Desistência registrada",
};
