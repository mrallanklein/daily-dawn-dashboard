import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudOff,
  CloudSnow,
  Sun,
  SunDim,
} from "lucide-react";
import type { Weather } from "@/lib/data";

function describe(code: number) {
  if (code === 0) return { Icon: Sun, label: "Ciel dégagé", color: "#F5A524" };
  if (code <= 2) return { Icon: SunDim, label: "Peu nuageux", color: "#EAB308" };
  if (code === 3) return { Icon: Cloud, label: "Couvert", color: "#94A3B8" };
  if (code <= 48) return { Icon: CloudFog, label: "Brouillard", color: "#A1A1AA" };
  if (code <= 57) return { Icon: CloudDrizzle, label: "Bruine", color: "#60A5FA" };
  if (code <= 67) return { Icon: CloudRain, label: "Pluie", color: "#3B82F6" };
  if (code <= 77) return { Icon: CloudSnow, label: "Neige", color: "#7DD3FC" };
  if (code <= 82) return { Icon: CloudRain, label: "Averses", color: "#2563EB" };
  if (code <= 86) return { Icon: CloudSnow, label: "Averses de neige", color: "#7DD3FC" };
  return { Icon: CloudLightning, label: "Orage", color: "#8B5CF6" };
}

export function WeatherBadge({
  weather,
  city,
  isLoading = false,
  isError = false,
  onRetry,
}: {
  weather?: Weather | undefined;
  city: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}) {
  if (!weather) {
    if (isError) {
      return (
        <button
          type="button"
          onClick={onRetry}
          className="press flex items-center gap-2 rounded-lg px-2 py-1 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/60"
        >
          <CloudOff size={22} strokeWidth={1.5} className="shrink-0" />
          <span className="leading-tight">
            Météo indisponible
            <span className="block text-xs">Cliquer pour réessayer</span>
          </span>
        </button>
      );
    }
    return (
      <div className="flex items-center gap-3" aria-busy={isLoading}>
        <div className="size-7 animate-pulse rounded-full bg-muted" />
        <div className="space-y-1.5">
          <div className="h-4 w-10 animate-pulse rounded bg-muted" />
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }
  const { Icon, label, color } = describe(weather.code);
  const url = `https://www.google.com/search?q=${encodeURIComponent(`météo ${city}`)}`;
  const open = (e: React.MouseEvent) => {
    // Dans un aperçu en iframe, target="_blank" peut être bloqué : on force l'ouverture.
    e.preventDefault();
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) window.top?.location.assign(url);
  };
  return (
    <button
      type="button"
      onClick={open}
      title={`Rechercher « météo ${city} » sur Google`}
      className="press flex items-center gap-3 rounded-lg px-2 py-1 text-left transition-colors hover:bg-muted/60"
    >
      <Icon size={28} strokeWidth={1.75} className="shrink-0" style={{ color }} />
      <div className="leading-tight">
        <p className="text-xl font-display font-bold">{weather.temperature}°</p>
        <p className="text-xs font-medium text-muted-foreground">
          {label} · {city} · {weather.min}° / {weather.max}°
        </p>
      </div>
    </button>
  );
}
