import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const root = process.cwd();
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
assert.equal(
  pkg.scripts[
    "smoke:current-working-perspective-route-integration-contract-v0-1"
  ],
  "tsx --tsconfig tsconfig.json scripts/smoke-current-working-perspective-route-integration-contract-v0-1.mjs",
);

const expectedFiles = [
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
  "components/workplane/agent-workplane.tsx",
  "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  "types/workbench-dogfood-loop-spine-overview.ts",
  "scripts/smoke-current-working-perspective-route-integration-contract-v0-1.mjs",
  "scripts/smoke-current-working-perspective-update-contract-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
  "scripts/smoke-current-working-perspective-apply-slice-v0-1.mjs",
  "scripts/smoke-continuity-relay-scoped-write-v0-1.mjs",
  "scripts/smoke-perspective-unit-scoped-write-v0-1.mjs",
  "scripts/smoke-perspective-next-work-bias-scoped-write-v0-1.mjs",
  "scripts/smoke-perspective-relay-update-decision-write-contract-v0-1.mjs",
  "types/current-working-perspective-route-integration-read.ts",
  "lib/perspective/current-working-perspective-route-integration-read.ts",
  "lib/perspective/read-current-working-perspective-route-integration-for-web.ts",
  "types/current-working-perspective-route-integration-read-review.ts",
  "lib/workplane/current-working-perspective-route-integration-read-review.ts",
  "components/workplane/current-working-perspective-route-integration-read-panel.tsx",
  "app/api/perspective/current/route.ts",
  "scripts/smoke-current-working-perspective-route-integration-slice-v0-1.mjs",
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
  "scripts/smoke-handoff-context-update-contract-v0-1.mjs",
  "package.json",
];
for (const file of expectedFiles.slice(0, 13)) {
  assert(existsSync(path.join(root, file)), `missing ${file}`);
}

const changed = await gitChangedFiles();
for (const file of changed) {
  assert(
    expectedFiles.includes(file),
    `changed file outside CWP route integration contract boundary: ${file}`,
  );
}

const expectedStrings = [
  "current_working_perspective_route_integration_contract_preview.v0.1",
  "current_working_perspective_route_integration_contract_operator_decision_preview.v0.1",
  "current_working_perspective_route_integration_contract_record.v0.1",
  "current_working_perspective_route_integration_contract_receipt.v0.1",
  "current_working_perspective_route_integration_contract_store.v0.1",
  "current_working_perspective_route_integration_contract_record_review.v0.1",
  "applied_snapshot_overlay_candidate",
  "applied_snapshot_preferred_with_runtime_fallback",
  "prepare_current_working_perspective_route_integration_slice",
];
const repoText = expectedFiles
  .filter((file) => existsSync(path.join(root, file)))
  .map((file) => readFileSync(path.join(root, file), "utf8"))
  .join("\n");
for (const expected of expectedStrings) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

const { buildCurrentWorkingPerspectiveRouteIntegrationContractPreviewV01 } =
  await import(
    "../lib/workplane/current-working-perspective-route-integration-contract-preview.ts"
  );
const {
  buildCurrentWorkingPerspectiveRouteIntegrationContractOperatorDecisionPreviewV01,
} = await import(
  "../lib/workplane/current-working-perspective-route-integration-contract-decision.ts"
);
const routeWrite = await import(
  "../lib/workplane/current-working-perspective-route-integration-contract-write.ts"
);
const {
  buildCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewV01,
} = await import(
  "../lib/workplane/current-working-perspective-route-integration-contract-record-review.ts"
);
const {
  readCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewForWebV01,
} = await import(
  "../lib/workplane/read-current-working-perspective-route-integration-contract-record-review-for-web.ts"
);
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);
const route = await import(
  "../app/api/workplane/current-working-perspective-route-integration-contracts/route.ts"
);

const AS_OF = "2026-07-06T00:00:00.000Z";
const operatorRef = "operator:cwp-route-integration";
const idempotencyKey = "idempotency:cwp-route-integration";
const reviewRef = "review:cwp-route-integration";
const sourceRefs = ["source:cwp-route-integration"];
const evidenceRefs = ["evidence:cwp-route-integration"];
const tempDir = path.join(
  root,
  ".tmp/current-working-perspective-route-integration-contracts",
);
rmSync(tempDir, { force: true, recursive: true });

const forbiddenNoSideEffectFields = [
  "api_perspective_current_route_modified",
  "current_working_perspective_route_response_replaced",
  "upstream_current_working_perspective_source_tables_updated",
  "upstream_current_working_perspective_source_tables_mutated",
  "applied_current_working_perspective_snapshot_written",
  "current_working_perspective_apply_record_written",
  "current_working_perspective_update_contract_record_written",
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
  return buildCurrentWorkingPerspectiveRouteIntegrationContractPreviewV01({
    current_working_perspective_read: runtimeCwpRead(),
    applied_current_working_perspective_read: appliedCwpRead(),
    current_working_perspective_apply_record_review: buildApplyRecordReview(),
    current_working_perspective_update_contract_record_review:
      buildUpdateContractRecordReview(),
    requested_route_integration_mode: "applied_snapshot_overlay_candidate",
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
  return buildCurrentWorkingPerspectiveRouteIntegrationContractOperatorDecisionPreviewV01({
    current_working_perspective_route_integration_contract_preview: preview,
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    operator_decision_intent:
      "approve_for_current_working_perspective_route_integration_contract_record",
    scope: "project:augnes",
    as_of: AS_OF,
    source_refs: sourceRefs,
    ...overrides,
  });
}

function buildWriteInput(decision = buildDecision(), overrides = {}) {
  return {
    operator_decision_preview: decision,
    operator_approval: {
      operator_decision:
        "approve_for_current_working_perspective_route_integration_contract_record",
      approved_by: "operator:cwp-route-integration-approver",
      operator_ref: operatorRef,
      approved_at: AS_OF,
      approval_statement: "approve:cwp-route-integration-local-contract-only",
      checklist_confirmations: [
        "confirm:local-route-contract-only",
        "confirm:no-api-perspective-current-change",
      ],
    },
    idempotency_key: idempotencyKey,
    notes: ["note:scoped-local-route-integration-contract"],
    ...overrides,
  };
}

assert.equal(
  buildCurrentWorkingPerspectiveRouteIntegrationContractPreviewV01({
    applied_current_working_perspective_read: appliedCwpRead(),
    current_working_perspective_apply_record_review: buildApplyRecordReview(),
    requested_route_integration_mode: "applied_snapshot_overlay_candidate",
    scope: "project:augnes",
    as_of: AS_OF,
    source_refs: sourceRefs,
  }).contract_preview_status,
  "no_runtime_current_working_perspective_material",
);
assert.notEqual(
  buildPreview({ current_working_perspective_read: fixtureCwpRead() })
    .contract_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
assert.notEqual(
  buildPreview({ applied_current_working_perspective_read: undefined })
    .contract_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
assert.notEqual(
  buildPreview({ applied_current_working_perspective_read: noAppliedSnapshotRead() })
    .contract_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
const malformedSnapshotRead = appliedCwpRead();
malformedSnapshotRead.latest_applied_snapshot = { snapshot_version: "bad" };
assert(
  buildPreview({ applied_current_working_perspective_read: malformedSnapshotRead })
    .blocking_reasons.includes(
      "applied_current_working_perspective_snapshot_malformed",
    ),
);
const malformedSnapshotCwpRead = appliedCwpRead();
malformedSnapshotCwpRead.latest_applied_snapshot.applied_current_working_perspective = {};
assert(
  buildPreview({ applied_current_working_perspective_read: malformedSnapshotCwpRead })
    .blocking_reasons.includes(
      "applied_current_working_perspective_snapshot_cwp_malformed",
    ),
);
assert.notEqual(
  buildPreview({ current_working_perspective_apply_record_review: undefined })
    .contract_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
assert(
  buildPreview({
    current_working_perspective_apply_record_review: buildApplyRecordReview({
      review_status: "records_invalid",
      evidence_summary: {
        ...buildApplyRecordReview().evidence_summary,
        has_receipt_side_effect_problem: false,
      },
    }),
  }).blocking_reasons.includes("current_working_perspective_apply_record_review_invalid"),
);
assert(
  buildPreview({
    current_working_perspective_apply_record_review: buildApplyRecordReview({
      evidence_summary: {
        ...buildApplyRecordReview().evidence_summary,
        has_receipt_side_effect_problem: true,
      },
    }),
  }).blocking_reasons.includes(
    "current_working_perspective_apply_record_receipt_side_effect_problem",
  ),
);
const noRecordsApplyReview = buildApplyRecordReview({
  review_status: "no_records",
  input_summary: {
    ...buildApplyRecordReview().input_summary,
    valid_record_count: 0,
  },
  records: [],
  applied_snapshots: [],
  latest_record_summary: null,
  latest_applied_snapshot_summary: null,
});
const noRecordsApplyReviewPreview = buildPreview({
  current_working_perspective_apply_record_review: noRecordsApplyReview,
});
assert.notEqual(
  noRecordsApplyReviewPreview.contract_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
assert(
  noRecordsApplyReviewPreview.blocking_reasons.includes(
    "current_working_perspective_apply_record_review_no_records",
  ),
);
const schemaMissingApplyReviewPreview = buildPreview({
  current_working_perspective_apply_record_review: buildApplyRecordReview({
    review_status: "schema_missing",
  }),
});
assert.notEqual(
  schemaMissingApplyReviewPreview.contract_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
assert(
  schemaMissingApplyReviewPreview.blocking_reasons.includes(
    "current_working_perspective_apply_record_review_schema_missing",
  ),
);
const selectedRecordMissingApplyReviewPreview = buildPreview({
  current_working_perspective_apply_record_review: buildApplyRecordReview({
    review_status: "selected_record_missing",
  }),
});
assert.notEqual(
  selectedRecordMissingApplyReviewPreview.contract_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
assert(
  selectedRecordMissingApplyReviewPreview.blocking_reasons.includes(
    "current_working_perspective_apply_record_review_selected_record_missing",
  ),
);
const selectedSnapshotMissingApplyReviewPreview = buildPreview({
  current_working_perspective_apply_record_review: buildApplyRecordReview({
    review_status: "selected_applied_snapshot_missing",
  }),
});
assert.notEqual(
  selectedSnapshotMissingApplyReviewPreview.contract_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
assert(
  selectedSnapshotMissingApplyReviewPreview.blocking_reasons.includes(
    "current_working_perspective_apply_record_review_selected_applied_snapshot_missing",
  ),
);
const zeroValidRecordsApplyReviewPreview = buildPreview({
  current_working_perspective_apply_record_review: buildApplyRecordReview({
    input_summary: {
      ...buildApplyRecordReview().input_summary,
      valid_record_count: 0,
    },
    records: [],
  }),
});
assert.notEqual(
  zeroValidRecordsApplyReviewPreview.contract_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
assert(
  zeroValidRecordsApplyReviewPreview.blocking_reasons.includes(
    "current_working_perspective_apply_record_review_valid_records_missing",
  ),
);
const emptyAppliedSnapshotsReviewPreview = buildPreview({
  current_working_perspective_apply_record_review: buildApplyRecordReview({
    applied_snapshots: [],
  }),
});
assert.notEqual(
  emptyAppliedSnapshotsReviewPreview.contract_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
assert(
  emptyAppliedSnapshotsReviewPreview.blocking_reasons.includes(
    "current_working_perspective_apply_record_review_applied_snapshots_missing",
  ),
);
const unsupportedSnapshotRead = appliedCwpRead({
  applied_snapshot_ref: "current-working-perspective-applied-snapshot:other",
});
const unsupportedSnapshotPreview = buildPreview({
  applied_current_working_perspective_read: unsupportedSnapshotRead,
});
assert.notEqual(
  unsupportedSnapshotPreview.contract_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
assert(
  unsupportedSnapshotPreview.blocking_reasons.includes(
    "current_working_perspective_applied_snapshot_not_supported_by_apply_record_review",
  ),
);
const unsupportedLatestRecordRead = appliedCwpRead();
unsupportedLatestRecordRead.latest_record.record_id =
  "current-working-perspective-apply:other";
const unsupportedLatestRecordPreview = buildPreview({
  applied_current_working_perspective_read: unsupportedLatestRecordRead,
});
assert.notEqual(
  unsupportedLatestRecordPreview.contract_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
assert(
  unsupportedLatestRecordPreview.blocking_reasons.includes(
    "current_working_perspective_applied_latest_record_not_supported_by_apply_record_review",
  ),
);
const noLatestRecordRead = appliedCwpRead();
noLatestRecordRead.latest_record = null;
const noLatestRecordReadyPreview = buildPreview({
  applied_current_working_perspective_read: noLatestRecordRead,
});
assert.equal(
  noLatestRecordReadyPreview.contract_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
assert.deepEqual(
  noLatestRecordReadyPreview
    .would_write_current_working_perspective_route_integration_contract_record_preview
    .source_cwp_apply_record_refs,
  ["current-working-perspective-apply:valid"],
);
assert(
  !noLatestRecordReadyPreview
    .would_write_current_working_perspective_route_integration_contract_record_preview
    .source_cwp_apply_record_refs.includes("cwp-update-contract-record:valid"),
);
const missingApplyRecordRefRead = appliedCwpRead();
missingApplyRecordRefRead.latest_record = null;
const missingApplyRecordRefPreview = buildPreview({
  applied_current_working_perspective_read: missingApplyRecordRefRead,
  current_working_perspective_apply_record_review: buildApplyRecordReview({
    latest_record_summary: null,
    selected_record_summary: null,
  }),
});
assert.notEqual(
  missingApplyRecordRefPreview.contract_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
assert(
  missingApplyRecordRefPreview.blocking_reasons.includes(
    "current_working_perspective_apply_record_ref_missing",
  ),
);
assert(
  buildPreview({
    current_working_perspective_update_contract_record_review: {
      review_version: "current_working_perspective_update_contract_record_review.v9",
      records: [],
      input_summary: {},
      evidence_summary: {},
    },
  }).blocking_reasons.includes(
    "current_working_perspective_update_contract_record_review_malformed",
  ),
);
assert(
  buildPreview({
    current_working_perspective_update_contract_record_review:
      buildUpdateContractRecordReview({ review_status: "records_invalid" }),
  }).blocking_reasons.includes(
    "current_working_perspective_update_contract_record_review_invalid",
  ),
);
const keepRuntimeOnly = buildPreview({
  requested_route_integration_mode: "keep_runtime_only",
});
assert.notEqual(
  keepRuntimeOnly.contract_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
assert(
  ["keep_runtime_only", "keep_preview_only"].includes(
    keepRuntimeOnly.recommended_next_action,
  ),
);
for (const [field, override] of [
  ["source_refs", { source_refs: [] }],
  [
    "evidence",
    {
      applied_current_working_perspective_read: appliedCwpRead({
        evidence_refs: [],
      }),
      current_working_perspective_apply_record_review: buildApplyRecordReview({
        evidence_summary: {
          ...buildApplyRecordReview().evidence_summary,
          evidence_refs: [],
        },
      }),
      current_working_perspective_update_contract_record_review: undefined,
    },
  ],
  ["operator", { requested_operator_ref: undefined }],
  ["idempotency", { requested_idempotency_key: undefined }],
  ["review", { review_confirmation_ref: undefined }],
]) {
  assert.notEqual(
    buildPreview(override).contract_preview_status,
    "ready_for_future_current_working_perspective_route_integration_contract_record_write",
    field,
  );
}
assert(
  buildPreview({ requested_operator_ref: "operator:sk-test" }).refusal_reasons.includes(
    "current_working_perspective_route_integration_refs_unsafe",
  ),
);

const readyPreview = buildPreview();
assert.equal(
  readyPreview.contract_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
assert.equal(readyPreview.contract_readiness.write_ready, true);
assert.equal(readyPreview.authority_boundary.can_modify_api_perspective_current_route, false);
assert.equal(readyPreview.authority_boundary.can_write_db, false);
assert.equal(readyPreview.authority_boundary.can_write_memory, false);

assert.notEqual(
  buildCurrentWorkingPerspectiveRouteIntegrationContractOperatorDecisionPreviewV01({
    scope: "project:augnes",
    as_of: AS_OF,
    source_refs: sourceRefs,
  }).decision_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
assert.notEqual(
  buildDecision(readyPreview, { operator_decision_intent: undefined })
    .decision_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);
const readyDecision = buildDecision(readyPreview);
assert.equal(
  readyDecision.decision_preview_status,
  "ready_for_future_current_working_perspective_route_integration_contract_record_write",
);

const memoryDb = new Database(":memory:");
const nonReadyWrite = routeWrite.writeCurrentWorkingPerspectiveRouteIntegrationContractRecordV01(
  buildWriteInput(buildDecision(buildPreview({ requested_operator_ref: undefined }))),
  { db: memoryDb },
);
assert.equal(nonReadyWrite.status, "refused");
assert.equal(
  routeWrite.currentWorkingPerspectiveRouteIntegrationContractWriteSchemaExistsV01(memoryDb),
  false,
);
memoryDb.close();

assert.equal(
  routeWrite.validateCurrentWorkingPerspectiveRouteIntegrationContractWriteInputV01(
    buildWriteInput(readyDecision, { idempotency_key: "idempotency:mismatch" }),
  ).ok,
  false,
);
assert.equal(
  routeWrite.validateCurrentWorkingPerspectiveRouteIntegrationContractWriteInputV01(
    buildWriteInput(readyDecision, {
      operator_approval: {
        ...buildWriteInput(readyDecision).operator_approval,
        operator_ref: "operator:mismatch",
      },
    }),
  ).ok,
  false,
);
assert.equal(
  routeWrite.validateCurrentWorkingPerspectiveRouteIntegrationContractWriteInputV01(
    buildWriteInput(readyDecision, { notes: ["private:raw-token"] }),
  ).ok,
  false,
);
assert.equal(
  routeWrite.validateCurrentWorkingPerspectiveRouteIntegrationContractWriteInputV01({
    ...buildWriteInput(readyDecision),
    raw_text: "refuse",
  }).ok,
  false,
);
assert.equal(
  routeWrite.validateCurrentWorkingPerspectiveRouteIntegrationContractWriteInputV01(
    buildWriteInput(readyDecision, { notes: ["fixture"] }),
  ).ok,
  false,
);
assert.equal(
  routeWrite.validateCurrentWorkingPerspectiveRouteIntegrationContractWriteInputV01(
    buildWriteInput(readyDecision, {
      requested_side_effects: {
        api_perspective_current_route_modified: true,
      },
    }),
  ).ok,
  false,
);
const malformedContractDecision = clone(readyDecision);
malformedContractDecision.would_write_current_working_perspective_route_integration_contract_decision_preview.contract_preview.proposed_current_working_perspective_route_integration_contract = {
  contract_kind: "bad",
};
assert.equal(
  routeWrite.validateCurrentWorkingPerspectiveRouteIntegrationContractWriteInputV01(
    buildWriteInput(malformedContractDecision),
  ).ok,
  false,
);
const forgedAuthorityDecision = clone(readyDecision);
forgedAuthorityDecision.authority_boundary.can_modify_api_perspective_current_route = true;
assert.equal(
  routeWrite.validateCurrentWorkingPerspectiveRouteIntegrationContractWriteInputV01(
    buildWriteInput(forgedAuthorityDecision),
  ).ok,
  false,
);
const forgedApplyRecordRefDecision = clone(readyDecision);
forgedApplyRecordRefDecision.would_write_current_working_perspective_route_integration_contract_decision_preview.contract_preview.would_write_current_working_perspective_route_integration_contract_record_preview.source_cwp_apply_record_refs = [
  "cwp-update-contract-record:valid",
];
const forgedApplyRecordRefValidation =
  routeWrite.validateCurrentWorkingPerspectiveRouteIntegrationContractWriteInputV01(
    buildWriteInput(forgedApplyRecordRefDecision),
  );
assert.equal(forgedApplyRecordRefValidation.ok, false);
assert(
  forgedApplyRecordRefValidation.refusal_reasons.includes(
    "source_cwp_apply_record_refs_not_apply_records",
  ),
);
const forgedApplyRecordRefDb = new Database(":memory:");
const forgedApplyRecordRefWrite =
  routeWrite.writeCurrentWorkingPerspectiveRouteIntegrationContractRecordV01(
    buildWriteInput(forgedApplyRecordRefDecision),
    { db: forgedApplyRecordRefDb },
  );
assert.equal(forgedApplyRecordRefWrite.status, "refused");
assert.equal(
  routeWrite.currentWorkingPerspectiveRouteIntegrationContractWriteSchemaExistsV01(
    forgedApplyRecordRefDb,
  ),
  false,
);
forgedApplyRecordRefDb.close();

const dbPath = ".tmp/current-working-perspective-route-integration-contracts/direct.sqlite";
rmSync(path.join(root, dbPath), { force: true });
mkdirSync(path.dirname(path.join(root, dbPath)), { recursive: true });
const db = new Database(path.join(root, dbPath));
const writeResult =
  routeWrite.writeCurrentWorkingPerspectiveRouteIntegrationContractRecordV01(
    buildWriteInput(readyDecision),
    { db },
  );
assert.equal(
  writeResult.status,
  "written",
  JSON.stringify(writeResult.receipt.refusal_reasons),
);
assert.equal(writeResult.record.record_version, "current_working_perspective_route_integration_contract_record.v0.1");
assert.equal(
  writeResult.no_side_effects
    .current_working_perspective_route_integration_contract_record_written,
  true,
);
assert.equal(
  writeResult.no_side_effects
    .current_working_perspective_route_integration_contract_receipt_written,
  true,
);
assert.equal(
  writeResult.no_side_effects
    .current_working_perspective_route_integration_contract_persisted,
  true,
);
assert.equal(
  writeResult.no_side_effects
    .current_working_perspective_route_integration_contract_written,
  true,
);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(writeResult.no_side_effects[field], false, field);
}
const replay =
  routeWrite.writeCurrentWorkingPerspectiveRouteIntegrationContractRecordV01(
    buildWriteInput(readyDecision),
    { db },
  );
assert.equal(replay.status, "idempotent_existing");
assert.equal(replay.receipt.wrote, false);
assert.equal(replay.receipt.idempotent_replay, true);
assert.equal(
  replay.no_side_effects
    .current_working_perspective_route_integration_contract_record_written,
  false,
);
assert.equal(
  replay.no_side_effects
    .current_working_perspective_route_integration_contract_persisted,
  false,
);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(replay.no_side_effects[field], false, `replay ${field}`);
}
const conflict =
  routeWrite.writeCurrentWorkingPerspectiveRouteIntegrationContractRecordV01(
    buildWriteInput(readyDecision, { notes: ["note:changed"] }),
    { db },
  );
assert.equal(conflict.status, "refused");
assert(
  conflict.receipt.refusal_reasons.includes("idempotency_key_conflict"),
);
assert.equal(
  routeWrite.readCurrentWorkingPerspectiveRouteIntegrationContractRecordByIdV01(
    writeResult.record.record_id,
    { db },
  ).status,
  "read",
);
assert.equal(
  routeWrite.readCurrentWorkingPerspectiveRouteIntegrationContractRecordByIdempotencyKeyV01(
    idempotencyKey,
    { db },
  ).status,
  "read",
);
db
  .prepare(
    `INSERT INTO current_working_perspective_route_integration_contract_records
      (record_id, idempotency_key, created_at, scope, operator_ref, record_fingerprint, route_integration_mode, record_json, receipt_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  .run(
    "current-working-perspective-route-integration-contract:outside",
    "idempotency:outside",
    AS_OF,
    "project:outside",
    operatorRef,
    "fingerprint:outside",
    "applied_snapshot_overlay_candidate",
    JSON.stringify({
      ...writeResult.record,
      record_id: "current-working-perspective-route-integration-contract:outside",
      scope: "project:outside",
      idempotency_key: "idempotency:outside",
    }),
    JSON.stringify(writeResult.receipt),
  );
assert.equal(
  routeWrite
    .listCurrentWorkingPerspectiveRouteIntegrationContractRecordsV01({ db })
    .records.some((record) => record.scope !== "project:augnes"),
  false,
);
db.close();

const outScopeDbPath =
  ".tmp/current-working-perspective-route-integration-contracts/outside.sqlite";
rmSync(path.join(root, outScopeDbPath), { force: true });
mkdirSync(path.dirname(path.join(root, outScopeDbPath)), { recursive: true });
const outScopeDb = new Database(path.join(root, outScopeDbPath));
routeWrite.ensureCurrentWorkingPerspectiveRouteIntegrationContractWriteSchemaV01(
  outScopeDb,
);
outScopeDb
  .prepare(
    `INSERT INTO current_working_perspective_route_integration_contract_records
      (record_id, idempotency_key, created_at, scope, operator_ref, record_fingerprint, route_integration_mode, record_json, receipt_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  .run(
    "current-working-perspective-route-integration-contract:outside-same-key",
    idempotencyKey,
    AS_OF,
    "project:outside",
    operatorRef,
    "fingerprint:outside",
    "applied_snapshot_overlay_candidate",
    JSON.stringify({ ...writeResult.record, scope: "project:outside" }),
    JSON.stringify(writeResult.receipt),
  );
assert.notEqual(
  routeWrite.writeCurrentWorkingPerspectiveRouteIntegrationContractRecordV01(
    buildWriteInput(readyDecision),
    { db: outScopeDb },
  ).status,
  "idempotent_existing",
);
outScopeDb.close();

const emptyDb = new Database(":memory:");
assert.equal(
  routeWrite.listCurrentWorkingPerspectiveRouteIntegrationContractRecordsV01({
    db: emptyDb,
  }).status,
  "schema_missing",
);
assert.equal(
  routeWrite.currentWorkingPerspectiveRouteIntegrationContractWriteSchemaExistsV01(
    emptyDb,
  ),
  false,
);
emptyDb.close();

assert.equal(
  buildCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewV01()
    .review_status,
  "no_records",
);
assert.equal(
  buildCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewV01({
    store_result: writeResult,
  }).review_status,
  "records_available",
);
assert.equal(
  buildCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewV01({
    records: [{ record_version: "bad" }],
  }).review_status,
  "records_invalid",
);
const corruptReceiptStore = clone(writeResult);
corruptReceiptStore.receipt.no_side_effects.api_perspective_current_route_modified = true;
corruptReceiptStore.no_side_effects.api_perspective_current_route_modified = true;
assert.equal(
  buildCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewV01({
    store_result: corruptReceiptStore,
  }).review_status,
  "records_invalid",
);
for (const [label, mutate] of [
  [
    "authority_profile",
    (record) => {
      record.authority_profile.api_perspective_current_route_modified = true;
    },
  ],
  [
    "no_route_change",
    (record) => {
      record.no_route_change_performed.current_working_perspective_route_response_replaced = true;
    },
  ],
  [
    "authority_boundary",
    (record) => {
      record.authority_boundary.can_modify_api_perspective_current_route = true;
    },
  ],
]) {
  const forged = clone(writeResult.record);
  mutate(forged);
  const review = buildCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewV01({
    records: [forged],
  });
  assert.equal(review.review_status, "records_invalid", label);
}
assert.equal(
  buildCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewV01({
    records: [{ ...writeResult.record, raw_excerpt: "refuse" }],
  }).review_status,
  "records_invalid",
);
assert.equal(
  readCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewForWebV01()
    .review_status,
  "no_records",
);

assert.equal(route.isSafeCurrentWorkingPerspectiveRouteIntegrationContractRouteDbPathV01("/tmp/a.sqlite"), false);
assert.equal(route.isSafeCurrentWorkingPerspectiveRouteIntegrationContractRouteDbPathV01("tmp/current-working-perspective-route-integration-contracts/a.txt"), false);
assert.equal(route.isSafeCurrentWorkingPerspectiveRouteIntegrationContractRouteDbPathV01("tmp/current-working-perspective-route-integration-contracts/a.sqlite"), true);

const routeDbPath =
  ".tmp/current-working-perspective-route-integration-contracts/route.sqlite";
rmSync(path.join(root, routeDbPath), { force: true });
const invalidJsonResponse = await route.POST(
  new Request(
    "http://localhost/api/workplane/current-working-perspective-route-integration-contracts",
    {
      method: "POST",
      headers: sameOriginHeaders(),
      body: "{",
    },
  ),
);
assert.equal(invalidJsonResponse.status, 400);
const invalidObjectResponse = await route.POST(
  new Request(
    "http://localhost/api/workplane/current-working-perspective-route-integration-contracts",
    {
      method: "POST",
      headers: sameOriginHeaders(),
      body: JSON.stringify([]),
    },
  ),
);
assert.equal(invalidObjectResponse.status, 400);
const invalidActionResponse = await route.POST(
  new Request(
    "http://localhost/api/workplane/current-working-perspective-route-integration-contracts",
    {
      method: "POST",
      headers: sameOriginHeaders(),
      body: JSON.stringify({ action: "apply", db_path: routeDbPath, input: {} }),
    },
  ),
);
assert.equal(invalidActionResponse.status, 400);
const crossSiteResponse = await route.POST(
  new Request(
    "http://localhost/api/workplane/current-working-perspective-route-integration-contracts",
    {
      method: "POST",
      headers: {
        host: "localhost",
        origin: "http://evil.example",
        "sec-fetch-site": "cross-site",
      },
      body: JSON.stringify({
        action: "write",
        db_path: routeDbPath,
        input: buildWriteInput(readyDecision),
      }),
    },
  ),
);
assert.equal(crossSiteResponse.status, 403);
const routeInvalidWriteDbPath =
  ".tmp/current-working-perspective-route-integration-contracts/invalid-route.sqlite";
rmSync(path.join(root, routeInvalidWriteDbPath), { force: true });
const invalidWriteResponse = await route.POST(
  new Request(
    "http://localhost/api/workplane/current-working-perspective-route-integration-contracts",
    {
      method: "POST",
      headers: sameOriginHeaders(),
      body: JSON.stringify({
        action: "write",
        db_path: routeInvalidWriteDbPath,
        input: buildWriteInput(buildDecision(buildPreview({ requested_operator_ref: undefined }))),
      }),
    },
  ),
);
assert.equal(invalidWriteResponse.status, 400);
assert.equal(existsSync(path.join(root, routeInvalidWriteDbPath)), false);
const routeWriteResponse = await route.POST(
  new Request(
    "http://localhost/api/workplane/current-working-perspective-route-integration-contracts",
    {
      method: "POST",
      headers: {
        host: "internal.proxy",
        "x-forwarded-host": "localhost",
        origin: "http://localhost",
        "sec-fetch-site": "same-origin",
      },
      body: JSON.stringify({
        action: "write",
        db_path: routeDbPath,
        input: buildWriteInput(readyDecision),
      }),
    },
  ),
);
assert.equal(routeWriteResponse.status, 201);
const routeBody = await routeWriteResponse.json();
assert.equal(routeBody.current_working_perspective_route_integration_contract_written, true);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(routeBody.no_side_effects[field], false, `route ${field}`);
}
const routeReplayResponse = await route.POST(
  new Request(
    "http://localhost/api/workplane/current-working-perspective-route-integration-contracts",
    {
      method: "POST",
      headers: sameOriginHeaders(),
      body: JSON.stringify({
        action: "write",
        db_path: routeDbPath,
        input: buildWriteInput(readyDecision),
      }),
    },
  ),
);
assert.equal(routeReplayResponse.status, 200);
const routeReplayBody = await routeReplayResponse.json();
assert.equal(routeReplayBody.store_result.status, "idempotent_existing");
assert.equal(
  routeReplayBody.current_working_perspective_route_integration_contract_record_written,
  false,
);
assert.equal(
  routeReplayBody.no_side_effects
    .current_working_perspective_route_integration_contract_persisted,
  false,
);
const routeReadResponse = await route.GET(
  new Request(
    `http://localhost/api/workplane/current-working-perspective-route-integration-contracts?db_path=${encodeURIComponent(
      routeDbPath,
    )}&record_id=${encodeURIComponent(routeBody.record.record_id)}`,
  ),
);
assert.equal(routeReadResponse.status, 200);

const currentRouteText = readFileSync(
  path.join(root, "app/api/perspective/current/route.ts"),
  "utf8",
);
assert(!currentRouteText.includes("export async function POST"));
assert(currentRouteText.includes("buildCurrentWorkingPerspectiveRuntimeReadModel"));

for (const panel of [
  "components/workplane/current-working-perspective-route-integration-contract-preview-panel.tsx",
  "components/workplane/current-working-perspective-route-integration-contract-decision-panel.tsx",
  "components/workplane/current-working-perspective-route-integration-contract-record-review-panel.tsx",
]) {
  const text = readFileSync(path.join(root, panel), "utf8");
  assert(!text.includes("<button"), `${panel} renders button`);
  assert(!/onClick\s*=/.test(text), `${panel} has onClick handler`);
  for (const forbidden of ["import", "apply", "approve", "send", "launch", "run", "execute", "merge", "write"]) {
    assert(!new RegExp(`onClick[^\\n]*(?:${forbidden})`, "i").test(text), `${panel} has ${forbidden} click handler`);
  }
}

const overview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  current_working_perspective_apply_record_review: buildApplyRecordReview(),
  applied_current_working_perspective_read: appliedCwpRead(),
  current_working_perspective_route_integration_contract_preview: readyPreview,
  current_working_perspective_route_integration_contract_decision_preview:
    readyDecision,
  current_working_perspective_route_integration_contract_record_review:
    buildCurrentWorkingPerspectiveRouteIntegrationContractRecordReviewV01({
      store_result: writeResult,
    }),
  scope: "project:augnes",
  as_of: AS_OF,
  source_refs: ["source:overview"],
});
const stepIds = overview.spine_steps.map((step) => step.step_id);
for (const step of [
  "current_working_perspective_route_integration_contract",
  "current_working_perspective_route_integration_contract_decision",
  "current_working_perspective_route_integration_contract_record",
]) {
  assert(stepIds.includes(step), `overview missing ${step}`);
}
const overviewText = JSON.stringify(overview);
for (const action of [
  "review_current_working_perspective_route_integration_contract",
  "approve_current_working_perspective_route_integration_contract_record",
  "write_current_working_perspective_route_integration_contract_record",
  "review_current_working_perspective_route_integration_contract_record",
  "resolve_current_working_perspective_route_integration_blockers",
  "prepare_current_working_perspective_route_integration_slice",
]) {
  assert(repoText.includes(action) || overviewText.includes(action), `missing action ${action}`);
}
for (const forbidden of [
  "api_perspective_current_route_modified",
  "route_response_replaced",
  "upstream_current_working_perspective_source_tables_mutated",
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

rmSync(tempDir, { force: true, recursive: true });
console.log("smoke-current-working-perspective-route-integration-contract-v0-1 passed");

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

function appliedCwpRead(overrides = {}) {
  const latest_applied_snapshot = appliedSnapshot(overrides);
  return {
    read_version: "applied_current_working_perspective_read.v0.1",
    status: "latest_applied_snapshot_available",
    scope: "project:augnes",
    latest_applied_snapshot,
    latest_record: {
      record_id: "current-working-perspective-apply:valid",
      record_version: "current_working_perspective_apply_record.v0.1",
      record_fingerprint: "fingerprint:cwp-apply",
      scope: "project:augnes",
    },
    summary: {
      applied_snapshot_ref: latest_applied_snapshot.applied_snapshot_ref,
      source_contract_record_ref: latest_applied_snapshot.source_contract_record_ref,
      source_current_working_perspective_ref:
        latest_applied_snapshot.source_current_working_perspective_ref,
      as_of: latest_applied_snapshot.as_of,
      current_frame_summary:
        latest_applied_snapshot.applied_current_working_perspective.current_frame.summary,
      current_thesis_summary:
        latest_applied_snapshot.applied_current_working_perspective.current_thesis.summary,
      active_goal_count:
        latest_applied_snapshot.applied_current_working_perspective.active_goals.length,
      open_question_count:
        latest_applied_snapshot.applied_current_working_perspective.open_questions.length,
      active_risk_count:
        latest_applied_snapshot.applied_current_working_perspective.active_risks.length,
      next_candidate_count:
        latest_applied_snapshot.applied_current_working_perspective.next_candidates.length,
      staleness_status:
        latest_applied_snapshot.applied_current_working_perspective.staleness.status,
      applied_patch_count: latest_applied_snapshot.applied_patch_count,
    },
    authority_boundary: {
      read_only: true,
      can_write_db: false,
      can_create_schema: false,
      can_mutate_current_working_perspective: false,
      can_replace_current_working_perspective_route_response: false,
    },
  };
}

function noAppliedSnapshotRead() {
  return {
    ...appliedCwpRead(),
    status: "no_applied_snapshot",
    latest_applied_snapshot: null,
    latest_record: null,
  };
}

function appliedSnapshot(overrides = {}) {
  return {
    snapshot_version: "current_working_perspective_applied_snapshot.v0.1",
    applied_snapshot_ref: "current-working-perspective-applied-snapshot:valid",
    scope: "project:augnes",
    as_of: AS_OF,
    source_contract_record_ref: "cwp-update-contract-record:valid",
    source_current_working_perspective_ref: "current-working-perspective:base",
    applied_current_working_perspective: currentWorkingPerspective({
      as_of: AS_OF,
      next_phase_notes: [
        ...currentWorkingPerspective().next_phase_notes,
        "Local applied snapshot ready for route integration contract review.",
      ],
    }),
    applied_patch_refs: ["patch:cwp-route"],
    applied_patch_count: 1,
    source_refs: sourceRefs,
    evidence_refs: overrides.evidence_refs ?? evidenceRefs,
    authority_boundary: applySnapshotAuthorityBoundary(),
    ...overrides,
  };
}

function buildApplyRecordReview(overrides = {}) {
  return {
    review_version: "current_working_perspective_apply_record_review.v0.1",
    scope: "project:augnes",
    as_of: AS_OF,
    source_refs: sourceRefs,
    review_status: "records_available",
    input_summary: {
      valid_record_count: 1,
      selected_record_id: null,
      selected_record_found: false,
      selected_applied_snapshot_ref: null,
      selected_applied_snapshot_found: false,
    },
    record_summaries: [],
    selected_record_summary: null,
    selected_applied_snapshot_summary: null,
    latest_record_summary: {
      record_id: "current-working-perspective-apply:valid",
      applied_snapshot_ref: "current-working-perspective-applied-snapshot:valid",
    },
    latest_applied_snapshot_summary: {
      applied_snapshot_ref: "current-working-perspective-applied-snapshot:valid",
    },
    records: [
      {
        record_id: "current-working-perspective-apply:valid",
        record_version: "current_working_perspective_apply_record.v0.1",
        scope: "project:augnes",
      },
    ],
    applied_snapshots: [appliedSnapshot()],
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

function buildUpdateContractRecordReview(overrides = {}) {
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
      record_id: "cwp-update-contract-record:valid",
      created_at: AS_OF,
      proposed_patch_entry_count: 1,
    },
    records: [{ record_id: "cwp-update-contract-record:valid" }],
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

function currentWorkingPerspective(overrides = {}) {
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
        source_refs: { delta_ids: [], batch_ids: [], projection_gap_codes: [] },
        source_counts: { deltas: 0, batches: 0, gaps: 0 },
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
    ...overrides,
  };
}

function applySnapshotAuthorityBoundary() {
  return {
    durable_local_current_working_perspective_apply_record: true,
    durable_local_applied_current_working_perspective_snapshot: true,
    source_of_truth: false,
    local_project_current_working_perspective_apply_only: true,
    can_write_db: true,
    can_create_current_working_perspective_apply_record: true,
    can_create_current_working_perspective_apply_receipt: true,
    can_create_applied_current_working_perspective_snapshot: true,
    can_apply_current_working_perspective_update_to_local_snapshot: true,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_mutate_upstream_current_working_perspective_source_tables: false,
    can_replace_current_working_perspective_route_response: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_continuity_relay: false,
    can_update_continuity_relay: false,
    can_apply_live_relay_state: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_update_global_dogfood_metrics: false,
    can_write_dogfood_metrics: false,
    can_write_dogfood_metric_snapshot: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    can_render_workbench_action_button: false,
    notes: ["local applied snapshot only"],
  };
}

function sameOriginHeaders() {
  return {
    host: "localhost",
    origin: "http://localhost",
    "sec-fetch-site": "same-origin",
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
