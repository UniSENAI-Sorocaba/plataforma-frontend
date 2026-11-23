"use client";

import { useEffect, useState } from "react";
import { listStudentEvaluations, type Evaluation } from "./evaluations-api";

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", hour12: false });
}

export function StudentEvaluationsDashboard() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [message, setMessage] = useState("Carregando suas notas…");

  useEffect(() => {
    listStudentEvaluations()
      .then((items) => { setEvaluations(items); setMessage(items.length ? "" : "Nenhuma avaliação foi registrada para você ainda."); })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Não foi possível carregar suas notas."));
  }, []);

  if (message && !evaluations.length) return <p className="projects-empty-copy" role="status">{message}</p>;
  return <div className="evaluation-list" aria-label="Minhas notas">{evaluations.map((evaluation) => {
    const hasGrade = evaluation.finalScore !== null && evaluation.finalScore !== undefined;
    return <article className="evaluation-card" key={evaluation.id}>
      <div className="evaluation-card-heading"><div><p className="eyebrow">{hasGrade ? "Avaliação concluída" : "Avaliação pendente"} · {evaluation.academicTerm ?? "Período acadêmico"}</p><h2>{evaluation.projectTitle ?? "Projeto não identificado"}</h2><small>{hasGrade ? `Avaliada em ${formatDate(evaluation.updatedAt ?? evaluation.evaluationDate)}` : `Agendada para ${formatDate(evaluation.evaluationDate)}`}</small></div><strong className="evaluation-score">{hasGrade ? evaluation.finalScore?.toFixed(2) : "—"}</strong></div>
      <div className="evaluation-card-meta"><span>{hasGrade ? "Nota final" : "A avaliação ainda não foi concluída pelo docente."}</span></div>
    </article>;
  })}</div>;
}
