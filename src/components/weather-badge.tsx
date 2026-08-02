import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Sun,
  SunDim,
} from "lucide-react";
import type { Weather } from "@/lib/data";

function describe(code: number) {
  if (code === 0) return { Icon: Sun, label: "Ciel dégagé" };
  if (code <= 2) return { Icon: SunDim, label: "Peu nuageux" };
  if (code === 3) return { Icon: Cloud, label: "Couvert" };
  if (code <= 48) return { Icon: CloudFog, label: "Brouillard" };
  if (code <= 57) return { Icon: CloudDrizzle, label: "Bruine" };
  if (code <= 67) return { Icon: CloudRain, label: "Pluie" };
  if (code <= 77) return { Icon: CloudSnow, label: "Neige" };
  if (code <= 82) return { Icon: CloudRain, label: "Averses" };
  if (code <= 86) return { Icon: CloudSnow, label: "Averses de neige" };
  return { Icon: CloudLightning, label: "Orage" };
}

export function WeatherBadge({
  weather,
  city,
}: {
  weather?: Weather | undefined;
  city: string;
}) {
  if (!weather) {
    return <div className="text-sm text-muted-foreground">Météo en cours de chargement…</div>;
  }
  const { Icon, label } = describe(weather.code);
  return (
    <button
      type="button"
      onClick={() =>
        window.open(
          `https://weather.com/fr-FR/weather/today/l/${encodeURIComponent(city)}`,
          "_blank",
          "noopener,noreferrer",
        )
      }
      title={`Voir la météo de ${city}`}
      className="press flex items-center gap-3 rounded-lg px-2 py-1 text-left transition-colors hover:bg-muted/60"
    >
      <Icon size={26} strokeWidth={1.5} className="shrink-0 text-foreground/80" />
      <div className="leading-tight">
        <p className="text-xl font-display font-bold">{weather.temperature}°</p>
        <p className="text-xs text-muted-foreground">
          {label} · {city} · {weather.min}° / {weather.max}°
        </p>
      </div>
    </button>
  );
}