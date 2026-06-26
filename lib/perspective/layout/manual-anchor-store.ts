export const MANUAL_ANCHOR_STORE_VERSION =
  "project_constellation_manual_anchor_store.v0.1" as const;
export const MANUAL_ANCHOR_RECORD_VERSION =
  "project_constellation_manual_anchor_record.v0.1" as const;
export const MANUAL_ANCHOR_ACTIVITY_VERSION =
  "project_constellation_manual_anchor_activity.v0.1" as const;

export type ManualAnchorStoreStatus =
  | "stored"
  | "discarded"
  | "blocked_invalid_input"
  | "blocked_missing_node_ref"
  | "blocked_private_or_raw_payload"
  | "blocked_forbidden_authority"
  | "not_found";

export type ManualAnchorActivityKind =
  | "manual_anchor_created"
  | "manual_anchor_read"
  | "manual_anchor_listed"
  | "manual_anchor_discarded"
  | "manual_anchor_rejected_invalid_input"
  | "unknown";

export type ManualAnchorStoreReasonCode =
  | "explicit_operator_action_required"
  | "manual_anchor_display_hint_only"
  | "manual_anchor_not_authority"
  | "manual_anchor_not_truth"
  | "manual_anchor_not_proof"
  | "manual_anchor_not_evidence_strength"
  | "manual_anchor_not_promotion_readiness"
  | "layout_persistence_executed_for_anchor_only"
  | "durable_state_not_mutated"
  | "proof_not_created"
  | "evidence_not_created"
  | "claim_evidence_not_written"
  | "product_write_denied"
  | "provider_call_not_executed"
  | "prompt_not_sent"
  | "retrieval_not_executed"
  | "rag_answer_not_generated"
  | "source_fetch_not_executed"
  | "file_read_not_executed"
  | "git_ledger_export_not_executed"
  | "node_ref_present"
  | "node_ref_missing"
  | "layout_ref_present"
  | "perspective_ref_present"
  | "state_version_ref_present"
  | "anchor_position_present"
  | "anchor_reason_present"
  | "private_or_raw_payload_blocked"
  | "secret_like_pattern_blocked"
  | "local_path_blocked"
  | "private_url_blocked"
  | "forbidden_authority_blocked";

export interface ManualAnchorAuthorityBoundary {
  manual_anchor_persistence_now: true;
  layout_persistence_now: true;
  manual_anchor_display_hint_only: true;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  promotion_execution_now: false;
  promotion_decision_record_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  work_mutation_now: false;
  db_query_or_write_now: true;
  source_fetch_now: false;
  local_file_read_now: false;
  repository_file_read_now: false;
  uploaded_file_read_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  embedding_created_now: false;
  vector_search_now: false;
  git_ledger_export_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  manual_anchor_is_authority: false;
  manual_anchor_is_truth: false;
  manual_anchor_is_proof: false;
  manual_anchor_is_evidence_strength: false;
  manual_anchor_is_promotion_readiness: false;
  coordinate_is_truth: false;
  coordinate_is_proof: false;
  coordinate_is_evidence_strength: false;
  coordinate_is_promotion_readiness: false;
  product_write_authority: false;
}

export interface ManualAnchorPosition {
  x: number;
  y: number;
  z: number;
  coordinate_authority: "manual_anchor_hint";
  display_hint_only: true;
  reason_codes: ManualAnchorStoreReasonCode[];
}

export interface ManualAnchorCreateInput {
  store_version: typeof MANUAL_ANCHOR_STORE_VERSION;
  record_version: typeof MANUAL_ANCHOR_RECORD_VERSION;
  scope: typeof scope;
  anchor_id: string;
  layout_id: string;
  perspective_id: string;
  state_version_ref: string;
  node_ref: string;
  anchor_position: ManualAnchorPosition;
  anchor_reason: string;
  created_by_ref: string;
  applies_to_layout_scope: string;
  explicit_operator_action_required: true;
  persistence_now: true;
  display_hint_only: true;
  reason_codes: ManualAnchorStoreReasonCode[];
  boundary_notes: string[];
  authority_boundary?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ManualAnchorRecord {
  record_version: typeof MANUAL_ANCHOR_RECORD_VERSION;
  store_version: typeof MANUAL_ANCHOR_STORE_VERSION;
  scope: typeof scope;
  anchor_id: string;
  layout_id: string;
  perspective_id: string;
  state_version_ref: string;
  node_ref: string;
  anchor_position: ManualAnchorPosition;
  anchor_reason: string;
  created_by_ref: string;
  applies_to_layout_scope: string;
  explicit_operator_action_required: true;
  persistence_now: true;
  display_hint_only: true;
  reason_codes: ManualAnchorStoreReasonCode[];
  boundary_notes: string[];
  authority_boundary: ManualAnchorAuthorityBoundary;
  created_at: string;
  updated_at: string;
  discarded_at: string | null;
  discard_reason: string | null;
}

export interface ManualAnchorActivityRecord {
  activity_version: typeof MANUAL_ANCHOR_ACTIVITY_VERSION;
  store_version: typeof MANUAL_ANCHOR_STORE_VERSION;
  scope: typeof scope;
  activity_id: string;
  anchor_id: string;
  activity_kind: ManualAnchorActivityKind;
  actor_ref: string;
  summary: string;
  reason_codes: ManualAnchorStoreReasonCode[];
  created_at: string;
  authority_boundary: ManualAnchorAuthorityBoundary;
}

export interface ManualAnchorActivityInput {
  activity_id: string;
  anchor_id: string;
  activity_kind: ManualAnchorActivityKind;
  actor_ref: string;
  summary: string;
  reason_codes: ManualAnchorStoreReasonCode[];
  created_at?: string;
}

export interface ManualAnchorListFilters {
  layout_id?: string;
  perspective_id?: string;
  node_ref?: string;
  include_discarded?: boolean;
}

export interface ManualAnchorStoreResult {
  store_version: typeof MANUAL_ANCHOR_STORE_VERSION;
  record_version: typeof MANUAL_ANCHOR_RECORD_VERSION;
  activity_version: typeof MANUAL_ANCHOR_ACTIVITY_VERSION;
  scope: typeof scope;
  status: ManualAnchorStoreStatus;
  record: ManualAnchorRecord | null;
  records: ManualAnchorRecord[];
  activities: ManualAnchorActivityRecord[];
  error_code: ManualAnchorStoreStatus | null;
  reason_codes: ManualAnchorStoreReasonCode[];
  durable_state_mutated: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  product_write_executed: false;
  authority_boundary: ManualAnchorAuthorityBoundary;
}

export interface ManualAnchorValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface ManualAnchorDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

interface ManualAnchorRow {
  anchor_id: string;
  scope: string;
  layout_id: string;
  perspective_id: string;
  state_version_ref: string;
  node_ref: string;
  anchor_position_json: string;
  anchor_reason: string;
  created_by_ref: string;
  applies_to_layout_scope: string;
  explicit_operator_action_required: number;
  persistence_now: number;
  display_hint_only: number;
  authority_boundary_json: string;
  reason_codes_json: string;
  boundary_notes_json: string;
  created_at: string;
  updated_at: string;
  discarded_at: string | null;
  discard_reason: string | null;
}

interface ManualAnchorActivityRow {
  activity_id: string;
  anchor_id: string;
  activity_kind: ManualAnchorActivityKind;
  actor_ref: string;
  summary: string;
  reason_codes_json: string;
  created_at: string;
}

const scope = "project:augnes" as const;

const allowedReasonCodes = [
  "explicit_operator_action_required",
  "manual_anchor_display_hint_only",
  "manual_anchor_not_authority",
  "manual_anchor_not_truth",
  "manual_anchor_not_proof",
  "manual_anchor_not_evidence_strength",
  "manual_anchor_not_promotion_readiness",
  "layout_persistence_executed_for_anchor_only",
  "durable_state_not_mutated",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "product_write_denied",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "git_ledger_export_not_executed",
  "node_ref_present",
  "node_ref_missing",
  "layout_ref_present",
  "perspective_ref_present",
  "state_version_ref_present",
  "anchor_position_present",
  "anchor_reason_present",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
  "forbidden_authority_blocked",
] as const satisfies readonly ManualAnchorStoreReasonCode[];

const allowedActivityKinds = [
  "manual_anchor_created",
  "manual_anchor_read",
  "manual_anchor_listed",
  "manual_anchor_discarded",
  "manual_anchor_rejected_invalid_input",
  "unknown",
] as const satisfies readonly ManualAnchorActivityKind[];

const manualAnchorStoreSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS project_constellation_manual_anchors (
  anchor_id text primary key,
  scope text not null,
  layout_id text not null,
  perspective_id text not null,
  state_version_ref text not null,
  node_ref text not null,
  anchor_position_json text not null,
  anchor_reason text not null,
  created_by_ref text not null,
  applies_to_layout_scope text not null,
  explicit_operator_action_required integer not null,
  persistence_now integer not null,
  display_hint_only integer not null,
  authority_boundary_json text not null,
  reason_codes_json text not null,
  boundary_notes_json text not null,
  created_at text not null,
  updated_at text not null,
  discarded_at text,
  discard_reason text
);

CREATE TABLE IF NOT EXISTS project_constellation_manual_anchor_activity (
  activity_id text primary key,
  anchor_id text not null,
  activity_kind text not null,
  actor_ref text not null,
  summary text not null,
  reason_codes_json text not null,
  created_at text not null
);

CREATE INDEX IF NOT EXISTS idx_project_constellation_manual_anchors_layout
  ON project_constellation_manual_anchors(layout_id, discarded_at);
CREATE INDEX IF NOT EXISTS idx_project_constellation_manual_anchors_perspective
  ON project_constellation_manual_anchors(perspective_id, discarded_at);
CREATE INDEX IF NOT EXISTS idx_project_constellation_manual_anchors_node
  ON project_constellation_manual_anchors(node_ref, discarded_at);
CREATE INDEX IF NOT EXISTS idx_project_constellation_manual_anchor_activity_anchor
  ON project_constellation_manual_anchor_activity(anchor_id, created_at);
`;

const safeRouteDbPathPrefixes = [
  "tmp/project-constellation-manual-anchors/",
  ".tmp/project-constellation-manual-anchors/",
] as const;

const privateRawMarkers = [
  "/Users/",
  "/home/",
  "file://",
  "sk-",
  "ghp_",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "password:",
  "secret:",
  "private key",
  "raw provider output",
  "raw retrieval output",
  "raw layout payload",
  "raw manual anchor payload",
  "raw conversation",
  "hidden reasoning",
  "raw DB row",
  "raw_db_row",
  "browser dump",
  "raw browser dump",
  "raw source body",
  "actual prompt:",
  "provider response:",
  "actual query:",
  "embedding vector:",
  "vector index dump:",
] as const;

const forbiddenAuthorityTrueKeys = [
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "product_write_now",
  "product_id_allocation_now",
  "work_mutation_now",
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "embedding_created_now",
  "vector_search_now",
  "git_ledger_export_now",
  "codex_execution_authority",
  "github_automation_authority",
  "manual_anchor_is_authority",
  "manual_anchor_is_truth",
  "manual_anchor_is_proof",
  "manual_anchor_is_evidence_strength",
  "manual_anchor_is_promotion_readiness",
  "coordinate_is_truth",
  "coordinate_is_proof",
  "coordinate_is_evidence_strength",
  "coordinate_is_promotion_readiness",
  "product_write_authority",
] as const;

export function createManualAnchorAuthorityBoundaryV01(): ManualAnchorAuthorityBoundary {
  return {
    manual_anchor_persistence_now: true,
    layout_persistence_now: true,
    manual_anchor_display_hint_only: true,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    promotion_execution_now: false,
    promotion_decision_record_write_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    product_write_now: false,
    product_id_allocation_now: false,
    work_mutation_now: false,
    db_query_or_write_now: true,
    source_fetch_now: false,
    local_file_read_now: false,
    repository_file_read_now: false,
    uploaded_file_read_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    retrieval_execution_now: false,
    rag_answer_generation_now: false,
    embedding_created_now: false,
    vector_search_now: false,
    git_ledger_export_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    manual_anchor_is_authority: false,
    manual_anchor_is_truth: false,
    manual_anchor_is_proof: false,
    manual_anchor_is_evidence_strength: false,
    manual_anchor_is_promotion_readiness: false,
    coordinate_is_truth: false,
    coordinate_is_proof: false,
    coordinate_is_evidence_strength: false,
    coordinate_is_promotion_readiness: false,
    product_write_authority: false,
  };
}

export function ensureManualAnchorStoreSchemaV01(db: ManualAnchorDbLike): void {
  db.exec(manualAnchorStoreSchemaSqlV01);
}

export function manualAnchorStoreSchemaExistsV01(db: ManualAnchorDbLike): boolean {
  const requiredTables = [
    "project_constellation_manual_anchors",
    "project_constellation_manual_anchor_activity",
  ];
  const rows = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name IN (?, ?)`,
    )
    .all(...requiredTables) as { name: string }[];
  const tableNames = new Set(rows.map((row) => row.name));
  return requiredTables.every((tableName) => tableNames.has(tableName));
}

export function validateManualAnchorCreateInputV01(input: unknown): ManualAnchorValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const value = input as Partial<ManualAnchorCreateInput>;
  const failureCodes: string[] = [];
  if (value.store_version !== MANUAL_ANCHOR_STORE_VERSION) failureCodes.push("store_version_invalid");
  if (value.record_version !== MANUAL_ANCHOR_RECORD_VERSION) failureCodes.push("record_version_invalid");
  if (value.scope !== scope) failureCodes.push("scope_invalid");
  if (!isSafeString(value.anchor_id)) failureCodes.push("anchor_id_invalid");
  if (!isSafeString(value.layout_id)) failureCodes.push("layout_id_invalid");
  if (!isSafeString(value.perspective_id)) failureCodes.push("perspective_id_invalid");
  if (!isSafeString(value.state_version_ref)) failureCodes.push("state_version_ref_invalid");
  if (!isSafeString(value.node_ref)) failureCodes.push("node_ref_missing");
  if (!isSafeString(value.anchor_reason)) failureCodes.push("anchor_reason_invalid");
  if (!isSafeString(value.created_by_ref)) failureCodes.push("created_by_ref_invalid");
  if (!isSafeString(value.applies_to_layout_scope)) failureCodes.push("applies_to_layout_scope_invalid");
  if (value.explicit_operator_action_required !== true) {
    failureCodes.push("explicit_operator_action_required_invalid");
  }
  if (value.persistence_now !== true) failureCodes.push("persistence_now_invalid");
  if (value.display_hint_only !== true) failureCodes.push("display_hint_only_invalid");
  failureCodes.push(...validateAnchorPosition(value.anchor_position));
  failureCodes.push(...validateReasonCodeArray(value.reason_codes, "reason_codes"));
  failureCodes.push(...validateStringArray(value.boundary_notes, "boundary_notes"));
  failureCodes.push(...validateAuthorityBoundary(value.authority_boundary));
  failureCodes.push(...privateRawFailures(JSON.stringify(value), "input"));
  if (value.created_at !== undefined && !isSafeString(value.created_at)) failureCodes.push("created_at_invalid");
  if (value.updated_at !== undefined && !isSafeString(value.updated_at)) failureCodes.push("updated_at_invalid");
  return { passed: failureCodes.length === 0, failure_codes: uniqueSortedStrings(failureCodes) };
}

export function createManualAnchorRecordV01(
  input: ManualAnchorCreateInput,
  db: ManualAnchorDbLike,
): ManualAnchorStoreResult {
  const validation = validateManualAnchorCreateInputV01(input);
  if (!validation.passed) return blockedResult(statusForValidationFailures(validation.failure_codes));

  const record = normalizeCreateInputToRecord(input);
  ensureManualAnchorStoreSchemaV01(db);
  let transactionStarted = false;
  try {
    db.prepare("BEGIN IMMEDIATE").run();
    transactionStarted = true;
    insertManualAnchorRecord(db, record);
    const activity = normalizeActivityInput({
      activity_id: `${record.anchor_id}:activity:created`,
      anchor_id: record.anchor_id,
      activity_kind: "manual_anchor_created",
      actor_ref: record.created_by_ref,
      summary: "Manual anchor stored as display hint only.",
      reason_codes: [
        "explicit_operator_action_required",
        "manual_anchor_display_hint_only",
        "layout_persistence_executed_for_anchor_only",
        "durable_state_not_mutated",
        "product_write_denied",
      ],
      created_at: record.created_at,
    });
    insertManualAnchorActivityRecord(db, activity);
    db.prepare("COMMIT").run();
    transactionStarted = false;
    return result("stored", record, [record], [activity], [
      "explicit_operator_action_required",
      "manual_anchor_display_hint_only",
      "layout_persistence_executed_for_anchor_only",
      "durable_state_not_mutated",
      "proof_not_created",
      "evidence_not_created",
      "claim_evidence_not_written",
      "product_write_denied",
    ]);
  } catch {
    if (transactionStarted) {
      try {
        db.prepare("ROLLBACK").run();
      } catch {
        // Bounded result below covers rollback failure.
      }
    }
    return blockedResult("blocked_invalid_input");
  }
}

export function readManualAnchorRecordV01(
  anchorId: string,
  db: ManualAnchorDbLike,
): ManualAnchorStoreResult {
  if (!isSafeString(anchorId)) return blockedResult("blocked_private_or_raw_payload");
  const record = readAnchorById(db, anchorId);
  if (!record) return result("not_found", null, [], [], ["manual_anchor_display_hint_only"]);
  return result(record.discarded_at ? "discarded" : "stored", record, [record], listActivitiesForAnchor(db, anchorId), [
    "manual_anchor_display_hint_only",
    "manual_anchor_not_authority",
    "durable_state_not_mutated",
    "product_write_denied",
  ]);
}

export function listManualAnchorRecordsV01(
  filters: ManualAnchorListFilters,
  db: ManualAnchorDbLike,
): ManualAnchorStoreResult {
  for (const value of [filters.layout_id, filters.perspective_id, filters.node_ref]) {
    if (value !== undefined && !isSafeString(value)) return blockedResult("blocked_private_or_raw_payload");
  }
  const clauses = ["scope = ?"];
  const params: unknown[] = [scope];
  if (filters.layout_id) {
    clauses.push("layout_id = ?");
    params.push(filters.layout_id);
  }
  if (filters.perspective_id) {
    clauses.push("perspective_id = ?");
    params.push(filters.perspective_id);
  }
  if (filters.node_ref) {
    clauses.push("node_ref = ?");
    params.push(filters.node_ref);
  }
  if (!filters.include_discarded) clauses.push("discarded_at IS NULL");
  const rows = db
    .prepare(
      `SELECT * FROM project_constellation_manual_anchors
       WHERE ${clauses.join(" AND ")}
       ORDER BY created_at ASC, anchor_id ASC`,
    )
    .all(...params) as ManualAnchorRow[];
  const records = rows.map(rowToRecord);
  return result("stored", records[0] ?? null, records, [], [
    "manual_anchor_display_hint_only",
    "manual_anchor_not_authority",
    "durable_state_not_mutated",
    "product_write_denied",
  ]);
}

export function discardManualAnchorRecordV01(
  anchorId: string,
  reason: string,
  db: ManualAnchorDbLike,
): ManualAnchorStoreResult {
  if (!isSafeString(anchorId) || !isSafeString(reason)) {
    return blockedResult("blocked_private_or_raw_payload");
  }
  ensureManualAnchorStoreSchemaV01(db);
  const record = readAnchorById(db, anchorId);
  if (!record) return result("not_found", null, [], [], ["manual_anchor_display_hint_only"]);
  const discardedAt = record.discarded_at ?? record.updated_at;
  db.prepare(
    `UPDATE project_constellation_manual_anchors
     SET discarded_at = ?, discard_reason = ?, updated_at = ?
     WHERE anchor_id = ?`,
  ).run(discardedAt, reason, discardedAt, anchorId);
  const activityResult = appendManualAnchorActivityV01(
    {
      activity_id: `${anchorId}:activity:discarded`,
      anchor_id: anchorId,
      activity_kind: "manual_anchor_discarded",
      actor_ref: record.created_by_ref,
      summary: "Manual anchor discarded as lifecycle transition only.",
      reason_codes: [
        "manual_anchor_display_hint_only",
        "manual_anchor_not_proof",
        "durable_state_not_mutated",
        "product_write_denied",
      ],
      created_at: discardedAt,
    },
    db,
  );
  const discarded = readAnchorById(db, anchorId);
  return result(
    "discarded",
    discarded,
    discarded ? [discarded] : [],
    activityResult.activities.length > 0 ? activityResult.activities : listActivitiesForAnchor(db, anchorId),
    ["manual_anchor_display_hint_only", "durable_state_not_mutated", "product_write_denied"],
  );
}

export function appendManualAnchorActivityV01(
  input: ManualAnchorActivityInput,
  db: ManualAnchorDbLike,
): ManualAnchorStoreResult {
  const failureCodes: string[] = [];
  if (!isSafeString(input.activity_id)) failureCodes.push("activity_id_invalid");
  if (!isSafeString(input.anchor_id)) failureCodes.push("anchor_id_invalid");
  if (!allowedActivityKinds.includes(input.activity_kind)) failureCodes.push("activity_kind_invalid");
  if (!isSafeString(input.actor_ref)) failureCodes.push("actor_ref_invalid");
  if (!isSafeString(input.summary)) failureCodes.push("summary_invalid");
  if (input.created_at !== undefined && !isSafeString(input.created_at)) failureCodes.push("created_at_invalid");
  failureCodes.push(...validateReasonCodeArray(input.reason_codes, "reason_codes"));
  if (failureCodes.length > 0) return blockedResult(statusForValidationFailures(failureCodes));

  ensureManualAnchorStoreSchemaV01(db);
  if (!manualAnchorExists(db, input.anchor_id)) {
    return result("not_found", null, [], [], ["manual_anchor_display_hint_only"]);
  }
  const activity = normalizeActivityInput(input);
  try {
    insertManualAnchorActivityRecord(db, activity);
  } catch {
    return blockedResult("blocked_invalid_input");
  }
  return result("stored", null, [], [activity], [
    "manual_anchor_display_hint_only",
    "layout_persistence_executed_for_anchor_only",
  ]);
}

export function isSafeManualAnchorRouteDbPathV01(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  if (value.includes("\\") || value.includes("//") || value.includes("..") || value.includes("\0")) {
    return false;
  }
  if (!safeRouteDbPathPrefixes.some((prefix) => value.startsWith(prefix))) return false;
  return !hasUnsafeString(value);
}

function normalizeCreateInputToRecord(input: ManualAnchorCreateInput): ManualAnchorRecord {
  const createdAt = input.created_at ?? new Date(0).toISOString();
  return {
    record_version: MANUAL_ANCHOR_RECORD_VERSION,
    store_version: MANUAL_ANCHOR_STORE_VERSION,
    scope,
    anchor_id: input.anchor_id,
    layout_id: input.layout_id,
    perspective_id: input.perspective_id,
    state_version_ref: input.state_version_ref,
    node_ref: input.node_ref,
    anchor_position: {
      ...input.anchor_position,
      reason_codes: uniqueSortedReasonCodes(input.anchor_position.reason_codes),
    },
    anchor_reason: input.anchor_reason,
    created_by_ref: input.created_by_ref,
    applies_to_layout_scope: input.applies_to_layout_scope,
    explicit_operator_action_required: true,
    persistence_now: true,
    display_hint_only: true,
    reason_codes: uniqueSortedReasonCodes(input.reason_codes),
    boundary_notes: uniqueSortedStrings(input.boundary_notes),
    authority_boundary: createManualAnchorAuthorityBoundaryV01(),
    created_at: createdAt,
    updated_at: input.updated_at ?? createdAt,
    discarded_at: null,
    discard_reason: null,
  };
}

function normalizeActivityInput(input: ManualAnchorActivityInput): ManualAnchorActivityRecord {
  return {
    activity_version: MANUAL_ANCHOR_ACTIVITY_VERSION,
    store_version: MANUAL_ANCHOR_STORE_VERSION,
    scope,
    activity_id: input.activity_id,
    anchor_id: input.anchor_id,
    activity_kind: input.activity_kind,
    actor_ref: input.actor_ref,
    summary: input.summary,
    reason_codes: uniqueSortedReasonCodes(input.reason_codes),
    created_at: input.created_at ?? new Date(0).toISOString(),
    authority_boundary: createManualAnchorAuthorityBoundaryV01(),
  };
}

function insertManualAnchorRecord(db: ManualAnchorDbLike, record: ManualAnchorRecord): void {
  db.prepare(
    `INSERT INTO project_constellation_manual_anchors (
      anchor_id,
      scope,
      layout_id,
      perspective_id,
      state_version_ref,
      node_ref,
      anchor_position_json,
      anchor_reason,
      created_by_ref,
      applies_to_layout_scope,
      explicit_operator_action_required,
      persistence_now,
      display_hint_only,
      authority_boundary_json,
      reason_codes_json,
      boundary_notes_json,
      created_at,
      updated_at,
      discarded_at,
      discard_reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.anchor_id,
    record.scope,
    record.layout_id,
    record.perspective_id,
    record.state_version_ref,
    record.node_ref,
    JSON.stringify(record.anchor_position),
    record.anchor_reason,
    record.created_by_ref,
    record.applies_to_layout_scope,
    1,
    1,
    1,
    JSON.stringify(record.authority_boundary),
    JSON.stringify(record.reason_codes),
    JSON.stringify(record.boundary_notes),
    record.created_at,
    record.updated_at,
    record.discarded_at,
    record.discard_reason,
  );
}

function insertManualAnchorActivityRecord(db: ManualAnchorDbLike, activity: ManualAnchorActivityRecord): void {
  db.prepare(
    `INSERT INTO project_constellation_manual_anchor_activity (
      activity_id,
      anchor_id,
      activity_kind,
      actor_ref,
      summary,
      reason_codes_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    activity.activity_id,
    activity.anchor_id,
    activity.activity_kind,
    activity.actor_ref,
    activity.summary,
    JSON.stringify(activity.reason_codes),
    activity.created_at,
  );
}

function readAnchorById(db: ManualAnchorDbLike, anchorId: string): ManualAnchorRecord | null {
  const row = db
    .prepare(`SELECT * FROM project_constellation_manual_anchors WHERE anchor_id = ?`)
    .get(anchorId) as ManualAnchorRow | undefined;
  return row ? rowToRecord(row) : null;
}

function listActivitiesForAnchor(db: ManualAnchorDbLike, anchorId: string): ManualAnchorActivityRecord[] {
  const rows = db
    .prepare(
      `SELECT * FROM project_constellation_manual_anchor_activity
       WHERE anchor_id = ?
       ORDER BY created_at ASC, activity_id ASC`,
    )
    .all(anchorId) as ManualAnchorActivityRow[];
  return rows.map(rowToActivity);
}

function manualAnchorExists(db: ManualAnchorDbLike, anchorId: string): boolean {
  const row = db
    .prepare(`SELECT anchor_id FROM project_constellation_manual_anchors WHERE anchor_id = ?`)
    .get(anchorId) as { anchor_id: string } | undefined;
  return Boolean(row);
}

function rowToRecord(row: ManualAnchorRow): ManualAnchorRecord {
  return {
    record_version: MANUAL_ANCHOR_RECORD_VERSION,
    store_version: MANUAL_ANCHOR_STORE_VERSION,
    scope,
    anchor_id: row.anchor_id,
    layout_id: row.layout_id,
    perspective_id: row.perspective_id,
    state_version_ref: row.state_version_ref,
    node_ref: row.node_ref,
    anchor_position: parseJson(row.anchor_position_json, defaultPosition()),
    anchor_reason: row.anchor_reason,
    created_by_ref: row.created_by_ref,
    applies_to_layout_scope: row.applies_to_layout_scope,
    explicit_operator_action_required: true,
    persistence_now: true,
    display_hint_only: true,
    reason_codes: parseJson(row.reason_codes_json, []),
    boundary_notes: parseJson(row.boundary_notes_json, []),
    authority_boundary: parseJson(row.authority_boundary_json, createManualAnchorAuthorityBoundaryV01()),
    created_at: row.created_at,
    updated_at: row.updated_at,
    discarded_at: row.discarded_at,
    discard_reason: row.discard_reason,
  };
}

function rowToActivity(row: ManualAnchorActivityRow): ManualAnchorActivityRecord {
  return {
    activity_version: MANUAL_ANCHOR_ACTIVITY_VERSION,
    store_version: MANUAL_ANCHOR_STORE_VERSION,
    scope,
    activity_id: row.activity_id,
    anchor_id: row.anchor_id,
    activity_kind: row.activity_kind,
    actor_ref: row.actor_ref,
    summary: row.summary,
    reason_codes: parseJson(row.reason_codes_json, []),
    created_at: row.created_at,
    authority_boundary: createManualAnchorAuthorityBoundaryV01(),
  };
}

function result(
  status: ManualAnchorStoreStatus,
  record: ManualAnchorRecord | null,
  records: ManualAnchorRecord[],
  activities: ManualAnchorActivityRecord[],
  reasonCodes: ManualAnchorStoreReasonCode[],
): ManualAnchorStoreResult {
  const errorCode = status.startsWith("blocked") || status === "not_found" ? status : null;
  return {
    store_version: MANUAL_ANCHOR_STORE_VERSION,
    record_version: MANUAL_ANCHOR_RECORD_VERSION,
    activity_version: MANUAL_ANCHOR_ACTIVITY_VERSION,
    scope,
    status,
    record,
    records,
    activities,
    error_code: errorCode,
    reason_codes: uniqueSortedReasonCodes(reasonCodes),
    durable_state_mutated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createManualAnchorAuthorityBoundaryV01(),
  };
}

function blockedResult(
  status: Exclude<ManualAnchorStoreStatus, "stored" | "discarded" | "not_found">,
  reasonCodes: ManualAnchorStoreReasonCode[] = statusToReasonCodes(status),
): ManualAnchorStoreResult {
  return result(status, null, [], [], reasonCodes);
}

function statusToReasonCodes(status: ManualAnchorStoreStatus): ManualAnchorStoreReasonCode[] {
  if (status === "blocked_missing_node_ref") return ["node_ref_missing", "manual_anchor_display_hint_only"];
  if (status === "blocked_private_or_raw_payload") return ["private_or_raw_payload_blocked"];
  if (status === "blocked_forbidden_authority") return ["forbidden_authority_blocked", "product_write_denied"];
  return ["manual_anchor_display_hint_only", "durable_state_not_mutated", "product_write_denied"];
}

function statusForValidationFailures(
  failureCodes: string[],
): Exclude<ManualAnchorStoreStatus, "stored" | "discarded" | "not_found"> {
  if (failureCodes.some((code) => code.includes("node_ref_missing"))) return "blocked_missing_node_ref";
  if (
    failureCodes.some(
      (code) =>
        code.includes("private_or_raw_payload_blocked") ||
        code.includes("local_path_blocked") ||
        code.includes("private_url_blocked") ||
        code.includes("secret_like_pattern_blocked"),
    )
  ) {
    return "blocked_private_or_raw_payload";
  }
  if (failureCodes.some((code) => code.includes("forbidden_authority"))) return "blocked_forbidden_authority";
  return "blocked_invalid_input";
}

function validateAnchorPosition(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["anchor_position_missing"];
  const position = value as Partial<ManualAnchorPosition>;
  const failureCodes: string[] = [];
  for (const axis of ["x", "y", "z"] as const) {
    if (typeof position[axis] !== "number" || !Number.isFinite(position[axis])) {
      failureCodes.push(`anchor_position_${axis}_invalid`);
    }
  }
  if (position.coordinate_authority !== "manual_anchor_hint") {
    failureCodes.push("anchor_position_coordinate_authority_invalid");
  }
  if (position.display_hint_only !== true) failureCodes.push("anchor_position_display_hint_only_invalid");
  failureCodes.push(...validateReasonCodeArray(position.reason_codes, "anchor_position.reason_codes"));
  return failureCodes;
}

function validateReasonCodeArray(value: unknown, field: string): string[] {
  const failureCodes = validateStringArray(value, field);
  if (!Array.isArray(value)) return failureCodes;
  value.forEach((item, index) => {
    if (typeof item === "string" && !allowedReasonCodes.includes(item as ManualAnchorStoreReasonCode)) {
      failureCodes.push(`${field}.${index}_unknown_reason_code`);
    }
  });
  return failureCodes;
}

function validateStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) return [`${field}_not_array`];
  const failureCodes: string[] = [];
  value.forEach((item, index) => {
    if (typeof item !== "string" || item.trim() === "") {
      failureCodes.push(`${field}.${index}_not_string`);
      return;
    }
    failureCodes.push(...privateRawFailures(item, `${field}.${index}`));
  });
  return failureCodes;
}

function validateAuthorityBoundary(value: unknown): string[] {
  if (value === undefined) return [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["authority_boundary_invalid"];
  const boundary = value as Record<string, unknown>;
  const failureCodes: string[] = [];
  for (const key of forbiddenAuthorityTrueKeys) {
    if (boundary[key] === true) failureCodes.push(`${key}_forbidden_authority`);
  }
  return failureCodes;
}

function isSafeString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && !hasUnsafeString(value);
}

function hasUnsafeString(value: string): boolean {
  return privateRawFailures(value, "value").length > 0;
}

function privateRawFailures(value: string, field: string): string[] {
  return privateRawMarkers
    .filter((marker) => value.includes(marker))
    .map((marker) => `${field}_${markerFailureCode(marker)}`);
}

function markerFailureCode(marker: string): ManualAnchorStoreReasonCode {
  if (marker === "/Users/" || marker === "/home/") return "local_path_blocked";
  if (marker === "file://") return "private_url_blocked";
  if (
    marker === "sk-" ||
    marker === "ghp_" ||
    marker === "OPENAI_API_KEY" ||
    marker === "GITHUB_TOKEN" ||
    marker === "password:" ||
    marker === "secret:" ||
    marker === "private key"
  ) {
    return "secret_like_pattern_blocked";
  }
  return "private_or_raw_payload_blocked";
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function defaultPosition(): ManualAnchorPosition {
  return {
    x: 0,
    y: 0,
    z: 0,
    coordinate_authority: "manual_anchor_hint",
    display_hint_only: true,
    reason_codes: ["manual_anchor_display_hint_only"],
  };
}

function uniqueSortedReasonCodes(
  reasonCodes: readonly ManualAnchorStoreReasonCode[],
): ManualAnchorStoreReasonCode[] {
  return [...new Set(reasonCodes)].sort();
}

function uniqueSortedStrings(values: readonly string[] = []): string[] {
  return [...new Set(values)].sort();
}
