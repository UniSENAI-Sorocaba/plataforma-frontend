import { AuthenticatedShell } from "@/components/authenticated-shell";
import { RoleGuard } from "@/components/role-guard";
import { CoordinationOperations } from "@/features/coordination/coordination-operations";

export const metadata = { title: "Gestão institucional | Plataforma Digital", description: "Crie, edite, publique e arquive projetos e editais." };

export default function CoordinationOperationsPage() {
  return <RoleGuard allowed={["COORDENADOR"]}><AuthenticatedShell active="management"><div className="projects-content"><section className="projects-hero" data-enter aria-labelledby="coord-operations-title"><p className="eyebrow">Coordenação institucional</p><h1 id="coord-operations-title">Projetos e editais</h1><p>Crie, edite, publique e arquive os conteúdos acadêmicos sob governança da coordenação.</p></section><CoordinationOperations /></div></AuthenticatedShell></RoleGuard>;
}
