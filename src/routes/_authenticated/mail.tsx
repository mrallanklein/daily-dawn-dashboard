import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Inbox, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/panel";
import { getMailStatus, listMessages, sendMessage, type MailMessage } from "@/lib/mail.functions";
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

function MailPage() {
  const status = useServerFn(getMailStatus);
  const fetchMessages = useServerFn(listMessages);
  const send = useServerFn(sendMessage);
  const [query, setQuery] = useState("in:inbox");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: connection } = useQuery({
    queryKey: ["mail-status"],
    queryFn: () => status({}),
    retry: false,
  });

  const {
    data: messages,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["mail", query],
    enabled: connection?.connected === true,
    retry: false,
    queryFn: () => fetchMessages({ data: { query } }),
  });

  const compose = useMutation({
    mutationFn: (input: { to: string; subject: string; body: string }) => send({ data: input }),
    onSuccess: () => toast.success("Message envoyé"),
    onError: (e: Error) => toast.error(e.message),
  });

  const list = messages ?? [];
  const current = list.find((m) => m.id === openId) ?? list[0] ?? null;

  return (
    <AppShell>
      <PageHeader
        title="Boîte mail"
        subtitle="mr.allanklein@gmail.com"
        actions={
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                refetch();
              }}
              className="relative"
            >
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="is:unread, from:…"
                className="h-9 w-56 pl-8"
              />
            </form>
            <ComposeDialog onSend={(v) => compose.mutate(v)} />
          </>
        }
      />

      {connection?.connected === false ? (
        <EmptyState>
          La boîte Gmail n'est pas encore reliée. Connectez le compte Google Mail pour afficher vos
          messages ici.
        </EmptyState>
      ) : error ? (
        <EmptyState>Gmail a renvoyé une erreur : {(error as Error).message}</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <div className="surface max-h-[70vh] overflow-y-auto">
            {isFetching && list.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Chargement des messages…</p>
            ) : list.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Aucun message.</p>
            ) : (
              <ul className="divide-y divide-border">
                {list.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => setOpenId(m.id)}
                      className={cn(
                        "w-full px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                        current?.id === m.id && "bg-brand-soft",
                      )}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className={cn(
                            "min-w-0 truncate text-sm",
                            m.unread && "font-semibold",
                          )}
                        >
                          {m.from.replace(/<.*>/, "").trim() || m.from}
                        </p>
                        <span className="shrink-0 text-[0.68rem] tabular-nums text-muted-foreground">
                          {format(parseISO(m.date), "d MMM HH:mm", { locale: fr })}
                        </span>
                      </div>
                      <p className="truncate text-sm">{m.subject}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.snippet}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="surface p-5">
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
