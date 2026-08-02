import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { projectsQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { useProjectMutations } from "@/components/projects/use-project-mutations";
import { RangeToggle } from "@/components/range-toggle";
import { EmptyState } from "@/components/app/panel";
import { RowsSkeleton } from "@/components/app/skeletons";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { daysUntil, fmtShortDate, inRange, type RangeDays } from "@/lib/dates";
import { statusDot, statusLabel } from "@/lib/project-status";
import { cn } from "@/lib/utils";

/** Projets sur lesquels travailler : date de travail choisie, ou deadline proche. */
export function TodayFocus() {
  const [range, setRange] = useState<RangeDays>(1);
  const { workspace } = useWorkspace();
  const { data: projects, isLoading } = useQuery(projectsQuery(workspace));
  const { patch } = useProjectMutations(workspace);

  const visible = (projects ?? [])
    .filter((p) => !["termine", "archiver"].includes(p.status))
    .filter((p) => inRange(p.work_date, range) || inRange(p.deadline, range));

  return (
    <section className="glass flex min-w-0 flex-col p-3">
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Mes projets du jour
        </p>
        <RangeToggle value={range} onChange={setRange} />
      </header>

      {isLoading ? (
        <RowsSkeleton rows={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          hint="Choisissez une date de travail sur un projet pour le voir apparaître ici."
        >
          Aucun projet planifié
        </EmptyState>
      ) : (
        <ul className="space-y-0.5">
          {visible.map((p) => {
            const left = p.deadline ? daysUntil(p.deadline) : null;
            return (
              <li key={p.id} className="soft-row flex items-center gap-2.5 px-2 py-1.5">
                <span className={cn("size-2 shrink-0 rounded-full", statusDot(p.status))} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{p.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {statusLabel(p.status)}
                    {p.next_step ? ` · ${p.next_step}` : ""}
                  </span>
                </span>
                {p.deadline ? (
                  <span
                    className={cn(
                      "shrink-0 text-xs font-semibold tabular-nums",
                      left !== null && left < 0 ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {fmtShortDate(p.deadline)}
                  </span>
                ) : null}
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="press flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[0.68rem] text-muted-foreground hover:text-foreground"
                      aria-label="Planifier une session de travail"
                    >
                      <CalendarClock className="size-3.5" />
                      {p.work_date ? fmtShortDate(p.work_date) : "Planifier"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-auto p-2">
                    <Input
                      type="date"
                      value={p.work_date ?? ""}
                      onChange={(e) =>
                        patch.mutate({ id: p.id, work_date: e.target.value || null })
                      }
                    />
                  </PopoverContent>
                </Popover>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
