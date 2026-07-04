#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
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

const typeFile = "types/handoff-reuse-outcome-ledger.ts";
const helperFile = "lib/dogfooding/handoff-reuse-outcome-ledger.ts";
const routeFile = "app/api/dogfooding/reuse-ledger/route.ts";
const decisionTypeFile = "types/dogfood-reuse-operator-decision-preview.ts";
const decisionHelperFile =
  "lib/dogfooding/dogfood-reuse-operator-decision-preview.ts";
const decisionSmokeFile =
  "scripts/smoke-dogfood-reuse-operator-decision-preview-v0-1.mjs";
const proposalSmokeFile =
  "scripts/smoke-dogfood-reuse-record-proposal-v0-1.mjs";
const feedbackSmokeFile = "scripts/smoke-codex-result-feedback-draft-v0-1.mjs";
const workplanePanelsSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const handoffRationaleSmokeFile =
  "scripts/smoke-handoff-context-relay-rationale-v0-1.mjs";
const continuityRelaySmokeFile =
  "scripts/smoke-workplane-continuity-relay-v0-1.mjs";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-handoff-reuse-outcome-ledger-write-v0-1.mjs";
const fixtureFile = "fixtures/codex-result-report-ingestion.sample.v0.1.json";
const dogfoodMetricCandidateTypeFile =
  "types/dogfood-metric-candidate-preview.ts";
const dogfoodMetricCandidateHelperFile =
  "lib/dogfooding/dogfood-metric-candidate-preview.ts";
const dogfoodMetricCandidatePanelFile =
  "components/dogfood-metric-candidate-preview-panel.tsx";
const dogfoodMetricCandidateRouteFile =
  "app/api/dogfooding/reuse-ledger/metric-preview/route.ts";
const dogfoodMetricCandidateSmokeFile =
  "scripts/smoke-dogfood-metric-candidate-preview-v0-1.mjs";
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
  routeFile,
  decisionTypeFile,
  decisionHelperFile,
  decisionSmokeFile,
  proposalSmokeFile,
  feedbackSmokeFile,
  workplanePanelsSmokeFile,
  handoffRationaleSmokeFile,
  continuityRelaySmokeFile,
  packageJsonFile,
  smokeFile,
  dogfoodMetricCandidateTypeFile,
  dogfoodMetricCandidateHelperFile,
  dogfoodMetricCandidatePanelFile,
  dogfoodMetricCandidateRouteFile,
  dogfoodMetricCandidateSmokeFile,
  perspectiveNextWorkCandidateTypeFile,
  perspectiveNextWorkCandidateHelperFile,
  perspectiveNextWorkCandidatePanelFile,
  perspectiveNextWorkCandidateSmokeFile,
  metricInformedContinuityRelayAdjustmentTypeFile,
  metricInformedContinuityRelayAdjustmentHelperFile,
  metricInformedContinuityRelayAdjustmentPanelFile,
  metricInformedContinuityRelayAdjustmentSmokeFile,
  agentWorkplaneFile,
];

const textByFile = loadTextByFile([
  ...allowedChangedFiles,
  agentWorkplaneFile,
  fixtureFile,
]);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const routeText = textByFile.get(routeFile);
const decisionTypeText = textByFile.get(decisionTypeFile);
const decisionHelperText = textByFile.get(decisionHelperFile);
const packageJsonText = textByFile.get(packageJsonFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const fixture = JSON.parse(readFileSync(fixtureFile, "utf8"));

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:handoff-reuse-outcome-ledger-write-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-handoff-reuse-outcome-ledger-write-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "handoff_reuse_outcome_ledger_record.v0.1",
    "handoff_reuse_outcome_ledger_write_receipt.v0.1",
    "decision_preview",
    "operator_decision",
    "idempotency_key",
    "checklist_confirmations",
    "actual_result_report_confirmed",
    "skipped_checks_reviewed_not_counted_as_success",
    "reuse_classifications_evidence_backed",
    "unknown_refs_remain_unknown",
    "carry_forward_candidates_are_candidate_only",
    "no_durable_memory_or_perspective_apply",
    "no_metric_update_expected",
    "can_write_handoff_reuse_ledger",
    "can_write_db",
    "can_write_dogfood_ledger",
    "can_update_metrics: false",
    "can_mutate_memory: false",
    "can_apply_project_perspective: false",
    "can_create_promotion_decision: false",
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
    "writeHandoffReuseOutcomeLedgerRecordV01",
    "validateHandoffReuseOutcomeLedgerWriteInputV01",
    "refuseHandoffReuseOutcomeLedgerWriteV01",
    "readHandoffReuseOutcomeLedgerRecordV01",
    "readHandoffReuseOutcomeLedgerRecordByIdempotencyKeyV01",
    "listHandoffReuseOutcomeLedgerRecordsV01",
    "handoff_reuse_outcome_ledger_records",
    "decision_preview_missing",
    "decision_preview_not_write_ready",
    "sample_fixture_backed_preview_refused",
    "default_workbench_missing_result_path_refused",
    "idempotency_key_conflict",
    "can_write_handoff_reuse_ledger: writeNow",
    "can_update_metrics: false",
    "can_mutate_memory: false",
    "can_apply_project_perspective: false",
    "can_create_formation_receipt: false",
    "can_call_provider_openai: false",
    "can_call_github: false",
    "can_execute_codex: false",
    "can_send_handoff: false",
  ],
  { label: helperFile },
);

assertContainsAll(
  routeText,
  [
    "routeVersion = \"handoff_reuse_outcome_ledger_route.v0.1\"",
    "validateHandoffReuseOutcomeLedgerWriteInputV01",
    "writeHandoffReuseOutcomeLedgerRecordV01",
    "refuseHandoffReuseOutcomeLedgerWriteV01",
    "readHandoffReuseOutcomeLedgerRecordV01",
    "listHandoffReuseOutcomeLedgerRecordsV01",
    ".tmp/dogfood-reuse-ledger/",
    "same_origin_required",
    "handoff_reuse_outcome_ledger_record_written",
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

assertContainsAll(
  decisionTypeText,
  ["proposed_reuse_classifications"],
  { label: decisionTypeFile },
);
assertContainsAll(
  decisionHelperText,
  ["proposed_reuse_classifications"],
  { label: decisionHelperFile },
);
assert(
  !agentWorkplaneText.includes("reuse-ledger"),
  "Workbench must not expose a reuse-ledger write route or button",
);
assert(
  !agentWorkplaneText.includes("writeHandoffReuseOutcomeLedgerRecordV01"),
  "Workbench render must not call the ledger write helper",
);

for (const [label, text] of [
  [helperFile, helperText],
  [routeFile, routeText],
]) {
  assertNoForbiddenAuthorityExpansion(label, text);
}

const { readGuideBriefForWeb } = await import(
  "../lib/guide/read-guide-brief-for-web.ts"
);
const { readWorkplaneContext } = await import(
  "../lib/workplane/read-workplane-context.ts"
);
const { readHandoffCapsulePreviewForWeb } = await import(
  "../lib/handoff/read-handoff-capsule-for-web.ts"
);
const { buildHandoffContextRelayRationale } = await import(
  "../lib/handoff/handoff-context-relay-rationale.ts"
);
const { normalizeCodexResultReportV01 } = await import(
  "../lib/dogfooding/codex-result-report-normalizer.ts"
);
const { buildCodexResultFeedbackDraft } = await import(
  "../lib/dogfooding/codex-result-feedback-draft.ts"
);
const { buildDogfoodReuseRecordProposal } = await import(
  "../lib/dogfooding/dogfood-reuse-record-proposal.ts"
);
const { buildDogfoodReuseOperatorDecisionPreview } = await import(
  "../lib/dogfooding/dogfood-reuse-operator-decision-preview.ts"
);
const ledger = await import(
  "../lib/dogfooding/handoff-reuse-outcome-ledger.ts"
);
const ledgerRoute = await import(
  "../app/api/dogfooding/reuse-ledger/route.ts"
);

const guideBrief = readGuideBriefForWeb();
const workplaneContext = await readWorkplaneContext({ guide_brief: guideBrief });
const handoffPreview = readHandoffCapsulePreviewForWeb();
const rationale = buildHandoffContextRelayRationale({
  continuity_relay: workplaneContext.continuity_relay,
  handoff_preview: handoffPreview,
});

const defaultWorkbenchDecision = buildDecision(null);
assert.equal(defaultWorkbenchDecision.source_status.codex_result_report, "missing");
assert.equal(defaultWorkbenchDecision.write_readiness.write_ready, false);

const reusableRefs = rationale.selected_refs
  .filter((ref) => !ref.ref_id.startsWith("missing:"))
  .slice(0, 5);
assert(reusableRefs.length >= 5, "rationale must expose selected refs");

const sampleBackedDecision = buildDecision({
  ...fixture.safe_input_example,
  expected_observed_delta: explicitContextDelta(reusableRefs),
});
assert.equal(sampleBackedDecision.write_readiness.write_ready, true);

const nonWriteReadyDecision = buildDecision(buildOperatorProvidedReportInput({
  report_id: "codex-result-report:operator-provided-non-write-ready",
  expected_observed_delta: ["next-relay-update:context feedback still missing"],
}));
assert.equal(nonWriteReadyDecision.write_readiness.write_ready, false);

const readyDecision = buildDecision(buildOperatorProvidedReportInput({
  report_id: "codex-result-report:operator-provided-ledger-smoke-2026-07-04",
  expected_observed_delta: explicitContextDelta(reusableRefs),
}));
assert.equal(readyDecision.decision_preview_status, "ready_for_operator_decision");
assert.equal(readyDecision.write_readiness.write_ready, true);
assert.equal(
  readyDecision.would_write_preview.proposed_record_kind,
  "handoff_reuse_outcome_candidate",
);
assert(readyDecision.would_write_preview.proposed_reuse_classifications);

const dbPath = `.tmp/dogfood-reuse-ledger/smoke-${process.pid}.sqlite`;
mkdirSync(dirname(dbPath), { recursive: true });
rmSync(dbPath, { force: true });
const db = new Database(dbPath);
try {
  assertRefused(
    ledger.writeHandoffReuseOutcomeLedgerRecordV01({}, db),
    "decision_preview_missing",
  );
  assert.equal(ledger.handoffReuseOutcomeLedgerStoreSchemaExistsV01(db), false);

  assertRefused(
    ledger.writeHandoffReuseOutcomeLedgerRecordV01(
      approvalPayload(defaultWorkbenchDecision),
      db,
    ),
    "default_workbench_missing_result_path_refused",
  );
  assert.equal(ledger.handoffReuseOutcomeLedgerStoreSchemaExistsV01(db), false);

  assertRefused(
    ledger.writeHandoffReuseOutcomeLedgerRecordV01(
      approvalPayload(sampleBackedDecision),
      db,
    ),
    "sample_fixture_backed_preview_refused",
  );
  assert.equal(ledger.handoffReuseOutcomeLedgerStoreSchemaExistsV01(db), false);

  assertRefused(
    ledger.writeHandoffReuseOutcomeLedgerRecordV01(
      approvalPayload(nonWriteReadyDecision),
      db,
    ),
    "decision_preview_not_write_ready",
  );
  assert.equal(ledger.handoffReuseOutcomeLedgerStoreSchemaExistsV01(db), false);

  assertRefused(
    ledger.writeHandoffReuseOutcomeLedgerRecordV01(
      omitField(approvalPayload(readyDecision), "operator_decision"),
      db,
    ),
    "operator_decision_not_approve_for_future_write",
  );
  assertRefused(
    ledger.writeHandoffReuseOutcomeLedgerRecordV01(
      {
        ...approvalPayload(readyDecision),
        operator_decision: "defer",
      },
      db,
    ),
    "operator_decision_not_approve_for_future_write",
  );
  assertRefused(
    ledger.writeHandoffReuseOutcomeLedgerRecordV01(
      {
        ...approvalPayload(readyDecision),
        checklist_confirmations: {
          ...allChecklistConfirmations(),
          reuse_classifications_evidence_backed: false,
        },
      },
      db,
    ),
    "checklist_confirmation_missing:reuse_classifications_evidence_backed",
  );
  assertRefused(
    ledger.writeHandoffReuseOutcomeLedgerRecordV01(
      approvalPayload({
        ...cloneJson(readyDecision),
        blocking_reasons: ["blocked_test"],
      }),
      db,
    ),
    "decision_preview_blocking_reasons_present",
  );
  assertRefused(
    ledger.writeHandoffReuseOutcomeLedgerRecordV01(
      approvalPayload({
        ...cloneJson(readyDecision),
        missing_evidence: ["missing_test"],
      }),
      db,
    ),
    "decision_preview_missing_evidence_present",
  );
  assertRefused(
    ledger.writeHandoffReuseOutcomeLedgerRecordV01(
      approvalPayload({
        ...cloneJson(readyDecision),
        proposal_refs: {
          ...readyDecision.proposal_refs,
          result_report_ref: null,
        },
      }),
      db,
    ),
    "result_report_ref_missing",
  );
  assertRefused(
    ledger.writeHandoffReuseOutcomeLedgerRecordV01(
      {
        ...approvalPayload(readyDecision),
        requested_actions: { update_metrics: true },
      },
      db,
    ),
    "forbidden_action_requested:requested_actions.update_metrics",
  );
  assertRefused(
    ledger.writeHandoffReuseOutcomeLedgerRecordV01(
      omitField(
        {
          ...approvalPayload(readyDecision),
          approved_by: "operator-ref:/Users/test",
        },
        "operator_ref",
      ),
      db,
    ),
    "approved_by_missing_or_invalid",
  );
  assertRefused(
    ledger.writeHandoffReuseOutcomeLedgerRecordV01(
      {
        ...approvalPayload(readyDecision),
        operator_ref: "operator-ref:ghp_secret-token",
      },
      db,
    ),
    "operator_ref_missing_or_invalid",
  );

  const approvedByFallbackRef = "operator-ref:ledger-smoke-approved-by-fallback";
  assertActorFallbackValidation(
    omitField(
      {
        ...approvalPayload(readyDecision),
        operator_ref: approvedByFallbackRef,
      },
      "approved_by",
    ),
    approvedByFallbackRef,
    approvedByFallbackRef,
  );
  const operatorRefFallbackRef = "operator-ref:ledger-smoke-operator-ref-fallback";
  assertActorFallbackValidation(
    omitField(
      {
        ...approvalPayload(readyDecision),
        approved_by: operatorRefFallbackRef,
      },
      "operator_ref",
    ),
    operatorRefFallbackRef,
    operatorRefFallbackRef,
  );
  assertRefused(
    ledger.writeHandoffReuseOutcomeLedgerRecordV01(
      omitField(
        {
          ...approvalPayload(readyDecision),
          operator_ref: "operator-ref:sk-secret-token",
        },
        "approved_by",
      ),
      db,
    ),
    "approved_by_missing_or_invalid",
  );

  const missingNestedArraysResult = assertMalformedPreviewRefused(
    db,
    (preview) => {
      delete preview.blocking_reasons;
      delete preview.missing_evidence;
    },
    "decision_preview_blocking_reasons_invalid",
  );
  assert(
    missingNestedArraysResult.receipt.refusal_reasons.includes(
      "decision_preview_missing_evidence_invalid",
    ),
    "missing malformed missing_evidence refusal reason",
  );
  assertMalformedPreviewRefused(
    db,
    (preview) => {
      preview.source_status = "not-a-source-status-object";
    },
    "decision_preview_source_status_invalid",
  );
  assertMalformedPreviewRefused(
    db,
    (preview) => {
      preview.proposal_refs = "not-a-proposal-refs-object";
    },
    "decision_preview_proposal_refs_invalid",
  );
  assertMalformedPreviewRefused(
    db,
    (preview) => {
      delete preview.would_write_preview;
    },
    "decision_preview_would_write_preview_invalid",
  );
  assertMalformedPreviewRefused(
    db,
    (preview) => {
      preview.authority_boundary = {
        read_only: true,
        candidate_material_only: "yes",
      };
    },
    "decision_preview_authority_boundary_invalid",
  );
  assert.equal(ledger.handoffReuseOutcomeLedgerStoreSchemaExistsV01(db), false);

  const writeResult = ledger.writeHandoffReuseOutcomeLedgerRecordV01(
    approvalPayload(readyDecision),
    db,
  );
  assert.equal(writeResult.status, "written");
  assert.equal(writeResult.receipt.wrote, true);
  assert.equal(writeResult.receipt.refused, false);
  assert.equal(writeResult.records.length, 1);
  assert.equal(countRecords(db), 1);

  const record = writeResult.record;
  assert(record);
  assert.equal(record.record_version, "handoff_reuse_outcome_ledger_record.v0.1");
  assert.equal(record.operator_decision, "approve_for_future_write");
  assert.equal(record.operator_approval.approved_by, "operator-ref:ledger-smoke-reviewer");
  assert.equal(record.operator_approval.operator_ref, "operator-ref:ledger-smoke-reviewer");
  assert.equal(record.result_report_ref, readyDecision.proposal_refs.result_report_ref);
  assert.equal(
    record.result_report_fingerprint,
    readyDecision.proposal_refs.result_report_fingerprint,
  );
  assert.equal(record.proposal_refs.proposal_status, "proposal_ready_for_operator_review");
  assert.equal(record.feedback_draft_refs.feedback_draft_ref, readyDecision.proposal_refs.feedback_draft_ref);
  assert.equal(record.feedback_draft_refs.result_report_ref, readyDecision.proposal_refs.result_report_ref);
  assert(record.source_refs.length > 0);
  assert(record.decision_preview_refs.write_ready);
  assert(record.dogfood_signal.skipped_or_unverified_checks.length > 0);
  assert(record.skipped_or_unverified_checks.length > 0);
  assert(record.not_done_items.length > 0);
  assert(record.carry_forward_candidates.refs_to_preserve_next_time.length > 0);
  assert(record.reuse_classifications.helpful_refs.length > 0);
  assert(record.reuse_classifications.stale_refs.length > 0);
  assert(record.reuse_classifications.missing_refs.length > 0);
  assert(record.reuse_classifications.noisy_refs.length > 0);
  assert(record.reuse_classifications.misleading_refs.length > 0);
  assert(record.expected_observed_summary.checks_observed.length > 0);
  assert.equal(record.evidence_summary.has_result_report, true);
  assert(record.write_validation.validation_hash.startsWith("sha256:"));
  assert(record.record_fingerprint.startsWith("sha256:"));
  assert.equal(record.authority_boundary.can_write_handoff_reuse_ledger, true);
  assert.equal(record.authority_boundary.can_write_db, true);
  assert.equal(record.authority_boundary.can_write_dogfood_ledger, true);
  assertBoundaryDeniesSideEffects(record.authority_boundary);
  assertReceiptDeniesSideEffects(writeResult.receipt);

  const duplicateResult = ledger.writeHandoffReuseOutcomeLedgerRecordV01(
    approvalPayload(readyDecision),
    db,
  );
  assert.equal(duplicateResult.status, "idempotent_existing");
  assert.equal(duplicateResult.receipt.wrote, false);
  assert.equal(duplicateResult.receipt.idempotent_replay, true);
  assert.equal(countRecords(db), 1);

  const readById = ledger.readHandoffReuseOutcomeLedgerRecordV01(
    record.record_id,
    db,
  );
  assert.equal(readById.status, "read");
  assert.equal(readById.record?.record_id, record.record_id);

  const readByIdempotency =
    ledger.readHandoffReuseOutcomeLedgerRecordByIdempotencyKeyV01(
      record.idempotency_key,
      db,
    );
  assert.equal(readByIdempotency.status, "read");
  assert.equal(readByIdempotency.record?.record_id, record.record_id);

  const listed = ledger.listHandoffReuseOutcomeLedgerRecordsV01({}, db);
  assert.equal(listed.status, "listed");
  assert.equal(listed.records.length, 1);
  assert.equal(listed.records[0].record_id, record.record_id);
} finally {
  db.close();
  rmSync(dbPath, { force: true });
}

const routeDbPath = `.tmp/dogfood-reuse-ledger/route-smoke-${process.pid}.sqlite`;
rmSync(routeDbPath, { force: true });
try {
  const refusedRouteResponse = await ledgerRoute.POST(
    routeRequest("POST", {
      action: "write",
      db_path: routeDbPath,
      input: {},
    }),
  );
  assert.equal(refusedRouteResponse.status, 400);
  const refusedRouteJson = await refusedRouteResponse.json();
  assert.equal(refusedRouteJson.store_result.status, "refused");
  assert.equal(refusedRouteJson.receipt.wrote, false);
  assert.equal(existsSync(routeDbPath), false);

  const malformedRouteResponse = await ledgerRoute.POST(
    routeRequest("POST", {
      action: "write",
      db_path: routeDbPath,
      input: approvalPayload(
        malformedDecisionPreview((preview) => {
          preview.would_write_preview = "not-a-would-write-preview-object";
        }),
      ),
    }),
  );
  assert.equal(malformedRouteResponse.status, 400);
  const malformedRouteJson = await malformedRouteResponse.json();
  assert.equal(malformedRouteJson.store_result.status, "refused");
  assert.equal(malformedRouteJson.receipt.wrote, false);
  assert(
    malformedRouteJson.receipt.refusal_reasons.includes(
      "decision_preview_would_write_preview_invalid",
    ),
    "route malformed preview refusal reason must be returned",
  );
  assert.equal(existsSync(routeDbPath), false);

  const writeRouteResponse = await ledgerRoute.POST(
    routeRequest("POST", {
      action: "write",
      db_path: routeDbPath,
      input: approvalPayload(readyDecision),
    }),
  );
  assert.equal(writeRouteResponse.status, 201);
  const writeRouteJson = await writeRouteResponse.json();
  assert.equal(writeRouteJson.store_result.status, "written");
  assert.equal(writeRouteJson.receipt.wrote, true);
  assert.equal(writeRouteJson.no_metric_update, true);
  assert.equal(writeRouteJson.no_memory_mutation, true);
  assert.equal(writeRouteJson.no_perspective_apply, true);
  assert.equal(writeRouteJson.no_provider_call, true);
  assert.equal(writeRouteJson.no_github_call, true);
  assert.equal(writeRouteJson.no_codex_execution, true);
  assert.equal(writeRouteJson.no_handoff_send, true);

  const readRouteResponse = await ledgerRoute.GET(
    routeRequest(
      "GET",
      null,
      `?db_path=${encodeURIComponent(routeDbPath)}&idempotency_key=${encodeURIComponent(
        approvalPayload(readyDecision).idempotency_key,
      )}`,
    ),
  );
  assert.equal(readRouteResponse.status, 200);
  const readRouteJson = await readRouteResponse.json();
  assert.equal(readRouteJson.store_result.status, "read");
  assert.equal(
    readRouteJson.record.idempotency_key,
    approvalPayload(readyDecision).idempotency_key,
  );
} finally {
  rmSync(routeDbPath, { force: true });
}

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "handoff-reuse-outcome-ledger-write-v0-1",
});
const untrackedFiles = collectUntrackedFiles();
const changedAndUntrackedFiles = uniqueSorted([
  ...changedFilesBoundary.files,
  ...untrackedFiles,
]);
for (const file of changedAndUntrackedFiles) {
  assert(
    allowedChangedFiles.includes(file),
    `Unexpected handoff reuse outcome ledger write file: ${file}`,
  );
}

console.log(
  JSON.stringify(
    {
      smoke: "handoff-reuse-outcome-ledger-write-v0-1",
      pass: true,
      default_workbench_refused: true,
      sample_fixture_refused: true,
      unsafe_operator_actor_refs_refused: true,
      safe_operator_actor_fallback_checked: true,
      malformed_nested_preview_refused: true,
      positive_write_record_count: 1,
      duplicate_prevented: true,
      route_malformed_preview_refused_without_db: true,
      route_write_and_read_checked: true,
      receipt_no_metric_update: true,
      receipt_no_memory_mutation: true,
      receipt_no_perspective_apply: true,
      receipt_no_provider_github_codex_handoff: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_observed: changedFilesBoundary.files,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:handoff-reuse-outcome-ledger-write-v0-1");

function buildDecision(resultReportInput) {
  const resultReport = resultReportInput
    ? normalizeCodexResultReportV01(resultReportInput)
    : null;
  const feedbackDraft = buildCodexResultFeedbackDraft({
    handoff_context_rationale: rationale,
    result_report: resultReport,
  });
  const proposal = buildDogfoodReuseRecordProposal({
    feedback_draft: feedbackDraft,
  });
  return buildDogfoodReuseOperatorDecisionPreview({ proposal });
}

function buildOperatorProvidedReportInput({
  report_id,
  expected_observed_delta,
}) {
  return {
    input_version: "codex_result_report_input.v0.1",
    scope: "project:augnes",
    report_id,
    report_kind: "codex_pr_result",
    reported_at: "2026-07-04T03:00:00.000Z",
    operator_actor_ref: "operator-ref:ledger-smoke-reviewer",
    pr_refs: ["pr-ref:augnes#operator-provided-ledger-smoke"],
    branch_ref:
      "branch-ref:codex/operator-approved-reuse-outcome-ledger-write-v0-1",
    commit_refs: ["commit-ref:operator-provided-ledger-smoke"],
    codex_claimed_summary:
      "Added operator-approved handoff reuse outcome ledger write helper, route, and smoke coverage.",
    expected_files: [
      typeFile,
      helperFile,
      routeFile,
      smokeFile,
      packageJsonFile,
    ],
    observed_files: [
      typeFile,
      helperFile,
      routeFile,
      smokeFile,
      packageJsonFile,
    ],
    expected_checks: [
      "npm run smoke:handoff-reuse-outcome-ledger-write-v0-1",
      "npm run typecheck",
    ],
    observed_checks: [
      {
        command: "npm run smoke:handoff-reuse-outcome-ledger-write-v0-1",
        status: "passed",
        summary: "ledger helper smoke completed",
      },
    ],
    validation_commands: [
      "npm run smoke:handoff-reuse-outcome-ledger-write-v0-1",
    ],
    skipped_checks: [
      {
        check_ref: "check-ref:browser-validation-not-in-scope",
        reason: "No approval UI workflow or Workbench write button is added in this slice.",
      },
    ],
    known_warnings: ["warning-ref:typecheck-pending-before-final-run"],
    changed_files_summary: [typeFile, helperFile, routeFile, smokeFile],
    not_done_items: [
      "Dogfood metric integration remains a follow-up.",
      "PerspectiveUnit and NextWorkBias updates remain follow-ups.",
    ],
    expected_observed_delta,
    boundary_notes: [
      "Operator-provided result report is used only as candidate dogfood feedback source material.",
      "No metrics, memory, Perspective apply, provider, GitHub, Codex execution, or handoff send is authorized.",
    ],
    source_refs: [
      "operator-provided-result:handoff-reuse-outcome-ledger-smoke",
      "task-ref:augnes-codex-task-6",
    ],
  };
}

function explicitContextDelta(refs) {
  return [
    `context-helpful-ref:${refs[0].ref_id}`,
    `context-stale-ref:${refs[1].ref_id}`,
    `context-missing-ref:${refs[2].ref_id}`,
    `context-noisy-ref:${refs[3].ref_id}`,
    `context-misleading-ref:${refs[4].ref_id}`,
    "next-relay-update:preserve explicit reuse classifications for review",
  ];
}

function approvalPayload(decisionPreview) {
  return {
    decision_preview: decisionPreview,
    operator_decision: "approve_for_future_write",
    idempotency_key:
      "handoff-reuse-outcome-ledger:operator-smoke:2026-07-04",
    approved_by: "operator-ref:ledger-smoke-reviewer",
    operator_ref: "operator-ref:ledger-smoke-reviewer",
    approved_at: "2026-07-04T03:30:00.000Z",
    checklist_confirmations: allChecklistConfirmations(),
    review_note: "Synthetic operator-provided smoke approval.",
  };
}

function allChecklistConfirmations() {
  return {
    actual_result_report_confirmed: true,
    result_matches_intended_codex_run: true,
    changed_files_and_checks_confirmed: true,
    skipped_checks_reviewed_not_counted_as_success: true,
    reuse_classifications_evidence_backed: true,
    unknown_refs_remain_unknown: true,
    carry_forward_candidates_are_candidate_only: true,
    no_durable_memory_or_perspective_apply: true,
    no_metric_update_expected: true,
  };
}

function assertRefused(result, expectedReason) {
  assert.equal(result.status, "refused");
  assert.equal(result.ok, false);
  assert.equal(result.receipt.wrote, false);
  assert.equal(result.receipt.refused, true);
  assert(
    result.receipt.refusal_reasons.includes(expectedReason),
    `${expectedReason} must be included in ${result.receipt.refusal_reasons.join(", ")}`,
  );
  assertReceiptDeniesSideEffects(result.receipt);
}

function assertActorFallbackValidation(
  payload,
  expectedApprovedBy,
  expectedOperatorRef,
) {
  const validation =
    ledger.validateHandoffReuseOutcomeLedgerWriteInputV01(payload);
  assert.equal(validation.ok, true);
  assert.equal(validation.approved_by, expectedApprovedBy);
  assert.equal(validation.operator_ref, expectedOperatorRef);
}

function assertMalformedPreviewRefused(db, mutator, expectedReason) {
  const result = ledger.writeHandoffReuseOutcomeLedgerRecordV01(
    approvalPayload(malformedDecisionPreview(mutator)),
    db,
  );
  assertRefused(result, expectedReason);
  assert.equal(ledger.handoffReuseOutcomeLedgerStoreSchemaExistsV01(db), false);
  return result;
}

function malformedDecisionPreview(mutator) {
  const preview = cloneJson(readyDecision);
  mutator(preview);
  return preview;
}

function countRecords(db) {
  if (!ledger.handoffReuseOutcomeLedgerStoreSchemaExistsV01(db)) return 0;
  return ledger.listHandoffReuseOutcomeLedgerRecordsV01({}, db).records.length;
}

function assertReceiptDeniesSideEffects(receipt) {
  assert.equal(receipt.no_metric_update, true);
  assert.equal(receipt.no_memory_mutation, true);
  assert.equal(receipt.no_perspective_apply, true);
  assert.equal(receipt.no_provider_call, true);
  assert.equal(receipt.no_github_call, true);
  assert.equal(receipt.no_codex_execution, true);
  assert.equal(receipt.no_handoff_send, true);
}

function assertBoundaryDeniesSideEffects(boundary) {
  for (const field of [
    "can_update_metrics",
    "can_mutate_memory",
    "can_promote_memory",
    "can_apply_project_perspective",
    "can_create_promotion_decision",
    "can_create_formation_receipt",
    "can_call_provider_openai",
    "can_call_github",
    "can_execute_codex",
    "can_send_handoff",
    "can_create_pr",
    "can_merge_pr",
    "can_run_autonomous_action",
    "can_create_graph_or_vector_store",
    "can_create_rag_stack",
    "can_crawl_or_observe_browser",
  ]) {
    assert.equal(boundary[field], false, `authority_boundary.${field}`);
  }
}

function assertNoForbiddenAuthorityExpansion(label, text) {
  for (const forbidden of [
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

function omitField(value, field) {
  const cloned = cloneJson(value);
  delete cloned[field];
  return cloned;
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function routeRequest(method, body, search = "") {
  return new Request(`http://localhost/api/dogfooding/reuse-ledger${search}`, {
    method,
    headers: {
      host: "localhost",
      "content-type": "application/json",
    },
    body: body === null ? undefined : JSON.stringify(body),
  });
}
