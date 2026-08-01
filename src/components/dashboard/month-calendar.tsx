import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { projectsQuery, tasksQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { Panel } from "@/components/app/panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MonthCalendar() {
  const [cursor, setCursor] = useState(() => new Date());
  const { workspace } = useWorkspace();
  const { data: tasks } = useQuery(tasksQuery(workspace));
  const { data: projects } = useQuery(projectsQuery(workspace));

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
      }),
    [cursor],
  );

  return (
    <Panel
      eyebrow="Vue mensuelle"
      title={format(cursor, "MMMM yyyy", { locale: fr })}
      bodyClassName="p-3"
      action={
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor((c) => addMonths(c, -1))}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
            Aujourd'hui
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            aria-label="Mois suivant"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-7 gap-px text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
        {["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].map((d) => (
          <p key={d} className="px-1 pb-1">
            {d}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayTasks = (tasks ?? []).filter(
            (t) => t.scheduled_date && isSameDay(parseISO(t.scheduled_date), day),
          );
          const dayProjects = (projects ?? []).filter(
            (p) => p.deadline && isSameDay(parseISO(p.deadline), day),
          );
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[4.5rem] rounded-lg border border-border/70 p-1.5",
                !isSameMonth(day, cursor) && "opacity-45",
                isSameDay(day, new Date()) && "border-brand bg-brand-soft",
              )}
            >
              <p className="text-xs tabular-nums text-muted-foreground">{format(day, "d")}</p>
              {dayProjects.slice(0, 1).map((p) => (
                <p key={p.id} className="mt-0.5 truncate text-[0.62rem] text-warning" title={p.name}>
                  ◆ {p.name}
                </p>
              ))}
              {dayTasks.slice(0, 2).map((t) => (
                <p key={t.id} className="truncate text-[0.62rem]" title={t.title}>
                  • {t.title}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
