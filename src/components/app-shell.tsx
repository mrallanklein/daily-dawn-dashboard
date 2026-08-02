import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  Check,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Inbox,
  LogOut,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";
import {
  BudgetIcon,
  CalendarIcon,
  ContactIcon,
  MailIcon,
  ProjectsIcon,
  TasksIcon,
} from "@/components/icons/notion-icons";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { createSpace, spaceInitials } from "@/lib/spaces";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/logo-ak.png.asset.json";
import portraitAsset from "@/assets/allan-klein.png.asset.json";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette } from "@/components/app/command-palette";
import { SettingsDialog } from "@/components/settings-dialog";

const HOME = { to: "/", label: "Accueil", icon: Home } as const;

const NAV = [
  { to: "/projets", label: "Projets", icon: ProjectsIcon },
  { to: "/taches", label: "Tâches", icon: TasksIcon },
  { to: "/calendrier", label: "Calendrier", icon: CalendarIcon },
  { to: "/mail", label: "Boîte mail", icon: MailIcon },
  { to: "/crm", label: "CRM", icon: ContactIcon },
  { to: "/budget", label: "Budget", icon: BudgetIcon },
  { to: "/equipe", label: "Équipe", icon: Users, aliasOnly: true },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: profile } = useQuery(profileQuery());
  const { workspace, setWorkspace, spaces, space } = useWorkspace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("ak-sidebar");
    if (stored) setOpen(stored === "open");
    else if (window.innerWidth < 1024) setOpen(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = () =>
    setOpen((prev) => {
      window.localStorage.setItem("ak-sidebar", prev ? "closed" : "open");
      return !prev;
    });

  const wsName = space?.name ?? profile?.display_name ?? "Espace";
  const wsTag = space?.tag ?? "";
  const wsAvatar = space?.avatar_url ?? (workspace === "allan" ? portraitAsset.url : null);
  const items = NAV.filter((n) => !("aliasOnly" in n && n.aliasOnly) || workspace === "alias");

  const newSpace = async () => {
    try {
      const slug = await createSpace("Nouvel espace", "Espace", spaces.length);
      await queryClient.invalidateQueries({ queryKey: ["spaces"] });
      setWorkspace(slug);
      setSettingsOpen(true);
    } catch {
      /* l'erreur est visible dans les paramètres */
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/auth" });
  };

  return (
    <div className="ambient relative min-h-screen bg-background">
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      <aside
        className={cn(
          "fixed inset-y-3 left-3 z-40 hidden flex-col overflow-hidden rounded-[22px] border border-border bg-background/85 shadow-[var(--elev-3)] backdrop-blur-2xl transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:flex",
          open ? "w-[15rem]" : "w-[64px]",
        )}
      >
        <div className={cn("p-2.5", !open && "px-2")}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "press flex w-full items-center gap-2.5 rounded-[14px] p-1.5 text-left transition-colors hover:bg-sidebar-accent/80",
                  !open && "justify-center p-1.5",
                )}
              >
                {wsAvatar ? (
                  <img
                    src={wsAvatar}
                    alt={wsName}
                    className="size-9 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-[0.75rem] font-display text-brand-foreground"
                    style={{ backgroundColor: "var(--brand)" }}
                  >
                    {spaceInitials(wsName)}
                  </span>
                )}
                {open ? (
                  <>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[0.9375rem] font-display">{wsName}</span>
                      <span className="block truncate text-[0.72rem] text-muted-foreground">
                        {wsTag}
                      </span>
                    </span>
                    <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
                  </>
                ) : null}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                Espaces
              </DropdownMenuLabel>
              {spaces.map((w) => (
                <DropdownMenuItem key={w.id} onClick={() => setWorkspace(w.slug)} className="gap-2">
                  {w.avatar_url ? (
                    <img
                      src={w.avatar_url}
                      alt={w.name}
                      className="size-6 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <span className="grid size-6 shrink-0 place-items-center rounded-md bg-secondary text-[0.62rem] font-semibold">
                      {spaceInitials(w.name)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-sm font-semibold">{w.name}</span>
                    {w.tag ? (
                      <span className="block truncate text-[0.7rem] text-muted-foreground">
                        {w.tag}
                      </span>
                    ) : null}
                  </span>
                  {w.slug === workspace ? <Check className="size-3.5 shrink-0" /> : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={newSpace}>
                <Plus className="size-3.5" /> Nouvel espace de travail
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Settings className="size-3.5" /> Paramètres de l'espace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Ligne rapide : Accueil (pastille) · Boîte de réception · Recherche */}
        <div className={cn("flex items-center gap-1 px-2 pb-2", !open && "flex-col gap-1.5")}>
          <Link
            to={HOME.to}
            title={HOME.label}
            aria-label={HOME.label}
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-muted text-foreground" }}
            inactiveProps={{ className: "bg-muted/60 text-foreground/80 hover:bg-muted" }}
            className={cn(
              "press flex h-9 shrink-0 items-center gap-1.5 rounded-full transition-colors",
              open ? "flex-1 px-2.5" : "w-9 justify-center",
            )}
          >
            <HOME.icon size={open ? 19 : 22} strokeWidth={1.5} />
            {open ? (
              <span className="text-[0.9375rem] font-medium leading-none">{HOME.label}</span>
            ) : null}
          </Link>
          <Link
            to="/mail"
            search={{}}
            aria-label="Boîte de réception"
            title="Boîte de réception"
            className="press grid size-9 shrink-0 place-items-center rounded-[6px] text-foreground/70 transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
          >
            <Inbox size={open ? 21 : 22} strokeWidth={1.5} />
          </Link>
          <button
            onClick={() => setPaletteOpen(true)}
            aria-label="Rechercher (⌘K)"
            title="Rechercher — ⌘K"
            className="press grid size-9 shrink-0 place-items-center rounded-[6px] text-foreground/70 transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
          >
            <Search size={open ? 21 : 22} strokeWidth={1.5} />
          </button>
        </div>

        <nav className={cn("flex-1 space-y-1 px-2.5 pt-1")}>
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              activeProps={{
                className:
                  "bg-card text-foreground shadow-[var(--elev-2)] ring-1 ring-border [&_svg]:text-brand",
              }}
              inactiveProps={{
                className:
                  "text-foreground/75 hover:bg-sidebar-accent/70 hover:text-foreground",
              }}
              className={cn(
                "press flex min-h-[38px] items-center gap-2.5 rounded-[14px] px-2.5 py-1 text-[0.9375rem] font-medium leading-tight transition-[background-color,color,box-shadow,transform] duration-200",
                !open && "justify-center px-0",
              )}
            >
              <item.icon
                className="shrink-0"
                size={open ? 21 : 22}
                strokeWidth={1.5}
              />
              {open ? <span className="truncate">{item.label}</span> : null}
            </Link>
          ))}
        </nav>

        <div className="space-y-1.5 border-t border-sidebar-border p-2.5">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Ouvrir les paramètres"
            className={cn(
              "press flex w-full items-center gap-2.5 rounded-[14px] p-1 text-left transition-colors hover:bg-sidebar-accent/80",
              !open && "justify-center",
            )}
          >
            <Avatar className="size-10 shrink-0">
              <AvatarImage
                src={profile?.avatar_url ?? portraitAsset.url}
                alt={profile?.display_name ?? "Allan Klein"}
                className="object-cover"
              />
              <AvatarFallback className="bg-secondary text-sm">AK</AvatarFallback>
            </Avatar>
            {open ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.9375rem] font-medium leading-tight">
                  {profile?.display_name ?? "Allan Klein"}
                </p>
                <p className="truncate text-[0.75rem] leading-tight text-muted-foreground">
                  mr.allanklein@gmail.com
                </p>
              </div>
            ) : null}
          </button>
          <div className={cn("flex items-center gap-1", !open && "flex-col")}>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="press size-9"
              onClick={() => setSettingsOpen(true)}
              aria-label="Paramètres"
            >
              <Settings className="size-5" strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="press size-9 text-muted-foreground hover:text-foreground"
              onClick={signOut}
              aria-label="Se déconnecter"
            >
              <LogOut className="size-5" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </aside>

      {/* Bouton de repli/dépli — à l'extérieur de la sidebar, à mi-hauteur */}
      <button
        onClick={toggle}
        aria-label={open ? "Masquer la barre latérale" : "Afficher la barre latérale"}
        title={open ? "Masquer la barre latérale" : "Afficher la barre latérale"}
        className={cn(
          "press fixed top-1/2 z-50 hidden size-8 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-[var(--elev-3)] backdrop-blur-xl transition-[left,color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 hover:text-foreground md:grid",
          open ? "left-[calc(15rem+0.75rem-1rem)]" : "left-[calc(64px+0.75rem-1rem)]",
        )}
      >
        {open ? (
          <ChevronLeft size={18} strokeWidth={1.5} />
        ) : (
          <ChevronRight size={18} strokeWidth={1.5} />
        )}
      </button>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-background/85 px-1 py-1.5 backdrop-blur-xl md:hidden">
        {[HOME, ...items].slice(0, 5).map((item) => (
          <Link
            key={item.to}
            to={item.to}
            aria-label={item.label}
            activeOptions={{ exact: item.to === "/" }}
            activeProps={{ className: "text-foreground" }}
            inactiveProps={{ className: "text-muted-foreground" }}
            className="grid place-items-center rounded-lg px-3 py-1.5"
          >
            <item.icon size={22} strokeWidth={1.5} />
          </Link>
        ))}
      </nav>

      <main
        className={cn(
          "min-h-screen px-4 pb-24 pt-8 transition-[margin,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-6 md:pb-12 md:pl-8 lg:px-10 lg:pl-12",
          open ? "md:ml-[16rem]" : "md:ml-[80px]",
        )}
      >
        <div className="mx-auto max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
