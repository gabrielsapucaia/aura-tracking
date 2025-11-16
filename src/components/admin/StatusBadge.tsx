import { cn } from "@/lib/utils";

type Status = "active" | "inactive" | "pending";

const statusMap: Record<Status, string> = {
  active: "bg-success/15 text-success",
  inactive: "bg-gray-200 text-gray-500",
  pending: "bg-warning/15 text-warning",
};

export type StatusBadgeProps = {
  status: Status;
  label?: string;
  className?: string;
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-20 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        statusMap[status],
        className,
      )}
    >
      {label ?? status}
    </span>
  );
}
