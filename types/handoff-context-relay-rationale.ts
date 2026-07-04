/**
 * Type-only Handoff Context Relay Rationale v0.1 contract.
 *
 * This contract describes a derived read model that consumes the Workplane
 * Continuity Relay and existing Handoff Capsule / Codex Launch Card preview
 * context. It adds no route, store, provider call, Codex execution, handoff
 * send, durable memory write, Perspective apply, graph/vector/RAG/crawler, or
 * external side effect.
 */

export const HANDOFF_CONTEXT_RELAY_RATIONALE_VERSION =
  "handoff_context_relay_rationale.v0.1" as const;

export type HandoffContextRelayRationaleRefKind =
  | "continuity_anchor"
  | "continuity_source_ref"
  | "handoff_capsule"
  | "codex_launch_card"
  | "handoff_source_ref"
  | "route_ref"
  | "docs_ref";

export type HandoffContextRelayRationaleReasonCategory =
  | "preserve_current_work"
  | "warn_about_reuse"
  | "block_confident_handoff_if_missing"
  | "guide_next_focus"
  | "carry_source_ref"
  | "carry_non_goal"
  | "expect_return_signal";

export type HandoffContextRelayRationaleSeverity =
  | "info"
  | "low"
  | "medium"
  | "high"
  | "blocking";

export interface HandoffContextRelayRationale {
  runtime: "augnes";
  rationale_version: typeof HANDOFF_CONTEXT_RELAY_RATIONALE_VERSION;
  scope: string;
  as_of: string;
  source_refs: HandoffContextRelayRationaleSourceRefs;
  selected_refs: HandoffContextRelaySelectedRef[];
  why_included: HandoffContextRelayWhyIncluded[];
  stale_or_gap_warnings: HandoffContextRelayWarning[];
  excluded_or_deferred_refs: HandoffContextRelayDeferredRef[];
  stop_if_missing: HandoffContextRelayStopItem[];
  non_goals: string[];
  expected_return_signal: HandoffContextRelayExpectedReturnSignal;
  authority_boundary: HandoffContextRelayAuthorityBoundary;
  source_status: HandoffContextRelaySourceStatus;
  fallback_reason: HandoffContextRelayFallbackReason;
  notes: string[];
}

export interface HandoffContextRelayRationaleSourceRefs {
  continuity_relay_ref: string | null;
  handoff_capsule_ref: string | null;
  codex_launch_card_ref: string | null;
  current_working_perspective_ref: string | null;
  guide_brief_ref: string | null;
  delta_projection_ref: string | null;
  workplane_ref: "/workbench";
  source_refs: string[];
  selected_source_refs: string[];
  evidence_refs: string[];
  artifact_refs: string[];
  handoff_refs: string[];
  diagnostic_refs: string[];
  route_refs: string[];
  docs_refs: string[];
}

export interface HandoffContextRelaySelectedRef {
  ref_id: string;
  ref_kind: HandoffContextRelayRationaleRefKind;
  label: string;
  summary: string;
  source_refs: string[];
  reason_category: HandoffContextRelayRationaleReasonCategory;
  origin: "continuity_relay" | "handoff_preview" | "derived_boundary";
  priority: number;
  blocks_handoff: boolean;
}

export interface HandoffContextRelayWhyIncluded {
  ref_id: string;
  reason_category: HandoffContextRelayRationaleReasonCategory;
  rationale: string;
  source_refs: string[];
}

export interface HandoffContextRelayWarning {
  warning_id: string;
  summary: string;
  source_refs: string[];
  severity: HandoffContextRelayRationaleSeverity;
  blocks_handoff: boolean;
}

export interface HandoffContextRelayDeferredRef {
  ref_id: string;
  reason: string;
  source_refs: string[];
}

export interface HandoffContextRelayStopItem {
  stop_id: string;
  summary: string;
  source_refs: string[];
  blocks_handoff: boolean;
}

export interface HandoffContextRelayExpectedReturnSignal {
  signal_version: "expected_return_signal.v0.1";
  required_fields: string[];
  context_feedback_fields: string[];
  instructions: string[];
}

export interface HandoffContextRelaySourceStatus {
  continuity_relay: "supplied" | "missing";
  current_perspective: string;
  delta_projection: string;
  guide_brief: string;
  handoff_preview_source: string;
  handoff_capsule: string;
  codex_launch_card: string;
}

export interface HandoffContextRelayFallbackReason {
  continuity_relay: string | null;
  current_perspective: string | null;
  delta_projection: string | null;
  guide_brief: string | null;
  handoff_preview: string[];
}

export interface HandoffContextRelayAuthorityBoundary {
  source_of_truth: false;
  derived_read_model: true;
  read_only_context_compilation: true;
  advisory_only: true;
  can_write_db: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_update_work: false;
  can_mutate_memory: false;
  can_promote_memory: false;
  can_apply_project_perspective: false;
  can_create_promotion_decision: false;
  can_create_formation_receipt: false;
  can_call_provider_openai: false;
  can_call_github: false;
  can_execute_codex: false;
  can_execute_runner: false;
  can_create_branch_or_pr: false;
  can_send_handoff: false;
  can_create_graph_or_vector_store: false;
  can_create_rag_stack: false;
  can_crawl_or_observe_browser: false;
  can_launch_autonomous_action: false;
  can_merge_publish_retry_replay_deploy: false;
  notes: string[];
}
