import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { PROJECT_STATUSES, statusColor, statusLabel } from "@/lib/project-status";
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
            className="w-[17.5rem] shrink-0 rounded-2xl border border-border/60 bg-muted/35 p-2.5 backdrop-blur-sm"
          >
            <div className="mb-2.5 flex items-center gap-2 px-1">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: statusColor(col.id) }}
              />
              <p className="min-w-0 flex-1 truncate text-[0.82rem] font-semibold tracking-[-0.01em]">
                {col.label}
              </p>
              <span className="num rounded-full bg-background/70 px-2 text-[0.72rem] font-medium text-muted-foreground">
                {list.length}
              </span>
            </div>
            <div className="space-y-2.5">
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
                    className="elevate group w-full cursor-grab overflow-hidden rounded-xl border border-border bg-card text-left shadow-[var(--shadow-xs)] active:cursor-grabbing"
                  >
                    {p.cover_url ? (
                      <div className="relative aspect-3/2 w-full overflow-hidden">
                        <img
                          src={p.cover_url}
                          alt={p.name}
                          loading="lazy"
                          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        />
                        <div
                          aria-hidden
                          className="absolute inset-0 bg-linear-to-t from-black/45 via-black/5 to-transparent"
                        />
                        {p.priority === "haute" ? (
                          <span className="absolute right-2 top-2 rounded-full bg-warning px-2 py-0.5 text-[0.68rem] font-semibold text-background">
                            Priorité
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <div
                        aria-hidden
                        className="h-1 w-full"
                        style={{ backgroundColor: statusColor(p.status) }}
                      />
                    )}
                    <div className="p-3">
                      <p className="line-clamp-2 text-[0.925rem] font-semibold leading-snug tracking-[-0.015em]">
                        {p.name}
                      </p>
                      {p.client ? (
                        <p className="mt-0.5 truncate text-[0.8rem] text-muted-foreground">
                          {p.client}
                        </p>
                      ) : null}
                      <div className="mt-3 flex items-center gap-2">
                        <Progress value={p.progress} className="h-1 flex-1" />
                        <span className="num text-[0.72rem] font-semibold text-muted-foreground">
                          {p.progress}%
                        </span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
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
                        {!p.cover_url && p.priority === "haute" ? (
                          <span className="pill border-warning/50 text-warning">Priorité</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
              {list.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 px-3 py-5 text-center text-[0.78rem] leading-relaxed text-muted-foreground">
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
