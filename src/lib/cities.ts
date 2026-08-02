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

/** Position du navigateur → ville la plus proche (Nominatim, sans clé API). */
export function locateCity(): Promise<CityOption> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("La géolocalisation n'est pas disponible sur cet appareil"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { Accept: "application/json" } },
          );
          if (!res.ok) throw new Error("Géocodage indisponible");
          const json = (await res.json()) as {
            address?: { city?: string; town?: string; village?: string; county?: string };
          };
          const city =
            json.address?.city ??
            json.address?.town ??
            json.address?.village ??
            json.address?.county;
          resolve({ name: city ?? "Ma position", lat: latitude, lon: longitude });
        } catch {
          resolve({ name: "Ma position", lat: latitude, lon: longitude });
        }
      },
      (error) => reject(new Error(error.message || "Position refusée")),
      { timeout: 10000 },
    );
  });
}
