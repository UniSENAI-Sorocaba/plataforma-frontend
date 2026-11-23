import { AuthenticatedShell } from "@/components/authenticated-shell";
import { RoleGuard } from "@/components/role-guard";
import { ProjectManagement } from "@/features/academic-pi/project-management";

export const dynamic = "force-dynamic";

export default function DocenteActivitiesPage() {
  return <RoleGuard allowed={["DOCENTE"]}><AuthenticatedShell active="activities"><div className="projects-content"><section className="projects-hero" data-enter aria-labelledby="docente-activities-title"><p className="eyebrow">Painel docente</p><h1 id="docente-activities-title">Revisar atividades e horas</h1><p>Escolha um projeto sob sua responsabilidade e abra o período que deseja revisar.</p></section><section className="projects-list-section"><ProjectManagement /></section></div></AuthenticatedShell></RoleGuard>;
}
