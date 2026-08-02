import { setMonth, setYear, format, getMonth, getYear } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTHS = Array.from({ length: 12 }, (_, i) => i);

export function MonthYearPicker({
  cursor,
  onChange,
  label,
  monthPicker = true,
}: {
  cursor: Date;
  onChange: (d: Date) => void;
  label: string;
  monthPicker?: boolean;
}) {
  const year = getYear(cursor);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="press ml-1 truncate rounded-lg px-2 py-1 text-base font-bold capitalize transition-colors hover:bg-muted/70"
          title="Changer de mois ou d'année"
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 rounded-2xl p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            aria-label="Année précédente"
            onClick={() => onChange(setYear(cursor, year - 1))}
            className="press grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <p className="text-sm font-bold tabular-nums">{year}</p>
          <button
            aria-label="Année suivante"
            onClick={() => onChange(setYear(cursor, year + 1))}
            className="press grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        {monthPicker ? (
          <div className="grid grid-cols-3 gap-1">
            {MONTHS.map((m) => (
              <button
                key={m}
                onClick={() => onChange(setMonth(cursor, m))}
                className={cn(
                  "press rounded-lg px-1 py-1.5 text-xs font-semibold capitalize transition-colors hover:bg-muted",
                  getMonth(cursor) === m && "bg-foreground text-background hover:bg-foreground",
                )}
              >
                {format(setMonth(cursor, m), "MMM", { locale: fr })}
              </button>
            ))}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
