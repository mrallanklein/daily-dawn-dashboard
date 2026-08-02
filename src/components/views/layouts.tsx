import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DENSITY_CLASS, colorTokens, displayValue } from "./engine";
import type { DataSource, OptionColor, PropertyDef, Row, ViewConfig } from "./types";
import { cn } from "@/lib/utils";

export type LayoutProps = {
  source: DataSource;
  props: PropertyDef[];
  rows: Row[];
  config: ViewConfig;
  colorOf: (row: Row) => OptionColor | null;
};

function tint(color: OptionColor | null) {
  if (!color) return undefined;
  const c = colorTokens(color);
  return { backgroundColor: c.bg, color: c.fg };
}

function Chip({ label, color }: { label: string; color?: OptionColor }) {
  const c = colorTokens(color ?? "gray");
  return (
    <span
      className="inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[0.75rem] font-medium"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {label}
    </span>
  );
}

function Cell({ prop, row }: { prop: PropertyDef; row: Row }) {
  const raw = row.values[prop.id];
  if (["select", "status"].includes(prop.type) && raw) {
    const opt = prop.options?.find((o) => o.label === String(raw) || o.id === String(raw));
    return <Chip label={opt?.label ?? String(raw)} color={opt?.color} />;
  }
  if (prop.type === "multi_select" && Array.isArray(raw))
    return (
      <span className="flex flex-wrap gap-1">
        {raw.map((v) => {
          const opt = prop.options?.find((o) => o.label === String(v));
          return <Chip key={String(v)} label={String(v)} color={opt?.color} />;
        })}
      </span>
    );
  if (prop.type === "checkbox")
    return <input type="checkbox" checked={Boolean(raw)} readOnly className="size-3.5" />;
  if (prop.type === "url" && raw)
    return (
      <a
        href={String(raw)}
        target="_blank"
        rel="noreferrer"
        className="truncate text-brand underline-offset-2 hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {String(raw)}
      </a>
    );
  if (prop.type === "email" && raw)
    return (
      <a href={`mailto:${raw}`} className="truncate hover:underline" onClick={(e) => e.stopPropagation()}>
        {String(raw)}
      </a>
    );
  if (prop.type === "phone" && raw)
    return (
      <a href={`tel:${raw}`} className="truncate hover:underline" onClick={(e) => e.stopPropagation()}>
        {String(raw)}
      </a>
    );
  return <span className="truncate">{displayValue(prop, row)}</span>;
}

export function TableLayout({ source, props, rows, config, colorOf }: LayoutProps) {
  return (
    <div className="overflow-x-auto rounded-[14px] border border-border">
      <table className="w-full min-w-[40rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-border bg-secondary/50">
            {props.map((p) => (
              <th
                key={p.id}
                className="px-3 py-2 text-[0.75rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"
              >
                {p.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => source.onOpen?.(row.id)}
              style={tint(colorOf(row))}
              className="cursor-pointer border-b border-border/70 transition-colors last:border-0 hover:bg-secondary/60"
            >
              {props.map((p) => (
                <td
                  key={p.id}
                  className={cn(
                    "max-w-[18rem] px-3 align-middle",
                    DENSITY_CLASS[config.density],
                    p.id === source.titleProp && "font-medium",
                  )}
                >
                  <Cell prop={p} row={row} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ListLayout({ source, props, rows, config, colorOf }: LayoutProps) {
  const meta = props.filter((p) => p.id !== source.titleProp).slice(0, 3);
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-[14px] border border-border">
      {rows.map((row) => (
        <li key={row.id}>
          <button
            type="button"
            onClick={() => source.onOpen?.(row.id)}
            style={tint(colorOf(row))}
            className={cn(
              "flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-3 text-left transition-colors hover:bg-secondary/60",
              DENSITY_CLASS[config.density],
            )}
          >
            <span className="min-w-0 flex-1 truncate font-medium">
              {String(row.values[source.titleProp] ?? "Sans titre")}
            </span>
            {meta.map((p) => (
              <span key={p.id} className="shrink-0 text-[0.8rem] text-muted-foreground">
                <Cell prop={p} row={row} />
              </span>
            ))}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function GalleryLayout({ source, props, rows, colorOf }: LayoutProps) {
  const meta = props.filter((p) => p.id !== source.titleProp).slice(0, 3);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => {
        const cover = source.coverProp ? row.values[source.coverProp] : null;
        return (
          <button
            key={row.id}
            type="button"
            onClick={() => source.onOpen?.(row.id)}
            className="press overflow-hidden rounded-[16px] border border-border bg-card text-left transition-shadow hover:shadow-[var(--elev-2)]"
          >
            <span
              className="block aspect-[3/2] w-full bg-secondary"
              style={
                cover
                  ? {
                      backgroundImage: `url(${String(cover)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : tint(colorOf(row))
              }
            />
            <span className="block p-3">
              <span className="block truncate text-[0.9375rem] font-semibold">
                {String(row.values[source.titleProp] ?? "Sans titre")}
              </span>
              <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.78rem] text-muted-foreground">
                {meta.map((p) => (
                  <Cell key={p.id} prop={p} row={row} />
                ))}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function KanbanLayout({ source, props, rows, colorOf, config }: LayoutProps) {
  const groupId = config.groupBy ?? source.statusProp ?? "";
  const groupProp = props.find((p) => p.id === groupId) ?? source.properties.find((p) => p.id === groupId);
  const [dragged, setDragged] = useState<string | null>(null);

  const columns = useMemo(() => {
    const labels = groupProp?.options?.map((o) => o.label) ?? [];
    const found = Array.from(
      new Set(rows.map((r) => String(r.values[groupId] ?? "")).filter(Boolean)),
    );
    const all = labels.length > 0 ? Array.from(new Set([...labels, ...found])) : found;
    return [...all, ""].map((label) => ({
      label,
      color: groupProp?.options?.find((o) => o.label === label)?.color ?? "gray",
      rows: rows.filter((r) => String(r.values[groupId] ?? "") === label),
    }));
  }, [rows, groupId, groupProp]);

  if (!groupId)
    return (
      <p className="rounded-[14px] border border-dashed border-border p-8 text-center text-[0.875rem] text-muted-foreground">
        Choisissez une propriété de regroupement dans les paramètres de la vue pour activer le
        Kanban.
      </p>
    );

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {columns
        .filter((c) => c.label !== "" || c.rows.length > 0)
        .map((col) => (
          <div
            key={col.label || "sans"}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragged) source.onPatch?.(dragged, { [groupId]: col.label });
              setDragged(null);
            }}
            className="w-[16.5rem] shrink-0 rounded-[16px] border border-border bg-secondary/40 p-2"
          >
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <Chip label={col.label || "Sans valeur"} color={col.color as OptionColor} />
              <span className="text-[0.75rem] text-muted-foreground">{col.rows.length}</span>
            </div>
            <ul className="space-y-2">
              {col.rows.map((row) => (
                <li key={row.id}>
                  <div
                    draggable
                    onDragStart={() => setDragged(row.id)}
                    onClick={() => source.onOpen?.(row.id)}
                    style={tint(colorOf(row))}
                    className="cursor-grab rounded-[12px] border border-border bg-card p-2.5 transition-shadow hover:shadow-[var(--elev-2)] active:cursor-grabbing"
                  >
                    <p className="truncate text-[0.875rem] font-medium">
                      {String(row.values[source.titleProp] ?? "Sans titre")}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.75rem] text-muted-foreground">
                      {props
                        .filter((p) => p.id !== source.titleProp && p.id !== groupId)
                        .slice(0, 2)
                        .map((p) => (
                          <Cell key={p.id} prop={p} row={row} />
                        ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}

export function CalendarLayout({ source, rows, colorOf }: LayoutProps) {
  const [cursor, setCursor] = useState(new Date());
  const dateProp = source.dateProp;
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
  });

  if (!dateProp)
    return (
      <p className="rounded-[14px] border border-dashed border-border p-8 text-center text-[0.875rem] text-muted-foreground">
        Cette base n'a pas de propriété de date exploitable.
      </p>
    );

  const forDay = (day: Date) =>
    rows.filter((r) => {
      const raw = r.values[dateProp];
      if (!raw) return false;
      try {
        return isSameDay(parseISO(String(raw).slice(0, 10)), day);
      } catch {
        return false;
      }
    });

  return (
    <div className="rounded-[16px] border border-border bg-card p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.9375rem] font-display capitalize">
          {format(cursor, "LLLL yyyy", { locale: fr })}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Mois précédent"
            onClick={() => setCursor(addMonths(cursor, -1))}
            className="press grid size-7 place-items-center rounded-full border border-border"
          >
            <ChevronLeft size={15} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label="Mois suivant"
            onClick={() => setCursor(addMonths(cursor, 1))}
            className="press grid size-7 place-items-center rounded-full border border-border"
          >
            <ChevronRight size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <p key={d} className="pb-1 text-center text-[0.7rem] uppercase text-muted-foreground">
            {d}
          </p>
        ))}
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "min-h-[5rem] rounded-[10px] border border-border/70 p-1.5",
              !isSameMonth(day, cursor) && "opacity-45",
            )}
          >
            <p className="mb-1 text-[0.72rem] text-muted-foreground">{format(day, "d")}</p>
            <ul className="space-y-1">
              {forDay(day).slice(0, 3).map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => source.onOpen?.(row.id)}
                    style={tint(colorOf(row) ?? "blue")}
                    className="block w-full truncate rounded-full px-1.5 py-0.5 text-left text-[0.7rem]"
                  >
                    {String(row.values[source.titleProp] ?? "Sans titre")}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineLayout({ source, rows, colorOf }: LayoutProps) {
  const startKey = source.dateProp;
  const endKey = source.endDateProp ?? source.dateProp;
  if (!startKey)
    return (
      <p className="rounded-[14px] border border-dashed border-border p-8 text-center text-[0.875rem] text-muted-foreground">
        Cette base n'a pas de propriété de date exploitable.
      </p>
    );

  const dated = rows.filter((r) => r.values[startKey]);
  const times = dated.flatMap((r) => [
    new Date(String(r.values[startKey]).slice(0, 10)).getTime(),
    new Date(String(r.values[endKey!] ?? r.values[startKey]).slice(0, 10)).getTime(),
  ]);
  const min = times.length ? Math.min(...times) : Date.now();
  const max = times.length ? Math.max(...times) : Date.now() + 86_400_000;
  const span = Math.max(max - min, 86_400_000);

  return (
    <div className="space-y-1.5 overflow-x-auto rounded-[16px] border border-border bg-card p-3">
      {dated.length === 0 ? (
        <p className="py-6 text-center text-[0.875rem] text-muted-foreground">
          Aucun élément daté.
        </p>
      ) : (
        dated.map((row) => {
          const from = new Date(String(row.values[startKey]).slice(0, 10)).getTime();
          const to = new Date(String(row.values[endKey!] ?? row.values[startKey]).slice(0, 10)).getTime();
          const left = ((from - min) / span) * 100;
          const width = Math.max(((to - from) / span) * 100, 4);
          return (
            <div key={row.id} className="flex min-w-[36rem] items-center gap-3">
              <button
                type="button"
                onClick={() => source.onOpen?.(row.id)}
                className="w-40 shrink-0 truncate text-left text-[0.8125rem] font-medium hover:underline"
              >
                {String(row.values[source.titleProp] ?? "Sans titre")}
              </button>
              <div className="relative h-6 flex-1 rounded-full bg-secondary/60">
                <button
                  type="button"
                  onClick={() => source.onOpen?.(row.id)}
                  style={{ left: `${left}%`, width: `${width}%`, ...tint(colorOf(row) ?? "blue") }}
                  className="absolute inset-y-0 truncate rounded-full px-2 text-[0.7rem] leading-6"
                >
                  {format(new Date(from), "d MMM", { locale: fr })}
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
