import { createHash } from "node:crypto";

import type {
  DurablePerspectiveApplyOperation,
  DurablePerspectiveApplyStatus,
  DurablePerspectiveClaimRef,
  DurablePerspectiveKnowledgeGapRef,
  DurablePerspectiveState,
  DurablePerspectiveStateApplyEvent,
  DurablePerspectiveStateApplyInput,
  DurablePerspectiveStateApplyResult,
  DurablePerspectiveStateAuthorityBoundary,
  DurablePerspectiveStateReasonCode,
  DurablePerspectiveStateValidationResult,
  DurablePerspectiveTensionRef,
} from "./apply-perspective-delta";

export type { DurablePerspectiveStateApplyInput, DurablePerspectiveStateApplyResult } from "./apply-perspective-delta";

export interface DurablePerspectiveDbLike {
  exec(sql: string): unknown;
  prepare(sql: string): {
    run(...params: unknown[]): unknown;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  };
}

export interface DurablePerspectiveApplyEventListFilters {
  perspective_id?: string;
  formation_receipt_id?: string;
}

interface PerspectiveStateRow {
  perspective_id: string;
  scope: string;
  state_version: string;
  current_thesis: string;
  salience_state_json: string;
  reuse_conditions_json: string;
  promotion_history_json: string;
  retirement_history_json: string;
  formation_receipt_refs_json: string;
  authority_boundary_json: string;
  reason_codes_json: string;
  created_at: string;
  updated_at: string;
}

interface PerspectiveStateTextRow {
  value_text?: string;
  thesis?: string;
  evidence_ref?: string;
}

interface PerspectiveStateClaimRow {
  claim_ref: string;
  bounded_summary: string;
  source_refs_json: string;
  reason_codes_json: string;
}

interface PerspectiveStateTensionRow {
  tension_ref: string;
  bounded_summary: string;
  source_refs_json: string;
  reason_codes_json: string;
}

interface PerspectiveStateKnowledgeGapRow {
  knowledge_gap_ref: string;
  bounded_summary: string;
  gap_status: "open" | "deferred" | "closed" | "unknown";
  source_refs_json: string;
  reason_codes_json: string;
}

interface PerspectiveApplyEventRow {
  apply_event_id: string;
  perspective_id: string;
  promotion_decision_id: string;
  formation_receipt_id: string;
  review_record_ref: string;
  operator_actor_ref: string;
  apply_operation: DurablePerspectiveApplyOperation;
  applied_at: string;
  prior_state_version: string | null;
  next_state_version: string;
  selected_candidate_refs_json: string;
  omitted_candidate_refs_json: string;
  deferred_candidate_refs_json: string;
  unresolved_tensions_preserved_json: string;
  knowledge_gaps_preserved_json: string;
  durable_state_applied: number;
  formation_receipt_written: number;
  promotion_executed: number;
  proof_or_evidence_created: number;
  claim_or_evidence_written: number;
  product_write_executed: number;
  reason_codes_json: string;
  authority_boundary_json: string;
}

interface FormationReceiptLineageRow {
  receipt_id: string;
  scope: string;
  promotion_decision_id: string;
  review_record_ref: string;
  operator_actor_ref: string;
  formation_receipt_written: number;
  durable_state_applied: number;
  promotion_executed: number;
  proof_or_evidence_created: number;
  claim_or_evidence_written: number;
  product_write_executed: number;
  unresolved_tensions_preserved_json: string;
  knowledge_gaps_preserved_json: string;
  discarded_at: string | null;
}

interface FormationReceiptCandidateLineageRow {
  candidate_ref: string;
}

const DURABLE_PERSPECTIVE_STATE_APPLY_VERSION = "durable_perspective_state_apply.v0.1" as const;
const DURABLE_PERSPECTIVE_STATE_VERSION = "durable_perspective_state.v0.1" as const;
const DURABLE_PERSPECTIVE_STATE_APPLY_EVENT_VERSION =
  "durable_perspective_state_apply_event.v0.1" as const;

const scope = "project:augnes" as const;

const allowedDurablePerspectiveApplyOperations = [
  "add",
  "refine",
  "weaken",
  "reverse",
  "split",
  "merge",
  "retire",
  "reweight",
  "reactivate",
  "unknown",
] as const satisfies readonly DurablePerspectiveApplyOperation[];

const allowedDurablePerspectiveStateReasonCodes = [
  "promotion_decision_ref_present",
  "promotion_decision_ref_missing",
  "formation_receipt_ref_present",
  "formation_receipt_ref_missing",
  "formation_receipt_written",
  "formation_receipt_required_before_state_apply",
  "formation_receipt_not_written",
  "formation_receipt_discarded",
  "formation_receipt_already_applied",
  "review_record_ref_present",
  "review_record_ref_missing",
  "operator_actor_present",
  "operator_actor_missing",
  "selected_candidate_ref_present",
  "selected_candidate_ref_missing",
  "source_ref_present",
  "source_ref_missing",
  "omitted_candidate_preserved",
  "deferred_candidate_preserved",
  "prior_thesis_preserved",
  "retired_claim_preserved",
  "contradiction_preserved",
  "unresolved_tension_preserved",
  "unresolved_tension_resolved_explicitly",
  "unresolved_tension_loss_blocked",
  "knowledge_gap_preserved",
  "knowledge_gap_deferred",
  "knowledge_gap_closed_explicitly",
  "knowledge_gap_loss_blocked",
  "durable_state_applied",
  "promotion_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "claim_evidence_not_written",
  "product_write_denied",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
  "provider_call_not_executed",
  "prompt_not_sent",
  "retrieval_not_executed",
  "rag_answer_not_generated",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "db_write_executed_for_state_apply_only",
  "git_ledger_export_not_executed",
] as const satisfies readonly DurablePerspectiveStateReasonCode[];

const forbiddenAuthorityFields = [
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
  "source_of_truth_created_from_provider",
  "source_of_truth_created_from_retrieval",
  "candidate_is_fact",
  "candidate_is_proof",
  "candidate_is_accepted_evidence",
  "provider_output_is_truth",
  "retrieval_result_is_evidence",
  "rag_context_is_truth",
  "feedback_is_truth",
  "product_write_authority",
] as const;

const safeRouteDbPathPrefixes = [
  "tmp/perspective-promotion-decisions/",
  ".tmp/perspective-promotion-decisions/",
  "tmp/perspective-formation-receipts/",
  ".tmp/perspective-formation-receipts/",
  "tmp/perspective-state/",
  ".tmp/perspective-state/",
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
  /raw durable perspective state payload/i,
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
  /secret-like durable perspective state input/i,
];

const allowedReasonCodeSet = new Set<string>(allowedDurablePerspectiveStateReasonCodes);

export function createDurablePerspectiveStateAuthorityBoundaryV01(): DurablePerspectiveStateAuthorityBoundary {
  return {
    durable_perspective_state_apply_now: true,
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
    source_of_truth_created_from_provider: false,
    source_of_truth_created_from_retrieval: false,
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

export const durablePerspectiveStateSchemaSqlV01 = `
CREATE TABLE IF NOT EXISTS perspective_states (
  perspective_id text primary key,
  scope text not null,
  state_version text not null,
  current_thesis text not null,
  salience_state_json text not null,
  reuse_conditions_json text not null,
  promotion_history_json text not null,
  retirement_history_json text not null,
  formation_receipt_refs_json text not null,
  authority_boundary_json text not null,
  reason_codes_json text not null,
  created_at text not null,
  updated_at text not null
);

CREATE TABLE IF NOT EXISTS perspective_state_prior_theses (
  id text primary key,
  perspective_id text not null,
  thesis text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_state_claims (
  id text primary key,
  perspective_id text not null,
  claim_ref text not null,
  claim_status text not null,
  bounded_summary text not null,
  source_refs_json text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_state_evidence_refs (
  id text primary key,
  perspective_id text not null,
  evidence_ref text not null,
  evidence_relation text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_state_tensions (
  id text primary key,
  perspective_id text not null,
  tension_ref text not null,
  tension_status text not null,
  bounded_summary text not null,
  source_refs_json text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_state_knowledge_gaps (
  id text primary key,
  perspective_id text not null,
  knowledge_gap_ref text not null,
  gap_status text not null,
  bounded_summary text not null,
  source_refs_json text not null,
  reason_codes_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_state_apply_events (
  apply_event_id text primary key,
  perspective_id text not null,
  promotion_decision_id text not null,
  formation_receipt_id text not null,
  review_record_ref text not null,
  operator_actor_ref text not null,
  apply_operation text not null,
  applied_at text not null,
  prior_state_version text,
  next_state_version text not null,
  selected_candidate_refs_json text not null,
  omitted_candidate_refs_json text not null,
  deferred_candidate_refs_json text not null,
  unresolved_tensions_preserved_json text not null,
  knowledge_gaps_preserved_json text not null,
  durable_state_applied integer not null default 1,
  formation_receipt_written integer not null default 1,
  promotion_executed integer not null default 0,
  proof_or_evidence_created integer not null default 0,
  claim_or_evidence_written integer not null default 0,
  product_write_executed integer not null default 0,
  reason_codes_json text not null,
  authority_boundary_json text not null
);

CREATE TABLE IF NOT EXISTS perspective_state_activity (
  activity_id text primary key,
  perspective_id text not null,
  activity_kind text not null,
  actor_ref text not null,
  summary text not null,
  reason_codes_json text not null,
  created_at text not null
);

CREATE INDEX IF NOT EXISTS idx_perspective_state_apply_events_perspective
  ON perspective_state_apply_events(perspective_id, applied_at);
CREATE INDEX IF NOT EXISTS idx_perspective_state_apply_events_receipt
  ON perspective_state_apply_events(formation_receipt_id);
CREATE INDEX IF NOT EXISTS idx_perspective_state_activity
  ON perspective_state_activity(perspective_id, created_at);
`;

export function ensureDurablePerspectiveStateSchemaV01(db: DurablePerspectiveDbLike): void {
  db.exec(durablePerspectiveStateSchemaSqlV01);
}

export function durablePerspectiveStateSchemaExistsV01(db: DurablePerspectiveDbLike): boolean {
  const requiredTables = [
    "perspective_states",
    "perspective_state_prior_theses",
    "perspective_state_claims",
    "perspective_state_evidence_refs",
    "perspective_state_tensions",
    "perspective_state_knowledge_gaps",
    "perspective_state_apply_events",
    "perspective_state_activity",
  ];
  const rows = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name IN (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .all(...requiredTables) as { name: string }[];
  const tableNames = new Set(rows.map((row) => row.name));
  return requiredTables.every((tableName) => tableNames.has(tableName));
}

export function applyDurablePerspectiveStateV01(
  input: DurablePerspectiveStateApplyInput,
  db: DurablePerspectiveDbLike,
): DurablePerspectiveStateApplyResult {
  const validation = validateDurablePerspectiveStateApplyInputV01(input);
  if (!validation.passed) {
    return blockedResult(durablePerspectiveStatusForValidationFailuresV01(validation.failure_codes));
  }

  const receiptLineage = validateFormationReceiptLineageV01(input, db);
  if (!receiptLineage.passed) {
    return blockedResult(receiptLineage.status, receiptLineage.reason_codes);
  }

  ensureDurablePerspectiveStateSchemaV01(db);
  if (applyEventExistsForReceipt(db, input.formation_receipt_id)) {
    return blockedResult("blocked_already_applied_receipt", [
      "formation_receipt_ref_present",
      "formation_receipt_already_applied",
      "formation_receipt_required_before_state_apply",
      "product_write_denied",
    ]);
  }

  const priorState = readStateById(db, input.perspective_id);
  const preservationFailure = validatePriorStatePreservationV01(input, priorState);
  if (preservationFailure) return blockedResult(preservationFailure.status, preservationFailure.reason_codes);

  const nextStateVersion = `${DURABLE_PERSPECTIVE_STATE_VERSION}:${String(
    countApplyEventsForPerspective(db, input.perspective_id) + 1,
  ).padStart(3, "0")}`;
  const priorTheses = priorState
    ? uniqueSorted([...priorState.prior_theses, priorState.current_thesis])
    : [];
  const retirementHistory = uniqueSorted([
    ...(priorState?.retirement_history ?? []),
    ...input.retired_claims.map((claim) => claim.claim_ref),
  ]);
  const state = buildDurablePerspectiveStateV01(input, {
    priorTheses,
    promotionHistory: priorState?.promotion_history ?? [],
    retirementHistory,
    formationReceiptRefs: priorState?.formation_receipt_refs ?? [],
    createdAt: priorState?.created_at,
    updatedAt: input.applied_at,
  });
  const event = buildDurablePerspectiveStateApplyEventV01(input, {
    nextStateVersion,
    priorStateVersion: priorState?.state_version ?? input.prior_state_version,
  });

  let transactionStarted = false;
  try {
    db.prepare("BEGIN IMMEDIATE").run();
    transactionStarted = true;
    upsertStateRow(db, state);
    replaceStateRefs(db, state);
    insertApplyEvent(db, event);
    insertActivity(db, {
      activity_id: `${event.apply_event_id}:activity:applied`,
      perspective_id: event.perspective_id,
      activity_kind: "durable_perspective_state_applied",
      actor_ref: event.operator_actor_ref,
      summary: "Durable Perspective state applied from Formation Receipt-backed operator decision.",
      reason_codes: [
        "durable_state_applied",
        "formation_receipt_required_before_state_apply",
        "product_write_denied",
      ],
      created_at: event.applied_at,
    });
    db.prepare("COMMIT").run();
    transactionStarted = false;
    const storedState = readStateById(db, state.perspective_id) ?? state;
    return result("applied", storedState, [storedState], event, listApplyEvents({ perspective_id: state.perspective_id }, db), [
      "durable_state_applied",
      "formation_receipt_written",
      "formation_receipt_required_before_state_apply",
      "promotion_not_executed",
      "proof_not_created",
      "evidence_not_created",
      "claim_evidence_not_written",
      "product_write_denied",
      "db_write_executed_for_state_apply_only",
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

export function readDurablePerspectiveStateV01(
  perspectiveId: string,
  db: DurablePerspectiveDbLike,
): DurablePerspectiveStateApplyResult {
  if (!isSafeString(perspectiveId)) return blockedResult("blocked_private_or_raw_payload");
  const state = readStateById(db, perspectiveId);
  if (!state) return result("not_found", null, [], null, [], ["formation_receipt_ref_present"]);
  return result(
    "applied",
    state,
    [state],
    null,
    listApplyEvents({ perspective_id: perspectiveId }, db),
    ["durable_state_applied", "formation_receipt_written", "product_write_denied"],
  );
}

export function listDurablePerspectiveApplyEventsV01(
  filters: DurablePerspectiveApplyEventListFilters,
  db: DurablePerspectiveDbLike,
): DurablePerspectiveStateApplyResult {
  if (filters.perspective_id && !isSafeString(filters.perspective_id)) {
    return blockedResult("blocked_private_or_raw_payload");
  }
  if (filters.formation_receipt_id && !isSafeString(filters.formation_receipt_id)) {
    return blockedResult("blocked_private_or_raw_payload");
  }
  const events = listApplyEvents(filters, db);
  return result(
    "applied",
    null,
    [],
    events[0] ?? null,
    events,
    ["durable_state_applied", "formation_receipt_written", "product_write_denied"],
  );
}

export function isSafeDurablePerspectiveStateRouteDbPathV01(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!value.endsWith(".sqlite") && !value.endsWith(".db")) return false;
  if (value.startsWith("/") || /^[A-Za-z]:/.test(value)) return false;
  if (value.includes("\\") || value.includes("//") || value.includes("..") || value.includes("\0")) {
    return false;
  }
  if (!safeRouteDbPathPrefixes.some((prefix) => value.startsWith(prefix))) return false;
  return !hasUnsafeString(value);
}

function validateDurablePerspectiveStateApplyInputV01(
  input: unknown,
): DurablePerspectiveStateValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const value = input as Partial<DurablePerspectiveStateApplyInput>;
  const failureCodes: string[] = [];
  if (value.apply_version !== DURABLE_PERSPECTIVE_STATE_APPLY_VERSION) {
    failureCodes.push("apply_version_invalid");
  }
  if (value.scope !== scope) failureCodes.push("scope_invalid");
  if (!isSafeString(value.apply_event_id)) failureCodes.push("apply_event_id_invalid");
  if (!isSafeString(value.perspective_id)) failureCodes.push("perspective_id_invalid");
  if (!isSafeString(value.promotion_decision_id)) failureCodes.push("promotion_decision_ref_missing");
  if (!isSafeString(value.formation_receipt_id)) failureCodes.push("formation_receipt_ref_missing");
  if (!isSafeString(value.review_record_ref)) failureCodes.push("review_record_ref_missing");
  if (!isSafeString(value.operator_actor_ref)) failureCodes.push("operator_actor_missing");
  if (!allowedDurablePerspectiveApplyOperations.includes(value.apply_operation as DurablePerspectiveApplyOperation)) {
    failureCodes.push("apply_operation_invalid");
  }
  if (!isSafeString(value.current_thesis)) failureCodes.push("current_thesis_invalid");
  if (value.prior_state_version !== null && value.prior_state_version !== undefined) {
    failureCodes.push(...validateRequiredSafeString(value.prior_state_version, "prior_state_version"));
  }

  for (const key of [
    "selected_candidate_refs",
    "omitted_candidate_refs",
    "deferred_candidate_refs",
    "supporting_evidence_refs",
    "contradicting_evidence_refs",
    "reuse_conditions",
    "boundary_notes",
  ] as const) {
    failureCodes.push(...validateStringArray(value[key], key));
  }
  failureCodes.push(...validateReasonCodeArray(value.reason_codes, "reason_codes"));

  if (arrayOrEmpty(value.selected_candidate_refs).length === 0) {
    failureCodes.push("selected_candidate_ref_missing");
  }
  if (arrayOrEmpty(value.supporting_evidence_refs).length === 0) {
    failureCodes.push("source_ref_missing");
  }

  failureCodes.push(...validateClaimRefs(arrayOrEmpty(value.active_claims), "active_claims"));
  failureCodes.push(...validateClaimRefs(arrayOrEmpty(value.retired_claims), "retired_claims"));
  failureCodes.push(...validateTensionRefs(arrayOrEmpty(value.open_tensions), "open_tensions"));
  failureCodes.push(...validateTensionRefs(arrayOrEmpty(value.resolved_tensions), "resolved_tensions"));
  failureCodes.push(...validateKnowledgeGapRefs(arrayOrEmpty(value.knowledge_gaps), "knowledge_gaps"));
  failureCodes.push(...validateSalienceState(value.salience_state));
  failureCodes.push(...validateInputAuthorityBoundary(value.authority_boundary));

  for (const [field, fieldValue] of Object.entries(value)) {
    if (
      [
        "active_claims",
        "retired_claims",
        "open_tensions",
        "resolved_tensions",
        "knowledge_gaps",
      ].includes(field)
    ) {
      continue;
    }
    failureCodes.push(...validatePublicSafeValue(fieldValue, field));
  }

  return { passed: failureCodes.length === 0, failure_codes: uniqueSorted(failureCodes) };
}

function durablePerspectiveStatusForValidationFailuresV01(
  failureCodes: string[],
): DurablePerspectiveApplyStatus {
  if (failureCodes.some((code) => code.includes("private") || code.includes("raw") || code.includes("unsafe"))) {
    return "blocked_private_or_raw_payload";
  }
  if (failureCodes.includes("promotion_decision_ref_missing")) return "blocked_missing_promotion_decision";
  if (failureCodes.includes("formation_receipt_ref_missing")) return "blocked_missing_formation_receipt";
  if (failureCodes.includes("selected_candidate_ref_missing")) return "blocked_missing_selected_candidates";
  if (failureCodes.includes("source_ref_missing")) return "blocked_missing_source_refs";
  if (failureCodes.includes("unresolved_tension_loss_blocked")) return "blocked_unresolved_tension_loss";
  if (failureCodes.includes("knowledge_gap_loss_blocked")) return "blocked_knowledge_gap_loss";
  if (failureCodes.some((code) => code.startsWith("authority_boundary_forbidden"))) {
    return "blocked_forbidden_authority";
  }
  return "blocked_invalid_input";
}

function buildDurablePerspectiveStateApplyEventV01(
  input: DurablePerspectiveStateApplyInput,
  options?: { nextStateVersion?: string; priorStateVersion?: string | null },
): DurablePerspectiveStateApplyEvent {
  const validation = validateDurablePerspectiveStateApplyInputV01(input);
  if (!validation.passed) {
    throw new Error(`durable_perspective_state_apply_input_invalid:${validation.failure_codes.join(",")}`);
  }
  return {
    apply_event_version: DURABLE_PERSPECTIVE_STATE_APPLY_EVENT_VERSION,
    apply_version: DURABLE_PERSPECTIVE_STATE_APPLY_VERSION,
    state_version: DURABLE_PERSPECTIVE_STATE_VERSION,
    scope,
    apply_event_id: input.apply_event_id,
    perspective_id: input.perspective_id,
    promotion_decision_id: input.promotion_decision_id,
    formation_receipt_id: input.formation_receipt_id,
    review_record_ref: input.review_record_ref,
    operator_actor_ref: input.operator_actor_ref,
    apply_operation: input.apply_operation,
    applied_at: input.applied_at ?? "2026-06-26T00:00:00.000Z",
    prior_state_version: options?.priorStateVersion ?? input.prior_state_version,
    next_state_version: options?.nextStateVersion ?? `${DURABLE_PERSPECTIVE_STATE_VERSION}:preview`,
    selected_candidate_refs: uniqueSorted(input.selected_candidate_refs),
    omitted_candidate_refs: uniqueSorted(input.omitted_candidate_refs),
    deferred_candidate_refs: uniqueSorted(input.deferred_candidate_refs),
    unresolved_tensions_preserved: uniqueSorted([
      ...input.open_tensions.map((tension) => tension.tension_ref),
      ...input.resolved_tensions.map((tension) => tension.tension_ref),
    ]),
    knowledge_gaps_preserved: uniqueSorted(input.knowledge_gaps.map((gap) => gap.knowledge_gap_ref)),
    durable_state_applied: true,
    formation_receipt_written: true,
    promotion_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    reason_codes: uniqueSorted([
      ...input.reason_codes,
      "promotion_decision_ref_present",
      "formation_receipt_ref_present",
      "formation_receipt_written",
      "formation_receipt_required_before_state_apply",
      "selected_candidate_ref_present",
      "source_ref_present",
      "durable_state_applied",
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
      "db_write_executed_for_state_apply_only",
      "git_ledger_export_not_executed",
    ]),
    authority_boundary: createDurablePerspectiveStateAuthorityBoundaryV01(),
  };
}

function buildDurablePerspectiveStateV01(
  input: DurablePerspectiveStateApplyInput,
  options?: {
    priorTheses?: string[];
    promotionHistory?: string[];
    retirementHistory?: string[];
    formationReceiptRefs?: string[];
    createdAt?: string;
    updatedAt?: string;
  },
): DurablePerspectiveState {
  const event = buildDurablePerspectiveStateApplyEventV01(input);
  const createdAt = options?.createdAt ?? input.applied_at ?? "2026-06-26T00:00:00.000Z";
  const stateWithoutFingerprint = {
    state_version: DURABLE_PERSPECTIVE_STATE_VERSION,
    apply_version: DURABLE_PERSPECTIVE_STATE_APPLY_VERSION,
    scope,
    perspective_id: input.perspective_id,
    current_thesis: input.current_thesis,
    prior_theses: uniqueSorted(options?.priorTheses ?? []),
    active_claims: normalizeClaimRefs(input.active_claims),
    retired_claims: normalizeClaimRefs(input.retired_claims),
    supporting_evidence_refs: uniqueSorted(input.supporting_evidence_refs),
    contradicting_evidence_refs: uniqueSorted(input.contradicting_evidence_refs),
    open_tensions: normalizeTensionRefs(input.open_tensions),
    resolved_tensions: normalizeTensionRefs(input.resolved_tensions),
    knowledge_gaps: normalizeKnowledgeGapRefs(input.knowledge_gaps),
    promotion_history: uniqueSorted([...(options?.promotionHistory ?? []), input.promotion_decision_id]),
    retirement_history: uniqueSorted(options?.retirementHistory ?? []),
    formation_receipt_refs: uniqueSorted([...(options?.formationReceiptRefs ?? []), input.formation_receipt_id]),
    salience_state: stableClone(input.salience_state),
    reuse_conditions: uniqueSorted(input.reuse_conditions),
    created_at: createdAt,
    updated_at: options?.updatedAt ?? event.applied_at,
    authority_boundary: createDurablePerspectiveStateAuthorityBoundaryV01(),
    reason_codes: event.reason_codes,
  };
  return {
    ...stateWithoutFingerprint,
    state_fingerprint: createDurablePerspectiveStateFingerprintV01(stateWithoutFingerprint),
  };
}

function normalizeDurablePerspectiveStateV01(input: DurablePerspectiveState): DurablePerspectiveState {
  const stateWithoutFingerprint = {
    state_version: DURABLE_PERSPECTIVE_STATE_VERSION,
    apply_version: DURABLE_PERSPECTIVE_STATE_APPLY_VERSION,
    scope,
    perspective_id: input.perspective_id,
    current_thesis: input.current_thesis,
    prior_theses: uniqueSorted(input.prior_theses),
    active_claims: normalizeClaimRefs(input.active_claims),
    retired_claims: normalizeClaimRefs(input.retired_claims),
    supporting_evidence_refs: uniqueSorted(input.supporting_evidence_refs),
    contradicting_evidence_refs: uniqueSorted(input.contradicting_evidence_refs),
    open_tensions: normalizeTensionRefs(input.open_tensions),
    resolved_tensions: normalizeTensionRefs(input.resolved_tensions),
    knowledge_gaps: normalizeKnowledgeGapRefs(input.knowledge_gaps),
    promotion_history: uniqueSorted(input.promotion_history),
    retirement_history: uniqueSorted(input.retirement_history),
    formation_receipt_refs: uniqueSorted(input.formation_receipt_refs),
    salience_state: stableClone(input.salience_state),
    reuse_conditions: uniqueSorted(input.reuse_conditions),
    created_at: input.created_at,
    updated_at: input.updated_at,
    authority_boundary: createDurablePerspectiveStateAuthorityBoundaryV01(),
    reason_codes: uniqueSorted(input.reason_codes),
  };
  return {
    ...stateWithoutFingerprint,
    state_fingerprint: createDurablePerspectiveStateFingerprintV01(stateWithoutFingerprint),
  };
}

function createDurablePerspectiveStateFingerprintV01(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function validateClaimRefs(refs: unknown[], path: string): string[] {
  return refs.flatMap((ref, index) => {
    const failureCodes: string[] = [];
    if (!ref || typeof ref !== "object" || Array.isArray(ref)) return [`${path}.${index}_invalid`];
    const value = ref as Partial<DurablePerspectiveClaimRef>;
    failureCodes.push(...validateRequiredSafeString(value.claim_ref, `${path}.${index}.claim_ref`));
    failureCodes.push(...validateRequiredSafeString(value.bounded_summary, `${path}.${index}.bounded_summary`));
    failureCodes.push(...validateStringArray(value.source_refs, `${path}.${index}.source_refs`));
    failureCodes.push(...validateReasonCodeArray(value.reason_codes, `${path}.${index}.reason_codes`));
    return failureCodes;
  });
}

function validateTensionRefs(refs: unknown[], path: string): string[] {
  return refs.flatMap((ref, index) => {
    const failureCodes: string[] = [];
    if (!ref || typeof ref !== "object" || Array.isArray(ref)) return [`${path}.${index}_invalid`];
    const value = ref as Partial<DurablePerspectiveTensionRef>;
    failureCodes.push(...validateRequiredSafeString(value.tension_ref, `${path}.${index}.tension_ref`));
    failureCodes.push(...validateRequiredSafeString(value.bounded_summary, `${path}.${index}.bounded_summary`));
    failureCodes.push(...validateStringArray(value.source_refs, `${path}.${index}.source_refs`));
    failureCodes.push(...validateReasonCodeArray(value.reason_codes, `${path}.${index}.reason_codes`));
    return failureCodes;
  });
}

function validateKnowledgeGapRefs(refs: unknown[], path: string): string[] {
  return refs.flatMap((ref, index) => {
    const failureCodes: string[] = [];
    if (!ref || typeof ref !== "object" || Array.isArray(ref)) return [`${path}.${index}_invalid`];
    const value = ref as Partial<DurablePerspectiveKnowledgeGapRef>;
    failureCodes.push(...validateRequiredSafeString(value.knowledge_gap_ref, `${path}.${index}.knowledge_gap_ref`));
    failureCodes.push(...validateRequiredSafeString(value.bounded_summary, `${path}.${index}.bounded_summary`));
    if (!["open", "deferred", "closed", "unknown"].includes(String(value.gap_status))) {
      failureCodes.push(`${path}.${index}.gap_status_invalid`);
    }
    failureCodes.push(...validateStringArray(value.source_refs, `${path}.${index}.source_refs`));
    failureCodes.push(...validateReasonCodeArray(value.reason_codes, `${path}.${index}.reason_codes`));
    return failureCodes;
  });
}

function validateSalienceState(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return ["salience_state_invalid"];
  return validatePublicSafeValue(value, "salience_state");
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

function validateStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) return [`${path}_invalid`];
  return value.flatMap((item, index) => {
    if (typeof item !== "string") return [`${path}.${index}_non_string`];
    if (item.length === 0) return [`${path}.${index}_empty`];
    return hasUnsafeString(item) ? [`${path}.${index}_unsafe_private_or_raw_marker`] : [];
  });
}

function validateReasonCodeArray(value: unknown, path: string): string[] {
  const failureCodes = validateStringArray(value, path);
  if (!Array.isArray(value)) return failureCodes;
  for (const [index, item] of value.entries()) {
    if (typeof item === "string" && item.length > 0 && !allowedReasonCodeSet.has(item)) {
      failureCodes.push(`${path}.${index}_unknown_reason_code`);
    }
  }
  return failureCodes;
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

function arrayOrEmpty(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeClaimRefs(refs: DurablePerspectiveClaimRef[]): DurablePerspectiveClaimRef[] {
  return [...refs]
    .map((ref) => ({
      claim_ref: ref.claim_ref,
      bounded_summary: ref.bounded_summary,
      source_refs: uniqueSorted(ref.source_refs),
      reason_codes: uniqueSorted(ref.reason_codes),
    }))
    .sort((a, b) => a.claim_ref.localeCompare(b.claim_ref));
}

function normalizeTensionRefs(refs: DurablePerspectiveTensionRef[]): DurablePerspectiveTensionRef[] {
  return [...refs]
    .map((ref) => ({
      tension_ref: ref.tension_ref,
      bounded_summary: ref.bounded_summary,
      source_refs: uniqueSorted(ref.source_refs),
      reason_codes: uniqueSorted(ref.reason_codes),
    }))
    .sort((a, b) => a.tension_ref.localeCompare(b.tension_ref));
}

function normalizeKnowledgeGapRefs(refs: DurablePerspectiveKnowledgeGapRef[]): DurablePerspectiveKnowledgeGapRef[] {
  return [...refs]
    .map((ref) => ({
      knowledge_gap_ref: ref.knowledge_gap_ref,
      bounded_summary: ref.bounded_summary,
      source_refs: uniqueSorted(ref.source_refs),
      gap_status: ref.gap_status,
      reason_codes: uniqueSorted(ref.reason_codes),
    }))
    .sort((a, b) => a.knowledge_gap_ref.localeCompare(b.knowledge_gap_ref));
}

function stableClone<T>(value: T): T {
  return JSON.parse(stableStringify(value)) as T;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function validateFormationReceiptLineageV01(
  input: DurablePerspectiveStateApplyInput,
  db: DurablePerspectiveDbLike,
): {
  passed: boolean;
  status: DurablePerspectiveApplyStatus;
  reason_codes: DurablePerspectiveStateReasonCode[];
} {
  if (!formationReceiptLineageTablesExistV01(db)) {
    return {
      passed: false,
      status: "blocked_missing_formation_receipt",
      reason_codes: [
        "formation_receipt_ref_missing",
        "formation_receipt_required_before_state_apply",
        "product_write_denied",
      ],
    };
  }

  const row = db
    .prepare(
      `SELECT
        receipt_id,
        scope,
        promotion_decision_id,
        review_record_ref,
        operator_actor_ref,
        formation_receipt_written,
        durable_state_applied,
        promotion_executed,
        proof_or_evidence_created,
        claim_or_evidence_written,
        product_write_executed,
        unresolved_tensions_preserved_json,
        knowledge_gaps_preserved_json,
        discarded_at
       FROM perspective_formation_receipts
       WHERE receipt_id = ?`,
    )
    .get(input.formation_receipt_id) as FormationReceiptLineageRow | undefined;

  if (!row || row.scope !== scope) {
    return {
      passed: false,
      status: "blocked_missing_formation_receipt",
      reason_codes: [
        "formation_receipt_ref_missing",
        "formation_receipt_required_before_state_apply",
        "product_write_denied",
      ],
    };
  }

  const reasonCodes: DurablePerspectiveStateReasonCode[] = [
    "promotion_decision_ref_present",
    "formation_receipt_ref_present",
    "formation_receipt_required_before_state_apply",
    "promotion_not_executed",
    "proof_not_created",
    "evidence_not_created",
    "claim_evidence_not_written",
    "product_write_denied",
  ];

  if (row.discarded_at) {
    return {
      passed: false,
      status: "blocked_discarded_formation_receipt",
      reason_codes: uniqueSorted([...reasonCodes, "formation_receipt_discarded"]),
    };
  }
  if (row.formation_receipt_written !== 1) {
    return {
      passed: false,
      status: "blocked_formation_receipt_not_written",
      reason_codes: uniqueSorted([...reasonCodes, "formation_receipt_not_written"]),
    };
  }
  if (
    row.durable_state_applied !== 0 ||
    row.promotion_executed !== 0 ||
    row.proof_or_evidence_created !== 0 ||
    row.claim_or_evidence_written !== 0 ||
    row.product_write_executed !== 0
  ) {
    return {
      passed: false,
      status: row.durable_state_applied !== 0 ? "blocked_already_applied_receipt" : "blocked_forbidden_authority",
      reason_codes: uniqueSorted([
        ...reasonCodes,
        row.durable_state_applied !== 0 ? "formation_receipt_already_applied" : "product_write_denied",
      ]),
    };
  }
  if (
    row.promotion_decision_id !== input.promotion_decision_id ||
    row.review_record_ref !== input.review_record_ref ||
    row.operator_actor_ref !== input.operator_actor_ref
  ) {
    return {
      passed: false,
      status: "blocked_invalid_input",
      reason_codes: uniqueSorted([...reasonCodes, "review_record_ref_present", "operator_actor_present"]),
    };
  }

  const selectedCandidates = readReceiptCandidateRefs(db, "perspective_formation_receipt_selected_candidates", row.receipt_id);
  const omittedCandidates = readReceiptCandidateRefs(db, "perspective_formation_receipt_omitted_candidates", row.receipt_id);
  const deferredCandidates = readReceiptCandidateRefs(db, "perspective_formation_receipt_deferred_candidates", row.receipt_id);
  if (!includesAll(input.selected_candidate_refs, selectedCandidates)) {
    return {
      passed: false,
      status: "blocked_missing_selected_candidates",
      reason_codes: uniqueSorted([...reasonCodes, "selected_candidate_ref_missing"]),
    };
  }
  if (!includesAll(input.omitted_candidate_refs, omittedCandidates) || !includesAll(input.deferred_candidate_refs, deferredCandidates)) {
    return {
      passed: false,
      status: "blocked_invalid_input",
      reason_codes: uniqueSorted([...reasonCodes, "omitted_candidate_preserved", "deferred_candidate_preserved"]),
    };
  }

  const receiptTensions = parseStringArray(row.unresolved_tensions_preserved_json);
  const openTensionRefs = new Set(input.open_tensions.map((tension) => tension.tension_ref));
  const resolvedTensionRefs = new Set(input.resolved_tensions.map((tension) => tension.tension_ref));
  for (const tensionRef of receiptTensions) {
    if (!openTensionRefs.has(tensionRef) && !resolvedTensionRefs.has(tensionRef)) {
      return {
        passed: false,
        status: "blocked_unresolved_tension_loss",
        reason_codes: uniqueSorted([...reasonCodes, "unresolved_tension_loss_blocked"]),
      };
    }
  }
  for (const tension of input.open_tensions) {
    if (receiptTensions.includes(tension.tension_ref) && !hasReason(tension.reason_codes, "unresolved_tension_preserved")) {
      return {
        passed: false,
        status: "blocked_unresolved_tension_loss",
        reason_codes: uniqueSorted([...reasonCodes, "unresolved_tension_loss_blocked"]),
      };
    }
  }
  for (const tension of input.resolved_tensions) {
    if (
      receiptTensions.includes(tension.tension_ref) &&
      !hasReason(tension.reason_codes, "unresolved_tension_resolved_explicitly")
    ) {
      return {
        passed: false,
        status: "blocked_unresolved_tension_loss",
        reason_codes: uniqueSorted([...reasonCodes, "unresolved_tension_loss_blocked"]),
      };
    }
  }

  const receiptGaps = parseStringArray(row.knowledge_gaps_preserved_json);
  for (const gapRef of receiptGaps) {
    const gap = input.knowledge_gaps.find((candidate) => candidate.knowledge_gap_ref === gapRef);
    if (!gap) {
      return {
        passed: false,
        status: "blocked_knowledge_gap_loss",
        reason_codes: uniqueSorted([...reasonCodes, "knowledge_gap_loss_blocked"]),
      };
    }
    if (gap.gap_status === "open" && !hasReason(gap.reason_codes, "knowledge_gap_preserved")) {
      return {
        passed: false,
        status: "blocked_knowledge_gap_loss",
        reason_codes: uniqueSorted([...reasonCodes, "knowledge_gap_loss_blocked"]),
      };
    }
    if (gap.gap_status === "deferred" && !hasReason(gap.reason_codes, "knowledge_gap_deferred")) {
      return {
        passed: false,
        status: "blocked_knowledge_gap_loss",
        reason_codes: uniqueSorted([...reasonCodes, "knowledge_gap_loss_blocked"]),
      };
    }
    if (gap.gap_status === "closed" && !hasReason(gap.reason_codes, "knowledge_gap_closed_explicitly")) {
      return {
        passed: false,
        status: "blocked_knowledge_gap_loss",
        reason_codes: uniqueSorted([...reasonCodes, "knowledge_gap_loss_blocked"]),
      };
    }
  }

  return {
    passed: true,
    status: "applied",
    reason_codes: uniqueSorted([
      ...reasonCodes,
      "formation_receipt_written",
      "selected_candidate_ref_present",
      "source_ref_present",
      "omitted_candidate_preserved",
      "deferred_candidate_preserved",
      "unresolved_tension_preserved",
      "knowledge_gap_preserved",
    ]),
  };
}

function validatePriorStatePreservationV01(
  input: DurablePerspectiveStateApplyInput,
  priorState: DurablePerspectiveState | null,
): { status: DurablePerspectiveApplyStatus; reason_codes: DurablePerspectiveStateReasonCode[] } | null {
  if (!priorState) return null;
  const inputContradictions = new Set(input.contradicting_evidence_refs);
  if (!priorState.contradicting_evidence_refs.every((ref) => inputContradictions.has(ref))) {
    return {
      status: "blocked_invalid_input",
      reason_codes: ["contradiction_preserved", "product_write_denied"],
    };
  }
  const inputRetired = new Set(input.retired_claims.map((claim) => claim.claim_ref));
  if (!priorState.retired_claims.every((claim) => inputRetired.has(claim.claim_ref))) {
    return {
      status: "blocked_invalid_input",
      reason_codes: ["retired_claim_preserved", "product_write_denied"],
    };
  }
  const inputTensions = new Set([
    ...input.open_tensions.map((tension) => tension.tension_ref),
    ...input.resolved_tensions.map((tension) => tension.tension_ref),
  ]);
  if (!priorState.open_tensions.every((tension) => inputTensions.has(tension.tension_ref))) {
    return {
      status: "blocked_unresolved_tension_loss",
      reason_codes: ["unresolved_tension_loss_blocked", "product_write_denied"],
    };
  }
  const inputGaps = new Set(input.knowledge_gaps.map((gap) => gap.knowledge_gap_ref));
  if (!priorState.knowledge_gaps.every((gap) => inputGaps.has(gap.knowledge_gap_ref))) {
    return {
      status: "blocked_knowledge_gap_loss",
      reason_codes: ["knowledge_gap_loss_blocked", "product_write_denied"],
    };
  }
  return null;
}

function formationReceiptLineageTablesExistV01(db: DurablePerspectiveDbLike): boolean {
  const requiredTables = [
    "perspective_formation_receipts",
    "perspective_formation_receipt_selected_candidates",
    "perspective_formation_receipt_omitted_candidates",
    "perspective_formation_receipt_deferred_candidates",
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

function readReceiptCandidateRefs(
  db: DurablePerspectiveDbLike,
  tableName: string,
  receiptId: string,
): string[] {
  const rows = db
    .prepare(`SELECT candidate_ref FROM ${tableName} WHERE receipt_id = ? ORDER BY candidate_ref ASC`)
    .all(receiptId) as FormationReceiptCandidateLineageRow[];
  return rows.map((row) => row.candidate_ref).sort();
}

function applyEventExistsForReceipt(db: DurablePerspectiveDbLike, receiptId: string): boolean {
  const row = db
    .prepare("SELECT apply_event_id FROM perspective_state_apply_events WHERE formation_receipt_id = ? LIMIT 1")
    .get(receiptId) as { apply_event_id: string } | undefined;
  return Boolean(row);
}

function countApplyEventsForPerspective(db: DurablePerspectiveDbLike, perspectiveId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) AS count FROM perspective_state_apply_events WHERE perspective_id = ?")
    .get(perspectiveId) as { count: number };
  return Number(row.count);
}

function upsertStateRow(db: DurablePerspectiveDbLike, state: DurablePerspectiveState): void {
  db.prepare(
    `INSERT INTO perspective_states (
      perspective_id,
      scope,
      state_version,
      current_thesis,
      salience_state_json,
      reuse_conditions_json,
      promotion_history_json,
      retirement_history_json,
      formation_receipt_refs_json,
      authority_boundary_json,
      reason_codes_json,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(perspective_id) DO UPDATE SET
      state_version = excluded.state_version,
      current_thesis = excluded.current_thesis,
      salience_state_json = excluded.salience_state_json,
      reuse_conditions_json = excluded.reuse_conditions_json,
      promotion_history_json = excluded.promotion_history_json,
      retirement_history_json = excluded.retirement_history_json,
      formation_receipt_refs_json = excluded.formation_receipt_refs_json,
      authority_boundary_json = excluded.authority_boundary_json,
      reason_codes_json = excluded.reason_codes_json,
      updated_at = excluded.updated_at`,
  ).run(
    state.perspective_id,
    state.scope,
    state.state_version,
    state.current_thesis,
    JSON.stringify(state.salience_state),
    JSON.stringify(state.reuse_conditions),
    JSON.stringify(state.promotion_history),
    JSON.stringify(state.retirement_history),
    JSON.stringify(state.formation_receipt_refs),
    JSON.stringify(state.authority_boundary),
    JSON.stringify(state.reason_codes),
    state.created_at,
    state.updated_at,
  );
}

function replaceStateRefs(db: DurablePerspectiveDbLike, state: DurablePerspectiveState): void {
  for (const tableName of [
    "perspective_state_prior_theses",
    "perspective_state_claims",
    "perspective_state_evidence_refs",
    "perspective_state_tensions",
    "perspective_state_knowledge_gaps",
  ]) {
    db.prepare(`DELETE FROM ${tableName} WHERE perspective_id = ?`).run(state.perspective_id);
  }
  for (const thesis of state.prior_theses) insertPriorThesis(db, state.perspective_id, thesis);
  for (const claim of state.active_claims) insertClaim(db, state.perspective_id, "active", claim);
  for (const claim of state.retired_claims) insertClaim(db, state.perspective_id, "retired", claim);
  for (const evidenceRef of state.supporting_evidence_refs) insertEvidence(db, state.perspective_id, "supporting", evidenceRef);
  for (const evidenceRef of state.contradicting_evidence_refs) {
    insertEvidence(db, state.perspective_id, "contradicting", evidenceRef);
  }
  for (const tension of state.open_tensions) insertTension(db, state.perspective_id, "open", tension);
  for (const tension of state.resolved_tensions) insertTension(db, state.perspective_id, "resolved", tension);
  for (const gap of state.knowledge_gaps) insertKnowledgeGap(db, state.perspective_id, gap);
}

function insertPriorThesis(db: DurablePerspectiveDbLike, perspectiveId: string, thesis: string): void {
  db.prepare(
    `INSERT INTO perspective_state_prior_theses (id, perspective_id, thesis, reason_codes_json)
     VALUES (?, ?, ?, ?)`,
  ).run(`${perspectiveId}:prior-thesis:${hashForId(thesis)}`, perspectiveId, thesis, JSON.stringify(["prior_thesis_preserved"]));
}

function insertClaim(
  db: DurablePerspectiveDbLike,
  perspectiveId: string,
  claimStatus: "active" | "retired",
  claim: DurablePerspectiveClaimRef,
): void {
  db.prepare(
    `INSERT INTO perspective_state_claims (
      id,
      perspective_id,
      claim_ref,
      claim_status,
      bounded_summary,
      source_refs_json,
      reason_codes_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    `${perspectiveId}:${claimStatus}:${claim.claim_ref}`,
    perspectiveId,
    claim.claim_ref,
    claimStatus,
    claim.bounded_summary,
    JSON.stringify(uniqueSorted(claim.source_refs)),
    JSON.stringify(uniqueSorted(claim.reason_codes)),
  );
}

function insertEvidence(
  db: DurablePerspectiveDbLike,
  perspectiveId: string,
  relation: "supporting" | "contradicting",
  evidenceRef: string,
): void {
  db.prepare(
    `INSERT INTO perspective_state_evidence_refs (id, perspective_id, evidence_ref, evidence_relation, reason_codes_json)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    `${perspectiveId}:${relation}:${evidenceRef}`,
    perspectiveId,
    evidenceRef,
    relation,
    JSON.stringify(relation === "supporting" ? ["source_ref_present"] : ["contradiction_preserved"]),
  );
}

function insertTension(
  db: DurablePerspectiveDbLike,
  perspectiveId: string,
  tensionStatus: "open" | "resolved",
  tension: DurablePerspectiveTensionRef,
): void {
  db.prepare(
    `INSERT INTO perspective_state_tensions (
      id,
      perspective_id,
      tension_ref,
      tension_status,
      bounded_summary,
      source_refs_json,
      reason_codes_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    `${perspectiveId}:${tensionStatus}:${tension.tension_ref}`,
    perspectiveId,
    tension.tension_ref,
    tensionStatus,
    tension.bounded_summary,
    JSON.stringify(uniqueSorted(tension.source_refs)),
    JSON.stringify(uniqueSorted(tension.reason_codes)),
  );
}

function insertKnowledgeGap(
  db: DurablePerspectiveDbLike,
  perspectiveId: string,
  gap: DurablePerspectiveKnowledgeGapRef,
): void {
  db.prepare(
    `INSERT INTO perspective_state_knowledge_gaps (
      id,
      perspective_id,
      knowledge_gap_ref,
      gap_status,
      bounded_summary,
      source_refs_json,
      reason_codes_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    `${perspectiveId}:${gap.gap_status}:${gap.knowledge_gap_ref}`,
    perspectiveId,
    gap.knowledge_gap_ref,
    gap.gap_status,
    gap.bounded_summary,
    JSON.stringify(uniqueSorted(gap.source_refs)),
    JSON.stringify(uniqueSorted(gap.reason_codes)),
  );
}

function insertApplyEvent(db: DurablePerspectiveDbLike, event: DurablePerspectiveStateApplyEvent): void {
  db.prepare(
    `INSERT INTO perspective_state_apply_events (
      apply_event_id,
      perspective_id,
      promotion_decision_id,
      formation_receipt_id,
      review_record_ref,
      operator_actor_ref,
      apply_operation,
      applied_at,
      prior_state_version,
      next_state_version,
      selected_candidate_refs_json,
      omitted_candidate_refs_json,
      deferred_candidate_refs_json,
      unresolved_tensions_preserved_json,
      knowledge_gaps_preserved_json,
      durable_state_applied,
      formation_receipt_written,
      promotion_executed,
      proof_or_evidence_created,
      claim_or_evidence_written,
      product_write_executed,
      reason_codes_json,
      authority_boundary_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    event.apply_event_id,
    event.perspective_id,
    event.promotion_decision_id,
    event.formation_receipt_id,
    event.review_record_ref,
    event.operator_actor_ref,
    event.apply_operation,
    event.applied_at,
    event.prior_state_version,
    event.next_state_version,
    JSON.stringify(event.selected_candidate_refs),
    JSON.stringify(event.omitted_candidate_refs),
    JSON.stringify(event.deferred_candidate_refs),
    JSON.stringify(event.unresolved_tensions_preserved),
    JSON.stringify(event.knowledge_gaps_preserved),
    1,
    1,
    0,
    0,
    0,
    0,
    JSON.stringify(event.reason_codes),
    JSON.stringify(event.authority_boundary),
  );
}

function insertActivity(
  db: DurablePerspectiveDbLike,
  activity: {
    activity_id: string;
    perspective_id: string;
    activity_kind: string;
    actor_ref: string;
    summary: string;
    reason_codes: DurablePerspectiveStateReasonCode[];
    created_at: string;
  },
): void {
  db.prepare(
    `INSERT INTO perspective_state_activity (
      activity_id,
      perspective_id,
      activity_kind,
      actor_ref,
      summary,
      reason_codes_json,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    activity.activity_id,
    activity.perspective_id,
    activity.activity_kind,
    activity.actor_ref,
    activity.summary,
    JSON.stringify(uniqueSorted(activity.reason_codes)),
    activity.created_at,
  );
}

function readStateById(db: DurablePerspectiveDbLike, perspectiveId: string): DurablePerspectiveState | null {
  const row = db
    .prepare("SELECT * FROM perspective_states WHERE perspective_id = ?")
    .get(perspectiveId) as PerspectiveStateRow | undefined;
  if (!row) return null;
  return normalizeDurablePerspectiveStateV01({
    state_version: DURABLE_PERSPECTIVE_STATE_VERSION,
    apply_version: DURABLE_PERSPECTIVE_STATE_APPLY_VERSION,
    scope,
    perspective_id: row.perspective_id,
    current_thesis: row.current_thesis,
    prior_theses: readPriorTheses(db, row.perspective_id),
    active_claims: readClaims(db, row.perspective_id, "active"),
    retired_claims: readClaims(db, row.perspective_id, "retired"),
    supporting_evidence_refs: readEvidenceRefs(db, row.perspective_id, "supporting"),
    contradicting_evidence_refs: readEvidenceRefs(db, row.perspective_id, "contradicting"),
    open_tensions: readTensions(db, row.perspective_id, "open"),
    resolved_tensions: readTensions(db, row.perspective_id, "resolved"),
    knowledge_gaps: readKnowledgeGaps(db, row.perspective_id),
    promotion_history: parseStringArray(row.promotion_history_json),
    retirement_history: parseStringArray(row.retirement_history_json),
    formation_receipt_refs: parseStringArray(row.formation_receipt_refs_json),
    salience_state: parseJsonObject(row.salience_state_json),
    reuse_conditions: parseStringArray(row.reuse_conditions_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
    authority_boundary: createDurablePerspectiveStateAuthorityBoundaryV01(),
    reason_codes: parseReasonCodes(row.reason_codes_json),
    state_fingerprint: "",
  });
}

function readPriorTheses(db: DurablePerspectiveDbLike, perspectiveId: string): string[] {
  const rows = db
    .prepare(
      `SELECT thesis FROM perspective_state_prior_theses
       WHERE perspective_id = ?
       ORDER BY thesis ASC`,
    )
    .all(perspectiveId) as PerspectiveStateTextRow[];
  return rows.flatMap((row) => (typeof row.thesis === "string" ? [row.thesis] : []));
}

function readClaims(
  db: DurablePerspectiveDbLike,
  perspectiveId: string,
  claimStatus: "active" | "retired",
): DurablePerspectiveClaimRef[] {
  const rows = db
    .prepare(
      `SELECT claim_ref, bounded_summary, source_refs_json, reason_codes_json
       FROM perspective_state_claims
       WHERE perspective_id = ? AND claim_status = ?
       ORDER BY claim_ref ASC`,
    )
    .all(perspectiveId, claimStatus) as PerspectiveStateClaimRow[];
  return rows.map((row) => ({
    claim_ref: row.claim_ref,
    bounded_summary: row.bounded_summary,
    source_refs: parseStringArray(row.source_refs_json),
    reason_codes: parseReasonCodes(row.reason_codes_json),
  }));
}

function readEvidenceRefs(
  db: DurablePerspectiveDbLike,
  perspectiveId: string,
  relation: "supporting" | "contradicting",
): string[] {
  const rows = db
    .prepare(
      `SELECT evidence_ref FROM perspective_state_evidence_refs
       WHERE perspective_id = ? AND evidence_relation = ?
       ORDER BY evidence_ref ASC`,
    )
    .all(perspectiveId, relation) as PerspectiveStateTextRow[];
  return rows.flatMap((row) => (typeof row.evidence_ref === "string" ? [row.evidence_ref] : []));
}

function readTensions(
  db: DurablePerspectiveDbLike,
  perspectiveId: string,
  tensionStatus: "open" | "resolved",
): DurablePerspectiveTensionRef[] {
  const rows = db
    .prepare(
      `SELECT tension_ref, bounded_summary, source_refs_json, reason_codes_json
       FROM perspective_state_tensions
       WHERE perspective_id = ? AND tension_status = ?
       ORDER BY tension_ref ASC`,
    )
    .all(perspectiveId, tensionStatus) as PerspectiveStateTensionRow[];
  return rows.map((row) => ({
    tension_ref: row.tension_ref,
    bounded_summary: row.bounded_summary,
    source_refs: parseStringArray(row.source_refs_json),
    reason_codes: parseReasonCodes(row.reason_codes_json),
  }));
}

function readKnowledgeGaps(db: DurablePerspectiveDbLike, perspectiveId: string): DurablePerspectiveKnowledgeGapRef[] {
  const rows = db
    .prepare(
      `SELECT knowledge_gap_ref, bounded_summary, gap_status, source_refs_json, reason_codes_json
       FROM perspective_state_knowledge_gaps
       WHERE perspective_id = ?
       ORDER BY knowledge_gap_ref ASC`,
    )
    .all(perspectiveId) as PerspectiveStateKnowledgeGapRow[];
  return rows.map((row) => ({
    knowledge_gap_ref: row.knowledge_gap_ref,
    bounded_summary: row.bounded_summary,
    gap_status: row.gap_status,
    source_refs: parseStringArray(row.source_refs_json),
    reason_codes: parseReasonCodes(row.reason_codes_json),
  }));
}

function listApplyEvents(
  filters: DurablePerspectiveApplyEventListFilters,
  db: DurablePerspectiveDbLike,
): DurablePerspectiveStateApplyEvent[] {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (filters.perspective_id) {
    clauses.push("perspective_id = ?");
    params.push(filters.perspective_id);
  }
  if (filters.formation_receipt_id) {
    clauses.push("formation_receipt_id = ?");
    params.push(filters.formation_receipt_id);
  }
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT * FROM perspective_state_apply_events
       ${where}
       ORDER BY applied_at ASC, apply_event_id ASC`,
    )
    .all(...params) as PerspectiveApplyEventRow[];
  return rows.map(rowToApplyEvent);
}

function rowToApplyEvent(row: PerspectiveApplyEventRow): DurablePerspectiveStateApplyEvent {
  return {
    apply_event_version: DURABLE_PERSPECTIVE_STATE_APPLY_EVENT_VERSION,
    apply_version: DURABLE_PERSPECTIVE_STATE_APPLY_VERSION,
    state_version: DURABLE_PERSPECTIVE_STATE_VERSION,
    scope,
    apply_event_id: row.apply_event_id,
    perspective_id: row.perspective_id,
    promotion_decision_id: row.promotion_decision_id,
    formation_receipt_id: row.formation_receipt_id,
    review_record_ref: row.review_record_ref,
    operator_actor_ref: row.operator_actor_ref,
    apply_operation: row.apply_operation,
    applied_at: row.applied_at,
    prior_state_version: row.prior_state_version,
    next_state_version: row.next_state_version,
    selected_candidate_refs: parseStringArray(row.selected_candidate_refs_json),
    omitted_candidate_refs: parseStringArray(row.omitted_candidate_refs_json),
    deferred_candidate_refs: parseStringArray(row.deferred_candidate_refs_json),
    unresolved_tensions_preserved: parseStringArray(row.unresolved_tensions_preserved_json),
    knowledge_gaps_preserved: parseStringArray(row.knowledge_gaps_preserved_json),
    durable_state_applied: true,
    formation_receipt_written: true,
    promotion_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    reason_codes: parseReasonCodes(row.reason_codes_json),
    authority_boundary: createDurablePerspectiveStateAuthorityBoundaryV01(),
  };
}

function result(
  status: DurablePerspectiveApplyStatus,
  state: DurablePerspectiveState | null,
  states: DurablePerspectiveState[],
  applyEvent: DurablePerspectiveStateApplyEvent | null,
  applyEvents: DurablePerspectiveStateApplyEvent[],
  reasonCodes: DurablePerspectiveStateReasonCode[],
): DurablePerspectiveStateApplyResult {
  return {
    apply_version: DURABLE_PERSPECTIVE_STATE_APPLY_VERSION,
    state_version: DURABLE_PERSPECTIVE_STATE_VERSION,
    apply_event_version: DURABLE_PERSPECTIVE_STATE_APPLY_EVENT_VERSION,
    scope,
    status,
    state,
    states,
    apply_event: applyEvent,
    apply_events: applyEvents,
    error_code: status.startsWith("blocked") || status === "not_found" ? status : null,
    reason_codes: uniqueSorted(reasonCodes),
    durable_state_applied: status === "applied",
    formation_receipt_written: status === "applied",
    promotion_executed: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createDurablePerspectiveStateAuthorityBoundaryV01(),
  };
}

function blockedResult(
  status: DurablePerspectiveApplyStatus,
  overrideReasonCodes?: DurablePerspectiveStateReasonCode[],
): DurablePerspectiveStateApplyResult {
  const reasonCodesByStatus: Record<DurablePerspectiveApplyStatus, DurablePerspectiveStateReasonCode[]> = {
    applied: [],
    not_found: ["formation_receipt_ref_present"],
    blocked_missing_promotion_decision: ["promotion_decision_ref_missing"],
    blocked_missing_formation_receipt: ["formation_receipt_ref_missing"],
    blocked_discarded_formation_receipt: ["formation_receipt_discarded"],
    blocked_formation_receipt_not_written: ["formation_receipt_not_written"],
    blocked_already_applied_receipt: ["formation_receipt_already_applied"],
    blocked_missing_source_refs: ["source_ref_missing"],
    blocked_missing_selected_candidates: ["selected_candidate_ref_missing"],
    blocked_unresolved_tension_loss: ["unresolved_tension_loss_blocked"],
    blocked_knowledge_gap_loss: ["knowledge_gap_loss_blocked"],
    blocked_forbidden_authority: ["product_write_denied"],
    blocked_private_or_raw_payload: [
      "private_or_raw_payload_blocked",
      "secret_like_pattern_blocked",
      "local_path_blocked",
      "private_url_blocked",
    ],
    blocked_invalid_input: ["formation_receipt_ref_present"],
  };
  return result(status, null, [], null, [], overrideReasonCodes ?? reasonCodesByStatus[status]);
}

function includesAll(values: string[], requiredValues: string[]): boolean {
  const valueSet = new Set(values);
  return requiredValues.every((value) => valueSet.has(value));
}

function hasReason(
  values: DurablePerspectiveStateReasonCode[],
  requiredReason: DurablePerspectiveStateReasonCode,
): boolean {
  return values.includes(requiredReason);
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

function parseReasonCodes(value: string): DurablePerspectiveStateReasonCode[] {
  return parseStringArray(value).filter((item): item is DurablePerspectiveStateReasonCode =>
    allowedReasonCodeSet.has(item),
  );
}

function parseJsonObject(value: string): Record<string, unknown> {
  const parsed = JSON.parse(value) as unknown;
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort();
}

function hashForId(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}
