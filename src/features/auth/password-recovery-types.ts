/**
 * Tipagens para Recuperação de Senha — AUTH-10-FE
 */

export interface PasswordRecoveryRequest {
  identifier: string; // e-mail institucional ou CPF
}

export interface PasswordRecoveryResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

export type FormStatus = "idle" | "loading" | "success" | "error";
