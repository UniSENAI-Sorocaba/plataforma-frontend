import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("[AUTH-10-FE] Arquivos estruturais de recuperação de senha existem", async () => {
  await assert.doesNotReject(access(new URL("../src/app/recuperar-senha/page.tsx", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/auth/password-recovery-form.tsx", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/auth/password-recovery-service.ts", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/auth/password-recovery-types.ts", import.meta.url)));
});

test("[AUTH-10-FE] Rota SSR e formulário de recuperação de senha estão estruturados", async () => {
  const pageContent = await readFile(new URL("../src/app/recuperar-senha/page.tsx", import.meta.url), "utf8");
  assert.match(pageContent, /PasswordRecoveryForm/);
  assert.match(pageContent, /Recuperação de Senha/);

  const formContent = await readFile(new URL("../src/features/auth/password-recovery-form.tsx", import.meta.url), "utf8");
  assert.match(formContent, /requestPasswordRecovery/);
  assert.match(formContent, /validateRecoveryIdentifier/);
  assert.match(formContent, /recovery-form/);
  assert.match(formContent, /recovery-button--primary/);
  assert.match(formContent, /Voltar ao Início/);
});

test("[AUTH-10-FE] Serviço de recuperação implementa mensagem neutra anti-enumeração e validação", async () => {
  const serviceContent = await readFile(new URL("../src/features/auth/password-recovery-service.ts", import.meta.url), "utf8");
  assert.match(serviceContent, /NEUTRAL_RECOVERY_MESSAGE/);
  assert.match(serviceContent, /validateRecoveryIdentifier/);
  assert.match(serviceContent, /requestPasswordRecovery/);
  assert.match(serviceContent, /Informe seu e-mail institucional ou CPF/);
});
