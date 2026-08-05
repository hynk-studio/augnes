import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import Database from "better-sqlite3";

import {
  DELEGATED_WORK_SOURCE_EVENT_LIMIT_V01,
  autonomyRunnerLedgerSchemaSqlV01,
  readLatestManagedLiveDelegatedWorkLedgerSliceV01,
  readLatestManagedLiveAutonomyRunSummaryV01,
} from "../lib/autonomy/runner-ledger";
import {
  buildDefaultRunnerAuthorityBoundary,
  buildDefaultRunnerBudgetSnapshot,
  buildDefaultRunnerSourceRefs,
} from "../lib/autonomy/runner-state";
import {
  buildDelegatedWorkProjectionV01,
  buildUnavailableDelegatedWorkProjectionV01,
} from "../lib/vnext/delegated-work/delegated-work-projection";
import type {
  AutonomyRunEventRecord,
  AutonomyRunRecord,
  AutonomyRunnerEventType,
  AutonomyRunnerStatus,
} from "../types/autonomy-runner-execution";
import type { LiveNativeHostRunProjectionV01 } from "../lib/vnext/runtime/live-native-host-run-service";
import { REPOSITORY_RUN_RESUME_ELIGIBILITY_AUTHORITY_V01 } from "../types/vnext/repository-run-resume";
import {
  delegatedProjectionUnavailableV01,
  delegatedWorkSuccessProjectionV01,
  shouldPollDelegatedWorkV01,
} from "../components/delegated-work/use-delegated-codex-work-v0-1";

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
  resumeEligibility: Parameters<typeof buildDelegatedWorkProjectionV01>[0]["resume_eligibility"] = null,
) {
  return buildDelegatedWorkProjectionV01({
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    run: status ? run(status, events, metadata) : null,
    events,
    source_omitted_event_count: 0,
    live_run: liveProjection,
    current_goal: "Ship the exact bounded delegated-work projection",
    start_eligible: status == null,
    start_blocker: null,
    resume_eligibility: resumeEligibility,
  });
}

const noRun = projection(null, [], live("idle"));
assert.equal(noRun.stage, "not_started");
assert.equal(noRun.next_action.kind, "start_codex_work");
assert.equal(noRun.timeline.length, 0);

const unavailableAfterAction =
  buildUnavailableDelegatedWorkProjectionV01({
    workspace_id: WORKSPACE_ID,
    project_id: PROJECT_ID,
    live_run: live("running"),
    context: "accepted_action",
  });
assert.equal(unavailableAfterAction.source_status, "unavailable");
assert.equal(unavailableAfterAction.stage, "unavailable");
assert.equal(unavailableAfterAction.timeline.length, 0);
assert.equal(unavailableAfterAction.start_eligible, false);
assert.equal(unavailableAfterAction.can_cancel, false);
assert.equal(unavailableAfterAction.next_action.kind, "none");
assert.equal(unavailableAfterAction.control_revision, 3);
assert.match(
  unavailableAfterAction.current.situation,
  /operational action was accepted.*could not be refreshed/iu,
);
assert.deepEqual(
  Object.values(unavailableAfterAction.authority),
  Array(13).fill(false),
);
const unavailableActionResponse =
  delegatedWorkSuccessProjectionV01(
    {
      delegated_work: unavailableAfterAction,
      delegated_work_projection_status: "unavailable",
      delegated_work_error_code:
        "delegated_work_projection_unavailable",
    },
    "accepted_action",
  );
assert(unavailableActionResponse);
assert.equal(unavailableActionResponse.status, "unavailable");
assert.equal(
  unavailableActionResponse.error,
  "delegated_work_progress_refresh_unavailable",
);
assert.equal(
  shouldPollDelegatedWorkV01(unavailableActionResponse.projection),
  false,
);

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
assert.equal(
  delegatedProjectionUnavailableV01({
    delegated_work_projection_status: "unavailable",
    delegated_work_error_code: "delegated_work_projection_unavailable",
  }),
  true,
);
assert.equal(
  delegatedProjectionUnavailableV01({
    delegated_work_projection_status: "available",
    delegated_work_error_code: null,
  }),
  false,
);

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

const repositoryInterrupted = projection(
  "paused",
  [...workingEvents, event(7, "run_reconciliation_required", "paused")],
  live("paused", {
    mode: "repository_attachment",
    reconciliation_required: false,
    public_reason: "repository_checkpoint_available",
  }),
  { invocation_origin: "repository_attachment" },
  {
    projection_version: "repository_run_resume_eligibility.v0.1",
    generated_at: NOW,
    status: "resume_ready",
    summary: "One exact safe checkpoint is available for later explicit resume.",
    run_state: "paused_or_disconnected",
    last_confirmed_operation: {
      operation_class: "file_change",
      certainty: "completed",
      summary: "The last file change reached a durably confirmed completed boundary.",
      observed_at: NOW,
    },
    pending_approval: null,
    next_action: {
      kind: "explicit_resume_not_yet_available",
      label: "Review safe checkpoint",
      reason: "CDX2B4A is read-only; explicit same-run resume is not implemented.",
      executes: false,
    },
    gaps: [],
    authority: REPOSITORY_RUN_RESUME_ELIGIBILITY_AUTHORITY_V01,
  },
);
assert.equal(repositoryInterrupted.mode, "repository_attachment");
assert.equal(repositoryInterrupted.resume_eligibility?.status, "resume_ready");
assert.equal(repositoryInterrupted.next_action.kind, "review_resume_status");
assert.notEqual(repositoryInterrupted.next_action.kind, "resume_codex_work");

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

const largeHistoryResult = assertFixedBoundLedgerSourceV01();

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
    large_history: largeHistoryResult,
    authority_false: true,
  }),
);

function assertFixedBoundLedgerSourceV01() {
  const db = new Database(":memory:");
  try {
    db.exec(autonomyRunnerLedgerSchemaSqlV01);
    const runId = "autonomy-run:delegated-work-large-history";
    const projectId = "project:delegated-work-large-history";
    const workspaceId = "workspace:delegated-work-large-history";
    const startedAt = "2026-07-23T01:00:00.000Z";
    const eventRows: AutonomyRunEventRecord[] = [];
    const append = (
      eventType: AutonomyRunnerEventType,
      status: AutonomyRunnerStatus,
      payload: Record<string, unknown> = {},
    ) => {
      const index = eventRows.length;
      eventRows.push({
        event_id: `${runId}.event.${String(index).padStart(6, "0")}`,
        run_id: runId,
        step_id: null,
        event_type: eventType,
        status,
        message: "Bounded delegated-work source fixture event.",
        payload,
        created_at: new Date(
          Date.parse(startedAt) + index,
        ).toISOString(),
      });
    };

    append("run_created", "queued");
    append("host_event_observed", "running", {
      event_kind: "turn_started",
    });
    append("host_event_observed", "running", {
      event_kind: "turn_started",
    });
    for (let index = 0; index < 10_000; index += 1) {
      append("host_event_observed", "running", {
        event_kind: "work_checkpoint",
        checkpoint: {
          kind:
            index % 2 === 0 ? "command_execution" : "file_change",
          phase: index % 3 === 0 ? "started" : "completed",
          status: index % 3 === 0 ? "active" : "completed",
          change_count: index % 2 === 0 ? null : index % 8,
        },
      });
    }
    append("approval_requested", "waiting_for_approval");
    append("approval_decided", "running", {
      decision: "approve_once",
    });
    append("run_reconciliation_required", "paused");
    append("run_resumed", "starting");
    append("run_cancelling", "cancelling");
    append("run_cancelled", "cancelled");

    const summary = run("cancelled", [], {
      workspace_id: workspaceId,
      project_id: projectId,
      lifecycle_mode: "managed_live",
      control_revision: 9,
    });
    db.prepare(
      `INSERT INTO autonomy_runs (
        run_id, scope, autonomy_contract_ref, title, status,
        scheduled_for, started_at, finished_at, created_at, updated_at,
        stop_reason, source_refs_json, authority_boundary_json,
        budget_snapshot_json, metadata_json
      ) VALUES (
        @run_id, @scope, @autonomy_contract_ref, @title, @status,
        @scheduled_for, @started_at, @finished_at, @created_at, @updated_at,
        @stop_reason, @source_refs_json, @authority_boundary_json,
        @budget_snapshot_json, @metadata_json
      )`,
    ).run({
      run_id: runId,
      scope: projectId,
      autonomy_contract_ref: summary.autonomy_contract_ref,
      title: summary.title,
      status: "cancelled",
      scheduled_for: null,
      started_at: startedAt,
      finished_at: eventRows.at(-1)!.created_at,
      created_at: startedAt,
      updated_at: eventRows.at(-1)!.created_at,
      stop_reason: "cancelled",
      source_refs_json: JSON.stringify(summary.source_refs),
      authority_boundary_json: JSON.stringify(summary.authority_boundary),
      budget_snapshot_json: JSON.stringify(summary.budget_snapshot),
      metadata_json: JSON.stringify(summary.metadata),
    });
    const insertEvent = db.prepare(
      `INSERT INTO autonomy_run_events (
        event_id, run_id, step_id, event_type, status, message,
        payload_json, created_at
      ) VALUES (
        @event_id, @run_id, @step_id, @event_type, @status, @message,
        @payload_json, @created_at
      )`,
    );
    db.transaction((rows: AutonomyRunEventRecord[]) => {
      for (const row of rows) {
        insertEvent.run({
          ...row,
          payload_json: JSON.stringify(row.payload),
        });
      }
    })(eventRows);

    db.prepare(
      `INSERT INTO autonomy_run_steps (
        step_id, run_id, step_index, action_kind, status, title, summary,
        started_at, finished_at, output_json, error_message, created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      `${runId}.step.unread`,
      runId,
      0,
      "custom",
      "completed",
      "Unread step",
      "The delegated source must not load this row.",
      startedAt,
      startedAt,
      "{",
      null,
      startedAt,
      startedAt,
    );
    db.prepare(
      `INSERT INTO autonomy_run_delta_batches (
        batch_id, run_id, batch_version, status, title, summary, created_at,
        delta_count, deltas_json, source_refs_json, validation_json,
        authority_boundary_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      `${runId}.delta.unread`,
      runId,
      "autonomy_runner_delta_batch.v0.1",
      "completed",
      "Unread delta",
      "The delegated source must not load this row.",
      startedAt,
      1,
      "{",
      "{",
      "{",
      "{",
    );

    const changesBeforeRead = (
      db.prepare("SELECT total_changes() AS count").get() as {
        count: number;
      }
    ).count;
    const lightweight = readLatestManagedLiveAutonomyRunSummaryV01(
      {
        workspace_id: workspaceId,
        project_id: projectId,
      },
      db,
    );
    assert(lightweight);
    assert.equal("steps" in lightweight, false);
    assert.equal("events" in lightweight, false);
    assert.equal("delta_batches" in lightweight, false);
    const readSlice = () =>
      readLatestManagedLiveDelegatedWorkLedgerSliceV01(
        {
          workspace_id: workspaceId,
          project_id: projectId,
        },
        db,
      );
    const first = readSlice();
    assert.equal(first.total_event_count, eventRows.length);
    assert(first.loaded_event_count <= DELEGATED_WORK_SOURCE_EVENT_LIMIT_V01);
    assert.equal(first.loaded_event_count, first.events.length);
    assert.equal(
      first.source_omitted_event_count,
      eventRows.length - first.events.length,
    );
    assert.equal("steps" in first, false);
    assert.equal("delta_batches" in first, false);
    assert.equal(
      first.events.filter(
        (entry) =>
          entry.event_type === "host_event_observed" &&
          entry.payload.event_kind === "turn_started",
      ).length,
      1,
    );
    assert.equal(first.events[0]?.event_type, "run_created");
    for (const required of [
      "approval_requested",
      "approval_decided",
      "run_reconciliation_required",
      "run_resumed",
      "run_cancelling",
      "run_cancelled",
    ]) {
      assert(
        first.events.some((entry) => entry.event_type === required),
        required,
      );
    }
    const checkpointRows = first.events.filter(
      (entry) =>
        entry.event_type === "host_event_observed" &&
        entry.payload.event_kind === "work_checkpoint",
    );
    assert(checkpointRows.length <= 6);
    assert.equal(
      checkpointRows.at(-1)?.event_id,
      eventRows
        .filter(
          (entry) =>
            entry.event_type === "host_event_observed" &&
            entry.payload.event_kind === "work_checkpoint",
        )
        .at(-1)?.event_id,
    );
    assert.deepEqual(
      first.events.map((entry) => entry.event_id),
      [...first.events]
        .sort(
          (left, right) =>
            left.created_at.localeCompare(right.created_at) ||
            left.event_id.localeCompare(right.event_id),
        )
        .map((entry) => entry.event_id),
    );

    const repeated = [readSlice(), readSlice()];
    for (const value of repeated) {
      assert.equal(value.total_event_count, first.total_event_count);
      assert.equal(value.loaded_event_count, first.loaded_event_count);
      assert.equal(
        value.source_omitted_event_count,
        first.source_omitted_event_count,
      );
      assert.deepEqual(
        value.events.map((entry) => entry.event_id),
        first.events.map((entry) => entry.event_id),
      );
    }
    assert.equal(
      (
        db.prepare("SELECT total_changes() AS count").get() as {
          count: number;
        }
      ).count,
      changesBeforeRead,
    );
    assert.equal(db.inTransaction, false);

    const projected = buildDelegatedWorkProjectionV01({
      workspace_id: workspaceId,
      project_id: projectId,
      run: first.run,
      events: first.events,
      source_omitted_event_count: first.source_omitted_event_count,
      live_run: {
        ...live("cancelled"),
        run_ref: runId,
        control_revision: 9,
      },
      current_goal: "Prove fixed-bound delegated history",
      start_eligible: false,
      start_blocker: null,
    });
    assert(projected.timeline.length <= 12);
    assert(
      projected.timeline.filter((item) =>
        ["checkpoint_started", "checkpoint_completed"].includes(item.kind),
      ).length <= 6,
    );
    assert(projected.timeline.some((item) => item.kind === "delegated"));
    assert(projected.timeline.some((item) => item.kind === "cancelled"));
    assert(projected.current.latest_checkpoint);
    assert(projected.compacted_item_count >= first.source_omitted_event_count);
    assert(
      projected.gap_notes.includes("Earlier progress was compacted."),
    );

    const ledgerSource = readFileSync(
      new URL("../lib/autonomy/runner-ledger.ts", import.meta.url),
      "utf8",
    );
    const sourceStart = ledgerSource.indexOf(
      "export function readLatestManagedLiveDelegatedWorkLedgerSliceV01",
    );
    const sourceEnd = ledgerSource.indexOf(
      "\nexport function ",
      sourceStart + 1,
    );
    const boundedReaderSource = ledgerSource.slice(
      sourceStart,
      sourceEnd < 0 ? undefined : sourceEnd,
    );
    assert(sourceStart >= 0);
    assert.equal(boundedReaderSource.includes("listEventRecords("), false);
    assert.equal(boundedReaderSource.includes("ensureAutonomy"), false);
    assert.equal(boundedReaderSource.includes("BEGIN"), false);
    assert.equal(boundedReaderSource.includes("UPDATE "), false);
    assert.equal(boundedReaderSource.includes("INSERT "), false);
    assert.match(
      boundedReaderSource,
      /LIMIT \$\{DELEGATED_WORK_SOURCE_EVENT_LIMIT_V01\}/u,
    );
    const summaryStart = ledgerSource.indexOf(
      "export function readLatestManagedLiveAutonomyRunSummaryV01",
    );
    const summaryEnd = ledgerSource.indexOf(
      "\nexport function ",
      summaryStart + 1,
    );
    const summaryReaderSource = ledgerSource.slice(
      summaryStart,
      summaryEnd,
    );
    assert(summaryStart >= 0);
    assert.equal(summaryReaderSource.includes("listEventRecords("), false);
    assert.equal(summaryReaderSource.includes("listStepRecords("), false);
    assert.equal(summaryReaderSource.includes("listDeltaBatchRecords("), false);

    return {
      total_event_count: first.total_event_count,
      loaded_event_count: first.loaded_event_count,
      source_omitted_event_count: first.source_omitted_event_count,
      source_event_limit: first.event_row_limit,
      timeline_items: projected.timeline.length,
      checkpoint_items: projected.timeline.filter((item) =>
        ["checkpoint_started", "checkpoint_completed"].includes(item.kind),
      ).length,
      steps_loaded: 0,
      delta_batches_loaded: 0,
    };
  } finally {
    db.close();
  }
}
