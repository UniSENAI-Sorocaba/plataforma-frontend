import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("[AUTH-08-FE-02 / AUTH-08-FE-03] Arquivo rbac.ts existe", async () => {
  await assert.doesNotReject(access(new URL("../src/features/auth/rbac.ts", import.meta.url)));
});

test("[AUTH-08-FE-02] rbac.ts implementa mapeamento e redirecionamento por perfil", async () => {
  const content = await readFile(new URL("../src/features/auth/rbac.ts", import.meta.url), "utf8");

  assert.match(content, /export type UserRole = "aluno" \| "docente" \| "coordenador" \| "admin"/);
  assert.match(content, /ROLE_REDIRECT_PATHS/);
  assert.match(content, /aluno:\s*["']\/aluno["']/);
  assert.match(content, /docente:\s*["']\/docente["']/);
  assert.match(content, /coordenador:\s*["']\/coordenador["']/);
  assert.match(content, /admin:\s*["']\/admin["']/);
  assert.match(content, /export function getRoleRedirectUrl/);
});

test("[AUTH-08-FE-03] rbac.ts define menus por perfil e controle de rotas", async () => {
  const content = await readFile(new URL("../src/features/auth/rbac.ts", import.meta.url), "utf8");

  assert.match(content, /ROLE_NAV_ITEMS/);
  assert.match(content, /export function getRoleNavItems/);
  assert.match(content, /export function canAccessRoute/);
  assert.match(content, /pathname\.startsWith\("\/aluno"\)/);
  assert.match(content, /pathname\.startsWith\("\/docente"\)/);
  assert.match(content, /pathname\.startsWith\("\/coordenador"\)/);
  assert.match(content, /pathname\.startsWith\("\/admin"\)/);
});
