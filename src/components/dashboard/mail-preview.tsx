import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail } from "lucide-react";
import { listMessages } from "@/lib/mail.functions";
import { useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export function MailPreview() {
  const fetchMessages = useServerFn(listMessages);
  const { space } = useWorkspace();
  const account = (space?.mail_accounts?.[0] ?? "primary") as "primary" | "secondary";
  const { data, error, isLoading } = useQuery({
    queryKey: ["mail-preview", account],
    staleTime: 3 * 60 * 1000,
    retry: false,
    queryFn: () => fetchMessages({ data: { maxResults: 5, query: "in:inbox", account } }),
  });

  const messages = data ?? [];

  return (
    <section className="glass flex min-w-0 flex-col p-3">
      <header className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          <Mail className="size-3.5" /> Derniers mails
        </p>
        <Link to="/mail" className="text-xs font-medium underline-offset-4 hover:underline">
          Ouvrir
        </Link>
      </header>

      {error ? (
        <p className="text-sm text-muted-foreground">Boîte mail indisponible.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun message.</p>
      ) : (
        <ul className="space-y-0.5">
          {messages.map((m) => (
            <li key={m.id} className="soft-row px-2 py-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <p
                  className={cn(
                    "min-w-0 truncate text-sm",
                    m.unread ? "font-semibold" : "font-medium text-foreground/80",
                  )}
                >
                  {m.from.replace(/<.*>/, "").replace(/"/g, "").trim() || m.from}
                </p>
                <span className="shrink-0 text-[0.68rem] text-muted-foreground">
                  {formatDistanceToNowStrict(new Date(m.date), { locale: fr })}
                </span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{m.subject}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
