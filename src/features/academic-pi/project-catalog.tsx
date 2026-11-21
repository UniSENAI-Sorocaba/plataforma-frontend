"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { classificationLabel, type Project } from "./projects-api";
import { ParticipationAction } from "./participation-action";

const PAGE_SIZE = 6;

export function ProjectCatalog({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [classification, setClassification] = useState<"ALL" | Project["classification"]>("ALL");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => projects.filter((project) => {
    const matchesQuery = !query.trim() || `${project.title} ${project.summary ?? ""} ${project.description ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
    return matchesQuery && (classification === "ALL" || project.classification === classification);
  }), [projects, query, classification]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((Math.min(page, totalPages) - 1) * PAGE_SIZE, Math.min(page, totalPages) * PAGE_SIZE);

  function resetPage() { setPage(1); }
  return <>
    <div className="catalog-filters" aria-label="Filtros do catálogo"><label className="form-label" htmlFor="project-search">Buscar projeto<input id="project-search" className="form-input" value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder="Título ou resumo" /></label><label className="form-label" htmlFor="project-classification">Categoria<select id="project-classification" className="form-input" value={classification} onChange={(event) => { setClassification(event.target.value as typeof classification); resetPage(); }}><option value="ALL">Todas</option><option value="PI">Projeto integrador</option><option value="EXTENSION">Extensão</option><option value="BOTH">PI e extensão</option></select></label></div>
    {visible.length === 0 ? <div className="projects-empty" role="status"><h3>Nenhum projeto encontrado</h3><p>Ajuste os filtros ou aguarde a publicação de uma iniciativa.</p><Link href="/login" className="btn btn-primary">Entrar na plataforma</Link></div> : <div className="projects-grid">{visible.map((project) => <article className="project-card" key={project.id}><div className="project-card-top"><span className="project-classification">{classificationLabel(project.classification)}</span><span className="project-arrow" aria-hidden="true">↗</span></div><h3>{project.title}</h3><p>{project.summary ?? project.description}</p><span className="project-continuity">{project.continuity === "FIXED_END" && project.endDate ? `Até ${new Date(`${project.endDate}T00:00:00`).toLocaleDateString("pt-BR")}` : "Continuidade aberta"}</span><ParticipationAction projectId={project.id} /></article>)}</div>}
    {filtered.length > PAGE_SIZE && <nav className="catalog-pagination" aria-label="Paginação do catálogo"><button className="btn btn-secondary" type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</button><span aria-live="polite">Página {Math.min(page, totalPages)} de {totalPages}</span><button className="btn btn-secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Próxima</button></nav>}
  </>;
}
