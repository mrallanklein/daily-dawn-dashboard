import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getCalendarEvents } from "@/lib/agenda.functions";
import { projectsQuery, tasksQuery } from "@/lib/data";
import { useWorkspace } from "@/lib/workspace";
import { daysUntil, fmtTime, todayISO } from "@/lib/dates";

function alreadyShown(id: string) {
  const key = `ak-reminder-${id}`;
  if (window.localStorage.getItem(key)) return true;
  window.localStorage.setItem(key, "1");
  return false;
}

function notify(title: string, body: string) {
  toast(title, { description: body, duration: 8000 });
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

/**
 * Rappels quotidiens : deadlines dépassées ou imminentes, tâches du jour et
 * prochain évènement de l'agenda. Chaque rappel n'est affiché qu'une fois par jour.
 */
export function useReminders() {
  const { workspace } = useWorkspace();
  const { data: projects } = useQuery(projectsQuery(workspace));
  const { data: tasks } = useQuery(tasksQuery(workspace));
  const fetchEvents = useServerFn(getCalendarEvents);

  const { data: events } = useQuery({
    queryKey: ["reminders", "events", todayISO()],
    staleTime: 10 * 60 * 1000,
    retry: false,
    queryFn: () => {
      const now = new Date();
      const end = new Date(now.getTime() + 12 * 3600000);
      return fetchEvents({
        data: { timeMin: now.toISOString(), timeMax: end.toISOString(), calendarIds: [] },
      });
    },
  });

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!projects) return;
    const today = todayISO();
    const late = projects.filter(
      (p) => p.deadline && p.deadline < today && !["termine", "archiver"].includes(p.status),
    );
    const soon = projects.filter(
      (p) =>
        p.deadline &&
        p.deadline >= today &&
        daysUntil(p.deadline) <= 3 &&
        !["termine", "archiver"].includes(p.status),
    );
    if (late.length && !alreadyShown(`late-${today}-${late.length}`)) {
      notify(
        `${late.length} deadline(s) dépassée(s)`,
        late
          .slice(0, 3)
          .map((p) => p.name)
          .join(", "),
      );
    }
    if (soon.length && !alreadyShown(`soon-${today}-${soon.length}`)) {
      notify(
        `${soon.length} deadline(s) dans les 3 jours`,
        soon
          .slice(0, 3)
          .map((p) => p.name)
          .join(", "),
      );
    }
  }, [projects]);

  useEffect(() => {
    if (!tasks) return;
    const today = todayISO();
    const due = tasks.filter(
      (t) => !t.parent_task_id && t.status !== "termine" && t.due_date === today,
    );
    if (due.length && !alreadyShown(`tasks-${today}-${due.length}`)) {
      notify(
        `${due.length} tâche(s) à rendre aujourd'hui`,
        due
          .slice(0, 3)
          .map((t) => t.title)
          .join(", "),
      );
    }
  }, [tasks]);

  useEffect(() => {
    const next = (events ?? []).filter((ev) => !ev.allDay)[0];
    if (!next) return;
    const minutes = Math.round((new Date(next.start).getTime() - Date.now()) / 60000);
    if (minutes < 0 || minutes > 30) return;
    if (alreadyShown(`event-${next.id}`)) return;
    notify(`Dans ${minutes} min · ${next.title}`, `${fmtTime(next.start)}${next.location ? ` · ${next.location}` : ""}`);
  }, [events]);
}