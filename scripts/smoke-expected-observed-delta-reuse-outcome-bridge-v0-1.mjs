#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, rmSync } from "node:fs";

import Database from "better-sqlite3";

import {
  assertContainsAll,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  loadTextByFile,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const files = {
  previewType: "types/expected-observed-delta-preview.ts",
  previewHelper: "lib/dogfooding/expected-observed-delta-preview.ts",
  previewPanel: "components/dogfooding/expected-observed-delta-preview-panel.tsx",
  decisionType: "types/expected-observed-delta-decision.ts",
  decisionHelper: "lib/dogfooding/expected-observed-delta-decision.ts",
  decisionPanel: "components/dogfooding/expected-observed-delta-decision-panel.tsx",
  writeType: "types/expected-observed-delta-write.ts",
  writeHelper: "lib/dogfooding/expected-observed-delta-write.ts",
  route: "app/api/dogfooding/expected-observed-deltas/route.ts",
  reviewType: "types/expected-observed-delta-record-review.ts",
  reviewHelper: "lib/dogfooding/expected-observed-delta-record-review.ts",
  reviewForWeb: "lib/dogfooding/read-expected-observed-delta-record-review-for-web.ts",
  reviewPanel: "components/dogfooding/expected-observed-delta-record-review-panel.tsx",
  bridgeType: "types/reuse-outcome-candidate-bridge-preview.ts",
  bridgeHelper: "lib/dogfooding/reuse-outcome-candidate-bridge-preview.ts",
  bridgePanel: "components/dogfooding/reuse-outcome-candidate-bridge-preview-panel.tsx",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  overviewType: "types/workbench-dogfood-loop-spine-overview.ts",
  overviewHelper: "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  agentWorkplaneSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  overviewSmoke: "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
  smoke: "scripts/smoke-expected-observed-delta-reuse-outcome-bridge-v0-1.mjs",
  packageJson: "package.json",
};

const textByFile = loadTextByFile(Object.values(files));
const packageJsonText = textByFile.get(files.packageJson);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:expected-observed-delta-reuse-outcome-bridge-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-expected-observed-delta-reuse-outcome-bridge-v0-1.mjs",
});

assertContainsAll(
  [
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
    files.bridgeType,
    files.bridgeHelper,
    files.bridgePanel,
  ]
    .map((file) => textByFile.get(file))
    .join("\n"),
  [
    "expected_observed_delta_preview.v0.1",
    "expected_observed_delta_operator_decision_preview.v0.1",
    "expected_observed_delta_record.v0.1",
    "expected_observed_delta_receipt.v0.1",
    "expected_observed_delta_store.v0.1",
    "reuse_outcome_candidate_bridge_preview.v0.1",
  ],
  { label: "ExpectedObservedDelta and bridge files" },
);

assertContainsAll(textByFile.get(files.agentWorkplane), [
  "ExpectedObservedDeltaPreviewPanel",
  "ExpectedObservedDeltaDecisionPanel",
  "ExpectedObservedDeltaRecordReviewPanel",
  "ReuseOutcomeCandidateBridgePreviewPanel",
  "buildExpectedObservedDeltaPreviewV01",
  "buildExpectedObservedDeltaOperatorDecisionPreviewV01",
  "readExpectedObservedDeltaRecordReviewForWebV01",
  "buildReuseOutcomeCandidateBridgePreviewV01",
  "expected_observed_delta_preview: expectedObservedDeltaPreview",
  "expected_observed_delta_decision_preview:",
  "expected_observed_delta_record_review:",
  "reuse_outcome_candidate_bridge_preview:",
]);

assertContainsAll(textByFile.get(files.overviewType), [
  "expected_observed_delta",
  "expected_observed_delta_record",
  "reuse_outcome_candidate_bridge",
  "review_expected_observed_delta_candidates",
  "write_expected_observed_delta_record",
  "review_reuse_outcome_candidate_bridge",
  "prepare_reuse_outcome_operator_decision",
]);
assertContainsAll(textByFile.get(files.overviewHelper), [
  "expected_observed_delta_preview",
  "expected_observed_delta_decision_preview",
  "expected_observed_delta_record_review",
  "reuse_outcome_candidate_bridge_preview",
  "expectedObservedDeltaStep",
  "expectedObservedDeltaRecordStep",
  "reuseOutcomeCandidateBridgeStep",
  "does_not_call_expected_observed_delta_route_from_workbench_overview",
]);

for (const panel of [
  files.previewPanel,
  files.decisionPanel,
  files.reviewPanel,
  files.bridgePanel,
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

assertScopedSqlOnly();

const previewModule = await import(
  "../lib/dogfooding/expected-observed-delta-preview.ts"
);
const decisionModule = await import(
  "../lib/dogfooding/expected-observed-delta-decision.ts"
);
const writeModule = await import(
  "../lib/dogfooding/expected-observed-delta-write.ts"
);
const reviewModule = await import(
  "../lib/dogfooding/expected-observed-delta-record-review.ts"
);
const bridgeModule = await import(
  "../lib/dogfooding/reuse-outcome-candidate-bridge-preview.ts"
);
const routeModule = await import(
  "../app/api/dogfooding/expected-observed-deltas/route.ts"
);
const codexReviewModule = await import(
  "../lib/intake/codex-result-report-intake-record-review.ts"
);
const residueModule = await import(
  "../lib/workplane/work-episode-residue-candidate-preview.ts"
);
const overviewModule = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);

const { buildExpectedObservedDeltaPreviewV01 } = previewModule;
const { buildExpectedObservedDeltaOperatorDecisionPreviewV01 } = decisionModule;
const {
  expectedObservedDeltaWriteSchemaExistsV01,
  listExpectedObservedDeltaRecordsV01,
  readExpectedObservedDeltaRecordByIdV01,
  readExpectedObservedDeltaRecordByIdempotencyKeyV01,
  validateExpectedObservedDeltaWriteInputV01,
  writeExpectedObservedDeltaRecordV01,
} = writeModule;
const { buildExpectedObservedDeltaRecordReviewV01 } = reviewModule;
const { buildReuseOutcomeCandidateBridgePreviewV01 } = bridgeModule;
const { isSafeExpectedObservedDeltaRouteDbPathV01, GET, POST } = routeModule;
const { buildCodexResultReportIntakeRecordReviewV01 } = codexReviewModule;
const { buildWorkEpisodeResidueCandidatePreviewV01 } = residueModule;
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = overviewModule;

const emptyPreview = buildExpectedObservedDeltaPreviewV01();
assert.equal(emptyPreview.delta_preview_status, "no_result_material");
assert(
  ["supply_codex_result_report", "supply_expected_material"].includes(
    emptyPreview.recommended_next_action,
  ),
);

const codexRecordReview = buildCodexResultReportIntakeRecordReviewV01({
  records: [codexResultRecord()],
});
const residuePreview = buildWorkEpisodeResidueCandidatePreviewV01({
  codex_result_report_intake_record_review: codexRecordReview,
});
const missingExpectedPreview = buildExpectedObservedDeltaPreviewV01({
  work_episode_residue_candidate_preview: residuePreview,
  codex_result_report_intake_record_review: codexRecordReview,
});
assert.equal(
  missingExpectedPreview.delta_preview_status,
  "insufficient_expected_material",
);
assert(missingExpectedPreview.insufficient_data_reasons.includes("expected_material_missing"));

const missingObservedPreview = buildExpectedObservedDeltaPreviewV01({
  codex_result_report_intake_preview: minimalResultMaterialPreview(),
  expected_material: cleanExpectedMaterial(),
});
assert.equal(
  missingObservedPreview.delta_preview_status,
  "insufficient_observed_material",
);
assert(missingObservedPreview.insufficient_data_reasons.includes("observed_material_missing"));

const deltaPreview = buildExpectedObservedDeltaPreviewV01({
  work_episode_residue_candidate_preview: residuePreview,
  codex_result_report_intake_record_review: codexRecordReview,
  expected_material: cleanExpectedMaterial(),
  source_refs: ["source:delta-clean"],
});
assert.equal(deltaPreview.evidence_summary.has_result_material, true);
assert.equal(deltaPreview.evidence_summary.has_expected_material, true);
assert(deltaPreview.input_summary.delta_candidate_count > 0);
assert(deltaPreview.delta_candidates.changed_file_delta_candidates.length > 0);
assert(deltaPreview.delta_candidates.skipped_or_unverified_check_candidates.length > 0);
assert(deltaPreview.delta_candidates.not_done_candidates.length > 0);
assert.equal(
  deltaPreview.verification_comparison.skipped_checks_count_as_passed,
  false,
);
assert.equal(
  deltaPreview.observed_summary.passed_or_completed_checks.some((item) =>
    /skip|not run|unverified/i.test(item),
  ),
  false,
);
assert.equal(
  deltaPreview.requirement_progress_comparison
    .changed_files_are_not_requirement_completion,
  true,
);
assert.equal(
  buildExpectedObservedDeltaPreviewV01({
    work_episode_residue_candidate_preview: residuePreview,
    codex_result_report_intake_record_review: codexRecordReview,
    expected_material: {
      ...cleanExpectedMaterial(),
      expected_requirement_progress: [],
    },
  }).delta_candidates.requirement_progress_delta_candidates.some((candidate) =>
    candidate.summary.includes("Changed file is observed artifact"),
  ),
  false,
);

const invalidSelectionDecision =
  buildExpectedObservedDeltaOperatorDecisionPreviewV01({
    expected_observed_delta_preview: deltaPreview,
    selected_delta_candidate_refs: ["candidate:delta:not-present"],
    requested_operator_ref: "operator:delta-clean",
    requested_idempotency_key: "idempotency:delta-clean",
    review_confirmation_ref: "review:delta-clean",
  });
assert.notEqual(
  invalidSelectionDecision.decision_preview_status,
  "ready_for_future_delta_record_write",
);
assert(
  invalidSelectionDecision.refusal_reasons.includes(
    "selected_delta_candidate_refs_not_in_delta_preview",
  ),
);

const selectableRef =
  buildExpectedObservedDeltaOperatorDecisionPreviewV01({
    expected_observed_delta_preview: deltaPreview,
  }).would_write_delta_record_preview.selectable_delta_candidate_refs[0];
const readyDecision = buildExpectedObservedDeltaOperatorDecisionPreviewV01({
  expected_observed_delta_preview: deltaPreview,
  selected_delta_candidate_refs: [selectableRef],
  requested_operator_ref: "operator:delta-clean",
  requested_idempotency_key: "idempotency:delta-clean",
  review_confirmation_ref: "review:delta-clean",
  source_refs: ["source:delta-decision-clean"],
});
assert.equal(
  readyDecision.decision_preview_status,
  "ready_for_future_delta_record_write",
);
assert.equal(readyDecision.write_readiness.write_ready, true);
assert.equal(
  readyDecision.recommended_operator_decision,
  "approve_for_expected_observed_delta_record",
);

const validInput = cleanWriteInput(readyDecision);
assert.equal(validateExpectedObservedDeltaWriteInputV01(validInput).ok, true);
assert.equal(
  writeExpectedObservedDeltaRecordV01(
    cleanWriteInput(
      buildExpectedObservedDeltaOperatorDecisionPreviewV01({
        expected_observed_delta_preview: deltaPreview,
      }),
    ),
    { db: inMemoryDb() },
  ).status,
  "refused",
);
assertRefused({
  input: { ...validInput, operator_approval: { ...validInput.operator_approval, checklist_confirmations: [] } },
  reason: "checklist_confirmations_missing",
});
assertRefused({
  input: { ...validInput, idempotency_key: "idempotency:delta-mismatch" },
  reason: "idempotency_key_mismatch_with_decision_preview",
});
assertRefused({
  input: { ...validInput, operator_approval: { ...validInput.operator_approval, operator_ref: "operator:delta-other" } },
  reason: "operator_ref_mismatch_with_decision_preview",
});
assertRefused({
  input: mutateMaterial(validInput, { source_refs: ["/Users/private/ref"] }),
  reason: "source_refs_unsafe",
});
assertRefused({
  input: {
    ...validInput,
    decision_preview: {
      ...validInput.decision_preview,
      source_refs: ["source:../private"],
      would_write_delta_record_preview: {
        ...validInput.decision_preview.would_write_delta_record_preview,
        source_refs: ["source:delta-decision-clean"],
      },
    },
  },
  reason: "decision_preview_source_refs_unsafe",
});
const unknownBucketDecision = structuredClone(readyDecision);
unknownBucketDecision.would_write_delta_record_preview.delta_candidate_summaries[0].bucket =
  "unknown_but_safe";
assertRefused({
  input: cleanWriteInput(unknownBucketDecision),
  reason: "delta_candidate_summary_bucket_invalid",
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
    requested_side_effects: { reuse_outcome_ledger_written: true },
  },
  reason: "requested_side_effect_not_allowed",
});

const dbPath = ".tmp/expected-observed-deltas/delta-clean.sqlite";
mkdirSync(".tmp/expected-observed-deltas", { recursive: true });
rmSync(dbPath, { force: true });
const db = new Database(dbPath);
try {
  const schemaBefore = listExpectedObservedDeltaRecordsV01({ db });
  assert.equal(schemaBefore.status, "schema_missing");
  assert.equal(expectedObservedDeltaWriteSchemaExistsV01(db), false);
  const written = writeExpectedObservedDeltaRecordV01(validInput, { db });
  assert.equal(written.status, "written");
  assert.equal(written.receipt.no_side_effects.expected_observed_delta_record_written, true);
  assert.equal(written.receipt.no_side_effects.expected_observed_delta_receipt_written, true);
  assert.equal(
    written.receipt.no_side_effects
      .expected_observed_delta_persisted_as_dogfood_signal_record,
    true,
  );
  assertAllForbiddenSideEffectsFalse(written.receipt.no_side_effects);
  assert.equal(
    writeExpectedObservedDeltaRecordV01(validInput, { db }).status,
    "idempotent_existing",
  );
  assert.equal(
    writeExpectedObservedDeltaRecordV01(
      { ...validInput, notes: ["clean-different-note"] },
      { db },
    ).status,
    "refused",
  );
  assert.equal(
    readExpectedObservedDeltaRecordByIdV01(written.record.record_id, { db })
      .status,
    "read",
  );
  assert.equal(
    readExpectedObservedDeltaRecordByIdempotencyKeyV01(
      validInput.idempotency_key,
      { db },
    ).status,
    "read",
  );
  assert.equal(listExpectedObservedDeltaRecordsV01({ db }).status, "listed");

  const noRecordsReview = buildExpectedObservedDeltaRecordReviewV01({ records: [] });
  assert.equal(noRecordsReview.review_status, "no_records");
  const recordsReview = buildExpectedObservedDeltaRecordReviewV01({
    records: [written.record],
    store_result: written,
  });
  assert.equal(recordsReview.review_status, "records_available");
  assert.equal(recordsReview.input_summary.valid_record_count, 1);
  const malformedReview = buildExpectedObservedDeltaRecordReviewV01({
    records: [{}],
  });
  assert.equal(malformedReview.review_status, "records_invalid");
  const forbiddenReceiptReview = buildExpectedObservedDeltaRecordReviewV01({
    records: [written.record],
    store_result: {
      ...written,
      no_side_effects: {
        ...written.no_side_effects,
        reuse_outcome_ledger_written: true,
      },
    },
  });
  assert.equal(forbiddenReceiptReview.review_status, "records_invalid");

  const bridgeNoMaterial = buildReuseOutcomeCandidateBridgePreviewV01();
  assert.equal(bridgeNoMaterial.bridge_preview_status, "no_delta_material");
  const bridgeFromPreview = buildReuseOutcomeCandidateBridgePreviewV01({
    expected_observed_delta_preview: deltaPreview,
    work_episode_residue_candidate_preview: residuePreview,
    codex_result_report_intake_record_review: codexRecordReview,
  });
  assert(
    ["reuse_outcome_candidates_available", "ready_for_operator_review"].includes(
      bridgeFromPreview.bridge_preview_status,
    ),
  );
  assert.equal(
    bridgeFromPreview.authority_boundary.can_write_reuse_outcome_ledger,
    false,
  );
  assert.equal(bridgeFromPreview.authority_boundary.can_write_dogfood_metrics, false);
  assert.equal(bridgeFromPreview.authority_boundary.can_write_memory, false);
  const bridgeFromRecord = buildReuseOutcomeCandidateBridgePreviewV01({
    expected_observed_delta_record_review: recordsReview,
  });
  assert(bridgeFromRecord.input_summary.delta_material_count > 0);

  const overview = buildWorkbenchDogfoodLoopSpineOverviewV01({
    expected_observed_delta_preview: deltaPreview,
    expected_observed_delta_decision_preview: readyDecision,
    expected_observed_delta_record_review: recordsReview,
    reuse_outcome_candidate_bridge_preview: bridgeFromPreview,
  });
  assert(stepById(overview, "expected_observed_delta"));
  assert(stepById(overview, "expected_observed_delta_record"));
  assert(stepById(overview, "reuse_outcome_candidate_bridge"));
  assertNoForbiddenOverviewRecommendations(overview);
} finally {
  db.close();
}

assert.equal(isSafeExpectedObservedDeltaRouteDbPathV01(dbPath), true);
for (const unsafePath of [
  "/tmp/expected-observed-deltas/nope.sqlite",
  "tmp/expected-observed-deltas/../nope.sqlite",
  "tmp/expected-observed-deltas/nope.txt",
  "tmp//expected-observed-deltas/nope.sqlite",
  "tmp\\expected-observed-deltas\\nope.sqlite",
  "tmp/expected-observed-deltas/token.sqlite",
]) {
  assert.equal(isSafeExpectedObservedDeltaRouteDbPathV01(unsafePath), false);
}

const missingGet = await GET(
  new Request("http://localhost/api/dogfooding/expected-observed-deltas?db_path=tmp/expected-observed-deltas/missing.sqlite"),
);
assert.equal(missingGet.status, 404);
assert.equal((await missingGet.json()).error_code, "db_missing");
const unsafeGet = await GET(
  new Request("http://localhost/api/dogfooding/expected-observed-deltas?db_path=/tmp/nope.sqlite"),
);
assert.equal(unsafeGet.status, 400);

const routeDbPath = ".tmp/expected-observed-deltas/route-clean.sqlite";
rmSync(routeDbPath, { force: true });
const invalidPost = await POST(
  routeRequest({ db_path: routeDbPath, input: { nope: true } }),
);
assert.equal(invalidPost.status, 400);
assert.equal(existsSync(routeDbPath), false, "POST must validate before opening write DB");
assert.equal(
  (
    await POST(routeRequest({ action: "bad", db_path: routeDbPath, input: validInput }))
  ).status,
  400,
);
assert.equal(
  (
    await POST(
      new Request("http://localhost/api/dogfooding/expected-observed-deltas", {
        method: "POST",
        headers: { host: "localhost", origin: "http://evil.test" },
        body: JSON.stringify({ db_path: routeDbPath, input: validInput }),
      }),
    )
  ).status,
  403,
);
const validPost = await POST(routeRequest({ db_path: routeDbPath, input: validInput }));
assert.equal(validPost.status, 201);
const validPostBody = await validPost.json();
assert.equal(validPostBody.expected_observed_delta_record_written, true);
assert.equal(validPostBody.no_side_effects.reuse_outcome_ledger_written, false);
assert.equal(validPostBody.no_side_effects.dogfood_metrics_written, false);
assert.equal(validPostBody.no_side_effects.work_episode_written, false);
assert.equal(validPostBody.no_side_effects.memory_mutated, false);
assert.equal(validPostBody.no_side_effects.current_working_perspective_updated, false);
assert.equal(validPostBody.no_side_effects.provider_called, false);
assert.equal(validPostBody.no_side_effects.github_called, false);
assert.equal(validPostBody.no_side_effects.codex_executed, false);

rmSync(dbPath, { force: true });
rmSync(routeDbPath, { force: true });
assertChangedFilesWithinExpectedScope();

console.log(
  JSON.stringify(
    {
      smoke: "expected-observed-delta-reuse-outcome-bridge-v0-1",
      pass: true,
      writer_checked: true,
      route_checked: true,
      review_checked: true,
      bridge_checked: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:expected-observed-delta-reuse-outcome-bridge-v0-1");

function cleanExpectedMaterial() {
  return {
    expected_files: ["lib/dogfooding/expected-observed-delta-preview.ts"],
    expected_checks: ["npm run typecheck"],
    expected_requirement_progress: ["ExpectedObservedDelta bridge visible"],
    expected_non_goals: ["no reuse ledger write"],
    expected_risks: ["skipped checks remain gaps"],
    expected_followups: ["review reuse outcome bridge"],
    work_ref: "work:delta-clean",
    result_ref: "result:delta-clean",
    handoff_ref: "handoff:delta-clean",
    source_refs: ["source:delta-clean"],
    evidence_refs: ["evidence:delta-clean"],
  };
}

function codexResultRecord() {
  return {
    record_version: "codex_result_report_intake_record.v0.1",
    record_id: "record:codex-delta-clean",
    idempotency_key: "idempotency:codex-delta-clean",
    created_at: "2026-07-04T12:00:00.000Z",
    scope: "project:augnes",
    source_refs: ["source:delta-clean"],
    evidence_refs: ["evidence:delta-clean"],
    source_kind: "codex_result_report",
    source_ref: "source:delta-clean",
    operator_ref: "operator:delta-clean",
    project_ref: "project:augnes",
    work_ref: "work:delta-clean",
    result_ref: "result:delta-clean",
    pr_ref: "pr:972",
    commit_ref: "commit:delta-clean",
    selected_candidate_refs: ["candidate:delta-clean"],
    candidate_counts_by_kind: {
      changed_artifact_ref: 1,
      expected_observed_signal: 2,
      next_action: 1,
      requirement: 1,
      reusable_context: 1,
    },
    sanitized_candidate_summaries: [
      {
        candidate_ref: "candidate:delta-clean",
        candidate_kind: "changed_artifact_ref",
        label: "Changed artifact",
        summary: "lib/dogfooding/expected-observed-delta-preview.ts",
      },
    ],
    result_status_summary: ["completed bounded implementation"],
    changed_files_summary: ["lib/dogfooding/expected-observed-delta-preview.ts"],
    checks_summary: ["npm run typecheck passed", "npm run optional check skipped"],
    skipped_checks_summary: ["npm run optional check skipped"],
    not_done_summary: ["not done: reuse ledger write"],
    requirement_progress_summary: ["ExpectedObservedDelta bridge visible"],
    expected_observed_signal_summary: [],
    context_reuse_signal_summary: ["prior residue candidates were helpful"],
    risk_or_regression_summary: ["changed files alone are not requirement completion"],
    followup_summary: ["review reuse outcome bridge"],
    privacy_review_confirmation_ref: "privacy:delta-clean",
    authority_boundary: {
      can_write_work_episode: false,
      can_write_expected_observed_delta: false,
      can_write_reuse_outcome_ledger: false,
      can_write_dogfood_metrics: false,
      can_write_memory: false,
      can_mutate_current_working_perspective: false,
      can_write_perspective_unit: false,
      can_write_next_work_bias: false,
      can_update_continuity_relay: false,
      can_mutate_handoff_context: false,
      can_send_handoff: false,
      can_call_provider_openai: false,
      can_call_github: false,
      can_execute_codex: false,
    },
    no_promotion_performed: {
      work_episode_written: false,
      expected_observed_delta_written: false,
      reuse_outcome_ledger_written: false,
      dogfood_metrics_written: false,
      memory_promoted: false,
      current_working_perspective_updated: false,
      perspective_unit_written: false,
      next_work_bias_written: false,
      continuity_relay_written: false,
      handoff_context_mutated: false,
      handoff_sent: false,
    },
    authority_profile: {},
    review_status: "ingested_as_candidate_record",
    persistence_horizon: "local_project_candidate_record",
    raw_material_policy: {},
    carry_forward_review_only_material: { review_only_candidates: [] },
    write_validation: {},
    notes: [],
    record_fingerprint: "fingerprint:codex-delta-clean",
  };
}

function minimalResultMaterialPreview() {
  return {
    preview_version: "codex_result_report_intake_preview.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-04T12:00:00.000Z",
    source_refs: ["source:minimal-result"],
    input_summary: { candidate_count: 1 },
    candidate_material: {
      result_summary_candidates: [],
      changed_file_candidates: [],
      check_result_candidates: [],
      skipped_check_candidates: [],
      not_done_candidates: [],
      requirement_progress_candidates: [],
      expected_observed_signal_candidates: [],
      context_reuse_signal_candidates: [],
      risk_or_regression_candidates: [],
      followup_candidates: [],
      reusable_context_candidates: [],
      review_only_candidates: [],
    },
    evidence_summary: { evidence_refs: ["evidence:minimal-result"] },
    blocked_reasons: [],
  };
}

function cleanWriteInput(decisionPreview) {
  return {
    decision_preview: decisionPreview,
    operator_approval: {
      operator_decision: "approve_for_expected_observed_delta_record",
      approved_by: "operator:delta-clean",
      operator_ref: "operator:delta-clean",
      approved_at: "2026-07-04T12:05:00.000Z",
      approval_statement: "record bounded expected observed delta signal",
      checklist_confirmations: [...decisionPreview.approval_requirements],
    },
    idempotency_key: "idempotency:delta-clean",
    requested_side_effects: {
      can_write_expected_observed_delta: true,
      can_create_expected_observed_delta_record: true,
      can_create_expected_observed_delta_receipt: true,
    },
    notes: ["clean-delta-record"],
  };
}

function mutateMaterial(input, patch) {
  return {
    ...input,
    decision_preview: {
      ...input.decision_preview,
      would_write_delta_record_preview: {
        ...input.decision_preview.would_write_delta_record_preview,
        ...patch,
      },
    },
  };
}

function assertRefused({ input, reason }) {
  const db = inMemoryDb();
  try {
    const result = writeExpectedObservedDeltaRecordV01(input, { db });
    assert.equal(result.status, "refused");
    assert(
      result.receipt.refusal_reasons.includes(reason),
      `Expected refusal ${reason}; received ${result.receipt.refusal_reasons.join(", ")}`,
    );
    assert.equal(expectedObservedDeltaWriteSchemaExistsV01(db), false);
    assert.equal(listExpectedObservedDeltaRecordsV01({ db }).status, "schema_missing");
  } finally {
    db.close();
  }
}

function inMemoryDb() {
  return new Database(":memory:");
}

function assertAllForbiddenSideEffectsFalse(noSideEffects) {
  for (const field of [
    "reuse_outcome_ledger_written",
    "dogfood_metrics_written",
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

function routeRequest(body) {
  return new Request("http://localhost/api/dogfooding/expected-observed-deltas", {
    method: "POST",
    headers: {
      host: "localhost",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function stepById(overview, stepId) {
  const step = overview.spine_steps.find((candidate) => candidate.step_id === stepId);
  assert(step, `Expected overview step ${stepId}`);
  return step;
}

function assertNoForbiddenOverviewRecommendations(overview) {
  const serialized = JSON.stringify(overview);
  for (const forbidden of [
    "write_reuse_outcome_ledger",
    "write_dogfood_metrics",
    "write_memory",
    "write_perspective_unit",
    "write_next_work_bias",
    "mutate_current_working_perspective",
    "update_current_working_perspective",
    "write_continuity_relay",
    "apply_handoff_context",
    "send_handoff",
    "call_provider",
    "call_github",
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

function assertScopedSqlOnly() {
  const sqlFiles = Object.values(files).filter((file) => {
    if (file.startsWith("scripts/")) return false;
    const text = textByFile.get(file);
    return /\b(CREATE TABLE|INSERT INTO|UPDATE\s+\w+\s+SET|DELETE FROM)\b/i.test(text);
  });
  for (const file of sqlFiles) {
    assert(
      [files.writeHelper, files.route].includes(file),
      `Only the scoped ExpectedObservedDelta writer/route may contain SQL write/schema text: ${file}`,
    );
  }
  assertContainsAll(textByFile.get(files.writeHelper), [
    "CREATE TABLE IF NOT EXISTS expected_observed_delta_records",
    "INSERT INTO expected_observed_delta_records",
  ]);
  const allText = Object.values(files)
    .filter((file) => !file.startsWith("scripts/"))
    .map((file) => textByFile.get(file))
    .join("\n");
  for (const forbidden of [
    "writeOperatorApprovedHandoffReuseOutcomeLedger(",
    "dogfood_metrics_written: true",
    "memory_mutated: true",
    "current_working_perspective_updated: true",
    "perspective_unit_written: true",
    "handoff_context_mutated: true",
    "provider_called: true",
    "github_called: true",
    "codex_executed: true",
  ]) {
    assert(!allText.includes(forbidden), `forbidden positive path: ${forbidden}`);
  }
}

function assertChangedFilesWithinExpectedScope() {
  const workingTree = collectGitDiffFiles(["diff", "--name-only"]);
  const cached = collectGitDiffFiles(["diff", "--cached", "--name-only"]);
  const baseRange = getBaseRangeChangedFiles();
  const untrackedFiles = collectUntrackedFiles();
  const changedFiles = uniqueSorted([
    ...workingTree.files,
    ...cached.files,
    ...baseRange.files,
    ...untrackedFiles,
  ]);
  const allowed = new Set(Object.values(files));
  for (const file of changedFiles) {
    assert(allowed.has(file), `Unexpected changed file for ExpectedObservedDelta bridge: ${file}`);
  }
}
