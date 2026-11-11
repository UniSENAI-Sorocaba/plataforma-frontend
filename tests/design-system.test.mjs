import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("documenta os tokens semânticos e os temas implementados", async () => {
  const css = await read("../src/app/styles.css");
  const docs = await read("../docs/design-system.md");
  for (const token of ["--ds-color-primary", "--ds-color-background", "--ds-color-surface", "--ds-color-text", "--ds-color-muted", "--ds-color-border"]) {
    assert.match(css, new RegExp(token));
    assert.match(docs, new RegExp(token));
  }
  assert.match(css, /data-theme="dark"/);
  assert.match(docs, /tema escuro/i);
});

test("define grids progressivos e respeita movimento reduzido", async () => {
  const css = await read("../src/app/styles.css");
  const docs = await read("../docs/design-system.md");
  assert.match(css, /min-width: 40rem/);
  assert.match(css, /min-width: 64rem/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(docs, /40 rem/);
  assert.match(docs, /64 rem/);
});
