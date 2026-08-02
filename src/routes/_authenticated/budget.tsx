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

      <Panel eyebrow={`${list.length} écriture(s)`} title="Transactions" bodyClassName="p-3">
        {list.length === 0 ? (
          <EmptyState>Aucune transaction pour ce profil.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="px-2 py-2 font-normal">Date</th>
                  <th className="px-2 py-2 font-normal">Description</th>
                  <th className="px-2 py-2 font-normal">Projet</th>
                  <th className="px-2 py-2 font-normal">Facture</th>
                  <th className="px-2 py-2 font-normal">Statut</th>
                  <th className="px-2 py-2 text-right font-normal">Montant</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id} className="group border-b border-border/60 last:border-0">
                    <td className="px-2 py-2 tabular-nums text-muted-foreground">
                      {format(parseISO(t.occurred_on), "d MMM yyyy", { locale: fr })}
                    </td>
                    <td className="max-w-[16rem] truncate px-2 py-2">
                      {t.description}
                      <span className="ml-1.5 text-xs text-muted-foreground">{t.category}</span>
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">{projectName(t.project_id)}</td>
                    <td className="px-2 py-2 text-muted-foreground">{t.invoice_number ?? "—"}</td>
                    <td className="px-2 py-2">
                      <span
                        className={cn(
                          "pill",
                          t.status === "paye" ? "text-success" : "text-warning",
                        )}
                      >
                        {t.status === "paye"
                          ? "Payé"
                          : t.status === "en_attente"
                            ? "En attente"
                            : "Brouillon"}
                      </span>
                    </td>
                    <td
                      className={cn(
                        "px-2 py-2 text-right tabular-nums",
                        t.kind === "revenu" ? "text-success" : "text-foreground",
                      )}
                    >
                      {t.kind === "revenu" ? "+" : "−"}
                      {fmtEUR(Number(t.amount))}
                    </td>
                    <td className="px-1">
                      <button
                        onClick={() => remove.mutate(t.id)}
                        aria-label="Supprimer la transaction"
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
