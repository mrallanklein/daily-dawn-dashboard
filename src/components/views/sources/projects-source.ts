import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PROJECT_STATUSES } from "@/lib/project-status";
import type { Project } from "@/lib/data";
import type { DataSource, OptionColor, PropertyDef, SelectOption } from "../types";

const STATUS_COLOR: Record<string, OptionColor> = {
  pas_commence: "gray",
  ecriture: "yellow",
  en_cours: "orange",
  tournage: "red",
  montage: "purple",
  validation: "blue",
  publier: "green",
  termine: "green",
  archiver: "brown",
};

const PRIORITY_OPTIONS: SelectOption[] = [
  { id: "basse", label: "basse", color: "gray" },
  { id: "moyenne", label: "moyenne", color: "blue" },
  { id: "haute", label: "haute", color: "orange" },
  { id: "urgente", label: "urgente", color: "red" },
];

export const PROJECT_PROPERTIES: PropertyDef[] = [
  { id: "name", name: "Projet", type: "title" },
  {
    id: "status",
    name: "État",
    type: "status",
    options: PROJECT_STATUSES.map((s) => ({
      id: s.id,
      label: s.label,
      color: STATUS_COLOR[s.id] ?? "gray",
    })),
  },
  { id: "priority", name: "Priorité", type: "select", options: PRIORITY_OPTIONS },
  { id: "client", name: "Client", type: "text" },
  { id: "category", name: "Catégorie", type: "text" },
  { id: "tags", name: "Tags", type: "multi_select" },
  { id: "progress", name: "Avancement", type: "number", format: "percent" },
  { id: "budget", name: "Budget", type: "number", format: "eur" },
  { id: "budget_spent", name: "Dépensé", type: "number", format: "eur" },
  { id: "start_date", name: "Début", type: "date" },
  { id: "deadline", name: "Échéance", type: "date" },
  { id: "work_date", name: "Date de travail", type: "date" },
  { id: "next_step", name: "Prochaine étape", type: "text" },
  { id: "description", name: "Description", type: "text" },
  { id: "onedrive_url", name: "OneDrive", type: "url" },
  { id: "local_folder", name: "Dossier local", type: "text" },
  { id: "cover_url", name: "Couverture", type: "files" },
];

const STATUS_BY_LABEL = new Map<string, string>(
  PROJECT_STATUSES.map((s) => [s.label, s.id as string]),
);

/** Adapte la table `projects` à l'interface du moteur de vues. */
export function useProjectsSource(
  projects: Project[],
  options: { onOpen?: (id: string) => void; onCreate?: () => void; isLoading?: boolean } = {},
): DataSource {
  const queryClient = useQueryClient();

  const patch = useMutation({
    mutationFn: async (input: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("projects")
        .update(input.values as never)
        .eq("id", input.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const { onOpen, onCreate, isLoading } = options;

  return useMemo<DataSource>(
    () => ({
      module: "projects",
      label: "Projets",
      properties: PROJECT_PROPERTIES,
      titleProp: "name",
      statusProp: "status",
      dateProp: "start_date",
      endDateProp: "deadline",
      coverProp: "cover_url",
      isLoading: Boolean(isLoading),
      rows: projects.map((p) => ({
        id: p.id,
        values: {
          name: p.name,
          status: PROJECT_STATUSES.find((s) => s.id === p.status)?.label ?? p.status,
          priority: p.priority,
          client: p.client,
          category: p.category,
          tags: p.tags,
          progress: p.progress,
          budget: p.budget,
          budget_spent: p.budget_spent,
          start_date: p.start_date,
          deadline: p.deadline,
          work_date: p.work_date,
          next_step: p.next_step,
          description: p.description,
          onedrive_url: p.onedrive_url,
          local_folder: p.local_folder,
          cover_url: p.cover_url,
        },
      })),
      ...(onOpen ? { onOpen } : {}),
      ...(onCreate ? { onCreate } : {}),
      onPatch: (rowId, values) => {
        const native: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(values)) {
          if (!PROJECT_PROPERTIES.some((p) => p.id === key)) continue;
          native[key] = key === "status" ? (STATUS_BY_LABEL.get(String(value)) ?? value) : value;
        }
        if (Object.keys(native).length > 0) patch.mutate({ id: rowId, values: native });
      },
    }),
    [projects, isLoading, onOpen, onCreate, patch],
  );
}
