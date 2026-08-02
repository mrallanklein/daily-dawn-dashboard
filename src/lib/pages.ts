import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { Block } from "@/components/blocks/blocks";

export type PageKind = "blank" | "database" | "template";

export type WorkspacePage = {
  id: string;
  workspace: string;
  name: string;
  emoji: string;
  kind: PageKind;
  content: { blocks?: Block[] };
  position: number;
  hidden: boolean;
};

export const pagesQuery = (workspace: string) =>
  queryOptions({
    queryKey: ["workspace_pages", workspace],
    queryFn: async (): Promise<WorkspacePage[]> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];
      const res = await supabase
        .from("workspace_pages")
        .select("id, workspace, name, emoji, kind, content, position, hidden")
        .eq("workspace", workspace)
        .order("position", { ascending: true });
      if (res.error) throw new Error(res.error.message);
      return (res.data ?? []).map((p) => ({
        id: p.id as string,
        workspace: p.workspace as string,
        name: p.name as string,
        emoji: (p.emoji as string) ?? "",
        kind: (p.kind as PageKind) ?? "blank",
        content: (p.content ?? {}) as { blocks?: Block[] },
        position: p.position as number,
        hidden: Boolean(p.hidden),
      }));
    },
  });

export async function createPage(input: {
  workspace: string;
  name: string;
  emoji: string;
  kind: PageKind;
  position: number;
}) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Session expirée");
  const content =
    input.kind === "template"
      ? {
          blocks: [
            { id: crypto.randomUUID(), type: "heading", text: "Objectif" },
            { id: crypto.randomUUID(), type: "text", text: "Décrivez l'intention de cette page." },
            { id: crypto.randomUUID(), type: "divider", text: "" },
            { id: crypto.randomUUID(), type: "heading2", text: "Étapes" },
            { id: crypto.randomUUID(), type: "bullet", text: "Première étape" },
            { id: crypto.randomUUID(), type: "todo", text: "À faire" },
          ],
        }
      : { blocks: [] };
  const res = await supabase
    .from("workspace_pages")
    .insert({
      user_id: auth.user.id,
      workspace: input.workspace,
      name: input.name,
      emoji: input.emoji,
      kind: input.kind,
      position: input.position,
      content: content as unknown as Json,
    })
    .select("id")
    .single();
  if (res.error) throw new Error(res.error.message);
  return res.data.id as string;
}

export async function updatePage(id: string, patch: Record<string, unknown>) {
  const res = await supabase
    .from("workspace_pages")
    .update(patch as never)
    .eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

export async function deletePage(id: string) {
  const res = await supabase.from("workspace_pages").delete().eq("id", id);
  if (res.error) throw new Error(res.error.message);
}

export async function reorderPages(orderedIds: string[]) {
  for (const [index, id] of orderedIds.entries()) await updatePage(id, { position: index });
}

/* ---------------------------------- Entrées ---------------------------------- */

export type PageEntry = {
  id: string;
  title: string;
  values: Record<string, unknown>;
  position: number;
};

export const pageEntriesQuery = (pageId: string) =>
  queryOptions({
    queryKey: ["page_entries", pageId],
    queryFn: async (): Promise<PageEntry[]> => {
      const res = await supabase
        .from("page_entries")
        .select("id, title, values, position")
        .eq("page_id", pageId)
        .order("position", { ascending: true });
      if (res.error) throw new Error(res.error.message);
      return (res.data ?? []).map((e) => ({
        id: e.id as string,
        title: e.title as string,
        values: (e.values ?? {}) as Record<string, unknown>,
        position: e.position as number,
      }));
    },
  });

export async function createPageEntry(pageId: string, title: string, position: number) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Session expirée");
  const res = await supabase.from("page_entries").insert({
    user_id: auth.user.id,
    page_id: pageId,
    title,
    position,
  });
  if (res.error) throw new Error(res.error.message);
}

export async function updatePageEntry(id: string, patch: Record<string, unknown>) {
  const res = await supabase
    .from("page_entries")
    .update(patch as never)
    .eq("id", id);
  if (res.error) throw new Error(res.error.message);
}
