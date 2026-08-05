import type Database from "better-sqlite3";

import type {
  PhysicalRootBaselineV01,
  RepositoryExecutionDecisionRequestV01,
  RepositoryExecutionAttachmentLifecycleV01,
  RepositoryExecutionAttachmentStaleReasonV01,
  RepositoryExecutionAttachmentV01,
} from "@/types/vnext/repository-execution";
import type { RepositoryRunResumeCheckpointV01 } from "@/types/vnext/repository-run-resume";
import type {
  RepositoryManagedResumeAttemptV01,
  RepositoryManagedResumeCancellationV01,
  RepositoryManagedResumeRuntimeClaimV01,
} from "@/types/vnext/repository-managed-resume";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";

export const VNEXT_REPOSITORY_EXECUTION_STORE_VERSION_V01 =
  "vnext_repository_execution_store.v0.1" as const;

export const VNEXT_REPOSITORY_EXECUTION_STORE_SCHEMA_SQL_V01 = `
  CREATE TABLE IF NOT EXISTS vnext_physical_root_baselines (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    node_scope_fingerprint TEXT NOT NULL CHECK (
      length(node_scope_fingerprint) = 71 AND substr(node_scope_fingerprint, 1, 7) = 'sha256:'
    ),
    baseline_version TEXT NOT NULL CHECK (baseline_version = 'physical_root_baseline.v0.1'),
    root_binding_fingerprint TEXT NOT NULL CHECK (
      length(root_binding_fingerprint) = 71 AND substr(root_binding_fingerprint, 1, 7) = 'sha256:'
    ),
    identity_version TEXT NOT NULL CHECK (identity_version IN (
      'native_host_physical_root_identity.v0.1',
      'physical_root_identity.windows.v0.1'
    )),
    identity_platform TEXT CHECK (identity_platform IS NULL OR identity_platform = 'win32'),
    canonical_realpath_fingerprint TEXT CHECK (
      canonical_realpath_fingerprint IS NULL OR
      (length(canonical_realpath_fingerprint) = 71 AND substr(canonical_realpath_fingerprint, 1, 7) = 'sha256:')
    ),
    canonical_final_path_fingerprint TEXT CHECK (
      canonical_final_path_fingerprint IS NULL OR
      (length(canonical_final_path_fingerprint) = 71 AND substr(canonical_final_path_fingerprint, 1, 7) = 'sha256:')
    ),
    supported_filesystem_family TEXT CHECK (
      supported_filesystem_family IS NULL OR supported_filesystem_family = 'NTFS'
    ),
    filesystem_volume_identity TEXT NOT NULL CHECK (length(filesystem_volume_identity) > 0),
    filesystem_object_identity TEXT NOT NULL CHECK (length(filesystem_object_identity) > 0),
    observed_at TEXT NOT NULL CHECK (length(trim(observed_at)) > 0),
    provenance TEXT NOT NULL CHECK (provenance IN (
      'canonical_new_project_onboarding',
      'explicit_legacy_adoption',
      'explicit_root_rebind'
    )),
    baseline_fingerprint TEXT NOT NULL UNIQUE CHECK (
      length(baseline_fingerprint) = 71 AND substr(baseline_fingerprint, 1, 7) = 'sha256:'
    ),
    CHECK (
      (identity_version = 'native_host_physical_root_identity.v0.1'
        AND identity_platform IS NULL
        AND canonical_realpath_fingerprint IS NOT NULL
        AND canonical_final_path_fingerprint IS NULL
        AND supported_filesystem_family IS NULL)
      OR
      (identity_version = 'physical_root_identity.windows.v0.1'
        AND identity_platform = 'win32'
        AND canonical_realpath_fingerprint IS NULL
        AND canonical_final_path_fingerprint IS NOT NULL
        AND supported_filesystem_family = 'NTFS')
    ),
    PRIMARY KEY (workspace_id, project_id, node_scope_fingerprint),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_physical_root_baselines_project
    ON vnext_physical_root_baselines(workspace_id, project_id, observed_at);

  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_physical_root_baselines_object
    ON vnext_physical_root_baselines(
      workspace_id, node_scope_fingerprint, identity_version,
      filesystem_volume_identity, filesystem_object_identity
    ) WHERE identity_version = 'physical_root_identity.windows.v0.1';

  CREATE TABLE IF NOT EXISTS vnext_repository_execution_attachments (
    attachment_id TEXT PRIMARY KEY CHECK (
      length(attachment_id) = 71 AND substr(attachment_id, 1, 7) = 'sha256:'
    ),
    attachment_version TEXT NOT NULL CHECK (
      attachment_version = 'repository_execution_attachment.v0.1'
    ),
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
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
    freshness_policy_json TEXT NOT NULL CHECK (
      json_valid(freshness_policy_json) AND json_type(freshness_policy_json) = 'object'
    ),
    lifecycle TEXT NOT NULL CHECK (lifecycle IN (
      'prepared', 'stale', 'superseded', 'revoked', 'consumed'
    )),
    stale_reason TEXT CHECK (stale_reason IS NULL OR stale_reason IN (
      'physical_root_mismatch', 'root_binding_changed', 'packet_changed',
      'current_work_changed', 'project_unavailable', 'managed_run_conflict',
      'worktree_changed', 'freshness_expired', 'explicitly_revoked', 'superseded'
    )),
    lifecycle_updated_at TEXT NOT NULL CHECK (length(trim(lifecycle_updated_at)) > 0),
    consumed_run_id TEXT,
    CHECK (
      (lifecycle = 'consumed' AND consumed_run_id IS NOT NULL AND length(trim(consumed_run_id)) > 0)
      OR (lifecycle <> 'consumed' AND consumed_run_id IS NULL)
    ),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_repository_execution_attachments_project
    ON vnext_repository_execution_attachments(
      workspace_id, project_id, lifecycle_updated_at DESC, attachment_id
    );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_repository_execution_one_prepared
    ON vnext_repository_execution_attachments(workspace_id, project_id)
    WHERE lifecycle = 'prepared';

  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_repository_execution_consumed_run
    ON vnext_repository_execution_attachments(consumed_run_id)
    WHERE consumed_run_id IS NOT NULL;

  CREATE TABLE IF NOT EXISTS vnext_repository_run_resume_checkpoints (
    checkpoint_fingerprint TEXT PRIMARY KEY CHECK (
      length(checkpoint_fingerprint) = 71 AND substr(checkpoint_fingerprint, 1, 7) = 'sha256:'
    ),
    checkpoint_version TEXT NOT NULL CHECK (
      checkpoint_version = 'repository_run_resume_checkpoint.v0.1'
    ),
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    run_id TEXT NOT NULL,
    invocation_origin TEXT NOT NULL CHECK (invocation_origin = 'repository_attachment'),
    attachment_id TEXT NOT NULL,
    attachment_binding_fingerprint TEXT NOT NULL CHECK (length(attachment_binding_fingerprint) = 71),
    node_scope_fingerprint TEXT NOT NULL CHECK (length(node_scope_fingerprint) = 71),
    execution_envelope_version TEXT NOT NULL CHECK (
      execution_envelope_version = 'repository_execution_envelope.v0.1'
    ),
    execution_envelope_fingerprint TEXT NOT NULL CHECK (length(execution_envelope_fingerprint) = 71),
    adapter_version TEXT NOT NULL CHECK (length(adapter_version) BETWEEN 1 AND 160),
    capability_version TEXT NOT NULL CHECK (length(capability_version) BETWEEN 1 AND 160),
    provider_resume_binding_version TEXT NOT NULL CHECK (
      provider_resume_binding_version = 'native_host_resume_binding.v0.1'
    ),
    provider_thread_ref_json TEXT NOT NULL CHECK (
      json_valid(provider_thread_ref_json) AND json_type(provider_thread_ref_json) = 'object'
    ),
    last_turn_ref_json TEXT NOT NULL CHECK (
      json_valid(last_turn_ref_json) AND json_type(last_turn_ref_json) = 'object'
    ),
    controller_generation INTEGER NOT NULL CHECK (controller_generation >= 1),
    runtime_instance_fingerprint TEXT NOT NULL CHECK (length(runtime_instance_fingerprint) = 71),
    runtime_generation_fingerprint TEXT NOT NULL CHECK (length(runtime_generation_fingerprint) = 71),
    run_control_revision INTEGER NOT NULL CHECK (run_control_revision >= 0),
    step_id TEXT NOT NULL CHECK (length(trim(step_id)) > 0),
    step_control_revision INTEGER NOT NULL CHECK (step_control_revision >= 0),
    event_high_water_mark INTEGER NOT NULL CHECK (event_high_water_mark >= 0),
    step_high_water_mark INTEGER NOT NULL CHECK (step_high_water_mark >= 0),
    effect_ledger_high_water_mark INTEGER NOT NULL CHECK (effect_ledger_high_water_mark >= 0),
    operation_ref TEXT NOT NULL CHECK (
      length(operation_ref) = 71 AND substr(operation_ref, 1, 7) = 'sha256:'
    ),
    operation_class TEXT NOT NULL CHECK (operation_class IN ('command_execution', 'file_change')),
    checkpoint_phase TEXT NOT NULL CHECK (checkpoint_phase IN ('declared_pre_start', 'post_operation')),
    operation_certainty TEXT NOT NULL CHECK (operation_certainty IN (
      'not_started', 'started', 'completed', 'failed', 'cancelled', 'waiting_for_approval'
    )),
    approval_ref TEXT,
    approval_state TEXT CHECK (approval_state IS NULL OR approval_state IN ('pending', 'decided', 'expired')),
    root_binding_fingerprint TEXT NOT NULL CHECK (length(root_binding_fingerprint) = 71),
    physical_root_baseline_fingerprint TEXT NOT NULL CHECK (length(physical_root_baseline_fingerprint) = 71),
    worktree_observation_fingerprint TEXT NOT NULL CHECK (length(worktree_observation_fingerprint) = 71),
    observed_at TEXT NOT NULL CHECK (length(trim(observed_at)) > 0),
    CHECK (
      (approval_ref IS NULL AND approval_state IS NULL)
      OR (approval_ref IS NOT NULL AND approval_state IS NOT NULL)
    ),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (run_id) REFERENCES autonomy_runs(run_id) ON DELETE CASCADE,
    FOREIGN KEY (attachment_id)
      REFERENCES vnext_repository_execution_attachments(attachment_id)
      ON UPDATE RESTRICT ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_repository_resume_checkpoint_operation
    ON vnext_repository_run_resume_checkpoints(
      run_id, operation_ref, checkpoint_phase
    );

  CREATE INDEX IF NOT EXISTS idx_vnext_repository_resume_checkpoint_current
    ON vnext_repository_run_resume_checkpoints(
      workspace_id, project_id, run_id,
      effect_ledger_high_water_mark DESC, event_high_water_mark DESC,
      checkpoint_fingerprint
    );

  CREATE TABLE IF NOT EXISTS vnext_repository_managed_resume_attempts (
    attempt_fingerprint TEXT PRIMARY KEY CHECK (
      length(attempt_fingerprint) = 71 AND substr(attempt_fingerprint, 1, 7) = 'sha256:'
    ),
    attempt_version TEXT NOT NULL CHECK (
      attempt_version = 'repository_managed_resume_attempt.v0.1'
    ),
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    run_id TEXT NOT NULL,
    attachment_id TEXT NOT NULL,
    attachment_binding_fingerprint TEXT NOT NULL CHECK (length(attachment_binding_fingerprint) = 71),
    checkpoint_fingerprint TEXT NOT NULL,
    checkpoint_version TEXT NOT NULL CHECK (checkpoint_version = 'repository_run_resume_checkpoint.v0.1'),
    prior_controller_generation INTEGER NOT NULL CHECK (prior_controller_generation >= 1),
    resumed_controller_generation INTEGER NOT NULL CHECK (
      resumed_controller_generation = prior_controller_generation + 1
    ),
    decision_request_fingerprint TEXT NOT NULL CHECK (length(decision_request_fingerprint) = 71),
    decision_grant_fingerprint TEXT NOT NULL CHECK (length(decision_grant_fingerprint) = 71),
    expected_state_fingerprint TEXT NOT NULL CHECK (length(expected_state_fingerprint) = 71),
    admitted_run_control_revision INTEGER NOT NULL CHECK (admitted_run_control_revision >= 1),
    admitted_step_control_revision INTEGER NOT NULL CHECK (admitted_step_control_revision >= 1),
    runtime_instance_fingerprint TEXT NOT NULL CHECK (length(runtime_instance_fingerprint) = 71),
    runtime_generation_fingerprint TEXT NOT NULL CHECK (length(runtime_generation_fingerprint) = 71),
    attempt_state TEXT NOT NULL CHECK (attempt_state IN (
      'admitted_not_invoked', 'provider_resume_invocation_started',
      'controller_owned', 'settled', 'reconciliation_required'
    )),
    final_outcome TEXT CHECK (final_outcome IS NULL OR final_outcome IN (
      'completed', 'failed', 'cancelled', 'timed_out'
    )),
    admitted_at TEXT NOT NULL CHECK (length(trim(admitted_at)) > 0),
    provider_invocation_started_at TEXT,
    settled_at TEXT,
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    UNIQUE (run_id, checkpoint_fingerprint),
    UNIQUE (decision_request_fingerprint),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (run_id) REFERENCES autonomy_runs(run_id) ON DELETE CASCADE,
    FOREIGN KEY (attachment_id)
      REFERENCES vnext_repository_execution_attachments(attachment_id)
      ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (checkpoint_fingerprint)
      REFERENCES vnext_repository_run_resume_checkpoints(checkpoint_fingerprint)
      ON UPDATE RESTRICT ON DELETE CASCADE,
    FOREIGN KEY (decision_request_fingerprint)
      REFERENCES vnext_repository_execution_decision_requests(request_fingerprint)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_repository_managed_resume_attempts_run
    ON vnext_repository_managed_resume_attempts(
      workspace_id, project_id, run_id, admitted_at DESC, attempt_fingerprint
    );

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
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    old_root_binding_fingerprint TEXT NOT NULL CHECK (length(old_root_binding_fingerprint) = 71),
    old_baseline_fingerprint TEXT CHECK (old_baseline_fingerprint IS NULL OR length(old_baseline_fingerprint) = 71),
    new_root_binding_fingerprint TEXT NOT NULL CHECK (length(new_root_binding_fingerprint) = 71),
    new_baseline_fingerprint TEXT NOT NULL CHECK (length(new_baseline_fingerprint) = 71),
    recorded_at TEXT NOT NULL CHECK (length(trim(recorded_at)) > 0),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_repository_root_rebind_receipts_project
    ON vnext_repository_root_rebind_receipts(workspace_id, project_id, recorded_at);

  CREATE TABLE IF NOT EXISTS vnext_repository_execution_decision_requests (
    request_fingerprint TEXT PRIMARY KEY CHECK (
      length(request_fingerprint) = 71 AND substr(request_fingerprint, 1, 7) = 'sha256:'
    ),
    decision_request_version TEXT NOT NULL CHECK (
      decision_request_version = 'repository_execution_decision_request.v0.1'
    ),
    action TEXT NOT NULL CHECK (action IN (
      'adopt_legacy_baseline', 'rebind_root', 'revoke_attachment',
      'start_repository_managed_delegation',
      'resume_repository_managed_delegation'
    )),
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    expected_state_fingerprint TEXT NOT NULL CHECK (length(expected_state_fingerprint) = 71),
    expected_state_json TEXT NOT NULL CHECK (
      json_valid(expected_state_json) AND json_type(expected_state_json) = 'object'
    ),
    requested_at TEXT NOT NULL CHECK (length(trim(requested_at)) > 0),
    expires_at TEXT NOT NULL CHECK (length(trim(expires_at)) > 0),
    status TEXT NOT NULL CHECK (status IN (
      'pending', 'granted', 'consumed', 'expired', 'superseded'
    )),
    grant_fingerprint TEXT UNIQUE CHECK (
      grant_fingerprint IS NULL OR length(grant_fingerprint) = 71
    ),
    confirmation_source TEXT CHECK (
      confirmation_source IS NULL OR confirmation_source = 'browser_same_origin_button'
    ),
    granted_at TEXT,
    consumed_at TEXT,
    result_fingerprint TEXT CHECK (
      result_fingerprint IS NULL OR length(result_fingerprint) = 71
    ),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_repository_execution_decisions_project
    ON vnext_repository_execution_decision_requests(
      workspace_id, project_id, status, requested_at DESC
    );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_vnext_repository_execution_one_open_decision
    ON vnext_repository_execution_decision_requests(workspace_id, project_id, action)
    WHERE status IN ('pending', 'granted');
`;

export function ensureVNextRepositoryExecutionStoreSchemaV01(
  db: Database.Database,
): void {
  db.pragma("foreign_keys = ON");
  db.exec(VNEXT_REPOSITORY_EXECUTION_STORE_SCHEMA_SQL_V01);
}

export function assertVNextRepositoryExecutionStoreSchemaV01(
  db: Database.Database,
): void {
  const artifacts = [
    ["table", "vnext_physical_root_baselines"],
    ["table", "vnext_repository_execution_attachments"],
    ["table", "vnext_repository_root_rebind_receipts"],
    ["index", "idx_vnext_physical_root_baselines_project"],
    ["index", "idx_vnext_physical_root_baselines_object"],
    ["index", "idx_vnext_repository_execution_attachments_project"],
    ["index", "idx_vnext_repository_execution_one_prepared"],
    ["index", "idx_vnext_repository_execution_consumed_run"],
    ["table", "vnext_repository_run_resume_checkpoints"],
    ["index", "idx_vnext_repository_resume_checkpoint_operation"],
    ["index", "idx_vnext_repository_resume_checkpoint_current"],
    ["table", "vnext_repository_managed_resume_attempts"],
    ["index", "idx_vnext_repository_managed_resume_attempts_run"],
    ["table", "vnext_repository_managed_resume_runtime_claims"],
    ["table", "vnext_repository_managed_resume_runtime_claim_history"],
    ["table", "vnext_repository_managed_resume_cancellations"],
    ["index", "idx_vnext_repository_root_rebind_receipts_project"],
    ["table", "vnext_repository_execution_decision_requests"],
    ["index", "idx_vnext_repository_execution_decisions_project"],
    ["index", "idx_vnext_repository_execution_one_open_decision"],
  ] as const;
  const find = db.prepare(
    "SELECT 1 FROM sqlite_master WHERE type = ? AND name = ?",
  );
  const missing = artifacts.filter(([type, name]) => !find.get(type, name));
  if (missing.length > 0) {
    throw new Error(
      `repository_execution_store_uninitialized:${missing.map(([type, name]) => `${type}:${name}`).join(",")}`,
    );
  }
}

interface PhysicalRootBaselineRowV01 {
  baseline_version: string;
  workspace_id: string;
  project_id: string;
  node_scope_fingerprint: string;
  root_binding_fingerprint: string;
  identity_version: string;
  identity_platform: string | null;
  canonical_realpath_fingerprint: string | null;
  canonical_final_path_fingerprint: string | null;
  supported_filesystem_family: string | null;
  filesystem_volume_identity: string;
  filesystem_object_identity: string;
  observed_at: string;
  provenance: PhysicalRootBaselineV01["provenance"];
  baseline_fingerprint: string;
}

function parsePhysicalRootBaselineV01(
  row: PhysicalRootBaselineRowV01,
): PhysicalRootBaselineV01 {
  const common = {
    baseline_version: row.baseline_version,
    workspace_id: row.workspace_id,
    project_id: row.project_id,
    node_scope_fingerprint: row.node_scope_fingerprint,
    root_binding_fingerprint: row.root_binding_fingerprint,
    filesystem_volume_identity: row.filesystem_volume_identity,
    filesystem_object_identity: row.filesystem_object_identity,
    observed_at: row.observed_at,
    provenance: row.provenance,
    baseline_fingerprint: row.baseline_fingerprint,
  };
  if (
    row.baseline_version !== "physical_root_baseline.v0.1" ||
    !row.identity_version
  ) {
    throw new Error("physical_root_baseline_corrupt");
  }
  if (
    row.identity_version === "native_host_physical_root_identity.v0.1" &&
    row.identity_platform === null &&
    typeof row.canonical_realpath_fingerprint === "string" &&
    row.canonical_final_path_fingerprint === null &&
    row.supported_filesystem_family === null
  ) {
    return {
      ...common,
      baseline_version: "physical_root_baseline.v0.1",
      identity_version: row.identity_version,
      canonical_realpath_fingerprint: row.canonical_realpath_fingerprint,
    };
  }
  if (
    row.identity_version === "physical_root_identity.windows.v0.1" &&
    row.identity_platform === "win32" &&
    row.canonical_realpath_fingerprint === null &&
    typeof row.canonical_final_path_fingerprint === "string" &&
    row.supported_filesystem_family === "NTFS"
  ) {
    return {
      ...common,
      baseline_version: "physical_root_baseline.v0.1",
      identity_version: row.identity_version,
      identity_platform: "win32",
      canonical_final_path_fingerprint: row.canonical_final_path_fingerprint,
      supported_filesystem_family: "NTFS",
    };
  }
  throw new Error("physical_root_baseline_corrupt");
}

export function readPhysicalRootBaselineV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string; node_scope_fingerprint: string },
): PhysicalRootBaselineV01 | null {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  const row = db.prepare(
    `SELECT * FROM vnext_physical_root_baselines
      WHERE workspace_id = ? AND project_id = ? AND node_scope_fingerprint = ?`,
  ).get(
    input.workspace_id,
    input.project_id,
    input.node_scope_fingerprint,
  ) as PhysicalRootBaselineRowV01 | undefined;
  return row ? parsePhysicalRootBaselineV01(row) : null;
}

export function readPhysicalRootBaselineByIdentityV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    node_scope_fingerprint: string;
    identity_version: PhysicalRootBaselineV01["identity_version"];
    filesystem_volume_identity: string;
    filesystem_object_identity: string;
  },
): PhysicalRootBaselineV01 | null {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  const row = db.prepare(
    `SELECT * FROM vnext_physical_root_baselines
      WHERE workspace_id = ? AND node_scope_fingerprint = ?
        AND identity_version = ? AND filesystem_volume_identity = ?
        AND filesystem_object_identity = ?`,
  ).get(
    input.workspace_id,
    input.node_scope_fingerprint,
    input.identity_version,
    input.filesystem_volume_identity,
    input.filesystem_object_identity,
  ) as PhysicalRootBaselineRowV01 | undefined;
  return row ? parsePhysicalRootBaselineV01(row) : null;
}

export function insertPhysicalRootBaselineIfAbsentInsideTransactionV01(
  db: Database.Database,
  baseline: PhysicalRootBaselineV01,
): { status: "inserted" | "exact_replay" | "conflict"; baseline: PhysicalRootBaselineV01 } {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  if (!db.inTransaction) throw new Error("physical_root_baseline_transaction_required");
  const existing = readPhysicalRootBaselineV01(db, baseline);
  if (existing?.baseline_fingerprint === baseline.baseline_fingerprint) {
    return { status: "exact_replay", baseline: existing };
  }
  if (existing) return { status: "conflict", baseline: existing };
  db.prepare(
    `INSERT INTO vnext_physical_root_baselines (
      workspace_id, project_id, node_scope_fingerprint, baseline_version,
      root_binding_fingerprint, identity_version, identity_platform,
      canonical_realpath_fingerprint, canonical_final_path_fingerprint,
      supported_filesystem_family,
      filesystem_volume_identity, filesystem_object_identity, observed_at,
      provenance, baseline_fingerprint
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    baseline.workspace_id,
    baseline.project_id,
    baseline.node_scope_fingerprint,
    baseline.baseline_version,
    baseline.root_binding_fingerprint,
    baseline.identity_version,
    baseline.identity_version === "physical_root_identity.windows.v0.1"
      ? baseline.identity_platform
      : null,
    baseline.identity_version === "native_host_physical_root_identity.v0.1"
      ? baseline.canonical_realpath_fingerprint
      : null,
    baseline.identity_version === "physical_root_identity.windows.v0.1"
      ? baseline.canonical_final_path_fingerprint
      : null,
    baseline.identity_version === "physical_root_identity.windows.v0.1"
      ? baseline.supported_filesystem_family
      : null,
    baseline.filesystem_volume_identity,
    baseline.filesystem_object_identity,
    baseline.observed_at,
    baseline.provenance,
    baseline.baseline_fingerprint,
  );
  return { status: "inserted", baseline };
}

export function replacePhysicalRootBaselineExpectedInsideTransactionV01(
  db: Database.Database,
  input: {
    baseline: PhysicalRootBaselineV01;
    expected_old_baseline_fingerprint: string;
  },
): { status: "replaced" | "exact_replay" | "conflict"; baseline: PhysicalRootBaselineV01 } {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  if (!db.inTransaction) throw new Error("physical_root_baseline_transaction_required");
  const existing = readPhysicalRootBaselineV01(db, input.baseline);
  if (existing?.baseline_fingerprint === input.baseline.baseline_fingerprint) {
    return { status: "exact_replay", baseline: existing };
  }
  if (!existing || existing.baseline_fingerprint !== input.expected_old_baseline_fingerprint) {
    return { status: "conflict", baseline: existing ?? input.baseline };
  }
  const result = db.prepare(
    `UPDATE vnext_physical_root_baselines SET
      baseline_version = ?, root_binding_fingerprint = ?, identity_version = ?,
      identity_platform = ?, canonical_realpath_fingerprint = ?,
      canonical_final_path_fingerprint = ?, supported_filesystem_family = ?,
      filesystem_volume_identity = ?, filesystem_object_identity = ?,
      observed_at = ?, provenance = ?, baseline_fingerprint = ?
     WHERE workspace_id = ? AND project_id = ? AND node_scope_fingerprint = ?
       AND baseline_fingerprint = ?`,
  ).run(
    input.baseline.baseline_version,
    input.baseline.root_binding_fingerprint,
    input.baseline.identity_version,
    input.baseline.identity_version === "physical_root_identity.windows.v0.1"
      ? input.baseline.identity_platform
      : null,
    input.baseline.identity_version === "native_host_physical_root_identity.v0.1"
      ? input.baseline.canonical_realpath_fingerprint
      : null,
    input.baseline.identity_version === "physical_root_identity.windows.v0.1"
      ? input.baseline.canonical_final_path_fingerprint
      : null,
    input.baseline.identity_version === "physical_root_identity.windows.v0.1"
      ? input.baseline.supported_filesystem_family
      : null,
    input.baseline.filesystem_volume_identity,
    input.baseline.filesystem_object_identity,
    input.baseline.observed_at,
    input.baseline.provenance,
    input.baseline.baseline_fingerprint,
    input.baseline.workspace_id,
    input.baseline.project_id,
    input.baseline.node_scope_fingerprint,
    input.expected_old_baseline_fingerprint,
  );
  return result.changes === 1
    ? { status: "replaced", baseline: input.baseline }
    : { status: "conflict", baseline: existing };
}

export function readRepositoryExecutionDecisionRequestV01(
  db: Database.Database,
  requestFingerprint: string,
): RepositoryExecutionDecisionRequestV01 | null {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  const row = db.prepare(
    "SELECT * FROM vnext_repository_execution_decision_requests WHERE request_fingerprint = ?",
  ).get(requestFingerprint) as RepositoryExecutionDecisionRequestV01 | undefined;
  return row ? { ...row } : null;
}

export function readOpenRepositoryExecutionDecisionV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string; action?: RepositoryExecutionDecisionRequestV01["action"] },
): RepositoryExecutionDecisionRequestV01 | null {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  const row = db.prepare(
    `SELECT * FROM vnext_repository_execution_decision_requests
      WHERE workspace_id = ? AND project_id = ?
        AND status IN ('pending', 'granted')
        ${input.action ? "AND action = ?" : ""}
      ORDER BY requested_at DESC, request_fingerprint DESC LIMIT 1`,
  ).get(
    input.workspace_id,
    input.project_id,
    ...(input.action ? [input.action] : []),
  ) as RepositoryExecutionDecisionRequestV01 | undefined;
  return row ? { ...row } : null;
}

export function insertRepositoryExecutionDecisionRequestInsideTransactionV01(
  db: Database.Database,
  request: RepositoryExecutionDecisionRequestV01,
): void {
  if (!db.inTransaction) throw new Error("repository_execution_decision_transaction_required");
  db.prepare(
    `INSERT INTO vnext_repository_execution_decision_requests (
      request_fingerprint, decision_request_version, action, workspace_id,
      project_id, expected_state_fingerprint, expected_state_json,
      requested_at, expires_at, status, grant_fingerprint,
      confirmation_source, granted_at, consumed_at, result_fingerprint
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    request.request_fingerprint,
    request.decision_request_version,
    request.action,
    request.workspace_id,
    request.project_id,
    request.expected_state_fingerprint,
    request.expected_state_json,
    request.requested_at,
    request.expires_at,
    request.status,
    request.grant_fingerprint,
    request.confirmation_source,
    request.granted_at,
    request.consumed_at,
    request.result_fingerprint,
  );
}

export function updateRepositoryExecutionDecisionInsideTransactionV01(
  db: Database.Database,
  input: {
    request_fingerprint: string;
    from: readonly RepositoryExecutionDecisionRequestV01["status"][];
    to: RepositoryExecutionDecisionRequestV01["status"];
    grant_fingerprint?: string | null;
    confirmation_source?: RepositoryExecutionDecisionRequestV01["confirmation_source"];
    granted_at?: string | null;
    consumed_at?: string | null;
    result_fingerprint?: string | null;
  },
): boolean {
  if (!db.inTransaction) throw new Error("repository_execution_decision_transaction_required");
  const placeholders = input.from.map(() => "?").join(", ");
  const result = db.prepare(
    `UPDATE vnext_repository_execution_decision_requests SET
       status = ?, grant_fingerprint = COALESCE(?, grant_fingerprint),
       confirmation_source = COALESCE(?, confirmation_source),
       granted_at = COALESCE(?, granted_at), consumed_at = COALESCE(?, consumed_at),
       result_fingerprint = COALESCE(?, result_fingerprint)
     WHERE request_fingerprint = ? AND status IN (${placeholders})`,
  ).run(
    input.to,
    input.grant_fingerprint ?? null,
    input.confirmation_source ?? null,
    input.granted_at ?? null,
    input.consumed_at ?? null,
    input.result_fingerprint ?? null,
    input.request_fingerprint,
    ...input.from,
  );
  return result.changes === 1;
}

export function pruneRepositoryExecutionDecisionsInsideTransactionV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string; retain: number },
): number {
  if (!db.inTransaction) throw new Error("repository_execution_decision_transaction_required");
  return db.prepare(
    `DELETE FROM vnext_repository_execution_decision_requests
      WHERE request_fingerprint IN (
        SELECT request_fingerprint FROM vnext_repository_execution_decision_requests
         WHERE workspace_id = ? AND project_id = ?
           AND status NOT IN ('pending', 'granted')
         ORDER BY requested_at DESC, request_fingerprint DESC
         LIMIT -1 OFFSET ?
      )`,
  ).run(input.workspace_id, input.project_id, input.retain).changes;
}

interface RepositoryRunResumeCheckpointRowV01 extends Omit<
  RepositoryRunResumeCheckpointV01,
  "provider_thread_ref" | "last_turn_ref"
> {
  provider_thread_ref_json: string;
  last_turn_ref_json: string;
}

export function readRepositoryRunResumeCheckpointV01(
  db: Database.Database,
  checkpointFingerprint: string,
): RepositoryRunResumeCheckpointV01 | null {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  const row = db.prepare(
    `SELECT * FROM vnext_repository_run_resume_checkpoints
      WHERE checkpoint_fingerprint = ?`,
  ).get(checkpointFingerprint) as RepositoryRunResumeCheckpointRowV01 | undefined;
  return row ? parseRepositoryRunResumeCheckpointV01(row) : null;
}

export function listRepositoryRunResumeCheckpointsV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string; run_id: string },
): RepositoryRunResumeCheckpointV01[] {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  const rows = db.prepare(
    `SELECT * FROM vnext_repository_run_resume_checkpoints
      WHERE workspace_id = ? AND project_id = ? AND run_id = ?
      ORDER BY effect_ledger_high_water_mark ASC,
               event_high_water_mark ASC,
               checkpoint_fingerprint ASC`,
  ).all(
    input.workspace_id,
    input.project_id,
    input.run_id,
  ) as RepositoryRunResumeCheckpointRowV01[];
  return rows.map(parseRepositoryRunResumeCheckpointV01);
}

export function listAllRepositoryRunResumeCheckpointsForRecoveryV01(
  db: Database.Database,
): RepositoryRunResumeCheckpointV01[] {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  const rows = db.prepare(
    `SELECT * FROM vnext_repository_run_resume_checkpoints
      ORDER BY run_id, effect_ledger_high_water_mark,
               event_high_water_mark, checkpoint_fingerprint`,
  ).all() as RepositoryRunResumeCheckpointRowV01[];
  return rows.map(parseRepositoryRunResumeCheckpointV01);
}

export function insertRepositoryRunResumeCheckpointInsideTransactionV01(
  db: Database.Database,
  checkpoint: RepositoryRunResumeCheckpointV01,
): "inserted" | "exact_replay" {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  if (!db.inTransaction) {
    throw new Error("repository_run_resume_checkpoint_transaction_required");
  }
  const existing = readRepositoryRunResumeCheckpointV01(
    db,
    checkpoint.checkpoint_fingerprint,
  );
  if (existing) {
    if (
      canonicalizeProtocolValueV01(existing) ===
      canonicalizeProtocolValueV01(checkpoint)
    ) {
      return "exact_replay";
    }
    throw new Error("repository_run_resume_checkpoint_fingerprint_conflict");
  }
  const operationConflict = db.prepare(
    `SELECT checkpoint_fingerprint
       FROM vnext_repository_run_resume_checkpoints
      WHERE run_id = ? AND operation_ref = ? AND checkpoint_phase = ?`,
  ).get(
    checkpoint.run_id,
    checkpoint.operation_ref,
    checkpoint.checkpoint_phase,
  ) as { checkpoint_fingerprint: string } | undefined;
  if (operationConflict) {
    throw new Error("repository_run_resume_checkpoint_operation_conflict");
  }
  db.prepare(
    `INSERT INTO vnext_repository_run_resume_checkpoints (
      checkpoint_fingerprint, checkpoint_version, workspace_id, project_id,
      run_id, invocation_origin, attachment_id,
      attachment_binding_fingerprint, node_scope_fingerprint,
      execution_envelope_version, execution_envelope_fingerprint,
      adapter_version, capability_version, provider_resume_binding_version,
      provider_thread_ref_json, last_turn_ref_json, controller_generation,
      runtime_instance_fingerprint, runtime_generation_fingerprint,
      run_control_revision, step_id, step_control_revision,
      event_high_water_mark, step_high_water_mark,
      effect_ledger_high_water_mark, operation_ref, operation_class,
      checkpoint_phase, operation_certainty, approval_ref, approval_state,
      root_binding_fingerprint, physical_root_baseline_fingerprint,
      worktree_observation_fingerprint, observed_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )`,
  ).run(
    checkpoint.checkpoint_fingerprint,
    checkpoint.checkpoint_version,
    checkpoint.workspace_id,
    checkpoint.project_id,
    checkpoint.run_id,
    checkpoint.invocation_origin,
    checkpoint.attachment_id,
    checkpoint.attachment_binding_fingerprint,
    checkpoint.node_scope_fingerprint,
    checkpoint.execution_envelope_version,
    checkpoint.execution_envelope_fingerprint,
    checkpoint.adapter_version,
    checkpoint.capability_version,
    checkpoint.provider_resume_binding_version,
    JSON.stringify(checkpoint.provider_thread_ref),
    JSON.stringify(checkpoint.last_turn_ref),
    checkpoint.controller_generation,
    checkpoint.runtime_instance_fingerprint,
    checkpoint.runtime_generation_fingerprint,
    checkpoint.run_control_revision,
    checkpoint.step_id,
    checkpoint.step_control_revision,
    checkpoint.event_high_water_mark,
    checkpoint.step_high_water_mark,
    checkpoint.effect_ledger_high_water_mark,
    checkpoint.operation_ref,
    checkpoint.operation_class,
    checkpoint.checkpoint_phase,
    checkpoint.operation_certainty,
    checkpoint.approval_ref,
    checkpoint.approval_state,
    checkpoint.root_binding_fingerprint,
    checkpoint.physical_root_baseline_fingerprint,
    checkpoint.worktree_observation_fingerprint,
    checkpoint.observed_at,
  );
  return "inserted";
}

export function countRepositoryRunResumeCheckpointsV01(
  db: Database.Database,
  runId: string,
): number {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  return Number((db.prepare(
    `SELECT COUNT(*) AS count FROM vnext_repository_run_resume_checkpoints
      WHERE run_id = ?`,
  ).get(runId) as { count: number }).count);
}

type RepositoryManagedResumeAttemptRowV01 = RepositoryManagedResumeAttemptV01;

export function readRepositoryManagedResumeAttemptV01(
  db: Database.Database,
  attemptFingerprint: string,
): RepositoryManagedResumeAttemptV01 | null {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  const row = db.prepare(
    `SELECT * FROM vnext_repository_managed_resume_attempts
      WHERE attempt_fingerprint = ?`,
  ).get(attemptFingerprint) as RepositoryManagedResumeAttemptRowV01 | undefined;
  return row ? { ...row } : null;
}

export function readRepositoryManagedResumeAttemptForCheckpointV01(
  db: Database.Database,
  input: { run_id: string; checkpoint_fingerprint: string },
): RepositoryManagedResumeAttemptV01 | null {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  const row = db.prepare(
    `SELECT * FROM vnext_repository_managed_resume_attempts
      WHERE run_id = ? AND checkpoint_fingerprint = ?`,
  ).get(input.run_id, input.checkpoint_fingerprint) as
    | RepositoryManagedResumeAttemptRowV01
    | undefined;
  return row ? { ...row } : null;
}

export function readRepositoryManagedResumeAttemptForDecisionV01(
  db: Database.Database,
  decisionRequestFingerprint: string,
): RepositoryManagedResumeAttemptV01 | null {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  const row = db.prepare(
    `SELECT * FROM vnext_repository_managed_resume_attempts
      WHERE decision_request_fingerprint = ?`,
  ).get(decisionRequestFingerprint) as
    | RepositoryManagedResumeAttemptRowV01
    | undefined;
  return row ? { ...row } : null;
}

export function listRepositoryManagedResumeAttemptsV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string; run_id: string },
): RepositoryManagedResumeAttemptV01[] {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  return (db.prepare(
    `SELECT * FROM vnext_repository_managed_resume_attempts
      WHERE workspace_id = ? AND project_id = ? AND run_id = ?
      ORDER BY admitted_at, attempt_fingerprint`,
  ).all(input.workspace_id, input.project_id, input.run_id) as
    RepositoryManagedResumeAttemptRowV01[]).map((row) => ({ ...row }));
}

export function listAllRepositoryManagedResumeAttemptsForRecoveryV01(
  db: Database.Database,
): RepositoryManagedResumeAttemptV01[] {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  return (db.prepare(
    `SELECT * FROM vnext_repository_managed_resume_attempts
      ORDER BY workspace_id, project_id, run_id, admitted_at, attempt_fingerprint`,
  ).all() as RepositoryManagedResumeAttemptRowV01[]).map((row) => ({ ...row }));
}

export function insertRepositoryManagedResumeAttemptInsideTransactionV01(
  db: Database.Database,
  attempt: RepositoryManagedResumeAttemptV01,
): "inserted" | "exact_replay" {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  if (!db.inTransaction) {
    throw new Error("repository_managed_resume_attempt_transaction_required");
  }
  const existing = readRepositoryManagedResumeAttemptV01(
    db,
    attempt.attempt_fingerprint,
  );
  if (existing) {
    if (canonicalizeProtocolValueV01(existing) === canonicalizeProtocolValueV01(attempt)) {
      return "exact_replay";
    }
    throw new Error("repository_managed_resume_attempt_fingerprint_conflict");
  }
  const conflict = readRepositoryManagedResumeAttemptForCheckpointV01(db, {
    run_id: attempt.run_id,
    checkpoint_fingerprint: attempt.checkpoint_fingerprint,
  });
  if (conflict) {
    throw new Error("repository_managed_resume_checkpoint_attempt_conflict");
  }
  db.prepare(
    `INSERT INTO vnext_repository_managed_resume_attempts (
      attempt_fingerprint, attempt_version, workspace_id, project_id, run_id,
      attachment_id, attachment_binding_fingerprint, checkpoint_fingerprint,
      checkpoint_version, prior_controller_generation,
      resumed_controller_generation, decision_request_fingerprint,
      decision_grant_fingerprint, expected_state_fingerprint,
      admitted_run_control_revision, admitted_step_control_revision,
      runtime_instance_fingerprint, runtime_generation_fingerprint,
      attempt_state, final_outcome, admitted_at,
      provider_invocation_started_at, settled_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    attempt.attempt_fingerprint,
    attempt.attempt_version,
    attempt.workspace_id,
    attempt.project_id,
    attempt.run_id,
    attempt.attachment_id,
    attempt.attachment_binding_fingerprint,
    attempt.checkpoint_fingerprint,
    attempt.checkpoint_version,
    attempt.prior_controller_generation,
    attempt.resumed_controller_generation,
    attempt.decision_request_fingerprint,
    attempt.decision_grant_fingerprint,
    attempt.expected_state_fingerprint,
    attempt.admitted_run_control_revision,
    attempt.admitted_step_control_revision,
    attempt.runtime_instance_fingerprint,
    attempt.runtime_generation_fingerprint,
    attempt.attempt_state,
    attempt.final_outcome,
    attempt.admitted_at,
    attempt.provider_invocation_started_at,
    attempt.settled_at,
    attempt.updated_at,
  );
  return "inserted";
}

export function transitionRepositoryManagedResumeAttemptInsideTransactionV01(
  db: Database.Database,
  input: {
    attempt_fingerprint: string;
    from: RepositoryManagedResumeAttemptV01["attempt_state"][];
    to: RepositoryManagedResumeAttemptV01["attempt_state"];
    updated_at: string;
    provider_invocation_started_at?: string | null;
    settled_at?: string | null;
    final_outcome?: RepositoryManagedResumeAttemptV01["final_outcome"];
  },
): boolean {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  if (!db.inTransaction) {
    throw new Error("repository_managed_resume_attempt_transaction_required");
  }
  const assignments = ["attempt_state = ?", "updated_at = ?"];
  const values: unknown[] = [input.to, input.updated_at];
  if (Object.hasOwn(input, "provider_invocation_started_at")) {
    assignments.push("provider_invocation_started_at = ?");
    values.push(input.provider_invocation_started_at ?? null);
  }
  if (Object.hasOwn(input, "settled_at")) {
    assignments.push("settled_at = ?");
    values.push(input.settled_at ?? null);
  }
  if (Object.hasOwn(input, "final_outcome")) {
    assignments.push("final_outcome = ?");
    values.push(input.final_outcome ?? null);
  }
  const placeholders = input.from.map(() => "?").join(", ");
  const result = db.prepare(
    `UPDATE vnext_repository_managed_resume_attempts
        SET ${assignments.join(", ")}
      WHERE attempt_fingerprint = ? AND attempt_state IN (${placeholders})`,
  ).run(...values, input.attempt_fingerprint, ...input.from);
  return result.changes === 1;
}

export function readRepositoryManagedResumeRuntimeClaimV01(
  db: Database.Database,
  attemptFingerprint: string,
): RepositoryManagedResumeRuntimeClaimV01 | null {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  const row = db.prepare(
    `SELECT * FROM vnext_repository_managed_resume_runtime_claims
      WHERE attempt_fingerprint = ?`,
  ).get(attemptFingerprint) as RepositoryManagedResumeRuntimeClaimV01 | undefined;
  return row ? { ...row } : null;
}

export function insertRepositoryManagedResumeRuntimeClaimInsideTransactionV01(
  db: Database.Database,
  claim: RepositoryManagedResumeRuntimeClaimV01,
): void {
  if (!db.inTransaction) throw new Error("repository_managed_resume_claim_transaction_required");
  db.prepare(
    `INSERT INTO vnext_repository_managed_resume_runtime_claims (
      attempt_fingerprint, claim_version, runtime_instance_fingerprint,
      runtime_generation_fingerprint, claim_revision, claim_lifecycle,
      claimed_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    claim.attempt_fingerprint, claim.claim_version,
    claim.runtime_instance_fingerprint, claim.runtime_generation_fingerprint,
    claim.claim_revision, claim.claim_lifecycle, claim.claimed_at, claim.updated_at,
  );
  db.prepare(
    `INSERT INTO vnext_repository_managed_resume_runtime_claim_history (
      attempt_fingerprint, claim_revision, claim_version,
      runtime_instance_fingerprint, runtime_generation_fingerprint, claimed_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    claim.attempt_fingerprint, claim.claim_revision, claim.claim_version,
    claim.runtime_instance_fingerprint, claim.runtime_generation_fingerprint,
    claim.claimed_at,
  );
}

export function transferRepositoryManagedResumeRuntimeClaimInsideTransactionV01(
  db: Database.Database,
  input: {
    attempt_fingerprint: string;
    expected_claim_revision: number;
    expected_runtime_instance_fingerprint: string;
    expected_runtime_generation_fingerprint: string;
    runtime_instance_fingerprint: string;
    runtime_generation_fingerprint: string;
    claimed_at: string;
  },
): RepositoryManagedResumeRuntimeClaimV01 | null {
  if (!db.inTransaction) throw new Error("repository_managed_resume_claim_transaction_required");
  if (input.expected_claim_revision >= 16) return null;
  const priorCandidate = db.prepare(
    `SELECT 1 FROM vnext_repository_managed_resume_runtime_claim_history
      WHERE attempt_fingerprint = ? AND runtime_instance_fingerprint = ?
        AND runtime_generation_fingerprint = ?`,
  ).get(
    input.attempt_fingerprint,
    input.runtime_instance_fingerprint,
    input.runtime_generation_fingerprint,
  );
  if (priorCandidate) return null;
  const result = db.prepare(
    `UPDATE vnext_repository_managed_resume_runtime_claims
        SET runtime_instance_fingerprint = ?, runtime_generation_fingerprint = ?,
            claim_revision = claim_revision + 1, claim_lifecycle = 'claimed',
            claimed_at = ?, updated_at = ?
      WHERE attempt_fingerprint = ? AND claim_revision = ?
        AND runtime_instance_fingerprint = ? AND runtime_generation_fingerprint = ?
        AND claim_lifecycle = 'claimed'`,
  ).run(
    input.runtime_instance_fingerprint, input.runtime_generation_fingerprint,
    input.claimed_at, input.claimed_at, input.attempt_fingerprint,
    input.expected_claim_revision, input.expected_runtime_instance_fingerprint,
    input.expected_runtime_generation_fingerprint,
  );
  if (result.changes !== 1) return null;
  const transferred = readRepositoryManagedResumeRuntimeClaimV01(
    db,
    input.attempt_fingerprint,
  );
  if (!transferred) return null;
  db.prepare(
    `INSERT INTO vnext_repository_managed_resume_runtime_claim_history (
      attempt_fingerprint, claim_revision, claim_version,
      runtime_instance_fingerprint, runtime_generation_fingerprint, claimed_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    transferred.attempt_fingerprint, transferred.claim_revision,
    transferred.claim_version, transferred.runtime_instance_fingerprint,
    transferred.runtime_generation_fingerprint, transferred.claimed_at,
  );
  return transferred;
}

export function transitionRepositoryManagedResumeRuntimeClaimInsideTransactionV01(
  db: Database.Database,
  input: {
    attempt_fingerprint: string;
    claim_revision: number;
    runtime_instance_fingerprint: string;
    runtime_generation_fingerprint: string;
    from: RepositoryManagedResumeRuntimeClaimV01["claim_lifecycle"];
    to: RepositoryManagedResumeRuntimeClaimV01["claim_lifecycle"];
    updated_at: string;
  },
): boolean {
  if (!db.inTransaction) throw new Error("repository_managed_resume_claim_transaction_required");
  const result = db.prepare(
    `UPDATE vnext_repository_managed_resume_runtime_claims
        SET claim_lifecycle = ?, updated_at = ?
      WHERE attempt_fingerprint = ? AND claim_revision = ?
        AND runtime_instance_fingerprint = ? AND runtime_generation_fingerprint = ?
        AND claim_lifecycle = ?`,
  ).run(
    input.to, input.updated_at, input.attempt_fingerprint, input.claim_revision,
    input.runtime_instance_fingerprint, input.runtime_generation_fingerprint,
    input.from,
  );
  return result.changes === 1;
}

export function readRepositoryManagedResumeCancellationV01(
  db: Database.Database,
  attemptFingerprint: string,
): RepositoryManagedResumeCancellationV01 | null {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  const row = db.prepare(
    `SELECT * FROM vnext_repository_managed_resume_cancellations
      WHERE attempt_fingerprint = ?`,
  ).get(attemptFingerprint) as RepositoryManagedResumeCancellationV01 | undefined;
  return row ? { ...row } : null;
}

export function insertRepositoryManagedResumeCancellationInsideTransactionV01(
  db: Database.Database,
  cancellation: RepositoryManagedResumeCancellationV01,
): "inserted" | "exact_replay" {
  if (!db.inTransaction) throw new Error("repository_managed_resume_cancellation_transaction_required");
  const existing = readRepositoryManagedResumeCancellationV01(db, cancellation.attempt_fingerprint);
  if (existing) return "exact_replay";
  db.prepare(
    `INSERT INTO vnext_repository_managed_resume_cancellations (
      attempt_fingerprint, cancellation_version, workspace_id, project_id,
      run_id, attachment_id, controller_generation, cancellation_requested_at,
      cancellation_control_revision, provider_stop_confirmed,
      resume_reacquisition_forbidden, cancellation_signal_sent, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    cancellation.attempt_fingerprint, cancellation.cancellation_version,
    cancellation.workspace_id, cancellation.project_id, cancellation.run_id,
    cancellation.attachment_id, cancellation.controller_generation,
    cancellation.cancellation_requested_at, cancellation.cancellation_control_revision,
    cancellation.provider_stop_confirmed, cancellation.resume_reacquisition_forbidden,
    cancellation.cancellation_signal_sent, cancellation.updated_at,
  );
  return "inserted";
}

export function markRepositoryManagedResumeCancellationSignalInsideTransactionV01(
  db: Database.Database,
  attemptFingerprint: string,
  updatedAt: string,
): boolean {
  if (!db.inTransaction) throw new Error("repository_managed_resume_cancellation_transaction_required");
  return db.prepare(
    `UPDATE vnext_repository_managed_resume_cancellations
        SET cancellation_signal_sent = 1, updated_at = ?
      WHERE attempt_fingerprint = ? AND cancellation_signal_sent = 0`,
  ).run(updatedAt, attemptFingerprint).changes === 1;
}

export function markRepositoryManagedResumeCancellationStopConfirmedInsideTransactionV01(
  db: Database.Database,
  attemptFingerprint: string,
  updatedAt: string,
): boolean {
  if (!db.inTransaction) throw new Error("repository_managed_resume_cancellation_transaction_required");
  return db.prepare(
    `UPDATE vnext_repository_managed_resume_cancellations
        SET provider_stop_confirmed = 1, updated_at = ?
      WHERE attempt_fingerprint = ? AND provider_stop_confirmed = 0`,
  ).run(updatedAt, attemptFingerprint).changes === 1;
}

interface AttachmentRowV01 extends Omit<RepositoryExecutionAttachmentV01, "freshness_policy"> {
  freshness_policy_json: string;
}

export function readRepositoryExecutionAttachmentV01(
  db: Database.Database,
  attachmentId: string,
): RepositoryExecutionAttachmentV01 | null {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  const row = db.prepare(
    "SELECT * FROM vnext_repository_execution_attachments WHERE attachment_id = ?",
  ).get(attachmentId) as AttachmentRowV01 | undefined;
  return row ? parseAttachment(row) : null;
}

export function readPreparedRepositoryExecutionAttachmentV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): RepositoryExecutionAttachmentV01 | null {
  assertVNextRepositoryExecutionStoreSchemaV01(db);
  const row = db.prepare(
    `SELECT * FROM vnext_repository_execution_attachments
      WHERE workspace_id = ? AND project_id = ? AND lifecycle = 'prepared'`,
  ).get(input.workspace_id, input.project_id) as AttachmentRowV01 | undefined;
  return row ? parseAttachment(row) : null;
}

export function readRepositoryExecutionAttachmentByBindingV01(
  db: Database.Database,
  bindingFingerprint: string,
): RepositoryExecutionAttachmentV01 | null {
  const row = db.prepare(
    "SELECT * FROM vnext_repository_execution_attachments WHERE binding_fingerprint = ?",
  ).get(bindingFingerprint) as AttachmentRowV01 | undefined;
  return row ? parseAttachment(row) : null;
}

export function insertRepositoryExecutionAttachmentInsideTransactionV01(
  db: Database.Database,
  attachment: RepositoryExecutionAttachmentV01,
): void {
  if (!db.inTransaction) throw new Error("repository_execution_attachment_transaction_required");
  if (attachment.lifecycle !== "prepared" || attachment.consumed_run_id !== null) {
    throw new Error("repository_execution_attachment_consumption_not_supported");
  }
  db.prepare(
    `INSERT INTO vnext_repository_execution_attachments (
      attachment_id, attachment_version, workspace_id, project_id,
      node_scope_fingerprint, physical_root_baseline_fingerprint,
      root_binding_fingerprint, task_context_packet_id,
      task_context_packet_fingerprint, current_work_fingerprint,
      project_execution_admission_fingerprint, worktree_observation_fingerprint,
      managed_run_state_fingerprint, binding_fingerprint, prepared_at,
      freshness_policy_json, lifecycle, stale_reason, lifecycle_updated_at,
      consumed_run_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    attachment.attachment_id,
    attachment.attachment_version,
    attachment.workspace_id,
    attachment.project_id,
    attachment.node_scope_fingerprint,
    attachment.physical_root_baseline_fingerprint,
    attachment.root_binding_fingerprint,
    attachment.task_context_packet_id,
    attachment.task_context_packet_fingerprint,
    attachment.current_work_fingerprint,
    attachment.project_execution_admission_fingerprint,
    attachment.worktree_observation_fingerprint,
    attachment.managed_run_state_fingerprint,
    attachment.binding_fingerprint,
    attachment.prepared_at,
    JSON.stringify(attachment.freshness_policy),
    attachment.lifecycle,
    attachment.stale_reason,
    attachment.lifecycle_updated_at,
    null,
  );
}

export function updateRepositoryExecutionAttachmentLifecycleInsideTransactionV01(
  db: Database.Database,
  input: {
    attachment_id: string;
    from?: RepositoryExecutionAttachmentLifecycleV01;
    to: Exclude<RepositoryExecutionAttachmentLifecycleV01, "consumed">;
    stale_reason: RepositoryExecutionAttachmentStaleReasonV01 | null;
    updated_at: string;
  },
): boolean {
  if (!db.inTransaction) throw new Error("repository_execution_attachment_transaction_required");
  const result = db.prepare(
    `UPDATE vnext_repository_execution_attachments
       SET lifecycle = ?, stale_reason = ?, lifecycle_updated_at = ?
     WHERE attachment_id = ? AND lifecycle <> 'consumed'${input.from ? " AND lifecycle = ?" : ""}`,
  ).run(
    input.to,
    input.stale_reason,
    input.updated_at,
    input.attachment_id,
    ...(input.from ? [input.from] : []),
  );
  return result.changes === 1;
}

export function consumeRepositoryExecutionAttachmentInsideTransactionV01(
  db: Database.Database,
  input: {
    attachment_id: string;
    expected_binding_fingerprint: string;
    consumed_run_id: string;
    consumed_at: string;
  },
): "consumed" | "exact_replay" {
  if (!db.inTransaction) throw new Error("repository_execution_attachment_transaction_required");
  const existing = readRepositoryExecutionAttachmentV01(db, input.attachment_id);
  if (
    existing?.lifecycle === "consumed" &&
    existing.binding_fingerprint === input.expected_binding_fingerprint &&
    existing.consumed_run_id === input.consumed_run_id
  ) {
    return "exact_replay";
  }
  if (
    !existing ||
    existing.lifecycle !== "prepared" ||
    existing.binding_fingerprint !== input.expected_binding_fingerprint ||
    existing.consumed_run_id !== null
  ) {
    throw new Error("repository_execution_attachment_consumption_conflict");
  }
  const result = db.prepare(
    `UPDATE vnext_repository_execution_attachments
       SET lifecycle = 'consumed', stale_reason = NULL,
           lifecycle_updated_at = ?, consumed_run_id = ?
     WHERE attachment_id = ? AND binding_fingerprint = ?
       AND lifecycle = 'prepared' AND consumed_run_id IS NULL`,
  ).run(
    input.consumed_at,
    input.consumed_run_id,
    input.attachment_id,
    input.expected_binding_fingerprint,
  );
  if (result.changes !== 1) {
    throw new Error("repository_execution_attachment_consumption_conflict");
  }
  return "consumed";
}

export function pruneRepositoryExecutionAttachmentsInsideTransactionV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string; retain: number },
): number {
  if (!db.inTransaction) throw new Error("repository_execution_attachment_transaction_required");
  const result = db.prepare(
    `DELETE FROM vnext_repository_execution_attachments
      WHERE attachment_id IN (
        SELECT attachment_id FROM vnext_repository_execution_attachments
         WHERE workspace_id = ? AND project_id = ?
           AND lifecycle NOT IN ('prepared', 'consumed')
         ORDER BY lifecycle_updated_at DESC, attachment_id DESC
         LIMIT -1 OFFSET ?
      )`,
  ).run(input.workspace_id, input.project_id, input.retain);
  return result.changes;
}

function parseAttachment(row: AttachmentRowV01): RepositoryExecutionAttachmentV01 {
  const { freshness_policy_json, ...rest } = row;
  return {
    ...rest,
    freshness_policy: JSON.parse(freshness_policy_json) as RepositoryExecutionAttachmentV01["freshness_policy"],
  };
}

function parseRepositoryRunResumeCheckpointV01(
  row: RepositoryRunResumeCheckpointRowV01,
): RepositoryRunResumeCheckpointV01 {
  const {
    provider_thread_ref_json,
    last_turn_ref_json,
    ...rest
  } = row;
  return {
    ...rest,
    provider_thread_ref: JSON.parse(
      provider_thread_ref_json,
    ) as RepositoryRunResumeCheckpointV01["provider_thread_ref"],
    last_turn_ref: JSON.parse(
      last_turn_ref_json,
    ) as RepositoryRunResumeCheckpointV01["last_turn_ref"],
  };
}
