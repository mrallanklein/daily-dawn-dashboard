import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, FolderOpen, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Panel, EmptyState } from "@/components/app/panel";
import { projectsQuery, tasksQuery, type Task } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { useTaskMutations } from "@/components/tasks/use-task-mutations";
import { TaskRow, PRIORITIES } from "@/components/tasks/task-row";
import { TasksBoardView } from "@/components/tasks/tasks-board-view";
import { todayISO } from "@/lib/dates";
import { statusColor } from "@/lib/project-status";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TasksIcon } from "@/components/icons/notion-icons";

export const Route = createFileRoute("/_authenticated/taches")({
  head: () => ({
    meta: [
      { title: "Tâches — Liste, projets et tableau" },
      {
        name: "description",
        content:
          "Une seule base de tâches en trois vues : liste par échéance, regroupement par projet et tableau à glisser-déposer, avec sous-tâches et priorités.",
      },
      { property: "og:title", content: "Tâches — Liste, projets et tableau" },
      {
        property: "og:description",
        content: "Vos tâches et sous-tâches par échéance, par projet ou en tableau.",
      },
    ],
  }),
  component: TasksPage,
});

const TABS = [
  { id: "list", label: "Liste" },
  { id: "projects", label: "Par projet" },
  { id: "board", label: "Tableau" },
] as const;

const BUCKETS = [
  { id: "late", label: "En retard" },
  { id: "today", label: "Aujourd'hui" },
  { id: "soon", label: "À venir" },
  { id: "none", label: "Sans date" },
  { id: "done", label: "Terminées" },
] as const;

function TasksPage() {
  const { workspace } = useWorkspace();
  const { data: tasksData } = useQuery(tasksQuery(workspace));
  const { data: projectsData } = useQuery(projectsQuery(workspace));
  const mutations = useTaskMutations(workspace);

  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("list");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showDone, setShowDone] = useState(false);

  const [title, setTitle] = useState("");
  const [newProject, setNewProject] = useState("none");
  const [date, setDate] = useState(todayISO());

  const projects = projectsData ?? [];
  const all = tasksData ?? [];
  const subtasksOf = (id: string) => all.filter((t) => t.parent_task_id === id);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((t) => {
      if (t.parent_task_id) return false;
      if (!showDone && t.status === "termine") return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (projectFilter === "none" && t.project_id) return false;
      if (projectFilter !== "all" && projectFilter !== "none" && t.project_id !== projectFilter)
        return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [all, search, projectFilter, priorityFilter, showDone]);

  const day = todayISO();
  const bucketOf = (id: (typeof BUCKETS)[number]["id"], list: Task[]) => {
    if (id === "done") return list.filter((t) => t.status === "termine");
    const open = list.filter((t) => t.status !== "termine");
    const when = (t: Task) => t.scheduled_date ?? t.due_date ?? null;
    if (id === "late") return open.filter((t) => (when(t) ?? day) < day);
    if (id === "today") return open.filter((t) => when(t) === day);
    if (id === "none") return open.filter((t) => !when(t));
    return open.filter((t) => (when(t) ?? "") > day);
  };

  const openCount = all.filter((t) => !t.parent_task_id && t.status !== "termine").length;

  return (
    <AppShell>
      <PageHeader
        title="Tâches"
        icon={TasksIcon}
        subtitle={`${openCount} tâche(s) en cours · une seule base, trois vues`}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          mutations.create.mutate({
            title: title.trim(),
            project_id: newProject === "none" ? null : newProject,
            scheduled_date: date || null,
          });
          setTitle("");
        }}
        className="glass mb-3 flex flex-wrap items-center gap-2 p-3"
      >
        <Plus className="size-4 shrink-0 text-muted-foreground" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nouvelle tâche… (annexe si aucun projet)"
          className="min-w-[12rem] flex-1 border-0 bg-transparent px-0 font-medium shadow-none focus-visible:ring-0"
        />
        <Select value={newProject} onValueChange={setNewProject}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Projet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Tâche annexe</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-36"
        />
        <Button type="submit" className="press font-semibold">
          Ajouter
        </Button>
      </form>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "press rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                tab === t.id
                  ? "bg-background text-foreground shadow-[var(--shadow-soft)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher"
              className="h-8 w-40 pl-8 text-sm"
            />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              <SelectItem value="none">Tâches annexes</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Priorités</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1.5">
            <Switch id="done" checked={showDone} onCheckedChange={setShowDone} />
            <Label htmlFor="done" className="text-xs font-medium">
              Terminées
            </Label>
          </div>
        </div>
      </div>

      {tab === "list" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {BUCKETS.filter((b) => b.id !== "done" || showDone).map((b) => {
            const list = bucketOf(b.id, filtered);
            return (
              <Panel key={b.id} eyebrow={`${list.length} tâche(s)`} title={b.label}>
                {list.length === 0 ? (
                  <EmptyState>Rien ici.</EmptyState>
                ) : (
                  <ul className="space-y-0.5">
                    {list.map((t) => (
                      <TaskRow
                        key={t.id}
                        task={t}
                        subtasks={subtasksOf(t.id)}
                        projects={projects}
                        mutations={mutations}
                      />
                    ))}
                  </ul>
                )}
              </Panel>
            );
          })}
        </div>
      ) : tab === "projects" ? (
        <div className="space-y-4">
          {projects
            .map((p) => ({ project: p, list: filtered.filter((t) => t.project_id === p.id) }))
            .filter(({ list }) => list.length > 0)
            .map(({ project, list }) => (
              <Panel
                key={project.id}
                title={project.name}
                eyebrow={`${list.length} tâche(s)`}
                action={
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
                    title="Statut du projet"
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: statusColor(project.status) }}
                    />
                    {project.deadline ? `Deadline ${project.deadline}` : "Sans deadline"}
                  </span>
                }
              >
                <ul className="space-y-0.5">
                  {list.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      subtasks={subtasksOf(t.id)}
                      projects={projects}
                      mutations={mutations}
                      showProject={false}
                    />
                  ))}
                </ul>
              </Panel>
            ))}

          <Panel
            title="Tâches annexes"
            eyebrow={`${filtered.filter((t) => !t.project_id).length} tâche(s)`}
            action={<FolderOpen className="size-4 text-muted-foreground" />}
          >
            {filtered.filter((t) => !t.project_id).length === 0 ? (
              <EmptyState>Aucune tâche hors projet.</EmptyState>
            ) : (
              <ul className="space-y-0.5">
                {filtered
                  .filter((t) => !t.project_id)
                  .map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      subtasks={subtasksOf(t.id)}
                      projects={projects}
                      mutations={mutations}
                      showProject={false}
                    />
                  ))}
              </ul>
            )}
          </Panel>
        </div>
      ) : (
        <TasksBoardView tasks={filtered} projects={projects} mutations={mutations} />
      )}
    </AppShell>
  );
}
