import { useMemo, useState } from "react";
import { addDays, format, isSameDay, parseISO, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import type { CalendarEvent } from "@/lib/agenda.functions";
import { eventSpan, eventsOnDay, isDayBand, usefulHourRange } from "./calendar-utils";
import { cn } from "@/lib/utils";

export function TimeGrid({
  days,
  events,
  onSelectEvent,
  onCreateAt,
  onCreateRange,
  onMoveEvent,
}: {
  days: Date[];
  events: CalendarEvent[];
  onSelectEvent: (ev: CalendarEvent) => void;
  onCreateAt: (day: Date, hour: number) => void;
  /** Sélection d'une plage horaire à la souris (création rapide). */
  onCreateRange?: (day: Date, startHour: number, endHour: number) => void;
  /** Glisser-déposer d'un évènement vers un autre jour / une autre heure. */
  onMoveEvent?: (ev: CalendarEvent, day: Date, hour: number) => void;
}) {
  const [dragged, setDragged] = useState<CalendarEvent | null>(null);
  const [sel, setSel] = useState<{ day: string; from: number; to: number } | null>(null);

  // Jour ET Semaine : on n'affiche que les heures utiles pour éviter le scroll.
  const { hours, hourPx, startHour, labelStep } = useMemo(() => {
    const { min, max } = usefulHourRange(events, days);
    const count = max - min;
    const px = Math.max(24, Math.min(52, Math.round(600 / count)));
    return {
      hours: Array.from({ length: count }, (_, i) => min + i),
      hourPx: px,
      startHour: min,
      labelStep: px < 40 ? 2 : 1,
    };
  }, [days.map((d) => d.toISOString()).join(","), events]);

  const commitSelection = () => {
    if (!sel) return;
    const day = days.find((d) => d.toISOString() === sel.day);
    const from = Math.min(sel.from, sel.to);
    const to = Math.max(sel.from, sel.to) + 1;
    setSel(null);
    if (!day) return;
    if (onCreateRange) onCreateRange(day, from, to);
    else onCreateAt(day, from);
  };

  return (
    <div className="flex w-full min-w-0 flex-col overflow-x-hidden rounded-2xl">
      <div
        className="grid w-full border-b border-border/70"
        style={{ gridTemplateColumns: `3rem repeat(${days.length}, minmax(0,1fr))` }}
      >
        <div />
        {days.map((day) => {
          const today = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} className="min-w-0 px-1 py-2 text-center">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {format(day, "EEE", { locale: fr })}
              </p>
              <p
                className={cn(
                  "mx-auto mt-0.5 grid size-8 place-items-center rounded-full text-[0.95rem] font-bold tabular-nums",
                  today ? "bg-destructive text-destructive-foreground" : "text-foreground",
                )}
              >
                {format(day, "d")}
              </p>
            </div>
          );
        })}
      </div>

      {/* Bandeau journées entières */}
      <div
        className="grid w-full border-b border-border/70 bg-muted/25"
        style={{ gridTemplateColumns: `3rem repeat(${days.length}, minmax(0,1fr))` }}
      >
        <p className="px-2 py-1 text-right text-[0.68rem] uppercase tracking-[0.1em] text-muted-foreground">
          jour
        </p>
        {days.map((day, dayIndex) => (
          <div
            key={day.toISOString()}
            className="min-w-0 space-y-[3px] border-l border-border/50 p-1"
          >
            {eventsOnDay(events, day)
              .filter((ev) => isDayBand(ev, day))
              .map((ev) => {
                const start = startOfDay(parseISO(ev.start));
                const rawEnd = ev.end ? parseISO(ev.end) : parseISO(ev.start);
                const end = startOfDay(
                  ev.allDay && rawEnd.getTime() > start.getTime() ? addDays(rawEnd, -1) : rawEnd,
                );
                const multi = end.getTime() > start.getTime();
                const isStart = isSameDay(start, day);
                const isEnd = isSameDay(end, day);
                // Titre au début de l'évènement ou à la première colonne visible.
                const showTitle = !multi || isStart || dayIndex === 0;
                return (
                  <button
                    key={ev.id + ev.calendarId}
                    title={ev.title}
                    draggable={Boolean(onMoveEvent)}
                    onDragStart={() => setDragged(ev)}
                    onDragEnd={() => setDragged(null)}
                    onClick={() => onSelectEvent(ev)}
                    className={cn(
                      "press flex h-[1.3rem] items-center text-left text-[0.78rem] font-semibold leading-none text-foreground",
                      onMoveEvent && "cursor-grab active:cursor-grabbing",
                      dragged === ev && "opacity-50",
                      multi
                        ? cn(
                            "-mx-1 w-[calc(100%+0.5rem)] rounded-none px-1.5",
                            isStart && "ml-0 w-[calc(100%+0.25rem)] rounded-l-full",
                            isEnd && "mr-0 w-[calc(100%+0.25rem)] rounded-r-full",
                            isStart && isEnd && "w-full rounded-full",
                          )
                        : "w-full rounded-full px-1.5",
                    )}
                    style={{ backgroundColor: `${ev.color ?? "#7c7c7c"}33` }}
                  >
                    <span className={cn("truncate", multi && !showTitle && "opacity-0")}>
                      {showTitle ? ev.title : "\u00A0"}
                      {showTitle && !ev.allDay ? (
                        <span className="ml-1 font-medium text-muted-foreground">
                          {format(parseISO(ev.start), "d MMM", { locale: fr })} →{" "}
                          {ev.end ? format(parseISO(ev.end), "d MMM", { locale: fr }) : ""}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>

      <div className="w-full overflow-x-hidden">
        <div
          className="relative grid w-full"
          style={{ gridTemplateColumns: `3rem repeat(${days.length}, minmax(0,1fr))` }}
        >
          <div>
            {hours.map((h) => (
              <div
                key={h}
                className="relative border-t border-border/40 pr-2 text-right"
                style={{ height: hourPx }}
              >
                <span className="absolute -top-2 right-2 text-[0.7rem] font-medium tabular-nums text-muted-foreground">
                  {(h - startHour) % labelStep === 0 ? `${String(h).padStart(2, "0")}:00` : ""}
                </span>
              </div>
            ))}
          </div>

          {days.map((day) => {
            const timed = eventsOnDay(events, day).filter((ev) => !isDayBand(ev, day));
            const today = isSameDay(day, new Date());
            const now = new Date();
            return (
              <div key={day.toISOString()} className="relative min-w-0 border-l border-border/50">
                {hours.map((h) => (
                  <button
                    key={h}
                    aria-label={`Créer un évènement à ${h}:00`}
                    onMouseDown={() => setSel({ day: day.toISOString(), from: h, to: h })}
                    onMouseEnter={() =>
                      setSel((s) => (s && s.day === day.toISOString() ? { ...s, to: h } : s))
                    }
                    onMouseUp={commitSelection}
                    onDragOver={(e) => {
                      if (dragged) e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragged && onMoveEvent) onMoveEvent(dragged, day, h);
                      setDragged(null);
                    }}
                    className={cn(
                      "block w-full border-t border-border/40 transition-colors hover:bg-muted/50",
                      sel &&
                        sel.day === day.toISOString() &&
                        h >= Math.min(sel.from, sel.to) &&
                        h <= Math.max(sel.from, sel.to) &&
                        "bg-brand/20",
                    )}
                    style={{ height: hourPx }}
                  />
                ))}

                {today &&
                now.getHours() >= startHour &&
                now.getHours() < startHour + hours.length ? (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-destructive"
                    style={{
                      top: (now.getHours() + now.getMinutes() / 60 - startHour) * hourPx,
                    }}
                  >
                    <span className="absolute -left-1 -top-1 size-2 rounded-full bg-destructive" />
                  </div>
                ) : null}

                {timed.map((ev, i) => {
                  const { top, height } = eventSpan(ev, day);
                  return (
                    <button
                      key={ev.id + ev.calendarId}
                      draggable={Boolean(onMoveEvent)}
                      onDragStart={() => setDragged(ev)}
                      onDragEnd={() => setDragged(null)}
                      onClick={() => onSelectEvent(ev)}
                      className={cn(
                        "press absolute z-10 overflow-hidden rounded-xl border-l-[3px] px-1.5 py-1 text-left shadow-[var(--shadow-soft)] backdrop-blur-sm",
                        onMoveEvent && "cursor-grab active:cursor-grabbing",
                        dragged === ev && "opacity-50",
                      )}
                      style={{
                        top: (top - startHour) * hourPx,
                        height: Math.max(20, height * hourPx - 2),
                        left: `${(i % 2) * 4 + 2}%`,
                        width: "94%",
                        backgroundColor: `${ev.color ?? "#5b8def"}2e`,
                        borderLeftColor: ev.color ?? "#5b8def",
                      }}
                    >
                      <span className="block truncate text-[0.82rem] font-bold leading-tight">
                        {ev.title}
                      </span>
                      <span className="block truncate text-[0.72rem] font-medium text-muted-foreground">
                        {format(parseISO(ev.start), "HH:mm")}
                        {ev.location ? ` · ${ev.location}` : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
