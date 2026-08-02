import { useEffect, useRef, useState } from "react";
import {
  differenceInCalendarDays,
  eachMonthOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { BookOpen, Diamond } from "lucide-react";
import type { Milestone, Project, Task } from "@/lib/data";
import { PROJECT_STATUSES, statusLabel } from "@/lib/project-status";
import { projectRisk } from "@/lib/project-risk";
import { RiskBadge } from "@/components/projects/risk-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DAY = 30; // largeur d'un jour en px

/** Couleur conditionnelle de la barre : vert terminé, rouge en retard, orange proche, gris sinon. */
function barColor(p: Project, end: Date, today: Date) {
  if (p.status === "termine" || p.status === "publier") return "var(--success)";
  if (p.status === "pas_commence" || p.status === "archiver") return "var(--muted-foreground)";
  const left = differenceInCalendarDays(end, today);
  if (left < 0) return "var(--destructive)";
  if (left <= 7) return "var(--warning)";
  return "var(--muted-foreground)";
}

export function GanttView({
  projects,
  tasks = [],
  milestones = [],
  onSelect,
}: {
  projects: Project[];
  tasks?: Task[];
  milestones?: Milestone[];
  onSelect: (p: Project) => void;
}) {
  const [status, setStatus] = useState("all");
  const [hover, setHover] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const todayOffset = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = Math.max(todayOffset.current - el.clientWidth / 2, 0);
  }, [status]);

  const dated = projects.filter(
    (p) => (p.start_date || p.deadline) && (status === "all" || p.status === status),
  );

  if (dated.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Ajoutez des dates de début ou d'échéance pour afficher la chronologie.
      </p>
    );
  }

  const today = startOfDay(new Date());
  const starts = dated.map((p) => parseISO(p.start_date ?? p.deadline!));
  const ends = dated.map((p) => parseISO(p.deadline ?? p.start_date!));
  const min = startOfDay(new Date(Math.min(...starts.map((d) => d.getTime()), today.getTime())));
  const max = startOfDay(new Date(Math.max(...ends.map((d) => d.getTime()), today.getTime())));
  const totalDays = Math.max(differenceInCalendarDays(max, min) + 1, 1);
  const x = (d: Date) => differenceInCalendarDays(startOfDay(d), min) * DAY;
  const months = eachMonthOfInterval({ start: min, end: max });
  todayOffset.current = x(today);

  /** Ligne de chaque projet affiché : sert à tracer les liens de dépendance. */
  const rowIndex = new Map(dated.map((p, i) => [p.id, i]));
  const ROW = 44;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow">Chronologie</p>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-[11rem] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les états</SelectItem>
            {PROJECT_STATUSES.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div ref={scrollRef} className="overflow-x-auto">
        <div style={{ width: `${12 * 16 + totalDays * DAY}px` }} className="min-w-full">
          {/* En-tête des mois */}
          <div className="flex border-b border-border/70">
            <div className="sticky left-0 z-20 w-48 shrink-0 bg-card px-2 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Projet
            </div>
            <div className="relative h-8" style={{ width: `${totalDays * DAY}px` }}>
              {months.map((m) => {
                const from = m < min ? min : m;
                const to = endOfMonth(m) > max ? max : endOfMonth(m);
                return (
                  <span
                    key={m.toISOString()}
                    className="absolute top-0 border-l border-border/60 px-1.5 py-1.5 text-[0.7rem] font-semibold capitalize text-muted-foreground"
                    style={{ left: `${x(from)}px`, width: `${x(to) - x(from) + DAY}px` }}
                  >
                    {format(m, "MMMM yyyy", { locale: fr })}
                  </span>
                );
              })}
            </div>
          </div>

          {dated.map((p) => {
            const s = parseISO(p.start_date ?? p.deadline!);
            const e = parseISO(p.deadline ?? p.start_date!);
            const left = x(s);
            const width = Math.max(x(e) - left + DAY, DAY);
            const color = barColor(p, e, today);
            const active = hover === p.id;
            const risk = projectRisk(p, tasks, { today, projects });
            const rowMilestones = milestones.filter((m) => m.project_id === p.id);
            const upstreamRow =
              p.depends_on_id !== null ? rowIndex.get(p.depends_on_id) : undefined;
            const upstream = dated.find((d) => d.id === p.depends_on_id);
            return (
              <div
                key={p.id}
                onMouseEnter={() => setHover(p.id)}
                onMouseLeave={() => setHover((c) => (c === p.id ? null : c))}
                onClick={() => onSelect(p)}
                role="button"
                tabIndex={0}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    onSelect(p);
                  }
                }}
                className={cn(
                  "flex cursor-pointer border-b border-border/50 transition-colors",
                  active && "bg-muted/60",
                )}
              >
                <div
                  className={cn(
                    "sticky left-0 z-10 w-48 shrink-0 px-2 py-2 transition-colors",
                    active ? "bg-muted/60" : "bg-card",
                  )}
                >
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <div className="flex min-w-0 items-center gap-1.5">
                    <p className="truncate text-xs text-muted-foreground">
                      {statusLabel(p.status)}
                    </p>
                    <RiskBadge risk={risk} />
                  </div>
                </div>

                <div className="relative h-11" style={{ width: `${totalDays * DAY}px` }}>
                  <span
                    aria-hidden
                    className="absolute inset-y-0 z-10 w-px bg-destructive/60"
                    style={{ left: `${x(today) + DAY / 2}px` }}
                  />
                  {/* Lien de dépendance : de la fin du projet amont vers le début de celui-ci. */}
                  {upstream && upstreamRow !== undefined
                    ? (() => {
                        const fromX = x(parseISO(upstream.deadline ?? upstream.start_date!)) + DAY;
                        const rows = (rowIndex.get(p.id) ?? 0) - upstreamRow;
                        const late = !["termine", "publier", "archiver"].includes(upstream.status);
                        return (
                          <svg
                            aria-hidden
                            className="pointer-events-none absolute left-0 z-20 overflow-visible"
                            style={{ top: `-${rows * ROW - 22}px`, height: 1, width: "100%" }}
                          >
                            <path
                              d={`M ${fromX} 0 H ${Math.max(fromX + 8, left - 8)} V ${rows * ROW} H ${left}`}
                              fill="none"
                              strokeWidth={1.5}
                              strokeDasharray={late ? "4 3" : undefined}
                              stroke={late ? "var(--destructive)" : "var(--muted-foreground)"}
                            />
                          </svg>
                        );
                      })()
                    : null}
                  <span
                    className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full"
                    style={{ left: `${left}px`, width: `${width}px`, backgroundColor: color }}
                  />
                  {/* Jalons : losange sur la date, plein lorsqu'il est atteint. */}
                  {rowMilestones.map((m) => (
                    <span
                      key={m.id}
                      title={`${m.title} · ${format(parseISO(m.due_date), "d MMM yyyy", { locale: fr })}${m.reached ? " · atteint" : ""}`}
                      className="absolute top-1/2 z-20 -translate-y-1/2"
                      style={{
                        left: `${x(parseISO(m.due_date)) + DAY / 2 - 7}px`,
                        color: m.reached ? "var(--success)" : "var(--brand)",
                      }}
                    >
                      <Diamond
                        className="size-3.5 rotate-0"
                        strokeWidth={2}
                        fill={m.reached ? "currentColor" : "var(--card)"}
                      />
                    </span>
                  ))}
                  {p.deadline ? (
                    <span
                      title={`Échéance ${format(e, "d MMMM yyyy", { locale: fr })}`}
                      className="absolute top-1/2 z-20 grid size-5 -translate-y-1/2 place-items-center rounded-full bg-card shadow-[var(--shadow-xs)]"
                      style={{ left: `${x(e) + DAY / 2 - 10}px`, color: "var(--warning)" }}
                    >
                      <BookOpen className="size-3.5" strokeWidth={1.5} />
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
