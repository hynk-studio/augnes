import type {
  FormationReceiptActivityKind,
  FormationReceiptActivityRecord,
  FormationReceiptAuthorityBoundary,
  FormationReceiptCandidateDisposition,
  FormationReceiptCandidateKind,
  FormationReceiptCandidateRef,
  FormationReceiptCreateInput,
  FormationReceiptReasonCode,
  FormationReceiptRecord,
  FormationReceiptSourceRef,
  FormationReceiptStatus,
} from "./build-durable-receipt";

export type { FormationReceiptCreateInput };

export const FORMATION_RECEIPT_BUILDER_VERSION = "formation_receipt_builder.v0.1" as const;
export const FORMATION_RECEIPT_RECORD_VERSION = "formation_receipt_record.v0.1" as const;
export const FORMATION_RECEIPT_ACTIVITY_VERSION = "formation_receipt_activity.v0.1" as const;
export const FORMATION_RECEIPT_STORE_VERSION = "formation_receipt_store.v0.1" as const;

export type FormationReceiptStoreStatus = FormationReceiptStatus | "not_found";

export interface FormationReceiptListFilters {
  promotion_decision_id?: string;
  review_record_ref?: string;
  include_discarded?: boolean;
}

export interface FormationReceiptActivityInput {
  activity_id: string;
  receipt_id: string;
  activity_kind: FormationReceiptActivityKind;
  actor_ref: string;
  summary: string;
  reason_codes: FormationReceiptReasonCode[];
  created_at?: string;
}

export interface FormationReceiptStoreResult {
  store_version: typeof FORMATION_RECEIPT_STORE_VERSION;
  builder_version: typeof FORMATION_RECEIPT_BUILDER_VERSION;
  record_version: typeof FORMATION_RECEIPT_RECORD_VERSION;
  activity_version: typeof FORMATION_RECEIPT_ACTIVITY_VERSION;
  scope: typeof scope;
  status: FormationReceiptStoreStatus;
  record: FormationReceiptRecord | null;
  records: FormationReceiptRecord[];
  activities: FormationReceiptActivityRecord[];
  error_code: FormationReceiptStoreStatus | null;
  reason_codes: FormationReceiptReasonCode[];
  formation_receipt_written: boolean;
  durable_state_applied: false;
  promotion_executed: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  product_write_executed: false;
  authority_boundary: FormationReceiptAuthorityBoundary;
}

export interface FormationReceiptDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

interface FormationReceiptRow {
  receipt_id: string;
  scope: string;
  promotion_decision_id: string;
  review_record_ref: string;
  operator_actor_ref: string;
  receipt_status: FormationReceiptStatus;
  formation_receipt_written: number;
  durable_state_applied: number;
  promotion_executed: number;
  proof_or_evidence_created: number;
  claim_or_evidence_written: number;
  product_write_executed: number;
  geometry_digest_ref: string;
  agent_substrate_warning_refs_json: string;
  context_packet_ref: string;
  feedback_event_refs_json: string;
  unresolved_tensions_preserved_json: string;
  knowledge_gaps_preserved_json: string;
  boundary_acknowledgements_json: string;
  authority_boundary_json: string;
  reason_codes_json: string;
  boundary_notes_json: string;
  created_at: string;
  updated_at: string;
  discarded_at: string | null;
  discard_reason: string | null;
}

interface FormationReceiptCandidateRow {
  id: string;
  receipt_id: string;
  candidate_ref: string;
  candidate_kind: FormationReceiptCandidateKind;
  bounded_summary: string;
  source_refs_json: string;
  reason_codes_json: string;
}

interface FormationReceiptSourceRow {
  id: string;
  receipt_id: string;
  source_ref: string;
  bounded_summary: string;
  reason_codes_json: string;
}

interface FormationReceiptActivityRow {
  activity_id: string;
  receipt_id: string;
  activity_kind: FormationReceiptActivityKind;
  actor_ref: string;
  summary: string;
  reason_codes_json: string;
  created_at: string;
}

interface PromotionDecisionLineageRow {
  promotion_decision_id: string;
  scope: string;
  decision_kind: string;
  decision_status: string;
  operator_actor_ref: string;
  explicit_user_action_required: number;
  future_operator_decision_only: number;
  review_record_ref: string;
  promotion_executed: number;
  formation_receipt_written: number;
  durable_state_applied: number;
  proof_or_evidence_created: number;
  claim_or_evidence_written: number;
  product_write_executed: number;
  discarded_at: string | null;
}

interface PromotionDecisionBasisLineageRow {
  source_refs_json: string;
}

const scope = "project:augnes" as const;

const allowedActivityKinds: FormationReceiptActivityKind[] = [
  "formation_receipt_written",
  "formation_receipt_read",
  "formation_receipt_listed",
  "formation_receipt_discarded",
  "formation_receipt_rejected_invalid_input",
  "unknown",
];

const allowedCandidateDispositions: FormationReceiptCandidateDisposition[] = [
  "selected",
  "omitted",
  "deferred",
];

const allowedCandidateKinds: FormationReceiptCandidateKind[] = [
  "claim_candidate",
  "evidence_candidate",
  "perspective_delta_candidate",
  "retrieval_candidate",
  "rag_context_candidate",
  "provider_candidate_output_ref",
  "feedback_candidate",
  "manual_operator_note_summary",
  "unknown",
];

const forbiddenAuthorityFields = [
  "durable_perspective_state_apply_now",
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
  "source_of_truth",
  "formation_receipt_is_proof",
  "formation_receipt_is_evidence",
  "formation_receipt_is_state_apply",
  "candidate_is_fact",
  "candidate_is_proof",
  "candidate_is_accepted_evidence",
  "provider_output_is_truth",
  "retrieval_result_is_evidence",
  "rag_context_is_truth",
  "feedback_is_truth",
  "product_write_authority",
] as const;

const unsafeStringPatterns = [
  /\/Users\//i,
  /\/home\//i,
  /file:\/\//i,
  /https?:\/\//i,
  /private URL/i,
  /private_url/i,
  /local private path/i,
  /raw source body/i,
  /raw provider output/i,
  /raw retrieval output/i,
  /raw formation receipt payload/i,
  /raw promotion payload/i,
  /raw conversation/i,
  /hidden reasoning/i,
  /raw DB row/i,
  /raw_db_row/i,
  /browser dump/i,
  /raw browser dump/i,
  /actual prompt:/i,
  /provider response:/i,
  /actual query:/i,
  /embedding vector:/i,
  /vector index dump:/i,
  /sk-/i,
  /ghp_/i,
  /OPENAI_API_KEY/i,
  /GITHUB_TOKEN/i,
  /password:/i,
  /secret:/i,
  /private key/i,
  /secret-like formation receipt input/i,
];

const safeRouteDbPathPrefixes = [
  "tmp/perspective-formation-receipts/",
  ".tmp/perspective-formation-receipts/",
  "tmp/perspective-promotion-decisions/",
  ".tmp/perspective-promotion-decisions/",
] as const;

export function createFormationReceiptAuthorityBoundaryV01(): FormationReceiptAuthorityBoundary {
  return {
    formation_receipt_write_now: true,
    durable_perspective_state_apply_now: false,
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
    source_of_truth: false,
    formation_receipt_is_proof: false,
    formation_receipt_is_evidence: false,
    formation_receipt_is_state_apply: false,
    candidate_is_fact: false,
    candidate_is_proof: false,
    candidate_is_accepted_evidence: false,
    provider_output_is_truth: false,
    retrieval_result_is_evidence: false,
    rag_context_is_truth: false,
    feedback_is_truth: false,
    product_write_authority: false,
  };
}

export const formationReceiptStoreSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS perspective_formation_receipts (
  receipt_id text primary key,
  scope text not null,
  promotion_decision_id text not null,
  review_record_ref text not null,
  operator_actor_ref text not null,
  receipt_status text not null,
  formation_receipt_written integer not null default 1,
  durable_state_applied integer not null default 0,
  promotion_executed integer not null default 0,
  proof_or_evidence_created integer not null default 0,
  claim_or_evidence_written integer not null default 0,
  product_write_executed integer not null default 0,
  geometry_digest_ref text not null,
  agent_substrate_warning_refs_json text not null,
  context_packet_ref text not null,
  feedback_event_refs_json text not null,
  unresolved_tensions_preserved_json text not null,
  knowledge_gaps_preserved_json text not null,
  boundary_acknowledgements_json text not null,
  authority_boundary_json text not null,
  reason_codes_json text not null,
  boundary_notes_json text not null,
  created_at text not null,
  updated_at text not null,
  discarded_at text,
  discard_reason text
);

CREATE TABLE IF NOT EXISTS perspective_formation_receipt_selected_candidates (
  id text primary key,
  receipt_id text not null,
  candidate_ref text not null,
  candidate_kind text not null,
  bounded_summary text not null,
  source_refs_json text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_formation_receipt_omitted_candidates (
  id text primary key,
  receipt_id text not null,
  candidate_ref text not null,
  candidate_kind text not null,
  bounded_summary text not null,
  source_refs_json text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_formation_receipt_deferred_candidates (
  id text primary key,
  receipt_id text not null,
  candidate_ref text not null,
  candidate_kind text not null,
  bounded_summary text not null,
  source_refs_json text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_formation_receipt_sources (
  id text primary key,
  receipt_id text not null,
  source_ref text not null,
  bounded_summary text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_formation_receipt_activity (
  activity_id text primary key,
  receipt_id text not null,
  activity_kind text not null,
  actor_ref text not null,
  summary text not null,
  reason_codes_json text not null,
  created_at text not null
);

CREATE INDEX IF NOT EXISTS idx_perspective_formation_receipts_promotion_decision
  ON perspective_formation_receipts(scope, promotion_decision_id, created_at);
CREATE INDEX IF NOT EXISTS idx_perspective_formation_receipts_review_record
  ON perspective_formation_receipts(scope, review_record_ref, created_at);
CREATE INDEX IF NOT EXISTS idx_perspective_formation_receipt_selected_candidates
  ON perspective_formation_receipt_selected_candidates(receipt_id, candidate_kind);
CREATE INDEX IF NOT EXISTS idx_perspective_formation_receipt_omitted_candidates
  ON perspective_formation_receipt_omitted_candidates(receipt_id, candidate_kind);
CREATE INDEX IF NOT EXISTS idx_perspective_formation_receipt_deferred_candidates
  ON perspective_formation_receipt_deferred_candidates(receipt_id, candidate_kind);
CREATE INDEX IF NOT EXISTS idx_perspective_formation_receipt_sources
  ON perspective_formation_receipt_sources(receipt_id, source_ref);
CREATE INDEX IF NOT EXISTS idx_perspective_formation_receipt_activity
  ON perspective_formation_receipt_activity(receipt_id, created_at);
`;

export function ensureFormationReceiptStoreSchemaV01(db: FormationReceiptDbLike): void {
  db.exec(formationReceiptStoreSchemaSqlV01);
}

export function formationReceiptStoreSchemaExistsV01(db: FormationReceiptDbLike): boolean {
  const requiredTables = [
    "perspective_formation_receipts",
    "perspective_formation_receipt_selected_candidates",
    "perspective_formation_receipt_omitted_candidates",
    "perspective_formation_receipt_deferred_candidates",
    "perspective_formation_receipt_sources",
    "perspective_formation_receipt_activity",
  ];
  const rows = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name IN (?, ?, ?, ?, ?, ?)`,
    )
    .all(...requiredTables) as { name: string }[];
  const tableNames = new Set(rows.map((row) => row.name));
  return requiredTables.every((tableName) => tableNames.has(tableName));
}

function validatePromotionDecisionLineageV01(
  input: FormationReceiptCreateInput,
  db: FormationReceiptDbLike,
): {
  passed: boolean;
  status: FormationReceiptStatus;
  reason_codes: FormationReceiptReasonCode[];
} {
  if (!promotionDecisionLineageTablesExistV01(db)) {
    return {
      passed: false,
      status: "blocked_missing_promotion_decision",
      reason_codes: [
        "promotion_decision_store_missing",
        "promotion_decision_ref_missing",
        "formation_receipt_required_before_state_apply",
        "durable_state_not_applied",
        "product_write_denied",
      ],
    };
  }

  const row = db
    .prepare(
      `SELECT
        promotion_decision_id,
        scope,
        decision_kind,
        decision_status,
        operator_actor_ref,
        explicit_user_action_required,
        future_operator_decision_only,
        review_record_ref,
        promotion_executed,
        formation_receipt_written,
        durable_state_applied,
        proof_or_evidence_created,
        claim_or_evidence_written,
        product_write_executed,
        discarded_at
       FROM perspective_promotion_decisions
       WHERE promotion_decision_id = ?`,
    )
    .get(input.promotion_decision_id) as PromotionDecisionLineageRow | undefined;

  if (!row || row.scope !== scope) {
    return {
      passed: false,
      status: "blocked_missing_promotion_decision",
      reason_codes: [
        "promotion_decision_ref_missing",
        "formation_receipt_required_before_state_apply",
        "durable_state_not_applied",
        "product_write_denied",
      ],
    };
  }

  const reasonCodes: FormationReceiptReasonCode[] = [
    "promotion_decision_ref_present",
    "formation_receipt_required_before_state_apply",
    "durable_state_not_applied",
    "promotion_not_executed",
    "proof_not_created",
    "evidence_not_created",
    "claim_evidence_not_written",
    "product_write_denied",
  ];

  let status: FormationReceiptStatus = "blocked_invalid_input";
  if (row.discarded_at) reasonCodes.push("promotion_decision_discarded");
  if (row.decision_kind !== "promote") reasonCodes.push("promotion_decision_not_promote");
  if (row.decision_status !== "eligible_for_future_operator_decision") {
    reasonCodes.push("promotion_decision_not_eligible");
  }
  if (row.review_record_ref !== input.review_record_ref) {
    reasonCodes.push("promotion_decision_review_record_mismatch");
  }
  if (row.operator_actor_ref !== input.operator_actor_ref) {
    reasonCodes.push("promotion_decision_operator_mismatch");
  }
  if (row.formation_receipt_written !== 0) {
    reasonCodes.push("promotion_decision_receipt_already_written");
  }
  if (
    row.explicit_user_action_required !== 1 ||
    row.future_operator_decision_only !== 1 ||
    row.promotion_executed !== 0 ||
    row.durable_state_applied !== 0 ||
    row.proof_or_evidence_created !== 0 ||
    row.claim_or_evidence_written !== 0 ||
    row.product_write_executed !== 0
  ) {
    status = "blocked_forbidden_authority";
    reasonCodes.push("promotion_decision_forbidden_authority");
  }

  const backedSourceRefs = readPromotionDecisionBasisSourceRefsV01(input.promotion_decision_id, db);
  const selectedSourceRefs = input.selected_source_refs.map((source) => source.source_ref);
  if (!selectedSourceRefs.every((sourceRef) => backedSourceRefs.has(sourceRef))) {
    reasonCodes.push("promotion_decision_source_ref_mismatch", "selected_source_ref_missing");
  }

  const blockingReasonCodes = reasonCodes.filter((reasonCode) =>
    [
      "promotion_decision_discarded",
      "promotion_decision_not_promote",
      "promotion_decision_not_eligible",
      "promotion_decision_review_record_mismatch",
      "promotion_decision_operator_mismatch",
      "promotion_decision_source_ref_mismatch",
      "promotion_decision_receipt_already_written",
      "promotion_decision_forbidden_authority",
    ].includes(reasonCode),
  );
  if (blockingReasonCodes.length > 0) {
    return { passed: false, status, reason_codes: uniqueSorted(reasonCodes) };
  }

  return { passed: true, status: "ready_to_write", reason_codes: uniqueSorted(reasonCodes) };
}

function promotionDecisionLineageTablesExistV01(db: FormationReceiptDbLike): boolean {
  const requiredTables = [
    "perspective_promotion_decisions",
    "perspective_promotion_decision_basis_refs",
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

function readPromotionDecisionBasisSourceRefsV01(
  promotionDecisionId: string,
  db: FormationReceiptDbLike,
): Set<string> {
  const rows = db
    .prepare(
      `SELECT source_refs_json
       FROM perspective_promotion_decision_basis_refs
       WHERE promotion_decision_id = ?`,
    )
    .all(promotionDecisionId) as PromotionDecisionBasisLineageRow[];
  return new Set(rows.flatMap((row) => parseStringArray(row.source_refs_json)));
}

export function createFormationReceiptV01(
  input: FormationReceiptCreateInput,
  db: FormationReceiptDbLike,
): FormationReceiptStoreResult {
  const validation = validateFormationReceiptCreateInputForStoreV01(input);
  if (!validation.passed) {
    return blockedResult(statusForValidationFailures(validation.failure_codes));
  }

  const promotionDecisionLineage = validatePromotionDecisionLineageV01(input, db);
  if (!promotionDecisionLineage.passed) {
    return blockedResult(promotionDecisionLineage.status, promotionDecisionLineage.reason_codes);
  }

  const record = normalizeCreateInputToRecord(input);
  ensureFormationReceiptStoreSchemaV01(db);
  let transactionStarted = false;
  try {
    db.prepare("BEGIN IMMEDIATE").run();
    transactionStarted = true;
    insertReceiptRecord(db, record);
    for (const candidate of record.selected_candidate_refs) {
      insertCandidateRef(db, "perspective_formation_receipt_selected_candidates", record.receipt_id, candidate);
    }
    for (const candidate of record.omitted_candidate_refs) {
      insertCandidateRef(db, "perspective_formation_receipt_omitted_candidates", record.receipt_id, candidate);
    }
    for (const candidate of record.deferred_candidate_refs) {
      insertCandidateRef(db, "perspective_formation_receipt_deferred_candidates", record.receipt_id, candidate);
    }
    for (const source of record.selected_source_refs) insertSourceRef(db, record.receipt_id, source);
    insertActivityRecord(
      db,
      normalizeActivityInput({
        activity_id: `${record.receipt_id}:activity:written`,
        receipt_id: record.receipt_id,
        activity_kind: "formation_receipt_written",
        actor_ref: record.operator_actor_ref,
        summary: "Formation Receipt written for explicit operator-reviewed promotion decision.",
        reason_codes: [
          "formation_receipt_written",
          "formation_receipt_required_before_state_apply",
          "durable_state_not_applied",
          "product_write_denied",
        ],
        created_at: record.created_at,
      }),
    );
    db.prepare("COMMIT").run();
    transactionStarted = false;
    return result("written", record, [record], listActivitiesForReceipt(db, record.receipt_id), [
      "formation_receipt_written",
      "db_write_executed_for_receipt_only",
      "formation_receipt_required_before_state_apply",
      "durable_state_not_applied",
      "promotion_not_executed",
      "product_write_denied",
    ]);
  } catch {
    if (transactionStarted) {
      try {
        db.prepare("ROLLBACK").run();
      } catch {
        // Rollback failure still returns a bounded blocked result.
      }
    }
    return blockedResult("blocked_invalid_input");
  }
}

export function readFormationReceiptV01(
  receiptId: string,
  db: FormationReceiptDbLike,
): FormationReceiptStoreResult {
  if (!isSafeString(receiptId)) return blockedResult("blocked_private_or_raw_payload");
  const record = readReceiptById(db, receiptId);
  if (!record) return result("not_found", null, [], [], ["promotion_decision_ref_present"]);
  return result(
    record.discarded_at ? "discarded" : "written",
    record,
    [record],
    listActivitiesForReceipt(db, receiptId),
    ["formation_receipt_written", "durable_state_not_applied", "promotion_not_executed"],
  );
}

export function listFormationReceiptsV01(
  filters: FormationReceiptListFilters,
  db: FormationReceiptDbLike,
): FormationReceiptStoreResult {
  if (filters.promotion_decision_id && hasUnsafeString(filters.promotion_decision_id)) {
    return blockedResult("blocked_private_or_raw_payload");
  }
  if (filters.review_record_ref && hasUnsafeString(filters.review_record_ref)) {
    return blockedResult("blocked_private_or_raw_payload");
  }

  const clauses = ["scope = ?"];
  const params: unknown[] = [scope];
  if (filters.promotion_decision_id) {
    clauses.push("promotion_decision_id = ?");
    params.push(filters.promotion_decision_id);
  }
  if (filters.review_record_ref) {
    clauses.push("review_record_ref = ?");
    params.push(filters.review_record_ref);
  }
  if (!filters.include_discarded) clauses.push("discarded_at IS NULL");
  const rows = db
    .prepare(
      `SELECT * FROM perspective_formation_receipts WHERE ${clauses.join(
        " AND ",
      )} ORDER BY created_at ASC, receipt_id ASC`,
    )
    .all(...params) as FormationReceiptRow[];
  const records = rows.map((row) => rowToRecord(row, readReceiptRefs(db, row.receipt_id)));
  return result(
    "written",
    records[0] ?? null,
    records,
    [],
    ["formation_receipt_written", "durable_state_not_applied", "promotion_not_executed"],
  );
}

export function discardFormationReceiptV01(
  receiptId: string,
  reason: string,
  db: FormationReceiptDbLike,
): FormationReceiptStoreResult {
  if (!isSafeString(receiptId) || !isSafeString(reason)) {
    return blockedResult("blocked_private_or_raw_payload");
  }
  ensureFormationReceiptStoreSchemaV01(db);
  const record = readReceiptById(db, receiptId);
  if (!record) return result("not_found", null, [], [], ["promotion_decision_ref_present"]);
  const discardedAt = record.discarded_at ?? record.updated_at;
  db.prepare(
    `UPDATE perspective_formation_receipts
     SET receipt_status = ?, discarded_at = ?, discard_reason = ?, updated_at = ?
     WHERE receipt_id = ?`,
  ).run("discarded", discardedAt, reason, discardedAt, receiptId);
  appendFormationReceiptActivityV01(
    {
      activity_id: `${receiptId}:activity:discarded`,
      receipt_id: receiptId,
      activity_kind: "formation_receipt_discarded",
      actor_ref: record.operator_actor_ref,
      summary: "Formation Receipt discarded as lifecycle transition only.",
      reason_codes: [
        "formation_receipt_is_not_proof",
        "formation_receipt_is_not_evidence",
        "durable_state_not_applied",
      ],
      created_at: discardedAt,
    },
    db,
  );
  const discarded = readReceiptById(db, receiptId);
  return result(
    "discarded",
    discarded,
    discarded ? [discarded] : [],
    listActivitiesForReceipt(db, receiptId),
    ["formation_receipt_written", "durable_state_not_applied", "promotion_not_executed"],
  );
}

export function appendFormationReceiptActivityV01(
  input: FormationReceiptActivityInput,
  db: FormationReceiptDbLike,
): FormationReceiptStoreResult {
  const failureCodes: string[] = [];
  if (!isSafeString(input.activity_id)) failureCodes.push("activity_id_invalid");
  if (!isSafeString(input.receipt_id)) failureCodes.push("receipt_id_invalid");
  if (!allowedActivityKinds.includes(input.activity_kind)) failureCodes.push("activity_kind_invalid");
  if (!isSafeString(input.actor_ref)) failureCodes.push("actor_ref_invalid");
  if (!isSafeString(input.summary)) failureCodes.push("summary_invalid");
  if (!Array.isArray(input.reason_codes)) failureCodes.push("reason_codes_invalid");
  failureCodes.push(...validatePublicSafeValue(input.reason_codes, "reason_codes"));
  if (failureCodes.length > 0) return blockedResult("blocked_private_or_raw_payload");

  ensureFormationReceiptStoreSchemaV01(db);
  if (!formationReceiptExists(db, input.receipt_id)) {
    return result("not_found", null, [], [], ["promotion_decision_ref_present"]);
  }
  const activity = normalizeActivityInput(input);
  try {
    insertActivityRecord(db, activity);
  } catch {
    return blockedResult("blocked_invalid_input");
  }
  return result("written", null, [], [activity], ["db_write_executed_for_receipt_only"]);
}

export function isSafeFormationReceiptRouteDbPathV01(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  if (value.includes("\\") || value.includes("//") || value.includes("..") || value.includes("\0")) {
    return false;
  }
  if (!safeRouteDbPathPrefixes.some((prefix) => value.startsWith(prefix))) return false;
  return !hasUnsafeString(value);
}

function validateFormationReceiptCreateInputForStoreV01(input: unknown): {
  passed: boolean;
  failure_codes: string[];
} {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const value = input as Partial<FormationReceiptCreateInput>;
  const failureCodes: string[] = [];
  if (value.builder_version !== FORMATION_RECEIPT_BUILDER_VERSION) failureCodes.push("builder_version_invalid");
  if (value.record_version !== FORMATION_RECEIPT_RECORD_VERSION) failureCodes.push("record_version_invalid");
  if (value.scope !== scope) failureCodes.push("scope_invalid");
  if (!isSafeString(value.receipt_id)) failureCodes.push("receipt_id_invalid");
  if (!isSafeString(value.promotion_decision_id)) failureCodes.push("promotion_decision_ref_missing");
  if (!isSafeString(value.review_record_ref)) failureCodes.push("review_record_ref_missing");
  if (!isSafeString(value.operator_actor_ref)) failureCodes.push("operator_actor_ref_missing");
  if (!isSafeString(value.geometry_digest_ref)) failureCodes.push("geometry_digest_ref_invalid");
  if (!isSafeString(value.context_packet_ref)) failureCodes.push("context_packet_ref_invalid");

  const selectedCandidates = arrayOrEmpty(value.selected_candidate_refs);
  const omittedCandidates = arrayOrEmpty(value.omitted_candidate_refs);
  const deferredCandidates = arrayOrEmpty(value.deferred_candidate_refs);
  const selectedSources = arrayOrEmpty(value.selected_source_refs);
  if (selectedCandidates.length === 0) failureCodes.push("selected_candidate_ref_missing");
  if (selectedSources.length === 0) failureCodes.push("selected_source_ref_missing");
  failureCodes.push(...validateCandidateRefs(selectedCandidates, "selected_candidate_refs", "selected"));
  failureCodes.push(...validateCandidateRefs(omittedCandidates, "omitted_candidate_refs", "omitted"));
  failureCodes.push(...validateCandidateRefs(deferredCandidates, "deferred_candidate_refs", "deferred"));
  failureCodes.push(...validateSourceRefs(selectedSources, "selected_source_refs"));
  failureCodes.push(...validateDuplicateCandidateIds(value.receipt_id, selectedCandidates, "selected"));
  failureCodes.push(...validateDuplicateCandidateIds(value.receipt_id, omittedCandidates, "omitted"));
  failureCodes.push(...validateDuplicateCandidateIds(value.receipt_id, deferredCandidates, "deferred"));
  failureCodes.push(...validateDuplicateSourceIds(value.receipt_id, selectedSources));

  for (const key of [
    "agent_substrate_warning_refs",
    "feedback_event_refs",
    "unresolved_tensions_preserved",
    "knowledge_gaps_preserved",
    "boundary_acknowledgements",
    "reason_codes",
    "boundary_notes",
  ] as const) {
    if (!Array.isArray(value[key])) {
      failureCodes.push(`${key}_invalid`);
    } else {
      failureCodes.push(...validatePublicSafeValue(value[key], key));
    }
  }

  for (const [field, fieldValue] of Object.entries(value)) {
    if (
      [
        "selected_candidate_refs",
        "omitted_candidate_refs",
        "deferred_candidate_refs",
        "selected_source_refs",
      ].includes(field)
    ) {
      continue;
    }
    failureCodes.push(...validatePublicSafeValue(fieldValue, field));
  }
  failureCodes.push(...validateInputAuthorityBoundary(value.authority_boundary));
  return { passed: failureCodes.length === 0, failure_codes: uniqueSorted(failureCodes) };
}

function statusForValidationFailures(failureCodes: string[]): FormationReceiptStatus {
  if (failureCodes.some((code) => code.includes("private") || code.includes("raw") || code.includes("unsafe"))) {
    return "blocked_private_or_raw_payload";
  }
  if (failureCodes.includes("promotion_decision_ref_missing")) return "blocked_missing_promotion_decision";
  if (failureCodes.includes("review_record_ref_missing")) return "blocked_missing_review_record";
  if (failureCodes.includes("selected_source_ref_missing")) return "blocked_missing_selected_source_refs";
  if (failureCodes.includes("selected_candidate_ref_missing")) return "blocked_missing_selected_candidates";
  if (failureCodes.some((code) => code.startsWith("authority_boundary_forbidden"))) {
    return "blocked_forbidden_authority";
  }
  return "blocked_invalid_input";
}

function normalizeCreateInputToRecord(input: FormationReceiptCreateInput): FormationReceiptRecord {
  const createdAt = input.created_at ?? "2026-06-26T00:00:00.000Z";
  return {
    record_version: FORMATION_RECEIPT_RECORD_VERSION,
    builder_version: FORMATION_RECEIPT_BUILDER_VERSION,
    scope,
    receipt_id: input.receipt_id,
    promotion_decision_id: input.promotion_decision_id,
    review_record_ref: input.review_record_ref,
    operator_actor_ref: input.operator_actor_ref,
    receipt_status: "written",
    selected_candidate_refs: normalizeCandidateRefs(input.selected_candidate_refs),
    omitted_candidate_refs: normalizeCandidateRefs(input.omitted_candidate_refs),
    deferred_candidate_refs: normalizeCandidateRefs(input.deferred_candidate_refs),
    selected_source_refs: normalizeSourceRefs(input.selected_source_refs),
    geometry_digest_ref: input.geometry_digest_ref,
    agent_substrate_warning_refs: uniqueSorted(input.agent_substrate_warning_refs),
    context_packet_ref: input.context_packet_ref,
    feedback_event_refs: uniqueSorted(input.feedback_event_refs),
    unresolved_tensions_preserved: uniqueSorted(input.unresolved_tensions_preserved),
    knowledge_gaps_preserved: uniqueSorted(input.knowledge_gaps_preserved),
    boundary_acknowledgements: uniqueSorted(input.boundary_acknowledgements),
    formation_receipt_written: true,
    durable_state_applied: false,
    promotion_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    reason_codes: uniqueSorted([
      ...input.reason_codes,
      "promotion_decision_ref_present",
      "review_record_ref_present",
      "selected_candidate_ref_present",
      "selected_source_ref_present",
      "formation_receipt_written",
      "formation_receipt_required_before_state_apply",
      "formation_receipt_is_not_proof",
      "formation_receipt_is_not_evidence",
      "formation_receipt_is_not_state_apply",
      "durable_state_not_applied",
      "promotion_not_executed",
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
      "db_write_executed_for_receipt_only",
      "git_ledger_export_not_executed",
    ]),
    boundary_notes: uniqueSorted(input.boundary_notes),
    authority_boundary: createFormationReceiptAuthorityBoundaryV01(),
    created_at: createdAt,
    updated_at: input.updated_at ?? createdAt,
    discarded_at: null,
    discard_reason: null,
  };
}

function insertReceiptRecord(db: FormationReceiptDbLike, record: FormationReceiptRecord): void {
  db.prepare(
    `INSERT INTO perspective_formation_receipts (
      receipt_id,
      scope,
      promotion_decision_id,
      review_record_ref,
      operator_actor_ref,
      receipt_status,
      formation_receipt_written,
      durable_state_applied,
      promotion_executed,
      proof_or_evidence_created,
      claim_or_evidence_written,
      product_write_executed,
      geometry_digest_ref,
      agent_substrate_warning_refs_json,
      context_packet_ref,
      feedback_event_refs_json,
      unresolved_tensions_preserved_json,
      knowledge_gaps_preserved_json,
      boundary_acknowledgements_json,
      authority_boundary_json,
      reason_codes_json,
      boundary_notes_json,
      created_at,
      updated_at,
      discarded_at,
      discard_reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.receipt_id,
    record.scope,
    record.promotion_decision_id,
    record.review_record_ref,
    record.operator_actor_ref,
    record.receipt_status,
    1,
    0,
    0,
    0,
    0,
    0,
    record.geometry_digest_ref,
    JSON.stringify(record.agent_substrate_warning_refs),
    record.context_packet_ref,
    JSON.stringify(record.feedback_event_refs),
    JSON.stringify(record.unresolved_tensions_preserved),
    JSON.stringify(record.knowledge_gaps_preserved),
    JSON.stringify(record.boundary_acknowledgements),
    JSON.stringify(record.authority_boundary),
    JSON.stringify(record.reason_codes),
    JSON.stringify(record.boundary_notes),
    record.created_at,
    record.updated_at,
    record.discarded_at,
    record.discard_reason,
  );
}

function insertCandidateRef(
  db: FormationReceiptDbLike,
  tableName: string,
  receiptId: string,
  candidate: FormationReceiptCandidateRef,
): void {
  db.prepare(
    `INSERT INTO ${tableName} (
      id,
      receipt_id,
      candidate_ref,
      candidate_kind,
      bounded_summary,
      source_refs_json,
      reason_codes_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    `${receiptId}:${candidate.disposition}:${candidate.candidate_ref}`,
    receiptId,
    candidate.candidate_ref,
    candidate.candidate_kind,
    candidate.bounded_summary,
    JSON.stringify(uniqueSorted(candidate.source_refs)),
    JSON.stringify(uniqueSorted(candidate.reason_codes)),
  );
}

function insertSourceRef(
  db: FormationReceiptDbLike,
  receiptId: string,
  source: FormationReceiptSourceRef,
): void {
  db.prepare(
    `INSERT INTO perspective_formation_receipt_sources (
      id,
      receipt_id,
      source_ref,
      bounded_summary,
      reason_codes_json
    ) VALUES (?, ?, ?, ?, ?)`,
  ).run(
    `${receiptId}:source:${source.source_ref}`,
    receiptId,
    source.source_ref,
    source.bounded_summary,
    JSON.stringify(uniqueSorted(source.reason_codes)),
  );
}

function insertActivityRecord(
  db: FormationReceiptDbLike,
  activity: FormationReceiptActivityRecord,
): void {
  db.prepare(
    `INSERT OR IGNORE INTO perspective_formation_receipt_activity (
      activity_id,
      receipt_id,
      activity_kind,
      actor_ref,
      summary,
      reason_codes_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    activity.activity_id,
    activity.receipt_id,
    activity.activity_kind,
    activity.actor_ref,
    activity.summary,
    JSON.stringify(activity.reason_codes),
    activity.created_at,
  );
}

function readReceiptById(
  db: FormationReceiptDbLike,
  receiptId: string,
): FormationReceiptRecord | null {
  const row = db
    .prepare("SELECT * FROM perspective_formation_receipts WHERE receipt_id = ?")
    .get(receiptId) as FormationReceiptRow | undefined;
  if (!row) return null;
  return rowToRecord(row, readReceiptRefs(db, receiptId));
}

function readReceiptRefs(db: FormationReceiptDbLike, receiptId: string): {
  selected: FormationReceiptCandidateRef[];
  omitted: FormationReceiptCandidateRef[];
  deferred: FormationReceiptCandidateRef[];
  sources: FormationReceiptSourceRef[];
} {
  return {
    selected: readCandidateRefs(db, "perspective_formation_receipt_selected_candidates", "selected", receiptId),
    omitted: readCandidateRefs(db, "perspective_formation_receipt_omitted_candidates", "omitted", receiptId),
    deferred: readCandidateRefs(db, "perspective_formation_receipt_deferred_candidates", "deferred", receiptId),
    sources: readSourceRefs(db, receiptId),
  };
}

function readCandidateRefs(
  db: FormationReceiptDbLike,
  tableName: string,
  disposition: FormationReceiptCandidateRef["disposition"],
  receiptId: string,
): FormationReceiptCandidateRef[] {
  const rows = db
    .prepare(
      `SELECT * FROM ${tableName}
       WHERE receipt_id = ?
       ORDER BY candidate_ref ASC, candidate_kind ASC`,
    )
    .all(receiptId) as FormationReceiptCandidateRow[];
  return rows.map((row) => ({
    disposition,
    candidate_kind: row.candidate_kind,
    candidate_ref: row.candidate_ref,
    bounded_summary: row.bounded_summary,
    source_refs: parseStringArray(row.source_refs_json),
    reason_codes: parseStringArray(row.reason_codes_json) as FormationReceiptReasonCode[],
  }));
}

function readSourceRefs(
  db: FormationReceiptDbLike,
  receiptId: string,
): FormationReceiptSourceRef[] {
  const rows = db
    .prepare(
      `SELECT * FROM perspective_formation_receipt_sources
       WHERE receipt_id = ?
       ORDER BY source_ref ASC`,
    )
    .all(receiptId) as FormationReceiptSourceRow[];
  return rows.map((row) => ({
    source_ref: row.source_ref,
    bounded_summary: row.bounded_summary,
    reason_codes: parseStringArray(row.reason_codes_json) as FormationReceiptReasonCode[],
  }));
}

function listActivitiesForReceipt(
  db: FormationReceiptDbLike,
  receiptId: string,
): FormationReceiptActivityRecord[] {
  const rows = db
    .prepare(
      `SELECT * FROM perspective_formation_receipt_activity
       WHERE receipt_id = ?
       ORDER BY created_at ASC, activity_id ASC`,
    )
    .all(receiptId) as FormationReceiptActivityRow[];
  return rows.map(rowToActivity);
}

function rowToRecord(
  row: FormationReceiptRow,
  refs: {
    selected: FormationReceiptCandidateRef[];
    omitted: FormationReceiptCandidateRef[];
    deferred: FormationReceiptCandidateRef[];
    sources: FormationReceiptSourceRef[];
  },
): FormationReceiptRecord {
  return {
    record_version: FORMATION_RECEIPT_RECORD_VERSION,
    builder_version: FORMATION_RECEIPT_BUILDER_VERSION,
    scope,
    receipt_id: row.receipt_id,
    promotion_decision_id: row.promotion_decision_id,
    review_record_ref: row.review_record_ref,
    operator_actor_ref: row.operator_actor_ref,
    receipt_status: row.discarded_at ? "discarded" : row.receipt_status,
    selected_candidate_refs: refs.selected,
    omitted_candidate_refs: refs.omitted,
    deferred_candidate_refs: refs.deferred,
    selected_source_refs: refs.sources,
    geometry_digest_ref: row.geometry_digest_ref,
    agent_substrate_warning_refs: parseStringArray(row.agent_substrate_warning_refs_json),
    context_packet_ref: row.context_packet_ref,
    feedback_event_refs: parseStringArray(row.feedback_event_refs_json),
    unresolved_tensions_preserved: parseStringArray(row.unresolved_tensions_preserved_json),
    knowledge_gaps_preserved: parseStringArray(row.knowledge_gaps_preserved_json),
    boundary_acknowledgements: parseStringArray(row.boundary_acknowledgements_json),
    formation_receipt_written: true,
    durable_state_applied: false,
    promotion_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    reason_codes: parseStringArray(row.reason_codes_json) as FormationReceiptReasonCode[],
    boundary_notes: parseStringArray(row.boundary_notes_json),
    authority_boundary: createFormationReceiptAuthorityBoundaryV01(),
    created_at: row.created_at,
    updated_at: row.updated_at,
    discarded_at: row.discarded_at,
    discard_reason: row.discard_reason,
  };
}

function rowToActivity(row: FormationReceiptActivityRow): FormationReceiptActivityRecord {
  return {
    activity_version: FORMATION_RECEIPT_ACTIVITY_VERSION,
    builder_version: FORMATION_RECEIPT_BUILDER_VERSION,
    scope,
    activity_id: row.activity_id,
    receipt_id: row.receipt_id,
    activity_kind: row.activity_kind,
    actor_ref: row.actor_ref,
    summary: row.summary,
    reason_codes: parseStringArray(row.reason_codes_json) as FormationReceiptReasonCode[],
    created_at: row.created_at,
    authority_boundary: createFormationReceiptAuthorityBoundaryV01(),
  };
}

function normalizeActivityInput(input: FormationReceiptActivityInput): FormationReceiptActivityRecord {
  return {
    activity_version: FORMATION_RECEIPT_ACTIVITY_VERSION,
    builder_version: FORMATION_RECEIPT_BUILDER_VERSION,
    scope,
    activity_id: input.activity_id,
    receipt_id: input.receipt_id,
    activity_kind: input.activity_kind,
    actor_ref: input.actor_ref,
    summary: input.summary,
    reason_codes: uniqueSorted(input.reason_codes),
    created_at: input.created_at ?? "2026-06-26T00:00:00.000Z",
    authority_boundary: createFormationReceiptAuthorityBoundaryV01(),
  };
}

function formationReceiptExists(db: FormationReceiptDbLike, receiptId: string): boolean {
  const row = db
    .prepare("SELECT receipt_id FROM perspective_formation_receipts WHERE receipt_id = ?")
    .get(receiptId) as { receipt_id: string } | undefined;
  return Boolean(row);
}

function result(
  status: FormationReceiptStoreStatus,
  record: FormationReceiptRecord | null,
  records: FormationReceiptRecord[],
  activities: FormationReceiptActivityRecord[],
  reasonCodes: FormationReceiptReasonCode[],
): FormationReceiptStoreResult {
  return {
    store_version: FORMATION_RECEIPT_STORE_VERSION,
    builder_version: FORMATION_RECEIPT_BUILDER_VERSION,
    record_version: FORMATION_RECEIPT_RECORD_VERSION,
    activity_version: FORMATION_RECEIPT_ACTIVITY_VERSION,
    scope,
    status,
    record,
    records,
    activities,
    error_code: status.startsWith("blocked") || status === "not_found" ? status : null,
    reason_codes: uniqueSorted(reasonCodes),
    formation_receipt_written: status === "written" || status === "discarded",
    durable_state_applied: false,
    promotion_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createFormationReceiptAuthorityBoundaryV01(),
  };
}

function blockedResult(
  status: FormationReceiptStoreStatus,
  overrideReasonCodes?: FormationReceiptReasonCode[],
): FormationReceiptStoreResult {
  const reasonCodesByStatus: Record<FormationReceiptStoreStatus, FormationReceiptReasonCode[]> = {
    receipt_candidate: [],
    ready_to_write: [],
    written: [],
    discarded: [],
    not_found: ["promotion_decision_ref_present"],
    blocked_invalid_input: ["promotion_decision_ref_present"],
    blocked_missing_promotion_decision: ["promotion_decision_ref_missing"],
    blocked_missing_review_record: ["review_record_ref_missing"],
    blocked_missing_selected_source_refs: ["selected_source_ref_missing"],
    blocked_missing_selected_candidates: ["selected_candidate_ref_missing"],
    blocked_forbidden_authority: ["product_write_denied"],
    blocked_private_or_raw_payload: [
      "private_or_raw_payload_blocked",
      "secret_like_pattern_blocked",
      "local_path_blocked",
      "private_url_blocked",
    ],
  };
  return result(status, null, [], [], overrideReasonCodes ?? reasonCodesByStatus[status]);
}

function validateCandidateRefs(
  refs: unknown[],
  path: string,
  expectedDisposition: FormationReceiptCandidateDisposition,
): string[] {
  return refs.flatMap((ref, index) => {
    const failureCodes: string[] = [];
    if (!ref || typeof ref !== "object" || Array.isArray(ref)) return [`${path}.${index}_invalid`];
    const value = ref as Partial<FormationReceiptCandidateRef>;
    if (value.disposition !== expectedDisposition) {
      failureCodes.push(`${path}.${index}.disposition_invalid`);
    }
    if (!allowedCandidateDispositions.includes(value.disposition as FormationReceiptCandidateDisposition)) {
      failureCodes.push(`${path}.${index}.disposition_unknown`);
    }
    if (!allowedCandidateKinds.includes(value.candidate_kind as FormationReceiptCandidateKind)) {
      failureCodes.push(`${path}.${index}.candidate_kind_invalid`);
    }
    failureCodes.push(...validateRequiredSafeString(value.candidate_ref, `${path}.${index}.candidate_ref`));
    failureCodes.push(...validateRequiredSafeString(value.bounded_summary, `${path}.${index}.bounded_summary`));
    if (!Array.isArray(value.source_refs)) {
      failureCodes.push(`${path}.${index}.source_refs_invalid`);
    } else {
      failureCodes.push(...validatePublicSafeValue(value.source_refs, `${path}.${index}.source_refs`));
    }
    if (!Array.isArray(value.reason_codes)) {
      failureCodes.push(`${path}.${index}.reason_codes_invalid`);
    } else {
      failureCodes.push(...validatePublicSafeValue(value.reason_codes, `${path}.${index}.reason_codes`));
    }
    return failureCodes;
  });
}

function validateSourceRefs(refs: unknown[], path: string): string[] {
  return refs.flatMap((ref, index) => {
    const failureCodes: string[] = [];
    if (!ref || typeof ref !== "object" || Array.isArray(ref)) return [`${path}.${index}_invalid`];
    const value = ref as Partial<FormationReceiptSourceRef>;
    failureCodes.push(...validateRequiredSafeString(value.source_ref, `${path}.${index}.source_ref`));
    failureCodes.push(...validateRequiredSafeString(value.bounded_summary, `${path}.${index}.bounded_summary`));
    if (!Array.isArray(value.reason_codes)) {
      failureCodes.push(`${path}.${index}.reason_codes_invalid`);
    } else {
      failureCodes.push(...validatePublicSafeValue(value.reason_codes, `${path}.${index}.reason_codes`));
    }
    return failureCodes;
  });
}

function validateDuplicateCandidateIds(
  receiptId: unknown,
  refs: unknown[],
  disposition: FormationReceiptCandidateDisposition,
): string[] {
  if (typeof receiptId !== "string") return [];
  const ids = refs.flatMap((ref) => {
    if (!ref || typeof ref !== "object" || Array.isArray(ref)) return [];
    const candidateRef = (ref as Partial<FormationReceiptCandidateRef>).candidate_ref;
    return typeof candidateRef === "string" && candidateRef.length > 0
      ? [`${receiptId}:${disposition}:${candidateRef}`]
      : [];
  });
  return duplicateValues(ids).length > 0 ? [`${disposition}_candidate_duplicate_id`] : [];
}

function validateDuplicateSourceIds(receiptId: unknown, refs: unknown[]): string[] {
  if (typeof receiptId !== "string") return [];
  const ids = refs.flatMap((ref) => {
    if (!ref || typeof ref !== "object" || Array.isArray(ref)) return [];
    const sourceRef = (ref as Partial<FormationReceiptSourceRef>).source_ref;
    return typeof sourceRef === "string" && sourceRef.length > 0
      ? [`${receiptId}:source:${sourceRef}`]
      : [];
  });
  return duplicateValues(ids).length > 0 ? ["selected_source_duplicate_id"] : [];
}

function validateInputAuthorityBoundary(boundary: unknown): string[] {
  if (boundary === undefined) return [];
  if (!boundary || typeof boundary !== "object" || Array.isArray(boundary)) {
    return ["authority_boundary_invalid"];
  }
  const failureCodes: string[] = [];
  const value = boundary as Record<string, unknown>;
  for (const field of forbiddenAuthorityFields) {
    if (value[field] === true) failureCodes.push(`authority_boundary_forbidden:${field}`);
  }
  return failureCodes;
}

function normalizeCandidateRefs(refs: FormationReceiptCandidateRef[]): FormationReceiptCandidateRef[] {
  return [...refs]
    .map((ref) => ({
      disposition: ref.disposition,
      candidate_kind: ref.candidate_kind,
      candidate_ref: ref.candidate_ref,
      bounded_summary: ref.bounded_summary,
      source_refs: uniqueSorted(ref.source_refs),
      reason_codes: uniqueSorted(ref.reason_codes),
    }))
    .sort(
      (a, b) =>
        a.disposition.localeCompare(b.disposition) ||
        a.candidate_ref.localeCompare(b.candidate_ref) ||
        a.candidate_kind.localeCompare(b.candidate_kind),
    );
}

function normalizeSourceRefs(refs: FormationReceiptSourceRef[]): FormationReceiptSourceRef[] {
  return [...refs]
    .map((ref) => ({
      source_ref: ref.source_ref,
      bounded_summary: ref.bounded_summary,
      reason_codes: uniqueSorted(ref.reason_codes),
    }))
    .sort((a, b) => a.source_ref.localeCompare(b.source_ref));
}

function validateRequiredSafeString(value: unknown, path: string): string[] {
  if (typeof value !== "string" || value.length === 0) return [`${path}_invalid`];
  return hasUnsafeString(value) ? [`${path}_unsafe_private_or_raw_marker`] : [];
}

function validatePublicSafeValue(value: unknown, path: string): string[] {
  if (typeof value === "string") {
    return hasUnsafeString(value) ? [`${path}_unsafe_private_or_raw_marker`] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => validatePublicSafeValue(item, `${path}.${index}`));
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) =>
    validatePublicSafeValue(nested, `${path}.${key}`),
  );
}

function isSafeString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !hasUnsafeString(value);
}

function hasUnsafeString(value: string): boolean {
  return unsafeStringPatterns.some((pattern) => pattern.test(value));
}

function parseStringArray(value: string): string[] {
  const parsed = JSON.parse(value) as unknown;
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

function arrayOrEmpty(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort();
}

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    } else {
      seen.add(value);
    }
  }
  return [...duplicates].sort();
}
