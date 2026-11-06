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

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const MOCK_USER: AuthUser = {
  name: "Lucas Silva",
  email: "lucas.silva@unisenai.com.br",
  role: "aluno",
};

export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  aluno: [
    { label: "Proposta de PI", href: "/aluno", icon: "📋" },
    { label: "Equipe", href: "/aluno/equipe", icon: "👥" },
    { label: "Editais", href: "/aluno/editais", icon: "📄" },
    { label: "Upload", href: "/aluno/upload", icon: "⬆" },
    { label: "Horas", href: "/aluno/horas", icon: "🕐" },
    { label: "Certificados", href: "/aluno/certificados", icon: "🎓" },
  ],
  docente: [
    { label: "Início", href: "/docente", icon: "🏠" },
    { label: "Projetos Orientados", href: "/docente/projetos", icon: "📋" },
    { label: "Solicitações", href: "/docente/solicitacoes", icon: "📥" },
    { label: "Validação de Horas", href: "/docente/horas", icon: "✅" },
  ],
  coordenador: [
    { label: "Início", href: "/coordenador", icon: "🏠" },
    { label: "Projetos", href: "/coordenador/projetos", icon: "📋" },
    { label: "Relatórios", href: "/coordenador/relatorios", icon: "📊" },
  ],
  admin: [
    { label: "Painel", href: "/admin", icon: "🏠" },
    { label: "Usuários", href: "/admin/usuarios", icon: "👥" },
    { label: "Configurações", href: "/admin/configuracoes", icon: "⚙" },
  ],
};
