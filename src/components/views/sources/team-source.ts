import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TeamMember } from "@/lib/data";
import type { DataSource, PropertyDef, SelectOption } from "../types";

export const PERMISSIONS: SelectOption[] = [
  { id: "admin", label: "Administrateur", color: "purple" },
  { id: "membre", label: "Membre", color: "blue" },
  { id: "viewer", label: "Lecteur", color: "gray" },
];

const MEMBER_STATUSES: SelectOption[] = [
  { id: "actif", label: "Actif", color: "green" },
  { id: "invite", label: "Invité", color: "yellow" },
  { id: "inactif", label: "Inactif", color: "gray" },
];

export const TEAM_PROPERTIES: PropertyDef[] = [
  { id: "full_name", name: "Membre", type: "title" },
  { id: "status", name: "Statut", type: "status", options: MEMBER_STATUSES },
  { id: "permission", name: "Permission", type: "select", options: PERMISSIONS },
  { id: "role", name: "Rôle", type: "text" },
  { id: "email", name: "Email", type: "email" },
  { id: "avatar_url", name: "Photo", type: "files" },
];

const STATUS_BY_LABEL = new Map(MEMBER_STATUSES.map((s) => [s.label, s.id]));
const PERMISSION_BY_LABEL = new Map(PERMISSIONS.map((s) => [s.label, s.id]));

/** Adapte la table `team_members` à l'interface du moteur de vues. */
export function useTeamSource(
  members: TeamMember[],
  options: { onOpen?: (id: string) => void; onCreate?: () => void; isLoading?: boolean } = {},
): DataSource {
  const queryClient = useQueryClient();

  const patch = useMutation({
    mutationFn: async (input: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("team_members")
        .update(input.values as never)
        .eq("id", input.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team_members"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const { onOpen, onCreate, isLoading } = options;

  return useMemo<DataSource>(
    () => ({
      module: "team",
      label: "Équipe",
      properties: TEAM_PROPERTIES,
      titleProp: "full_name",
      statusProp: "permission",
      coverProp: "avatar_url",
      isLoading: Boolean(isLoading),
      rows: members.map((m) => ({
        id: m.id,
        values: {
          full_name: m.full_name,
          status: MEMBER_STATUSES.find((s) => s.id === m.status)?.label ?? m.status,
          permission: PERMISSIONS.find((p) => p.id === m.permission)?.label ?? m.permission,
          role: m.role,
          email: m.email,
          avatar_url: m.avatar_url,
        },
      })),
      ...(onOpen ? { onOpen } : {}),
      ...(onCreate ? { onCreate } : {}),
      onPatch: (rowId, values) => {
        const native: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(values)) {
          if (!TEAM_PROPERTIES.some((p) => p.id === key)) continue;
          if (key === "status") native[key] = STATUS_BY_LABEL.get(String(value)) ?? value;
          else if (key === "permission")
            native[key] = PERMISSION_BY_LABEL.get(String(value)) ?? value;
          else native[key] = value;
        }
        if (Object.keys(native).length > 0) patch.mutate({ id: rowId, values: native });
      },
    }),
    [members, isLoading, onOpen, onCreate, patch],
  );
}
