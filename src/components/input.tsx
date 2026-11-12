import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string;
  helperText?: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function Input({
  id,
  label,
  error,
  helperText,
  required,
  className = "",
  ref,
  ...props
}: InputProps) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`form-group ${error ? "has-error" : ""} ${className}`.trim()}>
      <label htmlFor={id} className="form-label">
        {label}
        {required ? (
          <span className="required-indicator" aria-hidden="true">
            {" "}
            *
          </span>
        ) : null}
      </label>
      <input
        ref={ref}
        id={id}
        className="form-input"
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        required={required}
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
