"use client";

import { useEffect, useState } from "react";
import { listOwnParticipationRequests, withdrawParticipation, type ParticipationRequest } from "./participation-api";
import { participationStatusLabel } from "./participation-types";
import { DeliverableUpload } from "./deliverable-upload";

export function MyParticipationRequests() {
  const [requests, setRequests] = useState<ParticipationRequest[]>([]);
  const [message, setMessage] = useState("Carregando solicitações…");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  useEffect(() => {
    void listOwnParticipationRequests().then((result) => {
      setRequests(result);
      setMessage(result.length ? "" : "Você ainda não enviou solicitações de participação.");
    }).catch((error: unknown) => {
      setMessage(error instanceof Error ? error.message : "Não foi possível carregar suas solicitações.");
    });
  }, []);
  async function withdraw(id: string) { setLoadingId(id); try { const updated = await withdrawParticipation(id); setRequests((current) => current.map((item) => item.id === id ? updated : item)); } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível registrar a desistência."); } finally { setLoadingId(null); } }
  if (!requests.length) return <p className="projects-empty-copy" role="status">{message}</p>;
  return <div className="participation-list">{requests.map((item) => <article className="participation-row" key={item.id}><div><p className="eyebrow">Projeto {item.projectId.slice(0, 8)}</p><strong>{participationStatusLabel[item.status]}</strong><small>Enviada em {new Date(item.submittedAt).toLocaleDateString("pt-BR")}</small>{item.status === "APPROVED" && <DeliverableUpload projectId={item.projectId} periodId={item.periodId} />}</div>{item.status === "PENDING" && <button type="button" className="btn btn-secondary btn-small" onClick={() => void withdraw(item.id)} disabled={loadingId === item.id}>{loadingId === item.id ? "Atualizando…" : "Desistir"}</button>}</article>)}</div>;
}
