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

const typeFile = "types/handoff-context-update-write.ts";
const helperFile = "lib/handoff/handoff-context-update-write.ts";
const routeFile = "app/api/handoff/context-updates/route.ts";
const smokeFile = "scripts/smoke-handoff-context-update-write-v0-1.mjs";
const packageJsonFile = "package.json";
const decisionTypeFile =
  "types/handoff-context-update-operator-decision-preview.ts";
const decisionHelperFile =
  "lib/handoff/handoff-context-update-operator-decision-preview.ts";
const decisionPanelFile =
  "components/handoff/handoff-context-update-operator-decision-preview-panel.tsx";
const decisionSmokeFile =
  "scripts/smoke-handoff-context-update-operator-decision-preview-v0-1.mjs";
const updatePreviewSmokeFile =
  "scripts/smoke-handoff-context-update-preview-v0-1.mjs";
const workplaneSmokeFile = "scripts/smoke-agent-workplane-panels-v0-1.mjs";
const agentWorkplaneFile = "components/workplane/agent-workplane.tsx";
const handoffContextUpdateRecordReviewTypeFile =
  "types/handoff-context-update-record-review.ts";
const handoffContextUpdateRecordReviewHelperFile =
  "lib/handoff/handoff-context-update-record-review.ts";
const handoffContextUpdateRecordReviewReadForWebHelperFile =
  "lib/handoff/read-handoff-context-update-record-review-for-web.ts";
const handoffContextUpdateRecordReviewPanelFile =
  "components/handoff/handoff-context-update-record-review-panel.tsx";
const handoffContextUpdateRecordReviewSmokeFile =
  "scripts/smoke-handoff-context-update-record-review-v0-1.mjs";
const handoffContextUpdateRecordReviewDbReadSmokeFile =
  "scripts/smoke-handoff-context-update-record-review-db-read-v0-1.mjs";
const metricInformedContinuityRelayAdjustmentSmokeFile =
  "scripts/smoke-metric-informed-continuity-relay-adjustment-preview-v0-1.mjs";
const handoffContextRelayRationaleSmokeFile =
  "scripts/smoke-handoff-context-relay-rationale-v0-1.mjs";

const allowedChangedFiles = [
  typeFile,
  helperFile,
  routeFile,
  smokeFile,
  packageJsonFile,
  decisionSmokeFile,
  updatePreviewSmokeFile,
  agentWorkplaneFile,
  workplaneSmokeFile,
  handoffContextUpdateRecordReviewTypeFile,
  handoffContextUpdateRecordReviewHelperFile,
  handoffContextUpdateRecordReviewReadForWebHelperFile,
  handoffContextUpdateRecordReviewPanelFile,
  handoffContextUpdateRecordReviewSmokeFile,
  handoffContextUpdateRecordReviewDbReadSmokeFile,
  metricInformedContinuityRelayAdjustmentSmokeFile,
  handoffContextRelayRationaleSmokeFile,
];

const textByFile = loadTextByFile([
  ...allowedChangedFiles,
  decisionTypeFile,
  decisionHelperFile,
  decisionPanelFile,
  agentWorkplaneFile,
  metricInformedContinuityRelayAdjustmentSmokeFile,
  handoffContextRelayRationaleSmokeFile,
]);
const typeText = textByFile.get(typeFile);
const helperText = textByFile.get(helperFile);
const routeText = textByFile.get(routeFile);
const packageJsonText = textByFile.get(packageJsonFile);
const agentWorkplaneText = textByFile.get(agentWorkplaneFile);
const decisionPanelText = textByFile.get(decisionPanelFile);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:handoff-context-update-write-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-handoff-context-update-write-v0-1.mjs",
});

assertContainsAll(
  typeText,
  [
    "operator_approved_handoff_context_update_record.v0.1",
    "operator_approved_handoff_context_update_write_receipt.v0.1",
    "decision_preview",
    "operator_approval",
    "approval_statement",
    "checklist_confirmations",
    "approved_candidate_material",
    "carry_forward_material",
    "record_fingerprint",
    "no_side_effects",
    "can_write_handoff_context_update_record",
    "can_write_operator_approved_handoff_context_update_record",
    "can_mutate_live_handoff_context: false",
    "can_write_selected_refs_to_live_handoff: false",
    "can_send_handoff: false",
    "provider_called: false",
    "github_called: false",
    "codex_executed: false",
    "crawler_or_browser_observer_created: false",
  ],
  { label: typeFile },
);

assertContainsAll(
  helperText,
  [
    "ensureHandoffContextUpdateWriteSchemaV01",
    "writeOperatorApprovedHandoffContextUpdateV01",
    "readHandoffContextUpdateRecordByIdV01",
    "readHandoffContextUpdateRecordByIdempotencyKeyV01",
    "listHandoffContextUpdateRecordsV01",
    "handoff_context_update_records",
    "decision_preview_missing",
    "decision_preview_version_invalid",
    "decision_preview_status_not_ready_for_future_write",
    "write_readiness_not_ready",
    "write_readiness_current_blockers_present",
    "write_readiness_current_missing_evidence_present",
    "selected_ref_candidate_missing_evidence",
    "selected_ref_candidate_unknown_ref",
    "sample_fixture_default_or_smoke_material_refused",
    "idempotency_key_conflict",
    "can_write_handoff_context_update_record: writeNow",
    "can_mutate_live_handoff_context: false",
    "can_write_selected_refs_to_live_handoff: false",
    "can_call_provider_openai: false",
    "can_call_github: false",
    "can_execute_codex: false",
  ],
  { label: helperFile },
);

assertContainsAll(
  routeText,
  [
    "routeVersion =",
    "operator_approved_handoff_context_update_route.v0.1",
    "validateOperatorApprovedHandoffContextUpdateWriteInputV01",
    "writeOperatorApprovedHandoffContextUpdateV01",
    "refuseOperatorApprovedHandoffContextUpdateWriteV01",
    "readHandoffContextUpdateRecordByIdV01",
    "listHandoffContextUpdateRecordsV01",
    ".tmp/handoff-context-updates/",
    "same_origin_required",
    "operator_approved_handoff_context_update_record_written",
    "no_side_effects",
  ],
  { label: routeFile },
);

assert(
  !agentWorkplaneText.includes("writeOperatorApprovedHandoffContextUpdateV01"),
  "Workbench must not import or call the handoff context update write helper",
);
assert(
  !agentWorkplaneText.includes("/api/handoff/context-updates"),
  "Workbench must not call the handoff context update write route",
);
assert(
  !/<button[^>]*>[^<]*(Write|Apply|Approve|Send)/i.test(agentWorkplaneText),
  "Workbench must not render write/apply/approve/send buttons for this slice",
);
assert(!decisionPanelText.includes("<button"), "decision panel remains read-only");

for (const [label, text] of [
  [helperFile, helperText],
  [routeFile, routeText],
  [decisionPanelFile, decisionPanelText],
  [agentWorkplaneFile, agentWorkplaneText],
]) {
  assertNoForbiddenRuntimeCall(label, text);
}

const writer = await import("../lib/handoff/handoff-context-update-write.ts");
const route = await import("../app/api/handoff/context-updates/route.ts");

const readyDecision = readyDecisionPreview();
const dbPath = `.tmp/handoff-context-updates/spec-${process.pid}.sqlite`;
mkdirSync(dirname(dbPath), { recursive: true });
rmSync(dbPath, { force: true });
const db = new Database(dbPath);
try {
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01({}, { db }),
    "decision_preview_missing",
  );
  assert.equal(writer.handoffContextUpdateWriteSchemaExistsV01(db), false);

  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload({
        ...cloneJson(readyDecision),
        preview_version: "handoff_context_update_operator_decision_preview.v9",
      }),
      { db },
    ),
    "decision_preview_version_invalid",
  );
  assert.equal(writer.handoffContextUpdateWriteSchemaExistsV01(db), false);

  assertMalformedPreviewRefused(
    db,
    (preview) => {
      preview.source_status = "not-an-object";
    },
    "decision_preview_source_status_invalid",
  );
  assertMalformedPreviewRefused(
    db,
    (preview) => {
      delete preview.would_write_preview;
    },
    "would_write_preview_missing_or_invalid",
  );
  assert.equal(writer.handoffContextUpdateWriteSchemaExistsV01(db), false);

  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload({
        ...cloneJson(readyDecision),
        decision_preview_status: "ready_for_operator_review",
      }),
      { db },
    ),
    "decision_preview_status_not_ready_for_future_write",
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload({
        ...cloneJson(readyDecision),
        recommended_operator_decision: "review_for_future_write",
      }),
      { db },
    ),
    "recommended_operator_decision_not_approve_for_future_write",
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload({
        ...cloneJson(readyDecision),
        write_readiness: {
          ...readyDecision.write_readiness,
          write_ready: false,
        },
      }),
      { db },
    ),
    "write_readiness_not_ready",
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload({
        ...cloneJson(readyDecision),
        blocking_reasons: [],
        missing_evidence: [],
        write_readiness: {
          ...readyDecision.write_readiness,
          current_blockers: ["blocked-in-readiness"],
        },
      }),
      { db },
    ),
    "write_readiness_current_blockers_present",
  );
  assert.equal(writer.handoffContextUpdateWriteSchemaExistsV01(db), false);
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload({
        ...cloneJson(readyDecision),
        blocking_reasons: [],
        missing_evidence: [],
        write_readiness: {
          ...readyDecision.write_readiness,
          current_missing_evidence: ["missing-in-readiness"],
        },
      }),
      { db },
    ),
    "write_readiness_current_missing_evidence_present",
  );
  assert.equal(writer.handoffContextUpdateWriteSchemaExistsV01(db), false);
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload({
        ...cloneJson(readyDecision),
        blocking_reasons: ["blocked-review-required"],
      }),
      { db },
    ),
    "blocking_reasons_present",
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload({
        ...cloneJson(readyDecision),
        missing_evidence: ["evidence-ref:missing"],
      }),
      { db },
    ),
    "missing_evidence_present",
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload(
        decisionWith({
          source_status: {
            ...readyDecision.source_status,
            authority_boundary: "invalid",
          },
          evidence_summary: {
            ...readyDecision.evidence_summary,
            source_authority_boundary_valid: false,
          },
        }),
      ),
      { db },
    ),
    "source_authority_boundary_invalid",
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload(
        decisionWith({
          source_status: {
            ...readyDecision.source_status,
            source_write_readiness: "unexpected_write_ready",
          },
          evidence_summary: {
            ...readyDecision.evidence_summary,
            source_write_readiness_false: false,
          },
        }),
      ),
      { db },
    ),
    "source_write_readiness_not_all_false",
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload(
        decisionWith({
          would_write_preview: {
            ...readyDecision.would_write_preview,
            proposed_record_kind: "wrong-kind",
          },
        }),
      ),
      { db },
    ),
    "proposed_record_kind_invalid",
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload(
        decisionWith({
          would_write_preview: {
            ...readyDecision.would_write_preview,
            selected_ref_add_candidates: [],
            selected_ref_reinforcement_candidates: [],
            warning_update_candidates: [],
            context_diet_candidates: [],
            expected_return_signal_candidates: [],
          },
        }),
      ),
      { db },
    ),
    "would_write_preview_future_write_material_missing",
  );

  const noEvidenceCandidate = candidate(
    "selected-add:no-evidence",
    "context-ref:no-evidence",
    "selected_ref",
    "helpful",
    { evidenceRefs: [] },
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload(
        decisionWith({
          would_write_preview: {
            ...readyDecision.would_write_preview,
            selected_ref_add_candidates: [noEvidenceCandidate],
          },
        }),
      ),
      { db },
    ),
    "selected_ref_candidate_missing_evidence",
  );

  const unknownCandidate = candidate(
    "selected-add:unknown",
    "context-ref:unknown-candidate",
    "selected_ref",
    "unknown",
    { evidenceRefs: ["evidence-ref:unknown-candidate"] },
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload(
        decisionWith({
          would_write_preview: {
            ...readyDecision.would_write_preview,
            selected_ref_add_candidates: [unknownCandidate],
          },
        }),
      ),
      { db },
    ),
    "selected_ref_candidate_unknown_ref",
  );

  const stopCandidate = candidate(
    "stop:durable-alpha",
    "context-ref:missing-stop-alpha",
    "stop_if_missing",
    "missing",
    { evidenceRefs: ["evidence-ref:missing-stop-alpha"] },
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload(
        decisionWith({
          would_write_preview: {
            ...readyDecision.would_write_preview,
            stop_if_missing_candidates: [stopCandidate],
          },
        }),
      ),
      { db },
    ),
    "stop_if_missing_candidates_present",
  );

  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      omitField(approvalPayload(readyDecision), "operator_approval"),
      { db },
    ),
    "operator_approval_missing",
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      {
        ...approvalPayload(readyDecision),
        operator_approval: {
          ...approvalPayload(readyDecision).operator_approval,
          checklist_confirmations: {},
        },
      },
      { db },
    ),
    `checklist_confirmation_missing:${readyDecision.approval_requirements[0]}`,
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      {
        ...approvalPayload(readyDecision),
        operator_approval: {
          ...approvalPayload(readyDecision).operator_approval,
          approved_by: "operator-ref:/Users/private",
        },
      },
      { db },
    ),
    "approved_by_missing_or_invalid",
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      {
        ...approvalPayload(readyDecision),
        operator_approval: {
          ...approvalPayload(readyDecision).operator_approval,
          operator_ref: "operator-ref:ghp_secret",
        },
      },
      { db },
    ),
    "operator_ref_missing_or_invalid",
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      {
        ...approvalPayload(readyDecision),
        idempotency_key: "handoff-context-update:sk-secret",
      },
      { db },
    ),
    "idempotency_key_missing_or_invalid",
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload({
        ...cloneJson(readyDecision),
        source_refs: ["operator-provided:durable-smoke"],
      }),
      { db },
    ),
    "sample_fixture_default_or_smoke_material_refused",
  );
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload(
        decisionWith({
          source_refs: ["workbench:default_handoff_context_update_preview"],
          evidence_summary: {
            ...readyDecision.evidence_summary,
            has_insufficient_data: true,
          },
        }),
      ),
      { db },
    ),
    "default_workbench_missing_or_insufficient_material_refused",
  );

  for (const key of [
    "can_call_provider_openai",
    "can_call_github",
    "can_execute_codex",
    "can_send_handoff",
    "can_write_memory",
    "can_apply_project_perspective",
    "can_write_dogfood_metrics",
    "can_write_dogfood_ledger",
    "can_write_continuity_relay",
    "can_update_current_working_perspective",
    "can_run_autonomous_action",
    "can_create_graph_or_vector_store",
    "can_create_rag_stack",
    "can_crawl_or_observe_browser",
  ]) {
    assertRefused(
      writer.writeOperatorApprovedHandoffContextUpdateV01(
        {
          ...approvalPayload(readyDecision),
          requested_side_effects: { [key]: true },
        },
        { db },
      ),
      `requested_side_effect_out_of_scope:${key}`,
    );
  }

  assert.equal(writer.handoffContextUpdateWriteSchemaExistsV01(db), false);

  const writeResult = writer.writeOperatorApprovedHandoffContextUpdateV01(
    approvalPayload(readyDecision),
    { db },
  );
  assert.equal(
    writeResult.status,
    "written",
    `positive write refused: ${writeResult.receipt.refusal_reasons.join(", ")}`,
  );
  assert.equal(writeResult.receipt.wrote, true);
  assert.equal(writeResult.receipt.refused, false);
  assert.equal(writeResult.records.length, 1);
  assert.equal(countRecords(writer, db), 1);

  const record = writeResult.record;
  assert(record);
  assert.equal(
    record.record_version,
    "operator_approved_handoff_context_update_record.v0.1",
  );
  assert.equal(record.operator_decision, "approve_for_future_write");
  assert.equal(
    record.operator_approval.approved_by,
    "operator-ref:handoff-context-update-reviewer",
  );
  assert.equal(
    record.approved_candidate_material.selected_ref_add_candidates.length,
    1,
  );
  assert.equal(
    record.approved_candidate_material.selected_ref_reinforcement_candidates
      .length,
    1,
  );
  assert.equal(record.carry_forward_material.unresolved_blockers.length, 0);
  assert.equal(record.carry_forward_material.missing_evidence.length, 0);
  assert(record.write_validation.validation_hash.startsWith("sha256:"));
  assert(record.record_fingerprint.startsWith("sha256:"));
  assert.equal(record.authority_boundary.can_write_db, true);
  assert.equal(
    record.authority_boundary.can_write_handoff_context_update_record,
    true,
  );
  assert.equal(
    record.authority_boundary
      .can_write_operator_approved_handoff_context_update_record,
    true,
  );
  assertAuthorityBoundaryDeniesSideEffects(record.authority_boundary);
  assertReceiptDeniesSideEffects(writeResult.receipt);

  const readById = writer.readHandoffContextUpdateRecordByIdV01(
    record.record_id,
    { db },
  );
  assert.equal(readById.status, "read");
  assert.equal(readById.record?.record_id, record.record_id);

  const readByIdempotency =
    writer.readHandoffContextUpdateRecordByIdempotencyKeyV01(
      record.idempotency_key,
      { db },
    );
  assert.equal(readByIdempotency.status, "read");
  assert.equal(readByIdempotency.record?.record_id, record.record_id);

  const duplicateResult = writer.writeOperatorApprovedHandoffContextUpdateV01(
    approvalPayload(readyDecision),
    { db },
  );
  assert.equal(duplicateResult.status, "idempotent_existing");
  assert.equal(duplicateResult.receipt.wrote, false);
  assert.equal(duplicateResult.receipt.idempotent_replay, true);
  assert.equal(countRecords(writer, db), 1);

  const conflictDecision = cloneJson(readyDecision);
  conflictDecision.would_write_preview.selected_ref_add_candidates[0].summary =
    "changed evidence-backed durable material";
  assertRefused(
    writer.writeOperatorApprovedHandoffContextUpdateV01(
      approvalPayload(conflictDecision),
      { db },
    ),
    "idempotency_key_conflict",
  );
  assert.equal(countRecords(writer, db), 1);

  const laterPayload = approvalPayload(readyDecision);
  laterPayload.idempotency_key =
    "handoff-context-update:operator-approved:2026-07-04-beta";
  laterPayload.operator_approval.approved_at = "2026-07-04T13:05:00.000Z";
  const secondWrite = writer.writeOperatorApprovedHandoffContextUpdateV01(
    laterPayload,
    { db },
  );
  assert.equal(
    secondWrite.status,
    "written",
    `second positive write refused: ${secondWrite.receipt.refusal_reasons.join(
      ", ",
    )}`,
  );
  const listedRecentFirst = writer.listHandoffContextUpdateRecordsV01({ db });
  assert.equal(listedRecentFirst.status, "listed");
  assert.equal(listedRecentFirst.records.length, 2);
  assert.equal(
    listedRecentFirst.records[0].idempotency_key,
    laterPayload.idempotency_key,
    "listHandoffContextUpdateRecordsV01 must return recent records first",
  );
} finally {
  db.close();
  rmSync(dbPath, { force: true });
}

const routeDbPath = `.tmp/handoff-context-updates/route-${process.pid}.sqlite`;
rmSync(routeDbPath, { force: true });
try {
  const refusedRouteResponse = await route.POST(
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

  const malformedRouteResponse = await route.POST(
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
      "would_write_preview_missing_or_invalid",
    ),
  );
  assert.equal(existsSync(routeDbPath), false);

  const writeRouteResponse = await route.POST(
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
  assertReceiptDeniesSideEffects(writeRouteJson.receipt);

  const readRouteResponse = await route.GET(
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

  const listRouteResponse = await route.GET(
    routeRequest(
      "GET",
      null,
      `?db_path=${encodeURIComponent(routeDbPath)}&limit=10`,
    ),
  );
  assert.equal(listRouteResponse.status, 200);
  const listRouteJson = await listRouteResponse.json();
  assert.equal(listRouteJson.store_result.status, "listed");
  assert.equal(listRouteJson.records.length, 1);
} finally {
  rmSync(routeDbPath, { force: true });
}

const changedFilesBoundary = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "handoff-context-update-write-v0-1",
});
const untrackedFiles = collectUntrackedFiles();
const changedAndUntrackedFiles = uniqueSorted([
  ...changedFilesBoundary.files,
  ...untrackedFiles,
]);
for (const file of changedAndUntrackedFiles) {
  assert(
    allowedChangedFiles.includes(file),
    `Unexpected handoff context update write file: ${file}`,
  );
}
const appRouteFiles = changedAndUntrackedFiles.filter((file) =>
  /^app\/api\/.*\/route\.ts$/.test(file),
);
assert(
  appRouteFiles.every((file) => file === routeFile),
  "only the context update route is allowed when a route file is changed",
);

console.log(
  JSON.stringify(
    {
      smoke: "handoff-context-update-write-v0-1",
      pass: true,
      positive_write_record_count: 2,
      read_by_record_id_checked: true,
      read_by_idempotency_key_checked: true,
      duplicate_prevented: true,
      idempotency_conflict_refused: true,
      malformed_preview_refused_without_db: true,
      route_write_read_list_checked: true,
      route_malformed_payload_no_db_file: true,
      workbench_write_ui_absent: true,
      authority_boundary_checked: true,
      changed_files_checked: changedFilesBoundary.checked,
      changed_files_skipped: changedFilesBoundary.skipped,
      changed_files_observed: changedFilesBoundary.files,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:handoff-context-update-write-v0-1");

function readyDecisionPreview() {
  const selectedAdd = candidate(
    "selected-add:durable-alpha",
    "context-ref:durable-alpha",
    "selected_ref",
    "helpful",
    { evidenceRefs: ["evidence-ref:durable-alpha"] },
  );
  const selectedReinforce = candidate(
    "selected-reinforce:durable-beta",
    "context-ref:durable-beta",
    "selected_ref",
    "helpful",
    {
      evidenceRefs: ["evidence-ref:durable-beta"],
      existingHandoffRefIds: ["context-ref:durable-beta"],
    },
  );
  const warning = candidate(
    "warning:durable-gamma",
    "context-ref:durable-gamma",
    "warning",
    "stale",
    { evidenceRefs: ["evidence-ref:durable-gamma"] },
  );
  const diet = candidate(
    "context-diet:durable-delta",
    "context-ref:durable-delta",
    "context_diet",
    "noisy",
    { evidenceRefs: ["evidence-ref:durable-delta"] },
  );
  const expected = candidate(
    "expected-return:durable-epsilon",
    "expected-return-ref:durable-epsilon",
    "expected_return_signal",
    "expected_observed_mismatch",
    { evidenceRefs: ["evidence-ref:durable-epsilon"] },
  );
  const evidenceRefs = [
    ...selectedAdd.evidence_refs,
    ...selectedReinforce.evidence_refs,
    ...warning.evidence_refs,
    ...diet.evidence_refs,
    ...expected.evidence_refs,
  ];
  const sourceRefs = [
    "operator-provided-context-update:durable-alpha",
    "handoff-context-update-preview:durable-alpha",
  ];
  const approvalRequirements = [
    "Handoff Context Update Preview is supplied and version-valid.",
    "Candidate material exists and is evidence-backed where selected refs are proposed.",
    "Unknown refs remain unknown and are not selected into handoff context.",
    "Stop-if-missing and verification-required candidates are resolved before any future write.",
    "Missing evidence and insufficient-data reasons are resolved before any future write.",
    "Source preview remains read-only, candidate-only, and not source of truth.",
    "Source preview write-readiness flags remain false, proving it did not write.",
    "Operator explicitly approves a separately scoped future write path.",
  ];

  return {
    preview_version: "handoff_context_update_operator_decision_preview.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-04T12:30:00.000Z",
    source_refs: sourceRefs,
    decision_preview_status: "ready_for_future_write",
    recommended_operator_decision: "approve_for_future_write",
    available_operator_decisions: [
      "defer_until_evidence_supplied",
      "defer_until_blockers_resolved",
      "review_for_future_write",
      "approve_for_future_write",
      "keep_preview_only",
      "reject_update_candidate",
    ],
    input_summary: {
      update_preview_ref: "handoff_context_update_preview.v0.1",
      update_preview_source_status: "supplied",
      update_preview_candidate_status: "needs_operator_review",
      selected_ref_add_candidate_count: 1,
      selected_ref_reinforcement_candidate_count: 1,
      warning_candidate_count: 1,
      context_diet_candidate_count: 1,
      stop_if_missing_candidate_count: 0,
      verification_required_candidate_count: 0,
      expected_return_signal_candidate_count: 1,
      unknown_candidate_count: 0,
      total_candidate_count: 5,
      candidate_material_present: true,
      blocking_reason_count: 0,
      missing_evidence_count: 0,
      source_preview_write_flags_all_false: true,
    },
    update_preview_refs: {
      update_preview_ref:
        "handoff_context_update_preview:handoff_context_update_preview.v0.1:2026-07-04T12:00:00.000Z",
      update_preview_version: "handoff_context_update_preview.v0.1",
      update_preview_candidate_status: "needs_operator_review",
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
    },
    source_status: {
      handoff_context_update_preview: "supplied",
      candidate_status: "needs_operator_review",
      authority_boundary: "valid_read_only",
      source_write_readiness: "all_false",
    },
    write_readiness: {
      write_ready: true,
      readiness_label:
        "ready for future write preparation; this preview still cannot write",
      requires_valid_update_preview: true,
      requires_candidate_material: true,
      requires_no_blockers: true,
      requires_no_missing_evidence: true,
      requires_no_unresolved_stop_or_verification: true,
      requires_selected_refs_evidence_backed: true,
      requires_selected_refs_not_unknown: true,
      requires_read_only_source_preview: true,
      requires_source_preview_no_write_performed: true,
      requires_operator_confirmation: true,
      current_blockers: [],
      current_missing_evidence: [],
    },
    approval_requirements: approvalRequirements,
    blocking_reasons: [],
    missing_evidence: [],
    evidence_summary: {
      has_update_preview: true,
      update_preview_version_valid: true,
      has_candidate_material: true,
      has_selected_ref_signal: true,
      has_warning_signal: true,
      has_context_diet_signal: true,
      has_stop_if_missing_signal: false,
      has_expected_return_signal: true,
      has_unknown_signal: false,
      has_missing_evidence: false,
      has_insufficient_data: false,
      source_authority_boundary_valid: true,
      source_write_readiness_false: true,
      evidence_refs: evidenceRefs,
      missing_evidence: [],
    },
    would_write_preview: {
      proposed_record_kind: "handoff_context_update_write_candidate.v0.1",
      selected_ref_add_candidates: [selectedAdd],
      selected_ref_reinforcement_candidates: [selectedReinforce],
      warning_update_candidates: [warning],
      context_diet_candidates: [diet],
      keep_unknown_candidates: [],
      stop_if_missing_candidates: [],
      expected_return_signal_candidates: [expected],
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      update_preview_ref:
        "handoff_context_update_preview:handoff_context_update_preview.v0.1:2026-07-04T12:00:00.000Z",
      review_summary: "Operator-provided durable context update material.",
    },
    would_not_write: [
      "mutate live handoff context",
      "send a handoff",
      "call providers",
    ],
    candidate_carry_forward: {
      selected_ref_update_candidates: [selectedAdd, selectedReinforce],
      warning_update_candidates: [warning],
      context_diet_candidates: [diet],
      keep_unknown_candidates: [],
      stop_if_missing_candidates: [],
      expected_return_signal_candidates: [expected],
      unresolved_blockers: [],
      missing_evidence: [],
    },
    review_checklist: ["Confirm approved candidate material is evidence-backed."],
    non_goals: [
      "no_handoff_context_write",
      "no_selected_ref_write",
      "no_provider_github_codex_or_autonomous_action",
    ],
    authority_boundary: decisionAuthorityBoundary(),
  };
}

function decisionAuthorityBoundary() {
  return {
    read_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_persist_decision: false,
    can_write_db: false,
    can_write_handoff_context: false,
    can_write_selected_refs: false,
    can_send_handoff: false,
    can_write_continuity_relay: false,
    can_update_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_apply_project_perspective: false,
    can_create_promotion_decision: false,
    can_create_formation_receipt: false,
    can_write_dogfood_metrics: false,
    can_update_metrics: false,
    can_write_dogfood_ledger: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    notes: ["decision preview remains read-only"],
  };
}

function candidate(candidateId, refId, kind, bucket, options = {}) {
  return {
    candidate_id: candidateId,
    ref_id: refId,
    label: refId,
    summary: `${kind} ${bucket} candidate ${refId}`,
    candidate_kind: kind,
    source_bucket: bucket,
    source_adjustment_kind: options.adjustmentKind ?? "warn_anchor",
    source_candidate_id: options.sourceCandidateId ?? candidateId,
    source_refs: [refId, ...(options.sourceRefs ?? [])],
    evidence_refs: options.evidenceRefs ?? [`evidence-ref:${candidateId}`],
    source_record_refs: options.sourceRecordRefs ?? ["source-record:durable-alpha"],
    existing_handoff_ref_ids: options.existingHandoffRefIds ?? [],
    candidate_only: true,
    review_note: "candidate remains review-only",
  };
}

function approvalPayload(decisionPreview) {
  return {
    decision_preview: decisionPreview,
    operator_approval: {
      operator_decision: "approve_for_future_write",
      approved_by: "operator-ref:handoff-context-update-reviewer",
      operator_ref: "operator-ref:handoff-context-update-reviewer",
      approved_at: "2026-07-04T13:00:00.000Z",
      approval_statement:
        "Operator reviewed the evidence-backed handoff context update material for a future local record write.",
      checklist_confirmations: allChecklistConfirmations(decisionPreview),
    },
    idempotency_key:
      "handoff-context-update:operator-approved:2026-07-04-alpha",
    requested_side_effects: {
      can_write_db: true,
      can_write_handoff_context_update_record: true,
      can_write_operator_approved_handoff_context_update_record: true,
    },
  };
}

function allChecklistConfirmations(decisionPreview) {
  return Object.fromEntries(
    decisionPreview.approval_requirements.map((requirement) => [
      requirement,
      true,
    ]),
  );
}

function decisionWith(patch) {
  return {
    ...cloneJson(readyDecision),
    ...patch,
  };
}

function malformedDecisionPreview(mutator) {
  const preview = cloneJson(readyDecision);
  mutator(preview);
  return preview;
}

function assertMalformedPreviewRefused(db, mutator, expectedReason) {
  const result = writerResultFromMalformed(db, mutator);
  assertRefused(result, expectedReason);
  assert.equal(writer.handoffContextUpdateWriteSchemaExistsV01(db), false);
  return result;
}

function writerResultFromMalformed(db, mutator) {
  return writer.writeOperatorApprovedHandoffContextUpdateV01(
    approvalPayload(malformedDecisionPreview(mutator)),
    { db },
  );
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

function assertReceiptDeniesSideEffects(receipt) {
  for (const [field, value] of Object.entries(receipt.no_side_effects)) {
    assert.equal(value, false, `receipt.no_side_effects.${field}`);
  }
}

function assertAuthorityBoundaryDeniesSideEffects(boundary) {
  assert.equal(boundary.can_persist_general_operator_decision, false);
  assert.equal(boundary.can_mutate_live_handoff_context, false);
  assert.equal(boundary.can_write_selected_refs_to_live_handoff, false);
  assert.equal(boundary.can_send_handoff, false);
  assert.equal(boundary.can_write_continuity_relay, false);
  assert.equal(boundary.can_update_current_working_perspective, false);
  assert.equal(boundary.can_write_perspective_unit, false);
  assert.equal(boundary.can_write_next_work_bias, false);
  assert.equal(boundary.can_write_memory, false);
  assert.equal(boundary.can_mutate_memory, false);
  assert.equal(boundary.can_promote_memory, false);
  assert.equal(boundary.can_apply_project_perspective, false);
  assert.equal(boundary.can_create_promotion_decision, false);
  assert.equal(boundary.can_create_formation_receipt, false);
  assert.equal(boundary.can_write_dogfood_metrics, false);
  assert.equal(boundary.can_update_metrics, false);
  assert.equal(boundary.can_write_dogfood_ledger, false);
  assert.equal(boundary.can_call_provider_openai, false);
  assert.equal(boundary.can_call_github, false);
  assert.equal(boundary.can_execute_codex, false);
  assert.equal(boundary.can_create_pr, false);
  assert.equal(boundary.can_merge_pr, false);
  assert.equal(boundary.can_run_autonomous_action, false);
  assert.equal(boundary.can_create_graph_or_vector_store, false);
  assert.equal(boundary.can_create_rag_stack, false);
  assert.equal(boundary.can_crawl_or_observe_browser, false);
}

function assertNoForbiddenRuntimeCall(label, text) {
  for (const forbidden of [
    "fetch(",
    "openai.chat",
    "new OpenAI",
    "createPullRequest",
    "mergePullRequest",
    "executeCodex",
    "sendHandoff(",
    "writeSelectedRef",
    "applyPerspective(",
    "writeHandoffReuseOutcomeLedgerRecordV01(",
  ]) {
    assert(!text.includes(forbidden), `${label} must not include ${forbidden}`);
  }
}

function countRecords(writerModule, db) {
  if (!writerModule.handoffContextUpdateWriteSchemaExistsV01(db)) return 0;
  return writerModule.listHandoffContextUpdateRecordsV01({ db }).records.length;
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
  return new Request(`http://localhost/api/handoff/context-updates${search}`, {
    method,
    headers: {
      host: "localhost",
      "content-type": "application/json",
    },
    body: body === null ? undefined : JSON.stringify(body),
  });
}
