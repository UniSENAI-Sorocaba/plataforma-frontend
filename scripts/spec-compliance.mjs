import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const values = Object.fromEntries(readFileSync(".governance-baseline", "utf8").trim().split(/\r?\n/).map(line => line.split("=")));
const report = { baseline: values, checks: [], result: "FAIL", limitations: ["SPEC-AUTH-002 e SPEC-PORTAL-001 estão Draft na governança consultada.", "Contratos de domínio e integração real BE-006/BE-018 ainda pendentes.", "Protótipo CPA exige validação de Produto/Segurança antes de coleta real."] };
const result = spawnSync("git", ["ls-remote", "--exit-code", "--tags", values.repository, `refs/tags/${values.tag}`, `refs/tags/${values.tag}^{}`], { encoding: "utf8", timeout: 20_000, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
if (result.status !== 0) report.checks.push({ name: "baseline remota", status: "FAIL", reason: result.status === 2 ? "Tag não publicada." : "Não foi possível consultar a baseline remota; confira o acesso de leitura." });
else {
  const refs = result.stdout.trim().split("\n").map(row => row.split(/\s+/));
  const commit = (refs.find(row => row[1].endsWith("^{}")) ?? refs[0])[0];
  report.checks.push({ name: "tag → SHA", status: commit === values.commit ? "PASS" : "FAIL", commit });
}
report.checks.push({ name: "Integração e aceite normativo", status: "FAIL", reason: "Mocks são demonstrativos; publicação da baseline, contratos e aceite humano continuam necessários." });
mkdirSync("target", { recursive: true }); writeFileSync("target/spec-compliance.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2)); process.exitCode = 1;
