/**
 * Type-only GuideBrief / Cross-Surface Guide Core v0.1 contract.
 *
 * This file defines a portable read-only guide packet built from supplied
 * CurrentWorkingPerspective, AugnesDeltaProjectionReadModel, and lightweight
 * surface context. It imports only types, performs no DB reads or writes, calls
 * no routes, calls no providers, OpenAI, GitHub, or Codex runtime, and has no
 * side effects.
 */

import type {
  ArtifactRef,
  AugnesDelta,
  DeltaBatch,
  HandoffRef,
} from "./augnes-delta";
import type { AugnesDeltaProjectionReadModel } from "./augnes-delta-projection";
import type { CurrentWorkingPerspective } from "./current-working-perspective";

export const GUIDE_BRIEF_VERSION = "guide_brief.v0.1" as const;

export const GUIDE_BRIEF_SOURCE_SURFACES = [
  "current_working_perspective",
  "delta_projection",
  "human_surface",
  "perspective_timeline",
  "agent_workplane",
  "chatgpt_app",
  "codex",
  "perspective_capsule",
  "manual_context",
  "docs",
] as const;

export const GUIDE_BRIEF_SUGGESTED_SURFACES = [
  "human_home",
  "perspective_timeline",
  "agent_workplane",
  "chatgpt_app",
  "codex_handoff",
  "future_guide_panel",
  "future_autonomy_contract",
] as const;

export const GUIDE_BRIEF_SUGGESTED_ACTORS = [
  "user",
  "operator",
  "pm",
  "codex",
  "chatgpt",
  "future_agent",
  "augnes_core",
] as const;

export const GUIDE_BRIEF_CONFIDENCES = [
  "observed",
  "low",
  "medium",
  "high",
] as const;

export const GUIDE_BRIEF_JUDGMENT_URGENCIES = [
  "low",
  "medium",
  "high",
  "blocking",
] as const;

export type GuideBriefSourceSurface =
  (typeof GUIDE_BRIEF_SOURCE_SURFACES)[number];

export type GuideBriefSuggestedSurface =
  (typeof GUIDE_BRIEF_SUGGESTED_SURFACES)[number];

export type GuideBriefSuggestedActor =
  (typeof GUIDE_BRIEF_SUGGESTED_ACTORS)[number];

export type GuideBriefConfidence = (typeof GUIDE_BRIEF_CONFIDENCES)[number];

export type GuideBriefJudgmentUrgency =
  (typeof GUIDE_BRIEF_JUDGMENT_URGENCIES)[number];

export type GuideBriefSuggestionPriority = "low" | "medium" | "high" | "now";

export type GuideBriefHandoffTargetSurface =
  | "chatgpt_review"
  | "codex_handoff"
  | "documentation_handoff"
  | "research_handoff"
  | "agent_workplane_preview"
  | "future_agent_handoff";

export type GuideBriefHandoffCandidateStatus =
  | "preview_only"
  | "needs_review"
  | "blocked";

export type GuideBriefGapSeverity = "low" | "medium" | "high";

export type GuideBriefStalenessSeverity = "low" | "medium" | "high";

export interface GuideBrief {
  runtime: "augnes";
  guide_version: typeof GUIDE_BRIEF_VERSION;
  scope: string;
  as_of: string;
  source_surfaces: GuideBriefSourceSurface[];
  observed: GuideBriefObservedItem[];
  inferred: GuideBriefInferredItem[];
  suggested: GuideBriefSuggestion[];
  needs_user_judgment: GuideBriefUserJudgmentItem[];
  current_perspective_summary: GuideBriefCurrentPerspectiveSummary;
  delta_summary: GuideBriefDeltaSummary;
  workplane_summary: GuideBriefWorkplaneSummary;
  review_queue_summary: GuideBriefReviewQueueSummary;
  handoff_candidates: GuideBriefHandoffCandidate[];
  staleness_warnings: GuideBriefStalenessWarning[];
  surface_rendering_notes: GuideBriefSurfaceRenderingNotes;
  source_refs: GuideBriefSourceRefs;
  gaps: GuideBriefGap[];
  authority_boundary: GuideBriefAuthorityBoundary;
  next_phase_notes: string[];
  public_safety?: GuideBriefPublicSafety;
}

export interface GuideBriefInput {
  scope: string;
  as_of?: string;
  current_working_perspective: CurrentWorkingPerspective;
  delta_projection: AugnesDeltaProjectionReadModel;
  workplane_context?: GuideBriefWorkplaneContextInput;
  surface_context?: GuideBriefSurfaceContextInput;
  handoff_refs?: Array<string | HandoffRef>;
  docs_refs?: string[];
  gaps?: GuideBriefGap[];
  next_phase_notes?: string[];
}

export interface GuideBriefWorkplaneContextInput {
  surface_role: "agent_workplane";
  route: "/workbench";
  panels_available: string[];
  legacy_cockpit_reachable: boolean;
  trace_diagnostics_bounded: boolean;
  source_fallback_status: string[];
  authority_boundary_notes: string[];
}

export interface GuideBriefSurfaceContextInput {
  source_status?: {
    current_working_perspective?: string;
    delta_projection?: string;
    workplane?: string;
  };
  fallback_reasons?: string[];
  route_refs?: string[];
  source_surfaces?: GuideBriefSourceSurface[];
}

export interface GuideBriefObservedItem {
  observation_id: string;
  kind: string;
  summary: string;
  source_refs: string[];
  related_delta_ids: string[];
  confidence: "observed";
  notes: string[];
}

export interface GuideBriefInferredItem {
  inference_id: string;
  summary: string;
  basis_observation_ids: string[];
  source_refs: string[];
  confidence: Exclude<GuideBriefConfidence, "observed">;
  caveats: string[];
  non_authority_notes: string[];
}

export interface GuideBriefSuggestion {
  suggestion_id: string;
  title: string;
  summary: string;
  suggested_surface: GuideBriefSuggestedSurface;
  suggested_actor: GuideBriefSuggestedActor;
  priority: GuideBriefSuggestionPriority;
  required_checks: string[];
  blocked_by: string[];
  source_refs: string[];
  related_delta_ids: string[];
  authority_boundary_summary: string;
}

export interface GuideBriefUserJudgmentItem {
  judgment_id: string;
  question: string;
  why_it_matters: string;
  options: string[];
  source_refs: string[];
  related_delta_ids: string[];
  urgency: GuideBriefJudgmentUrgency;
  blocked_until_decided: string[];
}

export interface GuideBriefCurrentPerspectiveSummary {
  current_thesis: string;
  active_goal_count: number;
  open_question_count: number;
  active_risk_count: number;
  research_pressure_level: string;
  staleness_status: string;
  source_status: {
    current_working_perspective: string;
    delta_projection: string;
  };
  source_refs: string[];
}

export interface GuideBriefDeltaSummary {
  projected_delta_count: number;
  batch_count: number;
  gap_count: number;
  needs_review_count: number;
  blocked_count: number;
  manual_review_count: number;
  important_delta_refs: string[];
  source_refs: string[];
}

export interface GuideBriefWorkplaneSummary {
  route: "/workbench";
  surface_role: "agent_workplane";
  panels_available: string[];
  legacy_cockpit_reachable: boolean;
  source_fallback_status: string[];
  trace_diagnostics_bounded: boolean;
  authority_boundary_summary: string;
}

export interface GuideBriefReviewQueueSummary {
  needs_review_count: number;
  blocked_count: number;
  manual_review_count: number;
  validation_required_count: number;
  project_perspective_review_count: number;
  durable_memory_review_count: number;
  user_decision_count: number;
  total_attention_count: number;
  source_refs: string[];
}

export interface GuideBriefHandoffCandidate {
  handoff_candidate_id: string;
  target_surface: GuideBriefHandoffTargetSurface;
  title: string;
  summary: string;
  source_refs: string[];
  related_delta_ids: string[];
  required_context: string[];
  blocked_by: string[];
  authority_boundary: string;
  status: GuideBriefHandoffCandidateStatus;
}

export interface GuideBriefStalenessWarning {
  warning_id: string;
  summary: string;
  severity: GuideBriefStalenessSeverity;
  source_refs: string[];
  refresh_suggestion: string;
  blocks_handoff: boolean;
}

export interface GuideBriefSurfaceRenderingNotes {
  human_surface: string[];
  perspective_timeline: string[];
  agent_workplane: string[];
  chatgpt_app: string[];
  codex: string[];
  future_agent_surface: string[];
}

export interface GuideBriefSourceRefs {
  current_working_perspective_ref: string;
  delta_projection_ref: string;
  workplane_ref: string;
  perspective_snapshot_refs: string[];
  delta_ids: string[];
  batch_ids: string[];
  evidence_refs: string[];
  artifact_refs: string[];
  handoff_refs: string[];
  diagnostic_refs: string[];
  route_refs: string[];
  docs_refs: string[];
}

export interface GuideBriefGap {
  code: string;
  severity: GuideBriefGapSeverity;
  summary: string;
  source_refs: string[];
  blocks_guide_confidence: boolean;
}

export interface GuideBriefAuthorityBoundary {
  source_of_truth: false;
  can_commit_or_reject_state: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_update_work: false;
  can_mutate_memory: false;
  can_apply_project_perspective: false;
  can_publish_external: false;
  can_merge: false;
  can_retry_replay_deploy: false;
  can_call_github: false;
  can_call_openai_or_provider: false;
  can_execute_codex: false;
  can_create_branch_or_pr: false;
  can_send_handoff: false;
  can_launch_autonomy: false;
  can_create_mcp_tool: false;
  can_create_ui_action: false;
  notes: string[];
}

export interface GuideBriefPublicSafety {
  fixture_kind?: "synthetic_sample" | "runtime_read_model";
  contains_private_paths: false;
  contains_secrets: false;
  contains_api_keys: false;
  contains_github_tokens: false;
  contains_raw_private_conversations: false;
  contains_hidden_reasoning: false;
  contains_raw_provider_output: false;
  contains_raw_retrieval_output: false;
  contains_real_external_account_artifacts: false;
}

export type GuideBriefDeltaLike = AugnesDelta;

export type GuideBriefDeltaBatchLike = DeltaBatch;

export type GuideBriefArtifactRefLike = ArtifactRef;
