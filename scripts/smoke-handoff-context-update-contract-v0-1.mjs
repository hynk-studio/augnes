import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import {
  assertChangedFilesWithin,
  assertPackageScript,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const root = process.cwd();
const pkgText = readFileSync(path.join(root, "package.json"), "utf8");

assertPackageScript({
  packageJsonText: pkgText,
  scriptName: "smoke:handoff-context-update-contract-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-handoff-context-update-contract-v0-1.mjs",
});

const expectedFiles = [
  "types/handoff-context-update-contract-preview.ts",
  "lib/workplane/handoff-context-update-contract-preview.ts",
  "components/workplane/handoff-context-update-contract-preview-panel.tsx",
  "types/handoff-context-update-contract-decision.ts",
  "lib/workplane/handoff-context-update-contract-decision.ts",
  "components/workplane/handoff-context-update-contract-decision-panel.tsx",
  "types/handoff-context-update-contract-write.ts",
  "lib/workplane/handoff-context-update-contract-write.ts",
  "app/api/workplane/handoff-context-update-contracts/route.ts",
  "types/handoff-context-update-contract-record-review.ts",
  "lib/workplane/handoff-context-update-contract-record-review.ts",
  "lib/workplane/read-handoff-context-update-contract-record-review-for-web.ts",
  "components/workplane/handoff-context-update-contract-record-review-panel.tsx",
  "components/workplane/agent-workplane.tsx",
  "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  "types/workbench-dogfood-loop-spine-overview.ts",
  "scripts/smoke-handoff-context-update-contract-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-integration-slice-v0-1.mjs",
  "scripts/smoke-current-working-perspective-route-integration-contract-v0-1.mjs",
  "scripts/smoke-current-working-perspective-apply-slice-v0-1.mjs",
  "scripts/smoke-current-working-perspective-update-contract-v0-1.mjs",
  "scripts/smoke-continuity-relay-scoped-write-v0-1.mjs",
  "scripts/smoke-perspective-unit-scoped-write-v0-1.mjs",
  "scripts/smoke-perspective-next-work-bias-scoped-write-v0-1.mjs",
  "scripts/smoke-perspective-relay-update-decision-write-contract-v0-1.mjs",
  "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
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
  "package.json",
];

for (const file of expectedFiles.slice(0, 13)) {
  assert(existsSync(path.join(root, file)), `missing ${file}`);
}

assertChangedFilesWithin({
  allowedChangedFiles: expectedFiles,
  label: "handoff_context_update_contract_v0_1",
});

const textByFile = loadTextByFile(
  expectedFiles.filter((file) => existsSync(path.join(root, file))),
);
const repoText = [...textByFile.values()].join("\n");
for (const expected of [
  "handoff_context_update_contract_preview.v0.1",
  "handoff_context_update_contract_operator_decision_preview.v0.1",
  "handoff_context_update_contract_record.v0.1",
  "handoff_context_update_contract_receipt.v0.1",
  "handoff_context_update_contract_store.v0.1",
  "handoff_context_update_contract_record_review.v0.1",
  "review_handoff_context_update_contract",
  "write_handoff_context_update_contract_record",
  "prepare_handoff_context_apply_slice",
  "prepare_handoff_packet_copy_export_contract",
]) {
  assert(repoText.includes(expected), `missing expected string ${expected}`);
}

const previewLib = await import(
  "../lib/workplane/handoff-context-update-contract-preview.ts"
);
const decisionLib = await import(
  "../lib/workplane/handoff-context-update-contract-decision.ts"
);
const writeLib = await import(
  "../lib/workplane/handoff-context-update-contract-write.ts"
);
const reviewLib = await import(
  "../lib/workplane/handoff-context-update-contract-record-review.ts"
);
const readReviewLib = await import(
  "../lib/workplane/read-handoff-context-update-contract-record-review-for-web.ts"
);
const route = await import(
  "../app/api/workplane/handoff-context-update-contracts/route.ts"
);
const { buildCurrentWorkingPerspectiveRuntimeReadModel } = await import(
  "../lib/perspective/current-working-perspective-source.ts"
);
const { buildCurrentWorkingPerspectiveRouteIntegrationReadReviewV01 } =
  await import(
    "../lib/workplane/current-working-perspective-route-integration-read-review.ts"
  );
const { createCurrentWorkingPerspectiveRouteIntegrationReadAuthorityBoundaryV01 } =
  await import(
    "../lib/perspective/current-working-perspective-route-integration-read.ts"
  );
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);

const {
  buildHandoffContextUpdateContractPreviewV01,
} = previewLib;
const {
  buildHandoffContextUpdateContractOperatorDecisionPreviewV01,
} = decisionLib;
const {
  buildHandoffContextUpdateContractRecordReviewV01,
} = reviewLib;

const AS_OF = "2026-07-06T00:00:00.000Z";
const sourceRefs = ["source:handoff-context-update-contract"];
const evidenceRefs = ["evidence:handoff-context-update-contract"];
const operatorRef = "operator:handoff-context-update-contract";
const idempotencyKey = "idempotency:handoff-context-update-contract";
const reviewRef = "review:handoff-context-update-contract";
const dbPath = ".tmp/handoff-context-update-contracts/smoke.db";
const tempDir = path.join(root, ".tmp/handoff-context-update-contracts");
rmSync(tempDir, { recursive: true, force: true });
mkdirSync(tempDir, { recursive: true });

const forbiddenNoSideEffectFields = [
  "handoff_context_updated",
  "handoff_context_mutated",
  "handoff_context_applied",
  "handoff_sent",
  "selected_refs_written_to_live_handoff",
  "api_perspective_current_route_modified",
  "current_working_perspective_route_response_replaced",
  "upstream_current_working_perspective_source_tables_updated",
  "upstream_current_working_perspective_source_tables_mutated",
  "applied_current_working_perspective_snapshot_written",
  "current_working_perspective_apply_record_written",
  "current_working_perspective_update_contract_record_written",
  "route_integration_contract_record_written",
  "perspective_unit_written",
  "next_work_bias_written",
  "continuity_relay_written",
  "continuity_relay_updated",
  "live_relay_state_applied",
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
  return buildHandoffContextUpdateContractPreviewV01({
    current_working_perspective_route_integration_read: routeRead(),
    current_working_perspective_route_integration_read_review: routeReadReview(),
    current_working_perspective_route_integration_contract_record_review:
      reviewFixture(
        "current_working_perspective_route_integration_contract_record_review.v0.1",
        "current-working-perspective-route-integration-contract:valid",
      ),
    current_working_perspective_apply_record_review: reviewFixture(
      "current_working_perspective_apply_record_review.v0.1",
      "current-working-perspective-apply:valid",
    ),
    continuity_relay_record_review: reviewFixture(
      "continuity_relay_record_review.v0.1",
      "continuity-relay:valid",
    ),
    perspective_unit_record_review: reviewFixture(
      "perspective_unit_record_review.v0.1",
      "perspective-unit:valid",
    ),
    perspective_next_work_bias_record_review: reviewFixture(
      "perspective_next_work_bias_record_review.v0.1",
      "perspective-next-work-bias:valid",
    ),
    requested_handoff_context_mode: "route_integrated_cwp_summary",
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
  return buildHandoffContextUpdateContractOperatorDecisionPreviewV01({
    handoff_context_update_contract_preview: preview,
    requested_operator_ref: operatorRef,
    requested_idempotency_key: idempotencyKey,
    review_confirmation_ref: reviewRef,
    operator_decision_intent:
      "approve_for_handoff_context_update_contract_record",
    scope: "project:augnes",
    as_of: AS_OF,
    sourceRefs,
    ...overrides,
  });
}

function buildWriteInput(decision = buildDecision(), overrides = {}) {
  return {
    operator_decision_preview: decision,
    operator_approval: {
      operator_decision: "approve_for_handoff_context_update_contract_record",
      approved_by: "operator:handoff-context-update-contract-approver",
      operator_ref: operatorRef,
      approved_at: AS_OF,
      approval_statement: "approve:scoped-local-handoff-contract-only",
      checklist_confirmations: [
        "confirm:handoff-context-contract-only",
        "confirm:no-handoff-apply-or-send",
      ],
    },
    idempotency_key: idempotencyKey,
    notes: ["note:scoped-local-handoff-contract"],
    ...overrides,
  };
}

assert.equal(
  buildHandoffContextUpdateContractPreviewV01().contract_preview_status,
  "no_route_integrated_current_working_perspective_material",
);

let preview = buildPreview({
  current_working_perspective_route_integration_read: { read_version: "bad" },
});
assert.notEqual(
  preview.contract_preview_status,
  "ready_for_future_handoff_context_update_contract_record_write",
);
assert(
  preview.blocking_reasons.includes(
    "current_working_perspective_route_integration_read_malformed",
  ),
);

preview = buildPreview({
  current_working_perspective_route_integration_read_review: {
    ...routeReadReview(),
    review_status: "integration_invalid",
  },
});
assert(preview.blocking_reasons.includes(
  "current_working_perspective_route_integration_read_review_invalid",
));

const forgedRead = structuredClone(routeRead());
forgedRead.authority_boundary.can_write_db = true;
preview = buildPreview({
  current_working_perspective_route_integration_read: forgedRead,
});
assert(preview.blocking_reasons.includes(
  "current_working_perspective_route_integration_read_authority_boundary_invalid",
));

const noFallbackRead = structuredClone(routeRead());
noFallbackRead.runtime_current_working_perspective = null;
preview = buildPreview({
  current_working_perspective_route_integration_read: noFallbackRead,
});
assert(preview.blocking_reasons.includes(
  "runtime_fallback_missing_for_applied_snapshot_participation",
));

for (const [field, reason] of [
  ["requested_handoff_context_mode", "requested_handoff_context_mode_missing"],
  ["source_refs", "source_refs_missing"],
  ["requested_operator_ref", "requested_operator_ref_missing"],
  ["requested_idempotency_key", "requested_idempotency_key_missing"],
  ["review_confirmation_ref", "review_confirmation_ref_missing"],
]) {
  const overrides = { [field]: field === "source_refs" ? [] : undefined };
  const result = buildPreview(overrides);
  assert(
    result.contract_readiness.current_insufficient_data.includes(reason) ||
      result.missing_evidence.includes(reason),
    `${field} should produce ${reason}`,
  );
}

preview = buildPreview({ requested_handoff_context_mode: "keep_existing_handoff_context" });
assert.notEqual(
  preview.contract_preview_status,
  "ready_for_future_handoff_context_update_contract_record_write",
);
assert(preview.blocking_reasons.includes(
  "requested_handoff_context_mode_keep_existing_not_writable",
));

preview = buildPreview({ requested_operator_ref: "operator:sk-test" });
assert(preview.refusal_reasons.includes("handoff_context_update_contract_refs_unsafe"));

preview = buildPreview({
  existing_handoff_packet_or_capsule: { raw_text: "do not persist" },
});
assert(preview.refusal_reasons.includes("existing_handoff_material_raw_or_private_refused"));

preview = buildPreview({
  continuity_relay_record_review: undefined,
  perspective_unit_record_review: undefined,
  perspective_next_work_bias_record_review: undefined,
});
assert(preview.proposed_handoff_context_update_contract);
assert(
  preview.proposed_handoff_context_update_contract.proposed_handoff_sections
    .blocked_or_missing_context_section.length >= 3,
);

preview = buildPreview();
assert.equal(
  preview.contract_preview_status,
  "ready_for_future_handoff_context_update_contract_record_write",
);
assert(preview.contract_readiness.write_ready);
assert(preview.proposed_handoff_context_update_contract);
assert(
  preview.proposed_handoff_context_update_contract.proposed_handoff_sections
    .continuity_relay_section.length > 0,
);
assert(
  preview.proposed_handoff_context_update_contract.proposed_handoff_sections
    .perspective_units_section.length > 0,
);
assert(
  preview.proposed_handoff_context_update_contract.proposed_handoff_sections
    .next_work_bias_section.length > 0,
);
assert.equal(preview.authority_boundary.can_apply_handoff_context_update, false);
assert.equal(preview.authority_boundary.can_send_handoff, false);

let decision = buildHandoffContextUpdateContractOperatorDecisionPreviewV01();
assert.notEqual(
  decision.decision_preview_status,
  "ready_for_future_handoff_context_update_contract_record_write",
);
decision = buildDecision(preview, { operator_decision_intent: undefined });
assert(decision.write_readiness.current_insufficient_data.includes(
  "operator_decision_intent_missing",
));
decision = buildDecision(preview);
assert.equal(
  decision.decision_preview_status,
  "ready_for_future_handoff_context_update_contract_record_write",
);
assert(decision.write_readiness.write_ready);

const invalidDecision = buildDecision(
  buildHandoffContextUpdateContractPreviewV01(),
);
let writeInput = buildWriteInput(invalidDecision);
let validation = writeLib.validateHandoffContextUpdateContractWriteInputV01(writeInput);
assert(!validation.ok);

let db = new Database(path.join(root, dbPath));
let refused = writeLib.writeHandoffContextUpdateContractRecordV01(writeInput, { db });
assert.equal(refused.status, "refused");
assert.equal(
  writeLib.handoffContextUpdateContractWriteSchemaExistsV01(db),
  false,
);
db.close();

for (const [mutator, expectedReason] of [
  [
    (input) => {
      input.idempotency_key = "idempotency:other";
    },
    "idempotency_key_mismatch_with_decision_preview",
  ],
  [
    (input) => {
      input.operator_approval.operator_ref = "operator:other";
    },
    "operator_ref_mismatch_with_decision_preview",
  ],
  [
    (input) => {
      input.raw_text = "raw";
    },
    "raw_or_private_marker_material_refused",
  ],
  [
    (input) => {
      input.notes = ["workbench:default"];
    },
    "sample_fixture_default_or_workbench_material_refused",
  ],
  [
    (input) => {
      input.requested_side_effects = { handoff_sent: true };
    },
    "forbidden_requested_side_effect:handoff_sent",
  ],
  [
    (input) => {
      input.operator_decision_preview.would_write_handoff_context_update_contract_decision_preview.contract_preview.would_write_handoff_context_update_contract_record_preview.proposed_handoff_context_update_contract = null;
    },
    "handoff_context_update_contract_material_invalid",
  ],
  [
    (input) => {
      input.operator_decision_preview.authority_boundary.can_send_handoff = true;
    },
    "operator_decision_preview_authority_boundary_invalid",
  ],
]) {
  const input = structuredClone(buildWriteInput(decision));
  mutator(input);
  const result = writeLib.validateHandoffContextUpdateContractWriteInputV01(input);
  assert(
    result.refusal_reasons.includes(expectedReason),
    `${expectedReason} missing from ${result.refusal_reasons.join(",")}`,
  );
}

db = new Database(path.join(root, dbPath));
writeInput = buildWriteInput(decision);
const written = writeLib.writeHandoffContextUpdateContractRecordV01(writeInput, { db });
assert.equal(written.status, "written");
assert(written.record);
assert.equal(written.no_side_effects.handoff_context_update_contract_record_written, true);
assert.equal(written.no_side_effects.handoff_context_update_contract_receipt_written, true);
assert.equal(written.no_side_effects.handoff_context_update_contract_persisted, true);
assert.equal(written.no_side_effects.handoff_context_update_contract_written, true);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(written.no_side_effects[field], false, `${field} should remain false`);
}

const replay = writeLib.writeHandoffContextUpdateContractRecordV01(writeInput, { db });
assert.equal(replay.status, "idempotent_existing");
assert.equal(replay.receipt.wrote, false);
assert.equal(replay.receipt.idempotent_replay, true);
assert.equal(replay.no_side_effects.handoff_context_update_contract_record_written, false);
assert.equal(replay.no_side_effects.handoff_context_update_contract_persisted, false);
for (const field of forbiddenNoSideEffectFields) {
  assert.equal(replay.no_side_effects[field], false, `${field} should remain false on replay`);
}

const conflictInput = structuredClone(writeInput);
conflictInput.notes = ["note:conflict"];
const conflict = writeLib.writeHandoffContextUpdateContractRecordV01(conflictInput, { db });
assert.equal(conflict.status, "refused");
assert(conflict.receipt.refusal_reasons.includes("idempotency_key_conflict"));

assert.equal(
  writeLib.readHandoffContextUpdateContractRecordByIdV01(written.record.record_id, { db }).status,
  "read",
);
assert.equal(
  writeLib.readHandoffContextUpdateContractRecordByIdempotencyKeyV01(idempotencyKey, { db }).status,
  "read",
);

db.prepare(
  `INSERT INTO handoff_context_update_contract_records (
    record_id, idempotency_key, created_at, scope, operator_ref,
    record_fingerprint, record_json, receipt_json
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
).run(
  "handoff-context-update-contract:out-of-scope",
  "idempotency:out-of-scope",
  AS_OF,
  "project:other",
  operatorRef,
  "fingerprint:out-of-scope",
  JSON.stringify({ ...written.record, record_id: "handoff-context-update-contract:out-of-scope", scope: "project:other" }),
  JSON.stringify(written.receipt),
);
const listed = writeLib.listHandoffContextUpdateContractRecordsV01({ db });
assert(!listed.records.some((record) => record.scope !== "project:augnes"));
db.close();

const noSchemaDbPath = path.join(root, ".tmp/handoff-context-update-contracts/no-schema.db");
const noSchemaDb = new Database(noSchemaDbPath);
assert.equal(
  writeLib.listHandoffContextUpdateContractRecordsV01({ db: noSchemaDb }).status,
  "schema_missing",
);
noSchemaDb.close();

let review = buildHandoffContextUpdateContractRecordReviewV01();
assert.equal(review.review_status, "no_records");
review = buildHandoffContextUpdateContractRecordReviewV01({ store_result: written });
assert.equal(review.review_status, "records_available");
assert.equal(review.input_summary.valid_record_count, 1);

review = buildHandoffContextUpdateContractRecordReviewV01({ records: [{ record_version: "bad" }] });
assert.equal(review.review_status, "records_invalid");

const corruptReceipt = structuredClone(written);
corruptReceipt.receipt.no_side_effects.handoff_sent = true;
review = buildHandoffContextUpdateContractRecordReviewV01({ store_result: corruptReceipt });
assert.equal(review.review_status, "records_invalid");

for (const [mutator, reason] of [
  [
    (record) => {
      record.authority_profile.handoff_sent = true;
    },
    "handoff_context_update_contract_record_authority_profile_invalid",
  ],
  [
    (record) => {
      record.no_handoff_apply_performed.handoff_context_applied = true;
    },
    "handoff_context_update_contract_record_no_handoff_apply_invalid",
  ],
  [
    (record) => {
      record.authority_boundary.can_send_handoff = true;
    },
    "handoff_context_update_contract_record_authority_boundary_invalid",
  ],
  [
    (record) => {
      record.raw_excerpt = "raw";
    },
    "raw_material_key_refused",
  ],
]) {
  const record = structuredClone(written.record);
  mutator(record);
  review = buildHandoffContextUpdateContractRecordReviewV01({ records: [record] });
  assert.equal(review.review_status, "records_invalid");
  assert(review.record_summaries[0].problem_reasons.includes(reason));
}

assert.equal(
  readReviewLib.readHandoffContextUpdateContractRecordReviewForWebV01().review_status,
  "no_records",
);
assert.equal(
  readReviewLib.isSafeHandoffContextUpdateContractReviewDbPathV01(dbPath),
  true,
);
assert.equal(
  readReviewLib.isSafeHandoffContextUpdateContractReviewDbPathV01("../bad.db"),
  false,
);

assert.equal(route.isSafeHandoffContextUpdateContractRouteDbPathV01(dbPath), true);
assert.equal(route.isSafeHandoffContextUpdateContractRouteDbPathV01("/tmp/bad.db"), false);

let response = await route.POST(
  new Request("http://localhost/api/workplane/handoff-context-update-contracts", {
    method: "POST",
    headers: { host: "localhost", origin: "http://localhost" },
    body: "{",
  }),
);
assert.equal(response.status, 400);

response = await route.POST(
  new Request("http://localhost/api/workplane/handoff-context-update-contracts", {
    method: "POST",
    headers: { host: "localhost", origin: "http://localhost" },
    body: JSON.stringify([]),
  }),
);
assert.equal(response.status, 400);

response = await route.POST(
  new Request("http://localhost/api/workplane/handoff-context-update-contracts", {
    method: "POST",
    headers: { host: "localhost", origin: "http://localhost" },
    body: JSON.stringify({ action: "send", db_path: dbPath, input: writeInput }),
  }),
);
assert.equal(response.status, 400);

response = await route.POST(
  new Request("http://localhost/api/workplane/handoff-context-update-contracts", {
    method: "POST",
    headers: { host: "localhost", origin: "http://evil.test" },
    body: JSON.stringify({ action: "write", db_path: dbPath, input: writeInput }),
  }),
);
assert.equal(response.status, 403);

const routeDbPath = ".tmp/handoff-context-update-contracts/route-smoke.db";
rmSync(path.join(root, routeDbPath), { force: true });
response = await route.POST(
  new Request("http://internal/api/workplane/handoff-context-update-contracts", {
    method: "POST",
    headers: {
      host: "internal",
      "x-forwarded-host": "augnes.local",
      origin: "http://augnes.local",
    },
    body: JSON.stringify({ action: "write", db_path: routeDbPath, input: writeInput }),
  }),
);
assert.equal(response.status, 201);
let body = await response.json();
assert.equal(body.handoff_context_update_contract_record_written, true);
assert.equal(body.handoff_context_applied, false);
assert.equal(body.handoff_sent, false);

response = await route.POST(
  new Request("http://internal/api/workplane/handoff-context-update-contracts", {
    method: "POST",
    headers: {
      host: "internal",
      "x-forwarded-host": "augnes.local",
      origin: "http://augnes.local",
    },
    body: JSON.stringify({ action: "write", db_path: routeDbPath, input: writeInput }),
  }),
);
assert.equal(response.status, 200);
body = await response.json();
assert.equal(body.store_result.status, "idempotent_existing");
assert.equal(body.handoff_context_update_contract_record_written, false);
assert.equal(body.no_side_effects.handoff_context_update_contract_record_written, false);
assert.equal(body.no_side_effects.handoff_context_update_contract_persisted, false);

for (const file of [
  "components/workplane/handoff-context-update-contract-preview-panel.tsx",
  "components/workplane/handoff-context-update-contract-decision-panel.tsx",
  "components/workplane/handoff-context-update-contract-record-review-panel.tsx",
]) {
  const text = readFileSync(path.join(root, file), "utf8");
  assert(!text.includes("<button"), `${file} must not render button`);
  assert(!/onClick\s*=/.test(text), `${file} must not have onClick`);
  assert(!/(import|apply|approve|send|launch|run|execute|merge|write)\s*=>/.test(text));
}

const overview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  current_working_perspective_route_integration_read: routeRead(),
  current_working_perspective_route_integration_read_review: routeReadReview(),
  handoff_context_update_contract_preview: preview,
  handoff_context_update_contract_decision_preview: decision,
  handoff_context_update_contract_record_review: buildHandoffContextUpdateContractRecordReviewV01({ store_result: written }),
  scope: "project:augnes",
  as_of: AS_OF,
  sourceRefs,
});
const stepIds = overview.spine_steps.map((step) => step.step_id);
assert(stepIds.includes("handoff_context_update_contract"));
assert(stepIds.includes("handoff_context_update_contract_decision"));
assert(stepIds.includes("handoff_context_update_contract_record"));
const actions = [
  overview.recommended_next_operator_action,
  ...overview.spine_steps.map((step) => step.recommended_next_action),
];
for (const forbidden of [
  "handoff_sent",
  "handoff_context_applied",
  "api_perspective_current_route_modified",
  "memory_written",
  "provider_called",
  "github_called",
  "codex_executed",
]) {
  assert(!actions.some((action) => String(action).includes(forbidden)), forbidden);
}

rmSync(tempDir, { recursive: true, force: true });
console.log("smoke-handoff-context-update-contract-v0-1 passed");

function routeRead() {
  const runtimeCwp = buildCurrentWorkingPerspectiveRuntimeReadModel({
    scope: "project:augnes",
  });
  const appliedCwp = structuredClone(runtimeCwp);
  appliedCwp.as_of = AS_OF;
  return {
    read_version: "current_working_perspective_route_integration_read.v0.1",
    scope: "project:augnes",
    as_of: AS_OF,
    status: "runtime_with_applied_snapshot_overlay_candidate",
    route_path: "/api/perspective/current",
    route_family: "current_working_perspective",
    response_mode: "runtime_primary_with_applied_overlay_candidate",
    primary_current_working_perspective: runtimeCwp,
    runtime_current_working_perspective: runtimeCwp,
    applied_current_working_perspective: appliedCwp,
    runtime_current_working_perspective_summary: {
      cwp_ref: "current-working-perspective:runtime",
      perspective_version: "current_working_perspective.v0.1",
      scope: "project:augnes",
      as_of: AS_OF,
      current_frame_summary: runtimeCwp.current_frame.summary,
      current_thesis_summary: runtimeCwp.current_thesis.summary,
      active_goal_count: runtimeCwp.active_goals.length,
      open_question_count: runtimeCwp.open_questions.length,
      active_risk_count: runtimeCwp.active_risks.length,
      next_candidate_count: runtimeCwp.next_candidates.length,
      staleness_status: runtimeCwp.staleness.status,
    },
    applied_current_working_perspective_summary: {
      cwp_ref: "current-working-perspective:applied",
      perspective_version: "current_working_perspective.v0.1",
      scope: "project:augnes",
      as_of: AS_OF,
      current_frame_summary: appliedCwp.current_frame.summary,
      current_thesis_summary: appliedCwp.current_thesis.summary,
      active_goal_count: appliedCwp.active_goals.length,
      open_question_count: appliedCwp.open_questions.length,
      active_risk_count: appliedCwp.active_risks.length,
      next_candidate_count: appliedCwp.next_candidates.length,
      staleness_status: appliedCwp.staleness.status,
    },
    contract_summary: {
      record_id: "current-working-perspective-route-integration-contract:valid",
      route_path: "/api/perspective/current",
      route_family: "current_working_perspective",
      route_integration_mode: "applied_snapshot_overlay_candidate",
      source_applied_snapshot_ref: "current-working-perspective-applied-snapshot:valid",
      source_cwp_apply_record_refs: ["current-working-perspective-apply:valid"],
      source_cwp_update_contract_record_refs: [
        "current-working-perspective-update-contract:valid",
      ],
      guard_count: 8,
    },
    applied_snapshot_metadata: {
      applied_snapshot_ref: "current-working-perspective-applied-snapshot:valid",
      source_contract_record_ref: "current-working-perspective-update-contract:valid",
      source_apply_record_ref: "current-working-perspective-apply:valid",
      source_current_working_perspective_ref: "current-working-perspective:runtime",
      as_of: AS_OF,
      applied_patch_count: 3,
      overlay_candidate: true,
      preferred_primary: false,
    },
    route_integration_metadata: {
      read_version: "current_working_perspective_route_integration_read.v0.1",
      route_path: "/api/perspective/current",
      route_family: "current_working_perspective",
      approved_contract_required: true,
      explicit_safe_paths_required: true,
      never_write_on_get: true,
      runtime_fallback_preserved: true,
      contract_record_id: "current-working-perspective-route-integration-contract:valid",
      applied_snapshot_ref: "current-working-perspective-applied-snapshot:valid",
      requested_route_integration_mode: "applied_snapshot_overlay_candidate",
      effective_response_mode: "runtime_primary_with_applied_overlay_candidate",
    },
    fallback_metadata: {
      used_runtime_fallback: false,
      fallback_reason: null,
      runtime_cwp_available: true,
      applied_snapshot_available: true,
    },
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    refusal_reasons: [],
    blocked_reasons: [],
    warnings: [],
    authority_boundary:
      createCurrentWorkingPerspectiveRouteIntegrationReadAuthorityBoundaryV01(),
  };
}

function routeReadReview() {
  return buildCurrentWorkingPerspectiveRouteIntegrationReadReviewV01({
    route_integration_read: routeRead(),
    scope: "project:augnes",
    as_of: AS_OF,
    sourceRefs,
  });
}

function reviewFixture(version, recordId) {
  return {
    review_version: version,
    scope: "project:augnes",
    as_of: AS_OF,
    sourceRefs,
    review_status: "records_available",
    input_summary: {
      supplied_record_count: 1,
      valid_record_count: 1,
      invalid_record_count: 0,
      selected_record_id: null,
      selected_record_found: false,
      latest_record_id: recordId,
      latest_record_created_at: AS_OF,
      receipt_side_effect_problem_count: 0,
    },
    latest_record_summary: {
      record_id: recordId,
      created_at: AS_OF,
    },
    records: [{ record_id: recordId }],
    evidence_summary: {
      supplied_record_count: 1,
      valid_record_count: 1,
      has_records: true,
      has_source_refs: true,
      has_evidence_refs: true,
      has_missing_evidence: false,
      has_receipt_side_effect_problem: false,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: [],
      problem_record_ids: [],
    },
  };
}
