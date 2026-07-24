import {
  MANAGEMENT_SAFETY_VIEW_VERSION_V01,
  type ManagementSafetyProjectContextV01,
  type ManagementSafetyViewV01,
} from "@/types/vnext/management-safety";

export function buildManagementSafetyViewV01(input: {
  project_context: ManagementSafetyProjectContextV01;
}): ManagementSafetyViewV01 {
  return {
    view_version: MANAGEMENT_SAFETY_VIEW_VERSION_V01,
    project_context: input.project_context,
    project_management: {
      kind: "project_management",
      label: "Manage project",
      summary: "Choose, switch, locate, or remove recent local projects.",
      href: "/projects#project-management",
    },
    project_transfer: {
      kind: "project_transfer",
      label: "Move or import a project",
      summary:
        input.project_context === "active_project"
          ? "Export the current project or import another local project package."
          : input.project_context === "viewed_inactive_project"
            ? "Import a local project package. Export always uses the current project."
            : "Import a local project package.",
      href: "/portability",
    },
    local_recovery: {
      kind: "local_recovery",
      label: "Backups and recovery",
      summary:
        "Create or review local recovery points and application safety.",
      href: "/recovery",
    },
    authority: {
      writes_database: false,
      exports_project: false,
      imports_project: false,
      creates_backup: false,
      restores_backup: false,
      retries_update: false,
      switches_project: false,
      calls_provider: false,
      calls_github: false,
      performs_external_action: false,
    },
  };
}
