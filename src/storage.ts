import { dirname } from "node:path";
import { emptyState, type AppState, type City } from "./types.ts";

export function resolveDataPath(env: Record<string, string | undefined> = process.env): string {
  if (env.WEATHER_APP_DATA_FILE?.trim()) return env.WEATHER_APP_DATA_FILE.trim();
  const configHome = env.XDG_CONFIG_HOME?.trim() || `${env.HOME || "."}/.config`;
  return `${configHome}/wheather-app/data.json`;
}

function isCity(value: unknown): value is City {
  if (!value || typeof value !== "object") return false;
  const city = value as Record<string, unknown>;
  return (
    typeof city.id === "string" &&
    typeof city.name === "string" &&
    city.name.length > 0 &&
    typeof city.latitude === "number" &&
    Number.isFinite(city.latitude) &&
    typeof city.longitude === "number" &&
    Number.isFinite(city.longitude) &&
    (city.country === undefined || typeof city.country === "string")
  );
}

function isState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  if (
    state.unit !== "celsius" ||
    !Array.isArray(state.cities) ||
    !state.cities.every(isCity) ||
    !(state.defaultCityId === null || typeof state.defaultCityId === "string")
  ) return false;
  return state.defaultCityId === null || state.cities.some((city) => city.id === state.defaultCityId);
}

async function replaceWithEmptyState(path: string): Promise<AppState> {
  const state = emptyState();
  await saveState(path, state);
  return state;
}

export async function loadState(path: string): Promise<AppState> {
  try {
    const text = await Bun.file(path).text();
    const parsed: unknown = JSON.parse(text);
    if (!isState(parsed)) return replaceWithEmptyState(path);
    return {
      cities: parsed.cities,
      defaultCityId: parsed.defaultCityId,
      unit: "celsius",
    };
  } catch {
    return replaceWithEmptyState(path);
  }
}

export async function saveState(path: string, state: AppState): Promise<void> {
  const normalized: AppState = {
    cities: state.cities,
    defaultCityId: state.defaultCityId,
    unit: "celsius",
  };
  const temporaryPath = `${path}.tmp-${process.pid}`;
  await Bun.write(temporaryPath, JSON.stringify(normalized, null, 2) + "\n");
  try {
    await Bun.write(path, await Bun.file(temporaryPath).arrayBuffer());
    await Bun.file(temporaryPath).delete();
  } catch (error) {
    await Bun.file(temporaryPath).delete().catch(() => undefined);
    throw error;
  }
}

export async function ensureDataDirectory(path: string): Promise<void> {
  const directory = dirname(path);
  if (directory !== ".") await Bun.$`mkdir -p ${directory}`;
}
