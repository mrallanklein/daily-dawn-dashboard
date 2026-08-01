import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ModuleCard({
  title,
  eyebrow,
  action,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel flex flex-col p-5", className)}>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          {eyebrow ? (
            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-muted-foreground">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-2xl font-accent">{title}</h2>
        </div>
        {action}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}