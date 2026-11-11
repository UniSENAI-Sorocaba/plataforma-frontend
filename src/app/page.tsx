import type { Metadata } from "next";
import { parsePublicSiteUrl } from "@/features/seo/site-url.mjs";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const siteUrl = parsePublicSiteUrl(process.env.SITE_URL);
  return siteUrl ? { alternates: { canonical: siteUrl } } : {};
}

export default function Home() {
  return (
    <main>
      <p className="eyebrow">UniSENAI Sorocaba</p>
      <h1>Plataforma Digital</h1>
      <p>Projetos Integradores, Extensão Universitária e impacto institucional em um só lugar.</p>
    </main>
  );
}
