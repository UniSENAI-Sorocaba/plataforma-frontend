"use client";
/**
 * FE-021 fixes aplicados:
 *   UX-01: aria-invalid separado por campo (email / senha)
 *   UX-01: aria-describedby apontando para a mensagem de erro do campo correto
 *   SEG-07: mensagem de sucesso não expõe o papel — exibe texto neutro
 *   UX (existente, mantido): isSubmitting desabilita botão + aria-busy
 */
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authenticate } from "./auth-service";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UX-01: erros separados por campo
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Limpa timeout ao desmontar (UX-02 pattern)
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFieldErrors({});
    setGlobalError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const result = await authenticate({ email, password, rememberMe });

      if (result.success && result.redirectUrl) {
        // SEG-07: não expõe o papel na mensagem
        setSuccessMessage("Autenticado com sucesso! Redirecionando...");
        redirectTimerRef.current = setTimeout(() => {
          router.push(result.redirectUrl as string);
        }, 800);
      } else {
        // UX-01: direciona o erro ao campo correto quando possível
        if (result.errorCode === "INVALID_CREDENTIALS") {
          setFieldErrors({
            email: "E-mail ou senha incorretos.",
            password: "E-mail ou senha incorretos.",
          });
        } else {
          setGlobalError(result.error ?? "Não foi possível realizar o login.");
        }
      }
    } catch {
      setGlobalError("Ocorreu uma falha inesperada na autenticação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-card" role="region" aria-labelledby="login-heading">
      <header className="login-card-header">
        <div className="login-brand-badge" aria-hidden="true">UniSENAI</div>
        <h1 id="login-heading" className="login-card-title">
          Entrar na Plataforma Digital
        </h1>
        <p className="login-card-subtitle">
          Utilize suas credenciais institucionais para acessar seus projetos e serviços.
        </p>
      </header>

      {/* Erro global (rede, servidor) */}
      {globalError && (
        <div role="alert" aria-live="assertive" className="auth-alert auth-alert-error">
          <span className="auth-alert-icon" aria-hidden="true">⚠</span>
          <div className="auth-alert-text">{globalError}</div>
        </div>
      )}

      {/* Sucesso */}
      {successMessage && (
        <div role="status" aria-live="polite" className="auth-alert auth-alert-success">
          <span className="auth-alert-icon" aria-hidden="true">✓</span>
          <div className="auth-alert-text">{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Campo e-mail */}
        <div className="form-group">
          <label htmlFor="login-email" className="form-label">
            E-mail Institucional <span className="req">*</span>
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            placeholder="usuario@unisenai.edu.br"
            className="form-input"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            disabled={isSubmitting}
            // UX-01: aria-invalid e aria-describedby apenas quando há erro neste campo
            aria-invalid={fieldErrors.email ? "true" : "false"}
            aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
          />
          {fieldErrors.email && (
            <span id="login-email-error" className="field-error" role="alert">
              {fieldErrors.email}
            </span>
          )}
        </div>

        {/* Campo senha */}
        <div className="form-group">
          <div className="label-with-link">
            <label htmlFor="login-password" className="form-label">
              Senha <span className="req">*</span>
            </label>
            <Link href="/recuperar-senha" className="forgot-password-link">
              Esqueceu a senha?
            </Link>
          </div>
          <div className="password-input-wrapper">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Digite sua senha"
              className="form-input password-input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              disabled={isSubmitting}
              // UX-01: aria-invalid no campo de senha quando o erro é de credenciais
              aria-invalid={fieldErrors.password ? "true" : "false"}
              aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
            >
              {showPassword ? "Ocultar" : "Exibir"}
            </button>
          </div>
          {/* Mensagem de erro no campo senha — visualmente oculta se igual ao do email */}
          {fieldErrors.password && !fieldErrors.email && (
            <span id="login-password-error" className="field-error" role="alert">
              {fieldErrors.password}
            </span>
          )}
        </div>

        <div className="remember-me-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isSubmitting}
              className="checkbox-input"
            />
            <span>Lembrar meu acesso neste dispositivo</span>
          </label>
        </div>

        <button
          type="submit"
          className="btn-auth-submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <span className="btn-loading-state">
              <span className="spinner" aria-hidden="true" />
              <span>Autenticando...</span>
            </span>
          ) : (
            "Entrar"
          )}
        </button>
      </form>

      <footer className="login-card-footer">
        <p>
          Problemas de acesso? Procure o suporte acadêmico ou envie mensagem para{" "}
          <a href="mailto:suporte@unisenai.edu.br" className="footer-support-link">
            suporte@unisenai.edu.br
          </a>
        </p>
      </footer>
    </div>
  );
}
