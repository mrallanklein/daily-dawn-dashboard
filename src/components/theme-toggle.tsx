import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type Theme = "light" | "dark";

function apply(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

/** Nuit : 20h → 7h. Jour : 7h → 20h. */
function themeForNow(date = new Date()): Theme {
  const h = date.getHours();
  return h >= 20 || h < 7 ? "dark" : "light";
}

/** Clé du choix manuel : { theme, day } — réinitialisé au changement de journée. */
type Override = { theme: Theme; day: string };

function readOverride(): Override | null {
  try {
    const raw = window.localStorage.getItem("ak-theme-override");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Override;
    return parsed?.theme ? parsed : null;
  } catch {
    return null;
  }
}

function slot(date = new Date()) {
  // Une plage = une demi-journée (jour ou nuit) : le choix manuel ne dure que le créneau courant.
  return `${date.toDateString()}-${themeForNow(date)}`;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const resolve = () => {
      const override = readOverride();
      const next: Theme = override && override.day === slot() ? override.theme : themeForNow();
      setTheme(next);
      apply(next);
    };
    resolve();
    const id = window.setInterval(resolve, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(
        "ak-theme-override",
        JSON.stringify({ theme: next, day: slot() } satisfies Override),
      );
      apply(next);
      return next;
    });
  };

  return { theme, toggle };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Passer en thème clair" : "Passer en thème sombre"}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
