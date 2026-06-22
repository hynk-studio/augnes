import type {
  AgentPerspectiveSourceRef,
  AgentPerspectiveSourceSnapshotRef,
  AgentPerspectiveSubstrateSnapshot,
  AgentPerspectiveSurfacingType,
} from "@/types/agent-perspective-substrate";

export type AgentPerspectiveSubstratePreviewMode = "folded_advisory_audit";

export type AgentPerspectiveSubstratePreviewVersion =
  "agent_perspective_substrate_preview.v0.1";

export interface AgentPerspectiveSubstratePreviewInput {
  substrateSnapshot: AgentPerspectiveSubstrateSnapshot;
  perspectiveGeometryDigestRefs?: string[];
  preview_mode?: AgentPerspectiveSubstratePreviewMode;
  scope?: string;
  as_of?: string;
  filters?: Record<string, unknown>;
}

export interface AgentPerspectiveSubstratePreviewSourceRef {
  substrate_version: string;
  scope: string;
  as_of: string;
  source_ref_count: number;
  surfacing_candidate_count: number;
  rule_fire_count: number;
  source_snapshot_ref: AgentPerspectiveSourceSnapshotRef;
}

export interface AgentPerspectiveSubstratePreviewSection {
  section_id: string;
  section_title: string;
  section_kind:
    | "blockers"
    | "warnings"
    | "notices"
    | "retrieval_hints"
    | "handoff_improvements"
    | "stale_context"
    | "product_write_stopline"
    | "source_coverage";
  folded_by_default: true;
  item_count: number;
  severity_counts: {
    blocker: number;
    warning: number;
    notice: number;
    info: number;
  };
  source_ref_count: number;
  representative_card_ids: string[];
  authority_boundary_notes: string[];
  preview_only: true;
}

export interface AgentPerspectiveSurfacingPreviewCard {
  card_id: string;
  source_surfacing_candidate_id: string;
  substrate_node_ids: string[];
  substrate_edge_ids: string[];
  rule_fire_ids: string[];
  card_kind: AgentPerspectiveSurfacingType;
  title: string;
  message: string;
  severity: "info" | "notice" | "warning" | "blocker";
  impact: "low" | "medium" | "high" | "critical";
  confidence: number;
  epistemic_status: string;
  review_status: string;
  why_now: string;
  source_refs: AgentPerspectiveSourceRef[];
  source_coverage_boundary_note: string | null;
  suggested_user_actions: Array<
    | "inspect"
    | "dismiss_preview"
    | "pin_preview"
    | "downgrade_preview"
    | "invalidate_preview"
    | "add_to_capsule_preview"
    | "exclude_from_capsule_preview"
  >;
  may_interrupt_user: boolean;
  execution_authority: false;
  durable_write_authority: false;
  route_action_available: false;
  db_write_available: false;
  external_call_available: false;
  agent_execution_available: false;
  product_write_available: false;
  retrieval_executed_now?: false;
  authority_boundary_notes: string[];
  folded_section_ids: string[];
}

export interface AgentPerspectiveRulePreviewGroup {
  rule_group_id: string;
  severity: "info" | "notice" | "warning" | "blocker";
  rule_names: string[];
  rule_fire_ids: string[];
  source_node_ids: string[];
  surfacing_card_ids: string[];
  source_refs: AgentPerspectiveSourceRef[];
  why_now_summary: string;
  authority_boundary_notes: string[];
}

export interface AgentPerspectiveSourceCoveragePreview {
  total_source_ref_count: number;
  surfaced_card_count: number;
  cards_with_source_refs_count: number;
  cards_with_boundary_note_count: number;
  cards_missing_source_refs_without_boundary_note_count: number;
  source_ref_coverage_ratio: number;
  source_refs_missing_count: number;
  source_ref_ids: string[];
  source_coverage_warnings: string[];
}

export interface AgentPerspectivePreviewDiagnostics {
  folded_section_count: number;
  surfacing_card_count: number;
  blocker_card_count: number;
  warning_card_count: number;
  notice_card_count: number;
  info_card_count: number;
  retrieval_hint_card_count: number;
  handoff_improvement_card_count: number;
  stale_context_card_count: number;
  product_write_stopline_card_count: number;
  source_ref_coverage_ratio: number;
  missing_source_ref_without_boundary_count: number;
  preview_cards_with_execution_authority_count: number;
  preview_cards_with_durable_write_authority_count: number;
  product_write_stopline_respected: true;
  substrate_consumed_as_advisory: true;
  preview_is_authority: false;
}

export interface AgentPerspectivePreviewAuthorityBoundary {
  derived_view_only: true;
  source_of_truth: false;
  can_commit_or_reject_state: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_update_work: false;
  can_create_work_item: false;
  can_execute_agents: false;
  can_route_agents: false;
  can_call_external_services: false;
  can_call_providers_or_openai: false;
  can_run_retrieval_or_rag: false;
  can_fetch_sources: false;
  can_promote_perspective: false;
  can_allocate_product_ids: false;
  can_execute_product_write: false;
  can_open_db: false;
  can_execute_sql: false;
  can_execute_transaction: false;
  can_add_route_or_ui: false;
  advisory_only: true;
  preview_only: true;
}

export interface AgentPerspectivePreviewValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface AgentPerspectiveSubstratePreview {
  runtime: "augnes";
  preview_version: AgentPerspectiveSubstratePreviewVersion;
  scope: string;
  as_of: string;
  preview_mode: AgentPerspectiveSubstratePreviewMode;
  source_substrate_ref: AgentPerspectiveSubstratePreviewSourceRef;
  source_digest_refs: string[];
  folded_sections: AgentPerspectiveSubstratePreviewSection[];
  surfacing_cards: AgentPerspectiveSurfacingPreviewCard[];
  rule_groups: AgentPerspectiveRulePreviewGroup[];
  source_coverage_preview: AgentPerspectiveSourceCoveragePreview;
  diagnostics: AgentPerspectivePreviewDiagnostics;
  authority_boundary: AgentPerspectivePreviewAuthorityBoundary;
  validation: AgentPerspectivePreviewValidationResult;
  fingerprint: string;
  recommendation_status: "ready_for_cockpit_folded_audit_panel";
  next_recommended_slice: "cockpit_agent_perspective_substrate_folded_audit_panel_v0_1";
}
