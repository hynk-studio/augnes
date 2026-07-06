import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const root = process.cwd();
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
assert.equal(
  pkg.scripts["smoke:current-working-perspective-apply-slice-v0-1"],
  "tsx --tsconfig tsconfig.json scripts/smoke-current-working-perspective-apply-slice-v0-1.mjs",
);

const expectedFiles = [
  "types/current-working-perspective-apply-preview.ts",
  "lib/workplane/current-working-perspective-apply-preview.ts",
  "components/workplane/current-working-perspective-apply-preview-panel.tsx",
  "types/current-working-perspective-apply-decision.ts",
  "lib/workplane/current-working-perspective-apply-decision.ts",
  "components/workplane/current-working-perspective-apply-decision-panel.tsx",
  "types/current-working-perspective-apply-write.ts",
  "lib/workplane/current-working-perspective-apply-write.ts",
  "app/api/workplane/current-working-perspective-applies/route.ts",
  "types/current-working-perspective-apply-record-review.ts",
  "lib/workplane/current-working-perspective-apply-record-review.ts",
  "lib/workplane/read-current-working-perspective-apply-record-review-for-web.ts",
  "components/workplane/current-working-perspective-apply-record-review-panel.tsx",
  "lib/perspective/read-applied-current-working-perspective-for-web.ts",
  "components/workplane/applied-current-working-perspective-panel.tsx",
  "types/current-working-perspective-route-integration-contract-preview.ts",
  "lib/workplane/current-working-perspective-route-integration-contract-preview.ts",
  "components/workplane/current-working-perspective-route-integration-contract-preview-panel.tsx",
  "types/current-working-perspective-route-integration-contract-decision.ts",
  "lib/workplane/current-working-perspective-route-integration-contract-decision.ts",
  "components/workplane/current-working-perspective-route-integration-contract-decision-panel.tsx",
  "types/current-working-perspective-route-integration-contract-write.ts",
  "lib/workplane/current-working-perspective-route-integration-contract-write.ts",
  "app/api/workplane/current-working-perspective-route-integration-contracts/route.ts",
  "types/current-working-perspective-route-integration-contract-record-review.ts",
  "lib/workplane/current-working-perspective-route-integration-contract-record-review.ts",
  "lib/workplane/read-current-working-perspective-route-integration-contract-record-review-for-web.ts",
  "components/workplane/current-working-perspective-route-integration-contract-record-review-panel.tsx",
  "types/current-working-perspective-route-integration-read.ts",
  "lib/perspective/current-working-perspective-route-integration-read.ts",
  "lib/perspective/read-current-working-perspective-route-integration-for-web.ts",
  "types/current-working-perspective-route-integration-read-review.ts",
  "lib/workplane/current-working-perspective-route-integration-read-review.ts",
  "components/workplane/current-working-perspective-route-integration-read-panel.tsx",
  "app/api/perspective/current/route.ts",
  "components/workplane/agent-workplane.tsx",
  "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  "types/workbench-dogfood-loop-spine-overview.ts",
  "scripts/smoke-current-working-perspective-route-integration-slice-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-integration-contract-v0-1.mjs",
  "scripts/smoke-current-working-perspective-update-contract-v0-1.mjs",
  "scripts/smoke-current-working-perspective-apply-slice-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
  "scripts/smoke-continuity-relay-scoped-write-v0-1.mjs",
  "scripts/smoke-perspective-unit-scoped-write-v0-1.mjs",
  "scripts/smoke-perspective-next-work-bias-scoped-write-v0-1.mjs",
  "scripts/smoke-perspective-relay-update-decision-write-contract-v0-1.mjs",
  "types/handoff-context-apply-slice-preview.ts",
  "lib/workplane/handoff-context-apply-preview.ts",
  "components/workplane/handoff-context-apply-preview-panel.tsx",
  "types/handoff-context-apply-slice-decision.ts",
  "lib/workplane/handoff-context-apply-decision.ts",
  "components/workplane/handoff-context-apply-decision-panel.tsx",
  "types/handoff-context-apply-write.ts",
  "lib/workplane/handoff-context-apply-write.ts",
  "app/api/workplane/handoff-context-applies/route.ts",
  "types/handoff-context-apply-record-review.ts",
  "lib/workplane/handoff-context-apply-record-review.ts",
  "lib/workplane/read-handoff-context-apply-record-review-for-web.ts",
  "lib/workplane/read-applied-handoff-context-for-web.ts",
  "components/workplane/handoff-context-apply-record-review-panel.tsx",
  "components/workplane/applied-handoff-context-panel.tsx",
  "scripts/smoke-handoff-context-apply-slice-v0-1.mjs",
  "package.json",
];
for (const file of expectedFiles.slice(0, 15)) {
  assert(existsSync(path.join(root, file)), `missing ${file}`);
}

const changed = await gitChangedFiles();
for (const file of changed) {
  assert(
    expectedFiles.includes(file),
    `changed file outside CurrentWorkingPerspective apply slice boundary: ${file}`,
  );
}

const expectedStrings = [
  "current_working_perspective_apply_preview.v0.1",
  "current_working_perspective_apply_operator_decision_preview.v0.1",
  "current_working_perspective_apply_record.v0.1",
  "current_working_perspective_apply_receipt.v0.1",
  "current_working_perspective_applied_snapshot.v0.1",
  "current_working_perspective_apply_store.v0.1",
  "current_working_perspective_apply_record_review.v0.1",
  "current_working_perspective_update_applied_to_local_snapshot",
  "prepare_current_working_perspective_route_integration_contract",
];
const repoText = expectedFiles
  .filter((file) => existsSync(path.join(root, file)))
  .map((file) => readFileSync(path.join(root, file), "utf8"))
  .join("\n");
for (const expected of expectedStrings) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

const { buildCurrentWorkingPerspectiveApplyPreviewV01 } = await import(
  "../lib/workplane/current-working-perspective-apply-preview.ts"
);
const {
  buildCurrentWorkingPerspectiveApplyOperatorDecisionPreviewV01,
} = await import("../lib/workplane/current-working-perspective-apply-decision.ts");
const applyWrite = await import(
  "../lib/workplane/current-working-perspective-apply-write.ts"
);
const { buildCurrentWorkingPerspectiveApplyRecordReviewV01 } = await import(
  "../lib/workplane/current-working-perspective-apply-record-review.ts"
);
const {
  readAppliedCurrentWorkingPerspectiveForWebV01,
} = await import(
  "../lib/perspective/read-applied-current-working-perspective-for-web.ts"
);
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);
const route = await import(
  "../app/api/workplane/current-working-perspective-applies/route.ts"
);

const AS_OF = "2026-07-06T00:00:00.000Z";
const operatorRef = "operator:cwp-apply";
const idempotencyKey = "idempotency:cwp-apply";
const reviewRef = "review:cwp-apply";
const sourceRefs = ["source:cwp-apply"];
const evidenceRefs = ["evidence:cwp-apply"];

const forbiddenNoSideEffectFields = [
  "upstream_current_working_perspective_source_tables_updated",
  "upstream_current_working_perspective_source_tables_mutated",
  "current_working_perspective_route_response_replaced",
  "perspective_unit_written",
  "next_work_bias_written",
  "continuity_relay_written",
  "continuity_relay_updated",
  "live_relay_state_applied",
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

function buildPreview(overrides = {}) {
  return buildCurrentWorkingPerspectiveApplyPreviewV01({
    current_working_perspective_update_contract_record_review:
      buildContractRecordReview(),
    current_working_perspective_read: runtimeCwpRead(),
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    scope: "project:augnes",
    as_of: AS_OF,
    source_refs: sourceRefs,
    ...overrides,
  });
}

function buildDecision(preview = buildPreview(), overrides = {}) {
  return buildCurrentWorkingPerspectiveApplyOperatorDecisionPreviewV01({
    current_working_perspective_apply_preview: preview,
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    operator_decision_intent:
      "approve_for_current_working_perspective_apply_record",
    scope: "project:augnes",
    as_of: AS_OF,
    source_refs: sourceRefs,
    ...overrides,
  });
}

function buildWriteInput(decision = buildDecision(), overrides = {}) {
  return {
    apply_decision_preview: decision,
    operator_approval: {
      operator_decision: "approve_for_current_working_perspective_apply_record",
      approved_by: "operator:cwp-apply-approver",
      operator_ref: operatorRef,
      approved_at: AS_OF,
      approval_statement: "approve:cwp-apply-local-snapshot-only",
      checklist_confirmations: [
        "confirm:local-apply-record-only",
        "confirm:no-route-replacement",
      ],
    },
    idempotency_key: idempotencyKey,
    notes: ["note:scoped-local-apply"],
    ...overrides,
  };
}

const missingContractPreview = buildCurrentWorkingPerspectiveApplyPreviewV01({
  current_working_perspective_read: runtimeCwpRead(),
  scope: "project:augnes",
  as_of: AS_OF,
  source_refs: sourceRefs,
});
assert.equal(
  missingContractPreview.apply_preview_status,
  "no_current_working_perspective_update_contract_record",
);
assert.equal(
  missingContractPreview.proposed_applied_current_working_perspective,
  null,
);

assert.notEqual(
  buildPreview({ current_working_perspective_read: undefined }).apply_preview_status,
  "ready_for_future_current_working_perspective_apply_record_write",
);
assert.notEqual(
  buildPreview({ current_working_perspective_read: fixtureCwpRead() })
    .apply_preview_status,
  "ready_for_future_current_working_perspective_apply_record_write",
);
assert.notEqual(
  buildPreview({
    current_working_perspective_update_contract_record_review: {
      review_version: "current_working_perspective_update_contract_record_review.v0.1",
      review_status: "records_invalid",
      records: [],
      input_summary: { valid_record_count: 0 },
      evidence_summary: { has_receipt_side_effect_problem: true },
    },
  }).apply_preview_status,
  "ready_for_future_current_working_perspective_apply_record_write",
);
assert(
  buildPreview({
    current_working_perspective_update_contract_record_review:
      buildContractRecordReview({ review_status: "selected_record_missing" }),
  }).blocking_reasons.includes(
    "selected_current_working_perspective_update_contract_record_missing",
  ),
);
assert(
  buildPreview({
    current_working_perspective_update_contract_record_review:
      buildContractRecordReview({
        records: [{ ...contractRecord(), proposed_patch_entries: [] }],
        latest_record_summary: {
          record_id: "cwp-update-contract-record:valid",
        },
      }),
  }).apply_readiness.current_insufficient_data.includes(
    "current_working_perspective_apply_patch_entries_missing",
  ),
);
assert(
  buildPreview({ source_refs: [] }).missing_evidence.includes(
    "source_refs_missing",
  ),
);
assert(
  buildPreview({
    current_working_perspective_update_contract_record_review:
      buildContractRecordReview({
        records: [contractRecordWithoutEvidence()],
        evidence_summary: {
          evidence_refs: [],
          missing_evidence: [],
          has_receipt_side_effect_problem: false,
        },
      }),
  }).missing_evidence.includes("evidence_refs_missing"),
);
assert(
  buildPreview({ requested_operator_ref: undefined }).apply_readiness
    .current_insufficient_data.includes("operator_ref_missing"),
);
assert(
  buildPreview({ requested_idempotency_key: undefined }).apply_readiness
    .current_insufficient_data.includes("idempotency_key_missing"),
);
assert(
  buildPreview({ review_confirmation_ref: undefined }).apply_readiness
    .current_insufficient_data.includes("review_confirmation_ref_missing"),
);
assert(
  buildPreview({ requested_operator_ref: "secret:operator" }).refusal_reasons
    .includes("current_working_perspective_apply_refs_unsafe"),
);

const beforeCwp = runtimeCwpRead().data;
const beforeSerialized = JSON.stringify(beforeCwp);
const readyPreview = buildPreview({ current_working_perspective: beforeCwp });
assert.equal(
  readyPreview.apply_preview_status,
  "ready_for_future_current_working_perspective_apply_record_write",
);
assert.equal(readyPreview.apply_readiness.write_ready, true);
assert.equal(JSON.stringify(beforeCwp), beforeSerialized);
assert(
  readyPreview.proposed_applied_current_working_perspective.gaps.length >=
    beforeCwp.gaps.length,
);
assert(
  readyPreview.proposed_applied_current_working_perspective.source_refs
    .project_constellation_refs.length >=
    beforeCwp.source_refs.project_constellation_refs.length,
);
assert.equal(readyPreview.authority_boundary.can_write_db, false);
assert.equal(
  readyPreview.authority_boundary
    .can_create_current_working_perspective_apply_record,
  false,
);

assert.notEqual(
  buildCurrentWorkingPerspectiveApplyOperatorDecisionPreviewV01({
    current_working_perspective_apply_preview: missingContractPreview,
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    operator_decision_intent:
      "approve_for_current_working_perspective_apply_record",
  }).decision_preview_status,
  "ready_for_future_current_working_perspective_apply_record_write",
);
assert.notEqual(
  buildDecision(readyPreview, { operator_decision_intent: undefined })
    .decision_preview_status,
  "ready_for_future_current_working_perspective_apply_record_write",
);
const readyDecision = buildDecision(readyPreview);
assert.equal(
  readyDecision.decision_preview_status,
  "ready_for_future_current_working_perspective_apply_record_write",
);

const refusedDbPath = ".tmp/current-working-perspective-applies/refused.sqlite";
rmSync(path.join(root, refusedDbPath), { force: true });
const refusedNonReady = applyWrite.writeCurrentWorkingPerspectiveApplyRecordV01(
  buildWriteInput(buildDecision(missingContractPreview)),
  { db: new Database(":memory:") },
);
assert.equal(refusedNonReady.status, "refused");
assert(!existsSync(path.join(root, refusedDbPath)));

const db = new Database(":memory:");
assert.equal(
  applyWrite.listCurrentWorkingPerspectiveApplyRecordsV01({ db }).status,
  "schema_missing",
);
assert.equal(
  applyWrite.writeCurrentWorkingPerspectiveApplyRecordV01(
    buildWriteInput(readyDecision, { idempotency_key: "idempotency:mismatch" }),
    { db },
  ).status,
  "refused",
);
assert.equal(
  applyWrite.writeCurrentWorkingPerspectiveApplyRecordV01(
    buildWriteInput(readyDecision, {
      operator_approval: {
        ...buildWriteInput(readyDecision).operator_approval,
        operator_ref: "operator:other",
      },
    }),
    { db },
  ).status,
  "refused",
);
assert.equal(
  applyWrite.writeCurrentWorkingPerspectiveApplyRecordV01(
    buildWriteInput(readyDecision, { notes: ["secret:note"] }),
    { db },
  ).status,
  "refused",
);
assert.equal(
  applyWrite.writeCurrentWorkingPerspectiveApplyRecordV01(
    buildWriteInput(readyDecision, { notes: ["workbench:default"] }),
    { db },
  ).status,
  "refused",
);
assert.equal(
  applyWrite.writeCurrentWorkingPerspectiveApplyRecordV01(
    buildWriteInput(readyDecision, {
      requested_side_effects: {
        upstream_current_working_perspective_source_tables_mutated: true,
      },
    }),
    { db },
  ).status,
  "refused",
);
const malformedSnapshotDecision = structuredClone(readyDecision);
malformedSnapshotDecision.would_write_current_working_perspective_apply_decision_preview
  .contract_preview.would_write_current_working_perspective_apply_record_preview.applied_current_working_perspective = null;
assert.equal(
  applyWrite.writeCurrentWorkingPerspectiveApplyRecordV01(
    buildWriteInput(malformedSnapshotDecision),
    { db },
  ).status,
  "refused",
);
const malformedSummaryDecision = structuredClone(readyDecision);
malformedSummaryDecision.would_write_current_working_perspective_apply_decision_preview
  .contract_preview.would_write_current_working_perspective_apply_record_preview.patch_application_summary = {};
assert.equal(
  applyWrite.writeCurrentWorkingPerspectiveApplyRecordV01(
    buildWriteInput(malformedSummaryDecision),
    { db },
  ).status,
  "refused",
);
const forgedPreviewDecision = structuredClone(readyDecision);
forgedPreviewDecision.would_write_current_working_perspective_apply_decision_preview
  .contract_preview.authority_boundary.can_write_db = true;
assert.equal(
  applyWrite.writeCurrentWorkingPerspectiveApplyRecordV01(
    buildWriteInput(forgedPreviewDecision),
    { db },
  ).status,
  "refused",
);

const writeResult = applyWrite.writeCurrentWorkingPerspectiveApplyRecordV01(
  buildWriteInput(readyDecision),
  { db },
);
assert.equal(
  writeResult.status,
  "written",
  JSON.stringify(writeResult.validation ?? writeResult, null, 2),
);
assert.equal(writeResult.record.record_version, "current_working_perspective_apply_record.v0.1");
assert.equal(writeResult.applied_snapshot.snapshot_version, "current_working_perspective_applied_snapshot.v0.1");
assert.equal(writeResult.no_side_effects.current_working_perspective_apply_record_written, true);
assert.equal(writeResult.no_side_effects.current_working_perspective_apply_receipt_written, true);
assert.equal(writeResult.no_side_effects.current_working_perspective_apply_persisted, true);
assert.equal(writeResult.no_side_effects.applied_current_working_perspective_snapshot_written, true);
assert.equal(writeResult.no_side_effects.current_working_perspective_update_applied_to_local_snapshot, true);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(writeResult.no_side_effects[field], false, field);
}

const replay = applyWrite.writeCurrentWorkingPerspectiveApplyRecordV01(
  buildWriteInput(readyDecision),
  { db },
);
assert.equal(replay.status, "idempotent_existing");
assert.equal(replay.receipt.wrote, false);
assert.equal(replay.receipt.idempotent_replay, true);
assert.equal(replay.no_side_effects.current_working_perspective_apply_record_written, false);
assert.equal(replay.no_side_effects.applied_current_working_perspective_snapshot_written, false);
assert.equal(replay.no_side_effects.current_working_perspective_update_applied_to_local_snapshot, false);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(replay.no_side_effects[field], false, `replay ${field}`);
}
assert.equal(
  applyWrite.writeCurrentWorkingPerspectiveApplyRecordV01(
    buildWriteInput(readyDecision, { notes: ["note:conflict"] }),
    { db },
  ).status,
  "refused",
);
assert.equal(
  applyWrite.readCurrentWorkingPerspectiveApplyRecordByIdV01(
    writeResult.record.record_id,
    { db },
  ).record.record_id,
  writeResult.record.record_id,
);
assert.equal(
  applyWrite.readCurrentWorkingPerspectiveApplyRecordByIdempotencyKeyV01(
    idempotencyKey,
    { db },
  ).record.record_id,
  writeResult.record.record_id,
);
assert.equal(
  applyWrite.readCurrentWorkingPerspectiveApplyRecordByAppliedSnapshotRefV01(
    writeResult.applied_snapshot.applied_snapshot_ref,
    { db },
  ).applied_snapshot.applied_snapshot_ref,
  writeResult.applied_snapshot.applied_snapshot_ref,
);
assert.equal(
  applyWrite.readLatestAppliedCurrentWorkingPerspectiveSnapshotV01({ db })
    .applied_snapshot.applied_snapshot_ref,
  writeResult.applied_snapshot.applied_snapshot_ref,
);
db.close();

const outOfScopeDb = new Database(":memory:");
applyWrite.ensureCurrentWorkingPerspectiveApplyWriteSchemaV01(outOfScopeDb);
outOfScopeDb.prepare(
  `INSERT INTO current_working_perspective_apply_records (
    record_id, idempotency_key, created_at, scope, operator_ref,
    record_fingerprint, applied_snapshot_ref, record_json, applied_snapshot_json, receipt_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
).run(
  "out-of-scope:cwp-apply",
  idempotencyKey,
  AS_OF,
  "project:other",
  operatorRef,
  "fingerprint:other",
  "snapshot:other",
  JSON.stringify({ ...writeResult.record, scope: "project:other" }),
  JSON.stringify({ ...writeResult.applied_snapshot, scope: "project:other" }),
  JSON.stringify(writeResult.receipt),
);
const outOfScopeReplay = applyWrite.writeCurrentWorkingPerspectiveApplyRecordV01(
  buildWriteInput(readyDecision),
  { db: outOfScopeDb },
);
assert.equal(outOfScopeReplay.status, "written");
assert.equal(
  applyWrite.listCurrentWorkingPerspectiveApplyRecordsV01({
    db: outOfScopeDb,
  }).records.some((record) => record.scope !== "project:augnes"),
  false,
);
outOfScopeDb.close();

assert.equal(buildCurrentWorkingPerspectiveApplyRecordReviewV01().review_status, "no_records");
const review = buildCurrentWorkingPerspectiveApplyRecordReviewV01({
  store_result: writeResult,
});
assert.equal(review.review_status, "records_available");
assert.equal(review.applied_snapshots.length, 1);
assert.equal(
  buildCurrentWorkingPerspectiveApplyRecordReviewV01({
    store_result: writeResult,
    selected_applied_snapshot_ref: writeResult.applied_snapshot.applied_snapshot_ref,
  }).review_status,
  "selected_applied_snapshot_found",
);
assert.equal(
  buildCurrentWorkingPerspectiveApplyRecordReviewV01({ records: [{ nope: true }] })
    .review_status,
  "records_invalid",
);
const badSnapshotRecord = structuredClone(writeResult.record);
badSnapshotRecord.applied_snapshot = { snapshot_version: "bad" };
assert.equal(
  buildCurrentWorkingPerspectiveApplyRecordReviewV01({ records: [badSnapshotRecord] })
    .review_status,
  "records_invalid",
);
const malformedRecordCwp = structuredClone(writeResult.record);
malformedRecordCwp.applied_current_working_perspective = {};
let malformedReview = buildCurrentWorkingPerspectiveApplyRecordReviewV01({
  records: [malformedRecordCwp],
});
assert.equal(malformedReview.review_status, "records_invalid");
assert(
  malformedReview.record_summaries[0].problem_reasons.includes(
    "current_working_perspective_apply_record_applied_cwp_malformed",
  ),
);
const malformedSnapshotCwp = structuredClone(writeResult.record);
malformedSnapshotCwp.applied_snapshot.applied_current_working_perspective = {};
malformedReview = buildCurrentWorkingPerspectiveApplyRecordReviewV01({
  records: [malformedSnapshotCwp],
});
assert.equal(malformedReview.review_status, "records_invalid");
assert(
  malformedReview.record_summaries[0].problem_reasons.includes(
    "current_working_perspective_applied_snapshot_cwp_malformed",
  ),
);
assert(
  malformedReview.applied_snapshots.length === 0 ||
    malformedReview.latest_applied_snapshot_summary.problem_reasons.includes(
      "current_working_perspective_applied_snapshot_cwp_malformed",
    ),
);
const snapshotRefMismatch = structuredClone(writeResult.record);
snapshotRefMismatch.applied_snapshot.applied_snapshot_ref =
  "current-working-perspective-applied-snapshot:mismatch";
malformedReview = buildCurrentWorkingPerspectiveApplyRecordReviewV01({
  records: [snapshotRefMismatch],
});
assert.equal(malformedReview.review_status, "records_invalid");
assert(
  malformedReview.record_summaries[0].problem_reasons.includes(
    "current_working_perspective_apply_record_snapshot_ref_mismatch",
  ),
);
const snapshotContractMismatch = structuredClone(writeResult.record);
snapshotContractMismatch.applied_snapshot.source_contract_record_ref =
  "cwp-update-contract-record:mismatch";
malformedReview = buildCurrentWorkingPerspectiveApplyRecordReviewV01({
  records: [snapshotContractMismatch],
});
assert.equal(malformedReview.review_status, "records_invalid");
assert(
  malformedReview.record_summaries[0].problem_reasons.includes(
    "current_working_perspective_apply_record_source_contract_ref_mismatch",
  ),
);
const snapshotPatchCountMismatch = structuredClone(writeResult.record);
snapshotPatchCountMismatch.applied_snapshot.applied_patch_count += 1;
malformedReview = buildCurrentWorkingPerspectiveApplyRecordReviewV01({
  records: [snapshotPatchCountMismatch],
});
assert.equal(malformedReview.review_status, "records_invalid");
assert(
  malformedReview.record_summaries[0].problem_reasons.includes(
    "current_working_perspective_apply_record_patch_count_mismatch",
  ),
);
const snapshotCwpMismatch = structuredClone(writeResult.record);
snapshotCwpMismatch.applied_snapshot.applied_current_working_perspective =
  structuredClone(
    snapshotCwpMismatch.applied_snapshot.applied_current_working_perspective,
  );
snapshotCwpMismatch.applied_snapshot.applied_current_working_perspective.as_of =
  "2026-07-07T00:00:00.000Z";
malformedReview = buildCurrentWorkingPerspectiveApplyRecordReviewV01({
  records: [snapshotCwpMismatch],
});
assert.equal(malformedReview.review_status, "records_invalid");
assert(
  malformedReview.record_summaries[0].problem_reasons.includes(
    "current_working_perspective_apply_record_snapshot_cwp_mismatch",
  ),
);
const corruptStore = structuredClone(writeResult);
corruptStore.no_side_effects.memory_written = true;
assert.equal(
  buildCurrentWorkingPerspectiveApplyRecordReviewV01({ store_result: corruptStore })
    .review_status,
  "records_invalid",
);
const forgedAuthority = structuredClone(writeResult.record);
forgedAuthority.authority_boundary.can_replace_current_working_perspective_route_response = true;
assert.equal(
  buildCurrentWorkingPerspectiveApplyRecordReviewV01({ records: [forgedAuthority] })
    .review_status,
  "records_invalid",
);
const forgedMutation = structuredClone(writeResult.record);
forgedMutation.mutation_boundary.upstream_current_working_perspective_source_tables_mutated = true;
assert.equal(
  buildCurrentWorkingPerspectiveApplyRecordReviewV01({ records: [forgedMutation] })
    .review_status,
  "records_invalid",
);
const forgedProfile = structuredClone(writeResult.record);
forgedProfile.authority_profile.metric_update_performed = true;
assert.equal(
  buildCurrentWorkingPerspectiveApplyRecordReviewV01({ records: [forgedProfile] })
    .review_status,
  "records_invalid",
);
const rawRecord = structuredClone(writeResult.record);
rawRecord.raw_text = "nope";
assert.equal(
  buildCurrentWorkingPerspectiveApplyRecordReviewV01({ records: [rawRecord] })
    .review_status,
  "records_invalid",
);

assert.equal(
  readAppliedCurrentWorkingPerspectiveForWebV01().status,
  "no_applied_snapshot",
);
assert.equal(
  readAppliedCurrentWorkingPerspectiveForWebV01({ store_result: writeResult })
    .summary.applied_snapshot_ref,
  writeResult.applied_snapshot.applied_snapshot_ref,
);

const routeDbPath = ".tmp/current-working-perspective-applies/smoke-route.sqlite";
rmSync(path.join(root, routeDbPath), { force: true });
assert.equal(route.isSafeCurrentWorkingPerspectiveApplyRouteDbPathV01("../bad.sqlite"), false);
let response = await route.POST(
  new Request("http://localhost/api/workplane/current-working-perspective-applies", {
    method: "POST",
    headers: sameOriginHeaders(),
    body: "{",
  }),
);
assert.equal(response.status, 400);
response = await route.POST(
  new Request("http://localhost/api/workplane/current-working-perspective-applies", {
    method: "POST",
    headers: sameOriginHeaders(),
    body: JSON.stringify([]),
  }),
);
assert.equal(response.status, 400);
response = await route.POST(
  new Request("http://localhost/api/workplane/current-working-perspective-applies", {
    method: "POST",
    headers: sameOriginHeaders(),
    body: JSON.stringify({ action: "apply", db_path: routeDbPath }),
  }),
);
assert.equal(response.status, 400);
response = await route.POST(
  new Request("http://localhost/api/workplane/current-working-perspective-applies", {
    method: "POST",
    headers: {
      host: "localhost",
      origin: "http://evil.example",
      "sec-fetch-site": "cross-site",
    },
    body: JSON.stringify({ action: "write", db_path: routeDbPath, input: buildWriteInput(readyDecision) }),
  }),
);
assert.equal(response.status, 403);
response = await route.POST(
  new Request("http://localhost/api/workplane/current-working-perspective-applies", {
    method: "POST",
    headers: sameOriginHeaders(),
    body: JSON.stringify({ action: "write", db_path: routeDbPath, input: { nope: true } }),
  }),
);
assert.equal(response.status, 400);
assert.equal(existsSync(path.join(root, routeDbPath)), false);
response = await route.POST(
  new Request("http://localhost/api/workplane/current-working-perspective-applies", {
    method: "POST",
    headers: {
      host: "internal.test",
      "x-forwarded-host": "localhost:3000",
      origin: "http://localhost:3000",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify({ action: "write", db_path: routeDbPath, input: buildWriteInput(readyDecision) }),
  }),
);
assert.equal(response.status, 201);
let body = await response.json();
assert.equal(body.store_result.status, "written");
assert.equal(body.current_working_perspective_apply_record_written, true);
assert.equal(body.applied_current_working_perspective_snapshot_written, true);
assert.equal(body.upstream_current_working_perspective_source_tables_mutated, false);
response = await route.POST(
  new Request("http://localhost/api/workplane/current-working-perspective-applies", {
    method: "POST",
    headers: sameOriginHeaders(),
    body: JSON.stringify({ action: "write", db_path: routeDbPath, input: buildWriteInput(readyDecision) }),
  }),
);
assert.equal(response.status, 200);
body = await response.json();
assert.equal(body.store_result.status, "idempotent_existing");
assert.equal(body.current_working_perspective_apply_record_written, false);
assert.equal(body.applied_current_working_perspective_snapshot_written, false);
assert.equal(
  body.no_side_effects.current_working_perspective_apply_record_written,
  false,
);
assert.equal(
  body.no_side_effects.applied_current_working_perspective_snapshot_written,
  false,
);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(body.no_side_effects[field], false, `route replay ${field}`);
}
response = await route.GET(
  new Request(
    `http://localhost/api/workplane/current-working-perspective-applies?db_path=${encodeURIComponent(
      routeDbPath,
    )}&applied_snapshot_ref=${encodeURIComponent(
      writeResult.applied_snapshot.applied_snapshot_ref,
    )}`,
  ),
);
assert.equal([200, 404].includes(response.status), true);
response = await route.GET(
  new Request(
    `http://localhost/api/workplane/current-working-perspective-applies?db_path=${encodeURIComponent(
      routeDbPath,
    )}&latest_applied_snapshot=true`,
  ),
);
assert.equal(response.status, 200);
rmSync(path.join(root, routeDbPath), { force: true });

const panelFiles = [
  "components/workplane/current-working-perspective-apply-preview-panel.tsx",
  "components/workplane/current-working-perspective-apply-decision-panel.tsx",
  "components/workplane/current-working-perspective-apply-record-review-panel.tsx",
  "components/workplane/applied-current-working-perspective-panel.tsx",
];
for (const file of panelFiles) {
  const text = readFileSync(path.join(root, file), "utf8");
  assert(!text.includes("<button"), `${file} renders a button`);
  assert(!/onClick\\s*=/.test(text), `${file} includes onClick`);
  assert(!/onClick.*(import|apply|approve|send|launch|run|execute|merge|write)/i.test(text));
}

const overview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  current_working_perspective_update_contract_record_review:
    buildContractRecordReview(),
  current_working_perspective_apply_preview: readyPreview,
  current_working_perspective_apply_decision_preview: readyDecision,
  current_working_perspective_apply_record_review: review,
  applied_current_working_perspective_read:
    readAppliedCurrentWorkingPerspectiveForWebV01({ store_result: writeResult }),
  scope: "project:augnes",
  as_of: AS_OF,
  source_refs: sourceRefs,
});
const stepIds = overview.spine_steps.map((step) => step.step_id);
for (const step of [
  "current_working_perspective_apply_preview",
  "current_working_perspective_apply_decision",
  "current_working_perspective_apply_record",
  "applied_current_working_perspective_snapshot",
]) {
  assert(stepIds.includes(step), `overview missing ${step}`);
}
const overviewText = JSON.stringify(overview);
for (const action of [
  "review_current_working_perspective_apply_preview",
  "approve_current_working_perspective_apply_record",
  "write_current_working_perspective_apply_record",
  "review_current_working_perspective_apply_record",
  "review_applied_current_working_perspective_snapshot",
  "resolve_current_working_perspective_apply_blockers",
  "prepare_current_working_perspective_route_integration_contract",
]) {
  assert(repoText.includes(action) || overviewText.includes(action), `missing action ${action}`);
}
for (const forbidden of [
  "mutate_upstream_current_working_perspective_source_tables",
  "replace_api_perspective_current",
  "live_relay_update",
  "handoff_apply",
  "memory_write",
  "provider_called",
  "github_called",
  "codex_executed",
  "graph_or_vector_store_created",
]) {
  assert(!overview.recommended_next_operator_action.includes(forbidden), forbidden);
}

console.log("smoke-current-working-perspective-apply-slice-v0-1 passed");

function runtimeCwpRead() {
  return {
    source_status: "runtime",
    data: currentWorkingPerspective(),
    authority_boundary: currentWorkingPerspective().authority_boundary,
  };
}

function fixtureCwpRead() {
  return {
    source_status: "fixture_fallback",
    data: currentWorkingPerspective(),
    authority_boundary: currentWorkingPerspective().authority_boundary,
  };
}

function currentWorkingPerspective() {
  return {
    runtime: "augnes",
    perspective_version: "current_working_perspective.v0.1",
    projection_version: "augnes_delta_projection.v0.1",
    snapshot_version: "perspective_snapshot.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-05T00:00:00.000Z",
    current_frame: {
      summary: "Existing frame summary",
      primary_state_keys: ["state:one"],
      active_work_ids: ["work:one"],
      pressure_level: "medium",
      source_refs: ["source:cwp-frame"],
      non_authority_notes: ["existing-frame-note"],
    },
    current_thesis: {
      summary: "Existing thesis summary",
      supporting_points: ["existing point"],
      source_refs: ["source:cwp-thesis"],
      confidence: "bounded_read_model",
      non_authority_notes: [],
    },
    active_goals: [],
    accepted_assumptions: [],
    rejected_assumptions: [],
    open_questions: [],
    active_risks: [],
    research_pressure: {
      pressure_level: "medium",
      pending_proposal_count: 1,
      projection_gap_count: 1,
      diagnostic_refs: [],
      notes: [],
      non_authority_notes: [],
    },
    next_candidates: [],
    last_major_delta_refs: [],
    review_queue_hints: {
      needs_review_delta_ids: [],
      blocked_delta_ids: [],
      manual_review_delta_ids: [],
      validation_required_delta_ids: [],
      project_perspective_review_delta_ids: [],
      durable_memory_review_delta_ids: [],
      user_decision_delta_ids: [],
      notes: [],
    },
    source_refs: {
      perspective_snapshot: {
        snapshot_version: "perspective_snapshot.v0.1",
        as_of: "2026-07-05T00:00:00.000Z",
        source_refs: {
          state_brief_as_of: "2026-07-05T00:00:00.000Z",
          state_entry_ids: ["state:one"],
          pending_proposal_ids: [],
          evidence_ids: ["evidence:cwp"],
          work_ids: ["work:one"],
          work_event_ids: [],
          action_record_ids: [],
          tension_ids: [],
          execution_lane_ids: [],
        },
      },
      delta_projection: {
        projection_version: "augnes_delta_projection.v0.1",
        as_of: "2026-07-05T00:00:00.000Z",
        source_refs: {
          delta_ids: [],
          batch_ids: [],
          projection_gap_codes: [],
        },
        source_counts: {
          deltas: 0,
          batches: 0,
          gaps: 0,
        },
        delta_ids: [],
        batch_ids: [],
        gap_codes: [],
      },
      snapshot_refs: [],
      diagnostic_refs: [],
      project_constellation_refs: ["source:cwp-existing"],
    },
    staleness: {
      status: "partial",
      snapshot_as_of: "2026-07-05T00:00:00.000Z",
      projection_as_of: "2026-07-05T00:00:00.000Z",
      freshness_notes: ["existing gap preserved"],
      source_gap_codes: ["gap:existing"],
    },
    gaps: [
      {
        code: "gap:existing",
        severity: "medium",
        summary: "Existing gap",
        source_refs: ["source:cwp-gap"],
      },
    ],
    authority_boundary: {
      source_of_truth: false,
      derived_view_only: true,
      can_read_db: true,
      can_write_db: false,
      can_add_route: false,
      can_add_ui: false,
      can_apply_project_perspective: false,
      can_mutate_memory: false,
      can_call_github: false,
      can_call_openai_or_provider: false,
      can_execute_codex: false,
      can_create_branch_or_pr: false,
      notes: ["read-only derived CWP"],
    },
    next_phase_notes: ["existing next phase"],
  };
}

function buildContractRecordReview(overrides = {}) {
  const record = contractRecord();
  return {
    review_version: "current_working_perspective_update_contract_record_review.v0.1",
    scope: "project:augnes",
    as_of: AS_OF,
    source_refs: sourceRefs,
    review_status: "records_available",
    input_summary: {
      valid_record_count: 1,
      selected_record_id: null,
      selected_record_found: false,
    },
    record_summaries: [],
    selected_record_summary: null,
    latest_record_summary: {
      record_id: record.record_id,
      created_at: record.created_at,
      proposed_patch_entry_count: record.proposed_patch_entry_count,
    },
    records: [record],
    evidence_summary: {
      evidence_refs: evidenceRefs,
      missing_evidence: [],
      has_receipt_side_effect_problem: false,
      has_records: true,
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    ...overrides,
  };
}

function contractRecord() {
  const patchEntries = [
    patchEntry("patch:cwp-thesis", "current_thesis", "add", "Add a source-backed thesis point."),
    patchEntry("patch:cwp-risk", "active_risks", "warn", "Warn about missing route integration evidence."),
    patchEntry("patch:cwp-next", "next_candidates", "align", "Review applied snapshot before handoff planning."),
    patchEntry("patch:cwp-gap", "staleness_and_gaps", "warn", "Preserve existing gaps until route integration is reviewed."),
  ];
  return {
    record_version: "current_working_perspective_update_contract_record.v0.1",
    record_id: "cwp-update-contract-record:valid",
    idempotency_key: "idempotency:cwp-contract",
    created_at: AS_OF,
    scope: "project:augnes",
    operator_ref: "operator:cwp-contract",
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    source_current_working_perspective_ref: "current-working-perspective:base",
    proposed_current_working_perspective_update_contract: {
      contract_kind: "current_working_perspective_update_contract.v0.1",
      current_cwp_ref: "current-working-perspective:base",
      source_cwp_version: "current_working_perspective.v0.1",
      proposed_update_basis: {
        perspective_unit_record_refs: ["perspective-unit-record:one"],
        next_work_bias_record_refs: ["next-work-bias-record:one"],
        continuity_relay_record_refs: ["continuity-relay-record:one"],
        perspective_relay_update_decision_record_refs: [],
        perspective_relay_update_write_contract_preview_ref: null,
      },
      field_update_contracts: {},
      proposed_patch_entries: patchEntries,
      expected_cwp_effect_summary: [],
      required_source_refs: sourceRefs,
      required_evidence_refs: evidenceRefs,
      blocked_live_mutations: [],
      future_apply_requirements: [],
    },
    proposed_patch_entries: patchEntries,
    proposed_patch_entry_count: patchEntries.length,
    record_fingerprint: "fingerprint:cwp-update-contract",
  };
}

function patchEntry(patch_ref, patch_target, patch_operation, summary) {
  return {
    patch_ref,
    patch_target,
    patch_operation,
    summary,
    source_record_refs: ["cwp-update-contract-record:valid"],
    evidence_refs: evidenceRefs,
    source_refs: sourceRefs,
    review_pressure: patch_operation === "warn" ? "high" : "medium",
    authority_required: "future_current_working_perspective_apply",
    persistence_horizon: "current_working_perspective_update_contract_record",
  };
}

function contractRecordWithoutEvidence() {
  const record = contractRecord();
  return {
    ...record,
    evidence_refs: [],
    proposed_current_working_perspective_update_contract: {
      ...record.proposed_current_working_perspective_update_contract,
      required_evidence_refs: [],
      proposed_patch_entries: record.proposed_patch_entries.map((entry) => ({
        ...entry,
        evidence_refs: [],
      })),
    },
    proposed_patch_entries: record.proposed_patch_entries.map((entry) => ({
      ...entry,
      evidence_refs: [],
    })),
  };
}

function sameOriginHeaders() {
  return {
    host: "localhost",
    origin: "http://localhost",
    "sec-fetch-site": "same-origin",
  };
}

async function gitChangedFiles() {
  const { execFileSync } = await import("node:child_process");
  return execFileSync("git", ["diff", "--name-only", "main...HEAD"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
