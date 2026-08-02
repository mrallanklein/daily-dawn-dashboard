import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { listDatabases, queryDatabasePages, toRow, pick, firstOfType, type NotionRow } from "./notion.server";
import { mapPriority, mapProjectStatus, mapTaskStatus } from "./notion-map";

export type SyncTarget = "projects" | "tasks" | "milestones";

export type SyncInput = {
  workspace: string;
  databaseId: string;
  target: SyncTarget;
};

export type SyncResult = {
  target: SyncTarget;
  databaseTitle: string;
  created: number;
  updated: number;
  skipped: number;
  warnings: string[];
};

type Client = SupabaseClient<Database>;

const text = (row: NotionRow, aliases: string[]) => pick(row, aliases, ["rich_text", "select", "multi_select", "formula", "url", "people"])?.text || null;
const dateOf = (row: NotionRow, aliases: string[]) => pick(row, aliases, ["date", "formula"]);
const numberOf = (row: NotionRow, aliases: string[]) => pick(row, aliases, ["number", "formula"])?.number ?? null;

function relationIds(row: NotionRow, aliases: string[]): string[] {
  const direct = pick(row, aliases, ["relation"]);
  if (direct?.relations.length) return direct.relations;
  const fallback = firstOfType(row, ["relation"]);
  return fallback?.relations ?? [];
}

async function loadDatabase(databaseId: string) {
  const databases = await listDatabases();
  const db = databases.find((d) => d.id === databaseId || d.queryId === databaseId);
  const pages = await queryDatabasePages(databaseId);
  return { title: db?.title ?? "Base Notion", rows: pages.map(toRow) };
}

async function notionIdMap(supabase: Client, table: "projects" | "tasks" | "project_milestones", userId: string) {
  const { data, error } = await supabase
    .from(table)
    .select("id, notion_page_id")
    .eq("user_id", userId)
    .not("notion_page_id", "is", null);
  if (error) throw error;
  const map = new Map<string, string>();
  for (const r of data ?? []) if (r.notion_page_id) map.set(r.notion_page_id, r.id);
  return map;
}

/* ------------------------------- projets ------------------------------- */

async function syncProjects(supabase: Client, userId: string, input: SyncInput): Promise<SyncResult> {
  const { title, rows } = await loadDatabase(input.databaseId);
  const existing = await notionIdMap(supabase, "projects", userId);
  const warnings: string[] = [];
  let created = 0;
  let updated = 0;

  for (const [index, row] of rows.entries()) {
    const deadline = dateOf(row, ["deadline", "echeance", "date de fin", "fin", "date"]);
    const start = dateOf(row, ["debut", "date de debut", "start", "demarrage"]);
    const work = dateOf(row, ["planifie", "jour de travail", "work date", "planification"]);
    const status = pick(row, ["statut", "status", "etat", "avancement"], ["status", "select"]);
    const progress = numberOf(row, ["progression", "avancement", "progress", "pourcentage"]);
    const payload = {
      user_id: userId,
      workspace: input.workspace,
      notion_page_id: row.id,
      name: row.title,
      description: text(row, ["description", "resume", "notes", "brief"]),
      status: mapProjectStatus(status?.text ?? ""),
      priority: mapPriority(pick(row, ["priorite", "priority"], ["select", "status"])?.text ?? ""),
      category: text(row, ["categorie", "famille", "type", "category"]),
      client: text(row, ["client", "marque", "annonceur"]),
      next_step: text(row, ["prochaine etape", "next step", "action"]),
      budget: numberOf(row, ["budget", "budget prevu"]),
      progress: progress == null ? 0 : Math.max(0, Math.min(100, Math.round(progress <= 1 ? progress * 100 : progress))),
      start_date: start?.date ?? null,
      deadline: deadline?.date ?? deadline?.dateEnd ?? null,
      work_date: work?.date ?? null,
      cover_url: row.cover,
      tags: (pick(row, ["tags", "etiquettes", "labels"], ["multi_select"])?.text ?? "")
        .split(", ")
        .filter(Boolean),
      position: index,
    };
    const current = existing.get(row.id);
    if (current) {
      const { error } = await supabase.from("projects").update(payload).eq("id", current).eq("user_id", userId);
      if (error) warnings.push(`${row.title} : ${error.message}`);
      else updated += 1;
    } else {
      const { error } = await supabase.from("projects").insert(payload);
      if (error) warnings.push(`${row.title} : ${error.message}`);
      else created += 1;
    }
  }
  return { target: "projects", databaseTitle: title, created, updated, skipped: warnings.length, warnings };
}

/* -------------------------------- tâches -------------------------------- */

async function projectLookup(supabase: Client, userId: string, workspace: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, notion_page_id")
    .eq("user_id", userId)
    .eq("workspace", workspace);
  if (error) throw error;
  const byNotion = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const p of data ?? []) {
    if (p.notion_page_id) byNotion.set(p.notion_page_id, p.id);
    byName.set(p.name.toLowerCase().trim(), p.id);
  }
  return { byNotion, byName };
}

async function syncTasks(supabase: Client, userId: string, input: SyncInput): Promise<SyncResult> {
  const { title, rows } = await loadDatabase(input.databaseId);
  const existing = await notionIdMap(supabase, "tasks", userId);
  const projects = await projectLookup(supabase, userId, input.workspace);
  const warnings: string[] = [];
  let created = 0;
  let updated = 0;

  for (const [index, row] of rows.entries()) {
    const relation = relationIds(row, ["projet", "project", "projets"]);
    const linkedByName = text(row, ["projet", "project"]);
    const projectId =
      relation.map((id) => projects.byNotion.get(id)).find(Boolean) ??
      (linkedByName ? projects.byName.get(linkedByName.toLowerCase().trim()) : undefined) ??
      null;
    const due = dateOf(row, ["deadline", "echeance", "date limite", "due"]);
    const scheduled = dateOf(row, ["planifie", "date", "jour", "scheduled"]);
    const status = pick(row, ["statut", "status", "etat"], ["status", "select"]);
    const done = pick(row, ["termine", "fait", "done", "checkbox"], ["checkbox"])?.checkbox ?? null;
    const payload = {
      user_id: userId,
      workspace: input.workspace,
      notion_page_id: row.id,
      title: row.title,
      description: text(row, ["description", "notes", "detail"]),
      status: mapTaskStatus(status?.text ?? "", done),
      priority: mapPriority(pick(row, ["priorite", "priority"], ["select", "status"])?.text ?? ""),
      project_id: projectId,
      due_date: due?.date ?? null,
      scheduled_date: scheduled?.date ?? null,
      duration_minutes: numberOf(row, ["duree", "duration", "minutes"]),
      position: index,
    };
    const current = existing.get(row.id);
    if (current) {
      const { error } = await supabase.from("tasks").update(payload).eq("id", current).eq("user_id", userId);
      if (error) warnings.push(`${row.title} : ${error.message}`);
      else updated += 1;
    } else {
      const { error } = await supabase.from("tasks").insert(payload);
      if (error) warnings.push(`${row.title} : ${error.message}`);
      else created += 1;
    }
  }
  return { target: "tasks", databaseTitle: title, created, updated, skipped: warnings.length, warnings };
}

/* -------------------------------- jalons -------------------------------- */

async function syncMilestones(supabase: Client, userId: string, input: SyncInput): Promise<SyncResult> {
  const { title, rows } = await loadDatabase(input.databaseId);
  const existing = await notionIdMap(supabase, "project_milestones", userId);
  const projects = await projectLookup(supabase, userId, input.workspace);
  const warnings: string[] = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const [index, row] of rows.entries()) {
    const relation = relationIds(row, ["projet", "project"]);
    const linkedByName = text(row, ["projet", "project"]);
    const projectId =
      relation.map((id) => projects.byNotion.get(id)).find(Boolean) ??
      (linkedByName ? projects.byName.get(linkedByName.toLowerCase().trim()) : undefined) ??
      null;
    const due = dateOf(row, ["date", "echeance", "deadline", "jalon"]);
    if (!projectId || !due?.date) {
      skipped += 1;
      warnings.push(`${row.title} : projet lié ou date manquante`);
      continue;
    }
    const payload = {
      user_id: userId,
      notion_page_id: row.id,
      project_id: projectId,
      title: row.title,
      due_date: due.date,
      reached: pick(row, ["atteint", "termine", "done", "fait"], ["checkbox"])?.checkbox ?? false,
      position: index,
    };
    const current = existing.get(row.id);
    if (current) {
      const { error } = await supabase
        .from("project_milestones")
        .update(payload)
        .eq("id", current)
        .eq("user_id", userId);
      if (error) warnings.push(`${row.title} : ${error.message}`);
      else updated += 1;
    } else {
      const { error } = await supabase.from("project_milestones").insert(payload);
      if (error) warnings.push(`${row.title} : ${error.message}`);
      else created += 1;
    }
  }
  return { target: "milestones", databaseTitle: title, created, updated, skipped, warnings };
}

export async function runSync(supabase: Client, userId: string, input: SyncInput): Promise<SyncResult> {
  const result =
    input.target === "projects"
      ? await syncProjects(supabase, userId, input)
      : input.target === "tasks"
        ? await syncTasks(supabase, userId, input)
        : await syncMilestones(supabase, userId, input);

  await supabase.from("notion_sync_runs").insert({
    user_id: userId,
    workspace: input.workspace,
    target: input.target,
    database_id: input.databaseId,
    database_title: result.databaseTitle,
    created_count: result.created,
    updated_count: result.updated,
    skipped_count: result.skipped,
    status: result.warnings.length ? "partial" : "success",
    message: result.warnings.slice(0, 5).join(" · ") || null,
  });
  return result;
}
