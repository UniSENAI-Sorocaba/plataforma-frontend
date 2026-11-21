import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();
  return ["/", "/projects", "/certificados", "/impactos", "/extension", "/login"].map((path) => ({
    url: new URL(path, base).toString(),
    lastModified: now,
    changeFrequency: path === "/projects" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
