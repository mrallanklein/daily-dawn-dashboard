import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { WeatherBadge } from "@/components/weather-badge";
import { EventsModule } from "@/components/dashboard/events-module";
import { TasksModule } from "@/components/dashboard/tasks-module";
import { ProjectsModule } from "@/components/dashboard/projects-module";
import { DeadlinesTimeline } from "@/components/dashboard/deadlines-timeline";
import { FreeTodo } from "@/components/dashboard/free-todo";
import { MonthCalendar } from "@/components/dashboard/month-calendar";
import { profileQuery, weatherQuery } from "@/lib/data";
import portraitAsset from "@/assets/allan-klein.png.asset.json";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Atelier" },
      {
        name: "description",
        content:
          "Votre journée en un écran : évènements Google Agenda, tâches, projets, deadlines et todo list libre.",
      },
      { property: "og:title", content: "Tableau de bord — Atelier" },
      {
        property: "og:description",
        content: "Évènements, tâches, projets et deadlines de la journée.",
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
  const { data: profile } = useQuery(profileQuery());
  const { data: weather } = useQuery({
    ...weatherQuery(Number(profile?.weather_lat ?? 43.6045), Number(profile?.weather_lon ?? 1.4442)),
    enabled: Boolean(profile),
  });

  return (
    <AppShell>
      <section className="mb-8 flex flex-wrap items-end justify-between gap-6 border-b border-border/70 pb-6">
        <div className="flex min-w-0 items-center gap-4">
          <img
            src={portraitAsset.url}
            alt="Allan Klein"
            className="hidden size-14 shrink-0 rounded-lg object-cover grayscale sm:block"
          />
          <div className="min-w-0">
            <h1 className="text-3xl font-display leading-tight tracking-tight md:text-4xl">
              {greeting()}{" "}
              <span className="font-accent">
                {(profile?.display_name ?? "Allan").split(" ")[0]}
              </span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Voici votre journée, vos échéances et vos priorités.
            </p>
          </div>
        </div>
        <WeatherBadge weather={weather} city={profile?.weather_city ?? "Toulouse"} />
      </section>

      <div className="grid gap-10 lg:grid-cols-3">
        <EventsModule />
        <TasksModule />
        <ProjectsModule />
      </div>

      <div className="mt-10 grid gap-10 border-t border-border/70 pt-10 lg:grid-cols-2">
        <DeadlinesTimeline />
        <FreeTodo />
      </div>

      <div className="mt-10 border-t border-border/70 pt-10">
        <MonthCalendar />
      </div>
    </AppShell>
  );
}