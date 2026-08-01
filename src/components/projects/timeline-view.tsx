import type { Project } from "@/lib/data";
import { EmptyState } from "@/components/module-card";
import { statusLabel } from "@/lib/project-status";
import { daysUntil, fmtShortDate } from "@/lib/dates";

export function TimelineView({ projects }: { projects: Project[] }) {
  const dated = projects
    .filter((p) => p.deadline)
    .sort((a, b) => a.deadline!.localeCompare(b.deadline!));

  if (dated.length === 0) return <EmptyState>Aucun projet daté à placer sur la chronologie.</EmptyState>;

  const groups = new Map<string, Project[]>();
  dated.forEach((p) => {
    const key = p.deadline!.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), p]);
  });

  return (
    <div className="space-y-6 border-l border-border/70 pl-6">
      {[...groups.entries()].map(([month, items]) => (
        <div key={month} className="relative">
          <span className="absolute -left-[1.85rem] top-2 size-2.5 rounded-full bg-gold" />
          <p className="text-xs font-medium text-muted-foreground">
            {new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
              new Date(`${month}-01T00:00:00`),
            )}
          </p>
          <ul className="mt-3 space-y-2">
            {items.map((project) => {
              const remaining = daysUntil(project.deadline!);
              return (
                <li
                  key={project.id}
                  className="flex flex-wrap items-center gap-3 soft-row px-2 py-1.5"
                >
                  <span className="min-w-24 text-xs text-muted-foreground">
                    {fmtShortDate(project.deadline!)}
                  </span>
                  <span className="flex-1 text-sm">{project.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {statusLabel(project.status)} · {project.progress}%
                  </span>
                  <span className={remaining < 0 ? "text-xs text-destructive" : "text-xs text-gold"}>
                    {remaining < 0 ? `${Math.abs(remaining)} j de retard` : `J-${remaining}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}