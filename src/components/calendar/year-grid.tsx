import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  startOfYear,
  addMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { CalendarEvent } from "@/lib/agenda.functions";
import { eventsOnDay } from "./calendar-utils";
import { cn } from "@/lib/utils";

export function YearGrid({
  cursor,
  events,
  onSelectDay,
}: {
  cursor: Date;
  events: CalendarEvent[];
  onSelectDay: (day: Date) => void;
}) {
  const months = Array.from({ length: 12 }, (_, i) => addMonths(startOfYear(cursor), i));

  return (
    <div className="grid grid-cols-2 gap-4 p-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {months.map((month) => {
        const days = eachDayOfInterval({
          start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
          end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
        });
        return (
          <div key={month.toISOString()} className="min-w-0">
            <p className="mb-1 text-sm font-bold capitalize text-destructive">
              {format(month, "MMMM", { locale: fr })}
            </p>
            <div className="grid grid-cols-7 text-center text-[0.55rem] font-semibold uppercase text-muted-foreground">
              {["l", "m", "m", "j", "v", "s", "d"].map((d, i) => (
                <span key={`${d}${i}`}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 text-center">
              {days.map((day) => {
                const busy = eventsOnDay(events, day).length > 0;
                const today = isSameDay(day, new Date());
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onSelectDay(day)}
                    className={cn(
                      "relative mx-auto my-px grid size-5 place-items-center rounded-full text-[0.65rem] font-semibold tabular-nums transition-colors hover:bg-muted",
                      !isSameMonth(day, month) && "opacity-25",
                      today && "bg-destructive text-destructive-foreground",
                    )}
                  >
                    {format(day, "d")}
                    {busy && !today ? (
                      <span className="absolute bottom-0 size-1 rounded-full bg-foreground/60" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
