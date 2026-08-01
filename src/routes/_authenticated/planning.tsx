import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { EventsModule } from "@/components/dashboard/events-module";
import { TasksModule } from "@/components/dashboard/tasks-module";
import { MonthCalendar } from "@/components/dashboard/month-calendar";
import { DeadlinesTimeline } from "@/components/dashboard/deadlines-timeline";

export const Route = createFileRoute("/_authenticated/planning")({
  head: () => ({
    meta: [
      { title: "Planning — Atelier" },
      {
        name: "description",
        content: "Planning du jour et des prochains jours : agenda, tâches et échéances réunis.",
      },
      { property: "og:title", content: "Planning — Atelier" },
      { property: "og:description", content: "Agenda, tâches et échéances par plage de jours." },
    ],
  }),
  component: PlanningPage,
});

function PlanningPage() {
  return (
    <AppShell>
      <h1 className="mb-6 text-3xl font-medium">Planning</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <EventsModule />
        <TasksModule />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <DeadlinesTimeline />
        <MonthCalendar />
      </div>
    </AppShell>
  );
}