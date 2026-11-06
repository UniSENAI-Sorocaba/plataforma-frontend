import type { Metadata } from "next";
import { headers } from "next/headers";
import NavSidebar from "@/components/nav-sidebar";
import NavHeader from "@/components/nav-header";
import { MOCK_USER } from "@/features/auth/auth-layout.mock";

export const metadata: Metadata = {
  title: "Plataforma Digital — Área Autenticada",
  description: "Projetos Integradores e Extensão Universitária",
};

export default async function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // TODO AUTH-08-BE: substituir MOCK_USER por leitura real de sessão/cookie
  const user = MOCK_USER;

  const headersList = await headers();
  const currentPath =
    headersList.get("x-invoke-path") ??
    headersList.get("x-pathname") ??
    undefined;

  return (
    <>
      {/* Skip link — acessibilidade */}
      <a href="#main-content" className="skip-link">
        Ir para o conteúdo principal
      </a>

      {/*
        Estrutura idêntica ao .html de referência:
          .app   →  grid sidebar | main
          .main  →  coluna: topbar sticky + conteúdo rolável
      */}
      <div className="app">
        <NavSidebar user={user} currentPath={currentPath} />

        <div className="main">
          <NavHeader user={user} />

          <main className="content" id="main-content">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
