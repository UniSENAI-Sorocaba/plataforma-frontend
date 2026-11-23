import type { UserRole } from "./types";

export const ROLE_LABELS: Record<UserRole, string> = {
  ALUNO: "Estudante",
  DOCENTE: "Docente",
  COORDENADOR: "Coordenação",
  ADMIN: "Administração",
};

export type NavigationKey = "home" | "projects" | "requests" | "extension" | "management" | "activities" | "evaluations" | "people" | "admin";

export interface NavigationItem {
  key: NavigationKey;
  href: string;
  label: string;
  description: string;
}

const NAVIGATION_BY_ROLE: Record<UserRole, NavigationItem[]> = {
  ALUNO: [
    { key: "home", href: "/", label: "Visão geral", description: "Seu ponto de partida" },
    { key: "projects", href: "/projects", label: "Projetos", description: "Projetos publicados" },
    { key: "requests", href: "/projects/requests", label: "Minhas solicitações", description: "Acompanhe suas inscrições" },
    { key: "evaluations", href: "/aluno/evaluations", label: "Minhas notas", description: "Acompanhe suas avaliações" },
    { key: "extension", href: "/extension", label: "Extensão", description: "Editais e oportunidades" },
  ],
  DOCENTE: [
    { key: "home", href: "/docente", label: "Visão geral", description: "Pendências acadêmicas" },
    { key: "management", href: "/projects/manage", label: "Meus projetos", description: "Solicitações recebidas" },
    { key: "activities", href: "/docente/activities", label: "Atividades e horas", description: "Revisar registros" },
    { key: "evaluations", href: "/docente/evaluations", label: "Minhas avaliações", description: "Avaliar alunos atribuídos" },
  ],
  COORDENADOR: [
    { key: "home", href: "/coordenacao", label: "Visão geral", description: "Governança acadêmica" },
    { key: "management", href: "/coordenacao/operations", label: "Gestão institucional", description: "Projetos e editais" },
    { key: "people", href: "/coordenacao/students", label: "Alunos", description: "Cadastros institucionais" },
    { key: "people", href: "/coordenacao/teachers", label: "Docentes", description: "Diretório institucional" },
    { key: "people", href: "/coordenacao/classes", label: "Turmas", description: "Estrutura acadêmica" },
    { key: "people", href: "/coordenacao/audit", label: "Auditoria", description: "Histórico de operações" },
    { key: "evaluations", href: "/coordenacao/evaluations", label: "Avaliações", description: "Atribuir e acompanhar" },
    { key: "extension", href: "/extension", label: "Editais", description: "Oportunidades publicadas" },
  ],
  ADMIN: [
    { key: "home", href: "/admin", label: "Visão geral", description: "Saúde da plataforma" },
    { key: "admin", href: "/admin/access", label: "Acessos", description: "Usuários e permissões" },
    { key: "projects", href: "/projects", label: "Catálogo", description: "Conteúdo publicado" },
  ],
};

export function navigationForRole(role: UserRole): NavigationItem[] {
  return NAVIGATION_BY_ROLE[role];
}
