import Link from "next/link";
import { ProjectManagement } from "@/features/academic-pi/project-management";

export const metadata = { title: "Gestão de projetos | Plataforma Digital", description: "Acompanhe solicitações de participação dos projetos sob sua responsabilidade." };

export default function ProjectManagementPage() {
  return <main className="projects-page"><header className="site-header projects-header"><Link href="/" className="site-brand" aria-label="UniSENAI Sorocaba — início"><span className="brand-mark" aria-hidden="true">U</span><span><strong>UniSENAI</strong><small>Sorocaba</small></span></Link><nav aria-label="Navegação principal"><Link href="/projects" className="text-link">Catálogo</Link><Link href="/login" className="btn btn-primary btn-small">Entrar</Link></nav></header><section className="projects-hero" data-enter aria-labelledby="management-title"><p className="eyebrow">Área do responsável</p><h1 id="management-title">Acompanhe quem quer participar</h1><p>Selecione um projeto sob sua responsabilidade para revisar solicitações e registrar uma decisão.</p></section><section className="projects-list-section" aria-labelledby="management-list-title"><div className="section-heading"><div><p className="eyebrow">Gestão de participação</p><h2 id="management-list-title">Solicitações recebidas</h2></div></div><ProjectManagement /></section><footer className="site-footer"><span>© 2026 UniSENAI Sorocaba</span><Link href="/projects">Voltar ao catálogo <span aria-hidden="true">↗</span></Link></footer></main>;
}
