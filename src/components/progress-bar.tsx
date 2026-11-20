import React from "react";

export interface ProgressBarProps {
  value: number;
  max?: number;
  label: string;
  statusText?: string;
  variant?: "primary" | "success" | "warning" | "danger";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  statusText,
  variant = "primary",
  className = "",
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(max, Math.round(value)));
  const percentage = max > 0 ? Math.round((clampedValue / max) * 100) : 0;

  return (
    <div className={`progress-wrapper ${className}`.trim()}>
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-percentage" aria-hidden="true">
          {percentage}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={statusText ? `${percentage}% — ${statusText}` : `${percentage}%`}
        className="progress-track"
      >
        <div
          className={`progress-fill progress-fill-${variant}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {statusText ? (
        <p className="progress-status-text" aria-live="polite">
          {statusText}
        </p>
      ) : null}
    </div>
  );
}

