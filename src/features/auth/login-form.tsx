"use client";

import React, { useState } from "react";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const result = await authenticate({
        email,
        password,
        rememberMe,
      });

      if (result.success && result.redirectUrl) {
        setSuccessMessage(
          `Autenticado com sucesso! Redirecionando para o painel de ${result.user?.role?.toLowerCase()}...`
        );
        setTimeout(() => {
          router.push(result.redirectUrl as string);
        }, 800);
      } else {
        setErrorMessage(result.error || "Não foi possível realizar o login.");
      }
    } catch {
      setErrorMessage("Ocorreu uma falha inesperada na autenticação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-card" role="region" aria-labelledby="login-heading">
      <header className="login-card-header">
        <div className="login-brand-badge" aria-hidden="true">
          UniSENAI
        </div>
        <h1 id="login-heading" className="login-card-title">
          Entrar na Plataforma Digital
        </h1>
        <p className="login-card-subtitle">
          Utilize suas credenciais institucionais para acessar seus projetos e serviços.
        </p>
      </header>

      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          className="auth-alert auth-alert-error"
        >
          <span className="auth-alert-icon" aria-hidden="true">
            ⚠
          </span>
          <div className="auth-alert-text">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="auth-alert auth-alert-success"
        >
          <span className="auth-alert-icon" aria-hidden="true">
            ✓
          </span>
          <div className="auth-alert-text">{successMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
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
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            aria-invalid={errorMessage ? "true" : "false"}
          />
        </div>

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
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
              tabIndex={0}
            >
              {showPassword ? "Ocultar" : "Exibir"}
            </button>
          </div>
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
