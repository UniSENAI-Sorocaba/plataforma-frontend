import Link from "next/link";
import type { StudentHomeData } from "./types";

interface StudentDashboardProps {
  data: StudentHomeData;
}

export function StudentDashboard({ data }: StudentDashboardProps) {
  const { profile, shortcuts, notice } = data;

  return (
    <main className="student-page">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="UniSENAI, página inicial">
          <span className="brand-mark">U</span>
          <span>UniSENAI <small>PLATAFORMA DIGITAL</small></span>
        </Link>
        <nav aria-label="Navegação principal" className="top-nav">
          <a className="active" href="#inicio">Início</a>
          <a href="#atalhos">Minha jornada</a>
          <a href="#atalhos">Ajuda</a>
        </nav>
        <a className="profile-link" href="#perfil">
          <span className="avatar">{profile.initial}</span>
          <span>{profile.name}</span>
        </a>
      </header>

      <section className="welcome" id="inicio" aria-labelledby="welcome-title">
        <div>
          <p className="eyebrow">AMBIENTE DO ALUNO</p>
          <h1 id="welcome-title">Sua jornada começa aqui.</h1>
          <p className="welcome-copy">
            Acesse seus projetos e descubra oportunidades para aprender, criar e transformar.
          </p>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <span>U</span>
          <i />
          <b />
        </div>
      </section>

      <section className="section" id="atalhos" aria-labelledby="shortcuts-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ACESSO RÁPIDO</p>
            <h2 id="shortcuts-title">O que você procura?</h2>
          </div>
          <a className="text-link" href="#atalhos">
            Ver tudo <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="shortcut-grid">
          {shortcuts.map((item) => (
            <a className="shortcut-card" href={item.href} key={item.title}>
              <span className={`shortcut-icon ${item.color}`} aria-hidden="true">
                {item.icon}
              </span>
              <span className="shortcut-title">{item.title}</span>
              <span className="shortcut-description">{item.description}</span>
              <span className="card-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="notice" aria-label="Informação">
        <span className="notice-icon" aria-hidden="true">
          i
        </span>
        <div>
          <strong>{notice.title}</strong>
          <p>{notice.description}</p>
        </div>
      </section>
      <footer>
        UniSENAI Sorocaba <span>•</span> Educação que transforma
      </footer>
    </main>
  );
}
