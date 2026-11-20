import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = {
  title: "Login — Plataforma Digital | UniSENAI Sorocaba",
  description:
    "Acesso autenticado de alunos, docentes, coordenadores e administradores da Plataforma Digital UniSENAI Sorocaba.",
};

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="auth-page-wrapper">
      <header className="auth-top-nav">
        <Link href="/" className="auth-brand" aria-label="UniSENAI - Início">
          <span className="brand-mark" aria-hidden="true">U</span>
          <span><strong>UniSENAI</strong><small>Sorocaba</small></span>
        </Link>
        <Link href="/" className="auth-back-link">
          &larr; Voltar ao Portal
        </Link>
      </header>

      <div className="auth-center-container">
        <aside className="auth-rail" aria-label="Sobre a plataforma">
          <p className="eyebrow">Acesso institucional</p>
          <h1>Seu trabalho acadêmico começa aqui.</h1>
          <p>Entre para acompanhar projetos, extensão e as próximas entregas da sua jornada na UniSENAI.</p>
          <div className="auth-rail-note"><span className="status-dot" aria-hidden="true" /><span><strong>Ambiente protegido</strong><small>Use suas credenciais acadêmicas</small></span></div>
        </aside>
        <LoginForm />
      </div>

      <footer className="auth-page-footer">
        <p>
          UniSENAI Sorocaba · Plataforma Digital Institucional · Projetos Integradores & Extensão
        </p>
      </footer>
    </main>
  );
}
