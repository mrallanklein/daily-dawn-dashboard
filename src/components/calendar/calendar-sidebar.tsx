import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarPlus, Check, ChevronLeft, ChevronRight, Clock, MapPin, X } from "lucide-react";
import type { CalendarEvent, CalendarSource } from "@/lib/agenda.functions";
import { eventsOnDay } from "./calendar-utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function CalendarSidebar({
  cursor,
  selected,
  events,
  sources,
  hidden,
  extras,
  invitations,
  onCursorChange,
  onSelectDay,
  onToggleSource,
  onCreate,
  onSelectEvent,
  onRespond,
}: {
  cursor: Date;
  selected: Date;
  events: CalendarEvent[];
  sources: CalendarSource[];
  hidden: string[];
  extras: { id: string; label: string; hint: string; color?: string }[];
  invitations: CalendarEvent[];
  onCursorChange: (d: Date) => void;
  onSelectDay: (d: Date) => void;
  onToggleSource: (key: string) => void;
  onCreate: () => void;
  onSelectEvent: (ev: CalendarEvent) => void;
  onRespond: (ev: CalendarEvent, response: "accepted" | "declined") => void;
}) {
  const miniDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
  });
  const dayEvents = eventsOnDay(events, selected);

  const grouped = sources.reduce<Record<string, CalendarSource[]>>((acc, s) => {
    const label = s.accountEmail ?? s.accountKey;
    (acc[label] ??= []).push(s);
    return acc;
  }, {});

  return (
    <aside className="flex min-w-0 flex-col gap-4">
      <Button className="press w-full justify-start font-semibold" onClick={onCreate}>
        <CalendarPlus className="mr-2 size-4" /> Nouvel évènement
      </Button>

      {invitations.length > 0 ? (
        <section className="glass p-3">
          <p className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Invitations · {invitations.length}
          </p>
          <div className="space-y-2">
            {invitations.map((ev) => (
              <div key={`inv-${ev.id}${ev.calendarId}`} className="rounded-lg bg-muted/45 p-2">
                <button
                  onClick={() => onSelectEvent(ev)}
                  className="block w-full text-left"
                  title="Voir le détail"
                >
                  <p className="truncate text-sm font-semibold">{ev.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {format(new Date(ev.start), "EEE d MMM · HH:mm", { locale: fr })}
                    {ev.organizer ? ` · ${ev.organizer}` : ""}
                  </p>
                </button>
                <div className="mt-1.5 flex gap-1">
                  <Button
                    size="sm"
                    className="press h-7 flex-1 text-xs"
                    onClick={() => onRespond(ev, "accepted")}
                  >
                    <Check size={14} strokeWidth={1.8} className="mr-1" /> Accepter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="press h-7 flex-1 text-xs"
                    onClick={() => onRespond(ev, "declined")}
                  >
                    <X size={14} strokeWidth={1.8} className="mr-1" /> Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="glass p-3">
        <header className="mb-1.5 flex items-center justify-between">
          <p className="text-sm font-bold capitalize">
            {format(cursor, "MMMM yyyy", { locale: fr })}
          </p>
          <div className="flex items-center">
            <button
              aria-label="Mois précédent"
              onClick={() => onCursorChange(addMonths(cursor, -1))}
              className="press grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              aria-label="Mois suivant"
              onClick={() => onCursorChange(addMonths(cursor, 1))}
              className="press grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </header>
        <div className="grid grid-cols-7 text-center text-[0.58rem] font-semibold uppercase text-muted-foreground">
          {["l", "m", "m", "j", "v", "s", "d"].map((d, i) => (
            <span key={`${d}${i}`}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 text-center">
          {miniDays.map((day) => {
            const busy = eventsOnDay(events, day).length > 0;
            const isSelected = isSameDay(day, selected);
            const today = isSameDay(day, new Date());
            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelectDay(day)}
                className={cn(
                  "relative mx-auto my-px grid size-6 place-items-center rounded-full text-[0.68rem] font-semibold tabular-nums transition-colors hover:bg-muted",
                  !isSameMonth(day, cursor) && "opacity-30",
                  isSelected && "bg-foreground text-background",
                  today && !isSelected && "text-destructive",
                )}
              >
                {format(day, "d")}
                {busy && !isSelected ? (
                  <span className="absolute bottom-0 size-1 rounded-full bg-foreground/50" />
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass p-3">
        <p className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {format(selected, "EEEE d MMMM", { locale: fr })}
        </p>
        {dayEvents.length === 0 && extras.length === 0 ? (
          <p className="text-sm text-muted-foreground">Journée libre.</p>
        ) : (
          <div className="space-y-1.5">
            {dayEvents.map((ev) => (
              <button
                key={ev.id + ev.calendarId}
                onClick={() => onSelectEvent(ev)}
                className="press w-full rounded-lg border-l-[3px] bg-muted/45 px-2.5 py-1.5 text-left"
                style={{ borderLeftColor: ev.color ?? "var(--brand)" }}
              >
                <p className="truncate text-sm font-semibold">{ev.title}</p>
                <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Clock className="size-3" />
                  {ev.allDay ? "Journée entière" : format(new Date(ev.start), "HH:mm")}
                  {ev.calendarName ? ` · ${ev.calendarName}` : ""}
                </p>
                {ev.location ? (
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {ev.location}
                  </p>
                ) : null}
              </button>
            ))}
            {extras.map((x) => (
              <div key={x.id} className="rounded-lg px-2.5 py-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                  <span
                    className="size-1.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: x.color ?? "currentColor" }}
                  />
                  {x.label}
                </p>
                <p className="pl-3 text-xs text-muted-foreground">{x.hint}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="glass p-3">
        <p className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Mes agendas
        </p>
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun agenda Google relié.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(grouped).map(([account, list]) => (
              <div key={account}>
                <p className="mb-1 truncate text-[0.68rem] font-semibold text-muted-foreground">
                  {account}
                </p>
                <ul className="space-y-1">
                  {list.map((s) => {
                    const key = `${s.accountKey}::${s.calendarId}`;
                    return (
                      <li key={key} className="flex items-center gap-2">
                        <Checkbox
                          id={key}
                          checked={!hidden.includes(key)}
                          onCheckedChange={() => onToggleSource(key)}
                          style={{ borderColor: s.color ?? undefined }}
                        />
                        <label
                          htmlFor={key}
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-sm font-medium"
                        >
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ backgroundColor: s.color ?? "var(--brand)" }}
                          />
                          <span className="truncate">{s.name}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}
