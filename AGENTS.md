# Agent instructions

## Toolchain

- Use Bun for this project: install with `bun install`, run the CLI with `bun index.ts`, run tests with `bun test`, and type-check with `bun run typecheck`.
- `bun.lock` is the committed dependency lockfile; update it through Bun when dependencies change.
- Follow [`bun-instructions.md`](bun-instructions.md) for Bun-specific APIs and testing guidance. Bun loads `.env` automatically; do not add `dotenv`.
- The package is ESM (`"type": "module"`) and TypeScript uses bundler resolution with `.ts` imports enabled. Preserve this setup.

## Verification

- Run the focused test file while iterating, for example `bun test src/weather.test.ts`.
- Before finishing a change, run `bun test` and `bun run typecheck`.
- There is no configured lint, formatter, or CI command; do not invent one as a required check.
- To verify the executable packaging flow, use `bun build --compile --outfile weather-cli index.ts`. Remove generated binaries or place them outside the repository; build artifacts are ignored by `.gitignore` where applicable.

## Structure and behavior

- This is a single-package Bun TypeScript CLI, not a monorepo. `index.ts` is the runtime entrypoint.
- `src/cli.ts` owns the interactive menu and state transitions. Its `CliIO` and weather dependencies are injectable; use those seams for tests instead of mocking a real terminal or network.
- `src/weather.ts` is the only Open-Meteo client. Geocoding must precede forecast lookup: first obtain latitude/longitude from the city name, then request `current=temperature_2m` from the forecast API.
- `src/storage.ts` owns JSON persistence and validation. Use `WEATHER_APP_DATA_FILE` when testing or isolating state; otherwise the runtime defaults to `$XDG_CONFIG_HOME/wheather-app/data.json` or `~/.config/wheather-app/data.json`.
- Persisted state contains `cities`, `defaultCityId`, and the fixed `unit: "celsius"`. Missing or invalid JSON is reset to an empty valid state.
- The first added city becomes the default; duplicate cities are rejected; deleting the default selects the first remaining city or clears the default when none remain.
- `README.md` describes the implemented CLI and API flow. Treat code and package scripts as the executable source of truth if documentation ever diverges.

## Change boundaries

- Keep API parsing and network errors in `src/weather.ts`; the CLI should display errors and continue rather than terminate the menu.
- Keep persistence mutations routed through the `onMutation` callback so tests can observe state changes without filesystem coupling.
- Add or update `bun:test` coverage for each behavior change. Do not add credentials: Open-Meteo is used without an API key.
