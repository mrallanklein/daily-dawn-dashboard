import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Project } from "@/lib/data";
import type { Workspace } from "@/lib/workspace";

export function useProjectMutations(workspace: Workspace) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["projects"] });
  const onError = (e: Error) => toast.error(e.message);

  const create = useMutation({
    mutationFn: async (input: Partial<Project> & { name: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const { error } = await supabase.from("projects").insert({
        ...input,
        user_id: auth.user.id,
        workspace,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Projet créé");
      invalidate();
    },
    onError,
  });

  const patch = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string } & Record<string, unknown>) => {
      const { error } = await supabase
        .from("projects")
        .update(rest as never)
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Projet supprimé");
      invalidate();
    },
    onError,
  });

  /** Applique un nouvel ordre (colonne kanban) : la position suit l'ordre des identifiants. */
  const reorder = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status?: string }) => {
      await Promise.all(
        ids.map((id, index) =>
          supabase
            .from("projects")
            .update(status ? { position: index, status } : { position: index })
            .eq("id", id)
            .then(({ error }) => {
              if (error) throw new Error(error.message);
            }),
        ),
      );
    },
    onSuccess: invalidate,
    onError,
  });

  return { create, patch, remove, reorder };
}
