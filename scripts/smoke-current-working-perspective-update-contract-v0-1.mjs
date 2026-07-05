#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const files = {
  previewType: "types/current-working-perspective-update-contract-preview.ts",
  previewHelper:
    "lib/workplane/current-working-perspective-update-contract-preview.ts",
  previewPanel:
    "components/workplane/current-working-perspective-update-contract-preview-panel.tsx",
  decisionType:
    "types/current-working-perspective-update-contract-decision.ts",
  decisionHelper:
    "lib/workplane/current-working-perspective-update-contract-decision.ts",
  decisionPanel:
    "components/workplane/current-working-perspective-update-contract-decision-panel.tsx",
  writeType: "types/current-working-perspective-update-contract-write.ts",
  writeHelper:
    "lib/workplane/current-working-perspective-update-contract-write.ts",
  route:
    "app/api/workplane/current-working-perspective-update-contracts/route.ts",
  reviewType:
    "types/current-working-perspective-update-contract-record-review.ts",
  reviewHelper:
    "lib/workplane/current-working-perspective-update-contract-record-review.ts",
  reviewForWeb:
    "lib/workplane/read-current-working-perspective-update-contract-record-review-for-web.ts",
  reviewPanel:
    "components/workplane/current-working-perspective-update-contract-record-review-panel.tsx",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  overviewType: "types/workbench-dogfood-loop-spine-overview.ts",
  overviewHelper: "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  agentWorkplaneSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  overviewSmoke:
    "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
  continuityRelaySmoke:
    "scripts/smoke-continuity-relay-scoped-write-v0-1.mjs",
  perspectiveUnitSmoke:
    "scripts/smoke-perspective-unit-scoped-write-v0-1.mjs",
  perspectiveNextWorkBiasSmoke:
    "scripts/smoke-perspective-next-work-bias-scoped-write-v0-1.mjs",
  perspectiveRelayUpdateSmoke:
    "scripts/smoke-perspective-relay-update-decision-write-contract-v0-1.mjs",
  smoke: "scripts/smoke-current-working-perspective-update-contract-v0-1.mjs",
  packageJson: "package.json",
};

const forbiddenNoSideEffectFields = [
  "current_working_perspective_updated",
  "current_working_perspective_mutated",
  "current_working_perspective_live_state_written",
  "current_working_perspective_update_applied",
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

const textByFile = loadTextByFile(Object.values(files));
const packageJsonText = textByFile.get(files.packageJson);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:current-working-perspective-update-contract-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-current-working-perspective-update-contract-v0-1.mjs",
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
  ]
    .map((file) => textByFile.get(file))
    .join("\n"),
  [
    "current_working_perspective_update_contract_preview.v0.1",
    "current_working_perspective_update_contract_operator_decision_preview.v0.1",
    "current_working_perspective_update_contract_record.v0.1",
    "current_working_perspective_update_contract_receipt.v0.1",
    "current_working_perspective_update_contract_store.v0.1",
    "current_working_perspective_update_contract_record_review.v0.1",
    "future_current_working_perspective_apply",
    "current_working_perspective_update_applied",
    "can_apply_current_working_perspective_update: false",
  ],
  { label: "current working perspective update contract files" },
);

assertContainsAll(textByFile.get(files.agentWorkplane), [
  "CurrentWorkingPerspectiveUpdateContractPreviewPanel",
  "CurrentWorkingPerspectiveUpdateContractDecisionPanel",
  "CurrentWorkingPerspectiveUpdateContractRecordReviewPanel",
  "buildCurrentWorkingPerspectiveUpdateContractPreviewV01",
  "buildCurrentWorkingPerspectiveUpdateContractOperatorDecisionPreviewV01",
  "readCurrentWorkingPerspectiveUpdateContractRecordReviewForWebV01",
  "current_working_perspective_update_contract_preview",
  "current_working_perspective_update_contract_decision_preview",
  "current_working_perspective_update_contract_record_review",
]);

assertContainsAll(textByFile.get(files.overviewType), [
  "current_working_perspective_update_contract",
  "current_working_perspective_update_contract_decision",
  "current_working_perspective_update_contract_record",
  "review_current_working_perspective_update_contract",
  "approve_current_working_perspective_update_contract_record",
  "write_current_working_perspective_update_contract_record",
  "review_current_working_perspective_update_contract_record",
  "resolve_current_working_perspective_update_contract_blockers",
  "prepare_current_working_perspective_apply_slice",
  "prepare_handoff_context_update_contract",
]);

assertContainsAll(textByFile.get(files.overviewHelper), [
  "currentWorkingPerspectiveUpdateContractStep",
  "currentWorkingPerspectiveUpdateContractDecisionStep",
  "currentWorkingPerspectiveUpdateContractRecordStep",
  "all three scoped record families required before writing the local contract record",
  "no live CWP mutation or handoff apply/send occurs here",
  "prepare_current_working_perspective_apply_slice remains future work",
]);

for (const panel of [
  files.previewPanel,
  files.decisionPanel,
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
  files.decisionHelper,
  files.writeHelper,
  files.route,
  files.reviewHelper,
  files.overviewHelper,
]) {
  const text = textByFile.get(file);
  assert(!/updateCurrentWorkingPerspective|applyCurrentWorkingPerspective/i.test(text));
  assert(!/applyHandoffContext|sendHandoff/i.test(text));
  assert(!/from ["']@\/(lib\/)?providers?\//i.test(text));
  assert(!/\b(provider|openai|github|codex)\.(create|request|send|execute|run|call)\b/i.test(text));
  assert(!/\b(createGraph|createVectorStore|createRagStack|crawlBrowser|observeBrowser)\b/i.test(text));
}

const { buildCurrentWorkingPerspectiveUpdateContractPreviewV01 } = await import(
  "../lib/workplane/current-working-perspective-update-contract-preview.ts"
);
const {
  buildCurrentWorkingPerspectiveUpdateContractOperatorDecisionPreviewV01,
} = await import(
  "../lib/workplane/current-working-perspective-update-contract-decision.ts"
);
const contractWrite = await import(
  "../lib/workplane/current-working-perspective-update-contract-write.ts"
);
const { buildCurrentWorkingPerspectiveUpdateContractRecordReviewV01 } =
  await import(
    "../lib/workplane/current-working-perspective-update-contract-record-review.ts"
  );
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);
const route = await import(
  "../app/api/workplane/current-working-perspective-update-contracts/route.ts"
);

const allowedChangedFiles = [
  ...Object.values(files),
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
  "scripts/smoke-current-working-perspective-apply-slice-v0-1.mjs",
];

function readyPreview(overrides = {}) {
  return buildCurrentWorkingPerspectiveUpdateContractPreviewV01({
    current_working_perspective: makeCurrentWorkingPerspective(),
    perspective_unit_record_review: makePerspectiveUnitReview(),
    perspective_next_work_bias_record_review: makeNextWorkBiasReview(),
    continuity_relay_record_review: makeContinuityRelayReview(),
    perspective_relay_update_decision_record_review: makeDecisionRecordReview(),
    perspective_relay_update_write_contract_preview: makeRelayWriteContractPreview(),
    requested_operator_ref: "operator:cwp-contract-reviewer",
    requested_idempotency_key: "idempotency:cwp-contract-001",
    review_confirmation_ref: "review:cwp-contract-001",
    source_refs: ["source:cwp-contract-preview"],
    scope: "project:augnes",
    as_of: "2026-07-05T00:00:00.000Z",
    ...overrides,
  });
}

function readyDecision(preview = readyPreview(), overrides = {}) {
  return buildCurrentWorkingPerspectiveUpdateContractOperatorDecisionPreviewV01({
    current_working_perspective_update_contract_preview: preview,
    requested_operator_ref:
      preview.would_write_current_working_perspective_update_contract_record_preview
        .requested_operator_ref ?? "operator:cwp-contract-reviewer",
    requested_idempotency_key:
      preview.would_write_current_working_perspective_update_contract_record_preview
        .requested_idempotency_key ?? "idempotency:cwp-contract-001",
    review_confirmation_ref:
      preview.would_write_current_working_perspective_update_contract_record_preview
        .review_confirmation_ref ?? "review:cwp-contract-001",
    operator_decision_intent:
      "approve_for_current_working_perspective_update_contract_record",
    source_refs: ["source:cwp-contract-decision"],
    scope: "project:augnes",
    as_of: "2026-07-05T00:00:00.000Z",
    ...overrides,
  });
}

function writeInput(decision = readyDecision(), overrides = {}) {
  const decisionMaterial =
    decision.would_write_current_working_perspective_update_contract_decision_preview;
  return {
    operator_decision_preview: decision,
    operator_approval: {
      operator_decision:
        "approve_for_current_working_perspective_update_contract_record",
      approved_by: "operator:cwp-contract-reviewer",
      operator_ref: decisionMaterial.requested_operator_ref,
      approved_at: "2026-07-05T00:00:00.000Z",
      approval_statement:
        "Approved for scoped local CWP update contract record only.",
      checklist_confirmations: [
        "review_current_working_perspective_read_model",
        "confirm_all_three_scoped_record_reviews",
        "confirm_no_live_current_working_perspective_mutation",
      ],
    },
    idempotency_key: decisionMaterial.requested_idempotency_key,
    notes: ["contract record write remains local and scoped"],
    ...overrides,
  };
}

const missingCwpPreview = buildCurrentWorkingPerspectiveUpdateContractPreviewV01({
  perspective_unit_record_review: makePerspectiveUnitReview(),
  perspective_next_work_bias_record_review: makeNextWorkBiasReview(),
  continuity_relay_record_review: makeContinuityRelayReview(),
  requested_operator_ref: "operator:cwp-contract-reviewer",
  requested_idempotency_key: "idempotency:cwp-contract-missing-cwp",
  review_confirmation_ref: "review:cwp-contract-missing-cwp",
  source_refs: ["source:cwp-contract-preview"],
});
assert.equal(
  missingCwpPreview.contract_preview_status,
  "no_current_working_perspective_material",
);
assert.equal(missingCwpPreview.input_summary.proposed_patch_entry_count, 0);

const fixtureFallbackPreview = readyPreview({
  current_working_perspective: undefined,
  current_working_perspective_read: {
    source_status: "fixture_fallback",
    data: makeCurrentWorkingPerspective(),
  },
});
assert.notEqual(
  fixtureFallbackPreview.contract_preview_status,
  "ready_for_future_current_working_perspective_update_contract_record_write",
);
assert(
  fixtureFallbackPreview.blocking_reasons.includes(
    "current_working_perspective_fixture_fallback_not_writable",
  ),
);

for (const [field, reason] of [
  ["perspective_unit_record_review", "perspective_unit_record_review_missing"],
  [
    "perspective_next_work_bias_record_review",
    "perspective_next_work_bias_record_review_missing",
  ],
  ["continuity_relay_record_review", "continuity_relay_record_review_missing"],
]) {
  const preview = readyPreview({ [field]: undefined });
  assert.notEqual(
    preview.contract_preview_status,
    "ready_for_future_current_working_perspective_update_contract_record_write",
  );
  assert(
    preview.contract_readiness.current_insufficient_data.includes(reason),
    `${field} should block readiness when missing`,
  );
  assert(preview.input_summary.proposed_patch_entry_count > 0);
}

for (const [field, review, reason] of [
  [
    "perspective_unit_record_review",
    makePerspectiveUnitReview({ review_status: "records_invalid" }),
    "perspective_unit_record_review_invalid",
  ],
  [
    "perspective_next_work_bias_record_review",
    makeNextWorkBiasReview({ review_status: "records_invalid" }),
    "perspective_next_work_bias_record_review_invalid",
  ],
  [
    "continuity_relay_record_review",
    makeContinuityRelayReview({ review_status: "records_invalid" }),
    "continuity_relay_record_review_invalid",
  ],
]) {
  const preview = readyPreview({ [field]: review });
  assert.notEqual(
    preview.contract_preview_status,
    "ready_for_future_current_working_perspective_update_contract_record_write",
  );
  assert(preview.blocking_reasons.includes(reason), `${field} invalid blocks`);
}

for (const [field, review, reason] of [
  [
    "perspective_unit_record_review",
    makePerspectiveUnitReview({ receiptProblem: true }),
    "perspective_unit_record_review_receipt_side_effect_problem",
  ],
  [
    "perspective_next_work_bias_record_review",
    makeNextWorkBiasReview({ receiptProblem: true }),
    "perspective_next_work_bias_record_review_receipt_side_effect_problem",
  ],
  [
    "continuity_relay_record_review",
    makeContinuityRelayReview({ receiptProblem: true }),
    "continuity_relay_record_review_receipt_side_effect_problem",
  ],
]) {
  const preview = readyPreview({ [field]: review });
  assert.notEqual(
    preview.contract_preview_status,
    "ready_for_future_current_working_perspective_update_contract_record_write",
  );
  assert(preview.blocking_reasons.includes(reason), `${field} corrupt receipt blocks`);
}

const noSourcePreview = readyPreview({
  current_working_perspective: makeCurrentWorkingPerspective({ withSources: false }),
  perspective_unit_record_review: makePerspectiveUnitReview({ withSources: false }),
  perspective_next_work_bias_record_review: makeNextWorkBiasReview({
    withSources: false,
  }),
  continuity_relay_record_review: makeContinuityRelayReview({
    withSources: false,
  }),
  perspective_relay_update_decision_record_review: undefined,
  perspective_relay_update_write_contract_preview: undefined,
  source_refs: [],
});
assert(
  noSourcePreview.missing_evidence.includes("source_refs_missing"),
  "missing source refs should block readiness",
);

const noEvidencePreview = readyPreview({
  perspective_unit_record_review: makePerspectiveUnitReview({ withEvidence: false }),
  perspective_next_work_bias_record_review: makeNextWorkBiasReview({
    withEvidence: false,
  }),
  continuity_relay_record_review: makeContinuityRelayReview({ withEvidence: false }),
});
assert(
  noEvidencePreview.missing_evidence.includes("evidence_refs_missing"),
  "missing evidence refs should block readiness",
);

for (const [field, reason] of [
  ["requested_operator_ref", "operator_ref_missing"],
  ["requested_idempotency_key", "idempotency_key_missing"],
  ["review_confirmation_ref", "review_confirmation_ref_missing"],
]) {
  const preview = readyPreview({ [field]: undefined });
  assert.notEqual(
    preview.contract_preview_status,
    "ready_for_future_current_working_perspective_update_contract_record_write",
  );
  assert(preview.contract_readiness.current_insufficient_data.includes(reason));
}

const unsafeRefPreview = readyPreview({
  requested_operator_ref: "/Users/hynk/private-operator",
});
assert.notEqual(
  unsafeRefPreview.contract_preview_status,
  "ready_for_future_current_working_perspective_update_contract_record_write",
);
assert(
  unsafeRefPreview.refusal_reasons.includes(
    "current_working_perspective_update_contract_refs_unsafe",
  ),
);

const partialPreview = readyPreview({
  continuity_relay_record_review: undefined,
});
assert(partialPreview.input_summary.proposed_patch_entry_count > 0);
assert.notEqual(
  partialPreview.contract_preview_status,
  "ready_for_future_current_working_perspective_update_contract_record_write",
);

const preview = readyPreview();
assert.equal(
  preview.contract_preview_status,
  "ready_for_future_current_working_perspective_update_contract_record_write",
);
assert.equal(
  preview.recommended_next_action,
  "write_current_working_perspective_update_contract_record",
);
assert.equal(preview.contract_readiness.write_ready, true);
assert(preview.input_summary.proposed_patch_entry_count >= 3);
assert.equal(preview.authority_boundary.read_only, true);
assert.equal(preview.authority_boundary.can_update_current_working_perspective, false);
assert.equal(preview.authority_boundary.can_apply_current_working_perspective_update, false);
assert.equal(preview.authority_boundary.can_write_perspective_unit, false);
assert.equal(preview.authority_boundary.can_write_next_work_bias, false);
assert.equal(preview.authority_boundary.can_write_continuity_relay, false);

const nonReadyDecision =
  buildCurrentWorkingPerspectiveUpdateContractOperatorDecisionPreviewV01({
    current_working_perspective_update_contract_preview: partialPreview,
    requested_operator_ref: "operator:cwp-contract-reviewer",
    requested_idempotency_key: "idempotency:cwp-contract-001",
    review_confirmation_ref: "review:cwp-contract-001",
    operator_decision_intent:
      "approve_for_current_working_perspective_update_contract_record",
  });
assert.notEqual(
  nonReadyDecision.decision_preview_status,
  "ready_for_future_current_working_perspective_update_contract_record_write",
);

const noIntentDecision =
  buildCurrentWorkingPerspectiveUpdateContractOperatorDecisionPreviewV01({
    current_working_perspective_update_contract_preview: preview,
    requested_operator_ref: "operator:cwp-contract-reviewer",
    requested_idempotency_key: "idempotency:cwp-contract-001",
    review_confirmation_ref: "review:cwp-contract-001",
  });
assert.notEqual(
  noIntentDecision.decision_preview_status,
  "ready_for_future_current_working_perspective_update_contract_record_write",
);

const decision = readyDecision(preview);
assert.equal(
  decision.decision_preview_status,
  "ready_for_future_current_working_perspective_update_contract_record_write",
);
assert.equal(decision.write_readiness.write_ready, true);

const invalidDb = new Database(":memory:");
const refusedNonReady = contractWrite.writeCurrentWorkingPerspectiveUpdateContractRecordV01(
  writeInput(nonReadyDecision),
  { db: invalidDb },
);
assert.equal(refusedNonReady.status, "refused");
assert.equal(
  contractWrite.currentWorkingPerspectiveUpdateContractWriteSchemaExistsV01(
    invalidDb,
  ),
  false,
);
invalidDb.close();

for (const [label, inputFactory] of [
  ["idempotency mismatch", () => writeInput(decision, { idempotency_key: "idempotency:cwp-contract-mismatch" })],
  [
    "operator mismatch",
    () => {
      const input = writeInput(decision);
      input.operator_approval = {
        ...input.operator_approval,
        operator_ref: "operator:cwp-contract-other",
      };
      return input;
    },
  ],
  [
    "unsafe refs",
    () => {
      const input = writeInput(decision);
      input.operator_approval = {
        ...input.operator_approval,
        checklist_confirmations: ["/Users/hynk/private-confirmation"],
      };
      return input;
    },
  ],
  ["raw private material", () => ({ ...writeInput(decision), raw_text: "private" })],
  [
    "fixture marker material",
    () => ({ ...writeInput(decision), notes: ["fixture material refused"] }),
  ],
  [
    "forbidden side effects",
    () => ({
      ...writeInput(decision),
      requested_side_effects: { current_working_perspective_updated: true },
    }),
  ],
  [
    "malformed patch entries",
    () => {
      const clonedDecision = clone(decision);
      const contractPreview =
        clonedDecision
          .would_write_current_working_perspective_update_contract_decision_preview
          .contract_preview;
      contractPreview.proposed_current_working_perspective_update_contract.proposed_patch_entries[0].patch_target =
        "live_current_working_perspective";
      return writeInput(clonedDecision);
    },
  ],
  [
    "forged live mutation authority",
    () => {
      const clonedDecision = clone(decision);
      clonedDecision
        .would_write_current_working_perspective_update_contract_decision_preview
        .contract_preview.authority_boundary.can_update_current_working_perspective =
        true;
      return writeInput(clonedDecision);
    },
  ],
]) {
  const db = new Database(":memory:");
  const result = contractWrite.writeCurrentWorkingPerspectiveUpdateContractRecordV01(
    inputFactory(),
    { db },
  );
  assert.equal(result.status, "refused", `${label} should be refused`);
  db.close();
}

const dbPath = `.tmp/current-working-perspective-update-contracts/cwp-contract-${Date.now()}.sqlite`;
rmIfExists(dbPath);
mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
const writeResult = contractWrite.writeCurrentWorkingPerspectiveUpdateContractRecordV01(
  writeInput(decision),
  { db },
);
assert.equal(writeResult.status, "written");
assert.equal(writeResult.record?.record_version, "current_working_perspective_update_contract_record.v0.1");
assert.equal(writeResult.receipt?.receipt_version, "current_working_perspective_update_contract_receipt.v0.1");
assert.equal(writeResult.no_side_effects.current_working_perspective_update_contract_record_written, true);
assert.equal(writeResult.no_side_effects.current_working_perspective_update_contract_receipt_written, true);
assert.equal(writeResult.no_side_effects.current_working_perspective_update_contract_persisted, true);
assert.equal(writeResult.no_side_effects.current_working_perspective_update_contract_written, true);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(writeResult.no_side_effects[field], false, `${field} must remain false`);
}

const replay = contractWrite.writeCurrentWorkingPerspectiveUpdateContractRecordV01(
  writeInput(decision),
  { db },
);
assert.equal(replay.status, "idempotent_existing");
assert.equal(replay.receipt.wrote, false);
assert.equal(replay.receipt.idempotent_replay, true);
assert.equal(
  replay.no_side_effects
    .current_working_perspective_update_contract_record_written,
  false,
);
assert.equal(
  replay.no_side_effects
    .current_working_perspective_update_contract_receipt_written,
  false,
);
assert.equal(
  replay.no_side_effects
    .current_working_perspective_update_contract_persisted,
  false,
);
assert.equal(
  replay.no_side_effects.current_working_perspective_update_contract_written,
  false,
);
assert.equal(
  replay.no_side_effects.current_working_perspective_updated,
  false,
);
assert.equal(
  replay.no_side_effects.current_working_perspective_update_applied,
  false,
);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(
    replay.no_side_effects[field],
    false,
    `${field} must remain false on idempotent replay`,
  );
}

const conflict = contractWrite.writeCurrentWorkingPerspectiveUpdateContractRecordV01(
  writeInput(decision, { notes: ["contract record local replay differs"] }),
  { db },
);
assert.equal(conflict.status, "refused");
assert.equal(conflict.receipt?.refusal_reasons[0], "idempotency_key_conflict");

const byRecordId = contractWrite.readCurrentWorkingPerspectiveUpdateContractRecordByIdV01(
  writeResult.record.record_id,
  { db },
);
assert.equal(byRecordId.status, "read");
const byIdempotency =
  contractWrite.readCurrentWorkingPerspectiveUpdateContractRecordByIdempotencyKeyV01(
    writeResult.record.idempotency_key,
    { db },
  );
assert.equal(byIdempotency.status, "read");

insertOutOfScopeRow(db, writeResult);
const listed = contractWrite.listCurrentWorkingPerspectiveUpdateContractRecordsV01({
  db,
});
assert(!listed.records.some((record) => record.scope !== "project:augnes"));
assert.equal(
  contractWrite.readCurrentWorkingPerspectiveUpdateContractRecordByIdV01(
    "current-working-perspective-update-contract:out-of-scope",
    { db },
  ).status,
  "not_found",
);

const outOfScopeReplayPreview = readyPreview({
  requested_idempotency_key: "idempotency:cwp-contract-out-of-scope",
});
const outOfScopeReplayDecision = readyDecision(outOfScopeReplayPreview);
const outOfScopeReplay =
  contractWrite.writeCurrentWorkingPerspectiveUpdateContractRecordV01(
    writeInput(outOfScopeReplayDecision),
    { db },
  );
assert.equal(
  outOfScopeReplay.status,
  "written",
  `out-of-scope replay should write in-scope row, got ${outOfScopeReplay.status}: ${outOfScopeReplay.receipt?.refusal_reasons?.join(",")}`,
);
assert.notEqual(outOfScopeReplay.status, "idempotent_existing");
db.close();

const noSchemaDb = new Database(":memory:");
assert.equal(
  contractWrite.listCurrentWorkingPerspectiveUpdateContractRecordsV01({
    db: noSchemaDb,
  }).status,
  "schema_missing",
);
assert.equal(
  contractWrite.currentWorkingPerspectiveUpdateContractWriteSchemaExistsV01(
    noSchemaDb,
  ),
  false,
);
noSchemaDb.close();

const defaultReview = buildCurrentWorkingPerspectiveUpdateContractRecordReviewV01();
assert.equal(defaultReview.review_status, "no_records");

const availableReview =
  buildCurrentWorkingPerspectiveUpdateContractRecordReviewV01({
    store_result: writeResult,
  });
assert.equal(availableReview.review_status, "records_available");
assert.equal(
  availableReview.input_summary.valid_record_count,
  1,
);

const malformedReview =
  buildCurrentWorkingPerspectiveUpdateContractRecordReviewV01({
    records: [{}],
  });
assert.equal(malformedReview.review_status, "records_invalid");

const corruptReceiptReview =
  buildCurrentWorkingPerspectiveUpdateContractRecordReviewV01({
    store_result: {
      ...writeResult,
      no_side_effects: {
        ...writeResult.no_side_effects,
        current_working_perspective_updated: true,
      },
    },
  });
assert.equal(corruptReceiptReview.review_status, "records_invalid");

const allowedReceiptReview =
  buildCurrentWorkingPerspectiveUpdateContractRecordReviewV01({
    store_result: writeResult,
  });
assert.equal(allowedReceiptReview.review_status, "records_available");
assert.equal(
  allowedReceiptReview.receipt_no_side_effects_summary
    .current_working_perspective_update_contract_written_count,
  1,
);

const rawRecordReview =
  buildCurrentWorkingPerspectiveUpdateContractRecordReviewV01({
    records: [{ ...writeResult.record, raw_text: "private" }],
  });
assert.equal(rawRecordReview.review_status, "records_invalid");

const forgedAuthorityRecord = clone(writeResult.record);
forgedAuthorityRecord.authority_boundary.can_update_current_working_perspective =
  true;
const forgedAuthorityReview =
  buildCurrentWorkingPerspectiveUpdateContractRecordReviewV01({
    records: [forgedAuthorityRecord],
  });
assert.equal(forgedAuthorityReview.review_status, "records_invalid");
assert(
  forgedAuthorityReview.record_summaries[0].problem_reasons.includes(
    "current_working_perspective_update_contract_record_authority_boundary_invalid",
  ),
);
const forgedAuthorityStoreReview =
  buildCurrentWorkingPerspectiveUpdateContractRecordReviewV01({
    store_result: {
      ...writeResult,
      record: forgedAuthorityRecord,
      records: [forgedAuthorityRecord],
    },
  });
assert.equal(forgedAuthorityStoreReview.review_status, "records_invalid");

const forgedNoMutationRecord = clone(writeResult.record);
forgedNoMutationRecord.no_mutation_performed.current_working_perspective_updated =
  true;
const forgedNoMutationReview =
  buildCurrentWorkingPerspectiveUpdateContractRecordReviewV01({
    records: [forgedNoMutationRecord],
  });
assert.equal(forgedNoMutationReview.review_status, "records_invalid");
assert(
  forgedNoMutationReview.record_summaries[0].problem_reasons.includes(
    "current_working_perspective_update_contract_record_no_mutation_invalid",
  ),
);

const forgedAuthorityProfileRecord = clone(writeResult.record);
forgedAuthorityProfileRecord.authority_profile.current_working_perspective_update_performed =
  true;
const forgedAuthorityProfileReview =
  buildCurrentWorkingPerspectiveUpdateContractRecordReviewV01({
    records: [forgedAuthorityProfileRecord],
  });
assert.equal(forgedAuthorityProfileReview.review_status, "records_invalid");
assert(
  forgedAuthorityProfileReview.record_summaries[0].problem_reasons.includes(
    "current_working_perspective_update_contract_record_authority_profile_invalid",
  ),
);

const unsafeRoutePath = await route.POST(
  makePostRequest({ db_path: "../private.sqlite", input: writeInput(decision) }),
);
assert.equal(unsafeRoutePath.status, 400);

const invalidJson = await route.POST(
  new Request(
    "http://localhost/api/workplane/current-working-perspective-update-contracts",
    {
      method: "POST",
      headers: sameOriginHeaders(),
      body: "{",
    },
  ),
);
assert.equal(invalidJson.status, 400);

const invalidObject = await route.POST(
  new Request(
    "http://localhost/api/workplane/current-working-perspective-update-contracts",
    {
      method: "POST",
      headers: sameOriginHeaders({ "content-type": "application/json" }),
      body: JSON.stringify([]),
    },
  ),
);
assert.equal(invalidObject.status, 400);

const invalidAction = await route.POST(
  makePostRequest({ action: "delete", db_path: dbPath, input: writeInput(decision) }),
);
assert.equal(invalidAction.status, 400);

const crossSite = await route.POST(
  new Request(
    "http://localhost/api/workplane/current-working-perspective-update-contracts",
    {
      method: "POST",
      headers: {
        ...sameOriginHeaders(),
        origin: "https://outside.invalid",
        "sec-fetch-site": "cross-site",
      },
      body: JSON.stringify({ action: "write", db_path: dbPath, input: writeInput(decision) }),
    },
  ),
);
assert.equal(crossSite.status, 403);

const invalidWriteDbPath = `.tmp/current-working-perspective-update-contracts/cwp-contract-invalid-${Date.now()}.sqlite`;
rmIfExists(invalidWriteDbPath);
const invalidWriteResponse = await route.POST(
  makePostRequest({
    db_path: invalidWriteDbPath,
    input: writeInput(nonReadyDecision),
  }),
);
assert.equal(invalidWriteResponse.status, 400);
assert.equal(existsSync(invalidWriteDbPath), false);

const routeDbPath = `.tmp/current-working-perspective-update-contracts/cwp-contract-route-${Date.now()}.sqlite`;
rmIfExists(routeDbPath);
const proxiedRouteResponse = await route.POST(
  makePostRequest(
    {
      db_path: routeDbPath,
      input: writeInput(decision),
    },
    {
      host: "internal.local",
      "x-forwarded-host": "operator.local",
      origin: "http://operator.local",
      "sec-fetch-site": "same-origin",
    },
  ),
);
assert.equal(proxiedRouteResponse.status, 201);
const proxiedRouteBody = await proxiedRouteResponse.json();
assert.equal(
  proxiedRouteBody.current_working_perspective_update_contract_record_written,
  true,
);
assert.equal(
  proxiedRouteBody.current_working_perspective_update_contract_receipt_written,
  true,
);
assert.equal(proxiedRouteBody.current_working_perspective_updated, false);
assert.equal(proxiedRouteBody.current_working_perspective_update_applied, false);
assert.equal(proxiedRouteBody.handoff_context_applied, false);
assert.equal(proxiedRouteBody.memory_written, false);

const proxiedRouteReplayResponse = await route.POST(
  makePostRequest(
    {
      db_path: routeDbPath,
      input: writeInput(decision),
    },
    {
      host: "internal.local",
      "x-forwarded-host": "operator.local",
      origin: "http://operator.local",
      "sec-fetch-site": "same-origin",
    },
  ),
);
assert.equal(proxiedRouteReplayResponse.status, 200);
const proxiedRouteReplayBody = await proxiedRouteReplayResponse.json();
assert.equal(
  proxiedRouteReplayBody.store_result.status,
  "idempotent_existing",
);
assert.equal(
  proxiedRouteReplayBody.current_working_perspective_update_contract_record_written,
  false,
);
assert.equal(
  proxiedRouteReplayBody.current_working_perspective_update_contract_written,
  false,
);
assert.equal(
  proxiedRouteReplayBody.no_side_effects
    .current_working_perspective_update_contract_record_written,
  false,
);
assert.equal(
  proxiedRouteReplayBody.no_side_effects
    .current_working_perspective_update_contract_persisted,
  false,
);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(
    proxiedRouteReplayBody.no_side_effects[field],
    false,
    `${field} must remain false on route idempotent replay`,
  );
}

const routeReadMissing = await route.GET(
  new Request(
    `http://localhost/api/workplane/current-working-perspective-update-contracts?db_path=.tmp/current-working-perspective-update-contracts/not-created-${Date.now()}.sqlite`,
  ),
);
assert.equal(routeReadMissing.status, 404);
const routeReadMissingBody = await routeReadMissing.json();
assert.equal(routeReadMissingBody.error_code, "db_missing");

const overview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  current_working_perspective_update_contract_preview: preview,
  current_working_perspective_update_contract_decision_preview: decision,
  current_working_perspective_update_contract_record_review: defaultReview,
  perspective_unit_record_review: makePerspectiveUnitReview(),
  perspective_next_work_bias_record_review: makeNextWorkBiasReview(),
  continuity_relay_record_review: makeContinuityRelayReview(),
});
const overviewSteps = overview.spine_steps;
const overviewStepIds = overviewSteps.map((step) => step.step_id);
assert(overviewStepIds.includes("current_working_perspective_update_contract"));
assert(overviewStepIds.includes("current_working_perspective_update_contract_decision"));
assert(overviewStepIds.includes("current_working_perspective_update_contract_record"));
assert(
  overviewSteps.some(
    (step) =>
      step.recommended_next_action ===
      "write_current_working_perspective_update_contract_record",
  ),
);
const overviewText = JSON.stringify(overview);
for (const forbidden of [
  "mutate_current_working_perspective",
  "apply_current_working_perspective_update_now",
  "apply_live_relay_state",
  "apply_handoff_context",
  "send_handoff",
  "write_memory",
  "write_dogfood_metrics",
  "call_provider",
  "call_github",
  "execute_codex",
  "create_graph_or_vector_store",
  "create_rag_stack",
  "observe_browser",
]) {
  assert(
    !overviewText.includes(`"${forbidden}"`),
    `overview must not recommend ${forbidden}`,
  );
}

rmIfExists(dbPath);
rmIfExists(invalidWriteDbPath);
rmIfExists(routeDbPath);

const changedFileBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "current-working-perspective-update-contract-v0-1",
});
assert(
  changedFileBoundary.files.every((file) => allowedChangedFiles.includes(file)),
);

console.log("PASS smoke:current-working-perspective-update-contract-v0-1");

function makeCurrentWorkingPerspective({ withSources = true } = {}) {
  const sourceRefs = withSources ? ["source:cwp-runtime"] : [];
  return {
    runtime: "augnes",
    perspective_version: "current_working_perspective.v0.1",
    projection_version: "augnes_delta_projection.v0.1",
    snapshot_version: "perspective_snapshot.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-05T00:00:00.000Z",
    current_frame: {
      summary: "Operator-reviewed bounded work is active.",
      primary_state_keys: ["state:cwp-contract"],
      active_work_ids: ["work:cwp-contract"],
      pressure_level: "medium",
      source_refs: sourceRefs,
    },
    current_thesis: {
      summary: "Scoped records should prepare a later CWP apply slice.",
      confidence: "medium",
      source_refs: sourceRefs,
    },
    active_goals: [
      {
        goal_ref: "goal:cwp-contract",
        summary: "Prepare contract material without live mutation.",
        source_refs: sourceRefs,
      },
    ],
    accepted_assumptions: [],
    rejected_assumptions: [],
    open_questions: [],
    active_risks: [],
    research_pressure: {
      level: "medium",
      summary: "Review pressure is bounded to contract material.",
      source_refs: sourceRefs,
    },
    next_candidates: [],
    last_major_delta_refs: [],
    review_queue_hints: {
      priority: "medium",
      hints: [],
      source_refs: sourceRefs,
    },
    source_refs: {
      snapshot_refs: sourceRefs,
      delta_refs: sourceRefs,
      projection_refs: sourceRefs,
    },
    staleness: {
      status: "fresh",
      reasons: [],
      source_refs: sourceRefs,
    },
    gaps: [],
    authority_boundary: {
      source_of_truth: "derived_read_model",
      can_commit_or_reject_state: false,
      can_record_proof: false,
      can_create_evidence: false,
      can_update_work: false,
      can_mutate_memory: false,
      can_apply_project_perspective: false,
      can_publish_external: false,
      can_merge: false,
      can_retry_replay_deploy: false,
      can_call_github: false,
      can_call_openai_or_provider: false,
      can_execute_codex: false,
      can_create_branch_or_pr: false,
      derived_view_only: true,
      can_write_db: false,
      can_add_route: false,
      can_add_ui: false,
      notes: ["Read-only derived CWP material."],
    },
    next_phase_notes: [],
  };
}

function makePerspectiveUnitReview({
  review_status = "records_available",
  receiptProblem = false,
  withSources = true,
  withEvidence = true,
} = {}) {
  const sourceRefs = withSources ? ["source:perspective-unit-record"] : [];
  const evidenceRefs = withEvidence ? ["evidence:perspective-unit-record"] : [];
  return {
    review_version: "perspective_unit_record_review.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-05T00:00:00.000Z",
    source_refs: sourceRefs,
    review_status,
    input_summary: {
      record_count: 1,
      valid_record_count: review_status === "records_invalid" ? 0 : 1,
    },
    evidence_summary: {
      has_records: true,
      has_evidence_refs: evidenceRefs.length > 0,
      has_receipt_side_effect_problem: receiptProblem,
      evidence_refs: evidenceRefs,
      missing_evidence: [],
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    records: [
      {
        record_id: "perspective-unit-record:cwp-contract-001",
        source_refs: sourceRefs,
        evidence_refs: evidenceRefs,
        perspective_unit_entries: [
          {
            perspective_unit_ref: "perspective-unit:cwp-contract-001",
            lifecycle_directive: "reinforce",
            summary: "Preserve the bounded contract thesis.",
            evidence_refs: evidenceRefs,
            source_refs: sourceRefs,
            review_pressure: "medium",
          },
        ],
      },
    ],
  };
}

function makeNextWorkBiasReview({
  review_status = "records_available",
  receiptProblem = false,
  withSources = true,
  withEvidence = true,
} = {}) {
  const sourceRefs = withSources ? ["source:next-work-bias-record"] : [];
  const evidenceRefs = withEvidence ? ["evidence:next-work-bias-record"] : [];
  return {
    review_version: "perspective_next_work_bias_record_review.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-05T00:00:00.000Z",
    source_refs: sourceRefs,
    review_status,
    input_summary: {
      record_count: 1,
      valid_record_count: review_status === "records_invalid" ? 0 : 1,
    },
    evidence_summary: {
      has_records: true,
      has_evidence_refs: evidenceRefs.length > 0,
      has_receipt_side_effect_problem: receiptProblem,
      evidence_refs: evidenceRefs,
      missing_evidence: [],
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    records: [
      {
        record_id: "next-work-bias-record:cwp-contract-001",
        source_refs: sourceRefs,
        evidence_refs: evidenceRefs,
        next_work_bias_entries: [
          {
            bias_ref: "next-work-bias:cwp-contract-001",
            directive: "warn_next_time",
            summary: "Keep future apply work separate from contract writing.",
            evidence_refs: evidenceRefs,
            source_refs: sourceRefs,
            review_pressure: "high",
          },
        ],
      },
    ],
  };
}

function makeContinuityRelayReview({
  review_status = "records_available",
  receiptProblem = false,
  withSources = true,
  withEvidence = true,
} = {}) {
  const sourceRefs = withSources ? ["source:continuity-relay-record"] : [];
  const evidenceRefs = withEvidence ? ["evidence:continuity-relay-record"] : [];
  return {
    review_version: "continuity_relay_record_review.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-05T00:00:00.000Z",
    source_refs: sourceRefs,
    review_status,
    input_summary: {
      record_count: 1,
      valid_record_count: review_status === "records_invalid" ? 0 : 1,
    },
    evidence_summary: {
      has_records: true,
      has_evidence_refs: evidenceRefs.length > 0,
      has_receipt_side_effect_problem: receiptProblem,
      evidence_refs: evidenceRefs,
      missing_evidence: [],
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    records: [
      {
        record_id: "continuity-relay-record:cwp-contract-001",
        source_refs: sourceRefs,
        evidence_refs: evidenceRefs,
        continuity_relay_entries: [
          {
            continuity_relay_ref: "continuity-relay:cwp-contract-001",
            relay_directive: "preserve_anchor",
            summary: "Carry the scoped contract boundary forward.",
            evidence_refs: evidenceRefs,
            source_refs: sourceRefs,
            review_pressure: "medium",
          },
        ],
      },
    ],
  };
}

function makeDecisionRecordReview() {
  return {
    review_version: "perspective_relay_update_decision_record_review.v0.1",
    records: [
      {
        record_id: "perspective-relay-update-decision-record:cwp-contract-001",
      },
    ],
    input_summary: {
      valid_record_count: 1,
    },
    evidence_summary: {
      evidence_refs: ["evidence:perspective-relay-update-decision-record"],
    },
    source_refs: ["source:perspective-relay-update-decision-record"],
  };
}

function makeRelayWriteContractPreview() {
  return {
    preview_version: "perspective_relay_update_write_contract_preview.v0.1",
    preview_ref: "perspective-relay-update-write-contract-preview:cwp-contract-001",
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function insertOutOfScopeRow(db, writeResult) {
  const outOfScopeRecord = {
    ...writeResult.record,
    record_id: "current-working-perspective-update-contract:out-of-scope",
    idempotency_key: "idempotency:cwp-contract-out-of-scope",
    scope: "project:other",
  };
  const outOfScopeReceipt = {
    ...writeResult.receipt,
    record_id: outOfScopeRecord.record_id,
    idempotency_key: outOfScopeRecord.idempotency_key,
  };
  db.prepare(
    `INSERT INTO current_working_perspective_update_contract_records (
      record_id,
      idempotency_key,
      created_at,
      scope,
      operator_ref,
      record_fingerprint,
      record_json,
      receipt_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    outOfScopeRecord.record_id,
    outOfScopeRecord.idempotency_key,
    outOfScopeRecord.created_at,
    outOfScopeRecord.scope,
    outOfScopeRecord.operator_ref,
    outOfScopeRecord.record_fingerprint,
    JSON.stringify(outOfScopeRecord),
    JSON.stringify(outOfScopeReceipt),
  );
}

function sameOriginHeaders(overrides = {}) {
  return {
    host: "localhost",
    origin: "http://localhost",
    "sec-fetch-site": "same-origin",
    ...overrides,
  };
}

function makePostRequest(body, headers = sameOriginHeaders()) {
  return new Request(
    "http://localhost/api/workplane/current-working-perspective-update-contracts",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        action: "write",
        ...body,
      }),
    },
  );
}

function rmIfExists(relativePath) {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (existsSync(absolutePath)) {
    rmSync(absolutePath, { force: true, recursive: true });
  }
}
