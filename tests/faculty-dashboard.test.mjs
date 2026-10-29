import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("mantém a rota docente e componentes da tela inicial do professor", async () => {
  await assert.doesNotReject(access(new URL("../src/app/docente/page.tsx", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/faculty/faculty-dashboard.tsx", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/faculty/faculty-service.ts", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/faculty/types.ts", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/faculty/README.md", import.meta.url)));

  const pageContent = await readFile(new URL("../src/app/docente/page.tsx", import.meta.url), "utf8");
  assert.match(pageContent, /FacultyDashboard/);
  assert.match(pageContent, /getFacultyHomeData/);
});

test("serviço docente e dashboard estruturam tela inicial e decisão de horas", async () => {
  const serviceContent = await readFile(
    new URL("../src/features/faculty/faculty-service.ts", import.meta.url),
    "utf8"
  );
  assert.match(serviceContent, /INITIAL_FACULTY_REQUESTS/);
  assert.match(serviceContent, /MOCK_FACULTY_HOME_DATA/);
  assert.match(serviceContent, /getFacultyHomeData/);
  assert.match(serviceContent, /calculateHoursSummary/);
  assert.match(serviceContent, /submitFacultyDecision/);
  assert.match(serviceContent, /Justificativa obrigatória/);

  const dashboardContent = await readFile(
    new URL("../src/features/faculty/faculty-dashboard.tsx", import.meta.url),
    "utf8"
  );
  assert.match(dashboardContent, /handleDecisionSubmit/);
  assert.match(dashboardContent, /hoursSummary/);
  assert.match(dashboardContent, /Projetos sob sua Responsabilidade/);
  assert.match(dashboardContent, /Link/);
});
