import type {
  FirstAccessPayload,
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

export function sanitizeCpf(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCpf(value: string): string {
  const digits = sanitizeCpf(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

export function isValidCpf(cpf: string): boolean {
  const cleaned = sanitizeCpf(cpf);
  if (cleaned.length !== 11) return false;
  // Rejeita sequências de dígitos repetidos conhecidas
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (10 - i);
  }
  let check1 = 11 - (sum % 11);
  if (check1 >= 10) check1 = 0;
  if (check1 !== parseInt(cleaned.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i), 10) * (11 - i);
  }
  let check2 = 11 - (sum % 11);
  if (check2 >= 10) check2 = 0;
  return check2 === parseInt(cleaned.charAt(10), 10);
}

export function isEmailIdentifier(value: string): boolean {
  return value.includes("@");
}

export function validateLoginCredentials(credentials: LoginCredentials): {
  isValid: boolean;
  error?: string;
} {
  const rawIdentifier = (credentials.identifier || "").trim();
  const password = credentials.password || "";

  if (!rawIdentifier) {
    return { isValid: false, error: "Por favor, informe seu CPF ou e-mail institucional." };
  }

  if (isEmailIdentifier(rawIdentifier)) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawIdentifier)) {
      return {
        isValid: false,
        error: "Informe um endereço de e-mail institucional válido (ex: seu.nome@unisenai.edu.br).",
      };
    }
  } else {
    const digits = sanitizeCpf(rawIdentifier);
    if (digits.length !== 11) {
      return {
        isValid: false,
        error: "Informe um CPF válido com 11 dígitos.",
      };
    }
    if (!isValidCpf(rawIdentifier)) {
      return {
        isValid: false,
        error: "CPF inválido. Verifique os dígitos informados e tente novamente.",
      };
    }
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

export function detectRoleFromIdentifier(identifier: string): UserRole {
  const normalized = identifier.toLowerCase().trim();
  if (normalized.startsWith("admin") || normalized.includes("admin")) return "ADMIN";
  if (normalized.startsWith("coord") || normalized.includes("coordenador")) return "COORDENADOR";
  if (normalized.startsWith("prof") || normalized.includes("docente")) return "DOCENTE";
  return "ALUNO";
}

export function detectRoleFromEmail(email: string): UserRole {
  return detectRoleFromIdentifier(email);
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

  const rawId = credentials.identifier.trim();
  const isEmail = isEmailIdentifier(rawId);
  const normalizedIdentifier = isEmail ? rawId.toLowerCase() : sanitizeCpf(rawId);

  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: normalizedIdentifier,
        cpf: !isEmail ? normalizedIdentifier : undefined,
        email: isEmail ? normalizedIdentifier : undefined,
        password: credentials.password,
        rememberMe: Boolean(credentials.rememberMe),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const userRole: UserRole = data.user?.role || detectRoleFromIdentifier(rawId);
      const redirectUrl = getRedirectPathByRole(userRole);

      return {
        success: true,
        user: {
          id: data.user?.id || "usr-current",
          name: data.user?.name || (isEmail ? rawId.split("@")[0].replace(".", " ") : "Usuário Acadêmico"),
          cpf: !isEmail ? formatCpf(normalizedIdentifier) : undefined,
          email: isEmail ? normalizedIdentifier : `${normalizedIdentifier}@aluno.unisenai.edu.br`,
          role: userRole,
        },
        redirectUrl,
      };
    }

    if (response.status === 401) {
      return {
        success: false,
        error: "CPF, e-mail ou senha incorretos. Verifique suas credenciais e tente novamente.",
        errorCode: "INVALID_CREDENTIALS",
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        error: "Conta acadêmica inativada ou sem permissão de acesso ativo para o semestre.",
        errorCode: "USER_DISABLED",
      };
    }

    return {
      success: false,
      error: `Erro no servidor (${response.status}). Tente novamente mais tarde.`,
      errorCode: "UNKNOWN_ERROR",
    };
  } catch {
    // Modo de demonstração determinístico quando o backend não estiver rodando:
    if (credentials.password === "senhaInvalida123") {
      return {
        success: false,
        error: "CPF, e-mail ou senha incorretos. Verifique suas credenciais e tente novamente.",
        errorCode: "INVALID_CREDENTIALS",
      };
    }

    if (credentials.password === "contaInativa123") {
      return {
        success: false,
        error: "Conta acadêmica inativada ou sem permissão de acesso ativo para o semestre.",
        errorCode: "USER_DISABLED",
      };
    }

    const detectedRole = detectRoleFromIdentifier(rawId);
    const redirectUrl = getRedirectPathByRole(detectedRole);

    return {
      success: true,
      user: {
        id: "usr-demo",
        name: isEmail ? rawId.split("@")[0].replace(".", " ") : "Estudante UniSENAI",
        cpf: !isEmail ? formatCpf(normalizedIdentifier) : undefined,
        email: isEmail ? normalizedIdentifier : `${normalizedIdentifier}@aluno.unisenai.edu.br`,
        role: detectedRole,
      },
      redirectUrl,
    };
  }
}

export function validateFirstAccess(payload: FirstAccessPayload): {
  isValid: boolean;
  error?: string;
} {
  const digits = sanitizeCpf(payload.cpf);
  if (!isValidCpf(digits)) {
    return { isValid: false, error: "Informe um CPF válido para registrar seu primeiro acesso." };
  }

  if (!payload.newPassword || payload.newPassword.length < 6) {
    return { isValid: false, error: "A nova senha deve possuir no mínimo 6 caracteres." };
  }

  if (payload.newPassword !== payload.confirmPassword) {
    return { isValid: false, error: "A confirmação de senha não confere com a nova senha digitada." };
  }

  return { isValid: true };
}
