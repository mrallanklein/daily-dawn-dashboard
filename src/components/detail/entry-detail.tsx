import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  History,
  Maximize2,
  MessageSquare,
  PanelRight,
  RotateCcw,
  Square,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BlockEditor } from "@/components/blocks/block-editor";
import type { Block } from "@/components/blocks/blocks";
import { Breadcrumbs, type Crumb } from "@/components/app/breadcrumbs";
import { MentionInput } from "./mention-input";
import { entryContentQuery, saveEntryContent, type EntryComment } from "@/lib/entry-content";
import { entryHistoryQuery, recordHistory } from "@/lib/entry-history";
import { profileQuery } from "@/lib/data";
import { displayValue } from "@/components/views/engine";
import type { PropertyDef } from "@/components/views/types";

type Presentation = "panel" | "modal" | "page";

/**
 * Fiche détail universelle d'une entrée : panneau latéral, modale centrée ou
 * page entière, avec éditeur de blocs, historique et commentaires mentionnés.
 */
export function EntryDetail({
  open,
  onClose,
  module,
  moduleLabel,
  entryId,
  title,
  properties = [],
  values = {},
  crumbs,
}: {
  open: boolean;
  onClose: () => void;
  module: string;
  moduleLabel: string;
  entryId: string | null;
  title: string;
  properties?: PropertyDef[];
  values?: Record<string, unknown>;
  crumbs?: Crumb[];
}) {
  const queryClient = useQueryClient();
  const [presentation, setPresentation] = useState<Presentation>("panel");
  const [comment, setComment] = useState("");
  const { data: profile } = useQuery(profileQuery());
  const content = useQuery(entryContentQuery(module, open ? entryId : null));
  const history = useQuery(entryHistoryQuery(module, open ? entryId : null));

  const author = profile?.display_name ?? "Moi";
  const blocks = content.data?.blocks ?? [];
  const comments = content.data?.comments ?? [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && open && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["entry_content", module, entryId] });
    void queryClient.invalidateQueries({ queryKey: ["entry_history", module, entryId] });
  };

  const saveBlocks = useMutation({
    mutationFn: async (next: Block[]) => {
      if (!entryId) return;
      await saveEntryContent(module, entryId, { blocks: next });
      await recordHistory({
        module,
        entryId,
        author,
        summary: "Contenu modifié",
        snapshot: { blocks: next, values },
      });
    },
    onSuccess: refresh,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Enregistrement impossible"),
  });

  const addComment = useMutation({
    mutationFn: async (body: string) => {
      if (!entryId) return;
      const next: EntryComment[] = [
        ...comments,
        { id: crypto.randomUUID(), author, body, created_at: new Date().toISOString() },
      ];
      await saveEntryContent(module, entryId, { comments: next });
      await recordHistory({
        module,
        entryId,
        author,
        summary: "Commentaire ajouté",
        snapshot: { comments: next },
      });
    },
    onSuccess: () => {
      setComment("");
      refresh();
    },
  });

  const restore = useMutation({
    mutationFn: async (snapshot: Record<string, unknown>) => {
      if (!entryId) return;
      const snapBlocks = (snapshot["blocks"] as Block[] | undefined) ?? [];
      await saveEntryContent(module, entryId, { blocks: snapBlocks });
      await recordHistory({
        module,
        entryId,
        author,
        summary: "Version restaurée",
        snapshot,
      });
    },
    onSuccess: () => {
      toast.success("Version restaurée");
      refresh();
    },
  });

  const shownProps = useMemo(
    () =>
      properties.filter((p) => !p.hidden && values[p.id] !== undefined && values[p.id] !== null),
    [properties, values],
  );

  if (!open || !entryId) return null;

  const body = (
    <div className="space-y-4">
      <Breadcrumbs items={crumbs ?? [{ label: moduleLabel }, { label: title }]} />
      <h2 className="font-display text-[1.4rem] leading-tight">{title}</h2>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Contenu</TabsTrigger>
          <TabsTrigger value="props">Propriétés</TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare size={13} strokeWidth={1.6} /> Commentaires
          </TabsTrigger>
          <TabsTrigger value="history">
            <History size={13} strokeWidth={1.6} /> Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="pt-3">
          {content.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          ) : (
            <BlockEditor blocks={blocks} onChange={(next) => saveBlocks.mutate(next)} />
          )}
        </TabsContent>

        <TabsContent value="props" className="space-y-1.5 pt-3">
          {shownProps.length === 0 ? (
            <p className="text-[0.8125rem] text-muted-foreground">
              Aucune propriété renseignée sur cette entrée.
            </p>
          ) : (
            shownProps.map((p) => (
              <div
                key={p.id}
                className="flex items-start gap-3 rounded-[10px] px-1 py-1.5 hover:bg-secondary/40"
              >
                <span className="w-40 shrink-0 truncate text-[0.8125rem] text-muted-foreground">
                  {p.name}
                </span>
                <span className="min-w-0 flex-1 text-[0.875rem]">
                  {displayValue(p, { id: entryId, values })}
                </span>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-3 pt-3">
          <MentionInput
            value={comment}
            onChange={setComment}
            placeholder="Ajouter un commentaire… tapez @ pour mentionner"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!comment.trim() || addComment.isPending}
              onClick={() => addComment.mutate(comment.trim())}
            >
              Commenter
            </Button>
          </div>
          {comments.length === 0 ? (
            <p className="text-[0.8125rem] text-muted-foreground">Aucun commentaire.</p>
          ) : (
            <ul className="space-y-2">
              {[...comments].reverse().map((c) => (
                <li key={c.id} className="rounded-[12px] border border-border p-2.5">
                  <p className="flex items-center gap-2 text-[0.75rem] text-muted-foreground">
                    <span className="font-medium text-foreground">{c.author}</span>
                    <Clock size={11} strokeWidth={1.6} />
                    {new Date(c.created_at).toLocaleString("fr-FR")}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[0.875rem]">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="history" className="pt-3">
          {history.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (history.data ?? []).length === 0 ? (
            <p className="text-[0.8125rem] text-muted-foreground">
              Aucune modification enregistrée pour le moment.
            </p>
          ) : (
            <ul className="space-y-2">
              {(history.data ?? []).map((h) => (
                <li
                  key={h.id}
                  className="flex items-center gap-3 rounded-[12px] border border-border p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.875rem]">{h.summary}</p>
                    <p className="text-[0.75rem] text-muted-foreground">
                      {h.author} · {new Date(h.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => restore.mutate(h.snapshot)}
                    className="shrink-0 text-muted-foreground"
                  >
                    <RotateCcw size={13} strokeWidth={1.6} /> Restaurer
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  const modeButtons = (
    <div className="flex items-center gap-0.5">
      {(
        [
          { id: "panel", icon: PanelRight, label: "Panneau latéral" },
          { id: "modal", icon: Square, label: "Modale centrée" },
          { id: "page", icon: Maximize2, label: "Page entière" },
        ] as const
      ).map((m) => (
        <button
          key={m.id}
          type="button"
          title={m.label}
          aria-label={m.label}
          onClick={() => setPresentation(m.id)}
          className={cn(
            "press grid size-7 place-items-center rounded-[8px] text-muted-foreground hover:bg-secondary hover:text-foreground",
            presentation === m.id && "bg-secondary text-foreground",
          )}
        >
          <m.icon size={14} strokeWidth={1.6} />
        </button>
      ))}
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="press ml-1 grid size-7 place-items-center rounded-[8px] text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <X size={14} strokeWidth={1.6} />
      </button>
    </div>
  );

  const shell = cn(
    "flex flex-col overflow-hidden border border-border bg-card shadow-[var(--elev-3)]",
    presentation === "panel" && "fixed inset-y-0 right-0 z-50 w-full max-w-xl rounded-l-[20px]",
    presentation === "modal" &&
      "fixed left-1/2 top-1/2 z-50 max-h-[86vh] w-[min(52rem,94vw)] -translate-x-1/2 -translate-y-1/2 rounded-[20px]",
    presentation === "page" && "fixed inset-0 z-50 rounded-none",
  );

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <aside role="dialog" aria-label={title} className={shell}>
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="truncate text-[0.8125rem] text-muted-foreground">{moduleLabel}</span>
          {modeButtons}
        </header>
        <div
          className={cn(
            "flex-1 overflow-y-auto p-5",
            presentation === "page" && "mx-auto w-full max-w-3xl",
          )}
        >
          {body}
        </div>
      </aside>
    </>
  );
}
