import { describe, expect, test } from "bun:test";
import { runCli, type CliIO } from "./cli.ts";
import type { AppState, City } from "./types.ts";

function fakeIO(inputs: string[]): { io: CliIO; output: string[] } {
  const output: string[] = [];
  return {
    io: {
      async readLine() { return inputs.shift() ?? null; },
      writeLine(message) { output.push(message); },
    },
    output,
  };
}

const city = (id: string, name: string): City => ({ id, name, latitude: 1, longitude: 2 });

describe("CLI", () => {
  test("adds first city as default and avoids duplicate", async () => {
    const { io, output } = fakeIO(["3", "Madrid", "3", "Madrid", "9"]);
    const state: AppState = { cities: [], defaultCityId: null, unit: "celsius" };
    await runCli(state, io, { fetchCity: async () => city("1", "Madrid"), onMutation: () => undefined });
    expect(state.cities).toHaveLength(1);
    expect(state.defaultCityId).toBe("1");
    expect(output.some((line) => line.includes("ya está almacenada"))).toBe(true);
  });

  test("removing default picks the first remaining city and invalid default selection preserves state", async () => {
    const { io, output } = fakeIO(["4", "1", "5", "9", "5", "99", "9"]);
    const state: AppState = { cities: [city("1", "Madrid"), city("2", "Paris")], defaultCityId: "1", unit: "celsius" };
    await runCli(state, io);
    expect(state.defaultCityId).toBe("2");
    expect(state.cities).toHaveLength(1);
    expect(output.some((line) => line === "Selección inválida.")).toBe(true);
  });

  test("renders recoverable empty-state messages and Celsius setting", async () => {
    const { io, output } = fakeIO(["1", "2", "8", "9"]);
    const state: AppState = { cities: [], defaultCityId: null, unit: "celsius" };
    await runCli(state, io);
    expect(output.some((line) => line.includes("default"))).toBe(true);
    expect(output.some((line) => line.includes("No hay ciudades"))).toBe(true);
    expect(output.some((line) => line.includes("Celsius"))).toBe(true);
  });

  test("weather failures are shown without losing state", async () => {
    const { io, output } = fakeIO(["1", "9"]);
    const state: AppState = { cities: [city("1", "Madrid")], defaultCityId: "1", unit: "celsius" };
    await runCli(state, io, { fetchCurrentTemperature: async () => { throw new Error("network"); } });
    expect(output.some((line) => line.includes("Error: network"))).toBe(true);
    expect(state.cities).toHaveLength(1);
  });
});
