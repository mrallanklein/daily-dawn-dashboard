import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Project } from "@/lib/data";
import type { Workspace } from "@/lib/workspace";

export function useProjectMutations(workspace: Workspace) {
  const queryClient = useQueryClient();
  const key = ["projects", workspace] as const;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["projects"] });
  const onError = (e: Error) => toast.error(e.message);

  /** Écrit tout de suite dans le cache et conserve l'état précédent pour rollback. */
  const optimistic = async (
    fn: (projects: Project[]) => Project[],
  ): Promise<{ previous?: Project[] }> => {
    await queryClient.cancelQueries({ queryKey: key });
    const previous = queryClient.getQueryData<Project[]>(key);
    if (!previous) return {};
    queryClient.setQueryData<Project[]>(key, fn(previous));
    return { previous };
  };

  const rollback = (e: Error, _vars: unknown, ctx?: { previous?: Project[] }) => {
    if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
    toast.error(e.message);
  };

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
    onMutate: ({ id, ...rest }: { id: string } & Record<string, unknown>) =>
      optimistic((projects) =>
        projects.map((p) => (p.id === id ? ({ ...p, ...rest } as Project) : p)),
      ),
    onSuccess: invalidate,
    onError: rollback,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: (id: string) => optimistic((projects) => projects.filter((p) => p.id !== id)),
    onSuccess: () => {
      toast.success("Projet supprimé");
      invalidate();
    },
    onError: rollback,
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
    onMutate: ({ ids, status }: { ids: string[]; status?: string }) =>
      optimistic((projects) =>
        projects.map((p) => {
          const index = ids.indexOf(p.id);
          if (index === -1) return p;
          return status ? { ...p, position: index, status } : { ...p, position: index };
        }),
      ),
    onSuccess: invalidate,
    onError: rollback,
  });

  return { create, patch, remove, reorder };
}
