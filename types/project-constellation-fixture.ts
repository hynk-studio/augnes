/**
 * type-only Project Constellation fixture boundaries for the static public-safe
 * sample and read-only preview alignment.
 *
 * Reference fixture:
 * fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json
 *
 * These types are not runtime schema, not validation authority, not DB schema,
 * not API contract, not MCP/App tool contract, and not source-of-truth. They do
 * not permit graph runtime behavior, persistence, proof/evidence writes,
 * no live SDK call, no provider implementation, and no runtime execution.
 */

export interface ProjectConstellationSampleFixtureV0 {
  version: "project_constellation_sample.v0.1";
  status: ProjectConstellationSampleStatus;
  authority: ProjectConstellationAuthority;
  formation_mode: ProjectConstellationFormationMode;
  source_use_case: "sidecar_et_strategy_c_first_slice";
  source_scope: ProjectConstellationSourceScope;
  nodes: ProjectConstellationNode[];
  edges: ProjectConstellationEdge[];
  clusters: ProjectConstellationCluster[];
  perspective_capsule_preview: ProjectConstellationPerspectiveCapsulePreview;
  codex_execution_authority_preview: ProjectConstellationExecutionAuthorityPreview;
  non_goals: string[];
  forbidden_actions: string[];
}

export type ProjectConstellationSampleStatus = "sample_fixture_only";

export type ProjectConstellationAuthority = "read_only_non_authoritative";

export type ProjectConstellationFormationMode = "work_unit_constellation";

export interface ProjectConstellationSourceScope {
  scope_id: string;
  title: string;
  summary: string;
  public_safety: "synthetic_public_safe_no_private_text" | string;
  boundaries: string[];
}

export interface ProjectConstellationNode {
  id: string;
  type: ProjectConstellationNodeType;
  label: string;
  summary: string;
  source_refs: string[];
  boundary_notes: string[];
  evidence_pointers: string[];
  unresolved_tensions: string[];
  next_action_candidates: string[];
}

export type ProjectConstellationNodeType =
  | "project"
  | "work_unit"
  | "document"
  | "concept"
  | "decision"
  | "tension"
  | "evidence_pointer"
  | "validation_result"
  | "constraint"
  | "next_move"
  | "capsule_preview"
  | "execution_authority_preview";

export interface ProjectConstellationEdge {
  id: string;
  type: ProjectConstellationEdgeType;
  source: string;
  target: string;
  summary: string;
  boundary_notes: string[];
  evidence_pointers: string[];
}

export type ProjectConstellationEdgeType =
  | "supports"
  | "evidence_for"
  | "evidence_against"
  | "derived_from"
  | "depends_on"
  | "refines"
  | "validates"
  | "conflicts_with"
  | "warns_against"
  | "blocks"
  | "next_candidate"
  | "supersedes"
  | "belongs_to"
  | "adjacent_to";

export interface ProjectConstellationCluster {
  id: string;
  label: string;
  node_ids: string[];
  edge_ids: string[];
  cluster_thesis: string;
  unresolved_tensions: string[];
  next_action_candidates: string[];
  boundaries: string[];
}

export interface ProjectConstellationPerspectiveCapsulePreview {
  capsule_id: string;
  capsule_version: "perspective_capsule.v0.1" | string;
  source_surface: "project_constellation";
  source_scope: "sidecar_et_strategy_c_first_slice";
  source_snapshot_ref: string;
  source_constellation_ref: string;
  formation_mode: ProjectConstellationFormationMode;
  thesis: string;
  selected_nodes: string[];
  selected_edges: string[];
  evidence_pointers: string[];
  unresolved_tensions: string[];
  boundaries: string[];
  forbidden_actions: string[];
  next_action_candidates: string[];
  target_surface: "codex_handoff";
  codex_handoff_packet: ProjectConstellationCodexHandoffPacketPreview;
  required_checks: string[];
  skipped_check_policy: string;
  browser_computer_use_expectation: string;
  proof_only_closeout_status_or_skip: string;
  final_report_requirements: string[];
  user_pm_judgment_questions: string[];
  assumptions: string[];
  blockers_or_risks: string[];
}

export interface ProjectConstellationCodexHandoffPacketPreview {
  repo: string;
  base_branch: string;
  working_branch_suggestion: string;
  expected_pr_title: string;
  task_goal: string;
  context_anchors: string[];
  expected_changed_files: string[];
  forbidden_changed_files: string[];
  hard_constraints: string[];
  required_checks: string[];
  skipped_check_policy: string;
  browser_computer_use_expectation: string;
  pr_body_requirements: string[];
  final_report_requirements: string[];
  blockers_or_risks: string[];
  assumptions: string[];
  questions_requiring_user_pm_judgment: string[];
  next_suggested_goal: string;
}

export interface ProjectConstellationExecutionAuthorityPreview {
  execution_intent: "docs_smoke_fixture_validation" | string;
  recommended_permission_profile: "workspace_write" | string;
  planning_review_permission: "read_only" | string;
  escalation_required: boolean;
  forbidden_escalations: string[];
  user_approval_required: boolean;
  evidence_pointer_semantics: "pointer_only" | string;
  /** Expected false in the sample preview; this type does not permit a live SDK call. */
  live_sdk_call: false;
  /** Expected false in the sample preview; this type does not permit provider implementation. */
  provider_implementation: false;
  /** Expected false in the sample preview; this type does not permit runtime execution. */
  runtime_execution: false;
  boundary_notes: string[];
}
