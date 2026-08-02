import { locateByIp, reverseGeocode, searchPlaces } from "./weather.functions";

export type CityOption = { name: string; lat: number; lon: number };

export const CITIES: CityOption[] = [
  { name: "Paris", lat: 48.8566, lon: 2.3522 },
  { name: "Toulouse", lat: 43.6047, lon: 1.4442 },
  { name: "Lyon", lat: 45.764, lon: 4.8357 },
  { name: "Marseille", lat: 43.2965, lon: 5.3698 },
  { name: "Bordeaux", lat: 44.8378, lon: -0.5792 },
  { name: "Nice", lat: 43.7102, lon: 7.262 },
  { name: "New York", lat: 40.7128, lon: -74.006 },
  { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
  { name: "Miami", lat: 25.7617, lon: -80.1918 },
  { name: "Londres", lat: 51.5074, lon: -0.1278 },
  { name: "Barcelone", lat: 41.3851, lon: 2.1734 },
  { name: "Madrid", lat: 40.4168, lon: -3.7038 },
  { name: "Montréal", lat: 45.5017, lon: -73.5673 },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function searchCities(query: string, limit = 6) {
  const q = normalize(query.trim());
  if (!q) return CITIES.slice(0, limit);
  return CITIES.filter((c) => normalize(c.name).includes(q)).slice(0, limit);
}

/**
 * Localisation : position du navigateur si autorisée, sinon repli sur l'IP
 * (côté serveur, ce qui évite les blocages d'iframe et de permissions).
 */
export async function locateCity(): Promise<CityOption> {
  const browser = await new Promise<{ lat: number; lon: number } | null>((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  });

  if (browser) {
    const place = await reverseGeocode({ data: browser });
    return { name: place.name, lat: place.lat, lon: place.lon };
  }

  const byIp = await locateByIp();
  if (byIp) return { name: byIp.name, lat: byIp.lat, lon: byIp.lon };

  throw new Error(
    "Position introuvable : autorise la localisation dans le navigateur ou saisis une ville.",
  );
}

/** Recherche de ville en ligne, avec repli sur la liste locale. */
export async function findCities(query: string): Promise<CityOption[]> {
  const q = query.trim();
  if (q.length < 2) return searchCities(q);
  try {
    const results = await searchPlaces({ data: { query: q } });
    if (results.length) return results.map((r) => ({ name: r.name, lat: r.lat, lon: r.lon }));
  } catch {
    /* repli local */
  }
  return searchCities(q);
}
