import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

const exists = (rel) =>
  assert.doesNotReject(access(new URL(rel, import.meta.url)));

test("mantém a rota SSR inicial", async () => {
  await exists("../src/app/page.tsx");
});

test("mantém o layout raiz", async () => {
  await exists("../src/app/layout.tsx");
});

test("feature auth existe", async () => {
  await exists("../src/features/auth/README.md");
});

test("feature portal existe", async () => {
  await exists("../src/features/portal/README.md");
});

test("feature academic-pi existe", async () => {
  await exists("../src/features/academic-pi/README.md");
});

test("feature extension existe", async () => {
  await exists("../src/features/extension/README.md");
});
