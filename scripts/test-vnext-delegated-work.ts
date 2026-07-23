import assert from "node:assert/strict";

import {
  buildDefaultRunnerAuthorityBoundary,
  buildDefaultRunnerBudgetSnapshot,
  buildDefaultRunnerSourceRefs,
} from "../lib/autonomy/runner-state";
import { buildDelegatedWorkProjectionV01 } from "../lib/vnext/delegated-work/delegated-work-projection";
import type {
  AutonomyRunEventRecord,
  AutonomyRunRecord,
  AutonomyRunnerEventType,
  AutonomyRunnerStatus,
} from "../types/autonomy-runner-execution";
import type { LiveNativeHostRunProjectionV01 } from "../lib/vnext/runtime/live-native-host-run-service";
import { shouldPollDelegatedWorkV01 } from "../components/delegated-work/use-delegated-codex-work-v0-1";

const WORKSPACE_ID = "workspace:delegated-work";
const PROJECT_ID = "project:delegated-work";
const RUN_ID = "autonomy-run:delegated-work";
const NOW = "2026-07-23T00:00:00.000Z";

function event(
  index: number,
  eventType: AutonomyRunnerEventType,
  status: AutonomyRunnerStatus,
  payload: Record<string, unknown> = {},
  occurredAt = new Date(Date.parse(NOW) + index * 1_000).toISOString(),
): AutonomyRunEventRecord {
  return {
    event_id: `${RUN_ID}.event.${String(index).padStart(3, "0")}`,
    run_id: RUN_ID,
    step_id: null,
    event_type: eventType,
    status,
    message: "Exact persisted test event.",
    payload,
    created_at: occurredAt,
  };
}

function run(
  status: AutonomyRunnerStatus,
  events: AutonomyRunEventRecord[],
  metadata: Record<string, unknown> = {},
): AutonomyRunRecord {
  return {
    run_id: RUN_ID,
    scope: PROJECT_ID,
    autonomy_contract_ref: "direct_native_host_round_trip.v0.1",
    title: "Exact current delegated work",
    status,
    scheduled_for: null,
    started_at: NOW,
    finished_at:
      ["completed", "blocked", "failed", "cancelled", "timed_out"].includes(
        status,
      )
        ? new Date(Date.parse(NOW) + 60_000).toISOString()
        : null,
    created_at: NOW,
    updated_at: events.at(-1)?.created_at ?? NOW,
    stop_reason: null,
    source_refs: buildDefaultRunnerSourceRefs(),
    authority_boundary: buildDefaultRunnerAuthorityBoundary(),
    budget_snapshot: buildDefaultRunnerBudgetSnapshot(),
    metadata: {
      workspace_id: WORKSPACE_ID,
      project_id: PROJECT_ID,
      lifecycle_mode: "managed_live",
      terminal_receipt_persisted: false,
      control_revision: 3,
      ...metadata,
    },
    steps: [],
    events,
    delta_batches: [],
  };
}

function live(
  status: LiveNativeHostRunProjectionV01["status"],
  overrides: Partial<LiveNativeHostRunProjectionV01> = {},
): LiveNativeHostRunProjectionV01 {
  return {
    service_version: "live_native_host_run_service.v0.1",
    status,
    run_ref: status === "idle" ? null : RUN_ID,
    mode: status === "idle" ? null : "interactive",
    control_revision: 3,
    reconciliation_required: status === "paused",
    public_reason: null,
    capability: {
      status: status === "idle" ? "not_checked" : "available",
      adapter_version: "codex_app_server_adapter.v0.1",
      capability_version: "codex_app_server_capability.v0.1",
      cli_version: "1.0.0",
      public_reason: null,
    },
    pending_approval: null,
    receipt: null,
    packet_copy_actions: 0,
    handoff_paste_actions: 0,
    result_paste_actions: 0,
    internal_id_entry_actions: 0,
    semantic_authority_granted: false,
    ...overrides,
  };
}

function projection(
  status: AutonomyRunnerStatus | null,
  events: AutonomyRunEventRecord[],
  liveProjection: LiveNativeHostRunProjectionV01,
  metadata: Record<string, unknown> = {},
) {
  return buildDelegatedWorkProjectionV01({
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    run: status ? run(status, events, metadata) : null,
    live_run: liveProjection,
    current_goal: "Ship the exact bounded delegated-work projection",
    start_eligible: status == null,
    start_blocker: null,
  });
}

const noRun = projection(null, [], live("idle"));
assert.equal(noRun.stage, "not_started");
assert.equal(noRun.next_action.kind, "start_codex_work");
assert.equal(noRun.timeline.length, 0);

const queued = projection(
  "queued",
  [event(0, "run_created", "queued"), event(1, "run_queued", "queued")],
  live("queued"),
);
assert.equal(queued.stage, "preparing");
assert.equal(queued.timeline.filter((item) => item.kind === "delegated").length, 1);
assert.equal(shouldPollDelegatedWorkV01(queued), true);

const workingEvents = [
  event(0, "run_created", "queued"),
  event(1, "run_starting", "starting"),
  event(2, "host_event_observed", "running", {
    event_kind: "turn_started",
  }),
  event(3, "host_event_observed", "running", {
    event_kind: "turn_started",
  }),
  event(4, "host_event_observed", "running", {
    event_kind: "work_checkpoint",
    checkpoint: {
      kind: "command_execution",
      phase: "started",
      status: "active",
      change_count: null,
    },
  }),
  event(5, "host_event_observed", "running", {
    event_kind: "work_checkpoint",
    checkpoint: {
      kind: "command_execution",
      phase: "completed",
      status: "failed",
      change_count: null,
    },
  }),
  event(6, "host_event_observed", "running", {
    event_kind: "work_checkpoint",
    checkpoint: {
      kind: "file_change",
      phase: "completed",
      status: "completed",
      change_count: 2,
    },
  }),
];
const working = projection("running", workingEvents, live("running"));
assert.equal(working.stage, "working");
assert.equal(
  working.timeline.filter((item) => item.kind === "codex_started").length,
  1,
);
assert.match(working.current.latest_checkpoint ?? "", /project files/i);
assert.equal(
  working.timeline.find(
    (item) =>
      item.kind === "checkpoint_completed" &&
      item.title.includes("command"),
  )?.tone,
  "danger",
);
assert.equal(shouldPollDelegatedWorkV01(working), true);

const approval = {
  approval_ref: "native-host-approval:bounded",
  operation_class: "command_execution" as const,
  resource_summary: "Command scoped to the selected project root.",
  public_reason: "A project check needs approval.",
  public_risk_summary: "The command may change local files.",
  command_summary: "bounded project check",
  repository_relative_paths: [],
  network_resources: [],
  available_decisions: ["approve_once", "decline"] as const,
  expires_at: null,
  control_revision: 3,
  decision_submitted: false,
};
const waiting = projection(
  "waiting_for_approval",
  [...workingEvents, event(7, "approval_requested", "waiting_for_approval")],
  live("waiting_for_approval", {
    pending_approval: {
      ...approval,
      available_decisions: [...approval.available_decisions],
    },
  }),
);
assert.equal(waiting.stage, "waiting_for_approval");
assert.equal(waiting.next_action.kind, "review_requested_access");
assert.equal(waiting.current.needs_user, true);
assert.equal(shouldPollDelegatedWorkV01(waiting), false);

const submitted = {
  ...waiting,
  pending_approval: {
    ...waiting.pending_approval!,
    decision_submitted: true,
  },
};
assert.equal(shouldPollDelegatedWorkV01(submitted), true);

for (const [decision, expectedKind] of [
  ["approve_once", "approval_approved"],
  ["decline", "approval_declined"],
] as const) {
  const decided = projection(
    "waiting_for_approval",
    [
      ...workingEvents,
      event(7, "approval_requested", "waiting_for_approval"),
      event(8, "approval_decided", "waiting_for_approval", { decision }),
    ],
    live("waiting_for_approval", {
      pending_approval: {
        ...approval,
        available_decisions: [...approval.available_decisions],
        decision_submitted: true,
      },
    }),
  );
  assert.ok(decided.timeline.some((item) => item.kind === expectedKind));
}

const cancelling = projection(
  "cancelling",
  [...workingEvents, event(7, "run_cancelling", "cancelling")],
  live("cancelling"),
);
assert.equal(cancelling.stage, "cancelling");
assert.equal(shouldPollDelegatedWorkV01(cancelling), true);

const interrupted = projection(
  "paused",
  [...workingEvents, event(7, "run_reconciliation_required", "paused")],
  live("paused", {
    reconciliation_required: true,
    public_reason: "live_host_controller_disconnected",
  }),
);
assert.equal(interrupted.stage, "resume_required");
assert.equal(interrupted.next_action.kind, "resume_codex_work");
assert.equal(shouldPollDelegatedWorkV01(interrupted), false);

const resumed = projection(
  "running",
  [
    ...workingEvents,
    event(7, "run_reconciliation_required", "paused"),
    event(8, "run_resumed", "starting"),
  ],
  live("running"),
);
assert.ok(resumed.timeline.some((item) => item.kind === "resumed"));

const trusted = projection(
  "completed",
  [...workingEvents, event(7, "run_completed", "completed")],
  live("completed", {
    receipt: {
      receipt_ref: "run-receipt:trusted",
      receipt_fingerprint: `sha256:${"a".repeat(64)}`,
      outcome: "completed",
    },
  }),
  {
    terminal_receipt_persisted: true,
    run_receipt_id: "run-receipt:trusted",
  },
);
assert.equal(trusted.stage, "result_ready");
assert.equal(trusted.current.trusted_result_available, true);
assert.equal(trusted.next_action.kind, "review_result");
assert.ok(trusted.timeline.some((item) => item.kind === "result_saved"));

const untrustedTerminal = projection(
  "completed",
  [...workingEvents, event(7, "run_completed", "completed")],
  live("completed"),
);
assert.equal(untrustedTerminal.stage, "blocked");
assert.equal(untrustedTerminal.current.trusted_result_available, false);
assert.equal(untrustedTerminal.result, null);
assert.ok(
  untrustedTerminal.gap_notes.some((note) =>
    note.includes("without a trusted saved result"),
  ),
);

for (const [runnerStatus, liveStatus, expectedStage] of [
  ["blocked", "blocked", "blocked"],
  ["failed", "failed", "failed"],
  ["cancelled", "cancelled", "cancelled"],
  ["timed_out", "timed_out", "timed_out"],
] as const) {
  const value = projection(
    runnerStatus,
    [
      event(0, "run_created", "queued"),
      event(
        1,
        runnerStatus === "blocked"
          ? "run_blocked"
          : runnerStatus === "failed"
            ? "run_failed"
            : runnerStatus === "cancelled"
              ? "run_cancelled"
              : "run_timed_out",
        runnerStatus,
      ),
    ],
    live(liveStatus),
  );
  assert.equal(value.stage, expectedStage);
  assert.equal(value.current.trusted_result_available, false);
}

const largeHistory = [
  event(0, "run_created", "queued"),
  ...Array.from({ length: 20 }, (_, index) =>
    event(index + 1, "host_event_observed", "running", {
      event_kind: "work_checkpoint",
      checkpoint: {
        kind: index % 2 === 0 ? "command_execution" : "file_change",
        phase: index % 3 === 0 ? "started" : "completed",
        status: index % 3 === 0 ? "active" : "completed",
        change_count: index % 2 === 0 ? null : index,
      },
    }),
  ),
  event(30, "run_reconciliation_required", "paused"),
];
const compacted = projection(
  "paused",
  largeHistory,
  live("paused", { reconciliation_required: true }),
);
assert.ok(compacted.timeline.length <= 12);
assert.ok(
  compacted.timeline.filter((item) =>
    ["checkpoint_started", "checkpoint_completed"].includes(item.kind),
  ).length <= 6,
);
assert.ok(compacted.timeline.some((item) => item.kind === "delegated"));
assert.ok(
  compacted.timeline.some((item) => item.kind === "connection_interrupted"),
);
assert.ok(compacted.compacted_item_count > 0);

const sameTime = "2026-07-23T00:10:00.000Z";
const tieOrdered = projection(
  "running",
  [
    event(2, "host_event_observed", "running", { event_kind: "turn_started" }, sameTime),
    event(1, "run_starting", "starting", {}, sameTime),
  ],
  live("running"),
);
assert.deepEqual(
  tieOrdered.timeline.map((item) => item.source_event_ref),
  [`${RUN_ID}.event.001`, `${RUN_ID}.event.002`],
);

assert.deepEqual(Object.values(working.authority), Array(13).fill(false));
const serialized = JSON.stringify(working);
for (const forbidden of [
  "/Users/hynk",
  "OPENAI_API_KEY",
  "raw command output",
  "secret-value",
  "host-thread-id",
]) {
  assert.equal(serialized.includes(forbidden), false);
}
assert.ok(Buffer.byteLength(serialized, "utf8") < 48 * 1_024);

console.log(
  JSON.stringify({
    status: "ok",
    contract: "delegated_work_projection.v0.1",
    stages_tested: [
      "not_started",
      "preparing",
      "working",
      "waiting_for_approval",
      "cancelling",
      "resume_required",
      "result_ready",
      "blocked",
      "failed",
      "cancelled",
      "timed_out",
    ],
    timeline_bound: compacted.timeline.length,
    checkpoint_bound: compacted.timeline.filter((item) =>
      ["checkpoint_started", "checkpoint_completed"].includes(item.kind),
    ).length,
    authority_false: true,
  }),
);
