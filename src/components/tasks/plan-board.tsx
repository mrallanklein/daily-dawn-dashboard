import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react";
import { cn } from "@/lib/utils";

/** Type MIME utilisé par tous les glisser-déposer de planification. */
export const PLAN_MIME = "text/plan-item";

export type PlanItem = {
  id: string;
  title: string;
  date: string | null;
  color?: string;
};

export function planDragProps(id: string) {
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData(PLAN_MIME, id);
      e.dataTransfer.setData("text/plain", id);
    },
  };
}

function readId(e: React.DragEvent) {
  return e.dataTransfer.getData(PLAN_MIME) || e.dataTransfer.getData("text/plain");
}

/**
 * Colonne de planification : calendrier ou liste chronologique.
 * Déposer un élément sur un jour lui assigne cette date.
 */
export function PlanBoard({
  items,
  onAssign,
  label = "Planifiés",
}: {
  items: PlanItem[];
  onAssign: (id: string, date: string | null) => void;
  label?: string;
}) {
  const [mode, setMode] = useState<"calendar" | "list">("calendar");
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [over, setOver] = useState<string | null>(null);

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
  });
  const dated = items.filter((i) => i.date);
  const sorted = [...dated].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

  return (
    <div className="glass topline elevate flex min-w-0 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor((c) => addMonths(c, -1))}
            aria-label="Mois précédent"
            className="press grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" strokeWidth={1.5} />
          </button>
          <p className="min-w-[8.5rem] text-center text-sm font-semibold capitalize">
            {format(cursor, "MMMM yyyy", { locale: fr })}
          </p>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            aria-label="Mois suivant"
            className="press grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex items-center gap-0.5 rounded-full border border-border bg-muted/50 p-0.5">
          {(
            [
              { id: "calendar", label: "Calendrier", Icon: CalendarDays },
              { id: "list", label: "Liste", Icon: List },
            ] as const
          ).map(({ id, label: l, Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors",
                mode === id
                  ? "bg-background font-medium shadow-[var(--shadow-xs)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" strokeWidth={1.5} /> {l}
            </button>
          ))}
        </div>
      </div>

      {mode === "calendar" ? (
        <div className="p-3">
          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <span key={`${d}-${i}`}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const iso = format(day, "yyyy-MM-dd");
              const dayItems = dated.filter((i) => i.date && isSameDay(parseISO(i.date), day));
              return (
                <div
                  key={iso}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setOver(iso);
                  }}
                  onDragLeave={() => setOver((c) => (c === iso ? null : c))}
                  onDrop={(e) => {
                    e.preventDefault();
                    setOver(null);
                    const id = readId(e);
                    if (id) onAssign(id, iso);
                  }}
                  className={cn(
                    "min-h-[4.25rem] rounded-xl border border-border/60 p-1 transition-colors",
                    isSameMonth(day, cursor) ? "bg-card/60" : "bg-muted/25",
                    isSameDay(day, new Date()) && "ring-1 ring-inset ring-foreground/25",
                    over === iso && "border-foreground/40 bg-muted/70",
                  )}
                >
                  <p
                    className={cn(
                      "num px-1 text-[0.7rem] font-semibold",
                      isSameMonth(day, cursor) ? "text-foreground" : "text-muted-foreground/60",
                    )}
                  >
                    {format(day, "d")}
                  </p>
                  <div className="space-y-0.5">
                    {dayItems.slice(0, 2).map((i) => (
                      <p
                        key={i.id}
                        {...planDragProps(i.id)}
                        title={i.title}
                        className="cursor-grab truncate rounded px-1 py-0.5 text-[0.68rem] font-medium active:cursor-grabbing"
                        style={{
                          backgroundColor: i.color ? `${i.color}22` : "var(--muted)",
                          color: i.color ?? "var(--foreground)",
                        }}
                      >
                        {i.title}
                      </p>
                    ))}
                    {dayItems.length > 2 ? (
                      <p className="px-1 text-[0.65rem] text-muted-foreground">
                        +{dayItems.length - 2}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-3">
          <p className="eyebrow mb-2">{label}</p>
          {sorted.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
              Rien de planifié.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {sorted.map((i) => (
                <li
                  key={i.id}
                  {...planDragProps(i.id)}
                  className="soft-row flex cursor-grab items-center gap-2 px-2 py-1.5 active:cursor-grabbing"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: i.color ?? "var(--muted-foreground)" }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{i.title}</span>
                  <span className="num shrink-0 text-xs text-muted-foreground">
                    {i.date ? format(parseISO(i.date), "d MMM", { locale: fr }) : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Zone qui retire la date des éléments déposés (retour « à planifier »). */
export function UnplanDropZone({
  onUnassign,
  children,
  className,
}: {
  onUnassign: (id: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [active, setActive] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setActive(true);
      }}
      onDragLeave={() => setActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setActive(false);
        const id = readId(e);
        if (id) onUnassign(id);
      }}
      className={cn(
        "rounded-2xl transition-colors",
        active && "ring-1 ring-inset ring-foreground/25",
        className,
      )}
    >
      {children}
    </div>
  );
}
