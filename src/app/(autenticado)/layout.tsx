import type { Metadata } from "next";
import NavHeader from "@/components/nav-header";
import NavSidebar from "@/components/nav-sidebar";
import { MOCK_USER } from "@/features/auth/auth-layout.mock";

export const metadata: Metadata = {
  title: "Plataforma Digital — Área Autenticada",
  description: "Projetos Integradores e Extensão Universitária",
};

export default function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // TODO AUTH-08-BE: substituir MOCK_USER por leitura real de sessão/cookie
  const user = MOCK_USER;

  return (
    <div className="auth-layout">
      <NavHeader user={user} />
      <div className="auth-layout__body">
        <NavSidebar user={user} />
        <main className="auth-layout__content" id="main-content">
          <a href="#main-content" className="skip-link">
            Ir para o conteúdo principal
          </a>
          {children}
        </main>
      </div>
    </div>
  );
}
