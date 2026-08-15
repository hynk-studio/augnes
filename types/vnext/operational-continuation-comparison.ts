import type { ContextUseReviewV01 } from "./context-use-review";
import type { RunReceiptExecutionStatusV01, RunReceiptVerificationStatusV01 } from "./run-receipt";

export const OPERATIONAL_CONTINUATION_COMPARISON_VERSION_V01 =
  "operational_continuation_comparison.v0.1" as const;
export const OPERATIONAL_CONTINUATION_EQUAL_CEILING_VERSION_V01 =
  "operational_continuation_equal_ceiling.v0.1" as const;

export type OperationalContinuationComparisonStatusV01 =
  | "supported"
  | "mixed"
  | "refuted"
  | "inconclusive";

export type OperationalContinuationComparisonRelationV01 =
  | "candidate_better"
  | "baseline_better"
  | "equal"
  | "tradeoff"
  | "unknown"
  | "not_comparable";

export interface OperationalContinuationComparisonRecordRefV01 {
  record_version: string;
  record_id: string;
  record_fingerprint: string;
}

export interface OperationalContinuationComparisonWorkBindingV01 {
  work_id: string;
  work_fingerprint: string;
}

export interface OperationalContinuationRepositoryStateBindingV01 {
  frozen_head_commit: string;
  frozen_worktree_content_fingerprint: string;
  construction_cutoff: string;
  platform: string;
  native_host_adapter_version: string;
  native_host_capability_version: string;
  operation_approval_policy_fingerprint: string;
  verification_owner_set_fingerprint: string;
}

export interface OperationalContinuationManagedRunBindingV01 {
  run_id: string;
  packet_id: string;
  packet_fingerprint: string;
  attachment_id: string;
  attachment_binding_fingerprint: string;
  start_request_fingerprint: string;
  start_grant_fingerprint: string;
  controller_identity_fingerprint: string;
  action: "start_repository_managed_delegation";
  resume_used: false;
  status:
    | "completed"
    | "failed"
    | "blocked"
    | "cancelled"
    | "timed_out"
    | "needs_review";
  started_at: string;
  finished_at: string;
}

export interface OperationalContinuationCandidateBindingV01 {
  workspace_id: string;
  project_id: string;
  work: OperationalContinuationComparisonWorkBindingV01;
  evaluation_case_id: string;
  repository_state: OperationalContinuationRepositoryStateBindingV01;
  packet_a: OperationalContinuationComparisonRecordRefV01;
  run_a: OperationalContinuationManagedRunBindingV01;
  run_receipt_a: OperationalContinuationComparisonRecordRefV01;
  operational_context_selection: OperationalContinuationComparisonRecordRefV01;
  acgc5a_materialization: OperationalContinuationComparisonRecordRefV01;
  continuation_admission: OperationalContinuationComparisonRecordRefV01;
  packet_b: OperationalContinuationComparisonRecordRefV01;
  run_b: OperationalContinuationManagedRunBindingV01;
  run_receipt_b: OperationalContinuationComparisonRecordRefV01;
  context_use_review_b: OperationalContinuationComparisonRecordRefV01;
  context_use_attribution_b: OperationalContinuationComparisonRecordRefV01;
}

export interface OperationalContinuationBaselineBindingV01 {
  workspace_id: string;
  project_id: string;
  work: OperationalContinuationComparisonWorkBindingV01;
  evaluation_case_id: string;
  repository_state: OperationalContinuationRepositoryStateBindingV01;
  packet: OperationalContinuationComparisonRecordRefV01;
  run: OperationalContinuationManagedRunBindingV01;
  run_receipt: OperationalContinuationComparisonRecordRefV01;
  context_use_review: OperationalContinuationComparisonRecordRefV01;
  run_count: 1;
  resume_used: false;
  operational_continuation_present: false;
  packet_b_present: false;
  post_cutoff_candidate_material_present: false;
}

export type OperationalContinuationParityDimensionV01 =
  | "task_goal"
  | "success_criteria"
  | "non_goals"
  | "required_checks"
  | "forbidden_actions"
  | "data_classification"
  | "work_task_family"
  | "frozen_repository_head"
  | "initial_worktree_content"
  | "platform"
  | "native_host_adapter"
  | "native_host_capability"
  | "operation_approval_policy"
  | "verification_owner_set"
  | "construction_cutoff";

export interface OperationalContinuationParityRowV01 {
  dimension: OperationalContinuationParityDimensionV01;
  status: "equal" | "not_comparable";
  candidate_fingerprint: string | null;
  baseline_fingerprint: string | null;
  limitation: string | null;
}

export type OperationalContinuationResourceDimensionV01 =
  | "provider_call_count"
  | "host_tool_command_count"
  | "step_operation_count"
  | "usage_unit_count"
  | "cost_microunits"
  | "latency_ms";

export type OperationalContinuationBudgetComplianceStateV01 =
  | "within_ceiling"
  | "exceeded"
  | "unobserved";

export interface OperationalContinuationEqualCeilingRowV01 {
  dimension: OperationalContinuationResourceDimensionV01;
  declared_ceiling: number;
  candidate_observed: number | null;
  baseline_observed: number | null;
  candidate_status: OperationalContinuationBudgetComplianceStateV01;
  baseline_status: OperationalContinuationBudgetComplianceStateV01;
  observation_basis: "exact_receipts" | "fixture_ledger" | "unobserved";
}

export interface OperationalContinuationEqualCeilingEnvelopeV01 {
  envelope_version: typeof OPERATIONAL_CONTINUATION_EQUAL_CEILING_VERSION_V01;
  envelope_id: string;
  envelope_kind: "research_evaluation_binding_only";
  rows: OperationalContinuationEqualCeilingRowV01[];
  same_total_declared_ceiling: true;
  baseline_not_artificially_capability_constrained: true;
  complete_equal_budget_claim: boolean;
  equal_budget_is_equal_capability: false;
  is_capability_grant: false;
  is_execution_grant: false;
  is_operational_policy: false;
  integrity: OperationalContinuationComparisonIntegrityV01;
}

export interface OperationalContinuationTaskOutcomeV01 {
  execution_status: RunReceiptExecutionStatusV01;
  verification_status: RunReceiptVerificationStatusV01;
  required_passed_count: number;
  failed_count: number;
  blocked_count: number;
  skipped_count: number;
  unknown_count: number;
  hard_gate_failure: boolean;
  hard_gate_codes: string[];
  blockers: string[];
  warnings: string[];
  gaps: string[];
  result_limitations: string[];
  changed_artifact_count: number;
  changed_artifacts: Array<{
    artifact_id: string;
    before_hash: string | null;
    after_hash: string | null;
  }>;
  false_success_status: "unknown";
}

export interface OperationalContinuationContributionSummaryV01 {
  selected_operational_entry_count: number;
  exact_delivered_count: number;
  exact_referenced_count: number;
  packet_level_actual_use_claim: ContextUseReviewV01["usage"]["actually_used"];
  actual_use_provenance: string;
  item_level_actual_use_proven_count: 0;
  support_validated_count: 0;
  outcome_associated_count: 0;
  causally_supported_count: 0;
  missing_attribution_lanes: string[];
  bundle_credit_assigned: false;
}

export interface OperationalContinuationReviewBurdenV01 {
  correction_count: number;
  wrong_context_correction_count: number | null;
  repeated_explanation_estimate: number | null;
  missing_critical_context_count: number | null;
  context_refs_used_count: number | null;
  additional_review_actions: number | null;
}

export interface OperationalContinuationCoordinationOverheadV01 {
  managed_runs: number;
  repository_attachments: number;
  browser_start_confirmations: number;
  proposal_only_review_decisions: number;
  continuation_admission_actions: number;
  context_use_review_actions: number;
  required_human_interventions: number | null;
  recovery_reconciliation_actions: number | null;
  coordination_elapsed_latency_ms: number | null;
}

export interface OperationalContinuationCostOperabilityV01 {
  provider_model_call_count: number;
  host_tool_command_count: number;
  usage_unit_count: number | null;
  cost_microunits: number | null;
  run_latency_ms: number | null;
  end_to_end_latency_ms: number | null;
  cleanup_recovery_burden: number | null;
  privacy_egress_observation: "none_observed" | "observed" | "unknown";
  platform_evidence_boundary: string;
}

export interface OperationalContinuationComparisonDimensionDeltaV01 {
  dimension: string;
  relation: OperationalContinuationComparisonRelationV01;
  preferred_direction: "higher" | "lower" | "required_false" | "descriptive";
  candidate_value: string | number | boolean | null;
  baseline_value: string | number | boolean | null;
  exact_delta: number | null;
  basis: string;
}

export interface OperationalContinuationHarmfulTransferV01 {
  status: "local_candidate" | "none_observed" | "unknown";
  adverse_observations: string[];
  exact_case_only: true;
  causal_harm_claimed: false;
  general_harm_claimed: false;
  blacklist_created: false;
  rollback_activated: false;
}

export interface OperationalContinuationComparisonIntegrityV01 {
  algorithm: "sha256";
  canonicalization: "augnes-json-c14n-v0_1";
  fingerprint_scope: "comparison_without_integrity_fingerprint";
  fingerprint: string;
}

export interface OperationalContinuationComparisonAuthorityV01 {
  scalar_fitness_created: false;
  quality_score_created: false;
  global_winner_created: false;
  rank_created: false;
  promotion_created: false;
  general_verified_benefit_claimed: false;
  general_causal_contribution_claimed: false;
  general_harm_claimed: false;
  operational_policy_activated: false;
  product_context_policy_selected: false;
  semantic_state_changed: false;
  task_context_packet_mutated: false;
  execution_authority_granted: false;
  provider_authority_granted: false;
  network_authority_granted: false;
  github_authority_granted: false;
  publication_authority_granted: false;
  merge_authority_granted: false;
  writes_database: false;
  mutates_session: false;
  writes_project_files: false;
  executes_project_commands: false;
}

export interface OperationalContinuationComparisonV01 {
  comparison_version: typeof OPERATIONAL_CONTINUATION_COMPARISON_VERSION_V01;
  comparison_id: string;
  comparison_kind: "pure_rebuildable_exact_case_non_authoritative";
  evaluation_case_id: string;
  evaluation_case_fingerprint: string;
  task_family_key: string;
  frozen_construction_cutoff: string;
  observation_cutoff: string;
  candidate: OperationalContinuationCandidateBindingV01;
  baseline: OperationalContinuationBaselineBindingV01;
  structural_parity: OperationalContinuationParityRowV01[];
  equal_ceiling: OperationalContinuationEqualCeilingEnvelopeV01;
  candidate_task_outcome: OperationalContinuationTaskOutcomeV01;
  baseline_task_outcome: OperationalContinuationTaskOutcomeV01;
  continuation_contribution: OperationalContinuationContributionSummaryV01;
  candidate_review_burden: OperationalContinuationReviewBurdenV01;
  baseline_review_burden: OperationalContinuationReviewBurdenV01;
  candidate_coordination_overhead: OperationalContinuationCoordinationOverheadV01;
  baseline_coordination_overhead: OperationalContinuationCoordinationOverheadV01;
  candidate_cost_operability: OperationalContinuationCostOperabilityV01;
  baseline_cost_operability: OperationalContinuationCostOperabilityV01;
  dimension_deltas: OperationalContinuationComparisonDimensionDeltaV01[];
  hard_gate_non_compensation_applied: boolean;
  trade_offs: string[];
  skipped_unobserved_dimensions: string[];
  candidate_budget_compliance: "within_observed_ceilings" | "exceeded" | "incomplete";
  baseline_budget_compliance: "within_observed_ceilings" | "exceeded" | "incomplete";
  exact_case_status: OperationalContinuationComparisonStatusV01;
  harmful_transfer: OperationalContinuationHarmfulTransferV01;
  limitations: string[];
  missing_evidence: string[];
  no_bundle_credit: true;
  exact_case_only: true;
  material_boundary: {
    bounded: true;
    max_text_characters: 2000;
    max_collection_items: 128;
    raw_prompt_included: false;
    raw_transcript_included: false;
    raw_terminal_output_included: false;
    raw_provider_output_included: false;
    raw_artifact_content_included: false;
    hidden_reasoning_included: false;
    credential_or_secret_included: false;
    absolute_local_path_included: false;
  };
  authority_summary: OperationalContinuationComparisonAuthorityV01;
  integrity: OperationalContinuationComparisonIntegrityV01;
}

export interface OperationalContinuationComparisonValidationResultV01 {
  status: "valid" | "blocked";
  errors: Array<{ code: string; path: string }>;
}
