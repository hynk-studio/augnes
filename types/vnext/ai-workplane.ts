export const AI_WORKPLANE_PRESENTATION_VERSION_V01 =
  "ai_workplane_presentation.v0.1" as const;

export type AIWorkplaneHomeStateV01 =
  | "loading"
  | "access_required"
  | "no_project"
  | "guidance_unavailable"
  | "change_completion"
  | "change_decision"
  | "result_ready"
  | "work_in_progress"
  | "other_attention"
  | "no_current_decision";

export type AIWorkplaneQueueItemStatusV01 =
  | "needs_decision"
  | "continue_review"
  | "ready_to_complete"
  | "project_updated"
  | "needs_more_information"
  | "deferred"
  | "rejected";

export interface AIWorkplanePrimaryActionV01 {
  kind: "link" | "unlock" | "save_decision" | "review_impact" | "confirm" | "apply";
  label: string;
  href: string | null;
}

export interface AIWorkplaneQueueItemV01 {
  proposal_id: string;
  title: string;
  status: AIWorkplaneQueueItemStatusV01;
  status_label: string;
  reason: string;
  href: string;
  source_current: boolean;
}

export interface AIWorkplaneHomeViewV01 {
  presentation_version: typeof AI_WORKPLANE_PRESENTATION_VERSION_V01;
  state: AIWorkplaneHomeStateV01;
  heading: string;
  situation: string;
  project_name: string | null;
  goal: string | null;
  material_note: string | null;
  primary_action: AIWorkplanePrimaryActionV01 | null;
  focused_item: AIWorkplaneQueueItemV01 | null;
  additional_items: AIWorkplaneQueueItemV01[];
  authority: AIWorkplanePresentationAuthorityV01;
}

export interface AIWorkplaneVerificationViewV01 {
  status: "complete" | "partial" | "unavailable";
  label: string;
  passed: number;
  failed: number;
  skipped: number;
  satisfied: number;
  unsatisfied: number;
  unknown: number;
  source_current: boolean;
  blockers: string[];
}

export interface AIWorkplaneChangeReviewViewV01 {
  presentation_version: typeof AI_WORKPLANE_PRESENTATION_VERSION_V01;
  title: string;
  operation_label: string;
  effect_summary: string;
  reason: string;
  verification: AIWorkplaneVerificationViewV01;
  uncertainties: string[];
  decision_status:
    | "needs_decision"
    | "decision_saved"
    | "rejected"
    | "deferred"
    | "project_updated"
    | "blocked";
  decision_status_label: string;
  primary_action: AIWorkplanePrimaryActionV01 | null;
  authority: AIWorkplanePresentationAuthorityV01;
}

export interface AIWorkplaneResultViewV01 {
  presentation_version: typeof AI_WORKPLANE_PRESENTATION_VERSION_V01;
  heading: string;
  outcome: string;
  verification: AIWorkplaneVerificationViewV01;
  unresolved: string[];
  primary_action: AIWorkplanePrimaryActionV01;
  authority: AIWorkplanePresentationAuthorityV01;
}

export interface AIWorkplanePresentationAuthorityV01 {
  writes_database: false;
  creates_record: false;
  establishes_truth: false;
  grants_execution_authority: false;
  grants_semantic_authority: false;
  calls_model_or_provider: false;
  performs_external_action: false;
}

export interface AIWorkplaneGuideConsistencyV01 {
  status: "consistent" | "advisory_unavailable" | "source_mismatch";
  blocks_actions: boolean;
  message: string | null;
}
