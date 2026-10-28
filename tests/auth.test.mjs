import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import {
  validateLoginCredentials,
  getRedirectPathByRole,
  detectRoleFromEmail,
  authenticate,
} from "../src/features/auth/auth-service.ts";

test("mantém a rota SSR de login", async () => {
  await assert.doesNotReject(
    access(new URL("../src/app/login/page.tsx", import.meta.url))
  );
});

test("validação de credenciais de login", () => {
  // E-mail vazio
  const emptyEmail = validateLoginCredentials({ email: "", password: "password123" });
  assert.equal(emptyEmail.isValid, false);
  assert.match(emptyEmail.error, /informe seu e-mail/i);

  // E-mail em formato inválido
  const invalidEmail = validateLoginCredentials({ email: "usuario-sem-arroba", password: "password123" });
  assert.equal(invalidEmail.isValid, false);
  assert.match(invalidEmail.error, /e-mail institucional válido/i);

  // Senha vazia
  const emptyPassword = validateLoginCredentials({ email: "aluno@unisenai.edu.br", password: "" });
  assert.equal(emptyPassword.isValid, false);
  assert.match(emptyPassword.error, /digite sua senha/i);

  // Senha curta (< 6 caracteres)
  const shortPassword = validateLoginCredentials({ email: "aluno@unisenai.edu.br", password: "123" });
  assert.equal(shortPassword.isValid, false);
  assert.match(shortPassword.error, /mínimo 6 caracteres/i);

  // Credenciais válidas
  const valid = validateLoginCredentials({ email: "aluno@unisenai.edu.br", password: "senhaCorreta123" });
  assert.equal(valid.isValid, true);
});

test("redirecionamento correto conforme perfil de usuário (RBAC)", () => {
  assert.equal(getRedirectPathByRole("ALUNO"), "/");
  assert.equal(getRedirectPathByRole("DOCENTE"), "/docente");
  assert.equal(getRedirectPathByRole("COORDENADOR"), "/coordenacao");
  assert.equal(getRedirectPathByRole("ADMIN"), "/admin");
});

test("detecção determinística de perfil institucional a partir do e-mail", () => {
  assert.equal(detectRoleFromEmail("aluno.silva@unisenai.edu.br"), "ALUNO");
  assert.equal(detectRoleFromEmail("prof.carlos@unisenai.edu.br"), "DOCENTE");
  assert.equal(detectRoleFromEmail("coord.ana@unisenai.edu.br"), "COORDENADOR");
  assert.equal(detectRoleFromEmail("admin@unisenai.edu.br"), "ADMIN");
});

test("authenticate retorna resultado e redirecionamento conforme perfil", async () => {
  const resultAluno = await authenticate({
    email: "aluno.teste@unisenai.edu.br",
    password: "senhaSegura123",
  });
  assert.equal(resultAluno.success, true);
  assert.equal(resultAluno.redirectUrl, "/");
  assert.equal(resultAluno.user?.role, "ALUNO");

  const resultDocente = await authenticate({
    email: "prof.teste@unisenai.edu.br",
    password: "senhaSegura123",
  });
  assert.equal(resultDocente.success, true);
  assert.equal(resultDocente.redirectUrl, "/docente");
  assert.equal(resultDocente.user?.role, "DOCENTE");
});

test("authenticate falha com credenciais rejeitadas", async () => {
  const result = await authenticate({
    email: "aluno.teste@unisenai.edu.br",
    password: "senhaInvalida123",
  });
  assert.equal(result.success, false);
  assert.equal(result.errorCode, "INVALID_CREDENTIALS");
  assert.match(result.error, /incorretos/i);
});
