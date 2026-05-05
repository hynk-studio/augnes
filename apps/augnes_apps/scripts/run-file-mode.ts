import { spawn } from "node:child_process";
import { assertFileModeFixturePaths, loadFileModeEnv } from "./load-file-env.js";

const command = process.argv[2];

if (command !== "start" && command !== "dev") {
  throw new Error("Usage: node --import tsx scripts/run-file-mode.ts <start|dev>");
}

const { envPath } = loadFileModeEnv();
await assertFileModeFixturePaths(process.env as Record<string, string>);

const args = command === "dev" ? ["--watch", "--import", "tsx", "src/server.ts"] : ["--import", "tsx", "src/server.ts"];

console.log(`Loaded file-mode env from ${envPath}`);

const child = spawn(process.execPath, args, {
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
