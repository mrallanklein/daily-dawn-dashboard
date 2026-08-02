import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; to?: string; params?: Record<string, string> };

/** Fil d'Ariane des pages ouvertes (ex. Projets › Projet Alpha › Tâche 3). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Fil d'Ariane" className="mb-3 flex flex-wrap items-center gap-1 text-[0.8125rem]">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1">
            {item.to && !last ? (
              <Link
                to={item.to}
                {...(item.params ? { params: item.params } : {})}
                className="rounded-md px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={last ? "page" : undefined}
                className="px-1.5 py-0.5 text-foreground"
              >
                {item.label}
              </span>
            )}
            {last ? null : (
              <ChevronRight size={13} strokeWidth={1.6} className="text-muted-foreground/70" />
            )}
          </span>
        );
      })}
    </nav>
  );
}
