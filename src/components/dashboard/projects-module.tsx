import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { projectsQuery } from "@/lib/data";
import { EmptyState, ModuleCard } from "@/components/module-card";
import { RangeToggle } from "@/components/range-toggle";
import { daysUntil, fmtShortDate, inRange, type RangeDays } from "@/lib/dates";
import { statusLabel } from "@/lib/project-status";
import { Progress } from "@/components/ui/progress";

export function ProjectsModule() {
  const [range, setRange] = useState<RangeDays>(1);
  const { data: projects } = useQuery(projectsQuery());

  const visible = (projects ?? []).filter(
    (p) => inRange(p.deadline, range) || (p.deadline && daysUntil(p.deadline) < 0),
  );

  return (
    <ModuleCard
      eyebrow="En cours"
      title="Mes projets"
      action={<RangeToggle value={range} onChange={setRange} />}
    >
      {visible.length === 0 ? (
        <EmptyState>
          Aucun projet avec une échéance sur cette période.{" "}
          <Link to="/projets" className="text-gold underline-offset-4 hover:underline">
            Gérer les projets
          </Link>
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {visible.map((project) => {
            const remaining = project.deadline ? daysUntil(project.deadline) : null;
            return (
              <li
                key={project.id}
                className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm">{project.name}</p>
                  <span
                    className={
                      remaining !== null && remaining < 0
                        ? "text-xs text-destructive"
                        : "text-xs text-gold"
                    }
                  >
                    {project.deadline ? fmtShortDate(project.deadline) : "—"}
                    {remaining !== null
                      ? remaining < 0
                        ? ` · ${Math.abs(remaining)} j de retard`
                        : ` · J-${remaining}`
                      : ""}
                  </span>
                </div>
                <Progress value={project.progress} className="mt-2 h-1.5" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {statusLabel(project.status)} · {project.progress}%
                  {project.client ? ` · ${project.client}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </ModuleCard>
  );
}