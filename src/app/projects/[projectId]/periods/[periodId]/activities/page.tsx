import Link from "next/link";
import { ActivitiesDashboard } from "@/features/extension/activities-dashboard";

export const metadata = { title: "Atividades e horas | Plataforma Digital", description: "Envie atividades e acompanhe as horas de extensão." };
export default async function ActivitiesPage({ params }: { params: Promise<{ projectId: string; periodId: string }> }) {
  const { projectId, periodId } = await params;
  return <main className="projects-page"><header className="site-header projects-header"><Link href="/" className="site-brand" aria-label="UniSENAI Sorocaba — início"><span className="brand-mark" aria-hidden="true">U</span><span><strong>UniSENAI</strong><small>Sorocaba</small></span></Link><nav aria-label="Navegação principal"><Link href="/projects" className="text-link">Projetos</Link><Link href="/login" className="btn btn-primary btn-small">Entrar</Link></nav></header><section className="projects-hero" aria-labelledby="activities-title"><p className="eyebrow">Extensão</p><h1 id="activities-title">Atividades e horas</h1><p>Envie informações antes do encerramento do período e acompanhe a decisão vigente.</p></section><section className="projects-list-section"><ActivitiesDashboard projectId={projectId} periodId={periodId} /></section><footer className="site-footer"><span>© 2026 UniSENAI Sorocaba</span><Link href="/projects">Voltar ao catálogo <span aria-hidden="true">↗</span></Link></footer></main>;
}
