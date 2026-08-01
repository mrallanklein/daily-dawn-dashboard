import { createFileRoute } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { MonthCalendar } from "@/components/dashboard/month-calendar";
import { AgendaPanel } from "@/components/dashboard/agenda-panel";
import { WeekTimeline } from "@/components/dashboard/week-timeline";

export const Route = createFileRoute("/_authenticated/calendrier")({
  head: () => ({
    meta: [
      { title: "Calendrier — Agenda Google & échéances" },
      {
        name: "description",
        content:
          "Calendrier mensuel, semaine en un coup d'œil et évènements Google Agenda avec les échéances projets.",
      },
      { property: "og:title", content: "Calendrier — Agenda Google & échéances" },
      { property: "og:description", content: "Mois, semaine et agenda Google réunis." },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <AppShell>
      <PageHeader title="Calendrier" icon={Calendar} iconColor="#3B82F6" subtitle="Agenda Google, tâches planifiées et deadlines" />
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <MonthCalendar />
        <AgendaPanel />
      </div>
      <div className="mt-4">
        <WeekTimeline />
      </div>
    </AppShell>
  );
}
