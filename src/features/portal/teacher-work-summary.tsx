"use client";

import { useEffect, useState } from "react";
import { listManagedProjects, listProjectParticipationRequests } from "@/features/academic-pi/participation-api";

export function TeacherWorkSummary() {
  const [summary, setSummary] = useState({ projects: 0, pending: 0, decided: 0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    void listManagedProjects().then(async (projects) => {
      const requests = (await Promise.all(projects.map((project) => listProjectParticipationRequests(project.id).catch(() => [])))).flat();
      if (active) setSummary({ projects: projects.length, pending: requests.filter((request) => request.status === "PENDING").length, decided: requests.filter((request) => request.status !== "PENDING").length });
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const value = (number: number) => loading ? "…" : number;
  return <section className="teacher-work-summary" aria-label="Resumo do trabalho docente"><article><span>Projetos sob responsabilidade</span><strong>{value(summary.projects)}</strong><small>Projetos disponíveis para revisão</small></article><article className="teacher-work-summary-priority"><span>Solicitações pendentes</span><strong>{value(summary.pending)}</strong><small>{summary.pending === 1 ? "1 decisão aguardando você" : "Decisões aguardando você"}</small></article><article><span>Solicitações concluídas</span><strong>{value(summary.decided)}</strong><small>Decisões já registradas</small></article></section>;
}
