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
  previewType: "types/continuity-relay-scoped-write-preview.ts",
  previewHelper: "lib/workplane/continuity-relay-scoped-write-preview.ts",
  previewPanel:
    "components/workplane/continuity-relay-scoped-write-preview-panel.tsx",
  writeType: "types/continuity-relay-write.ts",
  writeHelper: "lib/workplane/continuity-relay-write.ts",
  route: "app/api/workplane/continuity-relays/route.ts",
  reviewType: "types/continuity-relay-record-review.ts",
  reviewHelper: "lib/workplane/continuity-relay-record-review.ts",
  reviewForWeb:
    "lib/workplane/read-continuity-relay-record-review-for-web.ts",
  reviewPanel: "components/workplane/continuity-relay-record-review-panel.tsx",
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
  cwpRouteIntegrationReadType:
    "types/current-working-perspective-route-integration-read.ts",
  cwpRouteIntegrationReadHelper:
    "lib/perspective/current-working-perspective-route-integration-read.ts",
  cwpRouteIntegrationReadForWeb:
    "lib/perspective/read-current-working-perspective-route-integration-for-web.ts",
  cwpRouteIntegrationReadReviewType:
    "types/current-working-perspective-route-integration-read-review.ts",
  cwpRouteIntegrationReadReviewHelper:
    "lib/workplane/current-working-perspective-route-integration-read-review.ts",
  cwpRouteIntegrationReadPanel:
    "components/workplane/current-working-perspective-route-integration-read-panel.tsx",
  cwpRouteIntegrationSliceSmoke:
    "scripts/smoke-current-working-perspective-route-integration-slice-v0-1.mjs",
  handoffContextUpdateContractSmoke:
    "scripts/smoke-handoff-context-update-contract-v0-1.mjs",
  handoffContextApplySlicePreviewType:
    "types/handoff-context-apply-slice-preview.ts",
  handoffContextApplySlicePreviewHelper:
    "lib/workplane/handoff-context-apply-preview.ts",
  handoffContextApplySlicePreviewPanel:
    "components/workplane/handoff-context-apply-preview-panel.tsx",
  handoffContextApplySliceDecisionType:
    "types/handoff-context-apply-slice-decision.ts",
  handoffContextApplySliceDecisionHelper:
    "lib/workplane/handoff-context-apply-decision.ts",
  handoffContextApplySliceDecisionPanel:
    "components/workplane/handoff-context-apply-decision-panel.tsx",
  handoffContextApplySliceWriteType:
    "types/handoff-context-apply-write.ts",
  handoffContextApplySliceWriteHelper:
    "lib/workplane/handoff-context-apply-write.ts",
  handoffContextApplySliceRoute:
    "app/api/workplane/handoff-context-applies/route.ts",
  handoffContextApplySliceReviewType:
    "types/handoff-context-apply-record-review.ts",
  handoffContextApplySliceReviewHelper:
    "lib/workplane/handoff-context-apply-record-review.ts",
  handoffContextApplySliceReviewForWeb:
    "lib/workplane/read-handoff-context-apply-record-review-for-web.ts",
  handoffContextApplySliceAppliedRead:
    "lib/workplane/read-applied-handoff-context-for-web.ts",
  handoffContextApplySliceReviewPanel:
    "components/workplane/handoff-context-apply-record-review-panel.tsx",
  handoffContextApplySliceAppliedPanel:
    "components/workplane/applied-handoff-context-panel.tsx",
  handoffContextApplySliceSmoke:
    "scripts/smoke-handoff-context-apply-slice-v0-1.mjs",
  currentPerspectiveRoute: "app/api/perspective/current/route.ts",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  overviewType: "types/workbench-dogfood-loop-spine-overview.ts",
  overviewHelper: "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  agentWorkplaneSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  overviewSmoke: "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
  perspectiveUnitSmoke:
    "scripts/smoke-perspective-unit-scoped-write-v0-1.mjs",
  perspectiveNextWorkBiasSmoke:
    "scripts/smoke-perspective-next-work-bias-scoped-write-v0-1.mjs",
  perspectiveRelayUpdateSmoke:
    "scripts/smoke-perspective-relay-update-decision-write-contract-v0-1.mjs",
  smoke: "scripts/smoke-continuity-relay-scoped-write-v0-1.mjs",
  packageJson: "package.json",
};

const forbiddenNoSideEffectFields = [
  "perspective_unit_written",
  "next_work_bias_written",
  "current_working_perspective_updated",
  "current_working_perspective_mutated",
  "continuity_relay_updated",
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
  scriptName: "smoke:continuity-relay-scoped-write-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-continuity-relay-scoped-write-v0-1.mjs",
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
    "continuity_relay_scoped_write_preview.v0.1",
    "continuity_relay_record.v0.1",
    "continuity_relay_receipt.v0.1",
    "continuity_relay_store.v0.1",
    "continuity_relay_record_review.v0.1",
    "continuity_relay_written means only the scoped local ContinuityRelay record was persisted",
    "continuity_relay_updated",
  ],
  { label: "continuity relay scoped write files" },
);

assertContainsAll(textByFile.get(files.agentWorkplane), [
  "ContinuityRelayScopedWritePreviewPanel",
  "ContinuityRelayRecordReviewPanel",
  "buildContinuityRelayScopedWritePreviewV01",
  "readContinuityRelayRecordReviewForWebV01",
  "const continuityRelayScopedWritePreview",
  "const continuityRelayRecordReview",
  "continuity_relay_scoped_write_preview:\n        continuityRelayScopedWritePreview",
  "continuity_relay_record_review: continuityRelayRecordReview",
]);

assertContainsAll(textByFile.get(files.overviewType), [
  "continuity_relay_scoped_write",
  "continuity_relay_record",
  "review_continuity_relay_scoped_write",
  "write_continuity_relay_record",
  "review_continuity_relay_record",
  "resolve_continuity_relay_blockers",
  "prepare_current_working_perspective_update_contract",
  "prepare_handoff_context_update_contract",
]);

assertContainsAll(textByFile.get(files.overviewHelper), [
  "continuityRelayScopedWriteStep",
  "continuityRelayRecordStep",
  "continuity_relay_scoped_write_preview",
  "continuity_relay_record_review",
  "prepare_handoff_context_update_contract",
  "does_not_update_live_continuity_relay_state",
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
  assert(!/updateCurrentWorkingPerspective|updateContinuityRelay/i.test(text));
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
  buildContinuityRelayScopedWritePreviewV01,
} = await import("../lib/workplane/continuity-relay-scoped-write-preview.ts");
const relayWrite = await import("../lib/workplane/continuity-relay-write.ts");
const { buildContinuityRelayRecordReviewV01 } = await import(
  "../lib/workplane/continuity-relay-record-review.ts"
);
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);
const route = await import("../app/api/workplane/continuity-relays/route.ts");

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
const relayDecisionDb = new Database(":memory:");
const relayWritten =
  relayDecisionWrite.writePerspectiveRelayUpdateDecisionRecordV01(
    {
      decision_preview: readyRelayDecision,
      operator_approval: relayApproval,
      idempotency_key: "idempotency:perspective-relay-update",
    },
    { db: relayDecisionDb },
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

const emptyPreview = buildContinuityRelayScopedWritePreviewV01();
assert.equal(
  emptyPreview.scoped_write_preview_status,
  "no_perspective_relay_update_write_contract",
);
assert.equal(emptyPreview.continuity_relay_entries.length, 0);

const nonReadyContractPreview = buildContinuityRelayScopedWritePreviewV01({
  perspective_relay_update_write_contract_preview: {
    ...clone(readyContract),
    contract_preview_status: "future_write_contract_candidates_available",
  },
  perspective_relay_update_decision_record_review: relayRecordReview,
  requested_operator_ref: "operator:continuity-relay-reviewer",
  requested_idempotency_key: "idempotency:continuity-relay",
  review_confirmation_ref: "review:continuity-relay",
  source_refs: ["source:continuity-relay"],
});
assert.notEqual(
  nonReadyContractPreview.scoped_write_preview_status,
  "ready_for_future_continuity_relay_record_write",
);

const noRelayContract = clone(readyContract);
noRelayContract.selected_candidate_refs_by_target.continuity_relay = [];
noRelayContract.proposed_future_write_contract.continuity_relay_update_contract.selected_candidate_refs = [];
noRelayContract.input_summary.selected_continuity_relay_candidate_count = 0;
const noRelayPreview = buildContinuityRelayScopedWritePreviewV01({
  perspective_relay_update_write_contract_preview: noRelayContract,
  perspective_relay_update_decision_record_review: relayRecordReview,
  requested_operator_ref: "operator:continuity-relay-reviewer",
  requested_idempotency_key: "idempotency:continuity-relay",
  review_confirmation_ref: "review:continuity-relay",
  source_refs: ["source:continuity-relay"],
});
assert.notEqual(
  noRelayPreview.scoped_write_preview_status,
  "ready_for_future_continuity_relay_record_write",
);
assert.equal(noRelayPreview.input_summary.selected_continuity_relay_candidate_count, 0);
assert(noRelayPreview.input_summary.non_writable_perspective_unit_candidate_count > 0);
assert(noRelayPreview.input_summary.non_writable_next_work_bias_candidate_count > 0);

const notInContract = clone(readyContract);
notInContract.selected_candidate_refs_by_target.continuity_relay = [
  "candidate:relay-not-in-contract",
];
const notInContractPreview = buildContinuityRelayScopedWritePreviewV01({
  perspective_relay_update_write_contract_preview: notInContract,
  perspective_relay_update_decision_record_review: relayRecordReview,
  requested_operator_ref: "operator:continuity-relay-reviewer",
  requested_idempotency_key: "idempotency:continuity-relay",
  review_confirmation_ref: "review:continuity-relay",
  source_refs: ["source:continuity-relay"],
});
assert(
  notInContractPreview.refusal_reasons.includes(
    "selected_continuity_relay_refs_not_in_contract",
  ),
);

const notInRecord = clone(readyContract);
notInRecord.selected_candidate_refs_by_target.continuity_relay = [
  "candidate:relay-not-in-record",
];
notInRecord.proposed_future_write_contract.continuity_relay_update_contract.selected_candidate_refs =
  ["candidate:relay-not-in-record"];
const notInRecordPreview = buildContinuityRelayScopedWritePreviewV01({
  perspective_relay_update_write_contract_preview: notInRecord,
  perspective_relay_update_decision_record_review: relayRecordReview,
  requested_operator_ref: "operator:continuity-relay-reviewer",
  requested_idempotency_key: "idempotency:continuity-relay",
  review_confirmation_ref: "review:continuity-relay",
  source_refs: ["source:continuity-relay"],
});
assert(
  notInRecordPreview.refusal_reasons.includes(
    "selected_continuity_relay_refs_not_in_decision_record",
  ),
);

const readyRelayPreview = buildContinuityRelayScopedWritePreviewV01({
  perspective_relay_update_write_contract_preview: readyContract,
  perspective_relay_update_decision_record_review: relayRecordReview,
  perspective_relay_update_candidate_bridge_preview: bridgePreview,
  requested_operator_ref: "operator:continuity-relay-reviewer",
  requested_idempotency_key: "idempotency:continuity-relay",
  review_confirmation_ref: "review:continuity-relay",
  source_refs: ["source:continuity-relay"],
});
assert.equal(
  readyRelayPreview.scoped_write_preview_status,
  "ready_for_future_continuity_relay_record_write",
);
assert.equal(readyRelayPreview.write_readiness.write_ready, true);
assert.equal(readyRelayPreview.recommended_next_action, "write_continuity_relay_record");
assert.equal(readyRelayPreview.continuity_relay_entries.length, 1);
assert.equal(readyRelayPreview.continuity_relay_entries[0].relay_directive, "preserve_anchor");
assert.equal(readyRelayPreview.authority_boundary.can_write_continuity_relay, false);
assert.equal(readyRelayPreview.authority_boundary.can_update_continuity_relay, false);
assert.equal(readyRelayPreview.related_perspective_unit_record_refs.length, 0);
assert.equal(readyRelayPreview.related_next_work_bias_record_refs.length, 0);
assert(
  readyRelayPreview.approval_requirements.includes(
    "confirm_perspective_unit_and_next_work_bias_refs_are_not_written_by_this_slice",
  ),
);
assert(
  !readyRelayPreview.approval_requirements.includes(
    "confirm_next_work_bias_and_continuity_relay_refs_are_not_written_by_this_slice",
  ),
);

const readyWithPerspectiveUnitContext = buildContinuityRelayScopedWritePreviewV01({
  perspective_relay_update_write_contract_preview: readyContract,
  perspective_relay_update_decision_record_review: relayRecordReview,
  perspective_unit_record_review: advisoryPerspectiveUnitReview(),
  requested_operator_ref: "operator:continuity-relay-reviewer",
  requested_idempotency_key: "idempotency:continuity-relay",
  review_confirmation_ref: "review:continuity-relay",
  source_refs: ["source:continuity-relay"],
});
assert.equal(
  readyWithPerspectiveUnitContext.scoped_write_preview_status,
  "ready_for_future_continuity_relay_record_write",
);
assert.deepEqual(readyWithPerspectiveUnitContext.related_perspective_unit_record_refs, [
  "perspective-unit:advisory",
]);

const readyWithNextWorkBiasContext = buildContinuityRelayScopedWritePreviewV01({
  perspective_relay_update_write_contract_preview: readyContract,
  perspective_relay_update_decision_record_review: relayRecordReview,
  perspective_next_work_bias_record_review: advisoryNextWorkBiasReview(),
  requested_operator_ref: "operator:continuity-relay-reviewer",
  requested_idempotency_key: "idempotency:continuity-relay",
  review_confirmation_ref: "review:continuity-relay",
  source_refs: ["source:continuity-relay"],
});
assert.equal(
  readyWithNextWorkBiasContext.scoped_write_preview_status,
  "ready_for_future_continuity_relay_record_write",
);
assert.deepEqual(readyWithNextWorkBiasContext.related_next_work_bias_record_refs, [
  "perspective-next-work-bias:advisory",
]);

const invalidPerspectiveUnitAdvisory = buildContinuityRelayScopedWritePreviewV01({
  perspective_relay_update_write_contract_preview: readyContract,
  perspective_relay_update_decision_record_review: relayRecordReview,
  perspective_unit_record_review: {
    ...advisoryPerspectiveUnitReview(),
    review_status: "records_invalid",
  },
  requested_operator_ref: "operator:continuity-relay-reviewer",
  requested_idempotency_key: "idempotency:continuity-relay",
  review_confirmation_ref: "review:continuity-relay",
  source_refs: ["source:continuity-relay"],
});
assertPreviewBlockedBy(
  invalidPerspectiveUnitAdvisory,
  "perspective_unit_record_review_invalid",
  "records_invalid PerspectiveUnit advisory review must block",
);

const invalidNextWorkBiasAdvisory = buildContinuityRelayScopedWritePreviewV01({
  perspective_relay_update_write_contract_preview: readyContract,
  perspective_relay_update_decision_record_review: relayRecordReview,
  perspective_next_work_bias_record_review: {
    ...advisoryNextWorkBiasReview(),
    review_status: "records_invalid",
  },
  requested_operator_ref: "operator:continuity-relay-reviewer",
  requested_idempotency_key: "idempotency:continuity-relay",
  review_confirmation_ref: "review:continuity-relay",
  source_refs: ["source:continuity-relay"],
});
assertPreviewBlockedBy(
  invalidNextWorkBiasAdvisory,
  "perspective_next_work_bias_record_review_invalid",
  "records_invalid NextWorkBias advisory review must block",
);

const wrongVersionPerspectiveUnitAdvisory =
  buildContinuityRelayScopedWritePreviewV01({
    perspective_relay_update_write_contract_preview: readyContract,
    perspective_relay_update_decision_record_review: relayRecordReview,
    perspective_unit_record_review: {
      ...advisoryPerspectiveUnitReview(),
      review_version: "perspective_unit_record_review.v9",
    },
    requested_operator_ref: "operator:continuity-relay-reviewer",
    requested_idempotency_key: "idempotency:continuity-relay",
    review_confirmation_ref: "review:continuity-relay",
    source_refs: ["source:continuity-relay"],
  });
assertPreviewBlockedBy(
  wrongVersionPerspectiveUnitAdvisory,
  "perspective_unit_record_review_malformed",
  "wrong-version PerspectiveUnit advisory review must not be treated as missing",
);

const malformedPerspectiveUnitAdvisory =
  buildContinuityRelayScopedWritePreviewV01({
    perspective_relay_update_write_contract_preview: readyContract,
    perspective_relay_update_decision_record_review: relayRecordReview,
    perspective_unit_record_review: {
      review_version: "perspective_unit_record_review.v0.1",
    },
    requested_operator_ref: "operator:continuity-relay-reviewer",
    requested_idempotency_key: "idempotency:continuity-relay",
    review_confirmation_ref: "review:continuity-relay",
    source_refs: ["source:continuity-relay"],
  });
assertPreviewBlockedBy(
  malformedPerspectiveUnitAdvisory,
  "perspective_unit_record_review_malformed",
  "malformed PerspectiveUnit advisory review must not be treated as missing",
);

const wrongVersionNextWorkBiasAdvisory =
  buildContinuityRelayScopedWritePreviewV01({
    perspective_relay_update_write_contract_preview: readyContract,
    perspective_relay_update_decision_record_review: relayRecordReview,
    perspective_next_work_bias_record_review: {
      ...advisoryNextWorkBiasReview(),
      review_version: "perspective_next_work_bias_record_review.v9",
    },
    requested_operator_ref: "operator:continuity-relay-reviewer",
    requested_idempotency_key: "idempotency:continuity-relay",
    review_confirmation_ref: "review:continuity-relay",
    source_refs: ["source:continuity-relay"],
  });
assertPreviewBlockedBy(
  wrongVersionNextWorkBiasAdvisory,
  "perspective_next_work_bias_record_review_malformed",
  "wrong-version NextWorkBias advisory review must not be treated as missing",
);

const malformedNextWorkBiasAdvisory =
  buildContinuityRelayScopedWritePreviewV01({
    perspective_relay_update_write_contract_preview: readyContract,
    perspective_relay_update_decision_record_review: relayRecordReview,
    perspective_next_work_bias_record_review: {
      review_version: "perspective_next_work_bias_record_review.v0.1",
    },
    requested_operator_ref: "operator:continuity-relay-reviewer",
    requested_idempotency_key: "idempotency:continuity-relay",
    review_confirmation_ref: "review:continuity-relay",
    source_refs: ["source:continuity-relay"],
  });
assertPreviewBlockedBy(
  malformedNextWorkBiasAdvisory,
  "perspective_next_work_bias_record_review_malformed",
  "malformed NextWorkBias advisory review must not be treated as missing",
);

const relayRecordApproval = {
  operator_decision: "approve_for_continuity_relay_record",
  approved_by: "operator:continuity-relay-reviewer",
  operator_ref: "operator:continuity-relay-reviewer",
  approved_at: "2026-07-05T00:00:02.000Z",
  approval_statement: "approved bounded local continuity relay record",
  checklist_confirmations: ["check:reviewed-continuity-relay-entries"],
};
const validInput = {
  scoped_write_preview: readyRelayPreview,
  operator_approval: relayRecordApproval,
  idempotency_key: "idempotency:continuity-relay",
};

let db = new Database(":memory:");
let refused = relayWrite.writeContinuityRelayRecordV01(
  {
    scoped_write_preview: noRelayPreview,
    operator_approval: relayRecordApproval,
    idempotency_key: "idempotency:not-ready",
  },
  { db },
);
assert.equal(refused.status, "refused");
assert.equal(relayWrite.continuityRelayWriteSchemaExistsV01(db), false);
db.close();

db = new Database(":memory:");
refused = relayWrite.writeContinuityRelayRecordV01(
  {
    scoped_write_preview: malformedPerspectiveUnitAdvisory,
    operator_approval: relayRecordApproval,
    idempotency_key: "idempotency:continuity-relay",
  },
  { db },
);
assert.equal(refused.status, "refused");
assert.equal(relayWrite.continuityRelayWriteSchemaExistsV01(db), false);
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
        ...relayRecordApproval,
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
        ...clone(readyRelayPreview),
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
      requested_side_effects: { continuity_relay_updated: true },
    }),
    "requested_side_effect_not_allowed",
  ],
  [
    "malformed entry",
    () => {
      const input = clone(validInput);
      input.scoped_write_preview.would_write_continuity_relay_record_preview.continuity_relay_entries[0].relay_directive =
        "warn_anchor";
      return input;
    },
    "continuity_relay_entry_relay_directive_bucket_mismatch",
  ],
  [
    "non relay selected refs",
    () => {
      const input = clone(validInput);
      input.scoped_write_preview.would_write_continuity_relay_record_preview.selected_perspective_unit_candidate_refs =
        ["candidate:perspective-unit-not-writable"];
      return input;
    },
    "selected_perspective_unit_refs_not_writable_by_continuity_relay_slice",
  ],
  [
    "forged live relay authority",
    () => {
      const input = clone(validInput);
      input.scoped_write_preview.authority_boundary.can_update_continuity_relay = true;
      return input;
    },
    "scoped_write_preview_authority_boundary_invalid",
  ],
]) {
  db = new Database(":memory:");
  const result = relayWrite.writeContinuityRelayRecordV01(mutatedInput(), {
    db,
  });
  assert.equal(result.status, "refused", label);
  assert(result.receipt.refusal_reasons.includes(expectedReason), label);
  assert.equal(relayWrite.continuityRelayWriteSchemaExistsV01(db), false, label);
  db.close();
}

db = new Database(":memory:");
assert.equal(
  relayWrite.readContinuityRelayRecordByIdV01("record:none", { db }).status,
  "schema_missing",
);
assert.equal(relayWrite.continuityRelayWriteSchemaExistsV01(db), false);
const written = relayWrite.writeContinuityRelayRecordV01(validInput, { db });
assert.equal(written.status, "written");
assert.equal(written.record?.record_version, "continuity_relay_record.v0.1");
assert.equal(written.receipt.receipt_version, "continuity_relay_receipt.v0.1");
assert.equal(written.no_side_effects.continuity_relay_record_written, true);
assert.equal(written.no_side_effects.continuity_relay_receipt_written, true);
assert.equal(written.no_side_effects.continuity_relay_persisted, true);
assert.equal(written.no_side_effects.continuity_relay_written, true);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(written.no_side_effects[field], false, field);
}
const replay = relayWrite.writeContinuityRelayRecordV01(validInput, { db });
assert.equal(replay.status, "idempotent_existing");
const conflict = relayWrite.writeContinuityRelayRecordV01(
  {
    ...clone(validInput),
    operator_approval: {
      ...relayRecordApproval,
      approved_at: "2026-07-05T00:00:03.000Z",
    },
  },
  { db },
);
assert.equal(conflict.status, "refused");
assert(conflict.receipt.refusal_reasons.includes("idempotency_key_conflict"));
assert.equal(
  relayWrite.readContinuityRelayRecordByIdV01(written.record.record_id, {
    db,
  }).status,
  "read",
);
assert.equal(
  relayWrite.readContinuityRelayRecordByIdempotencyKeyV01(
    written.record.idempotency_key,
    { db },
  ).status,
  "read",
);
assert.equal(relayWrite.listContinuityRelayRecordsV01({ db }).records.length, 1);

const outOfScopeRecord = {
  ...written.record,
  record_id: "continuity-relay:out-of-scope",
  idempotency_key: "idempotency:out-of-scope",
  scope: "project:not-augnes",
};
db.prepare(
  `INSERT INTO continuity_relay_records (
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
  relayWrite.readContinuityRelayRecordByIdV01(outOfScopeRecord.record_id, {
    db,
  }).status,
  "not_found",
);
assert.equal(
  relayWrite.readContinuityRelayRecordByIdempotencyKeyV01(
    outOfScopeRecord.idempotency_key,
    { db },
  ).status,
  "not_found",
);
assert.equal(relayWrite.listContinuityRelayRecordsV01({ db }).records.length, 1);

const replayScopeDb = new Database(":memory:");
relayWrite.ensureContinuityRelayWriteSchemaV01(replayScopeDb);
const outOfScopeReplayRecord = {
  ...written.record,
  record_id: "continuity-relay:out-of-scope-replay",
  scope: "project:not-augnes",
};
replayScopeDb.prepare(
  `INSERT INTO continuity_relay_records (
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
const outOfScopeReplay = relayWrite.writeContinuityRelayRecordV01(validInput, {
  db: replayScopeDb,
});
assert.notEqual(outOfScopeReplay.status, "idempotent_existing");
assert.equal(outOfScopeReplay.status, "refused");
replayScopeDb.close();

const noRecordReview = buildContinuityRelayRecordReviewV01();
assert.equal(noRecordReview.review_status, "no_records");
const recordReview = buildContinuityRelayRecordReviewV01({
  store_result: written,
});
assert.equal(recordReview.review_status, "records_available");
assert.equal(recordReview.continuity_relay_material_summary.continuity_relay_entry_count, 1);
assert.equal(recordReview.continuity_relay_material_summary.preserve_anchor_count, 1);
assert.equal(recordReview.receipt_no_side_effects_summary.continuity_relay_written_count > 0, true);
assert.equal(recordReview.receipt_no_side_effects_summary.perspective_unit_written_count, 0);
const malformedReview = buildContinuityRelayRecordReviewV01({
  records: [
    {
      record_version: "continuity_relay_record.v0.1",
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
    "continuity_relay_record_malformed",
  ),
);
const rawMaterialReview = buildContinuityRelayRecordReviewV01({
  records: [
    {
      ...clone(written.record),
      record_id: "continuity-relay:raw-material",
      raw_text: "blocked raw material",
    },
  ],
});
assert.equal(rawMaterialReview.review_status, "records_invalid");
assert(
  rawMaterialReview.record_summaries[0].problem_reasons.includes(
    "raw_material_key_present",
  ),
);
const corruptReceiptStoreResult = clone(written);
corruptReceiptStoreResult.receipt.no_side_effects.next_work_bias_written = true;
const corruptReview = buildContinuityRelayRecordReviewV01({
  store_result: corruptReceiptStoreResult,
});
assert.equal(corruptReview.review_status, "records_invalid");
assert(corruptReview.input_summary.receipt_side_effect_problem_count > 0);
assert.equal(corruptReview.evidence_summary.has_receipt_side_effect_problem, true);
assert(
  corruptReview.blocked_reasons.includes(
    "continuity_relay_receipt_no_side_effects_invalid",
  ),
);

const overviewBeforeWrite = buildWorkbenchDogfoodLoopSpineOverviewV01({
  perspective_relay_update_candidate_bridge_preview: bridgePreview,
  perspective_relay_update_operator_decision_preview: readyRelayDecision,
  perspective_relay_update_decision_record_review: relayRecordReview,
  perspective_relay_update_write_contract_preview: readyContract,
  continuity_relay_scoped_write_preview: readyRelayPreview,
  continuity_relay_record_review: noRecordReview,
});
for (const stepId of [
  "continuity_relay_scoped_write",
  "continuity_relay_record",
]) {
  assert(overviewBeforeWrite.spine_steps.some((step) => step.step_id === stepId), stepId);
}
assert.equal(
  overviewBeforeWrite.recommended_next_operator_action,
  "write_continuity_relay_record",
);
const overviewAfterWrite = buildWorkbenchDogfoodLoopSpineOverviewV01({
  perspective_relay_update_candidate_bridge_preview: bridgePreview,
  perspective_relay_update_operator_decision_preview: readyRelayDecision,
  perspective_relay_update_decision_record_review: relayRecordReview,
  perspective_relay_update_write_contract_preview: readyContract,
  continuity_relay_scoped_write_preview: readyRelayPreview,
  continuity_relay_record_review: recordReview,
});
assert.equal(
  overviewAfterWrite.recommended_next_operator_action,
  "review_continuity_relay_record",
);
for (const forbiddenAction of [
  "update_current_working_perspective",
  "write_continuity_relay",
  "update_continuity_relay",
  "apply_handoff",
  "send_handoff",
  "write_memory",
  "write_dogfood_metrics",
  "call_provider",
  "call_github",
  "execute_codex",
  "create_graph",
]) {
  assert.notEqual(overviewAfterWrite.recommended_next_operator_action, forbiddenAction);
}

await assertRouteBoundaries({ route, validInput });

db.close();
relayDecisionDb.close();

assertChangedFilesWithin({
  label: "continuity relay scoped write v0.1",
  allowedChangedFiles: [
    ...Object.values(files),
    "types/handoff-packet-copy-export-contract-preview.ts",
    "lib/workplane/handoff-packet-copy-export-contract-preview.ts",
    "components/workplane/handoff-packet-copy-export-contract-preview-panel.tsx",
    "types/handoff-packet-copy-export-contract-decision.ts",
    "lib/workplane/handoff-packet-copy-export-contract-decision.ts",
    "components/workplane/handoff-packet-copy-export-contract-decision-panel.tsx",
    "types/handoff-packet-copy-export-contract-write.ts",
    "lib/workplane/handoff-packet-copy-export-contract-write.ts",
    "app/api/workplane/handoff-packet-copy-export-contracts/route.ts",
    "types/handoff-packet-copy-export-contract-record-review.ts",
    "lib/workplane/handoff-packet-copy-export-contract-record-review.ts",
    "lib/workplane/read-handoff-packet-copy-export-contract-record-review-for-web.ts",
    "components/workplane/handoff-packet-copy-export-contract-record-review-panel.tsx",
    "scripts/smoke-handoff-packet-copy-export-contract-v0-1.mjs",
    "types/handoff-packet-copy-export-preview.ts",
    "lib/workplane/handoff-packet-copy-export-preview.ts",
    "components/workplane/handoff-packet-copy-export-preview-panel.tsx",
    "types/handoff-packet-copy-export-decision.ts",
    "lib/workplane/handoff-packet-copy-export-decision.ts",
    "components/workplane/handoff-packet-copy-export-decision-panel.tsx",
    "types/handoff-packet-copy-export-write.ts",
    "lib/workplane/handoff-packet-copy-export-write.ts",
    "app/api/workplane/handoff-packet-copy-exports/route.ts",
    "types/handoff-packet-copy-export-record-review.ts",
    "lib/workplane/handoff-packet-copy-export-record-review.ts",
    "lib/workplane/read-handoff-packet-copy-export-record-review-for-web.ts",
    "lib/workplane/read-exported-handoff-packet-artifact-for-web.ts",
    "components/workplane/handoff-packet-copy-export-record-review-panel.tsx",
    "components/workplane/exported-handoff-packet-artifact-panel.tsx",
    "scripts/smoke-handoff-packet-copy-export-slice-v0-1.mjs",
    "scripts/smoke-handoff-send-contract-v0-1.mjs",
    "types/handoff-send-preview.ts",
    "lib/workplane/handoff-send-preview.ts",
    "components/workplane/handoff-send-preview-panel.tsx",
    "types/handoff-send-decision.ts",
    "lib/workplane/handoff-send-decision.ts",
    "components/workplane/handoff-send-decision-panel.tsx",
    "types/handoff-send-write.ts",
    "lib/workplane/handoff-send-write.ts",
    "app/api/workplane/handoff-sends/route.ts",
    "types/handoff-send-record-review.ts",
    "lib/workplane/handoff-send-record-review.ts",
    "lib/workplane/read-handoff-send-record-review-for-web.ts",
    "lib/workplane/read-sent-handoff-for-web.ts",
    "components/workplane/handoff-send-record-review-panel.tsx",
    "components/workplane/sent-handoff-panel.tsx",
    "scripts/smoke-handoff-send-slice-v0-1.mjs",
  ],
});

console.log("PASS smoke:continuity-relay-scoped-write-v0-1");

async function assertRouteBoundaries({ route, validInput }) {
  const tempRoot = ".tmp/continuity-relays";
  rmSync(tempRoot, { recursive: true, force: true });
  mkdirSync(tempRoot, { recursive: true });
  const invalidPath = `${tempRoot}/invalid-write.sqlite`;
  let response = await route.GET(
    new Request(
      "http://localhost/api/workplane/continuity-relays?db_path=/tmp/private.sqlite",
    ),
  );
  assert.equal(response.status, 400);
  response = await route.GET(
    new Request(
      "http://localhost/api/workplane/continuity-relays?db_path=.tmp/continuity-relays/missing.sqlite",
    ),
  );
  assert.equal(response.status, 404);
  response = await route.POST(
    new Request("http://localhost/api/workplane/continuity-relays", {
      method: "POST",
      headers: sameOriginHeaders(),
      body: "{",
    }),
  );
  assert.equal(response.status, 400);
  response = await route.POST(
    new Request("http://localhost/api/workplane/continuity-relays", {
      method: "POST",
      headers: sameOriginHeaders(),
      body: JSON.stringify("invalid"),
    }),
  );
  assert.equal(response.status, 400);
  response = await route.POST(
    new Request("http://localhost/api/workplane/continuity-relays", {
      method: "POST",
      headers: sameOriginHeaders(),
      body: JSON.stringify({ action: "delete", db_path: invalidPath }),
    }),
  );
  assert.equal(response.status, 400);
  response = await route.POST(
    new Request("http://localhost/api/workplane/continuity-relays", {
      method: "POST",
      headers: sameOriginHeaders(),
      body: JSON.stringify({ action: "write", db_path: "../unsafe.sqlite" }),
    }),
  );
  assert.equal(response.status, 400);
  response = await route.POST(
    new Request("http://localhost/api/workplane/continuity-relays", {
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
    new Request("http://localhost/api/workplane/continuity-relays", {
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
  routeInput.idempotency_key = "idempotency:route-continuity-relay";
  routeInput.scoped_write_preview.would_write_continuity_relay_record_preview.requested_idempotency_key =
    "idempotency:route-continuity-relay";
  response = await route.POST(
    new Request("http://internal.local/api/workplane/continuity-relays", {
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
  assert.equal(body.continuity_relay_record_written, true);
  assert.equal(body.continuity_relay_written, true);
  assert.equal(body.continuity_relay_updated, false);
  assert.equal(body.perspective_unit_written, false);
  assert.equal(body.next_work_bias_written, false);
  assert.equal(body.no_side_effects.continuity_relay_record_written, true);
  assert.equal(body.no_side_effects.continuity_relay_written, true);
  for (const field of forbiddenNoSideEffectFields) {
    assert.equal(body.no_side_effects[field], false, `route ${field}`);
  }
  const recordId = body.record.record_id;
  response = await route.GET(
    new Request(
      `http://localhost/api/workplane/continuity-relays?db_path=${validPath}&record_id=${encodeURIComponent(recordId)}`,
    ),
  );
  assert.equal(response.status, 200);
  response = await route.GET(
    new Request(
      `http://localhost/api/workplane/continuity-relays?db_path=${validPath}&idempotency_key=${encodeURIComponent(routeInput.idempotency_key)}`,
    ),
  );
  assert.equal(response.status, 200);
  response = await route.GET(
    new Request(
      `http://localhost/api/workplane/continuity-relays?db_path=${validPath}&limit=100&operator_ref=${encodeURIComponent(routeInput.operator_approval.operator_ref)}`,
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
    would_not_write: ["does_not_write_continuity_relay"],
    non_goals: ["live_continuity_relay_update"],
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

function advisoryPerspectiveUnitReview() {
  return {
    review_version: "perspective_unit_record_review.v0.1",
    review_status: "records_available",
    input_summary: { valid_record_count: 1 },
    evidence_summary: { has_receipt_side_effect_problem: false },
    source_refs: ["source:advisory-perspective-unit-review"],
    records: [{ record_id: "perspective-unit:advisory" }],
  };
}

function advisoryNextWorkBiasReview() {
  return {
    review_version: "perspective_next_work_bias_record_review.v0.1",
    review_status: "records_available",
    input_summary: { valid_record_count: 1 },
    evidence_summary: { has_receipt_side_effect_problem: false },
    source_refs: ["source:advisory-next-work-bias-review"],
    records: [{ record_id: "perspective-next-work-bias:advisory" }],
  };
}

function assertPreviewBlockedBy(preview, expectedReason, label) {
  assert.notEqual(
    preview.scoped_write_preview_status,
    "ready_for_future_continuity_relay_record_write",
    label,
  );
  assert.equal(preview.write_readiness.write_ready, false, label);
  assert(preview.blocking_reasons.includes(expectedReason), label);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
