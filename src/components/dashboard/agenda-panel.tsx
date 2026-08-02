import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, MapPin, Plus } from "lucide-react";
import { getCalendarEvents, type CalendarEvent } from "@/lib/agenda.functions";
import { useWorkspace } from "@/lib/workspace";
import { EventDialog, type EventDraft } from "@/components/calendar/event-dialog";
import { EventPreview } from "@/components/calendar/event-preview";
import { RangeToggle } from "@/components/range-toggle";
import { EmptyState } from "@/components/app/panel";
import { RowsSkeleton } from "@/components/app/skeletons";
import { Button } from "@/components/ui/button";
import { fmtDay, fmtTime, rangeBounds, todayISO, type RangeDays } from "@/lib/dates";

/**
 * Jour de rattachement d'un évènement : les évènements longs (plusieurs jours)
 * en cours sont classés dans « Aujourd'hui » et non à leur date de départ.
 */
function groupDay(ev: CalendarEvent) {
  const today = todayISO();
  const start = ev.start.slice(0, 10);
  if (start >= today) return start;
  if (!ev.end) return start;
  // Fin exclusive côté Google pour les journées entières.
  const end = ev.end.slice(0, 10);
  const last = ev.allDay && end > start ? new Date(`${end}T00:00`) : new Date(ev.end);
  const lastISO = ev.allDay
    ? new Date(last.getTime() - 86400000).toISOString().slice(0, 10)
    : end;
  return lastISO >= today ? today : start;
}

export function AgendaPanel() {
  const [range, setRange] = useState<RangeDays>(1);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const [preview, setPreview] = useState<CalendarEvent | null>(null);
  const fetchEvents = useServerFn(getCalendarEvents);
  const { space } = useWorkspace();
  const calendarIds = space?.calendar_ids ?? [];
  const { from, to } = rangeBounds(range);

  const { data, error, isLoading } = useQuery({
    queryKey: ["calendar", "agenda", from.toISOString(), to.toISOString(), calendarIds.join(",")],
    staleTime: 2 * 60 * 1000,
    retry: false,
    queryFn: () =>
      fetchEvents({
        data: { timeMin: from.toISOString(), timeMax: to.toISOString(), calendarIds },
      }),
  });

  const events = data ?? [];
  const groups = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    (acc[groupDay(ev)] ??= []).push(ev);
    return acc;
  }, {});
  const days = Object.keys(groups).sort();

  return (
    <section className="glass relative flex min-w-0 flex-col self-start p-3 pb-12">
      <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <CalendarDays className="size-3.5" /> Planning
        </p>
        <RangeToggle value={range} onChange={setRange} />
      </header>

      {error ? (
        <EmptyState
          icon={CalendarDays}
          hint="Connectez vos comptes Google dans les paramètres pour afficher votre planning."
        >
          Agenda indisponible
        </EmptyState>
      ) : isLoading ? (
        <RowsSkeleton rows={4} />
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarDays} hint="Rien de prévu sur cette période.">
          Agenda vide
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {days.map((day) => (
            <div key={day}>
              <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {fmtDay(day)}
              </p>
              <ul className="space-y-0.5">
                {(groups[day] ?? []).map((ev) => (
                  <li key={`${ev.calendarId}-${ev.id}`}>
                    <button
                      onClick={() => setPreview(ev)}
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

      <Button
        size="icon"
        variant="outline"
        aria-label="Nouvel évènement"
        title="Nouvel évènement"
        onClick={() => setDraft({ date: new Date() })}
        className="press absolute bottom-3 right-3 size-9 rounded-full border-border bg-card/70 backdrop-blur-xl"
      >
        <Plus className="size-4" />
      </Button>

      <EventPreview
        event={preview}
        onClose={() => setPreview(null)}
        onEdit={(ev) => {
          setPreview(null);
          setDraft({ date: new Date(ev.start), event: ev });
        }}
      />
      <EventDialog draft={draft} onClose={() => setDraft(null)} />
    </section>
  );
}
