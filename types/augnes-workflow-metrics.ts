/**
 * Type-only Augnes workflow metrics v0.1 contract.
 *
 * Metrics are read-only signals. This file imports only types, performs no
 * reads or writes, calls no routes, providers, OpenAI, GitHub, Codex runtime,
 * runner runtime, or browser storage, and has no side effects.
 */

import type { AutonomyRunRecord } from "./autonomy-runner-execution";
import type { AgentWorkplaneNodeContextRead } from "./agent-workplane-node";
import type { GuideWorkplaneDebugContext } from "./guide-debug-context";
import type { WorkplaneIntentProjection } from "./workplane-intent-projection";
import type { WorkplaneContextRead } from "@/lib/workplane/read-workplane-context";

export const AUGNES_WORKFLOW_METRICS_VERSION =
  "augnes_workflow_metrics.v0.1" as const;

export const AUGNES_METRIC_STATUSES = [
  "healthy",
  "watch",
  "needs_review",
  "blocked",
  "unknown",
  "insufficient_data",
] as const;

export const AUGNES_METRIC_TRENDS = [
  "improving",
  "steady",
  "degrading",
  "unknown",
] as const;

export const AUGNES_WORKFLOW_METRIC_GROUP_IDS = [
  "runner",
  "workplane",
  "guidebrief",
  "handoff",
  "stale_context",
  "cockpit_absorption",
  "dogfood_readiness",
] as const;

export const AUGNES_WORKFLOW_CORE_METRIC_IDS = [
  "handoff_loss_rate",
  "resume_latency_signal",
  "perspective_delta_quality_signal",
  "review_burden_signal",
  "autonomy_yield_signal",
  "stale_context_incident_count",
  "delta_noise_signal",
  "research_integration_yield_signal",
] as const;

export const RUNNER_WORKFLOW_METRIC_IDS = [
  "run_completion_rate",
  "scheduled_run_success_rate",
  "delta_batch_recovery_rate",
  "cancelled_run_safety_rate",
  "paused_run_non_execution_rate",
  "forbidden_action_attempt_count",
  "runner_error_rate",
  "average_run_duration_ms",
  "average_delta_batch_count_per_run",
  "needs_review_ratio",
] as const;

export const WORKPLANE_GUIDEBRIEF_METRIC_IDS = [
  "recovered_delta_batch_visibility_rate",
  "workplane_review_queue_load",
  "workplane_fallback_source_count",
  "workplane_stale_source_count",
  "intent_projection_reversibility_signal",
  "guidebrief_debug_context_coverage_signal",
  "projected_vs_recovered_deltabatch_identity_signal",
  "cockpit_compatibility_dependency_signal",
] as const;

export type AugnesMetricStatus = (typeof AUGNES_METRIC_STATUSES)[number];

export type AugnesMetricTrend = (typeof AUGNES_METRIC_TRENDS)[number];

export type AugnesWorkflowMetricGroupId =
  (typeof AUGNES_WORKFLOW_METRIC_GROUP_IDS)[number];

export type AugnesWorkflowMetricId =
  | (typeof AUGNES_WORKFLOW_CORE_METRIC_IDS)[number]
  | (typeof RUNNER_WORKFLOW_METRIC_IDS)[number]
  | (typeof WORKPLANE_GUIDEBRIEF_METRIC_IDS)[number];

export interface AugnesMetricSignal {
  signal_id: string;
  label: string;
  value: number | null;
  unit: "ratio" | "count" | "milliseconds" | "signal";
  numerator: number | null;
  denominator: number | null;
  status: AugnesMetricStatus;
  trend: AugnesMetricTrend;
  summary: string;
  source_refs: string[];
  caveats: string[];
}

export interface AugnesMetricAuthorityBoundary {
  surface: "runner_workplane_metrics";
  read_only_metrics: true;
  metrics_are_authority: false;
  can_write_db: false;
  can_write_runner_ledger: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_update_work: false;
  can_mutate_memory: false;
  can_apply_project_perspective: false;
  can_apply_durable_memory: false;
  can_auto_apply_delta: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_actuate_github: false;
  can_execute_codex: false;
  can_execute_runner: false;
  can_schedule_runner: false;
  can_recover_delta_batch: false;
  can_create_branch_or_pr: false;
  can_send_handoff: false;
  can_merge_publish_retry_replay_deploy: false;
  can_delete_legacy_cockpit: false;
  notes: string[];
}

export interface AugnesWorkflowMetric extends AugnesMetricSignal {
  metric_id: AugnesWorkflowMetricId;
  group_id: AugnesWorkflowMetricGroupId;
  validation_refs: string[];
}

export interface AugnesWorkflowMetricGroup {
  group_id: AugnesWorkflowMetricGroupId;
  title: string;
  summary: string;
  status: AugnesMetricStatus;
  metrics: AugnesWorkflowMetric[];
}

export interface RunnerWorkflowMetrics {
  group_id: "runner";
  run_completion_rate: AugnesWorkflowMetric;
  scheduled_run_success_rate: AugnesWorkflowMetric;
  delta_batch_recovery_rate: AugnesWorkflowMetric;
  cancelled_run_safety_rate: AugnesWorkflowMetric;
  paused_run_non_execution_rate: AugnesWorkflowMetric;
  forbidden_action_attempt_count: AugnesWorkflowMetric;
  runner_error_rate: AugnesWorkflowMetric;
  average_run_duration_ms: AugnesWorkflowMetric;
  average_delta_batch_count_per_run: AugnesWorkflowMetric;
  needs_review_ratio: AugnesWorkflowMetric;
}

export interface WorkplaneReviewMetrics {
  group_id: "workplane";
  recovered_delta_batch_visibility_rate: AugnesWorkflowMetric;
  workplane_review_queue_load: AugnesWorkflowMetric;
  workplane_fallback_source_count: AugnesWorkflowMetric;
  workplane_stale_source_count: AugnesWorkflowMetric;
  review_burden_signal: AugnesWorkflowMetric;
  stale_context_incident_count: AugnesWorkflowMetric;
  perspective_delta_quality_signal: AugnesWorkflowMetric;
}

export interface GuideBriefProjectionMetrics {
  group_id: "guidebrief";
  intent_projection_reversibility_signal: AugnesWorkflowMetric;
  guidebrief_debug_context_coverage_signal: AugnesWorkflowMetric;
  projected_vs_recovered_deltabatch_identity_signal: AugnesWorkflowMetric;
  handoff_loss_rate: AugnesWorkflowMetric;
}

export interface LegacyCockpitReadinessMetrics {
  group_id: "cockpit_absorption";
  cockpit_compatibility_dependency_signal: AugnesWorkflowMetric;
  summary: string;
  shrink_readiness_status: AugnesMetricStatus;
}

export interface DogfoodReadinessMetrics {
  group_id: "dogfood_readiness";
  autonomy_yield_signal: AugnesWorkflowMetric;
  delta_noise_signal: AugnesWorkflowMetric;
  resume_latency_signal: AugnesWorkflowMetric;
  research_integration_yield_signal: AugnesWorkflowMetric;
  summary: string;
  readiness_status: AugnesMetricStatus;
}

export interface AugnesWorkflowMetricsInput {
  scope?: string;
  now?: string;
  limit?: number;
  dbPath?: string;
  runner_runs?: AutonomyRunRecord[];
  workplane_context?: WorkplaneContextRead;
  node_context_read?: AgentWorkplaneNodeContextRead;
  debug_context?: GuideWorkplaneDebugContext;
  intent_projection?: WorkplaneIntentProjection;
  cockpit_inventory_text?: string;
  native_absorption_map_text?: string;
}

export interface AugnesWorkflowMetricsRead {
  metrics_version: typeof AUGNES_WORKFLOW_METRICS_VERSION;
  scope: string;
  as_of: string;
  status: AugnesMetricStatus;
  summary: string;
  groups: AugnesWorkflowMetricGroup[];
  core_metrics: AugnesWorkflowMetric[];
  runner_metrics: RunnerWorkflowMetrics;
  workplane_review_metrics: WorkplaneReviewMetrics;
  guidebrief_projection_metrics: GuideBriefProjectionMetrics;
  legacy_cockpit_readiness_metrics: LegacyCockpitReadinessMetrics;
  dogfood_readiness_metrics: DogfoodReadinessMetrics;
  source_refs: string[];
  caveats: string[];
  validation_summary: {
    status: "not_run" | "passed" | "partial" | "skipped";
    smoke_refs: string[];
    docs_refs: string[];
    notes: string[];
  };
  authority_boundary: AugnesMetricAuthorityBoundary;
  recommended_next_review: string;
}
