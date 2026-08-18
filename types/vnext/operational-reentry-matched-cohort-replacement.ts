import type { ModelProviderRejectionObservationV01 } from "@/lib/vnext/model-gateway/provider-rejection-observation";
import type {
  OperationalReentryMatchedCohortBlockEvaluationV01,
  OperationalReentryMatchedCohortCallPlanV01,
  OperationalReentryMatchedCohortCallTerminalV01,
  OperationalReentryMatchedCohortCaseV01,
  OperationalReentryMatchedCohortIntegrityV01,
  OperationalReentryMatchedCohortPairwiseRelationV01,
  OperationalReentryMatchedCohortRepeatabilityV01,
  OperationalReentryMatchedCohortRouteV01,
  OperationalReentryMatchedCohortRubricV01,
  OperationalReentryMatchedCohortTerminalCategoryV01,
} from "./operational-reentry-matched-cohort";
import type { ModelGatewayCostBudgetV01 } from "./model-invocation-receipt";
import type { OperationalReentryProviderCompatibilityProbeProviderContractV01 } from "./operational-reentry-provider-compatibility-probe";

export const OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_AUTHORIZATION_VERSION_V01 =
  "operational_reentry_matched_cohort_replacement_authorization.v0.1" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_LINEAGE_VERSION_V01 =
  "operational_reentry_matched_cohort_replacement_lineage.v0.1" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_PRICING_VERSION_V01 =
  "operational_reentry_matched_cohort_replacement_pricing.v0.1" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_MANIFEST_VERSION_V01 =
  "operational_reentry_matched_cohort_replacement_manifest.v0.1" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_REPORT_VERSION_V01 =
  "operational_reentry_matched_cohort_replacement_report.v0.1" as const;

export interface OperationalReentryMatchedCohortReplacementCompatibilityGateV01 {
  gate_version: "operational_reentry_matched_cohort_replacement_compatibility_gate.v0.1";
  namespace: ".augnes-lab/operational-reentry-provider-probes/";
  issue_number: 193;
  source_head: "838ea69ab61046706ba84643d864c59f4886d688";
  outcome: "accepted_all_shapes";
  planned_shapes: 4;
  attempted_provider_calls: 4;
  accepted_and_normalized_shapes: 4;
  retries: 0;
  second_probe: 0;
  report_fingerprint: "sha256:1ef3f21894272f390fcdacce80226383ae6d921c43712c3736a18843a8b08eb2";
  artifact_index_fingerprint: "sha256:19bc10cb3f9cbd6d2a0fb2b4df9fca6728c4bb4e571255e52f3c2d0fd7a6bd76";
  artifact_validation: "passed";
  normalized_probe_outputs_reused: false;
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryMatchedCohortReplacementLineageV01 {
  lineage_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_LINEAGE_VERSION_V01;
  authorization_kind: "authorized_replacement_after_historical_incomplete";
  request_family_kind: "replacement_cohort";
  historical_issue: 185;
  historical_pr: 186;
  historical_source_head: "123c5e31708a35c68be73b332d595bed9a9eea94";
  historical_result: "terminal_incomplete";
  historical_authorization_consumed: true;
  historical_rejection_cause: "unclassified";
  compatibility_probe_issue: 193;
  compatibility_source_head: "838ea69ab61046706ba84643d864c59f4886d688";
  compatibility_probe_result: "accepted_all_shapes";
  compatibility_report_fingerprint: "sha256:1ef3f21894272f390fcdacce80226383ae6d921c43712c3736a18843a8b08eb2";
  compatibility_artifact_index_fingerprint: "sha256:19bc10cb3f9cbd6d2a0fb2b4df9fca6728c4bb4e571255e52f3c2d0fd7a6bd76";
  replacement_count: 1;
  retry_of_historical_cohort: false;
  historical_artifacts_rewritten: false;
  further_cohort_authorized: false;
  second_replacement_authorized: false;
  stage_7_authorized: false;
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryMatchedCohortReplacementPricingV01 {
  pricing_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_PRICING_VERSION_V01;
  provider_ref: OperationalReentryMatchedCohortRouteV01["provider_ref"];
  model_ref: OperationalReentryMatchedCohortRouteV01["model_ref"];
  input_nano_usd_per_token: 400;
  cached_input_nano_usd_per_token: 100;
  output_nano_usd_per_token: 1600;
  pricing_source: "official_openai_model_page";
  pricing_source_url: "https://developers.openai.com/api/docs/models/gpt-4.1-mini";
  pricing_source_version: string;
  pricing_effective_at: string;
  pricing_expires_at: string;
  evaluated_at: string;
  gateway_cost_budget: ModelGatewayCostBudgetV01;
  per_call_worst_case_cost_nano_usd: number;
  aggregate_worst_case_cost_nano_usd: number;
  aggregate_ceiling_nano_usd: 250_000_000;
  missing_usage_or_exact_cost: "unknown_never_zero";
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryMatchedCohortReplacementAuthorizationV01 {
  authorization_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_AUTHORIZATION_VERSION_V01;
  authorization_id: string;
  authorization_kind: "authorized_replacement_after_historical_incomplete";
  request_family_kind: "replacement_cohort";
  future_live_issue_number: number;
  exact_merged_source_head: string;
  issued_at: string;
  expires_at: string;
  workspace_id: string;
  project_id: string;
  expected_active_selection_revision: number;
  project_root_fingerprint: string;
  gateway_authorization_project_is_lab_experiment_meaning: false;
  lineage_fingerprint: string;
  compatibility_gate_fingerprint: string;
  case_fingerprint: string;
  rubric_fingerprint: string;
  call_plan_fingerprint: string;
  route_fingerprint: string;
  provider_contract_fingerprint: string;
  pricing_authority_fingerprint: string;
  planned_calls: 16;
  repeat_blocks: 4;
  calls_per_arm: 4;
  maximum_parallel_calls: 1;
  retries: 0;
  replacement_calls: 0;
  adaptive_stopping: false;
  fresh_stateless_request_per_call: true;
  conversation_reuse: false;
  thread_reuse: false;
  previous_response_reuse: false;
  replacement_count: 1;
  retry_of_historical_cohort: false;
  historical_artifacts_rewritten: false;
  further_cohort_authorized: false;
  second_replacement_authorized: false;
  stage_7_authorized: false;
  maximum_total_cost_nano_usd: 250_000_000;
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryMatchedCohortReplacementManifestV01 {
  manifest_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_MANIFEST_VERSION_V01;
  replacement_cohort_id: string;
  future_live_issue_number: number;
  source_repository_head_sha: string;
  authorization_fingerprint: string;
  lineage_fingerprint: string;
  compatibility_gate_fingerprint: string;
  case_fingerprint: string;
  rubric_fingerprint: string;
  call_plan_fingerprint: string;
  route: OperationalReentryMatchedCohortRouteV01;
  pricing_fingerprint: string;
  provider_contract_fingerprint: string;
  request_family_kind: "replacement_cohort";
  request_family_trace_id: string;
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
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryMatchedCohortReplacementReportV01 {
  report_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_REPORT_VERSION_V01;
  replacement_cohort_id: string;
  completion_status: "complete" | "incomplete";
  planned_calls: 16;
  terminal_calls: number;
  source_head_and_tracked_worktree_unchanged_at_terminal: boolean;
  terminal_category_counts: Record<OperationalReentryMatchedCohortTerminalCategoryV01, number>;
  terminal_failure_code_counts: Record<string, number>;
  first_provider_rejection: ModelProviderRejectionObservationV01 | null;
  block_evaluations: OperationalReentryMatchedCohortBlockEvaluationV01[];
  repeatability: Array<{
    left_arm: "A" | "B" | "C";
    right_arm: "A" | "B" | "D";
    disposition: OperationalReentryMatchedCohortRepeatabilityV01;
    observed_relations: OperationalReentryMatchedCohortPairwiseRelationV01[];
  }>;
  exact_case_dispositions: {
    conditioning: "bounded_positive_signal" | "bounded_negative_signal" | "no_directional_signal" | "mixed" | "incomplete";
    reset: "repeatable_appropriate_reset" | "repeatable_stale_persistence" | "mixed" | "incomplete";
  };
  accounting: {
    attempted_provider_calls: number;
    completed_live_calls: number;
    failed_or_blocked_calls: number;
    missing_call_slots: number;
    provider_reported_input_tokens: number | null;
    provider_reported_cached_input_tokens: number | null;
    provider_reported_output_tokens: number | null;
    provider_reported_total_tokens: number | null;
    exact_cost_status: "calculated" | "unknown";
    calculated_exact_cost_nano_usd: number | null;
    aggregate_worst_case_cost_nano_usd: number;
    aggregate_ceiling_nano_usd: 250_000_000;
    latency_ms: { minimum: number | null; maximum: number | null; total: number | null };
    operator_intervention: { retries: 0; replacement_calls: 0; manual_normalized_output_edits: 0 };
  };
  limitations: string[];
  authority_ledger: {
    behavioral_result_is_exact_case_only: true;
    claims_hidden_actual_use: false;
    claims_general_causality: false;
    claims_general_benefit_or_harm: false;
    claims_model_or_provider_superiority: false;
    creates_scalar_rank_or_winner: false;
    authorizes_policy: false;
    authorizes_actor_or_population_promotion: false;
    authorizes_further_cohort: false;
    authorizes_stage_7: false;
    authorizes_publication: false;
    authorizes_ready_merge_or_auto_merge: false;
    writes_product_database: 0;
    writes_core: 0;
  };
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}

export interface OperationalReentryMatchedCohortReplacementPreparedV01 {
  authorization: OperationalReentryMatchedCohortReplacementAuthorizationV01;
  lineage: OperationalReentryMatchedCohortReplacementLineageV01;
  compatibility_gate: OperationalReentryMatchedCohortReplacementCompatibilityGateV01;
  manifest: OperationalReentryMatchedCohortReplacementManifestV01;
  case: OperationalReentryMatchedCohortCaseV01;
  rubric: OperationalReentryMatchedCohortRubricV01;
  call_plan: OperationalReentryMatchedCohortCallPlanV01;
  provider_contract: OperationalReentryProviderCompatibilityProbeProviderContractV01;
  pricing: OperationalReentryMatchedCohortReplacementPricingV01;
}

export interface OperationalReentryMatchedCohortReplacementExecutionResultV01
  extends OperationalReentryMatchedCohortReplacementPreparedV01 {
  result_kind: "complete" | "incomplete";
  calls: OperationalReentryMatchedCohortCallTerminalV01[];
  block_evaluations: OperationalReentryMatchedCohortBlockEvaluationV01[];
  report: OperationalReentryMatchedCohortReplacementReportV01;
}

export interface OperationalReentryMatchedCohortReplacementHarnessV01 {
  harness_version: "operational_reentry_matched_cohort_replacement_harness.v0.1";
  issue_number: 197;
  zero_provider_egress: true;
  replacement_authorizations_created: 0;
  replacement_authorizations_consumed: 0;
  replacement_provider_calls: 0;
  behavioral_result_exists: false;
  lineage: OperationalReentryMatchedCohortReplacementLineageV01;
  case_fingerprint: string;
  rubric_fingerprint: string;
  call_plan_fingerprint: string;
  planned_calls: 16;
  integrity: OperationalReentryMatchedCohortIntegrityV01;
}
