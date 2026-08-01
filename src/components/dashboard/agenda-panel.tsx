import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, MapPin, Plus } from "lucide-react";
import { getCalendarEvents } from "@/lib/agenda.functions";
import { EventDialog, type EventDraft } from "@/components/calendar/event-dialog";
import { RangeToggle } from "@/components/range-toggle";
import { Button } from "@/components/ui/button";
import { fmtDay, fmtTime, rangeBounds, type RangeDays } from "@/lib/dates";

export function AgendaPanel() {
  const [range, setRange] = useState<RangeDays>(1);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const fetchEvents = useServerFn(getCalendarEvents);
  const { from, to } = rangeBounds(range);

  const { data, error, isLoading } = useQuery({
    queryKey: ["calendar", "agenda", from.toISOString(), to.toISOString()],
    staleTime: 2 * 60 * 1000,
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
    <section className="glass flex min-w-0 flex-col p-3">
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <CalendarDays className="size-3.5" /> Planning
        </p>
        <div className="flex items-center gap-1.5">
          <RangeToggle value={range} onChange={setRange} />
          <Button
            size="icon"
            variant="ghost"
            className="press size-7"
            aria-label="Nouvel évènement"
            onClick={() => setDraft({ date: new Date() })}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </header>

      {error ? (
        <p className="text-sm text-muted-foreground">
          Agenda Google indisponible. Vérifiez la connexion des comptes.
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement de l'agenda…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun évènement sur cette période.</p>
      ) : (
        <div className="space-y-3">
          {Object.entries(groups).map(([day, list]) => (
            <div key={day}>
              <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {fmtDay(day)}
              </p>
              <ul className="space-y-0.5">
                {list.map((ev) => (
                  <li key={`${ev.calendarId}-${ev.id}`}>
                    <button
                      onClick={() => setDraft({ date: new Date(ev.start), event: ev })}
                      className="soft-row press flex w-full items-start gap-2.5 px-2 py-1.5 text-left"
                    >
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: ev.color ?? "var(--brand)" }}
                      />
                      <span className="w-14 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                        {ev.allDay ? "Journée" : fmtTime(ev.start)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{ev.title}</span>
                        <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                          {ev.location ? <MapPin className="size-3 shrink-0" /> : null}
                          {[ev.location, ev.accountEmail].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <EventDialog draft={draft} onClose={() => setDraft(null)} />
    </section>
  );
}
