import type { ComponentType, ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
  icon: Icon,
  iconColor,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ComponentType<{ className?: string; style?: React.CSSProperties | undefined }>;
  iconColor?: string;
  /** Obsolète : les bannières ont été supprimées. */
  banner?: boolean;
}) {
  return (
    <header className="rise mb-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {Icon ? (
            <span className="glass grid size-12 shrink-0 place-items-center rounded-2xl">
              <Icon
                className="size-6"
                style={iconColor ? { color: iconColor } : undefined}
              />
            </span>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-[1.75rem] font-display font-bold tracking-[-0.03em] sm:text-[2.1rem] sm:leading-[1.1]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1.5 max-w-[60ch] text-[0.9rem] leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
