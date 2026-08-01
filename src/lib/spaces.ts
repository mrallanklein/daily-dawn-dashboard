import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Space = {
  id: string;
  slug: string;
  name: string;
  tag: string;
  avatar_url: string | null;
  banner_url: string | null;
  weather_city: string;
  /** Identifiants de boîtes mail Google activées : "primary" | "secondary" */
  mail_accounts: string[];
  /** Agendas affichés, au format "accountKey::calendarId" */
  calendar_ids: string[];
  position: number;
};

const COLUMNS =
  "id, slug, name, tag, avatar_url, banner_url, weather_city, mail_accounts, calendar_ids, position";

export const spacesQuery = () =>
  queryOptions({
    queryKey: ["spaces"],
    queryFn: async (): Promise<Space[]> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return [];
      const res = await supabase
        .from("spaces")
        .select(COLUMNS)
        .order("position", { ascending: true });
      if (res.error) throw new Error(res.error.message);
      return (res.data ?? []) as Space[];
    },
  });

export function spaceInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 28) || `espace-${Date.now().toString(36)}`
  );
}

export async function createSpace(name: string, tag: string, position: number) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Session expirée");
  const res = await supabase
    .from("spaces")
    .insert({
      user_id: auth.user.id,
      slug: `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      tag,
      position,
    })
    .select("slug")
    .single();
  if (res.error) throw new Error(res.error.message);
  return res.data.slug as string;
}

export async function updateSpace(id: string, patch: Partial<Space>) {
  const { error } = await supabase.from("spaces").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSpace(id: string) {
  const { error } = await supabase.from("spaces").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
