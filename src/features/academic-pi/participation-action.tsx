"use client";

import { useState } from "react";
import { AppToast } from "@/components/app-toast";
import { requestParticipation } from "./participation-api";

export function ParticipationAction({ projectId }: { projectId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error" | "conflict">("idle");
  const [notification, setNotification] = useState<{ title: string; message: string; variant: "success" | "info" | "error" } | null>(null);
  async function handleRequest() {
    setState("loading");
    try { await requestParticipation(projectId); setState("success"); setNotification({ title: "Solicitação enviada", message: "Sua solicitação foi registrada e está disponível em Minhas solicitações.", variant: "success" }); }
    catch (error) { const detail = error instanceof Error ? error.message : "Não foi possível enviar a solicitação."; const duplicate = detail.toLowerCase().includes("já existe") || detail.toLowerCase().includes("já foi"); const notificationMessage = duplicate ? "Você já possui uma solicitação para este projeto e período." : detail; setState(duplicate ? "conflict" : "error"); setNotification({ title: duplicate ? "Solicitação já realizada" : "Não foi possível solicitar", message: notificationMessage, variant: duplicate ? "info" : "error" }); }
  }
  return <div className="project-card-action"><button type="button" className="btn btn-primary btn-small" onClick={handleRequest} disabled={state === "loading" || state === "success"}>{state === "loading" ? "Enviando…" : state === "success" ? "Solicitação enviada" : "Solicitar participação"}</button>{notification && <AppToast title={notification.title} message={notification.message} variant={notification.variant} onDismiss={() => setNotification(null)} />}</div>;
}
