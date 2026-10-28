import { filterProjects, parseCatalogResult, PAGE_SIZE, type CatalogQuery } from "./catalog";
import { DEMO_PROJECTS } from "./fixtures";

/** Experimental adapter. A backend failure never silently falls back to mock data. */
export async function loadCatalog(query: CatalogQuery) {
  const mode = process.env.CATALOG_SOURCE ?? "mock";
  if (mode === "mock") return { ...filterProjects(DEMO_PROJECTS, query), source: "mock" as const };
  if (mode !== "api" || !process.env.CATALOG_API_URL) throw new Error("Fonte do catálogo não configurada.");
  const url = new URL(process.env.CATALOG_API_URL);
  if (url.username || url.password || (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) throw new Error("URL da API inválida.");
  if (query.course) url.searchParams.set("course", query.course);
  if (query.semester) url.searchParams.set("semester", query.semester);
  if (query.ods) url.searchParams.set("ods", query.ods);
  url.searchParams.set("page", String(query.page));
  url.searchParams.set("pageSize", String(PAGE_SIZE));
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000), redirect: "error", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Catálogo temporariamente indisponível.");
  return { ...parseCatalogResult(await response.json(), query), source: "api" as const };
}
