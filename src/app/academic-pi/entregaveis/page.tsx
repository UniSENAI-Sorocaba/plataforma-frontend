import type { Metadata } from "next";
import Link from "next/link";
import { DeliverableUpload } from "@/features/academic-pi/deliverable-upload";

export const metadata: Metadata = {
  title: "Upload de Entregáveis de Projeto Integrador | Plataforma Digital",
  description:
    "Envio de entregáveis de Projeto Integrador com barra de progresso, validação de limites e formato real, cancelamento seguro e confirmação SHA-256.",
};

export default function EntregaveisPage() {
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
              Projetos Integradores • Upload de Entregáveis
            </span>
          </li>
        </ol>
      </nav>

      <DeliverableUpload />
    </main>
  );
}

