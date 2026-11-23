import { AuthenticatedShell } from "@/components/authenticated-shell";
import { RoleGuard } from "@/components/role-guard";
import { AssignedEvaluationsDashboard } from "@/features/academic-pi/assigned-evaluations-dashboard";

export const metadata = { title: "Minhas avaliações | Plataforma Digital", description: "Avalie os alunos atribuídos a você." };

export default function MyEvaluationsPage() {
  return <RoleGuard allowed={["DOCENTE"]}><AuthenticatedShell active="evaluations"><div className="projects-content"><section className="projects-hero" data-enter aria-labelledby="my-evaluations-title"><p className="eyebrow">Avaliação acadêmica</p><h1 id="my-evaluations-title">Minhas avaliações</h1><p>Abra uma avaliação pendente, preencha os critérios e registre a nota do aluno.</p></section><section className="projects-list-section" aria-labelledby="assigned-evaluations-title"><div className="section-heading"><div><p className="eyebrow">Fila de trabalho</p><h2 id="assigned-evaluations-title">Alunos atribuídos</h2></div></div><AssignedEvaluationsDashboard /></section></div></AuthenticatedShell></RoleGuard>;
}
