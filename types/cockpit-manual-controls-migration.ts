/**
 * Type-only Cockpit Manual Controls Migration v0.1 contract.
 *
 * This contract classifies the remaining Legacy Cockpit manual controls for
 * native Workplane review. It imports nothing, performs no reads or writes,
 * calls no routes, providers, OpenAI, GitHub, Codex, runner runtime,
 * proof/evidence, memory apply, Perspective apply, or delta apply helpers,
 * and has no side effects.
 */

export const COCKPIT_MANUAL_CONTROLS_MIGRATION_VERSION =
  "cockpit_manual_controls_migration.v0.1" as const;

export const COCKPIT_MANUAL_CONTROL_MIGRATION_STATUSES = [
  "migrated_native_review",
  "retained_blocked",
  "obsolete_delete",
  "retained_temporarily",
  "needs_authority_contract",
] as const;

export const COCKPIT_MANUAL_CONTROL_MIGRATION_DESTINATIONS = [
  "workplane_state_proposal_review",
  "blocked_until_authority_contract",
  "delete",
  "retained_temporarily_in_cockpit",
] as const;

export const COCKPIT_MANUAL_CONTROL_CLASSES = [
  "preview_only",
  "copy_only",
  "read_only",
  "local_draft_review",
  "local_write",
  "apply_control",
  "commit_reject_control",
  "external_execution_forbidden",
  "obsolete",
] as const;

export const COCKPIT_MANUAL_CONTROL_AUTHORITY_CLASSES = [
  "no_authority",
  "copy_authority",
  "preview_authority",
  "review_only_authority",
  "local_write_authority_blocked",
  "durable_apply_authority_blocked",
  "external_execution_forbidden",
] as const;

export type CockpitManualControlMigrationStatus =
  (typeof COCKPIT_MANUAL_CONTROL_MIGRATION_STATUSES)[number];

export type CockpitManualControlMigrationDestination =
  (typeof COCKPIT_MANUAL_CONTROL_MIGRATION_DESTINATIONS)[number];

export type CockpitManualControlMigrationControlClass =
  (typeof COCKPIT_MANUAL_CONTROL_CLASSES)[number];

export type CockpitManualControlMigrationAuthorityClass =
  (typeof COCKPIT_MANUAL_CONTROL_AUTHORITY_CLASSES)[number];

export interface CockpitManualControlMigrationAuthorityBoundary {
  marker: "read_only_preview_only_no_apply";
  can_write_product_db: false;
  can_create_evidence: false;
  can_record_proof: false;
  can_apply_memory: false;
  can_apply_perspective: false;
  can_auto_apply_delta: false;
  can_commit_proposal: false;
  can_reject_proposal: false;
  can_approve_proposal: false;
  can_write_local_storage: false;
  can_use_session_storage: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_actuate_github: false;
  can_execute_codex: false;
  can_execute_runner: false;
  can_tick_runner: false;
  can_recover_delta_batch: false;
  can_schedule_runner: false;
  can_merge_publish_retry_replay_deploy: false;
  can_delete_cockpit_route: false;
  can_delete_augnes_cockpit_component: false;
}

export interface CockpitManualControlMigrationRecord {
  control_id: string;
  title: string;
  control_class: CockpitManualControlMigrationControlClass;
  authority_class: CockpitManualControlMigrationAuthorityClass;
  migration_status: CockpitManualControlMigrationStatus;
  destination: CockpitManualControlMigrationDestination;
  source_refs: string[];
  review_surface: "workplane_state_proposal_review" | "none";
  reason: string;
  validation_refs: string[];
  delete_when: string;
  blocked_until: string;
  authority_note: string;
}

export interface CockpitManualControlMigrationSummary {
  migrated_native_review_count: number;
  retained_blocked_count: number;
  obsolete_delete_count: number;
  retained_temporarily_count: number;
  needs_authority_contract_count: number;
  total_record_count: number;
}

export interface CockpitManualControlMigrationRead {
  migration_version: typeof COCKPIT_MANUAL_CONTROLS_MIGRATION_VERSION;
  scope: "cockpit_manual_controls_migration_v0_1";
  source_status: "static_migration_evidence";
  status: "ready";
  summary: CockpitManualControlMigrationSummary;
  migrated_records: CockpitManualControlMigrationRecord[];
  blocked_records: CockpitManualControlMigrationRecord[];
  obsolete_records: CockpitManualControlMigrationRecord[];
  records: CockpitManualControlMigrationRecord[];
  authority_boundary: CockpitManualControlMigrationAuthorityBoundary;
  source_refs: string[];
  validation_refs: string[];
  notes: string[];
}
