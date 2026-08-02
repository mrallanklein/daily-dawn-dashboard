import { cn } from "@/lib/utils";

/** Bloc gris animé, brique de base de tous les squelettes. */
export function Bar({ className }: { className?: string }) {
  return <span className={cn("block animate-pulse rounded-md bg-muted", className)} />;
}

/**
 * Squelette de liste : reproduit exactement la grille d'une ligne réelle
 * (puce, libellé, méta, valeur à droite) pour éviter tout saut de contenu.
 */
export function RowsSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <ul className={cn("space-y-1", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-2 py-1.5">
          <Bar className="size-4 shrink-0 rounded-full" />
          <span className="min-w-0 flex-1 space-y-1.5">
            <Bar className={cn("h-3", i % 3 === 0 ? "w-2/3" : i % 3 === 1 ? "w-1/2" : "w-3/4")} />
            <Bar className="h-2.5 w-1/3" />
          </span>
          <Bar className="h-3 w-12 shrink-0" />
        </li>
      ))}
    </ul>
  );
}

/** Squelette de grille de cartes (kanban, galerie projets). */
export function CardsSkeleton({ cards = 3, className }: { cards?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)} aria-hidden>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-2xl border border-border p-3">
          <Bar className="aspect-[3/2] w-full rounded-xl" />
          <Bar className="h-3.5 w-2/3" />
          <Bar className="h-2.5 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/** Squelette de grille mensuelle du calendrier : 6 semaines × 7 jours. */
export function CalendarGridSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1 p-3" aria-hidden>
      {Array.from({ length: 42 }).map((_, i) => (
        <div key={i} className="min-h-[6.5rem] space-y-1.5 rounded-xl border border-border/50 p-1.5">
          <Bar className="size-6 rounded-full" />
          {i % 4 === 0 ? <Bar className="h-3 w-full" /> : null}
          {i % 5 === 0 ? <Bar className="h-3 w-2/3" /> : null}
        </div>
      ))}
    </div>
  );
}