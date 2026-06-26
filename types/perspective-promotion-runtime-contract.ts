// Type-only contract for Perspective Promotion Runtime Contract v0.1.
// This file defines future human-reviewed promotion decision boundaries. It
// does not execute promotion, write decisions, create Formation Receipts,
// apply durable Perspective state, create proof/evidence, write products,
// call providers, execute retrieval/RAG, read files, query/write DB, export
// Git Ledger packets, run Codex/GitHub automation, or allocate product IDs.

export type PerspectivePromotionRuntimeContractVersion =
  "perspective_promotion_runtime_contract.v0.1";

export type PerspectivePromotionScope = "project:augnes";

export type PerspectivePromotionContractStatus = "contract_only";

export type PerspectivePromotionDecisionVersion =
  "perspective_promotion_decision.v0.1";

export type PerspectivePromotionBasisVersion =
  "perspective_promotion_basis.v0.1";

export type PerspectivePromotionGateReportVersion =
  "perspective_promotion_gate_report.v0.1";

export type PerspectivePromotionContractBundleVersion =
  "perspective_promotion_contract_bundle.v0.1";

export type PerspectivePromotionDecisionKind =
  | "promote"
  | "reject"
  | "defer"
  | "request_more_evidence"
  | "supersede"
  | "split_delta"
  | "merge_with_existing"
  | "unknown";

export type PerspectivePromotionDecisionStatus =
  | "contract_only"
  | "candidate_only"
  | "eligible_for_future_operator_decision"
  | "blocked_missing_review_record"
  | "blocked_missing_source_refs"
  | "blocked_missing_basis_candidates"
  | "blocked_unresolved_tension_policy"
  | "blocked_knowledge_gap_policy"
  | "blocked_private_or_raw_payload"
  | "blocked_forbidden_authority"
  | "rejected";

export type PerspectivePromotionBasisKind =
  | "review_record"
  | "claim_candidate"
  | "evidence_candidate"
  | "perspective_delta_candidate"
  | "source_ref"
  | "rag_context_preview"
  | "retrieval_candidate"
  | "provider_candidate_output_ref"
  | "formation_receipt_policy_ref"
  | "unresolved_tension_ref"
  | "knowledge_gap_ref"
  | "feedback_ref"
  | "manual_operator_note_summary"
  | "unknown";

export type PerspectivePromotionTensionPolicy =
  | "preserve_unresolved"
  | "resolve_with_basis"
  | "defer_to_future_review"
  | "block_until_resolved"
  | "unknown";

export type PerspectivePromotionKnowledgeGapPolicy =
  | "preserve_gap"
  | "close_with_basis"
  | "defer_to_future_review"
  | "block_until_closed"
  | "unknown";

export type PerspectivePromotionFormationReceiptPolicy =
  | "required_before_state_apply"
  | "deferred_until_runtime_slice"
  | "blocked_missing_receipt_policy"
  | "unknown";

export type PerspectivePromotionReviewReadiness =
  | "not_ready"
  | "needs_operator_review"
  | "ready_for_future_operator_decision"
  | "blocked";

export type PerspectivePromotionPrivacyClass =
  | "public_safe_refs_only"
  | "private_ref_only"
  | "blocked_raw_private_payload"
  | "blocked_secret_like_payload";

export type PerspectivePromotionRedactionStatus =
  | "not_needed"
  | "redacted"
  | "blocked_secret_like_pattern"
  | "blocked_raw_payload"
  | "blocked_private_location";

export type PerspectivePromotionReasonCode =
  | "roadmap_file_present"
  | "rag_context_preview_ref_present"
  | "review_record_ref_present"
  | "review_record_ref_missing"
  | "source_ref_present"
  | "source_ref_missing"
  | "claim_candidate_ref_present"
  | "claim_candidate_ref_missing"
  | "evidence_candidate_ref_present"
  | "evidence_candidate_ref_missing"
  | "perspective_delta_candidate_ref_present"
  | "perspective_delta_candidate_ref_missing"
  | "basis_candidate_ref_present"
  | "basis_candidate_ref_missing"
  | "unresolved_tension_present"
  | "unresolved_tension_policy_present"
  | "unresolved_tension_policy_missing"
  | "knowledge_gap_present"
  | "knowledge_gap_policy_present"
  | "knowledge_gap_policy_missing"
  | "formation_receipt_policy_present"
  | "formation_receipt_policy_missing"
  | "operator_actor_present"
  | "operator_actor_missing"
  | "explicit_user_action_required"
  | "future_operator_decision_only"
  | "promotion_not_executed"
  | "decision_store_not_written"
  | "formation_receipt_not_written"
  | "durable_state_not_applied"
  | "proof_not_created"
  | "evidence_not_created"
  | "claim_evidence_not_written"
  | "product_write_denied"
  | "provider_output_not_truth"
  | "retrieval_result_not_evidence"
  | "rag_context_preview_not_truth"
  | "feedback_not_truth"
  | "codex_result_not_authority"
  | "ci_pass_not_proof"
  | "smoke_pass_not_proof"
  | "pr_body_not_authority"
  | "git_ref_not_authority"
  | "raw_payload_blocked"
  | "secret_like_pattern_blocked"
  | "private_location_blocked"
  | "provider_call_not_executed"
  | "prompt_not_sent"
  | "retrieval_not_executed"
  | "rag_answer_not_generated"
  | "source_fetch_not_executed"
  | "file_read_not_executed"
  | "db_query_not_executed"
  | "db_write_not_executed"
  | "git_ledger_export_not_executed";

export interface PerspectivePromotionAuthorityBoundary {
  contract_only: true;
  promotion_runtime_now: false;
  promotion_decision_record_write_now: false;
  promotion_route_now: false;
  promotion_store_now: false;
  formation_receipt_write_now: false;
  durable_perspective_state_apply_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  work_mutation_now: false;
  db_query_or_write_now: false;
  source_fetch_now: false;
  local_file_read_now: false;
  repository_file_read_now: false;
  uploaded_file_read_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  embedding_created_now: false;
  vector_search_now: false;
  git_ledger_export_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  source_of_truth: false;
  candidate_is_fact: false;
  candidate_is_proof: false;
  candidate_is_accepted_evidence: false;
  provider_output_is_truth: false;
  retrieval_result_is_evidence: false;
  rag_context_is_truth: false;
  feedback_is_truth: false;
  ci_pass_is_proof: false;
  smoke_pass_is_proof: false;
  pr_body_is_authority: false;
  git_ref_is_authority: false;
}

export interface PerspectivePromotionBasisRef {
  basis_version: PerspectivePromotionBasisVersion;
  scope: PerspectivePromotionScope;
  basis_id: string;
  basis_kind: PerspectivePromotionBasisKind;
  basis_ref: string;
  source_refs: string[];
  candidate_refs: string[];
  review_record_refs: string[];
  rag_context_preview_refs: string[];
  retrieval_candidate_refs: string[];
  provider_candidate_refs: string[];
  feedback_refs: string[];
  bounded_summary: string;
  privacy_class: PerspectivePromotionPrivacyClass;
  redaction_status: PerspectivePromotionRedactionStatus;
  public_safe: boolean;
  reason_codes: PerspectivePromotionReasonCode[];
}

export interface PerspectivePromotionGateReport {
  gate_report_version: PerspectivePromotionGateReportVersion;
  contract_version: PerspectivePromotionRuntimeContractVersion;
  scope: PerspectivePromotionScope;
  gate_report_id: string;
  review_readiness: PerspectivePromotionReviewReadiness;
  decision_status: PerspectivePromotionDecisionStatus;
  review_record_ref: string;
  operator_actor_ref: string;
  source_refs: string[];
  basis_refs: PerspectivePromotionBasisRef[];
  claim_candidate_refs: string[];
  evidence_candidate_refs: string[];
  perspective_delta_candidate_refs: string[];
  unresolved_tension_refs: string[];
  knowledge_gap_refs: string[];
  unresolved_tension_policy: PerspectivePromotionTensionPolicy;
  knowledge_gap_policy: PerspectivePromotionKnowledgeGapPolicy;
  formation_receipt_policy: PerspectivePromotionFormationReceiptPolicy;
  blocked_reason_codes: PerspectivePromotionReasonCode[];
  boundary_notes: string[];
  authority_boundary: PerspectivePromotionAuthorityBoundary;
}

export interface PerspectivePromotionDecisionContract {
  decision_version: PerspectivePromotionDecisionVersion;
  contract_version: PerspectivePromotionRuntimeContractVersion;
  scope: PerspectivePromotionScope;
  promotion_decision_id: string;
  decision_kind: PerspectivePromotionDecisionKind;
  decision_status: PerspectivePromotionDecisionStatus;
  operator_actor_ref: string;
  explicit_user_action_required: true;
  future_operator_decision_only: true;
  review_record_ref: string;
  gate_report_ref: string;
  basis_refs: PerspectivePromotionBasisRef[];
  basis_claim_candidate_refs: string[];
  basis_evidence_candidate_refs: string[];
  perspective_delta_candidate_refs: string[];
  accepted_evidence_refs: string[];
  unresolved_tension_refs: string[];
  knowledge_gap_refs: string[];
  unresolved_tension_policy: PerspectivePromotionTensionPolicy;
  knowledge_gap_policy: PerspectivePromotionKnowledgeGapPolicy;
  formation_receipt_policy: PerspectivePromotionFormationReceiptPolicy;
  promotion_executed: false;
  decision_store_written: false;
  formation_receipt_written: false;
  durable_state_applied: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  product_write_executed: false;
  reason_codes: PerspectivePromotionReasonCode[];
  authority_boundary: PerspectivePromotionAuthorityBoundary;
}

export interface PerspectivePromotionContractBundle {
  bundle_version: PerspectivePromotionContractBundleVersion;
  contract_version: PerspectivePromotionRuntimeContractVersion;
  scope: PerspectivePromotionScope;
  status: PerspectivePromotionContractStatus;
  as_of: string;
  roadmap_ref: "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
  source_fixture_refs: string[];
  gate_reports: PerspectivePromotionGateReport[];
  decision_contracts: PerspectivePromotionDecisionContract[];
  basis_kind_counts: Record<PerspectivePromotionBasisKind, number>;
  decision_kind_counts: Record<PerspectivePromotionDecisionKind, number>;
  decision_status_counts: Record<PerspectivePromotionDecisionStatus, number>;
  review_readiness_counts: Record<PerspectivePromotionReviewReadiness, number>;
  tension_policy_counts: Record<PerspectivePromotionTensionPolicy, number>;
  knowledge_gap_policy_counts: Record<PerspectivePromotionKnowledgeGapPolicy, number>;
  formation_receipt_policy_counts: Record<
    PerspectivePromotionFormationReceiptPolicy,
    number
  >;
  privacy_class_counts: Record<PerspectivePromotionPrivacyClass, number>;
  redaction_status_counts: Record<PerspectivePromotionRedactionStatus, number>;
  boundary_notes: string[];
  reason_codes: PerspectivePromotionReasonCode[];
  authority_boundary: PerspectivePromotionAuthorityBoundary;
  bundle_fingerprint: string;
}

export interface PerspectivePromotionValidationResult {
  passed: boolean;
  failure_codes: string[];
}
