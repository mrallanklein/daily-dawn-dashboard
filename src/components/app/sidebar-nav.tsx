import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Plus,
  Sparkles,
  Table2,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  BudgetIcon,
  CalendarIcon,
  ContactIcon,
  MailIcon,
  ProjectsIcon,
  TasksIcon,
} from "@/components/icons/notion-icons";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { useWorkspace } from "@/lib/workspace";
import { updateSpace } from "@/lib/spaces";
import { createPage, deletePage, pagesQuery, updatePage, type PageKind } from "@/lib/pages";

export const NAV = [
  { to: "/projets", label: "Projets", icon: ProjectsIcon },
  { to: "/taches", label: "Tâches", icon: TasksIcon },
  { to: "/calendrier", label: "Calendrier", icon: CalendarIcon },
  { to: "/mail", label: "Boîte mail", icon: MailIcon },
  { to: "/crm", label: "CRM", icon: ContactIcon },
  { to: "/budget", label: "Budget", icon: BudgetIcon },
  { to: "/equipe", label: "Équipe", icon: Users, aliasOnly: true },
] as const;

type Item = {
  key: string;
  label: string;
  icon: typeof Users;
  to: string;
  params?: Record<string, string>;
  page?: boolean;
  emoji?: string;
};

export function SidebarNav({ open }: { open: boolean }) {
  const { workspace, space } = useWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: pages } = useQuery(pagesQuery(workspace));

  const [dragKey, setDragKey] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [kind, setKind] = useState<PageKind>("blank");
  const [renameKey, setRenameKey] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const hidden = space?.hidden_modules ?? [];
  const order = space?.module_order ?? [];
  const labels = space?.module_labels ?? {};

  const all = useMemo<Item[]>(() => {
    const natives: Item[] = NAV.filter(
      (n) => !("aliasOnly" in n && n.aliasOnly) || workspace === "alias",
    ).map((n) => ({
      key: n.to,
      to: n.to,
      label: labels[n.to] ?? n.label,
      icon: n.icon as typeof Users,
    }));
    const dynamic: Item[] = (pages ?? [])
      .filter((p) => !p.hidden)
      .map((p) => ({
        key: `page:${p.id}`,
        to: "/page/$pageId",
        params: { pageId: p.id },
        label: p.name,
        emoji: p.emoji,
        icon: p.kind === "database" ? Table2 : FileText,
        page: true,
      }));
    const merged = [...natives, ...dynamic].filter((i) => !hidden.includes(i.key));
    return merged.sort((a, b) => {
      const ia = order.indexOf(a.key);
      const ib = order.indexOf(b.key);
      return (ia < 0 ? 999 + merged.indexOf(a) : ia) - (ib < 0 ? 999 + merged.indexOf(b) : ib);
    });
  }, [pages, workspace, hidden.join(","), order.join(","), JSON.stringify(labels)]);

  const persistOrder = async (keys: string[]) => {
    if (!space) return;
    await updateSpace(space.id, { module_order: keys });
    await queryClient.invalidateQueries({ queryKey: ["spaces"] });
  };

  const move = (key: string, delta: number) => {
    const keys = all.map((i) => i.key);
    const at = keys.indexOf(key);
    const to = at + delta;
    if (at < 0 || to < 0 || to >= keys.length) return;
    keys.splice(to, 0, keys.splice(at, 1)[0]!);
    void persistOrder(keys);
  };

  const drop = (key: string) => {
    if (!dragKey || dragKey === key) return;
    const keys = all.map((i) => i.key).filter((k) => k !== dragKey);
    keys.splice(keys.indexOf(key), 0, dragKey);
    setDragKey(null);
    void persistOrder(keys);
  };

  const hide = async (item: Item) => {
    if (item.page) {
      await updatePage(item.key.slice(5), { hidden: true });
      await queryClient.invalidateQueries({ queryKey: ["workspace_pages", workspace] });
      return;
    }
    if (!space) return;
    await updateSpace(space.id, { hidden_modules: [...hidden, item.key] });
    await queryClient.invalidateQueries({ queryKey: ["spaces"] });
  };

  const showAll = async () => {
    if (space) await updateSpace(space.id, { hidden_modules: [] });
    for (const p of pages ?? []) if (p.hidden) await updatePage(p.id, { hidden: false });
    await queryClient.invalidateQueries({ queryKey: ["spaces"] });
    await queryClient.invalidateQueries({ queryKey: ["workspace_pages", workspace] });
  };

  const rename = async () => {
    const key = renameKey;
    if (!key) return;
    const value = renameValue.trim();
    setRenameKey(null);
    if (!value) return;
    if (key.startsWith("page:")) {
      await updatePage(key.slice(5), { name: value });
      await queryClient.invalidateQueries({ queryKey: ["workspace_pages", workspace] });
      return;
    }
    if (!space) return;
    await updateSpace(space.id, { module_labels: { ...labels, [key]: value } });
    await queryClient.invalidateQueries({ queryKey: ["spaces"] });
  };

  const removePage = async (key: string) => {
    await deletePage(key.slice(5));
    await queryClient.invalidateQueries({ queryKey: ["workspace_pages", workspace] });
    toast.success("Page supprimée");
  };

  const submitPage = async () => {
    try {
      const id = await createPage({
        workspace,
        name: name.trim() || "Nouvelle page",
        emoji: emoji.trim(),
        kind,
        position: (pages ?? []).length,
      });
      await queryClient.invalidateQueries({ queryKey: ["workspace_pages", workspace] });
      setAddOpen(false);
      setName("");
      setEmoji("");
      setKind("blank");
      navigate({ to: "/page/$pageId", params: { pageId: id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Création impossible");
    }
  };

  const hasHidden = hidden.length > 0 || (pages ?? []).some((p) => p.hidden);

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 pt-1">
      {all.map((item) => (
        <ContextMenu key={item.key}>
          <ContextMenuTrigger asChild>
            <Link
              to={item.to}
              {...(item.params ? { params: item.params } : {})}
              title={item.label}
              draggable
              onDragStart={() => setDragKey(item.key)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drop(item.key)}
              activeProps={{
                className:
                  "bg-card text-foreground shadow-[var(--elev-2)] ring-1 ring-border [&_svg]:text-brand",
              }}
              inactiveProps={{
                className: "text-foreground/75 hover:bg-sidebar-accent/70 hover:text-foreground",
              }}
              className={cn(
                "press flex min-h-[38px] items-center gap-2.5 rounded-[14px] px-2.5 py-1 text-[0.9375rem] font-medium leading-tight transition-[background-color,color,box-shadow,transform] duration-200",
                !open && "justify-center px-0",
              )}
            >
              {item.emoji ? (
                <span className="grid size-[21px] shrink-0 place-items-center text-[0.9375rem]">
                  {item.emoji}
                </span>
              ) : (
                <item.icon className="shrink-0" size={open ? 21 : 22} strokeWidth={1.5} />
              )}
              {open ? <span className="truncate">{item.label}</span> : null}
            </Link>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-52">
            <ContextMenuItem
              onSelect={() => {
                setRenameKey(item.key);
                setRenameValue(item.label);
              }}
            >
              <Pencil size={14} strokeWidth={1.6} /> Renommer
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => move(item.key, -1)}>
              <ChevronUp size={14} strokeWidth={1.6} /> Déplacer vers le haut
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => move(item.key, 1)}>
              <ChevronDown size={14} strokeWidth={1.6} /> Déplacer vers le bas
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => void hide(item)}>
              <EyeOff size={14} strokeWidth={1.6} /> Masquer
            </ContextMenuItem>
            {item.page ? (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem
                  className="text-destructive"
                  onSelect={() => void removePage(item.key)}
                >
                  <Trash2 size={14} strokeWidth={1.6} /> Supprimer
                </ContextMenuItem>
              </>
            ) : null}
          </ContextMenuContent>
        </ContextMenu>
      ))}

      {/* Stratégie — réservé */}
      <div
        aria-disabled
        title="Stratégie — bientôt disponible"
        className={cn(
          "flex min-h-[38px] cursor-not-allowed items-center gap-2.5 rounded-[14px] px-2.5 py-1 text-[0.9375rem] font-medium leading-tight text-foreground/35",
          !open && "justify-center px-0",
        )}
      >
        <Sparkles className="shrink-0" size={open ? 21 : 22} strokeWidth={1.5} />
        {open ? (
          <>
            <span className="truncate">Stratégie</span>
            <span className="ml-auto shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[0.625rem] uppercase tracking-[0.08em]">
              Bientôt
            </span>
          </>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setAddOpen(true)}
        title="Ajouter une page"
        className={cn(
          "press flex min-h-[34px] w-full items-center gap-2.5 rounded-[14px] px-2.5 py-1 text-[0.875rem] text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground",
          !open && "justify-center px-0",
        )}
      >
        <Plus className="shrink-0" size={open ? 18 : 20} strokeWidth={1.6} />
        {open ? <span className="truncate">Ajouter une page</span> : null}
      </button>

      {hasHidden && open ? (
        <button
          type="button"
          onClick={() => void showAll()}
          className="press flex w-full items-center gap-2.5 rounded-[14px] px-2.5 py-1 text-[0.8125rem] text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
        >
          <Eye size={16} strokeWidth={1.6} /> Afficher les éléments masqués
        </button>
      ) : null}

      {/* Ajout de page */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Ajouter une page</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="w-16 space-y-1.5">
                <Label htmlFor="page-emoji">Emoji</Label>
                <Input
                  id="page-emoji"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
                  placeholder="📄"
                  className="text-center"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="page-name">Nom</Label>
                <Input
                  id="page-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ma page"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as PageKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blank">Page vide</SelectItem>
                  <SelectItem value="database">Base de données</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => void submitPage()}>
              Créer la page
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Renommer */}
      <Dialog open={Boolean(renameKey)} onOpenChange={(o) => !o && setRenameKey(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Renommer</DialogTitle>
          </DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <Button onClick={() => void rename()}>Enregistrer</Button>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
