import Link from "next/link";
import { MyParticipationRequests } from "@/features/academic-pi/my-participation-requests";

export const metadata = { title: "Minhas solicitações | Plataforma Digital", description: "Acompanhe suas solicitações de participação em projetos." };

export default function ParticipationRequestsPage() {
  return <main className="projects-page"><header className="site-header projects-header"><Link href="/" className="site-brand" aria-label="UniSENAI Sorocaba — início"><span className="brand-mark" aria-hidden="true">U</span><span><strong>UniSENAI</strong><small>Sorocaba</small></span></Link><nav aria-label="Navegação principal"><Link href="/projects" className="text-link">Projetos</Link><Link href="/login" className="btn btn-primary btn-small">Entrar</Link></nav></header><section className="projects-hero" data-enter aria-labelledby="requests-title"><p className="eyebrow">Área do estudante</p><h1 id="requests-title">Minhas solicitações</h1><p>Acompanhe o status das solicitações enviadas e registre sua desistência enquanto elas estiverem em análise.</p></section><section className="projects-list-section" aria-labelledby="requests-list-title"><div className="section-heading"><div><p className="eyebrow">Participação</p><h2 id="requests-list-title">Histórico recente</h2></div></div><MyParticipationRequests /></section><footer className="site-footer"><span>© 2026 UniSENAI Sorocaba</span><Link href="/projects">Voltar ao catálogo <span aria-hidden="true">↗</span></Link></footer></main>;
}
