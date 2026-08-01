import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { notesQuery, type NoteItem } from "@/lib/data";
import { ModuleCard } from "@/components/module-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function FreeTodo() {
  const queryClient = useQueryClient();
  const { data: items } = useQuery(notesQuery());
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notes_items"] });
  const fail = (e: Error) => toast.error(e.message);

  const addLine = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const position = (items?.at(-1)?.position ?? 0) + 1;
      const { error } = await supabase
        .from("notes_items")
        .insert({ content: "", position, user_id: auth.user.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: fail,
  });

  const update = useMutation({
    mutationFn: async (patch: { id: string; content?: string; checked?: boolean }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("notes_items").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: fail,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes_items").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: fail,
  });

  const lines: NoteItem[] = items ?? [];

  return (
    <ModuleCard
      eyebrow="Bloc libre"
      title="Todo list"
      action={
        <Button variant="outline" size="sm" onClick={() => addLine.mutate()}>
          <Plus className="mr-1 size-3.5" /> Ligne
        </Button>
      }
    >
      {lines.length === 0 ? (
        <button
          onClick={() => addLine.mutate()}
          className="w-full rounded-lg border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground hover:text-gold"
        >
          Cliquez pour écrire votre première ligne
        </button>
      ) : (
        <ul className="space-y-1.5">
          {lines.map((line) => (
            <li key={line.id} className="group flex items-center gap-3">
              <Checkbox
                checked={line.checked}
                onCheckedChange={(v) => update.mutate({ id: line.id, checked: Boolean(v) })}
              />
              <input
                defaultValue={line.content}
                placeholder="Écrire…"
                onBlur={(e) => {
                  if (e.target.value !== line.content)
                    update.mutate({ id: line.id, content: e.target.value });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                    addLine.mutate();
                  }
                }}
                className={cn(
                  "flex-1 border-0 border-b border-transparent bg-transparent py-1 text-sm outline-none focus:border-gold/60",
                  line.checked && "text-muted-foreground line-through",
                )}
              />
              <button
                onClick={() => remove.mutate(line.id)}
                aria-label="Supprimer la ligne"
                className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </ModuleCard>
  );
}