import { AuthenticatedShell } from "@/components/authenticated-shell";
import { OpportunityList } from "@/features/extension/opportunity-list";
import { listExtensionOpportunities } from "@/features/extension/opportunities-api";

export const metadata = {
  title: "Editais de extensão | Plataforma Digital",
  description: "Consulte oportunidades de extensão e realize sua inscrição dentro da janela publicada.",
};
export const dynamic = "force-dynamic";

export default async function ExtensionPage() {
  const opportunities = await listExtensionOpportunities();
  return <AuthenticatedShell active="extension"><div className="projects-content" id="conteudo-extensao"><section className="projects-hero" data-enter aria-labelledby="extension-title"><p className="eyebrow">Extensão</p><h1 id="extension-title">Editais abertos</h1><p>Encontre oportunidades publicadas e inscreva-se dentro do período informado. A confirmação aparece imediatamente na sua tela.</p></section><section className="projects-list-section" aria-labelledby="extension-list-title"><div className="section-heading"><div><p className="eyebrow">Oportunidades</p><h2 id="extension-list-title">Próximas inscrições</h2></div><span className="section-index">{opportunities.length.toString().padStart(2, "0")}</span></div><OpportunityList opportunities={opportunities} /></section></div></AuthenticatedShell>;
}
