import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Banknote,
  CalendarDays,
  Compass,
  LayoutDashboard,
  ListChecks,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/logo-ak.png.asset.json";
import portraitAsset from "@/assets/allan-klein.png.asset.json";
import { ThemeToggle } from "@/components/theme-toggle";
import { CustomCursor } from "@/components/custom-cursor";

const NAV = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/planning", label: "Planning", icon: CalendarDays },
  { to: "/taches", label: "Tâches", icon: ListChecks },
  { to: "/projets", label: "Projets", icon: Sparkles },
  { to: "/strategie", label: "Stratégie", icon: Compass },
  { to: "/crm", label: "CRM", icon: Users },
  { to: "/budget", label: "Budget", icon: Banknote },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: profile } = useQuery(profileQuery());
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem("ak-sidebar");
    if (stored) setOpen(stored === "open");
    else if (window.innerWidth < 1024) setOpen(false);
  }, []);

  const toggle = () => {
    setOpen((prev) => {
      window.localStorage.setItem("ak-sidebar", prev ? "closed" : "open");
      return !prev;
    });
  };

  const initials = (profile?.display_name ?? "Allan Klein")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen">
      <CustomCursor />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out",
          open ? "w-64" : "w-[4.5rem]",
        )}
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <Link to="/" className="flex shrink-0 items-center" aria-label="Accueil">
            <img src={logoAsset.url} alt="Logo Allan Klein" className="size-8 rounded-md" />
          </Link>
          {open ? (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-display font-semibold">Allan Klein</span>
              <span className="block text-xs text-muted-foreground">Atelier</span>
            </span>
          ) : null}
        </div>

        <nav className="flex-1 space-y-0.5 px-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              title={item.label}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "bg-sidebar-accent text-foreground font-medium" }}
              inactiveProps={{
                className: "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              }}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                !open && "justify-center px-0",
              )}
            >
              <item.icon className="size-4 shrink-0" strokeWidth={1.7} />
              {open ? <span className="truncate">{item.label}</span> : null}
            </Link>
          ))}
        </nav>

        <div className="space-y-2 border-t border-sidebar-border p-3">
          <div className={cn("flex items-center gap-3", !open && "justify-center")}>
            <Avatar className="size-8 shrink-0 border border-border">
              <AvatarImage
                src={profile?.avatar_url ?? portraitAsset.url}
                alt={profile?.display_name ?? "Allan Klein"}
                className="object-cover"
              />
              <AvatarFallback className="bg-secondary">{initials}</AvatarFallback>
            </Avatar>
            {open ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{profile?.display_name ?? "Allan Klein"}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(), "d MMM", { locale: fr })}
                </p>
              </div>
            ) : null}
          </div>
          <div className={cn("flex gap-1", !open && "flex-col items-center")}>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {open ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeftOpen className="size-4" />
              )}
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

      <main
        className={cn(
          "min-h-screen px-4 py-8 transition-[margin] duration-300 ease-out sm:px-8",
          open ? "ml-64" : "ml-[4.5rem]",
        )}
      >
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}