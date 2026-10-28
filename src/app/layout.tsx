import type { Metadata } from "next";
import "./styles.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Plataforma Digital",
  description: "Projetos Integradores e Extensão Universitária",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><SiteHeader />{children}<footer className="site-footer">UniSENAI Sorocaba · Ensino, tecnologia e comunidade</footer></body>
    </html>
  );
}
