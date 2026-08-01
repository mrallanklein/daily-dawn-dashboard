import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { EmptyState, ModuleCard } from "@/components/module-card";
import { projectsQuery, type Project } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { daysUntil, fmtShortDate } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/projets")({
  head: () => ({
    meta: [
      { title: "Projets — Atelier" },
      {
        name: "description",
        content: "Base de projets : statut, avancement, client, budget et échéance.",
      },
      { property: "og:title", content: "Projets — Atelier" },
      { property: "og:description", content: "Pilotez vos projets et leurs échéances." },
    ],
  }),
  component: ProjectsPage,
});

const STATUSES = ["idee", "en_cours", "en_pause", "termine"];
const LABELS: Record<string, string> = {
  idee: "Idée",
  en_cours: "En cours",
  en_pause: "En pause",
  termine: "Terminé",
};

function ProjectsPage() {
  const queryClient = useQueryClient();
  const { data: projects } = useQuery(projectsQuery());
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [client, setClient] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["projects"] });
  const fail = (e: Error) => toast.error(e.message);

  const create = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const { error } = await supabase.from("projects").insert({
        name,
        user_id: auth.user.id,
        deadline: deadline || null,
        client: client || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setName("");
      setDeadline("");
      setClient("");
      invalidate();
    },
    onError: fail,
  });

  const patch = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string } & Partial<Project>) => {
      const { error } = await supabase.from("projects").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: fail,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: fail,
  });

  return (
    <AppShell>
      <h1 className="mb-6 text-3xl font-medium">Projets</h1>

      <ModuleCard eyebrow="Nouvelle entrée" title="Créer un projet" className="mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) create.mutate();
          }}
          className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]"
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du projet" />
          <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client" />
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <Button type="submit">
            <Plus className="mr-1 size-4" /> Créer
          </Button>
        </form>
      </ModuleCard>

      <ModuleCard eyebrow={`${projects?.length ?? 0} projet(s)`} title="Base de projets">
        {(projects ?? []).length === 0 ? (
          <EmptyState>Aucun projet pour l'instant.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  <th className="pb-3">Projet</th>
                  <th className="pb-3">Statut</th>
                  <th className="pb-3">Avancement</th>
                  <th className="pb-3">Échéance</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody>
                {(projects ?? []).map((project) => {
                  const remaining = project.deadline ? daysUntil(project.deadline) : null;
                  return (
                    <tr key={project.id} className="border-t border-border/50">
                      <td className="py-3 pr-4">
                        <p>{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.client ?? "—"}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <select
                          value={project.status}
                          onChange={(e) => patch.mutate({ id: project.id, status: e.target.value })}
                          className="rounded-md border border-input bg-transparent px-2 py-1 text-xs"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="w-44 py-3 pr-4">
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
                        {project.deadline ? fmtShortDate(project.deadline) : "—"}
                        {remaining !== null ? (
                          <span
                            className={
                              remaining < 0 ? "block text-xs text-destructive" : "block text-xs text-gold"
                            }
                          >
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
        )}
      </ModuleCard>
    </AppShell>
  );
}