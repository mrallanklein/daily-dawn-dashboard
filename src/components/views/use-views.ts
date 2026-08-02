import { useMemo } from "react";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useWorkspace } from "@/lib/workspace";
import {
  DEFAULT_CONFIG,
  type Layout,
  type ModuleView,
  type PropertyDef,
  type ViewConfig,
} from "./types";

async function userId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export const moduleViewsQuery = (workspace: string, module: string) =>
  queryOptions({
    queryKey: ["module_views", workspace, module],
    queryFn: async (): Promise<ModuleView[]> => {
      const res = await supabase
        .from("module_views")
        .select("*")
        .eq("workspace", workspace)
        .eq("module", module)
        .order("position", { ascending: true });
      if (res.error) throw new Error(res.error.message);
      return (res.data ?? []).map((v) => ({
        id: v.id as string,
        module: v.module as string,
        name: v.name as string,
        emoji: (v.emoji as string) ?? "",
        layout: v.layout as Layout,
        position: v.position as number,
        hidden: Boolean(v.hidden),
        share_token: (v.share_token as string | null) ?? null,
        config: { ...DEFAULT_CONFIG, ...((v.config ?? {}) as Partial<ViewConfig>) } as ViewConfig,
      }));
    },
  });

export const modulePropertiesQuery = (workspace: string, module: string) =>
  queryOptions({
    queryKey: ["module_properties", workspace, module],
    queryFn: async (): Promise<PropertyDef[]> => {
      const res = await supabase
        .from("module_properties")
        .select("*")
        .eq("workspace", workspace)
        .eq("module", module)
        .order("position", { ascending: true });
      if (res.error) throw new Error(res.error.message);
      return (res.data ?? []).map((p) => ({
        id: p.id as string,
        name: p.name as string,
        type: p.type as PropertyDef["type"],
        hidden: Boolean(p.hidden),
        custom: true,
        ...((p.config ?? {}) as Partial<PropertyDef>),
      }));
    },
  });

export const entryPropsQuery = (module: string) =>
  queryOptions({
    queryKey: ["entry_props", module],
    queryFn: async (): Promise<Record<string, Record<string, unknown>>> => {
      const res = await supabase
        .from("entry_props")
        .select("entry_id, values")
        .eq("module", module);
      if (res.error) throw new Error(res.error.message);
      const out: Record<string, Record<string, unknown>> = {};
      for (const row of res.data ?? [])
        out[row.entry_id as string] = (row.values ?? {}) as Record<string, unknown>;
      return out;
    },
  });

/** Vues, propriétés personnalisées et valeurs associées pour un module donné. */
export function useModuleViews(module: string, fallbackLayouts: Layout[] = ["table"]) {
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();

  const views = useQuery(moduleViewsQuery(workspace, module));
  const customProps = useQuery(modulePropertiesQuery(workspace, module));
  const entryValues = useQuery(entryPropsQuery(module));

  const invalidate = (key: string) =>
    queryClient.invalidateQueries({ queryKey: [key, workspace, module] });

  const effectiveViews = useMemo<ModuleView[]>(() => {
    const stored = views.data ?? [];
    if (stored.length > 0) return stored;
    return fallbackLayouts.map((layout, index) => ({
      id: `default:${layout}`,
      module,
      name:
        layout === "table"
          ? "Table"
          : layout === "kanban"
            ? "Kanban"
            : layout === "calendar"
              ? "Calendrier"
              : layout === "timeline"
                ? "Chronologie"
                : layout === "gallery"
                  ? "Galerie"
                  : "Liste",
      emoji: "",
      layout,
      position: index,
      hidden: false,
      share_token: null,
      config: DEFAULT_CONFIG,
    }));
  }, [views.data, fallbackLayouts, module]);

  const createView = useMutation({
    mutationFn: async (input: { name: string; emoji: string; layout: Layout }) => {
      const uid = await userId();
      if (!uid) throw new Error("Session expirée");
      const res = await supabase.from("module_views").insert({
        user_id: uid,
        workspace,
        module,
        name: input.name || "Vue",
        emoji: input.emoji,
        layout: input.layout,
        position: effectiveViews.length,
        config: DEFAULT_CONFIG as unknown as Json,
      });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => invalidate("module_views"),
  });

  const updateView = useMutation({
    mutationFn: async (input: {
      id: string;
      patch: Record<string, unknown>;
      base?: ModuleView | undefined;
    }) => {
      if (input.id.startsWith("default:")) {
        // Matérialise la vue par défaut avant de l'éditer.
        const uid = await userId();
        if (!uid) throw new Error("Session expirée");
        const base = effectiveViews.find((v) => v.id === input.id);
        const res = await supabase.from("module_views").insert({
          user_id: uid,
          workspace,
          module,
          name: base?.name ?? "Vue",
          emoji: base?.emoji ?? "",
          layout: base?.layout ?? "table",
          position: base?.position ?? 0,
          config: (base?.config ?? DEFAULT_CONFIG) as unknown as Json,
          ...input.patch,
        } as never);
        if (res.error) throw new Error(res.error.message);
        return;
      }
      const res = await supabase
        .from("module_views")
        .update(input.patch as never)
        .eq("id", input.id);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => invalidate("module_views"),
  });

  const duplicateView = useMutation({
    mutationFn: async (id: string) => {
      const uid = await userId();
      if (!uid) throw new Error("Session expirée");
      const base = effectiveViews.find((v) => v.id === id);
      if (!base) return;
      const res = await supabase.from("module_views").insert({
        user_id: uid,
        workspace,
        module,
        name: `${base.name} (copie)`,
        emoji: base.emoji,
        layout: base.layout,
        position: effectiveViews.length,
        config: base.config as unknown as Json,
      });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => invalidate("module_views"),
  });

  /** Réordonne les onglets ; matérialise les vues par défaut au besoin. */
  const reorderViews = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const uid = await userId();
      if (!uid) throw new Error("Session expirée");
      for (const [index, id] of orderedIds.entries()) {
        const base = effectiveViews.find((v) => v.id === id);
        if (!base) continue;
        if (id.startsWith("default:")) {
          const res = await supabase.from("module_views").insert({
            user_id: uid,
            workspace,
            module,
            name: base.name,
            emoji: base.emoji,
            layout: base.layout,
            position: index,
            config: base.config as unknown as Json,
          });
          if (res.error) throw new Error(res.error.message);
          continue;
        }
        const res = await supabase.from("module_views").update({ position: index }).eq("id", id);
        if (res.error) throw new Error(res.error.message);
      }
    },
    onSuccess: () => invalidate("module_views"),
  });

  const deleteView = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith("default:")) return;
      const res = await supabase.from("module_views").delete().eq("id", id);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => invalidate("module_views"),
  });

  const saveProperty = useMutation({
    mutationFn: async (input: { id?: string; name: string; type: string; config: Record<string, unknown>; hidden?: boolean }) => {
      const uid = await userId();
      if (!uid) throw new Error("Session expirée");
      if (input.id) {
        const res = await supabase
          .from("module_properties")
          .update({
            name: input.name,
            type: input.type,
            config: input.config as unknown as Json,
            hidden: input.hidden ?? false,
          })
          .eq("id", input.id);
        if (res.error) throw new Error(res.error.message);
        return;
      }
      const res = await supabase.from("module_properties").insert({
        user_id: uid,
        workspace,
        module,
        name: input.name,
        type: input.type,
        config: input.config as unknown as Json,
        position: (customProps.data ?? []).length,
      });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => invalidate("module_properties"),
  });

  const deleteProperty = useMutation({
    mutationFn: async (id: string) => {
      const res = await supabase.from("module_properties").delete().eq("id", id);
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => invalidate("module_properties"),
  });

  const setEntryValue = useMutation({
    mutationFn: async (input: { entryId: string; propertyId: string; value: unknown }) => {
      const uid = await userId();
      if (!uid) throw new Error("Session expirée");
      const current = (entryValues.data ?? {})[input.entryId] ?? {};
      const res = await supabase.from("entry_props").upsert(
        {
          user_id: uid,
          module,
          entry_id: input.entryId,
          values: { ...current, [input.propertyId]: input.value } as unknown as Json,
        },
        { onConflict: "user_id,module,entry_id" },
      );
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["entry_props", module] }),
  });

  return {
    views: effectiveViews,
    customProps: customProps.data ?? [],
    entryValues: entryValues.data ?? {},
    isLoading: views.isLoading || customProps.isLoading,
    createView,
    updateView,
    duplicateView,
    reorderViews,
    deleteView,
    saveProperty,
    deleteProperty,
    setEntryValue,
  };
}
