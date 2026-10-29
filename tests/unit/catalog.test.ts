import { describe, expect, it } from "vitest";
import { COURSES, parseCatalogQuery, filterProjects, publicProject, parseCatalogResult, catalogHref } from "../../src/features/portal/catalog";
import { DEMO_PROJECTS } from "../../src/features/portal/fixtures";
const query = parseCatalogQuery({});
describe("catalog", () => {
  it("allowlists filters and rejects malformed queries", () => {
    expect(parseCatalogQuery({ curso: "other", semestre: "2020", ods: "18", pagina: "-1" })).toEqual(query);
    expect(parseCatalogQuery({ curso: [COURSES[0]], ods: ["4"], pagina: "10001" })).toEqual(query);
    expect(parseCatalogQuery({ curso: COURSES[0], semestre: "2026.2", ods: "17", pagina: "2" })).toEqual({ course: COURSES[0], semester: "2026.2", ods: "17", page: 2 });
    expect(parseCatalogQuery({ pagina: "0" }).page).toBe(1);
    expect(parseCatalogQuery({ pagina: "1e2" }).page).toBe(1);
  });
  it("filters published data before paginating in stable order", () => {
    const first = filterProjects([...DEMO_PROJECTS].reverse(), query);
    const second = filterProjects(DEMO_PROJECTS, { ...query, page: 2 });
    expect(first.total).toBe(12); expect(first.items).toHaveLength(6);
    expect(second.items).toHaveLength(6);
    expect(new Set([...first.items, ...second.items].map(p => p.id)).size).toBe(12);
    expect(JSON.stringify(first)).not.toContain("RASCUNHO");
  });
  it("combines course, semester and ODS and handles empty pages", () => {
    const result = filterProjects(DEMO_PROJECTS, { ...query, course: COURSES[0], semester: "2026.2", ods: "9" });
    expect(result.total).toBe(2); expect(result.items.every(p => p.course === COURSES[0] && p.semester === "2026.2" && p.ods.includes(9))).toBe(true);
    expect(filterProjects(DEMO_PROJECTS, { ...query, ods: "17" }).items).toEqual([]);
    expect(filterProjects(DEMO_PROJECTS, { ...query, page: 100 }).items).toEqual([]);
  });
  it("allowlists public DTO, dropping sensitive extra fields", () => {
    const project = publicProject({ ...DEMO_PROJECTS[0], studentName: "PRIVATE", individualGrade: 9, hours: 40, files: ["secret"], token: "secret" });
    expect(Object.keys(project).sort()).toEqual(["id", "title", "summary", "course", "semester", "ods"].sort());
    expect(JSON.stringify(project)).not.toContain("PRIVATE");
  });
  it.each([null, {}, { ...DEMO_PROJECTS[0], id: "../secret" }, { ...DEMO_PROJECTS[0], title: "" }, { ...DEMO_PROJECTS[0], summary: "x".repeat(801) }, { ...DEMO_PROJECTS[0], ods: [18] }, { ...DEMO_PROJECTS[0], ods: "4" }])("rejects malformed DTO %j", value => {
    expect(() => publicProject(value)).toThrow();
  });
  it("deduplicates ODS values", () => { expect(publicProject({ ...DEMO_PROJECTS[0], ods: [4, 4] }).ods).toEqual([4]); });
  it("preserves filters on navigation, resetting page one", () => {
    const filtered = { ...query, course: COURSES[0], semester: "2026.2", ods: "4" };
    const url = new URL(catalogHref(filtered, 2), "https://example.test");
    expect(url.searchParams.get("curso")).toBe(COURSES[0]); expect(url.searchParams.get("pagina")).toBe("2");
    expect(catalogHref(query, 1)).toBe("/catalogo");
    expect(catalogHref(filtered, 1)).not.toContain("pagina");
  });
  it("validates API pagination and strips private data", () => {
    const result = filterProjects(DEMO_PROJECTS, query);
    expect(parseCatalogResult({ ...result, items: result.items.map(item => ({ ...item, published: true })) }, query)).toEqual(result);
    expect(() => parseCatalogResult(result, query)).toThrow();
    expect(() => parseCatalogResult({ ...result, items: result.items.map(item => ({ ...item, published: false })) }, query)).toThrow();
    for (const bad of [null, {}, { ...result, total: -1 }, { ...result, total: 0 }, { ...result, page: 2 }, { ...result, pageSize: 500 }, { ...result, items: Array(7).fill(result.items[0]) }]) expect(() => parseCatalogResult(bad, query)).toThrow();
    expect(parseCatalogResult({ items: [], page: 100, pageSize: 6, total: 12 }, { ...query, page: 100 }).items).toEqual([]);
  });
});
