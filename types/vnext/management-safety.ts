export const MANAGEMENT_SAFETY_VIEW_VERSION_V01 =
  "management_safety_view.v0.1" as const;

export type ManagementSafetyProjectContextV01 =
  | "active_project"
  | "no_active_project"
  | "viewed_inactive_project";

export interface ManagementSafetyNavigationItemV01 {
  kind: "project_management" | "project_transfer" | "local_recovery";
  label: string;
  summary: string;
  href: "#project-management" | "/portability" | "/recovery";
}

export interface ManagementSafetyViewV01 {
  view_version: typeof MANAGEMENT_SAFETY_VIEW_VERSION_V01;
  project_context: ManagementSafetyProjectContextV01;
  project_management: ManagementSafetyNavigationItemV01;
  project_transfer: ManagementSafetyNavigationItemV01;
  local_recovery: ManagementSafetyNavigationItemV01;
  authority: {
    writes_database: false;
    exports_project: false;
    imports_project: false;
    creates_backup: false;
    restores_backup: false;
    retries_update: false;
    switches_project: false;
    calls_provider: false;
    calls_github: false;
    performs_external_action: false;
  };
}
