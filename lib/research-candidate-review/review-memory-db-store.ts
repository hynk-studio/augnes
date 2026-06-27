import { createHash } from "node:crypto";

export const RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_VERSION_V01 =
  "research_candidate_review_memory_db_store.v0.1" as const;
export const RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_RECORD_VERSION_V01 =
  "research_candidate_review_memory_record.v0.1" as const;
export const RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ACTIVITY_VERSION_V01 =
  "research_candidate_review_memory_db_activity.v0.1" as const;

type ContractVersion = "research_candidate_review_memory_contract.v0.1";
type Scope = "project:augnes";
type RecordStatus = "contract_only" | "review_memory_db_record";
type ReviewMemoryRecordKind =
  | "candidate_review_snapshot"
  | "operator_review_note"
  | "discard_record"
  | "feedback_summary"
  | "handoff_summary"
  | "diagnostic_summary"
  | "profile_summary";
type ReviewMemoryLifecycleState = "draft" | "active" | "discarded" | "superseded" | "archived";
type ReviewMemoryDecision =
  | "none"
  | "keep_for_review"
  | "discard"
  | "supersede"
  | "needs_more_evidence"
  | "needs_operator_review";
type ReviewMemoryAction =
  | "save_review_note"
  | "defer_candidate"
  | "reject_candidate"
  | "request_more_evidence"
  | "mark_duplicate"
  | "mark_superseded"
  | "mark_needs_source_ref"
  | "prepare_promotion_later";
type SourceSurface =
  | "research_candidate_lifecycle_read_model"
  | "research_candidate_calibration_diagnostic"
  | "logical_claim_shape_preview"
  | "feedback_to_rule_candidate"
  | "temporal_handoff_diagnostic_sections"
  | "target_agent_ai_context_packet_profiles"
  | "operator_note"
  | "manual_source_ref"
  | "unknown";
type PrivacyClass = "public_safe" | "private_ref_only" | "blocked_raw_private_payload";

export type ResearchCandidateReviewMemoryDbStoreStatus =
  | "created"
  | "idempotent_existing"
  | "conflict_existing_record"
  | "read"
  | "listed"
  | "activity_appended"
  | "discarded"
  | "superseded"
  | "not_found"
  | "blocked_private_or_raw_payload"
  | "blocked_forbidden_authority"
  | "blocked_invalid_input"
  | "rejected";

export type ResearchCandidateReviewMemoryDbActivityKind =
  | "review_record_created"
  | "review_record_read"
  | "review_record_listed"
  | "review_record_activity_appended"
  | "review_record_discarded"
  | "review_record_superseded"
  | "review_record_rejected_invalid_input"
  | "unknown";

export type ResearchCandidateReviewMemoryDbReasonCode =
  | "review_memory_db_store_runtime_completion"
  | "original_phase_2_2_db_runtime_gap_closed"
  | "caller_injected_db"
  | "temp_db_smoke_only"
  | "db_schema_ensured"
  | "review_record_created"
  | "review_record_read"
  | "review_record_listed"
  | "review_record_activity_appended"
  | "review_record_discarded"
  | "review_record_superseded"
  | "idempotent_create_preserved"
  | "conflict_existing_record"
  | "duplicate_link_refs_deduped"
  | "source_refs_required"
  | "source_refs_are_lineage_not_proof"
  | "candidate_refs_are_review_refs_not_fact"
  | "review_memory_not_truth"
  | "review_memory_not_proof"
  | "review_memory_not_accepted_evidence"
  | "review_memory_not_durable_state"
  | "discard_is_lifecycle_transition"
  | "discard_is_not_delete"
  | "supersede_preserves_lineage"
  | "raw_private_payload_blocked"
  | "private_url_blocked"
  | "local_private_path_blocked"
  | "secret_like_pattern_blocked"
  | "provider_thread_run_session_id_blocked"
  | "provider_call_not_executed"
  | "prompt_not_sent"
  | "source_fetch_not_executed"
  | "retrieval_not_executed"
  | "rag_answer_not_generated"
  | "proof_not_created"
  | "evidence_not_created"
  | "promotion_not_executed"
  | "durable_state_not_mutated"
  | "formation_receipt_not_written"
  | "product_write_denied"
  | "product_id_allocation_not_executed"
  | "git_github_not_executed"
  | "codex_not_executed"
  | "smoke_pass_not_truth"
  | "ci_pass_not_truth"
  | string;

export interface ResearchCandidateReviewMemoryDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface ResearchCandidateReviewMemoryDbAuthorityBoundary {
  review_memory_db_store_now: true;
  caller_injected_db_only: true;
  explicit_operator_review_memory_write_only: true;
  db_query_or_write_now: true;
  review_record_persistence_now: true;
  review_record_activity_persistence_now: true;
  route_now: false;
  ui_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  rag_answer_generation_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  product_write_now: false;
  product_write_runtime_now: false;
  product_write_adapter_enabled_now: false;
  product_id_allocation_now: false;
  product_persistence_now: false;
  git_ledger_export_runtime_now: false;
  git_write_now: false;
  github_api_call_now: false;
  repository_file_write_now: false;
  local_file_export_now: false;
  local_file_import_now: false;
  codex_execution_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  product_write_authority: false;
  review_memory_is_truth: false;
  review_memory_is_proof: false;
  review_memory_is_accepted_evidence: false;
  review_memory_is_durable_perspective_state: false;
  candidate_is_fact: false;
  candidate_is_proof: false;
  source_ref_is_proof: false;
  discard_is_delete: false;
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface ResearchCandidateReviewMemorySourceRefV01 {
  source_surface: SourceSurface;
  source_ref: string;
  source_version?: string;
  public_safe: boolean;
}

export interface ResearchCandidateReviewMemoryPrivacyReportV01 {
  privacy_class: PrivacyClass;
  public_safe: boolean;
  raw_conversation_included: false;
  hidden_reasoning_included: false;
  raw_source_body_included: false;
  raw_candidate_payload_included: false;
  raw_provider_output_included: false;
  provider_thread_run_session_ids_included: false;
  private_urls_included: false;
  local_private_paths_included: false;
  secrets_included: false;
  raw_db_rows_included: false;
  raw_browser_dump_included: false;
  blocked_reason_codes: string[];
}

export interface ResearchCandidateReviewMemoryDbCreateInputV01 {
  record_version?: typeof RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_RECORD_VERSION_V01;
  contract_version: ContractVersion;
  scope: Scope;
  status?: RecordStatus;
  review_record_id: string;
  record_kind: ReviewMemoryRecordKind;
  lifecycle_state: ReviewMemoryLifecycleState;
  review_decision: ReviewMemoryDecision;
  review_action?: ReviewMemoryAction;
  candidate_ref?: string;
  candidate_refs?: string[];
  source_refs: ResearchCandidateReviewMemorySourceRefV01[];
  related_record_refs?: string[];
  reviewer_actor?: string;
  operator_actor_ref?: string;
  reviewer_note_summary?: string;
  bounded_summary: string;
  boundary_acknowledgements?: string[];
  privacy_report: ResearchCandidateReviewMemoryPrivacyReportV01;
  authority_boundary?: Record<string, unknown>;
  reason_codes: ResearchCandidateReviewMemoryDbReasonCode[];
  created_at: string;
  updated_at: string;
  discard_reason?: string;
  supersedes_record_ref?: string;
  superseded_by_record_ref?: string;
}

export interface ResearchCandidateReviewMemoryDbRecordV01 {
  record_version: typeof RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_RECORD_VERSION_V01;
  db_store_version: typeof RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_VERSION_V01;
  contract_version: ContractVersion;
  scope: Scope;
  status: RecordStatus;
  review_record_id: string;
  record_kind: ReviewMemoryRecordKind;
  lifecycle_state: ReviewMemoryLifecycleState;
  review_decision: ReviewMemoryDecision;
  review_action: ReviewMemoryAction | null;
  candidate_refs: string[];
  source_refs: ResearchCandidateReviewMemorySourceRefV01[];
  related_record_refs: string[];
  reviewer_actor: string;
  reviewer_note_summary: string | null;
  bounded_summary: string;
  boundary_acknowledgements: string[];
  privacy_report: ResearchCandidateReviewMemoryPrivacyReportV01;
  authority_boundary: ResearchCandidateReviewMemoryDbAuthorityBoundary;
  reason_codes: ResearchCandidateReviewMemoryDbReasonCode[];
  created_at: string;
  updated_at: string;
  discard_reason: string | null;
  supersedes_record_ref: string | null;
  superseded_by_record_ref: string | null;
}

export interface ResearchCandidateReviewMemoryDbActivityInputV01 {
  activity_id: string;
  review_record_id: string;
  activity_kind: ResearchCandidateReviewMemoryDbActivityKind;
  actor_ref: string;
  summary: string;
  reason_codes: ResearchCandidateReviewMemoryDbReasonCode[];
  created_at: string;
}

export interface ResearchCandidateReviewMemoryDbActivityV01 {
  activity_version: typeof RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ACTIVITY_VERSION_V01;
  db_store_version: typeof RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_VERSION_V01;
  scope: Scope;
  activity_id: string;
  review_record_id: string;
  activity_kind: ResearchCandidateReviewMemoryDbActivityKind;
  actor_ref: string;
  summary: string;
  reason_codes: ResearchCandidateReviewMemoryDbReasonCode[];
  created_at: string;
  authority_boundary: ResearchCandidateReviewMemoryDbAuthorityBoundary;
}

export interface ResearchCandidateReviewMemoryDbListFiltersV01 {
  lifecycle_state?: ReviewMemoryLifecycleState;
  review_decision?: ReviewMemoryDecision;
  candidate_ref?: string;
  source_ref?: string;
  include_discarded?: boolean;
  limit?: number;
}

export interface ResearchCandidateReviewMemoryDbSupersedeInputV01 {
  review_record_id: string;
  superseding_record: ResearchCandidateReviewMemoryDbCreateInputV01;
}

export interface ResearchCandidateReviewMemoryDbStoreResultV01 {
  db_store_version: typeof RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_VERSION_V01;
  record_version: typeof RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_RECORD_VERSION_V01;
  activity_version: typeof RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ACTIVITY_VERSION_V01;
  contract_version: ContractVersion;
  scope: Scope;
  status: ResearchCandidateReviewMemoryDbStoreStatus;
  record: ResearchCandidateReviewMemoryDbRecordV01 | null;
  records: ResearchCandidateReviewMemoryDbRecordV01[];
  activities: ResearchCandidateReviewMemoryDbActivityV01[];
  error_code: ResearchCandidateReviewMemoryDbStoreStatus | null;
  reason_codes: ResearchCandidateReviewMemoryDbReasonCode[];
  authority_boundary: ResearchCandidateReviewMemoryDbAuthorityBoundary;
}

interface ValidationResult<T> {
  passed: boolean;
  failure_codes: string[];
  value?: T;
}

interface ReviewMemoryRecordRow {
  review_record_id: string;
  record_version: string;
  db_store_version: string;
  contract_version: ContractVersion;
  scope: Scope;
  record_status: RecordStatus;
  record_kind: ReviewMemoryRecordKind;
  lifecycle_state: ReviewMemoryLifecycleState;
  review_decision: ReviewMemoryDecision;
  review_action: ReviewMemoryAction | null;
  reviewer_actor_ref: string;
  bounded_summary: string;
  reviewer_note_summary: string | null;
  boundary_acknowledgements_json: string;
  privacy_report_json: string;
  authority_boundary_json: string;
  reason_codes_json: string;
  related_record_refs_json: string;
  created_at: string;
  updated_at: string;
  discard_reason: string | null;
  supersedes_record_ref: string | null;
  superseded_by_record_ref: string | null;
  record_fingerprint: string;
}

interface CandidateRefRow {
  candidate_ref: string;
}

interface SourceRefRow {
  source_surface: SourceSurface;
  source_ref: string;
  source_version: string | null;
  public_safe: number;
}

interface ActivityRow {
  activity_id: string;
  review_record_id: string;
  activity_kind: ResearchCandidateReviewMemoryDbActivityKind;
  actor_ref: string;
  summary: string;
  reason_codes_json: string;
  created_at: string;
}

const contractVersion: ContractVersion = "research_candidate_review_memory_contract.v0.1";
const scope: Scope = "project:augnes";
const allowedRecordStatuses: RecordStatus[] = ["contract_only", "review_memory_db_record"];
const allowedRecordKinds: ReviewMemoryRecordKind[] = [
  "candidate_review_snapshot",
  "operator_review_note",
  "discard_record",
  "feedback_summary",
  "handoff_summary",
  "diagnostic_summary",
  "profile_summary",
];
const allowedLifecycleStates: ReviewMemoryLifecycleState[] = [
  "draft",
  "active",
  "discarded",
  "superseded",
  "archived",
];
const allowedReviewDecisions: ReviewMemoryDecision[] = [
  "none",
  "keep_for_review",
  "discard",
  "supersede",
  "needs_more_evidence",
  "needs_operator_review",
];
const allowedReviewActions: ReviewMemoryAction[] = [
  "save_review_note",
  "defer_candidate",
  "reject_candidate",
  "request_more_evidence",
  "mark_duplicate",
  "mark_superseded",
  "mark_needs_source_ref",
  "prepare_promotion_later",
];
const allowedSourceSurfaces: SourceSurface[] = [
  "research_candidate_lifecycle_read_model",
  "research_candidate_calibration_diagnostic",
  "logical_claim_shape_preview",
  "feedback_to_rule_candidate",
  "temporal_handoff_diagnostic_sections",
  "target_agent_ai_context_packet_profiles",
  "operator_note",
  "manual_source_ref",
  "unknown",
];
const allowedActivityKinds: ResearchCandidateReviewMemoryDbActivityKind[] = [
  "review_record_created",
  "review_record_read",
  "review_record_listed",
  "review_record_activity_appended",
  "review_record_discarded",
  "review_record_superseded",
  "review_record_rejected_invalid_input",
  "unknown",
];
const allowedPrivacyClasses: PrivacyClass[] = [
  "public_safe",
  "private_ref_only",
  "blocked_raw_private_payload",
];
const isoUtcTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const allowedTrueAuthorityFields = [
  "review_memory_db_store_now",
  "caller_injected_db_only",
  "explicit_operator_review_memory_write_only",
  "db_query_or_write_now",
  "review_record_persistence_now",
  "review_record_activity_persistence_now",
] as const;
const forbiddenAuthorityFields = [
  "route_now",
  "ui_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "local_file_export_now",
  "local_file_import_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "review_memory_is_truth",
  "review_memory_is_proof",
  "review_memory_is_accepted_evidence",
  "review_memory_is_durable_perspective_state",
  "candidate_is_fact",
  "candidate_is_proof",
  "source_ref_is_proof",
  "discard_is_delete",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
] as const;
const rawPrivacyBooleanFields = [
  "raw_conversation_included",
  "hidden_reasoning_included",
  "raw_source_body_included",
  "raw_candidate_payload_included",
  "raw_provider_output_included",
  "provider_thread_run_session_ids_included",
  "private_urls_included",
  "local_private_paths_included",
  "secrets_included",
  "raw_db_rows_included",
  "raw_browser_dump_included",
] as const;
const unsafeStringPatterns = [
  /SAFE_MARKER_/i,
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
  /raw conversation/i,
  /hidden reasoning/i,
  /raw DB row/i,
  /raw_db_row/i,
  /raw diff/i,
  /telemetry dump/i,
  /browser dump/i,
  /raw browser dump/i,
  /provider thread/i,
  /provider run/i,
  /provider session/i,
  /\bthread_[A-Za-z0-9_-]+/i,
  /\brun_[A-Za-z0-9_-]+/i,
  /\bsession_[A-Za-z0-9_-]+/i,
  /\buploaded[-_ ]?file[-_ ]?id/i,
  /\bconnector[-_ ]?id/i,
  /sk-[A-Za-z0-9]/i,
  /ghp_[A-Za-z0-9]/i,
  /OPENAI_API_KEY/i,
  /GITHUB_TOKEN/i,
  /password:/i,
  /secret:/i,
  /private key/i,
  /-----BEGIN PRIVATE KEY-----/i,
  /-----BEGIN RSA PRIVATE KEY-----/i,
  /-----BEGIN OPENSSH PRIVATE KEY-----/i,
];

export const researchCandidateReviewMemoryDbSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS research_candidate_review_records (
  review_record_id text primary key,
  record_version text not null,
  db_store_version text not null,
  contract_version text not null,
  scope text not null,
  record_status text not null,
  record_kind text not null,
  lifecycle_state text not null,
  review_decision text not null,
  review_action text,
  reviewer_actor_ref text not null,
  bounded_summary text not null,
  reviewer_note_summary text,
  boundary_acknowledgements_json text not null,
  privacy_report_json text not null,
  authority_boundary_json text not null,
  reason_codes_json text not null,
  related_record_refs_json text not null,
  created_at text not null,
  updated_at text not null,
  discard_reason text,
  supersedes_record_ref text,
  superseded_by_record_ref text,
  record_fingerprint text not null
);

CREATE TABLE IF NOT EXISTS research_candidate_review_record_candidates (
  id text primary key,
  review_record_id text not null,
  candidate_ref text not null,
  created_at text not null,
  foreign key (review_record_id) references research_candidate_review_records(review_record_id) on delete cascade
);

CREATE TABLE IF NOT EXISTS research_candidate_review_record_sources (
  id text primary key,
  review_record_id text not null,
  source_surface text not null,
  source_ref text not null,
  source_version text,
  public_safe integer not null,
  created_at text not null,
  foreign key (review_record_id) references research_candidate_review_records(review_record_id) on delete cascade
);

CREATE TABLE IF NOT EXISTS research_candidate_review_record_activity (
  activity_id text primary key,
  review_record_id text not null,
  activity_kind text not null,
  actor_ref text not null,
  summary text not null,
  reason_codes_json text not null,
  created_at text not null,
  foreign key (review_record_id) references research_candidate_review_records(review_record_id) on delete cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_review_record_candidates_unique
  ON research_candidate_review_record_candidates(review_record_id, candidate_ref);
CREATE UNIQUE INDEX IF NOT EXISTS idx_research_candidate_review_record_sources_unique
  ON research_candidate_review_record_sources(review_record_id, source_surface, source_ref);
CREATE INDEX IF NOT EXISTS idx_research_candidate_review_records_lifecycle
  ON research_candidate_review_records(scope, lifecycle_state, updated_at, review_record_id);
CREATE INDEX IF NOT EXISTS idx_research_candidate_review_records_decision
  ON research_candidate_review_records(scope, review_decision, updated_at, review_record_id);
CREATE INDEX IF NOT EXISTS idx_research_candidate_review_record_candidates_ref
  ON research_candidate_review_record_candidates(candidate_ref, review_record_id);
CREATE INDEX IF NOT EXISTS idx_research_candidate_review_record_sources_ref
  ON research_candidate_review_record_sources(source_ref, review_record_id);
CREATE INDEX IF NOT EXISTS idx_research_candidate_review_record_activity_record
  ON research_candidate_review_record_activity(review_record_id, created_at, activity_id);
`;

export function ensureResearchCandidateReviewMemoryDbSchemaV01(
  db: ResearchCandidateReviewMemoryDbLike,
): void {
  db.exec(researchCandidateReviewMemoryDbSchemaSqlV01);
}

export function researchCandidateReviewMemoryDbSchemaExistsV01(
  db: ResearchCandidateReviewMemoryDbLike,
): boolean {
  const requiredTables = [
    "research_candidate_review_records",
    "research_candidate_review_record_candidates",
    "research_candidate_review_record_sources",
    "research_candidate_review_record_activity",
  ];
  const rows = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name IN (?, ?, ?, ?)`,
    )
    .all(...requiredTables) as { name: string }[];
  const tableNames = new Set(rows.map((row) => row.name));
  return requiredTables.every((tableName) => tableNames.has(tableName));
}

export function createResearchCandidateReviewMemoryDbAuthorityBoundaryV01(): ResearchCandidateReviewMemoryDbAuthorityBoundary {
  return {
    review_memory_db_store_now: true,
    caller_injected_db_only: true,
    explicit_operator_review_memory_write_only: true,
    db_query_or_write_now: true,
    review_record_persistence_now: true,
    review_record_activity_persistence_now: true,
    route_now: false,
    ui_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    retrieval_execution_now: false,
    rag_answer_generation_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    product_write_now: false,
    product_write_runtime_now: false,
    product_write_adapter_enabled_now: false,
    product_id_allocation_now: false,
    product_persistence_now: false,
    git_ledger_export_runtime_now: false,
    git_write_now: false,
    github_api_call_now: false,
    repository_file_write_now: false,
    local_file_export_now: false,
    local_file_import_now: false,
    codex_execution_now: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    product_write_authority: false,
    review_memory_is_truth: false,
    review_memory_is_proof: false,
    review_memory_is_accepted_evidence: false,
    review_memory_is_durable_perspective_state: false,
    candidate_is_fact: false,
    candidate_is_proof: false,
    source_ref_is_proof: false,
    discard_is_delete: false,
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function createResearchCandidateReviewRecordV01(
  input: ResearchCandidateReviewMemoryDbCreateInputV01,
  db: ResearchCandidateReviewMemoryDbLike,
): ResearchCandidateReviewMemoryDbStoreResultV01 {
  const validation = normalizeCreateInput(input);
  if (!validation.passed || !validation.value) {
    return blockedResult(statusForValidationFailures(validation.failure_codes));
  }
  ensureResearchCandidateReviewMemoryDbSchemaV01(db);
  const record = validation.value;
  const fingerprint = createRecordFingerprint(record);
  const existing = readRecordRowById(db, record.review_record_id);
  if (existing) {
    if (existing.record_fingerprint === fingerprint) {
      return result(
        "idempotent_existing",
        rowToRecord(existing, readCandidateRefs(db, existing.review_record_id), readSourceRefs(db, existing.review_record_id)),
        [rowToRecord(existing, readCandidateRefs(db, existing.review_record_id), readSourceRefs(db, existing.review_record_id))],
        listActivitiesForRecord(db, existing.review_record_id),
        [
          "idempotent_create_preserved",
          "duplicate_link_refs_deduped",
          "caller_injected_db",
          "review_memory_not_truth",
        ],
      );
    }
    return result("conflict_existing_record", null, [], [], [
      "conflict_existing_record",
      "review_memory_db_store_runtime_completion",
      "review_memory_not_truth",
    ]);
  }

  let transactionStarted = false;
  try {
    db.prepare("BEGIN IMMEDIATE").run();
    transactionStarted = true;
    insertRecordRow(db, record, fingerprint);
    for (const candidateRef of record.candidate_refs) {
      insertCandidateRef(db, record.review_record_id, candidateRef, record.created_at);
    }
    for (const sourceRef of record.source_refs) {
      insertSourceRef(db, record.review_record_id, sourceRef, record.created_at);
    }
    insertActivityRecord(
      db,
      normalizeActivityInput({
        activity_id: `${record.review_record_id}:activity:created`,
        review_record_id: record.review_record_id,
        activity_kind: "review_record_created",
        actor_ref: record.reviewer_actor,
        summary: "Review memory record stored in caller-injected DB as bounded metadata only.",
        reason_codes: [
          "review_record_created",
          "caller_injected_db",
          "source_refs_are_lineage_not_proof",
          "candidate_refs_are_review_refs_not_fact",
          "review_memory_not_truth",
          "review_memory_not_proof",
        ],
        created_at: record.created_at,
      }),
    );
    db.prepare("COMMIT").run();
    transactionStarted = false;
  } catch {
    if (transactionStarted) rollbackQuietly(db);
    return blockedResult("blocked_invalid_input");
  }
  const created = readRecordByIdRequired(db, record.review_record_id);
  return result("created", created, [created], listActivitiesForRecord(db, record.review_record_id), [
    "review_memory_db_store_runtime_completion",
    "original_phase_2_2_db_runtime_gap_closed",
    "caller_injected_db",
    "db_schema_ensured",
    "review_record_created",
    "duplicate_link_refs_deduped",
    "source_refs_are_lineage_not_proof",
    "candidate_refs_are_review_refs_not_fact",
    "review_memory_not_truth",
    "review_memory_not_proof",
    "review_memory_not_accepted_evidence",
    "review_memory_not_durable_state",
  ]);
}

export function readResearchCandidateReviewRecordV01(
  reviewRecordId: string,
  db: ResearchCandidateReviewMemoryDbLike,
): ResearchCandidateReviewMemoryDbStoreResultV01 {
  if (!isSafeString(reviewRecordId)) return blockedResult("blocked_private_or_raw_payload");
  if (!researchCandidateReviewMemoryDbSchemaExistsV01(db)) {
    return result("not_found", null, [], [], ["review_memory_not_truth"]);
  }
  const row = readRecordRowById(db, reviewRecordId);
  if (!row) return result("not_found", null, [], [], ["review_memory_not_truth"]);
  const record = rowToRecord(row, readCandidateRefs(db, reviewRecordId), readSourceRefs(db, reviewRecordId));
  return result("read", record, [record], listActivitiesForRecord(db, reviewRecordId), [
    "review_record_read",
    "source_refs_are_lineage_not_proof",
    "candidate_refs_are_review_refs_not_fact",
    "review_memory_not_truth",
  ]);
}

export function listResearchCandidateReviewRecordsV01(
  filters: ResearchCandidateReviewMemoryDbListFiltersV01,
  db: ResearchCandidateReviewMemoryDbLike,
): ResearchCandidateReviewMemoryDbStoreResultV01 {
  const validation = validateListFilters(filters);
  if (!validation.passed) return blockedResult(statusForValidationFailures(validation.failure_codes));
  if (!researchCandidateReviewMemoryDbSchemaExistsV01(db)) {
    return result("listed", null, [], [], ["review_record_listed"]);
  }

  const clauses = ["scope = ?"];
  const params: unknown[] = [scope];
  if (filters.lifecycle_state) {
    clauses.push("lifecycle_state = ?");
    params.push(filters.lifecycle_state);
  }
  if (filters.review_decision) {
    clauses.push("review_decision = ?");
    params.push(filters.review_decision);
  }
  if (!filters.include_discarded) clauses.push("lifecycle_state != 'discarded'");
  if (filters.candidate_ref) {
    clauses.push(
      `review_record_id IN (
        SELECT review_record_id
        FROM research_candidate_review_record_candidates
        WHERE candidate_ref = ?
      )`,
    );
    params.push(filters.candidate_ref);
  }
  if (filters.source_ref) {
    clauses.push(
      `review_record_id IN (
        SELECT review_record_id
        FROM research_candidate_review_record_sources
        WHERE source_ref = ?
      )`,
    );
    params.push(filters.source_ref);
  }
  params.push(normalizeLimit(filters.limit));
  const rows = db
    .prepare(
      `SELECT * FROM research_candidate_review_records
       WHERE ${clauses.join(" AND ")}
       ORDER BY updated_at DESC, review_record_id ASC
       LIMIT ?`,
    )
    .all(...params) as ReviewMemoryRecordRow[];
  const records = rows.map((row) =>
    rowToRecord(row, readCandidateRefs(db, row.review_record_id), readSourceRefs(db, row.review_record_id)),
  );
  return result("listed", records[0] ?? null, records, [], [
    "review_record_listed",
    "source_refs_are_lineage_not_proof",
    "candidate_refs_are_review_refs_not_fact",
    "review_memory_not_truth",
  ]);
}

export function appendResearchCandidateReviewRecordActivityV01(
  input: ResearchCandidateReviewMemoryDbActivityInputV01,
  db: ResearchCandidateReviewMemoryDbLike,
): ResearchCandidateReviewMemoryDbStoreResultV01 {
  const validation = normalizeActivityInputForAppend(input);
  if (!validation.passed || !validation.value) {
    return blockedResult(statusForValidationFailures(validation.failure_codes));
  }
  ensureResearchCandidateReviewMemoryDbSchemaV01(db);
  if (!reviewRecordExists(db, input.review_record_id)) {
    return result("not_found", null, [], [], ["review_memory_not_truth"]);
  }
  try {
    insertActivityRecord(db, validation.value);
  } catch {
    return blockedResult("blocked_invalid_input");
  }
  return result("activity_appended", null, [], [validation.value], [
    "review_record_activity_appended",
    "caller_injected_db",
    "review_memory_not_truth",
  ]);
}

export function discardResearchCandidateReviewRecordV01(
  reviewRecordId: string,
  reason: string,
  db: ResearchCandidateReviewMemoryDbLike,
): ResearchCandidateReviewMemoryDbStoreResultV01 {
  if (!isSafeString(reviewRecordId) || !isSafeString(reason)) {
    return blockedResult("blocked_private_or_raw_payload");
  }
  ensureResearchCandidateReviewMemoryDbSchemaV01(db);
  const existing = readRecordById(db, reviewRecordId);
  if (!existing) return result("not_found", null, [], [], ["review_memory_not_truth"]);
  if (existing.lifecycle_state === "discarded") {
    return result("discarded", existing, [existing], listActivitiesForRecord(db, reviewRecordId), [
      "discard_is_lifecycle_transition",
      "discard_is_not_delete",
      "review_memory_not_truth",
    ]);
  }

  const discardedRecord: ResearchCandidateReviewMemoryDbRecordV01 = {
    ...existing,
    lifecycle_state: "discarded",
    review_decision: "discard",
    discard_reason: reason,
    reason_codes: uniqueSorted([
      ...existing.reason_codes,
      "review_record_discarded",
      "discard_is_lifecycle_transition",
      "discard_is_not_delete",
      "review_memory_not_truth",
      "product_write_denied",
    ]),
  };
  let transactionStarted = false;
  try {
    db.prepare("BEGIN IMMEDIATE").run();
    transactionStarted = true;
    updateRecordRow(db, discardedRecord, createRecordFingerprint(discardedRecord));
    insertActivityRecord(
      db,
      normalizeActivityInput({
        activity_id: `${reviewRecordId}:activity:discarded`,
        review_record_id: reviewRecordId,
        activity_kind: "review_record_discarded",
        actor_ref: existing.reviewer_actor,
        summary: "Review memory record discarded as lifecycle transition, not delete.",
        reason_codes: [
          "review_record_discarded",
          "discard_is_lifecycle_transition",
          "discard_is_not_delete",
          "proof_not_created",
          "evidence_not_created",
          "product_write_denied",
        ],
        created_at: existing.updated_at,
      }),
    );
    db.prepare("COMMIT").run();
    transactionStarted = false;
  } catch {
    if (transactionStarted) rollbackQuietly(db);
    return blockedResult("blocked_invalid_input");
  }
  const record = readRecordByIdRequired(db, reviewRecordId);
  return result("discarded", record, [record], listActivitiesForRecord(db, reviewRecordId), [
    "review_record_discarded",
    "discard_is_lifecycle_transition",
    "discard_is_not_delete",
    "review_memory_not_truth",
  ]);
}

export function supersedeResearchCandidateReviewRecordV01(
  input: ResearchCandidateReviewMemoryDbSupersedeInputV01,
  db: ResearchCandidateReviewMemoryDbLike,
): ResearchCandidateReviewMemoryDbStoreResultV01 {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return blockedResult("blocked_invalid_input");
  }
  if (!isSafeString(input.review_record_id)) return blockedResult("blocked_private_or_raw_payload");
  const supersedingValidation = normalizeCreateInput(input.superseding_record);
  if (!supersedingValidation.passed || !supersedingValidation.value) {
    return blockedResult(statusForValidationFailures(supersedingValidation.failure_codes));
  }
  const superseding = {
    ...supersedingValidation.value,
    supersedes_record_ref:
      supersedingValidation.value.supersedes_record_ref ?? input.review_record_id,
    related_record_refs: uniqueSorted([
      ...supersedingValidation.value.related_record_refs,
      input.review_record_id,
    ]),
  };
  if (superseding.review_record_id === input.review_record_id) {
    return blockedResult("blocked_invalid_input", ["supersede_preserves_lineage"]);
  }

  ensureResearchCandidateReviewMemoryDbSchemaV01(db);
  const existing = readRecordById(db, input.review_record_id);
  if (!existing) return result("not_found", null, [], [], ["review_memory_not_truth"]);

  const existingSupersedingRow = readRecordRowById(db, superseding.review_record_id);
  const supersedingFingerprint = createRecordFingerprint(superseding);
  if (existingSupersedingRow && existingSupersedingRow.record_fingerprint !== supersedingFingerprint) {
    return result("conflict_existing_record", null, [], [], [
      "conflict_existing_record",
      "supersede_preserves_lineage",
      "review_memory_not_truth",
    ]);
  }

  const supersededRecord: ResearchCandidateReviewMemoryDbRecordV01 = {
    ...existing,
    lifecycle_state: "superseded",
    review_decision: "supersede",
    superseded_by_record_ref: superseding.review_record_id,
    related_record_refs: uniqueSorted([...existing.related_record_refs, superseding.review_record_id]),
    updated_at: maxIsoTimestamp(existing.updated_at, superseding.updated_at),
    reason_codes: uniqueSorted([
      ...existing.reason_codes,
      "review_record_superseded",
      "supersede_preserves_lineage",
      "review_memory_not_truth",
      "product_write_denied",
    ]),
  };
  let transactionStarted = false;
  try {
    db.prepare("BEGIN IMMEDIATE").run();
    transactionStarted = true;
    if (!existingSupersedingRow) {
      insertRecordRow(db, superseding, supersedingFingerprint);
      for (const candidateRef of superseding.candidate_refs) {
        insertCandidateRef(db, supersedingId(superseding), candidateRef, superseding.created_at);
      }
      for (const sourceRef of superseding.source_refs) {
        insertSourceRef(db, supersedingId(superseding), sourceRef, superseding.created_at);
      }
      insertActivityRecord(
        db,
        normalizeActivityInput({
          activity_id: `${supersedingId(superseding)}:activity:created`,
          review_record_id: supersedingId(superseding),
          activity_kind: "review_record_created",
          actor_ref: superseding.reviewer_actor,
          summary: "Superseding review memory record stored as bounded metadata only.",
          reason_codes: [
            "review_record_created",
            "supersede_preserves_lineage",
            "caller_injected_db",
            "review_memory_not_truth",
          ],
          created_at: superseding.created_at,
        }),
      );
    }
    updateRecordRow(db, supersededRecord, createRecordFingerprint(supersededRecord));
    insertActivityRecord(
      db,
      normalizeActivityInput({
        activity_id: `${input.review_record_id}:activity:superseded-by:${supersedingId(superseding)}`,
        review_record_id: input.review_record_id,
        activity_kind: "review_record_superseded",
        actor_ref: existing.reviewer_actor,
        summary: "Review memory record superseded while preserving old and new lineage.",
        reason_codes: [
          "review_record_superseded",
          "supersede_preserves_lineage",
          "proof_not_created",
          "evidence_not_created",
          "product_write_denied",
        ],
        created_at: supersededRecord.updated_at,
      }),
    );
    db.prepare("COMMIT").run();
    transactionStarted = false;
  } catch {
    if (transactionStarted) rollbackQuietly(db);
    return blockedResult("blocked_invalid_input");
  }
  const oldRecord = readRecordByIdRequired(db, input.review_record_id);
  const newRecord = readRecordByIdRequired(db, supersedingId(superseding));
  return result("superseded", oldRecord, [oldRecord, newRecord], listActivitiesForRecord(db, input.review_record_id), [
    "review_record_superseded",
    "supersede_preserves_lineage",
    "review_memory_not_truth",
  ]);
}

function normalizeCreateInput(
  input: ResearchCandidateReviewMemoryDbCreateInputV01,
): ValidationResult<ResearchCandidateReviewMemoryDbRecordV01> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const failureCodes: string[] = [];
  if (input.record_version && input.record_version !== RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_RECORD_VERSION_V01) {
    failureCodes.push("record_version_invalid");
  }
  if (input.contract_version !== contractVersion) failureCodes.push("contract_version_invalid");
  if (input.scope !== scope) failureCodes.push("scope_invalid");
  if (input.status !== undefined && !allowedRecordStatuses.includes(input.status)) {
    failureCodes.push("status_invalid");
  }
  if (!isSafeString(input.review_record_id)) failureCodes.push("review_record_id_invalid");
  if (!allowedRecordKinds.includes(input.record_kind)) failureCodes.push("record_kind_invalid");
  if (!allowedLifecycleStates.includes(input.lifecycle_state)) failureCodes.push("lifecycle_state_invalid");
  if (!allowedReviewDecisions.includes(input.review_decision)) failureCodes.push("review_decision_invalid");
  if (input.review_action !== undefined && !allowedReviewActions.includes(input.review_action)) {
    failureCodes.push("review_action_invalid");
  }
  if (!isSafeString(input.bounded_summary)) failureCodes.push("bounded_summary_invalid");
  if (input.reviewer_note_summary !== undefined && !isSafeString(input.reviewer_note_summary)) {
    failureCodes.push("reviewer_note_summary_invalid");
  }
  const reviewerActor = input.reviewer_actor ?? input.operator_actor_ref;
  if (!isSafeString(reviewerActor)) failureCodes.push("reviewer_actor_invalid");
  if (!isIsoUtcTimestamp(input.created_at)) failureCodes.push("created_at_invalid");
  if (!isIsoUtcTimestamp(input.updated_at)) failureCodes.push("updated_at_invalid");
  if (
    isIsoUtcTimestamp(input.created_at) &&
    isIsoUtcTimestamp(input.updated_at) &&
    input.updated_at < input.created_at
  ) {
    failureCodes.push("updated_at_before_created_at");
  }
  const candidateRefs = uniqueSorted([
    ...(input.candidate_ref ? [input.candidate_ref] : []),
    ...arrayOfSafeStrings(input.candidate_refs),
  ]);
  if (candidateRefs.length === 0) failureCodes.push("candidate_refs_missing");
  for (const candidateRef of candidateRefs) {
    if (!isSafeString(candidateRef)) failureCodes.push("candidate_ref_invalid");
  }
  const sourceRefs = normalizeSourceRefs(input.source_refs);
  if (!Array.isArray(input.source_refs) || sourceRefs.length === 0) {
    failureCodes.push("source_refs_required");
  }
  for (const sourceRef of sourceRefs) {
    if (!allowedSourceSurfaces.includes(sourceRef.source_surface)) {
      failureCodes.push("source_surface_invalid");
    }
    if (!isSafeString(sourceRef.source_ref)) failureCodes.push("source_ref_invalid");
    if (sourceRef.source_version !== undefined && !isSafeString(sourceRef.source_version)) {
      failureCodes.push("source_version_invalid");
    }
    if (typeof sourceRef.public_safe !== "boolean") failureCodes.push("source_public_safe_invalid");
  }
  const relatedRecordRefs = uniqueSorted(arrayOfSafeStrings(input.related_record_refs));
  for (const relatedRecordRef of relatedRecordRefs) {
    if (relatedRecordRef === input.review_record_id) failureCodes.push("related_record_ref_self");
    if (!isSafeString(relatedRecordRef)) failureCodes.push("related_record_ref_invalid");
  }
  for (const ref of [input.supersedes_record_ref, input.superseded_by_record_ref]) {
    if (ref !== undefined && !isSafeString(ref)) failureCodes.push("lineage_ref_invalid");
    if (ref !== undefined && ref === input.review_record_id) failureCodes.push("lineage_ref_self");
  }
  if (input.lifecycle_state === "discarded" && !isSafeString(input.discard_reason)) {
    failureCodes.push("discard_reason_required");
  }
  failureCodes.push(...validatePrivacyReport(input.privacy_report));
  failureCodes.push(...validateStringArray(input.boundary_acknowledgements, "boundary_acknowledgements"));
  failureCodes.push(...validateStringArray(input.reason_codes, "reason_codes"));
  failureCodes.push(...validateAuthorityBoundary(input.authority_boundary));
  failureCodes.push(...validateRecursivePublicSafety(input, "input"));

  if (failureCodes.length > 0) {
    return { passed: false, failure_codes: uniqueSorted(failureCodes) };
  }
  const normalizedRecord: ResearchCandidateReviewMemoryDbRecordV01 = {
    record_version: RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_RECORD_VERSION_V01,
    db_store_version: RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_VERSION_V01,
    contract_version: contractVersion,
    scope,
    status: input.status ?? "review_memory_db_record",
    review_record_id: input.review_record_id,
    record_kind: input.record_kind,
    lifecycle_state: input.lifecycle_state,
    review_decision: input.review_decision,
    review_action: input.review_action ?? null,
    candidate_refs: candidateRefs,
    source_refs: sourceRefs,
    related_record_refs: relatedRecordRefs,
    reviewer_actor: reviewerActor as string,
    reviewer_note_summary: input.reviewer_note_summary ?? null,
    bounded_summary: input.bounded_summary,
    boundary_acknowledgements: uniqueSorted(input.boundary_acknowledgements ?? []),
    privacy_report: normalizePrivacyReport(input.privacy_report),
    authority_boundary: createResearchCandidateReviewMemoryDbAuthorityBoundaryV01(),
    reason_codes: uniqueSorted([
      ...input.reason_codes,
      "review_memory_db_store_runtime_completion",
      "original_phase_2_2_db_runtime_gap_closed",
      "caller_injected_db",
      "review_memory_not_truth",
      "review_memory_not_proof",
      "review_memory_not_accepted_evidence",
      "review_memory_not_durable_state",
      "source_refs_are_lineage_not_proof",
      "candidate_refs_are_review_refs_not_fact",
      "provider_call_not_executed",
      "prompt_not_sent",
      "source_fetch_not_executed",
      "retrieval_not_executed",
      "rag_answer_not_generated",
      "proof_not_created",
      "evidence_not_created",
      "promotion_not_executed",
      "durable_state_not_mutated",
      "formation_receipt_not_written",
      "product_write_denied",
      "product_id_allocation_not_executed",
      "git_github_not_executed",
      "codex_not_executed",
      "smoke_pass_not_truth",
      "ci_pass_not_truth",
    ]),
    created_at: input.created_at,
    updated_at: input.updated_at,
    discard_reason: input.discard_reason ?? null,
    supersedes_record_ref: input.supersedes_record_ref ?? null,
    superseded_by_record_ref: input.superseded_by_record_ref ?? null,
  };
  return { passed: true, failure_codes: [], value: normalizedRecord };
}

function normalizeActivityInputForAppend(
  input: ResearchCandidateReviewMemoryDbActivityInputV01,
): ValidationResult<ResearchCandidateReviewMemoryDbActivityV01> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const failureCodes: string[] = [];
  if (!isSafeString(input.activity_id)) failureCodes.push("activity_id_invalid");
  if (!isSafeString(input.review_record_id)) failureCodes.push("review_record_id_invalid");
  if (!allowedActivityKinds.includes(input.activity_kind)) failureCodes.push("activity_kind_invalid");
  if (!isSafeString(input.actor_ref)) failureCodes.push("actor_ref_invalid");
  if (!isSafeString(input.summary)) failureCodes.push("summary_invalid");
  if (!isIsoUtcTimestamp(input.created_at)) failureCodes.push("created_at_invalid");
  failureCodes.push(...validateStringArray(input.reason_codes, "reason_codes"));
  failureCodes.push(...validateRecursivePublicSafety(input, "input"));
  if (failureCodes.length > 0) {
    return { passed: false, failure_codes: uniqueSorted(failureCodes) };
  }
  return { passed: true, failure_codes: [], value: normalizeActivityInput(input) };
}

function normalizeActivityInput(
  input: ResearchCandidateReviewMemoryDbActivityInputV01,
): ResearchCandidateReviewMemoryDbActivityV01 {
  return {
    activity_version: RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ACTIVITY_VERSION_V01,
    db_store_version: RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_VERSION_V01,
    scope,
    activity_id: input.activity_id,
    review_record_id: input.review_record_id,
    activity_kind: input.activity_kind,
    actor_ref: input.actor_ref,
    summary: input.summary,
    reason_codes: uniqueSorted([
      ...input.reason_codes,
      "caller_injected_db",
      "review_memory_not_truth",
      "review_memory_not_proof",
    ]),
    created_at: input.created_at,
    authority_boundary: createResearchCandidateReviewMemoryDbAuthorityBoundaryV01(),
  };
}

function validateListFilters(filters: ResearchCandidateReviewMemoryDbListFiltersV01): ValidationResult<null> {
  if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
    return { passed: false, failure_codes: ["filters_invalid_object"] };
  }
  const failureCodes: string[] = [];
  if (filters.lifecycle_state && !allowedLifecycleStates.includes(filters.lifecycle_state)) {
    failureCodes.push("lifecycle_state_invalid");
  }
  if (filters.review_decision && !allowedReviewDecisions.includes(filters.review_decision)) {
    failureCodes.push("review_decision_invalid");
  }
  if (filters.candidate_ref !== undefined && !isSafeString(filters.candidate_ref)) {
    failureCodes.push("candidate_ref_invalid");
  }
  if (filters.source_ref !== undefined && !isSafeString(filters.source_ref)) {
    failureCodes.push("source_ref_invalid");
  }
  if (
    filters.limit !== undefined &&
    (!Number.isInteger(filters.limit) || filters.limit <= 0 || filters.limit > 200)
  ) {
    failureCodes.push("limit_invalid");
  }
  failureCodes.push(...validateRecursivePublicSafety(filters, "filters"));
  return { passed: failureCodes.length === 0, failure_codes: uniqueSorted(failureCodes), value: null };
}

function validatePrivacyReport(report: ResearchCandidateReviewMemoryPrivacyReportV01): string[] {
  const failureCodes: string[] = [];
  if (!report || typeof report !== "object" || Array.isArray(report)) {
    return ["privacy_report_missing"];
  }
  if (!allowedPrivacyClasses.includes(report.privacy_class)) failureCodes.push("privacy_class_invalid");
  if (typeof report.public_safe !== "boolean") failureCodes.push("privacy_public_safe_invalid");
  for (const field of rawPrivacyBooleanFields) {
    if (report[field] !== false) failureCodes.push(`privacy_${field}_not_false`);
  }
  if (!Array.isArray(report.blocked_reason_codes)) {
    failureCodes.push("blocked_reason_codes_invalid");
  } else {
    failureCodes.push(...validateStringArray(report.blocked_reason_codes, "blocked_reason_codes"));
  }
  return failureCodes;
}

function normalizePrivacyReport(
  report: ResearchCandidateReviewMemoryPrivacyReportV01,
): ResearchCandidateReviewMemoryPrivacyReportV01 {
  return {
    privacy_class: report.privacy_class,
    public_safe: report.public_safe,
    raw_conversation_included: false,
    hidden_reasoning_included: false,
    raw_source_body_included: false,
    raw_candidate_payload_included: false,
    raw_provider_output_included: false,
    provider_thread_run_session_ids_included: false,
    private_urls_included: false,
    local_private_paths_included: false,
    secrets_included: false,
    raw_db_rows_included: false,
    raw_browser_dump_included: false,
    blocked_reason_codes: uniqueSorted(report.blocked_reason_codes),
  };
}

function validateAuthorityBoundary(boundary: unknown): string[] {
  if (boundary === undefined) return [];
  if (!boundary || typeof boundary !== "object" || Array.isArray(boundary)) {
    return ["authority_boundary_invalid"];
  }
  const failureCodes: string[] = [];
  const value = boundary as Record<string, unknown>;
  for (const field of allowedTrueAuthorityFields) {
    if (field in value && value[field] !== true) {
      failureCodes.push(`authority_boundary_allowed_not_true:${field}`);
    }
  }
  for (const field of forbiddenAuthorityFields) {
    if (value[field] === true) failureCodes.push(`authority_boundary_forbidden:${field}`);
  }
  return failureCodes;
}

function validateStringArray(value: unknown, path: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return [`${path}_invalid`];
  const failureCodes: string[] = [];
  for (const [index, item] of value.entries()) {
    if (!isSafeString(item)) failureCodes.push(`${path}.${index}_invalid`);
  }
  return failureCodes;
}

function validateRecursivePublicSafety(value: unknown, path: string): string[] {
  if (typeof value === "string") {
    return hasUnsafeString(value) ? [`${path}_unsafe_private_or_raw_marker`] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => validateRecursivePublicSafety(item, `${path}.${index}`));
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) => {
    const failures = validateRecursivePublicSafety(nested, `${path}.${key}`);
    if (forbiddenAuthorityFields.includes(key as (typeof forbiddenAuthorityFields)[number]) && nested === true) {
      failures.push(`authority_boundary_forbidden:${key}`);
    }
    return failures;
  });
}

function statusForValidationFailures(failureCodes: string[]): ResearchCandidateReviewMemoryDbStoreStatus {
  if (failureCodes.some((code) => code.startsWith("authority_boundary_forbidden"))) {
    return "blocked_forbidden_authority";
  }
  if (
    failureCodes.some(
      (code) =>
        code.includes("unsafe_private_or_raw_marker") ||
        code.includes("private") ||
        code.includes("raw") ||
        code.includes("secret") ||
        code.includes("local_path") ||
        code.includes("private_url"),
    )
  ) {
    return "blocked_private_or_raw_payload";
  }
  return "blocked_invalid_input";
}

function blockedResult(
  status: ResearchCandidateReviewMemoryDbStoreStatus,
  extraReasonCodes: ResearchCandidateReviewMemoryDbReasonCode[] = [],
): ResearchCandidateReviewMemoryDbStoreResultV01 {
  const reasonCodesByStatus: Record<ResearchCandidateReviewMemoryDbStoreStatus, ResearchCandidateReviewMemoryDbReasonCode[]> = {
    created: [],
    idempotent_existing: ["idempotent_create_preserved"],
    conflict_existing_record: ["conflict_existing_record"],
    read: ["review_record_read"],
    listed: ["review_record_listed"],
    activity_appended: ["review_record_activity_appended"],
    discarded: ["review_record_discarded", "discard_is_lifecycle_transition", "discard_is_not_delete"],
    superseded: ["review_record_superseded", "supersede_preserves_lineage"],
    not_found: ["review_memory_not_truth"],
    blocked_private_or_raw_payload: [
      "raw_private_payload_blocked",
      "private_url_blocked",
      "local_private_path_blocked",
      "secret_like_pattern_blocked",
      "provider_thread_run_session_id_blocked",
    ],
    blocked_forbidden_authority: [
      "product_write_denied",
      "provider_call_not_executed",
      "prompt_not_sent",
      "retrieval_not_executed",
      "proof_not_created",
      "evidence_not_created",
    ],
    blocked_invalid_input: ["review_memory_db_store_runtime_completion"],
    rejected: ["review_memory_db_store_runtime_completion"],
  };
  return result(status, null, [], [], [...reasonCodesByStatus[status], ...extraReasonCodes]);
}

function result(
  status: ResearchCandidateReviewMemoryDbStoreStatus,
  record: ResearchCandidateReviewMemoryDbRecordV01 | null,
  records: ResearchCandidateReviewMemoryDbRecordV01[],
  activities: ResearchCandidateReviewMemoryDbActivityV01[],
  reasonCodes: ResearchCandidateReviewMemoryDbReasonCode[],
): ResearchCandidateReviewMemoryDbStoreResultV01 {
  return {
    db_store_version: RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_VERSION_V01,
    record_version: RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_RECORD_VERSION_V01,
    activity_version: RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ACTIVITY_VERSION_V01,
    contract_version: contractVersion,
    scope,
    status,
    record,
    records,
    activities,
    error_code: status.startsWith("blocked") || status === "not_found" || status === "conflict_existing_record" || status === "rejected"
      ? status
      : null,
    reason_codes: uniqueSorted([
      ...reasonCodes,
      "caller_injected_db",
      "review_memory_not_truth",
      "review_memory_not_proof",
      "review_memory_not_accepted_evidence",
      "review_memory_not_durable_state",
      "product_write_denied",
    ]),
    authority_boundary: createResearchCandidateReviewMemoryDbAuthorityBoundaryV01(),
  };
}

function insertRecordRow(
  db: ResearchCandidateReviewMemoryDbLike,
  record: ResearchCandidateReviewMemoryDbRecordV01,
  fingerprint: string,
): void {
  db.prepare(
    `INSERT INTO research_candidate_review_records (
      review_record_id,
      record_version,
      db_store_version,
      contract_version,
      scope,
      record_status,
      record_kind,
      lifecycle_state,
      review_decision,
      review_action,
      reviewer_actor_ref,
      bounded_summary,
      reviewer_note_summary,
      boundary_acknowledgements_json,
      privacy_report_json,
      authority_boundary_json,
      reason_codes_json,
      related_record_refs_json,
      created_at,
      updated_at,
      discard_reason,
      supersedes_record_ref,
      superseded_by_record_ref,
      record_fingerprint
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.review_record_id,
    record.record_version,
    record.db_store_version,
    record.contract_version,
    record.scope,
    record.status,
    record.record_kind,
    record.lifecycle_state,
    record.review_decision,
    record.review_action,
    record.reviewer_actor,
    record.bounded_summary,
    record.reviewer_note_summary,
    JSON.stringify(record.boundary_acknowledgements),
    JSON.stringify(record.privacy_report),
    JSON.stringify(record.authority_boundary),
    JSON.stringify(record.reason_codes),
    JSON.stringify(record.related_record_refs),
    record.created_at,
    record.updated_at,
    record.discard_reason,
    record.supersedes_record_ref,
    record.superseded_by_record_ref,
    fingerprint,
  );
}

function updateRecordRow(
  db: ResearchCandidateReviewMemoryDbLike,
  record: ResearchCandidateReviewMemoryDbRecordV01,
  fingerprint: string,
): void {
  db.prepare(
    `UPDATE research_candidate_review_records
     SET record_status = ?,
         record_kind = ?,
         lifecycle_state = ?,
         review_decision = ?,
         review_action = ?,
         reviewer_actor_ref = ?,
         bounded_summary = ?,
         reviewer_note_summary = ?,
         boundary_acknowledgements_json = ?,
         privacy_report_json = ?,
         authority_boundary_json = ?,
         reason_codes_json = ?,
         related_record_refs_json = ?,
         updated_at = ?,
         discard_reason = ?,
         supersedes_record_ref = ?,
         superseded_by_record_ref = ?,
         record_fingerprint = ?
     WHERE review_record_id = ?`,
  ).run(
    record.status,
    record.record_kind,
    record.lifecycle_state,
    record.review_decision,
    record.review_action,
    record.reviewer_actor,
    record.bounded_summary,
    record.reviewer_note_summary,
    JSON.stringify(record.boundary_acknowledgements),
    JSON.stringify(record.privacy_report),
    JSON.stringify(record.authority_boundary),
    JSON.stringify(record.reason_codes),
    JSON.stringify(record.related_record_refs),
    record.updated_at,
    record.discard_reason,
    record.supersedes_record_ref,
    record.superseded_by_record_ref,
    fingerprint,
    record.review_record_id,
  );
}

function insertCandidateRef(
  db: ResearchCandidateReviewMemoryDbLike,
  reviewRecordId: string,
  candidateRef: string,
  createdAt: string,
): void {
  db.prepare(
    `INSERT OR IGNORE INTO research_candidate_review_record_candidates (
      id,
      review_record_id,
      candidate_ref,
      created_at
    ) VALUES (?, ?, ?, ?)`,
  ).run(`${reviewRecordId}:candidate:${candidateRef}`, reviewRecordId, candidateRef, createdAt);
}

function insertSourceRef(
  db: ResearchCandidateReviewMemoryDbLike,
  reviewRecordId: string,
  sourceRef: ResearchCandidateReviewMemorySourceRefV01,
  createdAt: string,
): void {
  db.prepare(
    `INSERT OR IGNORE INTO research_candidate_review_record_sources (
      id,
      review_record_id,
      source_surface,
      source_ref,
      source_version,
      public_safe,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    `${reviewRecordId}:source:${sourceRef.source_surface}:${sourceRef.source_ref}`,
    reviewRecordId,
    sourceRef.source_surface,
    sourceRef.source_ref,
    sourceRef.source_version ?? null,
    sourceRef.public_safe ? 1 : 0,
    createdAt,
  );
}

function insertActivityRecord(
  db: ResearchCandidateReviewMemoryDbLike,
  activity: ResearchCandidateReviewMemoryDbActivityV01,
): void {
  db.prepare(
    `INSERT OR IGNORE INTO research_candidate_review_record_activity (
      activity_id,
      review_record_id,
      activity_kind,
      actor_ref,
      summary,
      reason_codes_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    activity.activity_id,
    activity.review_record_id,
    activity.activity_kind,
    activity.actor_ref,
    activity.summary,
    JSON.stringify(activity.reason_codes),
    activity.created_at,
  );
}

function readRecordById(
  db: ResearchCandidateReviewMemoryDbLike,
  reviewRecordId: string,
): ResearchCandidateReviewMemoryDbRecordV01 | null {
  const row = readRecordRowById(db, reviewRecordId);
  if (!row) return null;
  return rowToRecord(row, readCandidateRefs(db, reviewRecordId), readSourceRefs(db, reviewRecordId));
}

function readRecordByIdRequired(
  db: ResearchCandidateReviewMemoryDbLike,
  reviewRecordId: string,
): ResearchCandidateReviewMemoryDbRecordV01 {
  const record = readRecordById(db, reviewRecordId);
  if (!record) throw new Error("review_record_missing_after_write");
  return record;
}

function readRecordRowById(
  db: ResearchCandidateReviewMemoryDbLike,
  reviewRecordId: string,
): ReviewMemoryRecordRow | null {
  const row = db
    .prepare("SELECT * FROM research_candidate_review_records WHERE review_record_id = ?")
    .get(reviewRecordId) as ReviewMemoryRecordRow | undefined;
  return row ?? null;
}

function reviewRecordExists(
  db: ResearchCandidateReviewMemoryDbLike,
  reviewRecordId: string,
): boolean {
  const row = db
    .prepare("SELECT review_record_id FROM research_candidate_review_records WHERE review_record_id = ?")
    .get(reviewRecordId) as { review_record_id: string } | undefined;
  return Boolean(row);
}

function readCandidateRefs(
  db: ResearchCandidateReviewMemoryDbLike,
  reviewRecordId: string,
): string[] {
  const rows = db
    .prepare(
      `SELECT candidate_ref
       FROM research_candidate_review_record_candidates
       WHERE review_record_id = ?
       ORDER BY candidate_ref ASC`,
    )
    .all(reviewRecordId) as CandidateRefRow[];
  return rows.map((row) => row.candidate_ref);
}

function readSourceRefs(
  db: ResearchCandidateReviewMemoryDbLike,
  reviewRecordId: string,
): ResearchCandidateReviewMemorySourceRefV01[] {
  const rows = db
    .prepare(
      `SELECT source_surface, source_ref, source_version, public_safe
       FROM research_candidate_review_record_sources
       WHERE review_record_id = ?
       ORDER BY source_surface ASC, source_ref ASC`,
    )
    .all(reviewRecordId) as SourceRefRow[];
  return rows.map((row) => ({
    source_surface: row.source_surface,
    source_ref: row.source_ref,
    ...(row.source_version ? { source_version: row.source_version } : {}),
    public_safe: row.public_safe === 1,
  }));
}

function listActivitiesForRecord(
  db: ResearchCandidateReviewMemoryDbLike,
  reviewRecordId: string,
): ResearchCandidateReviewMemoryDbActivityV01[] {
  const rows = db
    .prepare(
      `SELECT *
       FROM research_candidate_review_record_activity
       WHERE review_record_id = ?
       ORDER BY created_at ASC, activity_id ASC`,
    )
    .all(reviewRecordId) as ActivityRow[];
  return rows.map(rowToActivity);
}

function rowToRecord(
  row: ReviewMemoryRecordRow,
  candidateRefs: string[],
  sourceRefs: ResearchCandidateReviewMemorySourceRefV01[],
): ResearchCandidateReviewMemoryDbRecordV01 {
  return {
    record_version: RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_RECORD_VERSION_V01,
    db_store_version: RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_VERSION_V01,
    contract_version: contractVersion,
    scope,
    status: row.record_status,
    review_record_id: row.review_record_id,
    record_kind: row.record_kind,
    lifecycle_state: row.lifecycle_state,
    review_decision: row.review_decision,
    review_action: row.review_action,
    candidate_refs: uniqueSorted(candidateRefs),
    source_refs: sourceRefs,
    related_record_refs: parseStringArray(row.related_record_refs_json),
    reviewer_actor: row.reviewer_actor_ref,
    reviewer_note_summary: row.reviewer_note_summary,
    bounded_summary: row.bounded_summary,
    boundary_acknowledgements: parseStringArray(row.boundary_acknowledgements_json),
    privacy_report: parseJson(row.privacy_report_json) as ResearchCandidateReviewMemoryPrivacyReportV01,
    authority_boundary: createResearchCandidateReviewMemoryDbAuthorityBoundaryV01(),
    reason_codes: parseStringArray(row.reason_codes_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
    discard_reason: row.discard_reason,
    supersedes_record_ref: row.supersedes_record_ref,
    superseded_by_record_ref: row.superseded_by_record_ref,
  };
}

function rowToActivity(row: ActivityRow): ResearchCandidateReviewMemoryDbActivityV01 {
  return {
    activity_version: RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ACTIVITY_VERSION_V01,
    db_store_version: RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_VERSION_V01,
    scope,
    activity_id: row.activity_id,
    review_record_id: row.review_record_id,
    activity_kind: row.activity_kind,
    actor_ref: row.actor_ref,
    summary: row.summary,
    reason_codes: parseStringArray(row.reason_codes_json),
    created_at: row.created_at,
    authority_boundary: createResearchCandidateReviewMemoryDbAuthorityBoundaryV01(),
  };
}

function createRecordFingerprint(record: ResearchCandidateReviewMemoryDbRecordV01): string {
  return `sha256:${sha256(canonicalJson(record))}`;
}

function normalizeSourceRefs(value: unknown): ResearchCandidateReviewMemorySourceRefV01[] {
  if (!Array.isArray(value)) return [];
  const keyed = new Map<string, ResearchCandidateReviewMemorySourceRefV01>();
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const source = item as Partial<ResearchCandidateReviewMemorySourceRefV01>;
    if (typeof source.source_surface !== "string" || typeof source.source_ref !== "string") continue;
    const normalized: ResearchCandidateReviewMemorySourceRefV01 = {
      source_surface: source.source_surface as SourceSurface,
      source_ref: source.source_ref,
      ...(typeof source.source_version === "string" ? { source_version: source.source_version } : {}),
      public_safe: source.public_safe === true,
    };
    keyed.set(`${normalized.source_surface}:${normalized.source_ref}`, normalized);
  }
  return [...keyed.values()].sort(compareSourceRefs);
}

function compareSourceRefs(
  left: ResearchCandidateReviewMemorySourceRefV01,
  right: ResearchCandidateReviewMemorySourceRefV01,
): number {
  return (
    left.source_surface.localeCompare(right.source_surface) ||
    left.source_ref.localeCompare(right.source_ref) ||
    (left.source_version ?? "").localeCompare(right.source_version ?? "")
  );
}

function isSafeString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !hasUnsafeString(value);
}

function hasUnsafeString(value: string): boolean {
  return unsafeStringPatterns.some((pattern) => pattern.test(value));
}

function isIsoUtcTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !isoUtcTimestampPattern.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function maxIsoTimestamp(left: string, right: string): string {
  return left >= right ? left : right;
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) return 50;
  return Math.max(1, Math.min(200, limit));
}

function arrayOfSafeStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseStringArray(value: string): string[] {
  const parsed = parseJson(value);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort();
}

function supersedingId(record: ResearchCandidateReviewMemoryDbRecordV01): string {
  return record.review_record_id;
}

function rollbackQuietly(db: ResearchCandidateReviewMemoryDbLike): void {
  try {
    db.prepare("ROLLBACK").run();
  } catch {
    // Bounded result returned by caller covers rollback failure.
  }
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
