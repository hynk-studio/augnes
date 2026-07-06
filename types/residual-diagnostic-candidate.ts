/**
 * Residual Diagnostic Candidate Layer v0.1.
 *
 * Read-only candidate read model over already-built Workbench, dogfood, and
 * handoff spine material. It does not write records, create schema, call routes,
 * call providers, or promote diagnostics into durable state.
 */

import type { CurrentWorkingPerspectiveRouteIntegrationRead } from "./current-working-perspective-route-integration-read";
import type { CurrentWorkingPerspectiveRouteIntegrationReadReview } from "./current-working-perspective-route-integration-read-review";
import type { DogfoodMetricSnapshotRecordReview } from "./dogfood-metric-snapshot-record-review";
import type { ExpectedObservedDeltaRecordReview } from "./expected-observed-delta-record-review";
import type { NextWorkSignalDecisionRecordReview } from "./next-work-signal-decision-record-review";
import type { PerspectiveRelayUpdateDecisionRecordReview } from "./perspective-relay-update-decision-record-review";
import type { ReuseOutcomeBridgeLedgerRecordReview } from "./reuse-outcome-bridge-ledger-record-review";
import type { WorkEpisodeResidueCandidatePreview } from "./work-episode-residue-candidate-preview";
import type { WorkbenchDogfoodLoopSpineOverview } from "./workbench-dogfood-loop-spine-overview";
import type { WorkbenchSpineConsolidation } from "./workbench-spine-consolidation";

export const RESIDUAL_DIAGNOSTIC_CANDIDATE_VERSION =
  "residual_diagnostic_candidate_read_model.v0.1" as const;

export type ResidualDiagnosticDashboardStatus =
  | "no_signal"
  | "insufficient_data"
  | "candidates_available"
  | "actionable_candidates_available"
  | "blocked";

export type ResidualDiagnosticCandidateCategory =
  | "authority_boundary_drift"
  | "source_ref_lineage_mismatch"
  | "route_integration_mode_mismatch"
  | "review_writer_validation_drift"
  | "no_side_effects_replay_inconsistency"
  | "local_fulfillment_upstream_gap"
  | "external_delivery_boundary_pressure"
  | "workbench_ia_overload"
  | "expected_observed_mismatch"
  | "reuse_outcome_gap"
  | "insufficient_data";

export type ResidualDiagnosticCandidateStatus =
  | "candidate"
  | "actionable_candidate"
  | "blocked"
  | "insufficient_data"
  | "ordinary_missing_only"
  | "suppressed"
  | "no_signal";

export type ResidualDiagnosticSeverity = "low" | "medium" | "high";
export type ResidualDiagnosticConfidence = "low" | "medium" | "high";

export interface ResidualDiagnosticCandidateInput {
  workbench_spine_consolidation?: WorkbenchSpineConsolidation | unknown;
  workbench_dogfood_loop_spine_overview?: WorkbenchDogfoodLoopSpineOverview | unknown;
  current_working_perspective_route_integration_read?: CurrentWorkingPerspectiveRouteIntegrationRead | unknown;
  current_working_perspective_route_integration_read_review?: CurrentWorkingPerspectiveRouteIntegrationReadReview | unknown;
  expected_observed_delta_record_review?: ExpectedObservedDeltaRecordReview | unknown;
  reuse_outcome_bridge_ledger_record_review?: ReuseOutcomeBridgeLedgerRecordReview | unknown;
  work_episode_residue_candidate_preview?: WorkEpisodeResidueCandidatePreview | unknown;
  dogfood_metric_snapshot_record_review?: DogfoodMetricSnapshotRecordReview | unknown;
  next_work_signal_decision_record_review?: NextWorkSignalDecisionRecordReview | unknown;
  perspective_relay_update_decision_record_review?: PerspectiveRelayUpdateDecisionRecordReview | unknown;
  scope?: string;
  as_of?: string;
  source_refs?: string[];
}

export interface ResidualDiagnosticObservedSignal {
  signal_id: string;
  category: ResidualDiagnosticCandidateCategory;
  source: string;
  summary: string;
  ordinary_missing: boolean;
  materialized_inconsistency: boolean;
  evidence_ref: string | null;
}

export interface ResidualDiagnosticCandidate {
  candidate_id: string;
  category: ResidualDiagnosticCandidateCategory;
  label: string;
  status: ResidualDiagnosticCandidateStatus;
  severity: ResidualDiagnosticSeverity;
  confidence: ResidualDiagnosticConfidence;
  pattern_key: string;
  summary: string;
  source_signal_count: number;
  repeated_evidence_count: number;
  source_refs: string[];
  evidence_refs: string[];
  observed_signals: ResidualDiagnosticObservedSignal[];
  ordinary_missing_prerequisites: string[];
  materialized_inconsistencies: string[];
  false_leap_contrast: string;
  minimum_verification: string[];
  suggested_next_hardening_target: string;
  why_now: string[];
  non_goals: string[];
  read_only: true;
}

export interface ResidualDiagnosticCandidateSummary {
  candidate_count: number;
  actionable_candidate_count: number;
  blocked_candidate_count: number;
  insufficient_data_candidate_count: number;
  repeated_pattern_count: number;
  materialized_inconsistency_count: number;
  ordinary_missing_count: number;
  recommended_next_hardening_target: string;
}

export interface ResidualDiagnosticAuthorityBoundary {
  read_only: true;
  advisory_only: true;
  candidate_layer_only: true;
  derived_read_model: true;
  source_of_truth: false;
  can_write_db: false;
  can_create_schema: false;
  can_create_route: false;
  can_call_route: false;
  can_write_residual_diagnostic_record: false;
  can_promote_diagnostic_candidate: false;
  can_mutate_current_working_perspective: false;
  can_mutate_handoff_context: false;
  can_write_selected_refs_to_live_handoff: false;
  can_send_handoff: false;
  can_call_send_provider: false;
  can_call_external_messaging: false;
  can_call_email: false;
  can_call_slack: false;
  can_call_webhook: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_call_browser_or_crawler: false;
  can_write_clipboard: false;
  can_download_file: false;
  can_write_arbitrary_file: false;
  can_write_memory: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_write_dogfood_metrics: false;
  can_update_global_dogfood_metrics: false;
  can_create_pr: false;
  can_merge_pr: false;
  can_run_autonomous_action: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  can_render_workbench_action_button: false;
  notes: string[];
}

export interface ResidualDiagnosticCandidateReadModel {
  diagnostic_version: typeof RESIDUAL_DIAGNOSTIC_CANDIDATE_VERSION;
  scope: "project:augnes";
  as_of: string;
  dashboard_status: ResidualDiagnosticDashboardStatus;
  source_refs: string[];
  candidate_summary: ResidualDiagnosticCandidateSummary;
  residual_candidates: ResidualDiagnosticCandidate[];
  insufficient_data: string[];
  ordinary_missing_prerequisites: string[];
  materialized_inconsistencies: string[];
  authority_boundary: ResidualDiagnosticAuthorityBoundary;
  would_not_do: string[];
  non_goals: string[];
}
