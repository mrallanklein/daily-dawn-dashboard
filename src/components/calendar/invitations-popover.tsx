import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, Check, HelpCircle, X } from "lucide-react";
import type { CalendarEvent } from "@/lib/agenda.functions";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function InvitationsPopover({
  invitations,
  onRespond,
  onSelectEvent,
}: {
  invitations: CalendarEvent[];
  onRespond: (ev: CalendarEvent, response: "accepted" | "declined" | "tentative") => void;
  onSelectEvent: (ev: CalendarEvent) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Invitations reçues"
          className="press relative grid size-8 place-items-center rounded-full border border-border bg-background/70 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bell size={16} strokeWidth={1.6} />
          {invitations.length > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[0.6rem] font-bold text-destructive-foreground">
              {invitations.length}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-2xl p-3">
        <p className="mb-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Invitations
        </p>
        {invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune invitation en attente.</p>
        ) : (
          <div className="space-y-2">
            {invitations.map((ev) => (
              <div
                key={`inv-${ev.id}${ev.calendarId}`}
                className="rounded-xl border-l-[3px] bg-muted/45 p-2.5"
                style={{ borderLeftColor: ev.color ?? "var(--brand)" }}
              >
                <button onClick={() => onSelectEvent(ev)} className="block w-full text-left">
                  <p className="truncate text-sm font-bold">{ev.title}</p>
                  <p className="truncate text-xs font-medium text-muted-foreground">
                    {format(new Date(ev.start), "EEE d MMM · HH:mm", { locale: fr })}
                    {ev.organizer ? ` · ${ev.organizer}` : ""}
                  </p>
                </button>
                <div className="mt-2 flex gap-1">
                  <Button
                    size="sm"
                    className="press h-7 flex-1 rounded-full text-xs"
                    onClick={() => onRespond(ev, "accepted")}
                  >
                    <Check size={14} strokeWidth={1.8} className="mr-1" /> Accepter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="press h-7 flex-1 rounded-full text-xs"
                    onClick={() => onRespond(ev, "tentative")}
                  >
                    <HelpCircle size={14} strokeWidth={1.8} className="mr-1" /> Peut-être
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="press h-7 flex-1 rounded-full text-xs"
                    onClick={() => onRespond(ev, "declined")}
                  >
                    <X size={14} strokeWidth={1.8} className="mr-1" /> Refuser
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
