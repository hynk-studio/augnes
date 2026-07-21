#!/usr/bin/env node

import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import net from "node:net";

const [mode, statePath, parentPid] = process.argv.slice(2);

if (mode === "fast-success") {
  process.exit(0);
}

if (mode === "nonzero") {
  process.exit(7);
}

if (mode === "hang") {
  process.on("SIGTERM", () => {
    writeFileSync(statePath, "sigterm_received\n", { mode: 0o600 });
    process.exit(0);
  });
  setInterval(() => {}, 1_000);
} else if (mode === "exit-with-inherited-stream") {
  if (process.platform === "win32") {
    writeFileSync(
      statePath,
      `${JSON.stringify({ child_pid: process.pid, grandchild_pid: null })}\n`,
      { mode: 0o600 },
    );
    process.exit(0);
  }
  const grandchild = spawn(
    process.execPath,
    [process.argv[1], "inherited-stream-grandchild", statePath, String(process.pid)],
    {
      detached: false,
      stdio: ["ignore", "inherit", "inherit"],
      windowsHide: true,
    },
  );
  writeFileSync(
    statePath,
    `${JSON.stringify({
      child_pid: process.pid,
      grandchild_pid: grandchild.pid,
    })}\n`,
    { mode: 0o600 },
  );
  process.exit(0);
} else if (mode === "inherited-stream-grandchild") {
  setInterval(() => {}, 1_000);
} else if (mode === "tree") {
  spawn(process.execPath, [process.argv[1], "grandchild", statePath, String(process.pid)], {
    detached: process.platform !== "win32",
    stdio: "ignore",
    windowsHide: true,
  });
  setInterval(() => {}, 1_000);
} else if (mode === "grandchild") {
  const server = net.createServer((socket) => socket.destroy());
  server.listen({ host: "127.0.0.1", port: 0, exclusive: true }, () => {
    writeFileSync(
      statePath,
      `${JSON.stringify({
        child_pid: Number(parentPid),
        grandchild_pid: process.pid,
        port: server.address().port,
      })}\n`,
      { mode: 0o600 },
    );
  });
} else if (mode === "term-resistant") {
  process.on("SIGTERM", () => {});
  setInterval(() => {}, 1_000);
} else if (mode === "private-output") {
  process.stdout.write(`${process.env.PRIVATE_FIXTURE_SENTINEL ?? "missing"}\n`);
  process.stderr.write(`${process.env.PRIVATE_FIXTURE_PATH ?? "missing"}\n`);
  setInterval(() => {}, 1_000);
} else {
  process.exit(64);
}
