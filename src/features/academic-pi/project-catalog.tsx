"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { sessionUserSnapshot, subscribeToSession } from "@/components/role-guard";
import { classificationLabel, type Project } from "./projects-api";
import { ParticipationAction } from "./participation-action";
import type { UserRole } from "@/features/auth/types";

const PAGE_SIZE = 6;

export function normalizeCatalogText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();
}

export function projectMatchesQuery(project: Project, query: string): boolean {
  const normalizedQuery = normalizeCatalogText(query);
  if (!normalizedQuery) return true;
  const searchableText = normalizeCatalogText([
    project.title,
    project.summary ?? "",
    project.description ?? "",
    classificationLabel(project.classification),
    project.continuity === "FIXED_END" ? "prazo definido" : "continuidade aberta",
  ].join(" "));
  return searchableText.includes(normalizedQuery);
}

export function ProjectCatalog({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [classification, setClassification] = useState<"ALL" | Project["classification"]>("ALL");
  const [page, setPage] = useState(1);
  const serializedUser = useSyncExternalStore(subscribeToSession, sessionUserSnapshot, () => null);
  const sessionRole = useMemo<UserRole | null>(() => {
    if (!serializedUser) return null;
    try { return (JSON.parse(serializedUser) as Partial<{ role: UserRole }>).role ?? null; } catch { return null; }
  }, [serializedUser]);
  const canRequestParticipation = sessionRole === "ALUNO";
  const filtered = useMemo(() => projects.filter((project) => {
    const matchesQuery = projectMatchesQuery(project, query);
    return matchesQuery && (classification === "ALL" || project.classification === classification);
  }), [projects, query, classification]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function resetPage() { setPage(1); }
  return <>
    <div className="catalog-filters" aria-label="Filtros do catálogo"><label className="form-label" htmlFor="project-search">Buscar projeto<input id="project-search" className="form-input" value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder="Título ou resumo" /></label><label className="form-label" htmlFor="project-classification">Categoria<select id="project-classification" className="form-input" value={classification} onChange={(event) => { setClassification(event.target.value as typeof classification); resetPage(); }}><option value="ALL">Todas</option><option value="PI">Projeto integrador</option><option value="EXTENSION">Extensão</option><option value="BOTH">PI e extensão</option></select></label></div>
    {visible.length === 0 ? <div className="projects-empty" role="status"><h3>Nenhum projeto encontrado</h3><p>Ajuste os filtros ou aguarde a publicação de uma iniciativa.</p>{sessionRole === null && <Link href="/login" className="btn btn-primary">Entrar na plataforma</Link>}</div> : <div className="projects-grid">{visible.map((project) => <article className="project-card" key={project.id}><div className="project-card-top"><span className="project-classification">{classificationLabel(project.classification)}</span><span className="project-arrow" aria-hidden="true">↗</span></div><h3>{project.title}</h3><p>{project.summary ?? project.description}</p><span className="project-continuity">{project.continuity === "FIXED_END" && project.endDate ? `Até ${new Date(`${project.endDate}T00:00:00`).toLocaleDateString("pt-BR")}` : "Continuidade aberta"}</span>{canRequestParticipation && <ParticipationAction projectId={project.id} />}</article>)}</div>}
    {filtered.length > PAGE_SIZE && <nav className="catalog-pagination" aria-label="Paginação do catálogo"><button className="btn btn-secondary" type="button" disabled={currentPage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</button><span aria-live="polite">Página {currentPage} de {totalPages} · {filtered.length} projetos</span><button className="btn btn-secondary" type="button" disabled={currentPage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Próxima</button></nav>}
  </>;
}
