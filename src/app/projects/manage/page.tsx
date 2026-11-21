import Link from "next/link";
import { PlatformHeader } from "@/components/platform-header";
import { ProjectManagement } from "@/features/academic-pi/project-management";

export const metadata = { title: "Gestão de projetos | Plataforma Digital", description: "Acompanhe solicitações de participação dos projetos sob sua responsabilidade." };

export default function ProjectManagementPage() {
  return <main className="projects-page"><PlatformHeader /><section className="projects-hero" data-enter aria-labelledby="management-title"><p className="eyebrow">Área do responsável</p><h1 id="management-title">Acompanhe quem quer participar</h1><p>Selecione um projeto sob sua responsabilidade para revisar solicitações e registrar uma decisão.</p></section><section className="projects-list-section" aria-labelledby="management-list-title"><div className="section-heading"><div><p className="eyebrow">Gestão de participação</p><h2 id="management-list-title">Solicitações recebidas</h2></div></div><ProjectManagement /></section><footer className="site-footer"><span>© 2026 UniSENAI Sorocaba</span><Link href="/projects">Voltar ao catálogo <span aria-hidden="true">↗</span></Link></footer></main>;
}
