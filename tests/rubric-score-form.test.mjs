import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("usa controles nativos rotulados, mensagens associadas e resultado do servidor", async () => {
  const source = await read("../src/features/academic-pi/rubrics/rubric-score-form.tsx");
  assert.match(source, /<fieldset/);
  assert.match(source, /<label htmlFor=/);
  assert.match(source, /type="number"/);
  assert.match(source, /aria-invalid=/);
  assert.match(source, /aria-describedby=/);
  assert.match(source, /<output aria-live="polite">\{result\}<\/output>/);
  assert.match(source, /await onSubmit\(validation\.scores\)/);
});
