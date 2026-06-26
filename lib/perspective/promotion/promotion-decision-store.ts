import type {
  PerspectivePromotionBasisRef,
  PerspectivePromotionDecisionKind,
  PerspectivePromotionDecisionStatus,
  PerspectivePromotionFormationReceiptPolicy,
  PerspectivePromotionKnowledgeGapPolicy,
  PerspectivePromotionReasonCode,
  PerspectivePromotionTensionPolicy,
} from "../../../types/perspective-promotion-runtime-contract";

export const PROMOTION_DECISION_STORE_VERSION = "promotion_decision_store.v0.1" as const;
export const PROMOTION_DECISION_RECORD_VERSION = "promotion_decision_record.v0.1" as const;
export const PROMOTION_DECISION_ACTIVITY_VERSION = "promotion_decision_activity.v0.1" as const;

export type PromotionDecisionStoreStatus =
  | "stored"
  | "discarded"
  | "blocked_invalid_input"
  | "blocked_missing_review_record"
  | "blocked_missing_source_refs"
  | "blocked_missing_basis_refs"
  | "blocked_forbidden_authority"
  | "blocked_private_or_raw_payload"
  | "not_found";

export type PromotionDecisionActivityKind =
  | "decision_record_created"
  | "decision_record_read"
  | "decision_record_listed"
  | "decision_record_discarded"
  | "decision_record_rejected_invalid_input"
  | "unknown";

export type PromotionDecisionStoreReasonCode =
  | "contract_ref_present"
  | "review_record_ref_present"
  | "review_record_ref_missing"
  | "source_ref_present"
  | "source_ref_missing"
  | "basis_ref_present"
  | "basis_ref_missing"
  | "operator_actor_present"
  | "operator_actor_missing"
  | "explicit_user_action_required"
  | "future_operator_decision_only"
  | "promotion_decision_record_written"
  | "promotion_not_executed"
  | "formation_receipt_not_written"
  | "durable_state_not_applied"
  | "proof_not_created"
  | "evidence_not_created"
  | "claim_evidence_not_written"
  | "product_write_denied"
  | "forbidden_authority_blocked"
  | "private_or_raw_payload_blocked"
  | "secret_like_pattern_blocked"
  | "local_path_blocked"
  | "private_url_blocked"
  | "provider_call_not_executed"
  | "prompt_not_sent"
  | "retrieval_not_executed"
  | "rag_answer_not_generated"
  | "source_fetch_not_executed"
  | "file_read_not_executed"
  | "db_write_executed_for_decision_record_only"
  | "state_apply_not_executed"
  | "git_ledger_export_not_executed";

export interface PromotionDecisionAuthorityBoundary {
  explicit_operator_decision_record_storage_only: true;
  promotion_runtime_now: false;
  promotion_decision_record_write_now: true;
  promotion_route_now: boolean;
  promotion_store_now: true;
  formation_receipt_write_now: false;
  durable_perspective_state_apply_now: false;
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
  source_of_truth: false;
  candidate_is_fact: false;
  candidate_is_proof: false;
  candidate_is_accepted_evidence: false;
  provider_output_is_truth: false;
  retrieval_result_is_evidence: false;
  rag_context_is_truth: false;
  feedback_is_truth: false;
  ci_pass_is_proof: false;
  smoke_pass_is_proof: false;
  pr_body_is_authority: false;
  git_ref_is_authority: false;
}

export interface PromotionDecisionRecord {
  record_version: typeof PROMOTION_DECISION_RECORD_VERSION;
  store_version: typeof PROMOTION_DECISION_STORE_VERSION;
  contract_version: typeof contractVersion;
  scope: typeof scope;
  promotion_decision_id: string;
  decision_kind: PerspectivePromotionDecisionKind;
  decision_status: PerspectivePromotionDecisionStatus;
  operator_actor_ref: string;
  explicit_user_action_required: true;
  future_operator_decision_only: true;
  review_record_ref: string;
  gate_report_ref: string;
  basis_refs: PerspectivePromotionBasisRef[];
  basis_claim_candidate_refs: string[];
  basis_evidence_candidate_refs: string[];
  perspective_delta_candidate_refs: string[];
  accepted_evidence_refs: string[];
  unresolved_tension_refs: string[];
  knowledge_gap_refs: string[];
  unresolved_tension_policy: PerspectivePromotionTensionPolicy;
  knowledge_gap_policy: PerspectivePromotionKnowledgeGapPolicy;
  formation_receipt_policy: PerspectivePromotionFormationReceiptPolicy;
  promotion_executed: false;
  decision_store_written: true;
  formation_receipt_written: false;
  durable_state_applied: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  product_write_executed: false;
  reason_codes: PromotionDecisionStoreReasonCode[];
  boundary_notes: string[];
  authority_boundary: PromotionDecisionAuthorityBoundary;
  created_at: string;
  updated_at: string;
  discarded_at: string | null;
  discard_reason: string | null;
}

export interface PromotionDecisionCreateInput {
  contract_version: typeof contractVersion;
  scope: typeof scope;
  promotion_decision_id: string;
  decision_kind: PerspectivePromotionDecisionKind;
  decision_status: PerspectivePromotionDecisionStatus;
  operator_actor_ref: string;
  explicit_user_action_required: boolean;
  future_operator_decision_only: boolean;
  review_record_ref: string;
  gate_report_ref: string;
  basis_refs: PerspectivePromotionBasisRef[];
  basis_claim_candidate_refs: string[];
  basis_evidence_candidate_refs: string[];
  perspective_delta_candidate_refs: string[];
  accepted_evidence_refs: string[];
  unresolved_tension_refs: string[];
  knowledge_gap_refs: string[];
  unresolved_tension_policy: PerspectivePromotionTensionPolicy;
  knowledge_gap_policy: PerspectivePromotionKnowledgeGapPolicy;
  formation_receipt_policy: PerspectivePromotionFormationReceiptPolicy;
  promotion_executed?: boolean;
  decision_store_written?: boolean;
  formation_receipt_written?: boolean;
  durable_state_applied?: boolean;
  proof_or_evidence_created?: boolean;
  claim_or_evidence_written?: boolean;
  product_write_executed?: boolean;
  reason_codes: PromotionDecisionStoreReasonCode[];
  boundary_notes: string[];
  authority_boundary?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface PromotionDecisionListFilters {
  decision_status?: PerspectivePromotionDecisionStatus;
  review_record_ref?: string;
  include_discarded?: boolean;
}

export interface PromotionDecisionActivityRecord {
  activity_version: typeof PROMOTION_DECISION_ACTIVITY_VERSION;
  store_version: typeof PROMOTION_DECISION_STORE_VERSION;
  scope: typeof scope;
  activity_id: string;
  promotion_decision_id: string;
  activity_kind: PromotionDecisionActivityKind;
  actor_ref: string;
  summary: string;
  reason_codes: PromotionDecisionStoreReasonCode[];
  created_at: string;
  authority_boundary: PromotionDecisionAuthorityBoundary;
}

export interface PromotionDecisionActivityInput {
  activity_id: string;
  promotion_decision_id: string;
  activity_kind: PromotionDecisionActivityKind;
  actor_ref: string;
  summary: string;
  reason_codes: PromotionDecisionStoreReasonCode[];
  created_at?: string;
}

export interface PromotionDecisionStoreResult {
  store_version: typeof PROMOTION_DECISION_STORE_VERSION;
  record_version: typeof PROMOTION_DECISION_RECORD_VERSION;
  activity_version: typeof PROMOTION_DECISION_ACTIVITY_VERSION;
  contract_version: typeof contractVersion;
  scope: typeof scope;
  status: PromotionDecisionStoreStatus;
  record: PromotionDecisionRecord | null;
  records: PromotionDecisionRecord[];
  activities: PromotionDecisionActivityRecord[];
  error_code: PromotionDecisionStoreStatus | null;
  reason_codes: PromotionDecisionStoreReasonCode[];
  promotion_executed: false;
  decision_store_written: boolean;
  formation_receipt_written: false;
  durable_state_applied: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  product_write_executed: false;
  authority_boundary: PromotionDecisionAuthorityBoundary;
}

export interface PromotionDecisionValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface PromotionDecisionDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

interface PromotionDecisionRow {
  promotion_decision_id: string;
  scope: string;
  decision_kind: PerspectivePromotionDecisionKind;
  decision_status: PerspectivePromotionDecisionStatus;
  operator_actor_ref: string;
  explicit_user_action_required: number;
  future_operator_decision_only: number;
  review_record_ref: string;
  gate_report_ref: string;
  unresolved_tension_policy: PerspectivePromotionTensionPolicy;
  knowledge_gap_policy: PerspectivePromotionKnowledgeGapPolicy;
  formation_receipt_policy: PerspectivePromotionFormationReceiptPolicy;
  promotion_executed: number;
  decision_store_written: number;
  formation_receipt_written: number;
  durable_state_applied: number;
  proof_or_evidence_created: number;
  claim_or_evidence_written: number;
  product_write_executed: number;
  boundary_json: string;
  reason_codes_json: string;
  boundary_notes_json: string;
  basis_claim_candidate_refs_json: string;
  basis_evidence_candidate_refs_json: string;
  perspective_delta_candidate_refs_json: string;
  accepted_evidence_refs_json: string;
  unresolved_tension_refs_json: string;
  knowledge_gap_refs_json: string;
  created_at: string;
  updated_at: string;
  discarded_at: string | null;
  discard_reason: string | null;
}

interface PromotionDecisionBasisRow {
  id: string;
  promotion_decision_id: string;
  basis_id: string;
  basis_kind: PerspectivePromotionBasisRef["basis_kind"];
  basis_ref: string;
  bounded_summary: string;
  source_refs_json: string;
  candidate_refs_json: string;
  review_record_refs_json: string;
  rag_context_preview_refs_json: string;
  retrieval_candidate_refs_json: string;
  provider_candidate_refs_json: string;
  feedback_refs_json: string;
  reason_codes_json: string;
}

interface PromotionDecisionActivityRow {
  activity_id: string;
  promotion_decision_id: string;
  activity_kind: PromotionDecisionActivityKind;
  actor_ref: string;
  summary: string;
  reason_codes_json: string;
  created_at: string;
}

const contractVersion = "perspective_promotion_runtime_contract.v0.1" as const;
const scope = "project:augnes" as const;
const basisVersion = "perspective_promotion_basis.v0.1" as const;

const allowedDecisionKinds: PerspectivePromotionDecisionKind[] = [
  "promote",
  "reject",
  "defer",
  "request_more_evidence",
  "supersede",
  "split_delta",
  "merge_with_existing",
  "unknown",
];

const allowedDecisionStatuses: PerspectivePromotionDecisionStatus[] = [
  "contract_only",
  "candidate_only",
  "eligible_for_future_operator_decision",
  "blocked_missing_review_record",
  "blocked_missing_source_refs",
  "blocked_missing_basis_candidates",
  "blocked_unresolved_tension_policy",
  "blocked_knowledge_gap_policy",
  "blocked_private_or_raw_payload",
  "blocked_forbidden_authority",
  "rejected",
];

const allowedActivityKinds: PromotionDecisionActivityKind[] = [
  "decision_record_created",
  "decision_record_read",
  "decision_record_listed",
  "decision_record_discarded",
  "decision_record_rejected_invalid_input",
  "unknown",
];

const forbiddenAuthorityFields = [
  "promotion_runtime_now",
  "formation_receipt_write_now",
  "durable_perspective_state_apply_now",
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
  "candidate_is_fact",
  "candidate_is_proof",
  "candidate_is_accepted_evidence",
  "provider_output_is_truth",
  "retrieval_result_is_evidence",
  "rag_context_is_truth",
  "feedback_is_truth",
  "ci_pass_is_proof",
  "smoke_pass_is_proof",
  "pr_body_is_authority",
  "git_ref_is_authority",
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
  /raw promotion payload/i,
  /raw promotion decision payload/i,
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
  /secret-like promotion decision input/i,
];

const safeRouteDbPathPrefixes = [
  "tmp/perspective-promotion-decisions/",
  ".tmp/perspective-promotion-decisions/",
] as const;

export const promotionDecisionStoreSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS perspective_promotion_decisions (
  promotion_decision_id text primary key,
  scope text not null,
  decision_kind text not null,
  decision_status text not null,
  operator_actor_ref text not null,
  explicit_user_action_required integer not null,
  future_operator_decision_only integer not null,
  review_record_ref text not null,
  gate_report_ref text not null,
  unresolved_tension_policy text not null,
  knowledge_gap_policy text not null,
  formation_receipt_policy text not null,
  promotion_executed integer not null default 0,
  decision_store_written integer not null default 1,
  formation_receipt_written integer not null default 0,
  durable_state_applied integer not null default 0,
  proof_or_evidence_created integer not null default 0,
  claim_or_evidence_written integer not null default 0,
  product_write_executed integer not null default 0,
  boundary_json text not null,
  reason_codes_json text not null,
  boundary_notes_json text not null,
  basis_claim_candidate_refs_json text not null default '[]',
  basis_evidence_candidate_refs_json text not null default '[]',
  perspective_delta_candidate_refs_json text not null default '[]',
  accepted_evidence_refs_json text not null default '[]',
  unresolved_tension_refs_json text not null default '[]',
  knowledge_gap_refs_json text not null default '[]',
  created_at text not null,
  updated_at text not null,
  discarded_at text,
  discard_reason text
);

CREATE TABLE IF NOT EXISTS perspective_promotion_decision_basis_refs (
  id text primary key,
  promotion_decision_id text not null,
  basis_id text not null,
  basis_kind text not null,
  basis_ref text not null,
  bounded_summary text not null,
  source_refs_json text not null,
  candidate_refs_json text not null,
  review_record_refs_json text not null,
  rag_context_preview_refs_json text not null,
  retrieval_candidate_refs_json text not null,
  provider_candidate_refs_json text not null,
  feedback_refs_json text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_promotion_decision_activity (
  activity_id text primary key,
  promotion_decision_id text not null,
  activity_kind text not null,
  actor_ref text not null,
  summary text not null,
  reason_codes_json text not null,
  created_at text not null
);

CREATE INDEX IF NOT EXISTS idx_perspective_promotion_decisions_status
  ON perspective_promotion_decisions(scope, decision_status, created_at);
CREATE INDEX IF NOT EXISTS idx_perspective_promotion_decisions_review_record
  ON perspective_promotion_decisions(scope, review_record_ref, created_at);
CREATE INDEX IF NOT EXISTS idx_perspective_promotion_decision_basis_refs_decision
  ON perspective_promotion_decision_basis_refs(promotion_decision_id, basis_kind);
CREATE INDEX IF NOT EXISTS idx_perspective_promotion_decision_activity_decision
  ON perspective_promotion_decision_activity(promotion_decision_id, created_at);
`;

export function createPromotionDecisionAuthorityBoundaryV01(
  options: { routeNow?: boolean } = {},
): PromotionDecisionAuthorityBoundary {
  return {
    explicit_operator_decision_record_storage_only: true,
    promotion_runtime_now: false,
    promotion_decision_record_write_now: true,
    promotion_route_now: options.routeNow ?? false,
    promotion_store_now: true,
    formation_receipt_write_now: false,
    durable_perspective_state_apply_now: false,
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
    candidate_is_fact: false,
    candidate_is_proof: false,
    candidate_is_accepted_evidence: false,
    provider_output_is_truth: false,
    retrieval_result_is_evidence: false,
    rag_context_is_truth: false,
    feedback_is_truth: false,
    ci_pass_is_proof: false,
    smoke_pass_is_proof: false,
    pr_body_is_authority: false,
    git_ref_is_authority: false,
  };
}

export function ensurePromotionDecisionStoreSchemaV01(db: PromotionDecisionDbLike): void {
  db.exec(promotionDecisionStoreSchemaSqlV01);
}

export function promotionDecisionStoreSchemaExistsV01(db: PromotionDecisionDbLike): boolean {
  const requiredTables = [
    "perspective_promotion_decisions",
    "perspective_promotion_decision_basis_refs",
    "perspective_promotion_decision_activity",
  ];
  const rows = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name IN (?, ?, ?)`,
    )
    .all(...requiredTables) as { name: string }[];
  const tableNames = new Set(rows.map((row) => row.name));
  return requiredTables.every((tableName) => tableNames.has(tableName));
}

export function validatePromotionDecisionCreateInputV01(
  input: unknown,
): PromotionDecisionValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const value = input as Partial<PromotionDecisionCreateInput>;
  const failureCodes: string[] = [];
  if (value.contract_version !== contractVersion) failureCodes.push("contract_version_invalid");
  if (value.scope !== scope) failureCodes.push("scope_invalid");
  if (!isSafeString(value.promotion_decision_id)) failureCodes.push("promotion_decision_id_invalid");
  if (!allowedDecisionKinds.includes(value.decision_kind as PerspectivePromotionDecisionKind)) {
    failureCodes.push("decision_kind_invalid");
  }
  if (!allowedDecisionStatuses.includes(value.decision_status as PerspectivePromotionDecisionStatus)) {
    failureCodes.push("decision_status_invalid");
  }
  if (!isSafeString(value.operator_actor_ref)) failureCodes.push("operator_actor_missing");
  if (value.explicit_user_action_required !== true) {
    failureCodes.push("explicit_user_action_required_not_true");
  }
  if (value.future_operator_decision_only !== true) {
    failureCodes.push("future_operator_decision_only_not_true");
  }
  if (!isSafeString(value.review_record_ref)) failureCodes.push("review_record_ref_missing");
  if (!isSafeString(value.gate_report_ref)) failureCodes.push("gate_report_ref_missing");
  if (!Array.isArray(value.basis_refs) || value.basis_refs.length === 0) {
    failureCodes.push("basis_refs_missing");
  }
  const basisRefs = Array.isArray(value.basis_refs) ? value.basis_refs : [];
  const basisIds = basisRefs.flatMap((basis) =>
    typeof basis?.basis_id === "string" && basis.basis_id.length > 0 ? [basis.basis_id] : [],
  );
  const duplicateBasisIds = duplicateValues(basisIds);
  if (duplicateBasisIds.length > 0) failureCodes.push("basis_refs_duplicate_basis_id");
  if (typeof value.promotion_decision_id === "string") {
    const duplicateBasisDbIds = duplicateValues(
      basisIds.map((basisId) => `${value.promotion_decision_id}:${basisId}`),
    );
    if (duplicateBasisDbIds.length > 0) failureCodes.push("basis_refs_duplicate_db_id");
  }
  const sourceRefs = basisRefs.flatMap((basis) => arrayOrEmpty(basis.source_refs));
  if (sourceRefs.length === 0) failureCodes.push("source_refs_missing");

  for (const [field, fieldValue] of Object.entries(value)) {
    if (field === "basis_refs") continue;
    failureCodes.push(...validatePublicSafeValue(fieldValue, field));
  }
  for (const [index, basis] of basisRefs.entries()) {
    failureCodes.push(...validateBasisRef(basis, `basis_refs.${index}`));
  }
  if (hasForbiddenExecutionFlag(value)) failureCodes.push("forbidden_execution_flag_enabled");
  failureCodes.push(...validateInputAuthorityBoundary(value.authority_boundary));

  return { passed: failureCodes.length === 0, failure_codes: uniqueSorted(failureCodes) };
}

export function createPromotionDecisionRecordV01(
  input: PromotionDecisionCreateInput,
  db: PromotionDecisionDbLike,
): PromotionDecisionStoreResult {
  const validation = validatePromotionDecisionCreateInputV01(input);
  if (!validation.passed) {
    return blockedResult(statusForValidationFailures(validation.failure_codes));
  }

  ensurePromotionDecisionStoreSchemaV01(db);
  const now = input.created_at ?? "2026-06-26T00:00:00.000Z";
  const record = normalizeCreateInputToRecord(input, now);
  let transactionStarted = false;
  try {
    db.prepare("BEGIN IMMEDIATE").run();
    transactionStarted = true;
    db.prepare(
      `INSERT INTO perspective_promotion_decisions (
        promotion_decision_id,
        scope,
        decision_kind,
        decision_status,
        operator_actor_ref,
        explicit_user_action_required,
        future_operator_decision_only,
        review_record_ref,
        gate_report_ref,
        unresolved_tension_policy,
        knowledge_gap_policy,
        formation_receipt_policy,
        promotion_executed,
        decision_store_written,
        formation_receipt_written,
        durable_state_applied,
        proof_or_evidence_created,
        claim_or_evidence_written,
        product_write_executed,
        boundary_json,
        reason_codes_json,
        boundary_notes_json,
        basis_claim_candidate_refs_json,
        basis_evidence_candidate_refs_json,
        perspective_delta_candidate_refs_json,
        accepted_evidence_refs_json,
        unresolved_tension_refs_json,
        knowledge_gap_refs_json,
        created_at,
        updated_at,
        discarded_at,
        discard_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      record.promotion_decision_id,
      record.scope,
      record.decision_kind,
      record.decision_status,
      record.operator_actor_ref,
      1,
      1,
      record.review_record_ref,
      record.gate_report_ref,
      record.unresolved_tension_policy,
      record.knowledge_gap_policy,
      record.formation_receipt_policy,
      0,
      1,
      0,
      0,
      0,
      0,
      0,
      JSON.stringify(record.authority_boundary),
      JSON.stringify(record.reason_codes),
      JSON.stringify(record.boundary_notes),
      JSON.stringify(record.basis_claim_candidate_refs),
      JSON.stringify(record.basis_evidence_candidate_refs),
      JSON.stringify(record.perspective_delta_candidate_refs),
      JSON.stringify(record.accepted_evidence_refs),
      JSON.stringify(record.unresolved_tension_refs),
      JSON.stringify(record.knowledge_gap_refs),
      record.created_at,
      record.updated_at,
      record.discarded_at,
      record.discard_reason,
    );
    for (const basis of record.basis_refs) {
      insertBasisRef(db, record.promotion_decision_id, basis);
    }
    insertActivityRecord(
      db,
      normalizeActivityInput(
        {
          activity_id: `${record.promotion_decision_id}:activity:created`,
          promotion_decision_id: record.promotion_decision_id,
          activity_kind: "decision_record_created",
          actor_ref: record.operator_actor_ref,
          summary: "Promotion decision record stored as explicit operator decision only.",
          reason_codes: [
            "promotion_decision_record_written",
            "promotion_not_executed",
            "formation_receipt_not_written",
            "durable_state_not_applied",
          ],
          created_at: record.created_at,
        },
      ),
    );
    db.prepare("COMMIT").run();
    transactionStarted = false;
    return result("stored", record, [record], listActivitiesForRecord(db, record.promotion_decision_id), [
      "promotion_decision_record_written",
      "db_write_executed_for_decision_record_only",
      "promotion_not_executed",
      "formation_receipt_not_written",
      "durable_state_not_applied",
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

export function readPromotionDecisionRecordV01(
  promotionDecisionId: string,
  db: PromotionDecisionDbLike,
): PromotionDecisionStoreResult {
  if (!isSafeString(promotionDecisionId)) return blockedResult("blocked_private_or_raw_payload");
  const record = readRecordById(db, promotionDecisionId);
  if (!record) return result("not_found", null, [], [], ["contract_ref_present"]);
  return result(
    record.discarded_at ? "discarded" : "stored",
    record,
    [record],
    listActivitiesForRecord(db, promotionDecisionId),
    ["promotion_not_executed", "formation_receipt_not_written", "durable_state_not_applied"],
  );
}

export function listPromotionDecisionRecordsV01(
  filters: PromotionDecisionListFilters,
  db: PromotionDecisionDbLike,
): PromotionDecisionStoreResult {
  if (filters.decision_status && hasUnsafeString(filters.decision_status)) {
    return blockedResult("blocked_private_or_raw_payload");
  }
  if (filters.review_record_ref && hasUnsafeString(filters.review_record_ref)) {
    return blockedResult("blocked_private_or_raw_payload");
  }

  const clauses = ["scope = ?"];
  const params: unknown[] = [scope];
  if (filters.decision_status) {
    clauses.push("decision_status = ?");
    params.push(filters.decision_status);
  }
  if (filters.review_record_ref) {
    clauses.push("review_record_ref = ?");
    params.push(filters.review_record_ref);
  }
  if (!filters.include_discarded) clauses.push("discarded_at IS NULL");
  const rows = db
    .prepare(
      `SELECT * FROM perspective_promotion_decisions WHERE ${clauses.join(
        " AND ",
      )} ORDER BY created_at ASC, promotion_decision_id ASC`,
    )
    .all(...params) as PromotionDecisionRow[];
  const records = rows.map((row) => rowToRecord(row, readBasisRefs(db, row.promotion_decision_id)));
  return result(
    "stored",
    records[0] ?? null,
    records,
    [],
    ["promotion_not_executed", "formation_receipt_not_written", "durable_state_not_applied"],
  );
}

export function discardPromotionDecisionRecordV01(
  promotionDecisionId: string,
  reason: string,
  db: PromotionDecisionDbLike,
): PromotionDecisionStoreResult {
  if (!isSafeString(promotionDecisionId) || !isSafeString(reason)) {
    return blockedResult("blocked_private_or_raw_payload");
  }
  ensurePromotionDecisionStoreSchemaV01(db);
  const record = readRecordById(db, promotionDecisionId);
  if (!record) return result("not_found", null, [], [], ["contract_ref_present"]);
  const discardedAt = record.discarded_at ?? record.updated_at;
  db.prepare(
    `UPDATE perspective_promotion_decisions
     SET discarded_at = ?, discard_reason = ?, updated_at = ?
     WHERE promotion_decision_id = ?`,
  ).run(discardedAt, reason, discardedAt, promotionDecisionId);
  appendPromotionDecisionActivityV01(
    {
      activity_id: `${promotionDecisionId}:activity:discarded`,
      promotion_decision_id: promotionDecisionId,
      activity_kind: "decision_record_discarded",
      actor_ref: record.operator_actor_ref,
      summary: "Promotion decision record discarded as lifecycle transition only.",
      reason_codes: [
        "promotion_not_executed",
        "formation_receipt_not_written",
        "durable_state_not_applied",
        "proof_not_created",
      ],
      created_at: discardedAt,
    },
    db,
  );
  const discarded = readRecordById(db, promotionDecisionId);
  return result(
    "discarded",
    discarded,
    discarded ? [discarded] : [],
    listActivitiesForRecord(db, promotionDecisionId),
    ["promotion_not_executed", "formation_receipt_not_written", "durable_state_not_applied"],
  );
}

export function appendPromotionDecisionActivityV01(
  input: PromotionDecisionActivityInput,
  db: PromotionDecisionDbLike,
): PromotionDecisionStoreResult {
  const failureCodes: string[] = [];
  if (!isSafeString(input.activity_id)) failureCodes.push("activity_id_invalid");
  if (!isSafeString(input.promotion_decision_id)) failureCodes.push("promotion_decision_id_invalid");
  if (!allowedActivityKinds.includes(input.activity_kind)) failureCodes.push("activity_kind_invalid");
  if (!isSafeString(input.actor_ref)) failureCodes.push("actor_ref_invalid");
  if (!isSafeString(input.summary)) failureCodes.push("summary_invalid");
  if (!Array.isArray(input.reason_codes)) failureCodes.push("reason_codes_invalid");
  failureCodes.push(...validatePublicSafeValue(input.reason_codes, "reason_codes"));
  if (failureCodes.length > 0) return blockedResult("blocked_private_or_raw_payload");

  ensurePromotionDecisionStoreSchemaV01(db);
  if (!promotionDecisionExists(db, input.promotion_decision_id)) {
    return result("not_found", null, [], [], ["contract_ref_present"]);
  }
  const activity = normalizeActivityInput(input);
  try {
    insertActivityRecord(db, activity);
  } catch {
    return blockedResult("blocked_invalid_input");
  }
  return result("stored", null, [], [activity], ["db_write_executed_for_decision_record_only"]);
}

export function isSafePromotionDecisionRouteDbPathV01(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  if (value.includes("\\") || value.includes("//") || value.includes("..") || value.includes("\0")) {
    return false;
  }
  if (!safeRouteDbPathPrefixes.some((prefix) => value.startsWith(prefix))) return false;
  return !hasUnsafeString(value);
}

function normalizeCreateInputToRecord(
  input: PromotionDecisionCreateInput,
  createdAt: string,
): PromotionDecisionRecord {
  const authorityBoundary = createPromotionDecisionAuthorityBoundaryV01();
  return {
    record_version: PROMOTION_DECISION_RECORD_VERSION,
    store_version: PROMOTION_DECISION_STORE_VERSION,
    contract_version: contractVersion,
    scope,
    promotion_decision_id: input.promotion_decision_id,
    decision_kind: input.decision_kind,
    decision_status: input.decision_status,
    operator_actor_ref: input.operator_actor_ref,
    explicit_user_action_required: true,
    future_operator_decision_only: true,
    review_record_ref: input.review_record_ref,
    gate_report_ref: input.gate_report_ref,
    basis_refs: [...input.basis_refs].sort(compareBasisRefs),
    basis_claim_candidate_refs: uniqueSorted(input.basis_claim_candidate_refs),
    basis_evidence_candidate_refs: uniqueSorted(input.basis_evidence_candidate_refs),
    perspective_delta_candidate_refs: uniqueSorted(input.perspective_delta_candidate_refs),
    accepted_evidence_refs: uniqueSorted(input.accepted_evidence_refs),
    unresolved_tension_refs: uniqueSorted(input.unresolved_tension_refs),
    knowledge_gap_refs: uniqueSorted(input.knowledge_gap_refs),
    unresolved_tension_policy: input.unresolved_tension_policy,
    knowledge_gap_policy: input.knowledge_gap_policy,
    formation_receipt_policy: input.formation_receipt_policy,
    promotion_executed: false,
    decision_store_written: true,
    formation_receipt_written: false,
    durable_state_applied: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    reason_codes: uniqueSorted([
      ...input.reason_codes,
      "contract_ref_present",
      "review_record_ref_present",
      "basis_ref_present",
      "source_ref_present",
      "operator_actor_present",
      "explicit_user_action_required",
      "future_operator_decision_only",
      "promotion_decision_record_written",
      "promotion_not_executed",
      "formation_receipt_not_written",
      "durable_state_not_applied",
      "proof_not_created",
      "evidence_not_created",
      "claim_evidence_not_written",
      "product_write_denied",
      "db_write_executed_for_decision_record_only",
      "state_apply_not_executed",
      "git_ledger_export_not_executed",
    ]),
    boundary_notes: uniqueSorted(input.boundary_notes),
    authority_boundary: authorityBoundary,
    created_at: createdAt,
    updated_at: input.updated_at ?? createdAt,
    discarded_at: null,
    discard_reason: null,
  };
}

function insertBasisRef(
  db: PromotionDecisionDbLike,
  promotionDecisionId: string,
  basis: PerspectivePromotionBasisRef,
): void {
  db.prepare(
    `INSERT INTO perspective_promotion_decision_basis_refs (
      id,
      promotion_decision_id,
      basis_id,
      basis_kind,
      basis_ref,
      bounded_summary,
      source_refs_json,
      candidate_refs_json,
      review_record_refs_json,
      rag_context_preview_refs_json,
      retrieval_candidate_refs_json,
      provider_candidate_refs_json,
      feedback_refs_json,
      reason_codes_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    `${promotionDecisionId}:${basis.basis_id}`,
    promotionDecisionId,
    basis.basis_id,
    basis.basis_kind,
    basis.basis_ref,
    basis.bounded_summary,
    JSON.stringify(uniqueSorted(basis.source_refs)),
    JSON.stringify(uniqueSorted(basis.candidate_refs)),
    JSON.stringify(uniqueSorted(basis.review_record_refs)),
    JSON.stringify(uniqueSorted(basis.rag_context_preview_refs)),
    JSON.stringify(uniqueSorted(basis.retrieval_candidate_refs)),
    JSON.stringify(uniqueSorted(basis.provider_candidate_refs)),
    JSON.stringify(uniqueSorted(basis.feedback_refs)),
    JSON.stringify(uniqueSorted(basis.reason_codes)),
  );
}

function insertActivityRecord(
  db: PromotionDecisionDbLike,
  activity: PromotionDecisionActivityRecord,
): void {
  db.prepare(
    `INSERT OR IGNORE INTO perspective_promotion_decision_activity (
      activity_id,
      promotion_decision_id,
      activity_kind,
      actor_ref,
      summary,
      reason_codes_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    activity.activity_id,
    activity.promotion_decision_id,
    activity.activity_kind,
    activity.actor_ref,
    activity.summary,
    JSON.stringify(activity.reason_codes),
    activity.created_at,
  );
}

function promotionDecisionExists(
  db: PromotionDecisionDbLike,
  promotionDecisionId: string,
): boolean {
  const row = db
    .prepare(
      "SELECT promotion_decision_id FROM perspective_promotion_decisions WHERE promotion_decision_id = ?",
    )
    .get(promotionDecisionId) as { promotion_decision_id: string } | undefined;
  return Boolean(row);
}

function readRecordById(
  db: PromotionDecisionDbLike,
  promotionDecisionId: string,
): PromotionDecisionRecord | null {
  const row = db
    .prepare("SELECT * FROM perspective_promotion_decisions WHERE promotion_decision_id = ?")
    .get(promotionDecisionId) as PromotionDecisionRow | undefined;
  if (!row) return null;
  return rowToRecord(row, readBasisRefs(db, promotionDecisionId));
}

function readBasisRefs(
  db: PromotionDecisionDbLike,
  promotionDecisionId: string,
): PerspectivePromotionBasisRef[] {
  const rows = db
    .prepare(
      `SELECT * FROM perspective_promotion_decision_basis_refs
       WHERE promotion_decision_id = ?
       ORDER BY basis_ref ASC, basis_id ASC`,
    )
    .all(promotionDecisionId) as PromotionDecisionBasisRow[];
  return rows.map((row) => ({
    basis_version: basisVersion,
    scope,
    basis_id: row.basis_id,
    basis_kind: row.basis_kind,
    basis_ref: row.basis_ref,
    source_refs: parseStringArray(row.source_refs_json),
    candidate_refs: parseStringArray(row.candidate_refs_json),
    review_record_refs: parseStringArray(row.review_record_refs_json),
    rag_context_preview_refs: parseStringArray(row.rag_context_preview_refs_json),
    retrieval_candidate_refs: parseStringArray(row.retrieval_candidate_refs_json),
    provider_candidate_refs: parseStringArray(row.provider_candidate_refs_json),
    feedback_refs: parseStringArray(row.feedback_refs_json),
    bounded_summary: row.bounded_summary,
    privacy_class: "public_safe_refs_only",
    redaction_status: "not_needed",
    public_safe: true,
    reason_codes: parseStringArray(row.reason_codes_json) as PerspectivePromotionReasonCode[],
  }));
}

function listActivitiesForRecord(
  db: PromotionDecisionDbLike,
  promotionDecisionId: string,
): PromotionDecisionActivityRecord[] {
  const rows = db
    .prepare(
      `SELECT * FROM perspective_promotion_decision_activity
       WHERE promotion_decision_id = ?
       ORDER BY created_at ASC, activity_id ASC`,
    )
    .all(promotionDecisionId) as PromotionDecisionActivityRow[];
  return rows.map(rowToActivity);
}

function rowToRecord(
  row: PromotionDecisionRow,
  basisRefs: PerspectivePromotionBasisRef[],
): PromotionDecisionRecord {
  return {
    record_version: PROMOTION_DECISION_RECORD_VERSION,
    store_version: PROMOTION_DECISION_STORE_VERSION,
    contract_version: contractVersion,
    scope,
    promotion_decision_id: row.promotion_decision_id,
    decision_kind: row.decision_kind,
    decision_status: row.decision_status,
    operator_actor_ref: row.operator_actor_ref,
    explicit_user_action_required: true,
    future_operator_decision_only: true,
    review_record_ref: row.review_record_ref,
    gate_report_ref: row.gate_report_ref,
    basis_refs: basisRefs,
    basis_claim_candidate_refs: parseStringArray(row.basis_claim_candidate_refs_json),
    basis_evidence_candidate_refs: parseStringArray(row.basis_evidence_candidate_refs_json),
    perspective_delta_candidate_refs: parseStringArray(row.perspective_delta_candidate_refs_json),
    accepted_evidence_refs: parseStringArray(row.accepted_evidence_refs_json),
    unresolved_tension_refs: parseStringArray(row.unresolved_tension_refs_json),
    knowledge_gap_refs: parseStringArray(row.knowledge_gap_refs_json),
    unresolved_tension_policy: row.unresolved_tension_policy,
    knowledge_gap_policy: row.knowledge_gap_policy,
    formation_receipt_policy: row.formation_receipt_policy,
    promotion_executed: false,
    decision_store_written: true,
    formation_receipt_written: false,
    durable_state_applied: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    reason_codes: parseStringArray(row.reason_codes_json) as PromotionDecisionStoreReasonCode[],
    boundary_notes: parseStringArray(row.boundary_notes_json),
    authority_boundary: createPromotionDecisionAuthorityBoundaryV01(),
    created_at: row.created_at,
    updated_at: row.updated_at,
    discarded_at: row.discarded_at,
    discard_reason: row.discard_reason,
  };
}

function rowToActivity(row: PromotionDecisionActivityRow): PromotionDecisionActivityRecord {
  return {
    activity_version: PROMOTION_DECISION_ACTIVITY_VERSION,
    store_version: PROMOTION_DECISION_STORE_VERSION,
    scope,
    activity_id: row.activity_id,
    promotion_decision_id: row.promotion_decision_id,
    activity_kind: row.activity_kind,
    actor_ref: row.actor_ref,
    summary: row.summary,
    reason_codes: parseStringArray(row.reason_codes_json) as PromotionDecisionStoreReasonCode[],
    created_at: row.created_at,
    authority_boundary: createPromotionDecisionAuthorityBoundaryV01(),
  };
}

function normalizeActivityInput(input: PromotionDecisionActivityInput): PromotionDecisionActivityRecord {
  return {
    activity_version: PROMOTION_DECISION_ACTIVITY_VERSION,
    store_version: PROMOTION_DECISION_STORE_VERSION,
    scope,
    activity_id: input.activity_id,
    promotion_decision_id: input.promotion_decision_id,
    activity_kind: input.activity_kind,
    actor_ref: input.actor_ref,
    summary: input.summary,
    reason_codes: uniqueSorted(input.reason_codes),
    created_at: input.created_at ?? "2026-06-26T00:00:00.000Z",
    authority_boundary: createPromotionDecisionAuthorityBoundaryV01(),
  };
}

function result(
  status: PromotionDecisionStoreStatus,
  record: PromotionDecisionRecord | null,
  records: PromotionDecisionRecord[],
  activities: PromotionDecisionActivityRecord[],
  reasonCodes: PromotionDecisionStoreReasonCode[],
): PromotionDecisionStoreResult {
  return {
    store_version: PROMOTION_DECISION_STORE_VERSION,
    record_version: PROMOTION_DECISION_RECORD_VERSION,
    activity_version: PROMOTION_DECISION_ACTIVITY_VERSION,
    contract_version: contractVersion,
    scope,
    status,
    record,
    records,
    activities,
    error_code: status.startsWith("blocked") || status === "not_found" ? status : null,
    reason_codes: uniqueSorted(reasonCodes),
    promotion_executed: false,
    decision_store_written: status === "stored" || status === "discarded",
    formation_receipt_written: false,
    durable_state_applied: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createPromotionDecisionAuthorityBoundaryV01(),
  };
}

function blockedResult(status: PromotionDecisionStoreStatus): PromotionDecisionStoreResult {
  const reasonCodesByStatus: Record<PromotionDecisionStoreStatus, PromotionDecisionStoreReasonCode[]> = {
    stored: [],
    discarded: [],
    not_found: ["contract_ref_present"],
    blocked_invalid_input: ["contract_ref_present"],
    blocked_missing_review_record: ["review_record_ref_missing"],
    blocked_missing_source_refs: ["source_ref_missing"],
    blocked_missing_basis_refs: ["basis_ref_missing"],
    blocked_forbidden_authority: ["forbidden_authority_blocked", "product_write_denied"],
    blocked_private_or_raw_payload: [
      "private_or_raw_payload_blocked",
      "secret_like_pattern_blocked",
      "local_path_blocked",
      "private_url_blocked",
    ],
  };
  return result(status, null, [], [], reasonCodesByStatus[status]);
}

function statusForValidationFailures(failureCodes: string[]): PromotionDecisionStoreStatus {
  if (failureCodes.some((code) => code.includes("private") || code.includes("raw") || code.includes("unsafe"))) {
    return "blocked_private_or_raw_payload";
  }
  if (failureCodes.includes("review_record_ref_missing")) return "blocked_missing_review_record";
  if (failureCodes.includes("basis_refs_missing")) return "blocked_missing_basis_refs";
  if (failureCodes.includes("source_refs_missing")) return "blocked_missing_source_refs";
  if (
    failureCodes.includes("forbidden_execution_flag_enabled") ||
    failureCodes.some((code) => code.startsWith("authority_boundary_forbidden"))
  ) {
    return "blocked_forbidden_authority";
  }
  return "blocked_invalid_input";
}

function validateBasisRef(basis: PerspectivePromotionBasisRef, path: string): string[] {
  const failureCodes: string[] = [];
  if (basis?.basis_version !== basisVersion) failureCodes.push(`${path}.basis_version_invalid`);
  if (basis?.scope !== scope) failureCodes.push(`${path}.scope_invalid`);
  failureCodes.push(...validateRequiredSafeString(basis?.basis_id, `${path}.basis_id`));
  failureCodes.push(...validateRequiredSafeString(basis?.basis_ref, `${path}.basis_ref`));
  failureCodes.push(
    ...validateRequiredSafeString(basis?.bounded_summary, `${path}.bounded_summary`),
  );
  if (basis?.public_safe !== true) failureCodes.push(`${path}.public_safe_required`);
  if (basis?.privacy_class !== "public_safe_refs_only") failureCodes.push(`${path}.privacy_class_invalid`);
  if (!["not_needed", "redacted"].includes(String(basis?.redaction_status))) {
    failureCodes.push(`${path}.redaction_status_invalid`);
  }
  for (const key of [
    "source_refs",
    "candidate_refs",
    "review_record_refs",
    "rag_context_preview_refs",
    "retrieval_candidate_refs",
    "provider_candidate_refs",
    "feedback_refs",
    "reason_codes",
  ] as const) {
    if (!Array.isArray(basis?.[key])) {
      failureCodes.push(`${path}.${key}_invalid`);
    } else {
      failureCodes.push(...validatePublicSafeValue(basis[key], `${path}.${key}`));
    }
  }
  return failureCodes;
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
  return Object.entries(value).flatMap(([key, nested]) => validatePublicSafeValue(nested, `${path}.${key}`));
}

function hasForbiddenExecutionFlag(value: Partial<PromotionDecisionCreateInput>): boolean {
  return (
    value.promotion_executed === true ||
    value.formation_receipt_written === true ||
    value.durable_state_applied === true ||
    value.proof_or_evidence_created === true ||
    value.claim_or_evidence_written === true ||
    value.product_write_executed === true
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

function arrayOrEmpty(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
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

function compareBasisRefs(a: PerspectivePromotionBasisRef, b: PerspectivePromotionBasisRef): number {
  return a.basis_ref.localeCompare(b.basis_ref) || a.basis_id.localeCompare(b.basis_id);
}
