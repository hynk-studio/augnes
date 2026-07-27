import type { ProjectGuideBriefV02 } from "./guide-brief";
import type {
  SelectedWorkRelationshipQuestionKeyV01,
  SelectedWorkRelationshipsV01,
} from "./selected-work-relationships";
import type { SelectedWorkTimelineV01 } from "./selected-work-timeline";

export const GUIDE_BRIEF_CONVERSATION_PLAN_VERSION_V01 =
  "guidebrief_conversation_plan.v0.1" as const;
export const GUIDE_BRIEF_CONVERSATION_MAX_TURNS_V01 = 4 as const;
export const GUIDE_BRIEF_CONVERSATION_MAX_SUGGESTIONS_V01 = 5 as const;

export type GuideBriefConversationIntentV01 =
  | "current_situation"
  | "meaningful_change"
  | "human_attention_reason"
  | "source_and_support"
  | "relationship_explanation"
  | "uncertainty_and_conflict"
  | "decision_and_authority"
  | "transition_status"
  | "later_outcome"
  | "next_meaningful_action"
  | "capability_boundary";

export type GuideBriefConversationRoutingStatusV01 =
  | "supported"
  | "unsupported"
  | "ambiguous";

export type GuideBriefConversationAvailabilityV01 =
  | "available"
  | "partial"
  | "unavailable"
  | "ambiguous";

export interface GuideBriefConversationSelectedWorkScopeV01 {
  proposal_id: string;
  proposal_fingerprint: string;
  candidate_id: string;
  candidate_fingerprint: string;
}

export interface GuideBriefConversationAnswerAnchorV01 {
  scope_key: string;
  intent: GuideBriefConversationIntentV01;
  subjects: Array<
    | "project"
    | "selected_work"
    | "decision"
    | "transition"
    | "relationship"
    | "later_outcome"
    | "capability"
  >;
}

export interface GuideBriefConversationTurnV01 {
  intent: GuideBriefConversationIntentV01;
  availability: Exclude<
    GuideBriefConversationAvailabilityV01,
    "ambiguous"
  >;
  answer_anchor: GuideBriefConversationAnswerAnchorV01;
}

export interface GuideBriefConversationContextV01 {
  scope_key: string;
  turns: GuideBriefConversationTurnV01[];
}

export interface GuideBriefConversationPlanInputV01 {
  guide: ProjectGuideBriefV02;
  question: string;
  guide_source_fingerprint?: string | null;
  selected_work_scope?: GuideBriefConversationSelectedWorkScopeV01 | null;
  timeline?: SelectedWorkTimelineV01 | null;
  relationships?: Partial<
    Record<
      SelectedWorkRelationshipQuestionKeyV01,
      SelectedWorkRelationshipsV01
    >
  >;
  selected_relationship_question_key?:
    | SelectedWorkRelationshipQuestionKeyV01
    | null;
  conversation_context?: GuideBriefConversationContextV01 | null;
}

export interface GuideBriefConversationInternalSourceRefV01 {
  owner: "guide_brief" | "pc1_attention" | "pc2_timeline" | "pc3_relationship";
  source_kind: string;
  record_id: string;
  record_fingerprint: string | null;
  href: string | null;
}

export interface GuideBriefConversationPlanV01 {
  plan_version: typeof GUIDE_BRIEF_CONVERSATION_PLAN_VERSION_V01;
  scope: {
    scope_key: string;
    workspace_id: string | null;
    project_id: string | null;
    project_context: ProjectGuideBriefV02["identity"]["project_context"];
    active_project_id: string | null;
    guide_source_fingerprint: string;
    proposal_id: string | null;
    proposal_fingerprint: string | null;
    candidate_id: string | null;
    candidate_fingerprint: string | null;
    pc2_current_position_identity: string | null;
    pc3_relationship_question_identity:
      | SelectedWorkRelationshipQuestionKeyV01
      | null;
  };
  routing: {
    normalized_question: string;
    status: GuideBriefConversationRoutingStatusV01;
    intent: GuideBriefConversationIntentV01 | null;
    matched_intents: GuideBriefConversationIntentV01[];
  };
  availability: GuideBriefConversationAvailabilityV01;
  direct_answer: string;
  sections: {
    observed_or_exact_basis: string | null;
    bounded_interpretation: string | null;
    uncertainty_conflict_or_limitation: string | null;
    human_attention_meaning: string | null;
    next_meaningful_action: string | null;
  };
  internal_source_refs: GuideBriefConversationInternalSourceRefV01[];
  source_completeness: {
    status: "complete" | "partial" | "conflicted" | "unavailable";
    summary: string;
  };
  suggested_questions: Array<{
    question: string;
    intent: GuideBriefConversationIntentV01;
  }>;
  secondary_destinations: Array<{
    label: string;
    href: string;
    secondary_only: true;
  }>;
  next_action: {
    owner: "guide_brief" | "pc2_timeline";
    label: string | null;
    destination: string | null;
    is_action: false;
  };
  facts: {
    current_situation: string;
    meaningful_change: string | null;
    human_attention: ProjectGuideBriefV02["coordinate"]["human_attention"];
    selected_timeline_position:
      | SelectedWorkTimelineV01["current_position"]
      | null;
    selected_relationship_meaning: string | null;
    uncertainty: string | null;
    next_action_label: string;
    authority: {
      can_decide: false;
      can_transition: false;
      can_execute: false;
    };
  };
  owners: {
    attention: "pc1";
    current_position: "pc2";
    relationships: "pc3";
    conversation_composition: "pc4";
  };
  authority: {
    projection_only: true;
    rebuildable: true;
    persisted: false;
    accepts_evidence: false;
    establishes_truth: false;
    makes_decision: false;
    authorizes_transition: false;
    applies_transition: false;
    executes_work: false;
    mutates_project: false;
    mutates_later_context: false;
    calls_provider: false;
    performs_external_action: false;
  };
  side_effects: {
    database: false;
    provider: false;
    external_action: false;
  };
  answer_anchor: GuideBriefConversationAnswerAnchorV01 | null;
  follow_up: {
    resolved_from_previous_turn: boolean;
  };
  context_reset: boolean;
}
