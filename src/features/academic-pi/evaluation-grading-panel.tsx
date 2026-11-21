"use client";

import { FormEvent, useState } from "react";
import { gradeEvaluation } from "./evaluations-api";

export function EvaluationGradingPanel({ evaluationId, rubricVersionId, criteria }: { evaluationId: string; rubricVersionId: string; criteria: Array<{ code: string; label: string }> }) {
  const [scores, setScores] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = criteria.map((criterion) => ({ criterionCode: criterion.code, score: Number(scores[criterion.code]) }));
    if (values.some((value) => !Number.isFinite(value.score) || value.score < 0 || value.score > 10)) {
      setMessage("Informe notas entre 0 e 10 para todos os critérios.");
      return;
    }
    setSaving(true);
    try {
      const result = await gradeEvaluation(evaluationId, { rubricVersionId, scores: values });
      setMessage(`Nota final registrada: ${result.finalScore.toFixed(2)}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível registrar a nota."); }
    finally { setSaving(false); }
  }

  return <form className="auth-form evaluation-grading-panel" onSubmit={submit} aria-label="Registrar notas da avaliação">
    <h3>Registrar notas</h3>
    {criteria.map((criterion) => <label className="form-label" htmlFor={`score-${evaluationId}-${criterion.code}`} key={criterion.code}>{criterion.label}<input id={`score-${evaluationId}-${criterion.code}`} className="form-input" type="number" min="0" max="10" step="0.01" value={scores[criterion.code] ?? ""} onChange={(event) => setScores((current) => ({ ...current, [criterion.code]: event.target.value }))} required /></label>)}
    <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar nota"}</button>
    {message && <p className="projects-empty-copy" role="status">{message}</p>}
  </form>;
}
