import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/dates";
import type { Task } from "@/lib/data";
import type { Workspace } from "@/lib/workspace";

export function useTaskMutations(workspace: Workspace) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tasks"] });
  const onError = (e: Error) => toast.error(e.message);

  const create = useMutation({
    mutationFn: async (input: {
      title: string;
      project_id?: string | null;
      parent_task_id?: string | null;
      scheduled_date?: string | null;
      due_date?: string | null;
      priority?: string;
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
    onSuccess: invalidate,
    onError,
  });

  const patch = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase
        .from("tasks")
        .update(rest as never)
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError,
  });

  return { create, toggle, patch, remove };
}
