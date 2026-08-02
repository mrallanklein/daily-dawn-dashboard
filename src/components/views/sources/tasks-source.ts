import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Project, Task } from "@/lib/data";
import type { DataSource, PropertyDef, SelectOption } from "../types";

export const TASK_STATUSES: SelectOption[] = [
  { id: "a_faire", label: "À faire", color: "gray" },
  { id: "en_cours", label: "En cours", color: "blue" },
  { id: "termine", label: "Terminé", color: "green" },
];

const TASK_PRIORITIES: SelectOption[] = [
  { id: "basse", label: "Basse", color: "gray" },
  { id: "moyenne", label: "Moyenne", color: "blue" },
  { id: "haute", label: "Haute", color: "red" },
];

export function taskProperties(projects: Project[]): PropertyDef[] {
  return [
    { id: "title", name: "Tâche", type: "title" },
    { id: "status", name: "État", type: "status", options: TASK_STATUSES },
    { id: "priority", name: "Priorité", type: "select", options: TASK_PRIORITIES },
    {
      id: "project_id",
      name: "Projet",
      type: "select",
      options: projects.map((p, i) => ({
        id: p.id,
        label: p.name,
        color: (["blue", "green", "orange", "purple", "pink", "yellow", "brown"] as const)[i % 7],
      })),
    },
    { id: "scheduled_date", name: "Planifiée le", type: "date" },
    { id: "due_date", name: "Échéance", type: "date" },
    { id: "start_time", name: "Heure", type: "text" },
    { id: "duration_minutes", name: "Durée (min)", type: "number" },
    { id: "description", name: "Description", type: "text" },
    { id: "notes", name: "Notes", type: "text" },
  ];
}

/** Adapte la table `tasks` à l'interface du moteur de vues. */
export function useTasksSource(
  tasks: Task[],
  projects: Project[],
  options: { onOpen?: (id: string) => void; onCreate?: () => void; isLoading?: boolean } = {},
): DataSource {
  const queryClient = useQueryClient();

  const patch = useMutation({
    mutationFn: async (input: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("tasks")
        .update(input.values as never)
        .eq("id", input.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const { onOpen, onCreate, isLoading } = options;

  return useMemo<DataSource>(() => {
    const properties = taskProperties(projects);
    const statusLabel = (id: string) => TASK_STATUSES.find((s) => s.id === id)?.label ?? id;
    const statusId = (label: string) =>
      TASK_STATUSES.find((s) => s.label === label)?.id ?? label;
    const projectLabel = (id: string | null) =>
      id ? (projects.find((p) => p.id === id)?.name ?? null) : null;
    const projectId = (label: unknown) =>
      label ? (projects.find((p) => p.name === label)?.id ?? null) : null;

    return {
      module: "tasks",
      label: "Tâches",
      properties,
      titleProp: "title",
      statusProp: "status",
      dateProp: "scheduled_date",
      endDateProp: "due_date",
      isLoading: Boolean(isLoading),
      rows: tasks
        .filter((t) => !t.parent_task_id)
        .map((t) => ({
          id: t.id,
          values: {
            title: t.title,
            status: statusLabel(t.status),
            priority: t.priority,
            project_id: projectLabel(t.project_id),
            scheduled_date: t.scheduled_date,
            due_date: t.due_date,
            start_time: t.start_time,
            duration_minutes: t.duration_minutes,
            description: t.description,
            notes: t.notes,
          },
        })),
      ...(onOpen ? { onOpen } : {}),
      ...(onCreate ? { onCreate } : {}),
      onPatch: (rowId, values) => {
        const native: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(values)) {
          if (!properties.some((p) => p.id === key)) continue;
          if (key === "status") native[key] = statusId(String(value));
          else if (key === "project_id") native[key] = projectId(value);
          else native[key] = value;
        }
        if (Object.keys(native).length > 0) patch.mutate({ id: rowId, values: native });
      },
    };
  }, [tasks, projects, isLoading, onOpen, onCreate, patch]);
}
