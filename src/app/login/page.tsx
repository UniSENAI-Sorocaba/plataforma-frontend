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
          <span className="brand-badge">UniSENAI</span>
          <span className="brand-context">Sorocaba</span>
        </Link>
        <Link href="/" className="auth-back-link">
          &larr; Voltar ao Portal
        </Link>
      </header>

      <div className="auth-center-container">
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
