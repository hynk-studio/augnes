import type {
  ResearchCandidateManualGlobalDogfoodOutcomeSignal,
} from "@/types/research-candidate-manual-global-dogfood-ledger-workbench-projection";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_CONTRACT_KIND =
  "research_candidate_manual_global_dogfood_next_work_signal_contract" as const;

export const RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_CONTRACT_VERSION =
  "research_candidate_manual_global_dogfood_next_work_signal_contract.v0.1" as const;

export type ResearchCandidateManualGlobalDogfoodNextWorkSignalAuthorizationMode =
  | "preview_only"
  | "ready_for_future_next_work_signal_write_authorization"
  | "blocked_before_next_work_signal_authorization";

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalContractInput {
  projection: unknown;
  operator_intent_label?: string;
  requested_future_write_mode?: string;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalMapping {
  recommended_next_work_label: string | null;
  rationale: string | null;
  outcome_label: string | null;
  outcome_signal: ResearchCandidateManualGlobalDogfoodOutcomeSignal | null;
  mismatch_or_gap_summary: string | null;
  selected_candidate_context_refs: string[];
  expected_summary: string | null;
  observed_summary: string | null;
  source_line: string | null;
  blockers: string[];
  warnings: string[];
  can_feed_next_work_signal_decision_candidate: boolean;
  can_write_next_work_bias_now: false;
  can_write_perspective_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkDecisionInputs {
  source_next_work_candidate_card_ids: string[];
  primary_candidate_card_count: number;
  selected_card_write_flags_all_false: boolean;
  expected_observed_follow_up_candidate: boolean;
  outcome_signal: ResearchCandidateManualGlobalDogfoodOutcomeSignal | null;
  source_fingerprints_present: boolean;
  field_gaps: string[];
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkDecisionCandidate {
  decision_kind: "manual_global_dogfood_next_work_signal_decision_candidate";
  decision_status:
    | "ready_for_future_next_work_signal_write_authorization"
    | "blocked_before_next_work_signal_authorization";
  candidate_priority_hint: "high" | "medium" | "low" | "blocked";
  reason: string;
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalIdempotencyPreview {
  proposed_idempotency_key: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  would_prevent_duplicate_next_work_signal_write: true;
  durable_id_allocated: false;
  writes_now: false;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalCompatibilityFinding {
  finding_code: string;
  severity: "ready" | "warning" | "blocker";
  applies_to: "manual_global_dogfood_projection" | "future_next_work_signal_decision";
  summary: string;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalNonWriteConfirmation {
  next_work_bias_written: false;
  work_item_written: false;
  work_mutated: false;
  perspective_state_written: false;
  perspective_promoted: false;
  perspective_memory_written: false;
  dogfood_metrics_written: false;
  global_dogfood_ledger_written: false;
  global_dogfood_ledger_mutated: false;
  manual_result_records_written: false;
  manual_result_records_mutated: false;
  proof_or_evidence_written: false;
  product_write_executed: false;
  api_write_route_added: false;
  db_schema_or_migration_added: false;
  provider_openai_called: false;
  github_called: false;
  codex_executed: false;
  sources_fetched: false;
  retrieval_rag_embeddings_vector_fts_or_crawler_run: false;
  operator_note_persisted: false;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalValidation {
  passed: boolean;
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  projection_ready: boolean;
  latest_active_committed_receipt_present: boolean;
  primary_next_work_candidate_present: boolean;
  selected_card_write_flags_all_false: boolean;
  source_fingerprints_present: boolean;
  projection_authority_is_read_only: boolean;
  no_write_authority: boolean;
  blocker_count: number;
  warning_count: number;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalAuthorityBoundary {
  preview_only: true;
  read_only: true;
  source_of_truth: false;
  can_write_next_work_bias: false;
  can_write_work_item: false;
  can_mutate_work: false;
  can_write_perspective_state: false;
  can_promote_perspective: false;
  can_write_perspective_memory: false;
  can_write_dogfood_metrics: false;
  can_write_global_dogfood_ledger: false;
  can_write_proof_or_evidence: false;
  can_execute_codex: false;
  can_call_github: false;
  can_call_providers_or_openai: false;
  can_fetch_sources: false;
  can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false;
  can_allocate_product_ids: false;
  can_execute_product_write: false;
}

export interface ResearchCandidateManualGlobalDogfoodNextWorkSignalContract {
  contract_kind: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_CONTRACT_KIND;
  contract_version: typeof RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_CONTRACT_VERSION;
  scope: ResearchCandidateReviewScope;
  operator_intent_label: string;
  requested_future_write_mode: string;
  source_projection_ref: string;
  source_projection_fingerprint: string;
  source_latest_active_committed_receipt_id: string | null;
  source_next_work_candidate_card_ids: string[];
  source_ledger_record_ref: string | null;
  source_manual_receipt_id: string | null;
  source_contract_fingerprint: string | null;
  source_authorization_review_fingerprint: string | null;
  source_handoff_seed_fingerprint: string | null;
  source_result_text_fingerprint: string | null;
  source_expected_observed_delta_record_ref: string | null;
  source_reuse_outcome_record_ref: string | null;
  operator_authorization_mode: ResearchCandidateManualGlobalDogfoodNextWorkSignalAuthorizationMode;
  proposed_next_work_signal_mapping: ResearchCandidateManualGlobalDogfoodNextWorkSignalMapping;
  proposed_decision_inputs: ResearchCandidateManualGlobalDogfoodNextWorkDecisionInputs;
  proposed_decision_candidate: ResearchCandidateManualGlobalDogfoodNextWorkDecisionCandidate;
  idempotency_contract_preview: ResearchCandidateManualGlobalDogfoodNextWorkSignalIdempotencyPreview;
  compatibility_findings: ResearchCandidateManualGlobalDogfoodNextWorkSignalCompatibilityFinding[];
  blocker_reasons: string[];
  warning_reasons: string[];
  required_future_authorization: string[];
  required_future_checks: string[];
  non_write_confirmation: ResearchCandidateManualGlobalDogfoodNextWorkSignalNonWriteConfirmation;
  validation: ResearchCandidateManualGlobalDogfoodNextWorkSignalValidation;
  authority_boundary: ResearchCandidateManualGlobalDogfoodNextWorkSignalAuthorityBoundary;
  next_recommended_slice: string;
}
