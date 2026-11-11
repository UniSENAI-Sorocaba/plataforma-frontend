import type { Metadata } from "next";
import { parsePublicSiteUrl } from "@/features/seo/site-url.mjs";
import { WebVitals } from "./web-vitals";
import "./styles.css";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const siteUrl = parsePublicSiteUrl(process.env.SITE_URL);
  return {
    title: "Plataforma Digital",
    description: "Projetos Integradores e Extensão Universitária",
    ...(siteUrl
      ? {
          metadataBase: siteUrl,
          robots: { index: true, follow: true },
        }
      : { robots: { index: false, follow: false } }),
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <WebVitals />
        {children}
      </body>
    </html>
  );
}
