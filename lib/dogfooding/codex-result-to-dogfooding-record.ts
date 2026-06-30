import { createHash } from "node:crypto";

import {
  type CodexResultReportIngestionRecordV01,
  normalizeCodexResultReportV01,
} from "./codex-result-report-normalizer";
import { createDogfoodingResearchRecordAuthorityBoundaryV01 } from "./dogfooding-record-store";
import {
  DogfoodingResearchRecordInputVersion,
  DogfoodingResearchRecordScope,
  type DogfoodingResearchRecordInput,
} from "../../types/dogfooding-research-record-runtime-contract";

export const CodexResultToDogfoodingRecordBindingVersionV01 =
  "codex_result_report_to_dogfooding_record_binding.v0.1" as const;
export const CodexResultToDogfoodingRecordBindingSliceV01 =
  "codex_result_report_to_dogfooding_record_binding_v0_1" as const;
export const CodexResultToDogfoodingRecordNextSliceV01 =
  "conversation_handoff_packet_builder_v0_2" as const;
export const CodexResultToDogfoodingRecordIngestionRefV01 =
  "codex_result_report_ingestion_v0_1" as const;
export const CodexResultToDogfoodingRecordRuntimeRefV01 =
  "dogfooding_record_runtime_store_route_v0_1" as const;

export const CodexResultToDogfoodingRecordBindingStatusesV01 = [
  "converted",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "rejected",
] as const;
export type CodexResultToDogfoodingRecordBindingStatusV01 =
  (typeof CodexResultToDogfoodingRecordBindingStatusesV01)[number];

export interface CodexResultToDogfoodingRecordBindingResultV01 {
  binding_version: typeof CodexResultToDogfoodingRecordBindingVersionV01;
  selected_slice: typeof CodexResultToDogfoodingRecordBindingSliceV01;
  next_recommended_slice: typeof CodexResultToDogfoodingRecordNextSliceV01;
  ok: boolean;
  status: CodexResultToDogfoodingRecordBindingStatusV01;
  error_code: string | null;
  normalized_codex_report: CodexResultReportIngestionRecordV01;
  dogfooding_record_input: DogfoodingResearchRecordInput | null;
  idempotency_key: string | null;
  reason_codes: string[];
  privacy_report_status: string;
  codex_executed: false;
  review_memory_written: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  promotion_executed: false;
  formation_receipt_written: false;
  durable_state_applied: false;
  product_write_executed: false;
  github_git_actuated: false;
  provider_called: false;
  retrieval_executed: false;
  source_fetched: false;
  release_deploy_publish_executed: false;
}

const bindingBoundaryNotes = [
  "Codex report to dogfooding record is not proof.",
  "Codex report to dogfooding record is not accepted evidence.",
  "Codex report to dogfooding record is not Review Memory write.",
  "Codex report to dogfooding record is not promotion.",
  "Codex report to dogfooding record is not Formation Receipt.",
  "Codex report to dogfooding record is not durable Perspective state.",
  "Codex report to dogfooding record is not product-write.",
  "Codex report is not execution approval.",
  "PR body is not truth.",
  "Changed files are not proof.",
  "Validation pass is not approval.",
  "Validation failure is not automatic rejection.",
  "Smoke pass is not evidence.",
  "Smoke failure is diagnostic, not automatic rejection.",
  "CI pass is not authority.",
  "CI failure is diagnostic, not automatic rejection.",
  "Git refs and GitHub PR refs are references only.",
] as const;

const bindingReasonCodes = [
  "codex_result_report_to_dogfooding_record_binding_present",
  "codex_report_candidate_only",
  "dogfooding_record_input_only",
  "review_memory_not_written",
  "proof_not_created",
  "evidence_not_created",
  "promotion_not_executed",
  "formation_receipt_not_written",
  "durable_state_not_applied",
  "product_write_denied",
  "git_github_not_executed",
  "provider_call_not_executed",
  "retrieval_not_executed",
  "source_fetch_not_executed",
  "release_not_executed",
] as const;

export function buildDogfoodingResearchRecordInputFromCodexResultReportV01(
  report: CodexResultReportIngestionRecordV01,
): DogfoodingResearchRecordInput {
  const idempotencyKey = createCodexResultToDogfoodingRecordIdempotencyKeyV01(report);
  return {
    input_version: DogfoodingResearchRecordInputVersion,
    scope: DogfoodingResearchRecordScope,
    record_id: createCodexResultDogfoodingRecordIdV01(report),
    record_kind: "codex_result_report",
    created_at: report.reported_at,
    updated_at: report.reported_at,
    operator_actor_ref: report.operator_actor_ref,
    source_refs: uniqueSortedStrings([
      CodexResultToDogfoodingRecordBindingSliceV01,
      CodexResultToDogfoodingRecordIngestionRefV01,
      CodexResultToDogfoodingRecordRuntimeRefV01,
      `codex-result-report-id:${report.report_id}`,
      `codex-result-report-fingerprint:${report.report_fingerprint}`,
      `codex-result-to-dogfooding-record-idempotency:${idempotencyKey}`,
      ...report.source_refs,
      ...report.reason_codes.map((reasonCode) => `codex-result-report-reason-code:${reasonCode}`),
    ]),
    pr_refs: uniqueSortedStrings(report.pr_refs),
    branch_refs: uniqueSortedStrings([report.branch_ref]),
    commit_refs: uniqueSortedStrings(report.commit_refs),
    changed_file_refs: uniqueSortedStrings(report.changed_file_refs),
    validation_refs: uniqueSortedStrings(report.observed_check_refs),
    skipped_check_refs: uniqueSortedStrings(report.skipped_check_refs),
    known_warning_refs: uniqueSortedStrings(report.known_warning_refs),
    not_done_refs: uniqueSortedStrings(report.not_done_refs),
    expected_observed_delta_refs: uniqueSortedStrings(report.expected_observed_delta_refs),
    normalized_summary: buildDogfoodingNormalizedSummary(report),
    review_cues: buildDogfoodingReviewCueRefs(report),
    boundary_notes: uniqueSortedStrings([
      ...bindingBoundaryNotes,
      ...report.boundary_notes,
      ...report.privacy_report.boundary_notes,
    ]),
    authority_boundary: {
      ...createDogfoodingResearchRecordAuthorityBoundaryV01(),
    },
  };
}

export function convertNormalizedCodexResultReportToDogfoodingRecordInputV01(
  report: CodexResultReportIngestionRecordV01,
): CodexResultToDogfoodingRecordBindingResultV01 {
  if (report.status === "blocked_private_or_raw_payload") {
    return bindingResult("blocked_private_or_raw_payload", report, null);
  }
  if (report.status === "blocked_forbidden_authority") {
    return bindingResult("blocked_forbidden_authority", report, null);
  }
  if (report.status === "rejected") {
    return bindingResult("rejected", report, null);
  }
  const dogfoodingInput =
    buildDogfoodingResearchRecordInputFromCodexResultReportV01(report);
  return bindingResult("converted", report, dogfoodingInput);
}

export function convertRawCodexResultReportToDogfoodingRecordInputV01(
  input: unknown,
): CodexResultToDogfoodingRecordBindingResultV01 {
  return convertNormalizedCodexResultReportToDogfoodingRecordInputV01(
    normalizeCodexResultReportV01(input),
  );
}

export function createCodexResultDogfoodingRecordIdV01(
  report: Pick<
    CodexResultReportIngestionRecordV01,
    "report_id" | "report_fingerprint"
  >,
): string {
  const fingerprint = fingerprintSuffix(report);
  return `dogfooding-research-record:codex-result-report:${fingerprint}`;
}

export function createCodexResultToDogfoodingRecordIdempotencyKeyV01(
  report: Pick<
    CodexResultReportIngestionRecordV01,
    "report_id" | "report_fingerprint"
  >,
): string {
  return `codex-result-to-dogfooding-record:${report.report_id}:${report.report_fingerprint}`;
}

function bindingResult(
  status: CodexResultToDogfoodingRecordBindingStatusV01,
  normalizedReport: CodexResultReportIngestionRecordV01,
  dogfoodingInput: DogfoodingResearchRecordInput | null,
): CodexResultToDogfoodingRecordBindingResultV01 {
  const idempotencyKey =
    dogfoodingInput === null
      ? null
      : createCodexResultToDogfoodingRecordIdempotencyKeyV01(normalizedReport);
  return {
    binding_version: CodexResultToDogfoodingRecordBindingVersionV01,
    selected_slice: CodexResultToDogfoodingRecordBindingSliceV01,
    next_recommended_slice: CodexResultToDogfoodingRecordNextSliceV01,
    ok: status === "converted",
    status,
    error_code: status === "converted" ? null : status,
    normalized_codex_report: normalizedReport,
    dogfooding_record_input: dogfoodingInput,
    idempotency_key: idempotencyKey,
    reason_codes: uniqueSortedStrings([
      ...bindingReasonCodes,
      ...normalizedReport.reason_codes,
    ]),
    privacy_report_status: normalizedReport.privacy_report.status,
    codex_executed: false,
    review_memory_written: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    formation_receipt_written: false,
    durable_state_applied: false,
    product_write_executed: false,
    github_git_actuated: false,
    provider_called: false,
    retrieval_executed: false,
    source_fetched: false,
    release_deploy_publish_executed: false,
  };
}

function buildDogfoodingNormalizedSummary(
  report: CodexResultReportIngestionRecordV01,
): string {
  return clampPublicSafeText(
    `Codex result report converted to candidate-only dogfooding research record input: ${report.normalized_summary}`,
  );
}

function buildDogfoodingReviewCueRefs(
  report: CodexResultReportIngestionRecordV01,
): string[] {
  return uniqueSortedStrings(
    report.review_cues.map((cue) =>
      clampPublicSafeText(
        `codex-result-review-cue:${cue.cue_kind}:${cue.public_safe_summary}`,
      ),
    ),
  );
}

function fingerprintSuffix(
  report: Pick<
    CodexResultReportIngestionRecordV01,
    "report_id" | "report_fingerprint"
  >,
): string {
  const direct = report.report_fingerprint.replace(/^sha256:/, "").replace(/[^a-f0-9]/gi, "");
  if (direct.length >= 16) return direct.slice(0, 16).toLowerCase();
  return createHash("sha256")
    .update(`${report.report_id}:${report.report_fingerprint}`)
    .digest("hex")
    .slice(0, 16);
}

function uniqueSortedStrings(values: Iterable<unknown>): string[] {
  return Array.from(
    new Set(
      Array.from(values)
        .map((value) => publicSafeString(value))
        .filter((value) => value.length > 0),
    ),
  ).sort();
}

function publicSafeString(value: unknown): string {
  if (typeof value === "string") return clampPublicSafeText(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  return clampPublicSafeText(JSON.stringify(value));
}

function clampPublicSafeText(value: string): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > 320 ? `${collapsed.slice(0, 317)}...` : collapsed;
}
