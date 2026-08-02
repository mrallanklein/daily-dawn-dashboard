import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AtSign, CalendarDays, CheckSquare, FolderKanban, User } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { projectsQuery, tasksQuery, teamQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";

type Suggestion = { id: string; label: string; kind: "member" | "date" | "project" | "task" };

const ICONS = {
  member: User,
  date: CalendarDays,
  project: FolderKanban,
  task: CheckSquare,
} as const;

function dateSuggestions(): Suggestion[] {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  const week = new Date(today.getTime() + 7 * 86400000);
  return [
    { id: fmt(today), label: `Aujourd'hui (${fmt(today)})`, kind: "date" },
    { id: fmt(tomorrow), label: `Demain (${fmt(tomorrow)})`, kind: "date" },
    { id: fmt(week), label: `Dans 7 jours (${fmt(week)})`, kind: "date" },
  ];
}

/**
 * Zone de texte avec mentions `@` : membre, date (deadline ou rappel) ou lien
 * vers un projet / une tâche.
 */
export function MentionInput({
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const { workspace } = useWorkspace();
  const { data: team } = useQuery(teamQuery(workspace));
  const { data: projects } = useQuery(projectsQuery(workspace));
  const { data: tasks } = useQuery(tasksQuery(workspace));
  const ref = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);

  const all = useMemo<Suggestion[]>(
    () => [
      ...(team ?? []).map((m) => ({ id: m.id, label: m.full_name, kind: "member" as const })),
      ...dateSuggestions(),
      ...(projects ?? []).map((p) => ({ id: p.id, label: p.name, kind: "project" as const })),
      ...(tasks ?? [])
        .slice(0, 60)
        .map((t) => ({ id: t.id, label: t.title, kind: "task" as const })),
    ],
    [team, projects, tasks],
  );

  const matches =
    query === null
      ? []
      : all.filter((s) => s.label.toLowerCase().includes(query.toLowerCase())).slice(0, 7);

  const detect = (text: string, caret: number) => {
    const before = text.slice(0, caret);
    const at = before.lastIndexOf("@");
    if (at < 0) return setQuery(null);
    const token = before.slice(at + 1);
    if (/\s{2,}|\n/.test(token)) return setQuery(null);
    setQuery(token);
  };

  const insert = (s: Suggestion) => {
    const el = ref.current;
    const caret = el?.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const at = before.lastIndexOf("@");
    const next = `${value.slice(0, at)}@${s.label} ${value.slice(caret)}`;
    onChange(next);
    setQuery(null);
    requestAnimationFrame(() => el?.focus());
  };

  return (
    <div className={cn("relative", className)}>
      <Textarea
        ref={ref}
        value={value}
        rows={rows}
        placeholder={placeholder ?? "Écrivez… tapez @ pour mentionner"}
        onChange={(e) => {
          onChange(e.target.value);
          detect(e.target.value, e.target.selectionStart ?? 0);
        }}
        onBlur={() => setTimeout(() => setQuery(null), 120)}
        className="resize-none text-[0.875rem]"
      />
      {matches.length > 0 ? (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-[12px] border border-border bg-popover p-1 shadow-[var(--elev-3)]">
          {matches.map((s) => {
            const Icon = ICONS[s.kind];
            return (
              <li key={`${s.kind}-${s.id}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insert(s)}
                  className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-[0.8125rem] hover:bg-secondary"
                >
                  <Icon size={13} strokeWidth={1.6} className="text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {query === null ? (
        <AtSign
          size={13}
          strokeWidth={1.6}
          className="pointer-events-none absolute bottom-2 right-2 text-muted-foreground/60"
        />
      ) : null}
    </div>
  );
}
