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
  icon?: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor?: string;
  /** Affiche la bannière de l'espace au-dessus du titre. */
  banner?: boolean;
}) {
  const { space } = useWorkspace();
  const bannerUrl = banner ? space?.banner_url ?? null : null;

  return (
    <header className="mb-8">
      {bannerUrl ? (
        <div
          className="mb-4 h-[140px] w-full rounded-xl border border-border bg-muted bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerUrl})` }}
          role="presentation"
        />
      ) : null}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {Icon ? (
            <Icon className="size-9 shrink-0" style={iconColor ? { color: iconColor } : undefined} />
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-display font-bold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
