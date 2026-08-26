import type { ExternalRefV01 } from "./external-ref";
import type {
  LocalProjectRootRefV01,
  ProjectIdentityV01,
} from "./project-identity";
import type { RepositoryExecutionDecisionRequestProjectionV01 } from "./repository-execution";

export const LOCAL_PROJECT_INSPECTION_VERSION_V01 =
  "local_project_inspection.v0.1" as const;
export const RECENT_PROJECT_ENTRY_VERSION_V01 =
  "recent_project_entry.v0.1" as const;
export const ACTIVE_PROJECT_SELECTION_VERSION_V01 =
  "active_project_selection.v0.1" as const;
export const LOCAL_PROJECT_PATH_DECLARATION_VERSION_V01 =
  "local_project_path_declaration.v0.1" as const;
export const LOCAL_PROJECT_ONBOARDING_DECISION_VERSION_V01 =
  "local_project_onboarding_decision.v0.1" as const;

export type LocalProjectSelectionOriginV01 =
  | "native_picker"
  | "declared_path";

export type LocalFolderPickerOutcomeV01 =
  | {
      status: "selected";
      selection_token: string;
      selection_origin: LocalProjectSelectionOriginV01;
      inspection: LocalProjectInspectionV01;
    }
  | { status: "cancelled" }
  | { status: "unavailable"; reason: "unsupported_platform" | "picker_not_installed" }
  | { status: "error"; error_code: "picker_timeout" | "picker_failed" };

export type LocalProjectRecoverySelectionOutcomeV01 = Extract<
  LocalFolderPickerOutcomeV01,
  { status: "selected" }
> & {
  recovery_action: "open_project" | "rebind";
};

export type ProjectRootAvailabilityV01 =
  | "available"
  | "missing"
  | "inaccessible"
  | "not_directory"
  | "inspection_error";

export interface LocalProjectInspectionV01 {
  inspection_version: typeof LOCAL_PROJECT_INSPECTION_VERSION_V01;
  display_name: string;
  local_root: LocalProjectRootRefV01;
  folder_kind: "plain_folder" | "git_repository";
  repository_ref: ExternalRefV01 | null;
  repository_display: string | null;
  repository_status: "configured" | "no_remote" | "not_repository";
  inspected_at: string;
  inspection_fingerprint: string;
  physical_identity_status:
    | "exact"
    | "identity_unavailable"
    | "identity_unsupported"
    | "identity_ambiguous";
  physical_root_observation_fingerprint: string | null;
  already_added: boolean;
  existing_project: ProjectIdentityV01 | null;
}

export interface RecentProjectEntryV01 {
  recent_project_entry_version: typeof RECENT_PROJECT_ENTRY_VERSION_V01;
  project: ProjectIdentityV01;
  local_root: LocalProjectRootRefV01;
  root_availability: ProjectRootAvailabilityV01;
  created_at: string;
  last_opened_at: string;
  is_active: boolean;
  active_project_id: string | null;
  active_selection_revision: number | null;
  root_binding_fingerprint: string;
  physical_root_baseline_fingerprint: string | null;
  repository_execution_decision: RepositoryExecutionDecisionRequestProjectionV01 | null;
}

export interface ActiveProjectSelectionV01 {
  active_project_selection_version:
    typeof ACTIVE_PROJECT_SELECTION_VERSION_V01;
  workspace_id: string;
  project_id: string;
  selection_revision: number;
  selected_at: string;
}

export interface ProjectOnboardingConfirmationV01 {
  status: "created" | "already_added";
  project: ProjectIdentityV01;
  destination: string;
}

export interface LocalProjectPathDeclarationV01 {
  declaration_version: typeof LOCAL_PROJECT_PATH_DECLARATION_VERSION_V01;
  absolute_path: string;
  path_flavor: "posix" | "windows";
}

export interface LocalProjectOnboardingChallengeV01 {
  decision_version: typeof LOCAL_PROJECT_ONBOARDING_DECISION_VERSION_V01;
  challenge_fingerprint: string;
  expires_at: string;
}

export interface ProjectRootRebindResultV01 {
  status: "rebound";
  project: ProjectIdentityV01;
  local_root: LocalProjectRootRefV01;
  destination: string;
}

export type ProjectOnboardingErrorCodeV01 =
  | "selection_invalid"
  | "selection_origin_mismatch"
  | "path_declaration_empty"
  | "path_declaration_too_large"
  | "path_declaration_control_character"
  | "path_declaration_relative"
  | "path_declaration_url"
  | "path_declaration_unsupported"
  | "onboarding_confirmation_required"
  | "onboarding_confirmation_invalid"
  | "onboarding_confirmation_expired"
  | "onboarding_confirmation_conflict"
  | "selection_missing"
  | "selection_inaccessible"
  | "selection_not_directory"
  | "inspection_failed"
  | "physical_identity_unavailable"
  | "physical_identity_unsupported"
  | "physical_identity_ambiguous"
  | "inspection_stale"
  | "selection_tampered"
  | "duplicate_root"
  | "project_scope_conflict"
  | "project_external_ref_conflict"
  | "active_selection_conflict"
  | "project_not_recent"
  | "project_root_unavailable";
