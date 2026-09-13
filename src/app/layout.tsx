import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Plataforma Digital",
  description: "Projetos Integradores e Extensão Universitária",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
