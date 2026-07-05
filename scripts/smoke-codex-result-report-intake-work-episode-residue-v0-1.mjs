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
import { buildCodexResultReportIntakeOperatorDecisionPreviewV01 } from "../lib/intake/codex-result-report-intake-decision";
import { buildCodexResultReportIntakePreviewV01 } from "../lib/intake/codex-result-report-intake-preview";
import {
  listCodexResultReportIntakeRecordsV01,
  readCodexResultReportIntakeRecordByIdempotencyKeyV01,
  readCodexResultReportIntakeRecordByIdV01,
  validateCodexResultReportIntakeWriteInputV01,
  writeCodexResultReportIntakeRecordV01,
} from "../lib/intake/codex-result-report-intake-write";
import { buildCodexResultReportIntakeRecordReviewV01 } from "../lib/intake/codex-result-report-intake-record-review";
import { readCodexResultReportIntakeRecordReviewForWebV01 } from "../lib/intake/read-codex-result-report-intake-record-review-for-web";
import { buildWorkEpisodeResidueCandidatePreviewV01 } from "../lib/workplane/work-episode-residue-candidate-preview";
import { buildWorkbenchDogfoodLoopSpineOverviewV01 } from "../lib/workplane/workbench-dogfood-loop-spine-overview";
import { GET, POST } from "../app/api/intake/codex-result-report/records/route";

const files = {
  normalizerType: "types/candidate-ingress-normalizer.ts",
  normalizerHelper: "lib/intake/candidate-ingress-normalizer.ts",
  previewType: "types/codex-result-report-intake-preview.ts",
  previewHelper: "lib/intake/codex-result-report-intake-preview.ts",
  previewPanel: "components/intake/codex-result-report-intake-preview-panel.tsx",
  decisionType: "types/codex-result-report-intake-decision.ts",
  decisionHelper: "lib/intake/codex-result-report-intake-decision.ts",
  decisionPanel: "components/intake/codex-result-report-intake-decision-panel.tsx",
  writeType: "types/codex-result-report-intake-write.ts",
  writeHelper: "lib/intake/codex-result-report-intake-write.ts",
  route: "app/api/intake/codex-result-report/records/route.ts",
  reviewType: "types/codex-result-report-intake-record-review.ts",
  reviewHelper: "lib/intake/codex-result-report-intake-record-review.ts",
  reviewForWeb: "lib/intake/read-codex-result-report-intake-record-review-for-web.ts",
  reviewPanel: "components/intake/codex-result-report-intake-record-review-panel.tsx",
  residueType: "types/work-episode-residue-candidate-preview.ts",
  residueHelper: "lib/workplane/work-episode-residue-candidate-preview.ts",
  residuePanel: "components/workplane/work-episode-residue-candidate-preview-panel.tsx",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  overviewType: "types/workbench-dogfood-loop-spine-overview.ts",
  overviewHelper: "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  agentSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  overviewSmoke: "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
  smoke: "scripts/smoke-codex-result-report-intake-work-episode-residue-v0-1.mjs",
  packageJson: "package.json",
};

const allowedChangedFiles = Object.values(files);
const textByFile = loadTextByFile(Object.values(files));
const text = (key) => textByFile.get(files[key]);

assertPackageScript({
  packageJsonText: text("packageJson"),
  scriptName: "smoke:codex-result-report-intake-work-episode-residue-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-codex-result-report-intake-work-episode-residue-v0-1.mjs",
});

assertContainsAll(text("normalizerType"), [
  "candidate_ingress_normalizer.v0.1",
  "project_history_digest",
  "codex_result_report",
  "review_only",
  "candidate_material_only: true",
]);
assertContainsAll(text("previewType"), [
  "codex_result_report_intake_preview.v0.1",
  "result_summary_candidates",
  "ready_for_candidate_ingest_record",
  "can_write_memory: false",
]);
assertContainsAll(text("previewHelper"), [
  "normalizeCodexResultReportV01",
  "buildCodexResultReportIntakePreviewV01",
  "createCodexResultReportIntakeAuthorityBoundaryV01",
]);
assertContainsAll(text("decisionType"), [
  "codex_result_report_intake_operator_decision_preview.v0.1",
  "ready_for_future_candidate_record_write",
  "approve_for_codex_result_report_candidate_ingest",
  "selected_candidate_refs",
]);
assertContainsAll(text("writeType"), [
  "codex_result_report_intake_record.v0.1",
  "codex_result_report_intake_receipt.v0.1",
  "codex_result_report_intake_store.v0.1",
  "memory_mutated: false",
]);
assertContainsAll(text("residueType"), [
  "work_episode_residue_candidate_preview.v0.1",
  "expected_observed_signal_candidates",
  "context_reuse_signal_candidates",
  "can_write_work_episode: false",
  "can_write_expected_observed_delta: false",
]);
assertContainsAll(text("writeHelper"), [
  "codexResultReportIntakeWriteSchemaSqlV01",
  "ensureCodexResultReportIntakeWriteSchemaV01",
  "codexResultReportIntakeWriteSchemaExistsV01",
  "validateCodexResultReportIntakeWriteInputV01",
  "writeCodexResultReportIntakeRecordV01",
  "refuseCodexResultReportIntakeWriteV01",
  "readCodexResultReportIntakeRecordByIdV01",
  "readCodexResultReportIntakeRecordByIdempotencyKeyV01",
  "listCodexResultReportIntakeRecordsV01",
  "createCodexResultReportIntakeWriteAuthorityBoundaryV01",
  "codex_result_report_intake_records",
  "idempotency_key_conflict",
]);
assertContainsAll(text("route"), [
  "codex_result_report_intake_record_route.v0.1",
  "tmp/codex-result-report-intake-records/",
  ".tmp/codex-result-report-intake-records/",
  "fileMustExist: true",
  "requestHasSameOriginBoundary",
  "validateCodexResultReportIntakeWriteInputV01",
  "openWriteCodexResultReportDb",
  "codex_result_report_intake_record_written",
]);
assert(
  text("route").indexOf("validateCodexResultReportIntakeWriteInputV01") <
    text("route").indexOf("openWriteCodexResultReportDb"),
  "Codex result report route should validate before opening write DB",
);
assertContainsAll(text("reviewPanel"), [
  "Codex Result Report Intake Record Review",
  "candidate ingest record",
  "receipt",
  "no side effects",
  "authority boundary",
]);
assertContainsAll(text("agentWorkplane"), [
  "CodexResultReportIntakePreviewPanel",
  "CodexResultReportIntakeDecisionPanel",
  "CodexResultReportIntakeRecordReviewPanel",
  "WorkEpisodeResidueCandidatePreviewPanel",
  "buildCodexResultReportIntakePreviewV01",
  "buildCodexResultReportIntakeOperatorDecisionPreviewV01",
  "readCodexResultReportIntakeRecordReviewForWebV01",
  "buildWorkEpisodeResidueCandidatePreviewV01",
  "codex_result_report_intake_preview: codexResultReportIntakePreview",
  "codex_result_report_intake_decision_preview",
  "codex_result_report_intake_record_review",
  "work_episode_residue_candidate_preview",
]);
assertContainsAll(text("overviewType"), [
  "codex_result_report_intake",
  "codex_result_report_candidate_ingest_record",
  "supply_codex_result_report",
  "write_codex_result_report_candidate_ingest_record",
  "review_codex_result_report_intake_record",
  "work_episode_residue_candidate",
  "review_work_episode_residue_candidates",
]);
assertContainsAll(text("overviewHelper"), [
  "codexResultReportIntakeStep",
  "codexResultReportCandidateIngestRecordStep",
  "workEpisodeResidueCandidateStep",
  "codex_result_report_intake_preview",
  "codex_result_report_intake_decision_preview",
  "codex_result_report_intake_record_review",
  "work_episode_residue_candidate_preview",
]);

assert.equal(isCandidateIngressPublicSafeRefV01("source:codex-result-report-safe"), true);
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

const emptyPreview = buildCodexResultReportIntakePreviewV01();
assert.equal(emptyPreview.intake_preview_status, "no_result_report");
assert.equal(emptyPreview.readiness.ready_for_operator_review, false);

const malformedPreview = buildCodexResultReportIntakePreviewV01({
  result_report: 42,
  source_ref: "source:codex-result-report-malformed",
  operator_ref: "operator:codex-result-report-reviewer",
  project_ref: "project:augnes",
});
assert.doesNotThrow(() => malformedPreview);
assert(
  ["no_result_report", "malformed", "insufficient_data"].includes(
    malformedPreview.intake_preview_status,
  ),
);

const rawPreview = buildCodexResultReportIntakePreviewV01({
  raw_text: [
    "# Codex Result Report",
    "result_status: completed",
    "2026-07-05 PR #123 pull/456",
    "commit abcdef1",
    "changed file: lib/intake/codex-result-report-intake-preview.ts",
    "check: npm run typecheck passed",
    "skipped check: browser validation not run",
    "source:codex-result-report-raw evidence:codex-result-report-proof work:codex-result-report-raw",
    "Follow-up: review candidate material",
    "Risk: missing operator review",
  ].join("\n"),
  source_ref: "source:codex-result-report-raw",
  operator_ref: "operator:codex-result-report-reviewer",
  work_ref: "work:codex-result-report-raw",
  project_ref: "project:augnes",
});
assert(rawPreview.extracted_preview.heading_lines.length > 0);
assert(rawPreview.extracted_preview.pr_like_refs.length > 0);
assert(rawPreview.extracted_preview.commit_like_refs.length > 0);
assert(rawPreview.extracted_preview.result_status_lines.length > 0);
assert(rawPreview.extracted_preview.changed_file_lines.length > 0);
assert(rawPreview.extracted_preview.check_lines.length > 0);
assert(rawPreview.extracted_preview.skipped_check_lines.length > 0);
assert(rawPreview.extracted_preview.not_done_or_followup_lines.length > 0);
assert.equal(rawPreview.readiness.ready_for_operator_review, true);

const unsafePreview = buildCodexResultReportIntakePreviewV01({
  result_report: { summary: "password: hunter2", evidence_refs: ["evidence:safe"] },
  source_ref: "source:codex-result-report-unsafe",
  operator_ref: "operator:codex-result-report-reviewer",
  project_ref: "project:augnes",
});
assert.equal(unsafePreview.readiness.ready_for_operator_review, false);
assert(unsafePreview.blocked_reasons.includes("codex_result_report_summary_unsafe"));
assert(!JSON.stringify(unsafePreview.candidate_material).includes("hunter2"));

const structuredPreview = buildCodexResultReportIntakePreviewV01({
  result_report: {
    work_id: "codex-result-report-ledger",
    summary: "Codex result report candidate ledger work is ready for review.",
    result_status: "completed",
    changed_files: ["lib/intake/codex-result-report-intake-preview.ts"],
    checks: ["npm run typecheck passed"],
    skipped_checks: ["browser validation not required for helper-only path"],
    not_done: ["No Work Episode durable write in this slice"],
    requirement_progress: ["Codex result candidate record path added"],
    expected_vs_observed: ["Expected candidate intake only; observed no promotion authority"],
    context_feedback: ["Return-binding material can become residue candidates later"],
    regressions_or_risks: ["Do not promote Codex result report into memory"],
    followups: ["Review candidate record write receipt"],
    evidence_refs: ["evidence:codex-result-report-proof"],
    source_refs: ["source:codex-result-report-digest"],
    project_ref: "project:augnes",
    work_ref: "work:codex-result-report-ledger",
    result_ref: "result:codex-result-report-ledger",
    pr_ref: "pr:970",
    commit_ref: "commit:108a52e",
    created_at: "2026-07-05T00:00:00.000Z",
  },
  source_ref: "source:codex-result-report-digest",
  operator_ref: "operator:codex-result-report-reviewer",
  work_ref: "work:codex-result-report-ledger",
  result_ref: "result:codex-result-report-ledger",
  pr_ref: "pr:970",
  commit_ref: "commit:108a52e",
});
assert.equal(structuredPreview.readiness.ready_for_candidate_ingest_record, true);
assert(structuredPreview.candidate_material.result_summary_candidates.length > 0);
assert(structuredPreview.candidate_material.check_result_candidates.length > 0);
assert(structuredPreview.candidate_material.requirement_progress_candidates.length > 0);
assert(structuredPreview.candidate_material.changed_file_candidates.length > 0);

const selectableRefs = [
  structuredPreview.candidate_material.result_summary_candidates[0].candidate_id,
  structuredPreview.candidate_material.check_result_candidates[0].candidate_id,
];
const missingDecision = buildCodexResultReportIntakeOperatorDecisionPreviewV01({
  codex_result_report_intake_preview: structuredPreview,
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

const unknownDecision = buildCodexResultReportIntakeOperatorDecisionPreviewV01({
  codex_result_report_intake_preview: structuredPreview,
  selected_candidate_refs: ["candidate:not-from-this-codex-result-report-intake"],
  privacy_review_confirmation_ref: "privacy:codex-result-report-reviewed",
  requested_idempotency_key: "idempotency:codex-result-report-valid",
});
assert.equal(unknownDecision.write_readiness.write_ready, false);
assert(
  unknownDecision.refusal_reasons.includes(
    "selected_candidate_refs_not_in_intake_preview",
  ),
);

const missingPrivacyDecision =
  buildCodexResultReportIntakeOperatorDecisionPreviewV01({
    codex_result_report_intake_preview: structuredPreview,
    selected_candidate_refs: selectableRefs,
    requested_idempotency_key: "idempotency:codex-result-report-valid",
  });
assert(
  missingPrivacyDecision.write_readiness.current_insufficient_data.includes(
    "privacy_review_confirmation_ref_missing",
  ),
);
const missingIdempotencyDecision =
  buildCodexResultReportIntakeOperatorDecisionPreviewV01({
    codex_result_report_intake_preview: structuredPreview,
    selected_candidate_refs: selectableRefs,
    privacy_review_confirmation_ref: "privacy:codex-result-report-reviewed",
  });
assert(
  missingIdempotencyDecision.write_readiness.current_insufficient_data.includes(
    "requested_idempotency_key_missing",
  ),
);
const noEvidencePreview = buildCodexResultReportIntakePreviewV01({
  result_report: {
    summary: "Codex result report without evidence remains incomplete.",
    result_status: "completed",
    changed_files: ["lib/intake/codex-result-report-intake-preview.ts"],
    work_ref: "work:codex-result-report-no-evidence",
  },
  source_ref: "source:codex-result-report-no-evidence",
  operator_ref: "operator:codex-result-report-reviewer",
  work_ref: "work:codex-result-report-no-evidence",
});
const noEvidenceDecision = buildCodexResultReportIntakeOperatorDecisionPreviewV01({
  codex_result_report_intake_preview: noEvidencePreview,
  selected_candidate_refs: [
    noEvidencePreview.candidate_material.result_summary_candidates[0].candidate_id,
  ],
  privacy_review_confirmation_ref: "privacy:codex-result-report-reviewed",
  requested_idempotency_key: "idempotency:codex-result-report-no-evidence",
});
assert(
  noEvidenceDecision.write_readiness.current_insufficient_data.includes(
    "evidence_refs_missing",
  ),
);

const readyDecision = buildCodexResultReportIntakeOperatorDecisionPreviewV01({
  codex_result_report_intake_preview: structuredPreview,
  selected_candidate_refs: selectableRefs,
  privacy_review_confirmation_ref: "privacy:codex-result-report-reviewed",
  requested_idempotency_key: "idempotency:codex-result-report-valid",
});
assert.equal(
  readyDecision.decision_preview_status,
  "ready_for_future_candidate_record_write",
);
assert.equal(readyDecision.write_readiness.write_ready, true);
assert.equal(
  readyDecision.recommended_operator_decision,
  "approve_for_codex_result_report_candidate_ingest",
);
assert.equal(
  JSON.stringify(readyDecision).includes("raw_text"),
  false,
);

const validInput = buildValidWriteInput(readyDecision);
assert.equal(validateCodexResultReportIntakeWriteInputV01(validInput).ok, true);
assert.equal(
  writeCodexResultReportIntakeRecordV01(
    { ...validInput, decision_preview: missingDecision },
    { db: new Database(":memory:") },
  ).status,
  "refused",
);
assert(
  writeCodexResultReportIntakeRecordV01(
    { ...validInput, operator_approval: { ...validInput.operator_approval, checklist_confirmations: [] } },
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.some((reason) =>
    reason.startsWith("checklist_confirmation_missing"),
  ),
);
assert(
  writeCodexResultReportIntakeRecordV01(
    { ...validInput, operator_approval: { ...validInput.operator_approval, operator_ref: "operator:other" } },
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes("operator_ref_mismatch_with_decision_preview"),
);
assert(
  writeCodexResultReportIntakeRecordV01(
    { ...validInput, idempotency_key: "idempotency:other" },
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes("idempotency_key_mismatch_with_decision_preview"),
);
assert(
  writeCodexResultReportIntakeRecordV01(
    { ...validInput, notes: ["request memory write"] },
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes(
    "requested_side_effects_include_forbidden_authority",
  ),
);
assert(
  writeCodexResultReportIntakeRecordV01(
    { ...validInput, requested_side_effects: { can_write_memory: true } },
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.some((reason) =>
    reason.includes("requested_side_effect_forbidden"),
  ),
);
assert(
  writeCodexResultReportIntakeRecordV01(
    {
      ...validInput,
      requested_side_effects: {
        can_write_work_episode: true,
        can_write_expected_observed_delta: true,
        can_write_reuse_outcome_ledger: true,
        can_write_dogfood_metrics: true,
      },
    },
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.some((reason) =>
    reason.includes("requested_side_effect_forbidden"),
  ),
);
assert(
  writeCodexResultReportIntakeRecordV01(
    { ...validInput, notes: ["fixture material should be refused"] },
    { db: new Database(":memory:") },
  ).receipt.refusal_reasons.includes("sample_fixture_default_or_smoke_material_refused"),
);

const unsafeEvidenceDecision = JSON.parse(JSON.stringify(readyDecision));
unsafeEvidenceDecision.would_write_candidate_record_preview.evidence_refs = [
  "evidence:../private",
];
unsafeEvidenceDecision.evidence_summary.evidence_refs = ["evidence:../private"];
const unsafeEvidenceDb = new Database(":memory:");
const unsafeEvidenceResult = writeCodexResultReportIntakeRecordV01(
  buildValidWriteInput(unsafeEvidenceDecision),
  { db: unsafeEvidenceDb },
);
assert.equal(unsafeEvidenceResult.status, "refused");
assert.equal(unsafeEvidenceResult.record, null);
assert.equal(
  unsafeEvidenceResult.receipt.no_side_effects.codex_result_report_intake_record_written,
  false,
);
assert(
  unsafeEvidenceResult.receipt.refusal_reasons.includes("evidence_refs_unsafe") ||
    unsafeEvidenceResult.receipt.refusal_reasons.includes(
      "evidence_refs_missing_after_safety_filter",
    ),
);
assert.equal(
  listCodexResultReportIntakeRecordsV01({ db: unsafeEvidenceDb }).status,
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
const unsafeSelectedResult = writeCodexResultReportIntakeRecordV01(
  buildValidWriteInput(unsafeSelectedDecision),
  { db: unsafeSelectedDb },
);
assert.equal(unsafeSelectedResult.status, "refused");
assert.equal(unsafeSelectedResult.record, null);
assert.equal(
  unsafeSelectedResult.receipt.no_side_effects.codex_result_report_intake_record_written,
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
  listCodexResultReportIntakeRecordsV01({ db: unsafeSelectedDb }).status,
  "schema_missing",
);

const unsafeDecisionSourceRefs = JSON.parse(JSON.stringify(readyDecision));
unsafeDecisionSourceRefs.source_refs = ["source:../private"];
unsafeDecisionSourceRefs.would_write_candidate_record_preview.source_refs = [
  "source:codex-result-report-digest",
];
const unsafeDecisionSourceRefsDb = new Database(":memory:");
const unsafeDecisionSourceRefsResult = writeCodexResultReportIntakeRecordV01(
  buildValidWriteInput(unsafeDecisionSourceRefs),
  { db: unsafeDecisionSourceRefsDb },
);
assert.equal(unsafeDecisionSourceRefsResult.status, "refused");
assert.equal(unsafeDecisionSourceRefsResult.record, null);
assert(
  unsafeDecisionSourceRefsResult.receipt.refusal_reasons.includes(
    "decision_preview_source_refs_unsafe",
  ),
);
assert.equal(
  listCodexResultReportIntakeRecordsV01({ db: unsafeDecisionSourceRefsDb })
    .status,
  "schema_missing",
);

const rawLeakDecision = JSON.parse(JSON.stringify(readyDecision));
rawLeakDecision.would_write_candidate_record_preview.raw_report =
  "raw_report should never enter write material";
const rawLeakResult = writeCodexResultReportIntakeRecordV01(
  buildValidWriteInput(rawLeakDecision),
  { db: new Database(":memory:") },
);
assert.equal(rawLeakResult.status, "refused");
assert(
  rawLeakResult.receipt.refusal_reasons.includes(
    "raw_or_private_marker_material_refused",
  ),
);

const unsafeSourceWorkDecision = JSON.parse(JSON.stringify(readyDecision));
Object.assign(unsafeSourceWorkDecision.would_write_candidate_record_preview, {
  source_ref: "source:sk-private",
  work_ref: "work:../private",
  result_ref: null,
  pr_ref: "pr:../private",
  commit_ref: "commit:sk-private",
});
const unsafeSourceWorkResult = writeCodexResultReportIntakeRecordV01(
  buildValidWriteInput(unsafeSourceWorkDecision),
  { db: new Database(":memory:") },
);
assert.equal(unsafeSourceWorkResult.status, "refused");
assert(
  unsafeSourceWorkResult.receipt.refusal_reasons.includes(
    "source_ref_missing",
  ),
);
assert(
  unsafeSourceWorkResult.receipt.refusal_reasons.includes(
    "work_or_result_ref_missing",
  ),
);
assert(unsafeSourceWorkResult.receipt.refusal_reasons.includes("pr_ref_unsafe"));
assert(
  unsafeSourceWorkResult.receipt.refusal_reasons.includes("commit_ref_unsafe"),
);

const db = new Database(":memory:");
assert.equal(listCodexResultReportIntakeRecordsV01({ db }).status, "schema_missing");
const writeResult = writeCodexResultReportIntakeRecordV01(validInput, { db });
assert.equal(writeResult.status, "written");
assert.equal(writeResult.receipt.no_side_effects.codex_result_report_intake_record_written, true);
assert.equal(writeResult.receipt.no_side_effects.codex_result_report_intake_receipt_written, true);
assert.equal(writeResult.receipt.no_side_effects.codex_result_report_persisted_as_candidate_record, true);
assert.equal(writeResult.receipt.no_side_effects.work_episode_residue_written, false);
assert.equal(writeResult.receipt.no_side_effects.expected_observed_delta_written, false);
assert.equal(writeResult.receipt.no_side_effects.reuse_outcome_ledger_written, false);
assert.equal(writeResult.receipt.no_side_effects.dogfood_metrics_written, false);
assert.equal(writeResult.receipt.no_side_effects.memory_mutated, false);
assert.equal(writeResult.receipt.no_side_effects.current_working_perspective_updated, false);
assert.equal(writeResult.receipt.no_side_effects.perspective_unit_written, false);
assert.equal(writeResult.receipt.no_side_effects.next_work_bias_written, false);
assert.equal(writeResult.receipt.no_side_effects.continuity_relay_written, false);
assert.equal(writeResult.receipt.no_side_effects.handoff_context_mutated, false);
assert.equal(writeResult.receipt.no_side_effects.handoff_sent, false);
assert.equal(writeResult.receipt.no_side_effects.provider_called, false);
assert.equal(writeResult.receipt.no_side_effects.github_called, false);
assert.equal(writeResult.receipt.no_side_effects.codex_executed, false);
assert.equal(writeCodexResultReportIntakeRecordV01(validInput, { db }).status, "idempotent_existing");
const conflictInput = {
  ...validInput,
  operator_approval: {
    ...validInput.operator_approval,
    approval_statement: "Codex result report candidate record approval changed",
  },
};
assert.equal(writeCodexResultReportIntakeRecordV01(conflictInput, { db }).status, "refused");
assert.equal(
  readCodexResultReportIntakeRecordByIdV01(writeResult.record.record_id, { db }).status,
  "read",
);
assert.equal(
  readCodexResultReportIntakeRecordByIdempotencyKeyV01(validInput.idempotency_key, {
    db,
  }).status,
  "read",
);
assert.equal(listCodexResultReportIntakeRecordsV01({ db }).status, "listed");

const noRecordsReview = readCodexResultReportIntakeRecordReviewForWebV01();
assert.equal(noRecordsReview.review_status, "no_records");
const noResiduePreview = buildWorkEpisodeResidueCandidatePreviewV01();
assert.equal(noResiduePreview.residue_preview_status, "no_codex_result_material");
assert.equal(noResiduePreview.authority_boundary.can_write_work_episode, false);
let malformedRecordReview;
assert.doesNotThrow(() => {
  malformedRecordReview = buildCodexResultReportIntakeRecordReviewV01({
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
const recordsReview = buildCodexResultReportIntakeRecordReviewV01({
  records: [writeResult.record],
});
assert.equal(recordsReview.review_status, "records_available");
assert.equal(recordsReview.input_summary.valid_record_count, 1);
const sideEffectStoreResult = JSON.parse(JSON.stringify(writeResult));
sideEffectStoreResult.receipt.no_side_effects.work_episode_residue_written = true;
sideEffectStoreResult.no_side_effects.work_episode_residue_written = true;
const sideEffectReview = buildCodexResultReportIntakeRecordReviewV01({
  store_result: sideEffectStoreResult,
});
assert.equal(sideEffectReview.review_status, "records_invalid");
assert.equal(
  sideEffectReview.evidence_summary.has_receipt_side_effect_problem,
  true,
);
assert(
  sideEffectReview.blocked_reasons.includes(
    "receipt_no_side_effects_claims_forbidden_side_effect",
  ),
);
assert(
  sideEffectReview.record_summaries[0].problem_reasons.includes(
    "receipt_no_side_effects_claims_forbidden_side_effect",
  ),
);
assert(sideEffectReview.input_summary.receipt_side_effect_problem_count > 0);
assert(
  sideEffectReview.receipt_no_side_effects_summary
    .work_episode_residue_written_count > 0,
);
const intakeResiduePreview = buildWorkEpisodeResidueCandidatePreviewV01({
  codex_result_report_intake_preview: structuredPreview,
});
assert.equal(
  intakeResiduePreview.residue_preview_status,
  "ready_for_operator_review",
);
assert(intakeResiduePreview.input_summary.residue_candidate_count > 0);
assert.equal(intakeResiduePreview.authority_boundary.can_write_work_episode, false);
assert.equal(
  intakeResiduePreview.authority_boundary.can_write_expected_observed_delta,
  false,
);
assert.equal(
  intakeResiduePreview.authority_boundary.can_write_reuse_outcome_ledger,
  false,
);
assert.equal(intakeResiduePreview.authority_boundary.can_write_dogfood_metrics, false);
assert.equal(intakeResiduePreview.authority_boundary.can_write_memory, false);
const recordResiduePreview = buildWorkEpisodeResidueCandidatePreviewV01({
  codex_result_report_intake_record_review: recordsReview,
});
assert.equal(
  recordResiduePreview.residue_preview_status,
  "ready_for_operator_review",
);
assert(recordResiduePreview.input_summary.residue_candidate_count > 0);

const tempDir = path.join(process.cwd(), ".tmp/codex-result-report-intake-records");
mkdirSync(tempDir, { recursive: true });
const routeDbPath = ".tmp/codex-result-report-intake-records/route-valid.sqlite";
rmSync(path.join(process.cwd(), routeDbPath), { force: true });
const unsafeGet = await GET(
  new Request("http://localhost/api/intake/codex-result-report/records?db_path=/tmp/nope.sqlite"),
);
assert.equal(unsafeGet.status, 400);
const missingGet = await GET(
  new Request(
    "http://localhost/api/intake/codex-result-report/records?db_path=.tmp/codex-result-report-intake-records/missing.sqlite",
  ),
);
assert.equal(missingGet.status, 404);
const invalidActionPost = await POST(
  new Request("http://localhost/api/intake/codex-result-report/records", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify({ action: "delete", db_path: routeDbPath, input: validInput }),
  }),
);
assert.equal(invalidActionPost.status, 400);
const invalidObjectPost = await POST(
  new Request("http://localhost/api/intake/codex-result-report/records", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify(null),
  }),
);
assert.equal(invalidObjectPost.status, 400);
const invalidJsonPost = await POST(
  new Request("http://localhost/api/intake/codex-result-report/records", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
    },
    body: "{",
  }),
);
assert.equal(invalidJsonPost.status, 400);
const unsafeDbPost = await POST(
  new Request("http://localhost/api/intake/codex-result-report/records", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify({ action: "write", db_path: "/tmp/nope.sqlite", input: validInput }),
  }),
);
assert.equal(unsafeDbPost.status, 400);
const badPost = await POST(
  new Request("http://localhost/api/intake/codex-result-report/records", {
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
  idempotency_key: "idempotency:codex-result-report-route-valid",
  decision_preview: {
    ...readyDecision,
    would_write_candidate_record_preview: {
      ...readyDecision.would_write_candidate_record_preview,
      requested_idempotency_key: "idempotency:codex-result-report-route-valid",
    },
  },
};
const validPost = await POST(
  new Request("http://localhost/api/intake/codex-result-report/records", {
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
assert.equal(validPostJson.codex_result_report_intake_record_written, true);
assert.equal(validPostJson.work_episode_residue_written, false);
assert.equal(validPostJson.expected_observed_delta_written, false);
assert.equal(validPostJson.reuse_outcome_ledger_written, false);
assert.equal(validPostJson.dogfood_metrics_written, false);
assert.equal(validPostJson.memory_mutated, false);
assert.equal(validPostJson.current_working_perspective_updated, false);
assert.equal(validPostJson.perspective_unit_written, false);
assert.equal(validPostJson.next_work_bias_written, false);
assert.equal(validPostJson.continuity_relay_written, false);
assert.equal(validPostJson.handoff_context_mutated, false);
assert.equal(validPostJson.handoff_sent, false);
assert.equal(validPostJson.no_side_effects.provider_called, false);
assert.equal(validPostJson.no_side_effects.github_called, false);
assert.equal(validPostJson.no_side_effects.codex_executed, false);
assert(existsSync(path.join(process.cwd(), routeDbPath)));
rmSync(path.join(process.cwd(), routeDbPath), { force: true });

const defaultOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  codex_result_report_intake_preview: emptyPreview,
  codex_result_report_intake_decision_preview: missingDecision,
  codex_result_report_intake_record_review: noRecordsReview,
  work_episode_residue_candidate_preview: noResiduePreview,
});
assert(defaultOverview.spine_steps.some((step) => step.step_id === "codex_result_report_intake"));
assert(
  defaultOverview.spine_steps.some(
    (step) => step.step_id === "codex_result_report_candidate_ingest_record",
  ),
);
assert(
  defaultOverview.spine_steps.some(
    (step) => step.step_id === "work_episode_residue_candidate",
  ),
);
assert.notEqual(
  defaultOverview.recommended_next_operator_action,
  "write_codex_result_report_candidate_ingest_record",
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
  codex_result_report_intake_preview: structuredPreview,
  codex_result_report_intake_decision_preview: readyDecision,
  codex_result_report_intake_record_review: noRecordsReview,
  work_episode_residue_candidate_preview: intakeResiduePreview,
});
assert.equal(
  readyOverview.recommended_next_operator_action,
  "write_codex_result_report_candidate_ingest_record",
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
  codex_result_report_intake_preview: structuredPreview,
  codex_result_report_intake_decision_preview: readyDecision,
  codex_result_report_intake_record_review: recordsReview,
  work_episode_residue_candidate_preview: recordResiduePreview,
});
assert.equal(
  recordOverview.recommended_next_operator_action,
  "review_codex_result_report_intake_record",
);
assert(
  recordOverview.spine_steps.some(
    (step) =>
      step.step_id === "work_episode_residue_candidate" &&
      step.recommended_next_action === "review_work_episode_residue_candidates",
  ),
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
assert(text("writeHelper").includes("CREATE TABLE IF NOT EXISTS codex_result_report_intake_records"));
assert(text("writeHelper").includes("INSERT INTO codex_result_report_intake_records"));
assert(!text("writeHelper").includes("selected_session_digest_ingest_records"));

const changedFiles = assertChangedFilesWithin({
  allowedChangedFiles,
  label: "codex-result-report-intake-work-episode-residue-v0-1",
});

console.log(
  JSON.stringify(
    {
      smoke: "codex-result-report-intake-work-episode-residue-v0-1",
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
console.log("PASS smoke:codex-result-report-intake-work-episode-residue-v0-1");

function buildValidWriteInput(decisionPreview) {
  return {
    decision_preview: decisionPreview,
    operator_approval: {
      operator_decision: "approve_for_codex_result_report_candidate_ingest",
      approved_by: "operator:codex-result-report-reviewer",
      operator_ref: "operator:codex-result-report-reviewer",
      approved_at: "2026-07-05T00:00:00.000Z",
      approval_statement: "Codex result report candidate ingest record approved for local candidate ledger only.",
      checklist_confirmations: decisionPreview.approval_requirements,
    },
    idempotency_key:
      decisionPreview.would_write_candidate_record_preview.requested_idempotency_key,
    requested_side_effects: {
      can_write_db: true,
      can_create_ingest_record: true,
      can_create_ingest_receipt: true,
      can_write_codex_result_report_candidate_record: true,
    },
    notes: ["codex-result-report-candidate-ledger-valid"],
  };
}
