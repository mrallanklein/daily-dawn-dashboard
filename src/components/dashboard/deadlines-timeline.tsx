import { useQuery } from "@tanstack/react-query";
import { projectsQuery, tasksQuery } from "@/lib/data";
import { EmptyState, ModuleCard } from "@/components/module-card";
import { daysUntil, fmtShortDate } from "@/lib/dates";

type Item = { id: string; label: string; date: string; kind: "Projet" | "Tâche" };

export function DeadlinesTimeline() {
  const { data: projects } = useQuery(projectsQuery());
  const { data: tasks } = useQuery(tasksQuery());

  const items: Item[] = [
    ...(projects ?? [])
      .filter((p) => p.deadline)
      .map((p) => ({ id: `p-${p.id}`, label: p.name, date: p.deadline!, kind: "Projet" as const })),
    ...(tasks ?? [])
      .filter((t) => t.due_date && t.status !== "termine")
      .map((t) => ({ id: `t-${t.id}`, label: t.title, date: t.due_date!, kind: "Tâche" as const })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 12);

  return (
    <ModuleCard eyebrow="Chronologie" title="Prochaines deadlines">
      {items.length === 0 ? (
        <EmptyState>Aucune échéance enregistrée.</EmptyState>
      ) : (
        <ol className="relative space-y-4 border-l border-border/70 pl-5">
          {items.map((item) => {
            const remaining = daysUntil(item.date);
            return (
              <li key={item.id} className="relative">
                <span className="absolute -left-[1.6rem] top-2 size-1.5 rounded-full bg-foreground/60" />
                <p className="text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {item.kind} · {fmtShortDate(item.date)} ·{" "}
                  <span className={remaining < 0 ? "text-destructive" : "text-foreground"}>
                    {remaining < 0 ? `${Math.abs(remaining)} j de retard` : `J-${remaining}`}
                  </span>
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </ModuleCard>
  );
}