import { AuthenticatedShell } from "@/components/authenticated-shell";
import { RoleGuard } from "@/components/role-guard";
import { MyParticipationRequests } from "@/features/academic-pi/my-participation-requests";

export const metadata = { title: "Minhas solicitações | Plataforma Digital", description: "Acompanhe suas solicitações de participação em projetos." };

export default function ParticipationRequestsPage() {
  return <RoleGuard allowed={["ALUNO"]}><AuthenticatedShell active="requests"><div className="projects-content"><section className="projects-hero" data-enter aria-labelledby="requests-title"><p className="eyebrow">Área do estudante</p><h1 id="requests-title">Minhas solicitações</h1><p>Acompanhe o status das solicitações enviadas e registre sua desistência enquanto elas estiverem em análise.</p></section><section className="projects-list-section" aria-labelledby="requests-list-title"><div className="section-heading"><div><p className="eyebrow">Participação</p><h2 id="requests-list-title">Histórico recente</h2></div></div><MyParticipationRequests /></section></div></AuthenticatedShell></RoleGuard>;
}
