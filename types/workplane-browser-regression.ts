/**
 * Type-only Workplane native replacement browser regression contract v0.1.
 *
 * This file defines a local, report-only regression shape for parsing
 * server-rendered /workbench HTML. It performs no reads, writes, fetches,
 * route calls, browser storage, provider/OpenAI/GitHub/Codex calls, runner
 * execution, DeltaBatch recovery, product persistence, or Legacy Cockpit
 * shrink.
 */

export const WORKPLANE_BROWSER_REGRESSION_VERSION =
  "workplane_browser_regression.v0.1" as const;

export type WorkplaneBrowserRegressionStatus =
  | "passed"
  | "partial"
  | "failed"
  | "skipped"
  | "blocked"
  | "needs_review";

export type WorkplaneBrowserRegressionCheckStatus =
  | "passed"
  | "partial"
  | "failed"
  | "skipped"
  | "blocked"
  | "needs_review";

export type WorkplaneBrowserRegressionSurface =
  | "agent_workplane"
  | "guidebrief_debug"
  | "guidebrief_intent_projection"
  | "workplane_metrics"
  | "delta_projection"
  | "projected_delta_batch"
  | "runner_delta_batch"
  | "legacy_cockpit_compatibility"
  | "native_replacement"
  | "shrink_readiness";

export interface WorkplaneBrowserRegressionMarkerCheck {
  check_id: string;
  surface: WorkplaneBrowserRegressionSurface;
  marker: string;
  status: WorkplaneBrowserRegressionCheckStatus;
  found: boolean;
  summary: string;
}

export interface WorkplaneBrowserRegressionSectionCheck {
  check_id: string;
  surface: WorkplaneBrowserRegressionSurface;
  text: string;
  status: WorkplaneBrowserRegressionCheckStatus;
  found: boolean;
  summary: string;
}

export interface WorkplaneBrowserRegressionNoControlCheck {
  check_id: string;
  surface: WorkplaneBrowserRegressionSurface;
  segment_marker: string;
  status: WorkplaneBrowserRegressionCheckStatus;
  forbidden_controls_found: string[];
  summary: string;
}

export interface WorkplaneBrowserRegressionCapabilityCheck {
  capability_id:
    | "work_brief"
    | "handoff"
    | "perspective"
    | "bridge"
    | "operator_visibility"
    | "work_run_visibility"
    | "source_ref_visibility"
    | "review_memory_proposal_visibility"
    | "validation_smoke_visibility"
    | "local_ui_controls";
  legacy_surface: string;
  native_markers: string[];
  compatibility_marker: string;
  status: WorkplaneBrowserRegressionCheckStatus;
  summary: string;
  recommended_next_check: string;
}

export interface WorkplaneBrowserRegressionAuthorityBoundary {
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
  can_execute_runner: false;
  can_tick_runner: false;
  can_recover_delta_batch: false;
  can_schedule_runner: false;
  can_write_product_db: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_apply_durable_memory: false;
  can_apply_perspective: false;
  can_auto_apply_delta: false;
  can_merge_publish_retry_replay_deploy: false;
}

export interface WorkplaneBrowserRegressionInput {
  html: string;
  url?: string;
  checked_at?: string;
  source?: "server_rendered_html" | "browser_dom" | "computer_use" | "cdp";
  metrics_status?: string;
  dogfood_status?: string;
  cockpit_shrink_readiness?: string;
  notes?: string[];
}

export interface WorkplaneBrowserRegressionRecommendation {
  status: WorkplaneBrowserRegressionCheckStatus;
  decision:
    | "do_not_shrink"
    | "browser_regression_passed_shrink_gated"
    | "eligible_for_shrink_candidate_review";
  summary: string;
  next_phase: string;
  blockers: string[];
}

export interface WorkplaneBrowserRegressionReport {
  version: typeof WORKPLANE_BROWSER_REGRESSION_VERSION;
  status: WorkplaneBrowserRegressionStatus;
  url: string | null;
  checked_at: string;
  source: WorkplaneBrowserRegressionInput["source"];
  marker_checks: WorkplaneBrowserRegressionMarkerCheck[];
  section_checks: WorkplaneBrowserRegressionSectionCheck[];
  no_control_checks: WorkplaneBrowserRegressionNoControlCheck[];
  capability_checks: WorkplaneBrowserRegressionCapabilityCheck[];
  deltabatch_identity_checks: WorkplaneBrowserRegressionMarkerCheck[];
  deltabatch_identity_status: WorkplaneBrowserRegressionCheckStatus;
  legacy_compatibility_status: WorkplaneBrowserRegressionCheckStatus;
  no_control_status: WorkplaneBrowserRegressionCheckStatus;
  marker_summary: {
    passed: number;
    failed: number;
    blocked: number;
  };
  capability_summary: {
    passed: number;
    partial: number;
    needs_review: number;
    failed: number;
    blocked: number;
  };
  authority_boundary: WorkplaneBrowserRegressionAuthorityBoundary;
  recommendation: WorkplaneBrowserRegressionRecommendation;
  notes: string[];
}
