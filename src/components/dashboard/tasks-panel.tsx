import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { tasksQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { Panel, EmptyState } from "@/components/app/panel";
import { RangeToggle } from "@/components/range-toggle";
import { RowsSkeleton } from "@/components/app/skeletons";
import { fmtDay, inRange, type RangeDays } from "@/lib/dates";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTaskMutations } from "@/components/tasks/use-task-mutations";

export function TasksPanel() {
  const [range, setRange] = useState<RangeDays>(1);
  const [title, setTitle] = useState("");
  const { workspace } = useWorkspace();
  const { data: tasks, isLoading } = useQuery(tasksQuery(workspace));
  const { create, toggle } = useTaskMutations(workspace);

  const visible = (tasks ?? []).filter(
    (t) => !t.parent_task_id && (inRange(t.scheduled_date, range) || inRange(t.due_date, range)),
  );

  return (
    <Panel
      eyebrow="À faire"
      title="Tâches"
      action={<RangeToggle value={range} onChange={setRange} />}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          create.mutate({ title: title.trim() });
          setTitle("");
        }}
        className="mb-3 flex gap-2"
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nouvelle tâche pour aujourd'hui…"
        />
        <Button type="submit" size="icon" aria-label="Ajouter la tâche">
          <Plus className="size-4" />
        </Button>
      </form>

      {isLoading ? (
        <RowsSkeleton rows={4} />
      ) : visible.length === 0 ? (
        <EmptyState hint="Ajoutez une tâche ci-dessus pour démarrer votre journée.">
          Rien de prévu sur cette période
        </EmptyState>
      ) : (
        <ul className="space-y-1">
          {visible.map((task) => (
            <li key={task.id} className="soft-row flex items-start gap-3 px-2 py-1.5">
              <Checkbox
                checked={task.status === "termine"}
                onCheckedChange={() => toggle.mutate(task)}
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
                <p className="truncate text-xs text-muted-foreground">
                  {task.scheduled_date ? fmtDay(task.scheduled_date) : "Sans date"}
                  {task.due_date ? ` · échéance ${fmtDay(task.due_date)}` : ""}
                </p>
              </div>
              {task.priority === "haute" ? (
                <span className="pill border-destructive/40 text-destructive">Urgent</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
