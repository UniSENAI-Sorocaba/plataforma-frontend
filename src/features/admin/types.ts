/**
 * Tipagens para o Painel do Administrador — AUTH-08-FE-07
 * Baseado nas especificações oficiais: SPEC-AUTH-003-rbac e SPEC-AUTH-004-audit
 */

export interface AdminProfile {
  name: string;
  role: "admin";
  email: string;
  initials: string;
}

export interface AdminMetric {
  label: string;
  value: string | number;
  subtext: string;
  trend?: string;
  status?: "healthy" | "warning" | "info";
}

export interface AdminServiceHealth {
  name: string;
  category: string;
  status: "Operacional" | "Atenção" | "Instável";
  latency: string;
  uptime: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  result: "Sucesso" | "Negado" | "Alerta";
  ipAddress: string;
}

export interface AdminShortcut {
  title: string;
  description: string;
  href: string;
  icon: string;
  badge?: string;
}

export interface AdminDashboardData {
  profile: AdminProfile;
  systemVersion: string;
  environment: string;
  metrics: AdminMetric[];
  shortcuts: AdminShortcut[];
  services: AdminServiceHealth[];
  auditLogs: AuditLogEntry[];
}
