import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
import { CalendarPlus, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { getCalendarEvents, type CalendarEvent } from "@/lib/agenda.functions";
import { projectsQuery, tasksQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { EventDialog, type EventDraft } from "@/components/calendar/event-dialog";
import { Button } from "@/components/ui/button";
import { statusDot } from "@/lib/project-status";
import { cn } from "@/lib/utils";

export function MonthCalendar() {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const { workspace } = useWorkspace();
  const { data: tasks } = useQuery(tasksQuery(workspace));
  const { data: projects } = useQuery(projectsQuery(workspace));
  const fetchEvents = useServerFn(getCalendarEvents);

  const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart.getTime(), gridEnd.getTime()],
  );

  const { data: events } = useQuery({
    queryKey: ["calendar", "month", gridStart.toISOString(), gridEnd.toISOString()],
    staleTime: 2 * 60 * 1000,
    retry: false,
    queryFn: () =>
      fetchEvents({
        data: { timeMin: gridStart.toISOString(), timeMax: gridEnd.toISOString() },
      }),
  });

  const eventsOn = (day: Date) =>
    (events ?? []).filter((e) => isSameDay(parseISO(e.start), day));
  const tasksOn = (day: Date) =>
    (tasks ?? []).filter(
      (t) => !t.parent_task_id && t.scheduled_date && isSameDay(parseISO(t.scheduled_date), day),
    );
  const projectsOn = (day: Date) =>
    (projects ?? []).filter((p) => p.deadline && isSameDay(parseISO(p.deadline), day));

  const selectedEvents = eventsOn(selected);

  return (
    <section className="glass flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
            Calendrier
          </p>
          <h2 className="text-base font-display capitalize">
            {format(cursor, "MMMM yyyy", { locale: fr })}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="press"
            onClick={() => setCursor((c) => addMonths(c, -1))}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="press"
            onClick={() => {
              setCursor(new Date());
              setSelected(new Date());
            }}
          >
            Aujourd'hui
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="press"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            aria-label="Mois suivant"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button size="sm" className="press ml-1" onClick={() => setDraft({ date: selected })}>
            <CalendarPlus className="mr-1.5 size-4" /> Évènement
          </Button>
        </div>
      </header>

      <div className="grid gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div className="grid grid-cols-7 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].map((d) => (
              <p key={d} className="px-1 pb-1.5">
                {d}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayEvents = eventsOn(day);
              const dayTasks = tasksOn(day);
              const dayProjects = projectsOn(day);
              const today = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selected);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelected(day)}
                  onDoubleClick={() => setDraft({ date: day })}
                  className={cn(
                    "press min-h-[5.5rem] rounded-xl border border-transparent p-1.5 text-left align-top",
                    "hover:bg-muted/60",
                    !isSameMonth(day, cursor) && "opacity-40",
                    isSelected && "border-border bg-muted/70 shadow-[var(--shadow-soft)]",
                  )}
                >
                  <span
                    className={cn(
                      "inline-grid size-6 place-items-center rounded-full text-xs font-semibold tabular-nums",
                      today ? "bg-destructive text-destructive-foreground" : "text-foreground/80",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <span className="mt-1 block space-y-0.5">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        title={e.title}
                        className="flex items-center gap-1 truncate rounded px-1 text-[0.64rem] font-medium"
                        style={{
                          backgroundColor: `${e.color ?? "#7c7c7c"}22`,
                          color: "inherit",
                        }}
                      >
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: e.color ?? "#7c7c7c" }}
                        />
                        <span className="truncate">{e.title}</span>
                      </span>
                    ))}
                    {dayProjects.slice(0, 1).map((p) => (
                      <span
                        key={p.id}
                        title={`Deadline · ${p.name}`}
                        className="flex items-center gap-1 truncate text-[0.64rem] font-medium"
                      >
                        <span className={cn("size-1.5 shrink-0 rounded-sm", statusDot(p.status))} />
                        <span className="truncate">{p.name}</span>
                      </span>
                    ))}
                    {dayTasks.slice(0, 1).map((t) => (
                      <span
                        key={t.id}
                        title={t.title}
                        className="block truncate text-[0.64rem] text-muted-foreground"
                      >
                        • {t.title}
                      </span>
                    ))}
                    {dayEvents.length + dayProjects.length + dayTasks.length > 5 ? (
                      <span className="block text-[0.62rem] text-muted-foreground">
                        +{dayEvents.length + dayProjects.length + dayTasks.length - 5}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-xl border border-border/70 bg-background/40 p-3">
          <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
            {format(selected, "EEEE d MMMM", { locale: fr })}
          </p>
          <div className="mt-2 space-y-2">
            {selectedEvents.length === 0 &&
            tasksOn(selected).length === 0 &&
            projectsOn(selected).length === 0 ? (
              <p className="text-sm text-muted-foreground">Journée libre.</p>
            ) : null}

            {selectedEvents.map((e: CalendarEvent) => (
              <button
                key={e.id}
                onClick={() => setDraft({ date: selected, event: e })}
                className="press w-full rounded-lg border-l-2 bg-muted/50 px-2.5 py-2 text-left"
                style={{ borderLeftColor: e.color ?? "var(--brand)" }}
              >
                <p className="truncate text-sm font-semibold">{e.title}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {e.allDay ? "Journée entière" : format(parseISO(e.start), "HH:mm")}
                  {e.calendarName ? ` · ${e.calendarName}` : ""}
                </p>
                {e.location ? (
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {e.location}
                  </p>
                ) : null}
              </button>
            ))}

            {projectsOn(selected).map((p) => (
              <div key={p.id} className="rounded-lg px-2.5 py-1.5">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">Deadline projet</p>
              </div>
            ))}
            {tasksOn(selected).map((t) => (
              <div key={t.id} className="rounded-lg px-2.5 py-1.5">
                <p className="truncate text-sm">{t.title}</p>
                <p className="text-xs text-muted-foreground">Tâche planifiée</p>
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="press mt-3 w-full"
            onClick={() => setDraft({ date: selected })}
          >
            <CalendarPlus className="mr-1.5 size-4" /> Ajouter ce jour-là
          </Button>
        </aside>
      </div>

      <EventDialog draft={draft} onClose={() => setDraft(null)} />
    </section>
  );
}
