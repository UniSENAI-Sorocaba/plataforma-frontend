import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string;
  label: string;
  error?: string;
  helperText?: string;
  currentLength?: number;
  maxLength?: number;
}

export function Textarea({
  id,
  label,
  error,
  helperText,
  required,
  currentLength,
  maxLength,
  className = "",
  value,
  ...props
}: TextareaProps) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const counterId = maxLength ? `${id}-counter` : undefined;
  const describedBy = [errorId, helperId, counterId].filter(Boolean).join(" ") || undefined;

  const len = currentLength ?? (typeof value === "string" ? value.length : 0);

  return (
    <div className={`form-group ${error ? "has-error" : ""} ${className}`}>
      <div className="form-label-row">
        <label htmlFor={id} className="form-label">
          {label}
          {required ? <span className="required-indicator" aria-hidden="true"> *</span> : null}
        </label>
        {maxLength ? (
          <span id={counterId} className="char-counter" aria-live="polite">
            {len}/{maxLength}
          </span>
        ) : null}
      </div>
      <textarea
        id={id}
        className="form-textarea"
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        required={required}
        maxLength={maxLength}
        value={value}
        {...props}
      />
      {error ? (
        <span id={errorId} className="form-error" role="alert">
          {error}
        </span>
      ) : null}
      {helperText && !error ? (
        <span id={helperId} className="form-helper">
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
