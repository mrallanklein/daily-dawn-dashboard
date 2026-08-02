import { useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  addDays,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { CalendarEvent } from "@/lib/agenda.functions";
import { eventsOnDay } from "./calendar-utils";
import { cn } from "@/lib/utils";

export function MonthGrid({
  cursor,
  selected,
  events,
  markers,
  onSelectDay,
  onCreateDay,
  onSelectEvent,
  onMoveEvent,
}: {
  cursor: Date;
  selected: Date;
  events: CalendarEvent[];
  markers?: (day: Date) => { id: string; label: string; color?: string }[];
  onSelectDay: (day: Date) => void;
  onCreateDay: (day: Date) => void;
  onSelectEvent: (ev: CalendarEvent) => void;
  /** Glisser-déposer : l'évènement est déplacé vers le jour cible. */
  onMoveEvent?: (ev: CalendarEvent, day: Date) => void;
}) {
  const [dragged, setDragged] = useState<CalendarEvent | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
  });

  return (
    <div className="min-w-0">
      <div className="grid grid-cols-7 px-3 pt-2">
        {["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].map((d) => (
          <p
            key={d}
            className="px-1 pb-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {d}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7 px-3 pb-3">
        {days.map((day) => {
          const dayEvents = eventsOnDay(events, day);
          const extra = markers?.(day) ?? [];
          const today = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selected);
          const shown = dayEvents.slice(0, 3);
          const hidden = dayEvents.length - shown.length + Math.max(0, extra.length - 2);
          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDay(day)}
              onDoubleClick={() => onCreateDay(day)}
              onDragOver={(e) => {
                if (!dragged) return;
                e.preventDefault();
                setOver(day.toISOString());
              }}
              onDragLeave={() => setOver((k) => (k === day.toISOString() ? null : k))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                if (dragged && onMoveEvent && !isSameDay(parseISO(dragged.start), day)) {
                  onMoveEvent(dragged, day);
                }
                setDragged(null);
              }}
              className={cn(
                "min-h-[6.5rem] cursor-pointer rounded-xl border border-transparent p-1.5 transition-colors hover:bg-muted/60",
                !isSameMonth(day, cursor) && "opacity-40",
                isSelected && "border-border bg-muted/70 shadow-[var(--shadow-soft)]",
                over === day.toISOString() && "border-brand bg-brand/10",
              )}
            >
              <span
                className={cn(
                  "inline-grid size-7 place-items-center rounded-full text-[0.85rem] font-bold tabular-nums",
                  today ? "bg-destructive text-destructive-foreground" : "text-foreground/85",
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-[3px]">
                {shown.map((ev) => {
                  const start = startOfDay(parseISO(ev.start));
                  const rawEnd = ev.end ? parseISO(ev.end) : parseISO(ev.start);
                  // Fin exclusive pour les journées entières.
                  const end = startOfDay(
                    ev.allDay && rawEnd.getTime() > start.getTime() ? addDays(rawEnd, -1) : rawEnd,
                  );
                  const multi = end.getTime() > start.getTime();
                  const isStart = isSameDay(start, day);
                  const isEnd = isSameDay(end, day);
                  const band = multi;
                  // Apple Calendar : le titre est répété au début de chaque semaine
                  // pour rester lisible sur toute la durée de l'évènement.
                  const isWeekStart = day.getDay() === 1;
                  const showTitle = !band || isStart || isWeekStart;
                  return (
                    <button
                      key={ev.id + ev.calendarId}
                      title={ev.title}
                      draggable={Boolean(onMoveEvent)}
                      onDragStart={(e) => {
                        e.stopPropagation();
                        setDragged(ev);
                      }}
                      onDragEnd={() => {
                        setDragged(null);
                        setOver(null);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev);
                      }}
                      className={cn(
                        "flex h-[1.15rem] items-center gap-1 px-1 text-left text-[0.76rem] font-semibold leading-none",
                        onMoveEvent && "cursor-grab active:cursor-grabbing",
                        dragged === ev && "opacity-50",
                        band
                          ? cn(
                              "-mx-1.5 w-[calc(100%+0.75rem)] rounded-none px-1.5",
                              isStart && "ml-0 w-[calc(100%+0.375rem)] rounded-l-full",
                              isEnd && "mr-0 w-[calc(100%+0.375rem)] rounded-r-full",
                              isStart && isEnd && "w-full rounded-full",
                            )
                          : "w-full rounded",
                      )}
                      style={{
                        backgroundColor:
                          ev.allDay || band ? `${ev.color ?? "#7c7c7c"}33` : undefined,
                      }}
                    >
                      {!ev.allDay && !band ? (
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: ev.color ?? "#5b8def" }}
                        />
                      ) : null}
                      {!ev.allDay && !band ? (
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {format(new Date(ev.start), "HH")}h
                        </span>
                      ) : null}
                      <span className={cn("truncate", band && !showTitle && "opacity-0")}>
                        {showTitle ? ev.title : "\u00A0"}
                      </span>
                    </button>
                  );
                })}
                {extra.slice(0, 2).map((m) => (
                  <p
                    key={m.id}
                    title={m.label}
                    className="flex items-center gap-1 truncate text-[0.75rem] font-medium text-muted-foreground"
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: m.color ?? "currentColor" }}
                    />
                    <span className="truncate">{m.label}</span>
                  </p>
                ))}
                {hidden > 0 ? (
                  <p className="px-1 text-[0.74rem] font-semibold text-muted-foreground">
                    +{hidden}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className="sr-only">{format(cursor, "MMMM yyyy", { locale: fr })}</p>
    </div>
  );
}
