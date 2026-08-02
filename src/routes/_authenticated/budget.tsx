import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Download,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Panel, EmptyState } from "@/components/app/panel";
import { KpiCard } from "@/components/app/kpi-card";
import { fmtEUR, projectsQuery, transactionsQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { todayISO } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { BudgetIcon } from "@/components/icons/notion-icons";
import { DatabaseView } from "@/components/views/database-view";
import { useTransactionsSource } from "@/components/views/sources/transactions-source";

export const Route = createFileRoute("/_authenticated/budget")({
  head: () => ({
    meta: [
      { title: "Budget — Revenus, dépenses & factures" },
      {
        name: "description",
        content:
          "Suivi budgétaire : revenus, dépenses, marge, numéros de facture par projet et export CSV.",
      },
      { property: "og:title", content: "Budget — Revenus, dépenses & factures" },
      { property: "og:description", content: "Revenus, dépenses, factures et export CSV." },
    ],
  }),
  component: BudgetPage,
});

function BudgetPage() {
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const { data: transactions } = useQuery(transactionsQuery(workspace));
  const { data: projects } = useQuery(projectsQuery(workspace));
  const [form, setForm] = useState({
    kind: "revenu",
    description: "",
    amount: "",
    category: "general",
    project_id: "none",
    invoice_number: "",
    occurred_on: todayISO(),
    status: "paye",
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["transactions"] });
  const onError = (e: Error) => toast.error(e.message);

  const create = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const { error } = await supabase.from("transactions").insert({
        user_id: auth.user.id,
        workspace,
        kind: form.kind,
        description: form.description,
        amount: Number(form.amount || 0),
        category: form.category || "general",
        project_id: form.project_id === "none" ? null : form.project_id,
        invoice_number: form.invoice_number || null,
        occurred_on: form.occurred_on,
        status: form.status,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setForm((f) => ({ ...f, description: "", amount: "", invoice_number: "" }));
      invalidate();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError,
  });

  const list = transactions ?? [];
  const revenue = list.filter((t) => t.kind === "revenu").reduce((s, t) => s + Number(t.amount), 0);
  const expense = list
    .filter((t) => t.kind === "depense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const pending = list.filter((t) => t.status !== "paye").reduce((s, t) => s + Number(t.amount), 0);

  const projectName = (id: string | null) =>
    id ? ((projects ?? []).find((p) => p.id === id)?.name ?? "—") : "—";

  const source = useTransactionsSource(list, projects ?? []);

  const exportCsv = () => {
    const rows = [
      ["Date", "Type", "Description", "Catégorie", "Projet", "Facture", "Statut", "Montant"],
      ...list.map((t) => [
        t.occurred_on,
        t.kind,
        t.description,
        t.category,
        projectName(t.project_id),
        t.invoice_number ?? "",
        t.status,
        String(t.amount),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-${workspace}-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell>
      <PageHeader
        title="Budget & Finances"
        icon={BudgetIcon}
        subtitle="Revenus, dépenses et factures par projet"
        actions={
          <Button variant="secondary" size="sm" onClick={exportCsv} className="gap-1.5">
            <Download className="size-4" /> Export CSV
          </Button>
        }
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenus" value={fmtEUR(revenue)} icon={ArrowUpRight} tone="brand" />
        <KpiCard label="Dépenses" value={fmtEUR(expense)} icon={ArrowDownRight} />
        <KpiCard
          label="Résultat"
          value={fmtEUR(revenue - expense)}
          icon={Wallet}
          tone={revenue - expense < 0 ? "danger" : "brand"}
        />
        <KpiCard
          label="En attente"
          value={fmtEUR(pending)}
          hint="factures non réglées"
          icon={ArrowUpRight}
          tone={pending > 0 ? "warning" : "default"}
        />
      </section>

      <Panel eyebrow="Nouvelle écriture" title="Ajouter une transaction" className="mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.description.trim() || !form.amount) return;
            create.mutate();
          }}
          className="grid gap-2 md:grid-cols-4"
        >
          <Select value={form.kind} onValueChange={(v) => setForm((f) => ({ ...f, kind: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenu">Revenu</SelectItem>
              <SelectItem value="depense">Dépense</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description"
            className="md:col-span-2"
          />
          <Input
            type="number"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="Montant €"
          />
          <Input
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="Catégorie"
          />
          <Select
            value={form.project_id}
            onValueChange={(v) => setForm((f) => ({ ...f, project_id: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sans projet</SelectItem>
              {(projects ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={form.invoice_number}
            onChange={(e) => setForm((f) => ({ ...f, invoice_number: e.target.value }))}
            placeholder="N° facture"
          />
          <Input
            type="date"
            value={form.occurred_on}
            onChange={(e) => setForm((f) => ({ ...f, occurred_on: e.target.value }))}
          />
          <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paye">Payé</SelectItem>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="brouillon">Brouillon</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" className="gap-1.5 md:col-start-4">
            <Plus className="size-4" /> Enregistrer
          </Button>
        </form>
      </Panel>

      <DatabaseView source={source} />
    </AppShell>
  );
}
