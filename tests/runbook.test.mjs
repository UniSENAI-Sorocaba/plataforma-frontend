import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import test from "node:test";

test("FE-022: arquivo de runbook SSR e troubleshooting existe e está acessível", async () => {
  const runbookUrl = new URL("../src/features/runbook/README.md", import.meta.url);
  await assert.doesNotReject(access(runbookUrl));
});

test("FE-022: runbook contém seções mandatórias de SSR e Troubleshooting", async () => {
  const runbookUrl = new URL("../src/features/runbook/README.md", import.meta.url);
  const content = await readFile(runbookUrl, "utf-8");

  assert.match(content, /FE-022/, "Deve referenciar o work ID FE-022");
  assert.match(content, /Troubleshooting/, "Deve conter seção de Troubleshooting");
  assert.match(content, /Hydration Mismatch/, "Deve cobrir erro de hidratação SSR");
  assert.match(content, /npm run check/, "Deve documentar o gate de conformidade npm run check");
  assert.match(content, /WCAG/, "Deve cobrir critérios de acessibilidade");
  assert.match(content, /Turbopack/, "Deve cobrir especificidades do Turbopack");
});

test("FE-022: engines no package.json exige Node 22 compatível com o runbook", async () => {
  const pkgUrl = new URL("../package.json", import.meta.url);
  const pkg = JSON.parse(await readFile(pkgUrl, "utf-8"));

  assert.ok(pkg.engines && pkg.engines.node, "package.json deve definir engines.node");
  assert.match(pkg.engines.node, />=22/, "Versão exigida deve ser Node >=22");
});
