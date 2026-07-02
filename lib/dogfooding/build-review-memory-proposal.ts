import { createHash } from "node:crypto";

import {
  PRIVACY_REDACTION_RUNTIME_GUARD_VERSION,
  buildPrivacyRedactionRuntimeGuardReportV01,
  createPrivacyRedactionRuntimeGuardAuthorityBoundaryV01,
  createPrivacyRedactionRuntimeGuardFingerprintV01,
  type PrivacyRedactionRuntimeGuardFinding,
  type PrivacyRedactionRuntimeGuardReport,
} from "../privacy/redaction-guard";
import {
  DogfoodingToReviewMemoryProposalActionCandidatesV01,
  DogfoodingToReviewMemoryProposalBuilderVersionV01,
  DogfoodingToReviewMemoryProposalNextSliceV01,
  DogfoodingToReviewMemoryProposalScopeV01,
  DogfoodingToReviewMemoryProposalSliceV01,
  DogfoodingToReviewMemoryProposalVersionV01,
  type DogfoodingToReviewMemoryProposalActionCandidateV01,
  type DogfoodingToReviewMemoryProposalActionV01,
  type DogfoodingToReviewMemoryProposalAuthorityBoundaryV01,
  type DogfoodingToReviewMemoryProposalPrivacyReportV01,
  type DogfoodingToReviewMemoryProposalResultV01,
  type DogfoodingToReviewMemoryProposalStatusV01,
  type DogfoodingToReviewMemoryProposalV01,
} from "../../types/dogfooding-to-review-memory-proposal";
import type {
  DogfoodingResearchRecord,
  DogfoodingResearchRecordInput,
} from "../../types/dogfooding-research-record-runtime-contract";

type JsonRecord = Record<string, unknown>;
type PublicSafeDogfoodingRecordLike =
  | Partial<DogfoodingResearchRecord>
  | Partial<DogfoodingResearchRecordInput>
  | JsonRecord;

type NormalizedDogfoodingRecord = {
  record_ref: string;
  record_kind: string | null;
  created_at: string | null;
  normalized_summary: string | null;
  source_refs: string[];
  pr_refs: string[];
  branch_refs: string[];
  commit_refs: string[];
  changed_file_refs: string[];
  validation_refs: string[];
  skipped_check_refs: string[];
  known_warning_refs: string[];
  not_done_refs: string[];
  expected_observed_delta_refs: string[];
  review_cues: string[];
  boundary_notes: string[];
  reason_codes: string[];
};

type NormalizedDogfoodingMaterial = {
  proposal_id: string | null;
  created_at: string | null;
  records: NormalizedDogfoodingRecord[];
  summary_fields: {
    source_dogfooding_record_refs: string[];
    source_refs: string[];
    pr_refs: string[];
    branch_refs: string[];
    commit_refs: string[];
    changed_file_refs: string[];
    validation_refs: string[];
    skipped_check_refs: string[];
    known_warning_refs: string[];
    not_done_refs: string[];
    expected_observed_delta_refs: string[];
    candidate_review_summary: string[];
    review_cues: string[];
    authority_boundary_notes: string[];
    reason_codes: string[];
  };
};

const defaultCreatedAt = "1970-01-01T00:00:00.000Z" as const;

const defaultForbiddenCapabilities = [
  "Review Memory proposal candidate only.",
  "UI, route, DB, provider, retrieval, and source-fetch work remain out of scope.",
  "Review Memory writes, proof/evidence, promotion, Formation Receipt, durable state, and product-write remain out of scope.",
  "Codex, GitHub, Git, release, deploy, and publish execution remain out of scope.",
] as const;

const defaultReasonCodes = [
  "dogfooding_to_review_memory_proposal_present",
  "caller_provided_public_safe_dogfooding_material_only",
  "proposal_candidate_only",
  "operator_confirmation_required",
  "review_memory_write_not_executed",
  "review_memory_preview_only",
  "dogfooding_record_candidate_only",
  "changed_files_not_proof",
  "observed_files_not_proof",
  "validation_refs_diagnostic_only",
  "validation_pass_not_approval",
  "validation_failure_not_rejection",
  "smoke_pass_not_evidence",
  "smoke_failure_not_rejection",
  "ci_pass_not_authority",
  "ci_failure_diagnostic_only",
  "skipped_checks_review_context_only",
  "known_warnings_review_context_only",
  "not_done_items_next_task_cues_only",
  "expected_observed_delta_review_context",
  "proposed_actions_not_executed",
  "request_more_evidence_not_source_fetch",
  "mark_needs_followup_not_task_creation",
  "mark_superseded_not_deletion",
  "mark_duplicate_not_deletion",
  "product_write_denied",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "promotion_not_executed",
  "formation_receipt_not_written",
  "durable_state_not_applied",
  "review_memory_not_written",
  "provider_call_not_executed",
  "retrieval_not_executed",
  "source_fetch_not_executed",
  "git_github_not_executed",
  "release_not_executed",
  "next_slice_is_cue_not_execution_approval",
] as const;

const allowedInputAuthorityTrueFields = new Set([
  "dogfooding_research_record_runtime_now",
  "same_origin_route_now",
  "local_test_db_query_or_write_now",
  "operator_supplied_payload_only",
  "caller_injected_local_db_only",
  "candidate_only",
  "public_safe_summary_only",
  "dogfooding_record_to_handoff_packet_builder_now",
  "existing_conversation_handoff_packet_builder_used_now",
  "caller_provided_public_safe_dogfooding_material_only",
  "candidate_only_handoff_guidance",
  "candidate_only_review_memory_proposal",
  "dogfooding_record_is_candidate_only",
  "review_memory_refs_are_reference_only",
  "promotion_receipt_state_refs_are_reference_only",
  "operator_confirmation_required",
  "review_memory_write_preview_only",
]);

const forbiddenAuthorityFields = [
  "db_query_or_write_now",
  "db_read_now",
  "db_write_now",
  "route_now",
  "ui_now",
  "component_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "retrieval_index_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "review_memory_write_now",
  "review_memory_write_executed",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "formation_receipt_write_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "product_write_now",
  "product_id_allocation_now",
  "codex_execution_from_augnes_runtime_now",
  "github_api_call_now",
  "git_write_now",
  "github_git_actuation_now",
  "release_deploy_publish_now",
  "source_of_truth",
  "proof_or_evidence_record",
  "product_write_authority",
  "codex_execution_authority",
  "github_automation_authority",
] as const;

const forbiddenAuthorityFieldSet = new Set<string>(forbiddenAuthorityFields);

const forbiddenAuthorityPhrasePatterns = [
  /\bdogfooding record to review memory proposal\s+(?:is|=|as)\s+(?!not\b)(?:review memory write|saved review memory|execution approval|truth|proof|accepted evidence|evidence|authority|approval|promotion|formation receipt|durable perspective state|product-write)\b/i,
  /\breview memory proposal\s+(?:is|=|as)\s+(?!not\b)(?:saved review memory|review memory write|promotion|formation receipt|durable perspective state|product-write|truth|proof|accepted evidence|evidence|authority|approval)\b/i,
  /\boperator confirmation\s+(?:is|=|as)\s+(?:optional|not required|unnecessary)\b/i,
  /\bproposed review action\s+(?:is|=|as)\s+(?!not\b)(?:executed action|execution approval|authority|approval)\b/i,
  /\bproposed save_review_note\s+(?:is|=|as)\s+(?!not\b)(?:review memory write|saved review memory|authority)\b/i,
  /\bproposed request_more_evidence\s+(?:is|=|as)\s+(?!not\b)(?:source fetch|retrieval|provider call)\b/i,
  /\bproposed mark_needs_followup\s+(?:is|=|as)\s+(?!not\b)(?:automatic task creation|task creation|execution approval)\b/i,
  /\bproposed mark_validation_incomplete\s+(?:is|=|as)\s+(?!not\b)(?:validation failure|automatic rejection|rejection)\b/i,
  /\bproposed mark_superseded\s+(?:is|=|as)\s+(?!not\b)(?:deletion|automatic deletion)\b/i,
  /\bproposed mark_duplicate\s+(?:is|=|as)\s+(?!not\b)(?:deletion|automatic deletion)\b/i,
  /\bproposed prepare_handoff_later\s+(?:is|=|as)\s+(?!not\b)(?:execution approval|approval|authority)\b/i,
  /\bpr body\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|authority|approval)\b/i,
  /\bchanged files?\s+(?:is|are|=|as)\s+(?!not\b)(?:proof|accepted evidence|evidence|authority|approval)\b/i,
  /\bobserved files?\s+(?:is|are|=|as)\s+(?!not\b)(?:proof|accepted evidence|evidence|authority|approval)\b/i,
  /\bvalidation pass\s+(?:is|=|as)\s+(?!not\b)(?:approval|truth|proof|authority)\b/i,
  /\bvalidation failure\s+(?:is|=|as)\s+(?!not\b)(?:rejection|automatic rejection|truth|proof|authority)\b/i,
  /\bsmoke pass\s+(?:is|=|as)\s+(?!not\b)(?:accepted evidence|evidence|truth|proof|approval|authority)\b/i,
  /\bsmoke failure\s+(?:is|=|as)\s+(?!not\b)(?:rejection|automatic rejection|authority|approval)\b/i,
  /\bci pass\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|approval|authority|promotion|merge approval|release approval|product-write authority|durable state)\b/i,
  /\bci failure\s+(?:is|=|as)\s+(?!not\b)(?:rejection|automatic rejection|truth|proof|authority)\b/i,
  /\bcodex (?:report|result)\s+(?:is|=|as)\s+(?!not\b)(?:execution approval|proof|accepted evidence|evidence|authority|approval|durable state|state)\b/i,
  /\bdogfooding record\s+(?:is|=|as)\s+(?!not\b)(?:review memory write|saved review memory|promotion|formation receipt|durable perspective state|product-write|truth|proof|authority|approval)\b/i,
  /\bskipped checks?\s+(?:is|are|=|as)\s+(?!not\b)(?:automatic failure|failure|rejection|automatic rejection)\b/i,
  /\bknown warnings?\s+(?:is|are|=|as)\s+(?!not\b)(?:automatic rejection|rejection|failure|automatic failure)\b/i,
  /\bnot[-\s]?done items?\s+(?:is|are|=|as)\s+(?!not\b)(?:automatic task creation|task creation|execution approval)\b/i,
  /\bexpected\/observed delta\s+(?:is|=|as)\s+(?!not\b)(?:approval|rejection|authority|proof|evidence)\b/i,
  /\bretrieval (?:result|score)\s+(?:is|=|as)\s+(?!not\b)(?:accepted evidence|evidence|authority|promotion authority|truth score|truth|promotion readiness|approval)\b/i,
  /\bprovider output\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|accepted evidence|evidence|authority|approval)\b/i,
  /\bfeedback\s+(?:is|=|as)\s+(?!not\b)(?:truth|proof|authority|approval)\b/i,
  /\blayout coordinates?\s+(?:is|are|=|as)\s+(?!not\b)(?:truth|authority|source of truth)\b/i,
  /\bsalience score\s+(?:is|=|as)\s+(?!not\b)(?:truth|truth score|authority|promotion readiness)\b/i,
  /\bgit (?:commit|ref|tag|branch)\s+(?:is|=|as)\s+(?!not\b)(?:approval|authority|durable state|core decision|promotion)\b/i,
  /\bgithub (?:branch|commit|pr)\s+(?:is|=|as)\s+(?!not\b)(?:core decision|automatic execution authority|execution authority|authority)\b/i,
] as const;

export function createDogfoodingToReviewMemoryProposalAuthorityBoundaryV01():
  DogfoodingToReviewMemoryProposalAuthorityBoundaryV01 {
  return {
    dogfooding_record_to_review_memory_proposal_builder_now: true,
    caller_provided_public_safe_dogfooding_material_only: true,
    candidate_only_review_memory_proposal: true,
    operator_confirmation_required: true,
    review_memory_write_preview_only: true,
    db_read_now: false,
    db_write_now: false,
    route_now: false,
    ui_now: false,
    component_now: false,
    cockpit_change_now: false,
    public_surface_change_now: false,
    route_model_change_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    retrieval_execution_now: false,
    retrieval_index_write_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    review_memory_write_now: false,
    review_memory_write_executed: false,
    promotion_execution_now: false,
    promotion_decision_record_write_now: false,
    formation_receipt_write_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    product_write_now: false,
    product_id_allocation_now: false,
    codex_execution_from_augnes_runtime_now: false,
    github_api_call_now: false,
    git_write_now: false,
    github_git_actuation_now: false,
    release_deploy_publish_now: false,
    dogfooding_record_to_review_memory_proposal_is_review_memory_write: false,
    dogfooding_record_to_review_memory_proposal_is_execution_approval: false,
    dogfooding_record_to_review_memory_proposal_is_truth: false,
    dogfooding_record_to_review_memory_proposal_is_proof: false,
    dogfooding_record_to_review_memory_proposal_is_accepted_evidence: false,
    review_memory_proposal_is_saved_review_memory: false,
    review_memory_proposal_is_promotion: false,
    review_memory_proposal_is_formation_receipt: false,
    review_memory_proposal_is_durable_perspective_state: false,
    review_memory_proposal_is_product_write: false,
    proposed_review_action_is_executed_action: false,
    proposed_save_review_note_is_review_memory_write: false,
    proposed_request_more_evidence_is_source_fetch: false,
    proposed_mark_needs_followup_is_automatic_task_creation: false,
    proposed_mark_validation_incomplete_is_validation_failure: false,
    proposed_mark_superseded_is_deletion: false,
    proposed_mark_duplicate_is_deletion: false,
    proposed_prepare_handoff_later_is_execution_approval: false,
    pr_body_is_truth: false,
    changed_files_are_proof: false,
    observed_files_are_proof: false,
    validation_pass_is_approval: false,
    validation_failure_is_rejection: false,
    smoke_pass_is_evidence: false,
    smoke_failure_is_rejection: false,
    ci_pass_is_authority: false,
    ci_failure_is_rejection: false,
    skipped_checks_are_automatic_failure: false,
    known_warnings_are_automatic_rejection: false,
    not_done_items_are_automatic_task_creation: false,
    expected_observed_delta_is_approval_or_rejection: false,
    review_memory_refs_are_reference_only: true,
    promotion_receipt_state_refs_are_reference_only: true,
    git_ref_is_authority: false,
    github_pr_ref_is_authority: false,
  };
}

export function buildReviewMemoryProposalFromDogfoodingRecordV01(
  input: unknown,
): DogfoodingToReviewMemoryProposalResultV01 {
  const authorityBoundary =
    createDogfoodingToReviewMemoryProposalAuthorityBoundaryV01();
  const privacyScanInput = stripAllowedAuthorityTrueFieldsForPrivacyScan(input);
  const privacyReport = buildPrivacyRedactionRuntimeGuardReportV01(privacyScanInput);

  if (privacyReport.status !== "passed") {
    return result({
      status:
        privacyReport.status === "blocked_forbidden_authority"
          ? "blocked_forbidden_authority"
          : "blocked_private_or_raw_payload",
      proposal: null,
      sourceRecordRefs: collectSourceRecordRefs(input),
      privacyReport,
      authorityBoundary,
      reasonCodes: [
        ...defaultReasonCodes,
        privacyReport.status === "blocked_forbidden_authority"
          ? "forbidden_authority_blocked"
          : "raw_private_payload_blocked",
      ],
    });
  }

  const authorityFindings = detectForbiddenAuthorityFindings(input);
  if (authorityFindings.length > 0) {
    return result({
      status: "blocked_forbidden_authority",
      proposal: null,
      sourceRecordRefs: collectSourceRecordRefs(input),
      privacyReport: buildForbiddenAuthorityReport(input, authorityFindings),
      authorityBoundary,
      reasonCodes: [...defaultReasonCodes, "forbidden_authority_blocked"],
    });
  }

  const sourceStatus = detectBlockedSourceStatus(input);
  if (sourceStatus) {
    return result({
      status: sourceStatus,
      proposal: null,
      sourceRecordRefs: collectSourceRecordRefs(input),
      privacyReport,
      authorityBoundary,
      reasonCodes: [
        ...defaultReasonCodes,
        sourceStatus === "blocked_forbidden_authority"
          ? "source_record_blocked_forbidden_authority"
          : "source_record_blocked_private_or_raw_payload",
      ],
    });
  }

  const normalized = normalizeDogfoodingMaterial(input);
  if (!normalized) {
    return result({
      status: "rejected",
      proposal: null,
      sourceRecordRefs: [],
      privacyReport,
      authorityBoundary,
      reasonCodes: [...defaultReasonCodes, "invalid_dogfooding_material_rejected"],
    });
  }

  const proposal = buildProposal(normalized, privacyReport, authorityBoundary);
  return result({
    status: "proposed",
    proposal,
    sourceRecordRefs: proposal.source_dogfooding_record_refs,
    privacyReport,
    authorityBoundary,
    reasonCodes: proposal.reason_codes,
  });
}

export function buildDogfoodingRecordToReviewMemoryProposalV01(
  input: unknown,
): DogfoodingToReviewMemoryProposalResultV01 {
  return buildReviewMemoryProposalFromDogfoodingRecordV01(input);
}

export function buildDogfoodingToReviewMemoryProposalV01(
  input: unknown,
): DogfoodingToReviewMemoryProposalResultV01 {
  return buildReviewMemoryProposalFromDogfoodingRecordV01(input);
}

function result({
  status,
  proposal,
  sourceRecordRefs,
  privacyReport,
  authorityBoundary,
  reasonCodes,
}: {
  status: DogfoodingToReviewMemoryProposalStatusV01;
  proposal: DogfoodingToReviewMemoryProposalV01 | null;
  sourceRecordRefs: string[];
  privacyReport: DogfoodingToReviewMemoryProposalPrivacyReportV01 | null;
  authorityBoundary: DogfoodingToReviewMemoryProposalAuthorityBoundaryV01;
  reasonCodes: readonly string[];
}): DogfoodingToReviewMemoryProposalResultV01 {
  return {
    ok: status === "proposed",
    status,
    error_code: status === "proposed" ? null : status,
    proposal,
    source_record_refs: uniqueSortedStrings(sourceRecordRefs),
    reason_codes: uniqueSortedStrings(reasonCodes),
    privacy_report: privacyReport,
    authority_boundary: authorityBoundary,
    product_write_executed: false,
    review_memory_written: false,
    review_memory_write_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    promotion_executed: false,
    formation_receipt_written: false,
    durable_state_applied: false,
    github_git_actuated: false,
    provider_called: false,
    retrieval_executed: false,
    source_fetched: false,
    release_deploy_publish_executed: false,
    db_read_executed: false,
    db_write_executed: false,
  };
}

function buildProposal(
  normalized: NormalizedDogfoodingMaterial,
  privacyReport: DogfoodingToReviewMemoryProposalPrivacyReportV01,
  authorityBoundary: DogfoodingToReviewMemoryProposalAuthorityBoundaryV01,
): DogfoodingToReviewMemoryProposalV01 {
  const sourceRecordRefs = uniqueSortedStrings([
    ...normalized.summary_fields.source_dogfooding_record_refs,
    ...normalized.records.map((record) => record.record_ref),
  ]);
  const sourceRefs = uniqueSortedStrings([
    DogfoodingToReviewMemoryProposalSliceV01,
    "dogfooding_research_record_runtime_v0_1",
    "research_candidate_review_memory_contract.v0.1",
    ...normalized.summary_fields.source_refs,
    ...normalized.records.flatMap((record) => [
      ...record.source_refs,
      ...record.reason_codes.map((reasonCode) => `dogfooding-reason-code:${reasonCode}`),
    ]),
  ]);
  const prRefs = uniqueSortedStrings([
    ...normalized.summary_fields.pr_refs,
    ...normalized.records.flatMap((record) => record.pr_refs),
  ]);
  const branchRefs = uniqueSortedStrings([
    ...normalized.summary_fields.branch_refs,
    ...normalized.records.flatMap((record) => record.branch_refs),
  ]);
  const commitRefs = uniqueSortedStrings([
    ...normalized.summary_fields.commit_refs,
    ...normalized.records.flatMap((record) => record.commit_refs),
  ]);
  const changedFileRefs = uniqueSortedStrings([
    ...normalized.summary_fields.changed_file_refs,
    ...normalized.records.flatMap((record) => record.changed_file_refs),
  ]);
  const validationRefs = uniqueSortedStrings([
    ...normalized.summary_fields.validation_refs,
    ...normalized.records.flatMap((record) => record.validation_refs),
  ]);
  const skippedCheckRefs = uniqueSortedStrings([
    ...normalized.summary_fields.skipped_check_refs,
    ...normalized.records.flatMap((record) => record.skipped_check_refs),
  ]);
  const knownWarningRefs = uniqueSortedStrings([
    ...normalized.summary_fields.known_warning_refs,
    ...normalized.records.flatMap((record) => record.known_warning_refs),
  ]);
  const notDoneRefs = uniqueSortedStrings([
    ...normalized.summary_fields.not_done_refs,
    ...normalized.records.flatMap((record) => record.not_done_refs),
  ]);
  const expectedObservedDeltaRefs = uniqueSortedStrings([
    ...normalized.summary_fields.expected_observed_delta_refs,
    ...normalized.records.flatMap((record) => record.expected_observed_delta_refs),
  ]);
  const summaries = uniqueSortedStrings([
    ...normalized.summary_fields.candidate_review_summary,
    ...normalized.records
      .map((record) =>
        record.normalized_summary
          ? `Candidate dogfooding summary from ${record.record_ref}: ${record.normalized_summary}`
          : "",
      )
      .filter(Boolean),
  ]);
  const candidateReviewSummary =
    summaries.length > 0
      ? summaries.join(" ")
      : "Caller-provided dogfooding record refs are available as candidate-only Review Memory proposal context.";
  const createdAt = normalized.created_at ?? createdAtFromRecords(normalized.records);
  const proposalId =
    normalized.proposal_id ??
    `review-memory-proposal:dogfooding:${hashSuffix({
      sourceRecordRefs,
      sourceRefs,
      candidateReviewSummary,
    })}`;
  const proposedReviewActions = buildProposedActions({
    sourceRecordRefs,
    sourceRefs,
    validationRefs,
    skippedCheckRefs,
    knownWarningRefs,
    notDoneRefs,
    expectedObservedDeltaRefs,
    reviewCues: uniqueSortedStrings([
      ...normalized.summary_fields.review_cues,
      ...normalized.records.flatMap((record) => record.review_cues),
      ...normalized.records.flatMap((record) => record.boundary_notes),
      ...normalized.summary_fields.authority_boundary_notes,
    ]),
    candidateReviewSummary,
  });
  const reasonCodes = uniqueSortedStrings([
    ...defaultReasonCodes,
    ...normalized.summary_fields.reason_codes,
    ...normalized.records.flatMap((record) => record.reason_codes),
    ...proposedReviewActions.map((action) => `proposed_action:${action.action}`),
    "changed_file_refs_preserved_as_context_not_proof",
    "validation_refs_preserved_as_diagnostic_context",
    "skipped_checks_preserved_as_review_context",
    "known_warnings_preserved_as_review_context",
    "not_done_refs_preserved_as_followup_cues",
    "expected_observed_delta_refs_preserved_as_review_context",
  ]);
  const proposalWithoutFingerprint: Omit<
    DogfoodingToReviewMemoryProposalV01,
    "proposal_fingerprint"
  > = {
    proposal_id: proposalId,
    proposal_version: DogfoodingToReviewMemoryProposalVersionV01,
    builder_version: DogfoodingToReviewMemoryProposalBuilderVersionV01,
    scope: DogfoodingToReviewMemoryProposalScopeV01,
    created_at: createdAt,
    source_dogfooding_record_refs: sourceRecordRefs,
    source_refs: sourceRefs,
    pr_refs: prRefs,
    branch_refs: branchRefs,
    commit_refs: commitRefs,
    changed_file_refs: changedFileRefs,
    validation_refs: validationRefs,
    skipped_check_refs: skippedCheckRefs,
    known_warning_refs: knownWarningRefs,
    not_done_refs: notDoneRefs,
    expected_observed_delta_refs: expectedObservedDeltaRefs,
    candidate_review_summary: candidateReviewSummary,
    proposed_review_actions: proposedReviewActions,
    operator_confirmation_required: true,
    review_memory_write_preview: {
      preview_kind: "review_memory_write_preview_only",
      target_contract_ref: "research_candidate_review_memory_contract.v0.1",
      candidate_record_kind: "operator_review_note",
      candidate_ref: proposalId,
      bounded_summary: candidateReviewSummary,
      source_refs: sourceRefs,
      write_executed: false,
      operator_confirmation_required: true,
      preview_only: true,
      authority_boundary: {
        review_memory_write_preview_is_write: false,
        proposed_save_review_note_is_review_memory_write: false,
        operator_confirmation_required_before_write: true,
      },
    },
    review_memory_write_executed: false,
    authority_boundary: authorityBoundary,
    forbidden_capabilities: [...defaultForbiddenCapabilities],
    privacy_report: privacyReport,
    reason_codes: reasonCodes,
  };
  return {
    ...proposalWithoutFingerprint,
    proposal_fingerprint: createProposalFingerprintV01(proposalWithoutFingerprint),
  };
}

export function createProposalFingerprintV01(value: unknown): string {
  const valueForHash = cloneJson(value);
  if (isRecord(valueForHash)) {
    delete valueForHash.proposal_fingerprint;
  }
  return createHash("sha256").update(canonicalJson(valueForHash)).digest("hex");
}

function buildProposedActions({
  sourceRecordRefs,
  sourceRefs,
  validationRefs,
  skippedCheckRefs,
  knownWarningRefs,
  notDoneRefs,
  expectedObservedDeltaRefs,
  reviewCues,
  candidateReviewSummary,
}: {
  sourceRecordRefs: string[];
  sourceRefs: string[];
  validationRefs: string[];
  skippedCheckRefs: string[];
  knownWarningRefs: string[];
  notDoneRefs: string[];
  expectedObservedDeltaRefs: string[];
  reviewCues: string[];
  candidateReviewSummary: string;
}): DogfoodingToReviewMemoryProposalActionV01[] {
  const actionReasons = new Map<
    DogfoodingToReviewMemoryProposalActionCandidateV01,
    string[]
  >();
  const allCueText = [
    candidateReviewSummary,
    ...reviewCues,
    ...sourceRecordRefs,
    ...sourceRefs,
  ].join(" ");
  const add = (
    action: DogfoodingToReviewMemoryProposalActionCandidateV01,
    reason: string,
  ) => {
    const existing = actionReasons.get(action) ?? [];
    existing.push(reason);
    actionReasons.set(action, existing);
  };

  if (candidateReviewSummary || reviewCues.length > 0) {
    add("save_review_note", "Public-safe dogfooding summary is available for operator review.");
  }
  if (
    expectedObservedDeltaRefs.length > 0 ||
    /more[-_\s]?evidence|request_more_evidence|evidence[-_\s]?needed|expected\/observed|delta/i.test(
      allCueText,
    )
  ) {
    add(
      "request_more_evidence",
      "Expected/observed delta or review cue asks for more evidence as a candidate action only.",
    );
  }
  if (
    notDoneRefs.length > 0 ||
    /needs?[-_\s]?followup|mark_needs_followup|not[-_\s]?done|next[-_\s]?task/i.test(
      allCueText,
    )
  ) {
    add(
      "mark_needs_followup",
      "Not-done material remains a follow-up cue, not automatic task creation.",
    );
  }
  if (
    skippedCheckRefs.length > 0 ||
    /validation[-_\s]?incomplete|mark_validation_incomplete|skipped[-_\s]?check|not[-_\s]?run/i.test(
      allCueText,
    )
  ) {
    add(
      "mark_validation_incomplete",
      "Skipped or incomplete validation remains review context, not automatic rejection.",
    );
  }
  if (/supersed|mark_superseded/i.test(allCueText)) {
    add("mark_superseded", "Superseded cue remains a proposal candidate, not deletion.");
  }
  if (/duplicate|mark_duplicate/i.test(allCueText)) {
    add("mark_duplicate", "Duplicate cue remains a proposal candidate, not deletion.");
  }
  if (/handoff|prepare_handoff_later/i.test(allCueText) || sourceRecordRefs.length > 0) {
    add(
      "prepare_handoff_later",
      "Handoff preparation remains a later candidate action, not execution approval.",
    );
  }
  if (knownWarningRefs.length > 0 && !actionReasons.has("save_review_note")) {
    add("save_review_note", "Known warning context should remain operator-reviewable.");
  }
  if (validationRefs.length > 0 && !actionReasons.has("mark_validation_incomplete")) {
    add(
      "mark_validation_incomplete",
      "Validation refs are diagnostic context and may need operator completeness review.",
    );
  }

  return DogfoodingToReviewMemoryProposalActionCandidatesV01.filter((action) =>
    actionReasons.has(action),
  ).map((action) => ({
    action,
    rationale: uniqueSortedStrings(actionReasons.get(action) ?? []).join(" "),
    source_refs: uniqueSortedStrings([...sourceRecordRefs, ...sourceRefs]),
    candidate_only: true,
    executed: false,
    authority_boundary: {
      candidate_action_only: true,
      executed: false,
      proposed_action_is_executed_action: false,
      proposed_save_review_note_is_review_memory_write: false,
      proposed_request_more_evidence_is_source_fetch: false,
      proposed_mark_needs_followup_is_automatic_task_creation: false,
      proposed_mark_validation_incomplete_is_validation_failure: false,
      proposed_mark_superseded_is_deletion: false,
      proposed_mark_duplicate_is_deletion: false,
      proposed_prepare_handoff_later_is_execution_approval: false,
    },
  }));
}

function normalizeDogfoodingMaterial(input: unknown): NormalizedDogfoodingMaterial | null {
  if (!isRecord(input) && !Array.isArray(input)) return null;
  const root = isRecord(input) ? input : {};
  const records = extractRecordValues(input).map(normalizeRecord).sort((a, b) =>
    a.record_ref.localeCompare(b.record_ref),
  );
  const summaryFields = {
    source_dogfooding_record_refs: normalizeList(
      root.source_dogfooding_record_refs ?? root.dogfooding_record_refs,
    ),
    source_refs: normalizeList(root.source_refs),
    pr_refs: normalizeList(root.pr_refs),
    branch_refs: normalizeList(root.branch_refs),
    commit_refs: normalizeList(root.commit_refs),
    changed_file_refs: normalizeList(root.changed_file_refs ?? root.observed_files),
    validation_refs: normalizeList(root.validation_refs ?? root.observed_checks),
    skipped_check_refs: normalizeList(root.skipped_check_refs ?? root.skipped_checks),
    known_warning_refs: normalizeList(root.known_warning_refs ?? root.known_warnings),
    not_done_refs: normalizeList(root.not_done_refs ?? root.not_done_items),
    expected_observed_delta_refs: normalizeList(
      root.expected_observed_delta_refs ?? root.expected_observed_delta,
    ),
    candidate_review_summary: normalizeList(
      root.candidate_review_summary ?? root.normalized_summary ?? root.current_task,
    ),
    review_cues: normalizeReviewCues(root.review_cues ?? root.unresolved_tensions),
    authority_boundary_notes: normalizeList(root.authority_boundary_notes),
    reason_codes: normalizeList(root.reason_codes),
  };
  const hasSummaryOnlyRefs =
    summaryFields.source_dogfooding_record_refs.length > 0 ||
    summaryFields.candidate_review_summary.length > 0 ||
    summaryFields.changed_file_refs.length > 0 ||
    summaryFields.validation_refs.length > 0;
  if (records.length === 0 && !hasSummaryOnlyRefs) return null;
  return {
    proposal_id: normalizeOptionalString(root.proposal_id),
    created_at: normalizeOptionalString(root.created_at),
    records,
    summary_fields: summaryFields,
  };
}

function extractRecordValues(input: unknown): PublicSafeDogfoodingRecordLike[] {
  if (Array.isArray(input)) return input.filter(isRecord);
  if (!isRecord(input)) return [];
  for (const key of ["records", "dogfooding_records", "dogfooding_research_records"]) {
    const value = input[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }
  const single = input.record ?? input.dogfooding_record ?? input.dogfooding_research_record;
  if (isRecord(single)) return [single];
  if (
    !("record_id" in input) &&
    ("source_dogfooding_record_refs" in input || "dogfooding_record_refs" in input)
  ) {
    return [];
  }
  if (
    "record_id" in input ||
    "normalized_summary" in input ||
    "changed_file_refs" in input ||
    "validation_refs" in input
  ) {
    return [input];
  }
  return [];
}

function normalizeRecord(
  record: PublicSafeDogfoodingRecordLike,
  index = 0,
): NormalizedDogfoodingRecord {
  const recordView = record as JsonRecord;
  const recordRef =
    normalizeOptionalString(recordView.record_id) ??
    normalizeOptionalString(recordView.record_ref) ??
    `dogfooding-record-summary:${String(index + 1).padStart(3, "0")}`;
  return {
    record_ref: recordRef,
    record_kind: normalizeOptionalString(recordView.record_kind),
    created_at: normalizeOptionalString(recordView.created_at),
    normalized_summary: normalizeOptionalString(recordView.normalized_summary),
    source_refs: normalizeList(recordView.source_refs),
    pr_refs: normalizeList(recordView.pr_refs),
    branch_refs: normalizeList(recordView.branch_refs),
    commit_refs: normalizeList(recordView.commit_refs),
    changed_file_refs: normalizeList(recordView.changed_file_refs),
    validation_refs: normalizeList(recordView.validation_refs),
    skipped_check_refs: normalizeList(recordView.skipped_check_refs),
    known_warning_refs: normalizeList(recordView.known_warning_refs),
    not_done_refs: normalizeList(recordView.not_done_refs),
    expected_observed_delta_refs: normalizeList(recordView.expected_observed_delta_refs),
    review_cues: normalizeReviewCues(recordView.review_cues),
    boundary_notes: normalizeList(
      isRecord(recordView.privacy_report)
        ? recordView.privacy_report.boundary_notes
        : [],
    ),
    reason_codes: normalizeList(recordView.reason_codes),
  };
}

function normalizeReviewCues(value: unknown): string[] {
  if (!Array.isArray(value)) return normalizeList(value);
  return uniqueSortedStrings(
    value.map((item) => {
      if (!isRecord(item)) return normalizeString(item);
      const cueKind = normalizeOptionalString(item.cue_kind) ?? "review_cue";
      const summary =
        normalizeOptionalString(item.public_safe_summary) ??
        normalizeOptionalString(item.bounded_summary) ??
        normalizeOptionalString(item.summary) ??
        "public-safe review cue";
      return `${cueKind}:${summary}`;
    }),
  );
}

function detectBlockedSourceStatus(
  input: unknown,
): "blocked_private_or_raw_payload" | "blocked_forbidden_authority" | null {
  let blockedPrivate = false;
  let blockedAuthority = false;
  visitValue(input, "input", (_path, value, key) => {
    if (!key || typeof value !== "string") return;
    if (!["status", "lifecycle_state"].includes(key)) return;
    if (value === "blocked_forbidden_authority") blockedAuthority = true;
    if (value === "blocked_private_or_raw_payload") blockedPrivate = true;
  });
  if (blockedAuthority) return "blocked_forbidden_authority";
  if (blockedPrivate) return "blocked_private_or_raw_payload";
  return null;
}

function collectSourceRecordRefs(input: unknown): string[] {
  return extractRecordValues(input)
    .map((record) => normalizeOptionalString(record.record_id))
    .filter((value): value is string => Boolean(value));
}

function detectForbiddenAuthorityFindings(
  input: unknown,
): PrivacyRedactionRuntimeGuardFinding[] {
  const findings: Array<Omit<PrivacyRedactionRuntimeGuardFinding, "finding_id">> = [];
  visitValue(input, "input", (path, value, key) => {
    if (key && isForbiddenAuthorityField(key, value)) {
      findings.push({
        path,
        finding_kind: "forbidden_authority_claim",
        severity: "critical",
        action: "blocked",
        reason_codes: ["authority_escalation_blocked", "public_safe_summary_only"],
        public_safe_summary:
          "Forbidden authority claim was blocked; no raw value included.",
        original_value_included: false,
      });
    }
    if (typeof value !== "string") return;
    for (const pattern of forbiddenAuthorityPhrasePatterns) {
      pattern.lastIndex = 0;
      if (!pattern.test(value)) continue;
      findings.push({
        path,
        finding_kind: "forbidden_authority_phrase",
        severity: "critical",
        action: "blocked",
        reason_codes: ["authority_escalation_blocked", "public_safe_summary_only"],
        public_safe_summary:
          "Forbidden authority phrase was blocked; no raw value included.",
        original_value_included: false,
      });
    }
  });
  return findings.map((finding, index) => ({
    finding_id: `dogfooding-review-memory-proposal-authority-finding-${String(
      index + 1,
    ).padStart(3, "0")}`,
    ...finding,
  }));
}

function buildForbiddenAuthorityReport(
  input: unknown,
  findings: PrivacyRedactionRuntimeGuardFinding[],
): PrivacyRedactionRuntimeGuardReport {
  const root = isRecord(input) ? input : {};
  const reportWithoutFingerprint: Omit<
    PrivacyRedactionRuntimeGuardReport,
    "guard_fingerprint"
  > = {
    guard_version: PRIVACY_REDACTION_RUNTIME_GUARD_VERSION,
    scope: DogfoodingToReviewMemoryProposalScopeV01,
    status: "blocked_forbidden_authority",
    as_of: normalizeOptionalString(root.created_at) ?? defaultCreatedAt,
    subject_ref: "dogfooding-to-review-memory-proposal:blocked",
    findings,
    redacted_preview: {
      status: "blocked_forbidden_authority",
      public_safe_summary_only: true,
    },
    blocked_paths: uniqueSortedStrings(findings.map((finding) => finding.path)),
    redacted_paths: [],
    reason_codes: ["authority_escalation_blocked", "public_safe_summary_only"],
    boundary_notes: [
      "Forbidden authority shortcuts are blocked without raw value echo.",
      "Review Memory proposals remain candidate-only and unexecuted.",
    ],
    authority_boundary: createPrivacyRedactionRuntimeGuardAuthorityBoundaryV01(),
  };
  return {
    ...reportWithoutFingerprint,
    guard_fingerprint:
      createPrivacyRedactionRuntimeGuardFingerprintV01(reportWithoutFingerprint),
  };
}

function isForbiddenAuthorityField(key: string, value: unknown): boolean {
  if (value === false || value === null || value === undefined) return false;
  const lower = key.toLowerCase();
  if (allowedInputAuthorityTrueFields.has(lower)) return false;
  return (
    forbiddenAuthorityFieldSet.has(lower) ||
    lower.endsWith("_authority") ||
    lower.endsWith("_authority_now") ||
    lower.endsWith("_write_now") ||
    lower.endsWith("_call_now") ||
    lower.endsWith("_execution_now") ||
    lower.endsWith("_is_truth") ||
    lower.endsWith("_is_proof") ||
    lower.endsWith("_is_approval") ||
    lower.endsWith("_is_rejection")
  );
}

function stripAllowedAuthorityTrueFieldsForPrivacyScan(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripAllowedAuthorityTrueFieldsForPrivacyScan(item));
  }
  if (!isRecord(value)) return value;
  return Object.keys(value)
    .sort()
    .reduce<JsonRecord>((acc, key) => {
      const child = value[key];
      if (
        allowedInputAuthorityTrueFields.has(key.toLowerCase()) &&
        (child === true || child === false)
      ) {
        acc[key] = false;
        return acc;
      }
      acc[key] = stripAllowedAuthorityTrueFieldsForPrivacyScan(child);
      return acc;
    }, {});
}

function createdAtFromRecords(records: NormalizedDogfoodingRecord[]): string {
  const dates = records
    .map((record) => record.created_at)
    .filter((value): value is string => Boolean(value))
    .sort();
  return dates[0] ?? defaultCreatedAt;
}

function hashSuffix(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex").slice(0, 16);
}

function normalizeList(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return uniqueSortedStrings(value.map(normalizeString));
  return uniqueSortedStrings([normalizeString(value)]);
}

function normalizeOptionalString(value: unknown): string | null {
  const normalized = normalizeString(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizeString(value: unknown): string {
  if (typeof value === "string") return clampText(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  return clampText(canonicalJson(value));
}

function clampText(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 520) return normalized;
  return `${normalized.slice(0, 517).trimEnd()}...`;
}

function uniqueSortedStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort();
}

function visitValue(
  value: unknown,
  path: string,
  visitor: (path: string, value: unknown, key?: string) => void,
  key?: string,
): void {
  visitor(path, value, key);
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      visitValue(item, `${path}[${index}]`, visitor);
    });
    return;
  }
  if (!isRecord(value)) return;
  for (const childKey of Object.keys(value).sort()) {
    visitValue(value[childKey], `${path}.${childKey}`, visitor, childKey);
  }
}

function cloneJson(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => sortJson(item));
  if (!isRecord(value)) return value;
  return Object.keys(value)
    .sort()
    .reduce<JsonRecord>((acc, key) => {
      acc[key] = sortJson(value[key]);
      return acc;
    }, {});
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

void DogfoodingToReviewMemoryProposalNextSliceV01;
