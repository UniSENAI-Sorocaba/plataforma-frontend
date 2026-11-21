"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export function AppModal({ title, message, onClose, variant = "success" }: { title: string; message: string; onClose: () => void; variant?: "success" | "info" | "error" }) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  if (!mounted) return null;
  return createPortal(<div className="modal-backdrop" role="presentation"><section className={`app-modal app-modal-${variant}`} role="dialog" aria-modal="true" aria-labelledby="app-modal-title"><div className="app-modal-icon" aria-hidden="true">{variant === "success" ? "✓" : variant === "error" ? "!" : "i"}</div><h2 id="app-modal-title">{title}</h2><p>{message}</p><button type="button" className="btn btn-primary" onClick={onClose}>Entendi</button></section></div>, document.body);
}
