import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (rel) => readFile(new URL(rel, import.meta.url), "utf8");

test("coleta LCP, INP e CLS pelo hook oficial do Next.js", async () => {
  const source = await read("../src/app/web-vitals.tsx");
  assert.match(source, /useReportWebVitals/);
  assert.match(source, /LCP/);
  assert.match(source, /INP/);
  assert.match(source, /CLS/);
});

test("envia apenas métricas essenciais e não envia credenciais", async () => {
  const source = await read("../src/app/web-vitals.tsx");
  assert.match(source, /NEXT_PUBLIC_WEB_VITALS_ENDPOINT/);
  assert.match(source, /credentials: "omit"/);
  assert.match(source, /navigator\.sendBeacon/);
});
