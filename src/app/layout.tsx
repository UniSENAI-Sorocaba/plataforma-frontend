import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Plataforma Digital | UniSENAI Sorocaba",
  description: "Projetos integradores e extensão universitária em um só lugar.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-type="software" data-site-kind="software">
      <body>{children}</body>
    </html>
  );
}
