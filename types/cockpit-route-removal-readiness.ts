/**
 * Cockpit Route Removal Readiness v0.1 contract.
 *
 * This type-only contract verifies whether remaining Legacy Cockpit capability
 * coverage has reached zero before a later PR deletes the route/component. It
 * imports nothing, performs no reads or writes, calls no routes, providers,
 * OpenAI, GitHub, Codex, runner runtime, proof/evidence, memory apply,
 * Perspective apply, or delta apply helpers, and has no side effects.
 */

export const COCKPIT_ROUTE_REMOVAL_READINESS_VERSION =
  "cockpit_route_removal_readiness.v0.1" as const;

export const COCKPIT_ROUTE_REMOVAL_READINESS_STATUSES = [
  "ready_for_route_removal",
  "not_ready",
  "blocked",
  "needs_manual_review",
] as const;

export const COCKPIT_ROUTE_REMOVAL_CAPABILITY_DISPOSITIONS = [
  "migrated_to_blank_state",
  "migrated_to_workplane",
  "migrated_to_state_proposal_review",
  "migrated_to_manual_migration_review",
  "blocked_until_authority_contract",
  "obsolete_delete",
  "forbidden_delete",
  "retained_temporarily",
] as const;

export type CockpitRouteRemovalReadinessStatus =
  (typeof COCKPIT_ROUTE_REMOVAL_READINESS_STATUSES)[number];

export type CockpitRouteRemovalCapabilityDisposition =
  (typeof COCKPIT_ROUTE_REMOVAL_CAPABILITY_DISPOSITIONS)[number];

export interface CockpitRouteRemovalAuthorityBoundary {
  marker: "readiness_only_no_delete";
  can_delete_cockpit_route: false;
  can_delete_augnes_cockpit_component: false;
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
}

export interface CockpitRouteRemovalCapabilityRecord {
  capability_id: string;
  title: string;
  source_stage: string;
  previous_destination: string;
  disposition: CockpitRouteRemovalCapabilityDisposition;
  native_surface: string;
  evidence_refs: string[];
  is_unique_useful_cockpit_only: boolean;
  deletion_safe: boolean;
  blocked_reason: string;
  authority_note: string;
  verification_note: string;
}

export interface CockpitRouteRemovalBlockingCondition {
  condition_id: string;
  title: string;
  status: "open" | "cleared";
  blocks_route_removal: boolean;
  evidence_refs: string[];
  authority_note: string;
}

export interface CockpitRouteRemovalReadinessRead {
  readiness_version: typeof COCKPIT_ROUTE_REMOVAL_READINESS_VERSION;
  as_of: string;
  status: CockpitRouteRemovalReadinessStatus;
  summary: string;
  unique_useful_cockpit_capability_count: number;
  zero_count_verified: boolean;
  route_removal_allowed: false;
  component_removal_allowed: false;
  capability_records: CockpitRouteRemovalCapabilityRecord[];
  blocking_conditions: CockpitRouteRemovalBlockingCondition[];
  authority_boundary: CockpitRouteRemovalAuthorityBoundary;
  validation_refs: string[];
  next_pr_target: string;
}
