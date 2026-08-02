import type { ComponentType, ReactNode } from "react";
import { useWorkspace } from "@/lib/workspace";

export function PageHeader({
  title,
  subtitle,
  actions,
  icon: Icon,
  iconColor,
  banner = true,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ComponentType<{ className?: string; style?: React.CSSProperties | undefined }>;
  iconColor?: string;
  /** Affiche la bannière de l'espace au-dessus du titre. */
  banner?: boolean;
}) {
  const { space } = useWorkspace();
  const bannerUrl = banner ? (space?.banner_url ?? null) : null;

  return (
    <header className="rise mb-8">
      {bannerUrl ? (
        <div className="relative mb-8 h-[152px] w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-[var(--shadow-soft)]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bannerUrl})` }}
            role="presentation"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-background/45 via-background/5 to-transparent"
          />
        </div>
      ) : null}
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
