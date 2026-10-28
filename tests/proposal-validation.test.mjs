import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

import {
  canSaveDraft,
  FIELD_LIMITS,
  getInitialProposalData,
  validateProposal,
} from "../src/features/academic-pi/validation.ts";

test("garante que os arquivos da issue FE-006 existem nas fronteiras corretas", async () => {
  await assert.doesNotReject(access(new URL("../src/app/academic-pi/propostas/nova/page.tsx", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/academic-pi/proposal-form.tsx", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/academic-pi/validation.ts", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/academic-pi/draft-storage.ts", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/features/academic-pi/types.ts", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/components/button.tsx", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/components/input.tsx", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/components/textarea.tsx", import.meta.url)));
  await assert.doesNotReject(access(new URL("../src/components/alert.tsx", import.meta.url)));
});

test("rejeita proposta com campos obrigatórios vazios", () => {
  const initial = getInitialProposalData();
  const result = validateProposal(initial);

  assert.equal(result.isValid, false);
  assert.ok(result.errors.title, "deve exigir título");
  assert.ok(result.errors.theme, "deve exigir tema");
  assert.ok(result.errors.problemStatement, "deve exigir declaração do problema");
  assert.ok(result.errors.objectives, "deve exigir objetivos");
  assert.ok(result.errors.justification, "deve exigir justificativa");
  assert.ok(result.errors.ods, "deve exigir pelo menos uma ODS");
  assert.ok(result.errors.member_0_name, "deve exigir nome do integrante");
  assert.ok(result.errors.member_0_email, "deve exigir email do integrante");
  assert.ok(result.errors.member_0_ra, "deve exigir RA do integrante");
});

test("valida limites de caracteres no título e textos", () => {
  const data = getInitialProposalData();
  data.title = "abc"; // menos de 5 chars
  data.theme = "Indústria 4.0";
  data.problemStatement = "Curto"; // menos de 20 chars
  data.objectives = "Curto";
  data.justification = "Curto";
  data.ods = ["9"];
  data.teamMembers = [{ id: "1", name: "Fulano", email: "fulano@senaisp.edu.br", ra: "12345" }];

  const result = validateProposal(data);
  assert.equal(result.isValid, false);
  assert.match(result.errors.title || "", /mínimo 5 caracteres/);
  assert.match(result.errors.problemStatement || "", /mínimo 20 caracteres/);
  assert.match(result.errors.objectives || "", /mínimo 20 caracteres/);
  assert.match(result.errors.justification || "", /mínimo 20 caracteres/);
});

test("valida formato de e-mail e RA dos integrantes", () => {
  const data = getInitialProposalData();
  data.title = "Desenvolvimento de Robô Autônomo com Visão Computacional";
  data.theme = "Robótica";
  data.problemStatement = "Este problema requer uma abordagem aprofundada de engenharia e tecnologia.";
  data.objectives = "Construir e programar protótipo funcional para ambiente industrial real.";
  data.justification = "Redução comprovada de acidentes de trabalho em ambientes insalubres.";
  data.ods = ["9", "12"];
  data.teamMembers = [
    { id: "1", name: "Jo", email: "email_invalido", ra: "1" }, // nome curto, email invalido, ra curto
  ];

  const result = validateProposal(data);
  assert.equal(result.isValid, false);
  assert.match(result.errors.member_0_name || "", /pelo menos 3 caracteres/);
  assert.match(result.errors.member_0_email || "", /E-mail inválido/);
  assert.match(result.errors.member_0_ra || "", /RA inválido/);
});

test("aprova proposta completa e válida", () => {
  const validData = {
    title: "Otimização de Consumo Energético com Algoritmos Preditivos",
    theme: "Eficiência Energética e IoT",
    modality: "PI3",
    problemStatement: "A indústria metalúrgica local consome energia excessiva em horários de ponta sem predição.",
    objectives: "Implementar medidores IoT e modelo matemático em Python para prever picos de demanda.",
    justification: "Possibilidade de redução de até 22% no custo de fatura elétrica da planta piloto.",
    ods: ["7", "9", "12"],
    teamMembers: [
      { id: "1", name: "Matheus Boff", email: "matheus.boff@senaisp.edu.br", ra: "20261001" },
      { id: "2", name: "Lucas Silva", email: "lucas.silva@senaisp.edu.br", ra: "20261002" },
    ],
  };

  const result = validateProposal(validData);
  assert.equal(result.isValid, true);
  assert.equal(Object.keys(result.errors).length, 0);
});

test("regras de preservação de rascunho permitido", () => {
  // 1. Rascunho vazio não deve ser salvo
  const emptyCheck = canSaveDraft({});
  assert.equal(emptyCheck.allowed, false);

  // 2. Rascunho com preenchimento parcial é permitido
  const partialCheck = canSaveDraft({ title: "Início de ideia de PI" });
  assert.equal(partialCheck.allowed, true);

  // 3. Rascunho que excede o limite máximo permitido de caracteres deve ser rejeitado
  const tooLongTitle = "A".repeat(FIELD_LIMITS.TITLE_MAX + 1);
  const overflowCheck = canSaveDraft({ title: tooLongTitle });
  assert.equal(overflowCheck.allowed, false);
  assert.match(overflowCheck.reason || "", /excede o limite máximo/);
});
