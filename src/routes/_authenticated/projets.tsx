import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, GanttChartSquare, KanbanSquare, List, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { projectsQuery, type Project } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { ProjectDialog } from "@/components/projects/project-dialog";
import { KanbanView } from "@/components/projects/kanban-view";
import { ListView } from "@/components/projects/list-view";
import { GanttView } from "@/components/projects/gantt-view";
import { ToPlanView } from "@/components/projects/to-plan-view";
import { ProjectDetail } from "@/components/projects/project-detail";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/projets")({
  head: () => ({
    meta: [
      { title: "Projets — Kanban, liste & Gantt" },
      {
        name: "description",
        content:
          "Pilotage des projets en Kanban, liste éditable et Gantt, avec sous-tâches, budget et notes par projet.",
      },
      { property: "og:title", content: "Projets — Kanban, liste & Gantt" },
      {
        property: "og:description",
        content: "Kanban, liste et Gantt avec sous-tâches, budget et notes.",
      },
    ],
  }),
  component: ProjectsPage,
});

const VIEWS = [
  { id: "kanban", label: "Projets par état", Icon: KanbanSquare },
  { id: "toplan", label: "À planifier", Icon: CalendarRange },
  { id: "gantt", label: "Chronologie", Icon: GanttChartSquare },
  { id: "list", label: "Liste", Icon: List },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

function ProjectsPage() {
  const { workspace } = useWorkspace();
  const [view, setView] = useState<ViewId>("kanban");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Project | null>(null);
  const { data: projects } = useQuery(projectsQuery(workspace));

  const list = (projects ?? []).filter((p) =>
    (p.name + (p.client ?? "") + (p.category ?? "")).toLowerCase().includes(q.toLowerCase()),
  );
  const current = selected ? (projects ?? []).find((p) => p.id === selected.id) ?? null : null;

  return (
    <AppShell>
      <PageHeader
        title="Projets"
        subtitle={`${list.length} projet(s) sur ce profil`}
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Filtrer…"
                className="h-9 w-40 pl-8"
              />
            </div>
            <div className="flex rounded-full border border-border bg-muted/50 p-0.5">
              {VIEWS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors",
                    view === id
                      ? "bg-background font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>
            <ProjectDialog />
          </>
        }
      />

      {view === "kanban" ? <KanbanView projects={list} onSelect={setSelected} /> : null}
      {view === "toplan" ? (
        <div className="glass p-3">
          <ToPlanView projects={list} onSelect={setSelected} />
        </div>
      ) : null}
      {view === "list" ? (
        <div className="glass p-3">
          <ListView projects={list} onSelect={setSelected} />
        </div>
      ) : null}
      {view === "gantt" ? (
        <div className="glass p-4">
          <GanttView projects={list} onSelect={setSelected} />
        </div>
      ) : null}

      <ProjectDetail project={current} onClose={() => setSelected(null)} />
    </AppShell>
  );
}
