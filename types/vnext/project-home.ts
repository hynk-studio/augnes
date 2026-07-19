import type {
  ProjectIdentityV01,
  ProjectLocalRootBindingV01,
} from "./project-identity";
import type {
  ActiveProjectSelectionV01,
  ProjectRootAvailabilityV01,
} from "./project-onboarding";
import type {
  PersonalPerspectiveProjectScopeStatusV01,
  ProjectAutomationAdmissionStatusV01,
  ProjectAutomationPolicySummaryV01,
  ProjectAutomationStatusV01,
} from "./project-controls";
import type {
  ProjectRunResultCurrentRunV01,
  ProjectRunResultSummaryV01,
} from "./project-run-result";
import type { BoundedAutomationCycleProjectionV01 } from "./bounded-automation-cycle";

export const PROJECT_HOME_PROJECTION_VERSION_V01 =
  "project_home_projection.v0.1" as const;
export const PROJECT_HOME_SECTION_STATE_VERSION_V01 =
  "project_home_section_state.v0.1" as const;

export type ProjectHomeSectionStatusV01 =
  | "available"
  | "empty"
  | "unavailable"
  | "not_configured"
  | "action_required"
  | "error";

export interface ProjectHomeSectionStateV01 {
  section_state_version: typeof PROJECT_HOME_SECTION_STATE_VERSION_V01;
  status: ProjectHomeSectionStatusV01;
  message: string;
}

export type ProjectHomeLineageKindV01 =
  | "semantic_state"
  | "episode_delta_proposal"
  | "review_decision"
  | "state_transition_receipt"
  | "run_receipt"
  | "task_context_packet";

export interface ProjectHomeLineageAnchorV01 {
  record_kind: ProjectHomeLineageKindV01;
  record_id: string;
  role:
    | "accepted_state"
    | "source_proposal"
    | "decision"
    | "durable_transition"
    | "run_result"
    | "selected_working_context";
  occurred_at: string;
}

export interface ProjectHomeRepositorySummaryV01 {
  display: string;
  host: string | null;
}

export interface ProjectHomeProjectSummaryV01 {
  project: ProjectIdentityV01;
  root_binding: ProjectLocalRootBindingV01;
  root_availability: ProjectRootAvailabilityV01;
  repository: ProjectHomeRepositorySummaryV01 | null;
  is_active: boolean;
  active_selection: ActiveProjectSelectionV01 | null;
}

export interface ProjectHomeAcceptedStateItemV01 {
  summary: string;
  updated_at: string;
  revision: number;
  lineage: ProjectHomeLineageAnchorV01[];
}

export interface ProjectHomeAcceptedStateSummaryV01 {
  state: ProjectHomeSectionStateV01;
  total_count: number;
  items: ProjectHomeAcceptedStateItemV01[];
}

export interface ProjectHomeWorkingProjectionSummaryV01 {
  state: ProjectHomeSectionStateV01;
  projection_kind: "selected_working_context" | null;
  summary: string | null;
  generated_at: string | null;
  source_currentness: "fresh" | "stale" | "partial" | "unknown" | null;
  source_perspective_ref: string | null;
  source_revision: string | number | null;
  lineage: ProjectHomeLineageAnchorV01[];
}

export interface ProjectHomePendingAttentionItemV01 {
  proposal_id: string;
  summary: string;
  created_at: string;
  pending_candidate_count: number;
  reason: string;
  lineage: ProjectHomeLineageAnchorV01[];
}

export interface ProjectHomePendingAttentionV01 {
  state: ProjectHomeSectionStateV01;
  total_count: number;
  items: ProjectHomePendingAttentionItemV01[];
}

export interface ProjectHomeActivityItemV01 {
  activity_kind: "accepted_transition" | "review_decision" | "run_receipt";
  summary: string;
  occurred_at: string;
  outcome: string;
  lineage: ProjectHomeLineageAnchorV01[];
}

export interface ProjectHomeRecentActivityV01 {
  state: ProjectHomeSectionStateV01;
  items: ProjectHomeActivityItemV01[];
}

export interface ProjectHomeRunResultsV01 {
  state: ProjectHomeSectionStateV01;
  current_run: ProjectRunResultCurrentRunV01 | null;
  latest_result: ProjectRunResultSummaryV01 | null;
  latest_result_state:
    | "available"
    | "empty"
    | "receipt_unavailable"
    | "error";
}

export interface ProjectHomeAutomationSummaryV01 {
  state: ProjectHomeSectionStateV01;
  status: ProjectAutomationStatusV01;
  control_revision: number | null;
  updated_at: string | null;
  policy_summary: ProjectAutomationPolicySummaryV01;
  policy_control_eligible: boolean;
  admission_status: ProjectAutomationAdmissionStatusV01;
  admission_reason: string;
  current_run_summary: BoundedAutomationCycleProjectionV01["run"];
  cycle: BoundedAutomationCycleProjectionV01;
}

export interface ProjectHomePersonalPerspectiveSummaryV01 {
  state: ProjectHomeSectionStateV01;
  status: PersonalPerspectiveProjectScopeStatusV01;
  scope_revision: number | null;
  updated_at: string | null;
  effectively_included: boolean;
  effective_context_behavior:
    | "excluded_fail_closed"
    | "excluded_by_explicit_choice"
    | "eligible_for_normal_context_selection";
  explanation: string;
  eligible_selected_count: number;
}

export const PROJECT_HOME_CAPABILITIES_V01 = [
  "openai",
  "codex_native_host",
  "github",
  "mcp",
  "scheduler",
] as const;

export type ProjectHomeCapabilityV01 =
  (typeof PROJECT_HOME_CAPABILITIES_V01)[number];
export type ProjectHomeCapabilityStatusValueV01 =
  | "available"
  | "action_required"
  | "misconfigured"
  | "unavailable";

export interface ProjectHomeCapabilityStatusV01 {
  capability: ProjectHomeCapabilityV01;
  status: ProjectHomeCapabilityStatusValueV01;
  summary: string;
  verification: "trusted_local_status" | "not_remotely_verified";
}

export interface ProjectHomeCapabilitiesSummaryV01 {
  state: ProjectHomeSectionStateV01;
  items: ProjectHomeCapabilityStatusV01[];
}

export interface ProjectHomeNextMoveV01 {
  move_id:
    | "recover_root"
    | "review_attention"
    | "make_active"
    | "configure_automation"
    | "review_paused_automation"
    | "choose_personal_perspective_scope"
    | "review_current_state"
    | "return_to_projects";
  label: string;
  reason: string;
  href: string | null;
  caused_by: string[];
}

export interface ProjectHomeProjectionV01 {
  project_home_projection_version: typeof PROJECT_HOME_PROJECTION_VERSION_V01;
  workspace_id: string;
  project_id: string;
  generated_at: string;
  project_summary: ProjectHomeProjectSummaryV01;
  accepted_state: ProjectHomeAcceptedStateSummaryV01;
  working_projection: ProjectHomeWorkingProjectionSummaryV01;
  attention: ProjectHomePendingAttentionV01;
  recent_activity: ProjectHomeRecentActivityV01;
  run_results: ProjectHomeRunResultsV01;
  automation: ProjectHomeAutomationSummaryV01;
  personal_perspective: ProjectHomePersonalPerspectiveSummaryV01;
  capabilities: ProjectHomeCapabilitiesSummaryV01;
  next_moves: ProjectHomeNextMoveV01[];
  limits: {
    accepted_state_items: 5;
    attention_items: 5;
    recent_activity_items: 5;
    next_moves: 3;
  };
}
