import Link from "next/link";
import { EvaluationAssignmentDashboard } from "@/features/academic-pi/evaluation-assignment-dashboard";

export const metadata = { title: "Avaliações | Plataforma Digital", description: "Atribua avaliadores vinculados a um projeto e período." };

export default async function EvaluationsPage({ params }: { params: Promise<{ projectId: string; periodId: string }> }) {
  const { projectId, periodId } = await params;
  return <main className="projects-page"><header className="site-header projects-header"><Link href="/" className="site-brand" aria-label="UniSENAI Sorocaba — início"><span className="brand-mark" aria-hidden="true">U</span><span><strong>UniSENAI</strong><small>Sorocaba</small></span></Link><nav aria-label="Navegação principal"><Link href="/projects" className="text-link">Projetos</Link><Link href="/login" className="btn btn-primary btn-small">Entrar</Link></nav></header><section className="projects-hero" aria-labelledby="evaluations-title"><p className="eyebrow">Avaliação acadêmica</p><h1 id="evaluations-title">Avaliadores e vínculos</h1><p>Registre uma atribuição válida para um participante e os avaliadores vinculados ao projeto.</p></section><section className="projects-list-section"><EvaluationAssignmentDashboard projectId={projectId} periodId={periodId} /></section><footer className="site-footer"><span>© 2026 UniSENAI Sorocaba</span><Link href="/projects">Voltar ao catálogo <span aria-hidden="true">↗</span></Link></footer></main>;
}
