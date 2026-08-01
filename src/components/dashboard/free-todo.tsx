import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { notesQuery, type NoteItem } from "@/lib/data";
import { Panel } from "@/components/app/panel";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FreeTodo() {
  const queryClient = useQueryClient();
  const { data: items } = useQuery(notesQuery());
  const [draft, setDraft] = useState("");
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notes_items"] });
  const onError = (e: Error) => toast.error(e.message);

  const add = useMutation({
    mutationFn: async (content: string) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const { error } = await supabase.from("notes_items").insert({
        content,
        user_id: auth.user.id,
        position: (items?.length ?? 0) + 1,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError,
  });

  const patch = useMutation({
    mutationFn: async ({ id, ...rest }: { id: string; content?: string; checked?: boolean }) => {
      const { error } = await supabase.from("notes_items").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes_items").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError,
  });

  return (
    <Panel eyebrow="Bloc-notes" title="Todo libre">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          add.mutate(draft.trim());
          setDraft("");
        }}
        className="mb-3 flex gap-2"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Écrire librement…"
          className="flex-1 rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand"
        />
        <Button type="submit" size="icon" variant="secondary" aria-label="Ajouter une ligne">
          <Plus className="size-4" />
        </Button>
      </form>

      <ul className="space-y-1">
        {(items ?? []).map((item: NoteItem) => (
          <li key={item.id} className="soft-row group flex items-center gap-2.5 px-2 py-1">
            <Checkbox
              checked={item.checked}
              onCheckedChange={(v) => patch.mutate({ id: item.id, checked: Boolean(v) })}
            />
            <input
              defaultValue={item.content}
              onBlur={(e) => {
                if (e.target.value !== item.content)
                  patch.mutate({ id: item.id, content: e.target.value });
              }}
              className={cn(
                "min-w-0 flex-1 bg-transparent text-sm outline-none",
                item.checked && "text-muted-foreground line-through",
              )}
            />
            <button
              onClick={() => remove.mutate(item.id)}
              aria-label="Supprimer la ligne"
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
