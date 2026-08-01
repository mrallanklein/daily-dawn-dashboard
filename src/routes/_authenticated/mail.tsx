import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { differenceInCalendarDays, format, isToday, isYesterday, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Check,
  ChevronsUpDown,
  FileEdit,
  Inbox,
  MailOpen,
  Search,
  Send,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/panel";
import {
  getMailStatus,
  listMailAccounts,
  listMessages,
  sendMessage,
  type MailAccountId,
  type MailMessage,
} from "@/lib/mail.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/mail")({
  head: () => ({
    meta: [
      { title: "Boîte mail — Gmail intégré" },
      {
        name: "description",
        content:
          "Boîte de réception Gmail intégrée : lecture rapide au clavier, recherche et rédaction directe depuis le dashboard.",
      },
      { property: "og:title", content: "Boîte mail — Gmail intégré" },
      { property: "og:description", content: "Lecture, recherche et envoi Gmail intégrés." },
    ],
  }),
  component: MailPage,
});

const VIEWS = [
  { id: "inbox", label: "Boîte de réception", query: "in:inbox", icon: Inbox },
  { id: "unread", label: "Non lus", query: "in:inbox is:unread", icon: MailOpen },
  { id: "starred", label: "Favoris", query: "is:starred", icon: Star },
  { id: "sent", label: "Envoyés", query: "in:sent", icon: Send },
  { id: "drafts", label: "Brouillons", query: "in:drafts", icon: FileEdit },
  { id: "trash", label: "Corbeille", query: "in:trash", icon: Trash2 },
] as const;

function groupLabel(iso: string) {
  const d = parseISO(iso);
  if (isToday(d)) return "Aujourd'hui";
  if (isYesterday(d)) return "Hier";
  if (differenceInCalendarDays(new Date(), d) <= 7) return "7 derniers jours";
  if (differenceInCalendarDays(new Date(), d) <= 30) return "30 derniers jours";
  return "Plus ancien";
}

function MailPage() {
  const status = useServerFn(getMailStatus);
  const fetchAccounts = useServerFn(listMailAccounts);
  const fetchMessages = useServerFn(listMessages);
  const send = useServerFn(sendMessage);
  const { space } = useWorkspace();
  const [view, setView] = useState<(typeof VIEWS)[number]["id"]>("inbox");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [account, setAccount] = useState<MailAccountId>("primary");

  const { data: connection } = useQuery({
    queryKey: ["mail-status"],
    queryFn: () => status({}),
    retry: false,
  });

  const { data: allAccounts } = useQuery({
    queryKey: ["mail-accounts"],
    queryFn: () => fetchAccounts({}),
    enabled: connection?.connected === true,
    retry: false,
  });

  /** Boîtes autorisées dans l'espace courant (vide = toutes). */
  const allowed = space?.mail_accounts ?? [];
  const accounts = (allAccounts ?? []).filter(
    (a) => allowed.length === 0 || allowed.includes(a.id),
  );

  useEffect(() => {
    if (accounts.length > 0 && !accounts.some((a) => a.id === account)) {
      setAccount(accounts[0]!.id);
      setOpenId(null);
    }
  }, [accounts.map((a) => a.id).join(","), account]);

  const baseQuery = VIEWS.find((v) => v.id === view)!.query;
  const query = search.trim() ? `${baseQuery} ${search.trim()}` : baseQuery;

  const {
    data: messages,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["mail", account, query],
    enabled: connection?.connected === true,
    retry: false,
    queryFn: () => fetchMessages({ data: { query, account } }),
  });

  const compose = useMutation({
    mutationFn: (input: { to: string; subject: string; body: string }) =>
      send({ data: { ...input, account } }),
    onSuccess: () => toast.success("Message envoyé"),
    onError: (e: Error) => toast.error(e.message),
  });

  const list = messages ?? [];
  const current = list.find((m) => m.id === openId) ?? list[0] ?? null;
  const activeAccount = accounts.find((a) => a.id === account);
  const activeEmail = activeAccount?.email ?? "Compte Google";

  const groups = list.reduce<Record<string, MailMessage[]>>((acc, m) => {
    (acc[groupLabel(m.date)] ??= []).push(m);
    return acc;
  }, {});

  return (
    <AppShell>
      <PageHeader
        title="Boîte Mail"
        icon={Mail}
        iconColor="#EF4444"
        subtitle={activeEmail}
        actions={<ComposeDialog onSend={(v) => compose.mutate(v)} />}
      />

      {connection?.connected === false ? (
        <EmptyState>
          La boîte Gmail n'est pas encore reliée. Connectez le compte Google Mail pour afficher vos
          messages ici.
        </EmptyState>
      ) : error ? (
        <EmptyState>Gmail a renvoyé une erreur : {(error as Error).message}</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[13rem_22rem_1fr]">
          <aside className="glass h-fit p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="press flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-muted/60">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-[0.62rem] font-semibold uppercase">
                    {activeEmail.slice(0, 2)}
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-sm font-semibold">
                      {activeEmail.split("@")[0]}
                    </span>
                    <span className="block truncate text-[0.68rem] text-muted-foreground">
                      {activeEmail}
                    </span>
                  </span>
                  <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                <DropdownMenuLabel className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                  Comptes
                </DropdownMenuLabel>
                {accounts.map((a, i) => (
                  <DropdownMenuItem
                    key={a.id}
                    className="gap-2"
                    onClick={() => {
                      setAccount(a.id);
                      setOpenId(null);
                    }}
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-[0.6rem] font-semibold uppercase">
                      {a.email.slice(0, 2)}
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-sm font-semibold">
                        {a.email.split("@")[0]}
                      </span>
                      <span className="block truncate text-[0.68rem] text-muted-foreground">
                        {a.email}
                      </span>
                    </span>
                    {a.id === account ? (
                      <Check className="size-3.5 shrink-0" />
                    ) : (
                      <kbd className="shrink-0 rounded border border-border px-1 text-[0.6rem] text-muted-foreground">
                        ⌃{i + 1}
                      </kbd>
                    )}
                  </DropdownMenuItem>
                ))}
                {accounts.length === 0 ? (
                  <DropdownMenuItem disabled>Aucun compte disponible</DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>

            <nav className="mt-2 space-y-0.5">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setView(v.id);
                    setOpenId(null);
                  }}
                  className={cn(
                    "press flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium transition-colors",
                    view === v.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <v.icon className="size-4 shrink-0" />
                  <span className="truncate">{v.label}</span>
                </button>
              ))}
            </nav>

            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="h-9 pl-8"
              />
            </div>
          </aside>

          <div className="glass max-h-[72vh] overflow-y-auto">
            {isFetching && list.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Chargement des messages…</p>
            ) : list.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Aucun message.</p>
            ) : (
              Object.entries(groups).map(([label, items]) => (
                <div key={label}>
                  <p className="sticky top-0 z-10 bg-card/85 px-3 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground backdrop-blur">
                    {label}
                  </p>
                  <ul>
                    {items.map((m) => (
                      <li key={m.id}>
                        <button
                          onClick={() => setOpenId(m.id)}
                          className={cn(
                            "press flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                            current?.id === m.id && "bg-muted",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-1.5 size-2 shrink-0 rounded-full",
                              m.unread ? "bg-brand" : "bg-transparent",
                            )}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span
                                className={cn(
                                  "min-w-0 truncate text-sm",
                                  m.unread ? "font-bold" : "font-medium",
                                )}
                              >
                                {m.from.replace(/<.*>/, "").trim() || m.from}
                              </span>
                              <span className="shrink-0 text-[0.68rem] tabular-nums text-muted-foreground">
                                {format(parseISO(m.date), "d MMM HH:mm", { locale: fr })}
                              </span>
                            </span>
                            <span className="block truncate text-sm">{m.subject}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {m.snippet}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>

          <div className="glass p-5">
            {current ? (
              <MailReader message={current} onReply={(v) => compose.mutate(v)} />
            ) : (
              <div className="grid place-items-center py-16 text-sm text-muted-foreground">
                <Inbox className="mb-2 size-6" /> Sélectionnez un message
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function MailReader({
  message,
  onReply,
}: {
  message: MailMessage;
  onReply: (v: { to: string; subject: string; body: string }) => void;
}) {
  const [reply, setReply] = useState("");
  const address = message.from.match(/<(.+)>/)?.[1] ?? message.from;

  return (
    <article>
      <h2 className="text-lg font-display">{message.subject}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {message.from} · {format(parseISO(message.date), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
      </p>
      <p className="mt-4 max-h-[42vh] overflow-y-auto whitespace-pre-wrap break-words text-sm">
        {message.body || message.snippet}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!reply.trim()) return;
          onReply({
            to: address,
            subject: message.subject.startsWith("Re:")
              ? message.subject
              : `Re: ${message.subject}`,
            body: reply,
          });
          setReply("");
        }}
        className="mt-5 space-y-2 border-t border-border pt-4"
      >
        <Textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={3}
          placeholder={`Répondre à ${address}…`}
        />
        <Button type="submit" size="sm" className="gap-1.5">
          <Send className="size-4" /> Envoyer la réponse
        </Button>
      </form>
    </article>
  );
}

function ComposeDialog({
  onSend,
}: {
  onSend: (v: { to: string; subject: string; body: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ to: "", subject: "", body: "" });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Send className="size-4" /> Rédiger
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouveau message</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            value={form.to}
            onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
            placeholder="Destinataire"
          />
          <Input
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            placeholder="Objet"
          />
          <Textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={7}
            placeholder="Votre message…"
          />
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              if (!form.to || !form.subject) return;
              onSend(form);
              setForm({ to: "", subject: "", body: "" });
              setOpen(false);
            }}
          >
            Envoyer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
