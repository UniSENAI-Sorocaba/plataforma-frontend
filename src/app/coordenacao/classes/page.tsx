import { RoleGuard } from "@/components/role-guard";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { ClassManagement } from "@/features/coordination/class-management";
export const metadata = { title: "Turmas | Plataforma Digital", description: "Gestão institucional de turmas acadêmicas." };
export default function CoordinationClassesPage() { return <RoleGuard allowed={["COORDENADOR"]}><AuthenticatedShell active="people"><div className="projects-content"><section className="projects-hero"><p className="eyebrow">Coordenação institucional</p><h1>Turmas acadêmicas</h1><p>Crie e mantenha as turmas disponíveis para vínculos de alunos e docentes.</p></section><section className="projects-list-section"><ClassManagement /></section></div></AuthenticatedShell></RoleGuard>; }
