import type { ExternalRefV01 } from "./external-ref";
import type {
  LocalProjectRootRefV01,
  ProjectIdentityV01,
} from "./project-identity";

export const LOCAL_PROJECT_INSPECTION_VERSION_V01 =
  "local_project_inspection.v0.1" as const;
export const RECENT_PROJECT_ENTRY_VERSION_V01 =
  "recent_project_entry.v0.1" as const;
export const ACTIVE_PROJECT_SELECTION_VERSION_V01 =
  "active_project_selection.v0.1" as const;

export type LocalFolderPickerOutcomeV01 =
  | { status: "selected"; selection_token: string; inspection: LocalProjectInspectionV01 }
  | { status: "cancelled" }
  | { status: "unavailable"; reason: "unsupported_platform" | "picker_not_installed" }
  | { status: "error"; error_code: "picker_timeout" | "picker_failed" };

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
  already_added: boolean;
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

export interface ProjectRootRebindResultV01 {
  status: "rebound";
  project: ProjectIdentityV01;
  local_root: LocalProjectRootRefV01;
  destination: string;
}

export type ProjectOnboardingErrorCodeV01 =
  | "selection_invalid"
  | "selection_missing"
  | "selection_inaccessible"
  | "selection_not_directory"
  | "inspection_failed"
  | "inspection_stale"
  | "selection_tampered"
  | "duplicate_root"
  | "project_scope_conflict"
  | "project_external_ref_conflict"
  | "active_selection_conflict"
  | "project_not_recent"
  | "project_root_unavailable";
