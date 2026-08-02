import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Clock, Flame, MapPin } from "lucide-react";
import { getCalendarEvents } from "@/lib/agenda.functions";
import { projectsQuery, tasksQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { Panel, EmptyState } from "@/components/app/panel";
import { RowsSkeleton } from "@/components/app/skeletons";
import { EventDialog, type EventDraft } from "@/components/calendar/event-dialog";
import { daysUntil, fmtTime, todayISO } from "@/lib/dates";
import { statusDot } from "@/lib/project-status";
import { cn } from "@/lib/utils";

/** Prochaine réunion, tâches prioritaires et projets à risque, sur un seul écran. */
export function InsightsPanel() {
  const { workspace } = useWorkspace();
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const fetchEvents = useServerFn(getCalendarEvents);
  const { data: projects, isLoading: loadingProjects } = useQuery(projectsQuery(workspace));
  const { data: tasks, isLoading: loadingTasks } = useQuery(tasksQuery(workspace));

  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["calendar", "next-meeting", todayISO()],
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: () => {
      const now = new Date();
      return fetchEvents({
        data: {
          timeMin: now.toISOString(),
          timeMax: new Date(now.getTime() + 3 * 86400000).toISOString(),
          calendarIds: [],
        },
      });
    },
  });

  const nextMeeting = useMemo(
    () => (events ?? []).filter((ev) => !ev.allDay && new Date(ev.start) > new Date())[0] ?? null,
    [events],
  );

  const priority = (tasks ?? [])
    .filter((t) => !t.parent_task_id && t.status !== "termine")
    .sort((a, b) => {
      const rank = (p: string) => (p === "haute" ? 0 : p === "moyenne" ? 1 : 2);
      return (
        rank(a.priority) - rank(b.priority) ||
        (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999")
      );
    })
    .slice(0, 4);

  const atRisk = (projects ?? [])
    .filter((p) => !["termine", "archiver"].includes(p.status) && p.deadline)
    .map((p) => ({ project: p, left: daysUntil(p.deadline!) }))
    .filter(({ project, left }) => left < 0 || (left <= 7 && project.progress < 70))
    .sort((a, b) => a.left - b.left)
    .slice(0, 4);

  const loading = loadingProjects || loadingTasks || loadingEvents;

  return (
    <Panel eyebrow="Priorités" title="À surveiller">
      {loading ? (
        <RowsSkeleton rows={5} />
      ) : (
        <div className="space-y-4">
          <div>
            <p className="eyebrow mb-1.5 flex items-center gap-1.5">
              <Clock className="size-3.5" strokeWidth={1.5} /> Prochaine réunion
            </p>
            {nextMeeting ? (
              <button
                onClick={() => setDraft({ date: new Date(nextMeeting.start), event: nextMeeting })}
                className="soft-row press flex w-full items-center gap-2.5 px-2 py-1.5 text-left"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: nextMeeting.color ?? "var(--brand)" }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{nextMeeting.title}</span>
                  <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    {nextMeeting.location ? <MapPin className="size-3 shrink-0" /> : null}
                    {[nextMeeting.location, nextMeeting.accountEmail].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                  {fmtTime(nextMeeting.start)}
                </span>
              </button>
            ) : (
              <p className="px-2 text-sm text-muted-foreground">Aucune réunion à venir.</p>
            )}
          </div>

          <div>
            <p className="eyebrow mb-1.5 flex items-center gap-1.5">
              <Flame className="size-3.5" strokeWidth={1.5} /> Tâches prioritaires
            </p>
            {priority.length === 0 ? (
              <p className="px-2 text-sm text-muted-foreground">Tout est traité.</p>
            ) : (
              <ul className="space-y-0.5">
                {priority.map((t) => (
                  <li key={t.id} className="soft-row flex items-center gap-2.5 px-2 py-1.5">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        t.priority === "haute" ? "bg-destructive" : "bg-muted-foreground/50",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                    {t.due_date ? (
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                        J{daysUntil(t.due_date) < 0 ? "+" : "-"}
                        {Math.abs(daysUntil(t.due_date))}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="eyebrow mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="size-3.5" strokeWidth={1.5} /> Projets à risque
            </p>
            {atRisk.length === 0 ? (
              <EmptyState hint="Aucun projet en retard ni en dessous de son avancement attendu.">
                Tous les projets sont sur les rails.
              </EmptyState>
            ) : (
              <ul className="space-y-0.5">
                {atRisk.map(({ project, left }) => (
                  <li key={project.id} className="soft-row flex items-center gap-2.5 px-2 py-1.5">
                    <span className={cn("size-2 shrink-0 rounded-full", statusDot(project.status))} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{project.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {project.progress}% ·{" "}
                        {left < 0 ? `${Math.abs(left)} j de retard` : `J-${left}`}
                      </span>
                    </span>
                    <Link
                      to="/projets"
                      className="shrink-0 text-xs font-medium underline-offset-4 hover:underline"
                    >
                      Ouvrir
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <EventDialog draft={draft} onClose={() => setDraft(null)} />
    </Panel>
  );
}