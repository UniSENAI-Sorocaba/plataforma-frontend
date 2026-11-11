/**
 * Parses the public origin used by metadata routes.
 * In production, refusing HTTP or malformed origins avoids publishing a bad canonical URL.
 *
 * @param {string | undefined} raw
 * @param {string | undefined} mode
 * @returns {URL | null}
 */
export function parsePublicSiteUrl(raw, mode = process.env.NODE_ENV) {
  if (!raw?.trim()) return null;

  try {
    const url = new URL(raw.trim());
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (url.username || url.password || url.search || url.hash) return null;
    if (url.pathname !== "/" && url.pathname !== "") return null;
    if (mode === "production" && url.protocol !== "https:") return null;
    if (mode === "production" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname)) return null;

    return new URL(url.origin);
  } catch {
    return null;
  }
}
