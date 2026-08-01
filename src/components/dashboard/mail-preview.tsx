import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link, useNavigate } from "@tanstack/react-router";
import { formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail, Search, X } from "lucide-react";
import { listMessages, type MailAccountId } from "@/lib/mail.functions";
import { useWorkspace } from "@/lib/workspace";
import { useMailColors } from "@/lib/mail-colors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MailPreview() {
  const fetchMessages = useServerFn(listMessages);
  const navigate = useNavigate();
  const { space } = useWorkspace();
  const { colorFor } = useMailColors();
  const account = (space?.mail_accounts?.[0] ?? "primary") as MailAccountId;
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(5);

  const query = q.trim() ? `in:inbox ${q.trim()}` : "in:inbox";
  const { data, error, isLoading } = useQuery({
    queryKey: ["mail-preview", account, query, limit],
    staleTime: 3 * 60 * 1000,
    retry: false,
    queryFn: () => fetchMessages({ data: { maxResults: limit, query, account } }),
  });

  const messages = data ?? [];

  return (
    <section className="glass flex min-w-0 flex-col p-3">
      <header className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Mail className="size-3.5" /> Derniers mails
        </p>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={searchOpen ? "Fermer la recherche" : "Rechercher un mail"}
            className="press grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {searchOpen ? <X className="size-3.5" /> : <Search className="size-3.5" />}
          </button>
          <Link to="/mail" search={{}} className="text-xs font-medium underline-offset-4 hover:underline">
            Ouvrir
          </Link>
        </div>
      </header>

      {searchOpen ? (
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher…"
          className="mb-2 h-8 text-sm"
        />
      ) : null}

      {error ? (
        <p className="text-sm text-muted-foreground">Boîte mail indisponible.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun message.</p>
      ) : (
        <>
          <ul className="space-y-0.5">
            {messages.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() =>
                    navigate({ to: "/mail", search: { msg: m.id, account } })
                  }
                  className="soft-row flex w-full items-start gap-2 px-2 py-1.5 text-left"
                >
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: colorFor(account), opacity: m.unread ? 1 : 0.35 }}
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
          {limit < 45 ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 self-start text-xs"
              onClick={() => setLimit((v) => v + 10)}
            >
              Charger plus
            </Button>
          ) : null}
        </>
      )}
    </section>
  );
}
