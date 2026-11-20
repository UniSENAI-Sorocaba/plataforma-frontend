import Link from "next/link";
import { OpportunityList } from "@/features/extension/opportunity-list";
import { listExtensionOpportunities } from "@/features/extension/opportunities-api";

export const metadata = {
  title: "Editais de extensão | Plataforma Digital",
  description: "Consulte oportunidades de extensão e realize sua inscrição dentro da janela publicada.",
};

export default async function ExtensionPage() {
  const opportunities = await listExtensionOpportunities();
  return <main className="projects-page">
    <a className="skip-link" href="#conteudo-extensao">Pular para o conteúdo</a>
    <header className="site-header projects-header"><Link href="/" className="site-brand" aria-label="UniSENAI Sorocaba — início"><span className="brand-mark" aria-hidden="true">U</span><span><strong>UniSENAI</strong><small>Sorocaba</small></span></Link><nav aria-label="Navegação principal"><Link href="/projects" className="text-link">Projetos</Link><Link href="/login" className="btn btn-primary btn-small">Entrar</Link></nav></header>
    <div id="conteudo-extensao"><section className="projects-hero" data-enter aria-labelledby="extension-title"><p className="eyebrow">Extensão</p><h1 id="extension-title">Editais abertos</h1><p>Encontre oportunidades publicadas e inscreva-se dentro do período informado. A confirmação aparece imediatamente na sua tela.</p></section><section className="projects-list-section" aria-labelledby="extension-list-title"><div className="section-heading"><div><p className="eyebrow">Oportunidades</p><h2 id="extension-list-title">Próximas inscrições</h2></div><span className="section-index">{opportunities.length.toString().padStart(2, "0")}</span></div><OpportunityList opportunities={opportunities} /></section></div>
    <footer className="site-footer"><span>© 2026 UniSENAI Sorocaba</span><Link href="/">Início <span aria-hidden="true">↗</span></Link></footer>
  </main>;
}
