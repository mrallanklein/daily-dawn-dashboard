import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ModuleCard } from "@/components/module-card";
import { projectsQuery, tasksQuery } from "@/lib/data";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/strategie")({
  head: () => ({
    meta: [
      { title: "Stratégie — Atelier" },
      {
        name: "description",
        content: "Vue stratégique : répartition par catégorie, priorités et charge de travail.",
      },
      { property: "og:title", content: "Stratégie — Atelier" },
      { property: "og:description", content: "Piliers, priorités et avancement global." },
    ],
  }),
  component: StrategyPage,
});

function StrategyPage() {
  const { data: projects } = useQuery(projectsQuery());
  const { data: tasks } = useQuery(tasksQuery());

  const list = projects ?? [];
  const pillars = new Map<string, typeof list>();
  list.forEach((p) => {
    const key = p.category ?? "Sans pilier";
    pillars.set(key, [...(pillars.get(key) ?? []), p]);
  });

  const done = (tasks ?? []).filter((t) => t.status === "termine").length;
  const total = (tasks ?? []).length;
  const avg = list.length
    ? Math.round(list.reduce((sum, p) => sum + p.progress, 0) / list.length)
    : 0;

  return (
    <AppShell>
      <h1 className="mb-6 text-3xl font-medium">Stratégie</h1>

      <div className="mb-6 grid gap-6 md:grid-cols-3">
        {[
          { label: "Projets actifs", value: list.filter((p) => p.status === "en_cours").length },
          { label: "Avancement moyen", value: `${avg}%` },
          { label: "Tâches terminées", value: `${done}/${total}` },
        ].map((stat) => (
          <div key={stat.label} className="panel p-5">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-gold/80">{stat.label}</p>
            <p className="mt-2 text-3xl font-display">{stat.value}</p>
          </div>
        ))}
      </div>

      <ModuleCard eyebrow="Répartition" title="Piliers stratégiques">
        {pillars.size === 0 ? (
          <EmptyState>Renseignez une catégorie sur vos projets pour构 structurer vos piliers.</EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {[...pillars.entries()].map(([pillar, items]) => {
              const progress = Math.round(
                items.reduce((sum, p) => sum + p.progress, 0) / items.length,
              );
              return (
                <div key={pillar} className="rounded-lg border border-border/60 bg-secondary/30 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{pillar}</p>
                    <span className="text-xs text-gold">{items.length} projet(s)</span>
                  </div>
                  <Progress value={progress} className="mt-3 h-1.5" />
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {items.map((p) => (
                      <li key={p.id}>
                        {p.name} · {p.progress}%
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </ModuleCard>
    </AppShell>
  );
}