export type ProposalModality = "PI1" | "PI2" | "PI3" | "PI4" | "EXTENSAO";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  ra: string;
}

export interface ProposalFormData {
  title: string;
  theme: string;
  modality: ProposalModality;
  problemStatement: string;
  objectives: string;
  justification: string;
  ods: string[];
  teamMembers: TeamMember[];
  lastDraftSavedAt?: string;
}

export type ValidationErrors = Partial<Record<keyof ProposalFormData | `member_${number}_${keyof TeamMember}`, string>>;

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

export interface DraftState {
  data: ProposalFormData;
  savedAt: string;
  version: number;
}
