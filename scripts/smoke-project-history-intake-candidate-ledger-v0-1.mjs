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

import {
  dedupeCandidateIngressPublicSafeRefsV01,
  isCandidateIngressPublicSafeRefV01,
} from "../lib/intake/candidate-ingress-normalizer";
import { buildProjectHistoryIntakeOperatorDecisionPreviewV01 } from "../lib/intake/project-history-intake-decision";
import { buildProjectHistoryIntakePreviewV01 } from "../lib/intake/project-history-intake-preview";
import {
  listProjectHistoryIntakeRecordsV01,
  readProjectHistoryIntakeRecordByIdempotencyKeyV01,
  readProjectHistoryIntakeRecordByIdV01,
  validateProjectHistoryIntakeWriteInputV01,
  writeProjectHistoryIntakeRecordV01,
} from "../lib/intake/project-history-intake-write";
import { buildProjectHistoryIntakeRecordReviewV01 } from "../lib/intake/project-history-intake-record-review";
import { readProjectHistoryIntakeRecordReviewForWebV01 } from "../lib/intake/read-project-history-intake-record-review-for-web";
import { buildWorkbenchDogfoodLoopSpineOverviewV01 } from "../lib/workplane/workbench-dogfood-loop-spine-overview";
import { GET, POST } from "../app/api/intake/project-history/records/route";

const files = {
  normalizerType: "types/candidate-ingress-normalizer.ts",
  normalizerHelper: "lib/intake/candidate-ingress-normalizer.ts",
  previewType: "types/project-history-intake-preview.ts",
  previewHelper: "lib/intake/project-history-intake-preview.ts",
  previewPanel: "components/intake/project-history-intake-preview-panel.tsx",
  decisionType: "types/project-history-intake-decision.ts",
  decisionHelper: "lib/intake/project-history-intake-decision.ts",
  decisionPanel: "components/intake/project-history-intake-decision-panel.tsx",
  writeType: "types/project-history-intake-write.ts",
  writeHelper: "lib/intake/project-history-intake-write.ts",
  route: "app/api/intake/project-history/records/route.ts",
  reviewType: "types/project-history-intake-record-review.ts",
  reviewHelper: "lib/intake/project-history-intake-record-review.ts",
  reviewForWeb: "lib/intake/read-project-history-intake-record-review-for-web.ts",
  reviewPanel: "components/intake/project-history-intake-record-review-panel.tsx",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  overviewType: "types/workbench-dogfood-loop-spine-overview.ts",
  overviewHelper: "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  agentSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  overviewSmoke: "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
  smoke: "scripts/smoke-project-history-intake-candidate-ledger-v0-1.mjs",
  packageJson: "package.json",
};

const allowedChangedFiles = Object.values(files);
const textByFile = loadTextByFile(Object.values(files));
const text = (key) => textByFile.get(files[key]);

assertPackageScript({
  packageJsonText: text("packageJson"),
  scriptName: "smoke:project-history-intake-candidate-ledger-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-project-history-intake-candidate-ledger-v0-1.mjs",
});

assertContainsAll(text("normalizerType"), [
  "candidate_ingress_normalizer.v0.1",
  "project_history_digest",
  "codex_result_report",
  "review_only",
  "candidate_material_only: true",
]);
assertContainsAll(text("previewType"), [
  "project_history_intake_preview.v0.1",
  "timeline_event_candidates",
  "ready_for_candidate_ingest_record",
  "can_write_memory: false",
]);
assertContainsAll(text("decisionType"), [
  "project_history_intake_operator_decision_preview.v0.1",
  "ready_for_future_candidate_record_write",
  "approve_for_project_history_candidate_ingest",
  "selected_candidate_refs",
]);
assertContainsAll(text("writeType"), [
  "project_history_intake_record.v0.1",
  "project_history_intake_receipt.v0.1",
  "project_history_intake_store.v0.1",
  "memory_mutated: false",
]);
assertContainsAll(text("writeHelper"), [
  "projectHistoryIntakeWriteSchemaSqlV01",
  "ensureProjectHistoryIntakeWriteSchemaV01",
  "projectHistoryIntakeWriteSchemaExistsV01",
  "validateProjectHistoryIntakeWriteInputV01",
  "writeProjectHistoryIntakeRecordV01",
  "refuseProjectHistoryIntakeWriteV01",
  "readProjectHistoryIntakeRecordByIdV01",
  "readProjectHistoryIntakeRecordByIdempotencyKeyV01",
  "listProjectHistoryIntakeRecordsV01",
  "createProjectHistoryIntakeWriteAuthorityBoundaryV01",
  "project_history_intake_records",
  "idempotency_key_conflict",
]);
assertContainsAll(text("route"), [
  "project_history_intake_record_route.v0.1",
  "tmp/project-history-intake-records/",
  ".tmp/project-history-intake-records/",
  "fileMustExist: true",
  "requestHasSameOriginBoundary",
  "validateProjectHistoryIntakeWriteInputV01",
  "openWriteProjectHistoryDb",
  "project_history_intake_record_written",
]);
assert(
  text("route").indexOf("validateProjectHistoryIntakeWriteInputV01") <
    text("route").indexOf("openWriteProjectHistoryDb"),
  "project history route should validate before opening write DB",
);
assertContainsAll(text("reviewPanel"), [
  "Project History Intake Record Review",
  "candidate ingest record",
  "receipt",
  "no side effects",
  "authority boundary",
]);
assertContainsAll(text("agentWorkplane"), [
  "ProjectHistoryIntakePreviewPanel",
  "ProjectHistoryIntakeDecisionPanel",
  "ProjectHistoryIntakeRecordReviewPanel",
  "buildProjectHistoryIntakePreviewV01",
  "buildProjectHistoryIntakeOperatorDecisionPreviewV01",
  "readProjectHistoryIntakeRecordReviewForWebV01",
  "project_history_intake_preview: projectHistoryIntakePreview",
  "project_history_intake_operator_decision_preview",
  "project_history_intake_record_review",
]);
assertContainsAll(text("overviewType"), [
  "project_history_intake",
  "project_history_candidate_ingest_record",
  "supply_project_history_digest",
  "write_project_history_candidate_ingest_record",
  "review_project_history_intake_record",
]);
assertContainsAll(text("overviewHelper"), [
  "projectHistoryIntakeStep",
  "projectHistoryCandidateIngestRecordStep",
  "project_history_intake_preview",
  "project_history_intake_operator_decision_preview",
  "project_history_intake_record_review",
]);

assert.equal(isCandidateIngressPublicSafeRefV01("source:project-history-safe"), true);
assert.equal(isCandidateIngressPublicSafeRefV01("source:sk-private"), false);
assert.equal(isCandidateIngressPublicSafeRefV01("/Users/hynk/private"), false);
assert.deepEqual(
  dedupeCandidateIngressPublicSafeRefsV01([
    "source:one",
    "source:one",
    "source:sk-private",
    "evidence:two",
  ]),
  ["evidence:two", "source:one"],
);

const emptyPreview = buildProjectHistoryIntakePreviewV01();
assert.equal(emptyPreview.intake_preview_status, "no_history");
assert.equal(emptyPreview.readiness.ready_for_operator_review, false);

const malformedPreview = buildProjectHistoryIntakePreviewV01({
  digest: 42,
  source_ref: "source:project-history-malformed",
  operator_ref: "operator:project-history-reviewer",
  project_ref: "project:augnes",
});
assert.doesNotThrow(() => malformedPreview);
assert(
  ["no_history", "malformed", "insufficient_data"].includes(
    malformedPreview.intake_preview_status,
  ),
);

const rawPreview = buildProjectHistoryIntakePreviewV01({
  raw_text: [
    "# Project History",
    "2026-07-05 PR #123 pull/456",
    "commit abcdef1",
    "source:project-history-raw evidence:project-history-proof",
    "Next: review candidate material",
    "Risk: missing operator review",
  ].join("\n"),
  source_ref: "source:project-history-raw",
  operator_ref: "operator:project-history-reviewer",
  project_ref: "project:augnes",
});
assert(rawPreview.extracted_preview.heading_lines.length > 0);
assert(rawPreview.extracted_preview.pr_like_refs.length > 0);
assert(rawPreview.extracted_preview.commit_like_refs.length > 0);
assert(rawPreview.extracted_preview.next_action_lines.length > 0);
assert(rawPreview.extracted_preview.risk_or_blocker_lines.length > 0);
assert.equal(rawPreview.readiness.ready_for_operator_review, true);

const unsafePreview = buildProjectHistoryIntakePreviewV01({
  digest: { summary: "password: hunter2", evidence_refs: ["evidence:safe"] },
  source_ref: "source:project-history-unsafe",
  operator_ref: "operator:project-history-reviewer",
  project_ref: "project:augnes",
});
assert.equal(unsafePreview.readiness.ready_for_operator_review, false);
assert(unsafePreview.blocked_reasons.includes("project_history_digest_summary_unsafe"));
assert(!JSON.stringify(unsafePreview.candidate_material).includes("hunter2"));

const structuredPreview = buildProjectHistoryIntakePreviewV01({
  digest: {
    title: "Project history July slice",
    summary: "Project history candidate ledger work is ready for review.",
    timeline_events: ["PR 969 merged selected digest durable ingest"],
    decisions: ["Keep project history candidate ingest separate from memory"],
    requirements: ["Require source and evidence refs"],
    changed_artifacts: ["lib/intake/project-history-intake-preview.ts"],
    prs: ["PR #969"],
    commits: ["108a52e"],
    result_refs: ["result:project-history-signal"],
    open_questions: ["Which source families follow project history"],
    risks: ["Do not promote project history into memory"],
    next_actions: ["Review candidate record write receipt"],
    evidence_refs: ["evidence:project-history-proof"],
    source_refs: ["source:project-history-digest"],
    project_ref: "project:augnes",
    work_ref: "work:project-history-ledger",
    created_at: "2026-07-05T00:00:00.000Z",
  },
  source_ref: "source:project-history-digest",
  operator_ref: "operator:project-history-reviewer",
});
assert.equal(structuredPreview.readiness.ready_for_candidate_ingest_record, true);
assert(structuredPreview.candidate_material.timeline_event_candidates.length > 0);
assert(structuredPreview.candidate_material.decision_candidates.length > 0);
assert(structuredPreview.candidate_material.requirement_candidates.length > 0);
assert(structuredPreview.candidate_material.changed_artifact_candidates.length > 0);

const selectableRefs = [
  structuredPreview.candidate_material.timeline_event_candidates[0].candidate_id,
  structuredPreview.candidate_material.decision_candidates[0].candidate_id,
];
const missingDecision = buildProjectHistoryIntakeOperatorDecisionPreviewV01({
  project_history_intake_preview: structuredPreview,
});
assert.notEqual(
  missingDecision.decision_preview_status,
  "ready_for_future_candidate_record_write",
);
assert(
  missingDecision.write_readiness.current_insufficient_data.includes(
    "selected_candidate_refs_missing",
  ),
);

const unknownDecision = buildProjectHistoryIntakeOperatorDecisionPreviewV01({
  project_history_intake_preview: structuredPreview,
  selected_candidate_refs: ["candidate:not-from-this-project-history-intake"],
  privacy_review_confirmation_ref: "privacy:project-history-reviewed",
  requested_idempotency_key: "idempotency:project-history-valid",
});
assert.equal(unknownDecision.write_readiness.write_ready, false);
assert(
  unknownDecision.refusal_reasons.includes(
    "selected_candidate_refs_not_in_intake_preview",
  ),
);

const readyDecision = buildProjectHistoryIntakeOperatorDecisionPreviewV01({
  project_history_intake_preview: structuredPreview,
  selected_candidate_refs: selectableRefs,
  privacy_review_confirmation_ref: "privacy:project-history-reviewed",
  requested_idempotency_key: "idempotency:project-history-valid",
});
assert.equal(
  readyDecision.decision_preview_status,
  "ready_for_future_candidate_record_write",
);
assert.equal(readyDecision.write_readiness.write_ready, true);
assert.equal(
  readyDecision.recommended_operator_decision,
  "approve_for_project_history_candidate_ingest",
);
assert.equal(
  JSON.stringify(readyDecision).includes("raw_text"),
  false,
);

const validInput = buildValidWriteInput(readyDecision);
assert.equal(validateProjectHistoryIntakeWriteInputV01(validInput).ok, true);
assert.equal(
  writeProjectHistoryIntakeRecordV01(
    { ...validInput, decision_preview: missingDecision },
    { db: new Database(":memory:") },
  ).status,
  "refused",
);
assert(
  writeProjectHistoryIntakeRecordV01(
    { ...validInput, operator_approval: { ...validInput.operator_approval, checklist_confirmations: [] } },
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.some((reason) =>
    reason.startsWith("checklist_confirmation_missing"),
  ),
);
assert(
  writeProjectHistoryIntakeRecordV01(
    { ...validInput, operator_approval: { ...validInput.operator_approval, operator_ref: "operator:other" } },
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes("operator_ref_mismatch_with_decision_preview"),
);
assert(
  writeProjectHistoryIntakeRecordV01(
    { ...validInput, idempotency_key: "idempotency:other" },
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes("idempotency_key_mismatch_with_decision_preview"),
);
assert(
  writeProjectHistoryIntakeRecordV01(
    { ...validInput, notes: ["request memory write"] },
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes(
    "requested_side_effects_include_forbidden_authority",
  ),
);
assert(
  writeProjectHistoryIntakeRecordV01(
    { ...validInput, requested_side_effects: { can_write_memory: true } },
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.some((reason) =>
    reason.includes("requested_side_effect_forbidden"),
  ),
);

const unsafeEvidenceDecision = JSON.parse(JSON.stringify(readyDecision));
unsafeEvidenceDecision.would_write_candidate_record_preview.evidence_refs = [
  "evidence:../private",
];
unsafeEvidenceDecision.evidence_summary.evidence_refs = ["evidence:../private"];
const unsafeEvidenceDb = new Database(":memory:");
const unsafeEvidenceResult = writeProjectHistoryIntakeRecordV01(
  buildValidWriteInput(unsafeEvidenceDecision),
  { db: unsafeEvidenceDb },
);
assert.equal(unsafeEvidenceResult.status, "refused");
assert.equal(unsafeEvidenceResult.record, null);
assert.equal(
  unsafeEvidenceResult.receipt.no_side_effects.project_history_intake_record_written,
  false,
);
assert(
  unsafeEvidenceResult.receipt.refusal_reasons.includes("evidence_refs_unsafe") ||
    unsafeEvidenceResult.receipt.refusal_reasons.includes(
      "evidence_refs_missing_after_safety_filter",
    ),
);
assert.equal(
  listProjectHistoryIntakeRecordsV01({ db: unsafeEvidenceDb }).status,
  "schema_missing",
);

const unsafeSelectedDecision = JSON.parse(JSON.stringify(readyDecision));
unsafeSelectedDecision.would_write_candidate_record_preview.selected_candidate_refs = [
  "candidate:../private",
];
unsafeSelectedDecision.would_write_candidate_record_preview.selectable_candidate_refs = [
  "candidate:../private",
];
const unsafeSelectedDb = new Database(":memory:");
const unsafeSelectedResult = writeProjectHistoryIntakeRecordV01(
  buildValidWriteInput(unsafeSelectedDecision),
  { db: unsafeSelectedDb },
);
assert.equal(unsafeSelectedResult.status, "refused");
assert.equal(unsafeSelectedResult.record, null);
assert.equal(
  unsafeSelectedResult.receipt.no_side_effects.project_history_intake_record_written,
  false,
);
assert(
  unsafeSelectedResult.receipt.refusal_reasons.includes(
    "selected_candidate_refs_unsafe",
  ),
);
assert(
  unsafeSelectedResult.receipt.refusal_reasons.includes(
    "selectable_candidate_refs_unsafe",
  ),
);
assert.equal(
  listProjectHistoryIntakeRecordsV01({ db: unsafeSelectedDb }).status,
  "schema_missing",
);

const db = new Database(":memory:");
assert.equal(listProjectHistoryIntakeRecordsV01({ db }).status, "schema_missing");
const writeResult = writeProjectHistoryIntakeRecordV01(validInput, { db });
assert.equal(writeResult.status, "written");
assert.equal(writeResult.receipt.no_side_effects.project_history_intake_record_written, true);
assert.equal(writeResult.receipt.no_side_effects.project_history_intake_receipt_written, true);
assert.equal(writeResult.receipt.no_side_effects.memory_mutated, false);
assert.equal(writeResult.receipt.no_side_effects.current_working_perspective_updated, false);
assert.equal(writeResult.receipt.no_side_effects.perspective_unit_written, false);
assert.equal(writeResult.receipt.no_side_effects.next_work_bias_written, false);
assert.equal(writeResult.receipt.no_side_effects.continuity_relay_written, false);
assert.equal(writeResult.receipt.no_side_effects.handoff_context_mutated, false);
assert.equal(writeResult.receipt.no_side_effects.provider_called, false);
assert.equal(writeResult.receipt.no_side_effects.github_called, false);
assert.equal(writeResult.receipt.no_side_effects.codex_executed, false);
assert.equal(writeProjectHistoryIntakeRecordV01(validInput, { db }).status, "idempotent_existing");
const conflictInput = {
  ...validInput,
  operator_approval: {
    ...validInput.operator_approval,
    approval_statement: "Project history candidate record approval changed",
  },
};
assert.equal(writeProjectHistoryIntakeRecordV01(conflictInput, { db }).status, "refused");
assert.equal(
  readProjectHistoryIntakeRecordByIdV01(writeResult.record.record_id, { db }).status,
  "read",
);
assert.equal(
  readProjectHistoryIntakeRecordByIdempotencyKeyV01(validInput.idempotency_key, {
    db,
  }).status,
  "read",
);
assert.equal(listProjectHistoryIntakeRecordsV01({ db }).status, "listed");

const noRecordsReview = readProjectHistoryIntakeRecordReviewForWebV01();
assert.equal(noRecordsReview.review_status, "no_records");
let malformedRecordReview;
assert.doesNotThrow(() => {
  malformedRecordReview = buildProjectHistoryIntakeRecordReviewV01({
    records: [{ record_id: "record:bad" }],
  });
});
assert.equal(malformedRecordReview.review_status, "records_invalid");
assert(
  malformedRecordReview.record_summaries[0].problem_reasons.includes(
    "selected_candidate_refs_missing",
  ),
);
assert(
  malformedRecordReview.record_summaries[0].problem_reasons.includes(
    "evidence_refs_missing",
  ),
);
assert(
  malformedRecordReview.record_summaries[0].problem_reasons.includes(
    "source_refs_missing",
  ),
);
const recordsReview = buildProjectHistoryIntakeRecordReviewV01({
  records: [writeResult.record],
});
assert.equal(recordsReview.review_status, "records_available");
assert.equal(recordsReview.input_summary.valid_record_count, 1);

const tempDir = path.join(process.cwd(), ".tmp/project-history-intake-records");
mkdirSync(tempDir, { recursive: true });
const routeDbPath = ".tmp/project-history-intake-records/route-valid.sqlite";
rmSync(path.join(process.cwd(), routeDbPath), { force: true });
const unsafeGet = await GET(
  new Request("http://localhost/api/intake/project-history/records?db_path=/tmp/nope.sqlite"),
);
assert.equal(unsafeGet.status, 400);
const missingGet = await GET(
  new Request(
    "http://localhost/api/intake/project-history/records?db_path=.tmp/project-history-intake-records/missing.sqlite",
  ),
);
assert.equal(missingGet.status, 404);
const badPost = await POST(
  new Request("http://localhost/api/intake/project-history/records", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      origin: "http://evil.example",
      "sec-fetch-site": "cross-site",
    },
    body: JSON.stringify({ action: "write", db_path: routeDbPath, input: validInput }),
  }),
);
assert.equal(badPost.status, 403);
const validRouteInput = {
  ...validInput,
  idempotency_key: "idempotency:project-history-route-valid",
  decision_preview: {
    ...readyDecision,
    would_write_candidate_record_preview: {
      ...readyDecision.would_write_candidate_record_preview,
      requested_idempotency_key: "idempotency:project-history-route-valid",
    },
  },
};
const validPost = await POST(
  new Request("http://localhost/api/intake/project-history/records", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify({ action: "write", db_path: routeDbPath, input: validRouteInput }),
  }),
);
assert.equal(validPost.status, 201);
const validPostJson = await validPost.json();
assert.equal(validPostJson.project_history_intake_record_written, true);
assert.equal(validPostJson.memory_mutated, false);
assert.equal(validPostJson.handoff_sent, false);
assert(existsSync(path.join(process.cwd(), routeDbPath)));
rmSync(path.join(process.cwd(), routeDbPath), { force: true });

const defaultOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  project_history_intake_preview: emptyPreview,
  project_history_intake_operator_decision_preview: missingDecision,
  project_history_intake_record_review: noRecordsReview,
});
assert(defaultOverview.spine_steps.some((step) => step.step_id === "project_history_intake"));
assert(
  defaultOverview.spine_steps.some(
    (step) => step.step_id === "project_history_candidate_ingest_record",
  ),
);
assert.notEqual(
  defaultOverview.recommended_next_operator_action,
  "write_project_history_candidate_ingest_record",
);
const readyOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: {
    intake_preview_status: "ready_for_operator_review",
    input_summary: { candidate_count: 1 },
    blocked_reasons: [],
    unsafe_ref_reasons: [],
    readiness: { current_blockers: [], requires_digest_or_raw_text: false, requires_candidate_material: false, ready_for_operator_review: true },
    insufficient_data_reasons: [],
    evidence_summary: { missing_evidence: [], has_digest_or_raw_text: true },
    preview_version: "selected_session_digest_intake_preview.v0.1",
  },
  project_history_intake_preview: structuredPreview,
  project_history_intake_operator_decision_preview: readyDecision,
  project_history_intake_record_review: noRecordsReview,
});
assert.equal(
  readyOverview.recommended_next_operator_action,
  "write_project_history_candidate_ingest_record",
);
const recordOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  selected_session_digest_intake_preview: {
    intake_preview_status: "ready_for_operator_review",
    input_summary: { candidate_count: 1 },
    blocked_reasons: [],
    unsafe_ref_reasons: [],
    readiness: { current_blockers: [], requires_digest_or_raw_text: false, requires_candidate_material: false, ready_for_operator_review: true },
    insufficient_data_reasons: [],
    evidence_summary: { missing_evidence: [], has_digest_or_raw_text: true },
    preview_version: "selected_session_digest_intake_preview.v0.1",
  },
  project_history_intake_preview: structuredPreview,
  project_history_intake_operator_decision_preview: readyDecision,
  project_history_intake_record_review: recordsReview,
});
assert.equal(
  recordOverview.recommended_next_operator_action,
  "review_project_history_intake_record",
);
assert(!JSON.stringify(recordOverview).match(/memory promotion|Perspective update|CWP mutation|handoff apply/i));

for (const [file, fileText] of textByFile.entries()) {
  if (
    [
      files.writeHelper,
      files.route,
      files.smoke,
      files.agentSmoke,
      files.overviewSmoke,
    ].includes(file)
  ) {
    continue;
  }
  assert(!fileText.includes("<button"), `${file} must not render buttons`);
  assert(!fileText.includes("fetch("), `${file} must not call fetch`);
}
assert(text("writeHelper").includes("CREATE TABLE IF NOT EXISTS project_history_intake_records"));
assert(text("writeHelper").includes("INSERT INTO project_history_intake_records"));
assert(!text("writeHelper").includes("selected_session_digest_ingest_records"));

const changedFiles = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "project-history-intake-candidate-ledger-v0-1",
});

console.log(
  JSON.stringify(
    {
      smoke: "project-history-intake-candidate-ledger-v0-1",
      pass: true,
      package_script_checked: true,
      normalizer_checked: true,
      preview_checked: true,
      decision_checked: true,
      writer_checked: true,
      route_checked: true,
      review_checked: true,
      workbench_checked: true,
      spine_overview_checked: true,
      changed_files_checked: true,
      changed_files_observed: changedFiles,
      memory_mutated: false,
      current_working_perspective_updated: false,
      handoff_sent: false,
      no_workbench_action_button_added: true,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:project-history-intake-candidate-ledger-v0-1");

function buildValidWriteInput(decisionPreview) {
  return {
    decision_preview: decisionPreview,
    operator_approval: {
      operator_decision: "approve_for_project_history_candidate_ingest",
      approved_by: "operator:project-history-reviewer",
      operator_ref: "operator:project-history-reviewer",
      approved_at: "2026-07-05T00:00:00.000Z",
      approval_statement: "Project history candidate ingest record approved for local candidate ledger only.",
      checklist_confirmations: decisionPreview.approval_requirements,
    },
    idempotency_key:
      decisionPreview.would_write_candidate_record_preview.requested_idempotency_key,
    requested_side_effects: {
      can_write_db: true,
      can_create_ingest_record: true,
      can_create_ingest_receipt: true,
      can_write_project_history_candidate_record: true,
    },
    notes: ["project-history-candidate-ledger-valid"],
  };
}
