"use client";

import { FormEvent, useEffect, useState } from "react";
import { createEvaluation, listEvaluations, type Evaluation } from "./evaluations-api";

export function EvaluationAssignmentDashboard({ projectId, periodId }: { projectId: string; periodId: string }) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [evaluatedStudentId, setEvaluatedStudentId] = useState("");
  const [evaluatorIds, setEvaluatorIds] = useState("");
  const [evaluationDate, setEvaluationDate] = useState("");
  const [message, setMessage] = useState("Carregando avaliações…");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    listEvaluations(projectId, periodId)
      .then((items) => {
        if (active) {
          setEvaluations(items);
          setMessage(items.length ? "" : "Nenhuma avaliação atribuída neste período.");
        }
      })
      .catch((error: unknown) => {
        if (active) setMessage(error instanceof Error ? error.message : 'Não foi possível carregar as avaliações.');
      })
      .finally(() => {
        if (active) setMessage((current) => current === "Carregando avaliações…" ? "Nenhuma avaliação atribuída neste período." : current);
      });
    return () => { active = false; };
  }, [projectId, periodId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ids = evaluatorIds.split(/[\s,;]+/).map((id) => id.trim()).filter(Boolean);
    if (!evaluatedStudentId.trim() || !evaluationDate || !ids.length) {
      setMessage("Informe o aluno avaliado, a data e ao menos um avaliador.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createEvaluation(projectId, periodId, {
        evaluatedStudentId: evaluatedStudentId.trim(),
        evaluationDate: new Date(evaluationDate).toISOString(),
        evaluatorIds: ids,
      });
      setEvaluations((current) => [...current, created].sort((a, b) => a.evaluationDate.localeCompare(b.evaluationDate)));
      setEvaluatedStudentId(""); setEvaluatorIds(""); setEvaluationDate("");
      setMessage("Avaliação atribuída com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atribuir a avaliação.");
    } finally { setSubmitting(false); }
  }

  return <div className="management-panel">
    <form className="auth-form" onSubmit={submit} aria-labelledby="evaluation-form-title">
      <h2 id="evaluation-form-title">Atribuir avaliação</h2>
      <p className="projects-empty-copy">O MVP registra somente vínculo, avaliadores e data. Não há banca, sala, agenda ou link.</p>
      <label className="form-label" htmlFor="evaluated-student-id">ID do aluno avaliado<input id="evaluated-student-id" className="form-input" value={evaluatedStudentId} onChange={(event) => setEvaluatedStudentId(event.target.value)} placeholder="UUID do participante" /></label>
      <label className="form-label" htmlFor="evaluation-date">Data da avaliação<input id="evaluation-date" type="datetime-local" className="form-input" value={evaluationDate} onChange={(event) => setEvaluationDate(event.target.value)} /></label>
      <label className="form-label" htmlFor="evaluator-ids">IDs dos avaliadores<input id="evaluator-ids" className="form-input" value={evaluatorIds} onChange={(event) => setEvaluatorIds(event.target.value)} placeholder="UUIDs separados por vírgula" /></label>
      <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? "Atribuindo…" : "Atribuir avaliação"}</button>
    </form>
    {message && <p className="projects-empty-copy" role="status">{message}</p>}
    {evaluations.length > 0 && <div className="participation-list" aria-label="Avaliações atribuídas">{evaluations.map((evaluation) => <article className="participation-row" key={evaluation.id}><div><p className="eyebrow">Aluno {evaluation.evaluatedStudentId.slice(0, 8)} · {new Date(evaluation.evaluationDate).toLocaleString("pt-BR")}</p><strong>{evaluation.evaluatorIds.length} avaliador(es) vinculado(s)</strong><small>{evaluation.evaluatorIds.map((id) => id.slice(0, 8)).join(" · ")}</small></div></article>)}</div>}
  </div>;
}
