"use client";

import { useEffect, useMemo, useState } from "react";
import { readSessionUser } from "@/components/role-guard";
import { decideActivity, listMine, listProjectActivities, submitActivity, totalMine, type Activity } from "./activities-api";

const labels = { SUBMITTED: "Enviada", APPROVED: "Aprovada", REJECTED: "Recusada" } as const;
type ActivityMode = "student" | "teacher";

export function ActivitiesDashboard({ projectId, periodId, mode }: { projectId: string; periodId: string; mode?: ActivityMode }) {
  const resolvedMode = mode ?? (readSessionUser()?.role === "ALUNO" ? "student" : "teacher");
  const teacher = resolvedMode === "teacher";
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | Activity["status"]>("ALL");
  const [message, setMessage] = useState("Carregando atividades…");
  const [form, setForm] = useState({ title: "", description: "", requestedHours: "" });
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = teacher ? listProjectActivities(projectId, periodId) : listMine(projectId, periodId);
    void load.then(async (items) => {
      setActivities(items);
      setMessage(items.length ? "" : teacher ? "Nenhuma atividade aguarda revisão neste período." : "Você ainda não enviou atividades neste período.");
      if (!teacher) setTotal((await totalMine(projectId, periodId)).approvedHours);
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Não foi possível carregar as atividades."));
  }, [projectId, periodId, teacher]);

  const visibleActivities = useMemo(() => statusFilter === "ALL" ? activities : activities.filter((item) => item.status === statusFilter), [activities, statusFilter]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true);
    try { const item = await submitActivity(projectId, periodId, { ...form, requestedHours: Number(form.requestedHours) }); setActivities((current) => [...current, item]); setForm({ title: "", description: "", requestedHours: "" }); setMessage("Atividade enviada para revisão."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível enviar a atividade."); }
    finally { setBusy(false); }
  }

  async function decide(item: Activity, status: "APPROVED" | "REJECTED") {
    const reason = status === "REJECTED" ? rejectionReason[item.id]?.trim() : null;
    if (status === "REJECTED" && !reason) { setMessage("Informe o motivo da recusa antes de continuar."); return; }
    setBusy(true);
    try { const updated = await decideActivity(item.id, status, status === "APPROVED" ? item.requestedHours : null, reason); setActivities((current) => current.map((entry) => entry.id === item.id ? updated : entry)); setMessage(status === "APPROVED" ? "Atividade aprovada." : "Atividade recusada com justificativa."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível registrar a decisão."); }
    finally { setBusy(false); }
  }

  return <div className="management-panel"><div className="panel-heading"><div><p className="eyebrow">Atividades e horas</p><h2>{teacher ? "Revisão das atividades" : "Minhas atividades"}</h2></div>{total !== null && <strong>{total} h aprovadas</strong>}</div>
    {!teacher && <form onSubmit={submit} className="auth-form"><label className="form-label" htmlFor="activity-title">Título<input id="activity-title" className="form-input" required minLength={3} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label className="form-label" htmlFor="activity-description">Descrição<textarea id="activity-description" className="form-input" required minLength={10} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label className="form-label" htmlFor="activity-hours">Horas solicitadas<input id="activity-hours" className="form-input" type="number" min="0.25" max="100" step="0.25" required value={form.requestedHours} onChange={(event) => setForm({ ...form, requestedHours: event.target.value })} /></label><button className="btn btn-primary" type="submit" disabled={busy}>Enviar atividade</button></form>}
    {teacher && <div className="request-filter-bar" aria-label="Filtrar atividades">{(["ALL", "SUBMITTED", "APPROVED", "REJECTED"] as const).map((value) => <button type="button" key={value} className={statusFilter === value ? "filter-chip filter-chip-active" : "filter-chip"} onClick={() => setStatusFilter(value)}>{value === "ALL" ? "Todas" : labels[value]} <span>{value === "ALL" ? activities.length : activities.filter((item) => item.status === value).length}</span></button>)}</div>}
    {message && <p role="status">{message}</p>}
    <div className="participation-list">{visibleActivities.map((item) => <article className="participation-row activity-row" key={item.id}><div><strong>{item.title}</strong><small>{teacher ? `Aluno ${item.studentName ?? "não identificado"}${item.studentEmail ? ` · ${item.studentEmail}` : ""} · ` : ""}{item.description}</small><small>{labels[item.status]} · {item.approvedHours ?? item.requestedHours} h{item.rejectionReason ? ` · ${item.rejectionReason}` : ""}</small></div>{teacher && item.status === "SUBMITTED" && <div className="management-actions activity-decision"><input className="form-input" aria-label={`Motivo da recusa para ${item.title}`} placeholder="Motivo da recusa (se necessário)" value={rejectionReason[item.id] ?? ""} onChange={(event) => setRejectionReason((current) => ({ ...current, [item.id]: event.target.value }))} /><button className="btn btn-primary btn-small" type="button" disabled={busy} onClick={() => void decide(item, "APPROVED")}>Aprovar</button><button className="btn btn-secondary btn-small" type="button" disabled={busy} onClick={() => void decide(item, "REJECTED")}>Recusar</button></div>}</article>)}</div></div>;
}
