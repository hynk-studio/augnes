import type { ExternalRefV01 } from "./external-ref";
import { RUN_RECEIPT_VERSION_V01 } from "./run-receipt";
import { STATE_TRANSITION_RECEIPT_VERSION_V01 } from "./state-transition-receipt";
import { TASK_CONTEXT_PACKET_VERSION_V01 } from "./task-context-packet";

export const CONTEXT_USE_REVIEW_VERSION_V01 = "context_use_review.v0.1" as const;
export const CONTEXT_USE_REVIEW_CANONICALIZATION_V01 =
  "augnes-json-c14n-v0_1" as const;
export const CONTEXT_USE_REVIEW_USAGE_PROVENANCE_VERSION_V01 =
  "context_use_review_usage_provenance.v0.1" as const;

export const CONTEXT_USE_REVIEW_PRESENTED_VALUES_V01 = [
  "yes",
  "no",
  "unknown",
] as const;
export const CONTEXT_USE_REVIEW_ACTUALLY_USED_VALUES_V01 = [
  "yes",
  "partial",
  "no",
  "unknown",
] as const;
export const CONTEXT_USE_REVIEW_ASSESSMENTS_V01 = [
  "helpful",
  "stale",
  "misleading",
  "missing",
  "noisy",
  "not_applicable",
] as const;
export const CONTEXT_USE_REVIEW_USAGE_PROVENANCE_BASES_V01 = [
  "direct_local_observation",
  "verified_external_observation",
  "host_attestation",
  "provider_report",
  "user_declaration",
  "mixed",
  "unknown",
] as const;

export type ContextUseReviewPresentedV01 =
  (typeof CONTEXT_USE_REVIEW_PRESENTED_VALUES_V01)[number];
export type ContextUseReviewActuallyUsedV01 =
  (typeof CONTEXT_USE_REVIEW_ACTUALLY_USED_VALUES_V01)[number];
export type ContextUseReviewAssessmentV01 =
  (typeof CONTEXT_USE_REVIEW_ASSESSMENTS_V01)[number];
export type ContextUseReviewUsageProvenanceBasisV01 =
  (typeof CONTEXT_USE_REVIEW_USAGE_PROVENANCE_BASES_V01)[number];

export interface ContextUseReviewPacketBindingV01 {
  packet_version: typeof TASK_CONTEXT_PACKET_VERSION_V01;
  packet_id: string;
  packet_fingerprint: string;
}

export interface ContextUseReviewTransitionReceiptBindingV01 {
  transition_receipt_version: typeof STATE_TRANSITION_RECEIPT_VERSION_V01;
  transition_receipt_id: string;
  transition_receipt_fingerprint: string;
}

export interface ContextUseReviewRunReceiptBindingV01 {
  receipt_version: typeof RUN_RECEIPT_VERSION_V01;
  receipt_id: string;
  receipt_fingerprint: string;
}

export interface ContextUseReviewUsageV01 {
  presented: ContextUseReviewPresentedV01;
  actually_used: ContextUseReviewActuallyUsedV01;
}

export interface ContextUseReviewUsageProvenanceLaneV01 {
  basis: ContextUseReviewUsageProvenanceBasisV01;
  source_refs: ExternalRefV01[];
}

export interface ContextUseReviewUsageProvenanceV01 {
  provenance_version: typeof CONTEXT_USE_REVIEW_USAGE_PROVENANCE_VERSION_V01;
  presented: ContextUseReviewUsageProvenanceLaneV01;
  actually_used: ContextUseReviewUsageProvenanceLaneV01;
  assessment: {
    basis: "user_declaration";
    source_refs: ExternalRefV01[];
  };
}

export interface ContextUseReviewCorrectionsV01 {
  correction_count: number;
  summaries: string[];
}

export interface ContextUseReviewMetricsV01 {
  wrong_context_correction_count: number | null;
  repeated_explanation_estimate: number | null;
  missing_critical_context_count: number | null;
  context_refs_used_count: number | null;
}

export interface ContextUseReviewCompatibilityMetadataV01 {
  source_contracts: string[];
  unmapped_fields: Array<{ source_field: string; reason: string }>;
  warnings: string[];
  external_refs: ExternalRefV01[];
}

export interface ContextUseReviewMaterialBoundaryV01 {
  bounded_summaries_only: true;
  max_summary_characters: 2000;
  max_collection_items: 128;
  max_refs_per_collection: 64;
  raw_prompt_persisted: false;
  raw_transcript_persisted: false;
  raw_terminal_output_persisted: false;
  raw_provider_output_persisted: false;
  hidden_reasoning_persisted: false;
  credential_or_secret_persisted: false;
  absolute_local_path_persisted: false;
}

export interface ContextUseReviewAuthoritySummaryV01 {
  record_represents_context_use_review: true;
  contract_validation_authenticates_reviewer: false;
  construction_proves_real_review: false;
  record_is_evidence: false;
  record_is_semantic_state: false;
  record_is_review_decision: false;
  record_is_state_transition_receipt: false;
  record_is_work_closure: false;
  creates_correction_proposal: false;
  applies_state_transition: false;
  accepts_evidence: false;
  mutates_perspective: false;
  promotes_reviewed_memory: false;
  closes_work: false;
  selects_next_context_automatically: false;
  triggers_automatic_rollback: false;
  authorizes_provider_calls: false;
  authorizes_github_mutation: false;
  authorizes_publication: false;
  authorizes_external_actuation: false;
  writes_database: false;
  notes: string[];
}

export interface ContextUseReviewIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof CONTEXT_USE_REVIEW_CANONICALIZATION_V01;
  fingerprint_scope: "review_without_integrity_fingerprint";
  fingerprint: string;
}

export interface ContextUseReviewV01 {
  review_version: typeof CONTEXT_USE_REVIEW_VERSION_V01;
  review_id: string;
  workspace_id: string;
  project_id: string;
  prior_packet: ContextUseReviewPacketBindingV01;
  later_packet: ContextUseReviewPacketBindingV01;
  source_transition_receipt: ContextUseReviewTransitionReceiptBindingV01;
  later_task_run_receipt: ContextUseReviewRunReceiptBindingV01;
  reviewer_ref: ExternalRefV01;
  reviewer_authentication_basis_refs: ExternalRefV01[];
  reviewed_at: string;
  usage: ContextUseReviewUsageV01;
  /**
   * Additive source classification for usage fields. Historical v0.1 reviews
   * omit this field and remain readable; new production reviews include it.
   */
  usage_provenance?: ContextUseReviewUsageProvenanceV01;
  assessment: ContextUseReviewAssessmentV01;
  corrections: ContextUseReviewCorrectionsV01;
  metrics: ContextUseReviewMetricsV01;
  notes: string[];
  compatibility: ContextUseReviewCompatibilityMetadataV01;
  material_boundary: ContextUseReviewMaterialBoundaryV01;
  authority_summary: ContextUseReviewAuthoritySummaryV01;
  integrity: ContextUseReviewIntegrityV01;
}

export interface ContextUseReviewValidationIssueV01 {
  severity: "error" | "warning";
  code: string;
  path: string | null;
  message: string;
}

export interface ContextUseReviewValidationResultV01 {
  status: "valid" | "invalid" | "blocked";
  normalized_protocol_version: typeof CONTEXT_USE_REVIEW_VERSION_V01 | null;
  errors: ContextUseReviewValidationIssueV01[];
  warnings: ContextUseReviewValidationIssueV01[];
}
