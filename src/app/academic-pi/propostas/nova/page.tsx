import type { Metadata } from "next";
import Link from "next/link";
import { ProposalForm } from "@/features/academic-pi/proposal-form";

export const metadata: Metadata = {
  title: "Nova Proposta de Projeto Integrador | Plataforma Digital",
  description: "Formulário de submissão de proposta de Projeto Integrador com validação de campos e preservação de rascunho.",
};

export default function NovaPropostaPage() {
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
              Projetos Integradores • Nova Proposta
            </span>
          </li>
        </ol>
      </nav>

      <ProposalForm />
    </main>
  );
}
