"use client";

import React, { useState } from "react";
import { AppModal } from "@/components/app-modal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  authenticate,
  activateFirstAccess,
  formatCpf,
  isEmailIdentifier,
  requestPasswordRecovery,
  resetPassword,
  validateFirstAccess,
} from "./auth-service";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "first-access" | "password-recovery">("login");
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

      if (result.success) {
        window.sessionStorage.setItem("plataforma.loginSuccess", "1");
        router.replace("/");
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
      const result = await activateFirstAccess({ cpf: identifier, newPassword, confirmPassword });
      if (result.success) {
        setSuccessMessage("Senha criada com sucesso. Agora você pode entrar na plataforma.");
        setIdentifier("");
        setNewPassword("");
        setConfirmPassword("");
        setMode("login");
      } else {
        setErrorMessage(result.error || "Não foi possível criar sua senha.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <div className="login-card" role="region" aria-labelledby="login-heading">
      <header className="login-card-header">
        <div className="login-brand-badge" aria-hidden="true">
          UniSENAI
        </div>
        <h1 id="login-heading" className="login-card-title">
          {mode === "login" ? "Entrar na Plataforma Digital" : mode === "first-access" ? "Primeiro Acesso — Criar Senha" : "Redefinir senha"}
        </h1>
        <p className="login-card-subtitle">
          {mode === "login"
            ? "Acesse com seu CPF (ou e-mail institucional) e sua senha acadêmica."
            : mode === "first-access"
              ? "Estudantes importados pela coordenação devem cadastrar sua senha inicial informando seu CPF."
              : "Informe o token recebido e escolha uma nova senha."}
        </p>
      </header>

      {(errorMessage || successMessage) && <AppModal title={errorMessage ? "Não foi possível concluir" : "Operação concluída"} message={errorMessage ?? successMessage ?? ""} variant={errorMessage ? "error" : "success"} onClose={() => { setErrorMessage(null); setSuccessMessage(null); }} />}

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
                  if (!isEmailIdentifier(identifier)) {
                    setErrorMessage("Informe seu e-mail institucional para solicitar a recuperação.");
                    return;
                  }
                  setIsSubmitting(true);
                  void requestPasswordRecovery(identifier).then((result) => {
                    if (result.success) {
                      setSuccessMessage("Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.");
                      setMode("password-recovery");
                    } else {
                      setErrorMessage(result.error || "Não foi possível solicitar a recuperação.");
                    }
                  }).finally(() => setIsSubmitting(false));
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
      ) : mode === "first-access" ? (
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
      ) : (
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (isSubmitting) return;
          setErrorMessage(null);
          setSuccessMessage(null);
          setIsSubmitting(true);
          try {
            const result = await resetPassword({ token: identifier, newPassword, confirmPassword });
            if (result.success) {
              setSuccessMessage("Senha redefinida com sucesso. Agora você pode entrar na plataforma.");
              setIdentifier("");
              setNewPassword("");
              setConfirmPassword("");
              setMode("login");
            } else {
              setErrorMessage(result.error || "Não foi possível redefinir a senha.");
            }
          } finally {
            setIsSubmitting(false);
          }
        }} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="recovery-token" className="form-label">Token recebido por e-mail <span className="req">*</span></label>
            <input id="recovery-token" type="text" required className="form-input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label htmlFor="recovery-password" className="form-label">Nova senha <span className="req">*</span></label>
            <input id="recovery-password" type="password" required className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label htmlFor="recovery-confirm-password" className="form-label">Confirmar nova senha <span className="req">*</span></label>
            <input id="recovery-confirm-password" type="password" required className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={isSubmitting} />
          </div>
          <button type="submit" className="btn-auth-submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? "Redefinindo senha..." : "Redefinir senha"}
          </button>
          <div className="auth-secondary-actions">
            <button type="button" className="btn-secondary-link" onClick={() => { setMode("login"); setErrorMessage(null); setSuccessMessage(null); }}>
              Voltar ao login
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
    </>
  );
}
