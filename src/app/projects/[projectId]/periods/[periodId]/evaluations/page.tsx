import Link from "next/link";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { RoleGuard } from "@/components/role-guard";
import { EvaluationAssignmentDashboard } from "@/features/academic-pi/evaluation-assignment-dashboard";

export const metadata = { title: "Avaliações | Plataforma Digital", description: "Atribua avaliadores vinculados a um projeto e período." };

export default async function EvaluationsPage({ params }: { params: Promise<{ projectId: string; periodId: string }> }) {
  const { projectId, periodId } = await params;
  return <RoleGuard allowed={["COORDENADOR"]}><AuthenticatedShell active="evaluations"><div className="projects-content"><section className="projects-hero" aria-labelledby="evaluations-title"><p className="eyebrow">Avaliação acadêmica</p><h1 id="evaluations-title">Atribuir avaliação</h1><p>Associe um aluno aos docentes responsáveis e acompanhe o vínculo neste período.</p></section><section className="projects-list-section"><EvaluationAssignmentDashboard projectId={projectId} periodId={periodId} /></section><Link className="text-link" href="/projects/manage">← Voltar aos meus projetos</Link></div></AuthenticatedShell></RoleGuard>;
}
