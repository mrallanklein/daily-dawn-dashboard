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
    <section className={cn("flex flex-col", className)}>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-2">
        <div className="min-w-0">
          <h2 className="truncate text-[0.95rem] font-display font-semibold tracking-tight">
            {title}
          </h2>
          {eyebrow ? <p className="text-xs text-muted-foreground">{eyebrow}</p> : null}
        </div>
        {action}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="px-1 py-4 text-sm text-muted-foreground">
      {children}
    </p>
  );
}