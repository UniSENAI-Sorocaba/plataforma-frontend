import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("[AUTH-08-FE-06] Arquivos estruturais do painel do coordenador existem", async () => {
  await assert.doesNotReject(access(new URL("../src/app/coordenador/page.tsx", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/coordinator/coordinator-dashboard.tsx", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/coordinator/coordinator-service.ts", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/coordinator/types.ts", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/coordinator/README.md", import.meta.url)));
});

test("[AUTH-08-FE-06] Rota SSR da coordenação integra com o dashboard e o serviço", async () => {
  const pageContent = await readFile(new URL("../src/app/coordenador/page.tsx", import.meta.url), "utf8");
  assert.match(pageContent, /CoordinatorDashboard/);
  assert.match(pageContent, /getCoordinatorDashboardData/);
  assert.match(pageContent, /Painel da Coordenação/);
});

test("[AUTH-08-FE-06] Dashboard da coordenação renderiza indicadores, atalhos e turmas", async () => {
  const dashboardContent = await readFile(
    new URL("../src/features/coordinator/coordinator-dashboard.tsx", import.meta.url),
    "utf8"
  );
  assert.match(dashboardContent, /COORDENAÇÃO ACADÊMICA/);
  assert.match(dashboardContent, /Painel de Gestão e Acompanhamento Acadêmico/);
  assert.match(dashboardContent, /indicator-grid/);
  assert.match(dashboardContent, /shortcut-cards-grid/);
  assert.match(dashboardContent, /classes-table/);
  assert.match(dashboardContent, /select-filter/);
});

test("[AUTH-08-FE-06] Serviço da coordenação provê mock estruturado", async () => {
  const serviceContent = await readFile(
    new URL("../src/features/coordinator/coordinator-service.ts", import.meta.url),
    "utf8"
  );
  assert.match(serviceContent, /MOCK_COORDINATOR_DATA/);
  assert.match(serviceContent, /getCoordinatorDashboardData/);
  assert.match(serviceContent, /Turmas Ativas/);
  assert.match(serviceContent, /Projetos Integradores/);
  assert.match(serviceContent, /Importar Cadastros/);
});
