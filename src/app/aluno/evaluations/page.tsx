import { RoleGuard } from "@/components/role-guard";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { StudentEvaluationsDashboard } from "@/features/academic-pi/student-evaluations-dashboard";

export const metadata = { title: "Minhas notas | Plataforma Digital", description: "Consulte as notas das avaliações dos seus projetos." };

export default function StudentEvaluationsPage() {
  return <RoleGuard allowed={["ALUNO"]}><AuthenticatedShell active="evaluations"><div className="projects-content"><section className="projects-hero" aria-labelledby="student-evaluations-title"><p className="eyebrow">Avaliação acadêmica</p><h1 id="student-evaluations-title">Minhas notas</h1><p>Acompanhe as avaliações concluídas nos projetos dos quais você participa.</p></section><section className="projects-list-section" aria-labelledby="student-evaluations-list-title"><div className="section-heading"><div><p className="eyebrow">Seu histórico</p><h2 id="student-evaluations-list-title">Avaliações dos projetos</h2></div></div><StudentEvaluationsDashboard /></section></div></AuthenticatedShell></RoleGuard>;
}
