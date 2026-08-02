import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { endOfMonth, endOfWeek, format } from "date-fns";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Panel, EmptyState } from "@/components/app/panel";
import { projectsQuery, tasksQuery, type Task } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { useTaskMutations } from "@/components/tasks/use-task-mutations";
import { PRIORITIES } from "@/components/tasks/task-row";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskPanel } from "@/components/tasks/task-panel";
import { PlanBoard, UnplanDropZone } from "@/components/tasks/plan-board";
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
import { ProjectsIcon, TasksIcon } from "@/components/icons/notion-icons";

export const Route = createFileRoute("/_authenticated/taches")({
  head: () => ({
    meta: [
      { title: "Tâches — À faire, à planifier, par projet" },
      {
        name: "description",
        content:
          "Une seule base de tâches en trois vues : tâches datées groupées par période, tâches à planifier et tâches projet à planifier, en glisser-déposer sur le calendrier.",
      },
      { property: "og:title", content: "Tâches — À faire, à planifier, par projet" },
      {
        property: "og:description",
        content: "Vos tâches datées, à planifier et à planifier par projet, en glisser-déposer.",
      },
    ],
  }),
  component: TasksPage,
});

const TABS = [
  { id: "todo", label: "Tâches à faire" },
  { id: "plan", label: "Tâches à planifier" },
  { id: "projects", label: "Tâches projet" },
] as const;

const GROUPS = [
  { id: "today", label: "Aujourd'hui" },
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
  { id: "later", label: "Plus tard" },
] as const;

type GroupId = (typeof GROUPS)[number]["id"];

function TasksPage() {
  const { workspace } = useWorkspace();
  const { data: tasksData } = useQuery(tasksQuery(workspace));
  const { data: projectsData } = useQuery(projectsQuery(workspace));
  const mutations = useTaskMutations(workspace);

  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("todo");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showDone, setShowDone] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [newProject, setNewProject] = useState("none");
  const [date, setDate] = useState(todayISO());

  const projects = projectsData ?? [];
  const all = tasksData ?? [];
  const subtasksOf = (id: string) => all.filter((t) => t.parent_task_id === id);
  const projectOf = (t: Task) => projects.find((p) => p.id === t.project_id) ?? null;

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
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const groupOf = (when: string): GroupId => {
    if (when <= day) return "today";
    if (when <= weekEnd) return "week";
    if (when <= monthEnd) return "month";
    return "later";
  };

  /** Tâches datées, triées par date croissante puis par ordre manuel. */
  const dated = useMemo(() => {
    const when = (t: Task) => t.scheduled_date ?? t.due_date ?? "";
    return filtered
      .filter((t) => when(t))
      .sort((a, b) => when(a).localeCompare(when(b)) || a.position - b.position);
  }, [filtered]);

  const undated = filtered.filter((t) => !t.scheduled_date && !t.due_date);

  const reorderWithin = (list: Task[]) => (draggedId: string, targetId: string) => {
    const ids = list.map((t) => t.id);
    if (!ids.includes(draggedId) || !ids.includes(targetId)) return;
    const next = ids.filter((id) => id !== draggedId);
    next.splice(ids.indexOf(targetId), 0, draggedId);
    mutations.reorder.mutate(next);
  };

  const assignDate = (id: string, value: string | null) =>
    mutations.patch.mutate(
      value ? { id, scheduled_date: value } : { id, scheduled_date: null, due_date: null },
    );

  const openTask = all.find((t) => t.id === openTaskId) ?? null;
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
        <Plus className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
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

      {tab === "todo" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {GROUPS.map((g) => {
            const list = dated.filter(
              (t) => groupOf(t.scheduled_date ?? t.due_date ?? day) === g.id,
            );
            return (
              <Panel key={g.id} eyebrow={`${list.length} tâche(s)`} title={g.label}>
                {list.length === 0 ? (
                  <EmptyState>Rien ici.</EmptyState>
                ) : (
                  <ul className="space-y-0.5">
                    {list.map((t) => (
                      <TaskItem
                        key={t.id}
                        task={t}
                        subtasks={subtasksOf(t.id)}
                        project={projectOf(t)}
                        mutations={mutations}
                        onOpen={(x) => setOpenTaskId(x.id)}
                        onDropOn={reorderWithin(list)}
                      />
                    ))}
                  </ul>
                )}
              </Panel>
            );
          })}
        </div>
      ) : null}

      {tab === "plan" || tab === "projects" ? (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          <PlanBoard
            items={dated.map((t) => ({
              id: t.id,
              title: t.title,
              date: t.scheduled_date ?? t.due_date,
              ...(t.project_id ? { color: statusColor(projectOf(t)?.status ?? "") } : {}),
            }))}
            onAssign={assignDate}
            label="Tâches planifiées"
          />

          {tab === "plan" ? (
            <UnplanDropZone onUnassign={(id) => assignDate(id, null)}>
              <Panel
                title="Tâches sans date"
                eyebrow={`${undated.filter((t) => !t.project_id).length} tâche(s)`}
              >
                {undated.filter((t) => !t.project_id).length === 0 ? (
                  <EmptyState>
                    Tout est planifié. Déposez une tâche ici pour retirer sa date.
                  </EmptyState>
                ) : (
                  <ul className="space-y-0.5">
                    {undated
                      .filter((t) => !t.project_id)
                      .map((t) => (
                        <TaskItem
                          key={t.id}
                          task={t}
                          subtasks={subtasksOf(t.id)}
                          mutations={mutations}
                          onOpen={(x) => setOpenTaskId(x.id)}
                          showProject={false}
                        />
                      ))}
                  </ul>
                )}
              </Panel>
            </UnplanDropZone>
          ) : (
            <UnplanDropZone onUnassign={(id) => assignDate(id, null)} className="space-y-4">
              {projects
                .map((p) => ({ project: p, list: undated.filter((t) => t.project_id === p.id) }))
                .filter(({ list }) => list.length > 0)
                .map(({ project, list }) => (
                  <Panel
                    key={project.id}
                    title={project.name}
                    eyebrow={`${list.length} tâche(s) à planifier`}
                    action={
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <ProjectsIcon className="size-4" />
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: statusColor(project.status) }}
                        />
                      </span>
                    }
                  >
                    <ul className="space-y-0.5">
                      {list.map((t) => (
                        <TaskItem
                          key={t.id}
                          task={t}
                          subtasks={subtasksOf(t.id)}
                          mutations={mutations}
                          onOpen={(x) => setOpenTaskId(x.id)}
                          showProject={false}
                        />
                      ))}
                    </ul>
                  </Panel>
                ))}
              {undated.filter((t) => t.project_id).length === 0 ? (
                <Panel title="Tâches projet à planifier">
                  <EmptyState>
                    Toutes les tâches de projet ont une date. Déposez une tâche ici pour la
                    dé-planifier.
                  </EmptyState>
                </Panel>
              ) : null}
            </UnplanDropZone>
          )}
        </div>
      ) : null}

      <TaskPanel
        task={openTask}
        subtasks={openTask ? subtasksOf(openTask.id) : []}
        projects={projects}
        mutations={mutations}
        onClose={() => setOpenTaskId(null)}
      />
    </AppShell>
  );
}
