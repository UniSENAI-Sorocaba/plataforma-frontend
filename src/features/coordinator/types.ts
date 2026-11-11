/**
 * Tipagens para o Painel do Coordenador — AUTH-08-FE-06
 * Baseado nas especificações oficiais: SPEC-AUTH-003-rbac
 */

export interface CoordinatorProfile {
  name: string;
  role: "coordenador";
  course: string;
  campus: string;
  initials: string;
}

export interface ClassGroup {
  id: string;
  code: string;
  name: string;
  period: string; // ex: "Noturno", "Matutino"
  semester: string; // ex: "4º Semestre"
  totalStudents: number;
  activeProjects: number;
  status: "Ativa" | "Concluída" | "Em Planejamento";
}

export interface CoordinatorIndicator {
  label: string;
  value: number | string;
  description: string;
  badge?: string;
  badgeType?: "info" | "success" | "warning";
}

export interface CoordinatorShortcut {
  title: string;
  description: string;
  href: string;
  icon: string;
  tag?: string;
}

export interface CoordinatorDashboardData {
  profile: CoordinatorProfile;
  term: string; // ex: "2026/2"
  indicators: CoordinatorIndicator[];
  shortcuts: CoordinatorShortcut[];
  classes: ClassGroup[];
}
