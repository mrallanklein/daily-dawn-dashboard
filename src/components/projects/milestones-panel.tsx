import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Diamond, Plus, Trash2 } from "lucide-react";
import { milestonesQuery } from "@/lib/data";
import { useMilestoneMutations } from "@/components/projects/use-milestone-mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Jalons du projet : dates clés visibles aussi sur la chronologie. */
export function MilestonesPanel({ projectId }: { projectId: string }) {
  const { data: milestones } = useQuery(milestonesQuery());
  const { create, toggle, remove } = useMilestoneMutations();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  const rows = (milestones ?? []).filter((m) => m.project_id === projectId);

  return (
    <div className="space-y-2">
      <Label>Jalons</Label>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !date) return;
          create.mutate({ project_id: projectId, title: title.trim(), due_date: date });
          setTitle("");
          setDate("");
        }}
        className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2"
      >
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nouveau jalon…"
          aria-label="Titre du jalon"
        />
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Date du jalon"
          className="w-[9.5rem]"
        />
        <Button type="submit" size="icon" aria-label="Ajouter le jalon">
          <Plus className="size-4" strokeWidth={1.5} />
        </Button>
      </form>
      <ul className="space-y-1">
        {rows.map((m) => (
          <li key={m.id} className="soft-row group flex items-center gap-2.5 px-2 py-1.5">
            <button
              onClick={() => toggle.mutate(m)}
              aria-label={m.reached ? "Marquer comme non atteint" : "Marquer comme atteint"}
              className={m.reached ? "text-success" : "text-brand"}
            >
              <Diamond
                className="size-3.5"
                strokeWidth={2}
                fill={m.reached ? "currentColor" : "none"}
              />
            </button>
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                m.reached && "text-muted-foreground line-through",
              )}
            >
              {m.title}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {format(parseISO(m.due_date), "d MMM", { locale: fr })}
            </span>
            <button
              onClick={() => remove.mutate(m.id)}
              aria-label="Supprimer le jalon"
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </li>
        ))}
        {rows.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">Aucun jalon défini.</p>
        ) : null}
      </ul>
    </div>
  );
}
