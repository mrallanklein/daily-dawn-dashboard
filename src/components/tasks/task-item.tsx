import { useEffect, useRef, useState } from "react";
import { CheckSquare, ChevronRight, GripVertical, Trash2 } from "lucide-react";
import type { Project, Task } from "@/lib/data";
import { fmtDay } from "@/lib/dates";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { PRIORITIES, type TaskMutations } from "./task-row";
import { planDragProps, PLAN_MIME } from "./plan-board";

/**
 * Ligne de tâche cliquable : ouvre le panneau latéral, accepte le glisser-déposer
 * (réordonnancement ou planification) et gère la ligne de description.
 */
export function TaskItem({
  task,
  subtasks,
  project,
  mutations,
  onOpen,
  onDropOn,
  showProject = true,
}: {
  task: Task;
  subtasks: Task[];
  project?: Project | null;
  mutations: TaskMutations;
  onOpen: (task: Task) => void;
  onDropOn?: (draggedId: string, targetId: string) => void;
  showProject?: boolean;
}) {
  const { toggle, patch, remove, create } = mutations;
  const [desc, setDesc] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const descRef = useRef<HTMLTextAreaElement | null>(null);
  const done = task.status === "termine";
  const priority = PRIORITIES.find((p) => p.id === task.priority) ?? PRIORITIES[1];
  const doneSubs = subtasks.filter((s) => s.status === "termine").length;
  const description = desc ?? task.description ?? "";
  const editing = desc !== null || Boolean(task.description);

  useEffect(() => {
    if (desc !== null) descRef.current?.focus();
  }, [desc]);

  const saveDesc = () => {
    const value = description.trim();
    if (value !== (task.description ?? "")) {
      patch.mutate({ id: task.id, description: value || null });
    }
    setDesc(null);
  };

  const toSubtask = () => {
    const value = description.trim();
    if (!value) return;
    create.mutate({
      title: value,
      parent_task_id: task.id,
      project_id: task.project_id,
      scheduled_date: task.scheduled_date,
    });
    patch.mutate({ id: task.id, description: null });
    setDesc(null);
  };

  return (
    <li
      onDragOver={
        onDropOn
          ? (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOver(true);
            }
          : undefined
      }
      onDragLeave={onDropOn ? () => setOver(false) : undefined}
      onDrop={
        onDropOn
          ? (e) => {
              e.preventDefault();
              setOver(false);
              const id = e.dataTransfer.getData(PLAN_MIME) || e.dataTransfer.getData("text/plain");
              if (id && id !== task.id) onDropOn(id, task.id);
            }
          : undefined
      }
      className={cn("rounded-xl", over && "ring-1 ring-inset ring-foreground/30")}
    >
      <div className="soft-row group flex items-start gap-2 px-2 py-1.5">
        <span
          {...planDragProps(task.id)}
          aria-hidden
          className="mt-1 cursor-grab text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" strokeWidth={1.5} />
        </span>

        <Checkbox checked={done} onCheckedChange={() => toggle.mutate(task)} className="mt-0.5" />

        <div className="min-w-0 flex-1">
          <input
            defaultValue={task.title}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== task.title) patch.mutate({ id: task.id, title: v });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.shiftKey) {
                e.preventDefault();
                setDesc(task.description ?? "");
              }
            }}
            className={cn(
              "w-full bg-transparent text-sm font-medium outline-none",
              done && "text-muted-foreground line-through",
            )}
          />

          {editing ? (
            <div className="group/desc relative mt-0.5 pr-8">
              <textarea
                ref={descRef}
                rows={1}
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                onBlur={saveDesc}
                placeholder="Description…"
                className="w-full resize-none bg-transparent text-xs leading-relaxed text-muted-foreground outline-none"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={toSubtask}
                title="Transformer la description en sous-tâche"
                aria-label="Transformer la description en sous-tâche"
                className="press absolute right-0 top-0 grid size-6 place-items-center rounded-md border border-border bg-card text-muted-foreground opacity-0 shadow-[var(--shadow-xs)] transition-opacity hover:text-foreground group-hover/desc:opacity-100"
              >
                <CheckSquare className="size-3.5" strokeWidth={1.5} />
              </button>
            </div>
          ) : null}

          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1" style={{ color: priority?.color }}>
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: priority?.color }}
              />
              {priority?.label}
            </span>
            <span className="whitespace-nowrap">
              {task.scheduled_date ? fmtDay(task.scheduled_date) : "Sans date"}
            </span>
            {showProject ? (
              <span className="max-w-[12rem] truncate">
                {project ? project.name : "Tâche annexe"}
              </span>
            ) : null}
            {subtasks.length > 0 ? (
              <span className="num whitespace-nowrap">
                {doneSubs}/{subtasks.length} sous-tâches
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => remove.mutate(task.id)}
            aria-label="Supprimer la tâche"
            className="press grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="size-3.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => onOpen(task)}
            aria-label="Ouvrir la tâche"
            className="press grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </li>
  );
}
