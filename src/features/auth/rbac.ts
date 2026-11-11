/**
 * RBAC e Navegação por Perfil — AUTH-08-FE-02 e AUTH-08-FE-03
 * Regras oficiais: SPEC-AUTH-003-rbac
 */

export type UserRole = "aluno" | "docente" | "coordenador" | "admin";

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: string;
}

/**
 * URLs canônicas de redirecionamento pós-login por perfil.
 * Atende ao requisito [AUTH-08-FE-02].
 */
export const ROLE_REDIRECT_PATHS: Record<UserRole, string> = {
  aluno: "/aluno",
  docente: "/docente",
  coordenador: "/coordenador",
  admin: "/admin",
};

/**
 * Retorna a rota de redirecionamento correspondente ao perfil autenticado.
 */
export function getRoleRedirectUrl(role: UserRole | string | undefined | null): string {
  if (!role) {
    return "/";
  }
  const normalized = role.toLowerCase().trim() as UserRole;
  return ROLE_REDIRECT_PATHS[normalized] ?? "/";
}

/**
 * Menus e opções de navegação restritos por perfil.
 * Atende ao requisito [AUTH-08-FE-03].
 */
export const ROLE_NAV_ITEMS: Record<UserRole, NavItem[]> = {
  aluno: [
    { label: "Início", href: "/aluno" },
    { label: "Proposta de PI", href: "/aluno#proposta" },
    { label: "Minha Equipe", href: "/aluno/equipe" },
    { label: "Editais de Extensão", href: "/aluno/editais" },
    { label: "Upload de Entregáveis", href: "/aluno/upload" },
    { label: "Horas e Atividades", href: "/aluno/horas" },
    { label: "Certificados", href: "/aluno/certificados" },
  ],
  docente: [
    { label: "Início", href: "/docente" },
    { label: "Projetos Orientados", href: "/docente#projetos" },
    { label: "Solicitações de Alunos", href: "/docente#solicitacoes" },
    { label: "Validação de Horas", href: "/docente#horas" },
  ],
  coordenador: [
    { label: "Início", href: "/coordenador" },
    { label: "Turmas e Cursos", href: "/coordenador#turmas" },
    { label: "Projetos Integradores", href: "/coordenador#projetos" },
    { label: "Importação de Cadastros", href: "/coordenador#importacao" },
    { label: "Relatórios Institucionais", href: "/coordenador#relatorios" },
  ],
  admin: [
    { label: "Início", href: "/admin" },
    { label: "Gestão de Usuários", href: "/admin#usuarios" },
    { label: "Configurações do Sistema", href: "/admin#configuracoes" },
    { label: "Auditoria & Logs", href: "/admin#auditoria" },
    { label: "Status de Serviços", href: "/admin#servicos" },
  ],
};

/**
 * Retorna os itens de menu permitidos para o perfil especificado.
 */
export function getRoleNavItems(role: UserRole | string | undefined | null): NavItem[] {
  if (!role) {
    return [];
  }
  const normalized = role.toLowerCase().trim() as UserRole;
  return ROLE_NAV_ITEMS[normalized] ?? [];
}

/**
 * Valida se um determinado perfil possui permissão para acessar um caminho de rota.
 */
export function canAccessRoute(role: UserRole | string | undefined | null, pathname: string): boolean {
  if (!role || !pathname) {
    return false;
  }
  const normalizedRole = role.toLowerCase().trim() as UserRole;

  if (pathname === "/" || pathname === "/login" || pathname === "/recuperar-senha") {
    return true;
  }

  // Regras de prefixo por perfil
  if (pathname.startsWith("/aluno") && normalizedRole === "aluno") return true;
  if (pathname.startsWith("/docente") && normalizedRole === "docente") return true;
  if (pathname.startsWith("/coordenador") && normalizedRole === "coordenador") return true;
  if (pathname.startsWith("/admin") && normalizedRole === "admin") return true;

  return false;
}
