import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  Banknote,
  CalendarDays,
  Check,
  ChevronsUpDown,
  KanbanSquare,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Users,
  UsersRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/data";
import { WORKSPACES, useWorkspace, workspaceMeta } from "@/lib/workspace";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/logo-ak.png.asset.json";
import portraitAsset from "@/assets/allan-klein.png.asset.json";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette } from "@/components/app/command-palette";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/projets", label: "Projets", icon: KanbanSquare },
  { to: "/taches", label: "Tâches", icon: ListChecks },
  { to: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { to: "/mail", label: "Boîte mail", icon: Mail },
  { to: "/crm", label: "CRM", icon: Users },
  { to: "/budget", label: "Budget", icon: Banknote },
  { to: "/equipe", label: "Équipe", icon: UsersRound, aliasOnly: true },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: profile } = useQuery(profileQuery());
  const { workspace, setWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);

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

  const ws = workspaceMeta(workspace);
  const items = NAV.filter((n) => !("aliasOnly" in n && n.aliasOnly) || workspace === "alias");

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out md:flex",
          open ? "w-60" : "w-[4.25rem]",
        )}
      >
        <div className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent",
                  !open && "justify-center p-1.5",
                )}
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-[0.7rem] font-display text-brand-foreground"
                  style={{ backgroundColor: "var(--brand)" }}
                >
                  {ws.initials}
                </span>
                {open ? (
                  <>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-sm font-display">{ws.name}</span>
                      <span className="block text-[0.7rem] text-muted-foreground">{ws.tag}</span>
                    </span>
                    <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
                  </>
                ) : null}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {WORKSPACES.map((w) => (
                <DropdownMenuItem key={w.id} onClick={() => setWorkspace(w.id)}>
                  <span className="flex-1">
                    {w.name}
                    <span className="ml-1.5 text-xs text-muted-foreground">{w.tag}</span>
                  </span>
                  {w.id === workspace ? <Check className="size-3.5" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="px-3 pb-2">
          <button
            onClick={() => setPaletteOpen(true)}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-background/60 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground",
              !open && "justify-center px-0",
            )}
          >
            <Search className="size-3.5 shrink-0" />
            {open ? (
              <>
                <span className="flex-1 text-left">Rechercher…</span>
                <kbd className="rounded border border-border px-1 text-[0.65rem]">⌘K</kbd>
              </>
            ) : null}
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-2">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              activeOptions={{ exact: "exact" in item ? item.exact : false }}
              activeProps={{
                className: "bg-sidebar-accent text-foreground font-medium",
                style: { boxShadow: "inset 2px 0 0 var(--brand)" },
              }}
              inactiveProps={{
                className: "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              }}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                !open && "justify-center px-0",
              )}
            >
              <item.icon className="size-4 shrink-0" strokeWidth={1.8} />
              {open ? <span className="truncate">{item.label}</span> : null}
            </Link>
          ))}
        </nav>

        <div className="space-y-2 border-t border-sidebar-border p-3">
          <div className={cn("flex items-center gap-2.5", !open && "justify-center")}>
            <Avatar className="size-8 shrink-0">
              <AvatarImage
                src={profile?.avatar_url ?? portraitAsset.url}
                alt={profile?.display_name ?? "Allan Klein"}
                className="object-cover"
              />
              <AvatarFallback className="bg-secondary text-xs">AK</AvatarFallback>
            </Avatar>
            {open ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{profile?.display_name ?? "Allan Klein"}</p>
                <p className="truncate text-[0.7rem] text-muted-foreground">
                  mr.allanklein@gmail.com
                </p>
              </div>
            ) : null}
          </div>
          <div className={cn("flex gap-1", !open && "flex-col items-center")}>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Replier le menu">
              {open ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              aria-label="Se déconnecter"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-sidebar/95 px-1 py-1.5 backdrop-blur md:hidden">
        {items.slice(0, 5).map((item) => (
          <Link
            key={item.to}
            to={item.to}
            aria-label={item.label}
            activeOptions={{ exact: "exact" in item ? item.exact : false }}
            activeProps={{ className: "text-brand" }}
            inactiveProps={{ className: "text-muted-foreground" }}
            className="grid place-items-center rounded-lg px-3 py-1.5"
          >
            <item.icon className="size-5" strokeWidth={1.8} />
          </Link>
        ))}
      </nav>

      <main
        className={cn(
          "min-h-screen px-4 pb-24 pt-6 transition-[margin] duration-200 ease-out sm:px-8 md:pb-10",
          open ? "md:ml-60" : "md:ml-[4.25rem]",
        )}
      >
        <div className="mx-auto max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
