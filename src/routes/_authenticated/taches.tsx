import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { ModuleCard, EmptyState } from "@/components/module-card";
import { projectsQuery, tasksQuery, type Task } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { fmtShortDate, todayISO } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/taches")({
  head: () => ({
    meta: [
      { title: "Tâches — Atelier" },
      {
        name: "description",
        content: "Base de tâches complète : statut, priorité, échéance et projet associé.",
      },
      { property: "og:title", content: "Tâches — Atelier" },
      { property: "og:description", content: "Toutes vos tâches par statut et priorité." },
    ],
  }),
  component: TasksPage,
});

const STATUSES = ["a_faire", "en_cours", "termine"] as const;
const LABELS: Record<string, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  termine: "Terminé",
};

function TasksPage() {
  const queryClient = useQueryClient();
  const { data: tasks } = useQuery(tasksQuery());
  const { data: projects } = useQuery(projectsQuery());
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [projectId, setProjectId] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tasks"] });
  const fail = (e: Error) => toast.error(e.message);

  const create = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const { error } = await supabase.from("tasks").insert({
        title,
        user_id: auth.user.id,
        scheduled_date: due || todayISO(),
        due_date: due || null,
        project_id: projectId || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setTitle("");
      setDue("");
      setProjectId("");
      invalidate();
    },
    onError: fail,
  });

  const patch = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string } & Partial<Task>) => {
      const { error } = await supabase.from("tasks").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: fail,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: fail,
  });

  const projectName = useMemo(() => {
    const map = new Map((projects ?? []).map((p) => [p.id, p.name]));
    return (id: string | null) => (id ? map.get(id) ?? "—" : "—");
  }, [projects]);

  return (
    <AppShell>
      <h1 className="mb-6 text-3xl font-medium">Tâches</h1>

      <ModuleCard eyebrow="Nouvelle entrée" title="Ajouter une tâche" className="mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) create.mutate();
          }}
          className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]"
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Intitulé" />
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Sans projet</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Button type="submit">
            <Plus className="mr-1 size-4" /> Ajouter
          </Button>
        </form>
      </ModuleCard>

      <div className="grid gap-6 lg:grid-cols-3">
        {STATUSES.map((status) => {
          const list = (tasks ?? []).filter((t) => t.status === status);
          return (
            <ModuleCard key={status} eyebrow={`${list.length} tâche(s)`} title={LABELS[status]!}>
              {list.length === 0 ? (
                <EmptyState>Colonne vide.</EmptyState>
              ) : (
                <ul className="space-y-2">
                  {list.map((task) => (
                    <li
                      key={task.id}
                      className="group flex items-start gap-3 soft-row px-2 py-1.5"
                    >
                      <Checkbox
                        checked={task.status === "termine"}
                        onCheckedChange={(v) =>
                          patch.mutate({ id: task.id, status: v ? "termine" : "a_faire" })
                        }
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm",
                            task.status === "termine" && "text-muted-foreground line-through",
                          )}
                        >
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {projectName(task.project_id)}
                          {task.due_date ? ` · ${fmtShortDate(task.due_date)}` : ""}
                        </p>
                        {status !== "en_cours" ? (
                          <button
                            onClick={() => patch.mutate({ id: task.id, status: "en_cours" })}
                            className="mt-1 text-xs text-gold hover:underline"
                          >
                            Passer en cours
                          </button>
                        ) : null}
                      </div>
                      <button
                        onClick={() => remove.mutate(task.id)}
                        aria-label="Supprimer"
                        className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ModuleCard>
          );
        })}
      </div>
    </AppShell>
  );
}