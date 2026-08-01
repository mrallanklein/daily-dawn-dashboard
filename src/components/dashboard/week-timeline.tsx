import { useQuery } from "@tanstack/react-query";
import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { projectsQuery, tasksQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { Panel } from "@/components/app/panel";
import { cn } from "@/lib/utils";

export function WeekTimeline() {
  const { workspace } = useWorkspace();
  const { data: tasks } = useQuery(tasksQuery(workspace));
  const { data: projects } = useQuery(projectsQuery(workspace));
  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i));

  return (
    <Panel eyebrow="7 prochains jours" title="Timeline de la semaine" bodyClassName="p-3">
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayTasks = (tasks ?? []).filter(
            (t) =>
              !t.parent_task_id &&
              ((t.scheduled_date && isSameDay(parseISO(t.scheduled_date), day)) ||
                (t.due_date && isSameDay(parseISO(t.due_date), day))),
          );
          const dayProjects = (projects ?? []).filter(
            (p) =>
              (p.deadline && isSameDay(parseISO(p.deadline), day)) ||
              (p.work_date && isSameDay(parseISO(p.work_date), day)),
          );
          const today = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[7.5rem] rounded-lg border border-border p-2",
                today && "border-brand bg-brand-soft",
              )}
            >
              <p className="text-[0.65rem] uppercase tracking-[0.1em] text-muted-foreground">
                {format(day, "EEE", { locale: fr })}
              </p>
              <p className={cn("mb-1.5 text-sm font-display", today && "text-brand")}>
                {format(day, "d")}
              </p>
              <div className="space-y-1">
                {dayProjects.slice(0, 2).map((p) => (
                  <p
                    key={p.id}
                    className="truncate rounded bg-warning/15 px-1 py-0.5 text-[0.65rem] text-foreground"
                    title={p.name}
                  >
                    {p.name}
                  </p>
                ))}
                {dayTasks.slice(0, 3).map((t) => (
                  <p
                    key={t.id}
                    className={cn(
                      "truncate rounded bg-muted px-1 py-0.5 text-[0.65rem]",
                      t.status === "termine" && "text-muted-foreground line-through",
                    )}
                    title={t.title}
                  >
                    {t.title}
                  </p>
                ))}
                {dayTasks.length > 3 ? (
                  <p className="text-[0.65rem] text-muted-foreground">
                    +{dayTasks.length - 3} autres
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
