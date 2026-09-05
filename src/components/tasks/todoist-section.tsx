import { useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Section de tâches façon Todoist : en-tête repliable avec compteur et bouton
 * « Ajouter une tâche » en bas de section.
 */
export function TodoistSection({
  title,
  count,
  accent,
  onAdd,
  children,
}: {
  title: string;
  count: number;
  accent?: string;
  onAdd: (title: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const submit = () => {
    if (draft.trim()) onAdd(draft.trim());
    setDraft("");
  };

  return (
    <section className="mb-6">
      <header className="flex items-center gap-2 border-b border-border pb-1.5">
        <button
          type="button"
          aria-label={open ? "Replier la section" : "Déplier la section"}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "grid size-4 place-items-center rounded text-muted-foreground transition-transform hover:text-foreground",
            open && "rotate-90",
          )}
        >
          <ChevronRight className="size-3.5" strokeWidth={1.5} />
        </button>
        {accent ? (
          <span className="size-2 rounded-full" style={{ backgroundColor: accent }} />
        ) : null}
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        <span className="num text-xs text-muted-foreground">{count}</span>
      </header>

      {open ? (
        <>
          {children}
          {adding ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="flex items-center gap-2 py-2"
            >
              <Plus className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setDraft("");
                    setAdding(false);
                  }
                }}
                onBlur={() => {
                  submit();
                  setAdding(false);
                }}
                placeholder="Nom de la tâche"
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="press flex w-full items-center gap-2 py-2 text-left text-sm text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-4" strokeWidth={1.5} />
              Ajouter une tâche
            </button>
          )}
        </>
      ) : null}
    </section>
  );

}
