import type { Metadata } from "next";
import Link from "next/link";
import { ImpactShowcase } from "@/features/portal/impact-showcase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Impacto Comunitário e Publicação Controlada | Plataforma Digital",
  description:
    "Vitrine pública de impacto comunitário que renderiza exclusivamente conteúdos aprovados e publicados pelo docente responsável, alinhada à SPEC-PORTAL-002 e BE-019.",
};

export default function ImpactoPage() {
  return (
    <main className="proposal-page-container">
      <nav aria-label="Navegação estrutural" className="breadcrumb-nav">
        <ol className="breadcrumb-list">
          <li className="breadcrumb-item">
            <Link href="/" className="breadcrumb-link">
              Início
            </Link>
          </li>
          <li className="breadcrumb-separator" aria-hidden="true">
            /
          </li>
          <li className="breadcrumb-item">
            <span className="breadcrumb-current" aria-current="page">
              Portal Público • Impacto Comunitário (FE-016)
            </span>
          </li>
        </ol>
      </nav>

      <ImpactShowcase />
    </main>
  );
}

