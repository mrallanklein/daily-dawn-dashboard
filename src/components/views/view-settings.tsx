import { useState } from "react";
import {
  ArrowDownUp,
  ArrowLeft,
  Calendar,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  GalleryVerticalEnd,
  Grid2x2,
  GripVertical,
  Layers,
  Link2,
  List,
  ListChecks,
  PaintRoller,
  Plus,
  Rows3,
  Table2,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { colorTokens, operatorsFor } from "./engine";
import { LAYOUT_ICONS, PROPERTY_ICONS } from "./property-icons";
import {
  LAYOUTS,
  OPTION_COLORS,
  type ColorRule,
  type Density,
  type FilterRule,
  type Layout,
  type OptionColor,
  type PropertyDef,
  type SortRule,
  type ViewConfig,
} from "./types";

const uid = () => crypto.randomUUID();

function Row({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: typeof Filter;
  label: string;
  value?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left text-[0.875rem] transition-colors hover:bg-secondary"
    >
      <Icon size={15} strokeWidth={1.6} className="shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {value != null ? (
        <span className="max-w-[7rem] truncate text-[0.8125rem] text-muted-foreground">
          {value}
        </span>
      ) : null}
      <ChevronRight size={14} strokeWidth={1.6} className="shrink-0 text-muted-foreground" />
    </button>
  );
}

function PanelHeader({
  title,
  onBack,
  onClose,
}: {
  title: string;
  onBack?: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      {onBack ? (
        <button
          type="button"
          aria-label="Retour"
          onClick={onBack}
          className="press grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
        >
          <ArrowLeft size={15} strokeWidth={1.6} />
        </button>
      ) : null}
      <p className="flex-1 font-display text-[0.9375rem]">{title}</p>
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="press grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
      >
        <X size={15} strokeWidth={1.6} />
      </button>
    </div>
  );
}

function PropertySelect({
  properties,
  value,
  onChange,
  className,
}: {
  properties: PropertyDef[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("h-8 text-[0.78rem]", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {properties.map((p) => {
          const Icon = PROPERTY_ICONS[p.type];
          return (
            <SelectItem key={p.id} value={p.id}>
              <span className="flex items-center gap-2">
                <Icon size={13} strokeWidth={1.6} className="text-muted-foreground" />
                {p.name}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function ColorSwatchSelect({
  value,
  onChange,
}: {
  value: OptionColor;
  onChange: (v: OptionColor) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {OPTION_COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          title={c.label}
          aria-label={c.label}
          onClick={() => onChange(c.id)}
          style={{ backgroundColor: c.bg }}
          className={cn(
            "press size-5 rounded-full border transition-transform",
            value === c.id ? "border-foreground scale-110" : "border-border/60",
          )}
        />
      ))}
    </div>
  );
}

/** Liste réordonnable par glisser-déposer. */
function useDragList<T extends { id: string }>(items: T[], onReorder: (next: T[]) => void) {
  const [dragId, setDragId] = useState<string | null>(null);
  const handlers = (item: T) => ({
    draggable: true,
    onDragStart: () => setDragId(item.id),
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: () => {
      if (!dragId || dragId === item.id) return;
      const rest = items.filter((i) => i.id !== dragId);
      const moved = items.find((i) => i.id === dragId);
      if (!moved) return;
      const at = rest.findIndex((i) => i.id === item.id);
      rest.splice(at < 0 ? rest.length : at, 0, moved);
      onReorder(rest);
      setDragId(null);
    },
  });
  return handlers;
}

export function FilterPanel({
  properties,
  config,
  patch,
}: {
  properties: PropertyDef[];
  config: ViewConfig;
  patch: (next: Partial<ViewConfig>) => void;
}) {
  const [query, setQuery] = useState("");
  const suggestions = properties.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const addFilter = (propertyId: string) => {
    const prop = properties.find((p) => p.id === propertyId);
    patch({
      filters: [
        ...config.filters,
        {
          id: uid(),
          propertyId,
          op: operatorsFor(prop?.type ?? "text")[0]!.op,
          value: "",
        },
      ],
    });
    setQuery("");
  };

  return (
    <div className="space-y-2">
      {config.filters.length > 0 ? (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.75rem] uppercase tracking-[0.08em] text-muted-foreground">
            Combinaison
          </span>
          <Select
            value={config.filterJoin}
            onValueChange={(v) => patch({ filterJoin: v as "and" | "or" })}
          >
            <SelectTrigger className="h-7 w-[9rem] text-[0.75rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="and">Tout (ET)</SelectItem>
              <SelectItem value="or">Au moins un (OU)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {config.filters.map((rule) => {
        const prop = properties.find((p) => p.id === rule.propertyId);
        const needsValue = ![
          "empty",
          "not_empty",
          "checked",
          "unchecked",
          "today",
          "this_week",
          "this_month",
        ].includes(rule.op);
        const update = (next: Partial<FilterRule>) =>
          patch({
            filters: config.filters.map((f) => (f.id === rule.id ? { ...f, ...next } : f)),
          });
        return (
          <div key={rule.id} className="flex items-center gap-1.5">
            <PropertySelect
              properties={properties}
              value={rule.propertyId}
              onChange={(v) => {
                const target = properties.find((p) => p.id === v);
                update({ propertyId: v, op: operatorsFor(target?.type ?? "text")[0]!.op });
              }}
              className="flex-1"
            />
            <Select value={rule.op} onValueChange={(v) => update({ op: v as FilterRule["op"] })}>
              <SelectTrigger className="h-8 w-[7.5rem] text-[0.78rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operatorsFor(prop?.type ?? "text").map((o) => (
                  <SelectItem key={o.op} value={o.op}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {needsValue ? (
              prop?.options?.length ? (
                <Select value={rule.value ?? ""} onValueChange={(v) => update({ value: v })}>
                  <SelectTrigger className="h-8 w-[6.5rem] text-[0.78rem]">
                    <SelectValue placeholder="Valeur" />
                  </SelectTrigger>
                  <SelectContent>
                    {prop.options.map((o) => (
                      <SelectItem key={o.id} value={o.label}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={rule.value ?? ""}
                  onChange={(e) => update({ value: e.target.value })}
                  type={
                    ["date", "created_time", "last_edited_time"].includes(prop?.type ?? "")
                      ? "date"
                      : "text"
                  }
                  className="h-8 w-[6.5rem] text-[0.78rem]"
                  placeholder="Valeur"
                />
              )
            ) : null}
            <button
              type="button"
              aria-label="Retirer le filtre"
              onClick={() => patch({ filters: config.filters.filter((f) => f.id !== rule.id) })}
              className="press grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
            >
              <X size={14} strokeWidth={1.6} />
            </button>
          </div>
        );
      })}

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filtrer par…"
        className="h-9 text-[0.8125rem]"
      />
      <ul className="max-h-52 space-y-0.5 overflow-y-auto">
        {suggestions.map((p) => {
          const Icon = PROPERTY_ICONS[p.type];
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => addFilter(p.id)}
                className="press flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left text-[0.875rem] hover:bg-secondary"
              >
                <Icon size={15} strokeWidth={1.6} className="text-muted-foreground" />
                <span className="truncate">{p.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SortPanel({
  properties,
  config,
  patch,
}: {
  properties: PropertyDef[];
  config: ViewConfig;
  patch: (next: Partial<ViewConfig>) => void;
}) {
  const [query, setQuery] = useState("");
  const drag = useDragList(config.sorts, (sorts) => patch({ sorts }));
  const suggestions = properties.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="space-y-2">
      {config.sorts.map((rule) => {
        const update = (next: Partial<SortRule>) =>
          patch({ sorts: config.sorts.map((s) => (s.id === rule.id ? { ...s, ...next } : s)) });
        return (
          <div
            key={rule.id}
            {...drag(rule)}
            className="flex items-center gap-1.5 rounded-[10px] bg-secondary/40 px-1.5 py-1"
          >
            <GripVertical
              size={14}
              strokeWidth={1.6}
              className="shrink-0 cursor-grab text-muted-foreground"
            />
            <PropertySelect
              properties={properties}
              value={rule.propertyId}
              onChange={(v) => update({ propertyId: v })}
              className="flex-1"
            />
            <Select value={rule.dir} onValueChange={(v) => update({ dir: v as SortRule["dir"] })}>
              <SelectTrigger className="h-8 w-[7rem] text-[0.78rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Croissant</SelectItem>
                <SelectItem value="desc">Décroissant</SelectItem>
              </SelectContent>
            </Select>
            <button
              type="button"
              aria-label="Retirer le tri"
              onClick={() => patch({ sorts: config.sorts.filter((s) => s.id !== rule.id) })}
              className="press grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
            >
              <X size={14} strokeWidth={1.6} />
            </button>
          </div>
        );
      })}

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Trier par…"
        className="h-9 text-[0.8125rem]"
      />
      <ul className="max-h-52 space-y-0.5 overflow-y-auto">
        {suggestions.map((p) => {
          const Icon = PROPERTY_ICONS[p.type];
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  patch({ sorts: [...config.sorts, { id: uid(), propertyId: p.id, dir: "asc" }] });
                  setQuery("");
                }}
                className="press flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left text-[0.875rem] hover:bg-secondary"
              >
                <Icon size={15} strokeWidth={1.6} className="text-muted-foreground" />
                <span className="truncate">{p.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ColorPanel({
  properties,
  config,
  patch,
  defaultProperty,
}: {
  properties: PropertyDef[];
  config: ViewConfig;
  patch: (next: Partial<ViewConfig>) => void;
  defaultProperty: string;
}) {
  const drag = useDragList(config.colors, (colors) => patch({ colors }));

  return (
    <div className="space-y-2">
      <p className="text-[0.8125rem] leading-snug text-muted-foreground">
        Personnalisez les couleurs pour distinguer les catégories et mettre en évidence les éléments
        en retard.
      </p>

      {config.colors.map((rule) => {
        const prop = properties.find((p) => p.id === rule.propertyId);
        const update = (next: Partial<ColorRule>) =>
          patch({ colors: config.colors.map((c) => (c.id === rule.id ? { ...c, ...next } : c)) });
        return (
          <div
            key={rule.id}
            {...drag(rule)}
            className="space-y-2 rounded-[12px] border border-border p-2"
          >
            <div className="flex items-center gap-1.5">
              <GripVertical
                size={14}
                strokeWidth={1.6}
                className="shrink-0 cursor-grab text-muted-foreground"
              />
              <PropertySelect
                properties={properties}
                value={rule.propertyId}
                onChange={(v) => {
                  const target = properties.find((p) => p.id === v);
                  update({ propertyId: v, op: operatorsFor(target?.type ?? "text")[0]!.op });
                }}
                className="flex-1"
              />
              <button
                type="button"
                aria-label="Retirer la règle"
                onClick={() => patch({ colors: config.colors.filter((c) => c.id !== rule.id) })}
                className="press grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
              >
                <X size={14} strokeWidth={1.6} />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <Select value={rule.op} onValueChange={(v) => update({ op: v as ColorRule["op"] })}>
                <SelectTrigger className="h-8 w-[7.5rem] text-[0.78rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operatorsFor(prop?.type ?? "text").map((o) => (
                    <SelectItem key={o.op} value={o.op}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={rule.value ?? ""}
                onChange={(e) => update({ value: e.target.value })}
                className="h-8 flex-1 text-[0.78rem]"
                placeholder="Valeur"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <ColorSwatchSelect value={rule.color} onChange={(color) => update({ color })} />
              <span
                className="rounded-full px-2 py-0.5 text-[0.75rem]"
                style={{
                  backgroundColor: colorTokens(rule.color).bg,
                  color: colorTokens(rule.color).fg,
                }}
              >
                Aperçu
              </span>
            </div>
          </div>
        );
      })}

      <Button
        size="sm"
        className="w-full"
        onClick={() =>
          patch({
            colors: [
              ...config.colors,
              { id: uid(), propertyId: defaultProperty, op: "is", value: "", color: "blue" },
            ],
          })
        }
      >
        <Plus size={14} strokeWidth={1.8} /> Nouveau paramètre de couleur
      </Button>
    </div>
  );
}

export function PropertyVisibilityPanel({
  properties,
  config,
  patch,
  onEdit,
  onCreate,
}: {
  properties: PropertyDef[];
  config: ViewConfig;
  patch: (next: Partial<ViewConfig>) => void;
  onEdit: (p: PropertyDef) => void;
  onCreate: () => void;
}) {
  const [query, setQuery] = useState("");
  const list = properties.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()));
  const allHidden = properties.every((p) => config.hiddenProps.includes(p.id));

  return (
    <div className="space-y-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher une propriété…"
        className="h-9 text-[0.8125rem]"
      />
      <div className="flex items-center justify-between">
        <span className="text-[0.75rem] uppercase tracking-[0.08em] text-muted-foreground">
          Affiché dans la vue
        </span>
        <button
          type="button"
          onClick={() => patch({ hiddenProps: allHidden ? [] : properties.map((p) => p.id) })}
          className="press text-[0.8125rem] text-brand hover:underline"
        >
          {allHidden ? "Tout afficher" : "Tout masquer"}
        </button>
      </div>
      <ul className="max-h-64 space-y-0.5 overflow-y-auto">
        {list.map((p) => {
          const Icon = PROPERTY_ICONS[p.type];
          const visible = !config.hiddenProps.includes(p.id);
          return (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-[10px] px-1 py-1 hover:bg-secondary/60"
            >
              <GripVertical size={13} strokeWidth={1.6} className="text-muted-foreground/70" />
              <Icon size={15} strokeWidth={1.6} className="text-muted-foreground" />
              <button
                type="button"
                onClick={() => onEdit(p)}
                className="min-w-0 flex-1 truncate text-left text-[0.875rem] hover:underline"
              >
                {p.name}
              </button>
              <button
                type="button"
                aria-label={visible ? `Masquer ${p.name}` : `Afficher ${p.name}`}
                onClick={() =>
                  patch({
                    hiddenProps: visible
                      ? [...config.hiddenProps, p.id]
                      : config.hiddenProps.filter((id) => id !== p.id),
                  })
                }
                className="press grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
              >
                {visible ? (
                  <Eye size={15} strokeWidth={1.6} />
                ) : (
                  <EyeOff size={15} strokeWidth={1.6} className="opacity-50" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <Button variant="secondary" size="sm" className="w-full" onClick={onCreate}>
        <Plus size={14} strokeWidth={1.7} /> Nouvelle propriété
      </Button>
    </div>
  );
}

export type SettingsPage =
  "root" | "layout" | "properties" | "filter" | "sort" | "group" | "colors";

export function ViewSettingsPanel({
  viewName,
  viewEmoji,
  layout,
  layouts,
  properties,
  config,
  patch,
  onLayoutChange,
  onCopyLink,
  onEditProperty,
  onCreateProperty,
  onClose,
  defaultColorProperty,
}: {
  viewName: string;
  viewEmoji: string;
  layout: Layout;
  layouts: Layout[];
  properties: PropertyDef[];
  config: ViewConfig;
  patch: (next: Partial<ViewConfig>) => void;
  onLayoutChange: (l: Layout) => void;
  onCopyLink: () => void;
  onEditProperty: (p: PropertyDef) => void;
  onCreateProperty: () => void;
  onClose: () => void;
  defaultColorProperty: string;
}) {
  const [page, setPage] = useState<SettingsPage>("root");
  const back = () => setPage("root");
  const visibleCount = properties.filter((p) => !config.hiddenProps.includes(p.id)).length;

  if (page === "layout") {
    const LayoutIcon = LAYOUT_ICONS[layout];
    return (
      <div>
        <PanelHeader title="Disposition" onBack={back} onClose={onClose} />
        <div className="grid grid-cols-3 gap-2">
          {LAYOUTS.filter((l) => layouts.includes(l.id)).map((l) => {
            const Icon = LAYOUT_ICONS[l.id];
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onLayoutChange(l.id)}
                className={cn(
                  "press flex flex-col items-center gap-1.5 rounded-[12px] border p-3 text-[0.75rem] transition-colors",
                  l.id === layout
                    ? "border-brand text-brand"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                <Icon size={17} strokeWidth={1.6} />
                {l.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <div className="space-y-1.5">
            <Label>Densité d'affichage</Label>
            <Select value={config.density} onValueChange={(v) => patch({ density: v as Density })}>
              <SelectTrigger className="h-8 text-[0.8125rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="comfortable">Confortable</SelectItem>
                <SelectItem value="spacious">Spacieux</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Éléments par page</Label>
            <Select
              value={String(config.pageSize)}
              onValueChange={(v) => patch({ pageSize: Number(v) })}
            >
              <SelectTrigger className="h-8 text-[0.8125rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} éléments
                  </SelectItem>
                ))}
                <SelectItem value="0">Sans limite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="flex items-center gap-2 text-[0.75rem] text-muted-foreground">
            <LayoutIcon size={13} strokeWidth={1.6} /> {viewEmoji} {viewName}
          </p>
        </div>
      </div>
    );
  }

  if (page === "properties")
    return (
      <div>
        <PanelHeader title="Visibilité des propriétés" onBack={back} onClose={onClose} />
        <PropertyVisibilityPanel
          properties={properties}
          config={config}
          patch={patch}
          onEdit={onEditProperty}
          onCreate={onCreateProperty}
        />
      </div>
    );

  if (page === "filter")
    return (
      <div>
        <PanelHeader title="Filtrer" onBack={back} onClose={onClose} />
        <FilterPanel properties={properties} config={config} patch={patch} />
      </div>
    );

  if (page === "sort")
    return (
      <div>
        <PanelHeader title="Trier" onBack={back} onClose={onClose} />
        <SortPanel properties={properties} config={config} patch={patch} />
      </div>
    );

  if (page === "colors")
    return (
      <div>
        <PanelHeader title="Couleur conditionnelle" onBack={back} onClose={onClose} />
        <ColorPanel
          properties={properties}
          config={config}
          patch={patch}
          defaultProperty={defaultColorProperty}
        />
      </div>
    );

  if (page === "group")
    return (
      <div>
        <PanelHeader title="Grouper" onBack={back} onClose={onClose} />
        <div className="space-y-1.5">
          <Label>Regrouper par</Label>
          <Select value={config.groupBy ?? ""} onValueChange={(v) => patch({ groupBy: v })}>
            <SelectTrigger className="h-8 text-[0.8125rem]">
              <SelectValue placeholder="Aucun regroupement" />
            </SelectTrigger>
            <SelectContent>
              {properties
                .filter((p) =>
                  ["select", "status", "multi_select", "person", "checkbox", "text"].includes(
                    p.type,
                  ),
                )
                .map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {config.groupBy ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => patch({ groupBy: "" })}
            >
              <Trash2 size={14} strokeWidth={1.6} /> Retirer le regroupement
            </Button>
          ) : null}
        </div>
      </div>
    );

  const LayoutIcon = LAYOUT_ICONS[layout];
  return (
    <div>
      <PanelHeader title="Afficher les paramètres" onClose={onClose} />
      <div className="mb-2 flex items-center gap-2 rounded-[12px] border border-border px-2 py-1.5">
        <LayoutIcon size={15} strokeWidth={1.6} className="text-muted-foreground" />
        <span className="truncate text-[0.875rem] font-medium">
          {viewEmoji ? `${viewEmoji} ` : ""}
          {viewName}
        </span>
      </div>
      <div className="space-y-0.5">
        <Row
          icon={LayoutIcon}
          label="Disposition"
          value={LAYOUTS.find((l) => l.id === layout)?.label}
          onClick={() => setPage("layout")}
        />
        <Row
          icon={Eye}
          label="Visibilité des propriétés"
          value={visibleCount}
          onClick={() => setPage("properties")}
        />
        <Row
          icon={Filter}
          label="Filtrer"
          value={config.filters.length || undefined}
          onClick={() => setPage("filter")}
        />
        <Row
          icon={ArrowDownUp}
          label="Trier"
          value={config.sorts.length || undefined}
          onClick={() => setPage("sort")}
        />
        <Row
          icon={Layers}
          label="Grouper"
          value={properties.find((p) => p.id === config.groupBy)?.name}
          onClick={() => setPage("group")}
        />
        <Row
          icon={PaintRoller}
          label="Couleur conditionnelle"
          value={config.colors.length || undefined}
          onClick={() => setPage("colors")}
        />
        <button
          type="button"
          onClick={onCopyLink}
          className="press flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left text-[0.875rem] hover:bg-secondary"
        >
          <Link2 size={15} strokeWidth={1.6} className="text-muted-foreground" />
          Copier le lien de la vue
        </button>
      </div>
      <div className="mt-3 space-y-0.5 border-t border-border pt-3">
        <p className="px-2 pb-1 text-[0.75rem] uppercase tracking-[0.08em] text-muted-foreground">
          Paramètres de la source de données
        </p>
        <Row
          icon={ListChecks}
          label="Modifier les propriétés"
          onClick={() => setPage("properties")}
        />
        <button
          type="button"
          onClick={onCreateProperty}
          className="press flex w-full items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-left text-[0.875rem] hover:bg-secondary"
        >
          <Plus size={15} strokeWidth={1.6} className="text-muted-foreground" />
          Nouvelle propriété
        </button>
      </div>
    </div>
  );
}
