import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, MapPin } from "lucide-react";
import { getCalendarEvents } from "@/lib/agenda.functions";
import { Panel, EmptyState } from "@/components/app/panel";
import { RangeToggle } from "@/components/range-toggle";
import { fmtDay, fmtTime, rangeBounds, type RangeDays } from "@/lib/dates";

export function AgendaPanel() {
  const [range, setRange] = useState<RangeDays>(1);
  const fetchEvents = useServerFn(getCalendarEvents);
  const { from, to } = rangeBounds(range);

  const { data, error, isLoading } = useQuery({
    queryKey: ["calendar", from.toISOString(), to.toISOString()],
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: () => fetchEvents({ data: { timeMin: from.toISOString(), timeMax: to.toISOString() } }),
  });

  const events = data ?? [];
  const groups = events.reduce<Record<string, typeof events>>((acc, ev) => {
    const day = ev.start.slice(0, 10);
    (acc[day] ??= []).push(ev);
    return acc;
  }, {});

  return (
    <Panel
      eyebrow="Google Agenda"
      title="Planning"
      action={<RangeToggle value={range} onChange={setRange} />}
    >
      {error ? (
        <EmptyState>
          Agenda Google indisponible pour le moment. Vérifiez la connexion du calendrier.
        </EmptyState>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement de l'agenda…</p>
      ) : events.length === 0 ? (
        <EmptyState>Aucun évènement sur cette période.</EmptyState>
      ) : (
        <div className="space-y-4">
          {Object.entries(groups).map(([day, list]) => (
            <div key={day}>
              <p className="mb-1.5 flex items-center gap-1.5 text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                <CalendarDays className="size-3" /> {fmtDay(day)}
              </p>
              <ul className="space-y-1">
                {list.map((ev) => (
                  <li key={ev.id} className="soft-row flex items-start gap-3 px-2 py-1.5">
                    <span className="w-14 shrink-0 pt-0.5 text-xs tabular-nums text-brand">
                      {ev.allDay ? "Journée" : fmtTime(ev.start)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{ev.title}</span>
                      {ev.location ? (
                        <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="size-3 shrink-0" /> {ev.location}
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
