import type { PrivacyRedactionRuntimeGuardReport } from "@/lib/privacy/redaction-guard";

export const ConversationHandoffPacketVersionV02 =
  "conversation_handoff_packet.v0.2" as const;
export const ConversationHandoffPacketBuilderVersionV02 =
  "conversation_handoff_packet_builder.v0.2" as const;
export const ConversationHandoffPacketInputVersionV02 =
  "conversation_handoff_packet_input.v0.2" as const;
export const ConversationHandoffPacketScopeV02 = "project:augnes" as const;
export const ConversationHandoffPacketSliceV02 =
  "conversation_handoff_packet_builder_v0_2" as const;
export const ConversationHandoffPacketNextSliceV02 =
  "conversation_handoff_packet_from_dogfooding_record_v0_1" as const;

export const ConversationHandoffPacketProfilesV02 = [
  "chatgpt_strategy",
  "codex_implementation",
  "codex_pr_review",
  "human_operator_review",
  "boundary_audit",
  "handoff_minimal",
  "release_readiness_review",
] as const;
export type ConversationHandoffPacketProfileV02 =
  (typeof ConversationHandoffPacketProfilesV02)[number];

export const ConversationHandoffPacketSectionIdsV02 = [
  "project_context",
  "current_baseline",
  "current_task",
  "expected_files",
  "observed_files",
  "expected_checks",
  "observed_checks",
  "expected_observed_delta",
  "known_warnings",
  "skipped_checks_and_reason",
  "not_done_classification",
  "source_refs",
  "dogfooding_record_refs",
  "review_memory_refs",
  "promotion_receipt_state_refs",
  "unresolved_tensions",
  "authority_boundary",
  "forbidden_capabilities",
  "stop_conditions",
  "pr_body_requirements",
  "validation_commands",
  "next_recommended_slice",
] as const;
export type ConversationHandoffPacketSectionIdV02 =
  (typeof ConversationHandoffPacketSectionIdsV02)[number];

export const ConversationHandoffPacketBuildStatusesV02 = [
  "built",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "rejected",
] as const;
export type ConversationHandoffPacketBuildStatusV02 =
  (typeof ConversationHandoffPacketBuildStatusesV02)[number];

export const ConversationHandoffPacketReasonCodesV02 = [
  "conversation_handoff_packet_builder_present",
  "caller_provided_input_only",
  "public_safe_summary_only",
  "deterministic_plain_text_packet",
  "candidate_only_conversation_guidance",
  "profile_specific_section_order",
  "authority_boundary_preserved",
  "forbidden_capabilities_preserved",
  "expected_observed_delta_preserved",
  "skipped_checks_preserved",
  "known_warnings_preserved",
  "not_done_preserved",
  "next_slice_is_cue_not_execution_approval",
  "handoff_packet_not_truth",
  "handoff_packet_not_proof",
  "handoff_packet_not_execution_approval",
  "expected_files_not_write_authority",
  "observed_files_not_proof",
  "validation_pass_not_approval",
  "validation_failure_not_rejection",
  "ci_pass_not_authority",
  "ci_failure_diagnostic_only",
  "pr_body_not_authority",
  "codex_report_not_execution_approval",
  "dogfooding_record_candidate_only",
  "review_memory_refs_reference_only",
  "promotion_receipt_state_refs_reference_only",
  "product_write_denied",
  "review_memory_not_written",
  "promotion_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "durable_state_not_applied",
  "formation_receipt_not_written",
  "provider_call_not_executed",
  "retrieval_not_executed",
  "source_fetch_not_executed",
  "git_github_not_executed",
  "release_not_executed",
  "privacy_guard_applied",
  "raw_private_payload_blocked",
  "forbidden_authority_blocked",
] as const;
export type ConversationHandoffPacketReasonCodeV02 =
  (typeof ConversationHandoffPacketReasonCodesV02)[number];

export interface ConversationHandoffPacketAuthorityBoundaryV02 {
  conversation_handoff_packet_builder_now: true;
  caller_provided_input_only: true;
  public_safe_summary_only: true;
  candidate_only_conversation_guidance: true;
  ui_now: false;
  component_now: false;
  cockpit_change_now: false;
  public_surface_change_now: false;
  route_model_change_now: false;
  api_route_now: false;
  db_migration_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  retrieval_index_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  review_memory_write_now: false;
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
  handoff_packet_is_execution_approval: false;
  handoff_packet_is_truth: false;
  handoff_packet_is_proof: false;
  handoff_packet_is_accepted_evidence: false;
  expected_files_are_write_authority: false;
  observed_files_are_proof: false;
  expected_checks_are_proof: false;
  observed_checks_are_approval: false;
  validation_pass_is_approval: false;
  validation_failure_is_rejection: false;
  smoke_pass_is_evidence: false;
  smoke_failure_is_rejection: false;
  ci_pass_is_authority: false;
  ci_failure_is_rejection: false;
  pr_body_is_authority: false;
  codex_report_is_execution_approval: false;
  dogfooding_record_is_candidate_only: true;
  review_memory_refs_are_reference_only: true;
  promotion_receipt_state_refs_are_reference_only: true;
  git_ref_is_authority: false;
  github_pr_ref_is_authority: false;
  next_recommended_slice_is_execution_approval: false;
}

export interface ConversationHandoffPacketSectionV02 {
  section_id: ConversationHandoffPacketSectionIdV02;
  title: string;
  body_lines: string[];
  source_field_refs: string[];
}

export interface ConversationHandoffPacketInputV02 {
  input_version?: typeof ConversationHandoffPacketInputVersionV02;
  packet_id: string;
  packet_version?: typeof ConversationHandoffPacketVersionV02;
  scope: typeof ConversationHandoffPacketScopeV02;
  profile: ConversationHandoffPacketProfileV02;
  created_at?: string;
  project_context?: unknown;
  current_baseline?: unknown;
  current_task?: unknown;
  expected_files?: unknown;
  observed_files?: unknown;
  expected_checks?: unknown;
  observed_checks?: unknown;
  expected_observed_delta?: unknown;
  known_warnings?: unknown;
  skipped_checks?: unknown;
  not_done_items?: unknown;
  source_refs?: unknown;
  dogfooding_record_refs?: unknown;
  review_memory_refs?: unknown;
  promotion_receipt_state_refs?: unknown;
  unresolved_tensions?: unknown;
  authority_boundary?: Record<string, unknown>;
  forbidden_capabilities?: unknown;
  stop_conditions?: unknown;
  pr_body_requirements?: unknown;
  validation_commands?: unknown;
  next_recommended_slice?: unknown;
  privacy_report?: unknown;
  reason_codes?: unknown;
}

export interface ConversationHandoffPacketV02 {
  packet_version: typeof ConversationHandoffPacketVersionV02;
  builder_version: typeof ConversationHandoffPacketBuilderVersionV02;
  scope: typeof ConversationHandoffPacketScopeV02;
  profile: ConversationHandoffPacketProfileV02;
  packet_id: string;
  packet_fingerprint: string;
  created_at: string;
  sections: ConversationHandoffPacketSectionV02[];
  plain_text: string;
  authority_boundary: ConversationHandoffPacketAuthorityBoundaryV02;
  forbidden_capabilities: string[];
  reason_codes: ConversationHandoffPacketReasonCodeV02[];
  deterministic_profile_notes: string[];
}

export interface ConversationHandoffPacketBuildResultV02 {
  ok: boolean;
  status: ConversationHandoffPacketBuildStatusV02;
  error_code: ConversationHandoffPacketBuildStatusV02 | null;
  packet: ConversationHandoffPacketV02 | null;
  privacy_report: PrivacyRedactionRuntimeGuardReport | null;
  reason_codes: ConversationHandoffPacketReasonCodeV02[];
  authority_boundary: ConversationHandoffPacketAuthorityBoundaryV02;
  product_write_executed: false;
  review_memory_written: false;
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
}
