"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordRecovery, validateRecoveryIdentifier } from "./password-recovery-service";
import type { FormStatus } from "./password-recovery-types";

export function PasswordRecoveryForm() {
  const [identifier, setIdentifier] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    const validation = validateRecoveryIdentifier(identifier);
    if (!validation.isValid) {
      setErrorMessage(validation.errorMessage || "Identificador inválido.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const response = await requestPasswordRecovery({ identifier });
      setConfirmationMessage(response.message);
      setStatus("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro inesperado ao processar solicitação.";
      setErrorMessage(msg);
      setStatus("error");
    }
  };

  const handleResetForm = () => {
    setIdentifier("");
    setStatus("idle");
    setErrorMessage("");
    setConfirmationMessage("");
  };

  return (
    <div className="recovery-card">
      <div className="recovery-header">
        <div className="recovery-brand-mark" aria-hidden="true">
          U
        </div>
        <h1 id="recovery-title">Recuperação de Senha</h1>
        <p className="recovery-subtitle">
          Informe seu e-mail institucional ou CPF cadastrado para receber as instruções de acesso.
        </p>
      </div>

      {status === "success" ? (
        <div className="recovery-feedback recovery-feedback--success" role="status" aria-live="polite">
          <div className="feedback-icon" aria-hidden="true">✓</div>
          <div>
            <strong>Instruções Enviadas</strong>
            <p>{confirmationMessage}</p>
          </div>
          <div className="recovery-actions">
            <button
              type="button"
              className="recovery-button recovery-button--secondary"
              onClick={handleResetForm}
            >
              Enviar para outro e-mail ou CPF
            </button>
            <Link href="/" className="recovery-link-button">
              Voltar ao Início
            </Link>
          </div>
        </div>
      ) : (
        <form
          className="recovery-form"
          onSubmit={handleSubmit}
          aria-labelledby="recovery-title"
          noValidate
        >
          {status === "error" && errorMessage && (
            <div className="recovery-feedback recovery-feedback--error" role="alert">
              <span className="feedback-icon" aria-hidden="true">!</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="recovery-identifier">E-mail institucional ou CPF</label>
            <input
              id="recovery-identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              placeholder="ex: usuario@unisenai.com.br ou 000.000.000-00"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (status === "error") {
                  setStatus("idle");
                  setErrorMessage("");
                }
              }}
              disabled={status === "loading"}
              required
              aria-required="true"
              aria-invalid={status === "error"}
            />
            <small className="form-hint">
              Docentes, alunos e colaboradores devem utilizar suas credenciais institucionais UniSENAI.
            </small>
          </div>

          <button
            type="submit"
            className="recovery-button recovery-button--primary"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Enviando solicitação..." : "Recuperar senha"}
          </button>

          <div className="recovery-footer-links">
            <Link href="/" className="text-link">
              ← Voltar à página inicial
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
