#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  OPERATOR_EXECUTION_EFFECT_SNAPSHOT_VERSION_V1,
  assertOperatorExecutionEffectDiffV1,
  buildOperatorExecutionPermittedEffectContractV1,
  diffOperatorExecutionEffectSnapshotsV1,
} from "./operator-execution-effect-ledger-v1.mjs";

const manifest = {
  profile: "multi_candidate",
  workspace_id: "workspace:test",
  operator_id: "operator:test",
  project_id: "project:primary",
  profile_project_id: "project:profile",
  automation_project_id: "project:automation",
  baseline_run_id: "run:baseline-review",
  baseline_run_contract: "direct_native_host_round_trip.v0.1",
  strategic_source_catalog_fingerprint: sha("strategic-source-catalog"),
  strategic_working_frame_fingerprint: sha("strategic-working-frame"),
  multi_candidate_fixture: {
    target_proposal_id: "proposal:target",
    blocked_proposal_id: "proposal:blocked",
    candidate_ids: ["candidate:applied", "candidate:pending"],
    exact_binding: {
      pending_proposal_id: "proposal:exact-pending",
      preferred_candidate_id: "candidate:exact-preferred",
    },
  },
};
const result = {
  packet_root_run_result_proposal_decision_transition_identity: {
    applied_candidate_id: "candidate:applied",
  },
};

const validMulti = multiCandidateSnapshots();
assert.doesNotThrow(() => validate(validMulti.before, validMulti.after, manifest, result));

const negativeCases = [
  [
    "delete and replace proposal at equal count",
    () => {
      const value = multiCandidateSnapshots();
      value.before.rows.push(coreRow("episode_delta_proposal", "proposal:old"));
      value.after.rows.push(coreRow("episode_delta_proposal", "proposal:new"));
      return value;
    },
  ],
  [
    "change payload fingerprint without count change",
    () => {
      const value = multiCandidateSnapshots();
      const prior = coreRow("task_context_packet", "packet:existing");
      value.before.rows.push(prior);
      value.after.rows.push({ ...prior, row_fingerprint: sha("changed-row") });
      return value;
    },
  ],
  [
    "insert expected kind into wrong project",
    () => mutateAfter(multiCandidateSnapshots(), (rows) => {
      rows.find((entry) => entry.identity.record_kind === "task_context_packet")
        .identity.project_id = "project:wrong";
    }),
  ],
  [
    "Transition targets wrong decision or candidate",
    () => mutateAfter(multiCandidateSnapshots(), (rows) => {
      const transition = rows.find(
        (entry) => entry.identity.record_kind === "state_transition_receipt",
      );
      transition.identity.semantic_bindings = {
        decision_id: "decision:wrong",
        gate_record_id: "gate:inserted",
        proposal_id: "proposal:target",
        candidate_id: "candidate:wrong",
      };
    }),
  ],
  [
    "unexpected active-project selection mutation",
    () => {
      const value = multiCandidateSnapshots();
      const before = activeSelectionRow("project:primary", 1);
      const after = activeSelectionRow("project:profile", 2);
      after.stable_key = before.stable_key;
      value.before.rows.push(before);
      value.after.rows.push(after);
      return value;
    },
  ],
  [
    "replace operator session at equal count",
    () => {
      const value = multiCandidateSnapshots();
      const before = sessionRow("session:stable");
      const after = { ...before, row_fingerprint: sha("session-replaced") };
      value.before.rows.push(before);
      value.after.rows = value.after.rows.filter(
        (entry) => entry.table !== "vnext_local_operator_sessions",
      );
      value.after.rows.push(after);
      return value;
    },
  ],
  [
    "modify memory or Perspective row",
    () => {
      const value = multiCandidateSnapshots();
      value.after.rows.push(
        row({
          table: "perspective_memory_items",
          category: "memory_perspective",
          id: "memory:unexpected",
        }),
      );
      return value;
    },
  ],
  [
    "unexpected approval cancellation reconciliation seam",
    () => {
      const value = multiCandidateSnapshots();
      value.after.seams.push({
        key: "approval_trace_path",
        presence: "present",
        content_sha256: sha("unexpected-cancellation"),
        byte_count: 1,
        public_event_kinds: ["unexpected_cancellation"],
      });
      return value;
    },
  ],
  [
    "aggregate counts preserved while exact row hashes change",
    () => {
      const value = multiCandidateSnapshots();
      const decision = value.after.rows.find(
        (entry) => entry.identity.record_id === "decision:one",
      );
      value.before.rows.push(structuredClone(decision));
      decision.row_fingerprint = sha("same-count-different-hash");
      return value;
    },
  ],
];

for (const [label, owner] of negativeCases) {
  const candidate = owner();
  assert.throws(
    () => validate(candidate.before, candidate.after, manifest, result),
    undefined,
    label,
  );
}

const validNative = nativeSnapshots();
assert.doesNotThrow(() =>
  validate(
    validNative.before,
    validNative.after,
    { ...manifest, profile: "native_host_execution" },
    result,
  ),
);
const wrongEvent = nativeSnapshots();
wrongEvent.after.rows.find((entry) => entry.table === "autonomy_run_events")
  .identity.event_type = "run_event_replaced_at_equal_count";
assert.throws(
  () =>
    validate(
      wrongEvent.before,
      wrongEvent.after,
      { ...manifest, profile: "native_host_execution" },
      result,
    ),
  /operator_effect_native_event_type_counts_mismatch/u,
  "replace run event type at equal count",
);
const wrongRootBinding = nativeSnapshots();
wrongRootBinding.after.rows.find((entry) => entry.table === "autonomy_runs")
  .identity.metadata_bindings.root_fingerprint = sha("wrong-root-binding");
assert.throws(
  () =>
    validate(
      wrongRootBinding.before,
      wrongRootBinding.after,
      { ...manifest, profile: "native_host_execution" },
      result,
    ),
  /operator_effect_native_root_binding_mismatch/u,
  "bind run to the wrong project-root fingerprint",
);

const validReview = reviewSnapshots();
assert.doesNotThrow(() =>
  validate(
    validReview.before,
    validReview.after,
    { ...manifest, profile: "review_control" },
    result,
  ),
);
const redistributedControls = reviewSnapshots();
redistributedControls.after.rows = redistributedControls.after.rows.filter(
  (entry) => entry.table !== "vnext_project_automation_controls",
);
redistributedControls.after.rows.push(
  controlRow("project:primary", 1),
  controlRow("project:profile", 2),
);
assert.throws(
  () =>
    validate(
      redistributedControls.before,
      redistributedControls.after,
      { ...manifest, profile: "review_control" },
      result,
    ),
  undefined,
  "redistribute project-control revisions while preserving the sum",
);

process.stdout.write(
  `${JSON.stringify({
    test: "operator-execution-effect-ledger-v1",
    status: "pass",
    valid_profiles: 3,
    equal_count_and_scope_negatives: negativeCases.length + 3,
  })}\n`,
);

function validate(before, after, targetManifest, targetResult) {
  normalizeSnapshot(before);
  normalizeSnapshot(after);
  const contract = buildOperatorExecutionPermittedEffectContractV1(
    targetManifest.profile,
  );
  const diff = diffOperatorExecutionEffectSnapshotsV1(before, after);
  return assertOperatorExecutionEffectDiffV1({
    contract,
    manifest: targetManifest,
    result: targetResult,
    before,
    after,
    diff,
  });
}

function multiCandidateSnapshots() {
  const core = [
    coreRow("task_context_packet", "packet:later"),
    coreRow("review_decision", "decision:one", {
      "source_proposal.proposal_id": "proposal:target",
      "candidate.candidate_id": "candidate:applied",
    }),
    coreRow("review_decision", "decision:two", {
      "source_proposal.proposal_id": "proposal:target",
      "candidate.candidate_id": "candidate:pending",
    }),
    coreRow("review_decision", "decision:three", {
      "source_proposal.proposal_id": "proposal:blocked",
      "candidate.candidate_id": "candidate:applied",
    }),
    coreRow("review_decision", "decision:four", {
      "source_proposal.proposal_id": "proposal:exact-pending",
      "candidate.candidate_id": "candidate:exact-preferred",
    }),
    coreRow("semantic_commit_gate", "gate:inserted", {
      decision_id: "decision:one",
    }),
    coreRow("semantic_state", "semantic-state:inserted"),
    coreRow("state_transition_receipt", "transition:inserted", {
      decision_id: "decision:one",
      gate_record_id: "gate:inserted",
      proposal_id: "proposal:target",
      candidate_id: "candidate:applied",
    }),
  ];
  return snapshots(
    [],
    [...core, ...semanticStateRows(), sessionRow("session:one")],
  );
}

function nativeSnapshots() {
  const coreCounts = {
    automation_work_item: 4,
    capability_grant: 1,
    task_context_packet: 2,
    run_receipt: 4,
    episode_delta_proposal: 4,
    context_use_review: 1,
  };
  const core = Object.entries(coreCounts).flatMap(([kind, count]) =>
    Array.from({ length: count }, (_, index) =>
      coreRow(kind, `${kind}:${index}`),
    ),
  );
  const runs = [
    runRow("run:profile", "project:profile", "cancelled"),
    runRow("run:direct", "project:primary", "completed"),
    runRow("run:live", "project:primary", "completed"),
    runRow("run:automation", "project:automation", "needs_review"),
  ];
  const events = nativeEventRows();
  const roots = [
    rootBindingRow("project:primary"),
    rootBindingRow("project:profile"),
    rootBindingRow("project:automation"),
  ];
  const beforeSelection = activeSelectionRow("project:profile", 1);
  const afterSelection = activeSelectionRow("project:automation", 3);
  afterSelection.stable_key = beforeSelection.stable_key;
  const value = snapshots(
    [beforeSelection, ...roots],
    [
      afterSelection,
      ...roots,
      ...core,
      ...runs,
      ...runs.map((entry, index) =>
        runStepRow(`step:${index}`, entry.identity.run_id),
      ),
      ...events,
      sessionRow("session:one"),
      sessionRow("session:two", "project:profile"),
      sessionRow("session:three", "project:automation"),
    ],
  );
  const contract = buildOperatorExecutionPermittedEffectContractV1(
    "native_host_execution",
  );
  value.before.seams = [
    { key: "approval_trace_path", presence: "absent" },
    { key: "second_approval_release_path", presence: "absent" },
    { key: "terminal_release_path", presence: "absent" },
  ];
  value.after.seams = [
    {
      key: "approval_trace_path",
      presence: "present",
      public_event_kinds: contract.approval_trace_event_kinds,
      content_sha256: sha("approval-trace"),
    },
    {
      key: "second_approval_release_path",
      presence: "present",
      public_event_kinds: [],
      content_sha256:
        "sha256:fdc935e6a3f33abdcfb4f5d7a335d408b2b988e7a5f8411d9f73349d1fab39be",
    },
    {
      key: "terminal_release_path",
      presence: "present",
      public_event_kinds: [],
      content_sha256:
        "sha256:fdc935e6a3f33abdcfb4f5d7a335d408b2b988e7a5f8411d9f73349d1fab39be",
    },
  ];
  return value;
}

function nativeEventRows() {
  const definitions = [
    ["run:profile", [
      ["run_created", "queued"],
      ["run_queued", "queued"],
      ["run_starting", "starting"],
      ["step_started", "running"],
      ["approval_requested", "waiting_for_approval"],
      ["run_cancelling", "cancelling"],
      ...Array.from({ length: 2 }, () => ["host_event_observed", "cancelling"]),
      ["step_cancelled", "cancelled"],
      ["run_cancelled", "cancelled"],
    ]],
    ["run:direct", [
      ["run_created", "running"],
      ["run_started", "running"],
      ["step_started", "running"],
      ...Array.from({ length: 6 }, () => ["host_event_observed", "running"]),
      ["step_completed", "completed"],
      ["run_completed", "completed"],
    ]],
    ["run:live", [
      ["run_created", "queued"],
      ["run_queued", "queued"],
      ["run_starting", "starting"],
      ["step_started", "running"],
      ...Array.from({ length: 3 }, () => ["host_event_observed", "starting"]),
      ["approval_requested", "waiting_for_approval"],
      ["host_event_observed", "waiting_for_approval"],
      ["approval_decided", "waiting_for_approval"],
      ...Array.from({ length: 3 }, () => ["host_event_observed", "running"]),
      ["approval_requested", "waiting_for_approval"],
      ["host_event_observed", "waiting_for_approval"],
      ["approval_decided", "waiting_for_approval"],
      ["step_completed", "completed"],
      ["run_completed", "completed"],
    ]],
    ["run:automation", [
      ["run_created", "queued"],
      ["run_queued", "queued"],
      ["run_starting", "starting"],
      ["step_started", "running"],
      ...Array.from({ length: 3 }, () => ["host_event_observed", "starting"]),
      ...Array.from({ length: 3 }, () => ["host_event_observed", "running"]),
      ["step_completed", "completed"],
      ["run_completed", "completed"],
      ["run_needs_review", "needs_review"],
    ]],
  ];
  let sequence = 0;
  return definitions.flatMap(([runId, lifecycle]) =>
    lifecycle.map(([eventType, status]) => {
      sequence += 1;
      return eventRow(`event:${sequence}`, runId, eventType, status, sequence);
    }),
  );
}

function reviewSnapshots() {
  const core = [
    coreRow("task_context_packet", "packet:later"),
    coreRow("episode_delta_proposal", "proposal:one", {
      "source_assessment.assessment.run_id": "run:baseline-review",
    }),
    coreRow("episode_delta_proposal", "proposal:two"),
    coreRow("review_decision", "decision:one"),
    coreRow("review_decision", "decision:two"),
    coreRow("semantic_commit_gate", "gate:inserted", {
      decision_id: "decision:one",
    }),
    coreRow("semantic_state", "semantic-state:one"),
    coreRow("state_transition_receipt", "transition:inserted", {
      decision_id: "decision:one",
      gate_record_id: "gate:inserted",
      proposal_id: "proposal:one",
      candidate_id: "candidate:one",
    }),
  ];
  const beforeRun = runRow("run:baseline-review", "project:primary");
  const afterRun = structuredClone(beforeRun);
  afterRun.identity.metadata_hash = sha("review-metadata-after");
  afterRun.row_fingerprint = sha("review-run-after");
  const value = snapshots(
    [beforeRun],
    [
      afterRun,
      ...core,
      ...semanticStateRows(),
      controlRow("project:primary", 3),
      ...Array.from({ length: 3 }, (_, index) =>
        sessionRow(`session:primary:${index}`),
      ),
      ...Array.from({ length: 2 }, (_, index) =>
        sessionRow(`session:profile:${index}`, "project:profile"),
      ),
    ],
  );
  const strategicBindings = {
    fixture_version: "strategic_model_transport_fixture.v0.1",
    project_id: "project:primary",
    source_catalog_fingerprint: manifest.strategic_source_catalog_fingerprint,
    working_frame_fingerprint: manifest.strategic_working_frame_fingerprint,
    workspace_id: "workspace:test",
  };
  value.before.seams = [
    {
      key: "strategic_fixture_path",
      presence: "present",
      content_sha256: sha("strategic-fixture"),
      public_bindings: strategicBindings,
    },
    { key: "strategic_fixture_retired_path", presence: "absent" },
    { key: "strategic_counter_path", presence: "absent" },
  ];
  value.after.seams = [
    { key: "strategic_fixture_path", presence: "absent" },
    {
      key: "strategic_fixture_retired_path",
      presence: "present",
      content_sha256: sha("strategic-fixture"),
      public_bindings: strategicBindings,
    },
    {
      key: "strategic_counter_path",
      presence: "present",
      content_sha256: sha("strategic-counter"),
      transport_calls: 1,
      public_bindings: {
        source_catalog_fingerprint:
          manifest.strategic_source_catalog_fingerprint,
        transport_calls: 1,
        working_frame_fingerprint:
          manifest.strategic_working_frame_fingerprint,
      },
    },
  ];
  return value;
}

function snapshots(beforeRows, afterRows) {
  return {
    before: snapshot(beforeRows),
    after: snapshot(afterRows),
  };
}

function snapshot(rows) {
  return {
    snapshot_version: OPERATOR_EXECUTION_EFFECT_SNAPSHOT_VERSION_V1,
    snapshot_fingerprint: sha(`snapshot:${rows.length}:${Math.random()}`),
    rows,
    seams: [],
    row_count: rows.length,
    category_counts: {},
  };
}

function normalizeSnapshot(value) {
  value.rows.sort((left, right) => left.stable_key.localeCompare(right.stable_key));
  value.row_count = value.rows.length;
}

function mutateAfter(value, mutate) {
  mutate(value.after.rows);
  return value;
}

function coreRow(kind, id, semanticBindings = {}) {
  return row({
    table: "vnext_core_records",
    category: "durable_semantic_record",
    id,
    identity: {
      workspace_id: "workspace:test",
      project_id: "project:primary",
      record_kind: kind,
      record_id: id,
      fingerprint: sha(id),
      semantic_bindings: semanticBindings,
    },
  });
}

function sessionRow(id, projectId = "project:primary") {
  return row({
    table: "vnext_local_operator_sessions",
    category: "local_operator_state",
    id,
    identity: {
      workspace_id: "workspace:test",
      project_id: projectId,
      operator_id: "operator:test",
      session_id_hash: sha(id),
      bootstrap_token_hash: sha(`${id}:bootstrap`),
      session_token_hash: sha(`${id}:session`),
      action_nonce_hash: sha(`${id}:action`),
      expires_at: "2026-08-02T01:00:00.000Z",
      action_nonce_expires_at: "2026-08-02T00:10:00.000Z",
      session_status: "active_consumed",
    },
  });
}

function semanticStateRows() {
  return [
    row({
      table: "vnext_semantic_state_entries",
      category: "semantic_project_state",
      id: "semantic-state-entry:one",
      identity: {
        workspace_id: "workspace:test",
        project_id: "project:primary",
      },
    }),
    row({
      table: "vnext_semantic_target_heads",
      category: "semantic_project_state",
      id: "semantic-target-head:one",
      identity: {
        workspace_id: "workspace:test",
        project_id: "project:primary",
      },
    }),
  ];
}

function controlRow(projectId, revision) {
  return row({
    table: "vnext_project_automation_controls",
    category: "project_state",
    id: projectId,
    identity: {
      workspace_id: "workspace:test",
      project_id: projectId,
      revision,
    },
  });
}

function activeSelectionRow(projectId, revision) {
  const value = row({
    table: "vnext_active_project_selections",
    category: "project_state",
    id: "workspace:test",
    identity: {
      workspace_id: "workspace:test",
      project_id: projectId,
      selection_revision: revision,
    },
  });
  value.row_fingerprint = sha(`${projectId}:${revision}`);
  return value;
}

function runRow(runId, scope, status = "completed") {
  return row({
    table: "autonomy_runs",
    category: "run",
    id: runId,
    identity: {
      run_id: runId,
      scope,
      status,
      autonomy_contract_ref: "direct_native_host_round_trip.v0.1",
      metadata_hash: sha(`${runId}:metadata`),
      metadata_bindings: {
        root_fingerprint: sha(`${scope}:root-binding`),
      },
    },
  });
}

function rootBindingRow(projectId) {
  return row({
    table: "vnext_project_root_bindings",
    category: "project_state",
    id: projectId,
    identity: {
      workspace_id: "workspace:test",
      project_id: projectId,
      root_binding_fingerprint: sha(`${projectId}:root-binding`),
      normalized_root_hash: sha(`${projectId}:normalized-root`),
    },
  });
}

function eventRow(eventId, runId, eventType, status, sequence) {
  return row({
    table: "autonomy_run_events",
    category: "run_event",
    id: eventId,
    identity: {
      event_id: eventId,
      run_id: runId,
      event_type: eventType,
      status,
      created_at: `2026-08-02T00:00:${String(sequence).padStart(2, "0")}.000Z`,
      row_order: sequence,
    },
  });
}

function runStepRow(stepId, runId) {
  return row({
    table: "autonomy_run_steps",
    category: "run_auxiliary",
    id: stepId,
    identity: {
      step_id: stepId,
      run_id: runId,
      status: "completed",
    },
  });
}

function row({ table, category, id, identity = {} }) {
  return {
    table,
    category,
    stable_key: `${table}:${sha(id)}`,
    identity: {
      stable_identity_fingerprint: sha(id),
      ...identity,
    },
    row_fingerprint: sha(`${table}:${id}:row`),
  };
}

function sha(value) {
  const normalized = Buffer.from(String(value)).toString("hex").slice(0, 64);
  return `sha256:${normalized.padEnd(64, "0")}`;
}
