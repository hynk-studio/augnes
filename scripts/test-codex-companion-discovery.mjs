#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";

import {
  candidateManifestPathsV01,
  discoverVerifiedCompanionV01,
} from "../plugins/augnes-operator/mcp/companion-proxy.mjs";

const root = mkdtempSync(path.join(os.tmpdir(), "augnes-companion-discovery-"));
const instance = "runtime-instance-cdx2b1";
const generation = "runtime-generation-cdx2b1";
const repository = "a".repeat(64);
const ownership = "b".repeat(64);
let recoveryMode = false;
let bridgeMode = "http";
let bridgeRepository = repository;

const ui = createServer((request, response) => {
  const privateRead = new URL(request.url ?? "/", "http://localhost").searchParams.get("ownership") === "1";
  response.setHeader("content-type", "application/json");
  if (privateRead) {
    if (request.headers["x-augnes-child-ownership"] !== ownership) return response.writeHead(403).end("{}");
    return response.end(JSON.stringify(privatePayload("ui", ui.address().port)));
  }
  response.end(JSON.stringify({
    ok: true,
    service: "augnes-ui",
    status: "ready",
    recovery_mode: recoveryMode,
    runtime_instance_id: instance,
    runtime_generation_id: generation,
    runtime_repository_fingerprint: repository,
  }));
});

const bridge = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  response.setHeader("content-type", "application/json");
  if (url.pathname === "/healthz") {
    if (url.searchParams.get("ownership") === "1") {
      if (request.headers["x-augnes-child-ownership"] !== ownership) return response.writeHead(403).end("{}");
      return response.end(JSON.stringify(privatePayload("bridge", bridge.address().port)));
    }
    return response.end(JSON.stringify({
      ok: true,
      name: "augnes-console",
      mode: bridgeMode,
      live_core_status: "ready",
      runtime_instance_id: instance,
      runtime_generation_id: generation,
      runtime_repository_fingerprint: bridgeRepository,
    }));
  }
  if (url.pathname === "/mcp" && request.method === "POST") {
    const chunks = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const message = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    return response.end(JSON.stringify({
      jsonrpc: "2.0",
      id: message.id,
      result: {
        structuredContent: {
          companion: { status: "live", mode: "http", binding: "sha256:test" },
          repository_resolution: { status: "resolved_exact" },
          continuity: { projection_version: "codex_current_continuity.v0.1" },
        },
        content: [{ type: "text", text: "Exact repository continuity." }],
      },
    }));
  }
  response.writeHead(404).end("{}");
});

try {
  await Promise.all([listen(ui), listen(bridge)]);
  const runtimeDirectory = path.join(root, "checkout-aaaaaaaaaaaaaaaa");
  mkdirSync(runtimeDirectory, { recursive: true });
  const manifestPath = path.join(runtimeDirectory, "runtime.json");
  writeRuntimeFiles(manifestPath);
  const environment = {
    ...process.env,
    AUGNES_COMPANION_RUNTIME_MANIFEST: manifestPath,
    AUGNES_COMPANION_TEST_MODE: "1",
  };

  assert.deepEqual(candidateManifestPathsV01({
    ...process.env,
    AUGNES_COMPANION_RUNTIME_MANIFEST: manifestPath,
  }), []);
  const configuredEnvironment = {
    ...process.env,
    AUGNES_RUNTIME_STATE_DIR: runtimeDirectory,
  };
  assert.deepEqual(candidateManifestPathsV01(configuredEnvironment), [manifestPath]);
  assert.equal((await discoverVerifiedCompanionV01(configuredEnvironment)).status, "resolved");

  assert.equal((await discoverVerifiedCompanionV01(environment)).status, "resolved");

  bridgeMode = "mock";
  assert.equal((await discoverVerifiedCompanionV01(environment)).status, "companion_unavailable");
  bridgeMode = "http";
  bridgeRepository = "c".repeat(64);
  assert.equal((await discoverVerifiedCompanionV01(environment)).status, "companion_unavailable");
  bridgeRepository = repository;
  recoveryMode = true;
  assert.equal((await discoverVerifiedCompanionV01(environment)).status, "companion_unavailable");
  recoveryMode = false;

  const proxy = spawn(process.execPath, [
    path.join(process.cwd(), "plugins", "augnes-operator", "mcp", "companion-proxy.mjs"),
  ], { env: environment, stdio: ["pipe", "pipe", "pipe"] });
  const lines = createInterface({ input: proxy.stdout });
  const replies = [];
  lines.on("line", (line) => replies.push(JSON.parse(line)));
  proxy.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } })}\n`);
  proxy.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
  proxy.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} })}\n`);
  proxy.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "augnes_resume_repository", arguments: { repositoryRoot: process.cwd() } } })}\n`);
  await waitFor(() => replies.some((reply) => reply.id === 3));
  assert.equal(replies.find((reply) => reply.id === 2).result.tools[0].name, "augnes_resume_repository");
  assert.equal(replies.find((reply) => reply.id === 3).result.structuredContent.companion.status, "live");
  proxy.stdin.end();
  await new Promise((resolve) => proxy.once("exit", resolve));

  console.log(JSON.stringify({
    status: "pass",
    dynamic_bridge_port: bridge.address().port,
    ownership_verified: true,
    stale_foreign_recovery_refused: true,
    mock_refused: true,
    stdio_dogfood_forwarded: true,
  }, null, 2));
} finally {
  await Promise.all([close(ui), close(bridge)]);
  rmSync(root, { recursive: true, force: true });
}

function privatePayload(role, port) {
  return {
    ownership_verified: true,
    schema_version: 2,
    contract: "augnes-local-runtime-supervisor-v1",
    generation_version: 1,
    generation_id: generation,
    repository_fingerprint: repository,
    instance_id: instance,
    role,
    child_root_pid: process.pid,
    process_pid: process.pid,
    loopback_port: port,
  };
}

function writeRuntimeFiles(manifestPath) {
  writeFileSync(manifestPath, `${JSON.stringify({
    schema_version: 2,
    contract: "augnes-local-runtime-supervisor-v1",
    generation_version: 1,
    generation_id: generation,
    instance_id: instance,
    repository_fingerprint: repository,
    supervisor_pid: process.pid,
    lifecycle_state: "ready",
    database_state: "ready",
    effective_url: `http://127.0.0.1:${ui.address().port}`,
    ui_port: ui.address().port,
    bridge_port: bridge.address().port,
    children: [
      { role: "ui", pid: process.pid, port: ui.address().port, state: "ready" },
      { role: "bridge", pid: process.pid, port: bridge.address().port, state: "ready" },
    ],
  })}\n`, { mode: 0o600 });
  writeFileSync(path.join(path.dirname(manifestPath), "control-token.json"), `${JSON.stringify({
    schema_version: 2,
    contract: "augnes-local-runtime-supervisor-v1",
    generation_version: 1,
    generation_id: generation,
    instance_id: instance,
    repository_fingerprint: repository,
    token: "d".repeat(64),
    child_ownership_token: ownership,
  })}\n`, { mode: 0o600 });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: 0 }, resolve);
  });
}

function close(server) {
  return new Promise((resolve) => server.close(() => resolve()));
}

async function waitFor(predicate) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("proxy_response_timeout");
}
