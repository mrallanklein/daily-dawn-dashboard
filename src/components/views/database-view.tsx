import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  Maximize2,
  Minimize2,
  Pencil,
  PaintRoller,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { EntryDetail } from "@/components/detail/entry-detail";
import { EmptyState, ListSkeleton } from "@/components/app/empty-state";
import { ColorPanel, FilterPanel, SortPanel, ViewSettingsPanel } from "./view-settings";
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
  onClick,
  ...rest
}: {
  icon: typeof Filter;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
} & React.ComponentPropsWithoutRef<"button">) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      {...rest}
      className={cn(
        "press relative inline-grid size-8 place-items-center rounded-[8px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
        active && "bg-secondary text-foreground",
      )}
    >
      <Icon size={16} strokeWidth={1.7} />
      {count ? (
        <span className="absolute -right-0.5 -top-0.5 grid size-[1.05rem] place-items-center rounded-full bg-brand text-[0.625rem] font-medium text-brand-foreground">
          {count}
        </span>
      ) : null}
    </button>
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

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

  const enrichedSource: DataSource = {
    ...source,
    properties,
    onOpen: source.onOpen ?? setDetailId,
  };

  const detailRow = detailId ? rows.find((r) => r.id === detailId) : null;

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
                  onSelect={() => updateView.mutate({ id: v.id, patch: { hidden: true }, base: v })}
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
            <PopoverTrigger
              aria-label="Nouvelle vue"
              className="press grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
            >
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

        <div className="ml-auto flex items-center gap-0.5">
          {/* Filtre */}
          <Popover>
            <PopoverTrigger asChild>
              <ToolButton
                icon={Filter}
                label="Filtrer"
                count={config.filters.length}
                active={config.filters.length > 0}
              />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[23rem]">
              <FilterPanel properties={properties} config={config} patch={patch} />
            </PopoverContent>
          </Popover>

          {/* Trier */}
          <Popover>
            <PopoverTrigger asChild>
              <ToolButton
                icon={ArrowDownUp}
                label="Trier"
                count={config.sorts.length}
                active={config.sorts.length > 0}
              />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[22rem]">
              <SortPanel properties={properties} config={config} patch={patch} />
            </PopoverContent>
          </Popover>

          {/* Couleurs conditionnelles */}
          <Popover>
            <PopoverTrigger asChild>
              <ToolButton
                icon={PaintRoller}
                label="Couleur conditionnelle"
                count={config.colors.length}
                active={config.colors.length > 0}
              />
            </PopoverTrigger>
            <PopoverContent align="end" className="max-h-[28rem] w-[23rem] overflow-y-auto">
              <ColorPanel
                properties={properties}
                config={config}
                patch={patch}
                defaultProperty={source.statusProp ?? properties[0]?.id ?? source.titleProp}
              />
            </PopoverContent>
          </Popover>

          {/* Recherche */}
          {searchOpen || query ? (
            <div className="relative">
              <Search
                size={14}
                strokeWidth={1.6}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onBlur={() => !query && setSearchOpen(false)}
                placeholder="Saisissez pour chercher…"
                className="h-8 w-[11rem] rounded-full pl-8 text-[0.8125rem]"
              />
            </div>
          ) : (
            <ToolButton icon={Search} label="Rechercher" onClick={() => setSearchOpen(true)} />
          )}

          {/* Plein écran */}
          <ToolButton
            icon={fullscreen ? Minimize2 : Maximize2}
            label={fullscreen ? "Quitter le plein écran" : "Ouvrir en page entière"}
            onClick={() => setFullscreen((v) => !v)}
          />

          {/* Paramètres de vue */}
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <ToolButton icon={SlidersHorizontal} label="Afficher les paramètres" />
            </PopoverTrigger>
            <PopoverContent align="end" className="max-h-[32rem] w-[22rem] overflow-y-auto">
              <ViewSettingsPanel
                viewName={view?.name ?? "Vue"}
                viewEmoji={view?.emoji ?? ""}
                layout={view?.layout ?? "table"}
                layouts={layouts}
                properties={properties}
                config={config}
                patch={patch}
                defaultColorProperty={source.statusProp ?? properties[0]?.id ?? source.titleProp}
                onLayoutChange={(l) =>
                  view && updateView.mutate({ id: view.id, patch: { layout: l }, base: view })
                }
                onCopyLink={() => {
                  if (!view) return;
                  const token = view.share_token ?? crypto.randomUUID().slice(0, 12);
                  updateView.mutate({ id: view.id, patch: { share_token: token }, base: view });
                  void navigator.clipboard?.writeText(`${window.location.origin}/partage/${token}`);
                  toast.success("Lien de la vue copié");
                }}
                onEditProperty={(p) => {
                  setEditing(p);
                  setEditorOpen(true);
                  setSettingsOpen(false);
                }}
                onCreateProperty={() => {
                  setEditing(null);
                  setEditorOpen(true);
                  setSettingsOpen(false);
                }}
                onClose={() => setSettingsOpen(false)}
              />
            </PopoverContent>
          </Popover>

          {actions}

          {/* Nouveau */}
          <div className="ml-1 flex items-center overflow-hidden rounded-full">
            {source.onCreate ? (
              <Button
                size="sm"
                className="h-8 rounded-none rounded-l-full"
                onClick={source.onCreate}
              >
                Nouveau
              </Button>
            ) : null}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  aria-label="Plus d'options de création"
                  className={cn(
                    "h-8 w-7 border-l border-primary-foreground/20 px-0",
                    source.onCreate ? "rounded-none rounded-r-full" : "rounded-full",
                  )}
                >
                  <ChevronDown size={14} strokeWidth={1.8} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 space-y-0.5 p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setEditorOpen(true);
                  }}
                  className="press flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-left text-[0.875rem] hover:bg-secondary"
                >
                  <Plus size={14} strokeWidth={1.6} /> Nouvelle propriété
                </button>
                <button
                  type="button"
                  onClick={() =>
                    createView.mutate({ name: "Vue", emoji: "", layout: view?.layout ?? "table" })
                  }
                  className="press flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-left text-[0.875rem] hover:bg-secondary"
                >
                  <Plus size={14} strokeWidth={1.6} /> Nouvelle vue
                </button>
                <button
                  type="button"
                  onClick={() => setManageOpen(true)}
                  className="press flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-left text-[0.875rem] hover:bg-secondary"
                >
                  <SlidersHorizontal size={14} strokeWidth={1.6} /> Gérer les vues
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Rendu de la disposition */}
      {source.isLoading ? (
        <ListSkeleton rows={6} />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Filter}
          title={rows.length === 0 ? `Aucun élément dans ${source.label}` : "Aucun résultat"}
          description={
            rows.length === 0
              ? "Créez votre premier élément pour commencer à remplir cette base."
              : "Aucun élément ne correspond aux filtres et à la recherche de cette vue."
          }
          action={
            rows.length === 0 && source.onCreate ? (
              <Button size="sm" onClick={source.onCreate}>
                <Plus size={14} strokeWidth={1.7} /> Nouvel élément
              </Button>
            ) : null
          }
        />
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

      <EntryDetail
        open={Boolean(detailRow)}
        onClose={() => setDetailId(null)}
        module={source.module}
        moduleLabel={source.label}
        entryId={detailRow?.id ?? null}
        title={String(detailRow?.values[source.titleProp] ?? "Sans titre")}
        properties={properties}
        values={detailRow?.values ?? {}}
        crumbs={[
          { label: source.label },
          { label: String(detailRow?.values[source.titleProp] ?? "Sans titre") },
        ]}
      />
    </section>
  );
}
