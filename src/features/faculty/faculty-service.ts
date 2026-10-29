import type {
  DecisionSubmission,
  FacultyHomeData,
  HoursSummary,
  ProjectRequest,
} from "./types";

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

/**
 * Mock data for the Teacher Home screen and navigation (AUTH-08-FE-05).
 * Prepared for integration with AUTH-08-BE.
 */
export const MOCK_FACULTY_HOME_DATA: FacultyHomeData = {
  profile: {
    name: "Prof. André Souza",
    initial: "A",
    department: "Engenharia de Software e Projetos",
    role: "Docente Responsável",
  },
  shortcuts: [
    {
      icon: "📋",
      title: "Solicitações de Projeto",
      description: "Revise pedidos de alunos e decida sobre inscrições.",
      href: "#solicitacoes",
      badge: "3 pendentes",
    },
    {
      icon: "🎯",
      title: "Projetos em Orientação",
      description: "Acompanhe entregas e equipes sob sua responsabilidade.",
      href: "#projetos",
      badge: "2 ativos",
    },
    {
      icon: "⏱",
      title: "Validação de Horas",
      description: "Valide relatórios de atividades e horas de extensão.",
      href: "#horas",
      badge: "74h a validar",
    },
  ],
  supervisedProjects: [
    {
      id: "PI-2026-001",
      title: "Sistema de Monitoramento IoT para Manufatura",
      team: ["Mariana Costa", "Lucas Ferreira", "Ana Beatriz"],
      semester: "2026.2",
      status: "Em andamento",
    },
    {
      id: "PI-2026-003",
      title: "Plataforma de Eficiência Energética Industrial",
      team: ["Gabriel Santos", "Beatriz Rocha"],
      semester: "2026.2",
      status: "Aguardando validação",
    },
  ],
  requests: INITIAL_FACULTY_REQUESTS,
};

export async function getFacultyHomeData(): Promise<FacultyHomeData> {
  // Simulates future backend fetch:
  // if (process.env.API_URL) { return fetch(API_URL).then(res => res.json()); }
  return Promise.resolve(MOCK_FACULTY_HOME_DATA);
}

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
