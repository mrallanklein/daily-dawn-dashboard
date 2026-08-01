import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, isSameDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { ModuleCard } from "@/components/module-card";
import { projectsQuery, tasksQuery } from "@/lib/data";

export function MonthCalendar() {
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const { data: tasks } = useQuery(tasksQuery());
  const { data: projects } = useQuery(projectsQuery());

  const marked = [
    ...(tasks ?? []).filter((t) => t.scheduled_date).map((t) => parseISO(t.scheduled_date!)),
    ...(projects ?? []).filter((p) => p.deadline).map((p) => parseISO(p.deadline!)),
  ];

  const dayTasks = (tasks ?? []).filter(
    (t) => selected && t.scheduled_date && isSameDay(parseISO(t.scheduled_date), selected),
  );
  const dayProjects = (projects ?? []).filter(
    (p) => selected && p.deadline && isSameDay(parseISO(p.deadline), selected),
  );

  return (
    <ModuleCard eyebrow="Vue mensuelle" title="Calendrier">
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <Calendar
          mode="single"
          locale={fr}
          selected={selected}
          onSelect={setSelected}
          modifiers={{ marked }}
          modifiersClassNames={{ marked: "text-gold font-semibold underline underline-offset-4" }}
          className="rounded-lg border border-border/60 bg-secondary/20 p-3"
        />
        <div>
          <p className="text-sm text-muted-foreground">
            {selected ? format(selected, "EEEE d MMMM yyyy", { locale: fr }) : "Sélectionnez un jour"}
          </p>
          <ul className="mt-3 space-y-2">
            {dayProjects.map((p) => (
              <li key={p.id} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
                <span className="text-gold">Échéance projet</span> · {p.name}
              </li>
            ))}
            {dayTasks.map((t) => (
              <li key={t.id} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Tâche</span> · {t.title}
              </li>
            ))}
            {dayProjects.length === 0 && dayTasks.length === 0 ? (
              <li className="text-sm text-muted-foreground">Journée libre.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </ModuleCard>
  );
}