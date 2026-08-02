import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SettingsDialog } from "@/components/settings-dialog";
import { WeatherBadge } from "@/components/weather-badge";
import { AgendaPanel } from "@/components/dashboard/agenda-panel";
import { TasksPanel } from "@/components/dashboard/tasks-panel";
import { TodayFocus } from "@/components/dashboard/today-focus";
import { DeadlinesPanel } from "@/components/dashboard/deadlines-panel";
import { MailPreview } from "@/components/dashboard/mail-preview";
import { TaskList } from "@/components/dashboard/task-list";
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";
import { profileQuery, projectsQuery, tasksQuery, weatherQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { todayISO } from "@/lib/dates";
import portraitAsset from "@/assets/allan-klein.png.asset.json";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Accueil — ALIAS & Allan Klein" },
      {
        name: "description",
        content:
          "Accueil : météo du jour, planning Google Agenda, projets et tâches du jour, chronologie des deadlines, to-do libre et calendrier.",
      },
      { property: "og:title", content: "Accueil — ALIAS & Allan Klein" },
      {
        property: "og:description",
        content: "Planning, projets, tâches, deadlines et calendrier réunis sur un écran.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Bonne nuit";
  if (h < 12) return "Bonne journée";
  if (h < 18) return "Bel après-midi";
  return "Bonne soirée";
}

function HomePage() {
  const { workspace, space } = useWorkspace();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { data: profile } = useQuery(profileQuery());
  const { data: projects } = useQuery(projectsQuery(workspace));
  const { data: tasks } = useQuery(tasksQuery(workspace));
  const { data: weather } = useQuery({
    ...weatherQuery(
      Number(space?.weather_lat ?? profile?.weather_lat ?? 43.6047),
      Number(space?.weather_lon ?? profile?.weather_lon ?? 1.4442),
    ),
    enabled: Boolean(profile || space),
  });

  const avatar = space?.avatar_url ?? profile?.avatar_url ?? portraitAsset.url;
  const name = space?.name ?? profile?.display_name ?? "Allan Klein";
  const firstName = (profile?.display_name ?? "Allan").split(" ")[0] ?? "Allan";

  const active = (projects ?? []).filter((p) => !["termine", "archiver"].includes(p.status));
  const todayTasks = (tasks ?? []).filter(
    (t) => !t.parent_task_id && (t.scheduled_date === todayISO() || t.due_date === todayISO()),
  );
  const remaining = todayTasks.filter((t) => t.status !== "termine").length;

  return (
    <AppShell>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Hero card : profil, salutation, stats et météo dans un seul bandeau */}
      <section className="mb-8 @container">
        <div className="flex flex-col items-start gap-4 rounded-[22px] border border-border bg-card p-5 shadow-sm @min-[520px]:flex-row @min-[520px]:items-center @min-[520px]:gap-5">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Ouvrir les paramètres de l'espace de travail"
            title="Paramètres de l'espace de travail"
            className="press shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img
              src={avatar}
              alt={name}
              className="size-14 rounded-[1rem] border-2 border-border object-cover shadow-sm transition-transform hover:scale-[1.03] @min-[520px]:size-16 @min-[680px]:size-20 @min-[520px]:rounded-[1.15rem]"
            />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-display font-bold tracking-tight @min-[520px]:text-2xl @min-[680px]:text-3xl">
              {greeting()} {firstName}
            </h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {active.length} projet(s) actifs · {remaining} tâche(s) restantes aujourd'hui
            </p>
          </div>

          <div className="w-full @min-[520px]:w-auto @min-[520px]:shrink-0">
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

      <div className="mb-4">
        <DeadlinesPanel />
      </div>

      <div className="mb-4">
        <TaskList />
      </div>

      <CalendarWorkspace />
    </AppShell>
  );
}
