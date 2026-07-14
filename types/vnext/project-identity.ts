import type { ExternalRefV01 } from "./external-ref";

export const WORKSPACE_IDENTITY_VERSION_V01 =
  "workspace_identity.v0.1" as const;
export const PROJECT_IDENTITY_VERSION_V01 =
  "project_identity.v0.1" as const;
export const LOCAL_PROJECT_ROOT_REF_VERSION_V01 =
  "local_project_root_ref.v0.1" as const;
export const PROJECT_LOCAL_ROOT_BINDING_VERSION_V01 =
  "project_local_root_binding.v0.1" as const;
export const PROJECT_EXTERNAL_REF_BINDING_VERSION_V01 =
  "project_external_ref_binding.v0.1" as const;
export const LEGACY_PROJECT_COMPATIBILITY_IDENTITY_VERSION_V01 =
  "legacy_project_compatibility_identity.v0.1" as const;

export const DEFAULT_LOCAL_WORKSPACE_ROLE_V01 = "default_local" as const;
export const LEGACY_AUGNES_PROJECT_SCOPE_V01 = "project:augnes" as const;

export type LocalProjectPathFlavorV01 = "posix" | "win32";

export interface WorkspaceIdentityV01 {
  workspace_identity_version: typeof WORKSPACE_IDENTITY_VERSION_V01;
  identity_kind: "canonical";
  identity_source: "canonical_registry";
  workspace_id: string;
  workspace_role: typeof DEFAULT_LOCAL_WORKSPACE_ROLE_V01;
  created_at: string;
}

export interface ProjectIdentityV01 {
  project_identity_version: typeof PROJECT_IDENTITY_VERSION_V01;
  identity_kind: "canonical";
  identity_source: "canonical_registry";
  workspace_id: string;
  project_id: string;
  display_name: string | null;
  created_at: string;
}

export interface LocalProjectRootRefV01 {
  local_root_ref_version: typeof LOCAL_PROJECT_ROOT_REF_VERSION_V01;
  ref_kind: "local_project_root";
  path_flavor: LocalProjectPathFlavorV01;
  normalized_path: string;
}

export interface ProjectLocalRootBindingV01 {
  binding_version: typeof PROJECT_LOCAL_ROOT_BINDING_VERSION_V01;
  workspace_id: string;
  project_id: string;
  local_root: LocalProjectRootRefV01;
  bound_at: string;
}

export interface ProjectExternalRefBindingV01 {
  binding_version: typeof PROJECT_EXTERNAL_REF_BINDING_VERSION_V01;
  workspace_id: string;
  project_id: string;
  ref_fingerprint: string;
  external_ref: ExternalRefV01;
  created_at: string;
}

export interface LegacyProjectCompatibilityIdentityV01 {
  compatibility_identity_version:
    typeof LEGACY_PROJECT_COMPATIBILITY_IDENTITY_VERSION_V01;
  identity_kind: "legacy_compatibility";
  identity_source: "legacy_scope";
  legacy_scope: typeof LEGACY_AUGNES_PROJECT_SCOPE_V01;
  read_only: true;
}

export type ResolvedProjectIdentityV01 =
  | ProjectIdentityV01
  | LegacyProjectCompatibilityIdentityV01;
