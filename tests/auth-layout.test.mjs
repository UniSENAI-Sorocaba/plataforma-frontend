/**
 * Testes estruturais — AUTH-08-FE-01
 * Verifica que o layout autenticado e seus arquivos existem.
 */
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

const exists = (rel) =>
  assert.doesNotReject(access(new URL(rel, import.meta.url)));

test("layout autenticado existe", async () => {
  await exists("../src/app/(autenticado)/layout.tsx");
});

test("rota aluno existe", async () => {
  await exists("../src/app/(autenticado)/aluno/page.tsx");
});

test("rota docente existe", async () => {
  await exists("../src/app/(autenticado)/docente/page.tsx");
});

test("componente nav-header existe", async () => {
  await exists("../src/components/nav-header.tsx");
});

test("componente nav-sidebar existe", async () => {
  await exists("../src/components/nav-sidebar.tsx");
});

test("mock de autenticação existe", async () => {
  await exists("../src/features/auth/auth-layout.mock.ts");
});
