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
  decisionType: "types/reuse-outcome-bridge-decision.ts",
  decisionHelper: "lib/dogfooding/reuse-outcome-bridge-decision.ts",
  decisionPanel: "components/dogfooding/reuse-outcome-bridge-decision-panel.tsx",
  writeType: "types/reuse-outcome-bridge-ledger-write.ts",
  writeHelper: "lib/dogfooding/reuse-outcome-bridge-ledger-write.ts",
  route: "app/api/dogfooding/reuse-outcome-bridge-ledger/route.ts",
  reviewType: "types/reuse-outcome-bridge-ledger-record-review.ts",
  reviewHelper: "lib/dogfooding/reuse-outcome-bridge-ledger-record-review.ts",
  reviewForWeb:
    "lib/dogfooding/read-reuse-outcome-bridge-ledger-record-review-for-web.ts",
  reviewPanel:
    "components/dogfooding/reuse-outcome-bridge-ledger-record-review-panel.tsx",
  ledgerType: "types/handoff-reuse-outcome-ledger.ts",
  ledgerHelper: "lib/dogfooding/handoff-reuse-outcome-ledger.ts",
  expectedObservedRoute: "app/api/dogfooding/expected-observed-deltas/route.ts",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  overviewType: "types/workbench-dogfood-loop-spine-overview.ts",
  overviewHelper: "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  agentWorkplaneSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  expectedObservedSmoke:
    "scripts/smoke-expected-observed-delta-reuse-outcome-bridge-v0-1.mjs",
  overviewSmoke: "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
  smoke: "scripts/smoke-reuse-outcome-bridge-ledger-integration-v0-1.mjs",
  packageJson: "package.json",
};

const textByFile = loadTextByFile(Object.values(files));
const packageJsonText = textByFile.get(files.packageJson);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:reuse-outcome-bridge-ledger-integration-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-reuse-outcome-bridge-ledger-integration-v0-1.mjs",
});

assertContainsAll(
  [
    files.decisionType,
    files.decisionHelper,
    files.writeType,
    files.writeHelper,
    files.route,
    files.reviewType,
    files.reviewHelper,
    files.reviewForWeb,
    files.ledgerType,
    files.ledgerHelper,
  ]
    .map((file) => textByFile.get(file))
    .join("\n"),
  [
    "reuse_outcome_bridge_operator_decision_preview.v0.1",
    "handoff_reuse_outcome_ledger_record.v0.1",
    "handoff_reuse_outcome_ledger_write_receipt.v0.1",
    "handoff_reuse_outcome_ledger_store.v0.1",
  ],
  { label: "reuse outcome bridge ledger files" },
);

assertContainsAll(textByFile.get(files.agentWorkplane), [
  "ReuseOutcomeBridgeDecisionPanel",
  "ReuseOutcomeBridgeLedgerRecordReviewPanel",
  "buildReuseOutcomeBridgeOperatorDecisionPreviewV01",
  "readReuseOutcomeBridgeLedgerRecordReviewForWebV01",
  "reuse_outcome_bridge_operator_decision_preview:",
  "reuse_outcome_bridge_ledger_record_review:",
]);
assertContainsAll(textByFile.get(files.overviewType), [
  "reuse_outcome_bridge_operator_decision",
  "handoff_reuse_outcome_ledger_record",
  "review_reuse_outcome_bridge_decision",
  "write_handoff_reuse_outcome_ledger_record",
  "review_handoff_reuse_outcome_ledger_record",
  "resolve_reuse_outcome_bridge_blockers",
  "prepare_dogfood_metric_candidate_preview",
]);
assertContainsAll(textByFile.get(files.overviewHelper), [
  "reuseOutcomeBridgeOperatorDecisionStep",
  "handoffReuseOutcomeLedgerRecordStep",
  "selected_record_found",
]);
assertContainsAll(textByFile.get(files.expectedObservedRoute), [
  "x-forwarded-host",
  "effectiveHost",
]);

for (const panel of [
  files.decisionPanel,
  files.reviewPanel,
  files.agentWorkplane,
]) {
  const text = textByFile.get(panel);
  assert(!text.includes("<button"), `${panel} must not render buttons`);
  assert(
    !/onClick\s*=\{[^}]*\b(import|apply|approve|send|launch|run|execute|merge)\b/i.test(
      text,
    ),
    `${panel} must not add action click handlers`,
  );
}

const { buildReuseOutcomeBridgeOperatorDecisionPreviewV01 } = await import(
  "../lib/dogfooding/reuse-outcome-bridge-decision.ts"
);
const bridgeWrite = await import(
  "../lib/dogfooding/reuse-outcome-bridge-ledger-write.ts"
);
const ledger = await import(
  "../lib/dogfooding/handoff-reuse-outcome-ledger.ts"
);
const review = await import(
  "../lib/dogfooding/reuse-outcome-bridge-ledger-record-review.ts"
);
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);
const bridgeRoute = await import(
  "../app/api/dogfooding/reuse-outcome-bridge-ledger/route.ts"
);
const expectedObservedRoute = await import(
  "../app/api/dogfooding/expected-observed-deltas/route.ts"
);

const emptyDecision = buildReuseOutcomeBridgeOperatorDecisionPreviewV01();
assert.equal(emptyDecision.decision_preview_status, "no_reuse_outcome_bridge_preview");
assert.doesNotThrow(() =>
  buildReuseOutcomeBridgeOperatorDecisionPreviewV01({
    reuse_outcome_candidate_bridge_preview: {
      preview_version: "wrong.version",
    },
  }),
);

const bridgePreview = makeBridgePreview();
const deltaRecordReview = makeDeltaRecordReview();
const candidateOnlyDecision = buildReuseOutcomeBridgeOperatorDecisionPreviewV01({
  reuse_outcome_candidate_bridge_preview: bridgePreview,
  expected_observed_delta_record_review: deltaRecordReview,
  selected_reuse_candidate_refs: ["reuse-outcome-bridge:not-present:1"],
  requested_operator_ref: "operator:reuse-bridge",
  requested_idempotency_key: "idempotency:reuse-bridge",
  review_confirmation_ref: "review:reuse-bridge",
  source_refs: ["source:reuse-bridge-decision"],
});
assert.notEqual(
  candidateOnlyDecision.decision_preview_status,
  "ready_for_future_reuse_ledger_write",
);
assert(
  candidateOnlyDecision.refusal_reasons.includes(
    "selected_reuse_candidate_refs_not_in_bridge_preview",
  ),
);

const selectableRef =
  buildReuseOutcomeBridgeOperatorDecisionPreviewV01({
    reuse_outcome_candidate_bridge_preview: bridgePreview,
    expected_observed_delta_record_review: deltaRecordReview,
  }).would_write_reuse_ledger_record_preview.selectable_reuse_candidate_refs[0];
const readyDecision = buildReuseOutcomeBridgeOperatorDecisionPreviewV01({
  reuse_outcome_candidate_bridge_preview: bridgePreview,
  expected_observed_delta_record_review: deltaRecordReview,
  selected_reuse_candidate_refs: [selectableRef],
  requested_operator_ref: "operator:reuse-bridge",
  requested_idempotency_key: "idempotency:reuse-bridge",
  review_confirmation_ref: "review:reuse-bridge",
  source_refs: ["source:reuse-bridge-decision"],
});
assert.equal(
  readyDecision.decision_preview_status,
  "ready_for_future_reuse_ledger_write",
);
assert.equal(readyDecision.write_readiness.write_ready, true);
assert.equal(
  readyDecision.recommended_operator_decision,
  "approve_for_reuse_outcome_ledger_write",
);

const validInput = cleanWriteInput(readyDecision);
assert.equal(
  bridgeWrite.validateReuseOutcomeBridgeLedgerWriteInputV01(validInput).ok,
  true,
);
assertRefused({
  input: cleanWriteInput(
    buildReuseOutcomeBridgeOperatorDecisionPreviewV01({
      reuse_outcome_candidate_bridge_preview: bridgePreview,
      expected_observed_delta_record_review: deltaRecordReview,
    }),
  ),
  reason: "decision_preview_not_ready_for_future_reuse_ledger_write",
});
assertRefused({
  input: {
    ...validInput,
    operator_approval: {
      ...validInput.operator_approval,
      checklist_confirmations: [],
    },
  },
  reason: "checklist_confirmations_missing",
});
assertRefused({
  input: { ...validInput, idempotency_key: "idempotency:reuse-mismatch" },
  reason: "idempotency_key_mismatch_with_decision_preview",
});
assertRefused({
  input: {
    ...validInput,
    operator_approval: {
      ...validInput.operator_approval,
      operator_ref: "operator:other",
    },
  },
  reason: "operator_ref_mismatch_with_decision_preview",
});
assertRefused({
  input: mutateDecisionMaterial(validInput, {
    source_refs: ["source:../private"],
  }),
  reason: "source_refs_unsafe",
});
assertRefused({
  input: {
    ...validInput,
    decision_preview: {
      ...validInput.decision_preview,
      source_refs: ["source:../unsafe"],
    },
  },
  reason: "decision_preview_source_refs_unsafe",
});
const unknownBucketInput = structuredClone(validInput);
unknownBucketInput.decision_preview.would_write_reuse_ledger_record_preview.all_reuse_candidate_summaries[0].bucket =
  "unknown_but_safe";
assertRefused({
  input: unknownBucketInput,
  reason: "reuse_candidate_summary_bucket_invalid",
});
assertRefused({
  input: { ...validInput, notes: ["raw_text"] },
  reason: "raw_or_private_marker_material_refused",
});
assertRefused({
  input: { ...validInput, notes: ["sample"] },
  reason: "sample_fixture_default_or_workbench_material_refused",
});
assertRefused({
  input: {
    ...validInput,
    requested_side_effects: { dogfood_metrics_written: true },
  },
  reason: "requested_side_effect_not_allowed",
});

const dbPath = ".tmp/dogfood-reuse-ledger/reuse-bridge-clean.sqlite";
mkdirSync(".tmp/dogfood-reuse-ledger", { recursive: true });
rmSync(dbPath, { force: true });
const db = new Database(dbPath);
try {
  const schemaBefore = bridgeWrite.listReuseOutcomeBridgeLedgerRecordsV01(
    {},
    { db },
  );
  assert.equal(schemaBefore.status, "schema_missing");
  assert.equal(ledger.handoffReuseOutcomeLedgerStoreSchemaExistsV01(db), false);
  const written = bridgeWrite.writeReuseOutcomeBridgeLedgerRecordV01(validInput, {
    db,
  });
  assert.equal(written.status, "written");
  assert.equal(written.record.record_version, "handoff_reuse_outcome_ledger_record.v0.1");
  assert.equal(written.no_side_effects.reuse_outcome_ledger_written, true);
  assert.equal(
    written.no_side_effects.handoff_reuse_outcome_ledger_record_written,
    true,
  );
  assertForbiddenSideEffectsFalse(written.no_side_effects);
  assert.equal(
    bridgeWrite.writeReuseOutcomeBridgeLedgerRecordV01(validInput, { db }).status,
    "idempotent_existing",
  );
  assert.equal(
    bridgeWrite.writeReuseOutcomeBridgeLedgerRecordV01(
      { ...validInput, notes: ["different-clean-note"] },
      { db },
    ).status,
    "refused",
  );
  assert.equal(
    bridgeWrite.readReuseOutcomeBridgeLedgerRecordByIdV01(
      written.record.record_id,
      { db },
    ).status,
    "read",
  );
  assert.equal(
    bridgeWrite.readReuseOutcomeBridgeLedgerRecordByIdempotencyKeyV01(
      validInput.idempotency_key,
      { db },
    ).status,
    "read",
  );
  assert.equal(
    bridgeWrite.listReuseOutcomeBridgeLedgerRecordsV01({}, { db }).status,
    "listed",
  );

  const noRecordsReview = review.buildReuseOutcomeBridgeLedgerRecordReviewV01({
    records: [],
  });
  assert.equal(noRecordsReview.review_status, "no_records");
  const recordsReview = review.buildReuseOutcomeBridgeLedgerRecordReviewV01({
    records: [written.record],
  });
  assert.equal(recordsReview.review_status, "records_available");
  assert.equal(recordsReview.input_summary.valid_record_count, 1);
  const malformedReview = review.buildReuseOutcomeBridgeLedgerRecordReviewV01({
    records: [{}],
  });
  assert.equal(malformedReview.review_status, "records_invalid");
  const forbiddenRecord = structuredClone(written.record);
  forbiddenRecord.authority_boundary.can_update_metrics = true;
  const forbiddenReview = review.buildReuseOutcomeBridgeLedgerRecordReviewV01({
    records: [forbiddenRecord],
  });
  assert.equal(forbiddenReview.review_status, "records_invalid");
  const corruptReceiptStoreResult = structuredClone(written);
  corruptReceiptStoreResult.receipt.no_metric_update = false;
  const corruptReceiptReview =
    review.buildReuseOutcomeBridgeLedgerRecordReviewV01({
      store_result: corruptReceiptStoreResult,
    });
  assert.equal(corruptReceiptReview.review_status, "records_invalid");
  assert(
    corruptReceiptReview.input_summary.receipt_side_effect_problem_count > 0,
  );
  assert.equal(
    corruptReceiptReview.evidence_summary.has_receipt_side_effect_problem,
    true,
  );
  assert(
    corruptReceiptReview.blocked_reasons.includes(
      "reuse_ledger_receipt_no_side_effects_invalid",
    ) ||
      corruptReceiptReview.blocked_reasons.includes(
        "reuse_ledger_receipt_forbidden_side_effect_claim_present",
      ),
  );
} finally {
  db.close();
}

const missingDbGet = await bridgeRoute.GET(
  new Request("http://localhost/api?db_path=.tmp/dogfood-reuse-ledger/missing.sqlite"),
);
assert.equal(missingDbGet.status, 404);
const unsafeGet = await bridgeRoute.GET(
  new Request("http://localhost/api?db_path=../private.sqlite"),
);
assert.equal(unsafeGet.status, 400);
const crossSitePost = await bridgeRoute.POST(
  jsonRequest("http://internal/api", { action: "write" }, {
    host: "internal",
    origin: "http://evil.example",
    "sec-fetch-site": "cross-site",
  }),
);
assert.equal(crossSitePost.status, 403);
const invalidActionPost = await bridgeRoute.POST(
  jsonRequest("http://localhost/api", { action: "bad" }),
);
assert.equal(invalidActionPost.status, 400);
const invalidJsonPost = await bridgeRoute.POST(
  new Request("http://localhost/api", {
    method: "POST",
    headers: { host: "localhost", origin: "http://localhost" },
    body: "{",
  }),
);
assert.equal(invalidJsonPost.status, 400);
const invalidObjectPost = await bridgeRoute.POST(
  new Request("http://localhost/api", {
    method: "POST",
    headers: { host: "localhost", origin: "http://localhost" },
    body: "[]",
  }),
);
assert.equal(invalidObjectPost.status, 400);
const validationDbPath = ".tmp/dogfood-reuse-ledger/validation-before-open.sqlite";
rmSync(validationDbPath, { force: true });
const invalidWritePost = await bridgeRoute.POST(
  jsonRequest("http://localhost/api", {
    action: "write",
    db_path: validationDbPath,
    input: {},
  }),
);
assert.equal(invalidWritePost.status, 400);
assert.equal(existsSync(validationDbPath), false);
const routeDbPath = ".tmp/dogfood-reuse-ledger/reuse-bridge-route.sqlite";
rmSync(routeDbPath, { force: true });
const validRoutePost = await bridgeRoute.POST(
  jsonRequest("http://localhost/api", {
    action: "write",
    db_path: routeDbPath,
    input: {
      ...validInput,
      idempotency_key: "idempotency:reuse-bridge-route",
      decision_preview: {
        ...validInput.decision_preview,
        would_write_reuse_ledger_record_preview: {
          ...validInput.decision_preview.would_write_reuse_ledger_record_preview,
          requested_idempotency_key: "idempotency:reuse-bridge-route",
        },
      },
    },
  }),
);
assert.equal(validRoutePost.status, 201);
const validRouteJson = await validRoutePost.json();
assert.equal(validRouteJson.no_side_effects.reuse_outcome_ledger_written, true);
assertForbiddenSideEffectsFalse(validRouteJson.no_side_effects);

const proxiedExpectedObserved = await expectedObservedRoute.POST(
  jsonRequest(
    "http://internal/api",
    { action: "bad" },
    {
      host: "internal",
      "x-forwarded-host": "public.example",
      origin: "http://public.example",
      "sec-fetch-site": "same-origin",
    },
  ),
);
assert.equal(proxiedExpectedObserved.status, 400);
const crossSiteExpectedObserved = await expectedObservedRoute.POST(
  jsonRequest(
    "http://internal/api",
    { action: "bad" },
    {
      host: "internal",
      "x-forwarded-host": "public.example",
      origin: "http://evil.example",
      "sec-fetch-site": "cross-site",
    },
  ),
);
assert.equal(crossSiteExpectedObserved.status, 403);

const selectedDeltaOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  expected_observed_delta_record_review: {
    ...makeDeltaRecordReview(),
    review_status: "selected_record_found",
  },
});
assert.notEqual(
  stepById(selectedDeltaOverview, "expected_observed_delta_record").status,
  "insufficient_data",
);

const defaultOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({});
assert.equal(
  stepById(defaultOverview, "handoff_reuse_outcome_ledger_record").status,
  "not_supplied",
);
const bridgeDecisionOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  reuse_outcome_candidate_bridge_preview: bridgePreview,
  reuse_outcome_bridge_operator_decision_preview: readyDecision,
  reuse_outcome_bridge_ledger_record_review:
    review.buildReuseOutcomeBridgeLedgerRecordReviewV01({ records: [] }),
});
assert.equal(
  stepById(
    bridgeDecisionOverview,
    "handoff_reuse_outcome_ledger_record",
  ).recommended_next_action,
  "write_handoff_reuse_outcome_ledger_record",
);
const recordOverviewDb = new Database(":memory:");
let bridgeLedgerRecordForOverview;
try {
  bridgeLedgerRecordForOverview = bridgeWrite.writeReuseOutcomeBridgeLedgerRecordV01(
    {
      ...validInput,
      idempotency_key: "idempotency:reuse-bridge-overview",
      decision_preview: {
        ...validInput.decision_preview,
        would_write_reuse_ledger_record_preview: {
          ...validInput.decision_preview.would_write_reuse_ledger_record_preview,
          requested_idempotency_key: "idempotency:reuse-bridge-overview",
        },
      },
    },
    { db: recordOverviewDb },
  ).record;
} finally {
  recordOverviewDb.close();
}
const recordOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  reuse_outcome_candidate_bridge_preview: bridgePreview,
  reuse_outcome_bridge_operator_decision_preview: readyDecision,
  reuse_outcome_bridge_ledger_record_review:
    review.buildReuseOutcomeBridgeLedgerRecordReviewV01({
      records: [bridgeLedgerRecordForOverview],
    }),
});
assert.equal(
  stepById(
    recordOverview,
    "handoff_reuse_outcome_ledger_record",
  ).recommended_next_action,
  "review_handoff_reuse_outcome_ledger_record",
);
assertNoForbiddenOverviewRecommendations(recordOverview);

const changedFiles = assertChangedFilesWithin({
  label: "reuse-outcome-bridge-ledger-integration-v0-1",
  allowedChangedFiles: [
    files.decisionType,
    files.decisionHelper,
    files.decisionPanel,
    files.writeType,
    files.writeHelper,
    files.route,
    files.reviewType,
    files.reviewHelper,
    files.reviewForWeb,
    files.reviewPanel,
    files.expectedObservedRoute,
    files.agentWorkplane,
    files.overviewType,
    files.overviewHelper,
    files.agentWorkplaneSmoke,
    files.expectedObservedSmoke,
    files.overviewSmoke,
    files.smoke,
    files.packageJson,
  ],
});

rmSync(".tmp/dogfood-reuse-ledger/reuse-bridge-clean.sqlite", { force: true });
rmSync(".tmp/dogfood-reuse-ledger/reuse-bridge-route.sqlite", { force: true });

console.log(
  JSON.stringify(
    {
      smoke: "reuse-outcome-bridge-ledger-integration-v0-1",
      pass: true,
      decision_checked: true,
      writer_checked: true,
      route_checked: true,
      review_checked: true,
      overview_checked: true,
      changed_files_checked: changedFiles.checked,
      changed_files_skipped: changedFiles.skipped,
      changed_files_observed: changedFiles.files,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:reuse-outcome-bridge-ledger-integration-v0-1");

function makeBridgePreview() {
  return {
    preview_version: "reuse_outcome_candidate_bridge_preview.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-05T12:00:00.000Z",
    source_refs: ["source:reuse-bridge-preview"],
    bridge_preview_status: "ready_for_operator_review",
    recommended_next_action: "prepare_reuse_outcome_operator_decision",
    input_summary: {
      has_expected_observed_delta_preview: true,
      has_expected_observed_delta_records: true,
      has_work_episode_residue_candidate_preview: true,
      has_codex_result_report_intake_records: true,
      delta_material_count: 2,
      bridge_candidate_count: 6,
      blocker_count: 0,
      insufficient_data_count: 0,
    },
    proposed_reuse_classifications: {
      helpful_refs: ["selected context helped identify expected delta"],
      stale_refs: ["old handoff wording was stale"],
      missing_refs: ["expected check detail was missing"],
      noisy_refs: ["changed files alone were noisy"],
      misleading_refs: ["skipped check looked complete"],
      unknown_refs: ["unknown reuse signal remains uncertain"],
    },
    proposed_handoff_quality_signals: {
      skipped_or_unverified_checks: ["typecheck not run in result report"],
      not_done_items: ["follow-up route hardening remained"],
      expected_observed_mismatches: ["expected smoke proof was missing"],
      requirement_progress_gaps: ["requirement progress needed operator review"],
      context_feedback_signals: ["bridge candidate reused delta record"],
    },
    carry_forward_candidates: {
      refs_to_preserve_next_time: ["preserve expected delta record ref"],
      refs_to_warn_next_time: ["warn about skipped checks"],
      refs_to_drop_or_deprioritize: ["drop noisy changed-file-only signal"],
      unresolved_gaps: ["resolve missing expected check"],
      next_focus_candidates: ["review bridge ledger record before metrics"],
    },
    evidence_summary: {
      has_delta_material: true,
      has_source_refs: true,
      has_evidence_refs: true,
      source_refs: ["source:reuse-bridge-preview"],
      evidence_refs: ["evidence:reuse-bridge"],
      missing_evidence: [],
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    operator_review_checklist: ["review bridge candidates"],
    would_not_write: ["does_not_write_reuse_outcome_ledger"],
    non_goals: ["dogfood_metric_write"],
    authority_boundary: {
      read_only: true,
      candidate_material_only: true,
      source_of_truth: false,
      derived_read_model: true,
      can_write_reuse_outcome_ledger: false,
      can_write_dogfood_metrics: false,
      can_write_expected_observed_delta: false,
      can_write_work_episode: false,
      can_write_memory: false,
      can_write_perspective_unit: false,
      can_write_next_work_bias: false,
      can_update_current_working_perspective: false,
      can_update_continuity_relay: false,
      can_mutate_handoff_context: false,
      can_send_handoff: false,
      can_call_provider_openai: false,
      can_call_github: false,
      can_execute_codex: false,
      notes: ["read-only bridge"],
    },
  };
}

function makeDeltaRecordReview() {
  return {
    review_version: "expected_observed_delta_record_review.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-05T12:00:00.000Z",
    source_refs: ["source:delta-review"],
    review_status: "records_available",
    input_summary: {
      supplied_record_count: 1,
      valid_record_count: 1,
      invalid_record_count: 0,
      selected_record_id: "expected-delta-record:clean",
      selected_record_found: true,
      latest_record_id: "expected-delta-record:clean",
      latest_record_created_at: "2026-07-05T12:00:00.000Z",
      selected_delta_candidate_ref_count: 1,
      receipt_side_effect_problem_count: 0,
    },
    record_summaries: [
      {
        record_id: "expected-delta-record:clean",
        idempotency_key: "idempotency:delta-clean",
        created_at: "2026-07-05T12:00:00.000Z",
        operator_ref: "operator:delta-clean",
        work_ref: "work:delta-clean",
        result_ref: "result:delta-clean",
        handoff_ref: "handoff:delta-clean",
        matched_expectation_count: 1,
        missing_expectation_count: 1,
        unexpected_observation_count: 1,
        skipped_or_unverified_check_count: 1,
        not_done_count: 1,
        changed_file_delta_count: 1,
        requirement_progress_delta_count: 1,
        non_goal_risk_count: 0,
        followup_count: 1,
        context_reuse_signal_count: 1,
        evidence_ref_count: 1,
        source_ref_count: 1,
        review_status: "recorded_as_expected_observed_delta",
        record_fingerprint: "sha256:delta",
        receipt_no_side_effects_valid: true,
        problem_reasons: [],
      },
    ],
    selected_record_summary: null,
    latest_record_summary: {
      record_id: "expected-delta-record:clean",
      idempotency_key: "idempotency:delta-clean",
      created_at: "2026-07-05T12:00:00.000Z",
      operator_ref: "operator:delta-clean",
      work_ref: "work:delta-clean",
      result_ref: "result:delta-clean",
      handoff_ref: "handoff:delta-clean",
      matched_expectation_count: 1,
      missing_expectation_count: 1,
      unexpected_observation_count: 1,
      skipped_or_unverified_check_count: 1,
      not_done_count: 1,
      changed_file_delta_count: 1,
      requirement_progress_delta_count: 1,
      non_goal_risk_count: 0,
      followup_count: 1,
      context_reuse_signal_count: 1,
      evidence_ref_count: 1,
      source_ref_count: 1,
      review_status: "recorded_as_expected_observed_delta",
      record_fingerprint: "sha256:delta",
      receipt_no_side_effects_valid: true,
      problem_reasons: [],
    },
    records: [{ record_id: "expected-delta-record:clean" }],
    evidence_summary: {
      supplied_record_count: 1,
      valid_record_count: 1,
      has_records: true,
      has_selected_record: true,
      has_source_refs: true,
      has_evidence_refs: true,
      has_receipt_side_effect_problem: false,
      source_refs: ["source:delta-review"],
      evidence_refs: ["evidence:delta-review"],
      missing_evidence: [],
      problem_record_ids: [],
    },
    record_material_summary: {
      matched_expectation_count: 1,
      missing_expectation_count: 1,
      unexpected_observation_count: 1,
      skipped_or_unverified_check_count: 1,
      not_done_count: 1,
      changed_file_delta_count: 1,
      requirement_progress_delta_count: 1,
      non_goal_risk_count: 0,
      followup_count: 1,
      context_reuse_signal_count: 1,
    },
    receipt_no_side_effects_summary: {},
    blocked_reasons: [],
    insufficient_data_reasons: [],
    operator_review_checklist: [],
    would_not_do: [],
    non_goals: [],
    authority_boundary: {},
  };
}

function cleanWriteInput(decisionPreview) {
  return {
    decision_preview: decisionPreview,
    operator_approval: {
      operator_decision: "approve_for_reuse_outcome_ledger_write",
      approved_by: "operator:reuse-bridge",
      operator_ref: "operator:reuse-bridge",
      approved_at: "2026-07-05T12:05:00.000Z",
      approval_statement: "record bridge reuse outcome into existing ledger",
      checklist_confirmations: [...decisionPreview.approval_requirements],
    },
    idempotency_key:
      decisionPreview.would_write_reuse_ledger_record_preview
        .requested_idempotency_key,
    requested_side_effects: {
      reuse_outcome_ledger_written: true,
      handoff_reuse_outcome_ledger_record_written: true,
      handoff_reuse_outcome_ledger_receipt_written: true,
    },
    notes: ["bridge-ledger-clean"],
  };
}

function mutateDecisionMaterial(input, patch) {
  return {
    ...input,
    decision_preview: {
      ...input.decision_preview,
      would_write_reuse_ledger_record_preview: {
        ...input.decision_preview.would_write_reuse_ledger_record_preview,
        ...patch,
      },
    },
  };
}

function assertRefused({ input, reason }) {
  const db = new Database(":memory:");
  try {
    const result = bridgeWrite.writeReuseOutcomeBridgeLedgerRecordV01(input, {
      db,
    });
    assert.equal(result.status, "refused");
    assert(
      result.refusal_reasons.includes(reason) ||
        result.receipt.refusal_reasons.includes(reason),
      `Expected refusal ${reason}; got ${[
        ...result.refusal_reasons,
        ...result.receipt.refusal_reasons,
      ].join(", ")}`,
    );
    assert.equal(ledger.handoffReuseOutcomeLedgerStoreSchemaExistsV01(db), false);
  } finally {
    db.close();
  }
}

function assertForbiddenSideEffectsFalse(noSideEffects) {
  for (const field of [
    "dogfood_metrics_written",
    "work_episode_written",
    "expected_observed_delta_written",
    "memory_mutated",
    "current_working_perspective_updated",
    "perspective_unit_written",
    "next_work_bias_written",
    "continuity_relay_written",
    "handoff_context_mutated",
    "selected_refs_written_to_live_handoff",
    "handoff_sent",
    "provider_called",
    "github_called",
    "codex_executed",
    "pr_created",
    "pr_merged",
    "autonomous_action_run",
    "graph_or_vector_store_created",
    "rag_stack_created",
    "crawler_or_browser_observer_created",
  ]) {
    assert.equal(noSideEffects[field], false, `${field} must be false`);
  }
}

function jsonRequest(url, body, headers = {}) {
  return new Request(url, {
    method: "POST",
    headers: {
      host: "localhost",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
      "content-type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function stepById(overview, stepId) {
  const step = overview.spine_steps.find((item) => item.step_id === stepId);
  assert(step, `Expected step ${stepId}`);
  return step;
}

function assertNoForbiddenOverviewRecommendations(overview) {
  const serialized = JSON.stringify(overview);
  for (const forbidden of [
    "write_dogfood_metric",
    "memory_promotion",
    "update_perspective",
    "mutate_current_working_perspective",
    "apply_handoff",
    "call_provider",
    "execute_codex",
  ]) {
    assert(
      !serialized.includes(`"recommended_next_action":"${forbidden}"`),
      `overview must not recommend ${forbidden}`,
    );
    assert(
      !serialized.includes(`"recommended_next_operator_action":"${forbidden}"`),
      `overview must not recommend ${forbidden}`,
    );
  }
}
