"use client";

import { useState } from "react";
import styles from "./enrollment-screen.module.css";

export interface ExtensionActivityOption {
  id: string;
  title: string;
  summary?: string;
  periodLabel: string;
  registrationStatusLabel?: string;
  canRequestEnrollment: boolean;
}

export type ExtensionEnrollmentScreenState = "loading" | "error" | "ready";

export interface ExtensionEnrollmentScreenProps {
  state: ExtensionEnrollmentScreenState;
  activities: readonly ExtensionActivityOption[];
  errorMessage?: string;
  onRetry: () => void;
  onSubmit: (activityId: string) => Promise<string>;
}

export function ExtensionEnrollmentScreen({
  state,
  activities,
  errorMessage,
  onRetry,
  onSubmit,
}: ExtensionEnrollmentScreenProps) {
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [confirmationActivityId, setConfirmationActivityId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedStatus, setSubmittedStatus] = useState("");

  const selectedActivity = activities.find(
    (activity) => activity.id === selectedActivityId,
  );
  const confirmationActivity = activities.find(
    (activity) => activity.id === confirmationActivityId,
  );

  async function confirmEnrollment() {
    if (!confirmationActivity?.canRequestEnrollment || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");
    setSubmittedStatus("");

    try {
      const statusLabel = await onSubmit(confirmationActivity.id);
      setSubmittedStatus(statusLabel);
      setConfirmationActivityId("");
      setSelectedActivityId("");
    } catch {
      setSubmitError(
        "Não foi possível enviar sua solicitação. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Extensão Universitária</p>
        <h1 className={styles.title}>Inscrições em atividades</h1>
        <p className={styles.intro}>
          Consulte as atividades disponíveis e acompanhe o status das suas
          solicitações.
        </p>
      </header>

      {submittedStatus && (
        <p className={styles.notice} role="status" aria-live="polite">
          Solicitação enviada. Status informado pelo sistema: {submittedStatus}
        </p>
      )}

      {submitError && (
        <p className={styles.error} role="alert" aria-live="assertive">
          {submitError}
        </p>
      )}

      {state === "loading" && (
        <p className={styles.notice} role="status" aria-live="polite">
          Carregando atividades…
        </p>
      )}

      {state === "error" && (
        <section className={styles.emptyState} aria-labelledby="load-error-title">
          <h2 id="load-error-title">Não foi possível carregar as atividades</h2>
          <p>{errorMessage || "Verifique sua conexão e tente novamente."}</p>
          <button className={styles.secondaryAction} onClick={onRetry} type="button">
            Tentar novamente
          </button>
        </section>
      )}

      {state === "ready" && activities.length === 0 && (
        <section className={styles.emptyState} aria-labelledby="empty-title">
          <h2 id="empty-title">Nenhuma atividade disponível</h2>
          <p>Quando houver atividades abertas para inscrição, elas aparecerão aqui.</p>
        </section>
      )}

      {state === "ready" && activities.length > 0 && (
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            if (selectedActivity?.canRequestEnrollment) {
              setSubmitError("");
              setConfirmationActivityId(selectedActivity.id);
            }
          }}
        >
          <fieldset className={styles.fieldset}>
            <legend>Selecione uma atividade para solicitar inscrição</legend>
            <div className={styles.activityList}>
              {activities.map((activity) => (
                <label className={styles.activityCard} key={activity.id}>
                  <input
                    checked={selectedActivityId === activity.id}
                    disabled={!activity.canRequestEnrollment || isSubmitting}
                    name="activity"
                    onChange={() => setSelectedActivityId(activity.id)}
                    type="radio"
                    value={activity.id}
                  />
                  <span className={styles.activityBody}>
                    <span className={styles.activityTitle}>{activity.title}</span>
                    {activity.summary && (
                      <span className={styles.activitySummary}>{activity.summary}</span>
                    )}
                    <span className={styles.activityPeriod}>{activity.periodLabel}</span>
                    {activity.registrationStatusLabel && (
                      <span className={styles.status}>
                        Status da inscrição: {activity.registrationStatusLabel}
                      </span>
                    )}
                    {!activity.canRequestEnrollment && (
                      <span className={styles.unavailable}>
                        Inscrição indisponível no momento
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {confirmationActivity && (
            <section
              className={styles.confirmation}
              aria-labelledby="confirm-title"
              aria-live="polite"
            >
              <h2 id="confirm-title">Confirmar solicitação</h2>
              <p>
                Você está solicitando inscrição em{" "}
                <strong>{confirmationActivity.title}</strong>.
              </p>
              <div className={styles.actions}>
                <button
                  className={styles.secondaryAction}
                  disabled={isSubmitting}
                  onClick={() => setConfirmationActivityId("")}
                  type="button"
                >
                  Voltar
                </button>
                <button
                  className={styles.primaryAction}
                  disabled={isSubmitting}
                  onClick={() => void confirmEnrollment()}
                  type="button"
                >
                  {isSubmitting ? "Enviando…" : "Confirmar inscrição"}
                </button>
              </div>
            </section>
          )}

          {!confirmationActivity && (
            <button
              className={styles.primaryAction}
              disabled={!selectedActivity?.canRequestEnrollment || isSubmitting}
              type="submit"
            >
              Continuar
            </button>
          )}
        </form>
      )}
    </main>
  );
}
