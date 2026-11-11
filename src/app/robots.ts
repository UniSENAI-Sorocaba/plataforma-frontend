import type { MetadataRoute } from "next";
import { parsePublicSiteUrl } from "@/features/seo/site-url.mjs";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = parsePublicSiteUrl(process.env.SITE_URL);
  if (!siteUrl) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/aluno", "/cadastro", "/coordenador", "/docente", "/login", "/recuperar-senha", "/register", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
