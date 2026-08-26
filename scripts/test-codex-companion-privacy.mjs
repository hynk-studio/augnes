#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer, request as httpRequest } from "node:http";
import path from "node:path";

const repoRoot = process.cwd();
const appsRoot = path.join(repoRoot, "apps", "augnes_apps");
const proxyToken = "companion-privacy-token-".padEnd(64, "p");
const runtimeInstance = "companion-privacy-instance";
const runtimeGeneration = "companion-privacy-generation";
const runtimeRepository = "d".repeat(64);

const ui = createServer((_request, response) => {
  response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({
    ok: true,
    service: "augnes-ui",
    status: "ready",
    recovery_mode: false,
    runtime_instance_id: runtimeInstance,
    runtime_generation_id: runtimeGeneration,
    runtime_repository_fingerprint: runtimeRepository,
  }));
});

let bridge = null;
try {
  const uiPort = await listenV01(ui);
  const bridgePort = await reservePortV01();
  bridge = spawn(process.execPath, ["--import", "tsx", "src/server.ts"], {
    cwd: appsRoot,
    env: {
      ...process.env,
      PORT: String(bridgePort),
      AUGNES_CORE_MODE: "http",
      AUGNES_API_BASE_URL: `http://127.0.0.1:${uiPort}`,
      AUGNES_ENABLE_AGENT_BRIDGE: "true",
      AUGNES_APP_TOOL_SURFACE: "companion_repository_readonly",
      AUGNES_RUNTIME_INSTANCE_ID: runtimeInstance,
      AUGNES_RUNTIME_GENERATION_ID: runtimeGeneration,
      AUGNES_RUNTIME_REPOSITORY_FINGERPRINT: runtimeRepository,
      AUGNES_RUNTIME_CHILD_ROLE: "bridge",
      AUGNES_RUNTIME_CHILD_PORT: String(bridgePort),
      AUGNES_COMPANION_PROXY_TOKEN: proxyToken,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await waitForListeningV01(bridge, bridgePort);
  const initialize = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "companion-privacy", version: "0.1.0" },
    },
  });
  const refusals = [
    { label: "hostile Origin", method: "POST", headers: { host: `127.0.0.1:${bridgePort}`, origin: "https://attacker.example", "x-augnes-companion-proxy": proxyToken }, body: initialize },
    { label: "hostile Host", method: "POST", headers: { host: "attacker.example", "x-augnes-companion-proxy": proxyToken }, body: initialize },
    { label: "DNS rebinding Host", method: "POST", headers: { host: "127.0.0.1.attacker.example", "x-augnes-companion-proxy": proxyToken }, body: initialize },
    { label: "missing credential", method: "POST", headers: { host: `127.0.0.1:${bridgePort}` }, body: initialize },
    { label: "invalid credential", method: "POST", headers: { host: `127.0.0.1:${bridgePort}`, "x-augnes-companion-proxy": "invalid" }, body: initialize },
    { label: "browser preflight", method: "OPTIONS", headers: { host: `127.0.0.1:${bridgePort}`, origin: "https://attacker.example", "access-control-request-method": "POST", "x-augnes-companion-proxy": proxyToken } },
  ];
  for (const refusal of refusals) {
    const response = await rawRequestV01({
      port: bridgePort,
      method: refusal.method,
      headers: { "content-type": "application/json", ...refusal.headers },
      body: refusal.body,
    });
    assert.equal(response.status, 403, refusal.label);
    assert.equal(response.headers["access-control-allow-origin"], undefined, refusal.label);
    assert.deepEqual(JSON.parse(response.body), { error: "companion_channel_refused" }, refusal.label);
  }

  const authenticatedPreflight = await rawRequestV01({
    port: bridgePort,
    method: "OPTIONS",
    headers: { host: `127.0.0.1:${bridgePort}`, "x-augnes-companion-proxy": proxyToken },
  });
  assert.equal(authenticatedPreflight.status, 405);
  assert.equal(authenticatedPreflight.headers["access-control-allow-origin"], undefined);
  assert.deepEqual(JSON.parse(authenticatedPreflight.body), { error: "browser_preflight_not_supported" });

  console.log(JSON.stringify({
    status: "pass",
    actual_apps_bridge: true,
    wildcard_cors: false,
    hostile_origin_refused: true,
    hostile_host_refused: true,
    dns_rebinding_host_refused: true,
    browser_preflight_refused: true,
    missing_invalid_credential_refused: true,
    refused_canonical_data_fields: 0,
    valid_stdio_proxy_covered_by: "test:codex-companion-discovery",
  }, null, 2));
} finally {
  await stopChildV01(bridge);
  await new Promise((resolve) => ui.close(() => resolve()));
}

async function listenV01(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host: "127.0.0.1", port: 0 }, resolve);
  });
  return server.address().port;
}

async function reservePortV01() {
  const server = createServer();
  const port = await listenV01(server);
  await new Promise((resolve) => server.close(() => resolve()));
  return port;
}

function rawRequestV01({ port, method, headers, body = null }) {
  return new Promise((resolve, reject) => {
    const request = httpRequest({
      host: "127.0.0.1",
      port,
      path: "/mcp",
      method,
      headers,
      timeout: 5_000,
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      response.once("end", () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks).toString("utf8"),
      }));
    });
    request.once("error", reject);
    request.once("timeout", () => request.destroy(new Error("companion_privacy_request_timeout")));
    if (body !== null) request.write(body);
    request.end();
  });
}

function waitForListeningV01(child, port) {
  return new Promise((resolve, reject) => {
    let stderr = "";
    const timeout = setTimeout(() => reject(new Error(`companion_privacy_start_timeout:${stderr}`)), 15_000);
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      if (!String(chunk).includes(`127.0.0.1:${port}/mcp`)) return;
      clearTimeout(timeout);
      resolve();
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`companion_privacy_bridge_exited:${code}:${stderr}`));
    });
  });
}

async function stopChildV01(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await new Promise((resolve) => child.once("exit", resolve));
}
