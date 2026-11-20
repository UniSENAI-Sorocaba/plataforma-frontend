import Link from 'next/link';

export const dynamic = 'force-dynamic';

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
            Formação de equipes para projetos semestrais, envio e controle de convites, aceite,
            recusa e gestão de integrantes.
          </p>
          <div className="feature-card-footer">
            <Link href="/projetos/equipes" className="btn-primary-link">
              Acessar Gestão de Equipe &rarr;
            </Link>
          </div>
        </article>
        <article className="feature-card">
          <div className="feature-card-header">
            <span className="feature-badge">Academic PI • FE-006</span>
            <h2>Submeter Proposta de PI</h2>
          </div>
          <p>
            Cadastre uma nova proposta de projeto integrador com validação de regras e preservação
            de rascunho.
          </p>
          <div className="feature-card-footer">
            <Link href="/academic-pi/propostas/nova" className="btn-primary-link">
              Acessar Formulário de Proposta &rarr;
            </Link>
          </div>
        </article>
        <article className="feature-card">
          <div className="feature-card-header">
            <span className="feature-badge">Academic PI • FE-011</span>
            <h2>Upload de Entregáveis de PI</h2>
          </div>
          <p>
            Envie relatórios técnicos, documentações e evidências fotográficas com progresso em
            tempo real, validação de assinatura binária, cancelamento e confirmação SHA-256.
          </p>
          <div className="feature-card-footer">
            <Link href="/academic-pi/entregaveis" className="btn-primary-link">
              Acessar Upload de Entregáveis &rarr;
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
