/**
 * FE-021 fixes aplicados:
 *   SEG-01: catch não autentica mais em produção; fallback demo isolado em NODE_ENV=development
 *   SEG-02: detectRoleFromEmail removido como fallback de papel em produção
 *   SEG-05: fetch com AbortSignal.timeout(10_000)
 *   SEG-07: mensagem de sucesso não expõe o papel do usuário
 */
import type { LoginCredentials, LoginResult, UserRole } from "./types";

export const ROLE_REDIRECT_MAP: Record<UserRole, string> = {
  ALUNO:        "/",
  DOCENTE:      "/docente",
  COORDENADOR:  "/coordenacao",
  ADMIN:        "/admin",
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
  return ROLE_REDIRECT_MAP[role] ?? "/";
}

/**
 * SEG-02 — detectRoleFromEmail só é utilizada no fallback de desenvolvimento.
 * Nunca deve ser usada como fonte de papel em produção.
 */
function detectRoleFromEmail(email: string): UserRole {
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
    return { success: false, error: validation.error, errorCode: "VALIDATION_ERROR" };
  }

  try {
    // SEG-05: timeout de 10 s para não ficar pendente indefinidamente
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
        rememberMe: Boolean(credentials.rememberMe),
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (response.ok) {
      const data = await response.json();

      // SEG-02: papel DEVE vir do backend. Se ausente, retorna erro em vez de inferir.
      const role = data.user?.role as UserRole | undefined;
      if (!role || !ROLE_REDIRECT_MAP[role]) {
        return {
          success: false,
          error: "Resposta do servidor inválida. Tente novamente.",
          errorCode: "UNKNOWN_ERROR",
        };
      }

      return {
        success: true,
        user: {
          id: data.user.id ?? "usr-current",
          name: data.user.name ?? credentials.email.split("@")[0].replace(".", " "),
          email: credentials.email.trim().toLowerCase(),
          role,
        },
        redirectUrl: getRedirectPathByRole(role),
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

  } catch (err) {
    // SEG-01: fallback de demo SOMENTE em desenvolvimento.
    // Em produção qualquer falha de rede retorna erro — nunca autentica.
    if (process.env.NODE_ENV === "development") {
      const normalizedEmail = credentials.email.toLowerCase().trim();
      if (credentials.password === "senhaInvalida123") {
        return {
          success: false,
          error: "E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.",
          errorCode: "INVALID_CREDENTIALS",
        };
      }
      // SEG-02: em dev o papel é inferido apenas para demo local
      const detectedRole = detectRoleFromEmail(normalizedEmail);
      return {
        success: true,
        user: {
          id: "usr-demo",
          name: normalizedEmail.split("@")[0].replace(".", " "),
          email: normalizedEmail,
          role: detectedRole,
        },
        redirectUrl: getRedirectPathByRole(detectedRole),
      };
    }

    // Produção: falha de rede ou timeout — nunca autentica silenciosamente
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return {
      success: false,
      error: isTimeout
        ? "O servidor demorou a responder. Verifique sua conexão e tente novamente."
        : "Serviço temporariamente indisponível. Tente novamente em instantes.",
      errorCode: "SERVICE_UNAVAILABLE",
    };
  }
}
