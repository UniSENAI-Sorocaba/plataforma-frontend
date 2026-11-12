import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main>
      <p className="eyebrow">UniSENAI Sorocaba</p>
      <h1>Plataforma Digital</h1>
      <p>
        Projetos Integradores, Extensão Universitária e impacto institucional em
        um só lugar.
      </p>

      <section className="home-features" aria-label="Acesso Rápido aos Módulos">
        <div className="feature-card">
          <p className="eyebrow">Portal Público • FE-016</p>
          <h2>Impacto Comunitário Publicado</h2>
          <p>
            Vitrine institucional com filtro estrito de versões aprovadas e
            publicadas pelo docente responsável, proteção de dados individuais e
            rastreabilidade de origem auditável.
          </p>
          <Link href="/impacto" className="btn btn-primary">
            Acessar Vitrine de Impacto →
          </Link>
        </div>
      </section>
    </main>
  );
}
