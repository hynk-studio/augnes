#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import dns from "node:dns";
import { appendFileSync, existsSync, readFileSync, watch, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import readline from "node:readline";
import tls from "node:tls";

const scenario = process.env.FAKE_CODEX_SCENARIO ?? "command_approval";
const root = process.cwd();
const threadId = process.env.FAKE_CODEX_THREAD_ID ?? "01900000-0000-7000-8000-000000000001";
const sessionId = process.env.FAKE_CODEX_SESSION_ID ?? "01900000-0000-7000-8000-000000000002";
const turnId = process.env.FAKE_CODEX_TURN_ID ?? "01900000-0000-7000-8000-000000000003";
const approvalRequestId = "fake-server-approval-1";
const sequentialApprovalCount = 20;
const statePath = process.env.FAKE_CODEX_STATE_PATH ?? null;
const tracePath = process.env.FAKE_CODEX_TRACE_PATH ?? null;
const cleanupMarkerPath = process.env.FAKE_CODEX_CLEANUP_MARKER_PATH ?? null;
const releasePath = process.env.FAKE_CODEX_RELEASE_PATH ?? null;
const approvalResolutionBarrierPath =
  process.env.FAKE_CODEX_APPROVAL_RESOLUTION_BARRIER_PATH ?? null;
const networkCountPath = process.env.FAKE_CODEX_NETWORK_COUNT_PATH ?? null;
let externalNetworkAttempts = 0;
let initialized = false;
let turnActive = false;
const pendingApprovalRequestIds = new Set();
const approvalRequestParams = new Map();
let sequentialApprovalIndex = 0;
let completed = false;
let descendant = null;

installZeroNetworkGuard();
trace("fixture_started", { scenario });

if (process.argv[2] !== "app-server" || process.argv[3] !== "--stdio") {
  process.exit(2);
}

if (scenario === "descendant_cleanup") {
  descendant = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
    stdio: "ignore",
    windowsHide: true,
  });
  trace("descendant_started", { pid: descendant.pid ?? null });
}

const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
lines.on("line", (line) => {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    process.exitCode = 3;
    lines.close();
    return;
  }
  trace("received", minimized(message));
  void handle(message).catch((error) => {
    trace("handler_error", { code: error instanceof Error ? error.message : "unknown" });
    process.exitCode = 4;
    lines.close();
  });
});
lines.on("close", () => {
  void settleAndExit();
});
process.on("exit", persistNetworkCount);

async function handle(message) {
  if (Object.hasOwn(message, "method") && Object.hasOwn(message, "id")) {
    if (message.method === "initialize") {
      if (scenario === "unsupported_app_server") {
        respondError(message.id, -32601, "Method not found");
        return;
      }
      if (scenario === "init_failure") {
        respondError(message.id, -32000, "initialization failed");
        return;
      }
      if (scenario === "invalid_response_envelope") {
        send({
          id: message.id,
          result: { userAgent: "codex-cli/fake-0.143.0" },
          error: { code: -32000, message: "conflicting response fields" },
        });
        return;
      }
      initialized = true;
      respond(message.id, {
        userAgent: "codex-cli/fake-0.143.0",
        codexHome: process.env.HOME ?? root,
        platformFamily: process.platform === "win32" ? "windows" : "unix",
        platformOs: process.platform,
      });
      if (scenario === "duplicate_response") {
        respond(message.id, {
          userAgent: "codex-cli/fake-0.143.0",
          codexHome: process.env.HOME ?? root,
          platformFamily: "unix",
          platformOs: process.platform,
        });
      }
      if (scenario === "conflicting_duplicate_response") {
        respond(message.id, {
          userAgent: "codex-cli/conflict",
          codexHome: process.env.HOME ?? root,
          platformFamily: "unix",
          platformOs: process.platform,
        });
      }
      if (scenario === "mismatched_response_id") {
        respond("not-the-request-id", {});
      }
      if (scenario === "malformed_json") process.stdout.write("{malformed\n");
      if (scenario === "oversized_jsonl") {
        process.stdout.write(`${"x".repeat(300 * 1024)}\n`);
      }
      return;
    }
    if (!initialized) {
      respondError(message.id, -32002, "Not initialized");
      return;
    }
    if (message.method === "account/read") {
      respond(
        message.id,
        scenario === "unauthenticated"
          ? { account: null, requiresOpenaiAuth: true }
          : { account: { type: "chatgpt", email: "not-returned-to-augnes@example.invalid", planType: "unknown" }, requiresOpenaiAuth: true },
      );
      return;
    }
    if (message.method === "thread/start") {
      if (scenario === "crash_before_thread_id") {
        process.exit(17);
      }
      respond(message.id, threadResponse());
      if (scenario === "crash_after_thread_id") {
        setImmediate(() => process.exit(18));
      }
      return;
    }
    if (message.method === "thread/read") {
      respond(message.id, {
        thread: thread({ includeTurns: true, turnStatus: "inProgress" }),
      });
      return;
    }
    if (message.method === "thread/resume") {
      respond(message.id, threadResponse({ includeTurns: true, turnStatus: "inProgress" }));
      if (scenario === "disconnect_resume") {
        setImmediate(() => completeSuccess());
      }
      return;
    }
    if (message.method === "turn/start") {
      turnActive = true;
      persistState({ threadId, sessionId, turnId, status: "inProgress" });
      respond(message.id, { turn: turn("inProgress", []) });
      setImmediate(() => {
        notify("turn/started", { threadId, turn: turn("inProgress", []) });
        notify("thread/status/changed", {
          threadId,
          status: { type: "active", activeFlags: [] },
        });
        if (scenario === "success") completeSuccess();
        else if (scenario === "turn_failure") completeFailure();
        else if (scenario === "structured_result_invalid") completeInvalidStructuredResult();
        else if (scenario === "structured_result_oversized") completeOversizedStructuredResult();
        else if (scenario === "structured_result_unsafe_path") completeUnsafePathStructuredResult();
        else if (scenario === "structured_result_private_path_text") completeUnsafeTextStructuredResult(
          "Completed under /Users/private/project/file.ts",
        );
        else if (scenario === "structured_result_credential_text") completeUnsafeTextStructuredResult(
          "OPENAI_API_KEY=sk-not-returned-to-augnes-1234567890",
        );
        else if (scenario === "disconnect_resume") process.exit(19);
        else if (scenario === "command_approval" || scenario === "delayed_cleanup" || scenario === "ignored_interrupt" || scenario === "descendant_cleanup") requestCommandApproval();
        else if (scenario === "public_safe_command_approval") requestCommandApproval({
          command: String.raw`/usr/bin/env tool --client-secret super-secret-value --header "Authorization: Bearer header-secret-value" node /home/private/project/script.js`,
        });
        else if (scenario === "sequential_approval_chain") requestSequentialApproval();
        else if (scenario === "concurrent_approval_overflow") {
          for (let index = 1; index <= 9; index += 1) {
            requestCommandApproval(
              { itemId: `fake-concurrent-command-item-${index}` },
              `fake-server-concurrent-${index}`,
            );
          }
        }
        else if (scenario === "active_duplicate_request") {
          const params = commandApprovalParams();
          requestCommandApprovalWithParams(approvalRequestId, params);
          requestCommandApprovalWithParams(approvalRequestId, params);
        }
        else if (scenario === "active_conflicting_request") {
          requestCommandApproval();
          requestCommandApproval(
            { command: "npm run conflicting-check" },
            approvalRequestId,
          );
        }
        else if (
          scenario === "resolved_duplicate_request" ||
          scenario === "resolved_conflicting_request"
        ) requestCommandApproval();
        else if (scenario === "command_network_approval") requestCommandApproval({
          networkApprovalContext: { host: "api.example.invalid", protocol: "https" },
        });
        else if (scenario === "file_approval") requestFileApproval(path.join(root, "src"));
        else if (scenario === "file_approval_unsafe") requestFileApproval("C:\\outside\\file.ts");
        else if (scenario === "permission_approval") requestPermissionApproval(false);
        else if (
          scenario === "network_permission_approval" ||
          scenario === "network_permission_approval_ignored_interrupt"
        ) requestPermissionApproval(true);
        else if (scenario === "mismatched_thread_approval") requestCommandApproval({ threadId: "wrong-thread" });
        else if (scenario === "mismatched_turn_approval") requestCommandApproval({ turnId: "wrong-turn" });
        else if (scenario === "unknown_approval_method") requestUnknownApproval();
        else if (scenario === "thread_status_unsupported") {
          notify("thread/status/changed", {
            threadId,
            status: { type: "systemError" },
          });
        }
        else if (scenario === "conflicting_completion") completeConflictingSuccess();
        else if (scenario === "duplicate_event") {
          notify("turn/started", { threadId, turn: turn("inProgress", []) });
          completeSuccess();
        }
        else completeSuccess();
      });
      return;
    }
    if (message.method === "turn/interrupt") {
      trace("interrupt", { threadId: message.params?.threadId, turnId: message.params?.turnId });
      respond(message.id, {});
      if (
        scenario === "ignored_interrupt" ||
        scenario === "network_permission_approval_ignored_interrupt"
      ) return;
      const delayMs = scenario === "delayed_cleanup" ? 75 : 0;
      setTimeout(() => completeInterrupted(), delayMs);
      return;
    }
    respondError(message.id, -32601, "Method not found");
    return;
  }

  if (
    Object.hasOwn(message, "id") &&
    pendingApprovalRequestIds.has(String(message.id))
  ) {
    const resolvedRequestId = String(message.id);
    pendingApprovalRequestIds.delete(resolvedRequestId);
    const resolvedParams = approvalRequestParams.get(resolvedRequestId);
    const accepted =
      message.result?.decision === "accept" ||
      (message.result?.scope === "turn" &&
        message.result?.permissions &&
        Object.keys(message.result.permissions).length > 0);
    notify("serverRequest/resolved", { threadId, requestId: resolvedRequestId });
    if (scenario === "sequential_approval_chain" && accepted) {
      await waitForApprovalResolutionObservation(sequentialApprovalIndex);
      if (sequentialApprovalIndex < sequentialApprovalCount) {
        requestSequentialApproval();
      } else {
        emitObservedItems();
        completeSuccess();
      }
      return;
    }
    if (
      scenario === "resolved_duplicate_request" ||
      scenario === "resolved_conflicting_request"
    ) {
      await waitForApprovalResolutionObservation(1);
      requestCommandApprovalWithParams(
        resolvedRequestId,
        scenario === "resolved_conflicting_request"
          ? {
              ...resolvedParams,
              command: "npm run conflicting-after-resolution",
              commandActions: [
                {
                  type: "unknown",
                  command: "npm run conflicting-after-resolution",
                },
              ],
            }
          : resolvedParams,
      );
      return;
    }
    if (accepted) {
      emitObservedItems();
      completeSuccess();
    } else if (message.result?.decision === "cancel") {
      if (
        scenario === "ignored_interrupt" ||
        scenario === "network_permission_approval_ignored_interrupt"
      ) return;
      completeInterrupted();
    } else if (scenario === "network_permission_approval_ignored_interrupt") {
      // This scenario models a host that resolves the permission request but
      // never confirms turn interruption. Core must pause for reconciliation
      // and admit no terminal receipt, independently of JSONL message order.
      return;
    } else {
      completeFailure();
    }
  }
}

function requestCommandApproval(overrides = {}, requestId = approvalRequestId) {
  requestCommandApprovalWithParams(requestId, commandApprovalParams(overrides));
}

function commandApprovalParams(overrides = {}) {
  const command = overrides.command ?? "npm test";
  return {
    threadId: overrides.threadId ?? threadId,
    turnId: overrides.turnId ?? turnId,
    itemId: overrides.itemId ?? "fake-command-item",
    startedAtMs: Date.now(),
    environmentId: null,
    reason: "Run one bounded verification command.",
    command,
    cwd: root,
    commandActions: [{ type: "unknown", command }],
    ...(overrides.networkApprovalContext
      ? { networkApprovalContext: overrides.networkApprovalContext }
      : {}),
  };
}

function requestCommandApprovalWithParams(requestId, params) {
  pendingApprovalRequestIds.add(requestId);
  approvalRequestParams.set(requestId, params);
  serverRequest(requestId, "item/commandExecution/requestApproval", params);
}

function requestSequentialApproval() {
  sequentialApprovalIndex += 1;
  requestCommandApproval(
    { itemId: `fake-sequential-command-item-${sequentialApprovalIndex}` },
    `fake-server-sequential-${sequentialApprovalIndex}`,
  );
}

function requestUnknownApproval() {
  pendingApprovalRequestIds.add(approvalRequestId);
  serverRequest(approvalRequestId, "item/unknown/requestApproval", {
    threadId,
    turnId,
    itemId: "fake-unknown-item",
  });
}

function requestFileApproval(grantRoot = root) {
  pendingApprovalRequestIds.add(approvalRequestId);
  serverRequest(approvalRequestId, "item/fileChange/requestApproval", {
    threadId,
    turnId,
    itemId: "fake-file-item",
    startedAtMs: Date.now(),
    reason: "Apply one project-scoped file change.",
    grantRoot,
  });
}

function requestPermissionApproval(network) {
  pendingApprovalRequestIds.add(approvalRequestId);
  serverRequest(approvalRequestId, "item/permissions/requestApproval", {
    threadId,
    turnId,
    itemId: network ? "fake-network-item" : "fake-permission-item",
    environmentId: null,
    startedAtMs: Date.now(),
    cwd: root,
    reason: network
      ? "Request network access without a stable exact destination."
      : "Request project-scoped filesystem access.",
    permissions: network
      ? { network: { enabled: true }, fileSystem: null }
      : {
          network: null,
          fileSystem: { read: [root], write: [root], entries: [] },
        },
  });
}

function emitObservedItems() {
  const command = {
    type: "commandExecution",
    id: "fake-command-item",
    command: "npm test",
    cwd: root,
    processId: null,
    source: "unifiedExecStartup",
    status: "completed",
    commandActions: [{ type: "unknown", command: "npm test" }],
    aggregatedOutput: "raw output must never be persisted",
    exitCode: 0,
    durationMs: 1,
  };
  notify("item/started", { item: command, threadId, turnId, startedAtMs: Date.now() });
  notify("item/completed", { item: command, threadId, turnId, completedAtMs: Date.now() });
  const file = {
    type: "fileChange",
    id: "fake-file-item",
    changes: [{ path: "src/live-result.ts", kind: "update", diff: "raw diff must never be persisted" }],
    status: "completed",
  };
  notify("item/completed", { item: file, threadId, turnId, completedAtMs: Date.now() });
}

function completeSuccess() {
  if (completed) return;
  completed = true;
  turnActive = false;
  persistState({ threadId, sessionId, turnId, status: "completed" });
  notify("turn/completed", {
    threadId,
    turn: turn("completed", [agentMessage(structuredResult())]),
  });
  notify("thread/status/changed", { threadId, status: { type: "idle" } });
}

function completeConflictingSuccess() {
  if (completed) return;
  completed = true;
  const first = JSON.parse(structuredResult());
  const second = { ...first, summary: "Conflicting terminal material." };
  notify("turn/completed", {
    threadId,
    turn: turn("completed", [agentMessage(JSON.stringify(first))]),
  });
  notify("turn/completed", {
    threadId,
    turn: turn("completed", [agentMessage(JSON.stringify(second))]),
  });
}

function completeFailure() {
  if (completed) return;
  completed = true;
  turnActive = false;
  persistState({ threadId, sessionId, turnId, status: "failed" });
  notify("turn/completed", {
    threadId,
    turn: {
      ...turn("failed", []),
      error: {
        message: "bounded fake failure",
        codexErrorInfo: null,
        additionalDetails: null,
      },
    },
  });
}

function completeInterrupted() {
  if (completed) return;
  completed = true;
  turnActive = false;
  pendingApprovalRequestIds.clear();
  persistState({ threadId, sessionId, turnId, status: "interrupted" });
  notify("turn/completed", { threadId, turn: turn("interrupted", []) });
}

async function settleAndExit() {
  if (scenario === "delayed_cleanup" && releasePath) {
    await waitForRelease();
  }
  descendant?.kill("SIGTERM");
  if (cleanupMarkerPath) {
    writeFileSync(cleanupMarkerPath, "settled\n", { mode: 0o600 });
  }
  trace("stdin_closed", {});
  persistNetworkCount();
  process.exit(process.exitCode ?? 0);
}

function completeInvalidStructuredResult() {
  if (completed) return;
  completed = true;
  notify("turn/completed", {
    threadId,
    turn: turn("completed", [agentMessage("not-json")]),
  });
}

function completeOversizedStructuredResult() {
  if (completed) return;
  completed = true;
  notify("turn/completed", {
    threadId,
    // Larger than Augnes' 128 KiB structured-result bound while remaining
    // inside the 256 KiB transport-line bound, so terminal identity is known.
    turn: turn("completed", [agentMessage("x".repeat(140 * 1024))]),
  });
}

function completeUnsafePathStructuredResult() {
  if (completed) return;
  completed = true;
  const value = JSON.parse(structuredResult());
  value.changed_files[0].repository_relative_path = "C:\\private\\outside.ts";
  notify("turn/completed", {
    threadId,
    turn: turn("completed", [agentMessage(JSON.stringify(value))]),
  });
}

function completeUnsafeTextStructuredResult(summary) {
  if (completed) return;
  completed = true;
  const value = JSON.parse(structuredResult());
  value.summary = summary;
  notify("turn/completed", {
    threadId,
    turn: turn("completed", [agentMessage(JSON.stringify(value))]),
  });
}

function structuredResult() {
  return JSON.stringify({
    result_version: "codex_host_structured_result.v0.1",
    summary: "The deterministic fake App Server completed the bounded live lifecycle.",
    changed_files: [
      {
        repository_relative_path: "src/./live-result.ts",
        change_kind: "modified",
        before_hash: null,
        after_hash: null,
      },
    ],
    artifacts: [
      {
        artifact_ref: {
          ref_version: "external_ref.v0.1",
          ref_type: "repository_relative_artifact",
          external_id: "reports/../reports/live-result.json",
          observed_at: new Date().toISOString(),
          trust_class: "host_attestation",
        },
        summary: "Bounded fake result artifact.",
      },
    ],
    observed_actions: ["fake_app_server_turn_completed"],
    commands: [],
    checks: [
      {
        check_id: "fake-live-check",
        required: true,
        status: "passed",
        summary: "The fake App Server exercised the stable lifecycle subset.",
      },
    ],
    skipped_checks: [],
    uncertainty: [],
    gaps: ["No live provider was called by the deterministic fixture."],
    proposed_next_steps: ["Review the operational receipt before semantic action."],
  });
}

function threadResponse(options = {}) {
  return {
    thread: thread(options),
    model: "configured-default",
    modelProvider: "fake",
    serviceTier: null,
    cwd: root,
    instructionSources: [],
    approvalPolicy: "on-request",
    approvalsReviewer: "user",
    sandbox: {
      type: "workspaceWrite",
      writableRoots: [root],
      networkAccess: false,
      excludeTmpdirEnvVar: true,
      excludeSlashTmp: true,
    },
    reasoningEffort: null,
  };
}

function thread(options = {}) {
  const includeTurns = options.includeTurns === true;
  const turnStatus = options.turnStatus ?? "inProgress";
  return {
    id: threadId,
    sessionId,
    forkedFromId: null,
    parentThreadId: null,
    preview: "bounded fake thread",
    ephemeral: false,
    modelProvider: "fake",
    createdAt: Math.floor(Date.now() / 1000),
    updatedAt: Math.floor(Date.now() / 1000),
    recencyAt: Math.floor(Date.now() / 1000),
    status: turnActive ? { type: "active", activeFlags: [] } : { type: "idle" },
    path: null,
    cwd: root,
    cliVersion: "fake-0.143.0",
    source: "appServer",
    threadSource: null,
    agentNickname: null,
    agentRole: null,
    gitInfo: null,
    name: null,
    turns: includeTurns ? [turn(turnStatus, turnStatus === "completed" ? [agentMessage(structuredResult())] : [])] : [],
  };
}

function turn(status, items) {
  return {
    id: turnId,
    items,
    itemsView: { type: "full" },
    status,
    error: null,
    startedAt: Math.floor(Date.now() / 1000),
    completedAt: status === "inProgress" ? null : Math.floor(Date.now() / 1000),
    durationMs: status === "inProgress" ? null : 1,
  };
}

function agentMessage(text) {
  return {
    type: "agentMessage",
    id: "fake-agent-message",
    text,
    phase: "final_answer",
    memoryCitation: null,
  };
}

function respond(id, result) {
  send({ id, result });
}

function respondError(id, code, message) {
  send({ id, error: { code, message } });
}

function notify(method, params) {
  send({ method, params });
}

function serverRequest(id, method, params) {
  send({ id, method, params });
}

function send(message) {
  trace("sent", minimized(message));
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function trace(kind, value) {
  if (!tracePath) return;
  appendFileSync(
    tracePath,
    `${JSON.stringify({ kind, value, at: new Date().toISOString() })}\n`,
    { mode: 0o600 },
  );
}

function minimized(message) {
  const summary = {
    id: message?.id ?? null,
    method: message?.method ?? null,
    has_result: Object.hasOwn(message ?? {}, "result"),
    has_error: Object.hasOwn(message ?? {}, "error"),
  };
  if (message?.method === "initialize") {
    summary.fixture_scenario = scenario;
    summary.capabilities = message.params?.capabilities ?? null;
  }
  if (message?.error && typeof message.error === "object") {
    summary.error_code = Number.isSafeInteger(message.error.code)
      ? message.error.code
      : null;
    summary.error_reason =
      typeof message.error.message === "string" &&
      /^[a-z0-9_]{1,160}$/u.test(message.error.message)
        ? message.error.message
        : "bounded_protocol_error";
  }
  if (message?.method === "thread/start" || message?.method === "thread/resume") {
    summary.cwd = message.params?.cwd ?? null;
    summary.approval_policy = message.params?.approvalPolicy ?? null;
    summary.sandbox = message.params?.sandbox ?? null;
  }
  if (message?.method === "turn/start") {
    const rendered = message.params?.input?.[0]?.text;
    summary.thread_id = message.params?.threadId ?? null;
    summary.cwd = message.params?.cwd ?? null;
    summary.approval_policy = message.params?.approvalPolicy ?? null;
    summary.sandbox_policy = message.params?.sandboxPolicy ?? null;
    summary.output_schema = Boolean(message.params?.outputSchema);
    summary.rendered_input_bytes =
      typeof rendered === "string" ? Buffer.byteLength(rendered, "utf8") : 0;
    summary.rendered_input_sha256 =
      typeof rendered === "string"
        ? `sha256:${createHash("sha256").update(rendered).digest("hex")}`
        : null;
  }
  return summary;
}

function waitForRelease() {
  trace("release_wait_enter", {
    configured: Boolean(releasePath),
    already_released: Boolean(releasePath && existsSync(releasePath)),
  });
  if (!releasePath || existsSync(releasePath)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      watcher.close();
      if (error) {
        trace("release_wait_timeout", {});
        reject(error);
      } else {
        trace("release_wait_released", {});
        resolve();
      }
    };
    const timeout = setTimeout(() => {
      finish(new Error("release_barrier_timeout"));
    }, 10_000);
    const watcher = watch(path.dirname(releasePath), () => {
      if (!existsSync(releasePath)) return;
      finish();
    });
    trace("release_wait_registered", {});
    // Close the gap between the first existence check and watcher
    // registration so a fast controller release cannot be missed.
    if (existsSync(releasePath)) finish();
  });
}

function waitForApprovalResolutionObservation(expectedCount) {
  if (!approvalResolutionBarrierPath) {
    return Promise.reject(new Error("approval_resolution_barrier_missing"));
  }
  if (readBarrierCount() >= expectedCount) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let settled = false;
    let poll = null;
    const finish = (error = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (poll !== null) clearInterval(poll);
      if (error) reject(error);
      else resolve();
    };
    const timeout = setTimeout(() => {
      finish(new Error("approval_resolution_barrier_timeout"));
    }, 10_000);
    poll = setInterval(() => {
      if (readBarrierCount() >= expectedCount) finish();
    }, 10);
    if (readBarrierCount() >= expectedCount) finish();
  });

  function readBarrierCount() {
    if (!existsSync(approvalResolutionBarrierPath)) return 0;
    const value = Number(readFileSync(approvalResolutionBarrierPath, "utf8").trim());
    return Number.isSafeInteger(value) ? value : 0;
  }
}

function installZeroNetworkGuard() {
  const refuse = () => {
    externalNetworkAttempts += 1;
    throw new Error("fake_codex_external_network_forbidden");
  };
  globalThis.fetch = refuse;
  net.connect = refuse;
  net.createConnection = refuse;
  tls.connect = refuse;
  dns.lookup = refuse;
  dns.resolve = refuse;
}

function persistNetworkCount() {
  if (!networkCountPath) return;
  writeFileSync(networkCountPath, `${externalNetworkAttempts}\n`, { mode: 0o600 });
}

function persistState(value) {
  if (!statePath) return;
  writeFileSync(statePath, JSON.stringify(value), { mode: 0o600 });
}
