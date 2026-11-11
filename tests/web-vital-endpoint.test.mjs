import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseWebVitalPayload } from "../src/features/performance/web-vital-payload.mjs";

const valid = {
  id: "v5-12345-test",
  name: "LCP",
  value: 2200,
  delta: 2200,
  rating: "good",
  navigationType: "navigate",
};
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("aceita somente métricas essenciais com valores tipados", () => {
  assert.deepEqual(parseWebVitalPayload(valid), valid);
  for (const input of [
    null,
    [],
    { ...valid, name: "FCP" },
    { ...valid, value: Number.NaN },
    { ...valid, value: -1 },
    { ...valid, rating: "unknown" },
    { ...valid, id: "contains spaces" },
    { ...valid, navigationType: "unknown" },
  ]) {
    assert.equal(parseWebVitalPayload(input), null);
  }
});

test("endpoint limita payload, sanitiza o evento e não recebe credenciais", async () => {
  const route = await read("../src/app/api/web-vitals/route.ts");
  assert.match(route, /MAX_BODY_BYTES = 2048/);
  assert.match(route, /event: "web_vital"/);
  assert.match(route, /parseWebVitalPayload/);
  assert.doesNotMatch(route, /Authorization|Cookie|request\.headers\.get\(["']x-forwarded-for/);
});
