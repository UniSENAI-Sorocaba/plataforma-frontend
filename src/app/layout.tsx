import type { Metadata } from "next";
import "./styles.css";
import { SessionExpiryRedirect } from "@/components/session-expiry-redirect";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Plataforma Digital | UniSENAI Sorocaba",
  description: "Projetos integradores e extensão universitária em um só lugar.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-type="software" data-site-kind="software">
      <body><SessionExpiryRedirect />{children}</body>
    </html>
  );
}
