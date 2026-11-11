"use client";

import { useReportWebVitals } from "next/web-vitals";

const CORE_VITALS = new Set(["LCP", "INP", "CLS"]);
const CONFIGURED_ENDPOINT = process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT?.trim();

type MetricCallback = Parameters<typeof useReportWebVitals>[0];

function getEndpoint(): string | null {
  if (!CONFIGURED_ENDPOINT) return "/api/web-vitals";

  try {
    const endpoint = new URL(CONFIGURED_ENDPOINT, window.location.origin);
    if (endpoint.origin !== window.location.origin && endpoint.protocol !== "https:") {
      return null;
    }
    return endpoint.toString();
  } catch {
    return null;
  }
}

const reportMetric: MetricCallback = (metric) => {
  if (!CORE_VITALS.has(metric.name)) return;

  const payload = JSON.stringify({
    id: metric.id,
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    navigationType: metric.navigationType,
  });

  if (process.env.NODE_ENV !== "production" && !CONFIGURED_ENDPOINT) {
    console.info("[web-vitals]", JSON.parse(payload));
    return;
  }

  const endpoint = getEndpoint();
  if (!endpoint) return;

  if (navigator.sendBeacon?.(endpoint, new Blob([payload], { type: "application/json" }))) {
    return;
  }

  void fetch(endpoint, {
    method: "POST",
    body: payload,
    headers: { "content-type": "application/json" },
    keepalive: true,
    credentials: "omit",
  }).catch(() => {
    // Métricas não devem interromper a navegação se o coletor estiver indisponível.
  });
};

export function WebVitals() {
  useReportWebVitals(reportMetric);
  return null;
}
