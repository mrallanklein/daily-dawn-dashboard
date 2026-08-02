import { useEffect, useRef, useState } from "react";
import { GripVertical, Plus, Trash2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BLOCK_TYPES, emptyBlock, type Block, type BlockType } from "./blocks";

const TEXT_CLASS: Record<BlockType, string> = {
  text: "text-[0.9375rem] leading-relaxed",
  heading: "font-display text-[1.5rem] leading-tight",
  heading2: "font-display text-[1.2rem] leading-tight",
  heading3: "font-display text-[1.0625rem] leading-tight",
  bullet: "text-[0.9375rem]",
  numbered: "text-[0.9375rem]",
  todo: "text-[0.9375rem]",
  quote: "border-l-2 border-border pl-3 text-[0.9375rem] italic",
  code: "font-mono text-[0.8125rem]",
  image: "text-[0.8125rem]",
  divider: "",
};

/** Éditeur de blocs simple : texte, titres, listes, images, code, séparateurs. */
export function BlockEditor({
  blocks,
  onChange,
  readOnly = false,
  placeholder = "Commencez à écrire…",
}: {
  blocks: Block[];
  onChange: (next: Block[]) => void;
  readOnly?: boolean;
  placeholder?: string;
}) {
  const [local, setLocal] = useState<Block[]>(blocks);
  const [dragId, setDragId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setLocal(blocks), [JSON.stringify(blocks)]);

  const commit = (next: Block[], immediate = false) => {
    setLocal(next);
    if (timer.current) clearTimeout(timer.current);
    if (immediate) onChange(next);
    else timer.current = setTimeout(() => onChange(next), 500);
  };

  const patch = (id: string, part: Partial<Block>, immediate = false) =>
    commit(
      local.map((b) => (b.id === id ? { ...b, ...part } : b)),
      immediate,
    );

  const insertAfter = (id: string | null, type: BlockType = "text") => {
    const block = emptyBlock(type);
    if (!id) return commit([...local, block], true);
    const at = local.findIndex((b) => b.id === id);
    const next = [...local];
    next.splice(at + 1, 0, block);
    commit(next, true);
  };

  const remove = (id: string) =>
    commit(
      local.filter((b) => b.id !== id),
      true,
    );

  if (readOnly)
    return (
      <div className="space-y-2">
        {local.map((b) => (
          <ReadBlock key={b.id} block={b} />
        ))}
      </div>
    );

  return (
    <div className="space-y-1">
      {local.map((block, index) => (
        <div
          key={block.id}
          draggable
          onDragStart={() => setDragId(block.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (!dragId || dragId === block.id) return;
            const next = local.filter((b) => b.id !== dragId);
            const moved = local.find((b) => b.id === dragId)!;
            next.splice(
              next.findIndex((b) => b.id === block.id),
              0,
              moved,
            );
            commit(next, true);
            setDragId(null);
          }}
          className="group/block flex items-start gap-1 rounded-[10px] px-1 py-0.5 hover:bg-secondary/40"
        >
          <div className="flex shrink-0 items-center gap-0.5 pt-1 opacity-0 transition-opacity group-hover/block:opacity-100">
            <Popover>
              <PopoverTrigger
                aria-label="Type de bloc"
                className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
              >
                <Type size={13} strokeWidth={1.6} />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-52 space-y-0.5 p-1.5">
                {BLOCK_TYPES.map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => patch(block.id, { type: t.type }, true)}
                    className={cn(
                      "flex w-full items-center rounded-[8px] px-2 py-1.5 text-left text-[0.8125rem] hover:bg-secondary",
                      block.type === t.type && "bg-secondary font-medium",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
            <button
              type="button"
              aria-label="Ajouter un bloc"
              onClick={() => insertAfter(block.id)}
              className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
            >
              <Plus size={13} strokeWidth={1.6} />
            </button>
            <span className="grid size-6 cursor-grab place-items-center text-muted-foreground">
              <GripVertical size={13} strokeWidth={1.6} />
            </span>
          </div>

          <div className="min-w-0 flex-1 py-0.5">
            {block.type === "divider" ? (
              <hr className="my-2 border-border" />
            ) : block.type === "image" ? (
              <div className="space-y-1.5">
                {block.url ? (
                  <img
                    src={block.url}
                    alt={block.text || "Illustration"}
                    className="max-h-72 w-full rounded-[12px] border border-border object-cover"
                  />
                ) : null}
                <Input
                  value={block.url ?? ""}
                  onChange={(e) => patch(block.id, { url: e.target.value })}
                  placeholder="https://…"
                  className="h-8 text-[0.8125rem]"
                />
              </div>
            ) : (
              <div className="flex items-start gap-2">
                {block.type === "bullet" ? (
                  <span className="pt-2 text-muted-foreground">•</span>
                ) : null}
                {block.type === "numbered" ? (
                  <span className="pt-1 text-[0.8125rem] text-muted-foreground">{index + 1}.</span>
                ) : null}
                {block.type === "todo" ? (
                  <Checkbox
                    checked={Boolean(block.checked)}
                    onCheckedChange={(v) => patch(block.id, { checked: Boolean(v) }, true)}
                    className="mt-1.5"
                  />
                ) : null}
                <Textarea
                  value={block.text}
                  onChange={(e) => patch(block.id, { text: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      insertAfter(block.id, block.type === "text" ? "text" : block.type);
                    }
                    if (e.key === "Backspace" && block.text === "" && local.length > 1) {
                      e.preventDefault();
                      remove(block.id);
                    }
                  }}
                  rows={1}
                  placeholder={index === 0 ? placeholder : ""}
                  className={cn(
                    "min-h-0 resize-none overflow-hidden border-0 bg-transparent px-0 py-1 shadow-none focus-visible:ring-0",
                    TEXT_CLASS[block.type],
                    block.type === "todo" && block.checked && "text-muted-foreground line-through",
                    block.type === "code" && "rounded-[10px] bg-secondary/60 px-2.5 py-2",
                  )}
                  style={{ height: "auto" }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = `${el.scrollHeight}px`;
                  }}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label="Supprimer le bloc"
            onClick={() => remove(block.id)}
            className="mt-1 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-secondary group-hover/block:opacity-100"
          >
            <Trash2 size={13} strokeWidth={1.6} />
          </button>
        </div>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => insertAfter(local.at(-1)?.id ?? null)}
        className="text-muted-foreground"
      >
        <Plus size={14} strokeWidth={1.6} /> Ajouter un bloc
      </Button>
    </div>
  );
}

function ReadBlock({ block }: { block: Block }) {
  if (block.type === "divider") return <hr className="my-2 border-border" />;
  if (block.type === "image")
    return block.url ? (
      <img
        src={block.url}
        alt={block.text || "Illustration"}
        className="max-h-72 w-full rounded-[12px] border border-border object-cover"
      />
    ) : null;
  return (
    <p
      className={cn(
        TEXT_CLASS[block.type],
        block.type === "code" && "rounded-[10px] bg-secondary/60 p-2.5",
      )}
    >
      {block.type === "bullet" ? "• " : block.type === "todo" ? (block.checked ? "☑ " : "☐ ") : ""}
      {block.text}
    </p>
  );
}
