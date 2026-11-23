import { AuthenticatedShell } from "@/components/authenticated-shell";
import { RoleGuard } from "@/components/role-guard";
import { CoordinationEvaluationsDashboard } from "@/features/academic-pi/coordination-evaluations-dashboard";

export const metadata = { title: "Acompanhamento de avaliações | Plataforma Digital", description: "Acompanhe avaliações atribuídas, pendentes e concluídas." };

export default function CoordinationEvaluationsPage() {
  return <RoleGuard allowed={["COORDENADOR"]}><AuthenticatedShell active="evaluations"><div className="projects-content"><section className="projects-hero" data-enter aria-labelledby="coord-evaluations-title"><p className="eyebrow">Avaliação acadêmica</p><h1 id="coord-evaluations-title">Acompanhamento das avaliações</h1><p>Veja quais avaliações estão pendentes, quais foram concluídas e as notas finais registradas.</p></section><section className="projects-list-section" aria-labelledby="coord-evaluations-list-title"><div className="section-heading"><div><p className="eyebrow">Visão institucional</p><h2 id="coord-evaluations-list-title">Fila de avaliações</h2></div></div><CoordinationEvaluationsDashboard /></section></div></AuthenticatedShell></RoleGuard>;
}
