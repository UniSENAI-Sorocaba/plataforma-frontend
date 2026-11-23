"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { decideParticipation, listManagedProjects, listProjectParticipationRequests, listProjectPeriods, type EnrollmentPeriod, type ParticipationRequest } from "./participation-api";
import { participationStatusLabel, type ParticipationRequestStatus } from "./participation-types";
import type { Project } from "./projects-api";
import { readSessionUser } from "@/components/role-guard";

type RequestFilter = "ALL" | "PENDING" | "APPROVED" | "DENIED" | "WITHDRAWN";

export function ProjectManagement() {
  const coordinator = readSessionUser()?.role === "COORDENADOR";
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [requests, setRequests] = useState<ParticipationRequest[]>([]);
  const [periods, setPeriods] = useState<EnrollmentPeriod[]>([]);
  const [filter, setFilter] = useState<RequestFilter>("PENDING");
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
    void listProjectPeriods(selectedId).then(setPeriods).catch(() => setPeriods([]));
    void listProjectParticipationRequests(selectedId).then((result) => {
      setRequests(result);
      setMessage("");
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Não foi possível carregar as solicitações."));
  }, [selectedId]);

  const counts = useMemo(() => requests.reduce<Record<string, number>>((result, item) => {
    result[item.status] = (result[item.status] ?? 0) + 1;
    result.ALL = (result.ALL ?? 0) + 1;
    return result;
  }, {}), [requests]);
  const visibleRequests = useMemo(() => filter === "ALL" ? requests : requests.filter((item) => item.status === filter), [filter, requests]);

  async function decide(id: string, status: "APPROVED" | "REJECTED", studentName: string) {
    if (status === "REJECTED" && !window.confirm(`Recusar a solicitação de ${studentName}?`)) return;
    setLoadingId(id);
    try {
      const updated = await decideParticipation(id, status);
      setRequests((current) => current.map((item) => item.id === id ? updated : item));
      setMessage(status === "APPROVED" ? "Solicitação aprovada." : "Solicitação recusada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar a solicitação.");
    } finally { setLoadingId(null); }
  }

  return <div className="management-panel">
    {projects.length > 0 && <label className="form-label" htmlFor="managed-project">Projeto para acompanhar<select id="managed-project" className="form-input" value={selectedId} onChange={(event) => { setPeriods([]); setRequests([]); setMessage("Carregando período e solicitações…"); setSelectedId(event.target.value); setFilter("PENDING"); }}>{projects.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}</select></label>}
    {projects.length > 0 && <section className="management-panel" aria-labelledby="managed-periods-title"><div className="panel-heading"><div><p className="eyebrow">Contexto acadêmico</p><h2 id="managed-periods-title">Períodos e revisões</h2></div></div>{periods.length === 0 ? <p className="projects-empty-copy">Nenhum período disponível para este projeto.</p> : <div className="participation-list">{periods.map((period) => <article className="participation-row" key={period.id}><div><strong>{period.academicTerm}</strong><small>{new Date(period.startsAt).toLocaleDateString("pt-BR")} a {new Date(period.endsAt).toLocaleDateString("pt-BR")}</small></div><div className="management-actions"><Link className="btn btn-secondary btn-small" href={`/projects/${period.projectId}/periods/${period.id}/activities`}>Revisar atividades</Link>{coordinator && <Link className="btn btn-primary btn-small" href={`/projects/${period.projectId}/periods/${period.id}/evaluations`}>Atribuir avaliação</Link>}</div></article>)}</div>}</section>}
    {requests.length > 0 && <div className="request-filter-bar" aria-label="Filtrar solicitações">{(["PENDING", "ALL", "APPROVED", "DENIED"] as RequestFilter[]).map((value) => <button type="button" key={value} className={filter === value ? "filter-chip filter-chip-active" : "filter-chip"} onClick={() => setFilter(value)}>{value === "ALL" ? "Todas" : participationStatusLabel[value as ParticipationRequestStatus]} <span>{counts[value] ?? 0}</span></button>)}</div>}
    {message && <p className="projects-empty-copy" role="status">{message}</p>}
    {requests.length > 0 && visibleRequests.length === 0 && <p className="projects-empty-copy" role="status">Nenhuma solicitação nesta categoria.</p>}
    {visibleRequests.length > 0 && <div className="participation-list" aria-label="Solicitações de participação">{visibleRequests.map((item) => { const studentName = item.studentName ?? "Participante"; return <article className="participation-row" key={item.id}><div><p className="eyebrow">{studentName} · {item.academicTerm ?? "Período acadêmico"}</p><strong>{participationStatusLabel[item.status]}</strong><small>Solicitada em {new Date(item.requestedAt).toLocaleDateString("pt-BR")}{item.studentEmail ? ` · ${item.studentEmail}` : ""}</small></div>{item.status === "PENDING" && <div className="management-actions"><button type="button" className="btn btn-primary btn-small" onClick={() => void decide(item.id, "APPROVED", studentName)} disabled={loadingId === item.id}>{loadingId === item.id ? "Salvando…" : "Aprovar"}</button><button type="button" className="btn btn-secondary btn-small" onClick={() => void decide(item.id, "REJECTED", studentName)} disabled={loadingId === item.id}>Recusar</button></div>}</article>; })}</div>}
  </div>;
}
