import { runCli, type CliIO } from "./src/cli.ts";
import { ensureDataDirectory, loadState, resolveDataPath, saveState } from "./src/storage.ts";

function createTerminalIO(): CliIO {
  const reader = Bun.stdin.stream().getReader();
  let pending = "";
  let finished = false;

  return {
    async readLine(prompt: string): Promise<string | null> {
      process.stdout.write(prompt);
      while (true) {
        const lineEnd = pending.indexOf("\n");
        if (lineEnd >= 0) {
          const line = pending.slice(0, lineEnd).replace(/\r$/, "");
          pending = pending.slice(lineEnd + 1);
          return line;
        }
        if (finished) return pending ? pending : null;
        const chunk = await reader.read();
        if (chunk.done) {
          finished = true;
          continue;
        }
        pending += new TextDecoder().decode(chunk.value);
      }
    },
    writeLine(message: string): void {
      console.log(message);
    },
  };
}

if (import.meta.main) {
  const path = resolveDataPath();
  await ensureDataDirectory(path);
  const state = await loadState(path);
  await runCli(state, createTerminalIO(), {
    onMutation: (nextState) => saveState(path, nextState),
  });
  await saveState(path, state);
}
