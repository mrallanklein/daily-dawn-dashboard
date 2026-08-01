import { differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import type { Project } from "@/lib/data";
import { statusLabel } from "@/lib/project-status";
import { cn } from "@/lib/utils";

export function GanttView({
  projects,
  onSelect,
}: {
  projects: Project[];
  onSelect: (p: Project) => void;
}) {
  const dated = projects.filter((p) => p.start_date || p.deadline);
  if (dated.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Ajoutez des dates de début ou d'échéance pour afficher le Gantt.
      </p>
    );
  }

  const today = startOfDay(new Date());
  const starts = dated.map((p) => parseISO(p.start_date ?? p.deadline!));
  const ends = dated.map((p) => parseISO(p.deadline ?? p.start_date!));
  const min = new Date(Math.min(...starts.map((d) => d.getTime()), today.getTime()));
  const max = new Date(Math.max(...ends.map((d) => d.getTime()), today.getTime()));
  const total = Math.max(differenceInCalendarDays(max, min), 1);
  const pct = (d: Date) => (differenceInCalendarDays(d, min) / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
        <span>{format(min, "d MMM yyyy", { locale: fr })}</span>
        <span>{format(max, "d MMM yyyy", { locale: fr })}</span>
      </div>
      <div className="space-y-1.5">
        {dated.map((p) => {
          const s = parseISO(p.start_date ?? p.deadline!);
          const e = parseISO(p.deadline ?? p.start_date!);
          const left = pct(s);
          const width = Math.max(pct(e) - left, 1.5);
          const late = e < today && p.status !== "termine";
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="group grid w-full grid-cols-[minmax(0,11rem)_1fr] items-center gap-3 rounded-lg px-1 py-1 text-left hover:bg-muted/50"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm">{p.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {statusLabel(p.status)}
                </span>
              </span>
              <span className="relative h-6 rounded bg-muted/60">
                <span
                  className="absolute inset-y-0 z-10 w-px bg-destructive/70"
                  style={{ left: `${pct(today)}%` }}
                />
                <span
                  className={cn(
                    "absolute inset-y-1 rounded",
                    late ? "bg-destructive/70" : "bg-brand",
                  )}
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
