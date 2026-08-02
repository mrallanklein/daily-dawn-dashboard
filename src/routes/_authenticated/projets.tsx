import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { projectsQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { ProjectDetail } from "@/components/projects/project-detail";
import { DatabaseView } from "@/components/views/database-view";
import { useProjectsSource } from "@/components/views/sources/projects-source";
import { ProjectsIcon } from "@/components/icons/notion-icons";

export const Route = createFileRoute("/_authenticated/projets")({
  head: () => ({
    meta: [
      { title: "Projets — Table, Kanban, Chronologie & Galerie" },
      {
        name: "description",
        content:
          "Pilotage des projets avec vues personnalisables : table, kanban, calendrier, chronologie, galerie et liste, filtres, tris et couleurs conditionnelles.",
      },
      { property: "og:title", content: "Projets — Table, Kanban, Chronologie & Galerie" },
      {
        property: "og:description",
        content: "Vues personnalisables, filtres, tris et couleurs conditionnelles.",
      },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { workspace } = useWorkspace();
  const { data: projects, isLoading } = useQuery(projectsQuery(workspace));
  const [openId, setOpenId] = useState<string | null>(null);

  const list = projects ?? [];
  const source = useProjectsSource(list, { onOpen: setOpenId, isLoading });
  const current = openId ? (list.find((p) => p.id === openId) ?? null) : null;

  return (
    <AppShell>
      <PageHeader
        title="Projets"
        icon={ProjectsIcon}
        subtitle={`${list.length} projet(s) sur ce profil`}
        actions={<ProjectDialog />}
      />

      <DatabaseView source={source} />

      <ProjectDetail project={current} onClose={() => setOpenId(null)} />
    </AppShell>
  );
}
