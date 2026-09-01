#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
const operatorPluginRoot = path.join(process.cwd(), "plugins", "augnes-operator");
const operatorManifest = JSON.parse(readFileSync(
  path.join(operatorPluginRoot, ".codex-plugin", "plugin.json"),
  "utf8",
));
const operatorDefaultPrompt = operatorManifest.interface?.defaultPrompt;
assert.equal(typeof operatorDefaultPrompt, "string");
assert.equal(operatorManifest.version, "0.5.0");
assert.ok(operatorDefaultPrompt.length <= 256);
assert.match(operatorDefaultPrompt, /augnes_companion_lifecycle_status/u);
assert.match(operatorDefaultPrompt, /augnes_start_companion_service once/u);
assert.match(operatorDefaultPrompt, /augnes_resume_repository/u);
assert.match(operatorDefaultPrompt, /exact current root/u);
assert.match(operatorDefaultPrompt, /live verification/u);

assert.equal(existsSync(path.join(operatorPluginRoot, "hooks", "hooks.json")), false);
assert.equal(Object.hasOwn(operatorManifest, "hooks"), false);
const operatorHooks = JSON.parse(readFileSync(
  path.join(process.cwd(), ".codex", "hooks.json"),
  "utf8",
));
assert.equal(Object.hasOwn(operatorHooks.hooks, "Stop"), false);
assert.equal(Object.hasOwn(operatorHooks.hooks, "UserPromptSubmit"), false);
const operatorHookCommands = Object.values(operatorHooks.hooks).flatMap((groups) =>
  groups.flatMap((group) => group.hooks.map((hook) => hook.command)),
);
assert.equal(operatorHookCommands.length, 3);
for (const command of operatorHookCommands) {
  assert.match(command, /^node "\$\(git rev-parse --show-toplevel\)\/\.codex\/hooks\/[a-z0-9-]+\.mjs"$/u);
  assert.equal(command.includes("$PLUGIN_ROOT"), false);
  assert.equal(command.includes("/Users/"), false);
}

const repositoryResumeHook = spawnSync(
  process.execPath,
  [path.join(process.cwd(), ".codex", "hooks", "augnes-operator-session-start.mjs")],
  {
    encoding: "utf8",
    input: JSON.stringify({
      hook_event_name: "SessionStart",
      prompt: "Resume this repository with Augnes. Complete the currently defined work.",
    }),
  },
);
assert.equal(repositoryResumeHook.status, 0, repositoryResumeHook.stderr);
const repositoryResumeHookOutput = JSON.parse(repositoryResumeHook.stdout);
assert.equal(repositoryResumeHookOutput.hookSpecificOutput?.hookEventName, "SessionStart");
assert.match(
  repositoryResumeHookOutput.hookSpecificOutput?.additionalContext,
  /Ordinary source-first work does not require continuity or memory priming/u,
);
assert.match(
  repositoryResumeHookOutput.hookSpecificOutput?.additionalContext,
  /Explicit resume, continue, recovery, or current-state intent uses the reviewed Augnes Operator Companion lifecycle and repository-continuity owner/u,
);
assert.match(repositoryResumeHookOutput.hookSpecificOutput?.additionalContext, /planner-selected exact-head verification/u);
assert.doesNotMatch(repositoryResumeHookOutput.hookSpecificOutput?.additionalContext, /codex:read-brief|record-completion-proof/u);

const root = mkdtempSync(path.join(os.tmpdir(), "augnes-companion-discovery-"));
const instance = "runtime-instance-cdx2b1";
const generation = "runtime-generation-cdx2b1";
const repository = "a".repeat(64);
const proxyToken = "p".repeat(64);
let recoveryMode = false;
let bridgeMode = "http";
let bridgeRepository = repository;
let continuityCalls = 0;
let executionCalls = 0;
let executionScenario = null;
let uiHealthAvailable = true;
let uiHealthCalls = 0;

const ui = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  response.setHeader("content-type", "application/json");
  response.setHeader("cache-control", "no-store");
  if (url.pathname === "/api/healthz") {
    uiHealthCalls += 1;
    if (!uiHealthAvailable) {
      return response.writeHead(503).end(JSON.stringify({ error: "ui_health_temporarily_busy" }));
    }
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
  if (url.pathname === "/api/augnes/repository-execution" && request.method === "POST") {
    executionCalls += 1;
    if (
      request.headers["x-augnes-companion-proxy"] !== proxyToken ||
      request.headers["x-augnes-repository-execution"] !==
        "repository-execution-attachment-v0.1"
    ) {
      return response.writeHead(403).end(JSON.stringify({
        response_version: "repository_execution_route_response.v0.1",
        error: { code: "companion_channel_refused", status: 403 },
        authority: routeRefusalAuthorityV01(),
      }));
    }
    assert(executionScenario, "execution response scenario must be selected");
    for (const [name, value] of Object.entries(executionScenario.headers)) {
      response.setHeader(name, value);
    }
    return response
      .writeHead(executionScenario.status)
      .end(executionScenario.body);
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
    AUGNES_COMPANION_SERVICE_TEST_MODE: "1",
    AUGNES_COMPANION_SERVICE_TEST_ROOT: path.join(root, "service-state"),
    AUGNES_COMPANION_SERVICE_TEST_SCOPE: "discovery-contract",
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
      "augnes_companion_lifecycle_status",
      "augnes_start_companion_service",
      "augnes_resume_repository",
      "augnes_prepare_repository_execution",
      "augnes_adopt_repository_execution_root",
      "augnes_validate_repository_execution_attachment",
      "augnes_preview_repository_execution_root_rebind",
      "augnes_rebind_repository_execution_root",
      "augnes_preview_repository_execution_attachment_revocation",
      "augnes_revoke_repository_execution_attachment",
      "augnes_request_repository_delegation",
      "augnes_start_repository_delegation",
      "augnes_cancel_repository_delegation",
      "augnes_request_repository_resume",
      "augnes_resume_repository_delegation",
    ]);
    const delegatedToolContract = JSON.stringify(tools.tools);
    for (const forbiddenCapability of [
      "bootstrap_token",
      "session_secret",
      "action_nonce",
      "challenge_fingerprint",
      "confirm_repository_execution_decision",
      "prepare_repository_execution_decision_confirmation",
      "augnes_vnext_repository_decision_session_v01",
    ]) {
      assert.equal(
        delegatedToolContract.includes(forbiddenCapability),
        false,
        `MCP tool inventory must not expose Browser decision capability: ${forbiddenCapability}`,
      );
    }
    const byName = new Map(tools.tools.map((tool) => [tool.name, tool]));
    assert.equal(byName.get("augnes_companion_lifecycle_status")?.annotations?.readOnlyHint, true);
    assert.equal(byName.get("augnes_start_companion_service")?.annotations?.readOnlyHint, false);
    const deferredToolInventory = tools.tools.map(({ name, description }) => ({ name, description }));
    for (const tool of tools.tools) {
      const deferredDescription = deferredToolInventory.find(({ name }) => name === tool.name)?.description ?? "";
      for (const requiredInput of tool.inputSchema?.required ?? []) {
        assert.match(
          deferredDescription,
          new RegExp(`\\b${requiredInput}\\b`, "u"),
          `schema-free deferred tool inventory must expose required input ${requiredInput} for ${tool.name}`,
        );
      }
    }
    assert.match(
      byName.get("augnes_request_repository_delegation")?.description ?? "",
      /call this tool again with the same workspace, project, and attachment/u,
    );
    assert.match(
      byName.get("augnes_request_repository_delegation")?.description ?? "",
      /does not create a second request/u,
    );
    const liveContinuitySkill = readFileSync(
      path.join(operatorPluginRoot, "skills", "augnes-live-repository-continuity", "SKILL.md"),
      "utf8",
    );
    assert.match(liveContinuitySkill, /replay of the existing request, not a second Start request/u);
    assert.match(liveContinuitySkill, /Never guess a grant or reuse the request fingerprint as the grant/u);
    for (const name of [
      "augnes_prepare_repository_execution",
      "augnes_validate_repository_execution_attachment",
      "augnes_preview_repository_execution_root_rebind",
      "augnes_preview_repository_execution_attachment_revocation",
      "augnes_request_repository_delegation",
      "augnes_cancel_repository_delegation",
      "augnes_request_repository_resume",
    ]) {
      assert.equal(byName.get(name)?.annotations?.readOnlyHint, false);
      assert.equal(byName.get(name)?.annotations?.destructiveHint, false);
    }
    for (const name of [
      "augnes_adopt_repository_execution_root",
      "augnes_rebind_repository_execution_root",
      "augnes_revoke_repository_execution_attachment",
      "augnes_start_repository_delegation",
      "augnes_resume_repository_delegation",
    ]) {
      assert.equal(byName.get(name)?.annotations?.readOnlyHint, false);
      assert.equal(byName.get(name)?.annotations?.destructiveHint, true);
    }
    uiHealthAvailable = true;
    const lifecycleStatus = await client.callTool({
      name: "augnes_companion_lifecycle_status",
      arguments: { repositoryRoot: process.cwd() },
    });
    assert.notEqual(lifecycleStatus.isError, true);
    assert.equal(lifecycleStatus.structuredContent?.service?.status, "not_installed");
    assert.equal(
      lifecycleStatus.structuredContent?.service?.canonical_resume_available,
      false,
    );
    assert.equal(lifecycleStatus.structuredContent?.authority?.runtime_lifecycle_effect, false);
    const publicLifecycle = JSON.stringify(lifecycleStatus.structuredContent);
    assert.equal(publicLifecycle.includes(process.cwd()), false);
    assert.equal(publicLifecycle.includes(root), false);
    assert.equal(publicLifecycle.includes("node_path"), false);
    assert.equal(publicLifecycle.includes("supervisor_pid"), false);
    assert.equal(publicLifecycle.includes("proxy_token"), false);
    const executionCallsBeforeLifecycleStart = executionCalls;
    const continuityCallsBeforeLifecycleStart = continuityCalls;
    const lifecycleStart = await client.callTool({
      name: "augnes_start_companion_service",
      arguments: { repositoryRoot: process.cwd() },
    });
    assert.equal(lifecycleStart.isError, true);
    assert.equal(
      lifecycleStart.structuredContent?.reason,
      "companion_service_setup_required",
    );
    assert.equal(lifecycleStart.structuredContent?.authority?.runtime_lifecycle_effect, false);
    assert.equal(executionCalls, executionCallsBeforeLifecycleStart);
    assert.equal(continuityCalls, continuityCallsBeforeLifecycleStart);
    await assertRepositoryExecutionProxyRefusalContractV01(client);
    const strictDiscoveryHealthCalls = uiHealthCalls;
    uiHealthAvailable = false;
    const result = await client.callTool({
      name: "augnes_resume_repository",
      arguments: { repositoryRoot: process.cwd() },
    });
    assert.notEqual(result.isError, true);
    assert.equal(result.structuredContent?.companion?.status, "live");
    assert.equal(result.structuredContent?.repository_resolution?.status, "project_not_registered");
    assert.equal(result.structuredContent?.continuity, null);
    assert.equal(
      uiHealthCalls,
      strictDiscoveryHealthCalls,
      "read-only continuity should use its exact identity-bound route instead of a redundant UI health preflight",
    );
  } finally {
    await client.close();
  }
  assert.equal(continuityCalls, 1);
  assert(executionCalls >= 12);

  console.log(JSON.stringify({
    status: "pass",
    dynamic_bridge_port: bridge.address().port,
    narrow_companion_access: true,
    broad_runtime_ownership_read_by_proxy: false,
    stale_foreign_recovery_refused: true,
    mock_refused: true,
    official_stdio_mcp_client: true,
    browser_decision_session_absent_from_mcp_inventory: true,
    browser_decision_session_absent_from_runtime_manifest_and_access_record: true,
    direct_ui_route_contract_parser: true,
    identity_bound_typed_execution_refusal: true,
    malformed_and_infrastructure_execution_failures_remain_mcp_errors: true,
    readonly_route_owns_ui_identity_verification: true,
    plugin_default_prompt_admitted_by_codex: true,
    plugin_default_hooks_absent_and_project_hooks_local: true,
    synthetic_discovery_harness: true,
  }, null, 2));
} finally {
  await Promise.all([close(ui), close(bridge)]);
  rmSync(root, { recursive: true, force: true });
}

async function assertRepositoryExecutionProxyRefusalContractV01(client) {
  const callStart = () => client.callTool({
    name: "augnes_start_repository_delegation",
    arguments: {
      workspaceId: "workspace:typed-refusal",
      projectId: "project:typed-refusal",
      attachmentId: `sha256:${"1".repeat(64)}`,
      expectedAttachmentBindingFingerprint: `sha256:${"2".repeat(64)}`,
      expectedExecutionEnvelopeFingerprint: `sha256:${"3".repeat(64)}`,
      decisionRequestFingerprint: `sha256:${"4".repeat(64)}`,
      decisionGrantFingerprint: `sha256:${"5".repeat(64)}`,
    },
  });
  const assertMcpError = async (scenario) => {
    executionScenario = scenario;
    const result = await callStart();
    assert.equal(result.isError, true);
    assert.equal(result.structuredContent?.companion?.status, "unavailable");
  };

  executionScenario = typedStartRefusalScenarioV01();
  const refusal = await callStart();
  assert.notEqual(refusal.isError, true);
  assert.equal(refusal.structuredContent?.companion?.status, "live");
  assert.equal(
    refusal.structuredContent?.refusal_version,
    "repository_execution_proxy_refusal.v0.1",
  );
  assert.equal(refusal.structuredContent?.status, "blocked");
  assert.equal(refusal.structuredContent?.action, "start");
  assert.equal(
    refusal.structuredContent?.reason,
    "repository_managed_delegation_windows_source_runtime_required",
  );
  assert.equal(
    Object.values(refusal.structuredContent?.authority ?? {}).every(
      (value) => value === false,
    ),
    true,
  );

  await assertMcpError(typedStartRefusalScenarioV01({
    omitHeaders: ["x-augnes-runtime-instance"],
  }));
  await assertMcpError(typedStartRefusalScenarioV01({
    headerOverrides: { "x-augnes-runtime-instance": "wrong-instance" },
  }));
  await assertMcpError(typedStartRefusalScenarioV01({
    headerOverrides: { "x-augnes-runtime-generation": "wrong-generation" },
  }));
  await assertMcpError(typedStartRefusalScenarioV01({
    headerOverrides: { "x-augnes-runtime-repository": "f".repeat(64) },
  }));
  await assertMcpError(typedStartRefusalScenarioV01({
    omitHeaders: ["x-augnes-repository-execution"],
  }));
  await assertMcpError(typedStartRefusalScenarioV01({
    code: "repository_managed_delegation_unknown_refusal",
  }));
  await assertMcpError({
    status: 422,
    headers: exactExecutionHeadersV01(),
    body: JSON.stringify({
      response_version: "repository_execution_route_response.v0.1",
      error: {
        code: "repository_managed_delegation_windows_source_runtime_required",
        status: 422,
      },
    }),
  });
  await assertMcpError(typedStartRefusalScenarioV01({ bodyStatus: 409 }));
  await assertMcpError({
    status: 403,
    headers: {},
    body: JSON.stringify({
      response_version: "repository_execution_route_response.v0.1",
      error: { code: "companion_channel_refused", status: 403 },
      authority: routeRefusalAuthorityV01(),
    }),
  });
  await assertMcpError({
    status: 503,
    headers: {},
    body: JSON.stringify({
      response_version: "repository_execution_route_response.v0.1",
      error: { code: "companion_unavailable", status: 503 },
      authority: routeRefusalAuthorityV01(),
    }),
  });
  await assertMcpError({
    status: 500,
    headers: exactExecutionHeadersV01(),
    body: JSON.stringify({
      response_version: "repository_execution_route_response.v0.1",
      error: { code: "repository_execution_unavailable", status: 500 },
      authority: routeRefusalAuthorityV01(),
    }),
  });
  await assertMcpError({
    status: 422,
    headers: exactExecutionHeadersV01(),
    body: "{",
  });
  await assertMcpError({
    status: 422,
    headers: exactExecutionHeadersV01(),
    body: "x".repeat(256 * 1024 + 1),
  });

  executionScenario = {
    status: 200,
    headers: exactExecutionHeadersV01(),
    body: JSON.stringify({
      preparation_version: "repository_execution_preparation.v0.1",
      status: "prepared",
      ordinary_text: "Repository execution attachment prepared.",
      project: null,
      admission: null,
      attachment: null,
      decision_request: null,
      reason: null,
      authority: repositoryExecutionAuthorityV01(),
    }),
  };
  const success = await client.callTool({
    name: "augnes_prepare_repository_execution",
    arguments: { repositoryRoot: process.cwd() },
  });
  assert.notEqual(success.isError, true);
  assert.equal(success.structuredContent?.companion?.status, "live");
  assert.equal(success.structuredContent?.status, "prepared");
  assert.equal(success.structuredContent?.refusal_version, undefined);
}

function typedStartRefusalScenarioV01({
  code = "repository_managed_delegation_windows_source_runtime_required",
  bodyStatus = 422,
  headerOverrides = {},
  omitHeaders = [],
} = {}) {
  return {
    status: 422,
    headers: exactExecutionHeadersV01(headerOverrides, omitHeaders),
    body: JSON.stringify({
      response_version: "repository_execution_route_response.v0.1",
      error: { code, status: bodyStatus },
      authority: routeRefusalAuthorityV01(),
    }),
  };
}

function exactExecutionHeadersV01(overrides = {}, omitted = []) {
  const headers = {
    "content-type": "application/json",
    "x-augnes-repository-execution":
      "repository-execution-attachment-v0.1",
    "x-augnes-runtime-instance": instance,
    "x-augnes-runtime-generation": generation,
    "x-augnes-runtime-repository": repository,
    ...overrides,
  };
  for (const name of omitted) delete headers[name];
  return headers;
}

function routeRefusalAuthorityV01() {
  return {
    project_files_written: false,
    project_commands_executed: false,
    managed_run_created: false,
    execution_started: false,
    provider_called: false,
    semantic_authority_granted: false,
    execution_authority_granted: false,
  };
}

function repositoryExecutionAuthorityV01() {
  return {
    branch_or_commit_created: false,
    execution_authority_granted: false,
    execution_started: false,
    external_effect_authority_granted: false,
    github_called: false,
    managed_run_created: false,
    project_commands_executed: false,
    project_files_written: false,
    provider_called: false,
    semantic_authority_granted: false,
  };
}

function writeRuntimeFiles(manifestPath) {
  const manifest = `${JSON.stringify({
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
  })}\n`;
  const companionAccess = `${JSON.stringify({
    schema_version: 2,
    contract: "augnes-local-runtime-supervisor-v1",
    generation_version: 1,
    generation_id: generation,
    instance_id: instance,
    repository_fingerprint: repository,
    access_version: "augnes-companion-proxy-access.v0.1",
    proxy_token: proxyToken,
  })}\n`;
  for (const protectedSurface of [manifest, companionAccess]) {
    assert.equal(protectedSurface.includes("repository_decision_session"), false);
    assert.equal(protectedSurface.includes("bootstrap_token"), false);
    assert.equal(protectedSurface.includes("action_nonce"), false);
    assert.equal(protectedSurface.includes("session_secret"), false);
  }
  writeFileSync(manifestPath, manifest, { mode: 0o600 });
  writeFileSync(
    path.join(path.dirname(manifestPath), "companion-access.json"),
    companionAccess,
    { mode: 0o600 },
  );
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
    resume_eligibility: null,
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
