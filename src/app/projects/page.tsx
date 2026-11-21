import { AuthenticatedShell } from "@/components/authenticated-shell";
import { listPublicProjects } from "@/features/academic-pi/projects-api";
import { ProjectCatalog } from "@/features/academic-pi/project-catalog";

export const metadata = {
  title: "Projetos publicados | Plataforma Digital",
  description: "Consulte os projetos integradores e de extensão publicados pela UniSENAI Sorocaba.",
};
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listPublicProjects();

  return (
    <AuthenticatedShell active="projects">
      <div className="projects-content" id="conteudo-projetos">
        <section className="projects-hero" data-enter aria-labelledby="projects-title">
          <p className="eyebrow">Catálogo público</p>
          <h1 id="projects-title">Projetos publicados</h1>
          <p>Consulte iniciativas ativas de projetos integradores e extensão. Cada projeto informa sua área e período de continuidade.</p>
        </section>

        <section className="projects-list-section" aria-labelledby="projects-list-title" data-dealt-moment>
          <div className="section-heading">
            <div><p className="eyebrow">Disponíveis para consulta</p><h2 id="projects-list-title">Projetos ativos</h2></div>
            <span className="section-index">{projects.length.toString().padStart(2, "0")}</span>
          </div>
          <ProjectCatalog projects={projects} />
        </section>
      </div>
    </AuthenticatedShell>
  );
}
