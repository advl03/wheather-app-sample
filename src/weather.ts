import type { City } from "./types.ts";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type GeocodingResult = {
  id?: unknown;
  name?: unknown;
  country?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

function asFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function fetchCity(name: string, fetcher: Fetcher = fetch): Promise<City> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("El nombre de la ciudad no puede estar vacío.");
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", trimmedName);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");

  let response: Response;
  try {
    response = await fetcher(url);
  } catch (error) {
    throw new Error(`No se pudo consultar la geocodificación: ${error instanceof Error ? error.message : "error de red"}`);
  }
  if (!response.ok) throw new Error(`La geocodificación respondió con HTTP ${response.status}.`);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("La respuesta de geocodificación no es JSON válido.");
  }
  if (!isRecord(payload) || !Array.isArray(payload.results)) {
    throw new Error("La respuesta de geocodificación tiene un formato inválido.");
  }
  const result = payload.results[0] as GeocodingResult | undefined;
  if (!result) throw new Error(`No se encontraron resultados para "${trimmedName}".`);
  if (
    typeof result.name !== "string" ||
    !asFiniteNumber(result.latitude) ||
    !asFiniteNumber(result.longitude) ||
    (result.country !== undefined && typeof result.country !== "string")
  ) {
    throw new Error("La respuesta de geocodificación tiene datos de ciudad inválidos.");
  }
  const id = typeof result.id === "string" || typeof result.id === "number"
    ? String(result.id)
    : `${result.name}:${result.latitude}:${result.longitude}`;
  return {
    id,
    name: result.name,
    ...(result.country === undefined ? {} : { country: result.country }),
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

export async function fetchCurrentTemperature(city: City, fetcher: Fetcher = fetch): Promise<number> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set("current", "temperature_2m");

  let response: Response;
  try {
    response = await fetcher(url);
  } catch (error) {
    throw new Error(`No se pudo consultar el pronóstico: ${error instanceof Error ? error.message : "error de red"}`);
  }
  if (!response.ok) throw new Error(`El pronóstico respondió con HTTP ${response.status}.`);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("La respuesta del pronóstico no es JSON válido.");
  }
  if (!isRecord(payload) || !isRecord(payload.current) || !asFiniteNumber(payload.current.temperature_2m)) {
    throw new Error("La respuesta del pronóstico no contiene una temperatura válida.");
  }
  return payload.current.temperature_2m;
}
