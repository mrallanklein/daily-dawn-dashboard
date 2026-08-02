import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";

const coordsSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

const searchSchema = z.object({ query: z.string().min(2).max(80) });

const UA = "AlianDashboard/1.0 (contact: pro.allanklein@gmail.com)";

/** Météo courante + min/max du jour (Open-Meteo, sans clé). */
export const fetchWeather = createServerFn({ method: "GET" })
  .inputValidator(coordsSchema)
  .handler(async ({ data }) => {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${data.lat}&longitude=${data.lon}` +
      `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Open-Meteo [${res.status}]: ${body.slice(0, 200)}`);
      throw new Error(`Service météo indisponible (${res.status})`);
    }
    const json = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
      daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
    };
    if (json.current?.temperature_2m == null) throw new Error("Réponse météo incomplète");
    return {
      temperature: Math.round(json.current.temperature_2m),
      code: json.current.weather_code ?? 0,
      max: Math.round(json.daily?.temperature_2m_max?.[0] ?? json.current.temperature_2m),
      min: Math.round(json.daily?.temperature_2m_min?.[0] ?? json.current.temperature_2m),
    };
  });

type Place = { name: string; lat: number; lon: number; country: string | null };

/** Recherche de ville (Open-Meteo geocoding). */
export const searchPlaces = createServerFn({ method: "GET" })
  .inputValidator(searchSchema)
  .handler(async ({ data }): Promise<Place[]> => {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(data.query)}&count=6&language=fr&format=json`,
      { headers: { Accept: "application/json", "User-Agent": UA } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      results?: Array<{ name: string; latitude: number; longitude: number; country?: string; admin1?: string }>;
    };
    return (json.results ?? []).map((r) => ({
      name: r.admin1 && r.admin1 !== r.name ? `${r.name}` : r.name,
      lat: r.latitude,
      lon: r.longitude,
      country: r.country ?? null,
    }));
  });

/** Nom de lieu pour des coordonnées (géocodage inverse serveur). */
export const reverseGeocode = createServerFn({ method: "GET" })
  .inputValidator(coordsSchema)
  .handler(async ({ data }) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${data.lat}&lon=${data.lon}&format=json&zoom=10&accept-language=fr`,
        { headers: { Accept: "application/json", "User-Agent": UA } },
      );
      if (res.ok) {
        const json = (await res.json()) as {
          address?: { city?: string; town?: string; village?: string; municipality?: string; county?: string; state?: string };
        };
        const a = json.address ?? {};
        const name = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? a.state;
        if (name) return { name, lat: data.lat, lon: data.lon };
      }
    } catch (err) {
      console.error("Nominatim reverse:", err);
    }
    return { name: "Ma position", lat: data.lat, lon: data.lon };
  });

/** Repli : localisation approximative depuis l'IP de la requête. */
export const locateByIp = createServerFn({ method: "GET" }).handler(async () => {
  const ip =
    getRequestHeader("cf-connecting-ip") ??
    getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
    "";
  const url = ip ? `https://ipapi.co/${ip}/json/` : "https://ipapi.co/json/";
  try {
    const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": UA } });
    if (!res.ok) throw new Error(`ipapi ${res.status}`);
    const json = (await res.json()) as { city?: string; latitude?: number; longitude?: number };
    if (json.latitude == null || json.longitude == null) throw new Error("réponse IP incomplète");
    return { name: json.city ?? "Ma position", lat: json.latitude, lon: json.longitude };
  } catch (err) {
    console.error("locateByIp:", err);
    return null;
  }
});
