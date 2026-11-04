import { describe, expect, test } from "bun:test";
import { fetchCity, fetchCurrentTemperature } from "./weather.ts";
import type { City } from "./types.ts";

describe("weather API", () => {
  test("builds the geocoding request and parses a city", async () => {
    let requested: URL | undefined;
    const city = await fetchCity("Madrid", async (input) => {
      requested = new URL(input.toString());
      return Response.json({ results: [{ id: 123, name: "Madrid", country: "España", latitude: 40.4, longitude: -3.7 }] });
    });
    expect(requested?.toString()).toBe("https://geocoding-api.open-meteo.com/v1/search?name=Madrid&count=1&language=es&format=json");
    expect(city).toEqual({ id: "123", name: "Madrid", country: "España", latitude: 40.4, longitude: -3.7 });
  });

  test("reports missing geocoding results", async () => {
    await expect(fetchCity("Unknown", async () => Response.json({ results: [] }))).rejects.toThrow("No se encontraron");
  });

  test("builds forecast request and parses temperature", async () => {
    let requested: URL | undefined;
    const city: City = { id: "1", name: "Madrid", latitude: 40.4, longitude: -3.7 };
    const temperature = await fetchCurrentTemperature(city, async (input) => {
      requested = new URL(input.toString());
      return Response.json({ current: { temperature_2m: 21.5 } });
    });
    expect(requested?.toString()).toBe("https://api.open-meteo.com/v1/forecast?latitude=40.4&longitude=-3.7&current=temperature_2m");
    expect(temperature).toBe(21.5);
  });
});
