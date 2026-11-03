/**
 * Mock do usuário autenticado — AUTH-08-FE-01
 * Substituir pela integração real com AUTH-08-BE quando disponível.
 */

export type UserRole = "aluno" | "docente" | "coordenador" | "admin";

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
}

export const MOCK_USER: AuthUser = {
  name: "Paola de Oliveira",
  email: "paola.oliveira@unisenai.com.br",
  role: "aluno",
};

export const NAV_ITEMS: Record<UserRole, { label: string; href: string }[]> = {
  aluno: [
    { label: "Início", href: "/aluno" },
    { label: "Meus Projetos", href: "/aluno/projetos" },
    { label: "Extensão", href: "/aluno/extensao" },
  ],
  docente: [
    { label: "Início", href: "/docente" },
    { label: "Projetos Orientados", href: "/docente/projetos" },
    { label: "Solicitações", href: "/docente/solicitacoes" },
  ],
  coordenador: [
    { label: "Início", href: "/coordenador" },
    { label: "Projetos", href: "/coordenador/projetos" },
    { label: "Relatórios", href: "/coordenador/relatorios" },
  ],
  admin: [
    { label: "Painel", href: "/admin" },
    { label: "Usuários", href: "/admin/usuarios" },
    { label: "Configurações", href: "/admin/configuracoes" },
  ],
};
