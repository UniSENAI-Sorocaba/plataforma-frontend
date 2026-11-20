import React from "react";

export interface AlertProps {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export function Alert({
  variant = "info",
  title,
  children,
  className = "",
  onClose,
}: AlertProps) {
  const role = variant === "error" ? "alert" : "status";

  return (
    <div
      role={role}
      aria-live="polite"
      className={`alert alert-${variant} ${className}`}
    >
      <div className="alert-content">
        {title ? <strong className="alert-title">{title}</strong> : null}
        <div className="alert-body">{children}</div>
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="alert-close"
          aria-label="Fechar notificação"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
