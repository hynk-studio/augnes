#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, rmSync } from "node:fs";

import Database from "better-sqlite3";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const files = {
  previewType: "types/perspective-next-work-bias-scoped-write-preview.ts",
  previewHelper: "lib/workplane/perspective-next-work-bias-scoped-write-preview.ts",
  previewPanel:
    "components/workplane/perspective-next-work-bias-scoped-write-preview-panel.tsx",
  writeType: "types/perspective-next-work-bias-write.ts",
  writeHelper: "lib/workplane/perspective-next-work-bias-write.ts",
  route: "app/api/workplane/perspective-next-work-biases/route.ts",
  reviewType: "types/perspective-next-work-bias-record-review.ts",
  reviewHelper: "lib/workplane/perspective-next-work-bias-record-review.ts",
  reviewForWeb:
    "lib/workplane/read-perspective-next-work-bias-record-review-for-web.ts",
  reviewPanel:
    "components/workplane/perspective-next-work-bias-record-review-panel.tsx",
  contractType: "types/perspective-relay-update-write-contract-preview.ts",
  contractHelper: "lib/workplane/perspective-relay-update-write-contract-preview.ts",
  relayDecisionSmoke:
    "scripts/smoke-perspective-relay-update-decision-write-contract-v0-1.mjs",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  overviewType: "types/workbench-dogfood-loop-spine-overview.ts",
  overviewHelper: "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  agentWorkplaneSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  overviewSmoke: "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
  smoke: "scripts/smoke-perspective-next-work-bias-scoped-write-v0-1.mjs",
  packageJson: "package.json",
};

const forbiddenNoSideEffectFields = [
  "perspective_unit_written",
  "current_working_perspective_updated",
  "continuity_relay_written",
  "handoff_context_mutated",
  "handoff_context_applied",
  "selected_refs_written_to_live_handoff",
  "handoff_sent",
  "memory_written",
  "memory_promoted",
  "memory_mutated",
  "dogfood_metrics_written",
  "dogfood_metrics_global_state_updated",
  "dogfood_metric_snapshot_written",
  "reuse_outcome_ledger_written",
  "expected_observed_delta_written",
  "work_episode_written",
  "provider_called",
  "github_called",
  "codex_executed",
  "pr_created",
  "pr_merged",
  "autonomous_action_run",
  "graph_or_vector_store_created",
  "rag_stack_created",
  "browser_observed",
  "crawler_or_browser_observer_created",
  "workbench_action_button_rendered",
];

const textByFile = loadTextByFile(Object.values(files));
const packageJsonText = textByFile.get(files.packageJson);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:perspective-next-work-bias-scoped-write-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-perspective-next-work-bias-scoped-write-v0-1.mjs",
});

assertContainsAll(
  [
    files.previewType,
    files.previewHelper,
    files.writeType,
    files.writeHelper,
    files.route,
    files.reviewType,
    files.reviewHelper,
  ]
    .map((file) => textByFile.get(file))
    .join("\n"),
  [
    "perspective_next_work_bias_scoped_write_preview.v0.1",
    "perspective_next_work_bias_record.v0.1",
    "perspective_next_work_bias_receipt.v0.1",
    "perspective_next_work_bias_store.v0.1",
    "perspective_next_work_bias_record_review.v0.1",
  ],
  { label: "perspective next work bias scoped write files" },
);

assertContainsAll(textByFile.get(files.agentWorkplane), [
  "PerspectiveNextWorkBiasScopedWritePreviewPanel",
  "PerspectiveNextWorkBiasRecordReviewPanel",
  "buildPerspectiveNextWorkBiasScopedWritePreviewV01",
  "readPerspectiveNextWorkBiasRecordReviewForWebV01",
  "const perspectiveNextWorkBiasScopedWritePreview",
  "const perspectiveNextWorkBiasRecordReview",
  "perspective_next_work_bias_scoped_write_preview:\n        perspectiveNextWorkBiasScopedWritePreview",
  "perspective_next_work_bias_record_review:\n        perspectiveNextWorkBiasRecordReview",
]);

assertContainsAll(textByFile.get(files.overviewType), [
  "perspective_next_work_bias_scoped_write",
  "perspective_next_work_bias_record",
  "review_perspective_next_work_bias_scoped_write",
  "write_perspective_next_work_bias_record",
  "review_perspective_next_work_bias_record",
  "resolve_perspective_next_work_bias_blockers",
  "prepare_perspective_unit_or_relay_write_slice",
]);

assertContainsAll(textByFile.get(files.overviewHelper), [
  "perspectiveNextWorkBiasScopedWriteStep",
  "perspectiveNextWorkBiasRecordStep",
  "perspective_next_work_bias_scoped_write_preview",
  "perspective_next_work_bias_record_review",
]);

for (const panel of [
  files.previewPanel,
  files.reviewPanel,
  files.agentWorkplane,
]) {
  const text = textByFile.get(panel);
  assert(!text.includes("<button"), `${panel} must not render buttons`);
  assert(
    !/onClick\s*=\{[^}]*\b(import|apply|approve|send|launch|run|execute|merge|write)\b/i.test(
      text,
    ),
    `${panel} must not add action click handlers`,
  );
}

for (const file of [
  files.previewHelper,
  files.writeHelper,
  files.route,
  files.reviewHelper,
  files.overviewHelper,
]) {
  const text = textByFile.get(file);
  assert(!/writePerspectiveUnit|updateCurrentWorkingPerspective|updateContinuityRelay/i.test(text));
  assert(!/applyHandoffContext|sendHandoff/i.test(text));
  assert(!/from ["']@\/(lib\/)?providers?\//i.test(text));
  assert(!/\b(provider|openai|github|codex)\.(create|request|send|execute|run|call)\b/i.test(text));
  assert(!/\b(createGraph|createVectorStore|createRagStack|crawlBrowser|observeBrowser)\b/i.test(text));
}

const { buildPerspectiveRelayUpdateOperatorDecisionPreviewV01 } = await import(
  "../lib/workplane/perspective-relay-update-decision.ts"
);
const relayDecisionWrite = await import(
  "../lib/workplane/perspective-relay-update-decision-write.ts"
);
const { buildPerspectiveRelayUpdateDecisionRecordReviewV01 } = await import(
  "../lib/workplane/perspective-relay-update-decision-record-review.ts"
);
const { buildPerspectiveRelayUpdateWriteContractPreviewV01 } = await import(
  "../lib/workplane/perspective-relay-update-write-contract-preview.ts"
);
const {
  buildPerspectiveNextWorkBiasScopedWritePreviewV01,
} = await import(
  "../lib/workplane/perspective-next-work-bias-scoped-write-preview.ts"
);
const biasWrite = await import(
  "../lib/workplane/perspective-next-work-bias-write.ts"
);
const { buildPerspectiveNextWorkBiasRecordReviewV01 } = await import(
  "../lib/workplane/perspective-next-work-bias-record-review.ts"
);
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);
const route = await import(
  "../app/api/workplane/perspective-next-work-biases/route.ts"
);

const bridgePreview = makeBridgePreview();
const selectionProbe = buildPerspectiveRelayUpdateOperatorDecisionPreviewV01({
  perspective_relay_update_candidate_bridge_preview: bridgePreview,
  requested_operator_ref: "operator:perspective-relay-reviewer",
  requested_idempotency_key: "idempotency:perspective-relay-update",
  review_confirmation_ref: "review:perspective-relay-update",
  source_refs: ["source:perspective-relay-decision"],
});
const selectedPerspectiveRef =
  selectionProbe.would_write_perspective_relay_update_decision_record_preview
    .selectable_candidate_refs_by_target.perspective_unit[0];
const selectedNextWorkRef =
  selectionProbe.would_write_perspective_relay_update_decision_record_preview
    .selectable_candidate_refs_by_target.next_work_bias[0];
const selectedRelayRef =
  selectionProbe.would_write_perspective_relay_update_decision_record_preview
    .selectable_candidate_refs_by_target.continuity_relay[0];
const readyRelayDecision = buildPerspectiveRelayUpdateOperatorDecisionPreviewV01({
  perspective_relay_update_candidate_bridge_preview: bridgePreview,
  selected_perspective_unit_candidate_refs: [selectedPerspectiveRef],
  selected_next_work_bias_candidate_refs: [selectedNextWorkRef],
  selected_continuity_relay_candidate_refs: [selectedRelayRef],
  requested_operator_ref: "operator:perspective-relay-reviewer",
  requested_idempotency_key: "idempotency:perspective-relay-update",
  review_confirmation_ref: "review:perspective-relay-update",
  source_refs: ["source:perspective-relay-decision"],
});
assert.equal(
  readyRelayDecision.decision_preview_status,
  "ready_for_future_perspective_relay_update_decision_record_write",
);

const relayApproval = {
  operator_decision: "approve_for_perspective_relay_update_decision_record",
  approved_by: "operator:perspective-relay-reviewer",
  operator_ref: "operator:perspective-relay-reviewer",
  approved_at: "2026-07-05T00:00:00.000Z",
  approval_statement: "approved bounded local decision record",
  checklist_confirmations: ["check:reviewed-candidate-groups"],
};
const relayDb = new Database(":memory:");
const relayWritten = relayDecisionWrite.writePerspectiveRelayUpdateDecisionRecordV01(
  {
    decision_preview: readyRelayDecision,
    operator_approval: relayApproval,
    idempotency_key: "idempotency:perspective-relay-update",
  },
  { db: relayDb },
);
assert.equal(relayWritten.status, "written");
const relayRecordReview = buildPerspectiveRelayUpdateDecisionRecordReviewV01({
  store_result: relayWritten,
});
const readyContract = buildPerspectiveRelayUpdateWriteContractPreviewV01({
  perspective_relay_update_operator_decision_preview: readyRelayDecision,
  perspective_relay_update_decision_record_review: relayRecordReview,
  perspective_relay_update_candidate_bridge_preview: bridgePreview,
  source_refs: ["source:write-contract"],
});
assert.equal(
  readyContract.contract_preview_status,
  "contract_ready_for_future_scoped_write_slice",
);

const emptyPreview = buildPerspectiveNextWorkBiasScopedWritePreviewV01();
assert.equal(
  emptyPreview.scoped_write_preview_status,
  "no_perspective_relay_update_write_contract",
);
assert.notEqual(
  emptyPreview.scoped_write_preview_status,
  "ready_for_future_perspective_next_work_bias_record_write",
);

const nonReadyContractPreview = buildPerspectiveNextWorkBiasScopedWritePreviewV01({
  perspective_relay_update_write_contract_preview: {
    ...clone(readyContract),
    contract_preview_status: "future_write_contract_candidates_available",
  },
  perspective_relay_update_decision_record_review: relayRecordReview,
  requested_operator_ref: "operator:next-work-bias-reviewer",
  requested_idempotency_key: "idempotency:next-work-bias",
  review_confirmation_ref: "review:next-work-bias",
  source_refs: ["source:next-work-bias"],
});
assert.notEqual(
  nonReadyContractPreview.scoped_write_preview_status,
  "ready_for_future_perspective_next_work_bias_record_write",
);

const noNextWorkContract = clone(readyContract);
noNextWorkContract.selected_candidate_refs_by_target.next_work_bias = [];
noNextWorkContract.proposed_future_write_contract.next_work_bias_update_contract.selected_candidate_refs = [];
noNextWorkContract.input_summary.selected_next_work_bias_candidate_count = 0;
const noNextWorkPreview = buildPerspectiveNextWorkBiasScopedWritePreviewV01({
  perspective_relay_update_write_contract_preview: noNextWorkContract,
  perspective_relay_update_decision_record_review: relayRecordReview,
  requested_operator_ref: "operator:next-work-bias-reviewer",
  requested_idempotency_key: "idempotency:next-work-bias",
  review_confirmation_ref: "review:next-work-bias",
  source_refs: ["source:next-work-bias"],
});
assert.notEqual(
  noNextWorkPreview.scoped_write_preview_status,
  "ready_for_future_perspective_next_work_bias_record_write",
);
assert.equal(noNextWorkPreview.input_summary.selected_next_work_bias_candidate_count, 0);
assert(noNextWorkPreview.input_summary.non_writable_perspective_unit_candidate_count > 0);

const notInContract = clone(readyContract);
notInContract.selected_candidate_refs_by_target.next_work_bias = [
  "candidate:bias-not-in-contract",
];
const notInContractPreview = buildPerspectiveNextWorkBiasScopedWritePreviewV01({
  perspective_relay_update_write_contract_preview: notInContract,
  perspective_relay_update_decision_record_review: relayRecordReview,
  requested_operator_ref: "operator:next-work-bias-reviewer",
  requested_idempotency_key: "idempotency:next-work-bias",
  review_confirmation_ref: "review:next-work-bias",
  source_refs: ["source:next-work-bias"],
});
assert(
  notInContractPreview.refusal_reasons.includes(
    "selected_next_work_bias_refs_not_in_contract",
  ),
);

const notInRecord = clone(readyContract);
notInRecord.selected_candidate_refs_by_target.next_work_bias = [
  "candidate:bias-not-in-record",
];
notInRecord.proposed_future_write_contract.next_work_bias_update_contract.selected_candidate_refs =
  ["candidate:bias-not-in-record"];
const notInRecordPreview = buildPerspectiveNextWorkBiasScopedWritePreviewV01({
  perspective_relay_update_write_contract_preview: notInRecord,
  perspective_relay_update_decision_record_review: relayRecordReview,
  requested_operator_ref: "operator:next-work-bias-reviewer",
  requested_idempotency_key: "idempotency:next-work-bias",
  review_confirmation_ref: "review:next-work-bias",
  source_refs: ["source:next-work-bias"],
});
assert(
  notInRecordPreview.refusal_reasons.includes(
    "selected_next_work_bias_refs_not_in_decision_record",
  ),
);

const readyBiasPreview = buildPerspectiveNextWorkBiasScopedWritePreviewV01({
  perspective_relay_update_write_contract_preview: readyContract,
  perspective_relay_update_decision_record_review: relayRecordReview,
  perspective_relay_update_candidate_bridge_preview: bridgePreview,
  requested_operator_ref: "operator:next-work-bias-reviewer",
  requested_idempotency_key: "idempotency:next-work-bias",
  review_confirmation_ref: "review:next-work-bias",
  source_refs: ["source:next-work-bias"],
});
assert.equal(
  readyBiasPreview.scoped_write_preview_status,
  "ready_for_future_perspective_next_work_bias_record_write",
);
assert.equal(readyBiasPreview.write_readiness.write_ready, true);
assert.equal(
  readyBiasPreview.recommended_next_action,
  "write_perspective_next_work_bias_record",
);
assert.equal(readyBiasPreview.next_work_bias_entries.length, 1);
assert.equal(readyBiasPreview.authority_boundary.can_write_next_work_bias, false);
assert.equal(readyBiasPreview.authority_boundary.can_write_perspective_unit, false);
assert.equal(
  readyBiasPreview.authority_boundary.can_update_current_working_perspective,
  false,
);
assert.equal(readyBiasPreview.authority_boundary.can_update_continuity_relay, false);

const biasApproval = {
  operator_decision: "approve_for_perspective_next_work_bias_record",
  approved_by: "operator:next-work-bias-reviewer",
  operator_ref: "operator:next-work-bias-reviewer",
  approved_at: "2026-07-05T00:00:02.000Z",
  approval_statement: "approved bounded local next work bias record",
  checklist_confirmations: ["check:reviewed-bias-entries"],
};
const validInput = {
  scoped_write_preview: readyBiasPreview,
  operator_approval: biasApproval,
  idempotency_key: "idempotency:next-work-bias",
};

let db = new Database(":memory:");
let refused = biasWrite.writePerspectiveNextWorkBiasRecordV01(
  {
    scoped_write_preview: noNextWorkPreview,
    operator_approval: biasApproval,
    idempotency_key: "idempotency:not-ready",
  },
  { db },
);
assert.equal(refused.status, "refused");
assert.equal(biasWrite.perspectiveNextWorkBiasWriteSchemaExistsV01(db), false);
db.close();

for (const [label, mutatedInput, expectedReason] of [
  [
    "idempotency mismatch",
    () => ({ ...clone(validInput), idempotency_key: "idempotency:mismatch" }),
    "idempotency_key_mismatch_with_scoped_write_preview",
  ],
  [
    "operator mismatch",
    () => ({
      ...clone(validInput),
      operator_approval: {
        ...biasApproval,
        operator_ref: "operator:wrong-reviewer",
      },
    }),
    "operator_ref_mismatch_with_scoped_write_preview",
  ],
  [
    "unsafe refs",
    () => ({
      ...clone(validInput),
      scoped_write_preview: {
        ...clone(readyBiasPreview),
        source_refs: ["source:../private"],
      },
    }),
    "scoped_write_preview_source_refs_unsafe",
  ],
  [
    "raw material",
    () => ({ ...clone(validInput), raw_text: "blocked" }),
    "raw_or_private_marker_material_refused",
  ],
  [
    "default material",
    () => ({ ...clone(validInput), notes: ["workbench:default"] }),
    "sample_fixture_default_or_workbench_material_refused",
  ],
  [
    "forbidden side effect",
    () => ({
      ...clone(validInput),
      requested_side_effects: { perspective_unit_written: true },
    }),
    "requested_side_effect_not_allowed",
  ],
  [
    "malformed entry",
    () => {
      const input = clone(validInput);
      input.scoped_write_preview.would_write_perspective_next_work_bias_record_preview.next_work_bias_entries[0].directive =
        "preserve_next_time";
      input.scoped_write_preview.would_write_perspective_next_work_bias_record_preview.next_work_bias_entries[0].bucket =
        "next_work_bias_warn_next_time";
      return input;
    },
    "next_work_bias_entry_directive_bucket_mismatch",
  ],
]) {
  db = new Database(":memory:");
  const result = biasWrite.writePerspectiveNextWorkBiasRecordV01(mutatedInput(), {
    db,
  });
  assert.equal(result.status, "refused", label);
  assert(result.receipt.refusal_reasons.includes(expectedReason), label);
  assert.equal(biasWrite.perspectiveNextWorkBiasWriteSchemaExistsV01(db), false, label);
  db.close();
}

db = new Database(":memory:");
assert.equal(
  biasWrite.readPerspectiveNextWorkBiasRecordByIdV01("record:none", { db }).status,
  "schema_missing",
);
assert.equal(biasWrite.perspectiveNextWorkBiasWriteSchemaExistsV01(db), false);
const written = biasWrite.writePerspectiveNextWorkBiasRecordV01(validInput, {
  db,
});
assert.equal(written.status, "written");
assert.equal(written.record?.record_version, "perspective_next_work_bias_record.v0.1");
assert.equal(written.receipt.receipt_version, "perspective_next_work_bias_receipt.v0.1");
assert.equal(written.no_side_effects.perspective_next_work_bias_record_written, true);
assert.equal(written.no_side_effects.perspective_next_work_bias_receipt_written, true);
assert.equal(written.no_side_effects.perspective_next_work_bias_persisted, true);
assert.equal(written.no_side_effects.next_work_bias_written, true);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(written.no_side_effects[field], false, field);
}
const replay = biasWrite.writePerspectiveNextWorkBiasRecordV01(validInput, {
  db,
});
assert.equal(replay.status, "idempotent_existing");
const conflict = biasWrite.writePerspectiveNextWorkBiasRecordV01(
  {
    ...clone(validInput),
    operator_approval: {
      ...biasApproval,
      approved_at: "2026-07-05T00:00:03.000Z",
    },
  },
  { db },
);
assert.equal(conflict.status, "refused");
assert(conflict.receipt.refusal_reasons.includes("idempotency_key_conflict"));
assert.equal(
  biasWrite.readPerspectiveNextWorkBiasRecordByIdV01(written.record.record_id, {
    db,
  }).status,
  "read",
);
assert.equal(
  biasWrite.readPerspectiveNextWorkBiasRecordByIdempotencyKeyV01(
    written.record.idempotency_key,
    { db },
  ).status,
  "read",
);
assert.equal(biasWrite.listPerspectiveNextWorkBiasRecordsV01({ db }).records.length, 1);

const outOfScopeRecord = {
  ...written.record,
  record_id: "perspective-next-work-bias:out-of-scope",
  idempotency_key: "idempotency:out-of-scope",
  scope: "project:not-augnes",
};
db.prepare(
  `INSERT INTO perspective_next_work_bias_records (
    record_id, idempotency_key, created_at, scope, operator_ref,
    record_fingerprint, record_json, receipt_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
).run(
  outOfScopeRecord.record_id,
  outOfScopeRecord.idempotency_key,
  outOfScopeRecord.created_at,
  outOfScopeRecord.scope,
  outOfScopeRecord.operator_ref,
  outOfScopeRecord.record_fingerprint,
  JSON.stringify(outOfScopeRecord),
  JSON.stringify(written.receipt),
);
assert.equal(
  biasWrite.readPerspectiveNextWorkBiasRecordByIdV01(outOfScopeRecord.record_id, {
    db,
  }).status,
  "not_found",
);
assert.equal(
  biasWrite.readPerspectiveNextWorkBiasRecordByIdempotencyKeyV01(
    outOfScopeRecord.idempotency_key,
    { db },
  ).status,
  "not_found",
);
assert.equal(biasWrite.listPerspectiveNextWorkBiasRecordsV01({ db }).records.length, 1);

const replayScopeDb = new Database(":memory:");
biasWrite.ensurePerspectiveNextWorkBiasWriteSchemaV01(replayScopeDb);
const outOfScopeReplayRecord = {
  ...written.record,
  record_id: "perspective-next-work-bias:out-of-scope-replay",
  scope: "project:not-augnes",
};
replayScopeDb.prepare(
  `INSERT INTO perspective_next_work_bias_records (
    record_id, idempotency_key, created_at, scope, operator_ref,
    record_fingerprint, record_json, receipt_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
).run(
  outOfScopeReplayRecord.record_id,
  outOfScopeReplayRecord.idempotency_key,
  outOfScopeReplayRecord.created_at,
  outOfScopeReplayRecord.scope,
  outOfScopeReplayRecord.operator_ref,
  outOfScopeReplayRecord.record_fingerprint,
  JSON.stringify(outOfScopeReplayRecord),
  JSON.stringify(written.receipt),
);
const outOfScopeReplay = biasWrite.writePerspectiveNextWorkBiasRecordV01(
  validInput,
  { db: replayScopeDb },
);
assert.notEqual(outOfScopeReplay.status, "idempotent_existing");
assert.equal(outOfScopeReplay.status, "refused");
replayScopeDb.close();

const noRecordReview = buildPerspectiveNextWorkBiasRecordReviewV01();
assert.equal(noRecordReview.review_status, "no_records");
const recordReview = buildPerspectiveNextWorkBiasRecordReviewV01({
  store_result: written,
});
assert.equal(recordReview.review_status, "records_available");
assert.equal(recordReview.next_work_bias_material_summary.next_work_bias_entry_count, 1);
assert.equal(recordReview.receipt_no_side_effects_summary.next_work_bias_written_count > 0, true);
const malformedReview = buildPerspectiveNextWorkBiasRecordReviewV01({
  records: [
    {
      record_version: "perspective_next_work_bias_record.v0.1",
      record_id: "malformed",
      idempotency_key: "idempotency:malformed",
      created_at: "2026-07-05T00:00:00.000Z",
      scope: "project:augnes",
    },
  ],
});
assert.equal(malformedReview.review_status, "records_invalid");
assert(
  malformedReview.record_summaries[0].problem_reasons.includes(
    "perspective_next_work_bias_record_malformed",
  ),
);
const corruptReceiptStoreResult = clone(written);
corruptReceiptStoreResult.receipt.no_side_effects.perspective_unit_written = true;
const corruptReview = buildPerspectiveNextWorkBiasRecordReviewV01({
  store_result: corruptReceiptStoreResult,
});
assert.equal(corruptReview.review_status, "records_invalid");
assert(corruptReview.input_summary.receipt_side_effect_problem_count > 0);
assert.equal(corruptReview.evidence_summary.has_receipt_side_effect_problem, true);
assert(
  corruptReview.blocked_reasons.includes(
    "perspective_next_work_bias_receipt_no_side_effects_invalid",
  ),
);

const overviewBeforeWrite = buildWorkbenchDogfoodLoopSpineOverviewV01({
  perspective_relay_update_candidate_bridge_preview: bridgePreview,
  perspective_relay_update_operator_decision_preview: readyRelayDecision,
  perspective_relay_update_decision_record_review: relayRecordReview,
  perspective_relay_update_write_contract_preview: readyContract,
  perspective_next_work_bias_scoped_write_preview: readyBiasPreview,
  perspective_next_work_bias_record_review: noRecordReview,
});
for (const stepId of [
  "perspective_next_work_bias_scoped_write",
  "perspective_next_work_bias_record",
]) {
  assert(overviewBeforeWrite.spine_steps.some((step) => step.step_id === stepId), stepId);
}
assert.equal(
  overviewBeforeWrite.recommended_next_operator_action,
  "write_perspective_next_work_bias_record",
);
const overviewAfterWrite = buildWorkbenchDogfoodLoopSpineOverviewV01({
  perspective_relay_update_candidate_bridge_preview: bridgePreview,
  perspective_relay_update_operator_decision_preview: readyRelayDecision,
  perspective_relay_update_decision_record_review: relayRecordReview,
  perspective_relay_update_write_contract_preview: readyContract,
  perspective_next_work_bias_scoped_write_preview: readyBiasPreview,
  perspective_next_work_bias_record_review: recordReview,
});
assert.equal(
  overviewAfterWrite.recommended_next_operator_action,
  "review_perspective_next_work_bias_record",
);
for (const forbiddenAction of [
  "write_perspective_unit",
  "update_current_working_perspective",
  "write_continuity_relay",
  "apply_handoff",
  "send_handoff",
  "write_memory",
  "write_dogfood_metrics",
  "call_provider",
  "call_github",
  "execute_codex",
  "create_graph",
]) {
  assert.notEqual(
    overviewAfterWrite.recommended_next_operator_action,
    forbiddenAction,
  );
}

await assertRouteBoundaries({ route, validInput });

db.close();
relayDb.close();

assertChangedFilesWithin({
  label: "perspective next work bias scoped write v0.1",
  allowedChangedFiles: Object.values(files),
});

console.log("PASS smoke:perspective-next-work-bias-scoped-write-v0-1");

async function assertRouteBoundaries({ route, validInput }) {
  const tempRoot = ".tmp/perspective-next-work-biases";
  rmSync(tempRoot, { recursive: true, force: true });
  mkdirSync(tempRoot, { recursive: true });
  const invalidPath = `${tempRoot}/invalid-write.sqlite`;
  let response = await route.GET(
    new Request(
      "http://localhost/api/workplane/perspective-next-work-biases?db_path=/tmp/private.sqlite",
    ),
  );
  assert.equal(response.status, 400);
  response = await route.GET(
    new Request(
      "http://localhost/api/workplane/perspective-next-work-biases?db_path=.tmp/perspective-next-work-biases/missing.sqlite",
    ),
  );
  assert.equal(response.status, 404);
  response = await route.POST(
    new Request("http://localhost/api/workplane/perspective-next-work-biases", {
      method: "POST",
      headers: sameOriginHeaders(),
      body: "{",
    }),
  );
  assert.equal(response.status, 400);
  response = await route.POST(
    new Request("http://localhost/api/workplane/perspective-next-work-biases", {
      method: "POST",
      headers: sameOriginHeaders(),
      body: JSON.stringify("invalid"),
    }),
  );
  assert.equal(response.status, 400);
  response = await route.POST(
    new Request("http://localhost/api/workplane/perspective-next-work-biases", {
      method: "POST",
      headers: sameOriginHeaders(),
      body: JSON.stringify({ action: "delete", db_path: invalidPath }),
    }),
  );
  assert.equal(response.status, 400);
  response = await route.POST(
    new Request("http://localhost/api/workplane/perspective-next-work-biases", {
      method: "POST",
      headers: sameOriginHeaders(),
      body: JSON.stringify({ action: "write", db_path: "../unsafe.sqlite" }),
    }),
  );
  assert.equal(response.status, 400);
  response = await route.POST(
    new Request("http://localhost/api/workplane/perspective-next-work-biases", {
      method: "POST",
      headers: {
        origin: "http://evil.example",
        host: "localhost",
        "sec-fetch-site": "cross-site",
      },
      body: JSON.stringify({ action: "write", db_path: invalidPath, input: validInput }),
    }),
  );
  assert.equal(response.status, 403);
  response = await route.POST(
    new Request("http://localhost/api/workplane/perspective-next-work-biases", {
      method: "POST",
      headers: sameOriginHeaders(),
      body: JSON.stringify({
        action: "write",
        db_path: invalidPath,
        input: { idempotency_key: "idempotency:invalid" },
      }),
    }),
  );
  assert.equal(response.status, 400);
  assert.equal(existsSync(invalidPath), false);

  const validPath = `${tempRoot}/valid-write.sqlite`;
  const routeInput = clone(validInput);
  routeInput.idempotency_key = "idempotency:route-next-work-bias";
  routeInput.scoped_write_preview.would_write_perspective_next_work_bias_record_preview.requested_idempotency_key =
    "idempotency:route-next-work-bias";
  response = await route.POST(
    new Request("http://internal.local/api/workplane/perspective-next-work-biases", {
      method: "POST",
      headers: {
        origin: "http://operator.local",
        host: "internal.local",
        "x-forwarded-host": "operator.local",
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify({
        action: "write",
        db_path: validPath,
        input: routeInput,
      }),
    }),
  );
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.perspective_next_work_bias_record_written, true);
  assert.equal(body.next_work_bias_written, true);
  assert.equal(body.no_side_effects.perspective_next_work_bias_record_written, true);
  assert.equal(body.no_side_effects.next_work_bias_written, true);
  for (const field of forbiddenNoSideEffectFields) {
    assert.equal(body.no_side_effects[field], false, `route ${field}`);
  }
  const recordId = body.record.record_id;
  response = await route.GET(
    new Request(
      `http://localhost/api/workplane/perspective-next-work-biases?db_path=${validPath}&record_id=${encodeURIComponent(recordId)}`,
    ),
  );
  assert.equal(response.status, 200);
  response = await route.GET(
    new Request(
      `http://localhost/api/workplane/perspective-next-work-biases?db_path=${validPath}&idempotency_key=${encodeURIComponent(routeInput.idempotency_key)}`,
    ),
  );
  assert.equal(response.status, 200);
  rmSync(tempRoot, { recursive: true, force: true });
}

function sameOriginHeaders() {
  return {
    origin: "http://localhost",
    host: "localhost",
    "sec-fetch-site": "same-origin",
  };
}

function makeBridgePreview() {
  return {
    preview_version: "perspective_relay_update_candidate_bridge_preview.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-05T00:00:00.000Z",
    source_refs: ["source:bridge-material"],
    bridge_preview_status: "ready_for_operator_review",
    recommended_next_action: "review_perspective_relay_update_candidates",
    input_summary: {
      has_next_work_signal_decision_preview: true,
      has_next_work_signal_decision_records: true,
      has_next_work_signal_refresh_preview: true,
      candidate_material_count: 6,
      blocker_count: 0,
      insufficient_data_count: 0,
    },
    proposed_perspective_unit_candidates: {
      reinforce_candidates: ["candidate:perspective-reinforce-context"],
      weaken_or_warn_candidates: ["candidate:perspective-warn-stale"],
      retire_or_deprioritize_candidates: [],
      split_or_review_candidates: [],
    },
    proposed_next_work_bias_candidates: {
      preserve_next_time: ["candidate:bias-preserve-context"],
      warn_next_time: ["candidate:bias-warn-stale"],
      drop_or_deprioritize: [],
      verification_bias: ["candidate:bias-verification"],
      context_diet_bias: [],
      handoff_quality_bias: [],
    },
    proposed_continuity_relay_candidates: {
      preserve_anchor_candidates: ["candidate:relay-preserve-anchor"],
      warn_anchor_candidates: [],
      stop_if_missing_candidates: [],
      next_focus_candidates: ["candidate:relay-next-focus"],
      relay_update_suggestions: [],
    },
    evidence_summary: {
      has_next_work_signal_material: true,
      has_source_refs: true,
      has_evidence_refs: true,
      source_refs: ["source:bridge-material"],
      evidence_refs: ["evidence:accepted-next-work-signal"],
      missing_evidence: [],
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    operator_review_checklist: ["check:review-perspective-relay-candidates"],
    would_not_write: ["does_not_write_perspective_unit"],
    non_goals: ["perspective_unit_write"],
    authority_boundary: {
      read_only: true,
      candidate_material_only: true,
      source_of_truth: false,
      derived_read_model: true,
      can_write_perspective_unit: false,
      can_write_next_work_bias: false,
      can_update_current_working_perspective: false,
      can_update_continuity_relay: false,
      can_mutate_handoff_context: false,
      can_send_handoff: false,
      can_write_memory: false,
      can_write_dogfood_metrics: false,
      can_write_reuse_outcome_ledger: false,
      can_write_expected_observed_delta: false,
      can_write_work_episode: false,
      can_call_provider_openai: false,
      can_call_github: false,
      can_execute_codex: false,
      notes: ["read-only candidate bridge"],
    },
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
