export type MemberRole = "Líder" | "Membro";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export type RequestStatus = "PENDING" | "APPROVED" | "DENIED";

export type ProjectStatus = "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  joinedAt: string;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  name: string;
  email: string;
  status: InvitationStatus;
  sentAt: string;
}

export interface ParticipationRequest {
  id: string;
  teamId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentRa: string;
  activePiProjectsCount: number; // Limite: max 1 projeto de PI por vez
  status: RequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  decisionNotes?: string;
}

export interface Team {
  id: string;
  name: string;
  projectTitle: string;
  academicTerm: string;
  responsibleTeacher: string;
  status: ProjectStatus;
  maxMembers: number;
  isRegistrationPeriodOpen: boolean;
  members: TeamMember[];
  invitations: TeamInvitation[];
  participationRequests: ParticipationRequest[];
}

export interface InviteMemberDTO {
  name: string;
  email: string;
}

export interface RequestParticipationDTO {
  studentName: string;
  studentEmail: string;
  studentRa: string;
  activePiCount?: number;
}

export interface RemovalDTO {
  memberId: string;
  justification: string;
}

export interface TeamActionResult {
  success: boolean;
  message: string;
  team?: Team;
}
