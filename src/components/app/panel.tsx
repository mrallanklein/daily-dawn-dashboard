import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  eyebrow,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("surface flex flex-col overflow-hidden", className)}>
      {title || action ? (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border px-4 py-3">
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                {eyebrow}
              </p>
            ) : null}
            {title ? <h2 className="truncate text-sm font-display">{title}</h2> : null}
          </div>
          {action ? <div className="flex shrink-0 items-center gap-1.5">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn("flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
