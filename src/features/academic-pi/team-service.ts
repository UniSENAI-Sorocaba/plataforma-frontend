import type { Team, TeamActionResult } from "./types";

export const INITIAL_TEAM_STATE: Team = {
  id: "team-pi-2026-001",
  name: "EcoTech Sorocaba",
  projectTitle: "Sistema Inteligente de Monitoramento e Eficiência Hídrica",
  academicTerm: "2026/2 - 4º Semestre",
  maxMembers: 5,
  members: [
    {
      id: "usr-01",
      name: "Kaique Silva",
      email: "kaique.silva@aluno.unisenai.edu.br",
      role: "Líder",
      joinedAt: "10 de Março de 2026",
    },
    {
      id: "usr-02",
      name: "Mariana Costa",
      email: "mariana.costa@aluno.unisenai.edu.br",
      role: "Membro",
      joinedAt: "12 de Março de 2026",
    },
  ],
  invitations: [
    {
      id: "inv-001",
      teamId: "team-pi-2026-001",
      name: "Lucas Ferreira",
      email: "lucas.ferreira@aluno.unisenai.edu.br",
      status: "PENDING",
      sentAt: "15 de Março de 2026",
    },
  ],
};

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function canInvite(
  team: Team,
  email: string
): { allowed: boolean; reason?: string } {
  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    return { allowed: false, reason: "Informe um endereço de e-mail institucional válido." };
  }

  if (team.members.length >= team.maxMembers) {
    return {
      allowed: false,
      reason: `A equipe já atingiu o limite máximo de ${team.maxMembers} integrantes.`,
    };
  }

  const isAlreadyMember = team.members.some(
    (m) => m.email.toLowerCase() === normalizedEmail
  );
  if (isAlreadyMember) {
    return { allowed: false, reason: "Este estudante já faz parte da equipe." };
  }

  const hasPendingInvite = team.invitations.some(
    (inv) => inv.email.toLowerCase() === normalizedEmail && inv.status === "PENDING"
  );
  if (hasPendingInvite) {
    return {
      allowed: false,
      reason: "Já existe um convite pendente para este estudante. Aguarde a resposta.",
    };
  }

  return { allowed: true };
}

export function inviteMember(
  team: Team,
  name: string,
  email: string
): TeamActionResult {
  const check = canInvite(team, email);
  if (!check.allowed) {
    return { success: false, message: check.reason || "Não foi possível enviar o convite." };
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 2) {
    return {
      success: false,
      message: "Informe o nome completo do estudante a ser convidado.",
    };
  }

  const newInvitation = {
    id: `inv-${Date.now()}`,
    teamId: team.id,
    name: trimmedName,
    email: email.trim().toLowerCase(),
    status: "PENDING" as const,
    sentAt: new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };

  const updatedTeam: Team = {
    ...team,
    invitations: [newInvitation, ...team.invitations],
  };

  return {
    success: true,
    message: `Convite enviado com sucesso para ${trimmedName} (${email.trim()}).`,
    team: updatedTeam,
  };
}

export function acceptInvitation(
  team: Team,
  invitationId: string
): TeamActionResult {
  const invitation = team.invitations.find((inv) => inv.id === invitationId);
  if (!invitation) {
    return { success: false, message: "Convite não encontrado." };
  }

  if (invitation.status !== "PENDING") {
    return {
      success: false,
      message: `Este convite não está mais pendente (status atual: ${invitation.status}).`,
    };
  }

  if (team.members.length >= team.maxMembers) {
    return {
      success: false,
      message: "Não é possível aceitar o convite pois a equipe atingiu o limite de vagas.",
    };
  }

  const newMember = {
    id: `usr-${Date.now()}`,
    name: invitation.name,
    email: invitation.email,
    role: "Membro" as const,
    joinedAt: new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };

  const updatedTeam: Team = {
    ...team,
    members: [...team.members, newMember],
    invitations: team.invitations.map((inv) =>
      inv.id === invitationId ? { ...inv, status: "ACCEPTED" as const } : inv
    ),
  };

  return {
    success: true,
    message: `Convite aceito! ${invitation.name} agora faz parte da equipe.`,
    team: updatedTeam,
  };
}

export function rejectInvitation(
  team: Team,
  invitationId: string
): TeamActionResult {
  const invitation = team.invitations.find((inv) => inv.id === invitationId);
  if (!invitation) {
    return { success: false, message: "Convite não encontrado." };
  }

  if (invitation.status !== "PENDING") {
    return {
      success: false,
      message: `Este convite já foi processado anteriormente (status: ${invitation.status}).`,
    };
  }

  const updatedTeam: Team = {
    ...team,
    invitations: team.invitations.map((inv) =>
      inv.id === invitationId ? { ...inv, status: "REJECTED" as const } : inv
    ),
  };

  return {
    success: true,
    message: `Convite de ${invitation.name} foi recusado.`,
    team: updatedTeam,
  };
}

export function removeMember(
  team: Team,
  memberId: string
): TeamActionResult {
  const member = team.members.find((m) => m.id === memberId);
  if (!member) {
    return { success: false, message: "Integrante não encontrado na equipe." };
  }

  if (member.role === "Líder") {
    return {
      success: false,
      message:
        "O líder da equipe não pode ser removido diretamente. Transfira a liderança antes de sair.",
    };
  }

  const updatedTeam: Team = {
    ...team,
    members: team.members.filter((m) => m.id !== memberId),
  };

  return {
    success: true,
    message: `${member.name} foi removido(a) da equipe com sucesso.`,
    team: updatedTeam,
  };
}
