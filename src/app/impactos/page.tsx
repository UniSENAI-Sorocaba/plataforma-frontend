import { listPublicImpacts } from "@/features/academic-pi/impacts-api";

export const metadata = {
  title: "Impactos públicos | Plataforma Digital",
  description: "Resultados e evidências aprovados dos projetos integradores.",
};

export default async function ImpactsPage() {
  const impacts = await listPublicImpacts();
  return <main className="projects-content" id="conteudo-impactos">
    <section className="projects-hero" data-enter aria-labelledby="impactos-title">
      <p className="eyebrow">Resultados</p><h1 id="impactos-title">Impactos dos projetos</h1>
      <p>Conheça resultados publicados após revisão e aprovação institucional.</p>
    </section>
    <section className="projects-list-section" aria-labelledby="impactos-list-title">
      <div className="section-heading"><div><p className="eyebrow">Evidências aprovadas</p><h2 id="impactos-list-title">Impactos publicados</h2></div><span className="section-index">{impacts.length.toString().padStart(2, "0")}</span></div>
      {impacts.length === 0 ? <p role="status">Nenhum impacto aprovado publicado ainda.</p> : <div className="project-grid">{impacts.map((impact) => <article className="project-card" key={impact.id}><p className="eyebrow">Versão {impact.version}</p><h3>{impact.title}</h3><p>{impact.summary}</p>{impact.evidenceUrl ? <a href={impact.evidenceUrl} target="_blank" rel="noreferrer">Ver evidência</a> : null}</article>)}</div>}
    </section>
  </main>;
}
