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
  if (code === 0) return { Icon: Sun, label: "Ciel dégagé", color: "#F59E0B" };
  if (code <= 2) return { Icon: SunDim, label: "Peu nuageux", color: "#FBBF24" };
  if (code === 3) return { Icon: Cloud, label: "Couvert", color: "#94A3B8" };
  if (code <= 48) return { Icon: CloudFog, label: "Brouillard", color: "#94A3B8" };
  if (code <= 57) return { Icon: CloudDrizzle, label: "Bruine", color: "#60A5FA" };
  if (code <= 67) return { Icon: CloudRain, label: "Pluie", color: "#3B82F6" };
  if (code <= 77) return { Icon: CloudSnow, label: "Neige", color: "#7DD3FC" };
  if (code <= 82) return { Icon: CloudRain, label: "Averses", color: "#2563EB" };
  if (code <= 86) return { Icon: CloudSnow, label: "Averses de neige", color: "#7DD3FC" };
  return { Icon: CloudLightning, label: "Orage", color: "#A855F7" };
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
  const { Icon, label, color } = describe(weather.code);
  return (
    <a
      href={`https://www.google.com/search?q=${encodeURIComponent(`météo ${city}`)}`}
      target="_blank"
      rel="noreferrer"
      title={`Voir la météo de ${city} sur Google`}
      className="press flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-muted/60"
    >
      <Icon className="size-7" strokeWidth={1.6} style={{ color }} />
      <div className="leading-tight">
        <p className="text-xl font-display font-bold">{weather.temperature}°</p>
        <p className="text-xs text-muted-foreground">
          {label} · {city} · {weather.min}° / {weather.max}°
        </p>
      </div>
    </a>
  );
}