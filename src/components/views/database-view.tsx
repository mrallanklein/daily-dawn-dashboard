import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  Copy,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  Maximize2,
  Minimize2,
  Pencil,
  Palette,
  Plus,
  Search,
  Settings2,
  Share2,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  applyFilters,
  applySorts,
  colorTokens,
  operatorsFor,
  rowColor,
  searchRows,
  visibleProps,
} from "./engine";
import {
  CalendarLayout,
  GalleryLayout,
  KanbanLayout,
  ListLayout,
  TableLayout,
  TimelineLayout,
} from "./layouts";
import { PropertyEditor } from "./property-editor";
import {
  DEFAULT_CONFIG,
  LAYOUTS,
  OPTION_COLORS,
  type ColorRule,
  type DataSource,
  type Density,
  type FilterRule,
  type Layout,
  type OptionColor,
  type PropertyDef,
  type SortRule,
  type ViewConfig,
} from "./types";
import { useModuleViews } from "./use-views";

const LAYOUT_COMPONENT = {
  table: TableLayout,
  kanban: KanbanLayout,
  calendar: CalendarLayout,
  timeline: TimelineLayout,
  gallery: GalleryLayout,
  list: ListLayout,
} as const;

function ToolButton({
  icon: Icon,
  label,
  count,
  active,
}: {
  icon: typeof Filter;
  label: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        "press inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-2.5 text-[0.8125rem] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
        active && "border-transparent bg-secondary text-foreground",
      )}
    >
      <Icon size={14} strokeWidth={1.6} />
      <span className="hidden sm:inline">{label}</span>
      {count ? <span className="text-brand">{count}</span> : null}
    </span>
  );
}

export function DatabaseView({
  source,
  layouts = ["table", "kanban", "calendar", "timeline", "gallery", "list"],
  actions,
}: {
  source: DataSource;
  layouts?: Layout[];
  actions?: React.ReactNode;
}) {
  const {
    views,
    customProps,
    entryValues,
    createView,
    updateView,
    duplicateView,
    reorderViews,
    deleteView,
    saveProperty,
    deleteProperty,
  } = useModuleViews(source.module, layouts);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyDef | null>(null);
  const [newViewName, setNewViewName] = useState("");
  const [newViewLayout, setNewViewLayout] = useState<Layout>("table");
  const [newViewEmoji, setNewViewEmoji] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [dragTab, setDragTab] = useState<string | null>(null);

  const tabs = views.filter((v) => !v.hidden);
  const view = views.find((v) => v.id === activeId) ?? tabs[0] ?? views[0];
  const config: ViewConfig = view?.config ?? DEFAULT_CONFIG;

  const properties = useMemo<PropertyDef[]>(
    () => [...source.properties, ...customProps],
    [source.properties, customProps],
  );

  const rows = useMemo(
    () =>
      source.rows.map((row) => ({
        ...row,
        values: { ...row.values, ...(entryValues[row.id] ?? {}) },
      })),
    [source.rows, entryValues],
  );

  const patch = (next: Partial<ViewConfig>) => {
    if (!view) return;
    updateView.mutate({
      id: view.id,
      patch: { config: { ...config, ...next } },
      base: view,
    });
  };

  const shown = useMemo(() => {
    const filtered = applyFilters(rows, config.filters, config.filterJoin);
    const searched = searchRows(filtered, query);
    const sorted = applySorts(searched, config.sorts, properties);
    return config.pageSize > 0 ? sorted.slice(0, config.pageSize) : sorted;
  }, [rows, config, query, properties]);

  const cols = visibleProps(properties, config);
  const LayoutComponent = LAYOUT_COMPONENT[view?.layout ?? "table"];

  const enrichedSource: DataSource = { ...source, properties };

  return (
    <section
      className={cn(
        "space-y-3",
        fullscreen && "fixed inset-0 z-50 overflow-y-auto bg-background p-4 sm:p-6",
      )}
    >
      {/* Onglets de vues */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        <div className="flex flex-wrap items-center gap-1">
          {tabs.map((v) => (
            <ContextMenu key={v.id}>
              <ContextMenuTrigger asChild>
                <button
                  type="button"
                  draggable
                  onDragStart={() => setDragTab(v.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (!dragTab || dragTab === v.id) return;
                    const ids = tabs.map((t) => t.id).filter((id) => id !== dragTab);
                    const at = ids.indexOf(v.id);
                    ids.splice(at < 0 ? ids.length : at, 0, dragTab);
                    reorderViews.mutate(ids);
                    setDragTab(null);
                  }}
                  onClick={() => setActiveId(v.id)}
                  onDoubleClick={() => {
                    setRenameId(v.id);
                    setRenameValue(v.name);
                  }}
                  className={cn(
                    "press h-8 rounded-full px-3 text-[0.8125rem] transition-colors",
                    v.id === view?.id
                      ? "bg-secondary font-medium text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60",
                  )}
                >
                  {v.emoji ? <span className="mr-1">{v.emoji}</span> : null}
                  {v.name}
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-52">
                <ContextMenuItem
                  onSelect={() => {
                    setRenameId(v.id);
                    setRenameValue(v.name);
                  }}
                >
                  <Pencil size={14} strokeWidth={1.6} /> Renommer
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => duplicateView.mutate(v.id)}>
                  <Copy size={14} strokeWidth={1.6} /> Dupliquer
                </ContextMenuItem>
                <ContextMenuItem
                  onSelect={() =>
                    updateView.mutate({ id: v.id, patch: { hidden: true }, base: v })
                  }
                >
                  <EyeOff size={14} strokeWidth={1.6} /> Masquer
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={() => setManageOpen(true)}>
                  <SlidersHorizontal size={14} strokeWidth={1.6} /> Gérer les vues
                </ContextMenuItem>
                {v.id.startsWith("default:") ? null : (
                  <ContextMenuItem
                    className="text-destructive"
                    onSelect={() => {
                      deleteView.mutate(v.id);
                      setActiveId(null);
                    }}
                  >
                    <Trash2 size={14} strokeWidth={1.6} /> Supprimer
                  </ContextMenuItem>
                )}
              </ContextMenuContent>
            </ContextMenu>
          ))}

          <Popover>
            <PopoverTrigger aria-label="Nouvelle vue" className="press grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary">
              <Plus size={15} strokeWidth={1.6} />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 space-y-3">
              <div className="flex items-end gap-2">
                <div className="w-14 space-y-1.5">
                  <Label htmlFor="view-emoji">Emoji</Label>
                  <Input
                    id="view-emoji"
                    value={newViewEmoji}
                    onChange={(e) => setNewViewEmoji(e.target.value.slice(0, 2))}
                    placeholder="🗂"
                    className="text-center"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="view-name">Nom de la vue</Label>
                  <Input
                    id="view-name"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder="Ma vue"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Disposition</Label>
                <Select value={newViewLayout} onValueChange={(v) => setNewViewLayout(v as Layout)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYOUTS.filter((l) => layouts.includes(l.id)).map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                size="sm"
                onClick={() => {
                  createView.mutate(
                    {
                      name: newViewName.trim() || "Vue",
                      emoji: newViewEmoji,
                      layout: newViewLayout,
                    },
                    {
                      onSuccess: () => {
                        setNewViewName("");
                        setNewViewEmoji("");
                      },
                    },
                  );
                }}
              >
                Créer la vue
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setManageOpen(true)}
              >
                Gérer les vues
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Recherche */}
          <div className="relative">
            <Search
              size={14}
              strokeWidth={1.6}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher"
              className="h-8 w-[9rem] rounded-full pl-8 text-[0.8125rem]"
            />
          </div>

          {/* Filtres */}
          <Popover>
            <PopoverTrigger>
              <ToolButton
                icon={Filter}
                label="Filtre"
                count={config.filters.length}
                active={config.filters.length > 0}
              />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[22rem] space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[0.8125rem] font-medium">Filtres</p>
                <Select
                  value={config.filterJoin}
                  onValueChange={(v) => patch({ filterJoin: v as "and" | "or" })}
                >
                  <SelectTrigger className="h-7 w-24 text-[0.75rem]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="and">Tout (ET)</SelectItem>
                    <SelectItem value="or">Au moins un (OU)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.filters.map((rule) => {
                const prop = properties.find((p) => p.id === rule.propertyId);
                return (
                  <div key={rule.id} className="flex items-center gap-1.5">
                    <Select
                      value={rule.propertyId}
                      onValueChange={(v) =>
                        patch({
                          filters: config.filters.map((f) =>
                            f.id === rule.id ? { ...f, propertyId: v } : f,
                          ),
                        })
                      }
                    >
                      <SelectTrigger className="h-8 flex-1 text-[0.78rem]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={rule.op}
                      onValueChange={(v) =>
                        patch({
                          filters: config.filters.map((f) =>
                            f.id === rule.id ? { ...f, op: v as FilterRule["op"] } : f,
                          ),
                        })
                      }
                    >
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
                      onChange={(e) =>
                        patch({
                          filters: config.filters.map((f) =>
                            f.id === rule.id ? { ...f, value: e.target.value } : f,
                          ),
                        })
                      }
                      className="h-8 w-[5.5rem] text-[0.78rem]"
                      placeholder="Valeur"
                    />
                    <button
                      type="button"
                      aria-label="Retirer le filtre"
                      onClick={() =>
                        patch({ filters: config.filters.filter((f) => f.id !== rule.id) })
                      }
                      className="press grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
                    >
                      <X size={14} strokeWidth={1.6} />
                    </button>
                  </div>
                );
              })}

              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() =>
                  patch({
                    filters: [
                      ...config.filters,
                      {
                        id: crypto.randomUUID(),
                        propertyId: properties[0]?.id ?? source.titleProp,
                        op: "contains",
                        value: "",
                      },
                    ],
                  })
                }
              >
                <Plus size={14} strokeWidth={1.6} /> Ajouter un filtre
              </Button>
            </PopoverContent>
          </Popover>

          {/* Tris */}
          <Popover>
            <PopoverTrigger>
              <ToolButton
                icon={ArrowDownUp}
                label="Trier"
                count={config.sorts.length}
                active={config.sorts.length > 0}
              />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[20rem] space-y-2">
              <p className="text-[0.8125rem] font-medium">Tris</p>
              {config.sorts.map((rule, index) => (
                <div key={rule.id} className="flex items-center gap-1.5">
                  <Select
                    value={rule.propertyId}
                    onValueChange={(v) =>
                      patch({
                        sorts: config.sorts.map((s) =>
                          s.id === rule.id ? { ...s, propertyId: v } : s,
                        ),
                      })
                    }
                  >
                    <SelectTrigger className="h-8 flex-1 text-[0.78rem]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={rule.dir}
                    onValueChange={(v) =>
                      patch({
                        sorts: config.sorts.map((s) =>
                          s.id === rule.id ? { ...s, dir: v as SortRule["dir"] } : s,
                        ),
                      })
                    }
                  >
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
                    aria-label="Monter le tri"
                    disabled={index === 0}
                    onClick={() => {
                      const next = [...config.sorts];
                      const prev = next[index - 1]!;
                      next[index - 1] = next[index]!;
                      next[index] = prev;
                      patch({ sorts: next });
                    }}
                    className="press grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="Retirer le tri"
                    onClick={() => patch({ sorts: config.sorts.filter((s) => s.id !== rule.id) })}
                    className="press grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
                  >
                    <X size={14} strokeWidth={1.6} />
                  </button>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() =>
                  patch({
                    sorts: [
                      ...config.sorts,
                      {
                        id: crypto.randomUUID(),
                        propertyId: properties[0]?.id ?? source.titleProp,
                        dir: "asc",
                      },
                    ],
                  })
                }
              >
                <Plus size={14} strokeWidth={1.6} /> Ajouter un tri
              </Button>
            </PopoverContent>
          </Popover>

          {/* Couleurs conditionnelles */}
          <Popover>
            <PopoverTrigger>
              <ToolButton
                icon={Palette}
                label="Couleurs"
                count={config.colors.length}
                active={config.colors.length > 0}
              />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[22rem] space-y-2">
              <p className="text-[0.8125rem] font-medium">Couleurs conditionnelles</p>
              {config.colors.map((rule) => {
                const prop = properties.find((p) => p.id === rule.propertyId);
                return (
                  <div key={rule.id} className="flex items-center gap-1.5">
                    <Select
                      value={rule.propertyId}
                      onValueChange={(v) =>
                        patch({
                          colors: config.colors.map((c) =>
                            c.id === rule.id ? { ...c, propertyId: v } : c,
                          ),
                        })
                      }
                    >
                      <SelectTrigger className="h-8 flex-1 text-[0.78rem]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={rule.op}
                      onValueChange={(v) =>
                        patch({
                          colors: config.colors.map((c) =>
                            c.id === rule.id ? { ...c, op: v as ColorRule["op"] } : c,
                          ),
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-[7rem] text-[0.78rem]">
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
                      onChange={(e) =>
                        patch({
                          colors: config.colors.map((c) =>
                            c.id === rule.id ? { ...c, value: e.target.value } : c,
                          ),
                        })
                      }
                      className="h-8 w-[4.5rem] text-[0.78rem]"
                      placeholder="Valeur"
                    />
                    <Select
                      value={rule.color}
                      onValueChange={(v) =>
                        patch({
                          colors: config.colors.map((c) =>
                            c.id === rule.id ? { ...c, color: v as OptionColor } : c,
                          ),
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-[4.5rem]">
                        <span
                          className="size-3.5 rounded-full"
                          style={{ backgroundColor: colorTokens(rule.color).bg }}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {OPTION_COLORS.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="flex items-center gap-2">
                              <span
                                className="size-3 rounded-full"
                                style={{ backgroundColor: colorTokens(c.id).bg }}
                              />
                              {c.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      aria-label="Retirer la règle"
                      onClick={() =>
                        patch({ colors: config.colors.filter((c) => c.id !== rule.id) })
                      }
                      className="press grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
                    >
                      <X size={14} strokeWidth={1.6} />
                    </button>
                  </div>
                );
              })}
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() =>
                  patch({
                    colors: [
                      ...config.colors,
                      {
                        id: crypto.randomUUID(),
                        propertyId: source.statusProp ?? properties[0]?.id ?? source.titleProp,
                        op: "is",
                        value: "",
                        color: "blue",
                      },
                    ],
                  })
                }
              >
                <Plus size={14} strokeWidth={1.6} /> Ajouter une règle
              </Button>
            </PopoverContent>
          </Popover>

          {/* Paramètres de vue */}
          <Popover>
            <PopoverTrigger>
              <ToolButton icon={Settings2} label="Paramètres" />
            </PopoverTrigger>
            <PopoverContent align="end" className="max-h-[26rem] w-[20rem] space-y-3 overflow-y-auto">
              <div className="space-y-1.5">
                <Label>Disposition</Label>
                <Select
                  value={view?.layout ?? "table"}
                  onValueChange={(v) =>
                    view && updateView.mutate({ id: view.id, patch: { layout: v }, base: view })
                  }
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYOUTS.filter((l) => layouts.includes(l.id)).map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {view?.layout === "kanban" ? (
                <div className="space-y-1.5">
                  <Label>Regrouper par</Label>
                  <Select
                    value={config.groupBy ?? source.statusProp ?? ""}
                    onValueChange={(v) => patch({ groupBy: v })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties
                        .filter((p) => ["select", "status", "person", "text"].includes(p.type))
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label>Densité</Label>
                <Select
                  value={config.density}
                  onValueChange={(v) => patch({ density: v as Density })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Standard</SelectItem>
                    <SelectItem value="spacious">Spacieux</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Éléments affichés</Label>
                <Select
                  value={String(config.pageSize)}
                  onValueChange={(v) => patch({ pageSize: Number(v) })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} éléments
                      </SelectItem>
                    ))}
                    <SelectItem value="0">Tous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <SlidersHorizontal size={14} strokeWidth={1.6} /> Propriétés
                </Label>
                <ul className="space-y-1">
                  {properties.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(p);
                          setEditorOpen(true);
                        }}
                        className="min-w-0 flex-1 truncate text-left text-[0.8125rem] hover:underline"
                      >
                        {p.name}
                      </button>
                      <Switch
                        checked={!config.hiddenProps.includes(p.id)}
                        onCheckedChange={(on) =>
                          patch({
                            hiddenProps: on
                              ? config.hiddenProps.filter((id) => id !== p.id)
                              : [...config.hiddenProps, p.id],
                          })
                        }
                      />
                    </li>
                  ))}
                </ul>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setEditing(null);
                    setEditorOpen(true);
                  }}
                >
                  <Plus size={14} strokeWidth={1.6} /> Nouvelle propriété
                </Button>
              </div>

              <div className="flex items-center gap-2 border-t border-border pt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    if (!view) return;
                    const token = view.share_token ?? crypto.randomUUID().slice(0, 12);
                    updateView.mutate({ id: view.id, patch: { share_token: token }, base: view });
                    void navigator.clipboard?.writeText(
                      `${window.location.origin}/partage/${token}`,
                    );
                    toast.success("Lien de partage copié");
                  }}
                >
                  <Share2 size={14} strokeWidth={1.6} /> Partager
                </Button>
                {view && !view.id.startsWith("default:") ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      deleteView.mutate(view.id);
                      setActiveId(null);
                    }}
                  >
                    <Trash2 size={14} strokeWidth={1.6} />
                  </Button>
                ) : null}
              </div>
            </PopoverContent>
          </Popover>

          <Select
            value={String(config.pageSize)}
            onValueChange={(v) => patch({ pageSize: Number(v) })}
          >
            <SelectTrigger
              aria-label="Éléments par page"
              className="h-8 w-[6.5rem] rounded-full text-[0.8125rem]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / page
                </SelectItem>
              ))}
              <SelectItem value="0">Sans limite</SelectItem>
            </SelectContent>
          </Select>

          <button
            type="button"
            aria-label={fullscreen ? "Quitter le plein écran" : "Ouvrir en page entière"}
            onClick={() => setFullscreen((v) => !v)}
            className="press grid size-8 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {fullscreen ? (
              <Minimize2 size={14} strokeWidth={1.6} />
            ) : (
              <Maximize2 size={14} strokeWidth={1.6} />
            )}
          </button>

          {actions}
          {source.onCreate ? (
            <Button size="sm" className="h-8 rounded-full" onClick={source.onCreate}>
              <Plus size={14} strokeWidth={1.8} /> Nouveau
            </Button>
          ) : null}
        </div>
      </div>

      {/* Rendu de la disposition */}
      {source.isLoading ? (
        <div className="h-40 animate-pulse rounded-[16px] border border-border bg-secondary/40" />
      ) : shown.length === 0 ? (
        <p className="rounded-[16px] border border-dashed border-border p-10 text-center text-[0.875rem] text-muted-foreground">
          Aucun élément ne correspond à cette vue.
        </p>
      ) : (
        <LayoutComponent
          source={enrichedSource}
          props={cols}
          rows={shown}
          config={config}
          colorOf={(row) => rowColor(row, config.colors)}
        />
      )}

      {/* Renommer une vue */}
      <Dialog open={Boolean(renameId)} onOpenChange={(o) => !o && setRenameId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Renommer la vue</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Nom de la vue"
          />
          <Button
            onClick={() => {
              const target = views.find((v) => v.id === renameId);
              if (target)
                updateView.mutate({
                  id: target.id,
                  patch: { name: renameValue.trim() || target.name },
                  base: target,
                });
              setRenameId(null);
            }}
          >
            Enregistrer
          </Button>
        </DialogContent>
      </Dialog>

      {/* Gérer les vues */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Gérer les vues</DialogTitle>
          </DialogHeader>
          <ul className="space-y-1.5">
            {views.map((v) => (
              <li
                key={v.id}
                className="flex items-center gap-2 rounded-[10px] border border-border px-2 py-1.5"
              >
                <GripVertical size={14} strokeWidth={1.6} className="text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate text-[0.875rem]">
                  {v.emoji ? `${v.emoji} ` : ""}
                  {v.name}
                  <span className="ml-1.5 text-[0.75rem] text-muted-foreground">
                    {LAYOUTS.find((l) => l.id === v.layout)?.label}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={v.hidden ? "Afficher la vue" : "Masquer la vue"}
                  onClick={() =>
                    updateView.mutate({ id: v.id, patch: { hidden: !v.hidden }, base: v })
                  }
                  className="press grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
                >
                  {v.hidden ? (
                    <EyeOff size={14} strokeWidth={1.6} />
                  ) : (
                    <Eye size={14} strokeWidth={1.6} />
                  )}
                </button>
                <button
                  type="button"
                  aria-label="Dupliquer la vue"
                  onClick={() => duplicateView.mutate(v.id)}
                  className="press grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
                >
                  <Copy size={14} strokeWidth={1.6} />
                </button>
                {v.id.startsWith("default:") ? null : (
                  <button
                    type="button"
                    aria-label="Supprimer la vue"
                    onClick={() => deleteView.mutate(v.id)}
                    className="press grid size-7 place-items-center rounded-md text-destructive hover:bg-secondary"
                  >
                    <Trash2 size={14} strokeWidth={1.6} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <PropertyEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        property={editing}
        properties={properties}
        onSave={(input) => saveProperty.mutate(input)}
        onDelete={(id) => deleteProperty.mutate(id)}
      />
    </section>
  );
}
