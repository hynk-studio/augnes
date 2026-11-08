import { migrateProjectSelectionV02, projectSelectionSchemaSqlV02, migrateProjectOrganizationV01, projectOrganizationSchemaSqlV01 } from "../../lib/vnext/persistence/project-lifecycle-schema.mjs";

// This family owns its migration implementations and canonical result assembly.
export const vNextProjectIdentityRegistrySchemaSqlV01 = `
  CREATE TABLE IF NOT EXISTS vnext_workspace_identities (
    workspace_id TEXT PRIMARY KEY CHECK (
      length(workspace_id) <= 256 AND
      workspace_id GLOB 'workspace:*' AND
      length(substr(workspace_id, 11)) > 0
    ),
    workspace_identity_version TEXT NOT NULL CHECK (
      workspace_identity_version = 'workspace_identity.v0.1'
    ),
    identity_kind TEXT NOT NULL CHECK (identity_kind = 'canonical'),
    identity_source TEXT NOT NULL CHECK (identity_source = 'canonical_registry'),
    workspace_role TEXT NOT NULL UNIQUE CHECK (
      length(trim(workspace_role)) > 0 AND length(workspace_role) <= 128
    ),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0)
  );

  CREATE TABLE IF NOT EXISTS vnext_project_identities (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL CHECK (
      length(project_id) <= 256 AND
      project_id GLOB 'project:*' AND
      project_id <> 'project:augnes' AND
      length(substr(project_id, 9)) > 0
    ),
    project_identity_version TEXT NOT NULL CHECK (
      project_identity_version = 'project_identity.v0.1'
    ),
    identity_kind TEXT NOT NULL CHECK (identity_kind = 'canonical'),
    identity_source TEXT NOT NULL CHECK (identity_source = 'canonical_registry'),
    display_name TEXT CHECK (
      display_name IS NULL OR
      (length(trim(display_name)) > 0 AND length(display_name) <= 240)
    ),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id)
      REFERENCES vnext_workspace_identities(workspace_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_project_identities_workspace_created
    ON vnext_project_identities(workspace_id, created_at, project_id);

  CREATE TABLE IF NOT EXISTS vnext_project_root_bindings (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    binding_version TEXT NOT NULL CHECK (
      binding_version = 'project_local_root_binding.v0.1'
    ),
    local_root_ref_version TEXT NOT NULL CHECK (
      local_root_ref_version = 'local_project_root_ref.v0.1'
    ),
    ref_kind TEXT NOT NULL CHECK (ref_kind = 'local_project_root'),
    path_flavor TEXT NOT NULL CHECK (path_flavor IN ('posix', 'win32')),
    normalized_root TEXT NOT NULL CHECK (
      length(normalized_root) > 0 AND
      length(normalized_root) <= 8192 AND
      instr(normalized_root, char(0)) = 0
    ),
    bound_at TEXT NOT NULL CHECK (length(trim(bound_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_project_root_bindings_workspace_root
    ON vnext_project_root_bindings(workspace_id, path_flavor, normalized_root);

  CREATE TABLE IF NOT EXISTS vnext_project_external_ref_bindings (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    binding_version TEXT NOT NULL CHECK (
      binding_version = 'project_external_ref_binding.v0.1'
    ),
    ref_fingerprint TEXT NOT NULL CHECK (
      length(ref_fingerprint) = 71 AND substr(ref_fingerprint, 1, 7) = 'sha256:'
    ),
    ref_json TEXT NOT NULL CHECK (
      json_valid(ref_json) AND json_type(ref_json) = 'object'
    ),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    PRIMARY KEY (workspace_id, project_id, ref_fingerprint),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_project_external_refs_project_created
    ON vnext_project_external_ref_bindings(
      workspace_id, project_id, created_at, ref_fingerprint
    );

  CREATE TRIGGER IF NOT EXISTS trg_vnext_project_external_refs_immutable_update
    BEFORE UPDATE ON vnext_project_external_ref_bindings
    BEGIN SELECT RAISE(ABORT, 'vnext_project_external_ref_binding_immutable'); END;
  CREATE TRIGGER IF NOT EXISTS trg_vnext_project_external_refs_immutable_delete
    BEFORE DELETE ON vnext_project_external_ref_bindings
    BEGIN SELECT RAISE(ABORT, 'vnext_project_external_ref_binding_immutable'); END;
`;

const vNextProjectIdentityRegistryArtifactsV01 = {
  tables: [
    "vnext_workspace_identities",
    "vnext_project_identities",
    "vnext_project_root_bindings",
    "vnext_project_external_ref_bindings",
  ],
  indexes: [
    "idx_vnext_project_identities_workspace_created",
    "idx_vnext_project_root_bindings_workspace_root",
    "idx_vnext_project_external_refs_project_created",
  ],
  triggers: [
    "trg_vnext_project_external_refs_immutable_update",
    "trg_vnext_project_external_refs_immutable_delete",
  ],
};

export function migrateVNextProjectIdentityRegistryV01(db) {
  const names = Object.values(vNextProjectIdentityRegistryArtifactsV01).flat();
  const before = new Set(
    db
      .prepare(
        `SELECT type || ':' || name AS key
         FROM sqlite_master
         WHERE name IN (${names.map(() => "?").join(", ")})`,
      )
      .all(...names)
      .map((row) => row.key),
  );
  db.exec(vNextProjectIdentityRegistrySchemaSqlV01);
  const created = (type, artifactNames) =>
    artifactNames.filter((name) => !before.has(`${type}:${name}`));
  return {
    created_tables: created(
      "table",
      vNextProjectIdentityRegistryArtifactsV01.tables,
    ),
    created_indexes: created(
      "index",
      vNextProjectIdentityRegistryArtifactsV01.indexes,
    ),
    created_triggers: created(
      "trigger",
      vNextProjectIdentityRegistryArtifactsV01.triggers,
    ),
  };
}

export const vNextRepositoryExecutionStoreSchemaSqlV01 = `
  CREATE TABLE IF NOT EXISTS vnext_physical_root_baselines (
    workspace_id TEXT NOT NULL, project_id TEXT NOT NULL,
    node_scope_fingerprint TEXT NOT NULL CHECK (length(node_scope_fingerprint) = 71 AND substr(node_scope_fingerprint, 1, 7) = 'sha256:'),
    baseline_version TEXT NOT NULL CHECK (baseline_version = 'physical_root_baseline.v0.1'),
    root_binding_fingerprint TEXT NOT NULL CHECK (length(root_binding_fingerprint) = 71 AND substr(root_binding_fingerprint, 1, 7) = 'sha256:'),
    identity_version TEXT NOT NULL CHECK (identity_version IN ('native_host_physical_root_identity.v0.1', 'physical_root_identity.windows.v0.1')),
    identity_platform TEXT CHECK (identity_platform IS NULL OR identity_platform = 'win32'),
    canonical_realpath_fingerprint TEXT CHECK (canonical_realpath_fingerprint IS NULL OR (length(canonical_realpath_fingerprint) = 71 AND substr(canonical_realpath_fingerprint, 1, 7) = 'sha256:')),
    canonical_final_path_fingerprint TEXT CHECK (canonical_final_path_fingerprint IS NULL OR (length(canonical_final_path_fingerprint) = 71 AND substr(canonical_final_path_fingerprint, 1, 7) = 'sha256:')),
    supported_filesystem_family TEXT CHECK (supported_filesystem_family IS NULL OR supported_filesystem_family = 'NTFS'),
    filesystem_volume_identity TEXT NOT NULL CHECK (length(filesystem_volume_identity) > 0),
    filesystem_object_identity TEXT NOT NULL CHECK (length(filesystem_object_identity) > 0),
    observed_at TEXT NOT NULL CHECK (length(trim(observed_at)) > 0),
    provenance TEXT NOT NULL CHECK (provenance IN ('canonical_new_project_onboarding', 'explicit_legacy_adoption', 'explicit_root_rebind')),
    baseline_fingerprint TEXT NOT NULL UNIQUE CHECK (length(baseline_fingerprint) = 71 AND substr(baseline_fingerprint, 1, 7) = 'sha256:'),
    CHECK ((identity_version = 'native_host_physical_root_identity.v0.1' AND identity_platform IS NULL AND canonical_realpath_fingerprint IS NOT NULL AND canonical_final_path_fingerprint IS NULL AND supported_filesystem_family IS NULL) OR (identity_version = 'physical_root_identity.windows.v0.1' AND identity_platform = 'win32' AND canonical_realpath_fingerprint IS NULL AND canonical_final_path_fingerprint IS NOT NULL AND supported_filesystem_family = 'NTFS')),
    PRIMARY KEY (workspace_id, project_id, node_scope_fingerprint),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_vnext_physical_root_baselines_project
    ON vnext_physical_root_baselines(workspace_id, project_id, observed_at);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_physical_root_baselines_object
    ON vnext_physical_root_baselines(workspace_id, node_scope_fingerprint, identity_version, filesystem_volume_identity, filesystem_object_identity)
    WHERE identity_version = 'physical_root_identity.windows.v0.1';
  CREATE TABLE IF NOT EXISTS vnext_repository_execution_attachments (
    attachment_id TEXT PRIMARY KEY CHECK (length(attachment_id) = 71 AND substr(attachment_id, 1, 7) = 'sha256:'),
    attachment_version TEXT NOT NULL CHECK (attachment_version = 'repository_execution_attachment.v0.1'),
    workspace_id TEXT NOT NULL, project_id TEXT NOT NULL,
    node_scope_fingerprint TEXT NOT NULL CHECK (length(node_scope_fingerprint) = 71),
    physical_root_baseline_fingerprint TEXT NOT NULL CHECK (length(physical_root_baseline_fingerprint) = 71),
    root_binding_fingerprint TEXT NOT NULL CHECK (length(root_binding_fingerprint) = 71),
    task_context_packet_id TEXT NOT NULL,
    task_context_packet_fingerprint TEXT NOT NULL CHECK (length(task_context_packet_fingerprint) = 71),
    current_work_fingerprint TEXT NOT NULL CHECK (length(current_work_fingerprint) = 71),
    project_execution_admission_fingerprint TEXT NOT NULL CHECK (length(project_execution_admission_fingerprint) = 71),
    worktree_observation_fingerprint TEXT NOT NULL CHECK (length(worktree_observation_fingerprint) = 71),
    managed_run_state_fingerprint TEXT NOT NULL CHECK (length(managed_run_state_fingerprint) = 71),
    binding_fingerprint TEXT NOT NULL UNIQUE CHECK (length(binding_fingerprint) = 71),
    prepared_at TEXT NOT NULL CHECK (length(trim(prepared_at)) > 0),
    freshness_policy_json TEXT NOT NULL CHECK (json_valid(freshness_policy_json) AND json_type(freshness_policy_json) = 'object'),
    lifecycle TEXT NOT NULL CHECK (lifecycle IN ('prepared', 'stale', 'superseded', 'revoked', 'consumed')),
    stale_reason TEXT CHECK (stale_reason IS NULL OR stale_reason IN ('physical_root_mismatch', 'root_binding_changed', 'packet_changed', 'current_work_changed', 'project_unavailable', 'managed_run_conflict', 'worktree_changed', 'freshness_expired', 'explicitly_revoked', 'superseded')),
    lifecycle_updated_at TEXT NOT NULL CHECK (length(trim(lifecycle_updated_at)) > 0),
    consumed_run_id TEXT,
    CHECK ((lifecycle = 'consumed' AND consumed_run_id IS NOT NULL AND length(trim(consumed_run_id)) > 0) OR (lifecycle <> 'consumed' AND consumed_run_id IS NULL)),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_vnext_repository_execution_attachments_project
    ON vnext_repository_execution_attachments(workspace_id, project_id, lifecycle_updated_at DESC, attachment_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_repository_execution_one_prepared
    ON vnext_repository_execution_attachments(workspace_id, project_id) WHERE lifecycle = 'prepared';
  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_repository_execution_consumed_run
    ON vnext_repository_execution_attachments(consumed_run_id) WHERE consumed_run_id IS NOT NULL;
  CREATE TABLE IF NOT EXISTS vnext_repository_run_resume_checkpoints (
    checkpoint_fingerprint TEXT PRIMARY KEY CHECK (length(checkpoint_fingerprint) = 71 AND substr(checkpoint_fingerprint, 1, 7) = 'sha256:'),
    checkpoint_version TEXT NOT NULL CHECK (checkpoint_version = 'repository_run_resume_checkpoint.v0.1'),
    workspace_id TEXT NOT NULL, project_id TEXT NOT NULL, run_id TEXT NOT NULL,
    invocation_origin TEXT NOT NULL CHECK (invocation_origin = 'repository_attachment'),
    attachment_id TEXT NOT NULL,
    attachment_binding_fingerprint TEXT NOT NULL CHECK (length(attachment_binding_fingerprint) = 71),
    node_scope_fingerprint TEXT NOT NULL CHECK (length(node_scope_fingerprint) = 71),
    execution_envelope_version TEXT NOT NULL CHECK (execution_envelope_version = 'repository_execution_envelope.v0.1'),
    execution_envelope_fingerprint TEXT NOT NULL CHECK (length(execution_envelope_fingerprint) = 71),
    adapter_version TEXT NOT NULL CHECK (length(adapter_version) BETWEEN 1 AND 160),
    capability_version TEXT NOT NULL CHECK (length(capability_version) BETWEEN 1 AND 160),
    provider_resume_binding_version TEXT NOT NULL CHECK (provider_resume_binding_version = 'native_host_resume_binding.v0.1'),
    provider_thread_ref_json TEXT NOT NULL CHECK (json_valid(provider_thread_ref_json) AND json_type(provider_thread_ref_json) = 'object'),
    last_turn_ref_json TEXT NOT NULL CHECK (json_valid(last_turn_ref_json) AND json_type(last_turn_ref_json) = 'object'),
    controller_generation INTEGER NOT NULL CHECK (controller_generation >= 1),
    runtime_instance_fingerprint TEXT NOT NULL CHECK (length(runtime_instance_fingerprint) = 71),
    runtime_generation_fingerprint TEXT NOT NULL CHECK (length(runtime_generation_fingerprint) = 71),
    run_control_revision INTEGER NOT NULL CHECK (run_control_revision >= 0),
    step_id TEXT NOT NULL CHECK (length(trim(step_id)) > 0),
    step_control_revision INTEGER NOT NULL CHECK (step_control_revision >= 0),
    event_high_water_mark INTEGER NOT NULL CHECK (event_high_water_mark >= 0),
    step_high_water_mark INTEGER NOT NULL CHECK (step_high_water_mark >= 0),
    effect_ledger_high_water_mark INTEGER NOT NULL CHECK (effect_ledger_high_water_mark >= 0),
    operation_ref TEXT NOT NULL CHECK (length(operation_ref) = 71 AND substr(operation_ref, 1, 7) = 'sha256:'),
    operation_class TEXT NOT NULL CHECK (operation_class IN ('command_execution', 'file_change')),
    checkpoint_phase TEXT NOT NULL CHECK (checkpoint_phase IN ('declared_pre_start', 'post_operation')),
    operation_certainty TEXT NOT NULL CHECK (operation_certainty IN ('not_started', 'started', 'completed', 'failed', 'cancelled', 'waiting_for_approval')),
    approval_ref TEXT,
    approval_state TEXT CHECK (approval_state IS NULL OR approval_state IN ('pending', 'decided', 'expired')),
    root_binding_fingerprint TEXT NOT NULL CHECK (length(root_binding_fingerprint) = 71),
    physical_root_baseline_fingerprint TEXT NOT NULL CHECK (length(physical_root_baseline_fingerprint) = 71),
    worktree_observation_fingerprint TEXT NOT NULL CHECK (length(worktree_observation_fingerprint) = 71),
    observed_at TEXT NOT NULL CHECK (length(trim(observed_at)) > 0),
    CHECK ((approval_ref IS NULL AND approval_state IS NULL) OR (approval_ref IS NOT NULL AND approval_state IS NOT NULL)),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (run_id) REFERENCES autonomy_runs(run_id) ON DELETE CASCADE,
    FOREIGN KEY (attachment_id) REFERENCES vnext_repository_execution_attachments(attachment_id) ON UPDATE RESTRICT ON DELETE CASCADE
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_repository_resume_checkpoint_operation
    ON vnext_repository_run_resume_checkpoints(run_id, operation_ref, checkpoint_phase);
  CREATE INDEX IF NOT EXISTS idx_vnext_repository_resume_checkpoint_current
    ON vnext_repository_run_resume_checkpoints(workspace_id, project_id, run_id, effect_ledger_high_water_mark DESC, event_high_water_mark DESC, checkpoint_fingerprint);
  CREATE TABLE IF NOT EXISTS vnext_repository_managed_resume_attempts (
    attempt_fingerprint TEXT PRIMARY KEY CHECK (length(attempt_fingerprint) = 71 AND substr(attempt_fingerprint, 1, 7) = 'sha256:'),
    attempt_version TEXT NOT NULL CHECK (attempt_version = 'repository_managed_resume_attempt.v0.1'),
    workspace_id TEXT NOT NULL, project_id TEXT NOT NULL, run_id TEXT NOT NULL,
    attachment_id TEXT NOT NULL,
    attachment_binding_fingerprint TEXT NOT NULL CHECK (length(attachment_binding_fingerprint) = 71),
    checkpoint_fingerprint TEXT NOT NULL,
    checkpoint_version TEXT NOT NULL CHECK (checkpoint_version = 'repository_run_resume_checkpoint.v0.1'),
    prior_controller_generation INTEGER NOT NULL CHECK (prior_controller_generation >= 1),
    resumed_controller_generation INTEGER NOT NULL CHECK (resumed_controller_generation = prior_controller_generation + 1),
    decision_request_fingerprint TEXT NOT NULL CHECK (length(decision_request_fingerprint) = 71),
    decision_grant_fingerprint TEXT NOT NULL CHECK (length(decision_grant_fingerprint) = 71),
    expected_state_fingerprint TEXT NOT NULL CHECK (length(expected_state_fingerprint) = 71),
    admitted_run_control_revision INTEGER NOT NULL CHECK (admitted_run_control_revision >= 1),
    admitted_step_control_revision INTEGER NOT NULL CHECK (admitted_step_control_revision >= 1),
    runtime_instance_fingerprint TEXT NOT NULL CHECK (length(runtime_instance_fingerprint) = 71),
    runtime_generation_fingerprint TEXT NOT NULL CHECK (length(runtime_generation_fingerprint) = 71),
    attempt_state TEXT NOT NULL CHECK (attempt_state IN ('admitted_not_invoked', 'provider_resume_invocation_started', 'controller_owned', 'settled', 'reconciliation_required')),
    final_outcome TEXT CHECK (final_outcome IS NULL OR final_outcome IN ('completed', 'failed', 'cancelled', 'timed_out')),
    admitted_at TEXT NOT NULL CHECK (length(trim(admitted_at)) > 0),
    provider_invocation_started_at TEXT, settled_at TEXT,
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    UNIQUE (run_id, checkpoint_fingerprint), UNIQUE (decision_request_fingerprint),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (run_id) REFERENCES autonomy_runs(run_id) ON DELETE CASCADE,
    FOREIGN KEY (attachment_id) REFERENCES vnext_repository_execution_attachments(attachment_id) ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (checkpoint_fingerprint) REFERENCES vnext_repository_run_resume_checkpoints(checkpoint_fingerprint) ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (decision_request_fingerprint) REFERENCES vnext_repository_execution_decision_requests(request_fingerprint) ON UPDATE RESTRICT ON DELETE RESTRICT
  );
  CREATE INDEX IF NOT EXISTS idx_vnext_repository_managed_resume_attempts_run
    ON vnext_repository_managed_resume_attempts(workspace_id, project_id, run_id, admitted_at DESC, attempt_fingerprint);
  CREATE TABLE IF NOT EXISTS vnext_repository_managed_resume_runtime_claims (
    attempt_fingerprint TEXT PRIMARY KEY,
    claim_version TEXT NOT NULL CHECK (claim_version = 'repository_managed_resume_runtime_claim.v0.1'),
    runtime_instance_fingerprint TEXT NOT NULL CHECK (length(runtime_instance_fingerprint) = 71),
    runtime_generation_fingerprint TEXT NOT NULL CHECK (length(runtime_generation_fingerprint) = 71),
    claim_revision INTEGER NOT NULL CHECK (claim_revision BETWEEN 1 AND 16),
    claim_lifecycle TEXT NOT NULL CHECK (claim_lifecycle IN ('claimed', 'invocation_started', 'released', 'cancelled')),
    claimed_at TEXT NOT NULL CHECK (length(trim(claimed_at)) > 0),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    FOREIGN KEY (attempt_fingerprint) REFERENCES vnext_repository_managed_resume_attempts(attempt_fingerprint) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS vnext_repository_managed_resume_runtime_claim_history (
    attempt_fingerprint TEXT NOT NULL,
    claim_revision INTEGER NOT NULL CHECK (claim_revision BETWEEN 1 AND 16),
    claim_version TEXT NOT NULL CHECK (claim_version = 'repository_managed_resume_runtime_claim.v0.1'),
    runtime_instance_fingerprint TEXT NOT NULL CHECK (length(runtime_instance_fingerprint) = 71),
    runtime_generation_fingerprint TEXT NOT NULL CHECK (length(runtime_generation_fingerprint) = 71),
    claimed_at TEXT NOT NULL CHECK (length(trim(claimed_at)) > 0),
    PRIMARY KEY (attempt_fingerprint, claim_revision),
    UNIQUE (attempt_fingerprint, runtime_instance_fingerprint, runtime_generation_fingerprint),
    FOREIGN KEY (attempt_fingerprint) REFERENCES vnext_repository_managed_resume_attempts(attempt_fingerprint) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS vnext_repository_managed_resume_cancellations (
    attempt_fingerprint TEXT PRIMARY KEY,
    cancellation_version TEXT NOT NULL CHECK (cancellation_version = 'repository_managed_resume_cancellation.v0.1'),
    workspace_id TEXT NOT NULL, project_id TEXT NOT NULL, run_id TEXT NOT NULL,
    attachment_id TEXT NOT NULL,
    controller_generation INTEGER NOT NULL CHECK (controller_generation >= 1),
    cancellation_requested_at TEXT NOT NULL CHECK (length(trim(cancellation_requested_at)) > 0),
    cancellation_control_revision INTEGER NOT NULL CHECK (cancellation_control_revision >= 1),
    provider_stop_confirmed INTEGER NOT NULL CHECK (provider_stop_confirmed IN (0, 1)),
    resume_reacquisition_forbidden INTEGER NOT NULL CHECK (resume_reacquisition_forbidden = 1),
    cancellation_signal_sent INTEGER NOT NULL CHECK (cancellation_signal_sent IN (0, 1)),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    FOREIGN KEY (attempt_fingerprint) REFERENCES vnext_repository_managed_resume_attempts(attempt_fingerprint) ON DELETE CASCADE,
    FOREIGN KEY (run_id) REFERENCES autonomy_runs(run_id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS vnext_repository_root_rebind_receipts (
    request_fingerprint TEXT PRIMARY KEY CHECK (length(request_fingerprint) = 71),
    workspace_id TEXT NOT NULL, project_id TEXT NOT NULL,
    old_root_binding_fingerprint TEXT NOT NULL CHECK (length(old_root_binding_fingerprint) = 71),
    old_baseline_fingerprint TEXT CHECK (old_baseline_fingerprint IS NULL OR length(old_baseline_fingerprint) = 71),
    new_root_binding_fingerprint TEXT NOT NULL CHECK (length(new_root_binding_fingerprint) = 71),
    new_baseline_fingerprint TEXT NOT NULL CHECK (length(new_baseline_fingerprint) = 71),
    recorded_at TEXT NOT NULL CHECK (length(trim(recorded_at)) > 0),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_vnext_repository_root_rebind_receipts_project
    ON vnext_repository_root_rebind_receipts(workspace_id, project_id, recorded_at);
  CREATE TABLE IF NOT EXISTS vnext_repository_execution_decision_requests (
    request_fingerprint TEXT PRIMARY KEY CHECK (length(request_fingerprint) = 71 AND substr(request_fingerprint, 1, 7) = 'sha256:'),
    decision_request_version TEXT NOT NULL CHECK (decision_request_version = 'repository_execution_decision_request.v0.1'),
    action TEXT NOT NULL CHECK (action IN ('adopt_legacy_baseline', 'rebind_root', 'revoke_attachment', 'start_repository_managed_delegation', 'resume_repository_managed_delegation')),
    workspace_id TEXT NOT NULL, project_id TEXT NOT NULL,
    expected_state_fingerprint TEXT NOT NULL CHECK (length(expected_state_fingerprint) = 71),
    expected_state_json TEXT NOT NULL CHECK (json_valid(expected_state_json) AND json_type(expected_state_json) = 'object'),
    requested_at TEXT NOT NULL CHECK (length(trim(requested_at)) > 0),
    expires_at TEXT NOT NULL CHECK (length(trim(expires_at)) > 0),
    status TEXT NOT NULL CHECK (status IN ('pending', 'granted', 'consumed', 'expired', 'superseded')),
    grant_fingerprint TEXT UNIQUE CHECK (grant_fingerprint IS NULL OR length(grant_fingerprint) = 71),
    confirmation_source TEXT CHECK (confirmation_source IS NULL OR confirmation_source = 'browser_same_origin_button'),
    granted_at TEXT, consumed_at TEXT,
    result_fingerprint TEXT CHECK (result_fingerprint IS NULL OR length(result_fingerprint) = 71),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_vnext_repository_execution_decisions_project
    ON vnext_repository_execution_decision_requests(workspace_id, project_id, status, requested_at DESC);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_repository_execution_one_open_decision
    ON vnext_repository_execution_decision_requests(workspace_id, project_id, action)
    WHERE status IN ('pending', 'granted');
`;

export function migrateVNextRepositoryExecutionStoreV01(db) {
  const tableNames = [
    "vnext_physical_root_baselines",
    "vnext_repository_execution_attachments",
    "vnext_repository_run_resume_checkpoints",
    "vnext_repository_managed_resume_attempts",
    "vnext_repository_managed_resume_runtime_claims",
    "vnext_repository_managed_resume_runtime_claim_history",
    "vnext_repository_managed_resume_cancellations",
    "vnext_repository_root_rebind_receipts",
    "vnext_repository_execution_decision_requests",
  ];
  const indexNames = [
    "idx_vnext_physical_root_baselines_project",
    "idx_vnext_physical_root_baselines_object",
    "idx_vnext_repository_execution_attachments_project",
    "idx_vnext_repository_execution_one_prepared",
    "idx_vnext_repository_execution_consumed_run",
    "idx_vnext_repository_resume_checkpoint_operation",
    "idx_vnext_repository_resume_checkpoint_current",
    "idx_vnext_repository_managed_resume_attempts_run",
    "idx_vnext_repository_root_rebind_receipts_project",
    "idx_vnext_repository_execution_decisions_project",
    "idx_vnext_repository_execution_one_open_decision",
  ];
  const names = [...tableNames, ...indexNames];
  const before = new Set(db.prepare(
    `SELECT type || ':' || name AS key FROM sqlite_master WHERE name IN (${names.map(() => "?").join(", ")})`,
  ).all(...names).map((row) => row.key));
  const attachmentSql = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'vnext_repository_execution_attachments'",
  ).pluck().get();
  const baselineSql = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'vnext_physical_root_baselines'",
  ).pluck().get();
  const decisionSql = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'vnext_repository_execution_decision_requests'",
  ).pluck().get();
  const attachmentUpgradeRequired =
    typeof attachmentSql === "string" &&
    !attachmentSql.includes("lifecycle = 'consumed' AND consumed_run_id IS NOT NULL");
  const baselineUpgradeRequired =
    typeof baselineSql === "string" &&
    !baselineSql.includes("physical_root_identity.windows.v0.1");
  const decisionUpgradeRequired =
    typeof decisionSql === "string" &&
    (!decisionSql.includes("start_repository_managed_delegation") ||
      !decisionSql.includes("resume_repository_managed_delegation"));
  if (baselineUpgradeRequired || attachmentUpgradeRequired || decisionUpgradeRequired) {
    if (
      attachmentUpgradeRequired &&
      db.prepare(
        "SELECT 1 FROM vnext_repository_execution_attachments WHERE lifecycle = 'consumed' LIMIT 1",
      ).get()
    ) {
      throw new Error("repository_execution_legacy_consumed_attachment_invalid");
    }
    db.exec("BEGIN IMMEDIATE");
    try {
      if (baselineUpgradeRequired) {
        db.exec(
          "ALTER TABLE vnext_physical_root_baselines RENAME TO vnext_physical_root_baselines_cdx2b3a",
        );
        // SQLite keeps index names when their table is renamed. Release the
        // canonical names before creating the replacement table so its
        // indexes cannot be skipped and then disappear with the old table.
        db.exec("DROP INDEX IF EXISTS idx_vnext_physical_root_baselines_project");
        db.exec("DROP INDEX IF EXISTS idx_vnext_physical_root_baselines_object");
      }
      if (attachmentUpgradeRequired) {
        db.exec(
          "ALTER TABLE vnext_repository_execution_attachments RENAME TO vnext_repository_execution_attachments_cdx2b2a",
        );
      }
      if (decisionUpgradeRequired) {
        db.exec(
          "ALTER TABLE vnext_repository_execution_decision_requests RENAME TO vnext_repository_execution_decision_requests_cdx2b2a",
        );
      }
      db.exec(vNextRepositoryExecutionStoreSchemaSqlV01);
      if (baselineUpgradeRequired) {
        db.exec(`INSERT INTO vnext_physical_root_baselines (
          workspace_id, project_id, node_scope_fingerprint, baseline_version,
          root_binding_fingerprint, identity_version, identity_platform,
          canonical_realpath_fingerprint, canonical_final_path_fingerprint,
          supported_filesystem_family, filesystem_volume_identity,
          filesystem_object_identity, observed_at, provenance,
          baseline_fingerprint
        ) SELECT
          workspace_id, project_id, node_scope_fingerprint, baseline_version,
          root_binding_fingerprint, identity_version, NULL,
          canonical_realpath_fingerprint, NULL, NULL,
          filesystem_volume_identity, filesystem_object_identity, observed_at,
          provenance, baseline_fingerprint
        FROM vnext_physical_root_baselines_cdx2b3a`);
        db.exec("DROP TABLE vnext_physical_root_baselines_cdx2b3a");
      }
      if (attachmentUpgradeRequired) {
        db.exec(`INSERT INTO vnext_repository_execution_attachments (
          attachment_id, attachment_version, workspace_id, project_id,
          node_scope_fingerprint, physical_root_baseline_fingerprint,
          root_binding_fingerprint, task_context_packet_id,
          task_context_packet_fingerprint, current_work_fingerprint,
          project_execution_admission_fingerprint, worktree_observation_fingerprint,
          managed_run_state_fingerprint, binding_fingerprint, prepared_at,
          freshness_policy_json, lifecycle, stale_reason, lifecycle_updated_at,
          consumed_run_id
        ) SELECT
          attachment_id, attachment_version, workspace_id, project_id,
          node_scope_fingerprint, physical_root_baseline_fingerprint,
          root_binding_fingerprint, task_context_packet_id,
          task_context_packet_fingerprint, current_work_fingerprint,
          project_execution_admission_fingerprint, worktree_observation_fingerprint,
          managed_run_state_fingerprint, binding_fingerprint, prepared_at,
          freshness_policy_json, lifecycle, stale_reason, lifecycle_updated_at,
          NULL
        FROM vnext_repository_execution_attachments_cdx2b2a`);
        db.exec("DROP TABLE vnext_repository_execution_attachments_cdx2b2a");
      }
      if (decisionUpgradeRequired) {
        db.exec(`INSERT INTO vnext_repository_execution_decision_requests (
          request_fingerprint, decision_request_version, action, workspace_id,
          project_id, expected_state_fingerprint, expected_state_json,
          requested_at, expires_at, status, grant_fingerprint,
          confirmation_source, granted_at, consumed_at, result_fingerprint
        ) SELECT
          request_fingerprint, decision_request_version, action, workspace_id,
          project_id, expected_state_fingerprint, expected_state_json,
          requested_at, expires_at, status, grant_fingerprint,
          confirmation_source, granted_at, consumed_at, result_fingerprint
        FROM vnext_repository_execution_decision_requests_cdx2b2a`);
        db.exec("DROP TABLE vnext_repository_execution_decision_requests_cdx2b2a");
      }
      // Renaming the prior tables carries their index names with them. The
      // drops above release those names; a second schema pass recreates every
      // canonical index against the upgraded tables.
      db.exec(vNextRepositoryExecutionStoreSchemaSqlV01);
      db.exec("COMMIT");
    } catch (error) {
      if (db.inTransaction) db.exec("ROLLBACK");
      throw error;
    }
  }
  db.exec(vNextRepositoryExecutionStoreSchemaSqlV01);
  return {
    created_tables: tableNames.filter((name) => !before.has(`table:${name}`)),
    created_indexes: indexNames.filter((name) => !before.has(`index:${name}`)),
  };
}

export const vNextProjectLifecycleSchemaSqlV01 = `
  CREATE TABLE IF NOT EXISTS vnext_recent_projects (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    recent_project_entry_version TEXT NOT NULL CHECK (recent_project_entry_version = 'recent_project_entry.v0.1'),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    last_opened_at TEXT NOT NULL CHECK (length(trim(last_opened_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE RESTRICT
  );
  CREATE INDEX IF NOT EXISTS idx_vnext_recent_projects_workspace_opened
    ON vnext_recent_projects(workspace_id, last_opened_at DESC, project_id);
  ${projectSelectionSchemaSqlV02}
  ${projectOrganizationSchemaSqlV01}
`;

export function migrateVNextProjectLifecycleV01(db) {
  const names = ["vnext_recent_projects", "vnext_active_project_selections", "vnext_project_organization", "idx_vnext_recent_projects_workspace_opened"];
  const before = new Set(db.prepare(`SELECT type || ':' || name AS key FROM sqlite_master WHERE name IN (?, ?, ?, ?)`)
    .all(...names).map((row) => row.key));
  migrateProjectSelectionV02(db);
  migrateProjectOrganizationV01(db);
  db.exec(vNextProjectLifecycleSchemaSqlV01);
  return {
    created_tables: names.slice(0, 3).filter((name) => !before.has(`table:${name}`)),
    created_indexes: names.slice(3).filter((name) => !before.has(`index:${name}`)),
  };
}

export const vNextProjectControlSchemaSqlV01 = `
  CREATE TABLE IF NOT EXISTS vnext_project_automation_controls (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    control_version TEXT NOT NULL CHECK (control_version = 'project_automation_control.v0.1'),
    enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
    paused INTEGER NOT NULL CHECK (paused IN (0, 1)),
    policy_version TEXT NOT NULL CHECK (policy_version = 'project_automation_policy.v0.1'),
    policy_json TEXT NOT NULL CHECK (json_valid(policy_json) AND json_type(policy_json) = 'object'),
    revision INTEGER NOT NULL CHECK (revision > 0),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CHECK (paused = 0 OR enabled = 1)
  );
  CREATE TABLE IF NOT EXISTS vnext_project_personal_perspective_scopes (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    scope_version TEXT NOT NULL CHECK (scope_version = 'personal_perspective_project_scope.v0.1'),
    selection TEXT NOT NULL CHECK (selection IN ('included', 'excluded')),
    revision INTEGER NOT NULL CHECK (revision > 0),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id, project_id) REFERENCES vnext_project_identities(workspace_id, project_id) ON UPDATE RESTRICT ON DELETE RESTRICT
  );
`;

export function migrateVNextProjectControlsV01(db) {
  const names = [
    "vnext_project_automation_controls",
    "vnext_project_personal_perspective_scopes",
  ];
  const before = new Set(
    db
      .prepare(
        `SELECT type || ':' || name AS key FROM sqlite_master WHERE name IN (?, ?)`,
      )
      .all(...names)
      .map((row) => row.key),
  );
  db.exec(vNextProjectControlSchemaSqlV01);
  return {
    created_tables: names.filter((name) => !before.has(`table:${name}`)),
    created_indexes: [],
  };
}

export const vNextProjectContinuityPinSchemaSqlV01 = `
  CREATE TABLE IF NOT EXISTS vnext_project_continuity_pin_collections (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    collection_version TEXT NOT NULL CHECK (
      collection_version = 'project_continuity_pin_collection.v0.1'
    ),
    revision INTEGER NOT NULL CHECK (revision > 0),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS vnext_project_continuity_pins (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    target_key TEXT NOT NULL CHECK (
      length(target_key) = 71 AND substr(target_key, 1, 7) = 'sha256:'
    ),
    target_ref_json TEXT NOT NULL CHECK (
      json_valid(target_ref_json) AND json_type(target_ref_json) = 'object'
    ),
    source_family_snapshot TEXT NOT NULL CHECK (
      source_family_snapshot IN (
        'project_lifecycle',
        'delegated_work',
        'current_run',
        'saved_result',
        'project_attention',
        'recent_change',
        'continuation'
      )
    ),
    source_item_id_snapshot TEXT NOT NULL CHECK (
      length(trim(source_item_id_snapshot)) > 0 AND
      length(source_item_id_snapshot) <= 512
    ),
    label_snapshot TEXT NOT NULL CHECK (
      length(trim(label_snapshot)) > 0 AND length(label_snapshot) <= 1024
    ),
    state_snapshot TEXT NOT NULL CHECK (
      length(trim(state_snapshot)) > 0 AND length(state_snapshot) <= 1024
    ),
    sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
    pinned_at TEXT NOT NULL CHECK (length(trim(pinned_at)) > 0),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    PRIMARY KEY (workspace_id, project_id, target_key),
    UNIQUE (workspace_id, project_id, sort_order),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_continuity_pin_collections(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_project_continuity_pins_project_order
    ON vnext_project_continuity_pins(
      workspace_id, project_id, sort_order, target_key
    );
`;

export function migrateVNextProjectContinuityPinsV01(db) {
  const names = [
    "vnext_project_continuity_pin_collections",
    "vnext_project_continuity_pins",
    "idx_vnext_project_continuity_pins_project_order",
  ];
  const before = new Set(
    db
      .prepare(
        `SELECT type || ':' || name AS key FROM sqlite_master
         WHERE name IN (?, ?, ?)`,
      )
      .all(...names)
      .map((row) => row.key),
  );
  db.exec(vNextProjectContinuityPinSchemaSqlV01);
  return {
    created_tables: names
      .slice(0, 2)
      .filter((name) => !before.has(`table:${name}`)),
    created_indexes: names
      .slice(2)
      .filter((name) => !before.has(`index:${name}`)),
  };
}

export const vNextDurableSemanticStoreSchemaSqlV01 = `
  CREATE TABLE IF NOT EXISTS vnext_core_records (
    record_kind TEXT NOT NULL CHECK (record_kind IN (
      'automation_work_item',
      'capability_grant',
      'evidence_record',
      'claim_record',
      'claim_evidence_relation',
      'episode_delta_proposal',
      'review_decision',
      'semantic_commit_gate',
      'semantic_state',
      'state_transition_receipt',
      'task_context_packet',
      'run_receipt',
      'context_use_review',
      'operational_continuation_admission',
          'work_expectation_record'
    )),
    record_id TEXT NOT NULL CHECK (length(trim(record_id)) > 0),
    workspace_id TEXT NOT NULL CHECK (length(trim(workspace_id)) > 0),
    project_id TEXT NOT NULL CHECK (length(trim(project_id)) > 0),
    fingerprint TEXT NOT NULL CHECK (
      length(fingerprint) = 71 AND substr(fingerprint, 1, 7) = 'sha256:'
    ),
    idempotency_key TEXT CHECK (
      idempotency_key IS NULL OR
      (length(idempotency_key) = 71 AND substr(idempotency_key, 1, 7) = 'sha256:')
    ),
    payload_json TEXT NOT NULL CHECK (
      json_valid(payload_json) AND json_type(payload_json) = 'object'
    ),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    PRIMARY KEY (record_kind, record_id)
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_core_records_project_idempotency
    ON vnext_core_records(workspace_id, project_id, record_kind, idempotency_key)
    WHERE idempotency_key IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_vnext_core_records_project_kind_created
    ON vnext_core_records(workspace_id, project_id, record_kind, created_at, record_id);

  CREATE TRIGGER IF NOT EXISTS trg_vnext_core_records_immutable_update
    BEFORE UPDATE ON vnext_core_records
    BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END;
  CREATE TRIGGER IF NOT EXISTS trg_vnext_core_records_immutable_delete
    BEFORE DELETE ON vnext_core_records
    BEGIN SELECT RAISE(ABORT, 'vnext_core_records_immutable'); END;

  CREATE TABLE IF NOT EXISTS vnext_semantic_state_entries (
    workspace_id TEXT NOT NULL CHECK (length(trim(workspace_id)) > 0),
    project_id TEXT NOT NULL CHECK (length(trim(project_id)) > 0),
    presence TEXT NOT NULL CHECK (presence = 'present'),
    target_key TEXT NOT NULL CHECK (
      length(target_key) = 71 AND substr(target_key, 1, 7) = 'sha256:'
    ),
    target_ref_json TEXT NOT NULL CHECK (
      json_valid(target_ref_json) AND json_type(target_ref_json) = 'object'
    ),
    state_ref_json TEXT NOT NULL CHECK (
      json_valid(state_ref_json) AND json_type(state_ref_json) = 'object'
    ),
    current_state_fingerprint TEXT NOT NULL CHECK (
      length(current_state_fingerprint) = 71 AND substr(current_state_fingerprint, 1, 7) = 'sha256:'
    ),
    bounded_state_summary TEXT NOT NULL CHECK (
      length(bounded_state_summary) > 0 AND length(bounded_state_summary) <= 2000
    ),
    source_proposal_id TEXT NOT NULL,
    source_proposal_fingerprint TEXT NOT NULL CHECK (
      length(source_proposal_fingerprint) = 71 AND substr(source_proposal_fingerprint, 1, 7) = 'sha256:'
    ),
    source_candidate_id TEXT NOT NULL,
    source_candidate_fingerprint TEXT NOT NULL CHECK (
      length(source_candidate_fingerprint) = 71 AND substr(source_candidate_fingerprint, 1, 7) = 'sha256:'
    ),
    source_transition_receipt_id TEXT NOT NULL,
    source_transition_receipt_fingerprint TEXT NOT NULL CHECK (
      length(source_transition_receipt_fingerprint) = 71 AND substr(source_transition_receipt_fingerprint, 1, 7) = 'sha256:'
    ),
    revision INTEGER NOT NULL CHECK (revision >= 1),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    PRIMARY KEY (workspace_id, project_id, target_key)
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_semantic_state_entries_project_updated
    ON vnext_semantic_state_entries(workspace_id, project_id, updated_at, target_key);

  CREATE TABLE IF NOT EXISTS vnext_semantic_target_heads (
    workspace_id TEXT NOT NULL CHECK (length(trim(workspace_id)) > 0),
    project_id TEXT NOT NULL CHECK (length(trim(project_id)) > 0),
    target_key TEXT NOT NULL CHECK (
      length(target_key) = 71 AND substr(target_key, 1, 7) = 'sha256:'
    ),
    revision INTEGER NOT NULL CHECK (revision >= 1),
    presence TEXT NOT NULL CHECK (presence IN ('absent', 'present')),
    current_state_fingerprint TEXT,
    source_transition_receipt_id TEXT NOT NULL CHECK (
      length(trim(source_transition_receipt_id)) > 0
    ),
    source_transition_receipt_fingerprint TEXT NOT NULL CHECK (
      length(source_transition_receipt_fingerprint) = 71 AND
      substr(source_transition_receipt_fingerprint, 1, 7) = 'sha256:'
    ),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    CHECK (
      (presence = 'absent' AND current_state_fingerprint IS NULL) OR
      (presence = 'present' AND current_state_fingerprint IS NOT NULL AND
       length(current_state_fingerprint) = 71 AND
       substr(current_state_fingerprint, 1, 7) = 'sha256:')
    ),
    PRIMARY KEY (workspace_id, project_id, target_key)
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_semantic_target_heads_project_updated
    ON vnext_semantic_target_heads(workspace_id, project_id, updated_at, target_key);
`;

const vNextDurableSemanticStoreArtifactsV01 = {
  tables: [
    "vnext_core_records",
    "vnext_semantic_state_entries",
    "vnext_semantic_target_heads",
  ],
  indexes: [
    "idx_vnext_core_records_project_idempotency",
    "idx_vnext_core_records_project_kind_created",
    "idx_vnext_semantic_state_entries_project_updated",
    "idx_vnext_semantic_target_heads_project_updated",
  ],
  triggers: [
    "trg_vnext_core_records_immutable_update",
    "trg_vnext_core_records_immutable_delete",
  ],
};

const vNextCoreRecordKindsV01 = [
  "automation_work_item",
  "capability_grant",
  "evidence_record",
  "claim_record",
  "claim_evidence_relation",
  "episode_delta_proposal",
  "review_decision",
  "semantic_commit_gate",
  "semantic_state",
  "state_transition_receipt",
  "task_context_packet",
  "run_receipt",
  "context_use_review",
  "operational_continuation_admission",
  "work_expectation_record",
];

const vNextCoreRecordsUpgradeTableV02 =
  "vnext_core_records_upgrade_v0_2";
const vNextCoreRecordsUpgradeTableV03 =
  "vnext_core_records_upgrade_v0_3";
const vNextCoreRecordsUpgradeTableV04 =
  "vnext_core_records_upgrade_v0_4";

function upgradeVNextCoreRecordKindConstraintV01(db) {
  const table = db
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'vnext_core_records'",
    )
    .get();
  if (
    db
      .prepare(
        `SELECT 1 FROM sqlite_master
         WHERE type = 'table' AND name IN (?, ?, ?)`,
      )
      .get(
        vNextCoreRecordsUpgradeTableV02,
        vNextCoreRecordsUpgradeTableV03,
        vNextCoreRecordsUpgradeTableV04,
      )
  ) {
    throw new Error("vnext_core_record_kind_upgrade_orphan_table");
  }
  const tableSql = table?.sql;
  if (
    !table ||
    (typeof tableSql === "string" &&
      vNextCoreRecordKindsV01.every((kind) =>
        tableSql.includes(`'${kind}'`),
      ))
  ) {
    return false;
  }
  if (db.inTransaction) {
    throw new Error("vnext_core_record_kind_upgrade_nested_transaction_forbidden");
  }
  const before = db
    .prepare("SELECT COUNT(*) AS count FROM vnext_core_records")
    .get();
  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec(`
      CREATE TABLE ${vNextCoreRecordsUpgradeTableV04} (
        record_kind TEXT NOT NULL CHECK (record_kind IN (
          'automation_work_item',
          'capability_grant',
          'evidence_record',
          'claim_record',
          'claim_evidence_relation',
          'episode_delta_proposal',
          'review_decision',
          'semantic_commit_gate',
          'semantic_state',
          'state_transition_receipt',
          'task_context_packet',
          'run_receipt',
          'context_use_review',
          'operational_continuation_admission',
          'work_expectation_record'
        )),
        record_id TEXT NOT NULL CHECK (length(trim(record_id)) > 0),
        workspace_id TEXT NOT NULL CHECK (length(trim(workspace_id)) > 0),
        project_id TEXT NOT NULL CHECK (length(trim(project_id)) > 0),
        fingerprint TEXT NOT NULL CHECK (
          length(fingerprint) = 71 AND substr(fingerprint, 1, 7) = 'sha256:'
        ),
        idempotency_key TEXT CHECK (
          idempotency_key IS NULL OR
          (length(idempotency_key) = 71 AND substr(idempotency_key, 1, 7) = 'sha256:')
        ),
        payload_json TEXT NOT NULL CHECK (
          json_valid(payload_json) AND json_type(payload_json) = 'object'
        ),
        created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
        PRIMARY KEY (record_kind, record_id)
      );
      INSERT INTO ${vNextCoreRecordsUpgradeTableV04} (
        record_kind, record_id, workspace_id, project_id, fingerprint,
        idempotency_key, payload_json, created_at
      )
      SELECT
        record_kind, record_id, workspace_id, project_id, fingerprint,
        idempotency_key, payload_json, created_at
      FROM vnext_core_records;
    `);
    const copied = db
      .prepare(
        `SELECT COUNT(*) AS count FROM ${vNextCoreRecordsUpgradeTableV04}`,
      )
      .get();
    if (copied.count !== before.count) {
      throw new Error("vnext_core_record_kind_upgrade_copy_count_mismatch");
    }
    db.exec(`
      DROP TRIGGER IF EXISTS trg_vnext_core_records_immutable_update;
      DROP TRIGGER IF EXISTS trg_vnext_core_records_immutable_delete;
      DROP TABLE vnext_core_records;
    `);
    db.exec(vNextDurableSemanticStoreSchemaSqlV01);
    db.exec(`
      INSERT INTO vnext_core_records (
        record_kind, record_id, workspace_id, project_id, fingerprint,
        idempotency_key, payload_json, created_at
      )
      SELECT
        record_kind, record_id, workspace_id, project_id, fingerprint,
        idempotency_key, payload_json, created_at
      FROM ${vNextCoreRecordsUpgradeTableV04};
      DROP TABLE ${vNextCoreRecordsUpgradeTableV04};
    `);
    const restored = db
      .prepare("SELECT COUNT(*) AS count FROM vnext_core_records")
      .get();
    if (restored.count !== before.count) {
      throw new Error("vnext_core_record_kind_upgrade_restore_count_mismatch");
    }
    db.exec("COMMIT");
    return true;
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

export function migrateVNextDurableSemanticStoreV01(db) {
  const before = new Set(
    db
      .prepare(
        `SELECT type || ':' || name AS key
         FROM sqlite_master
         WHERE name IN (${Object.values(vNextDurableSemanticStoreArtifactsV01)
           .flat()
           .map(() => "?")
           .join(", ")})`,
      )
      .all(...Object.values(vNextDurableSemanticStoreArtifactsV01).flat())
      .map((row) => row.key),
  );

  const rebuiltCoreRecords = upgradeVNextCoreRecordKindConstraintV01(db);
  db.exec(vNextDurableSemanticStoreSchemaSqlV01);

  const created = (type, names) =>
    names.filter((name) => !before.has(`${type}:${name}`));
  return {
    created_tables: created("table", vNextDurableSemanticStoreArtifactsV01.tables),
    created_indexes: created("index", vNextDurableSemanticStoreArtifactsV01.indexes),
    created_triggers: created("trigger", vNextDurableSemanticStoreArtifactsV01.triggers),
    rebuilt_tables: rebuiltCoreRecords ? ["vnext_core_records"] : [],
  };
}

export const vNextLocalOperatorSessionSchemaSqlV01 = `
  CREATE TABLE IF NOT EXISTS vnext_local_operator_sessions (
    session_id TEXT PRIMARY KEY CHECK (
      length(trim(session_id)) > 0 AND length(session_id) <= 256
    ),
    workspace_id TEXT NOT NULL CHECK (
      length(trim(workspace_id)) > 0 AND length(workspace_id) <= 256
    ),
    project_id TEXT NOT NULL CHECK (
      length(trim(project_id)) > 0 AND length(project_id) <= 256
    ),
    operator_id TEXT NOT NULL CHECK (
      length(trim(operator_id)) > 0 AND length(operator_id) <= 256
    ),
    bootstrap_token_hash TEXT NOT NULL UNIQUE CHECK (
      length(bootstrap_token_hash) = 71 AND
      substr(bootstrap_token_hash, 1, 7) = 'sha256:'
    ),
    session_token_hash TEXT UNIQUE CHECK (
      session_token_hash IS NULL OR
      (length(session_token_hash) = 71 AND
       substr(session_token_hash, 1, 7) = 'sha256:')
    ),
    issued_at TEXT NOT NULL CHECK (length(trim(issued_at)) > 0),
    expires_at TEXT NOT NULL CHECK (length(trim(expires_at)) > 0),
    bootstrap_consumed_at TEXT,
    revoked_at TEXT,
    action_nonce_hash TEXT UNIQUE CHECK (
      action_nonce_hash IS NULL OR
      (length(action_nonce_hash) = 71 AND
       substr(action_nonce_hash, 1, 7) = 'sha256:')
    ),
    action_nonce_expires_at TEXT,
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    decision_session_token_hash TEXT CHECK (
      decision_session_token_hash IS NULL OR
      (length(decision_session_token_hash) = 71 AND
       substr(decision_session_token_hash, 1, 7) = 'sha256:')
    ),
    decision_action_nonce_hash TEXT CHECK (
      decision_action_nonce_hash IS NULL OR
      (length(decision_action_nonce_hash) = 71 AND
       substr(decision_action_nonce_hash, 1, 7) = 'sha256:')
    ),
    decision_action_nonce_expires_at TEXT,
    CHECK (
      (bootstrap_consumed_at IS NULL AND
       session_token_hash IS NULL AND
       action_nonce_hash IS NULL AND
       action_nonce_expires_at IS NULL) OR
      (bootstrap_consumed_at IS NOT NULL AND
       session_token_hash IS NOT NULL AND
       action_nonce_hash IS NOT NULL AND
       action_nonce_expires_at IS NOT NULL)
    )
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_local_operator_sessions_scope_expiry
    ON vnext_local_operator_sessions(
      workspace_id, project_id, operator_id, revoked_at, expires_at, session_id
    );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_local_operator_sessions_decision_token
    ON vnext_local_operator_sessions(decision_session_token_hash)
    WHERE decision_session_token_hash IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_local_operator_sessions_decision_nonce
    ON vnext_local_operator_sessions(decision_action_nonce_hash)
    WHERE decision_action_nonce_hash IS NOT NULL;
`;

const vNextLocalOperatorSessionArtifactsV01 = {
  tables: ["vnext_local_operator_sessions"],
  indexes: [
    "idx_vnext_local_operator_sessions_scope_expiry",
    "idx_vnext_local_operator_sessions_decision_token",
    "idx_vnext_local_operator_sessions_decision_nonce",
  ],
};

export function migrateVNextLocalOperatorSessionsV01(db) {
  const tableExists = db.prepare(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'vnext_local_operator_sessions'",
  ).get();
  if (tableExists) {
    const columns = new Set(
      db.prepare("PRAGMA table_info(vnext_local_operator_sessions)")
        .all()
        .map((row) => row.name),
    );
    for (const [name, definition] of [
      ["decision_session_token_hash", "TEXT CHECK (decision_session_token_hash IS NULL OR (length(decision_session_token_hash) = 71 AND substr(decision_session_token_hash, 1, 7) = 'sha256:'))"],
      ["decision_action_nonce_hash", "TEXT CHECK (decision_action_nonce_hash IS NULL OR (length(decision_action_nonce_hash) = 71 AND substr(decision_action_nonce_hash, 1, 7) = 'sha256:'))"],
      ["decision_action_nonce_expires_at", "TEXT"],
    ]) {
      if (!columns.has(name)) {
        db.prepare(
          `ALTER TABLE vnext_local_operator_sessions ADD COLUMN ${name} ${definition}`,
        ).run();
      }
    }
  }
  const names = Object.values(vNextLocalOperatorSessionArtifactsV01).flat();
  const before = new Set(
    db
      .prepare(
        `SELECT type || ':' || name AS key
         FROM sqlite_master
         WHERE name IN (${names.map(() => "?").join(", ")})`,
      )
      .all(...names)
      .map((row) => row.key),
  );
  db.exec(vNextLocalOperatorSessionSchemaSqlV01);
  const created = (type, artifactNames) =>
    artifactNames.filter((name) => !before.has(`${type}:${name}`));
  return {
    created_tables: created(
      "table",
      vNextLocalOperatorSessionArtifactsV01.tables,
    ),
    created_indexes: created(
      "index",
      vNextLocalOperatorSessionArtifactsV01.indexes,
    ),
  };
}

export function prepareNativeProductMigrations(db) {
  const vNextDurableSemanticStoreResult = migrateVNextDurableSemanticStoreV01(db);
  const vNextLocalOperatorSessionResult = migrateVNextLocalOperatorSessionsV01(db);
  const vNextProjectIdentityRegistryResult =
    migrateVNextProjectIdentityRegistryV01(db);
  const vNextRepositoryExecutionStoreResult =
    migrateVNextRepositoryExecutionStoreV01(db);
  const vNextProjectLifecycleResult = migrateVNextProjectLifecycleV01(db);
  const vNextProjectControlResult = migrateVNextProjectControlsV01(db);
  const vNextProjectContinuityPinResult =
    migrateVNextProjectContinuityPinsV01(db);
  return {
    vNextDurableSemanticStoreResult,
    vNextLocalOperatorSessionResult,
    vNextProjectIdentityRegistryResult,
    vNextRepositoryExecutionStoreResult,
    vNextProjectLifecycleResult,
    vNextProjectControlResult,
    vNextProjectContinuityPinResult,
  };
}
