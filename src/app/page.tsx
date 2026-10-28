import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="home-container">
      <header className="home-hero">
        <p className="eyebrow">UniSENAI Sorocaba</p>
        <h1>Plataforma Digital</h1>
        <p className="home-subtitle">
          Projetos Integradores, Extensão Universitária e impacto institucional em um só lugar.
        </p>
      </header>

      <section className="home-features-grid" aria-label="Módulos disponíveis">
        <article className="feature-card">
          <div className="feature-card-header">
            <span className="feature-badge">Projetos Integradores</span>
            <h2>Gestão de Equipe</h2>
          </div>
          <p>
            Formação de equipes para projetos semestrais, envio e controle de convites,
            aceite, recusa e gestão de integrantes.
          </p>
          <div className="feature-card-footer">
            <Link href="/projetos/equipes" className="btn-primary-link">
              Acessar Gestão de Equipe &rarr;
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
