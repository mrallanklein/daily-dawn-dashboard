import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { PROJECT_STATUSES, statusLabel } from "@/lib/project-status";
import { daysUntil, fmtShortDate } from "@/lib/dates";
import { tasksQuery, type Project } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useProjectMutations } from "@/components/projects/use-project-mutations";

export function KanbanView({
  projects,
  onSelect,
}: {
  projects: Project[];
  onSelect: (p: Project) => void;
}) {
  const { workspace } = useWorkspace();
  const { patch } = useProjectMutations(workspace);
  const { data: tasks } = useQuery(tasksQuery(workspace));

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
      {PROJECT_STATUSES.map((col) => {
        const list = projects.filter((p) => p.status === col.id);
        return (
          <div
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              const id =
                e.dataTransfer.getData("text/project") || e.dataTransfer.getData("text/plain");
              const source = projects.find((p) => p.id === id);
              if (id && source && source.status !== col.id) patch.mutate({ id, status: col.id });
            }}
            className="w-[16.5rem] shrink-0 rounded-xl bg-muted/40 p-2"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs font-medium">{col.label}</p>
              <span className="text-xs text-muted-foreground">{list.length}</span>
            </div>
            <div className="space-y-2">
              {list.map((p) => {
                const left = p.deadline ? daysUntil(p.deadline) : null;
                const open = (tasks ?? []).filter(
                  (t) => t.project_id === p.id && t.status !== "termine",
                ).length;
                return (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/project", p.id);
                      e.dataTransfer.setData("text/plain", p.id);
                    }}
                    onClick={() => onSelect(p)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(p);
                      }
                    }}
                    className="w-full cursor-grab rounded-lg border border-border bg-card p-2.5 text-left shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
                  >
                    {p.cover_url ? (
                      <img
                        src={p.cover_url}
                        alt={p.name}
                        loading="lazy"
                        className="mb-2 aspect-[3/2] w-full rounded-md object-cover"
                      />
                    ) : null}
                    <p className="line-clamp-2 text-sm font-semibold">{p.name}</p>
                    {p.client ? (
                      <p className="truncate text-xs text-muted-foreground">{p.client}</p>
                    ) : null}
                    <Progress value={p.progress} className="mt-2 h-1" />
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {p.deadline ? (
                        <span
                          className={cn(
                            "pill",
                            left !== null && left < 0
                              ? "border-destructive/40 text-destructive"
                              : "text-muted-foreground",
                          )}
                        >
                          <CalendarClock className="size-3" /> {fmtShortDate(p.deadline)}
                        </span>
                      ) : null}
                      {open > 0 ? (
                        <span className="pill text-muted-foreground">{open} tâche(s)</span>
                      ) : null}
                      {p.priority === "haute" ? (
                        <span className="pill border-warning/50 text-warning">Priorité</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              {list.length === 0 ? (
                <p className="px-1 py-3 text-xs text-muted-foreground">
                  Glissez un projet en « {statusLabel(col.id)} ».
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
