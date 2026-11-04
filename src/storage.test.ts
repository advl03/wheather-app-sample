import { describe, expect, test } from "bun:test";
import { loadState, saveState } from "./storage.ts";
import type { AppState } from "./types.ts";

const temporaryPath = () => `/private/var/folders/j2/rw15ytsn7zl1fd9s54rq2ncc0000gp/T/weather-${crypto.randomUUID()}.json`;

describe("storage", () => {
  test("missing data becomes an empty valid state", async () => {
    const path = temporaryPath();
    const state = await loadState(path);
    expect(state).toEqual({ cities: [], defaultCityId: null, unit: "celsius" });
    expect(await Bun.file(path).json()).toEqual(state);
    await Bun.file(path).delete();
  });

  test("invalid data is replaced and valid state round trips", async () => {
    const path = temporaryPath();
    await Bun.write(path, "not json");
    expect(await loadState(path)).toEqual({ cities: [], defaultCityId: null, unit: "celsius" });
    const state: AppState = {
      cities: [{ id: "1", name: "Madrid", latitude: 40, longitude: -3 }],
      defaultCityId: "1",
      unit: "celsius",
    };
    await saveState(path, state);
    expect(await loadState(path)).toEqual(state);
    await Bun.file(path).delete();
  });
});
