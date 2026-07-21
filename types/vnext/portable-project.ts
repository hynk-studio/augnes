import type { VNextCoreRecordEnvelopeV01 } from "@/lib/vnext/persistence/durable-semantic-store";
import type { PersonalPerspectiveProjectScopeV01 } from "./project-controls";
import type { ProjectIdentityV01, WorkspaceIdentityV01 } from "./project-identity";

export const PORTABLE_PROJECT_CONTRACT_V01 =
  "augnes.portable-project.v1" as const;
export const PORTABLE_PROJECT_CONTRACT_VERSION_V01 = 1 as const;
export const PORTABLE_PROJECT_CANONICALIZATION_V01 =
  "augnes-json-c14n-v0_1" as const;

export interface PortableProjectV01 {
  contract: typeof PORTABLE_PROJECT_CONTRACT_V01;
  contract_version: typeof PORTABLE_PROJECT_CONTRACT_VERSION_V01;
  manifest: {
    application_version: string;
    build_identity: string;
    package_contract: "augnes.distributable.v1";
    package_contract_version: 2;
    runtime_contract: "augnes-local-runtime-supervisor-v1";
    runtime_schema_version: 2;
    database_schema_contract: "augnes.sqlite.structural-schema.v1";
    database_migration_contract: "augnes.canonical-database-migrations.v1";
    database_migration_contract_version: 1;
    database_migration_ids: ["0001_r8_recovery_contract"];
    canonical_record_contract: "augnes.vnext-canonical-records.v1";
    canonical_record_contract_version: 1;
    portability_contract: typeof PORTABLE_PROJECT_CONTRACT_V01;
    source_compatibility: "exact_current_v1";
    exported_at: string;
    workspace: WorkspaceIdentityV01;
    project: ProjectIdentityV01;
    record_kinds: string[];
    record_counts: Record<string, number>;
    record_count: number;
    source_lineage_record_count: number;
    personal_perspective: {
      consented: boolean;
      source_scope: "not_configured" | "included" | "excluded";
      included: boolean;
      excluded_record_count: number;
    };
    exclusions: string[];
    warnings: string[];
    content_fingerprint: string;
  };
  records: VNextCoreRecordEnvelopeV01[];
  operator_provenance_sessions: Array<{
    session_id: string;
    workspace_id: string;
    project_id: string;
    operator_id: string;
    issued_at: string;
    expires_at: string;
    bootstrap_consumed_at: string;
    source_revoked_at: string | null;
    action_nonce_expires_at: string;
  }>;
  personal_perspective_scope: PersonalPerspectiveProjectScopeV01 | null;
  integrity: {
    algorithm: "sha256";
    canonicalization: typeof PORTABLE_PROJECT_CANONICALIZATION_V01;
    fingerprint_scope: "portable_project_without_integrity";
    fingerprint: string;
  };
}

export interface PortableProjectPreviewV01 {
  contract: "augnes.portable-project-preview.v1";
  active_project: true;
  workspace_id: string;
  project_id: string;
  project_display_name: string | null;
  record_kinds: string[];
  record_counts: Record<string, number>;
  record_count: number;
  source_lineage_record_count: number;
  personal_perspective: {
    source_scope: "not_configured" | "included" | "excluded";
    included_by_default: false;
    consent_available: boolean;
    bound_record_count: number;
  };
  excluded_categories: string[];
  warnings: string[];
  compatibility_version: 1;
  export_available: boolean;
}
