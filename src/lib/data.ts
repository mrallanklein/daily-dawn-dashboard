import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
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
  color: string;
  cover_url: string | null;
  next_step: string | null;
  position: number;
};

export type Task = {
  id: string;
  project_id: string | null;
  title: string;
  notes: string | null;
  status: string;
  priority: string;
  scheduled_date: string | null;
  due_date: string | null;
  start_time: string | null;
  duration_minutes: number | null;
};

export type NoteItem = {
  id: string;
  content: string;
  checked: boolean;
  position: number;
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
        .select("id, display_name, avatar_url, weather_city, weather_lat, weather_lon")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (res.error) throw new Error(res.error.message);
      return (res.data as Profile | null) ?? null;
    },
  });

export const projectsQuery = () =>
  queryOptions({
    queryKey: ["projects"],
    queryFn: async () =>
      unwrap<Project[]>(
        await supabase
          .from("projects")
          .select("*")
          .order("deadline", { ascending: true, nullsFirst: false }),
      ),
  });

export const tasksQuery = () =>
  queryOptions({
    queryKey: ["tasks"],
    queryFn: async () =>
      unwrap<Task[]>(
        await supabase
          .from("tasks")
          .select("*")
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

export const contactsQuery = () =>
  queryOptions({
    queryKey: ["contacts"],
    queryFn: async () =>
      unwrap<Contact[]>(
        await supabase.from("contacts").select("*").order("full_name", { ascending: true }),
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