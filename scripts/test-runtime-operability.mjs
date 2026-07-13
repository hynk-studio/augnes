#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

const temporaryRoot = mkdtempSync(path.join(tmpdir(), "augnes-runtime-operability-"));
const databasePath = path.join(temporaryRoot, "runtime.db");
const nextBin = path.resolve("node_modules/next/dist/bin/next");
const baseEnvironment = { ...process.env, AUGNES_DB_PATH: databasePath };
delete baseEnvironment.OPENAI_API_KEY;
delete baseEnvironment.GITHUB_TOKEN;

let activeChild = null;

try {
  const initialized = spawnSync(process.execPath, ["scripts/db-init.mjs"], {
    cwd: process.cwd(),
    env: baseEnvironment,
    encoding: "utf8",
  });
  assert.equal(
    initialized.status,
    0,
    `isolated database initialization failed: ${initialized.stderr || initialized.stdout}`,
  );

  const port = await allocatePort();
  const blocker = net.createServer();
  await new Promise((resolve, reject) => {
    blocker.once("error", reject);
    blocker.listen({ host: "127.0.0.1", port, exclusive: true }, resolve);
  });

  const collision = startRuntime(port);
  const collisionExit = await waitForExit(collision, 30_000);
  assert.notEqual(collisionExit.code, 0, "runtime must refuse an explicitly occupied port");
  assert.match(
    collision.output(),
    /EADDRINUSE|address already in use|already in use/i,
    "occupied-port refusal must be observable",
  );
  await new Promise((resolve) => blocker.close(resolve));

  activeChild = startRuntime(port);
  await waitForReady(port, activeChild);
  assert.equal(await canConnect(port), true, "runtime startup opens the selected loopback port");

  await terminateOwnedProcess(activeChild);
  activeChild = null;
  await waitForPortClosed(port);

  activeChild = startRuntime(port);
  await waitForReady(port, activeChild);
  assert.equal(await canConnect(port), true, "runtime recovers on the same port after clean shutdown");

  await terminateOwnedProcess(activeChild);
  activeChild = null;
  await waitForPortClosed(port);

  console.log(
    JSON.stringify(
      {
        test: "runtime-operability",
        status: "pass",
        startup: true,
        occupied_port_refusal: true,
        shutdown: true,
        child_cleanup: true,
        restart_recovery: true,
        database: "isolated_os_temporary",
        provider_calls: 0,
      },
      null,
      2,
    ),
  );
} finally {
  if (activeChild) await terminateOwnedProcess(activeChild);
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function startRuntime(port) {
  const child = spawn(
    process.execPath,
    [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: process.cwd(),
      env: baseEnvironment,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  for (const stream of [child.stdout, child.stderr]) {
    stream.setEncoding("utf8");
    stream.on("data", (chunk) => {
      output = `${output}${chunk}`.slice(-32_768);
    });
  }
  child.output = () => output;
  return child;
}

async function waitForReady(port, child) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`runtime exited before readiness (${child.exitCode}): ${child.output()}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`, {
        signal: AbortSignal.timeout(2_000),
      });
      if (response.status === 200) return;
    } catch {
      // Startup is still in progress.
    }
    await delay(250);
  }
  throw new Error(`runtime readiness timed out: ${child.output()}`);
}

async function terminateOwnedProcess(child) {
  if (child.exitCode !== null) return;
  signalOwnedProcess(child, "SIGTERM");
  const graceful = await Promise.race([
    once(child, "exit").then(() => true),
    delay(8_000).then(() => false),
  ]);
  if (!graceful && child.exitCode === null) {
    signalOwnedProcess(child, "SIGKILL");
    await once(child, "exit");
  }
}

function signalOwnedProcess(child, signal) {
  try {
    if (process.platform !== "win32") process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
}

async function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null) return { code: child.exitCode, signal: child.signalCode };
  const result = await Promise.race([
    once(child, "exit").then(([code, signal]) => ({ code, signal })),
    delay(timeoutMs).then(() => null),
  ]);
  if (result) return result;
  await terminateOwnedProcess(child);
  throw new Error(`runtime did not exit after occupied-port refusal: ${child.output()}`);
}

async function allocatePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: 0, exclusive: true }, resolve);
  });
  const address = server.address();
  assert(address && typeof address === "object");
  const port = address.port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function waitForPortClosed(port) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (!(await canConnect(port))) return;
    await delay(100);
  }
  throw new Error(`owned runtime child still listens on ${port}`);
}

function canConnect(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(1_000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
