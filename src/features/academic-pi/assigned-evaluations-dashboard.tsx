"use client";

import { useEffect, useState } from "react";
import { EvaluationGradingPanel } from "./evaluation-grading-panel";
import { getDefaultRubric, listAssignedEvaluations, type Evaluation, type Rubric } from "./evaluations-api";

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", hour12: false });
}

export function AssignedEvaluationsDashboard() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [message, setMessage] = useState("Carregando suas avaliações…");

  useEffect(() => {
    Promise.all([listAssignedEvaluations(), getDefaultRubric()])
      .then(([items, defaultRubric]) => { setEvaluations(items); setRubric(defaultRubric); setMessage(items.length ? "" : "Você ainda não tem avaliações atribuídas."); })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Não foi possível carregar suas avaliações."));
  }, []);

  if (message && !evaluations.length) return <p className="projects-empty-copy" role="status">{message}</p>;
  if (!rubric) return <p className="projects-empty-copy" role="status">Nenhuma rubrica está disponível para avaliação.</p>;

  return <div className="assigned-evaluations-list" aria-label="Minhas avaliações">
    {evaluations.map((evaluation) => {
      const isOpen = openId === evaluation.id;
      const hasGrade = evaluation.finalScore !== null && evaluation.finalScore !== undefined;
      return <article className={isOpen ? "evaluation-card evaluation-card-open" : "evaluation-card"} key={evaluation.id}>
        <div className="evaluation-card-heading"><div><p className="eyebrow">{hasGrade ? "Avaliação concluída" : "Avaliação pendente"} · {evaluation.academicTerm ?? "Período acadêmico"}</p><h2>{evaluation.evaluatedStudentName ?? "Aluno sem nome"}</h2><small>{evaluation.projectTitle ?? "Projeto não identificado"} · {evaluation.evaluatedStudentEmail ?? "Participante do projeto"}</small></div><time dateTime={evaluation.evaluationDate}>{formatDate(evaluation.evaluationDate)}</time></div>
        <div className="evaluation-card-meta"><span>{hasGrade ? `Nota final: ${evaluation.finalScore?.toFixed(2)}` : "Aguardando sua avaliação"}</span><button className="btn btn-secondary" type="button" onClick={() => setOpenId(isOpen ? null : evaluation.id)}>{isOpen ? "Fechar avaliação" : hasGrade ? "Revisar nota" : "Avaliar aluno"}</button></div>
        {isOpen && <EvaluationGradingPanel projectId={evaluation.projectId} periodId={evaluation.periodId} evaluationId={evaluation.id} rubricVersionId={rubric.versionId} criteria={rubric.criteria} onGraded={(finalScore) => setEvaluations((current) => current.map((item) => item.id === evaluation.id ? { ...item, finalScore } : item))} />}
      </article>;
    })}
  </div>;
}
