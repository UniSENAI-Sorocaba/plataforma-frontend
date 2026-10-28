import Link from "next/link";
import type { Metadata } from "next";
import { COURSES, SEMESTERS, parseCatalogQuery, catalogHref } from "@/features/portal/catalog";
import { loadCatalog } from "@/features/portal/catalog-source";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Catálogo de projetos | UniSENAI", description: "Conheça projetos publicados de ensino, tecnologia e impacto social." };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parseCatalogQuery(await searchParams);
  let result;
  try { result = await loadCatalog(query); }
  catch { return <main id="conteudo"><p className="eyebrow">Portal público</p><h1>Catálogo de projetos</h1><div role="alert" className="notice">Não foi possível carregar os projetos. Tente novamente em instantes.</div><Link className="button" href={catalogHref(query, query.page)}>Tentar novamente</Link></main>; }
  const pages = Math.ceil(result.total / result.pageSize);
  return <main id="conteudo"><div className="page-intro"><p className="eyebrow">Conhecimento em movimento</p><h1>Projetos que fazem<br className="wide-only" /> a diferença.</h1><p className="lead">Explore iniciativas que conectam a universidade, a tecnologia e a nossa comunidade.</p><span className="badge">{result.source === "mock" ? "Demonstração · dados fictícios" : "Conectado à API"}</span></div>
    <form className="filters" action="/catalogo" method="get" aria-label="Filtrar projetos"><div><label htmlFor="curso">Curso</label><select id="curso" name="curso" defaultValue={query.course}><option value="">Todos os cursos</option>{COURSES.map(course => <option key={course}>{course}</option>)}</select></div><div><label htmlFor="semestre">Semestre</label><select id="semestre" name="semestre" defaultValue={query.semester}><option value="">Todos os semestres</option>{SEMESTERS.map(semester => <option key={semester}>{semester}</option>)}</select></div><div><label htmlFor="ods">Objetivo de desenvolvimento sustentável</label><select id="ods" name="ods" defaultValue={query.ods}><option value="">Todos os ODS</option>{Array.from({ length: 17 }, (_, i) => <option key={i + 1} value={i + 1}>ODS {i + 1}</option>)}</select></div><button type="submit">Filtrar</button><Link href="/catalogo">Limpar filtros</Link></form>
    <div className="results-heading"><h2>Explore os projetos</h2><p>{result.total} {result.total === 1 ? "projeto encontrado" : "projetos encontrados"}</p></div>
    {result.items.length ? <div className="project-grid">{result.items.map(project => <article key={project.id} className="project-card"><div className="project-art" aria-hidden="true"><span>PI + EXT</span><span className="orb" /></div><div className="card-body"><p className="card-meta">{project.course} · {project.semester}</p><h3>{project.title}</h3><p>{project.summary}</p><div className="tags">{project.ods.map(ods => <span key={ods}>ODS {ods}</span>)}</div></div></article>)}</div> : <div className="empty-state"><h3>Nenhum projeto nesta página</h3><p>Altere os filtros ou retorne à primeira página.</p><Link href={catalogHref(query, 1)}>Voltar ao início dos resultados</Link></div>}
    {pages > 1 ? <nav className="pagination" aria-label="Paginação do catálogo">{query.page > 1 ? <Link rel="prev" href={catalogHref(query, query.page - 1)}>← Anterior</Link> : <span>← Anterior</span>}<span aria-current="page">Página {query.page} · {pages} páginas disponíveis</span>{query.page < pages ? <Link rel="next" href={catalogHref(query, query.page + 1)}>Próxima →</Link> : <span>Próxima →</span>}</nav> : null}
  </main>;
}
