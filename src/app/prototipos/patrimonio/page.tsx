import type { Metadata } from "next";
import Link from "next/link";
import { AssetsPrototype } from "@/features/assets/assets-prototype";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Protótipo de Gestão Patrimonial (2027.1) | Plataforma Digital",
  description:
    "Protótipo funcional validado pelo PO para gestão patrimonial: inventário de notebooks com QR Code (US14), agendamento de salas e registro de avarias (US15).",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PatrimonioPrototypePage() {
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
              Protótipos 2027.1 • Gestão Patrimonial (FE-023)
            </span>
          </li>
        </ol>
      </nav>

      <AssetsPrototype />
    </main>
  );
}
