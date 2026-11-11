import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parsePublicSiteUrl } from "../src/features/seo/site-url.mjs";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("normaliza uma origem HTTPS sem incluir caminho ou credenciais", () => {
  assert.equal(parsePublicSiteUrl("https://portal.example.test/", "production")?.origin, "https://portal.example.test");
  for (const value of [
    "http://portal.example.test",
    "https://user:secret@portal.example.test",
    "https://portal.example.test/path",
    "https://portal.example.test?campaign=one",
    "https://portal.example.test/#top",
    "not-a-url",
  ]) {
    assert.equal(parsePublicSiteUrl(value, "production"), null, value);
  }
});

test("falha de modo seguro quando o domínio não está configurado", async () => {
  assert.equal(parsePublicSiteUrl(undefined, "production"), null);
  const [layout, sitemap, robots, page] = await Promise.all([
    read("../src/app/layout.tsx"),
    read("../src/app/sitemap.ts"),
    read("../src/app/robots.ts"),
    read("../src/app/page.tsx"),
  ]);
  assert.match(layout, /index: false/);
  assert.match(sitemap, /if \(!siteUrl\) return \[\]/);
  assert.match(robots, /disallow: "\/"/);
  assert.match(page, /alternates: \{ canonical: siteUrl \}/);
  assert.doesNotMatch(layout, /canonical:/);
});

test("publica somente a origem e bloqueia as rotas autenticadas no robots", async () => {
  const [sitemap, robots] = await Promise.all([
    read("../src/app/sitemap.ts"),
    read("../src/app/robots.ts"),
  ]);
  assert.match(sitemap, /new URL\("\/", siteUrl\)/);
  for (const route of ["/admin", "/aluno", "/cadastro", "/coordenador", "/docente", "/login", "/recuperar-senha", "/register", "/api/"]) {
    assert.ok(robots.includes(route), `robots.txt deve bloquear ${route}`);
  }
});
