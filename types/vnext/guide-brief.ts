import type {
  BlankStateAttentionCategoryV01,
  BlankStateFocusV01,
  BlankStatePrimaryActionV01,
  BlankStateRouteModeV01,
  BlankStateViewV01,
} from "./blank-state";
import type {
  DelegatedWorkNextActionKindV01,
  DelegatedWorkStageV01,
} from "./delegated-work";

export const GUIDE_BRIEF_VERSION_V02 = "guide_brief.v0.2" as const;
export const GUIDE_BRIEF_ROUTE_MARKER_V02 = "guide-brief-v0.2" as const;
export const GUIDE_BRIEF_REQUEST_SCOPE_V02 = "project:augnes" as const;

export const GUIDE_BRIEF_LIMITS_V02 = {
  observed: 8,
  inferred: 4,
  suggested: 3,
  needs_user_judgment: 3,
  source_refs: 16,
  recent_changes: 3,
  text_bytes: 1_024,
  serialized_bytes: 64 * 1_024,
} as const;

export type ProjectGuideBriefSourceStatusV02 =
  | "live_current_project"
  | "project_choice"
  | "viewed_project"
  | "partial"
  | "unavailable";

export type ProjectGuideBriefProjectContextV02 =
  | "none"
  | "current"
  | "viewed";

export interface GuideBriefSourceRefV02 {
  ref_id: string;
  kind:
    | "project"
    | "project_state"
    | "task"
    | "run"
    | "result"
    | "attention"
    | "change"
    | "route"
    | "task_context_packet";
  label: string;
  href: string | null;
}

export interface GuideBriefObservedItemV02 {
  item_id: string;
  statement: string;
  source_refs: string[];
}

export interface GuideBriefInferredItemV02 {
  item_id: string;
  statement: string;
  supporting_observation_ids: string[];
  confidence: "high" | "medium" | "low";
  caveats: string[];
}

export interface GuideBriefSuggestedItemV02 {
  item_id: string;
  label: string;
  reason: string;
  href: string | null;
  action_ref: string | null;
  blockers: string[];
  source_refs: string[];
  executes: false;
}

export interface GuideBriefUserJudgmentItemV02 {
  item_id: string;
  question: string;
  why_it_matters: string;
  blocked: string[];
  source_refs: string[];
  resolved: false;
}

export interface GuideBriefPrimaryGuidanceV02 {
  label: string;
  reason: string;
  href: string | null;
  action_ref: string | null;
  action: BlankStatePrimaryActionV01;
  requires_user_judgment: boolean;
  source_refs: string[];
  executes: false;
}

export interface GuideBriefHumanAttentionV02 {
  required: boolean;
  category: BlankStateAttentionCategoryV01 | null;
  blocked_or_awaiting: string | null;
  recommended_next_step: string | null;
  projection_only: true;
  authority_granted: false;
}

export interface GuideBriefCurrentCoordinateV02 {
  focus: BlankStateFocusV01;
  goal: string | null;
  work_status: string;
  result_available: boolean;
  result_summary: string | null;
  verification: null | {
    passed: number;
    failed: number;
    skipped: number;
  };
  material_blocker_or_uncertainty: string | null;
  unresolved_user_judgment: string | null;
  recent_meaningful_change: string | null;
  human_attention: GuideBriefHumanAttentionV02;
  delegated_work: null | {
    stage: DelegatedWorkStageV01;
    latest_checkpoint: string | null;
    needs_user: boolean;
    trusted_result_available: boolean;
    next_action: DelegatedWorkNextActionKindV01;
  };
}

export interface GuideBriefBlankStateProjectionV02 extends BlankStateViewV01 {
  guide_version: typeof GUIDE_BRIEF_VERSION_V02;
  source_status: ProjectGuideBriefSourceStatusV02;
  project_context: ProjectGuideBriefProjectContextV02;
}

export interface GuideBriefAIWorkplaneProjectionV02 {
  status: "available" | "unavailable";
  project_name: string | null;
  current_coordinate: string;
  current_goal: string | null;
  important_constraints: string[];
  work_or_result_status: string;
  material_blocker_or_judgment: string | null;
  unresolved_user_judgments: string[];
  recommended_review_focus: string;
  exact_detail_href: string | null;
  human_attention: GuideBriefHumanAttentionV02;
  delegated_work: GuideBriefCurrentCoordinateV02["delegated_work"];
}

export interface GuideBriefChatGPTProjectionV02 {
  project_name: string | null;
  project_context: ProjectGuideBriefProjectContextV02;
  source_status: ProjectGuideBriefSourceStatusV02;
  summary: string;
  goal: string | null;
  status: string;
  constraints: string[];
  required_checks: string[];
  non_goals: string[];
  material_blocker_or_uncertainty: string | null;
  unresolved_user_judgment: string | null;
  observed: GuideBriefObservedItemV02[];
  inferred: GuideBriefInferredItemV02[];
  suggested: GuideBriefSuggestedItemV02[];
  needs_user_judgment: GuideBriefUserJudgmentItemV02[];
  primary_guidance: GuideBriefPrimaryGuidanceV02;
  source_refs: GuideBriefSourceRefV02[];
  human_attention: GuideBriefHumanAttentionV02;
  delegated_work: GuideBriefCurrentCoordinateV02["delegated_work"];
}

export interface GuideBriefCodexProjectionV02 {
  guide_version: typeof GUIDE_BRIEF_VERSION_V02;
  projection_version: "guide_brief_codex_projection.v0.2";
  status: "available" | "unavailable";
  workspace_id: string | null;
  project_id: string | null;
  project_name: string | null;
  current_goal: string | null;
  current_coordinate: string;
  constraints: string[];
  required_checks: string[];
  non_goals: string[];
  unresolved_user_judgments: string[];
  important_risk_or_gap: string | null;
  suggested_next_action: string;
  human_attention: GuideBriefHumanAttentionV02;
  source_refs: string[];
  packet_binding: null | {
    packet_id: string;
    packet_fingerprint: string;
  };
  task_context_packet_delivered_separately: true;
  guide_does_not_override_packet: true;
  suggestions_are_not_commands: true;
  authority_remains_with_user_and_core: true;
  can_approve: false;
  can_execute_codex: false;
  can_grant_host_permission: false;
  unavailable_reason: string | null;
}

export interface GuideBriefAuthorityBoundaryV02 {
  source_of_truth: false;
  can_commit_or_reject_state: false;
  can_record_proof: false;
  can_create_evidence: false;
  can_update_work: false;
  can_mutate_memory: false;
  can_apply_project_perspective: false;
  can_approve: false;
  can_transition: false;
  can_publish_external: false;
  can_merge: false;
  can_retry: false;
  can_call_github: false;
  can_call_openai_or_provider: false;
  can_execute_codex: false;
  can_create_branch_or_pr: false;
  can_send_handoff: false;
  can_launch_autonomy: false;
  can_write_db: false;
  can_create_ui_action: false;
  can_grant_host_permission: false;
  notes: string[];
}

export interface ProjectGuideBriefV02 {
  runtime: "augnes_current_project";
  guide_version: typeof GUIDE_BRIEF_VERSION_V02;
  generated_at: string;
  request: {
    scope: typeof GUIDE_BRIEF_REQUEST_SCOPE_V02;
    route_mode: BlankStateRouteModeV01;
    requested_project_id: string | null;
  };
  identity: {
    workspace_id: string | null;
    project_id: string | null;
    project_display_name: string | null;
    project_context: ProjectGuideBriefProjectContextV02;
    active_project_id: string | null;
    root_resolution: "none" | "available" | "unavailable" | "not_found";
  };
  source_status: ProjectGuideBriefSourceStatusV02;
  gaps: string[];
  coordinate: GuideBriefCurrentCoordinateV02;
  observed: GuideBriefObservedItemV02[];
  inferred: GuideBriefInferredItemV02[];
  suggested: GuideBriefSuggestedItemV02[];
  needs_user_judgment: GuideBriefUserJudgmentItemV02[];
  primary_guidance: GuideBriefPrimaryGuidanceV02;
  source_refs: GuideBriefSourceRefV02[];
  projections: {
    blank_state: GuideBriefBlankStateProjectionV02;
    ai_workplane: GuideBriefAIWorkplaneProjectionV02;
    chatgpt: GuideBriefChatGPTProjectionV02;
    codex: GuideBriefCodexProjectionV02;
  };
  authority: GuideBriefAuthorityBoundaryV02;
  safety: {
    contains_private_absolute_paths: false;
    contains_credentials: false;
    contains_raw_provider_output: false;
    contains_hidden_reasoning: false;
    contains_raw_transcripts: false;
    provider_or_network_calls: false;
    persisted: false;
  };
  limits: typeof GUIDE_BRIEF_LIMITS_V02;
}
