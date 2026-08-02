import { AlertTriangle, Clock, Link2 } from "lucide-react";
import type { ProjectRisk } from "@/lib/project-risk";
import { cn } from "@/lib/utils";

/** Pastille d'alerte : rouge si en retard ou bloqué, ambre si à surveiller. */
export function RiskBadge({ risk, className }: { risk: ProjectRisk; className?: string }) {
  if (risk.level === "none") return null;
  const late = risk.level === "late";
  const Icon = risk.blockedByProject ? Link2 : late ? AlertTriangle : Clock;
  return (
    <span
      title={risk.reasons.join(" · ")}
      className={cn(
        "pill inline-flex shrink-0 items-center gap-1 whitespace-nowrap",
        late ? "border-destructive/40 text-destructive" : "border-warning/40 text-warning",
        className,
      )}
    >
      <Icon className="size-3" strokeWidth={1.5} />
      {risk.reasons[0]}
    </span>
  );
}
