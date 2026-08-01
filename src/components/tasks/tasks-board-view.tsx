import { useState } from "react";
import { CalendarDays } from "lucide-react";
import type { Project, Task } from "@/lib/data";
import { fmtDay } from "@/lib/dates";
import { PRIORITIES, type TaskMutations } from "./task-row";
import { cn } from "@/lib/utils";

export const TASK_STATUSES = [
  { id: "a_faire", label: "À faire", color: "#94A3B8" },
  { id: "en_cours", label: "En cours", color: "#3B82F6" },
  { id: "termine", label: "Terminé", color: "#22C55E" },
] as const;

export function TasksBoardView({
  tasks,
  projects,
  mutations,
}: {
  tasks: Task[];
  projects: Project[];
  mutations: TaskMutations;
}) {
  const [over, setOver] = useState<string | null>(null);

  const move = (id: string, status: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    mutations.patch.mutate({
      id,
      status,
      completed_at: status === "termine" ? new Date().toISOString() : null,
    });
  };

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {TASK_STATUSES.map((col) => {
        const list = tasks.filter((t) =>
          col.id === "a_faire"
            ? t.status !== "en_cours" && t.status !== "termine"
            : t.status === col.id,
        );
        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setOver(col.id);
            }}
            onDragLeave={() => setOver((c) => (c === col.id ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData("text/plain");
              if (id) move(id, col.id);
            }}
            className={cn(
              "glass flex min-h-[12rem] flex-col p-2.5 transition-colors",
              over === col.id && "ring-1 ring-inset ring-foreground/25",
            )}
          >
            <p className="mb-2 flex items-center gap-1.5 px-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              <span className="size-2 rounded-full" style={{ backgroundColor: col.color }} />
              {col.label}
              <span className="tabular-nums opacity-60">{list.length}</span>
            </p>
            <div className="space-y-1.5">
              {list.map((t) => {
                const priority = PRIORITIES.find((p) => p.id === t.priority);
                const project = projects.find((p) => p.id === t.project_id);
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", t.id);
                    }}
                    className="press cursor-grab rounded-xl border border-border/70 bg-background/60 p-2.5 shadow-[var(--shadow-soft)] active:cursor-grabbing"
                  >
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        t.status === "termine" && "text-muted-foreground line-through",
                      )}
                    >
                      {t.title}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[0.68rem] font-medium text-muted-foreground">
                      <span
                        className="inline-flex items-center gap-1"
                        style={{ color: priority?.color }}
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: priority?.color }}
                        />
                        {priority?.label}
                      </span>
                      {t.scheduled_date ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          {fmtDay(t.scheduled_date)}
                        </span>
                      ) : null}
                      <span className="truncate">{project ? project.name : "Annexe"}</span>
                    </p>
                  </div>
                );
              })}
              {list.length === 0 ? (
                <p className="px-1 py-3 text-xs text-muted-foreground">
                  Glissez une tâche ici.
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
