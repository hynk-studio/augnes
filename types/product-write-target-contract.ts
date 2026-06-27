// Contract-only Product Write Target Contract v0.1 shape.
// This file defines future product-write target contracts only. It does not
// implement product-write runtime, enable adapters, allocate product IDs,
// persist products, execute SQL transactions, query/write DB, add routes/UI,
// call providers, execute retrieval/RAG, execute Git/GitHub/Codex, create
// proof/evidence, promote Perspective, write/apply durable state, or write
// Formation Receipts.

export const ProductWriteTargetContractVersion =
  "product_write_target_contract.v0.1" as const;
export const ProductWriteTargetGroupVersion =
  "product_write_target_group.v0.1" as const;
export const ProductWriteTargetApprovalBindingVersion =
  "product_write_target_approval_binding.v0.1" as const;
export const ProductWriteTargetTransactionBoundaryVersion =
  "product_write_target_transaction_boundary.v0.1" as const;
export const ProductWriteTargetValidationFindingVersion =
  "product_write_target_validation_finding.v0.1" as const;
export const ProductWriteTargetContractBundleVersion =
  "product_write_target_contract_bundle.v0.1" as const;
export const ProductWriteTargetScope = "project:augnes" as const;

export const ProductWriteTargetStatuses = [
  "contract_only",
  "ready_for_future_reentry_review",
  "blocked_missing_prerequisite",
  "blocked_forbidden_target",
  "blocked_forbidden_authority",
  "blocked_product_write_execution",
  "blocked_private_or_raw_payload",
  "rejected",
] as const;
export type ProductWriteTargetStatus =
  (typeof ProductWriteTargetStatuses)[number];

export const ProductWriteTargetGroups = [
  "accepted_evidence_records",
  "proof_records",
  "work_items",
  "perspective_state_records",
  "formation_receipts",
  "product_activity_log",
] as const;
export type ProductWriteTargetGroup =
  (typeof ProductWriteTargetGroups)[number];

export const ProductWriteTargetFutureWriteIntents = [
  "future_write_accepted_evidence_after_promotion_and_receipt",
  "future_write_proof_record_after_formal_review",
  "future_write_work_item_after_operator_approval",
  "future_write_perspective_state_after_receipt_backed_apply",
  "future_write_formation_receipt_after_promotion_decision",
  "future_write_product_activity_log_after_explicit_write",
  "preview_only",
] as const;
export type ProductWriteTargetFutureWriteIntent =
  (typeof ProductWriteTargetFutureWriteIntents)[number];

export const ProductWriteTargetForbiddenWriteIntents = [
  "write_candidate_as_proof_now",
  "write_candidate_as_evidence_now",
  "write_provider_output_as_truth_now",
  "write_retrieval_result_as_evidence_now",
  "write_codex_result_as_state_now",
  "write_feedback_as_truth_now",
  "allocate_product_id_now",
  "execute_product_write_now",
  "bypass_promotion_decision",
  "bypass_formation_receipt",
  "bypass_operator_approval",
  "bypass_preview_to_write_diff",
  "write_without_source_refs",
  "write_without_audit_trail",
  "mutate_durable_state_from_product_write",
  "create_work_item_from_provider_output",
  "create_proof_from_rag_answer",
] as const;
export type ProductWriteTargetForbiddenWriteIntent =
  (typeof ProductWriteTargetForbiddenWriteIntents)[number];

export const ProductWriteTargetPrerequisiteKinds = [
  "promotion_decision_ref",
  "formation_receipt_ref",
  "review_record_ref",
  "source_refs",
  "accepted_evidence_refs",
  "durable_state_ref",
  "operator_approval_ref",
  "product_write_reentry_review_ref",
  "product_write_target_contract_ref",
] as const;
export type ProductWriteTargetPrerequisiteKind =
  (typeof ProductWriteTargetPrerequisiteKinds)[number];

export const ProductWriteTargetIdempotencyPolicies = [
  "stable_idempotency_key_required",
  "target_group_scoped_idempotency_key",
  "operator_approval_bound_idempotency_key",
  "preview_to_write_diff_bound_idempotency_key",
  "write_attempt_replay_must_be_noop",
] as const;
export type ProductWriteTargetIdempotencyPolicy =
  (typeof ProductWriteTargetIdempotencyPolicies)[number];

export const ProductWriteTargetTransactionBoundaryPolicies = [
  "single_target_group_transaction_required",
  "cross_target_group_transaction_forbidden_without_future_contract",
  "sql_transaction_preview_only",
  "no_sql_transaction_now",
  "rollback_plan_required_before_future_write",
] as const;
export type ProductWriteTargetTransactionBoundaryPolicy =
  (typeof ProductWriteTargetTransactionBoundaryPolicies)[number];

export const ProductWriteTargetRollbackPolicies = [
  "rollback_plan_required",
  "abort_before_partial_write_required",
  "compensating_action_requires_future_contract",
  "rollback_is_not_product_write_authority",
] as const;
export type ProductWriteTargetRollbackPolicy =
  (typeof ProductWriteTargetRollbackPolicies)[number];

export const ProductWriteTargetAuditTrailPolicies = [
  "audit_trail_required",
  "product_activity_log_is_audit_only",
  "git_ledger_packet_ref_required",
  "runtime_audit_ref_required",
  "audit_trail_is_not_truth",
] as const;
export type ProductWriteTargetAuditTrailPolicy =
  (typeof ProductWriteTargetAuditTrailPolicies)[number];

export const ProductWriteTargetReasonCodes = [
  "roadmap_file_present",
  "product_write_reentry_review_ref_present",
  "disabled_adapter_harness_ref_present",
  "github_actuation_contract_ref_present",
  "git_ledger_export_ref_present",
  "privacy_guard_required",
  "local_data_export_policy_required",
  "authority_boundary_regression_required",
  "product_write_target_contract_only",
  "product_write_remains_parked",
  "product_write_denied",
  "product_write_execution_not_implemented",
  "product_write_adapter_not_enabled",
  "product_id_allocation_not_executed",
  "product_persistence_not_executed",
  "promotion_decision_required",
  "formation_receipt_required",
  "review_record_required",
  "operator_approval_required",
  "source_refs_required",
  "accepted_evidence_refs_required",
  "preview_to_write_diff_required",
  "idempotency_key_required",
  "transaction_boundary_required",
  "rollback_policy_required",
  "audit_trail_required",
  "target_group_defined",
  "owner_surface_defined",
  "schema_ref_defined",
  "candidate_not_proof",
  "candidate_not_accepted_evidence",
  "provider_output_not_truth",
  "retrieval_result_not_evidence",
  "codex_result_not_state",
  "feedback_not_truth",
  "product_activity_log_not_product_write_authority",
  "raw_private_payload_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "provider_thread_run_session_id_blocked",
  "db_write_not_executed",
  "sql_transaction_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "work_item_not_created",
  "promotion_not_executed",
  "durable_state_not_mutated",
  "formation_receipt_not_written",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "git_write_not_executed",
  "github_api_not_called",
  "repository_file_not_written",
  "codex_not_executed",
  "smoke_pass_not_truth",
  "ci_pass_not_truth",
] as const;
export type ProductWriteTargetReasonCode =
  (typeof ProductWriteTargetReasonCodes)[number];

export interface ProductWriteTargetAuthorityBoundary {
  product_write_target_contract_now: true;
  contract_only: true;
  future_reentry_review_required: true;
  operator_approval_required_for_future_write: true;
  promotion_decision_required: true;
  formation_receipt_required: true;
  source_refs_required: true;
  preview_to_write_diff_required: true;
  audit_trail_required: true;
  rollback_policy_required: true;
  product_write_now: false;
  product_write_runtime_now: false;
  product_write_adapter_enabled_now: false;
  product_write_target_contract_runtime_now: false;
  product_id_allocation_now: false;
  product_persistence_now: false;
  product_route_now: false;
  product_ui_now: false;
  sql_transaction_now: false;
  db_query_or_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  work_item_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  github_api_call_now: false;
  repository_file_write_now: false;
  local_file_export_now: false;
  local_file_import_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  candidate_is_proof: false;
  candidate_is_accepted_evidence: false;
  provider_output_is_truth: false;
  retrieval_result_is_evidence: false;
  codex_result_is_state: false;
  feedback_is_truth: false;
  product_id_is_allocated: false;
  preview_is_write_approval: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface ProductWriteTargetGroupContract {
  target_group_version: typeof ProductWriteTargetGroupVersion;
  contract_version: typeof ProductWriteTargetContractVersion;
  scope: typeof ProductWriteTargetScope;
  status: ProductWriteTargetStatus;
  target_group: ProductWriteTargetGroup;
  owner_surface: string;
  schema_ref: string;
  allowed_future_write_intents: ProductWriteTargetFutureWriteIntent[];
  forbidden_write_intents: ProductWriteTargetForbiddenWriteIntent[];
  required_prerequisites: ProductWriteTargetPrerequisiteKind[];
  idempotency_key_policy: ProductWriteTargetIdempotencyPolicy[];
  transaction_boundary_policy: ProductWriteTargetTransactionBoundaryPolicy[];
  rollback_policy: ProductWriteTargetRollbackPolicy[];
  audit_trail_policy: ProductWriteTargetAuditTrailPolicy[];
  source_refs_policy: string;
  operator_approval_policy: string;
  preview_to_write_diff_policy: string;
  boundary_notes: string[];
  reason_codes: ProductWriteTargetReasonCode[];
  authority_boundary: ProductWriteTargetAuthorityBoundary;
}

export interface ProductWriteTargetApprovalBinding {
  approval_binding_version: typeof ProductWriteTargetApprovalBindingVersion;
  contract_version: typeof ProductWriteTargetContractVersion;
  scope: typeof ProductWriteTargetScope;
  approval_binding_ref: string;
  operator_approval_ref: string;
  promotion_decision_ref: string;
  formation_receipt_ref: string;
  review_record_ref: string;
  source_refs: string[];
  accepted_evidence_refs: string[];
  durable_state_ref?: string;
  product_write_reentry_review_ref: string;
  product_write_target_contract_ref: string;
  preview_to_write_diff_ref: string;
  authority_boundary_acknowledgements: ProductWriteTargetReasonCode[];
  product_write_acknowledgement: false | "blocked";
  authority_boundary: ProductWriteTargetAuthorityBoundary;
}

export interface ProductWriteTargetTransactionBoundary {
  transaction_boundary_version: typeof ProductWriteTargetTransactionBoundaryVersion;
  contract_version: typeof ProductWriteTargetContractVersion;
  scope: typeof ProductWriteTargetScope;
  transaction_boundary_ref: string;
  target_group: ProductWriteTargetGroup;
  idempotency_key_ref: string;
  transaction_boundary_policy: ProductWriteTargetTransactionBoundaryPolicy[];
  rollback_policy: ProductWriteTargetRollbackPolicy[];
  audit_trail_policy: ProductWriteTargetAuditTrailPolicy[];
  sql_transaction_status: "not_executed" | "preview_only" | "blocked";
  rollback_or_abort_plan_ref: string;
  boundary_notes: string[];
  reason_codes: ProductWriteTargetReasonCode[];
  authority_boundary: ProductWriteTargetAuthorityBoundary;
}

export interface ProductWriteTargetValidationFinding {
  finding_version: typeof ProductWriteTargetValidationFindingVersion;
  scope: typeof ProductWriteTargetScope;
  finding_id: string;
  path: string;
  finding_kind:
    | "missing_prerequisite"
    | "forbidden_target"
    | "forbidden_authority"
    | "product_write_execution"
    | "private_or_raw_payload"
    | "invalid_contract";
  severity: "info" | "warning" | "critical";
  action: "blocked" | "reference_only" | "allowed";
  reason_codes: ProductWriteTargetReasonCode[];
  public_safe_summary: string;
  original_value_included: false;
}

export interface ProductWriteTargetContractBundle {
  bundle_version: typeof ProductWriteTargetContractBundleVersion;
  contract_version: typeof ProductWriteTargetContractVersion;
  target_group_version: typeof ProductWriteTargetGroupVersion;
  approval_binding_version: typeof ProductWriteTargetApprovalBindingVersion;
  transaction_boundary_version: typeof ProductWriteTargetTransactionBoundaryVersion;
  scope: typeof ProductWriteTargetScope;
  status: ProductWriteTargetStatus;
  as_of: string;
  roadmap_ref: "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
  product_write_reentry_review_ref: string;
  disabled_adapter_harness_ref: string;
  github_actuation_contract_ref: string;
  target_group_refs: string[];
  target_groups?: ProductWriteTargetGroupContract[];
  approval_binding_ref: string;
  approval_binding?: ProductWriteTargetApprovalBinding;
  transaction_boundary_ref: string;
  transaction_boundary?: ProductWriteTargetTransactionBoundary;
  validation_finding_refs: string[];
  validation_findings?: ProductWriteTargetValidationFinding[];
  boundary_notes: string[];
  reason_codes: ProductWriteTargetReasonCode[];
  authority_boundary: ProductWriteTargetAuthorityBoundary;
}
