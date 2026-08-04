#!/usr/bin/env node

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";

import {
  candidateManifestPathsV01,
  discoverVerifiedCompanionV01,
} from "../plugins/augnes-operator/mcp/companion-proxy.mjs";

const requireMcpSdk = createRequire(path.join(process.cwd(), "apps", "augnes_apps", "package.json"));
const { Client } = requireMcpSdk("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = requireMcpSdk("@modelcontextprotocol/sdk/client/stdio.js");
const root = mkdtempSync(path.join(os.tmpdir(), "augnes-companion-discovery-"));
const instance = "runtime-instance-cdx2b1";
const generation = "runtime-generation-cdx2b1";
const repository = "a".repeat(64);
const proxyToken = "p".repeat(64);
let recoveryMode = false;
let bridgeMode = "http";
let bridgeRepository = repository;
let continuityCalls = 0;

const ui = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  response.setHeader("content-type", "application/json");
  response.setHeader("cache-control", "no-store");
  if (url.pathname === "/api/healthz") {
    return response.end(JSON.stringify({
      ok: true,
      service: "augnes-ui",
      status: "ready",
      recovery_mode: recoveryMode,
      runtime_instance_id: instance,
      runtime_generation_id: generation,
      runtime_repository_fingerprint: repository,
    }));
  }
  if (url.pathname === "/api/augnes/read/codex-repository-continuity" && request.method === "POST") {
    continuityCalls += 1;
    if (
      request.headers["x-augnes-companion-proxy"] !== proxyToken ||
      request.headers["x-augnes-local-readonly"] !== "codex-repository-continuity-v0.1"
    ) {
      return response.writeHead(403).end(JSON.stringify({ error: "companion_channel_refused" }));
    }
    response.setHeader("x-augnes-local-readonly", "codex-repository-continuity-v0.1");
    response.setHeader("x-augnes-runtime-instance", instance);
    response.setHeader("x-augnes-runtime-generation", generation);
    response.setHeader("x-augnes-runtime-repository", repository);
    return response.end(JSON.stringify(unregisteredProjectionV01()));
  }
  response.writeHead(404).end("{}");
});

const bridge = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  response.setHeader("content-type", "application/json");
  if (url.pathname === "/healthz") {
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
  assert.deepEqual(candidateManifestPathsV01({
    ...process.env,
    AUGNES_RUNTIME_STATE_DIR: runtimeDirectory,
  }), [manifestPath]);
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

  const client = new Client({ name: "augnes-companion-discovery", version: "0.1.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(process.cwd(), "plugins", "augnes-operator", "mcp", "companion-proxy.mjs")],
    cwd: process.cwd(),
    env: environment,
    stderr: "pipe",
  });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map((tool) => tool.name), [
      "augnes_resume_repository",
      "augnes_prepare_repository_execution",
      "augnes_adopt_repository_execution_root",
      "augnes_validate_repository_execution_attachment",
      "augnes_preview_repository_execution_root_rebind",
      "augnes_rebind_repository_execution_root",
      "augnes_preview_repository_execution_attachment_revocation",
      "augnes_revoke_repository_execution_attachment",
    ]);
    const byName = new Map(tools.tools.map((tool) => [tool.name, tool]));
    for (const name of [
      "augnes_prepare_repository_execution",
      "augnes_validate_repository_execution_attachment",
      "augnes_preview_repository_execution_root_rebind",
      "augnes_preview_repository_execution_attachment_revocation",
    ]) {
      assert.equal(byName.get(name)?.annotations?.readOnlyHint, false);
      assert.equal(byName.get(name)?.annotations?.destructiveHint, false);
    }
    for (const name of [
      "augnes_adopt_repository_execution_root",
      "augnes_rebind_repository_execution_root",
      "augnes_revoke_repository_execution_attachment",
    ]) {
      assert.equal(byName.get(name)?.annotations?.readOnlyHint, false);
      assert.equal(byName.get(name)?.annotations?.destructiveHint, true);
    }
    const result = await client.callTool({
      name: "augnes_resume_repository",
      arguments: { repositoryRoot: process.cwd() },
    });
    assert.notEqual(result.isError, true);
    assert.equal(result.structuredContent?.companion?.status, "live");
    assert.equal(result.structuredContent?.repository_resolution?.status, "project_not_registered");
    assert.equal(result.structuredContent?.continuity, null);
  } finally {
    await client.close();
  }
  assert.equal(continuityCalls, 1);

  console.log(JSON.stringify({
    status: "pass",
    dynamic_bridge_port: bridge.address().port,
    narrow_companion_access: true,
    broad_runtime_ownership_read_by_proxy: false,
    stale_foreign_recovery_refused: true,
    mock_refused: true,
    official_stdio_mcp_client: true,
    direct_ui_route_contract_parser: true,
    synthetic_discovery_harness: true,
  }, null, 2));
} finally {
  await Promise.all([close(ui), close(bridge)]);
  rmSync(root, { recursive: true, force: true });
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
  writeFileSync(path.join(path.dirname(manifestPath), "companion-access.json"), `${JSON.stringify({
    schema_version: 2,
    contract: "augnes-local-runtime-supervisor-v1",
    generation_version: 1,
    generation_id: generation,
    instance_id: instance,
    repository_fingerprint: repository,
    access_version: "augnes-companion-proxy-access.v0.1",
    proxy_token: proxyToken,
  })}\n`, { mode: 0o600 });
}

function unregisteredProjectionV01() {
  const message = "This physical repository is not registered as an Augnes project.";
  const authority = Object.fromEntries([
    "writes_database", "writes_project_files", "changes_project_selection", "changes_operator_session",
    "creates_run", "starts_codex_or_native_host", "calls_provider", "approves_host_action",
    "cancels_or_resumes_run", "creates_or_admits_result", "creates_proof_or_evidence", "creates_proposal",
    "creates_review_decision", "creates_or_applies_transition", "mutates_accepted_state", "retries_or_replays",
    "calls_github", "creates_branch_or_pr", "merges_releases_or_deploys", "starts_background_work",
  ].map((key) => [key, false]));
  return {
    projection_version: "codex_repository_continuity.v0.1",
    generated_at: "2026-08-04T00:00:00.000Z",
    repository_resolution: { status: "project_not_registered", project_key: null, display_name: null, message },
    continuity: null,
    current_situation: message,
    next_meaningful_action: { label: "Open this repository in Augnes first", reason: message, executes: false },
    browser_deep_link: null,
    authority,
  };
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
