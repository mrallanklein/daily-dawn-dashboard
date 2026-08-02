import { createFileRoute } from "@tanstack/react-router";
import { Calendar } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";
import { CalendarIcon } from "@/components/icons/notion-icons";

export const Route = createFileRoute("/_authenticated/calendrier")({
  head: () => ({
    meta: [
      { title: "Calendrier — Jour, semaine, mois et année" },
      {
        name: "description",
        content:
          "Vues Jour, Semaine, Mois et Année de l'agenda Google, avec panneau latéral de navigation, agendas filtrables et création d'évènements.",
      },
      { property: "og:title", content: "Calendrier — Jour, semaine, mois et année" },
      {
        property: "og:description",
        content: "Agenda Google multi-vues avec panneau latéral et gestion des évènements.",
      },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <AppShell>
      <PageHeader
        title="Calendrier"
        icon={CalendarIcon}
        subtitle="Agenda Google, tâches planifiées et deadlines"
      />
      <CalendarWorkspace />
    </AppShell>
  );
}
