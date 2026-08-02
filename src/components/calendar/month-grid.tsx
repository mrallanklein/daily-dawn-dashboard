import {
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
}: {
  cursor: Date;
  selected: Date;
  events: CalendarEvent[];
  markers?: (day: Date) => { id: string; label: string; color?: string }[];
  onSelectDay: (day: Date) => void;
  onCreateDay: (day: Date) => void;
  onSelectEvent: (ev: CalendarEvent) => void;
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
  });

  return (
    <div className="min-w-0">
      <div className="grid grid-cols-7 border-b border-border/70">
        {["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].map((d) => (
          <p
            key={d}
            className="px-2 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {d}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7">
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
              className={cn(
                "min-h-[6.5rem] cursor-pointer border-b border-l border-border/40 p-1.5 transition-colors first:border-l-0 hover:bg-muted/40",
                !isSameMonth(day, cursor) && "bg-muted/20 opacity-55",
                isSelected && "bg-muted/60 ring-1 ring-inset ring-border",
              )}
            >
              <span
                className={cn(
                  "inline-grid size-6 place-items-center rounded-full text-xs font-bold tabular-nums",
                  today ? "bg-destructive text-destructive-foreground" : "text-foreground/85",
                )}
              >
                {format(day, "d")}
              </span>
              <div className="mt-1 space-y-0.5">
                {shown.map((ev) => (
                  <button
                    key={ev.id + ev.calendarId}
                    title={ev.title}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(ev);
                    }}
                    className="flex w-full items-center gap-1 rounded px-1 text-left text-[0.65rem] font-semibold"
                    style={{
                      backgroundColor: ev.allDay ? `${ev.color ?? "#7c7c7c"}33` : undefined,
                    }}
                  >
                    {!ev.allDay ? (
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: ev.color ?? "#5b8def" }}
                      />
                    ) : null}
                    {!ev.allDay ? (
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {format(new Date(ev.start), "HH")}h
                      </span>
                    ) : null}
                    <span className="truncate">{ev.title}</span>
                  </button>
                ))}
                {extra.slice(0, 2).map((m) => (
                  <p
                    key={m.id}
                    title={m.label}
                    className="flex items-center gap-1 truncate text-[0.64rem] font-medium text-muted-foreground"
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-sm"
                      style={{ backgroundColor: m.color ?? "currentColor" }}
                    />
                    <span className="truncate">{m.label}</span>
                  </p>
                ))}
                {hidden > 0 ? (
                  <p className="px-1 text-[0.62rem] font-semibold text-muted-foreground">
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
