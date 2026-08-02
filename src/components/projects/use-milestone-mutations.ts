import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Milestone } from "@/lib/data";

/** Jalons d'un projet : création, bascule « atteint », suppression, en optimiste. */
export function useMilestoneMutations() {
  const queryClient = useQueryClient();
  const key = ["project_milestones"] as const;

  const optimistic = async (
    fn: (rows: Milestone[]) => Milestone[],
  ): Promise<{ previous?: Milestone[] }> => {
    await queryClient.cancelQueries({ queryKey: key });
    const previous = queryClient.getQueryData<Milestone[]>(key);
    if (!previous) return {};
    queryClient.setQueryData<Milestone[]>(key, fn(previous));
    return { previous };
  };

  const rollback = (e: Error, _v: unknown, ctx?: { previous?: Milestone[] }) => {
    if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
    toast.error(e.message);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: key });

  const create = useMutation({
    mutationFn: async (input: { project_id: string; title: string; due_date: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const { error } = await supabase
        .from("project_milestones")
        .insert({ ...input, user_id: auth.user.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (m: Milestone) => {
      const { error } = await supabase
        .from("project_milestones")
        .update({ reached: !m.reached })
        .eq("id", m.id);
      if (error) throw new Error(error.message);
    },
    onMutate: (m: Milestone) =>
      optimistic((rows) => rows.map((r) => (r.id === m.id ? { ...r, reached: !r.reached } : r))),
    onSuccess: invalidate,
    onError: rollback,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_milestones").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: (id: string) => optimistic((rows) => rows.filter((r) => r.id !== id)),
    onSuccess: invalidate,
    onError: rollback,
  });

  return { create, toggle, remove };
}
