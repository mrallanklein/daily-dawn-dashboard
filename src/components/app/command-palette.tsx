import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Banknote,
  CalendarDays,
  KanbanSquare,
  LayoutDashboard,
  ListChecks,
  Mail,
  Users,
  UsersRound,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { contactsQuery, projectsQuery, tasksQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";

const PAGES = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projets", label: "Projets", icon: KanbanSquare },
  { to: "/taches", label: "Tâches", icon: ListChecks },
  { to: "/calendrier", label: "Calendrier", icon: CalendarDays },
  { to: "/mail", label: "Boîte mail", icon: Mail },
  { to: "/crm", label: "CRM", icon: Users },
  { to: "/budget", label: "Budget", icon: Banknote },
  { to: "/equipe", label: "Équipe", icon: UsersRound },
] as const;

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { workspace } = useWorkspace();
  const { data: projects } = useQuery({ ...projectsQuery(workspace), enabled: open });
  const { data: tasks } = useQuery({ ...tasksQuery(workspace), enabled: open });
  const { data: contacts } = useQuery({ ...contactsQuery(workspace), enabled: open });

  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher un projet, une tâche, un contact…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {PAGES.map((p) => (
            <CommandItem key={p.to} value={p.label} onSelect={() => go(p.to)}>
              <p.icon className="size-4" /> {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Projets">
          {(projects ?? []).slice(0, 8).map((p) => (
            <CommandItem key={p.id} value={`projet ${p.name}`} onSelect={() => go("/projets")}>
              <KanbanSquare className="size-4" /> {p.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Tâches">
          {(tasks ?? []).slice(0, 8).map((t) => (
            <CommandItem key={t.id} value={`tache ${t.title}`} onSelect={() => go("/taches")}>
              <ListChecks className="size-4" /> {t.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Contacts">
          {(contacts ?? []).slice(0, 8).map((c) => (
            <CommandItem key={c.id} value={`contact ${c.full_name}`} onSelect={() => go("/crm")}>
              <Users className="size-4" /> {c.full_name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
