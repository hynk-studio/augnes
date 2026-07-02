/**
 * Type-only Augnes-on-Augnes Dogfood v0.1 contract.
 *
 * This file imports only types, performs no reads or writes, calls no routes,
 * providers, OpenAI, GitHub, Codex runtime, runner runtime, or browser storage,
 * and has no side effects.
 */

import type {
  AutonomyRunRecord,
  RecoveredAutonomyDeltaBatch,
} from "./autonomy-runner-execution";
import type { AgentWorkplaneNodeContextRead } from "./agent-workplane-node";
import type { AugnesWorkflowMetricsRead } from "./augnes-workflow-metrics";
import type { GuideWorkplaneDebugContext } from "./guide-debug-context";
import type { WorkplaneIntentProjection } from "./workplane-intent-projection";
import type { WorkplaneContextRead } from "@/lib/workplane/read-workplane-context";
import type { WorkplaneRunnerDeltaBatchRead } from "@/lib/workplane/read-runner-delta-batches-for-workplane";

export const AUGNES_DOGFOOD_VERSION = "augnes_dogfood.v0.1" as const;

export const AUGNES_DOGFOOD_SIGNAL_IDS = [
  "resume_latency",
  "delta_batch_quality",
  "guidebrief_debug_usefulness",
  "intent_projection_usefulness",
  "review_burden",
  "autonomy_yield",
  "stale_context_visibility",
  "cockpit_shrink_readiness",
] as const;

export type AugnesDogfoodStatus =
  | "passed"
  | "partial"
  | "needs_review"
  | "blocked"
  | "insufficient_data";

export type AugnesDogfoodStepStatus = AugnesDogfoodStatus;

export type AugnesDogfoodSignalStatus = AugnesDogfoodStatus;

export type AugnesDogfoodSignalId =
  (typeof AUGNES_DOGFOOD_SIGNAL_IDS)[number];

export interface AugnesDogfoodAuthorityBoundary {
  surface: "augnes_on_augnes_dogfood";
  dogfood_is_local_harness: true;
  dogfood_is_product_execution_authority: false;
  product_workbench_render_remains_read_only: true;
  temp_fixture_writes_are_script_smoke_only: boolean;
  can_write_product_db_from_workbench: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_actuate_github: false;
  can_execute_codex: false;
  can_create_branch_or_pr: false;
  can_apply_project_perspective: false;
  can_apply_durable_memory: false;
  can_auto_apply_delta: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_send_handoff: false;
  can_merge_publish_retry_replay_deploy: false;
  can_delete_or_shrink_legacy_cockpit: false;
  can_add_product_route: false;
  can_add_server_action: false;
  can_add_ui_execution_control: false;
  can_create_temp_runner_fixture: boolean;
  can_tick_temp_runner_fixture: boolean;
  can_recover_temp_delta_batch_fixture: boolean;
  can_write_temp_dogfood_artifact: boolean;
  notes: string[];
}

export interface AugnesDogfoodInput {
  scope?: string;
  now?: string;
  dbPath?: string;
  outputPath?: string;
  tempDir?: string;
  runner_run?: AutonomyRunRecord;
  runner_runs?: AutonomyRunRecord[];
  recovered_delta_batch?: RecoveredAutonomyDeltaBatch;
  runner_delta_batch_read?: WorkplaneRunnerDeltaBatchRead;
  workplane_context?: WorkplaneContextRead;
  node_context_read?: AgentWorkplaneNodeContextRead;
  guidebrief_debug_contexts?: GuideWorkplaneDebugContext[];
  intent_projections?: WorkplaneIntentProjection[];
  metrics_readout?: AugnesWorkflowMetricsRead;
  cockpit_inventory_text?: string;
  native_absorption_map_text?: string;
  artifacts?: AugnesDogfoodArtifactRef[];
  caveats?: string[];
}

export interface AugnesDogfoodRunnerFixtureSummary {
  fixture_mode:
    | "temp_runner_ledger_fixture"
    | "supplied_fixture"
    | "empty";
  db_path: string | null;
  run_id: string | null;
  run_status: string | null;
  run_title: string | null;
  step_count: number;
  completed_step_count: number;
  event_count: number;
  recovered_batch_id: string | null;
  recovered_batch_status: string | null;
  recovered_delta_count: number;
  recovered_validation_status: string | null;
  source_refs: string[];
}

export interface AugnesDogfoodWorkplaneSnapshot {
  scope: string;
  status: AugnesDogfoodStepStatus;
  source_status: {
    current_perspective: string | null;
    delta_projection: string | null;
    runner_delta_batch: string | null;
  };
  fallback_reasons: string[];
  runner_delta_batch_read_status: string | null;
  recovered_batch_count: number;
  recovered_delta_count: number;
  latest_batch_id: string | null;
  latest_run_id: string | null;
  delta_batch_identity_separation: {
    delta_projection_perspective_delta: boolean;
    projected_delta_batch_perspective_delta: boolean;
    delta_batch_runner_delta_batch: boolean;
  };
  stale_or_fallback_visible: boolean;
  notes: string[];
}

export interface AugnesDogfoodGuideBriefSnapshot {
  status: AugnesDogfoodStepStatus;
  debug_context_count: number;
  debug_context_ids: string[];
  matched_contexts: string[];
  selection_statuses: Record<string, string>;
  observed_count: number;
  inferred_count: number;
  suggested_count: number;
  needs_user_judgment_count: number;
  stale_warning_count: number;
  codex_handoff_candidate_statuses: string[];
  notes: string[];
}

export interface AugnesDogfoodIntentProjectionSnapshot {
  status: AugnesDogfoodStepStatus;
  projection_count: number;
  projection_ids: string[];
  intent_classes: string[];
  projection_statuses: string[];
  prioritized_panels: string[];
  candidate_action_count: number;
  candidate_handoff_count: number;
  candidate_runner_config_count: number;
  candidate_perspective_update_count: number;
  reversible: boolean;
  durable_state_changed: boolean;
  notes: string[];
}

export interface AugnesDogfoodMetricsSnapshot {
  status: AugnesDogfoodStepStatus;
  metrics_status: string | null;
  runner_metrics_status: string | null;
  dogfood_readiness_status: string | null;
  cockpit_shrink_readiness_status: string | null;
  recovered_delta_batch_visibility_metric: string | null;
  projected_vs_recovered_deltabatch_identity_metric: string | null;
  resume_latency_metric: string | null;
  autonomy_yield_metric: string | null;
  review_burden_metric: string | null;
  caveats: string[];
  recommended_next_review: string | null;
}

export interface AugnesDogfoodEvaluationSignal {
  signal_id: AugnesDogfoodSignalId;
  status: AugnesDogfoodSignalStatus;
  summary: string;
  evidence_refs: string[];
  metric_refs: string[];
  caveats: string[];
  recommended_next_review: string;
}

export interface AugnesDogfoodEvaluation {
  status: AugnesDogfoodStatus;
  signals: AugnesDogfoodEvaluationSignal[];
  summary: string;
  recommended_next_review: string;
}

export interface AugnesDogfoodArtifactRef {
  artifact_ref: string;
  artifact_kind:
    | "json_report"
    | "temp_runner_ledger"
    | "doc"
    | "smoke"
    | "script"
    | "metrics_readout";
  pointer_semantics: "pointer_only";
  summary: string;
  durable_product_state: false;
}

export interface AugnesDogfoodReport {
  report_version: typeof AUGNES_DOGFOOD_VERSION;
  status: AugnesDogfoodStatus;
  scope: string;
  created_at: string;
  authority_boundary: AugnesDogfoodAuthorityBoundary;
  runner_fixture_summary: AugnesDogfoodRunnerFixtureSummary;
  workplane_snapshot: AugnesDogfoodWorkplaneSnapshot;
  guidebrief_snapshot: AugnesDogfoodGuideBriefSnapshot;
  intent_projection_snapshot: AugnesDogfoodIntentProjectionSnapshot;
  metrics_snapshot: AugnesDogfoodMetricsSnapshot;
  evaluation: AugnesDogfoodEvaluation;
  artifacts: AugnesDogfoodArtifactRef[];
  caveats: string[];
  recommended_next_review: string;
  validation_summary: {
    status: "partial";
    smoke_refs: string[];
    docs_refs: string[];
    notes: string[];
  };
}
