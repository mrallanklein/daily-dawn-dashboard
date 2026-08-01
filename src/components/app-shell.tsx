import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Tableau de bord" },
  { to: "/planning", label: "Planning" },
  { to: "/taches", label: "Tâches" },
  { to: "/projets", label: "Projets" },
  { to: "/strategie", label: "Stratégie" },
  { to: "/crm", label: "CRM" },
  { to: "/budget", label: "Budget" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { data: profile } = useQuery(profileQuery());
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const initials = (profile?.display_name ?? "A")
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
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full border border-gold/40 text-sm font-display text-gold">
              A
            </span>
            <span className="leading-tight">
              <span className="block text-base font-display tracking-wide">Atelier</span>
              <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">
                {format(new Date(), "EEEE d MMMM", { locale: fr })}
              </span>
            </span>
          </Link>

          <nav className="order-3 flex w-full flex-wrap gap-1 md:order-none md:w-auto md:flex-1 md:justify-center">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "bg-secondary text-gold" }}
                inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
                className="rounded-full px-3 py-1.5 text-sm transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Avatar className="size-10 border border-gold/40">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
              ) : null}
              <AvatarFallback className="bg-secondary text-gold">{initials}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Se déconnecter">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
    </div>
  );
}