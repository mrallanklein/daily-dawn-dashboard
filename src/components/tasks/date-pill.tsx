import { useState } from "react";
import { format, addDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { todayISO } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Libellé court d'une date : Aujourd'hui, Demain, Hier ou « 2 sept. ». */
function label(date: string) {
  const today = todayISO();
  if (date === today) return "Aujourd'hui";
  if (date === format(addDays(new Date(), 1), "yyyy-MM-dd")) return "Demain";
  if (date === format(addDays(new Date(), -1), "yyyy-MM-dd")) return "Hier";
  return format(parseISO(date), "d MMM", { locale: fr });
}

/** Puce de date cliquable, avec raccourcis Aujourd'hui / Demain et calendrier. */
export function DatePill({
  date,
  onChange,
  overdue,
}: {
  date: string | null;
  onChange: (value: string | null) => void;
  overdue?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const set = (value: string | null) => {
    onChange(value);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "press inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium transition-colors hover:bg-muted",
            date ? "text-muted-foreground" : "text-muted-foreground/70",
            overdue && "text-destructive",
          )}
        >
          <CalendarDays className="size-3.5" strokeWidth={1.5} />
          {date ? label(date) : "Date"}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => set(todayISO())}
            className="press rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted"
          >
            Aujourd'hui
          </button>
          <button
            type="button"
            onClick={() => set(format(addDays(new Date(), 1), "yyyy-MM-dd"))}
            className="press rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted"
          >
            Demain
          </button>
          <button
            type="button"
            onClick={() => set(format(addDays(new Date(), 7), "yyyy-MM-dd"))}
            className="press rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted"
          >
            Semaine prochaine
          </button>
          {date ? (
            <button
              type="button"
              onClick={() => set(null)}
              className="press rounded-md border border-border px-2 py-1 text-xs font-medium text-destructive hover:bg-muted"
            >
              Retirer
            </button>
          ) : null}
        </div>
        <Calendar
          mode="single"
          selected={date ? parseISO(date) : undefined}
          onSelect={(d) => d && set(format(d, "yyyy-MM-dd"))}
          locale={fr}
          className={cn("p-0 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
