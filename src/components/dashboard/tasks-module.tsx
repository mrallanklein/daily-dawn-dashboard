import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { tasksQuery, type Task } from "@/lib/data";
import { EmptyState, ModuleCard } from "@/components/module-card";
import { RangeToggle } from "@/components/range-toggle";
import { fmtDay, inRange, todayISO, type RangeDays } from "@/lib/dates";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function TasksModule() {
  const [range, setRange] = useState<RangeDays>(1);
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();
  const { data: tasks } = useQuery(tasksQuery());

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tasks"] });

  const addTask = useMutation({
    mutationFn: async (value: string) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const { error } = await supabase
        .from("tasks")
        .insert({ title: value, scheduled_date: todayISO(), user_id: auth.user.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setTitle("");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (task: Task) => {
      const done = task.status === "termine";
      const { error } = await supabase
        .from("tasks")
        .update({
          status: done ? "a_faire" : "termine",
          completed_at: done ? null : new Date().toISOString(),
        })
        .eq("id", task.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: (e) => toast.error(e.message),
  });

  const visible = (tasks ?? []).filter(
    (t) => inRange(t.scheduled_date, range) || inRange(t.due_date, range),
  );

  return (
    <ModuleCard
      eyebrow="À faire"
      title="Mes tâches"
      action={<RangeToggle value={range} onChange={setRange} />}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) addTask.mutate(title.trim());
        }}
        className="mb-4 flex gap-2"
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

      {visible.length === 0 ? (
        <EmptyState>Rien de prévu sur cette période.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {visible.map((task) => (
            <li
              key={task.id}
              className="soft-row flex items-start gap-3 px-2 py-1.5"
            >
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
                <p className="text-xs text-muted-foreground">
                  {task.scheduled_date ? fmtDay(task.scheduled_date) : "Sans date"}
                  {task.due_date ? ` · échéance ${fmtDay(task.due_date)}` : ""}
                </p>
              </div>
              {task.priority === "haute" ? (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
                  Priorité
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </ModuleCard>
  );
}