import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ModuleCard } from "@/components/module-card";
import { projectsQuery } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/budget")({
  head: () => ({
    meta: [
      { title: "Budget — Atelier" },
      {
        name: "description",
        content: "Plan budgétaire par projet : budget alloué, dépenses engagées et reste à engager.",
      },
      { property: "og:title", content: "Budget — Atelier" },
      { property: "og:description", content: "Budgets, dépenses et reste à engager par projet." },
    ],
  }),
  component: BudgetPage,
});

const euro = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
    .format(value);

function BudgetPage() {
  const queryClient = useQueryClient();
  const { data: projects } = useQuery(projectsQuery());

  const patch = useMutation({
    mutationFn: async (input: { id: string; budget?: number; budget_spent?: number }) => {
      const { id, ...rest } = input;
      const { error } = await supabase.from("projects").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const list = projects ?? [];
  const budget = list.reduce((sum, p) => sum + (p.budget ?? 0), 0);
  const spent = list.reduce((sum, p) => sum + p.budget_spent, 0);

  return (
    <AppShell>
      <h1 className="mb-6 text-3xl font-medium">Budget</h1>

      <div className="mb-6 grid gap-6 md:grid-cols-3">
        {[
          { label: "Budget total", value: euro(budget) },
          { label: "Engagé", value: euro(spent) },
          { label: "Reste", value: euro(budget - spent) },
        ].map((stat) => (
          <div key={stat.label} className="panel p-5">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-gold/80">{stat.label}</p>
            <p className="mt-2 text-3xl font-display">{stat.value}</p>
          </div>
        ))}
      </div>

      <ModuleCard eyebrow="Par projet" title="Plan budgétaire">
        {list.length === 0 ? (
          <EmptyState>Créez un projet pour lui affecter un budget.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  <th className="pb-3">Projet</th>
                  <th className="pb-3">Budget (€)</th>
                  <th className="pb-3">Engagé (€)</th>
                  <th className="pb-3">Consommation</th>
                </tr>
              </thead>
              <tbody>
                {list.map((project) => {
                  const ratio = project.budget
                    ? Math.round((project.budget_spent / project.budget) * 100)
                    : 0;
                  return (
                    <tr key={project.id} className="border-t border-border/50">
                      <td className="py-3 pr-4">{project.name}</td>
                      <td className="py-3 pr-4">
                        <input
                          type="number"
                          defaultValue={project.budget ?? 0}
                          onBlur={(e) =>
                            patch.mutate({ id: project.id, budget: Number(e.target.value) })
                          }
                          className="w-28 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          type="number"
                          defaultValue={project.budget_spent}
                          onBlur={(e) =>
                            patch.mutate({ id: project.id, budget_spent: Number(e.target.value) })
                          }
                          className="w-28 rounded-md border border-input bg-transparent px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="w-52 py-3">
                        <Progress value={Math.min(ratio, 100)} className="h-1.5" />
                        <span className={ratio > 100 ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                          {ratio}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ModuleCard>
    </AppShell>
  );
}