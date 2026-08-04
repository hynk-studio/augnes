import type Database from "better-sqlite3";

import type {
  PhysicalRootBaselineV01,
  RepositoryExecutionDecisionRequestV01,
  RepositoryExecutionAttachmentLifecycleV01,
  RepositoryExecutionAttachmentStaleReasonV01,
  RepositoryExecutionAttachmentV01,
} from "@/types/vnext/repository-execution";

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
    consumed_run_id TEXT CHECK (consumed_run_id IS NULL),
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
      'adopt_legacy_baseline', 'rebind_root', 'revoke_attachment'
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

interface AttachmentRowV01 extends Omit<RepositoryExecutionAttachmentV01, "freshness_policy" | "consumed_run_id"> {
  freshness_policy_json: string;
  consumed_run_id: null;
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
     WHERE attachment_id = ?${input.from ? " AND lifecycle = ?" : ""}`,
  ).run(
    input.to,
    input.stale_reason,
    input.updated_at,
    input.attachment_id,
    ...(input.from ? [input.from] : []),
  );
  return result.changes === 1;
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
         WHERE workspace_id = ? AND project_id = ? AND lifecycle <> 'prepared'
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
    consumed_run_id: null,
  };
}
