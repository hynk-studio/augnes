import type { ProjectGuideBriefV02 } from "./guide-brief";
import type {
  GuideBriefConversationAnswerAnchorV01,
  GuideBriefConversationContextV01,
  GuideBriefConversationIntentV01,
} from "./guide-brief-conversation";
import type { SelectedWorkRelationshipQuestionKeyV01 } from "./selected-work-relationships";
import type {
  SelectedWorkTimelinePrimaryActionOwnerV01,
  SelectedWorkTimelineStageV01,
} from "./selected-work-timeline";

export const BROWSER_ACTION_CAPABILITY_VERSION_V01 =
  "browser_action_capability.v0.1" as const;
export const BROWSER_ACTION_CAPABILITY_SNAPSHOT_VERSION_V01 =
  "browser_action_capability_snapshot.v0.1" as const;
export const GUIDE_BRIEF_INTERACTION_REQUEST_VERSION_V01 =
  "guidebrief_interaction_request.v0.1" as const;
export const GUIDE_BRIEF_INTERACTION_PLAN_VERSION_V01 =
  "guidebrief_interaction_plan.v0.1" as const;
export const GUIDE_BRIEF_INTERACTION_OUTCOME_VERSION_V01 =
  "guidebrief_interaction_outcome.v0.1" as const;

export type BrowserActionKeyV01 =
  | "selected_work.select_next_candidate"
  | "relationship.select_question"
  | "surface.open_current_action"
  | "panel.open_advanced_review"
  | "inspector.open_selected_work"
  | "decision.prepare_applying"
  | "transition.prepare_preview";

export type BrowserActionOwnerV01 =
  | "selected_candidate_surface"
  | "pc3_relationship_surface"
  | "pc2_current_action_surface"
  | "advanced_review_surface"
  | "inspector_surface"
  | "review_decision_form"
  | "semantic_transition_actions";

export type BrowserActionEffectClassV01 =
  | "read"
  | "navigation"
  | "ui_selection"
  | "prepare";

export type BrowserActionConfirmationPolicyV01 =
  | "immediate_current_scope"
  | "owner_preparation_only"
  | "read_only_owner_preview";

export type BrowserActionAvailabilityV01 =
  | "available"
  | "blocked"
  | "unavailable";

export interface BrowserOwnerCurrentFocusCapabilityV01 {
  available: boolean;
  owner_focus_identity: string;
  unavailable_reason: string | null;
}

export type BrowserActionRouteKeyV01 =
  | "next_candidate"
  | "relationship_support_and_source"
  | "relationship_candidate_and_decision"
  | "relationship_blocker_and_conflict"
  | "relationship_decision_and_project_change"
  | "relationship_project_change_and_later_outcome"
  | "current_action"
  | "advanced_review"
  | "selected_work_inspector"
  | "decision_accept"
  | "decision_supersede"
  | "decision_retract"
  | "transition_preview";

export interface BrowserActionTargetScopeV01 {
  workspace_id: string | null;
  project_id: string | null;
  proposal_id: string | null;
  proposal_fingerprint: string | null;
  candidate_id: string | null;
  candidate_fingerprint: string | null;
}

export interface BrowserActionCapabilityV01 {
  capability_version: typeof BROWSER_ACTION_CAPABILITY_VERSION_V01;
  action_key: BrowserActionKeyV01;
  target_handle: string;
  public_label: string;
  public_effect_preview: string;
  owner: BrowserActionOwnerV01;
  effect_class: BrowserActionEffectClassV01;
  availability: BrowserActionAvailabilityV01;
  unavailable_reason: string | null;
  interaction_scope_key: string;
  owner_actionability_identity: string;
  confirmation_policy: BrowserActionConfirmationPolicyV01;
  destination: string | null;
  may_propose: boolean;
  may_execute_immediately: boolean;
  route_key: BrowserActionRouteKeyV01;
  target_scope: BrowserActionTargetScopeV01;
  authority: {
    projection_only: true;
    durable: false;
    semantic_authority: false;
    transition_authority: false;
    execution_authority: false;
    external_action_authority: false;
  };
}

export interface GuideBriefInteractionContextV01 {
  pc4_scope_key: string;
  workspace_id: string | null;
  project_id: string | null;
  project_context: ProjectGuideBriefV02["identity"]["project_context"];
  active_project_id: string | null;
  proposal_id: string | null;
  proposal_fingerprint: string | null;
  candidate_id: string | null;
  candidate_fingerprint: string | null;
  pc2: {
    current_item_id: string;
    stage: SelectedWorkTimelineStageV01;
    primary_action_owner: SelectedWorkTimelinePrimaryActionOwnerV01;
    material_identity: string;
  } | null;
  pc3: {
    selected_question_key: SelectedWorkRelationshipQuestionKeyV01 | null;
    highlighted_connection_id: string | null;
    material_identity: string;
  } | null;
  owner_state: {
    busy: boolean;
    decision_applying_kind: "accept" | "supersede" | "retract" | null;
    decision_eligible: boolean;
    transition_preview_available: boolean;
  };
}

export interface BrowserActionCapabilitySnapshotInputV01 {
  context: GuideBriefInteractionContextV01;
  capabilities: BrowserActionCapabilityV01[];
}

export interface BrowserActionCapabilitySnapshotV01 {
  snapshot_version: typeof BROWSER_ACTION_CAPABILITY_SNAPSHOT_VERSION_V01;
  scope_key: string;
  context: GuideBriefInteractionContextV01;
  capabilities: BrowserActionCapabilityV01[];
  fingerprint: string;
  authority: {
    projection_only: true;
    rebuildable: true;
    persisted: false;
    calls_provider: false;
    performs_external_action: false;
  };
}

export type GuideBriefInteractionClassificationV01 =
  | "question"
  | "action"
  | "mixed"
  | "ambiguous"
  | "unsupported";

export interface GuideBriefInteractionRequestV01 {
  request_version: typeof GUIDE_BRIEF_INTERACTION_REQUEST_VERSION_V01;
  request_id: string;
  raw_utterance: string;
  normalized_utterance: string;
  classification: GuideBriefInteractionClassificationV01;
  pc4_intent: GuideBriefConversationIntentV01 | null;
  candidate_route_keys: Array<
    BrowserActionRouteKeyV01 | "relationship_any"
  >;
  scope_key: string;
  capability_snapshot_fingerprint: string;
  previous_turn_anchor: GuideBriefConversationAnswerAnchorV01 | null;
  ephemeral_only: true;
}

export interface GuideBriefInteractionRequestInputV01 {
  request_id: string;
  raw_utterance: string;
  scope_key: string;
  capability_snapshot_fingerprint: string;
  previous_turn_anchor: GuideBriefConversationAnswerAnchorV01 | null;
  conversation_context: GuideBriefConversationContextV01 | null;
}

export type GuideBriefInteractionPlanStatusV01 =
  | "resolved"
  | "ambiguous"
  | "unsupported"
  | "unavailable"
  | "blocked"
  | "stale";

export type GuideBriefInteractionDispositionV01 =
  | "answer_only"
  | "execute_ui_action"
  | "prepare_owner_handoff"
  | "execute_owner_read"
  | "blocked"
  | "unsupported"
  | "ambiguous"
  | "stale";

export interface GuideBriefInteractionPlanV01 {
  plan_version: typeof GUIDE_BRIEF_INTERACTION_PLAN_VERSION_V01;
  request_id: string;
  plan_id: string;
  plan_fingerprint: string;
  scope_key: string;
  capability_snapshot_fingerprint: string;
  status: GuideBriefInteractionPlanStatusV01;
  disposition: GuideBriefInteractionDispositionV01;
  action_key: BrowserActionKeyV01 | null;
  target_handle: string | null;
  owner: BrowserActionOwnerV01 | "pc4" | null;
  effect_class: BrowserActionEffectClassV01 | null;
  confirmation_policy: BrowserActionConfirmationPolicyV01 | null;
  public_preview: string;
  single_use_required: true;
  authority: {
    projection_only: true;
    durable: false;
    makes_decision: false;
    authorizes_transition: false;
    applies_transition: false;
    executes_semantic_mutation: false;
    performs_external_action: false;
    calls_provider: false;
  };
}

export interface GuideBriefInteractionAdapterResultV01 {
  status: "completed" | "handed_off" | "preview_prepared" | "failed";
  public_observed_effect: string;
  durable_state_changed: false;
  exact_result_ref: string | null;
}

export interface GuideBriefInteractionAdapterV01 {
  action_key: BrowserActionKeyV01;
  target_handle: string;
  owner: BrowserActionOwnerV01;
  effect_class: BrowserActionEffectClassV01;
  invoke: () => Promise<GuideBriefInteractionAdapterResultV01>;
}

export interface GuideBriefInteractionExecutionLedgerV01 {
  consumed_plan_ids: Set<string>;
  in_flight_plan_id: string | null;
}

export interface GuideBriefInteractionOutcomeV01 {
  outcome_version: typeof GUIDE_BRIEF_INTERACTION_OUTCOME_VERSION_V01;
  plan_id: string;
  status:
    | "completed"
    | "handed_off"
    | "preview_prepared"
    | "stale"
    | "blocked"
    | "unsupported"
    | "failed";
  public_observed_effect: string;
  durable_state_changed: false;
  refreshed_scope_key: string;
  refreshed_capability_snapshot_fingerprint: string;
  next_supported_action_suggestions: string[];
  exact_result_ref: string | null;
  authority: {
    projection_only: true;
    durable: false;
    makes_decision: false;
    authorizes_transition: false;
    applies_transition: false;
    executes_semantic_mutation: false;
    performs_external_action: false;
    calls_provider: false;
  };
}
