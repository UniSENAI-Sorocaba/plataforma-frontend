import type { MetadataRoute } from "next";
import { parsePublicSiteUrl } from "@/features/seo/site-url.mjs";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = parsePublicSiteUrl(process.env.SITE_URL);
  if (!siteUrl) return [];

  return [
    {
      url: new URL("/", siteUrl).toString(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
