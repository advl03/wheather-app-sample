# Agent instructions

## Toolchain

- Use Bun for the project: install with `bun install`, run TypeScript with `bun index.ts`, and do not substitute npm, Node.js, or another package manager without a specific reason.
- `bun.lock` is the committed dependency lockfile; update it through Bun when dependencies change.
- The repository's Bun-specific API and testing guidance is in [`bun-instructions.md`](bun-instructions.md); follow it for Bun replacements such as `Bun.file`, `bun:test`, and environment loading.

## Verification

- Type-check with `bun run typecheck` (the package script runs `bun check`); `tsconfig.json` is strict and emits no JavaScript.
- There are currently no test files or test script. If tests are added, use `bun:test` and run a focused file with `bun test path/to/file.test.ts`, then the full suite with `bun test`.
- There is no configured lint, formatter, build, or CI command in this repository; do not invent a required verification step without adding its configuration.

## Structure and current state

- This is a single-package Bun TypeScript project, not a monorepo. `index.ts` is the package entrypoint and is currently only a scaffold (`console.log("Hello via Bun!")`).
- The weather CLI described in `README.md` is the intended product, not functionality that is already implemented; verify behavior in code before relying on README examples.
- Keep the project ESM/Bun-compatible: `package.json` sets `"type": "module"`, and `tsconfig.json` uses bundler module resolution with TypeScript extension imports enabled.
