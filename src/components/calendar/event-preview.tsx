import { format, parseISO, addDays, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, MapPin, Pencil } from "lucide-react";
import type { CalendarEvent } from "@/lib/agenda.functions";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const RESPONSE_LABELS: Record<string, string> = {
  accepted: "Accepté",
  declined: "Refusé",
  tentative: "Peut-être",
  needsAction: "Sans réponse",
};

/** Résumé lisible de la période couverte par l'évènement. */
function periodLabel(ev: CalendarEvent) {
  const start = parseISO(ev.start);
  const rawEnd = ev.end ? parseISO(ev.end) : start;
  // Fin exclusive côté Google pour les journées entières.
  const end = ev.allDay && rawEnd.getTime() > start.getTime() ? addDays(rawEnd, -1) : rawEnd;
  const day = (d: Date) => format(d, "d MMMM yyyy", { locale: fr });
  const multiDay = !isSameDay(start, end);
  if (multiDay) {
    return `${day(start)} → ${day(end)}`;
  }
  if (ev.allDay) return day(start);
  return `${day(start)} · ${format(start, "HH:mm")} – ${format(end, "HH:mm")}`;
}

/** Aperçu centré des détails d'un évènement, avec accès à l'édition. */
export function EventPreview({
  event,
  onClose,
  onEdit,
}: {
  event: CalendarEvent | null;
  onClose: () => void;
  onEdit: (ev: CalendarEvent) => void;
}) {
  return (
    <Dialog open={Boolean(event)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="gap-2 p-2 sm:max-w-md">
        {event ? (
          <>
            <header className="flex items-start gap-3 rounded-xl bg-muted/60 px-4 py-3">
              <span
                className="mt-1.5 size-3 shrink-0 rounded-full"
                style={{ backgroundColor: event.color ?? "var(--brand)" }}
              />
              <DialogTitle className="min-w-0 flex-1 text-lg font-semibold leading-snug">
                {event.title}
              </DialogTitle>
            </header>

            <section className="space-y-1 rounded-xl bg-muted/60 px-4 py-3">
              <p className="text-sm font-medium">{periodLabel(event)}</p>
              {event.allDay ? (
                <p className="text-sm text-muted-foreground">Journée entière</p>
              ) : null}
              {event.location ? (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="min-w-0 truncate">{event.location}</span>
                </p>
              ) : null}
            </section>

            {event.organizer || event.accountEmail || event.calendarName ? (
              <section className="space-y-1.5 rounded-xl bg-muted/60 px-4 py-3">
                {event.organizer ? (
                  <p className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 truncate">{event.organizer} (organisateur)</span>
                  </p>
                ) : null}
                {event.accountEmail ? (
                  <p className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 truncate">{event.accountEmail}</span>
                  </p>
                ) : null}
                {event.calendarName ? (
                  <p className="pl-6 text-sm text-muted-foreground">{event.calendarName}</p>
                ) : null}
              </section>
            ) : null}

            {event.description ? (
              <section className="max-h-40 overflow-y-auto whitespace-pre-line rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                {event.description}
              </section>
            ) : null}

            <footer className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-2.5">
              <p className="min-w-0 truncate text-sm text-muted-foreground">
                {event.myResponse
                  ? `Ma réponse : ${RESPONSE_LABELS[event.myResponse] ?? event.myResponse}`
                  : "Aperçu de l'évènement"}
              </p>
              <Button size="sm" variant="secondary" className="press" onClick={() => onEdit(event)}>
                <Pencil className="mr-1.5 size-3.5" /> Modifier
              </Button>
            </footer>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
