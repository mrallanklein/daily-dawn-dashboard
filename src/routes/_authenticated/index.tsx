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
      <section className="panel relative mb-6 overflow-hidden p-7">
        <img
          src={portraitAsset.url}
          alt="Allan Klein"
          className="pointer-events-none absolute -right-6 top-0 hidden h-full w-64 object-cover opacity-25 mix-blend-luminosity [mask-image:linear-gradient(to_left,black,transparent)] md:block"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6 md:pr-56">
          <div className="min-w-0">
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-muted-foreground">
              Bienvenue
            </p>
            <h1 className="mt-3 text-4xl font-accent leading-[1.1] md:text-5xl">
              {greeting()}{" "}
              <span className="text-gradient-gold">
                {(profile?.display_name ?? "Allan").split(" ")[0]}
              </span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Voici votre journée, vos échéances et vos priorités.
            </p>
          </div>
          <WeatherBadge weather={weather} city={profile?.weather_city ?? "Toulouse"} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <EventsModule />
        <TasksModule />
        <ProjectsModule />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DeadlinesTimeline />
        <FreeTodo />
      </div>

      <div className="mt-6">
        <MonthCalendar />
      </div>
    </AppShell>
  );
}