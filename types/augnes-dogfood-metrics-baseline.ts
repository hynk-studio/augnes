/**
 * Type-only Repeated Augnes-on-Augnes Dogfood / Metrics Baseline v0.2 contract.
 *
 * This file imports only types, performs no reads or writes, calls no routes,
 * providers, OpenAI, GitHub, Codex runtime, runner runtime, or browser storage,
 * and has no side effects.
 */

import type { AugnesDogfoodReport } from "./augnes-dogfood";
import type { WorkplaneBrowserRegressionReport } from "./workplane-browser-regression";
import type { LegacyCockpitControlClassificationRead } from "./legacy-cockpit-local-control-classification";

export const AUGNES_DOGFOOD_METRICS_BASELINE_VERSION =
  "augnes_dogfood_metrics_baseline.v0.2" as const;

export const AUGNES_DOGFOOD_BASELINE_SIGNAL_IDS = [
  "resume_latency",
  "review_burden",
  "delta_batch_quality",
  "guidebrief_debug_usefulness",
  "intent_projection_usefulness",
  "autonomy_yield",
  "stale_context_visibility",
  "cockpit_shrink_readiness",
  "browser_regression_stability",
  "local_control_classification_readiness",
] as const;

export const AUGNES_DOGFOOD_BASELINE_TRENDS = [
  "improving",
  "steady",
  "degrading",
  "insufficient_data",
  "unknown",
] as const;

export type AugnesDogfoodBaselineStatus =
  | "passed"
  | "partial"
  | "needs_review"
  | "blocked"
  | "insufficient_data";

export type AugnesDogfoodBaselineSignalStatus =
  AugnesDogfoodBaselineStatus;

export type AugnesDogfoodBaselineIterationStatus =
  AugnesDogfoodBaselineStatus;

export type AugnesDogfoodBaselineMetricTrend =
  (typeof AUGNES_DOGFOOD_BASELINE_TRENDS)[number];

export type AugnesDogfoodBaselineSignalId =
  (typeof AUGNES_DOGFOOD_BASELINE_SIGNAL_IDS)[number];

export interface AugnesDogfoodBaselineAuthorityBoundary {
  surface: "augnes_dogfood_metrics_baseline";
  baseline_is_local_harness: true;
  baseline_is_product_execution_authority: false;
  product_workbench_render_remains_read_only: true;
  temp_fixture_writes_are_script_smoke_only: boolean;
  can_write_product_db: false;
  can_delete_legacy_cockpit: false;
  can_shrink_legacy_cockpit: false;
  can_hide_legacy_cockpit: false;
  can_change_product_ui_behavior: false;
  can_add_product_route: false;
  can_add_api_write_route: false;
  can_add_server_action: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_actuate_github: false;
  can_execute_codex: false;
  can_execute_runner_in_product: false;
  can_tick_runner_in_product: false;
  can_recover_delta_batch_in_product: false;
  can_schedule_runner_in_product: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_apply_durable_memory: false;
  can_apply_perspective: false;
  can_auto_apply_delta: false;
  can_merge_publish_retry_replay_deploy: false;
  can_absorb_local_write_control_without_contract: false;
  can_create_temp_runner_fixture: boolean;
  can_tick_temp_runner_fixture: boolean;
  can_recover_temp_delta_batch_fixture: boolean;
  can_write_temp_baseline_artifact: boolean;
  notes: string[];
}

export interface AugnesDogfoodBaselineInput {
  scope?: string;
  now?: string;
  iteration_count?: number;
  output_dir?: string;
  iterations?: AugnesDogfoodBaselineIteration[];
  dogfood_reports?: AugnesDogfoodReport[];
  browser_regression_report?: WorkplaneBrowserRegressionReport;
  browser_regression_html?: string;
  browser_regression_url?: string;
  skip_browser_regression?: boolean;
  local_control_classification?: LegacyCockpitControlClassificationRead;
  resume_latency_evidence_refs?: string[];
  review_burden_evidence_refs?: string[];
  caveats?: string[];
  source_refs?: string[];
}

export interface AugnesDogfoodBaselineIteration {
  iteration_id: string;
  iteration_index: number;
  status: AugnesDogfoodBaselineIterationStatus;
  db_path: string | null;
  report_path: string | null;
  dogfood_report_version: AugnesDogfoodReport["report_version"] | null;
  dogfood_status: AugnesDogfoodBaselineStatus;
  recovered_batch_id: string | null;
  recovered_delta_count: number;
  metrics_status: string | null;
  dogfood_readiness_status: string | null;
  cockpit_shrink_readiness_status: string | null;
  browser_regression_status: string | null;
  browser_regression_recommendation: string | null;
  local_control_classification_status: string | null;
  local_control_unknown_count: number;
  evaluation_signal_statuses: Partial<
    Record<AugnesDogfoodBaselineSignalId, AugnesDogfoodBaselineSignalStatus>
  >;
  delta_batch_identity_separation: {
    delta_projection_perspective_delta: boolean;
    projected_delta_batch_perspective_delta: boolean;
    delta_batch_runner_delta_batch: boolean;
  };
  caveats: string[];
  source_refs: string[];
}

export interface AugnesDogfoodBaselineSignal {
  signal_id: AugnesDogfoodBaselineSignalId;
  status: AugnesDogfoodBaselineSignalStatus;
  trend: AugnesDogfoodBaselineMetricTrend;
  summary: string;
  iteration_status_sequence: AugnesDogfoodBaselineSignalStatus[];
  evidence_refs: string[];
  source_refs: string[];
  caveats: string[];
  recommended_next_review: string;
}

export interface AugnesDogfoodBaselineAggregate {
  status: AugnesDogfoodBaselineStatus;
  iteration_count: number;
  meaningful_iteration_count: number;
  recovered_batch_ids: string[];
  recovered_delta_counts: number[];
  metrics_status_sequence: string[];
  dogfood_readiness_sequence: string[];
  cockpit_shrink_readiness_sequence: string[];
  shrink_gated: true;
  shrink_gate_summary: string;
  browser_regression_status: string | null;
  browser_regression_recommendation: string | null;
  local_control_classification_status: string | null;
  local_control_unknown_count: number;
  signals: AugnesDogfoodBaselineSignal[];
  recommended_next_reviews: string[];
  caveats: string[];
  source_refs: string[];
}

export interface AugnesDogfoodBaselineReport {
  report_version: typeof AUGNES_DOGFOOD_METRICS_BASELINE_VERSION;
  status: AugnesDogfoodBaselineStatus;
  scope: string;
  created_at: string;
  iteration_model: {
    default_iteration_count: number;
    minimum_meaningful_iterations: 2;
    product_workbench_creates_fixture_runs: false;
    temp_runner_fixture_per_iteration: boolean;
  };
  authority_boundary: AugnesDogfoodBaselineAuthorityBoundary;
  iterations: AugnesDogfoodBaselineIteration[];
  aggregate: AugnesDogfoodBaselineAggregate;
  recommended_next_reviews: string[];
  caveats: string[];
  source_refs: string[];
  validation_summary: {
    status: "partial";
    smoke_refs: string[];
    docs_refs: string[];
    notes: string[];
  };
}
