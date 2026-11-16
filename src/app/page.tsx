export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main>
      <p className="eyebrow">UniSENAI Sorocaba</p>
      <h1>Plataforma Digital</h1>
      <p>Projetos Integradores, Extensão Universitária e impacto institucional em um só lugar.</p>

      <section className="home-features" aria-label="Acesso Rápido aos Módulos">
        <div className="feature-card">
          <p className="eyebrow">Academic PI • FE-006</p>
          <h2>Submeter Proposta de PI</h2>
          <p>Cadastre uma nova proposta de projeto integrador com validação de regras e preservação de rascunho.</p>
          <a href="/academic-pi/propostas/nova" className="btn btn-primary">
            Acessar Formulário de Proposta →
          </a>
        </div>
      </section>
    </main>
  );
}
