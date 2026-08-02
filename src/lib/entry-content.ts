import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { Block } from "@/components/blocks/blocks";

export type EntryComment = { id: string; author: string; body: string; created_at: string };

export type EntryContent = { blocks: Block[]; comments: EntryComment[] };

const EMPTY: EntryContent = { blocks: [], comments: [] };

export const entryContentQuery = (module: string, entryId: string | null) =>
  queryOptions({
    queryKey: ["entry_content", module, entryId],
    enabled: Boolean(entryId),
    queryFn: async (): Promise<EntryContent> => {
      if (!entryId) return EMPTY;
      const res = await supabase
        .from("entry_props")
        .select("values")
        .eq("module", module)
        .eq("entry_id", entryId)
        .maybeSingle();
      if (res.error) throw new Error(res.error.message);
      const values = (res.data?.values ?? {}) as Record<string, unknown>;
      return {
        blocks: (values["__blocks"] as Block[] | undefined) ?? [],
        comments: (values["__comments"] as EntryComment[] | undefined) ?? [],
      };
    },
  });

/** Fusionne des clés de contenu dans les propriétés JSONB de l'entrée. */
export async function saveEntryContent(
  module: string,
  entryId: string,
  part: Partial<EntryContent>,
) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Session expirée");
  const current = await supabase
    .from("entry_props")
    .select("values")
    .eq("module", module)
    .eq("entry_id", entryId)
    .maybeSingle();
  if (current.error) throw new Error(current.error.message);
  const values = { ...((current.data?.values ?? {}) as Record<string, unknown>) };
  if (part.blocks) values["__blocks"] = part.blocks;
  if (part.comments) values["__comments"] = part.comments;
  const res = await supabase.from("entry_props").upsert(
    {
      user_id: auth.user.id,
      module,
      entry_id: entryId,
      values: values as unknown as Json,
    },
    { onConflict: "user_id,module,entry_id" },
  );
  if (res.error) throw new Error(res.error.message);
}
