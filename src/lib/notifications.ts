import { useMemo } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  queryOptions,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { projectsQuery, tasksQuery } from "@/lib/data";
import { listMailAccounts, listMessages } from "@/lib/mail.functions";
import { getCalendarEvents } from "@/lib/agenda.functions";
import { useWorkspace } from "@/lib/workspace";

export type NotificationKind = "deadline" | "mail" | "task" | "comment" | "invite";

export type AppNotification = {
  key: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  /** Date de référence utilisée pour le tri (ISO). */
  at: string;
  /** Destination cliquable (chemin interne). */
  href: string;
  mention: boolean;
  read: boolean;
};

export type NotificationTab = "all" | "unread" | "mentions";

const readsQuery = () =>
  queryOptions({
    queryKey: ["notification_reads"],
    queryFn: async () => {
      const res = await supabase.from("notification_reads").select("notification_key");
      if (res.error) throw new Error(res.error.message);
      return (res.data ?? []).map((r) => r.notification_key as string);
    },
  });

function hoursUntil(iso: string) {
  return (new Date(iso).getTime() - Date.now()) / 3_600_000;
}

function dayISO(value: string) {
  return value.length > 10 ? value.slice(0, 10) : value;
}

/**
 * Le flux de notifications est dérivé des données existantes (échéances, mails,
 * tâches, commentaires, invitations). Seul l'état « lu » est persisté.
 */
export function useNotifications() {
  const { workspace, space } = useWorkspace();
  const queryClient = useQueryClient();
  const fetchAccounts = useServerFn(listMailAccounts);
  const fetchMessages = useServerFn(listMessages);
  const fetchEvents = useServerFn(getCalendarEvents);

  const { data: reads } = useQuery(readsQuery());
  const { data: projects } = useQuery(projectsQuery(workspace));
  const { data: tasks } = useQuery(tasksQuery(workspace));

  const { data: accountList } = useQuery({
    queryKey: ["mail-accounts"],
    staleTime: 30 * 60 * 1000,
    retry: false,
    queryFn: () => fetchAccounts(),
  });

  const allowed = space?.mail_accounts ?? [];
  const accounts = (accountList ?? [])
    .filter((a) => allowed.length === 0 || allowed.includes(a.id))
    .map((a) => a.id);

  const mailResults = useQueries({
    queries: accounts.map((account) => ({
      queryKey: ["notif-mail", account],
      staleTime: 2 * 60 * 1000,
      retry: false,
      queryFn: () =>
        fetchMessages({ data: { maxResults: 10, query: "in:inbox is:unread", account } }),
    })),
  });

  const range = useMemo(() => {
    const now = new Date();
    const max = new Date(now.getTime() + 14 * 86_400_000);
    return { timeMin: now.toISOString(), timeMax: max.toISOString() };
  }, []);

  const { data: events } = useQuery({
    queryKey: ["notif-events", range.timeMin.slice(0, 13)],
    staleTime: 5 * 60 * 1000,
    retry: false,
    queryFn: () => fetchEvents({ data: range }),
  });

  const { data: comments } = useQuery({
    queryKey: ["notif-comments"],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const res = await supabase
        .from("project_comments")
        .select("id, project_id, body, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20);
      if (res.error) throw new Error(res.error.message);
      return res.data ?? [];
    },
  });

  const notifications = useMemo<AppNotification[]>(() => {
    const readSet = new Set(reads ?? []);
    const out: AppNotification[] = [];
    const push = (n: Omit<AppNotification, "read">) =>
      out.push({ ...n, read: readSet.has(n.key) });

    // Échéances de projets — 24 h puis 1 h avant
    for (const p of projects ?? []) {
      if (!p.deadline || ["termine", "archiver"].includes(p.status)) continue;
      const at = `${dayISO(p.deadline)}T09:00:00`;
      const h = hoursUntil(at);
      if (h > 24 || h < -24) continue;
      push({
        key: `deadline:project:${p.id}:${h <= 1 ? "1h" : "24h"}`,
        kind: "deadline",
        title: `Échéance projet — ${p.name}`,
        detail: h <= 0 ? "Échéance atteinte" : h <= 1 ? "Dans moins d'une heure" : "Dans moins de 24 h",
        at,
        href: "/projets",
        mention: false,
      });
    }

    // Échéances de tâches
    for (const t of tasks ?? []) {
      const due = t.due_date ?? t.scheduled_date;
      if (!due || t.status === "termine") continue;
      const at = `${dayISO(due)}T${t.start_time ?? "09:00:00"}`;
      const h = hoursUntil(at);
      if (h > 24 || h < -24) continue;
      push({
        key: `deadline:task:${t.id}:${h <= 1 ? "1h" : "24h"}`,
        kind: "task",
        title: t.title,
        detail: h <= 0 ? "Échéance atteinte" : h <= 1 ? "Dans moins d'une heure" : "Dans moins de 24 h",
        at,
        href: "/taches",
        mention: false,
      });
    }

    // Nouveaux mails non lus
    for (const result of mailResults) {
      for (const m of result.data ?? []) {
        push({
          key: `mail:${m.id}`,
          kind: "mail",
          title: m.subject || "(sans objet)",
          detail: m.from,
          at: m.date,
          href: `/mail?msg=${m.id}`,
          mention: false,
        });
      }
    }

    // Invitations calendrier en attente de réponse
    for (const e of events ?? []) {
      if (e.myResponse !== "needsAction") continue;
      push({
        key: `invite:${e.id}`,
        kind: "invite",
        title: `Invitation — ${e.title}`,
        detail: e.organizer ?? e.calendarName ?? "Agenda",
        at: e.start,
        href: "/calendrier",
        mention: true,
      });
    }

    // Commentaires de projet récents
    const byId = new Map((projects ?? []).map((p) => [p.id, p.name]));
    for (const c of comments ?? []) {
      const project = byId.get(c.project_id as string);
      if (!project) continue;
      push({
        key: `comment:${c.id}`,
        kind: "comment",
        title: `Commentaire — ${project}`,
        detail: String(c.body).slice(0, 120),
        at: c.created_at as string,
        href: "/projets",
        mention: String(c.body).includes("@"),
      });
    }

    return out.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [reads, projects, tasks, events, comments, mailResults.map((r) => r.dataUpdatedAt).join()]);

  const unread = notifications.filter((n) => !n.read);

  const markRead = useMutation({
    mutationFn: async (keys: string[]) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || keys.length === 0) return;
      const rows = keys.map((notification_key) => ({
        user_id: auth.user!.id,
        notification_key,
      }));
      const res = await supabase
        .from("notification_reads")
        .upsert(rows, { onConflict: "user_id,notification_key" });
      if (res.error) throw new Error(res.error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notification_reads"] }),
  });

  return {
    notifications,
    unreadCount: unread.length,
    markRead: (key: string) => markRead.mutate([key]),
    markAllRead: () => markRead.mutate(unread.map((n) => n.key)),
  };
}
