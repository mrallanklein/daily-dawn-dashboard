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
import { CalendarPlus, ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { MailIcon } from "@/components/icons/notion-icons";
import type { CalendarEvent, CalendarSource } from "@/lib/agenda.functions";
import { eventsOnDay } from "./calendar-utils";
import { MonthYearPicker } from "./month-year-picker";
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
  onCursorChange,
  onSelectDay,
  onToggleSource,
  onCreate,
  onSelectEvent,
}: {
  cursor: Date;
  selected: Date;
  events: CalendarEvent[];
  sources: CalendarSource[];
  hidden: string[];
  extras: { id: string; label: string; hint: string; color?: string }[];
  onCursorChange: (d: Date) => void;
  onSelectDay: (d: Date) => void;
  onToggleSource: (key: string) => void;
  onCreate: () => void;
  onSelectEvent: (ev: CalendarEvent) => void;
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
      <Button className="press w-full justify-start rounded-xl font-semibold" onClick={onCreate}>
        <CalendarPlus className="mr-2 size-4" /> Nouvel évènement
      </Button>

      <section className="glass rounded-2xl p-4">
        <p className="mb-3 text-lg font-bold capitalize leading-tight">
          {format(selected, "EEEE d MMMM", { locale: fr })}
        </p>
        {dayEvents.length === 0 && extras.length === 0 ? (
          <p className="text-sm text-muted-foreground">Journée libre.</p>
        ) : (
          <div className="space-y-2">
            {dayEvents.map((ev) => (
              <button
                key={ev.id + ev.calendarId}
                onClick={() => onSelectEvent(ev)}
                className="press w-full rounded-xl border-l-[3px] bg-muted/45 px-3 py-2.5 text-left"
                style={{ borderLeftColor: ev.color ?? "var(--brand)" }}
              >
                <p className="truncate text-[0.95rem] font-bold leading-snug">{ev.title}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[0.8rem] font-medium text-muted-foreground">
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

      <section className="glass rounded-2xl p-3">
        <header className="mb-1.5 flex items-center justify-between">
          <MonthYearPicker
            cursor={cursor}
            onChange={onCursorChange}
            label={format(cursor, "MMMM yyyy", { locale: fr })}
          />
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
        <div className="grid grid-cols-7 text-center text-[0.7rem] font-semibold uppercase text-muted-foreground">
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
                  "relative mx-auto my-px grid size-8 place-items-center rounded-full text-[0.82rem] font-semibold tabular-nums transition-colors hover:bg-muted",
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

      <section className="glass rounded-2xl p-3">
        <p className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Mes agendas
        </p>
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun agenda Google relié.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(grouped).map(([account, list]) => (
              <div key={account}>
                <p className="mb-1 flex items-center gap-1.5 text-[0.68rem] font-semibold text-muted-foreground">
                  <MailIcon size={12} />
                  <span className="min-w-0 flex-1 truncate">{account}</span>
                  <span className="pill shrink-0">{list.length}</span>
                </p>
                <ul className="space-y-1">
                  {list.map((s) => {
                    const key = `${s.accountKey}::${s.calendarId}`;
                    return (
                      <li
                        key={key}
                        className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1"
                      >
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
                        {s.writable ? null : (
                          <span className="pill shrink-0 text-muted-foreground">lecture</span>
                        )}
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
