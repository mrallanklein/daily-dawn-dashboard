import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { SettingsView } from "@/components/settings-view";

export const Route = createFileRoute("/_authenticated/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — Espaces, comptes Google & apparence" },
      {
        name: "description",
        content:
          "Gérez vos espaces de travail, identités visuelles, boîtes mail et agendas Google, météo et apparence de l'application.",
      },
      { property: "og:title", content: "Paramètres — Espaces & intégrations" },
      {
        property: "og:description",
        content: "Espaces, images, comptes Google, agendas, météo et thème.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Paramètres"
        subtitle="Espaces de travail, identité, comptes Google, agendas, météo et apparence."
        icon={Settings}
      />
      <SettingsView />
    </AppShell>
  );
}
