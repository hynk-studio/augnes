#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { handleLlamaMessageV01 } from "./llama-companion-stdio.mjs";
import { handleMessageV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";
import {
  beginCanonicalTestResourceUse,
  buildCanonicalChildEnvironment,
  cleanupCanonicalTestResources,
  createCanonicalTestResourceRoot,
  settleCanonicalTestResourceUse,
} from "./canonical-test-environment.mjs";
import {
  registerOwnedChild,
  terminateOwnedProcessTree,
  waitForOwnedProcessExit,
} from "./test-harness-process-lifecycle.mjs";

const snapshotBinding = `sha256:${"a".repeat(64)}`;
const previewBinding = `sha256:${"b".repeat(64)}`;
const packetFingerprint = `sha256:${"c".repeat(64)}`;
const definition = { goal: "Inspect a supplied file", success_criteria: ["Retain the observation"], non_goals: ["No managed execution"] };
const note = { source_binding: packetFingerprint, excerpt_text: 'Literal note: "quotes", a newline\nand 한국어.',
  provenance: "imported_unverified", label: "Next check" };
let fixtureCount = 0;

// These are projection fixtures, not an installed Companion, real model work,
// or authority to save anything. A text-only v1 consumer must retain all bytes
// of the owner's JSON data, not just the human-readable summary.
for (const [name, projection, isError] of [
  ["augnes_resume_repository", { continuity: { snapshot: { status: "exact", binding: snapshotBinding },
    current_work: { status: "current_work", goal: definition.goal } } }, false],
  ["augnes_read_repository_work_sources", { status: "available", definition, sources: [note], packet_fingerprint: packetFingerprint }, false],
  ["augnes_preview_repository_initial_work", { status: "previewed", preview_binding: previewBinding,
    expected_snapshot_binding: snapshotBinding, definition }, false],
  ["augnes_define_repository_initial_work", { status: "saved", preview_binding: previewBinding, packet_fingerprint: packetFingerprint }, false],
  ["augnes_preview_repository_work_revision", { status: "previewed", preview_binding: previewBinding,
    expected_snapshot_binding: snapshotBinding, definition, sources: [note] }, false],
  ["augnes_save_repository_work_revision", { status: "exact_replay", preview_binding: previewBinding, packet_fingerprint: packetFingerprint }, false],
  ["augnes_save_repository_work_revision", { status: "refused", reason: "refresh_required", authority: { execution: false } }, true],
  ["augnes_save_repository_work_revision", { status: "unknown", reason: "response_lost" }, true],
]) {
  const message = { jsonrpc: "2.0", id: `fixture-${fixtureCount}`, method: "tools/call", params: { name, arguments: { repositoryRoot: "/fixture/project" } } };
  const original = { jsonrpc: "2.0", id: message.id, result: { isError,
    structuredContent: projection, content: [{ type: "text", text: "Existing summary." }], _meta: { unchanged: true } } };
  const before = structuredClone(original);
  let calls = 0;
  const response = await handleLlamaMessageV01(message, async received => {
    calls++;
    assert.equal(received, message, "request is neither rewritten nor retried");
    return original;
  });
  assert.equal(calls, 1);
  assert.deepEqual(original, before, "the existing owner's response remains unchanged");
  assert.deepEqual(response, { ...before, result: { ...before.result,
    content: [...before.result.content, { type: "text", text: JSON.stringify(projection) }] } });
  const textOnly = response.result.content.filter(item => item.type === "text").map(item => item.text);
  assert.deepEqual(JSON.parse(textOnly.at(-1)), projection);
  assert.equal(response.result.isError, isError);
  fixtureCount++;
}

// Non-tool messages, notifications, plain text tools and JSON-RPC errors keep
// their original envelope. Exceptions still reach the existing stdio owner.
for (const [message, original] of [
  [{ method: "tools/list" }, { result: { tools: [], structuredContent: { should_not_be_copied: true } } }],
  [{ method: "tools/call" }, { jsonrpc: "2.0", id: 1, error: { code: -32602, message: "invalid_arguments", data: { retained: true } } }],
  [{ method: "tools/call" }, { result: { content: [{ type: "text", text: "Plain result." }] } }],
  [{ method: "notifications/initialized" }, null],
  [null, { jsonrpc: "2.0", id: null, error: { code: -32600, message: "invalid_request" } }],
]) {
  assert.equal(await handleLlamaMessageV01(message, async () => original), original);
  fixtureCount++;
}
const ownerFailure = new Error("fixture owner failure");
await assert.rejects(handleLlamaMessageV01({ method: "tools/call" }, async () => { throw ownerFailure; }),
  error => error === ownerFailure);
fixtureCount++;

// No tool invocation below can reach discovery: initialize/list/ping are
// protocol-only; notifications and malformed/unadvertised requests refuse
// before dispatch. In particular cancellation must not become another action.
for (const protocolVersion of ["2024-11-05", "2025-06-18"]) {
  const message = { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion } };
  assert.deepEqual(await handleLlamaMessageV01(message), await handleMessageV01(message));
  assert.equal((await handleLlamaMessageV01(message)).result.protocolVersion, "2025-06-18");
}
for (const method of ["notifications/initialized", "notifications/cancelled", "tools/call"]) {
  assert.equal(await handleLlamaMessageV01({ jsonrpc: "2.0", method,
    params: { name: "augnes_start_companion_service", arguments: {} } }), null);
}
for (const message of [null, [], {}, { jsonrpc: "2.0", id: null, method: "tools/list" },
  { jsonrpc: "2.0", id: 1, method: "tools/list", params: false }]) {
  assert.deepEqual(await handleLlamaMessageV01(message), await handleMessageV01(message));
}
const unknown = { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "not_advertised", arguments: {} } };
assert.deepEqual(await handleLlamaMessageV01(unknown), await handleMessageV01(unknown));
const listRequest = { jsonrpc: "2.0", id: 2, method: "tools/list" };
const rawList = await handleMessageV01(listRequest);
assert.deepEqual(await handleLlamaMessageV01(listRequest), rawList);
assert.equal(rawList.result.nextCursor, undefined, "llama v1 consumes one tools/list page");
const names = rawList.result.tools.map(tool => tool.name);
assert(names.length > 0);
assert.equal(new Set(names.map(name => `augnes_${name}`)).size, names.length);
for (const name of names) assert(`augnes_${name}`.length <= 64,
  `llama's prefixed tool name exceeds the hosted-model limit: augnes_${name}`);
for (const name of ["augnes_resume_repository", "augnes_read_repository_work_sources",
  "augnes_preview_repository_initial_work", "augnes_define_repository_initial_work",
  "augnes_preview_repository_work_revision", "augnes_save_repository_work_revision"]) assert(names.includes(name));

const stdio = await probeStdio();
assert.equal(stdio[0].result.protocolVersion, "2025-06-18", "exact v1 handshake mismatch is preserved, not called negotiation");
assert.deepEqual(stdio[1], rawList, "real stdio advertises unchanged tools and schemas");
assert.deepEqual(stdio[2], { jsonrpc: "2.0", id: 3, result: {} });
assert.deepEqual(stdio[3], { jsonrpc: "2.0", id: null, error: { code: -32700, message: "parse_error" } });
assert.deepEqual(stdio[4], { jsonrpc: "2.0", id: 4, error: { code: -32600, message: "invalid_request" } });
assert.equal(stdio.length, 5, "notifications have no output or lifecycle dispatch");
console.log(`PASS llama Companion text adapter: ${fixtureCount} projection/envelope fixtures; ${names.length} unchanged tools within the 64-character prefix limit; 2 metadata refusals; protocol-only stdio; owned processes/resources cleaned. No live Companion or model validation.`);

async function probeStdio() {
  const resource = createCanonicalTestResourceRoot("ag-suite-");
  const owned = new Set();
  const environment = buildCanonicalChildEnvironment({ temporaryRoot: resource.root });
  const executable = fileURLToPath(new URL("./llama-companion-stdio.mjs", import.meta.url));
  let record;
  beginCanonicalTestResourceUse(resource);
  try {
    // v1 optionally injects these host settings even though Augnes does not
    // advertise them. The existing proxy must reject before discovery and the
    // wrapper must not silently strip them. Pin a private runtime path so a
    // future dispatch regression cannot discover a real Companion in this test.
    const previousRuntimeDirectory = process.env.AUGNES_RUNTIME_STATE_DIR;
    process.env.AUGNES_RUNTIME_STATE_DIR = environment.AUGNES_RUNTIME_STATE_DIR;
    try {
      for (const extra of [{ cwd: resource.root }, { runtime: "fixture-runtime" }]) {
        const message = { jsonrpc: "2.0", id: "injected-host-metadata", method: "tools/call", params: {
          name: "augnes_read_repository_work_sources", arguments: {
            repositoryRoot: resource.root, expectedSnapshotBinding: snapshotBinding, ...extra,
          },
        } };
        const response = await handleMessageV01(message);
        assert.deepEqual(response, { jsonrpc: "2.0", id: message.id,
          error: { code: -32602, message: "invalid_repository_tool_request" } });
        assert.deepEqual(await handleLlamaMessageV01(message), response);
      }
    } finally {
      if (previousRuntimeDirectory === undefined) delete process.env.AUGNES_RUNTIME_STATE_DIR;
      else process.env.AUGNES_RUNTIME_STATE_DIR = previousRuntimeDirectory;
    }
    const child = spawn(process.execPath, [executable], { cwd: resource.root, env: environment,
      detached: process.platform !== "win32", windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    record = registerOwnedChild(owned, child, { label: "llama-companion-protocol-only" });
    let stdout = "", stderr = "", overflow = false, inputError;
    const maxOutputBytes = 512 * 1024;
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", chunk => {
      if (Buffer.byteLength(stdout) + Buffer.byteLength(chunk) > maxOutputBytes) overflow = true;
      else stdout += chunk;
    });
    child.stderr.on("data", chunk => {
      if (Buffer.byteLength(stderr) + Buffer.byteLength(chunk) > maxOutputBytes) overflow = true;
      else stderr += chunk;
    });
    child.stdin.on("error", error => { inputError = error; });
    const lines = [
      JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "llama-v1-protocol-fixture", version: "1" } } }),
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
      JSON.stringify(listRequest),
      JSON.stringify({ jsonrpc: "2.0", id: 3, method: "ping" }),
      "{malformed-json",
      JSON.stringify({ jsonrpc: "2.0", id: 4, method: "tools/list", params: false }),
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/cancelled", params: { requestId: 2 } }),
      JSON.stringify({ jsonrpc: "2.0", method: "tools/call", params: { name: "augnes_start_companion_service", arguments: {} } }),
      "",
    ];
    child.stdin.end(lines.join("\n"));
    const result = await waitForOwnedProcessExit(record, 10_000);
    assert.equal(record.spawnErrorCode, null);
    assert.equal(result.code, 0, stderr);
    assert.equal(result.signal, null);
    assert.equal(inputError, undefined);
    assert.equal(overflow, false);
    assert.equal(stderr, "");
    assert.deepEqual(readdirSync(resource.root), [], "protocol discovery creates no runtime or service state");
    return stdout.trimEnd().split("\n").map(line => JSON.parse(line));
  } finally {
    await terminateOwnedProcessTree(record);
    assert.equal(owned.size, 0);
    settleCanonicalTestResourceUse(resource, { exit_observed: !record || record.exited,
      streams_closed: !record || (record.stdoutClosed && record.stderrClosed),
      cleanup_completed: !record || record.closed, remaining_owned_processes: owned.size });
    const cleaned = cleanupCanonicalTestResources([resource]);
    assert(cleaned.every(result => result.completed), JSON.stringify(cleaned));
  }
}
