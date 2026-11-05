export type UserRole = "ALUNO" | "DOCENTE" | "COORDENADOR" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  cpf?: string;
  email?: string;
  role: UserRole;
  ra?: string;
  department?: string;
}

export interface LoginCredentials {
  identifier: string; // CPF ou e-mail institucional
  password: string;
  rememberMe?: boolean;
}

export interface FirstAccessPayload {
  cpf: string;
  newPassword: string;
  confirmPassword: string;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  redirectUrl?: string;
  error?: string;
  errorCode?: "INVALID_CREDENTIALS" | "USER_DISABLED" | "NETWORK_ERROR" | "VALIDATION_ERROR" | "UNKNOWN_ERROR";
}
