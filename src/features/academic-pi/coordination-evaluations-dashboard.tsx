"use client";

import { useEffect, useMemo, useState } from "react";
import { listCoordinationEvaluations, type CoordinationEvaluation } from "./evaluations-api";

const formatDate = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short", hour12: false });

export function CoordinationEvaluationsDashboard() {
  const [items, setItems] = useState<CoordinationEvaluation[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "DONE">("ALL");
  const [message, setMessage] = useState("Carregando avaliações…");
  useEffect(() => { let active = true; listCoordinationEvaluations().then((result) => { if (!active) return; setItems(result); setMessage(result.length ? "" : "Nenhuma avaliação atribuída."); }).catch((error: unknown) => { if (active) setMessage(error instanceof Error ? error.message : "Não foi possível carregar as avaliações."); }); return () => { active = false; }; }, []);
  const counts = useMemo(() => ({ all: items.length, pending: items.filter((item) => item.finalScore === null).length, done: items.filter((item) => item.finalScore !== null).length }), [items]);
  const visible = filter === "ALL" ? items : items.filter((item) => filter === "DONE" ? item.finalScore !== null : item.finalScore === null);
  return <div className="management-panel"><div className="request-filter-bar" aria-label="Filtrar avaliações">{(["ALL", "PENDING", "DONE"] as const).map((value) => <button type="button" key={value} className={filter === value ? "filter-chip filter-chip-active" : "filter-chip"} onClick={() => setFilter(value)}>{value === "ALL" ? "Todas" : value === "PENDING" ? "Pendentes" : "Concluídas"} <span>{value === "ALL" ? counts.all : value === "PENDING" ? counts.pending : counts.done}</span></button>)}</div>{message && <p className="projects-empty-copy" role="status">{message}</p>}<div className="evaluation-list" aria-label="Acompanhamento das avaliações">{visible.map((item) => <article className="evaluation-card" key={item.id}><div className="evaluation-card-heading"><div><p className="eyebrow">{item.finalScore === null ? "Pendente" : "Concluída"} · {item.academicTerm}</p><h3>{item.studentName}</h3><small>{item.projectTitle}</small></div><time dateTime={item.evaluationDate}>{formatDate(item.evaluationDate)}</time></div><div className="evaluation-card-meta"><span>{item.finalScore === null ? "Aguardando lançamento" : `Nota final: ${item.finalScore.toFixed(2)}`}</span><span>Avaliadores: {item.evaluatorNames || "Não definidos"}</span></div></article>)}</div></div>;
}
