import { createHash } from "node:crypto";

import {
  ensureFeedbackEventAggregationRuntimeCompletionSchemaV01,
  isSafeFeedbackEventAggregationRuntimeDbPathV01,
  type FeedbackEventAggregationSqliteLikeV01,
} from "./feedback-event-aggregation-runtime";

const scope = "project:augnes" as const;
const feedbackEventTableName = "research_candidate_feedback_events";

export const FEEDBACK_CONTROLS_EXPANSION_RUNTIME_COMPLETION_VERSION =
  "feedback_controls_expansion_runtime_completion.v0.1" as const;
export const FEEDBACK_EVENT_WRITE_RUNTIME_VERSION =
  "feedback_event_write_runtime.v0.1" as const;
export const FEEDBACK_EVENT_WRITE_RUNTIME_REQUEST_VERSION =
  "feedback_event_write_runtime_request.v0.1" as const;
export const FEEDBACK_EVENT_WRITE_RUNTIME_EVENT_VERSION =
  "feedback_event_write_runtime_event.v0.1" as const;
export const FEEDBACK_EVENT_WRITE_RUNTIME_ROUTE_VERSION =
  "feedback_controls_expansion_runtime_completion_route.v0.1" as const;

export type FeedbackEventWriteRuntimeFeedbackKindV01 =
  | "pin"
  | "dismiss"
  | "correct"
  | "invalidate"
  | "needs_more_evidence"
  | "scope_overreach"
  | "not_relevant_now"
  | "mark_useful"
  | "mark_wrong";

export type FeedbackEventWriteRuntimeTargetLayerV01 =
  | "candidate"
  | "review_memory"
  | "durable_perspective_state"
  | "source_ref"
  | "provider_candidate"
  | "retrieval_context"
  | "layout_surface"
  | "unknown";

export type FeedbackEventWriteRuntimeStatusV01 =
  | "feedback_event_created"
  | "idempotent_existing"
  | "conflict_existing_feedback_event"
  | "blocked_private_or_raw_payload"
  | "blocked_forbidden_authority"
  | "blocked_invalid_input"
  | "invalid_db_path"
  | "rejected";

export interface FeedbackEventWriteRuntimeInputV01 {
  request_version: typeof FEEDBACK_EVENT_WRITE_RUNTIME_REQUEST_VERSION;
  event_version: typeof FEEDBACK_EVENT_WRITE_RUNTIME_EVENT_VERSION;
  scope: typeof scope;
  feedback_event_id: string;
  feedback_kind: FeedbackEventWriteRuntimeFeedbackKindV01;
  target_ref: string;
  target_kind: string;
  target_layer: FeedbackEventWriteRuntimeTargetLayerV01;
  target_fingerprint?: string;
  source_refs: string[];
  candidate_ref?: string;
  durable_ref?: string;
  feedback_summary: string;
  correction_text?: string;
  reason?: string;
  created_by: string;
  created_at: string;
  idempotency_key: string;
  authority_boundary?: Record<string, unknown>;
  reason_codes: string[];
}

export interface FeedbackEventWriteRuntimeAuthorityBoundaryV01 {
  feedback_controls_runtime_completion_now: true;
  explicit_operator_feedback_action_only: true;
  same_origin_post_route_now: true;
  caller_injected_db_only: true;
  feedback_event_write_now: true;
  feedback_event_persistence_now: true;
  advisory_signal_only: true;
  callback_compatibility_preserved: true;
  automatic_feedback_write_on_load_now: false;
  hidden_feedback_write_now: false;
  feedback_is_truth: false;
  pin_is_promotion: false;
  dismiss_is_delete: false;
  invalidate_is_source_suppression: false;
  rule_mutation_now: false;
  parser_mutation_now: false;
  prompt_mutation_now: false;
  ranking_mutation_now: false;
  surfacing_mutation_now: false;
  source_suppression_now: false;
  candidate_delete_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  work_item_write_now: false;
  promotion_execution_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  provider_openai_call_now: false;
  prompt_sent_now: false;
  source_fetch_now: false;
  retrieval_execution_now: false;
  retrieval_index_write_now: false;
  rag_answer_generation_now: false;
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
  smoke_pass_is_truth: false;
  ci_pass_is_truth: false;
}

export interface FeedbackEventRuntimeRecordV01 {
  event_id: string;
  event_version: typeof FEEDBACK_EVENT_WRITE_RUNTIME_EVENT_VERSION;
  event_type: FeedbackEventWriteRuntimeFeedbackKindV01;
  target_kind: string;
  target_id: string;
  target_fingerprint: string | null;
  source_ref_ids_json: string;
  operator_note: string;
  correction_text: string | null;
  reason: string | null;
  created_at: string;
  idempotency_key: string;
  authority_boundary_json: string;
  event_json: string;
}

export interface FeedbackEventWriteRuntimeResultV01 {
  write_runtime_version: typeof FEEDBACK_EVENT_WRITE_RUNTIME_VERSION;
  ui_version: typeof FEEDBACK_CONTROLS_EXPANSION_RUNTIME_COMPLETION_VERSION;
  scope: typeof scope;
  status: FeedbackEventWriteRuntimeStatusV01;
  feedback_event_id: string | null;
  idempotency_key: string | null;
  feedback_event_ref: string | null;
  feedback_event_persisted: boolean;
  aggregation_executed: false;
  rule_mutation_executed: false;
  parser_mutation_executed: false;
  prompt_mutation_executed: false;
  ranking_mutation_executed: false;
  surfacing_mutation_executed: false;
  source_suppression_executed: false;
  candidate_deleted: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  product_write_executed: false;
  authority_boundary: FeedbackEventWriteRuntimeAuthorityBoundaryV01;
  reason_codes: string[];
}

const allowedFeedbackKinds: FeedbackEventWriteRuntimeFeedbackKindV01[] = [
  "pin",
  "dismiss",
  "correct",
  "invalidate",
  "needs_more_evidence",
  "scope_overreach",
  "not_relevant_now",
  "mark_useful",
  "mark_wrong",
];

const allowedTargetLayers: FeedbackEventWriteRuntimeTargetLayerV01[] = [
  "candidate",
  "review_memory",
  "durable_perspective_state",
  "source_ref",
  "provider_candidate",
  "retrieval_context",
  "layout_surface",
  "unknown",
];

const allowedTrueAuthorityFields = new Set([
  "feedback_controls_runtime_completion_now",
  "explicit_operator_feedback_action_only",
  "same_origin_post_route_now",
  "caller_injected_db_only",
  "feedback_event_write_now",
  "feedback_event_persistence_now",
  "advisory_signal_only",
  "callback_compatibility_preserved",
]);

const knownForbiddenAuthorityFields = new Set([
  "automatic_feedback_write_on_load_now",
  "hidden_feedback_write_now",
  "feedback_is_truth",
  "pin_is_promotion",
  "dismiss_is_delete",
  "invalidate_is_source_suppression",
  "rule_mutation_now",
  "parser_mutation_now",
  "prompt_mutation_now",
  "ranking_mutation_now",
  "surfacing_mutation_now",
  "source_suppression_now",
  "candidate_delete_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "work_item_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "retrieval_index_write_now",
  "rag_answer_generation_now",
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
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
]);

const unsafePayloadPattern =
  /(SAFE_MARKER_|\/Users\/|\/home\/|file:\/\/|https:\/\/localhost|http:\/\/localhost|sk-|ghp_|OPENAI_API_KEY|GITHUB_TOKEN|password:|secret:|private key|raw provider output|raw retrieval output|raw feedback payload|raw feedback aggregation payload|raw conversation|hidden reasoning|raw DB row|raw_db_row|browser dump|raw browser dump|raw source body|actual prompt:|provider response:|actual query:|embedding vector:|vector index dump|telemetry dump|raw diff)/i;

export function isSafeFeedbackEventWriteRuntimeDbPathV01(value: unknown): boolean {
  if (!isSafeFeedbackEventAggregationRuntimeDbPathV01(value)) return false;
  return typeof value === "string" && !/(secret|token|password|private-key|api-key)/i.test(value);
}

export function createFeedbackEventWriteRuntimeAuthorityBoundaryV01(): FeedbackEventWriteRuntimeAuthorityBoundaryV01 {
  return {
    feedback_controls_runtime_completion_now: true,
    explicit_operator_feedback_action_only: true,
    same_origin_post_route_now: true,
    caller_injected_db_only: true,
    feedback_event_write_now: true,
    feedback_event_persistence_now: true,
    advisory_signal_only: true,
    callback_compatibility_preserved: true,
    automatic_feedback_write_on_load_now: false,
    hidden_feedback_write_now: false,
    feedback_is_truth: false,
    pin_is_promotion: false,
    dismiss_is_delete: false,
    invalidate_is_source_suppression: false,
    rule_mutation_now: false,
    parser_mutation_now: false,
    prompt_mutation_now: false,
    ranking_mutation_now: false,
    surfacing_mutation_now: false,
    source_suppression_now: false,
    candidate_delete_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    work_item_write_now: false,
    promotion_execution_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    provider_openai_call_now: false,
    prompt_sent_now: false,
    source_fetch_now: false,
    retrieval_execution_now: false,
    retrieval_index_write_now: false,
    rag_answer_generation_now: false,
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
    smoke_pass_is_truth: false,
    ci_pass_is_truth: false,
  };
}

export function validateFeedbackEventWriteRuntimeInputV01(
  input: unknown,
): { passed: boolean; failure_codes: string[] } {
  const failureCodes: string[] = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { passed: false, failure_codes: ["input_not_object"] };
  }

  const value = input as Partial<FeedbackEventWriteRuntimeInputV01>;
  if (value.request_version !== FEEDBACK_EVENT_WRITE_RUNTIME_REQUEST_VERSION) {
    failureCodes.push("request_version_invalid");
  }
  if (value.event_version !== FEEDBACK_EVENT_WRITE_RUNTIME_EVENT_VERSION) {
    failureCodes.push("event_version_invalid");
  }
  if (value.scope !== scope) failureCodes.push("scope_invalid");
  validatePublicRef(value.feedback_event_id, "feedback_event_id", failureCodes);
  validatePublicRef(value.target_ref, "target_ref", failureCodes);
  validatePublicRef(value.target_kind, "target_kind", failureCodes);
  validatePublicRef(value.created_by, "created_by", failureCodes);
  validatePublicRef(value.created_at, "created_at", failureCodes);
  validatePublicRef(value.idempotency_key, "idempotency_key", failureCodes);
  validateBoundedPublicText(value.feedback_summary, "feedback_summary", 360, failureCodes);
  if (!allowedFeedbackKinds.includes(value.feedback_kind as FeedbackEventWriteRuntimeFeedbackKindV01)) {
    failureCodes.push("feedback_kind_invalid");
  }
  if (!allowedTargetLayers.includes(value.target_layer as FeedbackEventWriteRuntimeTargetLayerV01)) {
    failureCodes.push("target_layer_invalid");
  }
  if (value.target_fingerprint !== undefined) {
    validatePublicRef(value.target_fingerprint, "target_fingerprint", failureCodes);
  }
  if (value.candidate_ref !== undefined) {
    validatePublicRef(value.candidate_ref, "candidate_ref", failureCodes);
  }
  if (value.durable_ref !== undefined) {
    validatePublicRef(value.durable_ref, "durable_ref", failureCodes);
  }
  validatePublicRefArray(value.source_refs, "source_refs", failureCodes);
  if (value.correction_text !== undefined) {
    validateBoundedPublicText(value.correction_text, "correction_text", 360, failureCodes);
  }
  if (value.reason !== undefined) {
    validateBoundedPublicText(value.reason, "reason", 360, failureCodes);
  }
  validateReasonCodes(value.reason_codes, "reason_codes", failureCodes);
  collectUnsafeFailures(value, "input", failureCodes);
  collectAuthorityFailuresDeep(value, "input", failureCodes);

  if (
    (value.feedback_kind === "correct" || value.feedback_kind === "mark_wrong") &&
    !isNonEmptyString(value.correction_text)
  ) {
    failureCodes.push("correction_text_required");
  }
  if (
    [
      "dismiss",
      "invalidate",
      "needs_more_evidence",
      "scope_overreach",
      "not_relevant_now",
    ].includes(String(value.feedback_kind)) &&
    !isNonEmptyString(value.reason)
  ) {
    failureCodes.push("reason_required");
  }

  return { passed: failureCodes.length === 0, failure_codes: uniqueSorted(failureCodes) };
}

export function createFeedbackEventRuntimeRecordV01(
  input: FeedbackEventWriteRuntimeInputV01,
): FeedbackEventRuntimeRecordV01 {
  const normalized = normalizeFeedbackEventInput(input);
  const sourceRefs = uniqueSorted(normalized.source_refs);
  const authorityBoundary = createFeedbackEventWriteRuntimeAuthorityBoundaryV01();
  const eventJson = stableStringify({
    feedback_event_id: normalized.feedback_event_id,
    scope,
    target_ref: normalized.target_ref,
    target_kind: normalized.target_kind,
    target_layer: normalized.target_layer,
    feedback_kind: normalized.feedback_kind,
    feedback_value: normalized.correction_text ?? normalized.reason ?? normalized.feedback_summary,
    feedback_summary: normalized.feedback_summary,
    source_refs: sourceRefs,
    source_ref: sourceRefs[0] ?? undefined,
    candidate_ref: normalized.candidate_ref,
    durable_ref: normalized.durable_ref,
    created_by: normalized.created_by,
    created_at: normalized.created_at,
    reason_codes: uniqueSorted([
      ...normalized.reason_codes,
      "feedback_controls_runtime_completion",
      "advisory_signal_only",
      "feedback_is_not_truth",
      "product_write_denied",
    ]),
  });

  return {
    event_id: normalized.feedback_event_id,
    event_version: FEEDBACK_EVENT_WRITE_RUNTIME_EVENT_VERSION,
    event_type: normalized.feedback_kind,
    target_kind: normalized.target_kind,
    target_id: normalized.target_ref,
    target_fingerprint: normalized.target_fingerprint ?? null,
    source_ref_ids_json: JSON.stringify(sourceRefs),
    operator_note: normalized.feedback_summary,
    correction_text: normalized.correction_text ?? null,
    reason: normalized.reason ?? null,
    created_at: normalized.created_at,
    idempotency_key: normalized.idempotency_key,
    authority_boundary_json: JSON.stringify(authorityBoundary),
    event_json: eventJson,
  };
}

export function createFeedbackEventRuntimeIdempotencyKeyV01(
  input: Omit<FeedbackEventWriteRuntimeInputV01, "idempotency_key"> & {
    idempotency_key?: string;
  },
): string {
  if (isNonEmptyString(input.idempotency_key)) return input.idempotency_key.trim();
  return `feedback-event-idempotency:${hashStable({
    feedback_event_id: input.feedback_event_id,
    feedback_kind: input.feedback_kind,
    target_ref: input.target_ref,
    feedback_summary: input.feedback_summary,
    correction_text: input.correction_text ?? null,
    reason: input.reason ?? null,
    created_at: input.created_at,
  })}`;
}

export function writeFeedbackEventRuntimeV01(
  input: FeedbackEventWriteRuntimeInputV01,
  db: FeedbackEventAggregationSqliteLikeV01,
): FeedbackEventWriteRuntimeResultV01 {
  const validation = validateFeedbackEventWriteRuntimeInputV01(input);
  if (!validation.passed) {
    return emptyResult(statusForFailureCodes(validation.failure_codes), input, validation.failure_codes);
  }

  ensureFeedbackEventAggregationRuntimeCompletionSchemaV01(db);
  const record = createFeedbackEventRuntimeRecordV01(input);
  const existingByIdempotency = selectExistingRecord(db, "idempotency_key", record.idempotency_key);
  if (existingByIdempotency) {
    if (existingByIdempotency.event_id === record.event_id && existingByIdempotency.event_json === record.event_json) {
      return resultForStatus("idempotent_existing", record, false, [
        "idempotent_existing",
        "feedback_event_not_duplicated",
        "advisory_signal_only",
      ]);
    }
    return resultForStatus("conflict_existing_feedback_event", record, false, [
      "idempotency_key_conflict",
      "no_partial_write",
    ]);
  }

  const existingByEventId = selectExistingRecord(db, "event_id", record.event_id);
  if (existingByEventId) {
    if (existingByEventId.idempotency_key === record.idempotency_key && existingByEventId.event_json === record.event_json) {
      return resultForStatus("idempotent_existing", record, false, [
        "idempotent_existing",
        "feedback_event_not_duplicated",
        "advisory_signal_only",
      ]);
    }
    return resultForStatus("conflict_existing_feedback_event", record, false, [
      "feedback_event_id_conflict",
      "no_partial_write",
    ]);
  }

  db
    .prepare(
      `INSERT INTO ${feedbackEventTableName} (
        event_id,
        event_version,
        event_type,
        target_kind,
        target_id,
        target_fingerprint,
        source_ref_ids_json,
        operator_note,
        correction_text,
        reason,
        created_at,
        idempotency_key,
        authority_boundary_json,
        event_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run?.(
      record.event_id,
      record.event_version,
      record.event_type,
      record.target_kind,
      record.target_id,
      record.target_fingerprint,
      record.source_ref_ids_json,
      record.operator_note,
      record.correction_text,
      record.reason,
      record.created_at,
      record.idempotency_key,
      record.authority_boundary_json,
      record.event_json,
    );

  return resultForStatus("feedback_event_created", record, true, [
    "feedback_event_created",
    "feedback_event_persisted",
    "advisory_signal_only",
    "aggregation_not_executed",
    "product_write_denied",
  ]);
}

export function createFeedbackEventWriteRuntimeBlockedResultV01(
  input: unknown,
  failureCodes: string[],
): FeedbackEventWriteRuntimeResultV01 {
  return emptyResult(statusForFailureCodes(failureCodes), input, failureCodes);
}

function selectExistingRecord(
  db: FeedbackEventAggregationSqliteLikeV01,
  column: "event_id" | "idempotency_key",
  value: string,
): { event_id: string; idempotency_key: string; event_json: string } | null {
  const row = db
    .prepare(
      `SELECT event_id, idempotency_key, event_json
       FROM ${feedbackEventTableName}
       WHERE ${column} = ?
       LIMIT 1`,
    )
    .get?.(value);
  if (!row || typeof row !== "object") return null;
  const record = row as Record<string, unknown>;
  return {
    event_id: String(record.event_id ?? ""),
    idempotency_key: String(record.idempotency_key ?? ""),
    event_json: String(record.event_json ?? ""),
  };
}

function resultForStatus(
  status: FeedbackEventWriteRuntimeStatusV01,
  record: FeedbackEventRuntimeRecordV01,
  persisted: boolean,
  reasonCodes: string[],
): FeedbackEventWriteRuntimeResultV01 {
  return {
    write_runtime_version: FEEDBACK_EVENT_WRITE_RUNTIME_VERSION,
    ui_version: FEEDBACK_CONTROLS_EXPANSION_RUNTIME_COMPLETION_VERSION,
    scope,
    status,
    feedback_event_id: record.event_id,
    idempotency_key: record.idempotency_key,
    feedback_event_ref: `feedback-event:${record.event_id}`,
    feedback_event_persisted: persisted,
    aggregation_executed: false,
    rule_mutation_executed: false,
    parser_mutation_executed: false,
    prompt_mutation_executed: false,
    ranking_mutation_executed: false,
    surfacing_mutation_executed: false,
    source_suppression_executed: false,
    candidate_deleted: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createFeedbackEventWriteRuntimeAuthorityBoundaryV01(),
    reason_codes: uniqueSorted(reasonCodes),
  };
}

function emptyResult(
  status: FeedbackEventWriteRuntimeStatusV01,
  input: unknown,
  reasonCodes: string[],
): FeedbackEventWriteRuntimeResultV01 {
  const value = input && typeof input === "object" && !Array.isArray(input)
    ? (input as Partial<FeedbackEventWriteRuntimeInputV01>)
    : {};
  return {
    write_runtime_version: FEEDBACK_EVENT_WRITE_RUNTIME_VERSION,
    ui_version: FEEDBACK_CONTROLS_EXPANSION_RUNTIME_COMPLETION_VERSION,
    scope,
    status,
    feedback_event_id: isNonEmptyString(value.feedback_event_id) ? value.feedback_event_id.trim() : null,
    idempotency_key: isNonEmptyString(value.idempotency_key) ? value.idempotency_key.trim() : null,
    feedback_event_ref: null,
    feedback_event_persisted: false,
    aggregation_executed: false,
    rule_mutation_executed: false,
    parser_mutation_executed: false,
    prompt_mutation_executed: false,
    ranking_mutation_executed: false,
    surfacing_mutation_executed: false,
    source_suppression_executed: false,
    candidate_deleted: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    authority_boundary: createFeedbackEventWriteRuntimeAuthorityBoundaryV01(),
    reason_codes: uniqueSorted(reasonCodes),
  };
}

function statusForFailureCodes(failureCodes: string[]): FeedbackEventWriteRuntimeStatusV01 {
  if (failureCodes.some((code) => code.includes("forbidden_authority"))) {
    return "blocked_forbidden_authority";
  }
  if (failureCodes.some((code) => /private|raw|secret|local_path|private_url/.test(code))) {
    return "blocked_private_or_raw_payload";
  }
  if (failureCodes.some((code) => code.includes("db_path_invalid"))) return "invalid_db_path";
  return "blocked_invalid_input";
}

function normalizeFeedbackEventInput(
  input: FeedbackEventWriteRuntimeInputV01,
): FeedbackEventWriteRuntimeInputV01 {
  return {
    ...input,
    feedback_event_id: input.feedback_event_id.trim(),
    feedback_kind: input.feedback_kind,
    target_ref: input.target_ref.trim(),
    target_kind: input.target_kind.trim(),
    target_layer: input.target_layer,
    target_fingerprint: normalizeOptionalString(input.target_fingerprint),
    source_refs: uniqueSorted(input.source_refs.map((item) => item.trim())),
    candidate_ref: normalizeOptionalString(input.candidate_ref),
    durable_ref: normalizeOptionalString(input.durable_ref),
    feedback_summary: input.feedback_summary.trim().slice(0, 360),
    correction_text: normalizeOptionalString(input.correction_text)?.slice(0, 360),
    reason: normalizeOptionalString(input.reason)?.slice(0, 360),
    created_by: input.created_by.trim(),
    created_at: input.created_at.trim(),
    idempotency_key: createFeedbackEventRuntimeIdempotencyKeyV01(input),
    reason_codes: uniqueSorted(input.reason_codes.map((item) => item.trim())),
  };
}

function validatePublicRef(value: unknown, label: string, failureCodes: string[]): void {
  if (!isNonEmptyString(value)) {
    failureCodes.push(`${label}_missing`);
    return;
  }
  const normalized = value.trim();
  if (normalized.length > 180 || !/^[A-Za-z0-9][A-Za-z0-9:_./-]*$/.test(normalized)) {
    failureCodes.push(`${label}_invalid`);
  }
  if (unsafePayloadPattern.test(normalized)) failureCodes.push(`${label}_private_or_raw`);
}

function validatePublicRefArray(value: unknown, label: string, failureCodes: string[]): void {
  if (!Array.isArray(value)) {
    failureCodes.push(`${label}_not_array`);
    return;
  }
  value.forEach((item, index) => validatePublicRef(item, `${label}.${index}`, failureCodes));
}

function validateBoundedPublicText(
  value: unknown,
  label: string,
  maxLength: number,
  failureCodes: string[],
): void {
  if (!isNonEmptyString(value)) {
    failureCodes.push(`${label}_missing`);
    return;
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) failureCodes.push(`${label}_too_long`);
  if (unsafePayloadPattern.test(normalized)) failureCodes.push(`${label}_private_or_raw`);
}

function validateReasonCodes(value: unknown, label: string, failureCodes: string[]): void {
  if (!Array.isArray(value)) {
    failureCodes.push(`${label}_not_array`);
    return;
  }
  value.forEach((item, index) => validatePublicRef(item, `${label}.${index}`, failureCodes));
}

function collectUnsafeFailures(value: unknown, label: string, failureCodes: string[]): void {
  if (typeof value === "string") {
    if (unsafePayloadPattern.test(value)) failureCodes.push(`${label}_private_or_raw`);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectUnsafeFailures(item, `${label}.${index}`, failureCodes));
    return;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    collectUnsafeFailures(nested, `${label}.${key}`, failureCodes);
  }
}

function collectAuthorityFailuresDeep(
  value: unknown,
  label: string,
  failureCodes: string[],
): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectAuthorityFailuresDeep(item, `${label}.${index}`, failureCodes));
    return;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const normalizedKey = normalizeAuthorityKey(key);
    if (
      isAuthorityLikeKey(normalizedKey) &&
      !allowedTrueAuthorityFields.has(normalizedKey) &&
      !isFalseLikeAuthorityValue(nested)
    ) {
      failureCodes.push(`${label}.${key}.forbidden_authority`);
    }
    collectAuthorityFailuresDeep(nested, `${label}.${key}`, failureCodes);
  }
}

function isAuthorityLikeKey(key: string): boolean {
  if (knownForbiddenAuthorityFields.has(key)) return true;
  return (
    key.endsWith("_authority") ||
    key.endsWith("_write_now") ||
    key.endsWith("_call_now") ||
    key.endsWith("_execution_now") ||
    key.endsWith("_is_truth") ||
    key.endsWith("_is_proof") ||
    key.endsWith("_is_accepted_evidence") ||
    key.endsWith("_is_durable_state") ||
    key.includes("product_write") ||
    key.includes("product_id_allocation") ||
    key.includes("proof_or_evidence") ||
    key.includes("claim_or_evidence") ||
    key.includes("promotion_execution") ||
    key.includes("durable_state_apply") ||
    key.includes("formation_receipt_write") ||
    key.includes("github_api_call") ||
    key.includes("git_write") ||
    key.includes("rule_mutation") ||
    key.includes("parser_mutation") ||
    key.includes("prompt_mutation") ||
    key.includes("ranking_mutation") ||
    key.includes("surfacing_mutation") ||
    key.includes("source_suppression") ||
    key.includes("candidate_delete")
  );
}

function isFalseLikeAuthorityValue(value: unknown): boolean {
  return value === false || value === null || value === undefined;
}

function normalizeAuthorityKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function normalizeOptionalString(value: unknown): string | undefined {
  return isNonEmptyString(value) ? value.trim() : undefined;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortForStableStringify(value));
}

function sortForStableStringify(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForStableStringify);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, sortForStableStringify(nested)]),
  );
}

function hashStable(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex").slice(0, 24);
}
