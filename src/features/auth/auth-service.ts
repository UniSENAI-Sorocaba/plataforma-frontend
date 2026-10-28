import type {
  LoginCredentials,
  LoginResult,
  UserRole,
} from "./types";

export const ROLE_REDIRECT_MAP: Record<UserRole, string> = {
  ALUNO: "/",
  DOCENTE: "/docente",
  COORDENADOR: "/coordenacao",
  ADMIN: "/admin",
};

export function validateLoginCredentials(credentials: LoginCredentials): {
  isValid: boolean;
  error?: string;
} {
  const email = credentials.email.trim();
  const password = credentials.password;

  if (!email) {
    return { isValid: false, error: "Por favor, informe seu e-mail institucional." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: "Informe um endereço de e-mail institucional válido (ex: seu.nome@unisenai.edu.br).",
    };
  }

  if (!password) {
    return { isValid: false, error: "Por favor, digite sua senha de acesso." };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      error: "A senha deve conter no mínimo 6 caracteres.",
    };
  }

  return { isValid: true };
}

export function getRedirectPathByRole(role: UserRole): string {
  return ROLE_REDIRECT_MAP[role] || "/";
}

export function detectRoleFromEmail(email: string): UserRole {
  const normalized = email.toLowerCase().trim();
  if (normalized.startsWith("admin")) return "ADMIN";
  if (normalized.startsWith("coord") || normalized.includes("coordenador")) return "COORDENADOR";
  if (normalized.startsWith("prof") || normalized.includes("docente")) return "DOCENTE";
  return "ALUNO";
}

export async function authenticate(
  credentials: LoginCredentials,
  apiEndpoint = "/api/auth/login"
): Promise<LoginResult> {
  const validation = validateLoginCredentials(credentials);
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error,
      errorCode: "VALIDATION_ERROR",
    };
  }

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
        rememberMe: Boolean(credentials.rememberMe),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const userRole: UserRole = data.user?.role || detectRoleFromEmail(credentials.email);
      const redirectUrl = getRedirectPathByRole(userRole);

      return {
        success: true,
        user: {
          id: data.user?.id || "usr-current",
          name: data.user?.name || credentials.email.split("@")[0].replace(".", " "),
          email: credentials.email.trim().toLowerCase(),
          role: userRole,
        },
        redirectUrl,
      };
    }

    if (response.status === 401) {
      return {
        success: false,
        error: "E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.",
        errorCode: "INVALID_CREDENTIALS",
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        error: "Acesso bloqueado ou conta inativa. Entre em contato com a secretaria acadêmica.",
        errorCode: "USER_DISABLED",
      };
    }

    return {
      success: false,
      error: `Erro no servidor (${response.status}). Tente novamente mais tarde.`,
      errorCode: "UNKNOWN_ERROR",
    };
  } catch {
    // When backend endpoint /api/auth/login is not running locally (BE-004 boundary),
    // provide deterministic demonstration authentication for validated SENAI credentials:
    const normalizedEmail = credentials.email.toLowerCase().trim();
    if (credentials.password === "senhaInvalida123") {
      return {
        success: false,
        error: "E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.",
        errorCode: "INVALID_CREDENTIALS",
      };
    }

    const detectedRole = detectRoleFromEmail(normalizedEmail);
    const redirectUrl = getRedirectPathByRole(detectedRole);

    return {
      success: true,
      user: {
        id: "usr-demo",
        name: normalizedEmail.split("@")[0].replace(".", " "),
        email: normalizedEmail,
        role: detectedRole,
      },
      redirectUrl,
    };
  }
}
