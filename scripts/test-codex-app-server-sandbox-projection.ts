import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import { createCodexAppServerAdapterV01 } from "@/lib/vnext/native-host/codex-app-server-adapter";
import {
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import { buildTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  NativeHostLifecycleEventV01,
  NativeHostRequestV01,
} from "@/types/vnext/native-host-adapter";

async function main(): Promise<void> {
  const testRoot = realpathSync(
    mkdtempSync(path.join(tmpdir(), "augnes-codex-sandbox-test-")),
  );
  try {
  const runtimeRoot = path.join(testRoot, "runtime");
  const userHome = path.join(testRoot, "home");
  mkdirSync(runtimeRoot, { recursive: true, mode: 0o700 });
  mkdirSync(userHome, { recursive: true, mode: 0o700 });
  const tracePath = path.join(runtimeRoot, "trace.jsonl");
  const cleanupPath = path.join(runtimeRoot, "cleanup.marker");
  const networkPath = path.join(runtimeRoot, "network-count.txt");
  const request = requestV01(testRoot);
  const lifecycle: NativeHostLifecycleEventV01[] = [];
  const adapter = createCodexAppServerAdapterV01({
    launch: {
      command: process.execPath,
      prefix_args: [
        path.join(
          process.cwd(),
          "scripts",
          "fixtures",
          "fake-codex-app-server.mjs",
        ),
      ],
      environment: {
        NODE_ENV: "test",
        HOME: userHome,
        TMPDIR: runtimeRoot,
        PATH: process.env.PATH,
        FAKE_CODEX_SCENARIO: "success",
        FAKE_CODEX_TRACE_PATH: tracePath,
        FAKE_CODEX_CLEANUP_MARKER_PATH: cleanupPath,
        FAKE_CODEX_NETWORK_COUNT_PATH: networkPath,
      },
    },
  });
  const invocation = adapter.invoke(request, {
    cancellation_signal: new AbortController().signal,
    timeout_ms: 10_000,
    stop_settle_timeout_ms: 3_000,
    lifecycle_sink: {
      async report_event(event) {
        lifecycle.push(event);
      },
      async request_approval() {
        throw new Error("sandbox_projection_unexpected_approval");
      },
    },
    resume_binding: null,
  });
  const result = await invocation.result;
  await invocation.settled;
  assert.equal(result.outcome, "completed");
  assert.equal(
    lifecycle.some((event) => event.event_kind === "turn_started"),
    true,
  );
  const trace = readFileSync(tracePath, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as {
      kind: string;
      value: Record<string, unknown>;
    });
  const threadStart = trace.find(
    (entry) =>
      entry.kind === "received" && entry.value.method === "thread/start",
  );
  const turnStart = trace.find(
    (entry) =>
      entry.kind === "received" && entry.value.method === "turn/start",
  );
  assert(threadStart);
  assert(turnStart);
  assert.equal(threadStart.value.sandbox, "read-only");
  assert.deepEqual(turnStart.value.sandbox_policy, {
    type: "readOnly",
    networkAccess: false,
  });
  assert.equal(JSON.stringify(threadStart).includes("danger-full-access"), false);
  assert.equal(JSON.stringify(turnStart).includes("dangerFullAccess"), false);
  assert.equal(readFileSync(networkPath, "utf8"), "0\n");
  assert.equal(readFileSync(cleanupPath, "utf8"), "settled\n");
  console.log("codex app-server sandbox projection: passed");
  } finally {
    rmSync(testRoot, { recursive: true, force: true });
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

function requestV01(root: string): NativeHostRequestV01 {
  const packet = buildTaskContextPacketV01(
    structuredClone(genericCliBuilderInputFixture),
  );
  const canonicalRoot = realpathSync(root);
  const stat = statSync(canonicalRoot, { bigint: true });
  const fingerprint = createProtocolSha256V01(`sandbox-root:${canonicalRoot}`);
  return {
    request_version: "native_host_request.v0.1",
    request_id: "host-request:codex-sandbox-projection",
    run_id: "host-run:codex-sandbox-projection",
    idempotency_key: createProtocolSha256V01("codex-sandbox-projection"),
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    work_ref: refV01("work", "work:codex-sandbox-projection"),
    task_ref: refV01("task", "task:codex-sandbox-projection"),
    task_context_packet_ref: refV01("task_context_packet", packet.packet_id),
    packet,
    packet_lineage: {
      source_transition_receipt_ref: refV01(
        "state_transition_receipt",
        "transition:codex-sandbox-projection",
      ),
      packet_source_refs: [],
      selected_context_refs: [],
    },
    mode: "interactive",
    root_scope: {
      canonical_root: canonicalRoot,
      path_flavor: "posix",
      root_kind: "plain_folder",
      root_fingerprint: fingerprint,
      physical_root_identity: {
        identity_version: "native_host_physical_root_identity.v0.1",
        canonical_realpath_fingerprint: fingerprint,
        device: String(stat.dev),
        inode: String(stat.ino),
      },
      root_scope_ref: refV01("project_root_scope", "sandbox-projection-root"),
      repository_ref: null,
      selected_worktree_ref: null,
    },
    requested_capability: "project_scoped_structured_task_round_trip.v0.1",
    allowed_operation_categories: [
      "read_validated_task_context",
      "return_bounded_structured_result",
    ],
    forbidden_operation_categories: [
      "filesystem_outside_selected_project_root",
      "external_state_mutation",
    ],
    packet_capability_grant: null,
    execution_grant_ref: null,
    automation_context: null,
    repository_delegation_context: null,
    policy: {
      filesystem: "selected_project_root_only",
      network: "exact_grant_only",
      commands: "approval_required",
      model: "native_host_managed",
      host_egress: "explicit_interactive_start",
      max_changed_files: 8,
      max_artifacts: 8,
      max_commands: 8,
      max_checks: 16,
      timeout_ms: 10_000,
      stop_settle_timeout_ms: 3_000,
      stop_conditions: ["timeout", "cancellation_requested"],
    },
    result_return: {
      return_version: "native_host_result_return.v0.1",
      structured_result_required: true,
      legacy_result_text_allowed: false,
      raw_output_allowed: false,
      max_result_bytes: 128 * 1024,
    },
  };
}

function refV01(refType: string, externalId: string): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: "2026-09-03T00:00:00.000Z",
    trust_class: "direct_local_observation",
  };
}
