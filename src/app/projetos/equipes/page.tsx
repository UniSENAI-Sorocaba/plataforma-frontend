import type { Metadata } from "next";
import Link from "next/link";
import { TeamManagement } from "@/features/academic-pi/team-management";

export const metadata: Metadata = {
  title: "Gestão de Equipe — Projetos Integradores | UniSENAI",
  description:
    "Gerencie integrantes, convites, aceite, recusa e remoção de membros para equipes de Projeto Integrador do UniSENAI Sorocaba.",
};

export const dynamic = "force-dynamic";

export default function TeamManagementPage() {
  return (
    <main className="team-page-wrapper">
      <header className="platform-header">
        <div className="platform-header-content">
          <Link href="/" className="platform-brand" aria-label="UniSENAI - Início">
            <span className="brand-badge">UniSENAI</span>
            <span className="brand-divider">/</span>
            <span className="brand-context">Projetos Integradores</span>
          </Link>
          <nav aria-label="Navegação de Projetos" className="platform-nav">
            <Link href="/" className="nav-link">
              Início
            </Link>
            <span className="nav-link active" aria-current="page">
              Gestão de Equipe
            </span>
          </nav>
        </div>
      </header>

      <div className="page-breadcrumb-container">
        <nav aria-label="Trilha de navegação (Breadcrumbs)" className="breadcrumbs">
          <ol>
            <li>
              <Link href="/">Início</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <span>Projetos Integradores</span>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">
              <strong>Gestão de Equipe</strong>
            </li>
          </ol>
        </nav>
      </div>

      <TeamManagement />

      <footer className="platform-footer">
        <p>
          UniSENAI Sorocaba — Plataforma Digital · Gestão Acadêmica de Projetos Integradores
        </p>
      </footer>
    </main>
  );
}
