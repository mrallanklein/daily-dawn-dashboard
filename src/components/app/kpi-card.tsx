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
    <div className="glass topline elevate group relative p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow truncate pt-0.5">{label}</p>
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full border border-border/70 bg-card/60 transition-colors group-hover:border-transparent",
            toneCls,
          )}
          style={{ backgroundColor: "color-mix(in oklab, currentColor 9%, transparent)" }}
        >
          <Icon className="size-4" strokeWidth={1.6} />
        </span>
      </div>
      <p className={cn("num mt-3 text-[1.9rem] font-display leading-none", toneCls)}>{value}</p>
      {hint ? (
        <p className="mt-1.5 truncate text-[0.82rem] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
