import type { AppState, City } from "./types.ts";
import { fetchCity as defaultFetchCity, fetchCurrentTemperature as defaultFetchTemperature } from "./weather.ts";

export interface CliIO {
  readLine(prompt: string): Promise<string | null>;
  writeLine(message: string): void;
}

export interface CliDependencies {
  fetchCity?: typeof defaultFetchCity;
  fetchCurrentTemperature?: typeof defaultFetchTemperature;
  onMutation?: (state: AppState) => Promise<void> | void;
}

export const MENU = `════════════════════════════════════════
         WEATHER CLI
════════════════════════════════════════
  1. Clima de ciudad default
  2. Clima de todas las ciudades
  3. Buscar y agregar ciudad
  4. Eliminar ciudad
  5. Establecer ciudad default
  8. Ajustes (°C)
  9. Salir
════════════════════════════════════════`;

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : "Error desconocido.";

function showCities(state: AppState, io: CliIO): void {
  state.cities.forEach((city, index) => {
    io.writeLine(`${index + 1}. ${city.name}${city.country ? `, ${city.country}` : ""}`);
  });
}

async function chooseCity(state: AppState, io: CliIO, action: string): Promise<City | null> {
  showCities(state, io);
  const answer = await io.readLine(`Selecciona la ciudad para ${action}: `);
  if (answer === null) return null;
  const index = Number.parseInt(answer.trim(), 10) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= state.cities.length) {
    io.writeLine("Selección inválida.");
    return null;
  }
  return state.cities[index] ?? null;
}

async function displayTemperature(city: City, io: CliIO, getTemperature: typeof defaultFetchTemperature): Promise<void> {
  try {
    const temperature = await getTemperature(city);
    io.writeLine(`${city.name}: ${temperature} °C`);
  } catch (error) {
    io.writeLine(`Error: ${errorMessage(error)}`);
  }
}

async function handleOption(state: AppState, option: string, io: CliIO, deps: Required<Pick<CliDependencies, "fetchCity" | "fetchCurrentTemperature">> & Pick<CliDependencies, "onMutation">): Promise<boolean> {
  switch (option) {
    case "1": {
      const city = state.cities.find((candidate) => candidate.id === state.defaultCityId);
      if (!city) {
        io.writeLine("No hay una ciudad default configurada.");
        return true;
      }
      await displayTemperature(city, io, deps.fetchCurrentTemperature);
      return true;
    }
    case "2": {
      if (state.cities.length === 0) {
        io.writeLine("No hay ciudades almacenadas.");
        return true;
      }
      for (const city of state.cities) await displayTemperature(city, io, deps.fetchCurrentTemperature);
      return true;
    }
    case "3": {
      const name = await io.readLine("Ingresa el nombre de la ciudad: ");
      if (name === null) return false;
      try {
        const city = await deps.fetchCity(name);
        const duplicate = state.cities.some((stored) => stored.id === city.id || stored.name.trim().toLocaleLowerCase() === city.name.trim().toLocaleLowerCase());
        if (duplicate) {
          io.writeLine(`${city.name} ya está almacenada.`);
          return true;
        }
        state.cities.push(city);
        if (state.defaultCityId === null) state.defaultCityId = city.id;
        await deps.onMutation?.(state);
        io.writeLine(`Ciudad agregada: ${city.name}.`);
      } catch (error) {
        io.writeLine(`Error: ${errorMessage(error)}`);
      }
      return true;
    }
    case "4": {
      if (state.cities.length === 0) {
        io.writeLine("No hay ciudades almacenadas.");
        return true;
      }
      const city = await chooseCity(state, io, "eliminar");
      if (!city) return true;
      const removedDefault = city.id === state.defaultCityId;
      state.cities = state.cities.filter((candidate) => candidate.id !== city.id);
      if (removedDefault) state.defaultCityId = state.cities[0]?.id ?? null;
      await deps.onMutation?.(state);
      io.writeLine(`Ciudad eliminada: ${city.name}.`);
      return true;
    }
    case "5": {
      if (state.cities.length === 0) {
        io.writeLine("No hay ciudades almacenadas.");
        return true;
      }
      const city = await chooseCity(state, io, "establecer como default");
      if (!city) return true;
      state.defaultCityId = city.id;
      await deps.onMutation?.(state);
      io.writeLine(`Ciudad default: ${city.name}.`);
      return true;
    }
    case "8":
      io.writeLine("La aplicación usa grados Celsius (°C).");
      return true;
    case "9":
      return false;
    default:
      io.writeLine("Opción inválida.");
      return true;
  }
}

export async function runCli(state: AppState, io: CliIO, dependencies: CliDependencies = {}): Promise<AppState> {
  const deps = {
    fetchCity: dependencies.fetchCity ?? defaultFetchCity,
    fetchCurrentTemperature: dependencies.fetchCurrentTemperature ?? defaultFetchTemperature,
    onMutation: dependencies.onMutation,
  };
  let running = true;
  while (running) {
    io.writeLine(MENU);
    const option = await io.readLine("Selecciona una opción: ");
    if (option === null) break;
    running = await handleOption(state, option.trim(), io, deps);
  }
  return state;
}
