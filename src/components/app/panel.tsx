import type { ComponentType, ReactNode } from "react";
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
    <section className={cn("glass topline elevate flex flex-col overflow-hidden", className)}>
      {title || action ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border/70 px-5 py-4">
          <div className="min-w-0 flex-1">
            {eyebrow ? <p className="eyebrow truncate">{eyebrow}</p> : null}
            {title ? (
              <h2 className="truncate text-[0.975rem] font-display font-semibold tracking-[-0.015em]">
                {title}
              </h2>
            ) : null}
          </div>
          {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({
  children,
  icon: Icon,
  hint,
  action,
}: {
  children: ReactNode;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(70%_60%_at_50%_0%,color-mix(in_oklab,var(--brand)_9%,transparent),transparent_70%)]"
      />
      {Icon ? (
        <span className="relative grid size-11 place-items-center rounded-full border border-border bg-card/70 text-muted-foreground shadow-[var(--shadow-xs)]">
          <Icon className="size-5" strokeWidth={1.5} />
        </span>
      ) : null}
      <p className="relative text-[0.9rem] font-medium text-foreground/80">{children}</p>
      {hint ? (
        <p className="relative max-w-[36ch] text-[0.82rem] leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {action ? <div className="relative mt-1">{action}</div> : null}
    </div>
  );
}
