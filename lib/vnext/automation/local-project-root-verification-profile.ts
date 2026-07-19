import {
  LOCAL_PROJECT_ROOT_VERIFICATION_WORK_PROFILE_V01,
  type VNextAutomationWorkSourceV01,
} from "@/types/vnext/automation-work-item";

export { LOCAL_PROJECT_ROOT_VERIFICATION_WORK_PROFILE_V01 };

export const LOCAL_PROJECT_ROOT_VERIFICATION_TITLE_V01 =
  "Bounded project-root verification" as const;

export const LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01 = {
  goal:
    "Verify the exact current project root and produce one bounded canonical top-level manifest fingerprint.",
  success_criteria: [
    "The exact admitted project-root identity was revalidated at adapter execution time.",
    "Manifest enumeration completed within the exact configured entry bound.",
    "One canonical top-level manifest fingerprint was produced.",
    "No command, file mutation, network, provider, model, credential, or external action occurred.",
  ],
  non_goals: [
    "Do not execute the source packet task.",
    "Do not execute repository commands or mutate project files.",
    "Do not use network, provider, model, credential, or external-action authority.",
  ],
} as const satisfies VNextAutomationWorkSourceV01["task"];

export const LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01 = [
  "project_file_mutation_absent",
  "project_root_manifest_bound",
  "project_root_manifest_verified",
  "project_root_scope_verified",
  "provider_model_network_absent",
] as const;

export const LOCAL_PROJECT_ROOT_VERIFICATION_EXPECTED_OUTPUTS_V01 = [
  "project_root_manifest_fingerprint",
] as const;
