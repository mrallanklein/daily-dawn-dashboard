import { Trash2 } from "lucide-react";
import type { Project } from "@/lib/data";
import { EmptyState } from "@/components/module-card";
import { PROJECT_STATUSES, projectFamily } from "@/lib/project-status";
import { daysUntil, fmtShortDate } from "@/lib/dates";
import { useProjectMutations } from "./use-project-mutations";
import { Progress } from "@/components/ui/progress";

export function TableView({ projects }: { projects: Project[] }) {
  const { patch, remove } = useProjectMutations();

  if (projects.length === 0) return <EmptyState>Aucun projet enregistré.</EmptyState>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[56rem] text-sm">
        <thead>
          <tr className="text-left text-xs font-medium text-muted-foreground">
            <th className="pb-3">Projet</th>
            <th className="pb-3">Famille</th>
            <th className="pb-3">État</th>
            <th className="pb-3">Avancement</th>
            <th className="pb-3">Prochaine étape</th>
            <th className="pb-3">Échéance</th>
            <th className="pb-3" />
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const remaining = project.deadline ? daysUntil(project.deadline) : null;
            return (
              <tr key={project.id} className="border-t border-border/50 align-top">
                <td className="py-3 pr-4">
                  <p>{project.name}</p>
                  <p className="text-xs text-muted-foreground">{project.client ?? "—"}</p>
                </td>
                <td className="py-3 pr-4 text-xs text-muted-foreground">
                  {projectFamily(project.name, project.category)}
                </td>
                <td className="py-3 pr-4">
                  <select
                    value={project.status}
                    onChange={(e) => patch.mutate({ id: project.id, status: e.target.value })}
                    className="rounded-md border border-input bg-transparent px-2 py-1 text-xs"
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="w-40 py-3 pr-4">
                  <Progress value={project.progress} className="h-1.5" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    defaultValue={project.progress}
                    onMouseUp={(e) =>
                      patch.mutate({
                        id: project.id,
                        progress: Number((e.target as HTMLInputElement).value),
                      })
                    }
                    className="mt-2 w-full accent-[var(--gold)]"
                  />
                </td>
                <td className="py-3 pr-4">
                  <input
                    defaultValue={project.next_step ?? ""}
                    placeholder="À définir…"
                    onBlur={(e) =>
                      e.target.value !== (project.next_step ?? "")
                        ? patch.mutate({ id: project.id, next_step: e.target.value || null })
                        : null
                    }
                    className="w-44 border-0 border-b border-transparent bg-transparent py-1 text-xs outline-none focus:border-gold/60"
                  />
                </td>
                <td className="py-3 pr-4">
                  <input
                    type="date"
                    defaultValue={project.deadline ?? ""}
                    onChange={(e) =>
                      patch.mutate({ id: project.id, deadline: e.target.value || null })
                    }
                    className="rounded-md border border-input bg-transparent px-2 py-1 text-xs"
                  />
                  {remaining !== null ? (
                    <span
                      className={
                        remaining < 0
                          ? "mt-1 block text-xs text-destructive"
                          : "mt-1 block text-xs text-gold"
                      }
                    >
                      {fmtShortDate(project.deadline!)} ·{" "}
                      {remaining < 0 ? `${Math.abs(remaining)} j de retard` : `J-${remaining}`}
                    </span>
                  ) : null}
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => remove.mutate(project.id)}
                    aria-label="Supprimer le projet"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}