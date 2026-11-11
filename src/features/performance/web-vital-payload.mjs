const METRIC_NAMES = new Set(["LCP", "INP", "CLS"]);
const RATINGS = new Set(["good", "needs-improvement", "poor"]);
const NAVIGATION_TYPES = new Set([
  "navigate",
  "reload",
  "prerender",
  "back-forward",
  "back-forward-cache",
  "restore",
]);

/**
 * @param {unknown} input
 * @returns {{ id: string, name: "LCP" | "INP" | "CLS", value: number, delta: number, rating: string, navigationType: string } | null}
 */
export function parseWebVitalPayload(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const metric = /** @type {Record<string, unknown>} */ (input);
  if (typeof metric.id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(metric.id)) return null;
  if (typeof metric.name !== "string" || !METRIC_NAMES.has(metric.name)) return null;
  if (typeof metric.value !== "number" || !Number.isFinite(metric.value) || metric.value < 0 || metric.value > 600_000) return null;
  if (typeof metric.delta !== "number" || !Number.isFinite(metric.delta) || Math.abs(metric.delta) > 600_000) return null;
  if (typeof metric.rating !== "string" || !RATINGS.has(metric.rating)) return null;
  if (typeof metric.navigationType !== "string" || !NAVIGATION_TYPES.has(metric.navigationType)) return null;

  return {
    id: metric.id,
    name: /** @type {"LCP" | "INP" | "CLS"} */ (metric.name),
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    navigationType: metric.navigationType,
  };
}
