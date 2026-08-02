import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Plus, Users } from "lucide-react";
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
import { listMessages } from "@/lib/mail.functions";
import { getCalendarEvents } from "@/lib/agenda.functions";
import { fmtDay, fmtTime } from "@/lib/dates";
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

const ACTIONS = [
  { to: "/projets", label: "Créer un projet" },
  { to: "/taches", label: "Créer une tâche" },
  { to: "/calendrier", label: "Créer un évènement" },
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
  const fetchMessages = useServerFn(listMessages);
  const fetchEvents = useServerFn(getCalendarEvents);
  const { data: projects } = useQuery({ ...projectsQuery(workspace), enabled: open });
  const { data: tasks } = useQuery({ ...tasksQuery(workspace), enabled: open });
  const { data: contacts } = useQuery({ ...contactsQuery(workspace), enabled: open });
  const { data: mails } = useQuery({
    queryKey: ["palette", "mail"],
    enabled: open,
    staleTime: 2 * 60 * 1000,
    retry: false,
    queryFn: () => fetchMessages({ data: { maxResults: 10 } }),
  });
  const { data: events } = useQuery({
    queryKey: ["palette", "events"],
    enabled: open,
    staleTime: 2 * 60 * 1000,
    retry: false,
    queryFn: () => {
      const now = new Date();
      return fetchEvents({
        data: {
          timeMin: now.toISOString(),
          timeMax: new Date(now.getTime() + 14 * 86400000).toISOString(),
          calendarIds: [],
        },
      });
    },
  });

  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher un projet, une tâche, un contact, un mail, un évènement…" />
      <CommandList>
        <CommandEmpty>Aucun résultat.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {PAGES.map((p) => (
            <CommandItem key={p.to} value={p.label} onSelect={() => go(p.to)}>
              <p.icon {...ICON} /> {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Actions">
          {ACTIONS.map((a) => (
            <CommandItem key={a.label} value={a.label} onSelect={() => go(a.to)}>
              <Plus {...ICON} /> {a.label}
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
        <CommandGroup heading="Évènements">
          {(events ?? []).slice(0, 8).map((ev) => (
            <CommandItem
              key={`${ev.calendarId}-${ev.id}`}
              value={`evenement ${ev.title}`}
              onSelect={() => go("/calendrier")}
            >
              <CalendarIcon {...ICON} />
              <span className="min-w-0 flex-1 truncate">{ev.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {ev.allDay ? fmtDay(ev.start.slice(0, 10)) : fmtTime(ev.start)}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Mails">
          {(mails ?? []).slice(0, 8).map((m) => (
            <CommandItem
              key={m.id}
              value={`mail ${m.subject} ${m.from}`}
              onSelect={() => {
                onOpenChange(false);
                navigate({ to: "/mail", search: { msg: m.id } });
              }}
            >
              <MailIcon {...ICON} />
              <span className="min-w-0 flex-1 truncate">{m.subject || "(sans objet)"}</span>
              <span className="shrink-0 truncate text-xs text-muted-foreground">{m.from}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
