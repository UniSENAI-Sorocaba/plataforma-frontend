export type ParticipationRequestStatus = "PENDING" | "APPROVED" | "DENIED" | "WITHDRAWN";

export const participationStatusLabel: Record<ParticipationRequestStatus, string> = {
  PENDING: "Em análise",
  APPROVED: "Aprovada",
  DENIED: "Recusada",
  WITHDRAWN: "Desistência registrada",
};
