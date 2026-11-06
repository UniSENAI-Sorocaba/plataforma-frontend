/**
 * FE-021 fix aplicado:
 *   SEG-03: dados de PII (nomes, e-mails, RAs dos membros) são omitidos do payload
 *           persistido no localStorage. O rascunho salva apenas os campos não-sensíveis.
 *           Membros são restaurados como array vazio ao carregar o rascunho, com aviso ao usuário.
 */
import type { DraftState, ProposalFormData } from "./types";
import { canSaveDraft } from "./validation";

export const DRAFT_STORAGE_KEY = "plataforma_pi_proposal_draft_v1";

function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    const testKey = "__draft_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * SEG-03: Remove PII dos membros antes de persistir.
 * Apenas título, tema, modalidade, descrições e ODS são salvos.
 */
function stripPiiFromDraft(data: ProposalFormData): ProposalFormData {
  return {
    ...data,
    // Membros da equipe contêm nome, e-mail e RA — dados pessoais identificáveis.
    // Não são persistidos em localStorage para proteger privacidade em dispositivos compartilhados.
    teamMembers: [],
  };
}

export function saveProposalDraft(data: ProposalFormData): {
  success: boolean;
  savedAt?: string;
  piiStripped?: true;
  error?: string;
} {
  const check = canSaveDraft(data);
  if (!check.allowed) {
    return { success: false, error: check.reason ?? "Rascunho não permitido." };
  }
  if (!isLocalStorageAvailable()) {
    return { success: false, error: "Armazenamento local indisponível neste navegador." };
  }
  try {
    const nowIso = new Date().toISOString();
    const safeData = stripPiiFromDraft(data);
    const payload: DraftState = {
      version: 1,
      savedAt: nowIso,
      data: { ...safeData, lastDraftSavedAt: nowIso },
    };
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    return { success: true, savedAt: nowIso, piiStripped: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro desconhecido ao salvar rascunho.",
    };
  }
}

export function loadProposalDraft(): {
  hasDraft: boolean;
  data?: ProposalFormData;
  savedAt?: string;
  membersCleared?: true;
} {
  if (!isLocalStorageAvailable()) return { hasDraft: false };
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return { hasDraft: false };
    const parsed: DraftState = JSON.parse(raw);
    if (!parsed?.data) return { hasDraft: false };
    return {
      hasDraft: true,
      data: parsed.data,
      savedAt: parsed.savedAt,
      // SEG-03: sinaliza ao caller que membros não foram persistidos
      membersCleared: true,
    };
  } catch {
    return { hasDraft: false };
  }
}

export function clearProposalDraft(): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return "";
  try {
    return new Date(isoString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}
