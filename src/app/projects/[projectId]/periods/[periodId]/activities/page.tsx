import Link from "next/link";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { RoleGuard } from "@/components/role-guard";
import { ActivitiesDashboard } from "@/features/extension/activities-dashboard";

export const metadata = { title: "Atividades e horas | Plataforma Digital", description: "Envie atividades e acompanhe as horas de extensão." };
export default async function ActivitiesPage({ params }: { params: Promise<{ projectId: string; periodId: string }> }) {
  const { projectId, periodId } = await params;
  return <RoleGuard allowed={["ALUNO", "DOCENTE", "COORDENADOR"]}><AuthenticatedShell active="activities"><div className="projects-content"><section className="projects-hero" aria-labelledby="activities-title"><p className="eyebrow">Extensão</p><h1 id="activities-title">Atividades e horas</h1><p>Envie informações ou revise os registros do período autorizado.</p></section><section className="projects-list-section"><ActivitiesDashboard projectId={projectId} periodId={periodId} /></section><Link className="text-link" href="/projects/manage">← Voltar aos meus projetos</Link></div></AuthenticatedShell></RoleGuard>;
}
