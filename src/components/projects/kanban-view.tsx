import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { PROJECT_STATUSES, statusColor, statusLabel } from "@/lib/project-status";
import { daysUntil, fmtShortDate } from "@/lib/dates";
import { projectMembersQuery, teamQuery, type Project } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import { useProjectMutations } from "@/components/projects/use-project-mutations";

const MIME = "text/project";

export function KanbanView({
  projects,
  onSelect,
}: {
  projects: Project[];
  onSelect: (p: Project) => void;
}) {
  const { workspace } = useWorkspace();
  const { reorder } = useProjectMutations(workspace);
  const { data: members } = useQuery(projectMembersQuery());
  const { data: team } = useQuery(teamQuery(workspace));
  const [over, setOver] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const avatarsOf = (projectId: string) =>
    (members ?? [])
      .filter((m) => m.project_id === projectId)
      .map((m) => (team ?? []).find((t) => t.id === m.member_id))
      .filter((m): m is NonNullable<typeof m> => Boolean(m));

  /** Dépose le projet dans la colonne, à l'index demandé (fin de colonne par défaut). */
  const drop = (status: string, list: Project[], index: number | null) => {
    const id = dragging;
    if (!id) return;
    const ids = list.filter((p) => p.id !== id).map((p) => p.id);
    ids.splice(index === null ? ids.length : Math.min(index, ids.length), 0, id);
    reorder.mutate({ ids, status });
    setDragging(null);
    setOver(null);
  };

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
              setOver(col.id);
            }}
            onDragLeave={() => setOver((c) => (c === col.id ? null : c))}
            onDrop={(e) => {
              e.preventDefault();
              drop(col.id, list, null);
            }}
            className={cn(
              "w-[17.5rem] shrink-0 rounded-2xl border border-border/60 bg-muted/35 p-2.5 backdrop-blur-sm transition-colors",
              over === col.id && "border-foreground/30 bg-muted/60",
            )}
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
              {list.map((p, index) => {
                const left = p.deadline ? daysUntil(p.deadline) : null;
                const avatars = avatarsOf(p.id);
                return (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData(MIME, p.id);
                      e.dataTransfer.setData("text/plain", p.id);
                      setDragging(p.id);
                    }}
                    onDragEnd={() => setDragging(null)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = "move";
                      setOver(p.id);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      drop(col.id, list, index);
                    }}
                    onClick={() => onSelect(p)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(p);
                      }
                    }}
                    className={cn(
                      "elevate group w-full cursor-grab overflow-hidden rounded-xl border border-border bg-card text-left shadow-[var(--shadow-xs)] active:cursor-grabbing",
                      over === p.id && dragging && dragging !== p.id && "border-foreground/40",
                      dragging === p.id && "opacity-50",
                    )}
                  >
                    {p.cover_url ? (
                      <div className="relative aspect-3/2 w-full overflow-hidden">
                        <img
                          src={p.cover_url}
                          alt={p.name}
                          loading="lazy"
                          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        />
                      </div>
                    ) : (
                      <div
                        aria-hidden
                        className="h-1 w-full"
                        style={{ backgroundColor: statusColor(p.status) }}
                      />
                    )}

                    <div className="p-3">
                      <p className="line-clamp-2 text-[0.925rem] font-bold leading-snug tracking-[-0.015em]">
                        {p.name}
                      </p>

                      {p.tags.length > 0 || p.client ? (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          {p.client ? (
                            <span className="pill text-muted-foreground">{p.client}</span>
                          ) : null}
                          {p.tags.map((tag) => (
                            <span key={tag} className="pill text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="mt-2 flex items-center justify-between gap-2">
                        {p.deadline ? (
                          <span
                            className={cn(
                              "pill",
                              left !== null && left < 0
                                ? "border-destructive/40 text-destructive"
                                : "text-muted-foreground",
                            )}
                          >
                            <CalendarClock className="size-3" strokeWidth={1.5} />{" "}
                            {fmtShortDate(p.deadline)}
                          </span>
                        ) : (
                          <span className="pill text-muted-foreground">Sans échéance</span>
                        )}

                        {avatars.length > 0 ? (
                          <div className="flex -space-x-1.5">
                            {avatars.slice(0, 3).map((m) =>
                              m.avatar_url ? (
                                <img
                                  key={m.id}
                                  src={m.avatar_url}
                                  alt={m.full_name}
                                  className="size-6 rounded-full border border-card object-cover"
                                />
                              ) : (
                                <span
                                  key={m.id}
                                  title={m.full_name}
                                  className="grid size-6 place-items-center rounded-full border border-card bg-muted text-[0.62rem] font-semibold text-muted-foreground"
                                >
                                  {m.full_name.slice(0, 2).toUpperCase()}
                                </span>
                              ),
                            )}
                            {avatars.length > 3 ? (
                              <span className="grid size-6 place-items-center rounded-full border border-card bg-muted text-[0.62rem] font-semibold text-muted-foreground">
                                +{avatars.length - 3}
                              </span>
                            ) : null}
                          </div>
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
