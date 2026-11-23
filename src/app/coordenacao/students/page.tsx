import { RoleGuard } from "@/components/role-guard";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { StudentManagement } from "@/features/coordination/student-management";

export const metadata = { title: "Alunos | Plataforma Digital", description: "Cadastro e gestão institucional de alunos." };

export default function CoordinationStudentsPage() {
  return <RoleGuard allowed={["COORDENADOR"]}><AuthenticatedShell active="people"><div className="projects-content"><section className="projects-hero" aria-labelledby="students-title"><p className="eyebrow">Coordenação institucional</p><h1 id="students-title">Alunos</h1><p>Cadastre estudantes individualmente ou importe uma turma por CSV. O acesso é ativado pelo próprio aluno no primeiro acesso.</p></section><section className="projects-list-section"><StudentManagement /></section></div></AuthenticatedShell></RoleGuard>;
}
