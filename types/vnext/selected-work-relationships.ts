import type { SelectedWorkTimelineStageV01 } from "./selected-work-timeline";
import type { ProjectVerifyExactProtocolKindV01 } from "./project-verify-reconciliation";

export const SELECTED_WORK_RELATIONSHIPS_VERSION_V01 =
  "selected_work_relationships.v0.1" as const;

export const SELECTED_WORK_RELATIONSHIPS_MAX_QUESTIONS_V01 = 4 as const;
export const SELECTED_WORK_RELATIONSHIPS_MAX_CONNECTIONS_V01 = 6 as const;

export type SelectedWorkRelationshipQuestionKeyV01 =
  | "support_and_source"
  | "candidate_and_decision"
  | "blocker_and_conflict"
  | "decision_and_project_change"
  | "project_change_and_later_outcome";

export type SelectedWorkRelationshipAnswerAvailabilityV01 =
  | "available"
  | "partial"
  | "unavailable"
  | "conflicted";

export type SelectedWorkRelationshipKindV01 =
  | "derived_from"
  | "supported_by"
  | "interpreted_as"
  | "selected_for_review"
  | "decided_by"
  | "supersedes"
  | "retracts"
  | "blocked_by"
  | "conflicts_with"
  | "applied_as"
  | "used_by_later_work"
  | "reviewed_by_later_feedback";

export type SelectedWorkRelationshipBasisV01 =
  | "observed_source"
  | "reported_source"
  | "exact_recorded_relation"
  | "bounded_interpretation"
  | "user_decision"
  | "authorized_project_change"
  | "blocker_or_conflict"
  | "later_outcome";

export type SelectedWorkRelationshipSupportStatusV01 =
  | "exact"
  | "partial"
  | "conflicting";

export type SelectedWorkRelationshipRoleV01 =
  | "source_work"
  | "observed_material"
  | "reported_material"
  | "interpreted_material"
  | "evidence"
  | "claim"
  | "selected_suggestion"
  | "user_decision"
  | "project_safeguard"
  | "saved_project_state"
  | "later_work"
  | "later_feedback";

export interface SelectedWorkRelationshipExactRefV01 {
  source_kind: ProjectVerifyExactProtocolKindV01 | "external_ref";
  record_id: string;
  record_fingerprint: string | null;
}

export interface SelectedWorkRelationshipQuestionV01 {
  question_key: SelectedWorkRelationshipQuestionKeyV01;
  label: string;
  source_supported: true;
}

export interface SelectedWorkConnectionStatementV01 {
  connection_id: string;
  relation_kind: SelectedWorkRelationshipKindV01;
  source_role: SelectedWorkRelationshipRoleV01;
  target_role: SelectedWorkRelationshipRoleV01;
  title: string;
  explanation: string;
  why_it_matters_now: string;
  basis: SelectedWorkRelationshipBasisV01;
  support_status: SelectedWorkRelationshipSupportStatusV01;
  uncertainty_or_conflict: string | null;
  exact_refs: SelectedWorkRelationshipExactRefV01[];
  destination: string | null;
  projection_only: true;
  grants_semantic_authority: false;
}

export interface SelectedWorkRelationshipsV01 {
  relationships_version: typeof SELECTED_WORK_RELATIONSHIPS_VERSION_V01;
  selected_work_anchor: {
    title: string;
    selected_candidate_id: string;
    selected_candidate_fingerprint: string;
    timeline_stage: SelectedWorkTimelineStageV01;
    timeline_current_item_id: string;
    timeline_remains_current_position_owner: true;
  };
  questions: SelectedWorkRelationshipQuestionV01[];
  selected_question_key: SelectedWorkRelationshipQuestionKeyV01 | null;
  selected_question_label: string;
  answer_availability: SelectedWorkRelationshipAnswerAvailabilityV01;
  highlighted_connection_id: string | null;
  connections: SelectedWorkConnectionStatementV01[];
  visible_connection_count: number;
  known_connection_count: number;
  locally_omitted_connection_count: number;
  completeness: {
    status:
      | "complete"
      | "partial"
      | "bounded_incomplete"
      | "conflicted"
      | "unavailable";
    upstream_incomplete: boolean;
    omitted_source_count_known: false;
    omitted_source_count: null;
    summary: string;
  };
  suggested_destinations: Array<{
    label: string;
    href: string;
    secondary_only: true;
  }>;
  authority: {
    projection_only: true;
    rebuildable: true;
    writes_database: false;
    creates_relation_record: false;
    creates_evidence: false;
    accepts_evidence: false;
    establishes_claim_truth: false;
    creates_decision: false;
    authorizes_transition: false;
    applies_transition: false;
    selects_current_position: false;
    changes_timeline_order: false;
    changes_project_state: false;
    changes_later_context: false;
    calls_model_or_provider: false;
    performs_external_action: false;
  };
}
