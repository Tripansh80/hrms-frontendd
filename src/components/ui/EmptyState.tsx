import { LucideIcon } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <Icon className="h-10 w-10 text-[hsl(var(--text-subtle))]" strokeWidth={1.5} />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-1">{description}</p>
      </div>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
