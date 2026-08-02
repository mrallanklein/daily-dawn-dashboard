/** Fournisseurs météo : Open-Meteo en principal, MET Norway en repli. */

export type WeatherResult = { temperature: number; code: number; max: number; min: number };

const UA = "AlianDashboard/1.0 (contact: pro.allanklein@gmail.com)";

const cache = new Map<string, { at: number; value: WeatherResult }>();
const TTL = 15 * 60 * 1000;

function key(lat: number, lon: number) {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

async function fromOpenMeteo(lat: number, lon: number): Promise<WeatherResult | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      console.error(`Open-Meteo [${res.status}]: ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const json = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
      daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[] };
    };
    const t = json.current?.temperature_2m;
    if (t == null) return null;
    return {
      temperature: Math.round(t),
      code: json.current?.weather_code ?? 0,
      max: Math.round(json.daily?.temperature_2m_max?.[0] ?? t),
      min: Math.round(json.daily?.temperature_2m_min?.[0] ?? t),
    };
  } catch (err) {
    console.error("Open-Meteo:", err);
    return null;
  }
}

/** Symbole MET Norway → code WMO approximatif (aligné sur les icônes du badge). */
function symbolToCode(symbol: string): number {
  const s = symbol.replace(/_(day|night|polartwilight)$/, "");
  if (s === "clearsky") return 0;
  if (s === "fair" || s === "partlycloudy") return 2;
  if (s === "cloudy") return 3;
  if (s.includes("fog")) return 45;
  if (s.includes("thunder")) return 95;
  if (s.includes("sleet")) return 66;
  if (s.includes("snow")) return 73;
  if (s.includes("drizzle")) return 55;
  if (s.includes("rainshowers")) return 80;
  if (s.includes("rain")) return 63;
  return 3;
}

async function fromMetNo(lat: number, lon: number): Promise<WeatherResult | null> {
  try {
    const res = await fetch(
      `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`,
      { headers: { Accept: "application/json", "User-Agent": UA } },
    );
    if (!res.ok) {
      console.error(`MET Norway [${res.status}]`);
      return null;
    }
    const json = (await res.json()) as {
      properties?: {
        timeseries?: Array<{
          time: string;
          data?: {
            instant?: { details?: { air_temperature?: number } };
            next_1_hours?: { summary?: { symbol_code?: string } };
            next_6_hours?: { summary?: { symbol_code?: string } };
          };
        }>;
      };
    };
    const series = json.properties?.timeseries ?? [];
    const first = series[0];
    const temp = first?.data?.instant?.details?.air_temperature;
    if (temp == null) return null;
    const day = (first?.time ?? "").slice(0, 10);
    const todays = series
      .filter((s) => s.time.slice(0, 10) === day)
      .map((s) => s.data?.instant?.details?.air_temperature)
      .filter((v): v is number => v != null);
    const symbol =
      first?.data?.next_1_hours?.summary?.symbol_code ??
      first?.data?.next_6_hours?.summary?.symbol_code ??
      "cloudy";
    return {
      temperature: Math.round(temp),
      code: symbolToCode(symbol),
      max: Math.round(Math.max(temp, ...todays)),
      min: Math.round(Math.min(temp, ...todays)),
    };
  } catch (err) {
    console.error("MET Norway:", err);
    return null;
  }
}

/** Météo courante avec cache court et repli de fournisseur. */
export async function getWeather(lat: number, lon: number): Promise<WeatherResult> {
  const k = key(lat, lon);
  const hit = cache.get(k);
  if (hit && Date.now() - hit.at < TTL) return hit.value;

  const value = (await fromOpenMeteo(lat, lon)) ?? (await fromMetNo(lat, lon));
  if (!value) {
    if (hit) return hit.value; // dernier résultat connu plutôt qu'une erreur
    throw new Error("Service météo indisponible");
  }
  cache.set(k, { at: Date.now(), value });
  return value;
}
