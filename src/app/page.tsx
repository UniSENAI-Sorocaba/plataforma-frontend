export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main>
      <p className="eyebrow">UniSENAI Sorocaba</p>
      <h1>Plataforma Digital</h1>
      <p>Projetos Integradores, Extensão Universitária e impacto institucional em um só lugar.</p>

      <section className="home-features" aria-label="Acesso Rápido aos Módulos">
        <div className="feature-card">
          <p className="eyebrow">Academic PI • FE-011</p>
          <h2>Upload de Entregáveis de PI</h2>
          <p>
            Envie relatórios técnicos, documentações e evidências fotográficas com
            progresso em tempo real, validação de assinatura binária, cancelamento
            e confirmação SHA-256.
          </p>
          <a href="/academic-pi/entregaveis" className="btn btn-primary">
            Acessar Upload de Entregáveis →
          </a>
        </div>
      </section>
    </main>
  );
}
