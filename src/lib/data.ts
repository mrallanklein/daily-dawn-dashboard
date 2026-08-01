import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Workspace } from "@/lib/workspace";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  alias_name: string | null;
  alias_avatar_url: string | null;
  banner_url: string | null;
  weather_city: string;
  weather_lat: number;
  weather_lon: number;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  client: string | null;
  progress: number;
  budget: number | null;
  budget_spent: number;
  start_date: string | null;
  deadline: string | null;
  work_date: string | null;
  color: string;
  cover_url: string | null;
  next_step: string | null;
  position: number;
  workspace: string;
};

export type Task = {
  id: string;
  project_id: string | null;
  parent_task_id: string | null;
  title: string;
  notes: string | null;
  status: string;
  priority: string;
  scheduled_date: string | null;
  due_date: string | null;
  start_time: string | null;
  duration_minutes: number | null;
  workspace: string;
};

export type NoteItem = {
  id: string;
  content: string;
  checked: boolean;
  position: number;
  parent_id: string | null;
  due_date: string | null;
};

export type Contact = {
  id: string;
  full_name: string;
  company: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  notes: string | null;
  last_contact_date: string | null;
  country: string | null;
  source: string | null;
  tags: string[] | null;
  workspace: string;
};

export type Interaction = {
  id: string;
  contact_id: string;
  kind: string;
  body: string;
  occurred_on: string;
};

export type Transaction = {
  id: string;
  project_id: string | null;
  kind: string;
  amount: number;
  description: string;
  category: string;
  status: string;
  invoice_number: string | null;
  invoice_url: string | null;
  occurred_on: string;
  workspace: string;
};

export type TeamMember = {
  id: string;
  full_name: string;
  email: string | null;
  role: string | null;
  permission: string;
  status: string;
  avatar_url: string | null;
  workspace: string;
};

export type ProjectComment = {
  id: string;
  project_id: string;
  body: string;
  created_at: string;
};

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as T;
}

export const profileQuery = () =>
  queryOptions({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const res = await supabase
        .from("profiles")
        .select(
          "id, display_name, avatar_url, alias_name, alias_avatar_url, banner_url, weather_city, weather_lat, weather_lon",
        )
        .eq("id", auth.user.id)
        .maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return (res.data as Profile | null) ?? null;
    },
  });

export const projectsQuery = (ws: Workspace) =>
  queryOptions({
    queryKey: ["projects", ws],
    queryFn: async () =>
      unwrap<Project[]>(
        await supabase
          .from("projects")
          .select("*")
          .eq("workspace", ws)
          .order("position", { ascending: true })
          .order("deadline", { ascending: true, nullsFirst: false }),
      ),
  });

export const tasksQuery = (ws: Workspace) =>
  queryOptions({
    queryKey: ["tasks", ws],
    queryFn: async () =>
      unwrap<Task[]>(
        await supabase
          .from("tasks")
          .select("*")
          .eq("workspace", ws)
          .order("scheduled_date", { ascending: true, nullsFirst: false })
          .order("start_time", { ascending: true, nullsFirst: false }),
      ),
  });

export const notesQuery = () =>
  queryOptions({
    queryKey: ["notes_items"],
    queryFn: async () =>
      unwrap<NoteItem[]>(
        await supabase.from("notes_items").select("*").order("position", { ascending: true }),
      ),
  });

export const contactsQuery = (ws: Workspace) =>
  queryOptions({
    queryKey: ["contacts", ws],
    queryFn: async () =>
      unwrap<Contact[]>(
        await supabase
          .from("contacts")
          .select("*")
          .eq("workspace", ws)
          .order("full_name", { ascending: true }),
      ),
  });

export const interactionsQuery = (contactId: string | null) =>
  queryOptions({
    queryKey: ["contact_interactions", contactId],
    enabled: Boolean(contactId),
    queryFn: async () =>
      unwrap<Interaction[]>(
        await supabase
          .from("contact_interactions")
          .select("id, contact_id, kind, body, occurred_on")
          .eq("contact_id", contactId!)
          .order("occurred_on", { ascending: false }),
      ),
  });

export const transactionsQuery = (ws: Workspace) =>
  queryOptions({
    queryKey: ["transactions", ws],
    queryFn: async () =>
      unwrap<Transaction[]>(
        await supabase
          .from("transactions")
          .select("*")
          .eq("workspace", ws)
          .order("occurred_on", { ascending: false }),
      ),
  });

export const teamQuery = (ws: Workspace) =>
  queryOptions({
    queryKey: ["team_members", ws],
    queryFn: async () =>
      unwrap<TeamMember[]>(
        await supabase
          .from("team_members")
          .select("*")
          .eq("workspace", ws)
          .order("full_name", { ascending: true }),
      ),
  });

export const projectCommentsQuery = (projectId: string | null) =>
  queryOptions({
    queryKey: ["project_comments", projectId],
    enabled: Boolean(projectId),
    queryFn: async () =>
      unwrap<ProjectComment[]>(
        await supabase
          .from("project_comments")
          .select("id, project_id, body, created_at")
          .eq("project_id", projectId!)
          .order("created_at", { ascending: false }),
      ),
  });

export type Weather = {
  temperature: number;
  code: number;
  max: number;
  min: number;
};

export const weatherQuery = (lat: number, lon: number) =>
  queryOptions({
    queryKey: ["weather", lat, lon],
    staleTime: 15 * 60 * 1000,
    queryFn: async (): Promise<Weather> => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Météo indisponible");
      const json = (await res.json()) as {
        current: { temperature_2m: number; weather_code: number };
        daily: { temperature_2m_max: number[]; temperature_2m_min: number[] };
      };
      return {
        temperature: Math.round(json.current.temperature_2m),
        code: json.current.weather_code,
        max: Math.round(json.daily.temperature_2m_max[0] ?? 0),
        min: Math.round(json.daily.temperature_2m_min[0] ?? 0),
      };
    },
  });

export function fmtEUR(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}
