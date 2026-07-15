import type {
  TaskContextPacketExcludedEntryV01,
  TaskContextPacketSelectedEntryV01,
} from "./task-context-packet";
import type { ExternalRefV01 } from "./external-ref";

export const PROJECT_AUTOMATION_CONTROL_VERSION_V01 =
  "project_automation_control.v0.1" as const;
export const PROJECT_AUTOMATION_POLICY_VERSION_V01 =
  "project_automation_policy.v0.1" as const;
export const PROJECT_AUTOMATION_POLICY_PROFILE_V01 =
  "bounded_review_required" as const;
export const PROJECT_AUTOMATION_POLICY_SUMMARY_VERSION_V01 =
  "project_automation_policy_summary.v0.1" as const;
export const PROJECT_AUTOMATION_EFFECTIVE_STATUS_VERSION_V01 =
  "project_automation_effective_status.v0.1" as const;
export const PROJECT_AUTOMATION_ADMISSION_RESULT_VERSION_V01 =
  "project_automation_admission_result.v0.1" as const;
export const PERSONAL_PERSPECTIVE_PROJECT_SCOPE_VERSION_V01 =
  "personal_perspective_project_scope.v0.1" as const;
export const PERSONAL_PERSPECTIVE_EFFECTIVE_SCOPE_VERSION_V01 =
  "personal_perspective_effective_scope.v0.1" as const;
export const PERSONAL_PERSPECTIVE_CONTEXT_SELECTION_VERSION_V01 =
  "personal_perspective_context_selection.v0.1" as const;
export const PROJECT_CONTROL_MUTATION_RESULT_VERSION_V01 =
  "project_control_mutation_result.v0.1" as const;

export type ProjectAutomationStatusV01 =
  | "not_configured"
  | "disabled"
  | "enabled"
  | "paused";

export type PersonalPerspectiveProjectScopeStatusV01 =
  | "not_configured"
  | "included"
  | "excluded";

export interface ProjectAutomationPolicyV01 {
  policy_version: typeof PROJECT_AUTOMATION_POLICY_VERSION_V01;
  profile: typeof PROJECT_AUTOMATION_POLICY_PROFILE_V01;
  workspace_id: string;
  project_id: string;
  trigger: "policy_triggered_work";
  max_active_automated_runs: 1;
  automatic_retry: false;
  automatic_semantic_commit: false;
  durable_semantic_change_requires_review: true;
  automatic_approval: false;
  external_actions_authorized: false;
  provider_or_model_use_authorized: false;
  capability_grant_required: true;
  scheduler_integration: "external_reference_only";
  stop_conditions: readonly [
    "manual_pause",
    "review_required",
    "grant_unavailable",
    "capability_unavailable",
    "active_run_limit",
    "policy_denied",
  ];
  can_expand_own_authority: false;
  can_increase_own_budget: false;
  can_select_cross_project_work: false;
  can_merge: false;
  can_publish: false;
  can_deploy: false;
  can_self_modify: false;
}

export interface ProjectAutomationPolicySummaryV01 {
  policy_summary_version:
    typeof PROJECT_AUTOMATION_POLICY_SUMMARY_VERSION_V01;
  title: "Bounded project automation";
  profile: typeof PROJECT_AUTOMATION_POLICY_PROFILE_V01;
  boundaries: readonly [
    "One automated run at a time",
    "No automatic retry",
    "Review required before semantic change",
    "External actions not authorized",
    "Provider use requires separate capability and grant",
    "No scheduler connected",
  ];
}

export interface ProjectAutomationControlV01 {
  control_version: typeof PROJECT_AUTOMATION_CONTROL_VERSION_V01;
  workspace_id: string;
  project_id: string;
  enabled: boolean;
  paused: boolean;
  policy: ProjectAutomationPolicyV01;
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectAutomationEffectiveStatusV01 {
  effective_status_version:
    typeof PROJECT_AUTOMATION_EFFECTIVE_STATUS_VERSION_V01;
  workspace_id: string;
  project_id: string;
  status: ProjectAutomationStatusV01;
  configured: boolean;
  control_revision: number | null;
  created_at: string | null;
  updated_at: string | null;
  policy_summary: ProjectAutomationPolicySummaryV01;
  policy_triggered_work_allowed_at_control_layer: boolean;
  blocked_reasons: string[];
}

export type ProjectAutomationAdmissionStatusV01 =
  | "eligible"
  | "not_configured"
  | "disabled"
  | "paused"
  | "project_scope_mismatch"
  | "active_run_limit"
  | "grant_required"
  | "capability_unavailable"
  | "policy_denied"
  | "unsupported";

export interface ProjectAutomationAdmissionCandidateV01 {
  workspace_id: string;
  project_id: string;
}

export interface ProjectAutomationAdmissionGrantReadinessV01 {
  workspace_id: string;
  project_id: string;
  status:
    | "ready"
    | "required"
    | "capability_unavailable"
    | "policy_denied"
    | "unsupported";
}

export interface ProjectAutomationAdmissionActiveRunReadinessV01 {
  workspace_id: string;
  project_id: string;
  active_automated_run_count: number;
}

export interface ProjectAutomationAdmissionInputV01 {
  workspace_id: string;
  project_id: string;
  control: ProjectAutomationEffectiveStatusV01;
  candidate: ProjectAutomationAdmissionCandidateV01;
  grant_readiness: ProjectAutomationAdmissionGrantReadinessV01;
  active_run_readiness: ProjectAutomationAdmissionActiveRunReadinessV01;
}

export interface ProjectAutomationAdmissionResultV01 {
  admission_result_version:
    typeof PROJECT_AUTOMATION_ADMISSION_RESULT_VERSION_V01;
  workspace_id: string;
  project_id: string;
  status: ProjectAutomationAdmissionStatusV01;
  eligible_for_next_gate: boolean;
  reason: string;
  execution_authority_granted: false;
  grant_created: false;
  run_created: false;
  receipt_created: false;
  proposal_created: false;
  semantic_state_changed: false;
}

export interface PersonalPerspectiveProjectScopeV01 {
  scope_version: typeof PERSONAL_PERSPECTIVE_PROJECT_SCOPE_VERSION_V01;
  workspace_id: string;
  project_id: string;
  selection: "included" | "excluded";
  revision: number;
  created_at: string;
  updated_at: string;
}

export interface PersonalPerspectiveEffectiveScopeV01 {
  effective_scope_version:
    typeof PERSONAL_PERSPECTIVE_EFFECTIVE_SCOPE_VERSION_V01;
  workspace_id: string;
  project_id: string;
  status: PersonalPerspectiveProjectScopeStatusV01;
  configured: boolean;
  effectively_included: boolean;
  scope_revision: number | null;
  created_at: string | null;
  updated_at: string | null;
  effective_context_behavior:
    | "excluded_fail_closed"
    | "excluded_by_explicit_choice"
    | "eligible_for_normal_context_selection";
  explanation: string;
}

export type PersonalPerspectiveContextCandidateScopeV01 =
  | {
      scope_kind: "canonical_project";
      workspace_id: string;
      project_id: string;
    }
  | { scope_kind: "legacy_global" }
  | { scope_kind: "unscoped" };

export interface PersonalPerspectiveContextCandidateV01 {
  candidate_scope: PersonalPerspectiveContextCandidateScopeV01;
  review_status: "reviewed" | "unreviewed" | "contested" | "retracted";
  trust_policy_status: "eligible" | "ineligible";
  entry: TaskContextPacketSelectedEntryV01;
}

export interface PersonalPerspectiveContextSelectionV01 {
  context_selection_version:
    typeof PERSONAL_PERSPECTIVE_CONTEXT_SELECTION_VERSION_V01;
  workspace_id: string;
  project_id: string;
  scope_status: PersonalPerspectiveProjectScopeStatusV01;
  scope_revision: number | null;
  scope_lineage_ref: ExternalRefV01 | null;
  selected_context: TaskContextPacketSelectedEntryV01[];
  excluded_context: TaskContextPacketExcludedEntryV01[];
  eligible_selected_count: number;
  excluded_count: number;
}

export type ProjectAutomationControlActionV01 =
  | "enable_automation"
  | "disable_automation"
  | "pause_automation"
  | "resume_automation";

export type PersonalPerspectiveScopeActionV01 =
  | "include_personal_perspective"
  | "exclude_personal_perspective";

export type ProjectControlActionV01 =
  | ProjectAutomationControlActionV01
  | PersonalPerspectiveScopeActionV01;

export interface ProjectControlMutationResultV01 {
  mutation_result_version: typeof PROJECT_CONTROL_MUTATION_RESULT_VERSION_V01;
  action: ProjectControlActionV01;
  automation: ProjectAutomationEffectiveStatusV01 | null;
  personal_perspective: PersonalPerspectiveEffectiveScopeV01 | null;
}
