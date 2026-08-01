import type { Project } from "@/lib/data";
import { EmptyState } from "@/components/module-card";
import { statusLabel } from "@/lib/project-status";
import { useProjectMutations } from "./use-project-mutations";
import { Input } from "@/components/ui/input";

export function ToPlanView({ projects }: { projects: Project[] }) {
  const { patch } = useProjectMutations();
  const list = projects.filter((p) => !p.deadline && p.status !== "termine" && p.status !== "archiver");

  if (list.length === 0)
    return <EmptyState>Tout est planifié : chaque projet actif a une échéance.</EmptyState>;

  return (
    <ul className="space-y-3">
      {list.map((project) => (
        <li
          key={project.id}
          className="flex flex-wrap items-center gap-3 soft-row px-2 py-2"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm">{project.name}</p>
            <p className="text-xs text-muted-foreground">
              {statusLabel(project.status)}
              {project.next_step ? ` · ${project.next_step}` : ""}
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Échéance
            <Input
              type="date"
              className="w-40"
              onChange={(e) =>
                e.target.value ? patch.mutate({ id: project.id, deadline: e.target.value }) : null
              }
            />
          </label>
        </li>
      ))}
    </ul>
  );
}