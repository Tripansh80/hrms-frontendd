import { cn } from "@/lib/utils";

type Status =
  | "approved" | "present" | "active" | "completed" | "verified" | "hired" | "accepted"
  | "pending" | "in_progress" | "invited" | "half_day" | "scheduled"
  | "rejected" | "absent" | "failed" | "suspended" | "declined" | "expired"
  | "cancelled" | "draft" | "closed" | "withdrawn"
  | "on_leave" | "open" | "sent";

const statusColor: Record<string, string> = {
  approved: "bg-[hsl(var(--success-soft))] text-[hsl(var(--success))]",
  present: "bg-[hsl(var(--success-soft))] text-[hsl(var(--success))]",
  active: "bg-[hsl(var(--success-soft))] text-[hsl(var(--success))]",
  completed: "bg-[hsl(var(--success-soft))] text-[hsl(var(--success))]",
  verified: "bg-[hsl(var(--success-soft))] text-[hsl(var(--success))]",
  hired: "bg-[hsl(var(--success-soft))] text-[hsl(var(--success))]",
  accepted: "bg-[hsl(var(--success-soft))] text-[hsl(var(--success))]",
  pending: "bg-[hsl(var(--warning-soft))] text-[hsl(var(--warning))]",
  in_progress: "bg-[hsl(var(--warning-soft))] text-[hsl(var(--warning))]",
  invited: "bg-[hsl(var(--warning-soft))] text-[hsl(var(--warning))]",
  half_day: "bg-[hsl(var(--warning-soft))] text-[hsl(var(--warning))]",
  scheduled: "bg-[hsl(var(--warning-soft))] text-[hsl(var(--warning))]",
  rejected: "bg-[hsl(var(--danger-soft))] text-[hsl(var(--danger))]",
  absent: "bg-[hsl(var(--danger-soft))] text-[hsl(var(--danger))]",
  failed: "bg-[hsl(var(--danger-soft))] text-[hsl(var(--danger))]",
  suspended: "bg-[hsl(var(--danger-soft))] text-[hsl(var(--danger))]",
  declined: "bg-[hsl(var(--danger-soft))] text-[hsl(var(--danger))]",
  expired: "bg-[hsl(var(--danger-soft))] text-[hsl(var(--danger))]",
  cancelled: "bg-[hsl(var(--surface-2))] text-[hsl(var(--text-muted))]",
  draft: "bg-[hsl(var(--surface-2))] text-[hsl(var(--text-muted))]",
  closed: "bg-[hsl(var(--surface-2))] text-[hsl(var(--text-muted))]",
  withdrawn: "bg-[hsl(var(--surface-2))] text-[hsl(var(--text-muted))]",
  on_leave: "bg-[hsl(var(--info-soft))] text-[hsl(var(--info))]",
  open: "bg-[hsl(var(--info-soft))] text-[hsl(var(--info))]",
  sent: "bg-[hsl(var(--info-soft))] text-[hsl(var(--info))]",
};

export function StatusBadge({ status }: { status: string }) {
  const color = statusColor[status] ?? "bg-[hsl(var(--surface-2))] text-[hsl(var(--text-muted))]";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        color
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.replace(/_/g, " ")}
    </span>
  );
}
