import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, KanbanSquare, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { WeatherBadge } from "@/components/weather-badge";
import { KpiCard } from "@/components/app/kpi-card";
import { AgendaPanel } from "@/components/dashboard/agenda-panel";
import { TasksPanel } from "@/components/dashboard/tasks-panel";
import { DeadlinesPanel } from "@/components/dashboard/deadlines-panel";
import { WeekTimeline } from "@/components/dashboard/week-timeline";
import { FreeTodo } from "@/components/dashboard/free-todo";
import {
  fmtEUR,
  profileQuery,
  projectsQuery,
  tasksQuery,
  transactionsQuery,
  weatherQuery,
} from "@/lib/data";
import { useWorkspace, workspaceMeta } from "@/lib/workspace";
import { daysUntil, todayISO } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Studio ALIAS & Allan Klein" },
      {
        name: "description",
        content:
          "Vue d'ensemble du jour : indicateurs clés, agenda Google, tâches, deadlines projets et budget par profil.",
      },
      { property: "og:title", content: "Dashboard — Studio ALIAS & Allan Klein" },
      {
        property: "og:description",
        content: "Indicateurs, agenda, tâches, deadlines et budget réunis sur un écran.",
      },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Bonne nuit";
  if (h < 12) return "Bonne journée";
  if (h < 18) return "Bel après-midi";
  return "Bonne soirée";
}

function Dashboard() {
  const { workspace } = useWorkspace();
  const ws = workspaceMeta(workspace);
  const { data: profile } = useQuery(profileQuery());
  const { data: projects } = useQuery(projectsQuery(workspace));
  const { data: tasks } = useQuery(tasksQuery(workspace));
  const { data: transactions } = useQuery(transactionsQuery(workspace));
  const { data: weather } = useQuery({
    ...weatherQuery(
      Number(profile?.weather_lat ?? 43.6045),
      Number(profile?.weather_lon ?? 1.4442),
    ),
    enabled: Boolean(profile),
  });

  const list = projects ?? [];
  const active = list.filter((p) => !["termine", "archiver"].includes(p.status));
  const late = active.filter((p) => p.deadline && daysUntil(p.deadline) < 0);
  const todayTasks = (tasks ?? []).filter(
    (t) => !t.parent_task_id && (t.scheduled_date === todayISO() || t.due_date === todayISO()),
  );
  const done = todayTasks.filter((t) => t.status === "termine").length;
  const revenue = (transactions ?? [])
    .filter((t) => t.kind === "revenu")
    .reduce((s, t) => s + Number(t.amount), 0);
  const expense = (transactions ?? [])
    .filter((t) => t.kind === "depense")
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <AppShell>
      <section className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <p className="text-[0.7rem] uppercase tracking-[0.16em] text-brand">{ws.name}</p>
          <h1 className="mt-1 truncate text-2xl font-display tracking-tight sm:text-3xl">
            {greeting()} {(profile?.display_name ?? "Allan").split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {active.length} projet(s) actifs · {todayTasks.length - done} tâche(s) restantes
            aujourd'hui
          </p>
        </div>
        <WeatherBadge weather={weather} city={profile?.weather_city ?? "Toulouse"} />
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Projets actifs"
          value={String(active.length)}
          hint={`${list.length} au total`}
          icon={KanbanSquare}
          tone="brand"
        />
        <KpiCard
          label="Tâches du jour"
          value={`${done}/${todayTasks.length}`}
          hint="terminées"
          icon={CheckCircle2}
        />
        <KpiCard
          label="En retard"
          value={String(late.length)}
          hint={late[0]?.name ?? "Tout est à jour"}
          icon={AlertTriangle}
          tone={late.length > 0 ? "danger" : "default"}
        />
        <KpiCard
          label="Résultat"
          value={fmtEUR(revenue - expense)}
          hint={`${fmtEUR(revenue)} entrées · ${fmtEUR(expense)} sorties`}
          icon={Wallet}
          tone={revenue - expense < 0 ? "danger" : "brand"}
        />
      </section>

      <section className="mb-6">
        <WeekTimeline />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <AgendaPanel />
        <TasksPanel />
        <DeadlinesPanel />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <FreeTodo />
        <ActivityPanel />
      </div>
    </AppShell>
  );
}

function ActivityPanel() {
  const { workspace } = useWorkspace();
  const { data: projects } = useQuery(projectsQuery(workspace));
  const items = (projects ?? [])
    .filter((p) => p.next_step)
    .slice(0, 8)
    .map((p) => ({ id: p.id, name: p.name, step: p.next_step! }));

  return (
    <section className="surface overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
          Prochaines actions
        </p>
        <h2 className="text-sm font-display">Ce qui avance</h2>
      </div>
      <div className="p-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Renseignez la « prochaine étape » d'un projet pour la voir apparaître ici.
          </p>
        ) : (
          <ul className="space-y-1">
            {items.map((i) => (
              <li key={i.id} className="soft-row px-2 py-1.5">
                <p className="truncate text-sm">{i.step}</p>
                <p className="truncate text-xs text-muted-foreground">{i.name}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
