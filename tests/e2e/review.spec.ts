import { test, expect } from "@playwright/test";
const fixture = "http://127.0.0.1:4101";
const apiSite = "http://127.0.0.1:3103";

test("disabled previews are inaccessible and absent from navigation", async ({ request }) => {
  for (const path of ["/demonstracao/sessao", "/prototipos/cpa", "/api/demo/session/resource"]) expect((await request.get(`http://127.0.0.1:3102${path}`)).status()).toBe(404);
  expect((await request.post("http://127.0.0.1:3102/api/demo/session/login")).status()).toBe(404);
  const home = await request.get("http://127.0.0.1:3102/"); const html = await home.text();
  expect(html).not.toContain('href="/demonstracao/sessao"'); expect(html).not.toContain('href="/prototipos/cpa"');
});

test("HTTP adapter renders SSR while stripping private fields and browser cookies", async ({ request, page, context }) => {
  await request.post(`${fixture}/scenario?mode=published`);
  await context.addCookies([{ name: "academic_session", value: "SYNTHETIC_COOKIE", domain: "127.0.0.1", path: "/" }]);
  await page.goto(`${apiSite}/catalogo`);
  await expect(page.getByText("Conectado à API", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Projeto de teste via HTTP" })).toBeVisible();
  const html = await (await request.get(`${apiSite}/catalogo`)).text();
  expect(html).toContain("Projeto de teste via HTTP"); expect(html).not.toContain("PRIVATE_STUDENT_SENTINEL"); expect(html).not.toContain("PRIVATE_FILE_SENTINEL");
  expect((await (await request.get(`${fixture}/stats`)).json()).receivedCookie).toBe(false);
});

test("withdrawn publication disappears on a new SSR request without stale cache", async ({ page, request }) => {
  await request.post(`${fixture}/scenario?mode=published`); await page.goto(`${apiSite}/catalogo`);
  await expect(page.getByRole("article")).toHaveCount(1);
  await request.post(`${fixture}/scenario?mode=withdrawn`); await page.reload();
  await expect(page.getByRole("article")).toHaveCount(0); await expect(page.getByText("0 projetos encontrados")).toBeVisible();
  expect((await (await request.get(`${fixture}/stats`)).json()).calls).toBeGreaterThan(0);
});

for (const mode of ["draft", "invalid", "error"]) {
  test(`API ${mode} fails closed with no mock fallback or internal diagnostics`, async ({ request, page }) => {
    await request.post(`${fixture}/scenario?mode=${mode}`); await page.goto(`${apiSite}/catalogo`);
    await expect(page.getByRole("alert").filter({ hasText: "Não foi possível carregar os projetos" })).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(0);
    const html = await page.content(); expect(html).not.toContain("Tecnologia que aproxima"); expect(html).not.toContain("PRIVATE_STUDENT_SENTINEL"); expect(html).not.toContain("SYNTHETIC_INTERNAL_ERROR");
  });
}

test("invalid catalog queries and markup are not reflected as HTML", async ({ request }) => {
  const response = await request.get("/catalogo?curso=%3Cscript%3Ealert(1)%3C%2Fscript%3E&pagina=-1&ods=18");
  const html = await response.text(); expect(response.ok()).toBe(true); expect(html).not.toContain("<script>alert(1)</script>"); expect(html).not.toContain("RASCUNHO PRIVADO");
});

test("CPA cannot complete empty and clears choices on reload", async ({ page }) => {
  await page.goto("/prototipos/cpa"); await page.getByRole("button", { name: "Concluir demonstração" }).click();
  await expect(page.getByRole("heading", { name: "Prévia concluída." })).toHaveCount(0);
  await page.getByRole("radio").first().check(); await expect(page.locator("input:checked")).toHaveCount(1);
  await page.reload(); await expect(page.locator("input:checked")).toHaveCount(0);
});

test("session endpoints reject absent origin, unknown actions and revoked cookies", async ({ request }) => {
  expect((await request.post("/api/demo/session/login")).status()).toBe(403);
  const headers = { Origin: "http://127.0.0.1:3101" };
  await request.post("/api/demo/session/login", { headers });
  expect((await request.get("/api/demo/session/unknown")).status()).toBe(404);
  expect((await request.post("/api/demo/session/unknown", { headers })).status()).toBe(404);
  expect((await request.post("/api/demo/session/logout", { headers })).status()).toBe(200);
  expect((await request.post("/api/demo/session/logout", { headers })).status()).toBe(200);
  expect((await request.get("/api/demo/session/resource")).status()).toBe(401);
  expect((await request.post("/api/demo/session/refresh", { headers })).status()).toBe(401);
});

test("desktop and mobile prototypes have no horizontal overflow", async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/catalogo", "/prototipos/cpa", "/demonstracao/sessao"]) {
      await page.goto(path); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  await page.goto("/catalogo"); await page.screenshot({ path: "test-results/catalog-desktop.png", fullPage: true });
  await page.goto("/prototipos/cpa"); await page.screenshot({ path: "test-results/cpa-desktop.png", fullPage: true });
});
