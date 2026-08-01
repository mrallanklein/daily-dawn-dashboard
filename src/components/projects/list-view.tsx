import { PROJECT_STATUSES, statusLabel } from "@/lib/project-status";
import { fmtEUR, type Project } from "@/lib/data";
import { daysUntil, fmtShortDate } from "@/lib/dates";
import { useWorkspace } from "@/lib/workspace";
import { useProjectMutations } from "@/components/projects/use-project-mutations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function ListView({
  projects,
  onSelect,
}: {
  projects: Project[];
  onSelect: (p: Project) => void;
}) {
  const { workspace } = useWorkspace();
  const { patch } = useProjectMutations(workspace);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-[0.7rem] uppercase tracking-[0.12em] text-muted-foreground">
            <th className="px-2 py-2 font-normal">Projet</th>
            <th className="px-2 py-2 font-normal">État</th>
            <th className="px-2 py-2 font-normal">Client</th>
            <th className="px-2 py-2 font-normal">Échéance</th>
            <th className="px-2 py-2 font-normal">Avancement</th>
            <th className="px-2 py-2 text-right font-normal">Budget</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => {
            const left = p.deadline ? daysUntil(p.deadline) : null;
            return (
              <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                <td className="max-w-[18rem] px-2 py-2">
                  <button onClick={() => onSelect(p)} className="truncate text-left hover:underline">
                    {p.name}
                  </button>
                  {p.category ? (
                    <span className="ml-2 text-xs text-muted-foreground">{p.category}</span>
                  ) : null}
                </td>
                <td className="px-2 py-2">
                  <Select
                    value={p.status}
                    onValueChange={(v) => patch.mutate({ id: p.id, status: v })}
                  >
                    <SelectTrigger className="h-7 w-[9.5rem] text-xs">
                      <SelectValue>{statusLabel(p.status)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-2 text-muted-foreground">{p.client ?? "—"}</td>
                <td
                  className={cn(
                    "px-2 py-2 tabular-nums",
                    left !== null && left < 0 ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  <input
                    type="date"
                    value={p.deadline ?? ""}
                    onChange={(e) =>
                      patch.mutate({ id: p.id, deadline: e.target.value || null })
                    }
                    className="bg-transparent text-xs outline-none"
                  />
                </td>
                <td className="w-40 px-2 py-2">
                  <div className="flex items-center gap-2">
                    <Progress value={p.progress} className="h-1.5" />
                    <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                      {p.progress}%
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">
                  {p.budget ? fmtEUR(p.budget) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {projects.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Aucun projet.</p>
      ) : null}
    </div>
  );
}

export { fmtShortDate };
