import type { TaskContextPacketV01 } from "./task-context-packet";
import type { ProjectWorkDefinitionV01 } from "./project-work-initialization";

export const PROJECT_WORK_REVISION_ELIGIBILITY_VERSION_V01 =
  "project_work_revision_eligibility.v0.1" as const;
export const PRE_EXECUTION_PROJECT_WORK_REVISION_COMPILER_VERSION_V01 =
  "augnes.vnext.pre-execution-work-revision-compiler.v0.1" as const;
export const MAX_PRE_EXECUTION_PROJECT_WORK_REVISIONS_V01 = 32 as const;

export type PreExecutionProjectWorkLineageKindV01 =
  | "initial_user_defined"
  | "pre_execution_user_revision";

export type ProjectWorkRevisionEligibilityStatusV01 =
  | "eligible_initial_packet"
  | "eligible_revised_packet"
  | "blocked_execution_started"
  | "blocked_work_history"
  | "blocked_operational_continuation"
  | "blocked_not_current"
  | "blocked_root_unavailable"
  | "blocked_inactive_project"
  | "revision_limit_reached"
  | "unavailable";

export interface ProjectWorkRevisionEligibilityV01 {
  eligibility_version: typeof PROJECT_WORK_REVISION_ELIGIBILITY_VERSION_V01;
  workspace_id: string;
  project_id: string;
  active_project_id: string | null;
  active_selection_revision: number | null;
  current_packet_id: string | null;
  current_packet_fingerprint: string | null;
  current_lineage_kind: PreExecutionProjectWorkLineageKindV01 | null;
  revision_count: number;
  status: ProjectWorkRevisionEligibilityStatusV01;
  reason:
    | "current_initial_packet_zero_history"
    | "current_revision_packet_zero_history"
    | "managed_run_history_present"
    | "durable_work_history_present"
    | "operational_continuation_not_revisable"
    | "current_packet_stale_or_unavailable"
    | "project_inactive"
    | "project_unavailable"
    | "root_unavailable"
    | "revision_chain_invalid"
    | "revision_limit_reached"
    | "source_unavailable";
  eligible: boolean;
  projection_only: true;
  semantic_authority_granted: false;
  execution_authority_granted: false;
}

export interface RevisePreExecutionProjectWorkRequestV01 {
  action: "revise_pre_execution_project_work";
  workspace_id: string;
  project_id: string;
  expected_active_project_id: string;
  expected_active_selection_revision: number;
  expected_current_packet_id: string;
  expected_current_packet_fingerprint: string;
  expected_current_lineage_kind: PreExecutionProjectWorkLineageKindV01;
  goal: string;
  success_criteria: string[];
  non_goals: string[];
}

export interface RevisePreExecutionProjectWorkResultV01 {
  status: "inserted" | "exact_replay";
  packet: TaskContextPacketV01;
  definition: ProjectWorkDefinitionV01;
  revision_eligibility: ProjectWorkRevisionEligibilityV01;
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
