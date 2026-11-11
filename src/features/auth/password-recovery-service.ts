import type { PasswordRecoveryRequest, PasswordRecoveryResponse } from "./password-recovery-types";

/**
 * Mensagem neutra oficial de confirmação.
 * Por segurança (prevenção contra account enumeration / OWASP ASVS),
 * a mensagem não revela se o e-mail/CPF existe ou não na base de dados.
 */
export const NEUTRAL_RECOVERY_MESSAGE =
  "Se o e-mail ou CPF informado estiver cadastrado em nossa base institucional, enviamos as orientações com o link seguro para redefinição da sua senha. Verifique sua caixa de entrada e pasta de spam.";

/**
 * Validação client-side para o identificador (e-mail institucional ou CPF).
 */
export function validateRecoveryIdentifier(identifier: string): { isValid: boolean; errorMessage?: string } {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return { isValid: false, errorMessage: "Informe seu e-mail institucional ou CPF." };
  }

  // Verifica se é um e-mail com formato básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Ou CPF (apenas números ou formatado: 11 dígitos)
  const cleanCpf = trimmed.replace(/\D/g, "");
  const isCpfFormat = cleanCpf.length === 11;

  if (!emailRegex.test(trimmed) && !isCpfFormat) {
    return {
      isValid: false,
      errorMessage: "Digite um e-mail válido (ex: usuario@unisenai.com.br) ou CPF com 11 dígitos.",
    };
  }

  return { isValid: true };
}

/**
 * Serviço de solicitação de recuperação de senha.
 * Desacoplado para facilitar integração com o contrato AUTH-10-BE quando disponível.
 */
export async function requestPasswordRecovery(
  payload: PasswordRecoveryRequest,
): Promise<PasswordRecoveryResponse> {
  const validation = validateRecoveryIdentifier(payload.identifier);
  if (!validation.isValid) {
    throw new Error(validation.errorMessage);
  }

  // Simulação de chamada assíncrona para backend AUTH-10-BE
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    success: true,
    message: NEUTRAL_RECOVERY_MESSAGE,
    timestamp: new Date().toISOString(),
  };
}
