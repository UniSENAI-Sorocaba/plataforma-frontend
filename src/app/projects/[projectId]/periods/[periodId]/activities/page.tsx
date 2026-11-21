import Link from "next/link";
import { PlatformHeader } from "@/components/platform-header";
import { ActivitiesDashboard } from "@/features/extension/activities-dashboard";

export const metadata = { title: "Atividades e horas | Plataforma Digital", description: "Envie atividades e acompanhe as horas de extensão." };
export default async function ActivitiesPage({ params }: { params: Promise<{ projectId: string; periodId: string }> }) {
  const { projectId, periodId } = await params;
  return <main className="projects-page"><PlatformHeader /><section className="projects-hero" aria-labelledby="activities-title"><p className="eyebrow">Extensão</p><h1 id="activities-title">Atividades e horas</h1><p>Envie informações antes do encerramento do período e acompanhe a decisão vigente.</p></section><section className="projects-list-section"><ActivitiesDashboard projectId={projectId} periodId={periodId} /></section><footer className="site-footer"><span>© 2026 UniSENAI Sorocaba</span><Link href="/projects">Voltar ao catálogo <span aria-hidden="true">↗</span></Link></footer></main>;
}
