import type { TaskContextPacketV01 } from "./task-context-packet";
import type { ProjectWorkRevisionEligibilityV01 } from "./project-work-revision";

export const PROJECT_WORK_INITIALIZATION_VERSION_V01 =
  "project_work_initialization.v0.1" as const;

export const INITIAL_PROJECT_WORK_LIMITS_V01 = Object.freeze({
  goal_characters: 2_000,
  success_criteria: 12,
  success_criterion_characters: 500,
  non_goals: 12,
  non_goal_characters: 500,
  definition_bytes: 12_000,
});

export type ProjectWorkInitializationStateV01 =
  | "not_defined"
  | "defined_initial_work"
  | "defined_revised_work"
  | "defined_transition_work"
  | "existing_history_without_current_packet"
  | "unavailable";

export interface ProjectWorkDefinitionV01 {
  goal: string;
  success_criteria: string[];
  non_goals: string[];
}

export interface ProjectWorkInitializationV01 {
  initialization_version: typeof PROJECT_WORK_INITIALIZATION_VERSION_V01;
  workspace_id: string;
  project_id: string;
  state: ProjectWorkInitializationStateV01;
  /**
   * Additive diagnostic detail within v0.1. Consumers must fail closed from
   * state and explicit eligibility when they do not recognize a reason.
   */
  reason:
    | "zero_durable_work_history"
    | "current_initial_packet"
    | "current_revision_packet"
    | "current_transition_packet"
    | "multiple_current_packet_candidates"
    | "malformed_packet_record"
    | "invalid_revision_lineage"
    | "invalid_semantic_transition_lineage"
    | "invalid_packet_lineage"
    | "superseded_work_without_current_packet"
    | "durable_history_without_current_packet"
    | "project_unavailable"
    | "root_unavailable"
    | "source_unavailable";
  active_project_id: string | null;
  active_selection_revision: number | null;
  current_work: ProjectWorkDefinitionV01 | null;
  current_packet: null | {
    packet_id: string;
    packet_fingerprint: string;
    generated_at: string;
    lineage_kind:
      | "initial_user_defined"
      | "pre_execution_user_revision"
      | "semantic_transition";
  };
  mutation_eligible: boolean;
  revision_eligibility: ProjectWorkRevisionEligibilityV01;
  projection_only: true;
  semantic_authority_granted: false;
  execution_authority_granted: false;
}

export interface DefineInitialProjectWorkRequestV01 {
  action: "define_initial_project_work";
  workspace_id: string;
  project_id: string;
  expected_active_project_id: string;
  expected_active_selection_revision: number;
  expected_initialization_state: "not_defined";
  goal: string;
  success_criteria: string[];
  non_goals: string[];
}

export interface DefineInitialProjectWorkResultV01 {
  status: "inserted" | "exact_replay";
  packet: TaskContextPacketV01;
  definition: ProjectWorkDefinitionV01;
  session_admission: {
    cookie_value: string;
    cookie_expires_at: string;
    cookie_max_age_seconds: number;
  };
  run_created: false;
  provider_called: false;
  project_files_written: false;
  proposal_created: false;
  review_decision_created: false;
  transition_created: false;
  semantic_state_changed: false;
  execution_started: false;
  semantic_authority_granted: false;
  execution_authority_granted: false;
}
