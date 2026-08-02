import type { ComponentType, ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/** État vide soigné, partagé par tous les modules. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[16px] border border-dashed border-border px-6 py-12 text-center">
      {Icon ? (
        <span className="grid size-11 place-items-center rounded-full bg-secondary/70 text-muted-foreground">
          <Icon size={20} strokeWidth={1.5} />
        </span>
      ) : null}
      <div className="space-y-1">
        <p className="font-display text-[1rem]">{title}</p>
        {description ? (
          <p className="mx-auto max-w-[46ch] text-[0.8125rem] leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** Squelette de chargement générique pour les listes et tables. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-[12px] border border-border p-3">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-3.5 flex-1" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-14" />
        </div>
      ))}
    </div>
  );
}
