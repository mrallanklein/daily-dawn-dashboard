import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "brand" | "warning" | "danger";
}) {
  const toneCls = {
    default: "text-foreground",
    brand: "text-brand",
    warning: "text-warning",
    danger: "text-destructive",
  }[tone];

  return (
    <div className="surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        <Icon className={cn("size-4 shrink-0", toneCls)} strokeWidth={1.8} />
      </div>
      <p className={cn("mt-2 text-2xl font-display tabular-nums", toneCls)}>{value}</p>
      {hint ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
