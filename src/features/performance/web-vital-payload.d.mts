export type WebVitalName = "LCP" | "INP" | "CLS";
export type WebVitalRating = "good" | "needs-improvement" | "poor";
export type WebVitalNavigationType =
  | "navigate"
  | "reload"
  | "prerender"
  | "back-forward"
  | "back-forward-cache"
  | "restore";

export type WebVitalPayload = {
  id: string;
  name: WebVitalName;
  value: number;
  delta: number;
  rating: WebVitalRating;
  navigationType: WebVitalNavigationType;
};

export function parseWebVitalPayload(input: unknown): WebVitalPayload | null;
