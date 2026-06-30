export const DogfoodingToReviewMemoryProposalVersionV01 =
  "dogfooding_to_review_memory_proposal.v0.1" as const;
export const DogfoodingToReviewMemoryProposalBuilderVersionV01 =
  "dogfooding_to_review_memory_proposal_builder.v0.1" as const;
export const DogfoodingToReviewMemoryProposalScopeV01 = "project:augnes" as const;
export const DogfoodingToReviewMemoryProposalSliceV01 =
  "dogfooding_record_to_review_memory_proposal_v0_1" as const;
export const DogfoodingToReviewMemoryProposalNextSliceV01 =
  "local_data_export_manifest_builder_v0_1" as const;

export const DogfoodingToReviewMemoryProposalStatusesV01 = [
  "proposed",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "rejected",
] as const;
export type DogfoodingToReviewMemoryProposalStatusV01 =
  (typeof DogfoodingToReviewMemoryProposalStatusesV01)[number];

export const DogfoodingToReviewMemoryProposalActionCandidatesV01 = [
  "save_review_note",
  "request_more_evidence",
  "mark_needs_followup",
  "mark_validation_incomplete",
  "mark_superseded",
  "mark_duplicate",
  "prepare_handoff_later",
] as const;
export type DogfoodingToReviewMemoryProposalActionCandidateV01 =
  (typeof DogfoodingToReviewMemoryProposalActionCandidatesV01)[number];

export interface DogfoodingToReviewMemoryProposalAuthorityBoundaryV01 {
  dogfooding_record_to_review_memory_proposal_builder_now: true;
  caller_provided_public_safe_dogfooding_material_only: true;
  candidate_only_review_memory_proposal: true;
  operator_confirmation_required: true;
  review_memory_write_preview_only: true;
  db_read_now: false;
  db_write_now: false;
  route_now: false;
  ui_now: false;
  component_now: false;
  cockpit_change_now: false;
  public_surface_change_now: false;
  route_model_change_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  retrieval_index_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  review_memory_write_now: false;
  review_memory_write_executed: false;
  promotion_execution_now: false;
  promotion_decision_record_write_now: false;
  formation_receipt_write_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  codex_execution_from_augnes_runtime_now: false;
  github_api_call_now: false;
  git_write_now: false;
  github_git_actuation_now: false;
  release_deploy_publish_now: false;
  dogfooding_record_to_review_memory_proposal_is_review_memory_write: false;
  dogfooding_record_to_review_memory_proposal_is_execution_approval: false;
  dogfooding_record_to_review_memory_proposal_is_truth: false;
  dogfooding_record_to_review_memory_proposal_is_proof: false;
  dogfooding_record_to_review_memory_proposal_is_accepted_evidence: false;
  review_memory_proposal_is_saved_review_memory: false;
  review_memory_proposal_is_promotion: false;
  review_memory_proposal_is_formation_receipt: false;
  review_memory_proposal_is_durable_perspective_state: false;
  review_memory_proposal_is_product_write: false;
  proposed_review_action_is_executed_action: false;
  proposed_save_review_note_is_review_memory_write: false;
  proposed_request_more_evidence_is_source_fetch: false;
  proposed_mark_needs_followup_is_automatic_task_creation: false;
  proposed_mark_validation_incomplete_is_validation_failure: false;
  proposed_mark_superseded_is_deletion: false;
  proposed_mark_duplicate_is_deletion: false;
  proposed_prepare_handoff_later_is_execution_approval: false;
  pr_body_is_truth: false;
  changed_files_are_proof: false;
  observed_files_are_proof: false;
  validation_pass_is_approval: false;
  validation_failure_is_rejection: false;
  smoke_pass_is_evidence: false;
  smoke_failure_is_rejection: false;
  ci_pass_is_authority: false;
  ci_failure_is_rejection: false;
  skipped_checks_are_automatic_failure: false;
  known_warnings_are_automatic_rejection: false;
  not_done_items_are_automatic_task_creation: false;
  expected_observed_delta_is_approval_or_rejection: false;
  review_memory_refs_are_reference_only: true;
  promotion_receipt_state_refs_are_reference_only: true;
  git_ref_is_authority: false;
  github_pr_ref_is_authority: false;
}

export interface DogfoodingToReviewMemoryProposalActionBoundaryV01 {
  candidate_action_only: true;
  executed: false;
  proposed_action_is_executed_action: false;
  proposed_save_review_note_is_review_memory_write: false;
  proposed_request_more_evidence_is_source_fetch: false;
  proposed_mark_needs_followup_is_automatic_task_creation: false;
  proposed_mark_validation_incomplete_is_validation_failure: false;
  proposed_mark_superseded_is_deletion: false;
  proposed_mark_duplicate_is_deletion: false;
  proposed_prepare_handoff_later_is_execution_approval: false;
}

export interface DogfoodingToReviewMemoryProposalActionV01 {
  action: DogfoodingToReviewMemoryProposalActionCandidateV01;
  rationale: string;
  source_refs: string[];
  candidate_only: true;
  executed: false;
  authority_boundary: DogfoodingToReviewMemoryProposalActionBoundaryV01;
}

export interface DogfoodingToReviewMemoryProposalPrivacyReportV01 {
  status: string;
  findings: unknown[];
  blocked_paths: string[];
  redacted_paths: string[];
  reason_codes: string[];
  boundary_notes: string[];
}

export interface DogfoodingToReviewMemoryWritePreviewV01 {
  preview_kind: "review_memory_write_preview_only";
  target_contract_ref: "research_candidate_review_memory_contract.v0.1";
  candidate_record_kind: "operator_review_note";
  candidate_ref: string;
  bounded_summary: string;
  source_refs: string[];
  write_executed: false;
  operator_confirmation_required: true;
  preview_only: true;
  authority_boundary: {
    review_memory_write_preview_is_write: false;
    proposed_save_review_note_is_review_memory_write: false;
    operator_confirmation_required_before_write: true;
  };
}

export interface DogfoodingToReviewMemoryProposalV01 {
  proposal_id: string;
  proposal_version: typeof DogfoodingToReviewMemoryProposalVersionV01;
  builder_version: typeof DogfoodingToReviewMemoryProposalBuilderVersionV01;
  scope: typeof DogfoodingToReviewMemoryProposalScopeV01;
  created_at: string;
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
  candidate_review_summary: string;
  proposed_review_actions: DogfoodingToReviewMemoryProposalActionV01[];
  operator_confirmation_required: true;
  review_memory_write_preview: DogfoodingToReviewMemoryWritePreviewV01;
  review_memory_write_executed: false;
  authority_boundary: DogfoodingToReviewMemoryProposalAuthorityBoundaryV01;
  forbidden_capabilities: string[];
  privacy_report: DogfoodingToReviewMemoryProposalPrivacyReportV01;
  reason_codes: string[];
  proposal_fingerprint: string;
}

export interface DogfoodingToReviewMemoryProposalResultV01 {
  ok: boolean;
  status: DogfoodingToReviewMemoryProposalStatusV01;
  error_code: DogfoodingToReviewMemoryProposalStatusV01 | null;
  proposal: DogfoodingToReviewMemoryProposalV01 | null;
  source_record_refs: string[];
  reason_codes: string[];
  privacy_report: DogfoodingToReviewMemoryProposalPrivacyReportV01 | null;
  authority_boundary: DogfoodingToReviewMemoryProposalAuthorityBoundaryV01;
  product_write_executed: false;
  review_memory_written: false;
  review_memory_write_executed: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  promotion_executed: false;
  formation_receipt_written: false;
  durable_state_applied: false;
  github_git_actuated: false;
  provider_called: false;
  retrieval_executed: false;
  source_fetched: false;
  release_deploy_publish_executed: false;
  db_read_executed: false;
  db_write_executed: false;
}
