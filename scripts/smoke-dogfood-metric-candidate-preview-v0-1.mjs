#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/dogfood-metric-candidate-preview.ts";
const helperFile = "lib/dogfooding/dogfood-metric-candidate-preview.ts";
const panelFile = "components/dogfood-metric-candidate-preview-panel.tsx";
const routeFile = "app/api/dogfooding/reuse-ledger/metric-preview/route.ts";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const agentWorkplaneSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const smokeFile = "scripts/smoke-dogfood-metric-candidate-preview-v0-1.mjs";
const packageJsonFile = "package.json";
const ledgerTypeFile = "types/handoff-reuse-outcome-ledger.ts";
const ledgerHelperFile = "lib/dogfooding/handoff-reuse-outcome-ledger.ts";
const ledgerRouteFile = "app/api/dogfooding/reuse-ledger/route.ts";
const ledgerSmokeFile =
  "scripts/smoke-handoff-reuse-outcome-ledger-write-v0-1.mjs";
const handoffContextSmokeFile =
  "scripts/smoke-handoff-context-relay-rationale-v0-1.mjs";
const workplaneContinuitySmokeFile =
  "scripts/smoke-workplane-continuity-relay-v0-1.mjs";
const decisionSmokeFile =
  "scripts/smoke-dogfood-reuse-operator-decision-preview-v0-1.mjs";
const proposalSmokeFile =
  "scripts/smoke-dogfood-reuse-record-proposal-v0-1.mjs";
const feedbackSmokeFile = "scripts/smoke-codex-result-feedback-draft-v0-1.mjs";
const perspectiveNextWorkCandidateTypeFile =
  "types/perspective-next-work-candidate-update-preview.ts";
const perspectiveNextWorkCandidateHelperFile =
  "lib/perspective/perspective-next-work-candidate-update-preview.ts";
const perspectiveNextWorkCandidatePanelFile =
  "components/perspective-next-work-candidate-update-preview-panel.tsx";
const perspectiveNextWorkCandidateSmokeFile =
  "scripts/smoke-perspective-next-work-candidate-update-preview-v0-1.mjs";
const metricInformedContinuityRelayAdjustmentTypeFile =
  "types/metric-informed-continuity-relay-adjustment-preview.ts";
const metricInformedContinuityRelayAdjustmentHelperFile =
  "lib/workplane/metric-informed-continuity-relay-adjustment-preview.ts";
const metricInformedContinuityRelayAdjustmentPanelFile =
  "components/workplane/metric-informed-continuity-relay-adjustment-preview-panel.tsx";
const metricInformedContinuityRelayAdjustmentSmokeFile =
  "scripts/smoke-metric-informed-continuity-relay-adjustment-preview-v0-1.mjs";

const allowedChangedFiles = [
  typeFile,
  helperFile,
  panelFile,
  routeFile,
  agentWorkplaneFile,
  agentWorkplaneSmokeFile,
  smokeFile,
  packageJsonFile,
  ledgerSmokeFile,
  handoffContextSmokeFile,
  workplaneContinuitySmokeFile,
  decisionSmokeFile,
  proposalSmokeFile,
  feedbackSmokeFile,
  perspectiveNextWorkCandidateTypeFile,
  perspectiveNextWorkCandidateHelperFile,
  perspectiveNextWorkCandidatePanelFile,
  perspectiveNextWorkCandidateSmokeFile,
  metricInformedContinuityRelayAdjustmentTypeFile,
  metricInformedContinuityRelayAdjustmentHelperFile,
  metricInformedContinuityRelayAdjustmentPanelFile,
  metricInformedContinuityRelayAdjustmentSmokeFile,
];

const textByFile = loadTextByFile([
  ...allowedChangedFiles,
  ledgerTypeFile,
  ledgerHelperFile,
  ledgerRouteFile,
]);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const panelText = textByFile.get(panelFile);
const routeText = textByFile.get(routeFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const packageJsonText = textByFile.get(packageJsonFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:dogfood-metric-candidate-preview-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-dogfood-metric-candidate-preview-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "dogfood_metric_candidate_preview.v0.1",
    "ledger_source",
    "metric_window",
    "aggregate_counts",
    "reuse_quality_candidate",
    "handoff_quality_candidate",
    "source_record_summaries",
    "ready_for_metric_write: false",
    "can_write_dogfood_metrics: false",
    "can_update_metrics: false",
    "can_write_dogfood_ledger: false",
    "can_mutate_memory: false",
    "can_apply_project_perspective: false",
    "can_create_formation_receipt: false",
    "can_call_provider_openai: false",
    "can_call_github: false",
    "can_execute_codex: false",
    "can_send_handoff: false",
  ],
  { label: typeFile },
);

assertContainsAll(
  helperText,
  [
    "buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01",
    "sample_fixture_or_non_approved_records_excluded",
    "empty_metric_window",
    "approved_reuse_ledger_records_missing",
    "metric_write_not_in_scope_for_v0_1",
    "candidate_preview_only",
    "can_write_dogfood_metrics: false",
    "can_write_db: false",
    "can_update_metrics: false",
    "can_write_dogfood_ledger: false",
    "can_mutate_memory: false",
    "can_apply_project_perspective: false",
  ],
  { label: helperFile },
);

assertContainsAll(
  routeText,
  [
    "dogfood_metric_candidate_preview_route.v0.1",
    "GET(request: Request)",
    "openReadOnlyLedgerDb",
    "readMetricPreviewLedgerRecordsV01",
    "buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01",
    "invalid_db_path",
    "db_missing",
    "schema_missing",
    "no_metric_write: true",
    "no_metric_update: true",
    "no_memory_mutation: true",
    "no_perspective_apply: true",
    "no_provider_call: true",
    "no_github_call: true",
    "no_codex_execution: true",
    "no_handoff_send: true",
  ],
  { label: routeFile },
);
assert(!routeText.includes("export async function POST"), "metric preview route must not add POST");
assert(!routeText.includes("writeHandoffReuseOutcomeLedgerRecordV01"), "metric preview route must not write ledger records");
assert(!routeText.includes("ensureHandoffReuseOutcomeLedgerStoreSchemaV01"), "metric preview route must not create ledger schema");

assertContainsAll(
  panelText,
  [
    "DogfoodMetricCandidatePreviewPanel",
    "Reuse metric candidates",
    "ready_for_metric_write",
    "can_write_dogfood_metrics",
    "can_update_metrics",
    "can_write_dogfood_ledger",
  ],
  { label: panelFile },
);
assertContainsAll(
  agentWorkplaneText,
  [
    "DogfoodMetricCandidatePreviewPanel",
    "buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01",
    "records: []",
    "workbench_default_does_not_read_or_write_reuse_ledger_store",
    "workbench:default_empty_handoff_reuse_ledger_metric_preview",
  ],
  { label: agentWorkplaneFile },
);
assert(
  !agentWorkplaneText.includes("writeHandoffReuseOutcomeLedgerRecordV01"),
  "Workbench must not call the reuse ledger write helper",
);
assert(
  !agentWorkplaneText.includes("reuse-ledger/metric-preview"),
  "Workbench must not fetch a metric preview route during render",
);

for (const [label, text] of [
  [helperFile, helperText],
  [routeFile, routeText],
  [panelFile, panelText],
  [agentWorkplaneFile, agentWorkplaneText],
]) {
  assertNoForbiddenExpansion(label, text);
}

const previewModule = await import(
  "../lib/dogfooding/dogfood-metric-candidate-preview.ts"
);
const ledger = await import(
  "../lib/dogfooding/handoff-reuse-outcome-ledger.ts"
);
const metricRoute = await import(
  "../app/api/dogfooding/reuse-ledger/metric-preview/route.ts"
);

const emptyPreview =
  previewModule.buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01({
    records: [],
    as_of: "2026-07-04T04:00:00.000Z",
  });
assert.equal(emptyPreview.candidate_status, "insufficient_data");
assert.equal(emptyPreview.ledger_source.record_count, 0);
assert.equal(emptyPreview.aggregate_counts.approved_record_count, 0);
assert.equal(emptyPreview.metric_write_readiness.ready_for_metric_write, false);
assert(
  emptyPreview.insufficient_data_reasons.includes("empty_metric_window"),
  "empty preview must expose empty_metric_window",
);
assertAuthorityBoundary(emptyPreview.authority_boundary);

const dbPath = `.tmp/dogfood-reuse-ledger/metric-preview-${process.pid}.sqlite`;
mkdirSync(dirname(dbPath), { recursive: true });
rmSync(dbPath, { force: true });
const db = new Database(dbPath);
let recordOne;
let recordTwo;
try {
  const firstWrite = ledger.writeHandoffReuseOutcomeLedgerRecordV01(
    approvalPayload(decisionPreview("alpha"), "alpha"),
    db,
  );
  assert.equal(firstWrite.status, "written");
  recordOne = firstWrite.record;
  const secondWrite = ledger.writeHandoffReuseOutcomeLedgerRecordV01(
    approvalPayload(decisionPreview("beta"), "beta"),
    db,
  );
  assert.equal(secondWrite.status, "written");
  recordTwo = secondWrite.record;
  assert(recordOne);
  assert(recordTwo);
  assert.equal(
    ledger.listHandoffReuseOutcomeLedgerRecordsV01({}, db).records.length,
    2,
  );

  const preview =
    previewModule.buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01({
      records: [recordOne, recordTwo],
      as_of: "2026-07-04T04:30:00.000Z",
      ledger_store_ref: "handoff_reuse_outcome_ledger_store:smoke",
    });
  assert.equal(preview.preview_version, "dogfood_metric_candidate_preview.v0.1");
  assert.equal(preview.candidate_status, "needs_review");
  assert.equal(preview.ledger_source.record_count, 2);
  assert.equal(preview.ledger_source.raw_record_count, 2);
  assert.equal(preview.aggregate_counts.approved_record_count, 2);
  assert.equal(preview.aggregate_counts.helpful_ref_count, 3);
  assert.equal(preview.aggregate_counts.stale_ref_count, 2);
  assert.equal(preview.aggregate_counts.missing_ref_count, 1);
  assert.equal(preview.aggregate_counts.noisy_ref_count, 1);
  assert.equal(preview.aggregate_counts.misleading_ref_count, 1);
  assert.equal(preview.aggregate_counts.unknown_ref_count, 3);
  assert.equal(preview.aggregate_counts.skipped_or_unverified_check_count, 1);
  assert.equal(preview.aggregate_counts.not_done_item_count, 1);
  assert.equal(preview.aggregate_counts.expected_observed_mismatch_count, 1);
  assert.equal(preview.reuse_quality_candidate.helpful_records, 2);
  assert.equal(preview.reuse_quality_candidate.problem_records, 2);
  assert.equal(preview.handoff_quality_candidate.records_with_skipped_checks, 1);
  assert.equal(preview.handoff_quality_candidate.records_with_not_done_items, 1);
  assert.equal(preview.handoff_quality_candidate.records_with_mismatches, 1);
  assert.equal(preview.metric_write_readiness.ready_for_metric_write, false);
  assert(
    preview.metric_write_readiness.refusal_reasons.includes(
      "metric_write_not_in_scope_for_v0_1",
    ),
  );
  assert.equal(preview.source_record_summaries.length, 2);
  assertSourceRecordSummary(preview.source_record_summaries[0]);
  assert(preview.source_record_summaries[0].mismatch_summary.length > 0);
  assertAuthorityBoundary(preview.authority_boundary);

  const cleanMatchedRecord = cleanMatchedLedgerRecord(recordTwo);
  const cleanMatchedPreview =
    previewModule.buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01({
      records: [cleanMatchedRecord],
      as_of: "2026-07-04T04:40:00.000Z",
    });
  assert.equal(cleanMatchedPreview.candidate_status, "candidate_signal");
  assert.equal(
    cleanMatchedPreview.aggregate_counts.expected_observed_mismatch_count,
    0,
  );
  assert.equal(
    cleanMatchedPreview.handoff_quality_candidate.records_with_mismatches,
    0,
  );
  assert.equal(
    cleanMatchedPreview.source_record_summaries[0]
      .expected_observed_mismatch,
    false,
  );
  assert.match(
    cleanMatchedPreview.source_record_summaries[0].mismatch_summary,
    /^Matched .* with no missing fields\.$/,
  );

  const sampleBacked = cloneJson(recordOne);
  sampleBacked.source_refs.push("codex-result-report:sample-safe");
  const sampleExcludedPreview =
    previewModule.buildDogfoodMetricCandidatePreviewFromReuseLedgerRecordsV01({
      records: [sampleBacked],
      as_of: "2026-07-04T04:45:00.000Z",
    });
  assert.equal(sampleExcludedPreview.ledger_source.record_count, 0);
  assert.equal(sampleExcludedPreview.ledger_source.excluded_record_count, 1);
  assert(
    sampleExcludedPreview.insufficient_data_reasons.includes(
      "sample_fixture_or_non_approved_records_excluded",
    ),
  );
} finally {
  db.close();
}

try {
  const invalidPathResponse = await metricRoute.GET(
    routeRequest(
      "GET",
      `?db_path=${encodeURIComponent("/Users/test/private.sqlite")}`,
    ),
  );
  assert.equal(invalidPathResponse.status, 400);
  const invalidPathJson = await invalidPathResponse.json();
  assert.equal(invalidPathJson.error_code, "invalid_db_path");
  assert.equal(invalidPathJson.no_metric_write, true);
  assert.equal(
    invalidPathJson.preview.metric_write_readiness.ready_for_metric_write,
    false,
  );

  const missingDbPath = `.tmp/dogfood-reuse-ledger/missing-metric-preview-${process.pid}.sqlite`;
  rmSync(missingDbPath, { force: true });
  const missingDbResponse = await metricRoute.GET(
    routeRequest("GET", `?db_path=${encodeURIComponent(missingDbPath)}`),
  );
  assert.equal(missingDbResponse.status, 404);
  const missingDbJson = await missingDbResponse.json();
  assert.equal(missingDbJson.error_code, "db_missing");
  assert.equal(missingDbJson.preview.candidate_status, "insufficient_data");
  assert.equal(existsSync(missingDbPath), false);

  const routePreviewResponse = await metricRoute.GET(
    routeRequest(
      "GET",
      `?db_path=${encodeURIComponent(dbPath)}&limit=10`,
    ),
  );
  assert.equal(routePreviewResponse.status, 200);
  const routePreviewJson = await routePreviewResponse.json();
  assert.equal(routePreviewJson.status, "ok");
  assert.equal(
    routePreviewJson.preview.preview_version,
    "dogfood_metric_candidate_preview.v0.1",
  );
  assert.equal(routePreviewJson.preview.ledger_source.record_count, 2);
  assert.equal(routePreviewJson.preview.aggregate_counts.helpful_ref_count, 3);
  assert.equal(
    routePreviewJson.preview.metric_write_readiness.ready_for_metric_write,
    false,
  );
  assert.equal(routePreviewJson.no_metric_write, true);
} finally {
  rmSync(dbPath, { force: true });
}

const windowDbPath = `.tmp/dogfood-reuse-ledger/metric-preview-window-${process.pid}.sqlite`;
mkdirSync(dirname(windowDbPath), { recursive: true });
rmSync(windowDbPath, { force: true });
const windowDb = new Database(windowDbPath);
try {
  for (let index = 0; index < 55; index += 1) {
    const oldWrite = ledger.writeHandoffReuseOutcomeLedgerRecordV01(
      approvalPayload(decisionPreview(`old-${index}`), `old-${index}`, {
        approvedAt: `2026-07-03T00:${String(index).padStart(2, "0")}:00.000Z`,
      }),
      windowDb,
    );
    assert.equal(oldWrite.status, "written");
  }
  const newerWrite = ledger.writeHandoffReuseOutcomeLedgerRecordV01(
    approvalPayload(decisionPreview("new-window"), "new-window", {
      approvedAt: "2026-07-04T06:00:00.000Z",
    }),
    windowDb,
  );
  assert.equal(newerWrite.status, "written");

  const windowResponse = await metricRoute.GET(
    routeRequest(
      "GET",
      `?db_path=${encodeURIComponent(windowDbPath)}&since=${encodeURIComponent(
        "2026-07-04T05:30:00.000Z",
      )}&limit=1`,
    ),
  );
  assert.equal(windowResponse.status, 200);
  const windowJson = await windowResponse.json();
  assert.equal(windowJson.preview.ledger_source.record_count, 1);
  assert.deepEqual(windowJson.preview.ledger_source.result_report_refs, [
    "codex-result-report:operator-metric-preview-new-window",
  ]);
} finally {
  windowDb.close();
  rmSync(windowDbPath, { force: true });
}

const operatorDbPath = `.tmp/dogfood-reuse-ledger/metric-preview-operator-${process.pid}.sqlite`;
mkdirSync(dirname(operatorDbPath), { recursive: true });
rmSync(operatorDbPath, { force: true });
const operatorDb = new Database(operatorDbPath);
try {
  const nonMatchingWrite = ledger.writeHandoffReuseOutcomeLedgerRecordV01(
    approvalPayload(decisionPreview("operator-nonmatch"), "operator-nonmatch", {
      approvedAt: "2026-07-04T07:00:00.000Z",
      approvedBy: "operator-ref:route-approved-by-nonmatch",
      operatorRef: "operator-ref:route-operator-nonmatch",
    }),
    operatorDb,
  );
  assert.equal(nonMatchingWrite.status, "written");
  const matchingOperatorRef = "operator-ref:route-filter-target";
  const matchingWrite = ledger.writeHandoffReuseOutcomeLedgerRecordV01(
    approvalPayload(decisionPreview("operator-target"), "operator-target", {
      approvedAt: "2026-07-04T07:10:00.000Z",
      approvedBy: "operator-ref:route-approved-by-different",
      operatorRef: matchingOperatorRef,
    }),
    operatorDb,
  );
  assert.equal(matchingWrite.status, "written");

  const operatorResponse = await metricRoute.GET(
    routeRequest(
      "GET",
      `?db_path=${encodeURIComponent(operatorDbPath)}&operator_ref=${encodeURIComponent(
        matchingOperatorRef,
      )}&limit=1`,
    ),
  );
  assert.equal(operatorResponse.status, 200);
  const operatorJson = await operatorResponse.json();
  assert.equal(operatorJson.preview.ledger_source.record_count, 1);
  assert.equal(
    operatorJson.preview.source_record_summaries[0].operator_ref,
    matchingOperatorRef,
  );
  assert.equal(
    operatorJson.preview.source_record_summaries[0].approved_by,
    "operator-ref:route-approved-by-different",
  );
} finally {
  operatorDb.close();
  rmSync(operatorDbPath, { force: true });
}

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "dogfood-metric-candidate-preview-v0-1",
});
const untrackedFiles = collectUntrackedFiles();
const changedAndUntrackedFiles = uniqueSorted([
  ...changedFilesBoundary.files,
  ...untrackedFiles,
]);
for (const file of changedAndUntrackedFiles) {
  assert(
    allowedChangedFiles.includes(file),
    `Unexpected dogfood metric candidate preview file: ${file}`,
  );
}

console.log(
  JSON.stringify(
    {
      smoke: "dogfood-metric-candidate-preview-v0-1",
      pass: true,
      empty_preview_insufficient_data: true,
      aggregate_counts_checked: true,
      clean_matched_summary_not_mismatch: true,
      source_record_summaries_checked: true,
      metric_write_readiness_false: true,
      route_invalid_path_refused: true,
      route_missing_db_bounded: true,
      route_preview_checked: true,
      route_date_window_before_limit_checked: true,
      route_operator_ref_filter_checked: true,
      workbench_default_empty_preview_checked: true,
      no_metric_write: true,
      no_memory_mutation: true,
      no_perspective_apply: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_observed: changedFilesBoundary.files,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:dogfood-metric-candidate-preview-v0-1");

function approvalPayload(preview, suffix, options = {}) {
  return {
    decision_preview: preview,
    operator_decision: "approve_for_future_write",
    idempotency_key: `handoff-reuse-outcome-ledger:metric-preview-smoke:${suffix}`,
    approved_by: options.approvedBy ?? `operator-ref:metric-preview-smoke-${suffix}`,
    operator_ref: options.operatorRef ?? `operator-ref:metric-preview-smoke-${suffix}`,
    approved_at:
      options.approvedAt ??
      (suffix === "alpha"
        ? "2026-07-04T04:10:00.000Z"
        : "2026-07-04T04:20:00.000Z"),
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
    review_note: "Synthetic operator-approved metric candidate preview smoke.",
  };
}

function decisionPreview(suffix) {
  const alpha = suffix === "alpha";
  const reuseClassifications = {
    helpful_refs: [
      reuseRef("helpful", `${suffix}-1`),
      ...(alpha ? [reuseRef("helpful", `${suffix}-2`)] : []),
    ],
    stale_refs: [reuseRef("stale", `${suffix}-1`)],
    missing_refs: alpha ? [reuseRef("missing", `${suffix}-1`)] : [],
    noisy_refs: alpha ? [reuseRef("noisy", `${suffix}-1`)] : [],
    misleading_refs: alpha ? [reuseRef("misleading", `${suffix}-1`)] : [],
    unknown_refs: [
      reuseRef("unknown", `${suffix}-1`),
      ...(alpha ? [reuseRef("unknown", `${suffix}-2`)] : []),
    ],
    corrections_needed: alpha ? ["drop noisy handoff ref"] : [],
    refs_to_preserve_next_time: [`context-ref:preserve-${suffix}`],
    refs_to_warn_next_time: [`context-ref:warn-${suffix}`],
    refs_to_drop_or_deprioritize: alpha
      ? [`context-ref:drop-${suffix}`]
      : [],
    confidence: "medium",
    review_needed: true,
  };
  const expectedObservedSummary = {
    matched_expectation_count: alpha ? 2 : 3,
    missing_expectation_count: alpha ? 1 : 0,
    unexpected_observation_count: 0,
    skipped_or_unverified_check_count: alpha ? 1 : 0,
    changed_files_observed: [
      "lib/dogfooding/dogfood-metric-candidate-preview.ts",
    ],
    checks_observed: [
      "npm run smoke:dogfood-metric-candidate-preview-v0-1",
    ],
    requirement_progress_observed: [
      "dogfood metric candidate preview derived from approved ledger records",
    ],
    missing_expectations: alpha
      ? ["metric write intentionally remains out of scope"]
      : [],
    unexpected_observations: [],
    not_done_items: alpha
      ? ["operator-reviewed dogfood metric write remains follow-up"]
      : [],
    mismatch_summary: alpha
      ? "Missing metric write is expected for this candidate-only slice."
      : "No expected/observed mismatch detected.",
    confidence: "medium",
  };
  const dogfoodSignal = {
    requirement_progress_observed:
      expectedObservedSummary.requirement_progress_observed,
    checks_observed: expectedObservedSummary.checks_observed,
    skipped_or_unverified_checks: alpha
      ? ["browser validation not in scope for read-only metric candidate smoke"]
      : [],
    not_done_items: expectedObservedSummary.not_done_items,
    mismatch_summary: expectedObservedSummary.mismatch_summary,
    context_feedback_signal_present: true,
    review_burden_hint: "candidate metric review still requires operator judgment",
    handoff_quality_hint: "handoff reuse signals remain candidate-only",
  };
  return {
    runtime: "augnes",
    preview_version: "dogfood_reuse_operator_decision_preview.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-04T04:00:00.000Z",
    source_refs: [
      `operator-provided-result:metric-preview-smoke-${suffix}`,
      "task-ref:augnes-codex-task-7",
    ],
    proposal_refs: {
      proposal_ref: `dogfood-reuse-proposal:metric-preview-${suffix}`,
      proposal_version: "dogfood_reuse_record_proposal.v0.1",
      proposal_status: "proposal_ready_for_operator_review",
      feedback_draft_ref: `codex-result-feedback-draft:metric-preview-${suffix}`,
      result_report_ref: `codex-result-report:operator-metric-preview-${suffix}`,
      result_report_fingerprint: `sha256:operator-metric-preview-${suffix}`,
      context_relay_rationale_ref: `handoff-context-relay-rationale:${suffix}`,
      continuity_relay_ref: `workplane-continuity-relay:${suffix}`,
      source_refs: [
        `operator-provided-result:metric-preview-smoke-${suffix}`,
      ],
    },
    decision_preview_status: "ready_for_operator_decision",
    recommended_operator_decision: "approve_for_future_write",
    available_operator_decisions: [
      "approve_for_future_write",
      "defer",
      "reject",
      "keep_candidate",
      "request_more_evidence",
    ],
    write_readiness: {
      write_ready: true,
      readiness_label: "ready for operator approval",
      requires_actual_result_report: true,
      requires_explicit_context_feedback: true,
      requires_operator_confirmation: true,
      requires_no_blockers: true,
      requires_evidence_backing: true,
      requires_skipped_checks_review: true,
      current_blockers: [],
      current_missing_evidence: [],
      confidence: "medium",
    },
    approval_requirements: ["explicit operator approval required"],
    blocking_reasons: [],
    missing_evidence: [],
    evidence_summary: {
      has_proposal: true,
      proposal_status: "proposal_ready_for_operator_review",
      has_feedback_draft: true,
      has_result_report: true,
      has_context_rationale: true,
      has_expected_return_signal: true,
      has_observed_return_signal: true,
      has_explicit_context_feedback: true,
      has_skipped_or_unverified_checks: alpha,
      has_insufficient_data: false,
      has_blocking_reasons: false,
      has_missing_evidence: false,
      evidence_refs: [`evidence-ref:metric-preview-${suffix}`],
      missing_evidence: [],
    },
    would_write_preview: {
      proposed_record_kind: "handoff_reuse_outcome_candidate",
      proposed_dogfood_signal_summary: dogfoodSignal,
      proposed_reuse_bucket_counts: {
        helpful_refs: reuseClassifications.helpful_refs.length,
        stale_refs: reuseClassifications.stale_refs.length,
        missing_refs: reuseClassifications.missing_refs.length,
        noisy_refs: reuseClassifications.noisy_refs.length,
        misleading_refs: reuseClassifications.misleading_refs.length,
        unknown_refs: reuseClassifications.unknown_refs.length,
      },
      proposed_reuse_classifications: reuseClassifications,
      proposed_expected_observed_summary: expectedObservedSummary,
      evidence_refs: [`evidence-ref:metric-preview-${suffix}`],
      carry_forward_candidates: {
        next_relay_update_suggestions: [
          `preserve candidate metric context ${suffix}`,
        ],
        next_handoff_adjustments: [
          `keep reuse metric preview candidate-only ${suffix}`,
        ],
        refs_to_preserve_next_time: reuseClassifications.refs_to_preserve_next_time,
        refs_to_warn_next_time: reuseClassifications.refs_to_warn_next_time,
        refs_to_drop_or_deprioritize:
          reuseClassifications.refs_to_drop_or_deprioritize,
        unresolved_gaps: alpha
          ? ["approved metric write contract remains unresolved"]
          : [],
        next_focus_candidate:
          "operator-reviewed dogfood metric write remains follow-up",
      },
      confidence: "medium",
    },
    would_not_write: [],
    candidate_carry_forward: {
      next_relay_update_suggestions: [
        `preserve candidate metric context ${suffix}`,
      ],
      next_handoff_adjustments: [
        `keep reuse metric preview candidate-only ${suffix}`,
      ],
      refs_to_preserve_next_time: reuseClassifications.refs_to_preserve_next_time,
      refs_to_warn_next_time: reuseClassifications.refs_to_warn_next_time,
      refs_to_drop_or_deprioritize:
        reuseClassifications.refs_to_drop_or_deprioritize,
      unresolved_gaps: alpha
        ? ["approved metric write contract remains unresolved"]
        : [],
      next_focus_candidate:
        "operator-reviewed dogfood metric write remains follow-up",
    },
    review_checklist: ["confirm skipped checks remain skipped"],
    non_goals: ["no metric write"],
    authority_boundary: {
      read_only: true,
      candidate_material_only: true,
      source_of_truth: false,
      derived_read_model: true,
      can_persist_decision: false,
      can_write_db: false,
      can_write_dogfood_ledger: false,
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
      notes: ["read-only operator decision preview"],
    },
    source_status: {
      proposal: "supplied",
      feedback_draft: "supplied",
      codex_result_report: "supplied",
      handoff_context_rationale: "supplied",
      codex_result_report_status: "supplied",
    },
    fallback_reason: null,
    notes: ["synthetic smoke preview"],
  };
}

function reuseRef(bucket, suffix) {
  return {
    ref_id: `context-ref:${bucket}-${suffix}`,
    label: `${bucket} ref ${suffix}`,
    reason_category: bucket,
    evidence_refs: [`evidence-ref:${bucket}-${suffix}`],
    summary: `${bucket} context reuse signal ${suffix}`,
  };
}

function assertSourceRecordSummary(summary) {
  assert(summary.record_id);
  assert(summary.result_report_ref);
  assert(summary.operator_ref);
  assert(summary.approved_by);
  assert(summary.created_at);
  assert(summary.proposed_record_kind);
  assert.equal(typeof summary.helpful_ref_count, "number");
  assert.equal(typeof summary.stale_ref_count, "number");
  assert.equal(typeof summary.missing_ref_count, "number");
  assert.equal(typeof summary.noisy_ref_count, "number");
  assert.equal(typeof summary.misleading_ref_count, "number");
  assert.equal(typeof summary.unknown_ref_count, "number");
  assert.equal(typeof summary.skipped_check_count, "number");
  assert.equal(typeof summary.not_done_item_count, "number");
  assert.equal(typeof summary.expected_observed_mismatch, "boolean");
  assert(summary.confidence);
}

function cleanMatchedLedgerRecord(record) {
  const clean = cloneJson(record);
  clean.reuse_classifications = {
    ...clean.reuse_classifications,
    helpful_refs: [reuseRef("helpful", "clean-matched")],
    stale_refs: [],
    missing_refs: [],
    noisy_refs: [],
    misleading_refs: [],
    unknown_refs: [],
    corrections_needed: [],
    review_needed: false,
  };
  clean.skipped_or_unverified_checks = [];
  clean.not_done_items = [];
  clean.expected_observed_summary = {
    ...clean.expected_observed_summary,
    matched_expectation_count: 3,
    missing_expectation_count: 0,
    unexpected_observation_count: 0,
    skipped_or_unverified_check_count: 0,
    missing_expectations: [],
    unexpected_observations: [],
    not_done_items: [],
    mismatch_summary: "Matched 3 expectations with no missing fields.",
    confidence: "medium",
  };
  clean.dogfood_signal = {
    ...clean.dogfood_signal,
    skipped_or_unverified_checks: [],
    not_done_items: [],
    mismatch_summary: clean.expected_observed_summary.mismatch_summary,
  };
  return clean;
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.read_only, true);
  assert.equal(boundary.candidate_material_only, true);
  assert.equal(boundary.source_of_truth, false);
  assert.equal(boundary.derived_read_model, true);
  assert.equal(boundary.can_write_db, false);
  assert.equal(boundary.can_write_dogfood_metrics, false);
  assert.equal(boundary.can_update_metrics, false);
  assert.equal(boundary.can_write_dogfood_ledger, false);
  assert.equal(boundary.can_mutate_memory, false);
  assert.equal(boundary.can_promote_memory, false);
  assert.equal(boundary.can_apply_project_perspective, false);
  assert.equal(boundary.can_create_promotion_decision, false);
  assert.equal(boundary.can_create_formation_receipt, false);
  assert.equal(boundary.can_call_provider_openai, false);
  assert.equal(boundary.can_call_github, false);
  assert.equal(boundary.can_execute_codex, false);
  assert.equal(boundary.can_send_handoff, false);
  assert.equal(boundary.can_create_pr, false);
  assert.equal(boundary.can_merge_pr, false);
  assert.equal(boundary.can_run_autonomous_action, false);
  assert.equal(boundary.can_create_graph_or_vector_store, false);
  assert.equal(boundary.can_create_rag_stack, false);
  assert.equal(boundary.can_crawl_or_observe_browser, false);
}

function assertNoForbiddenExpansion(label, text) {
  for (const forbidden of [
    "can_write_dogfood_metrics: true",
    "can_update_metrics: true",
    "can_mutate_memory: true",
    "can_apply_project_perspective: true",
    "can_create_promotion_decision: true",
    "can_create_formation_receipt: true",
    "can_call_provider_openai: true",
    "can_call_github: true",
    "can_execute_codex: true",
    "can_send_handoff: true",
    "can_run_autonomous_action: true",
    "can_create_graph_or_vector_store: true",
    "can_create_rag_stack: true",
    "can_crawl_or_observe_browser: true",
    "writeDogfoodMetric",
    "updateDogfoodMetric",
    "applyPerspective(",
    "createFormationReceiptV01(",
    "createPromotionDecision",
    "fetch(",
  ]) {
    assert(
      !text.includes(forbidden),
      `${label} must not include forbidden expansion ${forbidden}`,
    );
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function routeRequest(method, search = "") {
  return new Request(
    `http://localhost/api/dogfooding/reuse-ledger/metric-preview${search}`,
    {
      method,
      headers: {
        host: "localhost",
        "content-type": "application/json",
      },
    },
  );
}
