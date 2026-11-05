"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  authenticate,
  formatCpf,
  isEmailIdentifier,
  validateFirstAccess,
} from "./auth-service";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "first-access">("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Se não for e-mail e começar com dígito, formata como CPF
    if (!isEmailIdentifier(val) && /^[0-9.\- ]*$/.test(val)) {
      setIdentifier(formatCpf(val));
    } else {
      setIdentifier(val);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const result = await authenticate({
        identifier,
        password,
        rememberMe,
      });

      if (result.success && result.redirectUrl) {
        setSuccessMessage(
          `Autenticado com sucesso! Redirecionando para o painel de ${result.user?.role?.toLowerCase()}...`
        );
        setTimeout(() => {
          router.push(result.redirectUrl as string);
        }, 600);
      } else {
        setErrorMessage(result.error || "Não foi possível realizar o login.");
      }
    } catch {
      setErrorMessage("Ocorreu uma falha inesperada na autenticação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFirstAccessSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    const validation = validateFirstAccess({
      cpf: identifier,
      newPassword,
      confirmPassword,
    });

    if (!validation.isValid) {
      setErrorMessage(validation.error || "Verifique os dados informados.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulação / chamada de primeiro acesso (BE-004)
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSuccessMessage(
        "Senha de primeiro acesso criada com sucesso! Agora você pode entrar com sua nova senha."
      );
      setPassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setMode("login");
    } catch {
      setErrorMessage("Não foi possível cadastrar a nova senha no momento. Tente novamente.");
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
          {mode === "login" ? "Entrar na Plataforma Digital" : "Primeiro Acesso — Criar Senha"}
        </h1>
        <p className="login-card-subtitle">
          {mode === "login"
            ? "Acesse com seu CPF (ou e-mail institucional) e sua senha acadêmica."
            : "Estudantes importados pela coordenação devem cadastrar sua senha inicial informando seu CPF."}
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

      {mode === "login" ? (
        <form onSubmit={handleLoginSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="login-identifier" className="form-label">
              CPF ou E-mail Institucional <span className="req">*</span>
            </label>
            <input
              id="login-identifier"
              type="text"
              required
              autoComplete="username"
              placeholder="000.000.000-00 ou usuario@unisenai.edu.br"
              className="form-input"
              value={identifier}
              onChange={handleIdentifierChange}
              disabled={isSubmitting}
              aria-invalid={errorMessage ? "true" : "false"}
            />
          </div>

          <div className="form-group">
            <div className="label-with-link">
              <label htmlFor="login-password" className="form-label">
                Senha <span className="req">*</span>
              </label>
              <button
                type="button"
                className="forgot-password-link btn-link"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(
                    "Esqueceu sua senha? Procure a coordenação ou seu docente responsável para gerar o reset seguro. No próximo acesso você definirá nova senha."
                  );
                }}
              >
                Esqueceu a senha?
              </button>
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

          <div className="auth-secondary-actions">
            <button
              type="button"
              className="btn-secondary-link"
              onClick={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setMode("first-access");
              }}
            >
              Primeiro acesso? Crie sua senha aqui
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleFirstAccessSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="first-access-cpf" className="form-label">
              Seu CPF Cadastrado <span className="req">*</span>
            </label>
            <input
              id="first-access-cpf"
              type="text"
              required
              placeholder="000.000.000-00"
              className="form-input"
              value={identifier}
              onChange={handleIdentifierChange}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-password" className="form-label">
              Criar Nova Senha (mínimo 6 caracteres) <span className="req">*</span>
            </label>
            <input
              id="new-password"
              type="password"
              required
              placeholder="Crie sua nova senha segura"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password" className="form-label">
              Confirmar Nova Senha <span className="req">*</span>
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              placeholder="Digite a nova senha novamente"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Criando senha..." : "Salvar Senha e Voltar ao Login"}
          </button>

          <div className="auth-secondary-actions">
            <button
              type="button"
              className="btn-secondary-link"
              onClick={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setMode("login");
              }}
            >
              Já possui senha? Voltar ao login
            </button>
          </div>
        </form>
      )}

      <footer className="login-card-footer">
        <p>
          Problemas de acesso? Procure a secretaria acadêmica ou contate{" "}
          <Link href="mailto:suporte@unisenai.edu.br" className="footer-support-link">
            suporte@unisenai.edu.br
          </Link>
        </p>
      </footer>
    </div>
  );
}
