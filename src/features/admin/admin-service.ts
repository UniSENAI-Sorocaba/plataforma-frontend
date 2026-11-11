import type { AdminDashboardData } from "./types";

/**
 * Mock oficial dos dados de Administração — AUTH-08-FE-07
 * Desacoplado para facilitar integração com AUTH-08-BE e monitoramento de infraestrutura.
 */
export const MOCK_ADMIN_DATA: AdminDashboardData = {
  profile: {
    name: "Administrador do Sistema",
    role: "admin",
    email: "admin.sistema@unisenai.com.br",
    initials: "AD",
  },
  systemVersion: "v1.0.0-mvp",
  environment: "Ambiente Integrado · UniSENAI Sorocaba",
  metrics: [
    {
      label: "Usuários Cadastrados",
      value: "1.420",
      subtext: "Alunos, Docentes e Coordenação",
      status: "info",
    },
    {
      label: "Sessões Ativas (24h)",
      value: "385",
      subtext: "Tokens JWT RS256 ativos",
      status: "healthy",
    },
    {
      label: "Status da Plataforma",
      value: "100%",
      subtext: "Todos os serviços operacionais",
      status: "healthy",
    },
    {
      label: "Eventos de Segurança",
      value: "0",
      subtext: "Nenhuma violação detectada",
      status: "healthy",
    },
  ],
  shortcuts: [
    {
      title: "Gestão de Usuários & RBAC",
      description: "Atribuição de papéis (Aluno, Docente, Coordenador, Admin) e ativação de contas",
      href: "/admin#usuarios",
      icon: "👥",
      badge: "Segurança",
    },
    {
      title: "Configurações Gerais",
      description: "Prazos de semestres letivos, limites de upload e políticas de sessão",
      href: "/admin#configuracoes",
      icon: "⚙",
    },
    {
      title: "Logs de Auditoria",
      description: "Inspeção de acessos, renovação de tokens e operações críticas",
      href: "/admin#auditoria",
      icon: "🛡",
      badge: "OWASP",
    },
    {
      title: "Monitoramento de Serviços",
      description: "Latência da API, conexão com banco PostgreSQL e storage S3",
      href: "/admin#servicos",
      icon: "📈",
    },
  ],
  services: [
    {
      name: "API Backend Spring Boot",
      category: "Backend",
      status: "Operacional",
      latency: "28ms",
      uptime: "99.98%",
    },
    {
      name: "Banco de Dados PostgreSQL",
      category: "Database",
      status: "Operacional",
      latency: "8ms",
      uptime: "100%",
    },
    {
      name: "Serviço de Autenticação RS256",
      category: "Security",
      status: "Operacional",
      latency: "15ms",
      uptime: "99.99%",
    },
    {
      name: "Armazenamento de Arquivos",
      category: "Infra",
      status: "Operacional",
      latency: "42ms",
      uptime: "99.95%",
    },
  ],
  auditLogs: [
    {
      id: "log-101",
      timestamp: "09/11/2026 19:45:12",
      actor: "prof.carlos@unisenai.com.br",
      role: "Coordenador",
      action: "Importação de lote CSV de alunos (Turma ADS-2026-4N)",
      result: "Sucesso",
      ipAddress: "192.168.10.45",
    },
    {
      id: "log-102",
      timestamp: "09/11/2026 18:30:20",
      actor: "lucas.silva@aluno.unisenai.com.br",
      role: "Aluno",
      action: "Autenticação via login institucional",
      result: "Sucesso",
      ipAddress: "177.18.204.12",
    },
    {
      id: "log-103",
      timestamp: "09/11/2026 17:15:02",
      actor: "usuario.desconhecido@teste.com",
      role: "Visitante",
      action: "Tentativa de acesso a endpoint protegido /api/v1/admin",
      result: "Negado",
      ipAddress: "45.162.228.9",
    },
  ],
};

/**
 * Retorna os dados para renderização SSR do painel de administração.
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  return MOCK_ADMIN_DATA;
}
