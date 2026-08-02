import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type HistoryEntry = {
  id: string;
  module: string;
  entry_id: string;
  author: string;
  summary: string;
  snapshot: Record<string, unknown>;
  created_at: string;
};

export const entryHistoryQuery = (module: string, entryId: string | null) =>
  queryOptions({
    queryKey: ["entry_history", module, entryId],
    enabled: Boolean(entryId),
    queryFn: async (): Promise<HistoryEntry[]> => {
      if (!entryId) return [];
      const res = await supabase
        .from("entry_history")
        .select("id, module, entry_id, author, summary, snapshot, created_at")
        .eq("module", module)
        .eq("entry_id", entryId)
        .order("created_at", { ascending: false })
        .limit(60);
      if (res.error) throw new Error(res.error.message);
      return (res.data ?? []).map((h) => ({
        id: h.id as string,
        module: h.module as string,
        entry_id: h.entry_id as string,
        author: h.author as string,
        summary: h.summary as string,
        snapshot: (h.snapshot ?? {}) as Record<string, unknown>,
        created_at: h.created_at as string,
      }));
    },
  });

/** Enregistre une version de l'entrée : qui, quoi, quand. */
export async function recordHistory(input: {
  module: string;
  entryId: string;
  author: string;
  summary: string;
  snapshot: Record<string, unknown>;
}) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  const res = await supabase.from("entry_history").insert({
    user_id: auth.user.id,
    module: input.module,
    entry_id: input.entryId,
    author: input.author,
    summary: input.summary,
    snapshot: input.snapshot as unknown as Json,
  });
  if (res.error) throw new Error(res.error.message);
}
