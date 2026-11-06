export const dynamic = "force-dynamic";

export default function DocenteHomePage() {
  return (
    <section aria-labelledby="docente-titulo">
      <h1 id="docente-titulo" className="page-title">
        Painel do Docente
      </h1>
      <p className="page-subtitle">
        Gerencie projetos orientados, solicitações e validações de horas.
      </p>
      {/* TODO AUTH-08-BE: carregar dados reais do docente */}
    </section>
  );
}
