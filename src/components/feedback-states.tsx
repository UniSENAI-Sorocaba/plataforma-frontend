type StateProps = {
  title: string;
  description?: string;
};

export function LoadingState({ title, description }: StateProps) {
  return (
    <div role="status" aria-live="polite" className="feedback feedback-loading">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function ErrorState({ title, description }: StateProps) {
  return (
    <div role="alert" className="feedback feedback-error">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function EmptyState({ title, description }: StateProps) {
  return (
    <div className="feedback feedback-empty">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function SuccessState({ title, description }: StateProps) {
  return (
    <div role="status" aria-live="polite" className="feedback feedback-success">
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

export function StatusBadge({ children }: { children: React.ReactNode }) {
  return <span className="status-badge">{children}</span>;
}
