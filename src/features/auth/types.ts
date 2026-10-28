export type UserRole = "ALUNO" | "DOCENTE" | "COORDENADOR" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ra?: string;
  department?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  redirectUrl?: string;
  error?: string;
  errorCode?: "INVALID_CREDENTIALS" | "USER_DISABLED" | "NETWORK_ERROR" | "VALIDATION_ERROR" | "UNKNOWN_ERROR";
}
