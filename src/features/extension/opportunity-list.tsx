"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AppToast } from "@/components/app-toast";
import { sessionUserSnapshot, subscribeToSession } from "@/components/role-guard";
import type { UserRole } from "@/features/auth/types";
import { applyToExtensionOpportunity, listOwnExtensionApplications, type ExtensionApplication, type ExtensionOpportunity } from "./opportunities-api";

function windowLabel(opportunity: ExtensionOpportunity) {
  const start = new Date(opportunity.startsAt).toLocaleDateString("pt-BR");
  const end = new Date(opportunity.endsAt).toLocaleDateString("pt-BR");
  return `${start} a ${end}`;
}

export function OpportunityList({ opportunities }: { opportunities: ExtensionOpportunity[] }) {
  const [states, setStates] = useState<Record<string, "idle" | "loading" | "success" | "error">>({});
  const [applications, setApplications] = useState<ExtensionApplication[]>([]);
  const [applicationsLoaded, setApplicationsLoaded] = useState(true);
  const serializedUser = useSyncExternalStore(subscribeToSession, sessionUserSnapshot, () => null);
  const sessionRole = useMemo<UserRole | null>(() => {
    if (!serializedUser) return null;
    try { return (JSON.parse(serializedUser) as Partial<{ role: UserRole }>).role ?? null; } catch { return null; }
  }, [serializedUser]);
  const canApply = sessionRole === "ALUNO";
  const [notification, setNotification] = useState<{ title: string; message: string; variant: "success" | "info" | "error" } | null>(null);

  useEffect(() => {
    if (!canApply) return;
    void listOwnExtensionApplications().then((result) => setApplications(result)).catch(() => setApplications([])).finally(() => setApplicationsLoaded(true));
  }, [canApply]);

  const applicationsByOpportunity = useMemo(() => new Map(applications.map((application) => [application.opportunityId, application])), [applications]);

  async function apply(id: string) {
    setStates((current) => ({ ...current, [id]: "loading" }));
    try {
      await applyToExtensionOpportunity(id);
      const refreshed = await listOwnExtensionApplications();
      setApplications(refreshed);
      setStates((current) => ({ ...current, [id]: "success" }));
      setNotification({ title: "Inscrição confirmada", message: "Inscrição confirmada.", variant: "success" });
    } catch (error) {
      setStates((current) => ({ ...current, [id]: "error" }));
      const detail = error instanceof Error ? error.message : "Não foi possível realizar a inscrição.";
      setNotification({ title: "Não foi possível inscrever", message: detail, variant: "error" });
    }
  }

  if (opportunities.length === 0) return <div className="projects-empty" role="status"><h3>Nenhum edital publicado</h3><p>Novas oportunidades de extensão aparecerão aqui quando forem publicadas.</p></div>;

  const enrolled = opportunities.filter((opportunity) => applicationsByOpportunity.get(opportunity.id)?.status === "SUBMITTED");

  return <>
    {canApply && applicationsLoaded && <section className="extension-enrollments" aria-labelledby="enrollments-title"><div><p className="eyebrow">Minha participação</p><h3 id="enrollments-title">Editais em que você está inscrito</h3></div>{enrolled.length === 0 ? <p className="extension-enrollments-empty">Você ainda não está inscrito em nenhum edital aberto.</p> : <ul>{enrolled.map((opportunity) => <li key={opportunity.id}><span>{opportunity.title}</span><small>Inscrição confirmada</small></li>)}</ul>}</section>}
    <div className="projects-grid">{opportunities.map((opportunity) => {
    const state = states[opportunity.id] ?? "idle";
    const application = applicationsByOpportunity.get(opportunity.id);
    const alreadyApplied = Boolean(application);
    return <article className="project-card" key={opportunity.id}>
      <div className="project-card-top"><span className="project-classification">Extensão</span><span className="status-badge">{opportunity.status === "CLOSED" ? "Encerrado" : "Publicado"}</span></div>
      <h3>{opportunity.title}</h3>
      <p>{opportunity.description}</p>
      <span className="project-continuity">Inscrições: {windowLabel(opportunity)}</span>
      <div className="project-card-action">{canApply ? <button type="button" className="btn btn-primary btn-small" onClick={() => void apply(opportunity.id)} disabled={state === "loading" || state === "success" || alreadyApplied || opportunity.status === "CLOSED"}>{state === "loading" ? "Enviando…" : state === "success" || application?.status === "SUBMITTED" ? "Inscrição confirmada" : application?.status === "WITHDRAWN" ? "Inscrição retirada" : opportunity.status === "CLOSED" ? "Inscrições encerradas" : "Inscrever-se"}</button> : <span className="project-continuity">Consulta institucional</span>}</div>
    </article>;
  })}</div>
    {notification && <AppToast title={notification.title} message={notification.message} variant={notification.variant} onDismiss={() => setNotification(null)} />}
  </>;
}
