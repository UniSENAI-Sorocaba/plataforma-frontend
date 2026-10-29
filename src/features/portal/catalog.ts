export const COURSES = ["Análise e Desenvolvimento de Sistemas", "Engenharia de Produção", "Engenharia Mecânica"] as const;
export const SEMESTERS = ["2026.1", "2026.2"] as const;
export const PAGE_SIZE = 6;
export type CatalogQuery = { course: string; semester: string; ods: string; page: number };
export type PublicProject = { id: string; title: string; summary: string; course: string; semester: string; ods: number[] };
export type CatalogResult = { items: PublicProject[]; total: number; page: number; pageSize: number };
type Params = Record<string, string | string[] | undefined>;
const scalar = (value: string | string[] | undefined) => typeof value === "string" ? value : "";

export function parseCatalogQuery(params: Params): CatalogQuery {
  const course = scalar(params.curso);
  const semester = scalar(params.semestre);
  const ods = scalar(params.ods);
  const rawPage = scalar(params.pagina);
  const page = /^\d{1,5}$/.test(rawPage) ? Number(rawPage) : 1;
  return {
    course: COURSES.some(item => item === course) ? course : "",
    semester: SEMESTERS.some(item => item === semester) ? semester : "",
    ods: /^(?:[1-9]|1[0-7])$/.test(ods) ? ods : "",
    page: page >= 1 && page <= 10_000 ? page : 1,
  };
}

/** Allowlist: extra fields (students, individual grades/hours, files) never reach SSR. */
export function publicProject(value: unknown): PublicProject {
  if (!value || typeof value !== "object") throw new Error("Contrato de catálogo inválido.");
  const row = value as Record<string, unknown>;
  const text = (key: string, max: number) => {
    const value = row[key];
    if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error("Contrato de catálogo inválido.");
    return value;
  };
  const id = text("id", 80);
  if (!/^[\w-]+$/.test(id)) throw new Error("Identificador inválido.");
  if (!Array.isArray(row.ods) || row.ods.length > 17 || !row.ods.every(n => Number.isInteger(n) && n >= 1 && n <= 17)) throw new Error("ODS inválido.");
  return { id, title: text("title", 160), summary: text("summary", 800), course: text("course", 160), semester: text("semester", 20), ods: [...new Set(row.ods as number[])] };
}

export function filterProjects(rows: readonly (PublicProject & { published: boolean })[], query: CatalogQuery): CatalogResult {
  const visible = rows.filter(row => row.published && (!query.course || row.course === query.course) && (!query.semester || row.semester === query.semester) && (!query.ods || row.ods.includes(Number(query.ods))))
    .sort((a, b) => a.id.localeCompare(b.id));
  const start = (query.page - 1) * PAGE_SIZE;
  return { items: visible.slice(start, start + PAGE_SIZE).map(publicProject), total: visible.length, page: query.page, pageSize: PAGE_SIZE };
}

export function catalogHref(query: CatalogQuery, page: number) {
  const params = new URLSearchParams();
  if (query.course) params.set("curso", query.course);
  if (query.semester) params.set("semestre", query.semester);
  if (query.ods) params.set("ods", query.ods);
  if (page > 1) params.set("pagina", String(page));
  return `/catalogo${params.size ? `?${params}` : ""}`;
}

export function parseCatalogResult(value: unknown, query: CatalogQuery): CatalogResult {
  if (!value || typeof value !== "object") throw new Error("Contrato de catálogo inválido.");
  const result = value as Record<string, unknown>;
  if (!Array.isArray(result.items) || result.items.length > PAGE_SIZE || !Number.isSafeInteger(result.total) || Number(result.total) < 0 || result.page !== query.page || result.pageSize !== PAGE_SIZE || Number(result.total) < ((query.page - 1) * PAGE_SIZE + result.items.length) && result.items.length > 0) throw new Error("Paginação inválida.");
  if (!result.items.every(item => item && typeof item === "object" && item.published === true)) throw new Error("Projeto sem confirmação de publicação.");
  return { items: result.items.map(publicProject), total: Number(result.total), page: query.page, pageSize: PAGE_SIZE };
}
