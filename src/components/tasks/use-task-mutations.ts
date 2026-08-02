import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/dates";
import type { Task } from "@/lib/data";
import type { Workspace } from "@/lib/workspace";

export function useTaskMutations(workspace: Workspace) {
  const queryClient = useQueryClient();
  const key = ["tasks", workspace] as const;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tasks"] });

  /**
   * Applique immédiatement une transformation sur le cache des tâches et
   * renvoie l'état précédent pour pouvoir le restaurer en cas d'échec.
   */
  const optimistic = async (fn: (tasks: Task[]) => Task[]): Promise<{ previous?: Task[] }> => {
    await queryClient.cancelQueries({ queryKey: key });
    const previous = queryClient.getQueryData<Task[]>(key);
    if (!previous) return {};
    queryClient.setQueryData<Task[]>(key, fn(previous));
    return { previous };
  };

  const rollback = (e: Error, _vars: unknown, ctx?: { previous?: Task[] }) => {
    if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
    toast.error(e.message);
  };
  const onError = (e: Error) => toast.error(e.message);

  const create = useMutation({
    mutationFn: async (input: {
      title: string;
      project_id?: string | null;
      parent_task_id?: string | null;
      scheduled_date?: string | null;
      due_date?: string | null;
      priority?: string;
      description?: string | null;
    }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const { error } = await supabase.from("tasks").insert({
        title: input.title,
        user_id: auth.user.id,
        workspace,
        project_id: input.project_id ?? null,
        parent_task_id: input.parent_task_id ?? null,
        scheduled_date: input.scheduled_date ?? todayISO(),
        due_date: input.due_date ?? null,
        priority: input.priority ?? "moyenne",
        description: input.description ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError,
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
    onMutate: (task: Task) =>
      optimistic((tasks) =>
        tasks.map((t) =>
          t.id === task.id
            ? { ...t, status: t.status === "termine" ? "a_faire" : "termine" }
            : t,
        ),
      ),
    onSuccess: invalidate,
    onError: rollback,
  });

  const patch = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase
        .from("tasks")
        .update(rest as never)
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: ({ id, ...rest }: { id: string } & Record<string, unknown>) =>
      optimistic((tasks) => tasks.map((t) => (t.id === id ? ({ ...t, ...rest } as Task) : t))),
    onSuccess: invalidate,
    onError: rollback,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: (id: string) =>
      optimistic((tasks) => tasks.filter((t) => t.id !== id && t.parent_task_id !== id)),
    onSuccess: invalidate,
    onError: rollback,
  });

  /** Réordonne une liste de tâches : la position suit l'ordre des identifiants. */
  const reorder = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id, index) =>
          supabase
            .from("tasks")
            .update({ position: index })
            .eq("id", id)
            .then(({ error }) => {
              if (error) throw new Error(error.message);
            }),
        ),
      );
    },
    onMutate: (ids: string[]) =>
      optimistic((tasks) =>
        tasks.map((t) => {
          const index = ids.indexOf(t.id);
          return index === -1 ? t : { ...t, position: index };
        }),
      ),
    onSuccess: invalidate,
    onError: rollback,
  });

  return { create, toggle, patch, remove, reorder };
}
