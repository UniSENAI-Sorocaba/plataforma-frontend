import { test, expect } from "@playwright/test";
test("catalog is SSR, paginated and keeps filters", async ({ page, request }) => {
  const response = await request.get("/catalogo");
  const html = await response.text(); expect(html).toContain("Tecnologia que aproxima"); expect(html).not.toContain("RASCUNHO PRIVADO");
  await page.goto("/catalogo"); await expect(page.getByRole("article")).toHaveCount(6);
  await page.getByRole("link", { name: "Próxima →" }).click(); await expect(page).toHaveURL(/pagina=2/); await expect(page.getByRole("article")).toHaveCount(6);
  await page.getByLabel("Curso", { exact: true }).selectOption("Análise e Desenvolvimento de Sistemas");
  await page.getByLabel("Semestre", { exact: true }).selectOption("2026.2"); await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page).not.toHaveURL(/pagina=2/); await expect(page.getByRole("article")).toHaveCount(2);
  await page.getByLabel("Objetivo de desenvolvimento sustentável").selectOption("17"); await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page.getByRole("heading", { name: "Nenhum projeto nesta página" })).toBeVisible();
});
test("catalog filters work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false }); const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100/catalogo"); await page.getByLabel("Semestre", { exact: true }).selectOption("2026.2"); await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page).toHaveURL(/semestre=2026.2/); await expect(page.getByRole("article")).toHaveCount(6); await context.close();
});
test("session renews once, fails safely, and can start again", async ({ page, context }) => {
  await page.goto("/demonstracao/sessao"); await page.getByRole("button", { name: "Iniciar sessão fictícia" }).click();
  await expect(page.getByText("Sessão de demonstração ativa", { exact: true })).toBeVisible();
  const cookies = await context.cookies(); expect(cookies.find(c => c.name === "unisenai_demo_session")?.httpOnly).toBe(true);
  await page.getByRole("button", { name: "Simular expiração e renovar" }).click(); await expect(page.getByTestId("refresh-count")).toHaveText("1");
  await expect(page.getByRole("status")).toHaveText("Conteúdo protegido de demonstração disponível.");
  await page.getByRole("button", { name: "Simular falha de renovação" }).click(); await expect(page.getByRole("button", { name: "Iniciar sessão fictícia" })).toBeVisible();
  expect((await context.cookies()).find(c => c.name === "unisenai_demo_session")).toBeUndefined();
  await page.getByRole("button", { name: "Iniciar sessão fictícia" }).click(); await page.getByRole("button", { name: "Sair", exact: true }).click(); await expect(page.getByRole("button", { name: "Iniciar sessão fictícia" })).toBeVisible();
});
test("demo requires same origin and does not leak between users", async ({ request, browser }) => {
  expect((await request.post("/api/demo/session/login", { headers: { Origin: "https://evil.test" } })).status()).toBe(403);
  const context = await browser.newContext(); const page = await context.newPage(); await page.goto("/demonstracao/sessao");
  await page.getByRole("button", { name: "Iniciar sessão fictícia" }).click();
  expect((await request.get("/api/demo/session/resource")).status()).toBe(401); await context.close();
});
test("CPA is keyboard accessible, stays local, and resets answers", async ({ page }) => {
  const requests: string[] = []; page.on("request", r => { if (r.method() === "POST") requests.push(r.url()); });
  await page.goto("/prototipos/cpa"); await expect(page.getByText("Protótipo · planejamento 2027.1", { exact: true })).toBeVisible();
  for (const fieldset of await page.locator("fieldset").all()) { const radio = fieldset.getByRole("radio").first(); await radio.focus(); await page.keyboard.press("Space"); }
  await page.getByRole("button", { name: "Concluir demonstração" }).click(); await expect(page.getByRole("heading", { name: "Prévia concluída." })).toBeVisible();
  expect(requests).toEqual([]); expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  await page.getByRole("button", { name: "Explorar novamente" }).click(); await expect(page.locator("input:checked")).toHaveCount(0);
});
test("mobile layout stays within viewport with usable controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/catalogo");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole("button", { name: "Filtrar" })).toBeVisible();
  await page.screenshot({ path: "test-results/catalog-mobile.png", fullPage: true });
});
