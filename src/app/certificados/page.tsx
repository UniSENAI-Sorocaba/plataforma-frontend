import type { Metadata } from "next";
import Link from "next/link";
import { PublicCertificateValidator } from "@/features/extension/public-certificate-validator";

export const metadata: Metadata = { title: "Validar certificado | Plataforma Digital", description: "Validação pública de certificados de extensão emitidos pela UniSENAI Sorocaba." };

export default function CertificatesPage() {
  return <main className="projects-page"><header className="site-header projects-header"><Link href="/" className="site-brand" aria-label="UniSENAI Sorocaba — início"><span className="brand-mark" aria-hidden="true">U</span><span><strong>UniSENAI</strong><small>Sorocaba</small></span></Link><nav aria-label="Navegação principal"><Link href="/projects" className="text-link">Projetos</Link><Link href="/login" className="btn btn-primary btn-small">Entrar</Link></nav></header><section className="projects-list-section"><PublicCertificateValidator /></section><footer className="site-footer"><span>© 2026 UniSENAI Sorocaba</span><Link href="/">Início</Link></footer></main>;
}
