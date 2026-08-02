import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  setHours,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getCalendarEvents,
  listCalendars,
  respondCalendarEvent,
  type CalendarEvent,
} from "@/lib/agenda.functions";
import { projectsQuery, tasksQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { statusColor } from "@/lib/project-status";
import { EventDialog, type EventDraft } from "@/components/calendar/event-dialog";
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar";
import { MonthGrid } from "@/components/calendar/month-grid";
import { TimeGrid } from "@/components/calendar/time-grid";
import { YearGrid } from "@/components/calendar/year-grid";
import { InvitationsPopover } from "@/components/calendar/invitations-popover";
import { MonthYearPicker } from "@/components/calendar/month-year-picker";
import {
  VIEW_LABELS,
  eventKey,
  shiftCursor,
  viewBounds,
  type CalendarViewMode,
} from "@/components/calendar/calendar-utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CalendarWorkspace() {
  const [view, setView] = useState<CalendarViewMode>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);

  const { workspace, space } = useWorkspace();
  const calendarIds = space?.calendar_ids ?? [];
  const fetchEvents = useServerFn(getCalendarEvents);
  const fetchCalendars = useServerFn(listCalendars);
  const respond = useServerFn(respondCalendarEvent);
  const queryClient = useQueryClient();
  const { data: tasks } = useQuery(tasksQuery(workspace));
  const { data: projects } = useQuery(projectsQuery(workspace));

  const { data: sources } = useQuery({
    queryKey: ["calendar-sources"],
    staleTime: 30 * 60 * 1000,
    retry: false,
    queryFn: () => fetchCalendars(),
  });

  const { from, to } = viewBounds(view, cursor);
  const { data, error, isLoading } = useQuery({
    queryKey: ["calendar", view, from.toISOString(), to.toISOString()],
    staleTime: 2 * 60 * 1000,
    retry: false,
    queryFn: () =>
      fetchEvents({
        data: { timeMin: from.toISOString(), timeMax: to.toISOString(), calendarIds: [] },
      }),
  });

  const events = useMemo(
    () => (data ?? []).filter((ev) => !hidden.includes(eventKey(ev))),
    [data, hidden],
  );

  // On liste tous les agendas de chaque compte ; ceux non sélectionnés dans l'espace
  // sont simplement décochés (comme dans Google/Apple Calendar).
  // Par défaut, tous les agendas des deux comptes (mr. + pro.) sont visibles.
  const allSources = sources ?? [];

  const invitations = useMemo(
    () => events.filter((ev) => ev.myResponse === "needsAction"),
    [events],
  );

  const respondMutation = useMutation({
    mutationFn: (vars: { ev: CalendarEvent; response: "accepted" | "declined" | "tentative" }) =>
      respond({
        data: {
          accountKey: vars.ev.accountKey,
          calendarId: vars.ev.calendarId,
          eventId: vars.ev.id,
          response: vars.response,
        },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["calendar"] }),
  });

  const markersFor = (day: Date) => [
    ...(projects ?? [])
      .filter((p) => p.deadline && isSameDay(parseISO(p.deadline), day))
      .map((p) => ({ id: `p-${p.id}`, label: p.name, color: statusColor(p.status) })),
    ...(tasks ?? [])
      .filter(
        (t) => !t.parent_task_id && t.scheduled_date && isSameDay(parseISO(t.scheduled_date), day),
      )
      .map((t) => ({ id: `t-${t.id}`, label: t.title, color: "#22C55E" })),
  ];

  const extrasFor = (day: Date) => [
    ...(projects ?? [])
      .filter((p) => p.deadline && isSameDay(parseISO(p.deadline), day))
      .map((p) => ({
        id: `p-${p.id}`,
        label: p.name,
        hint: "Deadline projet",
        color: statusColor(p.status),
      })),
    ...(tasks ?? [])
      .filter(
        (t) => !t.parent_task_id && t.scheduled_date && isSameDay(parseISO(t.scheduled_date), day),
      )
      .map((t) => ({ id: `t-${t.id}`, label: t.title, hint: "Tâche planifiée", color: "#22C55E" })),
  ];

  const weekDays = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(cursor, { weekStartsOn: 1 }),
        end: endOfWeek(cursor, { weekStartsOn: 1 }),
      }),
    [cursor],
  );

  const title =
    view === "year"
      ? format(cursor, "yyyy")
      : view === "day"
        ? format(cursor, "EEEE d MMMM yyyy", { locale: fr })
        : view === "week"
          ? `${format(weekDays[0]!, "d MMM", { locale: fr })} – ${format(weekDays[6]!, "d MMM yyyy", { locale: fr })}`
          : format(cursor, "MMMM yyyy", { locale: fr });

  const goToday = () => {
    setCursor(new Date());
    setSelected(new Date());
  };

  const selectDay = (day: Date) => {
    setSelected(day);
    setCursor(day);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <section className="glass min-w-0 overflow-hidden rounded-2xl">
        <header className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
          <div className="flex min-w-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="press size-8 rounded-full"
              aria-label="Période précédente"
              onClick={() => setCursor((c) => shiftCursor(view, c, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="press rounded-full font-semibold"
              onClick={goToday}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="press size-8 rounded-full"
              aria-label="Période suivante"
              onClick={() => setCursor((c) => shiftCursor(view, c, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
            <MonthYearPicker
              cursor={cursor}
              onChange={setCursor}
              label={title}
              monthPicker={view !== "year"}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-border bg-muted/40 p-0.5">
              {VIEW_LABELS.map((v, i) => (
                <div key={v.value} className="flex items-center">
                  {i > 0 && view !== v.value && view !== VIEW_LABELS[i - 1]!.value ? (
                    <span className="h-3.5 w-px bg-border" />
                  ) : null}
                  <button
                    onClick={() => setView(v.value)}
                    className={cn(
                      "press rounded-full px-3.5 py-1 text-[0.8rem] font-semibold transition-all active:scale-[0.97]",
                      view === v.value
                        ? "border border-border bg-background text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.08)]"
                        : "border border-transparent text-muted-foreground hover:bg-background/60 hover:text-foreground hover:shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
                    )}
                  >
                    {v.label}
                  </button>
                </div>
              ))}
            </div>
            <InvitationsPopover
              invitations={invitations}
              onRespond={(ev, response) => respondMutation.mutate({ ev, response })}
              onSelectEvent={(ev) => setDraft({ date: parseISO(ev.start), event: ev })}
            />
          </div>
        </header>

        {error ? (
          <p className="p-4 text-sm text-muted-foreground">
            Agenda Google indisponible. Vérifiez la connexion des comptes dans les paramètres.
          </p>
        ) : isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Chargement de l'agenda…</p>
        ) : view === "year" ? (
          <YearGrid
            cursor={cursor}
            events={events}
            onSelectDay={(d) => {
              selectDay(d);
              setView("day");
            }}
          />
        ) : view === "month" ? (
          <MonthGrid
            cursor={cursor}
            selected={selected}
            events={events}
            markers={markersFor}
            onSelectDay={setSelected}
            onCreateDay={(d) => setDraft({ date: d })}
            onSelectEvent={(ev) => setDraft({ date: parseISO(ev.start), event: ev })}
          />
        ) : (
          <TimeGrid
            days={view === "day" ? [cursor] : weekDays}
            events={events}
            onSelectEvent={(ev) => setDraft({ date: parseISO(ev.start), event: ev })}
            onCreateAt={(day, hour) => {
              setSelected(day);
              setDraft({ date: setHours(day, hour) });
            }}
          />
        )}
      </section>

      <CalendarSidebar
        cursor={cursor}
        selected={selected}
        events={events}
        sources={allSources}
        hidden={hidden}
        extras={extrasFor(selected)}
        onCursorChange={setCursor}
        onSelectDay={selectDay}
        onToggleSource={(key) =>
          setHidden((h) => (h.includes(key) ? h.filter((k) => k !== key) : [...h, key]))
        }
        onCreate={() => setDraft({ date: addDays(selected, 0) })}
        onSelectEvent={(ev) => setDraft({ date: parseISO(ev.start), event: ev })}
      />

      <EventDialog draft={draft} onClose={() => setDraft(null)} />
    </div>
  );
}
