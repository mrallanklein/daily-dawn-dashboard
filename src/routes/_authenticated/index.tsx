import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { WeatherBadge } from "@/components/weather-badge";
import { AgendaPanel } from "@/components/dashboard/agenda-panel";
import { TasksPanel } from "@/components/dashboard/tasks-panel";
import { TodayFocus } from "@/components/dashboard/today-focus";
import { DeadlinesPanel } from "@/components/dashboard/deadlines-panel";
import { MailPreview } from "@/components/dashboard/mail-preview";
import { FreeTodo } from "@/components/dashboard/free-todo";
import { MonthCalendar } from "@/components/dashboard/month-calendar";
import { profileQuery, projectsQuery, tasksQuery, weatherQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { todayISO } from "@/lib/dates";
import portraitAsset from "@/assets/allan-klein.png.asset.json";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — ALIAS & Allan Klein" },
      {
        name: "description",
        content:
          "Accueil : météo du jour, planning Google Agenda, projets et tâches du jour, chronologie des deadlines, to-do libre et calendrier.",
      },
      { property: "og:title", content: "Tableau de bord — ALIAS & Allan Klein" },
      {
        property: "og:description",
        content: "Planning, projets, tâches, deadlines et calendrier réunis sur un écran.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const { workspace, space } = useWorkspace();
  const { data: profile } = useQuery(profileQuery());
  const { data: projects } = useQuery(projectsQuery(workspace));
  const { data: tasks } = useQuery(tasksQuery(workspace));
  const { data: weather } = useQuery({
    ...weatherQuery(
      Number(profile?.weather_lat ?? 43.6045),
      Number(profile?.weather_lon ?? 1.4442),
    ),
    enabled: Boolean(profile),
  });

  const avatar = space?.avatar_url ?? profile?.avatar_url ?? portraitAsset.url;
  const name = space?.name ?? profile?.display_name ?? "Allan Klein";
  const firstName = name.split(" ")[0] ?? "Allan";

  const active = (projects ?? []).filter((p) => !["termine", "archiver"].includes(p.status));
  const todayTasks = (tasks ?? []).filter(
    (t) => !t.parent_task_id && (t.scheduled_date === todayISO() || t.due_date === todayISO()),
  );
  const remaining = todayTasks.filter((t) => t.status !== "termine").length;

  return (
    <AppShell>
      <section className="glass mb-4">
        <div
          className="h-32 w-full bg-cover bg-center sm:h-44"
          style={
            (space?.banner_url ?? profile?.banner_url)
              ? { backgroundImage: `url(${space?.banner_url ?? profile?.banner_url})` }
              : {
                  backgroundImage:
                    "linear-gradient(120deg, color-mix(in oklab, var(--foreground) 12%, transparent), color-mix(in oklab, var(--muted) 90%, transparent))",
                }
          }
        />
        <div className="flex flex-wrap items-end justify-between gap-4 px-4 pb-4">
          <div className="-mt-8 flex min-w-0 items-end gap-3">
            <img
              src={avatar}
              alt={name}
              className="size-20 shrink-0 rounded-2xl border-2 border-card object-cover shadow-[var(--shadow-pop)]"
            />
            <div className="min-w-0 pb-1">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {space?.tag ?? ""}
              </p>
              <h1 className="truncate text-2xl font-display tracking-tight sm:text-3xl">
                {greeting()} {firstName}
              </h1>
              <p className="text-sm font-medium text-muted-foreground">
                {active.length} projet(s) actifs · {remaining} tâche(s) restantes aujourd'hui
              </p>
            </div>
          </div>
          <div className="pb-1">
            <WeatherBadge
              weather={weather}
              city={space?.weather_city ?? profile?.weather_city ?? "Toulouse"}
            />
          </div>
        </div>
      </section>

      <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <AgendaPanel />
        <MailPreview />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <TodayFocus />
        <TasksPanel />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <DeadlinesPanel />
        <FreeTodo />
      </div>

      <MonthCalendar />
    </AppShell>
  );
}
