"use client";

import { useState } from "react";
import { applyToExtensionOpportunity, type ExtensionOpportunity } from "./opportunities-api";

function windowLabel(opportunity: ExtensionOpportunity) {
  const start = new Date(opportunity.startsAt).toLocaleDateString("pt-BR");
  const end = new Date(opportunity.endsAt).toLocaleDateString("pt-BR");
  return `${start} a ${end}`;
}

export function OpportunityList({ opportunities }: { opportunities: ExtensionOpportunity[] }) {
  const [states, setStates] = useState<Record<string, "idle" | "loading" | "success" | "error">>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  async function apply(id: string) {
    setStates((current) => ({ ...current, [id]: "loading" }));
    try {
      await applyToExtensionOpportunity(id);
      setStates((current) => ({ ...current, [id]: "success" }));
      setMessages((current) => ({ ...current, [id]: "Inscrição confirmada." }));
    } catch (error) {
      setStates((current) => ({ ...current, [id]: "error" }));
      setMessages((current) => ({ ...current, [id]: error instanceof Error ? error.message : "Não foi possível realizar a inscrição." }));
    }
  }

  if (opportunities.length === 0) return <div className="projects-empty" role="status"><h3>Nenhum edital publicado</h3><p>Novas oportunidades de extensão aparecerão aqui quando forem publicadas.</p></div>;

  return <div className="projects-grid">{opportunities.map((opportunity) => {
    const state = states[opportunity.id] ?? "idle";
    return <article className="project-card" key={opportunity.id}>
      <div className="project-card-top"><span className="project-classification">Extensão</span><span className="status-badge">{opportunity.status === "CLOSED" ? "Encerrado" : "Publicado"}</span></div>
      <h3>{opportunity.title}</h3>
      <p>{opportunity.description}</p>
      <span className="project-continuity">Inscrições: {windowLabel(opportunity)}</span>
      <div className="project-card-action"><button type="button" className="btn btn-primary btn-small" onClick={() => void apply(opportunity.id)} disabled={state === "loading" || state === "success" || opportunity.status === "CLOSED"}>{state === "loading" ? "Enviando…" : state === "success" ? "Inscrição confirmada" : opportunity.status === "CLOSED" ? "Inscrições encerradas" : "Inscrever-se"}</button>{messages[opportunity.id] && <p className={state === "error" ? "form-feedback form-feedback-error" : "form-feedback"} role={state === "error" ? "alert" : "status"}>{messages[opportunity.id]}</p>}</div>
    </article>;
  })}</div>;
}
