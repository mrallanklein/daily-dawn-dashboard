import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, MapPin } from "lucide-react";
import { getCalendarEvents, type CalendarEvent } from "@/lib/agenda.functions";
import { EmptyState, ModuleCard } from "@/components/module-card";
import { RangeToggle } from "@/components/range-toggle";
import { fmtDay, fmtTime, rangeBounds, type RangeDays } from "@/lib/dates";

export function EventsModule() {
  const [range, setRange] = useState<RangeDays>(1);
  const fetchEvents = useServerFn(getCalendarEvents);
  const { from, to } = rangeBounds(range);

  const { data, isLoading, error } = useQuery({
    queryKey: ["calendar", range],
    queryFn: () =>
      fetchEvents({ data: { timeMin: from.toISOString(), timeMax: to.toISOString() } }),
    staleTime: 5 * 60 * 1000,
  });

  const groups = new Map<string, CalendarEvent[]>();
  (data ?? []).forEach((event) => {
    const key = event.start.slice(0, 10);
    const list = groups.get(key) ?? [];
    list.push(event);
    groups.set(key, list);
  });

  return (
    <ModuleCard
      eyebrow="Google Agenda"
      title="Mes évènements"
      action={<RangeToggle value={range} onChange={setRange} />}
    >
      {isLoading ? (
        <EmptyState>Chargement de l'agenda…</EmptyState>
      ) : error ? (
        <EmptyState>Agenda indisponible : {(error as Error).message}</EmptyState>
      ) : groups.size === 0 ? (
        <EmptyState>Aucun évènement sur cette période.</EmptyState>
      ) : (
        <div className="space-y-5">
          {[...groups.entries()].map(([day, events]) => (
            <div key={day}>
              <p className="hairline pb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {fmtDay(day)}
              </p>
              <ul className="mt-2 space-y-2">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="flex gap-3 rounded-lg border border-border/60 bg-secondary/30 px-3 py-2"
                  >
                    <span className="min-w-14 text-sm text-gold">
                      {event.allDay ? "Journée" : fmtTime(event.start)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{event.title}</span>
                      {event.location ? (
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3" /> {event.location}
                        </span>
                      ) : null}
                    </span>
                    {event.htmlLink ? (
                      <a
                        href={event.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto self-center text-muted-foreground hover:text-gold"
                        aria-label="Ouvrir dans Google Agenda"
                      >
                        <CalendarClock className="size-4" />
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </ModuleCard>
  );
}