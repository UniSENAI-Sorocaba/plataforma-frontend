export const dynamic = "force-dynamic";

import { EmptyState, StatusBadge, SuccessState } from "@/components/feedback-states";

export default function Home() {
  return (
    <main>
      <p className="eyebrow">UniSENAI Sorocaba</p>
      <h1>Plataforma Digital</h1>
      <p>Projetos Integradores, Extensão Universitária e impacto institucional em um só lugar.</p>
      <section aria-labelledby="status-title" className="foundation-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Fundação</p>
            <h2 id="status-title">Ambiente preparado para a próxima etapa</h2>
          </div>
          <StatusBadge>Base operacional</StatusBadge>
        </div>
        <SuccessState
          title="Estrutura inicial disponível"
          description="Os módulos de Projetos, Extensão e Portal serão conectados às APIs nas próximas fases."
        />
        <EmptyState
          title="Nenhum projeto publicado ainda"
          description="Quando o catálogo público estiver disponível, os projetos aprovados aparecerão aqui."
        />
      </section>
    </main>
  );
}
