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

export interface TeacherProfile {
  name: string;
  initial: string;
  department: string;
  role: string;
}

export interface TeacherShortcut {
  icon: string;
  title: string;
  description: string;
  href: string;
  badge?: string;
}

export interface SupervisedProject {
  id: string;
  title: string;
  team: string[];
  semester: string;
  status: "Em andamento" | "Aguardando validação" | "Concluído";
}

export interface FacultyHomeData {
  profile: TeacherProfile;
  shortcuts: TeacherShortcut[];
  supervisedProjects: SupervisedProject[];
  requests: ProjectRequest[];
}
