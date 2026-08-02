import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FileText, Users } from "lucide-react";
import {
  BudgetIcon,
  CalendarIcon,
  ContactIcon,
  MailIcon,
  ProjectsIcon,
  TasksIcon,
} from "@/components/icons/notion-icons";
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
  { to: "/", label: "Tableau de bord", icon: FileText },
  { to: "/projets", label: "Projets", icon: ProjectsIcon },
  { to: "/taches", label: "Tâches", icon: TasksIcon },
  { to: "/calendrier", label: "Calendrier", icon: CalendarIcon },
  { to: "/mail", label: "Boîte mail", icon: MailIcon },
  { to: "/crm", label: "CRM", icon: ContactIcon },
  { to: "/budget", label: "Budget", icon: BudgetIcon },
  { to: "/equipe", label: "Équipe", icon: Users },
] as const;

const ICON = { size: 18, strokeWidth: 1.5, className: "shrink-0 text-foreground/80" } as const;

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
              <p.icon {...ICON} /> {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Projets">
          {(projects ?? []).slice(0, 8).map((p) => (
            <CommandItem key={p.id} value={`projet ${p.name}`} onSelect={() => go("/projets")}>
              <ProjectsIcon {...ICON} /> {p.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Tâches">
          {(tasks ?? []).slice(0, 8).map((t) => (
            <CommandItem key={t.id} value={`tache ${t.title}`} onSelect={() => go("/taches")}>
              <TasksIcon {...ICON} /> {t.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Contacts">
          {(contacts ?? []).slice(0, 8).map((c) => (
            <CommandItem key={c.id} value={`contact ${c.full_name}`} onSelect={() => go("/crm")}>
              <ContactIcon {...ICON} /> {c.full_name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
