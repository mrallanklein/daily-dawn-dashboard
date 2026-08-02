import type { Project } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { useProjectMutations } from "@/components/projects/use-project-mutations";
import { PlanBoard, UnplanDropZone, planDragProps } from "@/components/tasks/plan-board";
import { Panel, EmptyState } from "@/components/app/panel";
import { statusColor, statusLabel } from "@/lib/project-status";

/**
 * Projets à planifier : calendrier / liste à gauche, projets sans date à droite.
 * Glisser un projet sur un jour lui donne une échéance ; le ramener à droite la retire.
 */
export function ToPlanView({
  projects,
  onSelect,
}: {
  projects: Project[];
  onSelect: (p: Project) => void;
}) {
  const { workspace } = useWorkspace();
  const { patch } = useProjectMutations(workspace);
  const active = projects.filter((p) => !["termine", "archiver"].includes(p.status));
  const planned = active.filter((p) => p.deadline || p.work_date);
  const toPlan = active.filter((p) => !p.deadline && !p.work_date);

  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <PlanBoard
        items={planned.map((p) => ({
          id: p.id,
          title: p.name,
          date: p.deadline ?? p.work_date,
          color: statusColor(p.status),
        }))}
        onAssign={(id, date) => patch.mutate({ id, deadline: date })}
        label="Projets planifiés"
      />

      <UnplanDropZone onUnassign={(id) => patch.mutate({ id, deadline: null, work_date: null })}>
        <Panel title="Projets sans date" eyebrow={`${toPlan.length} projet(s)`}>
          {toPlan.length === 0 ? (
            <EmptyState>
              Tous les projets actifs sont planifiés. Déposez un projet ici pour retirer ses dates.
            </EmptyState>
          ) : (
            <ul className="space-y-0.5">
              {toPlan.map((p) => (
                <li
                  key={p.id}
                  {...planDragProps(p.id)}
                  className="soft-row flex cursor-grab items-center gap-2.5 px-2 py-2 active:cursor-grabbing"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: statusColor(p.status) }}
                  />
                  <button
                    onClick={() => onSelect(p)}
                    className="min-w-0 flex-1 truncate text-left text-sm font-semibold hover:underline"
                  >
                    {p.name}
                  </button>
                  <span className="pill shrink-0 text-muted-foreground">
                    {statusLabel(p.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </UnplanDropZone>
    </div>
  );
}
