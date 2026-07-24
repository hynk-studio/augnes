export const RECOVERY_SAFETY_VIEW_VERSION_V01 =
  "recovery_safety_view.v0.1" as const;

export interface RecoveryContinuityStatusV01 {
  contract: "augnes.continuity-operations.v1";
  status_available: boolean;
  public_reason_code: string;
  portability: null | {
    operation: "preview" | "export" | "import";
    outcome: "available" | "completed" | "exact_replay" | "refused";
    reason_code: string;
    record_count: number;
    reader_verification: "not_applicable" | "verified" | "refused";
    next_safe_action: string;
  };
  reconciliation: null | {
    outcome: "reconciled" | "review_needed" | "conflict_refused";
    total_runs_considered: number;
    counts: Record<string, number>;
    exact_replays_reused: number;
    conflicts_refused: number;
    waiting_for_approval_count: number;
    orphaned_review_needed_count: number;
    unsupported_host_coverage_count: number;
    no_retry_count: number;
    reason_codes: string[];
    next_safe_action: string;
    automatic_retry_started: false;
    semantic_authority_created: false;
    external_action_created: false;
  };
}

export interface RecoveryStatusV01 {
  contract: "augnes.recovery-product.v1";
  schema_version: 1;
  recovery_mode: boolean;
  application: {
    version: string;
    build_identity: string;
    package_contract: string | null;
    package_contract_version: number | null;
    compatibility: "verified_package" | "source_runtime";
  };
  database: {
    state: string;
    schema_contract: string | null;
    schema_classification: "current" | "old" | "incompatible" | "unavailable";
    migration_state: string;
  };
  runtime: {
    runtime_contract: string | null;
    runtime_schema_version: number | null;
    lifecycle_state: string;
    bridge_health: string;
    capability_availability: string;
  };
  continuity: RecoveryContinuityStatusV01;
  latest_operation: {
    outcome: string;
    reason_code: string;
    application_version: string | null;
    target_application_version: string | null;
    target_build_identity: string | null;
    database_state: string | null;
    data_preserved: boolean;
    backup_verified: boolean;
    safety_backup_created: boolean;
    next_action: string;
  } | null;
  backup_inventory_state: "available" | "unavailable";
  backup_count: number;
  legacy_backup_count: number;
  legacy_backup_unavailable_count: number;
  backup_inventory_truncated: boolean;
  backup_page: number;
  backup_page_count: number;
  backups: Array<{
    backup_id: string;
    label: string;
    created_at: string;
    reason: string;
    source_application_version: string;
    verified: boolean;
  }>;
  actions: {
    create_backup: boolean;
    retry_update: boolean;
    restore_backup: boolean;
  };
}

export type RecoverySafetyPrimaryActionKindV01 =
  | "check_again"
  | "create_backup"
  | "retry_update"
  | "restore_backup"
  | "none";

export interface RecoverySafetyActionV01 {
  kind: RecoverySafetyPrimaryActionKindV01;
  label: string;
  mutates: boolean;
}

export interface RecoverySafetyViewV01 {
  view_version: typeof RECOVERY_SAFETY_VIEW_VERSION_V01;
  mode: "normal" | "recovery" | "unknown";
  safety_state: "ready" | "attention" | "incompatible" | "unavailable";
  heading: string;
  situation: string;
  safety_status_label: string;
  latest_operation_summary: string | null;
  primary_action: RecoverySafetyActionV01;
  secondary_actions: RecoverySafetyActionV01[];
  backup_summary: {
    inventory_state: RecoveryStatusV01["backup_inventory_state"] | "unknown";
    verified_count: number;
    selected_verified: boolean;
    truncated: boolean;
    legacy_unavailable_count: number;
    notice: string | null;
  };
  diagnostics_available: boolean;
  authority: {
    writes_database: false;
    creates_backup: false;
    restores_backup: false;
    retries_update: false;
    selects_backup: false;
    changes_recovery_mode: false;
    changes_project_state: false;
    calls_provider: false;
    calls_github: false;
    performs_external_action: false;
    retries_automatically: false;
  };
}
