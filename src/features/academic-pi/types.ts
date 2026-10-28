export type MemberRole = "Líder" | "Membro";

export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

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

export interface Team {
  id: string;
  name: string;
  projectTitle: string;
  academicTerm: string;
  maxMembers: number;
  members: TeamMember[];
  invitations: TeamInvitation[];
}

export interface InviteMemberDTO {
  name: string;
  email: string;
}

export interface TeamActionResult {
  success: boolean;
  message: string;
  team?: Team;
}
