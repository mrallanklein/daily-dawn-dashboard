import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ListPlus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { notesQuery, type NoteItem } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fmtShortDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Patch = { id: string; content?: string; checked?: boolean; due_date?: string | null };

export function FreeTodo() {
  const queryClient = useQueryClient();
  const { data: items } = useQuery(notesQuery());
  const [draft, setDraft] = useState("");
  const [subDraft, setSubDraft] = useState<Record<string, string>>({});
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notes_items"] });
  const onError = (e: Error) => toast.error(e.message);

  const add = useMutation({
    mutationFn: async (input: { content: string; parent_id?: string | null }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Session expirée");
      const { error } = await supabase.from("notes_items").insert({
        content: input.content,
        parent_id: input.parent_id ?? null,
        user_id: auth.user.id,
        position: (items?.length ?? 0) + 1,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError,
  });

  const patch = useMutation({
    mutationFn: async ({ id, ...rest }: Patch) => {
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

  const all = items ?? [];
  const roots = all.filter((i) => !i.parent_id);
  const childrenOf = (id: string) => all.filter((i) => i.parent_id === id);

  const Row = ({ item, sub }: { item: NoteItem; sub?: boolean }) => (
    <div className={cn("soft-row group flex items-center gap-2.5 px-2 py-1", sub && "ml-6")}>
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
          "min-w-0 flex-1 bg-transparent text-sm font-medium outline-none",
          item.checked && "font-normal text-muted-foreground line-through",
        )}
      />
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "press flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.68rem] text-muted-foreground hover:text-foreground",
              !item.due_date && "opacity-0 group-hover:opacity-100",
            )}
            aria-label="Date de réalisation"
          >
            <CalendarDays className="size-3.5" />
            {item.due_date ? fmtShortDate(item.due_date) : null}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="end">
          <Input
            type="date"
            value={item.due_date ?? ""}
            onChange={(e) => patch.mutate({ id: item.id, due_date: e.target.value || null })}
          />
        </PopoverContent>
      </Popover>
      {!sub ? (
        <button
          onClick={() => setSubDraft((s) => ({ ...s, [item.id]: s[item.id] ?? "" }))}
          aria-label="Ajouter une sous-tâche"
          className="press opacity-0 transition-opacity group-hover:opacity-100"
        >
          <ListPlus className="size-3.5 text-muted-foreground hover:text-foreground" />
        </button>
      ) : null}
      <button
        onClick={() => remove.mutate(item.id)}
        aria-label="Supprimer la ligne"
        className="press opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
      </button>
    </div>
  );

  return (
    <section className="glass flex min-w-0 flex-col p-3">
      <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        To-do libre
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          add.mutate({ content: draft.trim() });
          setDraft("");
        }}
        className="mb-3 flex gap-2"
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Écrire librement…"
        />
        <Button type="submit" size="icon" variant="secondary" className="press" aria-label="Ajouter une ligne">
          <Plus className="size-4" />
        </Button>
      </form>

      <div className="space-y-0.5">
        {roots.map((item) => (
          <div key={item.id}>
            <Row item={item} />
            {childrenOf(item.id).map((child) => (
              <Row key={child.id} item={child} sub />
            ))}
            {subDraft[item.id] !== undefined ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const value = (subDraft[item.id] ?? "").trim();
                  if (!value) return;
                  add.mutate({ content: value, parent_id: item.id });
                  setSubDraft(({ [item.id]: _drop, ...rest }) => rest);
                }}
                className="ml-6 flex gap-2 py-1"
              >
                <Input
                  autoFocus
                  value={subDraft[item.id] ?? ""}
                  onChange={(e) => setSubDraft((s) => ({ ...s, [item.id]: e.target.value }))}
                  placeholder="Sous-tâche…"
                  className="h-8"
                />
                <Button type="submit" size="sm" variant="secondary" className="press">
                  Ajouter
                </Button>
              </form>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
