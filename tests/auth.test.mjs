import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import {
  validateLoginCredentials,
  getRedirectPathByRole,
  detectRoleFromIdentifier,
  authenticate,
  formatCpf,
  isValidCpf,
  validateFirstAccess,
  refreshSession,
  logout,
  activateFirstAccess,
  requestPasswordRecovery,
  resetPassword,
} from "../src/features/auth/auth-service.ts";

test("mantém a rota SSR de login", async () => {
  await assert.doesNotReject(
    access(new URL("../src/app/login/page.tsx", import.meta.url))
  );
});

test("formatação e validação de CPF", () => {
  assert.equal(formatCpf("12345678901"), "123.456.789-01");
  assert.equal(formatCpf("123"), "123");
  assert.equal(formatCpf("123456"), "123.456");

  // CPF fictício com dígitos verificadores válidos
  // Ex: 52998224725 é matematicamente válido
  assert.equal(isValidCpf("52998224725"), true);
  assert.equal(isValidCpf("11111111111"), false); // repetidos inválidos
  assert.equal(isValidCpf("12345678900"), false); // verificador inválido
  assert.equal(isValidCpf("123"), false);
});

test("validação de credenciais de login (CPF e E-mail)", () => {
  // Identificador vazio
  const empty = validateLoginCredentials({ identifier: "", password: "password123" });
  assert.equal(empty.isValid, false);
  assert.match(empty.error, /informe seu CPF ou e-mail/i);

  // E-mail inválido
  const invalidEmail = validateLoginCredentials({ identifier: "usuario-sem-arroba", password: "password123" });
  assert.equal(invalidEmail.isValid, false);

  // CPF com tamanho errado
  const shortCpf = validateLoginCredentials({ identifier: "123456", password: "password123" });
  assert.equal(shortCpf.isValid, false);
  assert.match(shortCpf.error, /11 dígitos/i);

  // Senha vazia
  const emptyPassword = validateLoginCredentials({ identifier: "aluno@unisenai.edu.br", password: "" });
  assert.equal(emptyPassword.isValid, false);
  assert.match(emptyPassword.error, /digite sua senha/i);

  // Senha curta (< 8 caracteres)
  const shortPassword = validateLoginCredentials({ identifier: "aluno@unisenai.edu.br", password: "123" });
  assert.equal(shortPassword.isValid, false);
  assert.match(shortPassword.error, /mínimo 8 caracteres/i);

  // Credenciais válidas com e-mail
  const validEmail = validateLoginCredentials({ identifier: "aluno@unisenai.edu.br", password: "senhaCorreta123" });
  assert.equal(validEmail.isValid, true);

  // Credenciais válidas com CPF matematicamente correto
  const validCpf = validateLoginCredentials({ identifier: "529.982.247-25", password: "senhaCorreta123" });
  assert.equal(validCpf.isValid, true);
});

test("redirecionamento correto conforme perfil de usuário (RBAC)", () => {
  assert.equal(getRedirectPathByRole("ALUNO"), "/");
  assert.equal(getRedirectPathByRole("DOCENTE"), "/docente");
  assert.equal(getRedirectPathByRole("COORDENADOR"), "/coordenacao");
  assert.equal(getRedirectPathByRole("ADMIN"), "/admin");
});

test("detecção determinística de perfil institucional a partir do identificador", () => {
  assert.equal(detectRoleFromIdentifier("aluno.silva@unisenai.edu.br"), "ALUNO");
  assert.equal(detectRoleFromIdentifier("52998224725"), "ALUNO");
  assert.equal(detectRoleFromIdentifier("prof.carlos@unisenai.edu.br"), "DOCENTE");
  assert.equal(detectRoleFromIdentifier("coord.ana@unisenai.edu.br"), "COORDENADOR");
  assert.equal(detectRoleFromIdentifier("admin@unisenai.edu.br"), "ADMIN");
});

test("validação de primeiro acesso (criação de senha inicial)", () => {
  // CPF inválido
  const invCpf = validateFirstAccess({ cpf: "123", newPassword: "senha123", confirmPassword: "senha123" });
  assert.equal(invCpf.isValid, false);

  // Senhas divergentes
  const diff = validateFirstAccess({ cpf: "52998224725", newPassword: "senha123", confirmPassword: "outraSenha123" });
  assert.equal(diff.isValid, false);
  assert.match(diff.error, /não confere/i);

  // Senha curta
  const short = validateFirstAccess({ cpf: "52998224725", newPassword: "123", confirmPassword: "123" });
  assert.equal(short.isValid, false);
  assert.match(short.error, /mínimo 8 caracteres/i);

  // Válido
  const valid = validateFirstAccess({ cpf: "52998224725", newPassword: "senhaSegura123", confirmPassword: "senhaSegura123" });
  assert.equal(valid.isValid, true);
});

test("authenticate retorna resultado e redirecionamento conforme perfil", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    const role = body.identifier.startsWith("prof.") ? "DOCENTE" : "ALUNO";
    const payload = Buffer.from(JSON.stringify({ role })).toString("base64url");
    return new Response(JSON.stringify({ accessToken: `header.${payload}.signature` }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
  const resultAluno = await authenticate({
    identifier: "aluno.teste@unisenai.edu.br",
    password: "senhaSegura123",
  });
  assert.equal(resultAluno.success, true);
  assert.equal(resultAluno.redirectUrl, "/");
  assert.equal(resultAluno.user?.role, "ALUNO");

  const resultDocente = await authenticate({
    identifier: "prof.teste@unisenai.edu.br",
    password: "senhaSegura123",
  });
  assert.equal(resultDocente.success, true);
  assert.equal(resultDocente.redirectUrl, "/docente");
  assert.equal(resultDocente.user?.role, "DOCENTE");

  const resultCpf = await authenticate({
    identifier: "529.982.247-25",
    password: "senhaSegura123",
  });
  assert.equal(resultCpf.success, true);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("authenticate falha com credenciais rejeitadas e conta inativa", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    const status = body.password === "contaInativa123" ? 403 : 401;
    return new Response(JSON.stringify({ type: "about:blank", status }), {
      status,
      headers: { "Content-Type": "application/problem+json" },
    });
  };

  try {
  const resultInvalid = await authenticate({
    identifier: "aluno.teste@unisenai.edu.br",
    password: "senhaInvalida123",
  });
  assert.equal(resultInvalid.success, false);
  assert.equal(resultInvalid.errorCode, "INVALID_CREDENTIALS");

  const resultDisabled = await authenticate({
    identifier: "aluno.teste@unisenai.edu.br",
    password: "contaInativa123",
  });
  assert.equal(resultDisabled.success, false);
  assert.equal(resultDisabled.errorCode, "USER_DISABLED");
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("authenticate não cria sessão demo quando a API está indisponível", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error("offline"); };
  try {
    const result = await authenticate({
      identifier: "aluno.teste@unisenai.edu.br",
      password: "senhaSegura123",
    });
    assert.equal(result.success, false);
    assert.equal(result.errorCode, "NETWORK_ERROR");
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("refreshSession rotates credentials and clears them on unauthorized", async () => {
  const previousFetch = globalThis.fetch;
  const previousWindow = globalThis.window;
  const values = new Map([["plataforma.refreshToken", "refresh-old"]]);
  globalThis.window = { sessionStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }};
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ accessToken: "access-new", refreshToken: "refresh-new" }), { status: 200 });
    assert.equal(await refreshSession("/refresh"), true);
    assert.equal(values.get("plataforma.accessToken"), "access-new");
    assert.equal(values.get("plataforma.refreshToken"), "refresh-new");

    globalThis.fetch = async () => new Response("", { status: 401 });
    assert.equal(await refreshSession("/refresh"), false);
    assert.equal(values.has("plataforma.accessToken"), false);
    assert.equal(values.has("plataforma.refreshToken"), false);
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.window = previousWindow;
  }
});

test("logout clears local session even when API is unavailable", async () => {
  const previousFetch = globalThis.fetch;
  const previousWindow = globalThis.window;
  const values = new Map([["plataforma.accessToken", "access"], ["plataforma.refreshToken", "refresh"]]);
  globalThis.window = { sessionStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }};
  globalThis.fetch = async () => { throw new Error("offline"); };
  try {
    await logout("/logout");
    assert.equal(values.size, 0);
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.window = previousWindow;
  }
});

test("first access calls the real API only after local validation", async () => {
  const previousFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (_url, options) => {
    request = JSON.parse(options.body);
    return new Response(null, { status: 204 });
  };
  try {
    const result = await activateFirstAccess({
      cpf: "529.982.247-25",
      newPassword: "senhaSegura123",
      confirmPassword: "senhaSegura123",
    }, "/first-access");
    assert.equal(result.success, true);
    assert.deepEqual(request, { cpf: "52998224725", password: "senhaSegura123" });
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("password recovery keeps the response neutral and does not create demo success", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("", { status: 202 });
  try {
    assert.deepEqual(await requestPasswordRecovery("student@unisenai.edu.br", "/recovery"), { success: true });
    assert.equal((await requestPasswordRecovery("not-an-email", "/recovery")).success, false);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("password reset validates locally and consumes the server contract", async () => {
  const previousFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (_url, options) => {
    request = JSON.parse(options.body);
    return new Response(null, { status: 204 });
  };
  try {
    const result = await resetPassword({ token: "token-from-email", newPassword: "novaSenha123", confirmPassword: "novaSenha123" }, "/reset");
    assert.equal(result.success, true);
    assert.deepEqual(request, { token: "token-from-email", password: "novaSenha123" });
  } finally {
    globalThis.fetch = previousFetch;
  }
});
