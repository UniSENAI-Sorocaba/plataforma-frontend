import type {
  ParticipationRequest,
  RemovalDTO,
  RequestParticipationDTO,
  Team,
  TeamActionResult,
} from "./types";

export const INITIAL_TEAM_STATE: Team = {
  id: "team-pi-2026-001",
  name: "EcoTech Sorocaba",
  projectTitle: "Sistema Inteligente de Monitoramento e Eficiência Hídrica",
  academicTerm: "2026/2 - 4º Semestre",
  responsibleTeacher: "Prof. Carlos Eduardo (Docente Responsável)",
  status: "PUBLICADO",
  maxMembers: 5,
  isRegistrationPeriodOpen: true,
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
  participationRequests: [
    {
      id: "req-001",
      teamId: "team-pi-2026-001",
      studentId: "std-103",
      studentName: "Beatriz Helena",
      studentEmail: "beatriz.helena@aluno.unisenai.edu.br",
      studentRa: "RA-2026-2091",
      activePiProjectsCount: 0,
      status: "PENDING",
      requestedAt: "18 de Março de 2026",
    },
  ],
};

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/* =========================================================================
   1. FLUXO OFICIAL DO CADERNO (PO - 22/10/2026):
      - Solicitação de participação pelo aluno em períodos de inscrição
      - Aprovação e negação pelo docente responsável
      - Remoção pelo docente com justificativa obrigatória
      - Limite institucional: 1 projeto de PI ativo por aluno
   ========================================================================= */

export function canRequestParticipation(
  team: Team,
  dto: RequestParticipationDTO
): { allowed: boolean; reason?: string } {
  if (!team.isRegistrationPeriodOpen) {
    return {
      allowed: false,
      reason: "O período de inscrições para este projeto de PI está encerrado.",
    };
  }

  const normalizedEmail = dto.studentEmail.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    return { allowed: false, reason: "Informe um e-mail institucional válido." };
  }

  if (team.members.length >= team.maxMembers) {
    return {
      allowed: false,
      reason: `A equipe do projeto já atingiu o limite de ${team.maxMembers} integrantes.`,
    };
  }

  // Verifica se o aluno já faz parte da equipe
  if (team.members.some((m) => m.email.toLowerCase() === normalizedEmail)) {
    return { allowed: false, reason: "Você já é integrante deste projeto de PI." };
  }

  // Verifica se já possui solicitação pendente
  const hasPending = team.participationRequests.some(
    (req) => req.studentEmail.toLowerCase() === normalizedEmail && req.status === "PENDING"
  );
  if (hasPending) {
    return {
      allowed: false,
      reason: "Você já possui uma solicitação de participação pendente de análise pelo docente.",
    };
  }

  // Regra oficial do caderno: aluno só pode participar de 1 projeto de PI por vez
  if (dto.activePiCount !== undefined && dto.activePiCount >= 1) {
    return {
      allowed: false,
      reason:
        "Conflito de inscrição: Cada aluno pode participar de no máximo 1 projeto de PI por vez. Conclua ou encerre seu vínculo atual antes de solicitar nova vaga.",
    };
  }

  return { allowed: true };
}

export function requestParticipation(
  team: Team,
  dto: RequestParticipationDTO
): TeamActionResult {
  const check = canRequestParticipation(team, dto);
  if (!check.allowed) {
    return { success: false, message: check.reason || "Solicitação não permitida." };
  }

  const trimmedName = dto.studentName.trim();
  if (trimmedName.length < 2) {
    return { success: false, message: "Informe seu nome completo." };
  }

  const newRequest: ParticipationRequest = {
    id: `req-${Date.now()}`,
    teamId: team.id,
    studentId: `std-${Date.now()}`,
    studentName: trimmedName,
    studentEmail: dto.studentEmail.trim().toLowerCase(),
    studentRa: dto.studentRa.trim() || "RA-NA",
    activePiProjectsCount: dto.activePiCount || 0,
    status: "PENDING",
    requestedAt: new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };

  const updatedTeam: Team = {
    ...team,
    participationRequests: [newRequest, ...team.participationRequests],
  };

  return {
    success: true,
    message: `Solicitação de participação enviada com sucesso para o docente responsável.`,
    team: updatedTeam,
  };
}

export function approveParticipationRequest(
  team: Team,
  requestId: string,
  decisionNotes?: string
): TeamActionResult {
  const request = team.participationRequests.find((r) => r.id === requestId);
  if (!request) {
    return { success: false, message: "Solicitação de participação não encontrada." };
  }

  if (request.status !== "PENDING") {
    return {
      success: false,
      message: `Esta solicitação já foi finalizada anteriormente com status: ${request.status}.`,
    };
  }

  if (team.members.length >= team.maxMembers) {
    return {
      success: false,
      message: "Não foi possível aprovar: a equipe atingiu o limite de vagas disponíveis.",
    };
  }

  const newMember = {
    id: request.studentId,
    name: request.studentName,
    email: request.studentEmail,
    role: "Membro" as const,
    joinedAt: new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };

  const now = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const updatedTeam: Team = {
    ...team,
    members: [...team.members, newMember],
    participationRequests: team.participationRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: "APPROVED" as const,
            reviewedAt: now,
            decisionNotes: decisionNotes || "Aprovado pelo docente responsável.",
          }
        : r
    ),
  };

  return {
    success: true,
    message: `Solicitação aprovada! ${request.studentName} foi adicionado à equipe pelo docente.`,
    team: updatedTeam,
  };
}

export function denyParticipationRequest(
  team: Team,
  requestId: string,
  reason: string
): TeamActionResult {
  const request = team.participationRequests.find((r) => r.id === requestId);
  if (!request) {
    return { success: false, message: "Solicitação de participação não encontrada." };
  }

  if (request.status !== "PENDING") {
    return {
      success: false,
      message: `Esta solicitação já foi finalizada anteriormente com status: ${request.status}.`,
    };
  }

  const trimmedReason = reason.trim();
  if (trimmedReason.length < 3) {
    return {
      success: false,
      message: "Por favor, informe a justificativa da negação da solicitação.",
    };
  }

  const now = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const updatedTeam: Team = {
    ...team,
    participationRequests: team.participationRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: "DENIED" as const,
            reviewedAt: now,
            decisionNotes: trimmedReason,
          }
        : r
    ),
  };

  return {
    success: true,
    message: `Solicitação de ${request.studentName} negada pelo docente. Justificativa registrada.`,
    team: updatedTeam,
  };
}

export function removeMemberWithJustification(
  team: Team,
  dto: RemovalDTO
): TeamActionResult {
  const member = team.members.find((m) => m.id === dto.memberId);
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

  const trimmedJustification = (dto.justification || "").trim();
  if (trimmedJustification.length < 5) {
    return {
      success: false,
      message:
        "A remoção de integrantes pelo docente exige justificativa obrigatória com no mínimo 5 caracteres.",
    };
  }

  const updatedTeam: Team = {
    ...team,
    members: team.members.filter((m) => m.id !== dto.memberId),
  };

  return {
    success: true,
    message: `${member.name} foi removido(a) da equipe pelo docente responsável. Motivo: ${trimmedJustification}.`,
    team: updatedTeam,
  };
}

export function removeMember(
  team: Team,
  memberId: string
): TeamActionResult {
  return removeMemberWithJustification(team, {
    memberId,
    justification: "Remoção operacional autorizada pelo docente responsável.",
  });
}

/* =========================================================================
   2. FLUXO COMPLEMENTAR DE CONVITES:
   ========================================================================= */

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
