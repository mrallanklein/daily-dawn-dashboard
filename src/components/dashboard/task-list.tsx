import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Panel, EmptyState } from "@/components/app/panel";
import { RowsSkeleton } from "@/components/app/skeletons";
import { projectsQuery, tasksQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { useTaskMutations } from "@/components/tasks/use-task-mutations";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskPanel } from "@/components/tasks/task-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Liste de tâches du tableau de bord, branchée sur la base unique des tâches. */
export function TaskList() {
  const { workspace } = useWorkspace();
  const { data: tasksData, isLoading } = useQuery(tasksQuery(workspace));
  const { data: projectsData } = useQuery(projectsQuery(workspace));
  const mutations = useTaskMutations(workspace);
  const [draft, setDraft] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const all = tasksData ?? [];
  const projects = projectsData ?? [];
  const roots = all
    .filter((t) => !t.parent_task_id && t.status !== "termine")
    .sort(
      (a, b) =>
        (a.scheduled_date ?? a.due_date ?? "9999").localeCompare(
          b.scheduled_date ?? b.due_date ?? "9999",
        ) || a.position - b.position,
    )
    .slice(0, 8);
  const openTask = all.find((t) => t.id === openId) ?? null;

  return (
    <Panel title="Liste de tâches" eyebrow={`${roots.length} tâche(s) affichée(s)`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          mutations.create.mutate({ title: draft.trim() });
          setDraft("");
        }}
        className="mb-3 flex gap-2"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ajouter une tâche…"
        />
        <Button
          type="submit"
          size="icon"
          variant="secondary"
          className="press"
          aria-label="Ajouter"
        >
          <Plus className="size-4" strokeWidth={1.5} />
        </Button>
      </form>

      {isLoading ? (
        <RowsSkeleton rows={5} />
      ) : roots.length === 0 ? (
        <EmptyState hint="Utilisez le champ ci-dessus pour créer votre première tâche.">
          Aucune tâche en cours
        </EmptyState>
      ) : (
        <ul className="space-y-0.5">
          {roots.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              subtasks={all.filter((s) => s.parent_task_id === t.id)}
              project={projects.find((p) => p.id === t.project_id) ?? null}
              mutations={mutations}
              onOpen={(x) => setOpenId(x.id)}
            />
          ))}
        </ul>
      )}

      <TaskPanel
        task={openTask}
        subtasks={openTask ? all.filter((s) => s.parent_task_id === openTask.id) : []}
        projects={projects}
        mutations={mutations}
        onClose={() => setOpenId(null)}
      />
    </Panel>
  );
}
