import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Contact } from "@/lib/data";
import type { DataSource, PropertyDef, SelectOption } from "../types";

export const CONTACT_STATUSES: SelectOption[] = [
  { id: "prospect", label: "Prospect", color: "yellow" },
  { id: "en_discussion", label: "En discussion", color: "orange" },
  { id: "client", label: "Client", color: "green" },
  { id: "partenaire", label: "Partenaire", color: "blue" },
  { id: "inactif", label: "Inactif", color: "gray" },
];

export const CONTACT_PROPERTIES: PropertyDef[] = [
  { id: "full_name", name: "Nom", type: "title" },
  { id: "status", name: "Statut", type: "status", options: CONTACT_STATUSES },
  { id: "company", name: "Société", type: "text" },
  { id: "role", name: "Rôle", type: "text" },
  { id: "email", name: "Email", type: "email" },
  { id: "phone", name: "Téléphone", type: "phone" },
  { id: "tags", name: "Tags", type: "multi_select" },
  { id: "country", name: "Pays", type: "text" },
  { id: "source", name: "Source", type: "text" },
  { id: "last_contact_date", name: "Dernier échange", type: "date" },
  { id: "notes", name: "Notes", type: "text" },
];

const STATUS_BY_LABEL = new Map(CONTACT_STATUSES.map((s) => [s.label, s.id]));

/** Adapte la table `contacts` à l'interface du moteur de vues. */
export function useContactsSource(
  contacts: Contact[],
  options: { onOpen?: (id: string) => void; onCreate?: () => void; isLoading?: boolean } = {},
): DataSource {
  const queryClient = useQueryClient();

  const patch = useMutation({
    mutationFn: async (input: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("contacts")
        .update(input.values as never)
        .eq("id", input.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const { onOpen, onCreate, isLoading } = options;

  return useMemo<DataSource>(
    () => ({
      module: "contacts",
      label: "Contacts",
      properties: CONTACT_PROPERTIES,
      titleProp: "full_name",
      statusProp: "status",
      dateProp: "last_contact_date",
      isLoading: Boolean(isLoading),
      rows: contacts.map((c) => ({
        id: c.id,
        values: {
          full_name: c.full_name,
          status: CONTACT_STATUSES.find((s) => s.id === c.status)?.label ?? c.status,
          company: c.company,
          role: c.role,
          email: c.email,
          phone: c.phone,
          tags: c.tags ?? [],
          country: c.country,
          source: c.source,
          last_contact_date: c.last_contact_date,
          notes: c.notes,
        },
      })),
      ...(onOpen ? { onOpen } : {}),
      ...(onCreate ? { onCreate } : {}),
      onPatch: (rowId, values) => {
        const native: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(values)) {
          if (!CONTACT_PROPERTIES.some((p) => p.id === key)) continue;
          native[key] = key === "status" ? (STATUS_BY_LABEL.get(String(value)) ?? value) : value;
        }
        if (Object.keys(native).length > 0) patch.mutate({ id: rowId, values: native });
      },
    }),
    [contacts, isLoading, onOpen, onCreate, patch],
  );
}
