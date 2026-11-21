import { clearSession } from "./auth-service";

export function expireSession() {
  if (typeof window === "undefined") return;
  clearSession();
  window.dispatchEvent(new Event("plataforma:session-expired"));
}
