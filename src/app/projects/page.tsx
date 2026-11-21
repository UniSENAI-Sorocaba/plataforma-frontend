import Link from "next/link";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { classificationLabel, listPublicProjects } from "@/features/academic-pi/projects-api";
import { ParticipationAction } from "@/features/academic-pi/participation-action";

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
          {projects.length === 0 ? (
            <div className="projects-empty" role="status">
              <h3>Nenhum projeto publicado</h3>
              <p>O catálogo será atualizado quando houver um projeto ativo disponível para consulta.</p>
              <Link href="/login" className="btn btn-primary">Entrar na plataforma</Link>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => (
                <article className="project-card" key={project.id}>
                  <div className="project-card-top"><span className="project-classification">{classificationLabel(project.classification)}</span><span className="project-arrow" aria-hidden="true">↗</span></div>
                  <h3>{project.title}</h3>
                  <p>{project.summary ?? project.description}</p>
                  <span className="project-continuity">{project.continuity === "FIXED_END" && project.endDate ? `Até ${new Date(`${project.endDate}T00:00:00`).toLocaleDateString("pt-BR")}` : "Continuidade aberta"}</span>
                  <ParticipationAction projectId={project.id} />
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AuthenticatedShell>
  );
}
