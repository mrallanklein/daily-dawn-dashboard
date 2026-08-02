import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { AlarmClock, Bell, CalendarClock, CheckCircle2, Mail, MessageSquare } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type NotificationKind, type NotificationTab } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const ICONS: Record<NotificationKind, typeof Bell> = {
  deadline: AlarmClock,
  mail: Mail,
  task: CheckCircle2,
  comment: MessageSquare,
  invite: CalendarClock,
};

export function NotificationBell({ size = 21 }: { size?: number }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<NotificationTab>("all");
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  const visible = notifications.filter((n) =>
    tab === "unread" ? !n.read : tab === "mentions" ? n.mention : true,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label={`Notifications${unreadCount ? ` (${unreadCount} non lues)` : ""}`}
          title="Notifications"
          className="press relative grid size-9 shrink-0 place-items-center rounded-[6px] text-foreground/70 transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
        >
          <Bell size={size} strokeWidth={1.5} />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 grid min-w-[1.05rem] place-items-center rounded-full bg-destructive px-1 text-[0.62rem] font-semibold leading-[1.05rem] text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[22rem] p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
          <p className="text-[0.9375rem] font-display">Notifications</p>
          <button
            type="button"
            onClick={() => markAllRead()}
            disabled={unreadCount === 0}
            className="rounded-md px-1.5 py-0.5 text-[0.75rem] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
          >
            Tout marquer comme lu
          </button>
        </div>
        <div className="px-3 pt-2.5">
          <Tabs value={tab} onValueChange={(v) => setTab(v as NotificationTab)}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1 text-[0.8rem]">
                Toutes
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1 text-[0.8rem]">
                Non lues
              </TabsTrigger>
              <TabsTrigger value="mentions" className="flex-1 text-[0.8rem]">
                Mentions
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <ScrollArea className="max-h-[24rem]">
          <ul className="p-2">
            {visible.length === 0 ? (
              <li className="px-2 py-8 text-center text-[0.85rem] text-muted-foreground">
                Aucune notification pour le moment.
              </li>
            ) : (
              visible.map((n) => {
                const Icon = ICONS[n.kind];
                return (
                  <li key={n.key}>
                    <button
                      type="button"
                      onClick={() => {
                        markRead(n.key);
                        setOpen(false);
                        navigate({ to: n.href });
                      }}
                      className="press flex w-full items-start gap-2.5 rounded-[10px] px-2 py-2 text-left transition-colors hover:bg-secondary/70"
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-[8px] bg-secondary text-muted-foreground",
                          !n.read && "text-foreground",
                        )}
                      >
                        <Icon size={15} strokeWidth={1.5} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-[0.875rem] leading-tight",
                            n.read ? "font-normal text-foreground/80" : "font-semibold",
                          )}
                        >
                          {n.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[0.78rem] text-muted-foreground">
                          {n.detail}
                        </span>
                        <span className="mt-0.5 block text-[0.72rem] text-muted-foreground/80">
                          {formatDistanceToNowStrict(parseISO(n.at), {
                            locale: fr,
                            addSuffix: true,
                          })}
                        </span>
                      </span>
                      {!n.read ? (
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-destructive" />
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
