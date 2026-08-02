import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RowsSkeleton } from "@/components/app/skeletons";
import { useWorkspace } from "@/lib/workspace";
import {
  listNotionDatabases,
  listNotionSyncRuns,
  syncNotionDatabase,
} from "@/lib/notion-sync.functions";


const TARGETS = [
  { id: "projects", label: "Projets" },
  { id: "tasks", label: "Tâches" },
  { id: "milestones", label: "Jalons" },
] as const;

type Target = (typeof TARGETS)[number]["id"];

export function NotionSyncDialog() {
  const { workspace } = useWorkspace();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mapping, setMapping] = useState<Record<Target, string>>({
    projects: "",
    tasks: "",
    milestones: "",
  });

  const fetchDatabases = useServerFn(listNotionDatabases);
  const fetchRuns = useServerFn(listNotionSyncRuns);
  const runSync = useServerFn(syncNotionDatabase);

  const databases = useQuery({
    queryKey: ["notion_databases"],
    queryFn: () => fetchDatabases(),
    enabled: open,
  });
  const runs = useQuery({
    queryKey: ["notion_sync_runs", workspace],
    queryFn: () => fetchRuns({ data: { workspace } }),
    enabled: open,
  });

  const sync = useMutation({
    mutationFn: (target: Target) =>
      runSync({ data: { workspace, target, databaseId: mapping[target] } }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["project_milestones"] });
      qc.invalidateQueries({ queryKey: ["notion_sync_runs"] });
      toast.success(
        `${result.databaseTitle} : ${result.created} créé(s), ${result.updated} mis à jour${
          result.skipped ? `, ${result.skipped} ignoré(s)` : ""
        }`,
      );
      if (result.warnings.length) toast.warning(result.warnings.slice(0, 3).join(" · "));
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Import impossible"),
  });

  const syncAll = async () => {
    for (const { id } of TARGETS) if (mapping[id]) await sync.mutateAsync(id);
  };

  const list = databases.data?.databases ?? [];
  const error = databases.data?.error;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <RefreshCw className="size-3.5" /> Notion
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Synchronisation Notion</DialogTitle>
          <DialogDescription>
            Choisis la base Notion correspondant à chaque module, puis lance l’import. Les éléments
            déjà importés sont mis à jour, jamais dupliqués.
          </DialogDescription>
        </DialogHeader>

        {databases.isLoading ? <RowsSkeleton rows={3} /> : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {!databases.isLoading && !error && list.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune base de données n’est partagée avec l’intégration Notion. Dans Notion, ouvre la
            base concernée puis <span className="font-medium">···  →  Connexions  →  Lovable</span>{" "}
            pour l’autoriser, et recharge cette fenêtre.
          </p>
        ) : null}

        {list.length > 0 ? (
          <div className="space-y-3">
            {TARGETS.map(({ id, label }) => (
              <div key={id} className="flex items-center gap-3">
                <span className="w-20 text-sm font-medium">{label}</span>
                <Select
                  value={mapping[id]}
                  onValueChange={(v) => setMapping((m) => ({ ...m, [id]: v }))}
                >
                  <SelectTrigger className="h-9 flex-1">
                    <SelectValue placeholder="Base Notion…" />
                  </SelectTrigger>
                  <SelectContent>
                    {list.map((db) => (
                      <SelectItem key={db.id} value={db.id}>
                        {db.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!mapping[id] || sync.isPending}
                  onClick={() => sync.mutate(id)}
                >
                  Importer
                </Button>
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => databases.refetch()}>
                Recharger les bases
              </Button>
              <Button
                size="sm"
                onClick={syncAll}
                disabled={sync.isPending || !TARGETS.some(({ id }) => mapping[id])}
              >
                {sync.isPending ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : null}
                Tout synchroniser
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              L’ordre compte : les projets doivent être importés avant les tâches et les jalons pour
              que les relations Notion soient retrouvées.
            </p>
          </div>
        ) : null}

        {runs.data && runs.data.length > 0 ? (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Derniers imports
            </p>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {runs.data.slice(0, 5).map((r) => (
                <li key={r.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {r.database_title} → {r.target}
                  </span>
                  <span className="shrink-0">
                    +{r.created_count} / ~{r.updated_count} · {new Date(r.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
