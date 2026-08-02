import { fmtEUR, type Project, type Transaction } from "@/lib/data";
import { projectSpent } from "@/lib/project-risk";
import { statusLabel } from "@/lib/project-status";
import { Panel, EmptyState } from "@/components/app/panel";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/** Budget prévu vs dépenses réellement enregistrées, projet par projet. */
export function ProjectBudgets({
  projects,
  transactions,
  onSelect,
}: {
  projects: Project[];
  transactions: Transaction[];
  onSelect?: (p: Project) => void;
}) {
  const rows = projects
    .map((p) => {
      const spent = projectSpent(p.id, transactions);
      const revenue = transactions
        .filter((t) => t.project_id === p.id && t.kind === "revenu")
        .reduce((s, t) => s + Number(t.amount), 0);
      const budget = Number(p.budget ?? 0);
      return { project: p, spent, revenue, budget, ratio: budget ? (spent / budget) * 100 : 0 };
    })
    .filter((r) => r.budget > 0 || r.spent > 0 || r.revenue > 0)
    .sort((a, b) => b.ratio - a.ratio);

  return (
    <Panel eyebrow="Suivi" title="Budget par projet" className="mb-4">
      {rows.length === 0 ? (
        <EmptyState hint="Renseignez un budget dans la fiche d'un projet, puis rattachez vos transactions à ce projet.">
          Aucun budget suivi
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border/60">
          {rows.map(({ project, spent, revenue, budget, ratio }) => {
            const over = budget > 0 && spent > budget;
            return (
              <li key={project.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3">
                  <button
                    onClick={() => onSelect?.(project)}
                    className="min-w-0 truncate text-left text-sm font-medium hover:underline"
                  >
                    {project.name}
                  </button>
                  <span className={cn("shrink-0 text-sm tabular-nums", over && "text-destructive")}>
                    {fmtEUR(spent)}
                    {budget > 0 ? ` / ${fmtEUR(budget)}` : ""}
                  </span>
                </div>
                <Progress value={Math.min(ratio, 100)} className="mt-1.5 h-1.5" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {statusLabel(project.status)}
                  {revenue > 0 ? ` · ${fmtEUR(revenue)} facturés` : ""}
                  {over ? ` · dépassement de ${fmtEUR(spent - budget)}` : ""}
                  {!over && budget > 0 ? ` · reste ${fmtEUR(budget - spent)}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
