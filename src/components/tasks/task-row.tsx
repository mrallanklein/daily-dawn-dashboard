import { useState } from "react";
import { ChevronRight, CornerDownRight, Plus, Trash2 } from "lucide-react";
import type { Task, Project } from "@/lib/data";
import { fmtDay } from "@/lib/dates";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const PRIORITIES = [
  { id: "basse", label: "Basse", color: "#94A3B8" },
  { id: "moyenne", label: "Moyenne", color: "#3B82F6" },
  { id: "haute", label: "Haute", color: "#EF4444" },
] as const;

export type TaskMutations = ReturnType<typeof import("./use-task-mutations").useTaskMutations>;

export function TaskRow({
  task,
  subtasks,
  projects,
  mutations,
  showProject = true,
  depth = 0,
}: {
  task: Task;
  subtasks: Task[];
  projects: Project[];
  mutations: TaskMutations;
  showProject?: boolean;
  depth?: number;
}) {
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState("");
  const { toggle, patch, remove, create } = mutations;
  const done = task.status === "termine";
  const project = projects.find((p) => p.id === task.project_id) ?? null;
  const priority = PRIORITIES.find((p) => p.id === task.priority) ?? PRIORITIES[1];
  const doneSubs = subtasks.filter((s) => s.status === "termine").length;

  return (
    <li>
      <div
        className="soft-row group flex items-start gap-2 px-2 py-1.5"
        style={{ paddingLeft: `${0.5 + depth * 1.25}rem` }}
      >
        {depth === 0 ? (
          <button
            aria-label={open ? "Masquer les sous-tâches" : "Afficher les sous-tâches"}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "mt-1 grid size-4 shrink-0 place-items-center rounded text-muted-foreground transition-transform hover:text-foreground",
              open && "rotate-90",
            )}
          >
            <ChevronRight className="size-3.5" />
          </button>
        ) : (
          <CornerDownRight className="mt-1 size-3.5 shrink-0 text-muted-foreground/60" />
        )}

        <Checkbox checked={done} onCheckedChange={() => toggle.mutate(task)} className="mt-0.5" />

        <div className="min-w-0 flex-1">
          <input
            defaultValue={task.title}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== task.title) patch.mutate({ id: task.id, title: v });
            }}
            className={cn(
              "w-full bg-transparent text-sm font-medium outline-none",
              done && "text-muted-foreground line-through",
            )}
          />
          <p className="flex flex-wrap items-center gap-x-2 truncate text-xs font-medium text-muted-foreground">
            <span
              className="inline-flex items-center gap-1"
              style={{ color: priority?.color }}
              title={`Priorité ${priority?.label}`}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: priority?.color }}
              />
              {priority?.label}
            </span>
            <span>{task.scheduled_date ? fmtDay(task.scheduled_date) : "Sans date"}</span>
            {showProject ? <span>{project ? project.name : "Tâche annexe"}</span> : null}
            {subtasks.length > 0 ? (
              <span className="tabular-nums">
                {doneSubs}/{subtasks.length} sous-tâches
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <Input
            type="date"
            value={task.scheduled_date ?? ""}
            onChange={(e) => patch.mutate({ id: task.id, scheduled_date: e.target.value || null })}
            className="h-7 w-32 text-xs"
            aria-label="Date planifiée"
          />
          <Select
            value={task.priority}
            onValueChange={(v) => patch.mutate({ id: task.id, priority: v })}
          >
            <SelectTrigger className="h-7 w-24 text-xs" aria-label="Priorité">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {depth === 0 ? (
            <Select
              value={task.project_id ?? "none"}
              onValueChange={(v) =>
                patch.mutate({ id: task.id, project_id: v === "none" ? null : v })
              }
            >
              <SelectTrigger className="h-7 w-36 text-xs" aria-label="Projet">
                <SelectValue />
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
          ) : null}
          <button
            onClick={() => remove.mutate(task.id)}
            aria-label="Supprimer la tâche"
            className="press grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {open && depth === 0 ? (
        <ul className="space-y-0.5">
          {subtasks.map((s) => (
            <TaskRow
              key={s.id}
              task={s}
              subtasks={[]}
              projects={projects}
              mutations={mutations}
              showProject={false}
              depth={1}
            />
          ))}
          <li className="flex items-center gap-2 py-1 pl-9 pr-2">
            <Plus className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              value={sub}
              onChange={(e) => setSub(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || !sub.trim()) return;
                create.mutate({
                  title: sub.trim(),
                  parent_task_id: task.id,
                  project_id: task.project_id,
                  scheduled_date: task.scheduled_date,
                });
                setSub("");
              }}
              placeholder="Ajouter une sous-tâche…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </li>
        </ul>
      ) : null}
    </li>
  );
}
