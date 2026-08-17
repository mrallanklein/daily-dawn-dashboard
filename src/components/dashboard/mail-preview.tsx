import { useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { MailIcon } from "@/components/icons/notion-icons";
import {
  listMailAccounts,
  listMessages,
  type MailAccountId,
  type MailMessage,
} from "@/lib/mail.functions";
import { useWorkspace } from "@/lib/workspace";
import { useMailColors } from "@/lib/mail-colors";
import { MailBody } from "@/components/mail/mail-body";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PAGE = 5;

type Tagged = MailMessage & { account: MailAccountId };

export function MailPreview() {
  const fetchAccounts = useServerFn(listMailAccounts);
  const fetchMessages = useServerFn(listMessages);
  const { space } = useWorkspace();
  const { colorFor } = useMailColors();
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [openMail, setOpenMail] = useState<Tagged | null>(null);

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

  const query = q.trim() ? `in:inbox ${q.trim()}` : "in:inbox";
  const results = useQueries({
    queries: accounts.map((account) => ({
      queryKey: ["mail-preview", account, query],
      staleTime: 3 * 60 * 1000,
      retry: false,
      queryFn: () => fetchMessages({ data: { maxResults: 30, query, account } }),
    })),
  });

  const isLoading = accounts.length === 0 || results.some((r) => r.isLoading);
  const error = results.some((r) => r.error);
  const messages: Tagged[] = results
    .flatMap((r, i) => (r.data ?? []).map((m) => ({ ...m, account: accounts[i]! })))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const slice = messages.slice(page * PAGE, page * PAGE + PAGE);
  const hasNext = messages.length > (page + 1) * PAGE;

  return (
    <section className="glass flex min-w-0 flex-col p-3">
      <header className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <MailIcon size={14} /> Derniers mails
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={searchOpen ? "Fermer la recherche" : "Rechercher un mail"}
            className="press grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {searchOpen ? <X className="size-3.5" /> : <Search className="size-3.5" />}
          </button>
          <Link
            to="/mail"
            search={{ msg: undefined, account: undefined }}
            className="text-xs font-medium underline-offset-4 hover:underline"
          >
            Ouvrir
          </Link>
        </div>
      </header>

      {searchOpen ? (
        <Input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Rechercher…"
          className="mb-2 h-8 text-sm"
        />
      ) : null}

      {error ? (
        <p className="text-sm text-muted-foreground">Boîte mail indisponible.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : slice.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun message.</p>
      ) : (
        <>
          <ul className="space-y-0.5">
            {slice.map((m) => (
              <li key={`${m.account}-${m.id}`}>
                <button
                  onClick={() => setOpenMail(m)}
                  className="soft-row flex w-full items-start gap-2 px-2 py-1.5 text-left"
                >
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: colorFor(m.account), opacity: m.unread ? 1 : 0.4 }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn(
                          "min-w-0 truncate text-sm",
                          m.unread ? "font-semibold" : "font-medium text-foreground/80",
                        )}
                      >
                        {m.from.replace(/<.*>/, "").replace(/"/g, "").trim() || m.from}
                      </span>
                      <span className="shrink-0 text-[0.68rem] text-muted-foreground">
                        {formatDistanceToNowStrict(new Date(m.date), { locale: fr })}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {m.subject}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-2 flex items-center gap-1">
            {page > 0 ? (
              <button
                onClick={() => setPage((p) => p - 1)}
                aria-label="5 mails plus récents"
                title="5 mails plus récents"
                className="press grid size-7 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronUp size={16} strokeWidth={1.5} />
              </button>
            ) : null}
            {hasNext ? (
              <button
                onClick={() => setPage((p) => p + 1)}
                aria-label="5 mails antérieurs"
                title="5 mails antérieurs"
                className="press grid size-7 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronDown size={16} strokeWidth={1.5} />
              </button>
            ) : null}
          </div>
        </>
      )}

      <Dialog open={Boolean(openMail)} onOpenChange={(o) => !o && setOpenMail(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-start gap-2 pr-6 text-left text-base">
              {openMail ? (
                <span
                  className="mt-1.5 size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: colorFor(openMail.account) }}
                />
              ) : null}
              <span className="min-w-0">{openMail?.subject}</span>
            </DialogTitle>
          </DialogHeader>
          {openMail ? (
            <>
              <p className="text-xs text-muted-foreground">
                {openMail.from} ·{" "}
                {format(parseISO(openMail.date), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
              <MailBody html={openMail.bodyHtml} text={openMail.body || openMail.snippet} />
              <Link
                to="/mail"
                search={{ msg: openMail.id, account: openMail.account }}
                className="text-xs font-medium underline underline-offset-4"
              >
                Ouvrir dans la boîte mail
              </Link>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
