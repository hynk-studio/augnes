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
  previewType: "types/dogfood-metric-snapshot-preview.ts",
  previewHelper: "lib/dogfooding/dogfood-metric-snapshot-preview.ts",
  previewPanel: "components/dogfooding/dogfood-metric-snapshot-preview-panel.tsx",
  decisionType: "types/dogfood-metric-snapshot-decision.ts",
  decisionHelper: "lib/dogfooding/dogfood-metric-snapshot-decision.ts",
  decisionPanel: "components/dogfooding/dogfood-metric-snapshot-decision-panel.tsx",
  writeType: "types/dogfood-metric-snapshot-write.ts",
  writeHelper: "lib/dogfooding/dogfood-metric-snapshot-write.ts",
  route: "app/api/dogfooding/metric-snapshots/route.ts",
  reviewType: "types/dogfood-metric-snapshot-record-review.ts",
  reviewHelper: "lib/dogfooding/dogfood-metric-snapshot-record-review.ts",
  reviewForWeb:
    "lib/dogfooding/read-dogfood-metric-snapshot-record-review-for-web.ts",
  reviewPanel:
    "components/dogfooding/dogfood-metric-snapshot-record-review-panel.tsx",
  nextWorkType: "types/next-work-signal-refresh-preview.ts",
  nextWorkHelper: "lib/workplane/next-work-signal-refresh-preview.ts",
  nextWorkPanel: "components/workplane/next-work-signal-refresh-preview-panel.tsx",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  overviewType: "types/workbench-dogfood-loop-spine-overview.ts",
  overviewHelper: "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  agentWorkplaneSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  overviewSmoke: "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
  reuseBridgeSmoke:
    "scripts/smoke-reuse-outcome-bridge-ledger-integration-v0-1.mjs",
  smoke: "scripts/smoke-dogfood-metric-snapshot-next-work-refresh-v0-1.mjs",
  packageJson: "package.json",
};

const textByFile = loadTextByFile(Object.values(files));
const packageJsonText = textByFile.get(files.packageJson);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:dogfood-metric-snapshot-next-work-refresh-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-dogfood-metric-snapshot-next-work-refresh-v0-1.mjs",
});

assertContainsAll(
  [
    files.previewType,
    files.previewHelper,
    files.decisionType,
    files.decisionHelper,
    files.writeType,
    files.writeHelper,
    files.route,
    files.reviewType,
    files.reviewHelper,
    files.nextWorkType,
    files.nextWorkHelper,
  ]
    .map((file) => textByFile.get(file))
    .join("\n"),
  [
    "dogfood_metric_snapshot_preview.v0.1",
    "dogfood_metric_snapshot_operator_decision_preview.v0.1",
    "dogfood_metric_snapshot_record.v0.1",
    "dogfood_metric_snapshot_receipt.v0.1",
    "dogfood_metric_snapshot_store.v0.1",
    "next_work_signal_refresh_preview.v0.1",
  ],
  { label: "dogfood metric snapshot files" },
);

assertContainsAll(textByFile.get(files.agentWorkplane), [
  "DogfoodMetricSnapshotPreviewPanel",
  "DogfoodMetricSnapshotDecisionPanel",
  "DogfoodMetricSnapshotRecordReviewPanel",
  "NextWorkSignalRefreshPreviewPanel",
  "buildDogfoodMetricSnapshotPreviewV01",
  "buildDogfoodMetricSnapshotOperatorDecisionPreviewV01",
  "readDogfoodMetricSnapshotRecordReviewForWebV01",
  "buildNextWorkSignalRefreshPreviewV01",
  "dogfood_metric_snapshot_preview: dogfoodMetricSnapshotPreview",
  "dogfood_metric_snapshot_decision_preview:",
  "dogfood_metric_snapshot_record_review:",
  "next_work_signal_refresh_preview: nextWorkSignalRefreshPreview",
]);

assertContainsAll(textByFile.get(files.overviewType), [
  "dogfood_metric_snapshot",
  "dogfood_metric_snapshot_record",
  "next_work_signal_refresh",
  "review_dogfood_metric_snapshot_candidates",
  "write_dogfood_metric_snapshot_record",
  "review_dogfood_metric_snapshot_record",
  "review_next_work_signal_refresh",
  "prepare_perspective_next_work_update_preview",
  "resolve_dogfood_metric_snapshot_blockers",
]);
assertContainsAll(textByFile.get(files.overviewHelper), [
  "dogfoodMetricSnapshotStep",
  "dogfoodMetricSnapshotRecordStep",
  "nextWorkSignalRefreshStep",
  "dogfood_metric_snapshot_preview",
  "dogfood_metric_snapshot_decision_preview",
  "dogfood_metric_snapshot_record_review",
  "next_work_signal_refresh_preview",
]);

for (const panel of [
  files.previewPanel,
  files.decisionPanel,
  files.reviewPanel,
  files.nextWorkPanel,
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

const { buildDogfoodMetricSnapshotPreviewV01 } = await import(
  "../lib/dogfooding/dogfood-metric-snapshot-preview.ts"
);
const { buildDogfoodMetricSnapshotOperatorDecisionPreviewV01 } = await import(
  "../lib/dogfooding/dogfood-metric-snapshot-decision.ts"
);
const snapshotWrite = await import(
  "../lib/dogfooding/dogfood-metric-snapshot-write.ts"
);
const snapshotReview = await import(
  "../lib/dogfooding/dogfood-metric-snapshot-record-review.ts"
);
const { buildNextWorkSignalRefreshPreviewV01 } = await import(
  "../lib/workplane/next-work-signal-refresh-preview.ts"
);
const { buildReuseOutcomeBridgeLedgerRecordReviewV01 } = await import(
  "../lib/dogfooding/reuse-outcome-bridge-ledger-record-review.ts"
);
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);
const metricRoute = await import("../app/api/dogfooding/metric-snapshots/route.ts");

const emptyPreview = buildDogfoodMetricSnapshotPreviewV01();
assert.equal(emptyPreview.snapshot_preview_status, "no_reuse_outcome_records");
assert(
  emptyPreview.insufficient_data_reasons.includes(
    "approved_reuse_outcome_records_missing",
  ) ||
    emptyPreview.insufficient_data_reasons.includes(
      "approved_reuse_ledger_records_missing_for_metric_snapshot",
    ),
);
assert.equal(emptyPreview.evidence_summary.has_reuse_outcome_records, false);

const singleRecordPreview = buildDogfoodMetricSnapshotPreviewV01({
  approved_reuse_ledger_records: [makeReuseLedgerRecord("single", {})],
  source_refs: ["source:metric-single"],
});
assert.equal(singleRecordPreview.evidence_summary.single_sample_not_trend, true);
assert(
  singleRecordPreview.insufficient_data_reasons.includes(
    "single_sample_not_metric_trend",
  ),
);

const reuseRecords = [
  makeReuseLedgerRecord("one", {
    helpful: 1,
    stale: 1,
    missing: 1,
    noisy: 1,
    misleading: 1,
    unknown: 1,
    skipped: 1,
    notDone: 1,
    missingExpectation: 1,
    unexpectedObservation: 1,
  }),
  makeReuseLedgerRecord("two", {
    helpful: 2,
    stale: 0,
    missing: 1,
    noisy: 0,
    misleading: 1,
    unknown: 1,
    skipped: 1,
    notDone: 1,
    missingExpectation: 1,
    unexpectedObservation: 0,
  }),
];
const reuseReview = buildReuseOutcomeBridgeLedgerRecordReviewV01({
  records: reuseRecords,
  source_refs: ["source:metric-reuse-review"],
});
assert.equal(reuseReview.review_status, "records_available");
const expectedObservedReview = makeExpectedObservedReview();
const preview = buildDogfoodMetricSnapshotPreviewV01({
  reuse_outcome_bridge_ledger_record_review: reuseReview,
  expected_observed_delta_record_review: expectedObservedReview,
  source_refs: ["source:metric-preview"],
  as_of: "2026-07-05T16:00:00.000Z",
});
assert.equal(preview.snapshot_preview_status, "ready_for_operator_review");
assert(preview.input_summary.metric_candidate_ref_count > 0);
assert.equal(preview.verification_quality_metrics.verified_success_count, 0);
assert(preview.aggregate_counts.skipped_or_unverified_check_count > 0);
assert(preview.aggregate_counts.not_done_item_count > 0);
assert(preview.aggregate_counts.missing_context_signal_count > 0);
assert(preview.aggregate_counts.misleading_context_signal_count > 0);
assert(preview.aggregate_counts.unknown_context_signal_count > 0);
assert(!preview.metric_candidate_summaries.some((candidate) =>
  candidate.bucket === "helpful_context_signal_count" &&
  /\bstale|missing|misleading\b/i.test(candidate.summary),
));

const badSelectedDecision = buildDogfoodMetricSnapshotOperatorDecisionPreviewV01({
  dogfood_metric_snapshot_preview: preview,
  selected_metric_candidate_refs: ["metric-snapshot:not-present"],
  requested_operator_ref: "operator:metric-reviewer",
  requested_idempotency_key: "idempotency:metric-snapshot",
  review_confirmation_ref: "review:metric-snapshot",
  source_refs: ["source:metric-decision"],
});
assert.notEqual(
  badSelectedDecision.decision_preview_status,
  "ready_for_future_metric_snapshot_write",
);
assert(
  badSelectedDecision.refusal_reasons.includes(
    "selected_metric_candidate_refs_not_in_snapshot_preview",
  ),
);

const selectableRef =
  buildDogfoodMetricSnapshotOperatorDecisionPreviewV01({
    dogfood_metric_snapshot_preview: preview,
  }).would_write_metric_snapshot_record_preview.selectable_metric_candidate_refs[0];
const readyDecision = buildDogfoodMetricSnapshotOperatorDecisionPreviewV01({
  dogfood_metric_snapshot_preview: preview,
  selected_metric_candidate_refs: [selectableRef],
  requested_operator_ref: "operator:metric-reviewer",
  requested_idempotency_key: "idempotency:metric-snapshot",
  review_confirmation_ref: "review:metric-snapshot",
  source_refs: ["source:metric-decision"],
});
assert.equal(
  readyDecision.decision_preview_status,
  "ready_for_future_metric_snapshot_write",
);
assert.equal(readyDecision.write_readiness.write_ready, true);
assert.equal(
  readyDecision.recommended_operator_decision,
  "approve_for_dogfood_metric_snapshot_write",
);

const validInput = cleanWriteInput(readyDecision);
const validInputValidation =
  snapshotWrite.validateDogfoodMetricSnapshotWriteInputV01(validInput);
assert.equal(
  validInputValidation.ok,
  true,
  validInputValidation.refusal_reasons.join(", "),
);
assertRefused({
  input: cleanWriteInput(
    buildDogfoodMetricSnapshotOperatorDecisionPreviewV01({
      dogfood_metric_snapshot_preview: preview,
    }),
  ),
  reason: "decision_preview_not_ready_for_future_metric_snapshot_write",
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
  input: { ...validInput, idempotency_key: "idempotency:metric-mismatch" },
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
    requested_side_effects: { dogfood_metrics_global_state_updated: true },
  },
  reason: "requested_side_effect_not_allowed",
});
assertRefused({
  input: {
    ...validInput,
    requested_side_effects: { reuse_outcome_ledger_written: true },
  },
  reason: "requested_side_effect_not_allowed",
});
const forgedDecisionAuthorityInput = structuredClone(validInput);
forgedDecisionAuthorityInput.decision_preview.authority_boundary.can_create_pr =
  true;
assertRefused({
  input: forgedDecisionAuthorityInput,
  reason: "decision_preview_authority_boundary_invalid",
});
const skippedSuccessInput = structuredClone(validInput);
skippedSuccessInput.decision_preview.would_write_metric_snapshot_record_preview.verification_quality_metrics.verified_success_count = 1;
assertRefused({
  input: skippedSuccessInput,
  reason: "skipped_checks_counted_as_success",
});
const helpfulLeakInput = structuredClone(validInput);
helpfulLeakInput.decision_preview.would_write_metric_snapshot_record_preview.metric_candidate_summaries[0].bucket =
  "helpful_context_signal_count";
helpfulLeakInput.decision_preview.would_write_metric_snapshot_record_preview.metric_candidate_summaries[0].summary =
  "stale missing misleading helpful";
assertRefused({
  input: helpfulLeakInput,
  reason: "missing_stale_misleading_context_counted_as_helpful",
});

const dbPath = ".tmp/dogfood-metric-snapshots/metric-clean.sqlite";
mkdirSync(".tmp/dogfood-metric-snapshots", { recursive: true });
rmSync(dbPath, { force: true });
const db = new Database(dbPath);
let written;
try {
  const schemaBefore = snapshotWrite.listDogfoodMetricSnapshotRecordsV01({
    db,
  });
  assert.equal(schemaBefore.status, "schema_missing");
  assert.equal(snapshotWrite.dogfoodMetricSnapshotWriteSchemaExistsV01(db), false);
  written = snapshotWrite.writeDogfoodMetricSnapshotRecordV01(validInput, {
    db,
  });
  assert.equal(written.status, "written");
  assert.equal(written.record.record_version, "dogfood_metric_snapshot_record.v0.1");
  assert.equal(
    written.no_side_effects.dogfood_metric_snapshot_record_written,
    true,
  );
  assert.equal(
    written.no_side_effects.dogfood_metric_snapshot_receipt_written,
    true,
  );
  assert.equal(written.no_side_effects.dogfood_metric_snapshot_persisted, true);
  assertForbiddenSideEffectsFalse(written.no_side_effects);
  assert.equal(
    snapshotWrite.writeDogfoodMetricSnapshotRecordV01(validInput, { db }).status,
    "idempotent_existing",
  );
  assert.equal(
    snapshotWrite.writeDogfoodMetricSnapshotRecordV01(
      { ...validInput, notes: ["different-clean-note"] },
      { db },
    ).status,
    "refused",
  );
  assert.equal(
    snapshotWrite.readDogfoodMetricSnapshotRecordByIdV01(
      written.record.record_id,
      { db },
    ).status,
    "read",
  );
  assert.equal(
    snapshotWrite.readDogfoodMetricSnapshotRecordByIdempotencyKeyV01(
      validInput.idempotency_key,
      { db },
    ).status,
    "read",
  );
  assert.equal(
    snapshotWrite.listDogfoodMetricSnapshotRecordsV01({ db }).status,
    "listed",
  );
} finally {
  db.close();
}

const noRecordsReview = snapshotReview.buildDogfoodMetricSnapshotRecordReviewV01({
  records: [],
});
assert.equal(noRecordsReview.review_status, "no_records");
const recordsReview = snapshotReview.buildDogfoodMetricSnapshotRecordReviewV01({
  records: [written.record],
});
assert.equal(recordsReview.review_status, "records_available");
assert.equal(recordsReview.input_summary.valid_record_count, 1);
const malformedReview = snapshotReview.buildDogfoodMetricSnapshotRecordReviewV01({
  records: [{}],
});
assert.equal(malformedReview.review_status, "records_invalid");
let partialMalformedReview;
assert.doesNotThrow(() => {
  partialMalformedReview =
    snapshotReview.buildDogfoodMetricSnapshotRecordReviewV01({
      records: [
        {
          record_version: "dogfood_metric_snapshot_record.v0.1",
          record_id: "metric-snapshot:partial-malformed",
          idempotency_key: "idempotency:partial-malformed",
          created_at: "2026-07-05T00:00:00.000Z",
          scope: "project:augnes",
          operator_ref: "operator:metric-reviewer",
          source_refs: ["source:partial-malformed"],
          selected_metric_candidate_refs: [],
          metric_window: { since: null, until: null },
          aggregate_counts: {},
          authority_boundary: {},
          record_fingerprint: "fingerprint:partial-malformed",
        },
      ],
    });
});
assert.equal(partialMalformedReview.review_status, "records_invalid");
assert(
  partialMalformedReview.record_summaries.some((summary) =>
    summary.problem_reasons.includes("dogfood_metric_snapshot_record_malformed"),
  ),
);
const corruptReceiptStoreResult = structuredClone(written);
corruptReceiptStoreResult.receipt.no_side_effects.memory_mutated = true;
const corruptReceiptReview =
  snapshotReview.buildDogfoodMetricSnapshotRecordReviewV01({
    store_result: corruptReceiptStoreResult,
  });
assert.equal(corruptReceiptReview.review_status, "records_invalid");
assert(corruptReceiptReview.input_summary.receipt_side_effect_problem_count > 0);
assert.equal(
  corruptReceiptReview.evidence_summary.has_receipt_side_effect_problem,
  true,
);
assert(
  corruptReceiptReview.blocked_reasons.includes(
    "dogfood_metric_snapshot_receipt_no_side_effects_invalid",
  ) ||
    corruptReceiptReview.blocked_reasons.includes(
      "dogfood_metric_snapshot_store_no_side_effects_invalid",
    ),
);

const noMetricRefresh = buildNextWorkSignalRefreshPreviewV01();
assert.equal(noMetricRefresh.refresh_preview_status, "no_metric_material");
const metricPreviewRefresh = buildNextWorkSignalRefreshPreviewV01({
  dogfood_metric_snapshot_preview: preview,
  reuse_outcome_bridge_ledger_record_review: reuseReview,
  source_refs: ["source:next-work-refresh"],
});
assert(
  ["next_work_signals_available", "ready_for_operator_review"].includes(
    metricPreviewRefresh.refresh_preview_status,
  ),
);
assert(
  metricPreviewRefresh.input_summary.next_work_signal_count > 0,
);
assertNextWorkAuthorityFalse(metricPreviewRefresh.authority_boundary);
const metricRecordRefresh = buildNextWorkSignalRefreshPreviewV01({
  dogfood_metric_snapshot_record_review: recordsReview,
  reuse_outcome_bridge_ledger_record_review: reuseReview,
  source_refs: ["source:next-work-record-refresh"],
});
assert(metricRecordRefresh.input_summary.metric_material_count > 0);
assertNextWorkAuthorityFalse(metricRecordRefresh.authority_boundary);

const missingDbGet = await metricRoute.GET(
  new Request("http://localhost/api?db_path=.tmp/dogfood-metric-snapshots/missing.sqlite"),
);
assert.equal(missingDbGet.status, 404);
const unsafeGet = await metricRoute.GET(
  new Request("http://localhost/api?db_path=../private.sqlite"),
);
assert.equal(unsafeGet.status, 400);
const crossSitePost = await metricRoute.POST(
  jsonRequest("http://internal/api", { action: "write" }, {
    host: "internal",
    origin: "http://evil.example",
    "sec-fetch-site": "cross-site",
  }),
);
assert.equal(crossSitePost.status, 403);
const proxiedSameOrigin = await metricRoute.POST(
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
assert.equal(proxiedSameOrigin.status, 400);
const invalidActionPost = await metricRoute.POST(
  jsonRequest("http://localhost/api", { action: "bad" }),
);
assert.equal(invalidActionPost.status, 400);
const invalidJsonPost = await metricRoute.POST(
  new Request("http://localhost/api", {
    method: "POST",
    headers: { host: "localhost", origin: "http://localhost" },
    body: "{",
  }),
);
assert.equal(invalidJsonPost.status, 400);
const invalidObjectPost = await metricRoute.POST(
  new Request("http://localhost/api", {
    method: "POST",
    headers: { host: "localhost", origin: "http://localhost" },
    body: "[]",
  }),
);
assert.equal(invalidObjectPost.status, 400);
const validationDbPath =
  ".tmp/dogfood-metric-snapshots/validation-before-open.sqlite";
rmSync(validationDbPath, { force: true });
const invalidWritePost = await metricRoute.POST(
  jsonRequest("http://localhost/api", {
    action: "write",
    db_path: validationDbPath,
    input: {},
  }),
);
assert.equal(invalidWritePost.status, 400);
assert.equal(existsSync(validationDbPath), false);
const routeDbPath = ".tmp/dogfood-metric-snapshots/metric-route.sqlite";
rmSync(routeDbPath, { force: true });
const routeInput = withIdempotency(validInput, "idempotency:metric-route");
const validRoutePost = await metricRoute.POST(
  jsonRequest("http://localhost/api", {
    action: "write",
    db_path: routeDbPath,
    input: routeInput,
  }),
);
assert.equal(validRoutePost.status, 201);
const validRouteJson = await validRoutePost.json();
assert.equal(
  validRouteJson.no_side_effects.dogfood_metric_snapshot_record_written,
  true,
);
assertForbiddenSideEffectsFalse(validRouteJson.no_side_effects);

const defaultOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({});
assert.equal(
  stepById(defaultOverview, "dogfood_metric_snapshot").status,
  "not_supplied",
);
const metricOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  dogfood_metric_snapshot_preview: preview,
});
assert.equal(
  stepById(metricOverview, "dogfood_metric_snapshot").recommended_next_action,
  "review_dogfood_metric_snapshot_candidates",
);
const metricWriteOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  dogfood_metric_snapshot_decision_preview: readyDecision,
  dogfood_metric_snapshot_record_review: noRecordsReview,
});
assert.equal(
  stepById(metricWriteOverview, "dogfood_metric_snapshot_record")
    .recommended_next_action,
  "write_dogfood_metric_snapshot_record",
);
const metricRecordOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  dogfood_metric_snapshot_record_review: recordsReview,
  next_work_signal_refresh_preview: metricRecordRefresh,
});
assert.equal(
  stepById(metricRecordOverview, "next_work_signal_refresh")
    .recommended_next_action,
  "review_next_work_signal_refresh",
);
assertNoForbiddenOverviewRecommendations(metricRecordOverview);

const changedFiles = assertChangedFilesWithin({
  label: "dogfood-metric-snapshot-next-work-refresh-v0-1",
  allowedChangedFiles: [
    files.previewType,
    files.previewHelper,
    files.previewPanel,
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
    files.nextWorkType,
    files.nextWorkHelper,
    files.nextWorkPanel,
    files.agentWorkplane,
    files.overviewType,
    files.overviewHelper,
    files.agentWorkplaneSmoke,
    files.overviewSmoke,
    files.smoke,
    files.packageJson,
  ],
});

rmSync(".tmp/dogfood-metric-snapshots/metric-clean.sqlite", { force: true });
rmSync(".tmp/dogfood-metric-snapshots/metric-route.sqlite", { force: true });

console.log(
  JSON.stringify(
    {
      smoke: "dogfood-metric-snapshot-next-work-refresh-v0-1",
      pass: true,
      preview_checked: true,
      decision_checked: true,
      writer_checked: true,
      route_checked: true,
      review_checked: true,
      next_work_refresh_checked: true,
      overview_checked: true,
      changed_files_checked: changedFiles.checked,
      changed_files_skipped: changedFiles.skipped,
      changed_files_observed: changedFiles.files,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:dogfood-metric-snapshot-next-work-refresh-v0-1");

function makeReuseLedgerRecord(
  suffix,
  {
    helpful = 1,
    stale = 0,
    missing = 0,
    noisy = 0,
    misleading = 0,
    unknown = 0,
    skipped = 0,
    notDone = 0,
    missingExpectation = 0,
    unexpectedObservation = 0,
  },
) {
  const refs = (prefix, count) =>
    Array.from({ length: count }, (_, index) => ({
      ref_id: `${prefix}:${suffix}:${index + 1}`,
      label: `${prefix} ${index + 1}`,
      summary: `${prefix} signal ${index + 1}`,
    }));
  return {
    record_version: "handoff_reuse_outcome_ledger_record.v0.1",
    store_version: "handoff_reuse_outcome_ledger_store.v0.1",
    record_id: `reuse-ledger-record:${suffix}`,
    idempotency_key: `idempotency:reuse-ledger:${suffix}`,
    created_at: `2026-07-05T16:0${suffix === "one" ? "1" : "2"}:00.000Z`,
    scope: "project:augnes",
    operator_decision: "approve_for_future_write",
    operator_approval: {
      approved_by: `operator:reuse:${suffix}`,
      operator_ref: `operator:reuse:${suffix}`,
      approved_at: "2026-07-05T16:00:00.000Z",
      checklist_confirmations: {
        actual_result_report_confirmed: true,
        result_matches_intended_codex_run: true,
        changed_files_and_checks_confirmed: true,
        skipped_checks_reviewed_not_counted_as_success: true,
        reuse_classifications_evidence_backed: true,
        unknown_refs_remain_unknown: true,
        carry_forward_candidates_are_candidate_only: true,
        no_durable_memory_or_perspective_apply: true,
        no_metric_update_expected: true,
      },
      review_note: null,
    },
    source_refs: [
      `source:reuse-ledger:${suffix}`,
      `evidence:reuse-ledger:${suffix}`,
    ],
    decision_preview_refs: {
      preview_version: "reuse_outcome_bridge_operator_decision_preview.v0.1",
      preview_status: "ready_for_future_reuse_ledger_write",
      recommended_operator_decision: "approve_for_reuse_outcome_ledger_write",
      write_ready: true,
      preview_as_of: "2026-07-05T16:00:00.000Z",
      source_refs: [`source:reuse-ledger:${suffix}`],
    },
    proposal_refs: {},
    feedback_draft_refs: {
      feedback_draft_ref: `work:metric:${suffix}`,
      result_report_ref: `result:metric:${suffix}`,
      result_report_fingerprint: `fingerprint:metric:${suffix}`,
      context_relay_rationale_ref: `handoff:metric:${suffix}`,
      continuity_relay_ref: `relay:metric:${suffix}`,
      source_refs: [`source:reuse-feedback:${suffix}`],
    },
    result_report_ref: `result:metric:${suffix}`,
    result_report_fingerprint: `fingerprint:metric:${suffix}`,
    context_relay_rationale_ref: `handoff:metric:${suffix}`,
    continuity_relay_ref: `relay:metric:${suffix}`,
    proposed_record_kind: "codex_result_reuse_outcome",
    dogfood_signal: {
      context_feedback_signal_present: true,
      reuse_outcome_signal_present: true,
      expected_observed_signal_present: true,
      confidence: "medium",
      summary: "approved local reuse outcome signal",
    },
    reuse_classifications: {
      helpful_refs: refs("helpful", helpful),
      stale_refs: refs("stale", stale),
      missing_refs: refs("missing", missing),
      noisy_refs: refs("noisy", noisy),
      misleading_refs: refs("misleading", misleading),
      unknown_refs: refs("unknown", unknown),
    },
    expected_observed_summary: {
      matched_expectation_count: 1,
      missing_expectation_count: missingExpectation,
      unexpected_observation_count: unexpectedObservation,
      skipped_or_unverified_check_count: skipped,
      requirement_progress_gap_count: missingExpectation + unexpectedObservation,
      not_done_count: notDone,
      missing_expectations:
        missingExpectation > 0 ? [`missing expectation ${suffix}`] : [],
      unexpected_observations:
        unexpectedObservation > 0 ? [`unexpected observation ${suffix}`] : [],
      not_done_items: notDone > 0 ? [`not done ${suffix}`] : [],
      mismatch_summary:
        missingExpectation + unexpectedObservation > 0
          ? "expected observed mismatch"
          : "matched expectation",
      confidence: "medium",
    },
    skipped_or_unverified_checks:
      skipped > 0 ? [`skipped check ${suffix}`] : [],
    not_done_items: notDone > 0 ? [`not done ${suffix}`] : [],
    carry_forward_candidates: {
      next_relay_update_suggestions: [`relay suggestion ${suffix}`],
      next_handoff_adjustments: [`handoff adjustment ${suffix}`],
      refs_to_preserve_next_time: [`preserve:${suffix}`],
      refs_to_warn_next_time: [`warn:${suffix}`],
      refs_to_drop_or_deprioritize: [`drop:${suffix}`],
      unresolved_gaps: [`gap:${suffix}`],
      next_focus_candidate: `focus:${suffix}`,
    },
    evidence_summary: {
      evidence_refs: [`evidence:reuse-ledger:${suffix}`],
      missing_evidence: [],
    },
    write_validation: {
      validation_version: "handoff_reuse_outcome_ledger_write_validation.v0.1",
      write_ready_revalidated: true,
      required_checklist_confirmations: [],
      refused_sample_fixture_material: false,
      default_workbench_missing_result_refused: false,
      validation_hash: `validation:${suffix}`,
    },
    authority_boundary: {
      ledger_record_only: true,
      source_of_truth: false,
      operator_approved_durable_local_record: true,
      can_write_handoff_reuse_ledger: true,
      can_write_db: true,
      can_write_dogfood_ledger: true,
      can_update_metrics: false,
      can_mutate_memory: false,
      can_promote_memory: false,
      can_apply_project_perspective: false,
      can_create_promotion_decision: false,
      can_create_formation_receipt: false,
      can_call_provider_openai: false,
      can_call_github: false,
      can_execute_codex: false,
      can_send_handoff: false,
      can_create_pr: false,
      can_merge_pr: false,
      can_run_autonomous_action: false,
      can_create_graph_or_vector_store: false,
      can_create_rag_stack: false,
      can_crawl_or_observe_browser: false,
      notes: [],
    },
    notes: [],
    record_fingerprint: `fingerprint:reuse-ledger:${suffix}`,
  };
}

function makeExpectedObservedReview() {
  return {
    review_version: "expected_observed_delta_record_review.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-05T16:00:00.000Z",
    source_refs: ["source:expected-observed-review"],
    review_status: "records_available",
    input_summary: {
      valid_record_count: 1,
    },
    records: [{ record_id: "expected-delta-record:metric" }],
    evidence_summary: {
      evidence_refs: ["evidence:expected-observed-review"],
      missing_evidence: [],
    },
    record_material_summary: {
      requirement_progress_delta_count: 2,
    },
  };
}

function cleanWriteInput(decisionPreview) {
  return {
    decision_preview: decisionPreview,
    operator_approval: {
      operator_decision: "approve_for_dogfood_metric_snapshot_write",
      approved_by: "operator:metric-reviewer",
      operator_ref: "operator:metric-reviewer",
      approved_at: "2026-07-05T16:05:00.000Z",
      approval_statement: "record local dogfood metric snapshot",
      checklist_confirmations: [...decisionPreview.approval_requirements],
    },
    idempotency_key:
      decisionPreview.would_write_metric_snapshot_record_preview
        .requested_idempotency_key,
    requested_side_effects: {
      dogfood_metric_snapshot_record_written: true,
      dogfood_metric_snapshot_receipt_written: true,
      dogfood_metric_snapshot_persisted: true,
    },
    notes: ["metric-clean"],
  };
}

function mutateDecisionMaterial(input, patch) {
  return {
    ...input,
    decision_preview: {
      ...input.decision_preview,
      would_write_metric_snapshot_record_preview: {
        ...input.decision_preview.would_write_metric_snapshot_record_preview,
        ...patch,
      },
    },
  };
}

function withIdempotency(input, idempotencyKey) {
  return {
    ...input,
    idempotency_key: idempotencyKey,
    decision_preview: {
      ...input.decision_preview,
      would_write_metric_snapshot_record_preview: {
        ...input.decision_preview.would_write_metric_snapshot_record_preview,
        requested_idempotency_key: idempotencyKey,
      },
    },
  };
}

function assertRefused({ input, reason }) {
  const db = new Database(":memory:");
  try {
    const result = snapshotWrite.writeDogfoodMetricSnapshotRecordV01(input, {
      db,
    });
    assert.equal(result.status, "refused");
    assert(
      result.receipt.refusal_reasons.includes(reason),
      `Expected refusal ${reason}; got ${result.receipt.refusal_reasons.join(", ")}`,
    );
    assert.equal(snapshotWrite.dogfoodMetricSnapshotWriteSchemaExistsV01(db), false);
  } finally {
    db.close();
  }
}

function assertForbiddenSideEffectsFalse(noSideEffects) {
  for (const field of [
    "dogfood_metrics_global_state_updated",
    "reuse_outcome_ledger_written",
    "expected_observed_delta_written",
    "work_episode_written",
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

function assertNextWorkAuthorityFalse(authority) {
  for (const field of [
    "can_write_perspective_unit",
    "can_write_next_work_bias",
    "can_update_current_working_perspective",
    "can_update_continuity_relay",
    "can_mutate_handoff_context",
    "can_send_handoff",
    "can_write_memory",
    "can_write_dogfood_metrics",
    "can_write_reuse_outcome_ledger",
    "can_call_provider_openai",
    "can_call_github",
    "can_execute_codex",
  ]) {
    assert.equal(authority[field], false, `${field} must be false`);
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
    "update_global_dogfood_metrics",
    "write_perspective_unit",
    "write_next_work_bias",
    "mutate_current_working_perspective",
    "update_continuity_relay",
    "apply_handoff_context",
    "send_handoff",
    "promote_memory",
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
