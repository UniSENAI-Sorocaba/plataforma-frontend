const requests = [
  { id: "PI-2026-014", student: "Mariana Costa", project: "Tecnologia assistiva para aprendizagem", submitted: "22 out, 2026", hours: 24, status: "Aguardando análise" },
  { id: "PI-2026-011", student: "Lucas Ferreira", project: "Horta inteligente para espaços urbanos", submitted: "20 out, 2026", hours: 18, status: "Aguardando análise" },
  { id: "PI-2026-008", student: "Ana Beatriz Lima", project: "Reuso de água em ambientes escolares", submitted: "18 out, 2026", hours: 32, status: "Aguardando análise" },
];

export function FacultyDashboard() {
  return (
    <main className="faculty-page">
      <header className="faculty-header">
        <a className="faculty-brand" href="/" aria-label="UniSENAI, início">
          <span className="faculty-brand-mark">U</span>
          <span>UniSENAI <small>ÁREA DOCENTE</small></span>
        </a>
        <nav aria-label="Navegação docente" className="faculty-nav">
          <a className="selected" href="#solicitacoes">Solicitações</a>
          <a href="#horas">Horas</a>
        </nav>
        <span className="faculty-avatar" aria-label="Perfil docente">D</span>
      </header>

      <section className="faculty-intro" aria-labelledby="faculty-title">
        <p className="faculty-eyebrow">PAINEL DOCENTE</p>
        <h1 id="faculty-title">Acompanhe os projetos dos seus alunos.</h1>
        <p>Revise as solicitações, registre sua decisão e acompanhe as horas informadas.</p>
      </section>

      <section className="hours-overview" id="horas" aria-label="Resumo de horas">
        <div><span className="hours-label">Solicitações aguardando</span><strong>{requests.length}</strong></div>
        <div><span className="hours-label">Horas em análise</span><strong>{requests.reduce((sum, request) => sum + request.hours, 0)} <small>h</small></strong></div>
        <p>Resumo demonstrativo; cálculo e atualização aguardam confirmação do contrato BE-014.</p>
      </section>

      <section className="requests-section" id="solicitacoes" aria-labelledby="requests-title">
        <div className="requests-heading"><div><p className="faculty-eyebrow">REVISÃO</p><h2 id="requests-title">Solicitações de projeto</h2></div><span className="request-count">{requests.length} aguardando</span></div>
        <div className="request-list">
          {requests.map((request) => <article className="request-card" key={request.id}>
            <div className="request-meta"><span>{request.id}</span><span className="status-pill">{request.status}</span></div>
            <h3>{request.project}</h3>
            <p className="student-line">Solicitado por <strong>{request.student}</strong> · {request.submitted}</p>
            <div className="request-hours"><span>Horas informadas</span><strong>{request.hours} h</strong></div>
            <form className="decision-form" action="#solicitacoes">
              <label htmlFor={`decision-${request.id}`}>Decisão</label>
              <select id={`decision-${request.id}`} name={`decision-${request.id}`} defaultValue="" required>
                <option value="" disabled>Selecione uma decisão</option>
                <option value="approved">Aprovar</option>
                <option value="rejected">Solicitar ajuste / reprovar</option>
              </select>
              <label htmlFor={`reason-${request.id}`}>Motivo ou observação</label>
              <textarea id={`reason-${request.id}`} name={`reason-${request.id}`} rows={3} placeholder="Descreva o motivo da decisão" />
              <button type="submit">Registrar decisão</button>
            </form>
          </article>)}
        </div>
      </section>
      <footer className="faculty-footer">UniSENAI Sorocaba <span>•</span> Painel docente</footer>
    </main>
  );
}
