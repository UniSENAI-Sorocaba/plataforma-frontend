"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export function AppToast({ title = "Login realizado com sucesso", message, onDismiss, variant = "success" }: { title?: string; message: string; onDismiss: () => void; variant?: "success" | "info" | "error" }) {
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 4200);
    return () => window.clearTimeout(timeout);
  }, [onDismiss]);

  if (!mounted) return null;
  return createPortal((
    <div className="toast-viewport" aria-live="polite" aria-atomic="true">
      <div className={`app-toast app-toast-${variant}`} role="status">
        <span className="app-toast-icon" aria-hidden="true">{variant === "success" ? "✓" : variant === "error" ? "!" : "i"}</span>
        <div><strong>{title}</strong><p>{message}</p></div>
        <button type="button" className="app-toast-dismiss" onClick={onDismiss} aria-label="Fechar notificação">×</button>
      </div>
    </div>
  ), document.body);
}
