"use client";

import { useEffect, useState } from "react";
import { decideParticipation, listManagedProjects, listProjectParticipationRequests, type ParticipationRequest } from "./participation-api";
import { participationStatusLabel } from "./participation-types";
import type { Project } from "./projects-api";

export function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [requests, setRequests] = useState<ParticipationRequest[]>([]);
  const [message, setMessage] = useState("Carregando projetos…");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    void listManagedProjects().then((result) => {
      setProjects(result);
      setSelectedId(result[0]?.id ?? "");
      setMessage(result.length ? "" : "Você não possui projetos sob sua responsabilidade.");
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Não foi possível carregar seus projetos."));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    void listProjectParticipationRequests(selectedId).then((result) => {
      setRequests(result);
      setMessage(result.length ? "" : "Nenhuma solicitação recebida para este projeto.");
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Não foi possível carregar as solicitações."));
  }, [selectedId]);

  async function decide(id: string, status: "APPROVED" | "REJECTED") {
    setLoadingId(id);
    try {
      const updated = await decideParticipation(id, status);
      setRequests((current) => current.map((item) => item.id === id ? updated : item));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar a solicitação.");
    } finally { setLoadingId(null); }
  }

  return <div className="management-panel">
    {projects.length > 0 && <label className="form-label" htmlFor="managed-project">Projeto para acompanhar<select id="managed-project" className="form-input" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{projects.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}</select></label>}
    {message && <p className="projects-empty-copy" role="status">{message}</p>}
    {requests.length > 0 && <div className="participation-list">{requests.map((item) => <article className="participation-row" key={item.id}><div><p className="eyebrow">Aluno {item.studentId.slice(0, 8)} · Período {item.periodId.slice(0, 8)}</p><strong>{participationStatusLabel[item.status]}</strong><small>Recebida em {new Date(item.requestedAt).toLocaleDateString("pt-BR")}</small></div>{item.status === "PENDING" && <div className="management-actions"><button type="button" className="btn btn-primary btn-small" onClick={() => void decide(item.id, "APPROVED")} disabled={loadingId === item.id}>Aprovar</button><button type="button" className="btn btn-secondary btn-small" onClick={() => void decide(item.id, "REJECTED")} disabled={loadingId === item.id}>Recusar</button></div>}</article>)}</div>}
  </div>;
}
