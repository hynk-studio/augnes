export const ProductWriteAcceptedEvidenceRefRuntimeVersion =
  "product_write_accepted_evidence_ref_runtime.v0.1" as const;
export const ProductWriteAcceptedEvidenceRefRequestVersion =
  "product_write_accepted_evidence_ref_request.v0.1" as const;
export const ProductWriteAcceptedEvidenceRefRecordVersion =
  "product_write_accepted_evidence_ref_record.v0.1" as const;
export const ProductWriteAcceptedEvidenceRefStoreVersion =
  "product_write_accepted_evidence_ref_store.v0.1" as const;
export const ProductWriteAcceptedEvidenceRefRouteVersion =
  "product_write_accepted_evidence_ref_route.v0.1" as const;
export const ProductWriteAcceptedEvidenceRefOperatorApprovalPayloadVersion =
  "product_write_accepted_evidence_ref_operator_approval_payload.v0.1" as const;
export const ProductWriteAcceptedEvidenceRefScope = "project:augnes" as const;
export const ProductWriteAcceptedEvidenceRefTargetGroup =
  "accepted_evidence_records" as const;
export const ProductWriteAcceptedEvidenceRefRuntimeSliceRef =
  "product_write_accepted_evidence_ref_runtime_v0_1" as const;

export type ProductWriteAcceptedEvidenceRefStatus =
  | "written"
  | "idempotent_existing"
  | "listed"
  | "read"
  | "not_found"
  | "conflict_existing_idempotency_key"
  | "blocked_invalid_payload"
  | "blocked_forbidden_authority"
  | "blocked_private_or_raw_payload"
  | "blocked_missing_prerequisite"
  | "blocked_schema_missing"
  | "blocked_invalid_input";

export type ProductWriteAcceptedEvidenceRefReasonCode =
  | "payload_valid"
  | "payload_invalid"
  | "forbidden_authority_blocked"
  | "forbidden_authority_absent"
  | "private_or_raw_payload_blocked"
  | "private_or_raw_payload_absent"
  | "secret_like_pattern_blocked"
  | "local_path_blocked"
  | "private_url_blocked"
  | "raw_source_body_blocked"
  | "raw_provider_output_blocked"
  | "raw_retrieval_output_blocked"
  | "raw_db_row_blocked"
  | "raw_conversation_blocked"
  | "hidden_reasoning_blocked"
  | "telemetry_dump_blocked"
  | "raw_diff_blocked"
  | "promotion_decision_ref_present"
  | "promotion_decision_ref_missing"
  | "promotion_decision_store_missing"
  | "promotion_decision_not_promote"
  | "promotion_decision_not_eligible"
  | "promotion_decision_discarded"
  | "promotion_decision_review_record_mismatch"
  | "promotion_decision_operator_mismatch"
  | "promotion_decision_forbidden_authority"
  | "formation_receipt_ref_present"
  | "formation_receipt_ref_missing"
  | "formation_receipt_store_missing"
  | "formation_receipt_not_written"
  | "formation_receipt_discarded"
  | "formation_receipt_promotion_decision_mismatch"
  | "formation_receipt_review_record_mismatch"
  | "formation_receipt_operator_mismatch"
  | "formation_receipt_source_ref_mismatch"
  | "formation_receipt_forbidden_authority"
  | "review_record_ref_present"
  | "review_record_ref_missing"
  | "public_safe_source_refs_present"
  | "public_safe_source_refs_missing"
  | "accepted_evidence_refs_present"
  | "accepted_evidence_refs_missing"
  | "accepted_evidence_ref_not_backed_by_promotion_decision"
  | "operator_approval_present"
  | "operator_approval_missing"
  | "operator_approval_payload_present"
  | "operator_approval_payload_missing"
  | "operator_approval_is_not_proof"
  | "operator_approval_is_not_product_write_authority"
  | "operator_approval_payload_mismatch"
  | "product_write_reentry_review_ref_present"
  | "product_write_reentry_review_ref_missing"
  | "product_write_target_contract_ref_present"
  | "product_write_target_contract_ref_missing"
  | "preview_to_write_diff_ref_present"
  | "preview_to_write_diff_ref_missing"
  | "preview_to_write_diff_is_not_write_approval"
  | "rollback_or_abort_plan_ref_present"
  | "rollback_or_abort_plan_ref_missing"
  | "idempotency_key_present"
  | "idempotency_key_missing"
  | "idempotency_key_scope_mismatch"
  | "idempotent_replay"
  | "idempotency_conflict"
  | "accepted_evidence_ref_write_record_written"
  | "accepted_evidence_ref_write_is_not_proof"
  | "accepted_evidence_ref_write_is_not_truth"
  | "accepted_evidence_ref_write_is_not_durable_perspective_state"
  | "accepted_evidence_ref_write_is_not_product_id_allocation"
  | "source_refs_are_lineage_pointers_not_proof"
  | "promotion_decision_is_prerequisite_not_command"
  | "formation_receipt_is_prerequisite_not_product_write_authority"
  | "db_write_executed_for_accepted_evidence_ref_record_only"
  | "db_schema_checked"
  | "db_schema_missing"
  | "product_write_minimal_runtime_first_target_only"
  | "product_write_adapter_not_enabled"
  | "product_id_allocation_not_executed"
  | "broad_product_persistence_not_executed"
  | "product_object_not_created"
  | "product_profile_not_created"
  | "product_publication_not_executed"
  | "release_execution_not_executed"
  | "proof_not_created"
  | "evidence_not_created"
  | "claim_evidence_not_written"
  | "work_item_not_created"
  | "promotion_not_executed"
  | "formation_receipt_not_written_now"
  | "durable_state_not_mutated"
  | "provider_call_not_executed"
  | "prompt_not_sent"
  | "source_fetch_not_executed"
  | "retrieval_not_executed"
  | "rag_answer_not_generated"
  | "git_write_not_executed"
  | "github_api_not_called"
  | "repository_file_not_written"
  | "audit_event_is_not_truth"
  | "audit_event_is_not_proof"
  | "audit_event_is_not_approval"
  | "audit_event_is_not_durable_state"
  | "audit_event_is_not_product_authority"
  | "smoke_pass_is_not_truth"
  | "ci_pass_is_not_truth";

export interface ProductWriteAcceptedEvidenceRefOperatorApprovalPayload {
  payload_version: typeof ProductWriteAcceptedEvidenceRefOperatorApprovalPayloadVersion;
  approval_ref: string;
  approved: true;
  approved_at: string;
  approved_target_group: typeof ProductWriteAcceptedEvidenceRefTargetGroup;
  approved_runtime_slice: typeof ProductWriteAcceptedEvidenceRefRuntimeSliceRef;
  operator_actor_ref: string;
  promotion_decision_ref: string;
  formation_receipt_ref: string;
  preview_to_write_diff_ref: string;
  rollback_or_abort_plan_ref: string;
  bounded_summary: string;
  authority_boundary_acknowledged: true;
}

export interface ProductWriteAcceptedEvidenceRefCreateInput {
  request_version: typeof ProductWriteAcceptedEvidenceRefRequestVersion;
  runtime_version: typeof ProductWriteAcceptedEvidenceRefRuntimeVersion;
  scope: typeof ProductWriteAcceptedEvidenceRefScope;
  target_group: typeof ProductWriteAcceptedEvidenceRefTargetGroup;
  idempotency_key: string;
  promotion_decision_ref: string;
  formation_receipt_ref: string;
  review_record_ref: string;
  public_safe_source_refs: string[];
  accepted_evidence_refs: string[];
  product_write_reentry_review_ref: string;
  product_write_target_contract_ref: string;
  preview_to_write_diff_ref: string;
  rollback_or_abort_plan_ref: string;
  operator_approval_payload: ProductWriteAcceptedEvidenceRefOperatorApprovalPayload;
  reason_codes: ProductWriteAcceptedEvidenceRefReasonCode[];
  boundary_notes: string[];
  authority_boundary?: Record<string, unknown>;
  created_at?: string;
}

export interface ProductWriteAcceptedEvidenceRefAuthorityBoundary {
  product_write_accepted_evidence_ref_runtime_now: true;
  product_write_minimal_runtime_first_target_only: true;
  accepted_evidence_ref_write_now: boolean;
  accepted_evidence_records_target_group_only: true;
  caller_injected_db_only: true;
  same_origin_route_now: boolean;
  audit_event_optional: true;
  audit_event_failure_fails_primary_route_now: false;
  operator_approval_required: true;
  promotion_decision_required: true;
  formation_receipt_required: true;
  review_record_required: true;
  public_safe_source_refs_required: true;
  preview_to_write_diff_required: true;
  rollback_or_abort_plan_required: true;
  idempotency_key_required: true;
  db_query_or_write_now: boolean;
  product_write_adapter_enabled_now: false;
  product_id_allocation_now: false;
  broad_product_persistence_now: false;
  product_persistence_now: false;
  product_object_creation_now: false;
  product_profile_creation_now: false;
  product_publication_now: false;
  product_route_beyond_accepted_evidence_refs_now: false;
  product_ui_now: false;
  release_execution_now: false;
  release_publication_now: false;
  github_actuation_now: false;
  github_api_call_now: false;
  git_write_now: false;
  branch_creation_now: false;
  commit_creation_now: false;
  pull_request_creation_now: false;
  repository_file_write_from_runtime_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  final_rag_answer_generation_now: false;
  final_rag_answer_automatic_promotion_now: false;
  proof_creation_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  work_item_creation_now: false;
  durable_perspective_state_mutation_from_product_write_now: false;
  durable_perspective_state_write_now: false;
  durable_perspective_state_apply_now: false;
  formation_receipt_write_now: false;
  promotion_execution_now: false;
  background_job_now: false;
  automatic_crawling_now: false;
  automatic_source_fetching_now: false;
  hidden_reasoning_storage_now: false;
  raw_private_data_persistence_now: false;
  accepted_evidence_ref_write_is_truth: false;
  accepted_evidence_ref_write_is_proof: false;
  accepted_evidence_ref_write_is_durable_perspective_state: false;
  accepted_evidence_ref_write_is_product_id_allocation: false;
  operator_approval_is_proof: false;
  preview_to_write_diff_is_write_approval: false;
  source_refs_are_proof: false;
  promotion_decision_is_automatic_execution_command: false;
  formation_receipt_is_product_write_authority: false;
  audit_event_is_truth: false;
  audit_event_is_proof: false;
  audit_event_is_approval: false;
  audit_event_is_durable_state: false;
  audit_event_is_product_authority: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority_beyond_accepted_evidence_ref_write: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface ProductWriteAcceptedEvidenceRefRecord {
  record_version: typeof ProductWriteAcceptedEvidenceRefRecordVersion;
  store_version: typeof ProductWriteAcceptedEvidenceRefStoreVersion;
  runtime_version: typeof ProductWriteAcceptedEvidenceRefRuntimeVersion;
  scope: typeof ProductWriteAcceptedEvidenceRefScope;
  target_group: typeof ProductWriteAcceptedEvidenceRefTargetGroup;
  accepted_evidence_ref_write_id: string;
  idempotency_key: string;
  payload_fingerprint: string;
  promotion_decision_ref: string;
  formation_receipt_ref: string;
  review_record_ref: string;
  public_safe_source_refs: string[];
  accepted_evidence_refs: string[];
  product_write_reentry_review_ref: string;
  product_write_target_contract_ref: string;
  preview_to_write_diff_ref: string;
  rollback_or_abort_plan_ref: string;
  operator_approval_ref: string;
  operator_actor_ref: string;
  operator_approval_payload: ProductWriteAcceptedEvidenceRefOperatorApprovalPayload;
  accepted_evidence_ref_write_record_written: true;
  product_id_allocated: false;
  broad_product_persistence_executed: false;
  product_write_adapter_enabled: false;
  proof_created: false;
  evidence_created: false;
  claim_evidence_written: false;
  work_item_created: false;
  promotion_executed: false;
  formation_receipt_written_now: false;
  durable_perspective_state_mutated: false;
  accepted_evidence_ref_write_is_truth: false;
  accepted_evidence_ref_write_is_proof: false;
  accepted_evidence_ref_write_is_durable_perspective_state: false;
  accepted_evidence_ref_write_is_product_id_allocation: false;
  operator_approval_is_proof: false;
  preview_to_write_diff_is_write_approval: false;
  source_refs_are_lineage_pointers: true;
  promotion_decision_is_prerequisite_not_command: true;
  formation_receipt_is_prerequisite_not_product_write_authority: true;
  audit_event_is_product_authority: false;
  reason_codes: ProductWriteAcceptedEvidenceRefReasonCode[];
  boundary_notes: string[];
  authority_boundary: ProductWriteAcceptedEvidenceRefAuthorityBoundary;
  created_at: string;
  updated_at: string;
}

export interface ProductWriteAcceptedEvidenceRefListFilters {
  promotion_decision_ref?: string;
  formation_receipt_ref?: string;
  review_record_ref?: string;
  operator_approval_ref?: string;
  limit?: number;
}

export interface ProductWriteAcceptedEvidenceRefResult {
  store_version: typeof ProductWriteAcceptedEvidenceRefStoreVersion;
  record_version: typeof ProductWriteAcceptedEvidenceRefRecordVersion;
  runtime_version: typeof ProductWriteAcceptedEvidenceRefRuntimeVersion;
  scope: typeof ProductWriteAcceptedEvidenceRefScope;
  target_group: typeof ProductWriteAcceptedEvidenceRefTargetGroup;
  status: ProductWriteAcceptedEvidenceRefStatus;
  record: ProductWriteAcceptedEvidenceRefRecord | null;
  records: ProductWriteAcceptedEvidenceRefRecord[];
  error_code: ProductWriteAcceptedEvidenceRefStatus | null;
  reason_codes: ProductWriteAcceptedEvidenceRefReasonCode[];
  accepted_evidence_ref_write_record_written: boolean;
  idempotent_replay: boolean;
  product_id_allocated: false;
  broad_product_persistence_executed: false;
  product_write_adapter_enabled: false;
  proof_created: false;
  evidence_created: false;
  claim_evidence_written: false;
  work_item_created: false;
  promotion_executed: false;
  formation_receipt_written_now: false;
  durable_perspective_state_mutated: false;
  authority_boundary: ProductWriteAcceptedEvidenceRefAuthorityBoundary;
}
