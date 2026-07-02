export const LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_VERSION =
  "legacy_cockpit_local_control_classification.v0.1" as const;

export type LegacyCockpitControlClass =
  | "read_only_visibility"
  | "copy_only"
  | "export_only"
  | "preview_only"
  | "local_draft"
  | "local_write"
  | "external_authority_forbidden"
  | "compatibility_only"
  | "unknown";

export type LegacyCockpitControlAuthorityClass =
  | "no_authority"
  | "copy_authority"
  | "local_preview_authority"
  | "local_write_authority"
  | "external_execution_authority"
  | "forbidden_authority"
  | "unknown_authority";

export type LegacyCockpitControlStatus =
  | "classified"
  | "needs_review"
  | "blocked"
  | "obsolete_with_rationale"
  | "retained_compatibility"
  | "native_absorption_candidate"
  | "forbidden";

export type LegacyCockpitControlMigrationTarget =
  | "native_workplane_read_only"
  | "native_workplane_copy_only"
  | "native_workplane_preview_only"
  | "compatibility_only_until_authority_contract"
  | "forbidden_do_not_absorb"
  | "obsolete_do_not_absorb"
  | "needs_browser_manual_review";

export type LegacyCockpitControlGroupId =
  | "overview_work_brief"
  | "handoff_copy_export"
  | "perspective_preview"
  | "bridge_navigation"
  | "operator_review_controls"
  | "proposal_review_controls"
  | "evidence_trace_loaders"
  | "runner_trace_controls"
  | "external_forbidden_controls"
  | "unknown_legacy_controls";

export interface LegacyCockpitLocalControl {
  control_id: string;
  group_id: LegacyCockpitControlGroupId;
  legacy_surface: string;
  observed_or_documented_source: string;
  control_class: LegacyCockpitControlClass;
  authority_class: LegacyCockpitControlAuthorityClass;
  status: LegacyCockpitControlStatus;
  migration_target: LegacyCockpitControlMigrationTarget;
  native_replacement_or_candidate: string;
  compatibility_path: string;
  required_before_absorption: string[];
  shrink_gate_effect: string;
  recommended_next_review: string;
  source_refs: string[];
  notes: string[];
}

export interface LegacyCockpitControlGroup {
  group_id: LegacyCockpitControlGroupId;
  title: string;
  summary: string;
  control_ids: string[];
  default_control_class: LegacyCockpitControlClass;
  default_authority_class: LegacyCockpitControlAuthorityClass;
  default_migration_target: LegacyCockpitControlMigrationTarget;
}

export interface LegacyCockpitControlClassificationAuthorityBoundary {
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
  can_absorb_local_write_control_without_contract: false;
}

export interface LegacyCockpitControlClassificationCounts {
  by_class: Record<LegacyCockpitControlClass, number>;
  by_status: Record<LegacyCockpitControlStatus, number>;
  by_migration_target: Record<LegacyCockpitControlMigrationTarget, number>;
}

export interface LegacyCockpitControlClassificationValidationSummary {
  smoke_refs: string[];
  summary: string;
}

export interface LegacyCockpitControlClassificationInput {
  as_of?: string;
  source_text?: string;
  html?: string;
}

export interface LegacyCockpitControlClassificationRead {
  version: typeof LEGACY_COCKPIT_LOCAL_CONTROL_CLASSIFICATION_VERSION;
  status: "classified" | "needs_review";
  as_of: string;
  control_groups: LegacyCockpitControlGroup[];
  controls: LegacyCockpitLocalControl[];
  counts: LegacyCockpitControlClassificationCounts;
  native_absorption_candidates: LegacyCockpitLocalControl[];
  compatibility_only_controls: LegacyCockpitLocalControl[];
  forbidden_controls: LegacyCockpitLocalControl[];
  unknown_controls: LegacyCockpitLocalControl[];
  required_next_reviews: string[];
  shrink_gate_notes: string[];
  authority_boundary: LegacyCockpitControlClassificationAuthorityBoundary;
  source_refs: string[];
  validation_summary: LegacyCockpitControlClassificationValidationSummary;
}
