import { useState } from "react";
import { ChevronRight, Flag, GitBranch, Trash2 } from "lucide-react";
import type { Project, Task } from "@/lib/data";
import { cn } from "@/lib/utils";
import { todayISO } from "@/lib/dates";
import { DatePill } from "./date-pill";
import { PRIORITIES, type TaskMutations } from "./task-row";

/** Texte brut d'une description HTML, pour l'aperçu d'une ligne. */
export function plainText(html: string | null) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Case ronde à la Todoist, colorée selon la priorité. */
function RoundCheck({
  done,
  color,
  onToggle,
  size = "md",
}: {
  done: boolean;
  color: string;
  onToggle: () => void;
  size?: "md" | "sm";
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? "Marquer comme à faire" : "Marquer comme terminée"}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      style={{ borderColor: color, backgroundColor: done ? color : "transparent" }}
      className={cn(
        "press mt-0.5 grid shrink-0 place-items-center rounded-full border-[1.5px] transition-colors",
        size === "md" ? "size-[18px]" : "size-4",
      )}
    >
      <span
        className={cn(
          "block rounded-full bg-background transition-opacity",
          size === "md" ? "size-1.5" : "size-1",
          done ? "opacity-100" : "opacity-0",
        )}
      />
    </button>
  );
}

/**
 * Ligne de tâche façon Todoist : case ronde, titre éditable en ligne, aperçu de
 * description, puce de date, priorité, compteur de sous-tâches et caret.
 */
export function TodoistRow({
  task,
  subtasks,
  project,
  mutations,
  onOpen,
  depth = 0,
  showProject = true,
}: {
  task: Task;
  subtasks: Task[];
  project?: Project | null;
  mutations: TaskMutations;
  onOpen: (task: Task) => void;
  depth?: number;
  showProject?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { toggle, patch, remove } = mutations;
  const done = task.status === "termine";
  const priority = PRIORITIES.find((p) => p.id === task.priority) ?? PRIORITIES[1];
  const doneSubs = subtasks.filter((s) => s.status === "termine").length;
  const date = task.scheduled_date ?? task.due_date;
  const preview = plainText(task.description);

  return (
    <li className="border-b border-border/60 last:border-0">
      <div
        className="group flex items-start gap-2 py-2"
        style={{ paddingLeft: `${depth * 1.5}rem` }}
      >
        {subtasks.length > 0 && depth === 0 ? (
          <button
            type="button"
            aria-label={open ? "Masquer les sous-tâches" : "Afficher les sous-tâches"}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "mt-1 grid size-4 shrink-0 place-items-center rounded text-muted-foreground transition-transform hover:text-foreground",
              open && "rotate-90",
            )}
          >
            <ChevronRight className="size-3.5" strokeWidth={1.5} />
          </button>
        ) : (
          <span className="size-4 shrink-0" aria-hidden />
        )}

        <RoundCheck
          done={done}
          color={priority?.color ?? "#94A3B8"}
          onToggle={() => toggle.mutate(task)}
          size={depth === 0 ? "md" : "sm"}
        />

        <div className="min-w-0 flex-1">
          <input
            defaultValue={task.title}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v && v !== task.title) patch.mutate({ id: task.id, title: v });
            }}
            className={cn(
              "w-full bg-transparent text-[15px] font-medium leading-snug outline-none",
              done && "text-muted-foreground line-through",
            )}
          />
          {preview ? <p className="truncate text-xs text-muted-foreground">{preview}</p> : null}

          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            {subtasks.length > 0 ? (
              <span className="inline-flex items-center gap-1 num">
                <GitBranch className="size-3.5" strokeWidth={1.5} />
                {doneSubs}/{subtasks.length}
              </span>
            ) : null}
            <DatePill
              date={date}
              onChange={(v) => patch.mutate({ id: task.id, scheduled_date: v })}
              overdue={Boolean(date && date < todayISO() && !done)}
            />
            {task.priority !== "moyenne" ? (
              <span
                className="inline-flex items-center gap-1 font-medium"
                style={{ color: priority?.color }}
              >
                <Flag className="size-3.5" strokeWidth={1.5} />
                {priority?.label}
              </span>
            ) : null}
            {showProject && project ? (
              <span className="max-w-[12rem] truncate">{project.name}</span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => remove.mutate(task.id)}
            aria-label="Supprimer la tâche"
            className="press grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="size-3.5" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => onOpen(task)}
            aria-label="Ouvrir la tâche"
            className="press grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {open && depth === 0 && subtasks.length > 0 ? (
        <ul className="border-t border-border/60">
          {subtasks.map((s) => (
            <TodoistRow
              key={s.id}
              task={s}
              subtasks={[]}
              mutations={mutations}
              onOpen={onOpen}
              depth={1}
              showProject={false}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
