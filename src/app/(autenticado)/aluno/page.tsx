export const dynamic = "force-dynamic";

export default function AlunoHomePage() {
  return (
    <section aria-labelledby="aluno-titulo">
      <div className="page-eyebrow">
        <span className="badge badge--red">SEMESTRE 2025/1 – INOVAÇÃO ABERTA</span>
        <span className="page-eyebrow__sep" aria-hidden="true">→</span>
        <span>Engenharia de Software (7ª Fase)</span>
      </div>
      <h1 id="aluno-titulo" className="page-title">
        Olá, bem-vindo! Pronto para iniciar o seu<br />
        Projeto Integrador?
      </h1>
      <p className="page-subtitle">
        O Projeto Integrador conecta a teoria acadêmica a desafios reais do setor
        produtivo. Acompanhe abaixo o fluxo oficial e inicie o cadastro do seu grupo.
      </p>
      {/* TODO AUTH-08-BE: carregar dados reais do aluno */}
    </section>
  );
}
