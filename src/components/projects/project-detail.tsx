import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  fmtEUR,
  projectCommentsQuery,
  tasksQuery,
  teamQuery,
  transactionsQuery,
  type Project,
} from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { PROJECT_STATUSES, statusLabel } from "@/lib/project-status";
import { useProjectMutations } from "@/components/projects/use-project-mutations";
import { useTaskMutations } from "@/components/tasks/use-task-mutations";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function ProjectDetail({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const { workspace } = useWorkspace();
  const queryClient = useQueryClient();
  const { patch, remove } = useProjectMutations(workspace);
  const { create: createTask, toggle, remove: removeTask } = useTaskMutations(workspace);
  const { data: tasks } = useQuery(tasksQuery(workspace));
  const { data: team } = useQuery(teamQuery(workspace));
  const { data: transactions } = useQuery(transactionsQuery(workspace));
  const { data: comments } = useQuery(projectCommentsQuery(project?.id ?? null));
  const [subtask, setSubtask] = useState("");
  const [comment, setComment] = useState("");

  const addComment = useMutation({
    mutationFn: async (body: string) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || !project) throw new Error("Session expirée");
      const { error } = await supabase
        .from("project_comments")
        .insert({ body, project_id: project.id, user_id: auth.user.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["project_comments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!project) return null;

  const projectTasks = (tasks ?? []).filter((t) => t.project_id === project.id);
  const spent = (transactions ?? [])
    .filter((t) => t.project_id === project.id && t.kind === "depense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const budget = project.budget ?? 0;

  return (
    <Sheet open onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="pr-8 text-left font-display text-lg">{project.name}</SheetTitle>
          <p className="text-left text-xs text-muted-foreground">
            {statusLabel(project.status)}
            {project.client ? ` · ${project.client}` : ""}
            {project.category ? ` · ${project.category}` : ""}
          </p>
        </SheetHeader>

        <Tabs defaultValue="infos" className="px-4 pb-8">
          <TabsList className="w-full">
            <TabsTrigger value="infos">Infos</TabsTrigger>
            <TabsTrigger value="taches">Sous-tâches</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="equipe">Équipe</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="infos" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Couverture</Label>
              {project.cover_url ? (
                <img
                  src={project.cover_url}
                  alt={project.name}
                  className="aspect-3/2 w-full rounded-xl border border-border object-cover"
                />
              ) : (
                <div className="grid aspect-3/2 w-full place-items-center rounded-xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <ImagePlus className="size-4" strokeWidth={1.5} /> Ajouter une couverture
                  </span>
                </div>
              )}
              <Input
                aria-label="Lien de l'image de couverture"
                placeholder="https://… (lien de l'image)"
                defaultValue={project.cover_url ?? ""}
                onBlur={(e) => patch.mutate({ id: project.id, cover_url: e.target.value || null })}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>État</Label>
                <Select
                  value={project.status}
                  onValueChange={(v) => patch.mutate({ id: project.id, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priorité</Label>
                <Select
                  value={project.priority}
                  onValueChange={(v) => patch.mutate({ id: project.id, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basse">Basse</SelectItem>
                    <SelectItem value="moyenne">Moyenne</SelectItem>
                    <SelectItem value="haute">Haute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="d-start">Début</Label>
                <Input
                  id="d-start"
                  type="date"
                  defaultValue={project.start_date ?? ""}
                  onBlur={(e) =>
                    patch.mutate({ id: project.id, start_date: e.target.value || null })
                  }
                />
              </div>
              <div>
                <Label htmlFor="d-end">Échéance</Label>
                <Input
                  id="d-end"
                  type="date"
                  defaultValue={project.deadline ?? ""}
                  onBlur={(e) => patch.mutate({ id: project.id, deadline: e.target.value || null })}
                />
              </div>
            </div>

            <div>
              <Label>Avancement · {project.progress}%</Label>
              <Slider
                value={[project.progress]}
                max={100}
                step={5}
                onValueCommit={(v) => patch.mutate({ id: project.id, progress: v[0] ?? 0 })}
                className="mt-3"
              />
            </div>

            <div>
              <Label htmlFor="d-next">Prochaine étape</Label>
              <Input
                id="d-next"
                defaultValue={project.next_step ?? ""}
                onBlur={(e) => patch.mutate({ id: project.id, next_step: e.target.value || null })}
              />
            </div>

            <div>
              <Label htmlFor="d-desc">Description</Label>
              <Textarea
                id="d-desc"
                rows={4}
                defaultValue={project.description ?? ""}
                onBlur={(e) =>
                  patch.mutate({ id: project.id, description: e.target.value || null })
                }
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="d-onedrive">Lien OneDrive</Label>
                <Input
                  id="d-onedrive"
                  placeholder="https://onedrive.live.com/…"
                  defaultValue={project.onedrive_url ?? ""}
                  onBlur={(e) =>
                    patch.mutate({ id: project.id, onedrive_url: e.target.value || null })
                  }
                />
              </div>
              <div>
                <Label htmlFor="d-folder">Dossier local</Label>
                <Input
                  id="d-folder"
                  placeholder="/Users/allan/Projets/…"
                  defaultValue={project.local_folder ?? ""}
                  onBlur={(e) =>
                    patch.mutate({ id: project.id, local_folder: e.target.value || null })
                  }
                />
              </div>
            </div>

            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                remove.mutate(project.id);
                onClose();
              }}
            >
              <Trash2 className="size-4" /> Supprimer le projet
            </Button>
          </TabsContent>

          <TabsContent value="taches" className="space-y-3 pt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!subtask.trim()) return;
                createTask.mutate({ title: subtask.trim(), project_id: project.id });
                setSubtask("");
              }}
              className="flex gap-2"
            >
              <Input
                value={subtask}
                onChange={(e) => setSubtask(e.target.value)}
                placeholder="Nouvelle sous-tâche…"
              />
              <Button type="submit" size="icon" aria-label="Ajouter">
                <Plus className="size-4" />
              </Button>
            </form>
            <ul className="space-y-1">
              {projectTasks.map((t) => (
                <li key={t.id} className="soft-row group flex items-center gap-2.5 px-2 py-1.5">
                  <Checkbox
                    checked={t.status === "termine"}
                    onCheckedChange={() => toggle.mutate(t)}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm",
                      t.status === "termine" && "text-muted-foreground line-through",
                    )}
                  >
                    {t.title}
                  </span>
                  <button
                    onClick={() => removeTask.mutate(t.id)}
                    aria-label="Supprimer la sous-tâche"
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </li>
              ))}
              {projectTasks.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">Aucune sous-tâche.</p>
              ) : null}
            </ul>
          </TabsContent>

          <TabsContent value="budget" className="space-y-4 pt-4">
            <div>
              <Label htmlFor="d-budget">Budget prévu (€)</Label>
              <Input
                id="d-budget"
                type="number"
                defaultValue={project.budget ?? ""}
                onBlur={(e) =>
                  patch.mutate({
                    id: project.id,
                    budget: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>
            <div className="glass p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dépensé</span>
                <span className="tabular-nums">
                  {fmtEUR(spent)} {budget ? `/ ${fmtEUR(budget)}` : ""}
                </span>
              </div>
              <Progress
                value={budget ? Math.min((spent / budget) * 100, 100) : 0}
                className="mt-2 h-1.5"
              />
              {budget && spent > budget ? (
                <p className="mt-1.5 text-xs text-destructive">
                  Dépassement de {fmtEUR(spent - budget)}
                </p>
              ) : null}
            </div>
            <ul className="space-y-1">
              {(transactions ?? [])
                .filter((t) => t.project_id === project.id)
                .map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 px-1 py-1 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {t.description}
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        {format(parseISO(t.occurred_on), "d MMM yyyy", { locale: fr })}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 tabular-nums",
                        t.kind === "revenu" ? "text-success" : "text-muted-foreground",
                      )}
                    >
                      {t.kind === "revenu" ? "+" : "−"}
                      {fmtEUR(Number(t.amount))}
                    </span>
                  </li>
                ))}
            </ul>
          </TabsContent>

          <TabsContent value="equipe" className="space-y-2 pt-4">
            {(team ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun membre pour ce profil. Ajoutez votre équipe depuis la page Équipe.
              </p>
            ) : (
              (team ?? []).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">{m.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.role ?? "—"}</p>
                  </div>
                  <span className="pill text-muted-foreground">{m.permission}</span>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-3 pt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (comment.trim()) addComment.mutate(comment.trim());
              }}
              className="space-y-2"
            >
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Ajouter une note ou un commentaire…"
              />
              <Button type="submit" size="sm">
                Publier
              </Button>
            </form>
            <ul className="space-y-2">
              {(comments ?? []).map((c) => (
                <li key={c.id} className="rounded-lg border border-border px-3 py-2">
                  <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(parseISO(c.created_at), "d MMM yyyy · HH:mm", { locale: fr })}
                  </p>
                </li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
