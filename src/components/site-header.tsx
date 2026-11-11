import Link from "next/link";
export function SiteHeader() {
  return <><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><header className="site-header"><Link className="brand" href="/" aria-label="UniSENAI — início"><span className="brand-mark" aria-hidden="true">U</span><span>UniSENAI<small>Plataforma Digital</small></span></Link><nav aria-label="Navegação principal"><Link href="/catalogo">Catálogo</Link>{process.env.ENABLE_SESSION_DEMO === "true" ? <Link href="/demonstracao/sessao">Sessão · demo</Link> : null}{process.env.ENABLE_PROTOTYPES === "true" ? <Link href="/prototipos/cpa">CPA · protótipo</Link> : null}</nav></header></>;
}
