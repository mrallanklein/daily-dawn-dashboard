import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Clock, LayoutGrid, Table2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ModuleCard } from "@/components/module-card";
import { projectsQuery } from "@/lib/data";
import { ProjectForm } from "@/components/projects/project-form";
import { BoardView } from "@/components/projects/board-view";
import { TimelineView } from "@/components/projects/timeline-view";
import { ToPlanView } from "@/components/projects/to-plan-view";
import { TableView } from "@/components/projects/table-view";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/projets")({
  head: () => ({
    meta: [
      { title: "Projets — Atelier" },
      {
        name: "description",
        content:
          "Gestion de projet en quatre vues : projets par état, chronologie, à planifier et table complète.",
      },
      { property: "og:title", content: "Projets — Atelier" },
      {
        property: "og:description",
        content: "Projets par état, chronologie, à planifier et table complète.",
      },
    ],
  }),
  component: ProjectsPage,
});

const VIEWS = [
  { id: "board", label: "Projets par État", Icon: LayoutGrid },
  { id: "timeline", label: "Chronologie", Icon: Clock },
  { id: "toplan", label: "À planifier", Icon: CalendarClock },
  { id: "table", label: "Table - Projets", Icon: Table2 },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

function ProjectsPage() {
  const [view, setView] = useState<ViewId>("board");
  const { data: projects } = useQuery(projectsQuery());
  const list = projects ?? [];

  return (
    <AppShell>
      <h1 className="mb-6 text-3xl font-medium">Projets</h1>

      <ProjectForm />

      <ModuleCard
        eyebrow={`${list.length} projet(s)`}
        title={VIEWS.find((v) => v.id === view)!.label}
        action={
          <div className="flex flex-wrap gap-1 rounded-full border border-border/60 bg-secondary/40 p-1">
            {VIEWS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors",
                  view === id
                    ? "bg-background text-gold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>
        }
      >
        {view === "board" ? <BoardView projects={list} /> : null}
        {view === "timeline" ? <TimelineView projects={list} /> : null}
        {view === "toplan" ? <ToPlanView projects={list} /> : null}
        {view === "table" ? <TableView projects={list} /> : null}
      </ModuleCard>
    </AppShell>
  );
}