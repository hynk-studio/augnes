/**
 * Type-only Legacy Cockpit DOM/manual control inventory + proposal diff
 * preflight v0.1 contract.
 *
 * This file imports only types, performs no reads or writes, calls no routes,
 * providers, OpenAI, GitHub, Codex runtime, runner runtime, or browser storage,
 * and has no side effects.
 */

import type { LegacyCockpitControlClassificationRead } from "./legacy-cockpit-local-control-classification";

export const LEGACY_COCKPIT_CONTROL_INVENTORY_VERSION =
  "legacy_cockpit_control_inventory.v0.1" as const;

export type LegacyCockpitControlInventoryStatus =
  | "passed"
  | "partial"
  | "needs_review"
  | "blocked";

export type LegacyCockpitControlInventoryControlClass =
  | "read_only"
  | "copy_only"
  | "preview_only"
  | "local_write"
  | "forbidden"
  | "unknown";

export type LegacyCockpitControlInventoryAuthorityClass =
  | "no_authority"
  | "copy_authority"
  | "local_preview_authority"
  | "local_write_authority"
  | "forbidden_authority"
  | "unknown_authority";

export type LegacyCockpitControlInventoryEvidenceKind =
  | "server_rendered_html"
  | "manual_dom_review"
  | "static_source"
  | "classification_v0_1";

export type LegacyCockpitControlInventoryEvidenceStatus =
  | "observed"
  | "inferred"
  | "not_observed"
  | "needs_manual_review";

export type LegacyCockpitProposalDiffPreflightStatus =
  | "sufficient_for_preflight"
  | "needs_richer_detail"
  | "insufficient_data"
  | "blocked";

export interface LegacyCockpitControlInventoryAuthorityBoundary {
  surface: "legacy_cockpit_control_inventory";
  inventory_is_evidence_not_shrink_authority: true;
  proposal_diff_preflight_is_read_only: true;
  can_write_product_db: false;
  can_delete_legacy_cockpit: false;
  can_shrink_legacy_cockpit: false;
  can_hide_legacy_cockpit: false;
  can_change_product_ui_behavior: false;
  can_add_product_route: false;
  can_add_api_write_route: false;
  can_add_server_action: false;
  can_add_chat_composer: false;
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
  can_approve_proposal: false;
  can_reject_proposal: false;
  can_commit_proposal: false;
  notes: string[];
}

export interface LegacyCockpitControlInventoryEvidence {
  evidence_id: string;
  control_id: string;
  evidence_kind: LegacyCockpitControlInventoryEvidenceKind;
  evidence_status: LegacyCockpitControlInventoryEvidenceStatus;
  observed_label: string;
  observed_in: string;
  source_ref: string;
  notes: string[];
}

export interface LegacyCockpitControlInventoryItem {
  control_id: string;
  previous_control_id: string | null;
  label: string;
  control_class: LegacyCockpitControlInventoryControlClass;
  authority_class: LegacyCockpitControlInventoryAuthorityClass;
  evidence_status: LegacyCockpitControlInventoryEvidenceStatus;
  evidence: LegacyCockpitControlInventoryEvidence[];
  previous_classification_class: string | null;
  previous_classification_status: string | null;
  previous_migration_target: string | null;
  unknown_reduction_effect:
    | "reduces_previous_unknown"
    | "keeps_previous_unknown"
    | "not_unknown_related";
  shrink_gate_effect: string;
  recommended_next_review: string;
}

export interface LegacyCockpitProposalDiffPreflight {
  status: LegacyCockpitProposalDiffPreflightStatus;
  needs_richer_proposal_diff_detail: boolean;
  can_apply_or_commit: false;
  observed_fields: string[];
  missing_fields: string[];
  evidence_refs: string[];
  recommendation: string;
  notes: string[];
}

export interface LegacyCockpitControlInventoryComparison {
  previous_report_version: LegacyCockpitControlClassificationRead["version"];
  previous_unknown_count: number;
  after_unknown_count: number;
  unknown_delta: number;
  unknown_reduction_claim: "reduced_with_evidence" | "unchanged" | "blocked";
  controls_compared: number;
  classified_with_dom_or_manual_evidence: number;
  local_write_controls_still_compatibility_only: number;
  forbidden_controls_still_forbidden: number;
  notes: string[];
}

export interface LegacyCockpitControlInventoryInput {
  as_of?: string;
  workbench_html?: string;
  compatibility_island_html?: string;
  source_text?: string;
  manual_evidence?: LegacyCockpitControlInventoryEvidence[];
  previous_classification?: LegacyCockpitControlClassificationRead;
  proposal_diff_source_text?: string;
  proposal_diff_evidence_refs?: string[];
  caveats?: string[];
  source_refs?: string[];
}

export interface LegacyCockpitControlInventoryReport {
  report_version: typeof LEGACY_COCKPIT_CONTROL_INVENTORY_VERSION;
  status: LegacyCockpitControlInventoryStatus;
  as_of: string;
  compatibility_marker_present: boolean;
  augnes_cockpit_component_present: boolean;
  server_rendered_compatibility_content_present: boolean;
  controls: LegacyCockpitControlInventoryItem[];
  counts: {
    by_class: Record<LegacyCockpitControlInventoryControlClass, number>;
    by_evidence_status: Record<LegacyCockpitControlInventoryEvidenceStatus, number>;
  };
  comparison_to_v0_1_classification: LegacyCockpitControlInventoryComparison;
  proposal_diff_preflight: LegacyCockpitProposalDiffPreflight;
  shrink_readiness: {
    status: "gated";
    summary: string;
    blockers: string[];
  };
  authority_boundary: LegacyCockpitControlInventoryAuthorityBoundary;
  recommended_next_reviews: string[];
  caveats: string[];
  source_refs: string[];
  validation_summary: {
    smoke_refs: string[];
    docs_refs: string[];
    notes: string[];
  };
}
