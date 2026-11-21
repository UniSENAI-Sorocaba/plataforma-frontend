"use client";

import { useState } from "react";
import { AppModal } from "@/components/app-modal";
import { requestParticipation } from "./participation-api";

export function ParticipationAction({ projectId }: { projectId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error" | "conflict">("idle");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState(false);
  const [modal, setModal] = useState<{ title: string; message: string; variant: "success" | "info" | "error" } | null>(null);
  async function handleRequest() {
    setState("loading"); setMessage("");
    try { await requestParticipation(projectId); setState("success"); setMessage("Solicitação enviada. Acompanhe o andamento em Minhas solicitações."); setModal({ title: "Solicitação enviada", message: "Sua solicitação foi registrada e está disponível em Minhas solicitações.", variant: "success" }); }
    catch (error) { const detail = error instanceof Error ? error.message : "Não foi possível enviar a solicitação."; const duplicate = detail.toLowerCase().includes("já existe") || detail.toLowerCase().includes("já foi"); setState(duplicate ? "conflict" : "error"); setMessage(duplicate ? "Você já possui uma solicitação para este projeto e período." : detail); setToast(duplicate); if (!duplicate) setModal({ title: "Não foi possível solicitar", message: detail, variant: "error" }); }
  }
  return <div className="project-card-action"><button type="button" className="btn btn-primary btn-small" onClick={handleRequest} disabled={state === "loading" || state === "success"}>{state === "loading" ? "Enviando…" : state === "success" ? "Solicitação enviada" : "Solicitar participação"}</button>{(toast || modal) && <AppModal title={toast ? "Solicitação já realizada" : modal?.title ?? "Aviso"} message={toast ? message : modal?.message ?? ""} variant={toast ? "info" : modal?.variant ?? "info"} onClose={() => { setToast(false); setModal(null); }} />}</div>;
}
