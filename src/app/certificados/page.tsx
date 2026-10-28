import type { Metadata } from "next";
import Link from "next/link";
import { CertificateViewer } from "@/features/extension/certificate-viewer";

export const metadata: Metadata = {
  title: "Certificados e Validação — Plataforma Digital | UniSENAI Sorocaba",
  description:
    "Download e validação pública de certificados de Extensão Universitária e Projetos Integradores por código hash SHA-256 e QR Code.",
};

export const dynamic = "force-dynamic";

export default function CertificatesPage() {
  return (
    <main className="cert-page-wrapper">
      <header className="platform-header">
        <div className="platform-header-content">
          <Link href="/" className="platform-brand" aria-label="UniSENAI - Início">
            <span className="brand-badge">UniSENAI</span>
            <span className="brand-divider">/</span>
            <span className="brand-context">Extensão & Certificados</span>
          </Link>
          <nav aria-label="Navegação do módulo" className="platform-nav">
            <Link href="/" className="nav-link">
              Início
            </Link>
            <span className="nav-link active" aria-current="page">
              Certificados
            </span>
          </nav>
        </div>
      </header>

      <CertificateViewer />

      <footer className="platform-footer">
        <p>
          UniSENAI Sorocaba · Plataforma Digital Institucional · Sistema de Certificação Digital
        </p>
      </footer>
    </main>
  );
}

