"use client";

import Link from "next/link";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { RoleGuard, readSessionUser } from "@/components/role-guard";
import { ProjectManagement } from "@/features/academic-pi/project-management";
import { TeacherWorkSummary } from "./teacher-work-summary";
import type { UserRole } from "@/features/auth/types";

const TITLES: Record<Exclude<UserRole, "ALUNO">, { eyebrow: string; title: string; description: string }> = {
  DOCENTE: { eyebrow: "Painel docente", title: "Suas decisões acadêmicas", description: "Revise solicitações e acompanhe os projetos sob sua responsabilidade." },
  COORDENADOR: { eyebrow: "Painel de coordenação", title: "Governança em movimento", description: "Acompanhe projetos, participação e avaliações do período institucional." },
  ADMIN: { eyebrow: "Painel administrativo", title: "A plataforma sob controle", description: "Organize acessos e consulte o conteúdo publicado sem misturar administração com decisão acadêmica." },
};

function RoleDashboardContent({ role }: { role: Exclude<UserRole, "ALUNO"> }) {
  const copy = TITLES[role];
  const links = role === "DOCENTE"
    ? [{ href: "/projects/manage", label: "Revisar solicitações", description: "Decida quem pode participar dos seus projetos." }, { href: "/docente/activities", label: "Revisar atividades", description: "Acompanhe registros de horas e entregas." }]
    : role === "COORDENADOR"
      ? [{ href: "/coordenacao/operations", label: "Gerir projetos e editais", description: "Crie, edite, publique e arquive conteúdos institucionais." }, { href: "/coordenacao/evaluations", label: "Acompanhar avaliações", description: "Consulte avaliações, avaliadores e resultados." }]
      : [{ href: "/admin/access", label: "Gerenciar acessos", description: "Consulte a área reservada para usuários e permissões." }, { href: "/projects", label: "Ver catálogo", description: "Confira o conteúdo publicado na plataforma." }];

  return <AuthenticatedShell active="home"><div className="projects-content" id="conteudo-role-dashboard"><section className="projects-hero" data-enter aria-labelledby="role-dashboard-title"><p className="eyebrow">{copy.eyebrow}</p><h1 id="role-dashboard-title">{copy.title}</h1><p>{copy.description}</p></section>{role === "DOCENTE" && <TeacherWorkSummary />}<section className="projects-list-section" aria-labelledby="role-actions-title"><div className="section-heading"><div><p className="eyebrow">Acesso por perfil</p><h2 id="role-actions-title">Próximas ações</h2></div><span className="section-index">{String(links.length).padStart(2, "0")}</span></div><div className="home-module-grid">{links.map((link, index) => <Link href={link.href} className="home-module-card" key={link.href}><span className="module-number">{String(index + 1).padStart(2, "0")}</span><h3>{link.label}</h3><p>{link.description}</p><span className="module-link">Abrir <span aria-hidden="true">↗</span></span></Link>)}</div></section>{role !== "ADMIN" && <section className="projects-list-section" aria-labelledby="role-management-title"><div className="section-heading"><div><p className="eyebrow">Gestão operacional</p><h2 id="role-management-title">Solicitações recebidas</h2></div></div><ProjectManagement /></section>}</div></AuthenticatedShell>;
}

export function RoleDashboard({ role }: { role: Exclude<UserRole, "ALUNO"> }) {
  return <RoleGuard allowed={[role]}><RoleDashboardContent role={role} /></RoleGuard>;
}

export function AdminAccessPage() {
  const user = readSessionUser();
  return <RoleGuard allowed={["ADMIN"]}><AuthenticatedShell active="admin"><div className="projects-content"><section className="projects-hero" data-enter aria-labelledby="admin-access-title"><p className="eyebrow">Administração</p><h1 id="admin-access-title">Usuários e permissões</h1><p>Esta área está protegida para o perfil administrador. Os contratos de gestão de usuários e auditoria ainda precisam ser confirmados antes de habilitar alterações.</p></section><section className="projects-list-section" aria-labelledby="admin-access-status"><div className="management-panel"><p className="eyebrow">Acesso validado</p><h2 id="admin-access-status">Olá, {user?.name ?? "administrador"}</h2><p className="projects-empty-copy">A rota e o controle de acesso estão disponíveis. Nenhuma operação administrativa foi inventada sem contrato confirmado.</p></div></section></div></AuthenticatedShell></RoleGuard>;
}

