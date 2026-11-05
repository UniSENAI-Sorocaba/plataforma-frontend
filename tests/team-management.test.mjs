import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import {
  INITIAL_TEAM_STATE,
  canRequestParticipation,
  requestParticipation,
  approveParticipationRequest,
  denyParticipationRequest,
  removeMemberWithJustification,
  canInvite,
  inviteMember,
  acceptInvitation,
  rejectInvitation,
} from "../src/features/academic-pi/team-service.ts";

test("FE-009: mantém a rota SSR de equipes do Projeto Integrador", async () => {
  await assert.doesNotReject(
    access(new URL("../src/app/projetos/equipes/page.tsx", import.meta.url))
  );
});

/* =========================================================================
   FLUXO OFICIAL DO CADERNO (PO - 22/10/2026):
   Solicitação de vaga pelo aluno, aprovação/negação pelo docente,
   remoção com justificativa e respeito ao limite de 1 PI por vez.
   ========================================================================= */

test("FE-009: validação e envio de solicitação de participação pelo aluno", () => {
  const team = { ...INITIAL_TEAM_STATE, members: [...INITIAL_TEAM_STATE.members], participationRequests: [] };

  // E-mail inválido
  const invalidEmail = canRequestParticipation(team, {
    studentName: "Lucas",
    studentEmail: "lucas-invalido",
    studentRa: "RA-01",
  });
  assert.equal(invalidEmail.allowed, false);

  // Aluno já participante
  const alreadyMember = canRequestParticipation(team, {
    studentName: "Kaique",
    studentEmail: "kaique.silva@aluno.unisenai.edu.br",
    studentRa: "RA-02",
  });
  assert.equal(alreadyMember.allowed, false);
  assert.match(alreadyMember.reason, /já é integrante/i);

  // Bloqueio por limite de 1 PI ativo por vez (Regra oficial do PO)
  const piLimit = canRequestParticipation(team, {
    studentName: "Renan Silva",
    studentEmail: "renan@aluno.unisenai.edu.br",
    studentRa: "RA-03",
    activePiCount: 1,
  });
  assert.equal(piLimit.allowed, false);
  assert.match(piLimit.reason, /no máximo 1 projeto de PI por vez/i);

  // Solicitação permitida
  const validRequest = requestParticipation(team, {
    studentName: "Renan Silva",
    studentEmail: "renan@aluno.unisenai.edu.br",
    studentRa: "RA-03",
    activePiCount: 0,
  });
  assert.equal(validRequest.success, true);
  assert.equal(validRequest.team?.participationRequests.length, 1);
  assert.equal(validRequest.team?.participationRequests[0].status, "PENDING");
});

test("FE-009: aprovação de solicitação pelo docente adiciona integrante", () => {
  let team = { ...INITIAL_TEAM_STATE, members: [...INITIAL_TEAM_STATE.members], participationRequests: [] };
  const addReq = requestParticipation(team, {
    studentName: "Beatriz Helena",
    studentEmail: "beatriz@aluno.unisenai.edu.br",
    studentRa: "RA-2026-99",
  });
  assert.ok(addReq.team);
  team = addReq.team;

  const reqId = team.participationRequests[0].id;
  const initialMembersCount = team.members.length;

  const approval = approveParticipationRequest(team, reqId, "Perfil aderente aos requisitos do PI.");
  assert.equal(approval.success, true);
  assert.equal(approval.team?.members.length, initialMembersCount + 1);
  assert.equal(approval.team?.participationRequests[0].status, "APPROVED");
  assert.equal(approval.team?.members.some((m) => m.name === "Beatriz Helena"), true);
});

test("FE-009: negação de solicitação pelo docente exige motivo registrado", () => {
  let team = { ...INITIAL_TEAM_STATE, members: [...INITIAL_TEAM_STATE.members], participationRequests: [] };
  const addReq = requestParticipation(team, {
    studentName: "Carlos Aluno",
    studentEmail: "carlos@aluno.unisenai.edu.br",
    studentRa: "RA-2026-77",
  });
  assert.ok(addReq.team);
  team = addReq.team;
  const reqId = team.participationRequests[0].id;

  // Sem motivo
  const emptyReason = denyParticipationRequest(team, reqId, "");
  assert.equal(emptyReason.success, false);
  assert.match(emptyReason.message, /informe a justificativa/i);

  // Com motivo válido
  const denied = denyParticipationRequest(team, reqId, "Vagas da trilha de hardware esgotadas.");
  assert.equal(denied.success, true);
  assert.equal(denied.team?.participationRequests[0].status, "DENIED");
  assert.equal(denied.team?.participationRequests[0].decisionNotes, "Vagas da trilha de hardware esgotadas.");
});

test("FE-009: remoção pelo docente exige justificativa obrigatória e protege líder", () => {
  const team = { ...INITIAL_TEAM_STATE, members: [...INITIAL_TEAM_STATE.members] };

  // Tentativa de remover o líder
  const leaderRemoval = removeMemberWithJustification(team, {
    memberId: "usr-01",
    justification: "Troca de liderança",
  });
  assert.equal(leaderRemoval.success, false);
  assert.match(leaderRemoval.message, /líder da equipe não pode ser removido/i);

  // Tentativa sem justificativa (menor que 5 caracteres)
  const noReason = removeMemberWithJustification(team, {
    memberId: "usr-02",
    justification: "saiu",
  });
  assert.equal(noReason.success, false);
  assert.match(noReason.message, /justificativa obrigatória/i);

  // Remoção válida de membro com justificativa
  const memberCount = team.members.length;
  const validRemoval = removeMemberWithJustification(team, {
    memberId: "usr-02",
    justification: "Transferência de curso autorizada pela secretaria.",
  });
  assert.equal(validRemoval.success, true);
  assert.equal(validRemoval.team?.members.length, memberCount - 1);
});

/* =========================================================================
   FLUXO COMPLEMENTAR DE CONVITES:
   ========================================================================= */

test("FE-009: convite, aceite e recusa complementares funcionam normalmente", () => {
  let team = {
    ...INITIAL_TEAM_STATE,
    members: [...INITIAL_TEAM_STATE.members],
    invitations: [],
  };

  const check = canInvite(team, "novo@aluno.unisenai.edu.br");
  assert.equal(check.allowed, true);

  const inviteResult = inviteMember(team, "Novo Convidado", "novo@aluno.unisenai.edu.br");
  assert.equal(inviteResult.success, true);
  assert.ok(inviteResult.team);
  team = inviteResult.team;

  const invId = team.invitations[0].id;
  const acceptResult = acceptInvitation(team, invId);
  assert.equal(acceptResult.success, true);
  assert.ok(acceptResult.team);
  assert.equal(acceptResult.team.members.length, INITIAL_TEAM_STATE.members.length + 1);

  // Recusa de convite
  const invite2 = inviteMember(acceptResult.team, "Outro Convidado", "outro@aluno.unisenai.edu.br");
  assert.equal(invite2.success, true);
  assert.ok(invite2.team);
  const rejectResult = rejectInvitation(invite2.team, invite2.team.invitations[0].id);
  assert.equal(rejectResult.success, true);
  assert.ok(rejectResult.team);
  assert.equal(rejectResult.team.invitations[0].status, "REJECTED");
});
