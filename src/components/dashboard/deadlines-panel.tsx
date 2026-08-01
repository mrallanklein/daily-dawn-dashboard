import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { projectsQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { Panel, EmptyState } from "@/components/app/panel";
import { daysUntil, fmtShortDate } from "@/lib/dates";
import { statusLabel } from "@/lib/project-status";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function DeadlinesPanel() {
  const { workspace } = useWorkspace();
  const { data: projects } = useQuery(projectsQuery(workspace));

  const upcoming = (projects ?? [])
    .filter((p) => p.deadline && p.status !== "termine" && p.status !== "archiver")
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
    .slice(0, 7);

  return (
    <Panel
      eyebrow="Chronologie"
      title="Prochaines deadlines"
      action={
        <Link to="/projets" className="text-xs text-brand underline-offset-4 hover:underline">
          Tous les projets
        </Link>
      }
    >
      {upcoming.length === 0 ? (
        <EmptyState>Aucune échéance planifiée.</EmptyState>
      ) : (
        <ol className="relative space-y-3 border-l border-border pl-4">
          {upcoming.map((p) => {
            const left = daysUntil(p.deadline!);
            return (
              <li key={p.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[1.31rem] top-1.5 size-2 rounded-full",
                    left < 0 ? "bg-destructive" : left <= 3 ? "bg-warning" : "bg-brand",
                  )}
                />
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-sm">{p.name}</p>
                  <span
                    className={cn(
                      "shrink-0 text-xs tabular-nums",
                      left < 0 ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {fmtShortDate(p.deadline!)} ·{" "}
                    {left < 0 ? `${Math.abs(left)} j de retard` : `J-${left}`}
                  </span>
                </div>
                <Progress value={p.progress} className="mt-1.5 h-1" />
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {statusLabel(p.status)} · {p.progress}%{p.client ? ` · ${p.client}` : ""}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
