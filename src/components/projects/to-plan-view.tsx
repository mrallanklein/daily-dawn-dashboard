import type { Project } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { useProjectMutations } from "@/components/projects/use-project-mutations";
import { Input } from "@/components/ui/input";
import { statusDot, statusLabel } from "@/lib/project-status";
import { cn } from "@/lib/utils";

/** Projets actifs sans date : on leur donne une deadline et/ou une date de travail. */
export function ToPlanView({
  projects,
  onSelect,
}: {
  projects: Project[];
  onSelect: (p: Project) => void;
}) {
  const { workspace } = useWorkspace();
  const { patch } = useProjectMutations(workspace);
  const list = projects.filter(
    (p) => !["termine", "archiver"].includes(p.status) && (!p.deadline || !p.work_date),
  );

  if (list.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        Tous les projets actifs sont planifiés.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {list.map((p) => (
        <li key={p.id} className="soft-row flex flex-wrap items-center gap-3 px-2 py-2">
          <span className={cn("size-2 shrink-0 rounded-full", statusDot(p.status))} />
          <button
            onClick={() => onSelect(p)}
            className="min-w-0 flex-1 text-left text-sm font-semibold hover:underline"
          >
            {p.name}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {statusLabel(p.status)}
            </span>
          </button>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Travail
            <Input
              type="date"
              value={p.work_date ?? ""}
              onChange={(e) => patch.mutate({ id: p.id, work_date: e.target.value || null })}
              className="h-8 w-36"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            Deadline
            <Input
              type="date"
              value={p.deadline ?? ""}
              onChange={(e) => patch.mutate({ id: p.id, deadline: e.target.value || null })}
              className="h-8 w-36"
            />
          </label>
        </li>
      ))}
    </ul>
  );
}
