import type { DecisionSubmission, HoursSummary, ProjectRequest } from "./types";

/**
 * Baseline mock data representing requests pending faculty review.
 * Prepared for clean integration with BE-014 endpoints.
 */
export const INITIAL_FACULTY_REQUESTS: ProjectRequest[] = [
  {
    id: "PI-2026-014",
    student: "Mariana Costa",
    project: "Tecnologia assistiva para aprendizagem",
    submitted: "22 out, 2026",
    hours: 24,
    status: "Aguardando análise",
  },
  {
    id: "PI-2026-011",
    student: "Lucas Ferreira",
    project: "Horta inteligente para espaços urbanos",
    submitted: "20 out, 2026",
    hours: 18,
    status: "Aguardando análise",
  },
  {
    id: "PI-2026-008",
    student: "Ana Beatriz Lima",
    project: "Reuso de água em ambientes escolares",
    submitted: "18 out, 2026",
    hours: 32,
    status: "Aguardando análise",
  },
];

export function calculateHoursSummary(requests: ProjectRequest[]): HoursSummary {
  const pendingRequests = requests.filter((r) => r.status === "Aguardando análise");
  const approvedRequests = requests.filter((r) => r.status === "Aprovado");

  return {
    pendingRequestsCount: pendingRequests.length,
    pendingHours: pendingRequests.reduce((sum, r) => sum + r.hours, 0),
    approvedHours: approvedRequests.reduce((sum, r) => sum + r.hours, 0),
  };
}

/**
 * Submits a faculty review decision.
 * When backend BE-014 is ready, replace with `fetch('/api/v1/faculty/requests/' + submission.requestId + '/decision', { ... })`.
 */
export async function submitFacultyDecision(
  requests: ProjectRequest[],
  submission: DecisionSubmission
): Promise<ProjectRequest[]> {
  const { requestId, decision, reason } = submission;

  if (decision === "rejected" && (!reason || reason.trim().length === 0)) {
    throw new Error("Justificativa obrigatória para solicitação de ajuste ou reprovação.");
  }

  return requests.map((req) => {
    if (req.id !== requestId) {
      return req;
    }

    return {
      ...req,
      decision,
      status: decision === "approved" ? "Aprovado" : "Ajuste solicitado / Reprovado",
      reason: reason.trim(),
      decidedAt: new Date().toLocaleDateString("pt-BR"),
    };
  });
}
