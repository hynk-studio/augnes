import type Database from "better-sqlite3";

import type {
  PhysicalRootBaselineV01,
  RepositoryExecutionDecisionRequestV01,
  RepositoryExecutionAttachmentLifecycleV01,
  RepositoryExecutionAttachmentStaleReasonV01,
  RepositoryExecutionAttachmentV01,
} from "@/types/vnext/repository-execution";
import type { RepositoryRunResumeCheckpointV01 } from "@/types/vnext/repository-run-resume";
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
    identity_version TEXT NOT NULL CHECK (identity_version = 'native_host_physical_root_identity.v0.1'),
    canonical_realpath_fingerprint TEXT NOT NULL CHECK (
      length(canonical_realpath_fingerprint) = 71 AND substr(canonical_realpath_fingerprint, 1, 7) = 'sha256:'
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
    PRIMARY KEY (workspace_id, project_id, node_scope_fingerprint),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_physical_root_baselines_project
    ON vnext_physical_root_baselines(workspace_id, project_id, observed_at);

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
      'start_repository_managed_delegation'
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
    ["index", "idx_vnext_repository_execution_attachments_project"],
    ["index", "idx_vnext_repository_execution_one_prepared"],
    ["index", "idx_vnext_repository_execution_consumed_run"],
    ["table", "vnext_repository_run_resume_checkpoints"],
    ["index", "idx_vnext_repository_resume_checkpoint_operation"],
    ["index", "idx_vnext_repository_resume_checkpoint_current"],
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
  ) as PhysicalRootBaselineV01 | undefined;
  return row ? { ...row } : null;
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
      root_binding_fingerprint, identity_version, canonical_realpath_fingerprint,
      filesystem_volume_identity, filesystem_object_identity, observed_at,
      provenance, baseline_fingerprint
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    baseline.workspace_id,
    baseline.project_id,
    baseline.node_scope_fingerprint,
    baseline.baseline_version,
    baseline.root_binding_fingerprint,
    baseline.identity_version,
    baseline.canonical_realpath_fingerprint,
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
      canonical_realpath_fingerprint = ?, filesystem_volume_identity = ?,
      filesystem_object_identity = ?, observed_at = ?, provenance = ?,
      baseline_fingerprint = ?
     WHERE workspace_id = ? AND project_id = ? AND node_scope_fingerprint = ?
       AND baseline_fingerprint = ?`,
  ).run(
    input.baseline.baseline_version,
    input.baseline.root_binding_fingerprint,
    input.baseline.identity_version,
    input.baseline.canonical_realpath_fingerprint,
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
