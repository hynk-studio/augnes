import type {
  ResearchCandidateReviewMemoryDbActivityV01,
  ResearchCandidateReviewMemoryDbRecordV01,
} from "@/lib/research-candidate-review/review-memory-db-store";

export const PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_RUNTIME_VERSION_V01 =
  "promotion_readiness_packet_from_review_memory.v0.1" as const;
export const PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_REQUEST_VERSION_V01 =
  "promotion_readiness_packet_from_review_memory_request.v0.1" as const;
export const PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_RESULT_VERSION_V01 =
  "promotion_readiness_packet_from_review_memory_result.v0.1" as const;
export const PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_ROUTE_VERSION_V01 =
  "promotion_readiness_packet_from_review_memory_route.v0.1" as const;
export const PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_SCOPE_V01 =
  "project:augnes" as const;

export type PromotionReadinessPacketFromReviewMemoryStatusV01 =
  | "ready_for_operator_promotion_review"
  | "needs_more_evidence"
  | "blocked_missing_review_record"
  | "blocked_missing_source_refs"
  | "blocked_missing_candidate_refs"
  | "blocked_boundary_acknowledgements"
  | "blocked_private_or_raw_payload"
  | "blocked_forbidden_authority"
  | "db_missing"
  | "schema_missing"
  | "not_found"
  | "invalid_db_path"
  | "blocked_invalid_input"
  | "rejected";

export interface PromotionReadinessPacketPolicyV01 {
  require_review_record: true;
  require_candidate_review_snapshot: true;
  require_candidate_refs: true;
  require_source_refs: true;
  require_boundary_acknowledgements: true;
  require_no_truth_claims: true;
  require_no_proof_claims: true;
  require_no_product_write: true;
  unresolved_tension_policy: "preserve_or_flag";
  knowledge_gap_policy: "preserve_or_flag";
  formation_receipt_policy: "required_later_not_written_now";
  promotion_decision_policy: "operator_decision_required_later_not_written_now";
}

export interface PromotionReadinessPacketFromReviewMemoryRequestV01 {
  request_version: typeof PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_REQUEST_VERSION_V01;
  runtime_version: typeof PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_RUNTIME_VERSION_V01;
  scope: typeof PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_SCOPE_V01;
  readiness_packet_request_id: string;
  requested_by: string;
  requested_at: string;
  review_memory_db_path: string;
  review_record_id: string;
  include_activity: boolean;
  max_activity_items: number;
  max_summary_chars: number;
  readiness_policy: PromotionReadinessPacketPolicyV01;
  authority_boundary?: Record<string, unknown>;
  reason_codes: string[];
}

export interface PromotionReadinessGateReportV01 {
  require_review_record: "passed" | "blocked";
  require_candidate_review_snapshot: "passed" | "warning" | "blocked";
  require_candidate_refs: "passed" | "blocked";
  require_source_refs: "passed" | "blocked";
  require_boundary_acknowledgements: "passed" | "blocked";
  require_no_truth_claims: "passed" | "blocked";
  require_no_proof_claims: "passed" | "blocked";
  require_no_product_write: "passed" | "blocked";
  lifecycle_state: "active_or_reviewable" | "discarded_or_rejected";
  activity_included: boolean;
}

export interface PromotionReadinessPacketAuthorityBoundaryV01 {
  promotion_readiness_packet_from_review_memory_now: true;
  explicit_operator_readiness_packet_only: true;
  same_origin_post_route_now: true;
  read_only_review_memory_db_query_now: boolean;
  review_memory_record_read_now: boolean;
  bounded_readiness_packet_now: boolean;
  gate_report_diagnostic_now: boolean;
  source_refs_lineage_only: true;
  final_answer_candidate_input_supported: true;
  no_truth_language_required: true;
  no_proof_language_required: true;
  promotion_execution_now: false;
  promotion_decision_record_write_now: false;
  promotion_decision_store_write_now: false;
  promotion_route_write_now: false;
  promotion_decision_ui_now: false;
  formation_receipt_write_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  accepted_evidence_ref_write_now: false;
  product_write_now: false;
  product_write_runtime_now: false;
  product_write_adapter_enabled_now: false;
  product_id_allocation_now: false;
  broad_product_persistence_now: false;
  product_persistence_now: false;
  final_answer_generation_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  retrieval_execution_now: false;
  source_fetch_now: false;
  retrieval_index_write_now: false;
  embedding_created_now: false;
  vector_search_now: false;
  review_memory_write_now: false;
  review_record_create_now: false;
  review_record_activity_write_now: false;
  review_record_discard_now: false;
  git_write_now: false;
  github_api_call_now: false;
  repository_file_write_now: false;
  release_execution_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  readiness_packet_is_promotion: false;
  readiness_packet_is_proof: false;
  readiness_packet_is_evidence: false;
  readiness_packet_is_accepted_evidence: false;
  readiness_packet_is_durable_state: false;
  readiness_packet_is_product: false;
  review_memory_is_truth: false;
  review_memory_is_proof: false;
  review_memory_is_accepted_evidence: false;
  review_memory_is_durable_perspective_state: false;
  final_answer_candidate_is_truth: false;
  final_answer_candidate_is_proof: false;
  source_ref_is_proof: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface PromotionReadinessPacketFromReviewMemoryResultV01 {
  result_version: typeof PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_RESULT_VERSION_V01;
  runtime_version: typeof PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_RUNTIME_VERSION_V01;
  scope: typeof PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_SCOPE_V01;
  status: PromotionReadinessPacketFromReviewMemoryStatusV01;
  readiness_packet_ref: string | null;
  readiness_packet_request_id: string | null;
  review_record_ref: string | null;
  review_record_kind: ResearchCandidateReviewMemoryDbRecordV01["record_kind"] | null;
  review_lifecycle_state: ResearchCandidateReviewMemoryDbRecordV01["lifecycle_state"] | null;
  review_decision: ResearchCandidateReviewMemoryDbRecordV01["review_decision"] | null;
  review_action: ResearchCandidateReviewMemoryDbRecordV01["review_action"] | null;
  candidate_refs: string[];
  source_refs: string[];
  activity_refs: string[];
  readiness_state: PromotionReadinessPacketFromReviewMemoryStatusV01;
  readiness_summary: string;
  readiness_gate_report: PromotionReadinessGateReportV01;
  missing_items: string[];
  blocking_items: string[];
  warning_items: string[];
  non_authority_notes: string[];
  operator_next_actions: string[];
  promotion_decision_candidate_ref: null;
  formation_receipt_ref: null;
  durable_state_ref: null;
  product_write_ref: null;
  accepted_evidence_ref_write_ref: null;
  provider_call_executed: false;
  prompt_sent: false;
  retrieval_executed: false;
  source_fetch_executed: false;
  retrieval_index_write_executed: false;
  review_memory_written: false;
  promotion_readiness_packet_generated: boolean;
  promotion_executed: false;
  promotion_decision_written: false;
  promotion_decision_store_written: false;
  formation_receipt_written: false;
  durable_state_written: false;
  durable_state_applied: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  product_write_executed: false;
  accepted_evidence_ref_write_executed: false;
  product_id_allocated: false;
  github_api_called: false;
  git_write_executed: false;
  release_executed: false;
  activity_summaries: Pick<
    ResearchCandidateReviewMemoryDbActivityV01,
    "activity_id" | "activity_kind" | "summary" | "created_at"
  >[];
  authority_boundary: PromotionReadinessPacketAuthorityBoundaryV01;
  reason_codes: string[];
  failure_codes: string[];
}
