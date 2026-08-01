import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Panel, EmptyState } from "@/components/app/panel";
import { projectsQuery, tasksQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { useTaskMutations } from "@/components/tasks/use-task-mutations";
import { fmtDay, todayISO } from "@/lib/dates";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/taches")({
  head: () => ({
    meta: [
      { title: "Tâches — Priorités et échéances" },
      {
        name: "description",
        content:
          "Toutes vos tâches par échéance et priorité, rattachées aux projets, avec ajout rapide et suivi du terminé.",
      },
      { property: "og:title", content: "Tâches — Priorités et échéances" },
      { property: "og:description", content: "Tâches par échéance, priorité et projet." },
    ],
  }),
  component: TasksPage,
});

const GROUPS = [
  { id: "today", label: "Aujourd'hui" },
  { id: "soon", label: "À venir" },
  { id: "none", label: "Sans date" },
  { id: "done", label: "Terminées" },
] as const;

function TasksPage() {
  const { workspace } = useWorkspace();
  const { data: tasks } = useQuery(tasksQuery(workspace));
  const { data: projects } = useQuery(projectsQuery(workspace));
  const { create, toggle, patch, remove } = useTaskMutations(workspace);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("none");
  const [date, setDate] = useState(todayISO());

  const all = tasks ?? [];
  const bucket = (id: (typeof GROUPS)[number]["id"]) => {
    if (id === "done") return all.filter((t) => t.status === "termine");
    const open = all.filter((t) => t.status !== "termine");
    const day = todayISO();
    if (id === "today")
      return open.filter((t) => t.scheduled_date === day || t.due_date === day);
    if (id === "none") return open.filter((t) => !t.scheduled_date && !t.due_date);
    return open.filter(
      (t) => (t.scheduled_date ?? t.due_date ?? "") > day && (t.scheduled_date || t.due_date),
    );
  };

  const projectName = (id: string | null) =>
    id ? ((projects ?? []).find((p) => p.id === id)?.name ?? null) : null;

  return (
    <AppShell>
      <PageHeader title="Tâches" subtitle={`${all.length} tâche(s) sur ce profil`} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          create.mutate({
            title: title.trim(),
            project_id: projectId === "none" ? null : projectId,
            scheduled_date: date || null,
          });
          setTitle("");
        }}
        className="surface mb-4 flex flex-wrap gap-2 p-3"
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nouvelle tâche…"
          className="min-w-[12rem] flex-1"
        />
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Projet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sans projet</SelectItem>
            {(projects ?? []).map((p) => (
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
          className="w-40"
        />
        <Button type="submit" className="gap-1.5">
          <Plus className="size-4" /> Ajouter
        </Button>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        {GROUPS.map((g) => {
          const list = bucket(g.id);
          return (
            <Panel key={g.id} eyebrow={`${list.length} tâche(s)`} title={g.label}>
              {list.length === 0 ? (
                <EmptyState>Rien ici.</EmptyState>
              ) : (
                <ul className="space-y-1">
                  {list.map((t) => (
                    <li key={t.id} className="soft-row group flex items-start gap-2.5 px-2 py-1.5">
                      <Checkbox
                        checked={t.status === "termine"}
                        onCheckedChange={() => toggle.mutate(t)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <input
                          defaultValue={t.title}
                          onBlur={(e) => {
                            if (e.target.value !== t.title)
                              patch.mutate({ id: t.id, title: e.target.value });
                          }}
                          className={cn(
                            "w-full bg-transparent text-sm outline-none",
                            t.status === "termine" && "text-muted-foreground line-through",
                          )}
                        />
                        <p className="truncate text-xs text-muted-foreground">
                          {t.scheduled_date ? fmtDay(t.scheduled_date) : "Sans date"}
                          {projectName(t.project_id) ? ` · ${projectName(t.project_id)}` : ""}
                        </p>
                      </div>
                      <Select
                        value={t.priority}
                        onValueChange={(v) => patch.mutate({ id: t.id, priority: v })}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basse">Basse</SelectItem>
                          <SelectItem value="moyenne">Moyenne</SelectItem>
                          <SelectItem value="haute">Haute</SelectItem>
                        </SelectContent>
                      </Select>
                      <button
                        onClick={() => remove.mutate(t.id)}
                        aria-label="Supprimer la tâche"
                        className="mt-1 opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          );
        })}
      </div>
    </AppShell>
  );
}
