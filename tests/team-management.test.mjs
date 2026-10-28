import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import {
  canInvite,
  inviteMember,
  acceptInvitation,
  rejectInvitation,
  removeMember,
  isValidEmail,
  INITIAL_TEAM_STATE,
} from "../src/features/academic-pi/team-service.ts";

test("mantém a rota SSR de gestão de equipes", async () => {
  await assert.doesNotReject(
    access(new URL("../src/app/projetos/equipes/page.tsx", import.meta.url))
  );
});

test("validação de e-mail institucional e formato", () => {
  assert.equal(isValidEmail("aluno@sp.senai.br"), true);
  assert.equal(isValidEmail("aluno.silva@unisenai.edu.br"), true);
  assert.equal(isValidEmail("invalido"), false);
  assert.equal(isValidEmail(""), false);
  assert.equal(isValidEmail("aluno@semdominio"), false);
});

test("canInvite impede convites inválidos, duplicados ou com equipe cheia", () => {
  const team = structuredClone(INITIAL_TEAM_STATE);

  // E-mail inválido
  const invalid = canInvite(team, "email-invalido");
  assert.equal(invalid.allowed, false);

  // Integrante já existente
  const memberDuplicate = canInvite(team, "mariana.costa@aluno.unisenai.edu.br");
  assert.equal(memberDuplicate.allowed, false);
  assert.match(memberDuplicate.reason, /já faz parte da equipe/);

  // Convite pendente duplicado (idempotência BE-008)
  const pendingDuplicate = canInvite(team, "lucas.ferreira@aluno.unisenai.edu.br");
  assert.equal(pendingDuplicate.allowed, false);
  assert.match(pendingDuplicate.reason, /já existe um convite pendente/i);

  // Convite permitido
  const valid = canInvite(team, "novo.aluno@unisenai.edu.br");
  assert.equal(valid.allowed, true);

  // Equipe com lotação máxima atingida
  const fullTeam = structuredClone(team);
  fullTeam.maxMembers = 2; // já possui 2 membros
  const teamFull = canInvite(fullTeam, "outro.aluno@unisenai.edu.br");
  assert.equal(teamFull.allowed, false);
  assert.match(teamFull.reason, /limite máximo/i);
});

test("inviteMember cria convite pendente com sucesso", () => {
  const team = structuredClone(INITIAL_TEAM_STATE);
  const result = inviteMember(team, "Beatriz Souza", "beatriz.souza@unisenai.edu.br");

  assert.equal(result.success, true);
  assert.ok(result.team);
  const created = result.team.invitations.find((i) => i.email === "beatriz.souza@unisenai.edu.br");
  assert.ok(created);
  assert.equal(created.name, "Beatriz Souza");
  assert.equal(created.status, "PENDING");
});

test("acceptInvitation adiciona integrante e altera status para ACCEPTED", () => {
  const team = structuredClone(INITIAL_TEAM_STATE);
  const result = acceptInvitation(team, "inv-001");

  assert.equal(result.success, true);
  assert.ok(result.team);
  assert.equal(result.team.members.length, 3);
  const newMember = result.team.members.find((m) => m.name === "Lucas Ferreira");
  assert.ok(newMember);
  assert.equal(newMember.role, "Membro");

  const invitation = result.team.invitations.find((i) => i.id === "inv-001");
  assert.equal(invitation.status, "ACCEPTED");
});

test("rejectInvitation altera status para REJECTED sem alterar membros", () => {
  const team = structuredClone(INITIAL_TEAM_STATE);
  const initialMembersCount = team.members.length;
  const result = rejectInvitation(team, "inv-001");

  assert.equal(result.success, true);
  assert.ok(result.team);
  assert.equal(result.team.members.length, initialMembersCount);

  const invitation = result.team.invitations.find((i) => i.id === "inv-001");
  assert.equal(invitation.status, "REJECTED");
});

test("removeMember remove integrante mas impede remover líder", () => {
  const team = structuredClone(INITIAL_TEAM_STATE);

  // Tentativa de remover o líder
  const leaderRemoveResult = removeMember(team, "usr-01");
  assert.equal(leaderRemoveResult.success, false);
  assert.match(leaderRemoveResult.message, /líder da equipe não pode ser removido/i);

  // Remover membro regular
  const memberRemoveResult = removeMember(team, "usr-02");
  assert.equal(memberRemoveResult.success, true);
  assert.ok(memberRemoveResult.team);
  assert.equal(memberRemoveResult.team.members.some((m) => m.id === "usr-02"), false);
});
