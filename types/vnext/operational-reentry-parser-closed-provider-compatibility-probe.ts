import type { ModelProviderRejectionObservationV01 } from "@/lib/vnext/model-gateway/provider-rejection-observation";
import type { ModelProviderResponseInvalidObservationV01 } from "@/lib/vnext/model-gateway/provider-response-invalid-observation";
import type { ExternalRefV01 } from "./external-ref";
import type {
  ModelGatewayCostBudgetV01,
  ModelInvocationReceiptUsageV02,
  ModelInvocationReceiptV02,
} from "./model-invocation-receipt";
import type {
  OperationalReentryMatchedCohortCaseV02,
} from "./operational-reentry-matched-cohort-v0-2";
import type {
  OperationalReentryMatchedCohortIntegrityV03,
  OperationalReentryMatchedCohortModelInputV03,
  OperationalReentryMatchedCohortModelOutputV03,
  OperationalReentryMatchedCohortProviderContractV03,
  OperationalReentryMatchedCohortRouteV03,
} from "./operational-reentry-matched-cohort-v0-3";

export const OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_VERSION_V01 =
  "operational_reentry_parser_closed_provider_compatibility_probe.v0.1" as const;
export const OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V01 =
  "operational_reentry_parser_closed_provider_compatibility_probe_authorization.v0.1" as const;
export const OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_PLAN_VERSION_V01 =
  "operational_reentry_parser_closed_provider_compatibility_probe_plan.v0.1" as const;
export const OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_PRICING_VERSION_V01 =
  "operational_reentry_parser_closed_provider_compatibility_probe_pricing.v0.1" as const;
export const OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_MANIFEST_VERSION_V01 =
  "operational_reentry_parser_closed_provider_compatibility_probe_manifest.v0.1" as const;
export const OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_REPORT_VERSION_V01 =
  "operational_reentry_parser_closed_provider_compatibility_probe_report.v0.1" as const;

export type OperationalReentryParserClosedProviderCompatibilityProbeShapeV01 =
  | "A"
  | "B"
  | "C"
  | "D";

export type OperationalReentryParserClosedProviderCompatibilityProbeOutcomeV01 =
  | "accepted_all_shapes"
  | "provider_rejected"
  | "provider_response_invalid"
  | "transport_or_runtime_incomplete"
  | "not_run";

export type OperationalReentryParserClosedProviderCompatibilityProbeTerminalCategoryV01 =
  | "accepted_and_normalized"
  | "provider_rejected"
  | "provider_response_invalid"
  | "transport_failed"
  | "timed_out"
  | "cancelled"
  | "blocked_before_egress"
  | "internal_failure"
  | "not_attempted_after_terminal_failure";

export interface OperationalReentryParserClosedProviderCompatibilityProbeAuthorizationV01 {
  authorization_version: typeof OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_AUTHORIZATION_VERSION_V01;
  authorization_id: string;
  authorization_kind: "one_bounded_parser_closed_provider_compatibility_probe";
  request_family_kind: "parser_closed_compatibility_probe";
  future_live_issue_number: number;
  exact_merged_source_head: string;
  repository_slug: "hynk-studio/augnes-perspective-lab";
  authorized_origin:
    | "https://github.com/hynk-studio/augnes-perspective-lab.git"
    | "git@github.com:hynk-studio/augnes-perspective-lab.git";
  issued_at: string;
  expires_at: string;
  workspace_id: string;
  project_id: string;
  expected_active_selection_revision: number;
  project_root_fingerprint: string;
  gateway_authorization_project_is_lab_experiment_meaning: false;
  case_fingerprint: string;
  common_task_evidence_fingerprint: string;
  representative_shape_plan_fingerprint: string;
  route_fingerprint: string;
  provider_contract_fingerprint: string;
  adapter_request_route_fingerprint: string;
  provider_contract_version: "operational_reentry_clean_control_matched_cohort_provider_contract.v0.3";
  codec_version: "operational_reentry_matched_cohort_codec.v0.4";
  response_schema_version: "operational_reentry_matched_cohort_response_schema.v0.4";
  parser_version: "operational_reentry_matched_cohort_parser.v0.3";
  adapter_implementation_id: "openai_responses.operational_reentry_matched_cohort";
  adapter_implementation_version: "openai_responses_operational_reentry_matched_cohort_adapter.v0.5";
  response_invalid_observation_version: "model_provider_response_invalid_observation.v0.1";
  response_bytes: 1168;
  max_output_tokens: 1168;
  pricing_fingerprint: string;
  pricing_snapshot_evaluated_at: string;
  pricing_authority_fingerprint: string;
  pricing_authority_expires_at: string;
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
  adaptive_prompt_schema_or_input_changes: false;
  stop_after_first_non_success_terminal_result: true;
  second_probe_authorized: false;
  issue_208_authorization_reuse: false;
  behavioral_cohort_authorized: false;
  replication_authorized: false;
  policy_authorized: false;
  stage_7_authorized: false;
  maximum_total_cost_nano_usd: 250_000_000;
  integrity: OperationalReentryMatchedCohortIntegrityV03;
}

export type OperationalReentryParserClosedProviderCompatibilityProbeProviderContractV01 =
  OperationalReentryMatchedCohortProviderContractV03;

export interface OperationalReentryParserClosedProviderCompatibilityProbeRepresentativeShapePlanEntryV01 {
  canonical_order: 0 | 1 | 2 | 3;
  shape: OperationalReentryParserClosedProviderCompatibilityProbeShapeV01;
  call_slot_id: string;
  representative_input_fingerprint: string;
  common_task_evidence_fingerprint: string;
  non_target_continuation_fingerprint: string;
  treatment_material_fingerprint: string;
  schema_fingerprint: string;
  provider_visible_request_fingerprint: string;
  adapter_request_route_fingerprint: string;
  model_input: OperationalReentryMatchedCohortModelInputV03;
  strict_schema_preflight: "passed";
}

export interface OperationalReentryParserClosedProviderCompatibilityProbeRepresentativeShapePlanV01 {
  representative_plan_version: "operational_reentry_parser_closed_representative_shape_plan.v0.1";
  case_fingerprint: string;
  common_task_evidence_fingerprint: string;
  canonical_order: readonly ["A", "B", "C", "D"];
  entries: OperationalReentryParserClosedProviderCompatibilityProbeRepresentativeShapePlanEntryV01[];
  integrity: OperationalReentryMatchedCohortIntegrityV03;
}

export interface OperationalReentryParserClosedProviderCompatibilityProbePlanEntryV01
  extends OperationalReentryParserClosedProviderCompatibilityProbeRepresentativeShapePlanEntryV01 {
  request_family_trace_id: string;
  client_request_id: string;
}

export interface OperationalReentryParserClosedProviderCompatibilityProbePlanArtifactEntryV01
  extends Omit<
    OperationalReentryParserClosedProviderCompatibilityProbePlanEntryV01,
    "model_input"
  > {
  provider_visible_input_persisted: false;
  raw_request_body_persisted: false;
}

export interface OperationalReentryParserClosedProviderCompatibilityProbePlanV01 {
  plan_version: typeof OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_PLAN_VERSION_V01;
  authorization_fingerprint: string;
  source_repository_head_sha: string;
  future_live_issue_number: number;
  request_family_kind: "parser_closed_compatibility_probe";
  request_family_basis_fingerprint: string;
  representative_shape_plan_fingerprint: string;
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
  entries: OperationalReentryParserClosedProviderCompatibilityProbePlanEntryV01[];
  integrity: OperationalReentryMatchedCohortIntegrityV03;
}

export interface OperationalReentryParserClosedProviderCompatibilityProbePricingV01 {
  pricing_version: typeof OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_PRICING_VERSION_V01;
  provider_ref: ExternalRefV01;
  model_ref: ExternalRefV01;
  route_fingerprint: string;
  pricing_source: "official_openai_model_page";
  pricing_source_url: "https://developers.openai.com/api/docs/models/gpt-4.1-mini";
  pricing_source_version: string;
  pricing_effective_at: string;
  pricing_expires_at: string;
  evaluated_at: string;
  input_nano_usd_per_token: 400;
  cached_input_nano_usd_per_token: 100;
  output_nano_usd_per_token: 1600;
  gateway_cost_budget: ModelGatewayCostBudgetV01;
  per_shape_worst_case_cost_nano_usd: number;
  aggregate_worst_case_cost_nano_usd: number;
  aggregate_ceiling_nano_usd: 250_000_000;
  missing_usage_or_exact_cost: "unknown_never_zero";
  integrity: OperationalReentryMatchedCohortIntegrityV03;
}

export interface OperationalReentryParserClosedProviderCompatibilityProbeManifestV01 {
  manifest_version: typeof OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_MANIFEST_VERSION_V01;
  probe_version: typeof OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_VERSION_V01;
  probe_id: string;
  future_live_issue_number: number;
  source_repository_head_sha: string;
  authorization_fingerprint: string;
  source_ref: OperationalReentryMatchedCohortCaseV02["source_ref"];
  case_fingerprint: string;
  common_task_evidence_fingerprint: string;
  representative_shape_plan_fingerprint: string;
  plan_fingerprint: string;
  route: OperationalReentryMatchedCohortRouteV03;
  provider_contract_fingerprint: string;
  adapter_request_route_fingerprint: string;
  response_invalid_observation_version: "model_provider_response_invalid_observation.v0.1";
  response_bytes: 1168;
  max_output_tokens: 1168;
  pricing_fingerprint: string;
  pricing_authority_fingerprint: string;
  request_family_kind: "parser_closed_compatibility_probe";
  provider_egress: "allow_only_with_supplied_future_authorization";
  execution_mode: "live";
  data_classification: "public_safe";
  retention_class: "none";
  raw_prompt_persisted: false;
  raw_request_body_persisted: false;
  raw_provider_response_persisted: false;
  raw_provider_error_persisted: false;
  hidden_reasoning_persisted: false;
  credentials_or_full_headers_persisted: false;
  manual_retries: 0;
  replacement_calls: 0;
  integrity: OperationalReentryMatchedCohortIntegrityV03;
}

export interface OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01 {
  canonical_order: 0 | 1 | 2 | 3;
  shape: OperationalReentryParserClosedProviderCompatibilityProbeShapeV01;
  call_slot_id: string;
  terminal_category: OperationalReentryParserClosedProviderCompatibilityProbeTerminalCategoryV01;
  egress_attempted: boolean;
  request_family_kind: "parser_closed_compatibility_probe";
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
  normalized_output: OperationalReentryMatchedCohortModelOutputV03 | null;
  normalized_output_fingerprint: string | null;
  receipt: ModelInvocationReceiptV02 | null;
  provider_rejection_observation: ModelProviderRejectionObservationV01 | null;
  provider_response_invalid_observation: ModelProviderResponseInvalidObservationV01 | null;
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
  integrity: OperationalReentryMatchedCohortIntegrityV03;
}

export interface OperationalReentryParserClosedProviderCompatibilityProbeReportV01 {
  report_version: typeof OPERATIONAL_REENTRY_PARSER_CLOSED_PROVIDER_COMPATIBILITY_PROBE_REPORT_VERSION_V01;
  probe_id: string;
  outcome: OperationalReentryParserClosedProviderCompatibilityProbeOutcomeV01;
  planned_shapes: 4;
  shape_records: number;
  terminal_shape_count: number;
  attempted_provider_calls: number;
  accepted_and_normalized_shapes: number;
  not_attempted_after_terminal_failure: number;
  source_head_and_tracked_worktree_unchanged_at_terminal: boolean;
  authorization_consumed: boolean;
  first_terminal_failure: OperationalReentryParserClosedProviderCompatibilityProbeTerminalCategoryV01 | null;
  terminal_category_counts: Record<
    OperationalReentryParserClosedProviderCompatibilityProbeTerminalCategoryV01,
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
  compatibility_scope_boundary: {
    accepted_all_shapes_means_provider_contract_only: true;
    normalized_outputs_reused_as_behavioral_evidence: false;
    behavioral_evaluator_built_or_invoked: false;
    e1_evaluator_built_or_invoked: false;
    pairwise_or_conditioning_reset_generated: false;
    continuation_benefit_or_harm_claim_generated: false;
    rank_or_winner_generated: false;
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
    authorizes_behavioral_cohort: false;
    authorizes_replication: false;
    authorizes_policy: false;
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
  integrity: OperationalReentryMatchedCohortIntegrityV03;
}

export interface OperationalReentryParserClosedProviderCompatibilityProbePreparedV01 {
  authorization: OperationalReentryParserClosedProviderCompatibilityProbeAuthorizationV01;
  manifest: OperationalReentryParserClosedProviderCompatibilityProbeManifestV01;
  case: OperationalReentryMatchedCohortCaseV02;
  provider_contract: OperationalReentryParserClosedProviderCompatibilityProbeProviderContractV01;
  representative_shape_plan: OperationalReentryParserClosedProviderCompatibilityProbeRepresentativeShapePlanV01;
  plan: OperationalReentryParserClosedProviderCompatibilityProbePlanV01;
  pricing: OperationalReentryParserClosedProviderCompatibilityProbePricingV01;
}

export interface OperationalReentryParserClosedProviderCompatibilityProbeExecutionResultV01
  extends OperationalReentryParserClosedProviderCompatibilityProbePreparedV01 {
  result_kind: "complete" | "incomplete";
  shapes: OperationalReentryParserClosedProviderCompatibilityProbeShapeTerminalV01[];
  report: OperationalReentryParserClosedProviderCompatibilityProbeReportV01;
}
