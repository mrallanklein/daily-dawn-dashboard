import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { projectsQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { EmptyState } from "@/components/app/panel";
import { RowsSkeleton } from "@/components/app/skeletons";
import { daysUntil, fmtShortDate } from "@/lib/dates";
import { statusDot, statusLabel } from "@/lib/project-status";
import { cn } from "@/lib/utils";

export function DeadlinesPanel() {
  const { workspace } = useWorkspace();
  const { data: projects, isLoading } = useQuery(projectsQuery(workspace));

  const upcoming = (projects ?? [])
    .filter((p) => p.deadline && p.status !== "termine" && p.status !== "archiver")
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
    .slice(0, 8);

  return (
    <section className="glass flex min-w-0 flex-col p-3">
      <header className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Chronologie des deadlines
        </p>
        <Link to="/projets" className="text-xs font-medium underline-offset-4 hover:underline">
          Tous les projets
        </Link>
      </header>

      {isLoading ? (
        <RowsSkeleton rows={5} />
      ) : upcoming.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          hint="Renseignez une échéance sur un projet pour la voir apparaître ici."
        >
          Aucune échéance planifiée
        </EmptyState>
      ) : (
        <ol className="relative space-y-3 border-l border-border pl-4">
          {upcoming.map((p) => {
            const left = daysUntil(p.deadline!);
            return (
              <li key={p.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[1.31rem] top-1.5 size-2.5 rounded-full ring-2 ring-background",
                    statusDot(p.status),
                  )}
                />
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-semibold">{p.name}</p>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-semibold tabular-nums",
                      left < 0 ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {fmtShortDate(p.deadline!)} ·{" "}
                    {left < 0 ? `${Math.abs(left)} j de retard` : `J-${left}`}
                  </span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", statusDot(p.status))}
                    style={{ width: `${Math.max(3, p.progress)}%` }}
                  />
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {statusLabel(p.status)} · {p.progress}%{p.client ? ` · ${p.client}` : ""}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
