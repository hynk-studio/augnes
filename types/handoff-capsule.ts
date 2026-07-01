/**
 * Type-only Handoff Capsule / Codex Launch Card v0.1 contract.
 *
 * This file defines portable preview packets for moving Augnes perspective and
 * work context across surfaces. It imports only types, performs no DB reads or
 * writes, calls no routes, providers, OpenAI, GitHub, or Codex runtime, sends
 * no handoffs, launches nothing, and has no side effects.
 */

import type {
  GuideBrief,
  GuideBriefInferredItem,
  GuideBriefObservedItem,
  GuideBriefSuggestion,
  GuideBriefUserJudgmentItem,
} from "./guide-brief";

export const HANDOFF_CAPSULE_VERSION = "handoff_capsule.v0.1" as const;
export const CODEX_LAUNCH_CARD_VERSION = "codex_launch_card.v0.1" as const;

export const HANDOFF_TARGET_SURFACES = [
  "chatgpt_review",
  "codex_handoff",
  "documentation_handoff",
  "research_handoff",
  "agent_workplane_preview",
  "future_agent_handoff",
] as const;

export const HANDOFF_TARGET_ACTORS = [
  "user",
  "operator",
  "chatgpt",
  "codex",
  "future_agent",
  "documentation_agent",
  "research_agent",
] as const;

export const HANDOFF_INTENTS = [
  "review",
  "implementation_preparation",
  "research_preparation",
  "documentation_preparation",
  "planning",
  "status_transfer",
  "next_session_resume",
] as const;

export const CODEX_LAUNCH_CARD_STATUSES = [
  "preview_only",
  "needs_review",
  "blocked",
  "ready_for_manual_copy",
  "ready_for_future_launch_review",
] as const;

export type HandoffTargetSurface =
  (typeof HANDOFF_TARGET_SURFACES)[number];

export type HandoffTargetActor = (typeof HANDOFF_TARGET_ACTORS)[number];

export type HandoffIntent = (typeof HANDOFF_INTENTS)[number];

export type HandoffCapsuleStatus = "preview_only" | "needs_review" | "blocked";

export type CodexLaunchCardStatus =
  (typeof CODEX_LAUNCH_CARD_STATUSES)[number];

export interface HandoffCapsule {
  runtime: "augnes";
  capsule_version: typeof HANDOFF_CAPSULE_VERSION;
  scope: string;
  capsule_id: string;
  created_at: string;
  source_guide_brief_ref: string;
  source_snapshot_refs: string[];
  target_surface: HandoffTargetSurface;
  target_actor: HandoffTargetActor;
  handoff_intent: HandoffIntent;
  status: HandoffCapsuleStatus;
  title: string;
  summary: string;
  thesis: string;
  observed_context: HandoffObservedContextItem[];
  inferred_context: HandoffInferredContextItem[];
  suggested_context: HandoffSuggestedContextItem[];
  needs_user_judgment: HandoffJudgmentContextItem[];
  source_refs: HandoffSourceRefs;
  selected_delta_refs: HandoffSelectedDeltaRef[];
  evidence_refs: string[];
  artifact_refs: string[];
  diagnostic_refs: string[];
  constraints: HandoffConstraintSet;
  forbidden_actions: string[];
  expected_inputs: string[];
  expected_outputs: string[];
  validation_expectations: HandoffValidationExpectations;
  staleness: HandoffStaleness;
  authority_boundary: HandoffCapsuleAuthorityBoundary;
  target_rendering: HandoffTargetRendering;
  gaps: HandoffGap[];
  next_phase_notes: string[];
  public_safety: HandoffPublicSafetyBlock;
}

export interface CodexLaunchCard {
  runtime: "augnes";
  card_version: typeof CODEX_LAUNCH_CARD_VERSION;
  scope: string;
  launch_card_id: string;
  created_at: string;
  source_capsule_id: string;
  source_guide_brief_ref: string;
  repo: string;
  base_branch: string;
  branch_suggestion: string;
  expected_pr_title: string;
  task_goal: string;
  task_summary: string;
  context_anchors: string[];
  observed_context: HandoffObservedContextItem[];
  inferred_context: HandoffInferredContextItem[];
  suggestions_for_codex: CodexSuggestionForCodex[];
  unresolved_user_judgment: HandoffJudgmentContextItem[];
  expected_files: string[];
  forbidden_files: string[];
  allowed_change_scope: string[];
  forbidden_actions: string[];
  required_checks: string[];
  optional_checks: string[];
  skipped_check_policy: string[];
  pr_body_requirements: string[];
  final_report_requirements: string[];
  proof_evidence_boundary: string[];
  source_refs: HandoffSourceRefs;
  staleness: HandoffStaleness;
  authority_boundary: CodexLaunchCardAuthorityBoundary;
  status: CodexLaunchCardStatus;
  next_phase_notes: string[];
  public_safety: HandoffPublicSafetyBlock;
}

export interface HandoffCapsuleInput {
  scope: string;
  capsule_id?: string;
  created_at?: string;
  source_guide_brief_ref?: string;
  source_snapshot_refs?: string[];
  guide_brief?: GuideBrief;
  target_surface: HandoffTargetSurface;
  target_actor: HandoffTargetActor;
  handoff_intent: HandoffIntent;
  status?: HandoffCapsuleStatus;
  title: string;
  summary: string;
  thesis?: string;
  selections?: HandoffSelectionInput;
  observed_context?: HandoffObservedContextItem[];
  inferred_context?: HandoffInferredContextItem[];
  suggested_context?: HandoffSuggestedContextItem[];
  needs_user_judgment?: HandoffJudgmentContextItem[];
  source_refs?: HandoffSourceRefs;
  selected_delta_refs?: HandoffSelectedDeltaRef[];
  evidence_refs?: string[];
  artifact_refs?: string[];
  diagnostic_refs?: string[];
  constraints?: HandoffConstraintSet;
  forbidden_actions?: string[];
  expected_inputs?: string[];
  expected_outputs?: string[];
  validation_expectations?: HandoffValidationExpectations;
  staleness?: HandoffStaleness;
  authority_boundary?: HandoffCapsuleAuthorityBoundary;
  target_rendering?: HandoffTargetRendering;
  gaps?: HandoffGap[];
  next_phase_notes?: string[];
  public_safety?: HandoffPublicSafetyBlock;
}

export interface CodexLaunchCardInput {
  scope: string;
  launch_card_id?: string;
  created_at?: string;
  source_capsule: HandoffCapsule;
  source_guide_brief_ref?: string;
  repo: string;
  base_branch: string;
  branch_suggestion: string;
  expected_pr_title: string;
  task_goal: string;
  task_summary?: string;
  context_anchors?: string[];
  observed_context?: HandoffObservedContextItem[];
  inferred_context?: HandoffInferredContextItem[];
  suggestions_for_codex?: CodexSuggestionForCodex[];
  unresolved_user_judgment?: HandoffJudgmentContextItem[];
  expected_files?: string[];
  forbidden_files?: string[];
  allowed_change_scope?: string[];
  forbidden_actions?: string[];
  required_checks?: string[];
  optional_checks?: string[];
  skipped_check_policy?: string[];
  pr_body_requirements?: string[];
  final_report_requirements?: string[];
  proof_evidence_boundary?: string[];
  source_refs?: HandoffSourceRefs;
  staleness?: HandoffStaleness;
  authority_boundary?: CodexLaunchCardAuthorityBoundary;
  status?: CodexLaunchCardStatus;
  next_phase_notes?: string[];
  public_safety?: HandoffPublicSafetyBlock;
}

export interface HandoffSelectionInput {
  observed_ids?: string[];
  inference_ids?: string[];
  suggestion_ids?: string[];
  judgment_ids?: string[];
  delta_ids?: string[];
  batch_ids?: string[];
  evidence_refs?: string[];
  artifact_refs?: string[];
  handoff_refs?: string[];
  diagnostic_refs?: string[];
  docs_refs?: string[];
  route_refs?: string[];
  repo_refs?: string[];
  perspective_snapshot_refs?: string[];
  current_working_perspective_ref?: string;
  delta_projection_ref?: string;
  workplane_ref?: string;
  guide_brief_ref?: string;
}

export interface HandoffObservedContextItem {
  context_id: string;
  source_observation_id?: GuideBriefObservedItem["observation_id"];
  kind: string;
  summary: string;
  source_refs: string[];
  related_delta_ids: string[];
  confidence: "observed";
  notes: string[];
}

export interface HandoffInferredContextItem {
  context_id: string;
  source_inference_id?: GuideBriefInferredItem["inference_id"];
  summary: string;
  basis_observation_ids: string[];
  source_refs: string[];
  confidence: Exclude<GuideBriefInferredItem["confidence"], "observed">;
  caveats: string[];
  non_authority_notes: string[];
}

export interface HandoffSuggestedContextItem {
  context_id: string;
  source_suggestion_id?: GuideBriefSuggestion["suggestion_id"];
  title: string;
  summary: string;
  suggested_surface: string;
  suggested_actor: string;
  priority: string;
  required_checks: string[];
  blocked_by: string[];
  source_refs: string[];
  related_delta_ids: string[];
  advisory_only: true;
  authority_boundary_summary: string;
}

export interface HandoffJudgmentContextItem {
  context_id: string;
  source_judgment_id?: GuideBriefUserJudgmentItem["judgment_id"];
  question: string;
  why_it_matters: string;
  options: string[];
  source_refs: string[];
  related_delta_ids: string[];
  urgency: string;
  blocked_until_decided: string[];
  decided_by_packet: false;
}

export interface CodexSuggestionForCodex {
  suggestion_id: string;
  title: string;
  summary: string;
  source_refs: string[];
  related_delta_ids: string[];
  required_checks: string[];
  blocked_by: string[];
  advisory_only: true;
  active_operator_prompt_required: true;
}

export interface HandoffSourceRefs {
  guide_brief_ref: string;
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
  repo_refs: string[];
}

export interface HandoffSelectedDeltaRef {
  delta_id: string;
  reason: string;
  source_refs: string[];
}

export interface HandoffConstraintSet {
  allowed_change_scope: string[];
  boundary_notes: string[];
  skipped_check_policy: string[];
  public_safety: string[];
  non_goals: string[];
}

export interface HandoffValidationExpectations {
  required_checks: string[];
  optional_checks: string[];
  skipped_check_policy: string[];
  success_criteria: string[];
}

export interface HandoffStaleness {
  status: "fresh" | "partial" | "stale" | "unknown";
  as_of: string;
  warnings: string[];
  refresh_suggestion: string;
}

export interface HandoffTargetRendering {
  primary_sections: string[];
  preserve_separation: true;
  compact_summary: string;
  copy_behavior: "manual_copy_only" | "not_copyable";
  action_controls: false;
  notes: string[];
}

export interface HandoffGap {
  code: string;
  severity: "low" | "medium" | "high";
  summary: string;
  source_refs: string[];
  blocks_transfer_confidence: boolean;
}

export interface HandoffPublicSafetyBlock {
  fixture_kind?: "synthetic_sample" | "runtime_read_model" | "operator_supplied";
  contains_private_conversations: false;
  contains_hidden_reasoning: false;
  contains_local_private_paths: false;
  contains_secrets: false;
  contains_tokens: false;
  contains_raw_provider_output: false;
  contains_raw_retrieval_output: false;
  contains_real_account_artifacts: false;
  notes: string[];
}

export interface HandoffCapsuleAuthorityBoundary {
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
  can_launch_codex: false;
  can_launch_autonomy: false;
  can_create_mcp_tool: false;
  can_create_ui_action: false;
  can_post_external_comment: false;
  notes: string[];
}

export interface CodexLaunchCardAuthorityBoundary
  extends HandoffCapsuleAuthorityBoundary {}
