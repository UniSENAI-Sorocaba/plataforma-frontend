import { afterEach, expect, it, vi } from "vitest";
import { loadCatalog } from "../../src/features/portal/catalog-source";
import { parseCatalogQuery, filterProjects } from "../../src/features/portal/catalog";
import { DEMO_PROJECTS } from "../../src/features/portal/fixtures";
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
it("uses clearly marked mock without contacting network", async () => {
  vi.stubEnv("CATALOG_SOURCE", "mock"); const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
  expect((await loadCatalog(parseCatalogQuery({}))).source).toBe("mock"); expect(fetcher).not.toHaveBeenCalled();
});
it("defaults to demonstrative mock when not configured", async () => {
  vi.stubEnv("CATALOG_SOURCE", undefined); expect((await loadCatalog(parseCatalogQuery({}))).source).toBe("mock");
});
it("loads real configured DTO server-side without cookies or cache", async () => {
  vi.stubEnv("CATALOG_SOURCE", "api"); vi.stubEnv("CATALOG_API_URL", "http://localhost:8080/public");
  const query = parseCatalogQuery({ curso: "Análise e Desenvolvimento de Sistemas", semestre: "2026.2", ods: "4" });
  const fetcher = vi.fn(async () => Response.json({ ...filterProjects(DEMO_PROJECTS, query), items: filterProjects(DEMO_PROJECTS, query).items.map(item => ({ ...item, published: true })) })); vi.stubGlobal("fetch", fetcher);
  expect((await loadCatalog(query)).source).toBe("api");
  const [url, init] = fetcher.mock.calls[0] as unknown as [URL, RequestInit];
  expect(url.searchParams.get("course")).toBe(query.course); expect(url.searchParams.get("ods")).toBe("4"); expect(url.searchParams.get("semester")).toBe("2026.2"); expect(init.cache).toBe("no-store"); expect(init.redirect).toBe("error"); expect(init.headers).not.toHaveProperty("Cookie");
});
it("does not silently fall back when real API fails or returns malformed data", async () => {
  vi.stubEnv("CATALOG_SOURCE", "api"); vi.stubEnv("CATALOG_API_URL", "https://api.example.test/public");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 503 })));
  await expect(loadCatalog(parseCatalogQuery({}))).rejects.toThrow();
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ items: "bad" })));
  await expect(loadCatalog(parseCatalogQuery({}))).rejects.toThrow();
});
it.each(["http://remote.test/public", "https://user:secret@api.test/public", "file:///tmp/data"])("rejects unsafe API transport %s", async url => {
  vi.stubEnv("CATALOG_SOURCE", "api"); vi.stubEnv("CATALOG_API_URL", url);
  await expect(loadCatalog(parseCatalogQuery({}))).rejects.toThrow();
});
it("rejects missing configuration and invalid modes", async () => {
  vi.stubEnv("CATALOG_SOURCE", "api"); vi.stubEnv("CATALOG_API_URL", "");
  await expect(loadCatalog(parseCatalogQuery({}))).rejects.toThrow();
  vi.stubEnv("CATALOG_SOURCE", "other"); await expect(loadCatalog(parseCatalogQuery({}))).rejects.toThrow();
});
