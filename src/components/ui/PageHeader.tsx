import { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  scopeChip,
  primaryAction,
}: {
  title: string;
  description?: string;
  scopeChip?: string;
  primaryAction?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[22px] font-semibold leading-7 -tracking-[0.01em]">{title}</h1>
          {scopeChip && (
            <span className="rounded-full border border-[hsl(var(--border))] px-2.5 py-0.5 text-xs text-[hsl(var(--text-muted))]">
              {scopeChip}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-sm text-[hsl(var(--text-muted))]">{description}</p>
        )}
      </div>
      {primaryAction && <div className="shrink-0">{primaryAction}</div>}
    </div>
  );
}
