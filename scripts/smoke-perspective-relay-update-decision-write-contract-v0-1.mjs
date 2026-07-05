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
  decisionType: "types/perspective-relay-update-decision.ts",
  decisionHelper: "lib/workplane/perspective-relay-update-decision.ts",
  decisionPanel: "components/workplane/perspective-relay-update-decision-panel.tsx",
  writeType: "types/perspective-relay-update-decision-write.ts",
  writeHelper: "lib/workplane/perspective-relay-update-decision-write.ts",
  route: "app/api/workplane/perspective-relay-update-decisions/route.ts",
  reviewType: "types/perspective-relay-update-decision-record-review.ts",
  reviewHelper: "lib/workplane/perspective-relay-update-decision-record-review.ts",
  reviewForWeb:
    "lib/workplane/read-perspective-relay-update-decision-record-review-for-web.ts",
  reviewPanel:
    "components/workplane/perspective-relay-update-decision-record-review-panel.tsx",
  cwpContractPreviewType:
    "types/current-working-perspective-update-contract-preview.ts",
  cwpContractPreviewHelper:
    "lib/workplane/current-working-perspective-update-contract-preview.ts",
  cwpContractPreviewPanel:
    "components/workplane/current-working-perspective-update-contract-preview-panel.tsx",
  cwpContractDecisionType:
    "types/current-working-perspective-update-contract-decision.ts",
  cwpContractDecisionHelper:
    "lib/workplane/current-working-perspective-update-contract-decision.ts",
  cwpContractDecisionPanel:
    "components/workplane/current-working-perspective-update-contract-decision-panel.tsx",
  cwpContractWriteType:
    "types/current-working-perspective-update-contract-write.ts",
  cwpContractWriteHelper:
    "lib/workplane/current-working-perspective-update-contract-write.ts",
  cwpContractRoute:
    "app/api/workplane/current-working-perspective-update-contracts/route.ts",
  cwpContractReviewType:
    "types/current-working-perspective-update-contract-record-review.ts",
  cwpContractReviewHelper:
    "lib/workplane/current-working-perspective-update-contract-record-review.ts",
  cwpContractReviewForWeb:
    "lib/workplane/read-current-working-perspective-update-contract-record-review-for-web.ts",
  cwpContractReviewPanel:
    "components/workplane/current-working-perspective-update-contract-record-review-panel.tsx",
  cwpContractSmoke:
    "scripts/smoke-current-working-perspective-update-contract-v0-1.mjs",
  cwpApplyPreviewType: "types/current-working-perspective-apply-preview.ts",
  cwpApplyPreviewHelper: "lib/workplane/current-working-perspective-apply-preview.ts",
  cwpApplyPreviewPanel:
    "components/workplane/current-working-perspective-apply-preview-panel.tsx",
  cwpApplyDecisionType: "types/current-working-perspective-apply-decision.ts",
  cwpApplyDecisionHelper:
    "lib/workplane/current-working-perspective-apply-decision.ts",
  cwpApplyDecisionPanel:
    "components/workplane/current-working-perspective-apply-decision-panel.tsx",
  cwpApplyWriteType: "types/current-working-perspective-apply-write.ts",
  cwpApplyWriteHelper: "lib/workplane/current-working-perspective-apply-write.ts",
  cwpApplyRoute: "app/api/workplane/current-working-perspective-applies/route.ts",
  cwpApplyReviewType:
    "types/current-working-perspective-apply-record-review.ts",
  cwpApplyReviewHelper:
    "lib/workplane/current-working-perspective-apply-record-review.ts",
  cwpApplyReviewForWeb:
    "lib/workplane/read-current-working-perspective-apply-record-review-for-web.ts",
  cwpApplyReviewPanel:
    "components/workplane/current-working-perspective-apply-record-review-panel.tsx",
  appliedCwpReadForWeb:
    "lib/perspective/read-applied-current-working-perspective-for-web.ts",
  appliedCwpPanel:
    "components/workplane/applied-current-working-perspective-panel.tsx",
  cwpApplySmoke:
    "scripts/smoke-current-working-perspective-apply-slice-v0-1.mjs",
  cwpRouteIntegrationPreviewType:
    "types/current-working-perspective-route-integration-contract-preview.ts",
  cwpRouteIntegrationPreviewHelper:
    "lib/workplane/current-working-perspective-route-integration-contract-preview.ts",
  cwpRouteIntegrationPreviewPanel:
    "components/workplane/current-working-perspective-route-integration-contract-preview-panel.tsx",
  cwpRouteIntegrationDecisionType:
    "types/current-working-perspective-route-integration-contract-decision.ts",
  cwpRouteIntegrationDecisionHelper:
    "lib/workplane/current-working-perspective-route-integration-contract-decision.ts",
  cwpRouteIntegrationDecisionPanel:
    "components/workplane/current-working-perspective-route-integration-contract-decision-panel.tsx",
  cwpRouteIntegrationWriteType:
    "types/current-working-perspective-route-integration-contract-write.ts",
  cwpRouteIntegrationWriteHelper:
    "lib/workplane/current-working-perspective-route-integration-contract-write.ts",
  cwpRouteIntegrationRoute:
    "app/api/workplane/current-working-perspective-route-integration-contracts/route.ts",
  cwpRouteIntegrationReviewType:
    "types/current-working-perspective-route-integration-contract-record-review.ts",
  cwpRouteIntegrationReviewHelper:
    "lib/workplane/current-working-perspective-route-integration-contract-record-review.ts",
  cwpRouteIntegrationReviewForWeb:
    "lib/workplane/read-current-working-perspective-route-integration-contract-record-review-for-web.ts",
  cwpRouteIntegrationReviewPanel:
    "components/workplane/current-working-perspective-route-integration-contract-record-review-panel.tsx",
  cwpRouteIntegrationSmoke:
    "scripts/smoke-current-working-perspective-route-integration-contract-v0-1.mjs",
  contractType: "types/perspective-relay-update-write-contract-preview.ts",
  contractHelper: "lib/workplane/perspective-relay-update-write-contract-preview.ts",
  contractPanel:
    "components/workplane/perspective-relay-update-write-contract-preview-panel.tsx",
  bridgeType: "types/perspective-relay-update-candidate-bridge-preview.ts",
  bridgeHelper: "lib/workplane/perspective-relay-update-candidate-bridge-preview.ts",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  overviewType: "types/workbench-dogfood-loop-spine-overview.ts",
  overviewHelper: "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  agentWorkplaneSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  overviewSmoke: "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
  continuityRelaySmoke:
    "scripts/smoke-continuity-relay-scoped-write-v0-1.mjs",
  perspectiveUnitSmoke:
    "scripts/smoke-perspective-unit-scoped-write-v0-1.mjs",
  perspectiveNextWorkBiasSmoke:
    "scripts/smoke-perspective-next-work-bias-scoped-write-v0-1.mjs",
  previousSmoke:
    "scripts/smoke-next-work-signal-decision-perspective-relay-bridge-v0-1.mjs",
  smoke:
    "scripts/smoke-perspective-relay-update-decision-write-contract-v0-1.mjs",
  packageJson: "package.json",
};

const forbiddenNoSideEffectFields = [
  "perspective_unit_written",
  "next_work_bias_written",
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
  scriptName: "smoke:perspective-relay-update-decision-write-contract-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-perspective-relay-update-decision-write-contract-v0-1.mjs",
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
    files.contractType,
    files.contractHelper,
  ]
    .map((file) => textByFile.get(file))
    .join("\n"),
  [
    "perspective_relay_update_operator_decision_preview.v0.1",
    "perspective_relay_update_decision_record.v0.1",
    "perspective_relay_update_decision_receipt.v0.1",
    "perspective_relay_update_decision_store.v0.1",
    "perspective_relay_update_write_contract_preview.v0.1",
  ],
  { label: "perspective relay update decision files" },
);

assertContainsAll(textByFile.get(files.agentWorkplane), [
  "PerspectiveRelayUpdateDecisionPanel",
  "PerspectiveRelayUpdateDecisionRecordReviewPanel",
  "PerspectiveRelayUpdateWriteContractPreviewPanel",
  "buildPerspectiveRelayUpdateOperatorDecisionPreviewV01",
  "readPerspectiveRelayUpdateDecisionRecordReviewForWebV01",
  "buildPerspectiveRelayUpdateWriteContractPreviewV01",
  "const perspectiveRelayUpdateDecisionPreview",
  "const perspectiveRelayUpdateDecisionRecordReview",
  "const perspectiveRelayUpdateWriteContractPreview",
  "perspective_relay_update_operator_decision_preview:\n        perspectiveRelayUpdateDecisionPreview",
  "perspective_relay_update_decision_record_review:\n        perspectiveRelayUpdateDecisionRecordReview",
  "perspective_relay_update_write_contract_preview:\n        perspectiveRelayUpdateWriteContractPreview",
]);

assertContainsAll(textByFile.get(files.overviewType), [
  "perspective_relay_update_operator_decision",
  "perspective_relay_update_decision_record",
  "perspective_relay_update_write_contract",
  "review_perspective_relay_update_decision",
  "write_perspective_relay_update_decision_record",
  "review_perspective_relay_update_decision_record",
  "review_perspective_relay_update_write_contract",
  "prepare_scoped_perspective_next_work_relay_write_slice",
  "resolve_perspective_relay_update_blockers",
]);

assertContainsAll(textByFile.get(files.overviewHelper), [
  "perspectiveRelayUpdateDecisionStep",
  "perspectiveRelayUpdateDecisionRecordStep",
  "perspectiveRelayUpdateWriteContractStep",
  "perspective_relay_update_operator_decision_preview",
  "perspective_relay_update_decision_record_review",
  "perspective_relay_update_write_contract_preview",
]);

for (const panel of [
  files.decisionPanel,
  files.reviewPanel,
  files.contractPanel,
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

for (const file of [
  files.writeHelper,
  files.route,
  files.reviewHelper,
  files.contractHelper,
]) {
  const text = textByFile.get(file);
  assert(!/writePerspectiveUnit|writeNextWorkBias|updateCurrentWorkingPerspective/i.test(text));
  assert(!/updateContinuityRelay|applyHandoffContext|sendHandoff/i.test(text));
  assert(!/from ["']@\/(lib\/)?providers?\//i.test(text));
  assert(!/\b(provider|openai|github|codex)\.(create|request|send|execute|run|call)\b/i.test(text));
  assert(!/\b(createGraph|createVectorStore|createRagStack|crawlBrowser|observeBrowser)\b/i.test(text));
}

const { buildPerspectiveRelayUpdateOperatorDecisionPreviewV01 } = await import(
  "../lib/workplane/perspective-relay-update-decision.ts"
);
const decisionWrite = await import(
  "../lib/workplane/perspective-relay-update-decision-write.ts"
);
const { buildPerspectiveRelayUpdateDecisionRecordReviewV01 } = await import(
  "../lib/workplane/perspective-relay-update-decision-record-review.ts"
);
const { buildPerspectiveRelayUpdateWriteContractPreviewV01 } = await import(
  "../lib/workplane/perspective-relay-update-write-contract-preview.ts"
);
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);
const route = await import(
  "../app/api/workplane/perspective-relay-update-decisions/route.ts"
);

const emptyDecision = buildPerspectiveRelayUpdateOperatorDecisionPreviewV01();
assert.equal(
  emptyDecision.decision_preview_status,
  "no_perspective_relay_update_candidate_bridge_preview",
);
assert.notEqual(
  emptyDecision.decision_preview_status,
  "ready_for_future_perspective_relay_update_decision_record_write",
);

const bridgePreview = makeBridgePreview();
const decisionWithoutSelection =
  buildPerspectiveRelayUpdateOperatorDecisionPreviewV01({
    perspective_relay_update_candidate_bridge_preview: bridgePreview,
    requested_operator_ref: "operator:perspective-relay-reviewer",
    requested_idempotency_key: "idempotency:perspective-relay-update",
    review_confirmation_ref: "review:perspective-relay-update",
    source_refs: ["source:perspective-relay-decision"],
  });
assert.equal(
  decisionWithoutSelection.decision_preview_status,
  "needs_operator_judgment",
);
assert(
  decisionWithoutSelection.would_write_perspective_relay_update_decision_record_preview
    .selectable_candidate_refs.length > 0,
);

const badSelectedDecision = buildPerspectiveRelayUpdateOperatorDecisionPreviewV01({
  perspective_relay_update_candidate_bridge_preview: bridgePreview,
  selected_perspective_unit_candidate_refs: ["candidate:not-present"],
  requested_operator_ref: "operator:perspective-relay-reviewer",
  requested_idempotency_key: "idempotency:perspective-relay-update",
  review_confirmation_ref: "review:perspective-relay-update",
  source_refs: ["source:perspective-relay-decision"],
});
assert.notEqual(
  badSelectedDecision.decision_preview_status,
  "ready_for_future_perspective_relay_update_decision_record_write",
);
assert(
  badSelectedDecision.refusal_reasons.includes(
    "selected_candidate_refs_not_in_bridge_preview",
  ),
);

const selectedPerspectiveRef =
  decisionWithoutSelection.would_write_perspective_relay_update_decision_record_preview
    .selectable_candidate_refs_by_target.perspective_unit[0];
const selectedNextWorkRef =
  decisionWithoutSelection.would_write_perspective_relay_update_decision_record_preview
    .selectable_candidate_refs_by_target.next_work_bias[0];
const selectedRelayRef =
  decisionWithoutSelection.would_write_perspective_relay_update_decision_record_preview
    .selectable_candidate_refs_by_target.continuity_relay[0];
const readyDecision = buildPerspectiveRelayUpdateOperatorDecisionPreviewV01({
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
  readyDecision.decision_preview_status,
  "ready_for_future_perspective_relay_update_decision_record_write",
);
assert.equal(readyDecision.write_readiness.write_ready, true);
assert.equal(
  readyDecision.recommended_operator_decision,
  "approve_for_perspective_relay_update_decision_record",
);

const approval = {
  operator_decision: "approve_for_perspective_relay_update_decision_record",
  approved_by: "operator:perspective-relay-reviewer",
  operator_ref: "operator:perspective-relay-reviewer",
  approved_at: "2026-07-05T00:00:00.000Z",
  approval_statement: "approved bounded local decision record",
  checklist_confirmations: ["check:reviewed-candidate-groups"],
};
const validInput = {
  decision_preview: readyDecision,
  operator_approval: approval,
  idempotency_key: "idempotency:perspective-relay-update",
};

let db = new Database(":memory:");
let refused = decisionWrite.writePerspectiveRelayUpdateDecisionRecordV01(
  {
    decision_preview: decisionWithoutSelection,
    operator_approval: approval,
    idempotency_key: "idempotency:not-ready",
  },
  { db },
);
assert.equal(refused.status, "refused");
assert.equal(decisionWrite.perspectiveRelayUpdateDecisionWriteSchemaExistsV01(db), false);
db.close();

for (const [label, mutatedInput, expectedReason] of [
  [
    "unsafe refs",
    () => ({
      ...clone(validInput),
      decision_preview: {
        ...clone(readyDecision),
        source_refs: ["source:../private"],
      },
    }),
    "decision_preview_source_refs_unsafe",
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
      requested_side_effects: { can_write_perspective_unit: true },
    }),
    "requested_side_effect_not_allowed",
  ],
]) {
  db = new Database(":memory:");
  const result = decisionWrite.writePerspectiveRelayUpdateDecisionRecordV01(
    mutatedInput(),
    { db },
  );
  assert.equal(result.status, "refused", label);
  assert(result.receipt.refusal_reasons.includes(expectedReason), label);
  assert.equal(decisionWrite.perspectiveRelayUpdateDecisionWriteSchemaExistsV01(db), false, label);
  db.close();
}

db = new Database(":memory:");
assert.equal(
  decisionWrite.readPerspectiveRelayUpdateDecisionRecordByIdV01("record:none", {
    db,
  }).status,
  "schema_missing",
);
assert.equal(decisionWrite.perspectiveRelayUpdateDecisionWriteSchemaExistsV01(db), false);
const written = decisionWrite.writePerspectiveRelayUpdateDecisionRecordV01(
  validInput,
  { db },
);
assert.equal(written.status, "written");
assert.equal(written.record?.record_version, "perspective_relay_update_decision_record.v0.1");
assert.equal(written.receipt.receipt_version, "perspective_relay_update_decision_receipt.v0.1");
assert.equal(written.no_side_effects.perspective_relay_update_decision_record_written, true);
assert.equal(written.no_side_effects.perspective_relay_update_decision_receipt_written, true);
assert.equal(written.no_side_effects.perspective_relay_update_decision_persisted, true);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(written.no_side_effects[field], false, field);
}
const replay = decisionWrite.writePerspectiveRelayUpdateDecisionRecordV01(
  validInput,
  { db },
);
assert.equal(replay.status, "idempotent_existing");
const conflict = decisionWrite.writePerspectiveRelayUpdateDecisionRecordV01(
  {
    ...clone(validInput),
    operator_approval: {
      ...approval,
      approved_at: "2026-07-05T00:00:01.000Z",
    },
  },
  { db },
);
assert.equal(conflict.status, "refused");
assert(conflict.receipt.refusal_reasons.includes("idempotency_key_conflict"));
assert.equal(
  decisionWrite.readPerspectiveRelayUpdateDecisionRecordByIdV01(
    written.record.record_id,
    { db },
  ).status,
  "read",
);
assert.equal(
  decisionWrite.readPerspectiveRelayUpdateDecisionRecordByIdempotencyKeyV01(
    written.record.idempotency_key,
    { db },
  ).status,
  "read",
);
assert.equal(
  decisionWrite.listPerspectiveRelayUpdateDecisionRecordsV01({ db }).records
    .length,
  1,
);

const outOfScopeRecord = {
  ...written.record,
  record_id: "perspective-relay-update-decision:out-of-scope",
  idempotency_key: "idempotency:out-of-scope",
  scope: "project:not-augnes",
};
db.prepare(
  `INSERT INTO perspective_relay_update_decision_records (
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
  decisionWrite.readPerspectiveRelayUpdateDecisionRecordByIdV01(
    outOfScopeRecord.record_id,
    { db },
  ).status,
  "not_found",
);
assert.equal(
  decisionWrite.readPerspectiveRelayUpdateDecisionRecordByIdempotencyKeyV01(
    outOfScopeRecord.idempotency_key,
    { db },
  ).status,
  "not_found",
);
assert.equal(
  decisionWrite.listPerspectiveRelayUpdateDecisionRecordsV01({ db }).records
    .length,
  1,
);

const malformedReview = buildPerspectiveRelayUpdateDecisionRecordReviewV01({
  records: [
    {
      record_version: "perspective_relay_update_decision_record.v0.1",
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
    "perspective_relay_update_decision_record_malformed",
  ),
);
const corruptReceiptStoreResult = clone(written);
corruptReceiptStoreResult.receipt.no_side_effects.perspective_unit_written = true;
const corruptReview = buildPerspectiveRelayUpdateDecisionRecordReviewV01({
  store_result: corruptReceiptStoreResult,
});
assert.equal(corruptReview.review_status, "records_invalid");
assert(corruptReview.input_summary.receipt_side_effect_problem_count > 0);
assert.equal(corruptReview.evidence_summary.has_receipt_side_effect_problem, true);
assert(
  corruptReview.blocked_reasons.includes(
    "perspective_relay_update_receipt_no_side_effects_invalid",
  ),
);

const noRecordReview = buildPerspectiveRelayUpdateDecisionRecordReviewV01();
const contractWithoutRecord = buildPerspectiveRelayUpdateWriteContractPreviewV01({
  perspective_relay_update_operator_decision_preview: readyDecision,
  perspective_relay_update_decision_record_review: noRecordReview,
  perspective_relay_update_candidate_bridge_preview: bridgePreview,
});
assert.notEqual(
  contractWithoutRecord.contract_preview_status,
  "contract_ready_for_future_scoped_write_slice",
);
const recordReview = buildPerspectiveRelayUpdateDecisionRecordReviewV01({
  store_result: written,
});
assert.equal(recordReview.review_status, "records_available");
const readyContract = buildPerspectiveRelayUpdateWriteContractPreviewV01({
  perspective_relay_update_operator_decision_preview: readyDecision,
  perspective_relay_update_decision_record_review: recordReview,
  perspective_relay_update_candidate_bridge_preview: bridgePreview,
  source_refs: ["source:write-contract"],
});
assert.equal(
  readyContract.contract_preview_status,
  "contract_ready_for_future_scoped_write_slice",
);
assert.equal(
  readyContract.recommended_next_action,
  "review_perspective_relay_update_write_contract",
);
assert.equal(readyContract.authority_boundary.can_write_perspective_unit, false);
assert.equal(readyContract.authority_boundary.can_write_next_work_bias, false);
assert.equal(
  readyContract.authority_boundary.can_update_current_working_perspective,
  false,
);
assert.equal(readyContract.authority_boundary.can_update_continuity_relay, false);

const overview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  perspective_relay_update_candidate_bridge_preview: bridgePreview,
  perspective_relay_update_operator_decision_preview: readyDecision,
  perspective_relay_update_decision_record_review: recordReview,
  perspective_relay_update_write_contract_preview: readyContract,
});
for (const stepId of [
  "perspective_relay_update_operator_decision",
  "perspective_relay_update_decision_record",
  "perspective_relay_update_write_contract",
]) {
  assert(overview.spine_steps.some((step) => step.step_id === stepId), stepId);
}
assert.notEqual(
  overview.recommended_next_operator_action,
  "prepare_scoped_perspective_next_work_relay_write_slice",
);
assert(
  overview.spine_steps.some(
    (step) =>
      step.step_id === "perspective_relay_update_write_contract" &&
      step.recommended_next_action ===
        "review_perspective_relay_update_write_contract",
  ),
);

await assertRouteBoundaries({ route, validInput });

db.close();

assertChangedFilesWithin({
  label: "perspective relay update decision write contract v0.1",
  allowedChangedFiles: Object.values(files),
});

console.log("PASS smoke:perspective-relay-update-decision-write-contract-v0-1");

async function assertRouteBoundaries({ route, validInput }) {
  const tempRoot = ".tmp/perspective-relay-update-decisions";
  rmSync(tempRoot, { recursive: true, force: true });
  mkdirSync(tempRoot, { recursive: true });
  const invalidPath = `${tempRoot}/invalid-write.sqlite`;
  let response = await route.GET(
    new Request(
      "http://localhost/api/workplane/perspective-relay-update-decisions?db_path=/tmp/private.sqlite",
    ),
  );
  assert.equal(response.status, 400);
  response = await route.GET(
    new Request(
      "http://localhost/api/workplane/perspective-relay-update-decisions?db_path=.tmp/perspective-relay-update-decisions/missing.sqlite",
    ),
  );
  assert.equal(response.status, 404);
  response = await route.POST(
    new Request(
      "http://localhost/api/workplane/perspective-relay-update-decisions",
      {
        method: "POST",
        headers: sameOriginHeaders(),
        body: "{",
      },
    ),
  );
  assert.equal(response.status, 400);
  response = await route.POST(
    new Request(
      "http://localhost/api/workplane/perspective-relay-update-decisions",
      {
        method: "POST",
        headers: sameOriginHeaders(),
        body: JSON.stringify({ action: "delete", db_path: invalidPath }),
      },
    ),
  );
  assert.equal(response.status, 400);
  response = await route.POST(
    new Request(
      "http://localhost/api/workplane/perspective-relay-update-decisions",
      {
        method: "POST",
        headers: sameOriginHeaders(),
        body: JSON.stringify({ action: "write", db_path: "../unsafe.sqlite" }),
      },
    ),
  );
  assert.equal(response.status, 400);
  response = await route.POST(
    new Request(
      "http://localhost/api/workplane/perspective-relay-update-decisions",
      {
        method: "POST",
        headers: {
          origin: "http://evil.example",
          host: "localhost",
          "sec-fetch-site": "cross-site",
        },
        body: JSON.stringify({ action: "write", db_path: invalidPath, input: validInput }),
      },
    ),
  );
  assert.equal(response.status, 403);
  response = await route.POST(
    new Request(
      "http://localhost/api/workplane/perspective-relay-update-decisions",
      {
        method: "POST",
        headers: sameOriginHeaders(),
        body: JSON.stringify({
          action: "write",
          db_path: invalidPath,
          input: { idempotency_key: "idempotency:invalid" },
        }),
      },
    ),
  );
  assert.equal(response.status, 400);
  assert.equal(existsSync(invalidPath), false);

  const validPath = `${tempRoot}/valid-write.sqlite`;
  response = await route.POST(
    new Request(
      "http://internal.local/api/workplane/perspective-relay-update-decisions",
      {
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
          input: {
            ...validInput,
            idempotency_key: "idempotency:route-perspective-relay-update",
            decision_preview: {
              ...validInput.decision_preview,
              would_write_perspective_relay_update_decision_record_preview: {
                ...validInput.decision_preview
                  .would_write_perspective_relay_update_decision_record_preview,
                requested_idempotency_key:
                  "idempotency:route-perspective-relay-update",
              },
            },
          },
        }),
      },
    ),
  );
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.perspective_relay_update_decision_record_written, true);
  assert.equal(
    body.no_side_effects.perspective_relay_update_decision_record_written,
    true,
  );
  for (const field of forbiddenNoSideEffectFields) {
    assert.equal(body.no_side_effects[field], false, `route ${field}`);
  }
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
