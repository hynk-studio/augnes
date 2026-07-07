import type {
  ResearchCandidateManualResultDogfoodBridgeOutcomeLabel,
  ResearchCandidateManualResultDogfoodBridgeReadiness,
} from "@/types/research-candidate-manual-result-dogfood-bridge-preview";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

export const RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_CONTRACT_KIND =
  "research_candidate_manual_result_dogfood_ledger_authorization_contract" as const;

export const RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_CONTRACT_VERSION =
  "research_candidate_manual_result_dogfood_ledger_authorization_contract.v0.1" as const;

export type ResearchCandidateManualResultDogfoodLedgerAuthorizationMode =
  | "preview_only"
  | "ready_for_future_ledger_write_authorization"
  | "blocked_before_ledger_authorization";

export interface ResearchCandidateManualResultDogfoodLedgerAuthorizationContractInput {
  bridge_preview: unknown;
  operator_intent_label?: string;
  requested_future_write_mode?: string;
}

export interface ResearchCandidateManualResultDogfoodProposedGlobalMapping {
  source_manual_receipt_id: string | null;
  source_handoff_seed_fingerprint: string | null;
  source_result_text_fingerprint: string | null;
  source_expected_observed_delta_record_ref: string | null;
  source_reuse_outcome_record_ref: string | null;
  bridge_readiness: ResearchCandidateManualResultDogfoodBridgeReadiness | null;
  selected_context_outcome_label: ResearchCandidateManualResultDogfoodBridgeOutcomeLabel;
  selected_candidate_context_refs: string[];
  expected_summary: string | null;
  observed_summary: string | null;
  mismatch_or_gap_summary: string | null;
  source_line: string | null;
  warning_reasons: string[];
  manual_only_context_refs: string[];
  global_ledger_candidate_allowed: boolean;
  global_metric_candidate_allowed: boolean;
  field_gaps: string[];
}

export interface ResearchCandidateManualResultDogfoodReuseOutcomeLedgerMapping {
  proposed_record_family: "future_manual_research_candidate_reuse_outcome_ledger_record";
  source_reuse_outcome_record_ref: string | null;
  source_manual_receipt_id: string | null;
  outcome_label: ResearchCandidateManualResultDogfoodBridgeOutcomeLabel;
  selected_reuse_candidate_refs: string[];
  source_line: string | null;
  warning_reasons: string[];
  existing_handoff_reuse_outcome_ledger_writer_compatible: false;
  compatibility_blockers_for_existing_writer: string[];
  writes_now: false;
}

export interface ResearchCandidateManualResultDogfoodExpectedObservedDeltaMapping {
  proposed_record_family: "future_manual_research_candidate_expected_observed_delta_global_record";
  source_expected_observed_delta_record_ref: string | null;
  source_manual_receipt_id: string | null;
  expected_summary: string | null;
  observed_summary: string | null;
  mismatch_or_gap_summary: string | null;
  source_handoff_seed_fingerprint: string | null;
  source_result_text_fingerprint: string | null;
  writes_now: false;
}

export interface ResearchCandidateManualResultDogfoodLedgerIdempotencyContractPreview {
  proposed_idempotency_key: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  would_prevent_duplicate_ledger_write: true;
  durable_id_allocated: false;
  writes_now: false;
}

export interface ResearchCandidateManualResultDogfoodLedgerCompatibilityFinding {
  finding_code: string;
  severity: "ready" | "warning" | "blocker";
  applies_to: "future_manual_dogfood_ledger_contract" | "existing_handoff_reuse_outcome_ledger_writer";
  summary: string;
}

export interface ResearchCandidateManualResultDogfoodLedgerNonWriteConfirmation {
  global_dogfood_ledger_written: false;
  dogfood_metrics_written: false;
  expected_observed_delta_global_record_written: false;
  reuse_outcome_global_record_written: false;
  manual_result_records_written: false;
  manual_result_records_mutated: false;
  proof_or_evidence_written: false;
  work_mutated: false;
  perspective_promoted: false;
  perspective_state_written: false;
  perspective_memory_written: false;
  product_write_executed: false;
  api_write_route_added: false;
  db_schema_or_migration_added: false;
  provider_openai_called: false;
  github_called: false;
  codex_executed: false;
  sources_fetched: false;
  retrieval_rag_embeddings_vector_fts_or_crawler_run: false;
}

export interface ResearchCandidateManualResultDogfoodLedgerAuthorizationValidation {
  passed: boolean;
  contract_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  bridge_preview_ready: boolean;
  latest_committed_receipt_present: boolean;
  expected_observed_delta_ready: boolean;
  reuse_outcome_ready: boolean;
  source_handoff_seed_fingerprint_present: boolean;
  source_result_text_fingerprint_present: boolean;
  supported_outcome_label: boolean;
  bridge_preview_authority_is_read_only: boolean;
  no_write_authority: boolean;
  blocker_count: number;
  warning_count: number;
}

export interface ResearchCandidateManualResultDogfoodLedgerAuthorizationAuthorityBoundary {
  preview_only: true;
  read_only: true;
  source_of_truth: false;
  can_write_global_dogfood_ledger: false;
  can_write_dogfood_metrics: false;
  can_write_expected_observed_delta_global_record: false;
  can_write_reuse_outcome_global_record: false;
  can_write_manual_result_records: false;
  can_mutate_manual_result_records: false;
  can_write_proof_or_evidence: false;
  can_mutate_work: false;
  can_promote_perspective: false;
  can_write_perspective_state: false;
  can_write_perspective_memory: false;
  can_execute_codex: false;
  can_call_github: false;
  can_call_providers_or_openai: false;
  can_fetch_sources: false;
  can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false;
  can_allocate_product_ids: false;
  can_execute_product_write: false;
}

export interface ResearchCandidateManualResultDogfoodLedgerAuthorizationContract {
  contract_kind: typeof RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_CONTRACT_KIND;
  contract_version: typeof RESEARCH_CANDIDATE_MANUAL_RESULT_DOGFOOD_LEDGER_AUTHORIZATION_CONTRACT_VERSION;
  scope: ResearchCandidateReviewScope;
  operator_intent_label: string;
  requested_future_write_mode: string;
  source_bridge_preview_ref: string;
  source_bridge_preview_fingerprint: string;
  source_latest_committed_receipt_id: string | null;
  source_manual_receipt_ids: string[];
  operator_authorization_mode: ResearchCandidateManualResultDogfoodLedgerAuthorizationMode;
  proposed_global_dogfood_mapping: ResearchCandidateManualResultDogfoodProposedGlobalMapping;
  proposed_reuse_outcome_ledger_mapping: ResearchCandidateManualResultDogfoodReuseOutcomeLedgerMapping;
  proposed_expected_observed_delta_mapping: ResearchCandidateManualResultDogfoodExpectedObservedDeltaMapping;
  idempotency_contract_preview: ResearchCandidateManualResultDogfoodLedgerIdempotencyContractPreview;
  compatibility_findings: ResearchCandidateManualResultDogfoodLedgerCompatibilityFinding[];
  blocker_reasons: string[];
  warning_reasons: string[];
  required_future_authorization: string[];
  required_future_checks: string[];
  non_write_confirmation: ResearchCandidateManualResultDogfoodLedgerNonWriteConfirmation;
  validation: ResearchCandidateManualResultDogfoodLedgerAuthorizationValidation;
  authority_boundary: ResearchCandidateManualResultDogfoodLedgerAuthorizationAuthorityBoundary;
  next_recommended_slice: string;
}
