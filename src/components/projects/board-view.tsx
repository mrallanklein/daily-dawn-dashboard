import { ArrowRight, Trash2 } from "lucide-react";
import type { Project } from "@/lib/data";
import { PROJECT_STATUSES } from "@/lib/project-status";
import { daysUntil, fmtShortDate } from "@/lib/dates";
import { useProjectMutations } from "./use-project-mutations";
import { Progress } from "@/components/ui/progress";

export function BoardView({ projects }: { projects: Project[] }) {
  const { patch, remove } = useProjectMutations();

  const nextStatus = (current: string) => {
    const index = PROJECT_STATUSES.findIndex((s) => s.id === current);
    return PROJECT_STATUSES[Math.min(index + 1, PROJECT_STATUSES.length - 1)]!.id;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PROJECT_STATUSES.map((status) => {
        const list = projects.filter((p) => p.status === status.id);
        return (
          <section
            key={status.id}
            className="w-72 shrink-0 rounded-xl border border-border/60 bg-secondary/20 p-3"
          >
            <header className="mb-3 flex items-center justify-between">
              <span className={`text-sm ${status.tone}`}>{status.label}</span>
              <span className="text-xs text-muted-foreground">{list.length}</span>
            </header>
            <ul className="space-y-3">
              {list.map((project) => {
                const remaining = project.deadline ? daysUntil(project.deadline) : null;
                return (
                  <li
                    key={project.id}
                    className="group overflow-hidden rounded-lg border border-border/60 bg-card"
                  >
                    {project.cover_url ? (
                      <img
                        src={project.cover_url}
                        alt={`Couverture du projet ${project.name}`}
                        loading="lazy"
                        className="h-28 w-full object-cover"
                      />
                    ) : (
                      <div className="h-1.5 w-full bg-gold/40" />
                    )}
                    <div className="p-3">
                      <p className="text-sm leading-snug">{project.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {project.deadline ? fmtShortDate(project.deadline) : "Sans échéance"}
                        {remaining !== null
                          ? remaining < 0
                            ? ` · ${Math.abs(remaining)} j de retard`
                            : ` · J-${remaining}`
                          : ""}
                      </p>
                      <Progress value={project.progress} className="mt-2 h-1" />
                      <div className="mt-2 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() =>
                            patch.mutate({ id: project.id, status: nextStatus(project.status) })
                          }
                          className="inline-flex items-center gap-1 text-xs text-gold hover:underline"
                        >
                          Étape suivante <ArrowRight className="size-3" />
                        </button>
                        <button
                          onClick={() => remove.mutate(project.id)}
                          aria-label="Supprimer le projet"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
              {list.length === 0 ? (
                <li className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
                  Vide
                </li>
              ) : null}
            </ul>
          </section>
        );
      })}
    </div>
  );
}