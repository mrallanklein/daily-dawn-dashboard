import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Project, Task } from "@/lib/data";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PRIORITIES, type TaskMutations } from "./task-row";

/** Panneau latéral d'une tâche : détail, description et sous-tâches. */
export function TaskPanel({
  task,
  subtasks,
  projects,
  mutations,
  onClose,
}: {
  task: Task | null;
  subtasks: Task[];
  projects: Project[];
  mutations: TaskMutations;
  onClose: () => void;
}) {
  const { patch, toggle, remove, create } = mutations;
  const [sub, setSub] = useState("");

  if (!task) return null;
  const done = task.status === "termine";

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="pr-8 text-left font-display text-lg">{task.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-10">
          <div>
            <Label htmlFor="t-title">Titre</Label>
            <Input
              id="t-title"
              defaultValue={task.title}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== task.title) patch.mutate({ id: task.id, title: v });
              }}
            />
          </div>

          <div>
            <Label>Description</Label>
            <div className="rounded-xl border border-border bg-background p-2.5">
              <RichText
                value={task.description}
                onSave={(html) => patch.mutate({ id: task.id, description: html })}
              />
            </div>
          </div>


          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="t-sched">Date de travail</Label>
              <Input
                id="t-sched"
                type="date"
                value={task.scheduled_date ?? ""}
                onChange={(e) =>
                  patch.mutate({ id: task.id, scheduled_date: e.target.value || null })
                }
              />
            </div>
            <div>
              <Label htmlFor="t-due">Échéance</Label>
              <Input
                id="t-due"
                type="date"
                value={task.due_date ?? ""}
                onChange={(e) => patch.mutate({ id: task.id, due_date: e.target.value || null })}
              />
            </div>
            <div>
              <Label>Priorité</Label>
              <Select
                value={task.priority}
                onValueChange={(v) => patch.mutate({ id: task.id, priority: v })}
              >
                <SelectTrigger>
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
            </div>
            <div>
              <Label>Projet</Label>
              <Select
                value={task.project_id ?? "none"}
                onValueChange={(v) =>
                  patch.mutate({ id: task.id, project_id: v === "none" ? null : v })
                }
              >
                <SelectTrigger>
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
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="t-done"
              checked={done}
              onCheckedChange={() => toggle.mutate(task)}
              className="mt-0"
            />
            <Label htmlFor="t-done" className="text-sm">
              Terminée
            </Label>
          </div>

          <div>
            <Label>Sous-tâches</Label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!sub.trim()) return;
                create.mutate({
                  title: sub.trim(),
                  parent_task_id: task.id,
                  project_id: task.project_id,
                  scheduled_date: task.scheduled_date,
                });
                setSub("");
              }}
              className="mb-2 flex gap-2"
            >
              <Input
                value={sub}
                onChange={(e) => setSub(e.target.value)}
                placeholder="Nouvelle sous-tâche…"
              />
              <Button type="submit" size="icon" aria-label="Ajouter une sous-tâche">
                <Plus className="size-4" strokeWidth={1.5} />
              </Button>
            </form>
            <ul className="space-y-0.5">
              {subtasks.map((s) => (
                <li key={s.id} className="soft-row group flex items-center gap-2.5 px-2 py-1.5">
                  <Checkbox
                    checked={s.status === "termine"}
                    onCheckedChange={() => toggle.mutate(s)}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm",
                      s.status === "termine" && "text-muted-foreground line-through",
                    )}
                  >
                    {s.title}
                  </span>
                  <button
                    onClick={() => remove.mutate(s.id)}
                    aria-label="Supprimer la sous-tâche"
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <Trash2
                      className="size-3.5 text-muted-foreground hover:text-destructive"
                      strokeWidth={1.5}
                    />
                  </button>
                </li>
              ))}
              {subtasks.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">Aucune sous-tâche.</p>
              ) : null}
            </ul>
          </div>

          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              remove.mutate(task.id);
              onClose();
            }}
          >
            <Trash2 className="size-4" strokeWidth={1.5} /> Supprimer la tâche
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
