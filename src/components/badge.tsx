import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "neutral" | "success" | "warning" | "danger" | "info" | "brand";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}: BadgeProps) {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {children}
    </span>
  );
}
