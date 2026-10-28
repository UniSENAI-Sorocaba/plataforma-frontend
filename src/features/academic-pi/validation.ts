import type { ProposalFormData, ProposalModality, TeamMember, ValidationErrors, ValidationResult } from "./types";

export const AVAILABLE_MODALITIES: Array<{ value: ProposalModality; label: string }> = [
  { value: "PI1", label: "Projeto Integrador 1 (Iniciação)" },
  { value: "PI2", label: "Projeto Integrador 2 (Desenvolvimento)" },
  { value: "PI3", label: "Projeto Integrador 3 (Avançado)" },
  { value: "PI4", label: "Projeto Integrador 4 (Conclusão)" },
  { value: "EXTENSAO", label: "Projeto de Extensão Universitária" },
];

export const ODS_LIST = [
  { id: "1", title: "Erradicação da Pobreza" },
  { id: "2", title: "Fome Zero e Agricultura Sustentável" },
  { id: "3", title: "Saúde e Bem-Estar" },
  { id: "4", title: "Educação de Qualidade" },
  { id: "5", title: "Igualdade de Gênero" },
  { id: "6", title: "Água Potável e Saneamento" },
  { id: "7", title: "Energia Limpa e Acessível" },
  { id: "8", title: "Trabalho Decente e Crescimento Econômico" },
  { id: "9", title: "Indústria, Inovação e Infraestrutura" },
  { id: "10", title: "Redução das Desigualdades" },
  { id: "11", title: "Cidades e Comunidades Sustentáveis" },
  { id: "12", title: "Consumo e Produção Responsáveis" },
  { id: "13", title: "Ação Contra a Mudança Global do Clima" },
  { id: "14", title: "Vida na Água" },
  { id: "15", title: "Vida Terrestre" },
  { id: "16", title: "Paz, Justiça e Instituições Eficazes" },
  { id: "17", title: "Parcerias e Meios de Implementação" },
] as const;

export const FIELD_LIMITS = {
  TITLE_MIN: 5,
  TITLE_MAX: 120,
  TEXT_MIN: 20,
  TEXT_MAX: 1000,
  MEMBERS_MIN: 1,
  MEMBERS_MAX: 6,
} as const;

export function getInitialProposalData(): ProposalFormData {
  return {
    title: "",
    theme: "",
    modality: "PI1",
    problemStatement: "",
    objectives: "",
    justification: "",
    ods: [],
    teamMembers: [
      {
        id: "member-1",
        name: "",
        email: "",
        ra: "",
      },
    ],
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RA_REGEX = /^[0-9a-zA-Z]{4,15}$/;

export function validateProposal(data: ProposalFormData): ValidationResult {
  const errors: ValidationErrors = {};

  // 1. Título
  const title = data.title.trim();
  if (!title) {
    errors.title = "O título da proposta é obrigatório.";
  } else if (title.length < FIELD_LIMITS.TITLE_MIN) {
    errors.title = `O título deve ter no mínimo ${FIELD_LIMITS.TITLE_MIN} caracteres.`;
  } else if (title.length > FIELD_LIMITS.TITLE_MAX) {
    errors.title = `O título deve ter no máximo ${FIELD_LIMITS.TITLE_MAX} caracteres.`;
  }

  // 2. Tema
  const theme = data.theme.trim();
  if (!theme) {
    errors.theme = "O tema ou área de concentração é obrigatório.";
  }

  // 3. Modalidade
  const validModalities: ProposalModality[] = ["PI1", "PI2", "PI3", "PI4", "EXTENSAO"];
  if (!validModalities.includes(data.modality)) {
    errors.modality = "Selecione uma modalidade válida de Projeto Integrador ou Extensão.";
  }

  // 4. Declaração do Problema
  const problem = data.problemStatement.trim();
  if (!problem) {
    errors.problemStatement = "A descrição do problema é obrigatória.";
  } else if (problem.length < FIELD_LIMITS.TEXT_MIN) {
    errors.problemStatement = `A descrição do problema deve ter no mínimo ${FIELD_LIMITS.TEXT_MIN} caracteres.`;
  } else if (problem.length > FIELD_LIMITS.TEXT_MAX) {
    errors.problemStatement = `A descrição do problema não pode exceder ${FIELD_LIMITS.TEXT_MAX} caracteres.`;
  }

  // 5. Objetivos
  const objectives = data.objectives.trim();
  if (!objectives) {
    errors.objectives = "Os objetivos do projeto são obrigatórios.";
  } else if (objectives.length < FIELD_LIMITS.TEXT_MIN) {
    errors.objectives = `Os objetivos devem ter no mínimo ${FIELD_LIMITS.TEXT_MIN} caracteres.`;
  } else if (objectives.length > FIELD_LIMITS.TEXT_MAX) {
    errors.objectives = `Os objetivos não podem exceder ${FIELD_LIMITS.TEXT_MAX} caracteres.`;
  }

  // 6. Justificativa
  const justification = data.justification.trim();
  if (!justification) {
    errors.justification = "A justificativa e relevância são obrigatórias.";
  } else if (justification.length < FIELD_LIMITS.TEXT_MIN) {
    errors.justification = `A justificativa deve ter no mínimo ${FIELD_LIMITS.TEXT_MIN} caracteres.`;
  } else if (justification.length > FIELD_LIMITS.TEXT_MAX) {
    errors.justification = `A justificativa não pode exceder ${FIELD_LIMITS.TEXT_MAX} caracteres.`;
  }

  // 7. ODS (Objetivos de Desenvolvimento Sustentável)
  if (!data.ods || data.ods.length === 0) {
    errors.ods = "Selecione pelo menos um ODS (Objetivo de Desenvolvimento Sustentável).";
  }

  // 8. Equipe
  if (!data.teamMembers || data.teamMembers.length < FIELD_LIMITS.MEMBERS_MIN) {
    errors.teamMembers = `A proposta deve ter no mínimo ${FIELD_LIMITS.MEMBERS_MIN} integrante.`;
  } else if (data.teamMembers.length > FIELD_LIMITS.MEMBERS_MAX) {
    errors.teamMembers = `A proposta permite no máximo ${FIELD_LIMITS.MEMBERS_MAX} integrantes na equipe.`;
  } else {
    data.teamMembers.forEach((member: TeamMember, index: number) => {
      const memberName = member.name.trim();
      const memberEmail = member.email.trim();
      const memberRa = member.ra.trim();

      if (!memberName) {
        errors[`member_${index}_name`] = `Informe o nome do integrante #${index + 1}.`;
      } else if (memberName.length < 3) {
        errors[`member_${index}_name`] = `O nome do integrante #${index + 1} deve ter pelo menos 3 caracteres.`;
      }

      if (!memberEmail) {
        errors[`member_${index}_email`] = `Informe o e-mail do integrante #${index + 1}.`;
      } else if (!EMAIL_REGEX.test(memberEmail)) {
        errors[`member_${index}_email`] = `E-mail inválido para o integrante #${index + 1}.`;
      }

      if (!memberRa) {
        errors[`member_${index}_ra`] = `Informe o RA do integrante #${index + 1}.`;
      } else if (!RA_REGEX.test(memberRa)) {
        errors[`member_${index}_ra`] = `RA inválido para o integrante #${index + 1} (somente letras e números).`;
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validação para preservação de rascunho permitido:
 * Um rascunho é elegível para salvamento se contiver pelo menos um dado preliminar preenchido
 * e nenhum campo violar o limite máximo físico de caracteres.
 */
export function canSaveDraft(data: Partial<ProposalFormData>): { allowed: boolean; reason?: string } {
  const hasContent = Boolean(
    data.title?.trim() ||
    data.theme?.trim() ||
    data.problemStatement?.trim() ||
    data.objectives?.trim() ||
    data.justification?.trim() ||
    (data.ods && data.ods.length > 0) ||
    data.teamMembers?.some((m) => m.name.trim() || m.email.trim() || m.ra.trim())
  );

  if (!hasContent) {
    return {
      allowed: false,
      reason: "Não há dados preenchidos para salvar como rascunho.",
    };
  }

  if (data.title && data.title.length > FIELD_LIMITS.TITLE_MAX) {
    return {
      allowed: false,
      reason: `O título excede o limite máximo permitido de ${FIELD_LIMITS.TITLE_MAX} caracteres.`,
    };
  }

  if (data.problemStatement && data.problemStatement.length > FIELD_LIMITS.TEXT_MAX) {
    return {
      allowed: false,
      reason: `A declaração do problema excede o limite máximo de ${FIELD_LIMITS.TEXT_MAX} caracteres.`,
    };
  }

  if (data.objectives && data.objectives.length > FIELD_LIMITS.TEXT_MAX) {
    return {
      allowed: false,
      reason: `Os objetivos excedem o limite máximo de ${FIELD_LIMITS.TEXT_MAX} caracteres.`,
    };
  }

  if (data.justification && data.justification.length > FIELD_LIMITS.TEXT_MAX) {
    return {
      allowed: false,
      reason: `A justificativa excede o limite máximo de ${FIELD_LIMITS.TEXT_MAX} caracteres.`,
    };
  }

  return { allowed: true };
}
