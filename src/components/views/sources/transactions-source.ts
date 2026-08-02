import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Project, Transaction } from "@/lib/data";
import type { DataSource, PropertyDef, SelectOption } from "../types";

export const TRANSACTION_STATUSES: SelectOption[] = [
  { id: "paye", label: "Payé", color: "green" },
  { id: "en_attente", label: "En attente", color: "orange" },
  { id: "brouillon", label: "Brouillon", color: "gray" },
];

const KINDS: SelectOption[] = [
  { id: "revenu", label: "Revenu", color: "green" },
  { id: "depense", label: "Dépense", color: "red" },
];

export function transactionProperties(projects: Project[]): PropertyDef[] {
  return [
    { id: "description", name: "Écriture", type: "title" },
    { id: "status", name: "Statut", type: "status", options: TRANSACTION_STATUSES },
    { id: "kind", name: "Type", type: "select", options: KINDS },
    { id: "amount", name: "Montant", type: "number", format: "eur" },
    { id: "category", name: "Catégorie", type: "text" },
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
    { id: "invoice_number", name: "N° facture", type: "text" },
    { id: "invoice_url", name: "Facture", type: "url" },
    { id: "occurred_on", name: "Date", type: "date" },
  ];
}

/** Adapte la table `transactions` à l'interface du moteur de vues. */
export function useTransactionsSource(
  transactions: Transaction[],
  projects: Project[],
  options: { onOpen?: (id: string) => void; onCreate?: () => void; isLoading?: boolean } = {},
): DataSource {
  const queryClient = useQueryClient();

  const patch = useMutation({
    mutationFn: async (input: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("transactions")
        .update(input.values as never)
        .eq("id", input.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const { onOpen, onCreate, isLoading } = options;

  return useMemo<DataSource>(() => {
    const properties = transactionProperties(projects);
    const label = (list: SelectOption[], id: string) =>
      list.find((s) => s.id === id)?.label ?? id;
    const idOf = (list: SelectOption[], value: unknown) =>
      list.find((s) => s.label === value)?.id ?? value;

    return {
      module: "transactions",
      label: "Budget",
      properties,
      titleProp: "description",
      statusProp: "status",
      dateProp: "occurred_on",
      isLoading: Boolean(isLoading),
      rows: transactions.map((t) => ({
        id: t.id,
        values: {
          description: t.description,
          status: label(TRANSACTION_STATUSES, t.status),
          kind: label(KINDS, t.kind),
          amount: Number(t.amount),
          category: t.category,
          project_id: t.project_id
            ? (projects.find((p) => p.id === t.project_id)?.name ?? null)
            : null,
          invoice_number: t.invoice_number,
          invoice_url: t.invoice_url,
          occurred_on: t.occurred_on,
        },
      })),
      ...(onOpen ? { onOpen } : {}),
      ...(onCreate ? { onCreate } : {}),
      onPatch: (rowId, values) => {
        const native: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(values)) {
          if (!properties.some((p) => p.id === key)) continue;
          if (key === "status") native[key] = idOf(TRANSACTION_STATUSES, value);
          else if (key === "kind") native[key] = idOf(KINDS, value);
          else if (key === "project_id")
            native[key] = value ? (projects.find((p) => p.name === value)?.id ?? null) : null;
          else native[key] = value;
        }
        if (Object.keys(native).length > 0) patch.mutate({ id: rowId, values: native });
      },
    };
  }, [transactions, projects, isLoading, onOpen, onCreate, patch]);
}
