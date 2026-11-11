import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("[AUTH-08-FE-07] Arquivos estruturais do painel do administrador existem", async () => {
  await assert.doesNotReject(access(new URL("../src/app/admin/page.tsx", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/admin/admin-dashboard.tsx", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/admin/admin-service.ts", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/admin/types.ts", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/admin/README.md", import.meta.url)));
});

test("[AUTH-08-FE-07] Rota SSR do administrador integra com o dashboard e o serviço", async () => {
  const pageContent = await readFile(new URL("../src/app/admin/page.tsx", import.meta.url), "utf8");
  assert.match(pageContent, /AdminDashboard/);
  assert.match(pageContent, /getAdminDashboardData/);
  assert.match(pageContent, /Painel do Administrador/);
});

test("[AUTH-08-FE-07] Dashboard administrativo renderiza métricas, serviços e logs de auditoria", async () => {
  const dashboardContent = await readFile(
    new URL("../src/features/admin/admin-dashboard.tsx", import.meta.url),
    "utf8"
  );
  assert.match(dashboardContent, /PAINEL DO ADMINISTRADOR/);
  assert.match(dashboardContent, /Controle Central de Operações do Sistema/);
  assert.match(dashboardContent, /indicator-grid/);
  assert.match(dashboardContent, /classes-table/);
  assert.match(dashboardContent, /RASTREABILIDADE & SEGURANÇA/);
});

test("[AUTH-08-FE-07] Serviço do administrador provê métricas e logs de auditoria estruturados", async () => {
  const serviceContent = await readFile(
    new URL("../src/features/admin/admin-service.ts", import.meta.url),
    "utf8"
  );
  assert.match(serviceContent, /MOCK_ADMIN_DATA/);
  assert.match(serviceContent, /getAdminDashboardData/);
  assert.match(serviceContent, /Usuários Cadastrados/);
  assert.match(serviceContent, /Sessões Ativas/);
  assert.match(serviceContent, /API Backend Spring Boot/);
  assert.match(serviceContent, /auditLogs/);
});
