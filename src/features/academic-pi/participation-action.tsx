"use client";

import { useState } from "react";
import { requestParticipation } from "./participation-api";

export function ParticipationAction({ projectId }: { projectId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  async function handleRequest() {
    setState("loading"); setMessage("");
    try { await requestParticipation(projectId); setState("success"); setMessage("Solicitação enviada. Acompanhe o andamento em Minhas solicitações."); }
    catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "Não foi possível enviar a solicitação."); }
  }
  return <div className="project-card-action"><button type="button" className="btn btn-primary btn-small" onClick={handleRequest} disabled={state === "loading" || state === "success"}>{state === "loading" ? "Enviando…" : state === "success" ? "Solicitação enviada" : "Solicitar participação"}</button>{message && <p className={state === "error" ? "form-feedback form-feedback-error" : "form-feedback"} role={state === "error" ? "alert" : "status"}>{message}</p>}</div>;
}
