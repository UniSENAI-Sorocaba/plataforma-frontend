import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("mantém a rota SSR inicial e componentes da tela do aluno", async () => {
  await assert.doesNotReject(access(new URL("../src/app/page.tsx", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/student/student-dashboard.tsx", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/student/student-service.ts", import.meta.url)));

  const pageContent = await readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  assert.match(pageContent, /StudentDashboard/);
  assert.match(pageContent, /getStudentHomeData/);

  const serviceContent = await readFile(new URL("../src/features/student/student-service.ts", import.meta.url), "utf8");
  assert.match(serviceContent, /MOCK_STUDENT_HOME_DATA/);
  assert.match(serviceContent, /getStudentHomeData/);
});
