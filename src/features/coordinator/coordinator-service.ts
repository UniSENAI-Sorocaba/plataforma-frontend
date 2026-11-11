import type { CoordinatorDashboardData } from "./types";

/**
 * Mock oficial dos dados da Coordenação — AUTH-08-FE-06
 * Desacoplado para facilitar integração com AUTH-08-BE / RBAC server-side.
 */
export const MOCK_COORDINATOR_DATA: CoordinatorDashboardData = {
  profile: {
    name: "Prof. Dr. Carlos Eduardo Mendes",
    role: "coordenador",
    course: "Análise e Desenvolvimento de Sistemas",
    campus: "Campus Sorocaba",
    initials: "CM",
  },
  term: "2026/2",
  indicators: [
    {
      label: "Turmas Ativas",
      value: 8,
      description: "Sob sua coordenação direta",
      badge: "Normal",
      badgeType: "success",
    },
    {
      label: "Projetos Integradores",
      value: 36,
      description: "Cadastrados no semestre letivo",
      badge: "Ciclo Ativo",
      badgeType: "info",
    },
    {
      label: "Alunos Matriculados",
      value: 294,
      description: "Com acesso regular à plataforma",
    },
    {
      label: "Docentes Orientadores",
      value: 14,
      description: "Vinculados aos projetos",
      badge: "Alocados",
      badgeType: "success",
    },
  ],
  shortcuts: [
    {
      title: "Importar Cadastros",
      description: "Importação em lote de alunos e turmas via planilha CSV",
      href: "/coordenador#importacao",
      icon: "📥",
      tag: "CSV",
    },
    {
      title: "Gerenciar Turmas & Alunos",
      description: "Ativação, inativação e acompanhamento de matrículas",
      href: "/coordenador#turmas",
      icon: "👥",
    },
    {
      title: "Projetos & Bancas",
      description: "Supervisão de propostas, orientações e avaliações de PI",
      href: "/coordenador#projetos",
      icon: "📋",
      tag: "PI",
    },
    {
      title: "Relatórios Acadêmicos",
      description: "Indicadores de desempenho, horas validadas e impacto",
      href: "/coordenador#relatorios",
      icon: "📊",
    },
  ],
  classes: [
    {
      id: "cls-01",
      code: "ADS-2026-4N",
      name: "Tecnologia em ADS - 4º Semestre Noturno",
      period: "Noturno",
      semester: "4º Semestre",
      totalStudents: 38,
      activeProjects: 8,
      status: "Ativa",
    },
    {
      id: "cls-02",
      code: "ADS-2026-2N",
      name: "Tecnologia em ADS - 2º Semestre Noturno",
      period: "Noturno",
      semester: "2º Semestre",
      totalStudents: 42,
      activeProjects: 7,
      status: "Ativa",
    },
    {
      id: "cls-03",
      code: "ADS-2026-1M",
      name: "Tecnologia em ADS - 1º Semestre Matutino",
      period: "Matutino",
      semester: "1º Semestre",
      totalStudents: 35,
      activeProjects: 6,
      status: "Ativa",
    },
    {
      id: "cls-04",
      code: "BCT-2026-2N",
      name: "Ciência e Tecnologia - 2º Semestre",
      period: "Noturno",
      semester: "2º Semestre",
      totalStudents: 30,
      activeProjects: 5,
      status: "Ativa",
    },
    {
      id: "cls-05",
      code: "ADS-2026-5N",
      name: "Tecnologia em ADS - 5º Semestre Formandos",
      period: "Noturno",
      semester: "5º Semestre",
      totalStudents: 28,
      activeProjects: 5,
      status: "Ativa",
    },
  ],
};

/**
 * Retorna os dados para renderização SSR do painel do coordenador.
 */
export async function getCoordinatorDashboardData(): Promise<CoordinatorDashboardData> {
  // Retorna mock estruturado; em produção se conectará à API AUTH-08-BE
  return MOCK_COORDINATOR_DATA;
}
