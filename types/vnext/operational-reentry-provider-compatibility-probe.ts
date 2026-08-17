import type { ModelProviderRejectionObservationV01 } from "@/lib/vnext/model-gateway/provider-rejection-observation";
import type { ExternalRefV01 } from "./external-ref";
import type {
  ModelGatewayCostBudgetV01,
  ModelInvocationReceiptUsageV02,
  ModelInvocationReceiptV02,
} from "./model-invocation-receipt";
import type {
  OperationalReentryMatchedCohortCaseV01,
  OperationalReentryMatchedCohortIntegrityV01,
  OperationalReentryMatchedCohortModelInputV01,
  OperationalReentryMatchedCohortModelOutputV01,
  OperationalReentryMatchedCohortRouteV01,
} from "./operational-reentry-matched-cohort";

export const OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_VERSION_V01 =
  "operational_reentry_provider_compatibility_probe.v0.1" as const;
export const OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V01 =
  "operational_reentry_provider_compatibility_probe_authorization.v0.1" as const;
export const OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_PLAN_VERSION_V01 =
  "operational_reentry_provider_compatibility_probe_plan.v0.1" as const;
export const OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_PROVIDER_CONTRACT_VERSION_V01 =
  "operational_reentry_provider_compatibility_probe_provider_contract.v0.1" as const;
export const OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_PRICING_VERSION_V01 =
  "operational_reentry_provider_compatibility_probe_pricing.v0.1" as const;
export const OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_REPORT_VERSION_V01 =
  "operational_reentry_provider_compatibility_probe_report.v0.1" as const;

export type OperationalReentryProviderCompatibilityProbeShapeV01 =
  | "A"
  | "B"
  | "C"
  | "D";

export type OperationalReentryProviderCompatibilityProbeOutcomeV01 =
  | "accepted_all_shapes"
  | "provider_rejected"
  | "provider_response_invalid"
  | "transport_or_runtime_incomplete"
  | "not_run";

export type OperationalReentryProviderCompatibilityProbeTerminalCategoryV01 =
  | "accepted_and_normalized"
  | "provider_rejected"
  | "provider_response_invalid"
  | "transport_failed"
  | "timed_out"
  | "cancelled"
  | "blocked_before_egress"
  | "internal_failure"
  | "not_attempted_after_terminal_failure";

export interface OperationalReentryProviderCompatibilityProbeAuthorizationV01 {
  authorization_version: typeof OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V01;
  authorization_id: string;
  authorization_kind: "one_bounded_provider_compatibility_probe";
  request_family_kind: "compatibility_probe";
  future_live_issue_number: number;
  exact_merged_source_head: string;
  planned_shapes: 4;
  canonical_order: readonly ["A", "B", "C", "D"];
  maximum_provider_calls: 4;
  maximum_parallel_calls: 1;
  retries: 0;
  replacement_calls: 0;
  fresh_stateless_request_per_shape: true;
  conversation_reuse: false;
  thread_reuse: false;
  previous_response_reuse: false;
  stop_after_first_non_success_terminal_result: true;
  second_probe_authorized: false;
  replacement_cohort_authorized: false;
  stage_7_authorized: false;
  maximum_total_cost_nano_usd: 250_000_000;
  case_fingerprint: string;
  route_fingerprint: string;
  provider_contract_fingerprint: string;
  pricing_authority_fingerprint: string;
  issued_at: string;
  expires_at: string;
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryProviderCompatibilityProbeProviderContractV01 {
  provider_contract_identity_version: typeof OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_PROVIDER_CONTRACT_VERSION_V01;
  reused_provider_contract_version: "operational_reentry_matched_cohort_provider_contract.v0.3";
  reused_codec_version: "operational_reentry_matched_cohort_codec.v0.2";
  strict_schema_supported_subset_version: "openai_strict_schema_supported_subset.v0.1";
  response_schema_version: "operational_reentry_matched_cohort_response_schema.v0.2";
  parser_version: "operational_reentry_matched_cohort_parser.v0.1";
  provider_endpoint_fingerprint: string;
  provider_ref: ExternalRefV01;
  model_ref: ExternalRefV01;
  adapter_implementation_id: "openai_responses.operational_reentry_matched_cohort";
  adapter_implementation_version: "openai_responses_operational_reentry_matched_cohort_adapter.v0.3";
  deterministic_fallback_counts_as_success: false;
  target_and_stale_consistency_rules_preserved: true;
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryProviderCompatibilityProbePlanEntryV01 {
  canonical_order: 0 | 1 | 2 | 3;
  shape: OperationalReentryProviderCompatibilityProbeShapeV01;
  representative_shape_meaning:
    | "target_present_fresh"
    | "non_target_context_present_target_absent"
    | "target_present_exact_stale_regime_relation"
    | "no_continuation_context_target_absent";
  call_slot_id: string;
  model_input: OperationalReentryMatchedCohortModelInputV01;
  representative_input_fingerprint: string;
  schema_fingerprint: string;
  provider_visible_request_fingerprint: string;
  adapter_request_route_fingerprint: string;
  request_family_trace_id: string;
  client_request_id: string;
  strict_schema_preflight: "passed";
}

export interface OperationalReentryProviderCompatibilityProbePlanArtifactEntryV01
  extends Omit<
    OperationalReentryProviderCompatibilityProbePlanEntryV01,
    "model_input"
  > {
  provider_visible_input_persisted: false;
  raw_request_body_persisted: false;
}

export interface OperationalReentryProviderCompatibilityProbePlanV01 {
  plan_version: typeof OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_PLAN_VERSION_V01;
  authorization_fingerprint: string;
  source_repository_head_sha: string;
  future_live_issue_number: number;
  request_family_kind: "compatibility_probe";
  request_family_basis_fingerprint: string;
  request_family_trace_id: string;
  canonical_order: readonly ["A", "B", "C", "D"];
  planned_shapes: 4;
  maximum_provider_calls: 4;
  maximum_parallel_calls: 1;
  retries: 0;
  replacement_calls: 0;
  fresh_stateless_request_per_shape: true;
  conversation_reuse: false;
  thread_reuse: false;
  previous_response_reuse: false;
  adaptive_prompt_schema_or_input_changes: false;
  stop_after_first_non_success_terminal_result: true;
  remaining_shapes_after_terminal_failure: "not_attempted_after_terminal_failure";
  entries: OperationalReentryProviderCompatibilityProbePlanEntryV01[];
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryProviderCompatibilityProbePricingV01 {
  pricing_version: typeof OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_PRICING_VERSION_V01;
  provider_ref: ExternalRefV01;
  model_ref: ExternalRefV01;
  route_fingerprint: string;
  pricing_source: "official_openai_model_page";
  pricing_source_url: "https://developers.openai.com/api/docs/models/gpt-4.1-mini";
  pricing_source_version: string;
  pricing_effective_at: string;
  pricing_expires_at: string;
  evaluated_at: string;
  gateway_cost_budget: ModelGatewayCostBudgetV01;
  per_shape_worst_case_cost_nano_usd: number;
  aggregate_worst_case_cost_nano_usd: number;
  aggregate_ceiling_nano_usd: 250_000_000;
  missing_usage_or_exact_cost: "unknown_never_zero";
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryProviderCompatibilityProbeManifestV01 {
  probe_version: typeof OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_VERSION_V01;
  probe_id: string;
  future_live_issue_number: number;
  source_repository_head_sha: string;
  authorization_fingerprint: string;
  source_ref: OperationalReentryMatchedCohortCaseV01["source_ref"];
  case_fingerprint: string;
  plan_fingerprint: string;
  route: OperationalReentryMatchedCohortRouteV01;
  provider_contract_fingerprint: string;
  pricing_fingerprint: string;
  pricing_authority_fingerprint: string;
  request_family_kind: "compatibility_probe";
  request_family_trace_id: string;
  provider_egress: "allow_only_with_supplied_future_authorization";
  execution_mode: "live";
  data_classification: "public_safe";
  retention_class: "none";
  raw_prompt_persisted: false;
  raw_request_body_persisted: false;
  raw_provider_response_persisted: false;
  hidden_reasoning_persisted: false;
  credentials_or_full_headers_persisted: false;
  manual_retries: 0;
  replacement_calls: 0;
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryProviderCompatibilityProbeShapeTerminalV01 {
  canonical_order: 0 | 1 | 2 | 3;
  shape: OperationalReentryProviderCompatibilityProbeShapeV01;
  call_slot_id: string;
  terminal_category: OperationalReentryProviderCompatibilityProbeTerminalCategoryV01;
  egress_attempted: boolean;
  request_family_kind: "compatibility_probe";
  request_family_trace_id: string;
  client_request_id: string;
  representative_input_fingerprint: string;
  schema_fingerprint: string;
  provider_visible_request_fingerprint: string;
  route_fingerprint: string;
  adapter_request_route_fingerprint: string;
  provider_contract_fingerprint: string;
  pricing_fingerprint: string;
  input_bytes: number | null;
  usage: ModelInvocationReceiptUsageV02 | null;
  latency_ms: number | null;
  normalized_output: OperationalReentryMatchedCohortModelOutputV01 | null;
  normalized_output_fingerprint: string | null;
  receipt: ModelInvocationReceiptV02 | null;
  provider_rejection_observation?: ModelProviderRejectionObservationV01;
  terminal_failure_code: string | null;
  exact_cost: {
    status: "calculated" | "unknown";
    input_nano_usd: number | null;
    output_nano_usd: number | null;
    total_nano_usd: number | null;
  };
  worst_case_cost_nano_usd: number;
  operator_intervention: {
    retries: 0;
    replacement_calls: 0;
    manual_normalized_output_edits: 0;
  };
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryProviderCompatibilityProbeReportV01 {
  report_version: typeof OPERATIONAL_REENTRY_PROVIDER_COMPATIBILITY_PROBE_REPORT_VERSION_V01;
  probe_id: string;
  outcome: OperationalReentryProviderCompatibilityProbeOutcomeV01;
  planned_shapes: 4;
  shape_records: number;
  terminal_shape_count: number;
  attempted_provider_calls: number;
  accepted_and_normalized_shapes: number;
  not_attempted_after_terminal_failure: number;
  source_head_and_tracked_worktree_unchanged_at_terminal: boolean;
  authorization_consumed: boolean;
  first_terminal_failure: OperationalReentryProviderCompatibilityProbeTerminalCategoryV01 | null;
  terminal_category_counts: Record<
    OperationalReentryProviderCompatibilityProbeTerminalCategoryV01,
    number
  >;
  exact_cost: {
    status: "calculated" | "unknown";
    calculated_total_nano_usd: number | null;
    aggregate_worst_case_cost_nano_usd: number;
    aggregate_ceiling_nano_usd: 250_000_000;
    missing_usage_or_exact_cost: "unknown_never_zero";
  };
  real_provider_calls_observed_by_harness: number | null;
  probe_scope_boundary: {
    operational_reentry_evaluation_built: false;
    behavioral_analysis_generated: false;
    model_or_provider_quality_judgment_generated: false;
    continuation_benefit_or_harm_claim_generated: false;
  };
  authority_ledger: {
    is_core_record: false;
    is_evidence: false;
    is_proposal: false;
    is_review_decision: false;
    is_transition: false;
    is_policy: false;
    writes_product_database: 0;
    writes_core: 0;
    mutates_task_context_packet: false;
    mutates_current_work: false;
    mutates_semantic_state: false;
    authorizes_execution_beyond_probe: false;
    authorizes_second_probe: false;
    authorizes_replacement_cohort: false;
    authorizes_stage_7: false;
    authorizes_retry_or_scheduling: false;
    authorizes_automatic_context_injection: false;
    authorizes_fallback_or_rollback: false;
    authorizes_start_or_resume: false;
    authorizes_publication: false;
    authorizes_ready_merge_or_auto_merge: false;
    product_api_or_ui_changes: false;
  };
  limitations: string[];
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryProviderCompatibilityProbeExecutionResultV01 {
  result_kind: "complete" | "incomplete";
  authorization: OperationalReentryProviderCompatibilityProbeAuthorizationV01;
  manifest: OperationalReentryProviderCompatibilityProbeManifestV01;
  case: OperationalReentryMatchedCohortCaseV01;
  provider_contract: OperationalReentryProviderCompatibilityProbeProviderContractV01;
  plan: OperationalReentryProviderCompatibilityProbePlanV01;
  pricing: OperationalReentryProviderCompatibilityProbePricingV01;
  shapes: OperationalReentryProviderCompatibilityProbeShapeTerminalV01[];
  report: OperationalReentryProviderCompatibilityProbeReportV01;
}
