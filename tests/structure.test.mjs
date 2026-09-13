import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

test("mantém a rota SSR inicial", async () => {
  await assert.doesNotReject(access(new URL("../src/app/page.tsx", import.meta.url)));
});
