"use client";

import { FormEvent, useEffect, useState } from "react";
import { createEvaluation, listEvaluations, listInstitutionalDirectory, listProjectParticipants, type Evaluation, type InstitutionalDirectoryEntry, type ProjectParticipant } from "./evaluations-api";

export function EvaluationAssignmentDashboard({ projectId, periodId }: { projectId: string; periodId: string }) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [participants, setParticipants] = useState<ProjectParticipant[]>([]);
  const [evaluators, setEvaluators] = useState<InstitutionalDirectoryEntry[]>([]);
  const [evaluatorSearch, setEvaluatorSearch] = useState("");
  const [evaluatedStudentId, setEvaluatedStudentId] = useState("");
  const [evaluatorIds, setEvaluatorIds] = useState("");
  const [evaluationDate, setEvaluationDate] = useState("");
  const [evaluationTime, setEvaluationTime] = useState("");
  const [message, setMessage] = useState("Carregando avaliações…");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([listEvaluations(projectId, periodId), listProjectParticipants(projectId, periodId), listInstitutionalDirectory()])
      .then(([items, participantItems, directory]) => {
        if (active) {
          setEvaluations(items);
          setParticipants(participantItems.filter((item) => item.status === "ACTIVE"));
          setEvaluators(directory);
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
    if (!evaluatedStudentId.trim() || !evaluationDate || !evaluationTime || !ids.length) {
      setMessage("Informe o aluno avaliado, a data, o horário e ao menos um avaliador.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createEvaluation(projectId, periodId, {
        evaluatedStudentId: evaluatedStudentId.trim(),
        evaluationDate: new Date(`${evaluationDate}T${evaluationTime}`).toISOString(),
        evaluatorIds: ids,
      });
      setEvaluations((current) => [...current, created].sort((a, b) => a.evaluationDate.localeCompare(b.evaluationDate)));
      setEvaluatedStudentId(""); setEvaluatorIds(""); setEvaluationDate(""); setEvaluationTime("");
      setMessage("Avaliação atribuída com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atribuir a avaliação.");
    } finally { setSubmitting(false); }
  }

  function toggleEvaluator(id: string) {
    const current = evaluatorIds.split(/[\s,;]+/).map((item) => item.trim()).filter(Boolean);
    setEvaluatorIds(current.includes(id) ? current.filter((item) => item !== id).join(", ") : [...current, id].join(", "));
  }

  const visibleEvaluators = evaluators.filter((evaluator) => `${evaluator.fullName} ${evaluator.email}`.toLocaleLowerCase().includes(evaluatorSearch.toLocaleLowerCase().trim()));

  return <div className="management-panel">
    <form className="auth-form" onSubmit={submit} aria-labelledby="evaluation-form-title">
      <h2 id="evaluation-form-title">Atribuir avaliação</h2>
      <p className="projects-empty-copy">Associe o estudante aos docentes responsáveis pela avaliação e informe a data prevista.</p>
      <label className="form-label" htmlFor="evaluated-student-id">Aluno avaliado<select id="evaluated-student-id" className="form-input" value={evaluatedStudentId} onChange={(event) => setEvaluatedStudentId(event.target.value)}><option value="">Selecione um participante</option>{participants.map((participant) => <option value={participant.studentId} key={participant.studentId}>{participant.studentName ?? "Aluno sem nome"}{participant.studentEmail ? ` · ${participant.studentEmail}` : ""}</option>)}</select></label>
      <div className="evaluation-date-fields"><label className="form-label" htmlFor="evaluation-date">Data da avaliação<input id="evaluation-date" type="date" className="form-input" value={evaluationDate} onChange={(event) => setEvaluationDate(event.target.value)} /></label><label className="form-label" htmlFor="evaluation-time">Horário<input id="evaluation-time" type="time" step="60" className="form-input" value={evaluationTime} onChange={(event) => setEvaluationTime(event.target.value)} /></label></div>
      <fieldset className="directory-picker"><legend className="form-label">Avaliadores</legend><label className="sr-only" htmlFor="evaluator-search">Buscar avaliador</label><input id="evaluator-search" className="form-input" value={evaluatorSearch} onChange={(event) => setEvaluatorSearch(event.target.value)} placeholder="Buscar por nome ou e-mail" />{visibleEvaluators.length === 0 ? <p className="projects-empty-copy">Nenhum docente encontrado.</p> : <div className="directory-options">{visibleEvaluators.map((evaluator) => { const selected = evaluatorIds.split(/[\s,;]+/).includes(evaluator.id); return <label className={selected ? "directory-option directory-option-selected" : "directory-option"} key={evaluator.id}><input type="checkbox" checked={selected} onChange={() => toggleEvaluator(evaluator.id)} /><span><strong>{evaluator.fullName}</strong><small>{evaluator.email}</small></span></label>; })}</div>}<small className="form-help">{evaluatorIds ? `${evaluatorIds.split(/[\s,;]+/).filter(Boolean).length} avaliador(es) selecionado(s)` : "Selecione ao menos um docente."}</small></fieldset>
      <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? "Atribuindo…" : "Atribuir avaliação"}</button>
    </form>
    {message && <p className="projects-empty-copy" role="status">{message}</p>}
    {evaluations.length > 0 && <div className="evaluation-list" aria-label="Avaliações atribuídas">{evaluations.map((evaluation) => <article className="evaluation-card" key={evaluation.id}><div className="evaluation-card-heading"><div><p className="eyebrow">Avaliação prevista</p><h3>{evaluation.evaluatedStudentName ?? "Aluno não identificado"}</h3><small>{evaluation.evaluatedStudentEmail ?? "Participante do período"}</small></div><time dateTime={evaluation.evaluationDate}>{new Date(evaluation.evaluationDate).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", hour12: false })}</time></div><div className="evaluation-card-meta"><span>{evaluation.evaluatorDetails?.length ?? evaluation.evaluatorIds.length} docente(s) vinculado(s)</span><span>{evaluation.evaluatorDetails?.map((evaluator) => evaluator.fullName).join(" · ") || "Docentes vinculados"}</span></div></article>)}</div>}
  </div>;
}
