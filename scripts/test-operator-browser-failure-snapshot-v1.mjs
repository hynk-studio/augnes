import assert from "node:assert/strict";
import path from "node:path";
import {
  createOperatorBrowserFailureSnapshotV1,
  OPERATOR_FAILURE_SNAPSHOT_LIMITS_V1 as limits,
} from "./operator-browser-failure-snapshot-v1.mjs";

// Synthetic forwarded output exercises retention, not the historical HTTP 500.
const root = process.cwd();
const phase = "browser_navigation_diagnostics";
const errorFrame = "app/workbench/results/[receipt_id]/page.tsx";
const sensitive = [
  "raw-sensitive-runtime-document", "vnext_bootstrap_v01.sensitive-document-token",
  "sk-proj-sensitive-document-key", "/Users/private-operator/runtime-error",
  "Authorization: Bearer private-token", "Cookie: session=private",
  "OPENAI_API_KEY=private", "personal-supervisor-reason",
];
const document = {
  request_id: "request-sensitive-local-id", frame_id: "frame-sensitive-local-id",
  loader_id: "loader-sensitive-local-id", type: "Document", phase,
  navigation_epoch: 7, runtime_origin: true, status: 500,
};
const failure = {
  phase, diagnostic: { category: "http_error_document", route: "workbench_result", http_status: 500 },
  readSupervisor: () => ({ last_supervisor_result_code: "running", database_state: "ready" }),
};
const setup = (generation = 1) => {
  const owner = createOperatorBrowserFailureSnapshotV1({ repository_root: root });
  owner.beginRuntime(generation);
  owner.beginNavigation({ epoch: 7, phase, route: "workbench_result", runtime_origin: true });
  return owner;
};
const bind = (owner, response = document, request = document) => owner.document({
  frame_id: document.frame_id, loader_id: document.loader_id, response, request,
});
const roundTrip = (owner) => JSON.parse(JSON.stringify(owner.snapshot()));
const completeCleanup = {
  runtime_shutdown_complete: true, chrome_cdp_shutdown_complete: true,
  owned_process_residue_count: 0, listener_residue_count: 0,
};
const serverText = `[augnes:ui] ⨯ TypeError: ${sensitive.join(" ")}\n` +
  `    at render (${path.join(root, errorFrame)}:12:3)\n` +
  "    at private (/Users/private-operator/runtime-error:4:2)\n" +
  "    at encoded (app/%2e%2e/private.ts:1:1)\n" +
  "    at traversal (app/../lib/vnext/runtime/local-operator-session.ts:1:1)\n" +
  "    at missing (app/private-token.ts:1:1)\n" +
  "    code: 'MODULE_NOT_FOUND',\n" +
  "    digest: 'private-opaque-digest',\n";

const retained = setup(4);
bind(retained);
const bytes = Buffer.from(serverText);
// Include splits through UTF-8, prefix, class, filename, code and digest.
for (let offset = 0; offset < bytes.length; offset += 7) retained.append(4, "stderr", bytes.subarray(offset, offset + 7));
const before = retained.capture(failure);
assert.equal(before.primary.runtime.generation, 4);
assert.equal(before.primary.runtime.start_mode, "source_next_dev_webpack");
assert.equal(before.primary.phase, phase);
assert.equal(before.primary.navigation.correlation, "request_response_and_navigation");
assert.equal(before.primary.navigation.document.http_status, 500);
assert.deepEqual(before.primary.navigation.document.request, before.primary.navigation.document.response);
assert.equal(before.primary.navigation.expected.loader_id, before.primary.navigation.document.response.loader_id);
assert.equal(before.primary.navigation.expected.frame_id, before.primary.navigation.document.response.frame_id);
assert.match(before.primary.navigation.document.response.request_id, /^local:[0-9a-f]{24}$/u);
assert.equal(before.primary.server.association, "runtime_navigation_capture_interval_only");
assert.equal(before.primary.server.direct_request_correlation, "unavailable");
assert.equal(before.primary.server.upstream_delivery, "completeness_unavailable");
const event = before.primary.server.evidence.events[0];
assert.equal(event.error_class, "TypeError");
assert.equal(event.error_code, "MODULE_NOT_FOUND");
assert.match(event.digest, /^local:[0-9a-f]{24}$/u);
assert.deepEqual(event.frames, [{ path: errorFrame, line: 12, column: 3 }]);
assert.equal(before.primary.server.evidence.frames_redacted, true);
retained.append(4, "stderr", "Error: subsequent shutdown error\n");
retained.shutdown(4, () => ({ last_supervisor_result_code: "stopped", last_public_reason_code: "signal_sigterm", supervisor_exit_code: 0 }));
retained.cleanup(completeCleanup);
retained.beginRuntime(5);
retained.capture({ ...failure, phase: "cleanup" });
const after = roundTrip(retained);
assert.deepEqual(after.primary, before.primary);
assert.equal(after.subsequent.supervisor_shutdown.last_supervisor_result_code, "stopped");
assert.equal(after.primary.supervisor_at_failure.last_supervisor_result_code, "running");
assert.equal(after.subsequent.server_output.association, "same_runtime_after_failure_capture_only");
assert.equal(after.subsequent.server_output.direct_request_correlation, "unavailable");
assert.equal(after.subsequent.server_output.evidence.events[0].error_class, "Error");
assert.deepEqual(after.subsequent.cleanup, completeCleanup);
before.primary.phase = "mutated caller copy";
assert.equal(roundTrip(retained).primary.phase, phase);
const serialized = JSON.stringify(after);
for (const value of [...sensitive, ...[document.request_id, document.frame_id, document.loader_id], "private-opaque-digest", root]) {
  assert.equal(serialized.includes(value), false, "raw diagnostic material excluded");
}

// No old runtime or prior navigation fragments, requests, frames or loaders can
// become the current document's error evidence.
const isolation = setup();
isolation.append(1, "stderr", "ReferenceError: prior runtime\n");
isolation.beginRuntime(2);
isolation.beginNavigation({ epoch: 6, phase, route: "project", runtime_origin: true });
isolation.append(2, "stderr", "SyntaxError: prior navigation\nType");
isolation.beginNavigation({ epoch: 7, phase, route: "workbench_result", runtime_origin: true });
isolation.append(1, "stderr", "Error: late previous generation chunk\n");
isolation.append(2, "stderr", "Error: split across navigation\n");
bind(isolation);
assert.deepEqual(isolation.capture(failure).primary.server.evidence.events, []);
assert.equal(roundTrip(isolation).primary.server.evidence.availability, "unavailable");
assert.equal(roundTrip(isolation).primary.failure.http_status, 500);
for (const foreign of [
  { loader_id: "foreign" }, { frame_id: "foreign" }, { phase: "setup" },
  { navigation_epoch: 6 }, { type: "Fetch" },
]) {
  const owner = setup();
  bind(owner, { ...document, ...foreign });
  const snapshot = owner.capture(failure);
  assert.equal(snapshot.primary.navigation.document, null);
  assert.equal(snapshot.primary.navigation.correlation, "unavailable");
}
const unrelatedRequest = setup();
bind(unrelatedRequest, document, { ...document, request_id: "unrelated" });
assert.equal(unrelatedRequest.capture(failure).primary.navigation.document.request, null);
const unsafeIds = setup();
unsafeIds.document({
  frame_id: document.frame_id, loader_id: document.loader_id,
  response: { ...document, request_id: "private ".repeat(100) },
});
const redactedIds = unsafeIds.capture(failure).primary.navigation.document;
assert.equal(redactedIds.response.request_id, null);
assert.equal(redactedIds.identifiers, "partially_unavailable_or_redacted");
const foreignOrigin = setup();
foreignOrigin.append(1, "stderr", "Error: supervised runtime but different document origin\n");
bind(foreignOrigin, { ...document, runtime_origin: false });
assert.equal(foreignOrigin.capture(failure).primary.server.evidence, null);
assert.equal(roundTrip(foreignOrigin).primary.server.association, "unavailable_foreign_or_non_http_origin");
for (const status of ["500", NaN, 99, 600, 200.5, null]) {
  const owner = setup();
  bind(owner, { ...document, status });
  assert.equal(owner.capture(failure).primary.navigation.document.http_status, null);
}

const ambiguous = setup();
ambiguous.append(1, "stderr", "Error: first\nError: identical wording remains a distinct event\nPrivateError: unclassifiable\ncode: 'PRIVATE_SECRET',\n");
const ambiguity = ambiguous.capture(failure).primary.server.evidence;
assert.equal(ambiguity.events.length, 3);
assert.equal(ambiguity.ambiguous, true);
assert.equal(ambiguity.unclassifiable_error, true);
assert.equal(ambiguity.events[2].error_class, null);
assert.equal(ambiguity.events[2].error_code, null);
assert.equal(JSON.stringify(ambiguity).includes("PRIVATE_SECRET"), false);

const bounded = setup();
bind(bounded);
for (let count = 0; count < limits.events + 2; count += 1) {
  bounded.append(1, "stderr", "Error: repetitive message\n");
  for (let frame = 0; frame < limits.frames_per_event + 2; frame += 1) bounded.append(1, "stderr", `at ${errorFrame}:1:1\n`);
}
bounded.append(1, "stdout", "x".repeat(limits.line_characters + 1));
bounded.append(1, "stdout", "TypeError: truncated suffix is not an event\n");
bounded.append(1, "stderr", "x".repeat(limits.input_bytes * 2));
const bounds = bounded.capture(failure);
assert.equal(bounds.primary.server.evidence.events.length, limits.events);
assert.equal(bounds.primary.server.evidence.frames_truncated, true);
assert.equal(bounds.primary.server.evidence.events_truncated, true);
assert.equal(bounds.primary.server.evidence.line_truncated, true);
assert.equal(bounds.primary.server.evidence.input_truncated, true);
assert.equal(bounds.primary.server.evidence.partial_line_unavailable, true);
assert.equal(bounds.primary.server.evidence.input_bytes, limits.input_bytes);
assert.ok(Buffer.byteLength(JSON.stringify(bounds)) < limits.serialized_bytes);
for (let count = 0; count < limits.events; count += 1) {
  bounded.append(1, "stderr", "[Error: supplemental]\n");
  for (let frame = 0; frame < limits.frames_per_event; frame += 1) bounded.append(1, "stderr", `at ${errorFrame}:1:1\n`);
}
bounded.shutdown(1, failure.readSupervisor);
assert.ok(Buffer.byteLength(JSON.stringify(roundTrip(bounded))) < limits.serialized_bytes);
const partial = setup();
partial.append(1, "stderr", "Error: incomplete");
assert.equal(partial.capture(failure).primary.server.evidence.partial_line_unavailable, true);
assert.deepEqual(roundTrip(partial).primary.server.evidence.events, []);
partial.append(1, "stderr", "TypeError: suffix across capture boundary\n");
partial.shutdown(1, failure.readSupervisor);
assert.deepEqual(roundTrip(partial).subsequent.server_output.evidence.events, []);

const captureFailure = setup();
bind(captureFailure);
assert.doesNotThrow(() => captureFailure.capture({ ...failure, readSupervisor: () => { throw new Error(sensitive.join(" ")); } }));
assert.doesNotThrow(() => captureFailure.shutdown(1, () => { throw new Error("shutdown capture failure"); }));
captureFailure.cleanup(null);
const failedCapture = roundTrip(captureFailure);
assert.equal(failedCapture.primary.failure.http_status, 500);
assert.deepEqual(failedCapture.capture_failures, ["supervisor_capture_failed"]);
assert.deepEqual(failedCapture.subsequent.cleanup, {
  runtime_shutdown_complete: null, chrome_cdp_shutdown_complete: null,
  owned_process_residue_count: null, listener_residue_count: null,
});
const unsafeSupervisor = setup();
const safeSupervisor = unsafeSupervisor.capture({ ...failure, readSupervisor: () => ({
  last_supervisor_result_code: "personal-supervisor-reason", last_public_reason_code: sensitive[1],
  public_supervisor_output_tail: sensitive.join(" "), supervisor_exit_code: "0",
}) }).primary.supervisor_at_failure;
assert.equal(safeSupervisor.unclassifiable_fields, true);
assert.equal(safeSupervisor.last_supervisor_result_code, null);
assert.equal(safeSupervisor.supervisor_exit_code, null);
for (const marker of sensitive) assert.equal(JSON.stringify(safeSupervisor).includes(marker), false);

process.stdout.write("operator_browser_failure_snapshot.v1: synthetic retention, correlation, privacy, bounds and capture settlement pass\n");
