"use client";

import { useState, type FormEvent } from "react";
import { validateRubricScores } from "./score-validation.mjs";

export type RubricCriterionInput = {
  id: string;
  label: string;
  minimum: number;
  maximum: number;
  value?: number | null;
};

export type RubricScoreInput = {
  criterionId: string;
  value: number;
};

type RubricScoreFormProps = {
  criteria: RubricCriterionInput[];
  result?: string | null;
  disabled?: boolean;
  onSubmit: (scores: RubricScoreInput[]) => Promise<void>;
};

export function RubricScoreForm({
  criteria,
  result,
  disabled = false,
  onSubmit,
}: RubricScoreFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      criteria
        .filter((criterion) => typeof criterion.value === "number")
        .map((criterion) => [criterion.id, String(criterion.value)]),
    ),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || disabled) return;
    setSubmitError("");

    const validation = validateRubricScores(criteria, values);
    setErrors(validation.errors);
    if (!validation.scores) return;

    setBusy(true);
    try {
      await onSubmit(validation.scores);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Não foi possível salvar a avaliação.");
    } finally {
      setBusy(false);
    }
  }

  if (criteria.length === 0) {
    return <p role="status">Esta rubrica ainda não possui critérios disponíveis.</p>;
  }

  return (
    <form onSubmit={(event) => void submit(event)} aria-busy={busy}>
      <fieldset disabled={disabled || busy} aria-describedby="rubric-score-help">
        <legend>Avaliação da rubrica</legend>
        <p id="rubric-score-help">
          Preencha cada critério dentro dos limites definidos para esta rubrica.
        </p>
        {criteria.map((criterion) => {
          const inputId = `rubric-score-${criterion.id}`;
          const helpId = `${inputId}-help`;
          const errorId = `${inputId}-error`;
          const error = errors[criterion.id];

          return (
            <div key={criterion.id}>
              <label htmlFor={inputId}>{criterion.label}</label>
              <p id={helpId}>
                Limite: {criterion.minimum} a {criterion.maximum}
              </p>
              <input
                id={inputId}
                name={criterion.id}
                type="number"
                inputMode="decimal"
                min={criterion.minimum}
                max={criterion.maximum}
                step="any"
                value={values[criterion.id] ?? ""}
                onChange={(event) => {
                  setValues((current) => ({ ...current, [criterion.id]: event.target.value }));
                  setErrors((current) => {
                    const next = { ...current };
                    delete next[criterion.id];
                    delete next._form;
                    return next;
                  });
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${helpId} ${errorId}` : helpId}
                required
              />
              {error ? <p id={errorId} role="alert">{error}</p> : null}
            </div>
          );
        })}
      </fieldset>
      {errors._form ? <p role="alert">{errors._form}</p> : null}
      {submitError ? <p role="alert">{submitError}</p> : null}
      <button type="submit" disabled={disabled || busy}>
        {busy ? "Salvando avaliação…" : "Salvar avaliação"}
      </button>
      {result ? (
        <p>
          Resultado recebido do servidor: <output aria-live="polite">{result}</output>
        </p>
      ) : null}
    </form>
  );
}
