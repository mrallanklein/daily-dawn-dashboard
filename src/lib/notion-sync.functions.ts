import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { notionRunsInputSchema, notionSyncInputSchema } from "./notion.schemas";

export const listNotionDatabases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listDatabases } = await import("./notion.server");
    try {
      return { databases: await listDatabases(), error: null as string | null };
    } catch (err) {
      return { databases: [], error: err instanceof Error ? err.message : "Notion indisponible" };
    }
  });

export const syncNotionDatabase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(notionSyncInputSchema)
  .handler(async ({ data, context }) => {
    const { runSync } = await import("./notion-sync.server");
    return runSync(context.supabase, context.userId, data);
  });

export const listNotionSyncRuns = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(notionRunsInputSchema)
  .handler(async ({ data, context }) => {
    const { data: runs, error } = await context.supabase
      .from("notion_sync_runs")
      .select("*")
      .eq("workspace", data.workspace)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return runs ?? [];
  });
