import { createHash } from "node:crypto";

import type {
  DogfoodingPrivacyClass,
  DogfoodingRecord,
  DogfoodingRecordAuthorityBoundary,
  DogfoodingRecordReasonCode,
  DogfoodingReviewCue,
  DogfoodingReviewCueKind,
  DogfoodingRedactionStatus,
  DogfoodingSeverity,
  DogfoodingSignal,
  DogfoodingSignalKind,
  DogfoodingSurface,
} from "../../types/dogfooding-record-runtime-contract";

export const DOGFOODING_INGESTION_RUNTIME_VERSION =
  "dogfooding_ingestion_runtime.v0.1" as const;
export const DOGFOODING_INGESTION_INPUT_VERSION =
  "dogfooding_ingestion_input.v0.1" as const;
export const DOGFOODING_INGESTION_RESULT_VERSION =
  "dogfooding_ingestion_result.v0.1" as const;

const DOGFOODING_RECORD_RUNTIME_CONTRACT_VERSION =
  "dogfooding_record_runtime_contract.v0.1" as const;
const DOGFOODING_RECORD_VERSION = "dogfooding_record.v0.1" as const;
const DOGFOODING_SIGNAL_VERSION = "dogfooding_signal.v0.1" as const;
const DOGFOODING_REVIEW_CUE_VERSION = "dogfooding_review_cue.v0.1" as const;
const scope = "project:augnes" as const;

export type DogfoodingIngestionStatus =
  | "ingested"
  | "empty"
  | "blocked_private_or_raw_payload"
  | "blocked_invalid_input"
  | "blocked_forbidden_authority";

export const DogfoodingIngestionReasonCodes = [
  "explicit_operator_action_required",
  "dogfooding_record_contract_present",
  "bounded_summary_present",
  "bounded_summary_missing",
  "dogfooding_signal_present",
  "dogfooding_signal_missing",
  "dogfooding_surface_present",
  "dogfooding_surface_missing",
  "operator_actor_ref_present",
  "operator_actor_ref_missing",
  "source_ref_present",
  "source_ref_missing",
  "feedback_ref_present",
  "surfacing_preview_ref_present",
  "manual_anchor_ref_present",
  "review_cue_created",
  "product_write_request_recorded_as_review_cue_only",
  "product_write_not_executed",
  "dogfooding_ingestion_executed_for_bounded_records_only",
  "dogfooding_record_is_bounded_summary_only",
  "dogfooding_record_is_not_truth",
  "dogfooding_record_is_not_proof",
  "dogfooding_record_is_not_promotion_readiness",
  "dogfooding_record_is_not_raw_conversation",
  "dogfooding_record_is_not_hidden_reasoning",
  "dogfooding_record_is_not_telemetry_dump",
  "raw_conversation_blocked",
  "hidden_reasoning_blocked",
  "telemetry_dump_blocked",
  "browser_log_ingestion_not_executed",
  "session_log_ingestion_not_executed",
  "external_analytics_ingestion_not_executed",
  "private_file_read_not_executed",
  "raw_payload_not_stored",
  "durable_state_not_mutated",
  "candidate_not_mutated",
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
  "db_write_executed_for_dogfooding_only",
  "git_ledger_export_not_executed",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
  "forbidden_authority_blocked",
] as const;
export type DogfoodingIngestionReasonCode =
  (typeof DogfoodingIngestionReasonCodes)[number];

const dogfoodingSignalKinds = [
  "usability_friction",
  "missing_context",
  "wrong_surfacing",
  "confusing_label",
  "broken_flow",
  "stale_context",
  "source_gap",
  "overreach",
  "latency_observation",
  "trust_boundary_confusion",
  "product_write_request",
  "unknown",
] as const satisfies readonly DogfoodingSignalKind[];

const dogfoodingSurfaces = [
  "cockpit",
  "research_candidate_review",
  "constellation_runtime_ui",
  "feedback_controls",
  "surfacing_preview",
  "manual_anchor_store",
  "promotion_decision",
  "formation_receipt",
  "durable_state",
  "trajectory",
  "codex_handoff",
  "unknown",
] as const satisfies readonly DogfoodingSurface[];

const dogfoodingSeverities = [
  "low",
  "medium",
  "high",
  "critical",
  "unknown",
] as const satisfies readonly DogfoodingSeverity[];

const dogfoodingReviewCueKinds = [
  "review_needed",
  "evidence_needed",
  "boundary_confusion",
  "stale_context_review",
  "source_gap_review",
  "surfacing_review",
  "usability_review",
  "product_write_reentry_request",
  "unknown",
] as const satisfies readonly DogfoodingReviewCueKind[];

const contractRecordReasonCodes = [
  "roadmap_file_present",
  "dogfooding_record_contract_present",
  "dogfooding_signal_present",
  "dogfooding_signal_missing",
  "dogfooding_surface_present",
  "dogfooding_surface_missing",
  "bounded_summary_present",
  "bounded_summary_missing",
  "operator_actor_ref_present",
  "operator_actor_ref_missing",
  "source_ref_present",
  "source_ref_missing",
  "feedback_ref_present",
  "surfacing_preview_ref_present",
  "manual_anchor_ref_present",
  "promotion_decision_ref_present",
  "formation_receipt_ref_present",
  "durable_state_ref_present",
  "trajectory_ref_present",
  "review_cue_present",
  "review_cue_missing",
  "product_write_request_recorded_as_review_cue_only",
  "product_write_not_executed",
  "dogfooding_record_is_not_truth",
  "dogfooding_record_is_not_proof",
  "dogfooding_record_is_not_promotion_readiness",
  "dogfooding_record_is_not_raw_conversation",
  "dogfooding_record_is_not_hidden_reasoning",
  "dogfooding_record_is_not_telemetry_dump",
  "dogfooding_record_is_bounded_summary_only",
  "ingestion_runtime_not_implemented",
  "dogfooding_write_not_implemented",
  "dogfooding_route_not_implemented",
  "db_write_not_executed",
  "candidate_not_mutated",
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
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
] as const satisfies readonly DogfoodingRecordReasonCode[];

const forbiddenFalseAuthorityFields = [
  "browser_log_ingestion_now",
  "session_log_ingestion_now",
  "raw_conversation_ingestion_now",
  "telemetry_ingestion_now",
  "external_analytics_ingestion_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "promotion_execution_now",
  "promotion_decision_record_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "product_write_now",
  "product_id_allocation_now",
  "candidate_mutation_now",
  "rule_mutation_now",
  "parser_mutation_now",
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
  "dogfooding_record_is_truth",
  "dogfooding_record_is_proof",
  "dogfooding_record_is_promotion_readiness",
  "dogfooding_record_is_raw_conversation",
  "dogfooding_record_is_hidden_reasoning",
  "dogfooding_record_is_telemetry_dump",
  "product_write_authority",
] as const;

const privateOrRawMarkers = [
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
  "raw feedback payload",
  "raw surfacing payload",
  "raw dogfooding payload",
  "raw source body",
  "browser dump",
  "raw browser dump",
  "actual prompt:",
  "provider response:",
  "actual query:",
  "embedding vector:",
  "vector index dump:",
] as const;

const rawConversationMarkers = ["raw conversation"] as const;
const hiddenReasoningMarkers = ["hidden reasoning"] as const;
const telemetryMarkers = ["telemetry dump"] as const;
const privateUrlMarkers = ["http://", "https://"] as const;
const symbolicLocalPathMarkers = ["private-local-path-ref:"] as const;
const secretLikeMarkers = [
  "password:",
  "secret:",
  "private key",
  "secret-like dogfooding input blocked by ingestion fixture",
] as const;

type JsonRecord = Record<string, unknown>;

export interface DogfoodingIngestionAuthorityBoundary {
  dogfooding_ingestion_runtime_now: true;
  dogfooding_record_write_now: true;
  db_query_or_write_now: true;
  bounded_summary_only: true;
  explicit_operator_action_required: true;
  browser_log_ingestion_now: false;
  session_log_ingestion_now: false;
  raw_conversation_ingestion_now: false;
  telemetry_ingestion_now: false;
  external_analytics_ingestion_now: false;
  durable_state_write_now: false;
  durable_state_apply_now: false;
  formation_receipt_write_now: false;
  promotion_execution_now: false;
  promotion_decision_record_write_now: false;
  proof_or_evidence_record_now: false;
  claim_or_evidence_write_now: false;
  product_write_now: false;
  product_id_allocation_now: false;
  candidate_mutation_now: false;
  rule_mutation_now: false;
  parser_mutation_now: false;
  work_mutation_now: false;
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
  dogfooding_record_is_truth: false;
  dogfooding_record_is_proof: false;
  dogfooding_record_is_promotion_readiness: false;
  dogfooding_record_is_raw_conversation: false;
  dogfooding_record_is_hidden_reasoning: false;
  dogfooding_record_is_telemetry_dump: false;
  product_write_authority: false;
}

export interface DogfoodingIngestionSignalInput {
  signal_id: string;
  signal_kind: DogfoodingSignalKind;
  surface: DogfoodingSurface;
  surface_ref: string;
  severity: DogfoodingSeverity;
  bounded_summary: string;
  source_refs: string[];
  feedback_refs: string[];
  surfacing_preview_refs: string[];
  manual_anchor_refs: string[];
  promotion_decision_refs: string[];
  formation_receipt_refs: string[];
  durable_state_refs: string[];
  trajectory_refs: string[];
  create_review_cue: boolean;
  review_cue_kind?: DogfoodingReviewCueKind;
  public_safe: true;
  reason_codes: DogfoodingIngestionReasonCode[];
}

export interface DogfoodingIngestionInput {
  input_version: typeof DOGFOODING_INGESTION_INPUT_VERSION;
  runtime_version: typeof DOGFOODING_INGESTION_RUNTIME_VERSION;
  contract_version: typeof DOGFOODING_RECORD_RUNTIME_CONTRACT_VERSION;
  scope: typeof scope;
  ingestion_id: string;
  record_id: string;
  operator_actor_ref: string;
  recorded_at: string;
  bounded_context_summary: string;
  signals: DogfoodingIngestionSignalInput[];
  product_write_request_only: boolean;
  explicit_operator_action_required: true;
  public_safe: true;
  boundary_notes: string[];
  reason_codes: DogfoodingIngestionReasonCode[];
  authority_boundary?: Record<string, unknown>;
}

export interface DogfoodingIngestionResult {
  result_version: typeof DOGFOODING_INGESTION_RESULT_VERSION;
  runtime_version: typeof DOGFOODING_INGESTION_RUNTIME_VERSION;
  contract_version: typeof DOGFOODING_RECORD_RUNTIME_CONTRACT_VERSION;
  scope: typeof scope;
  ingestion_id: string;
  status: DogfoodingIngestionStatus;
  record: DogfoodingRecord | null;
  review_cues: DogfoodingReviewCue[];
  rejected_signal_refs: string[];
  warnings: string[];
  durable_state_mutated: false;
  candidate_mutated: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  product_write_executed: false;
  reason_codes: DogfoodingIngestionReasonCode[];
  authority_boundary: DogfoodingIngestionAuthorityBoundary;
}

export interface DogfoodingIngestionValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export function createDogfoodingIngestionAuthorityBoundaryV01():
  DogfoodingIngestionAuthorityBoundary {
  return {
    dogfooding_ingestion_runtime_now: true,
    dogfooding_record_write_now: true,
    db_query_or_write_now: true,
    bounded_summary_only: true,
    explicit_operator_action_required: true,
    browser_log_ingestion_now: false,
    session_log_ingestion_now: false,
    raw_conversation_ingestion_now: false,
    telemetry_ingestion_now: false,
    external_analytics_ingestion_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    promotion_execution_now: false,
    promotion_decision_record_write_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    product_write_now: false,
    product_id_allocation_now: false,
    candidate_mutation_now: false,
    rule_mutation_now: false,
    parser_mutation_now: false,
    work_mutation_now: false,
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
    dogfooding_record_is_truth: false,
    dogfooding_record_is_proof: false,
    dogfooding_record_is_promotion_readiness: false,
    dogfooding_record_is_raw_conversation: false,
    dogfooding_record_is_hidden_reasoning: false,
    dogfooding_record_is_telemetry_dump: false,
    product_write_authority: false,
  };
}

export function validateDogfoodingIngestionInputV01(
  input: unknown,
): DogfoodingIngestionValidationResult {
  if (!isRecord(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const value = input as Partial<DogfoodingIngestionInput>;
  const failures: string[] = [];

  if (value.input_version !== DOGFOODING_INGESTION_INPUT_VERSION) {
    failures.push("input_version_invalid");
  }
  if (value.runtime_version !== DOGFOODING_INGESTION_RUNTIME_VERSION) {
    failures.push("runtime_version_invalid");
  }
  if (value.contract_version !== DOGFOODING_RECORD_RUNTIME_CONTRACT_VERSION) {
    failures.push("contract_version_invalid");
  }
  if (value.scope !== scope) failures.push("scope_invalid");
  failures.push(...validateSafeString(value.ingestion_id, "ingestion_id"));
  failures.push(...validateSafeString(value.record_id, "record_id"));
  failures.push(...validateSafeString(value.operator_actor_ref, "operator_actor_ref"));
  failures.push(...validateSafeString(value.recorded_at, "recorded_at"));
  failures.push(
    ...validateSafeString(value.bounded_context_summary, "bounded_context_summary"),
  );
  if (value.product_write_request_only !== true && value.product_write_request_only !== false) {
    failures.push("product_write_request_only_invalid");
  }
  if (value.explicit_operator_action_required !== true) {
    failures.push("explicit_operator_action_required_missing");
  }
  if (value.public_safe !== true) failures.push("public_safe_not_true");
  failures.push(...validateStringArray(value.boundary_notes, "boundary_notes"));
  failures.push(...validateReasonCodes(value.reason_codes, "reason_codes"));
  failures.push(...validateAuthorityBoundary(value.authority_boundary, "authority_boundary"));

  if (!Array.isArray(value.signals)) {
    failures.push("signals_invalid");
  } else {
    for (const signal of value.signals) {
      failures.push(...validateDogfoodingIngestionSignalInputV01(signal).failure_codes);
    }
  }

  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function validateDogfoodingIngestionSignalInputV01(
  signal: unknown,
): DogfoodingIngestionValidationResult {
  if (!isRecord(signal)) {
    return { passed: false, failure_codes: ["signal_invalid_object"] };
  }
  const value = signal as Partial<DogfoodingIngestionSignalInput>;
  const failures: string[] = [];
  failures.push(...validateSafeString(value.signal_id, "signal_id"));
  if (!dogfoodingSignalKinds.includes(value.signal_kind as DogfoodingSignalKind)) {
    failures.push("signal_kind_invalid");
  }
  if (!dogfoodingSurfaces.includes(value.surface as DogfoodingSurface)) {
    failures.push("surface_invalid");
  }
  failures.push(...validateSafeString(value.surface_ref, "surface_ref"));
  if (!dogfoodingSeverities.includes(value.severity as DogfoodingSeverity)) {
    failures.push("severity_invalid");
  }
  failures.push(...validateSafeString(value.bounded_summary, "bounded_summary"));
  for (const key of [
    "source_refs",
    "feedback_refs",
    "surfacing_preview_refs",
    "manual_anchor_refs",
    "promotion_decision_refs",
    "formation_receipt_refs",
    "durable_state_refs",
    "trajectory_refs",
  ] as const) {
    failures.push(...validateStringArray(value[key], key));
  }
  if (value.create_review_cue !== true && value.create_review_cue !== false) {
    failures.push("create_review_cue_invalid");
  }
  if (
    value.review_cue_kind !== undefined &&
    !dogfoodingReviewCueKinds.includes(value.review_cue_kind as DogfoodingReviewCueKind)
  ) {
    failures.push("review_cue_kind_invalid");
  }
  if (value.public_safe !== true) failures.push("signal_public_safe_not_true");
  failures.push(...validateReasonCodes(value.reason_codes, "signal_reason_codes"));
  return { passed: failures.length === 0, failure_codes: uniqueSorted(failures) };
}

export function ingestDogfoodingRecordV01(
  input: DogfoodingIngestionInput,
): DogfoodingIngestionResult {
  const validation = validateDogfoodingIngestionInputV01(input);
  if (!validation.passed) {
    return blockedResult(statusForFailures(validation.failure_codes), input, [
      ...reasonCodesForFailures(validation.failure_codes),
      "raw_payload_not_stored",
      "candidate_not_mutated",
      "durable_state_not_mutated",
      "product_write_denied",
    ]);
  }

  if (input.signals.length === 0) {
    return baseResult(input, {
      status: "empty",
      record: null,
      review_cues: [],
      rejected_signal_refs: [],
      warnings: ["No dogfooding signals supplied; no record was written."],
      reason_codes: [
        ...input.reason_codes,
        "explicit_operator_action_required",
        "dogfooding_signal_missing",
        "raw_payload_not_stored",
        "candidate_not_mutated",
        "durable_state_not_mutated",
        "product_write_denied",
      ],
    });
  }

  const contractAuthorityBoundary = createDogfoodingRecordAuthorityBoundaryV01();
  const signals = input.signals
    .slice()
    .sort((left, right) => left.signal_id.localeCompare(right.signal_id))
    .map((signal): DogfoodingSignal => ({
      signal_version: DOGFOODING_SIGNAL_VERSION,
      scope,
      signal_id: signal.signal_id,
      signal_kind: signal.signal_kind,
      surface: signal.surface,
      surface_ref: signal.surface_ref,
      severity: signal.severity,
      bounded_summary: signal.bounded_summary,
      source_refs: uniqueSorted(signal.source_refs),
      feedback_refs: uniqueSorted(signal.feedback_refs),
      surfacing_preview_refs: uniqueSorted(signal.surfacing_preview_refs),
      manual_anchor_refs: uniqueSorted(signal.manual_anchor_refs),
      promotion_decision_refs: uniqueSorted(signal.promotion_decision_refs),
      formation_receipt_refs: uniqueSorted(signal.formation_receipt_refs),
      durable_state_refs: uniqueSorted(signal.durable_state_refs),
      trajectory_refs: uniqueSorted(signal.trajectory_refs),
      privacy_class: "public_safe_summary",
      redaction_status: "not_needed",
      public_safe: true,
      reason_codes: contractReasonCodesForSignal(signal),
      authority_boundary: contractAuthorityBoundary,
    }));

  const reviewCues = input.signals
    .filter(
      (signal) =>
        signal.create_review_cue ||
        signal.signal_kind === "product_write_request" ||
        input.product_write_request_only,
    )
    .sort((left, right) => left.signal_id.localeCompare(right.signal_id))
    .map((signal) => createDogfoodingReviewCueFromSignalV01(signal, input));

  const recordWithoutFingerprint: Omit<DogfoodingRecord, "record_fingerprint"> = {
    record_version: DOGFOODING_RECORD_VERSION,
    contract_version: DOGFOODING_RECORD_RUNTIME_CONTRACT_VERSION,
    scope,
    status: "ready_for_future_ingestion",
    record_id: input.record_id,
    operator_actor_ref: input.operator_actor_ref,
    recorded_at: input.recorded_at,
    bounded_context_summary: input.bounded_context_summary,
    signals,
    review_cues: reviewCues,
    privacy_class: "public_safe_summary",
    redaction_status: "not_needed",
    public_safe: true,
    boundary_notes: uniqueSorted(input.boundary_notes),
    reason_codes: contractReasonCodesForRecord(input, reviewCues),
    authority_boundary: contractAuthorityBoundary,
  };
  const record: DogfoodingRecord = {
    ...recordWithoutFingerprint,
    record_fingerprint: createDogfoodingRecordFingerprintV01(recordWithoutFingerprint),
  };

  return baseResult(input, {
    status: "ingested",
    record,
    review_cues: reviewCues,
    rejected_signal_refs: [],
    warnings: [],
    reason_codes: [
      ...input.reason_codes,
      "explicit_operator_action_required",
      "dogfooding_record_contract_present",
      "bounded_summary_present",
      "dogfooding_signal_present",
      "dogfooding_surface_present",
      "operator_actor_ref_present",
      "dogfooding_ingestion_executed_for_bounded_records_only",
      "dogfooding_record_is_bounded_summary_only",
      "dogfooding_record_is_not_truth",
      "dogfooding_record_is_not_proof",
      "dogfooding_record_is_not_promotion_readiness",
      "dogfooding_record_is_not_raw_conversation",
      "dogfooding_record_is_not_hidden_reasoning",
      "dogfooding_record_is_not_telemetry_dump",
      ...(reviewCues.length > 0 ? (["review_cue_created"] as const) : []),
      ...(input.product_write_request_only ||
      input.signals.some((signal) => signal.signal_kind === "product_write_request")
        ? ([
            "product_write_request_recorded_as_review_cue_only",
            "product_write_not_executed",
          ] as const)
        : []),
      "raw_payload_not_stored",
      "browser_log_ingestion_not_executed",
      "session_log_ingestion_not_executed",
      "external_analytics_ingestion_not_executed",
      "private_file_read_not_executed",
      "candidate_not_mutated",
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
      "db_write_executed_for_dogfooding_only",
      "git_ledger_export_not_executed",
    ],
  });
}

export function createDogfoodingRecordFingerprintV01(
  recordWithoutFingerprint: unknown,
): string {
  return createHash("sha256")
    .update(canonicalJson(recordWithoutFingerprint))
    .digest("hex");
}

export function createDogfoodingReviewCueFromSignalV01(
  signal: DogfoodingIngestionSignalInput,
  input: DogfoodingIngestionInput,
): DogfoodingReviewCue {
  const productWriteRequestOnly =
    input.product_write_request_only || signal.signal_kind === "product_write_request";
  const cueKind = productWriteRequestOnly
    ? "product_write_reentry_request"
    : signal.review_cue_kind ?? defaultReviewCueKindForSignal(signal.signal_kind);
  return {
    review_cue_version: DOGFOODING_REVIEW_CUE_VERSION,
    scope,
    review_cue_id: `${input.record_id}:review-cue:${signal.signal_id}`,
    cue_kind: cueKind,
    target_surface: signal.surface,
    target_surface_ref: signal.surface_ref,
    target_signal_refs: [signal.signal_id],
    bounded_summary: productWriteRequestOnly
      ? "Product-write request recorded as candidate-only dogfooding review cue."
      : `Dogfooding review cue from ${signal.signal_kind} signal.`,
    severity: signal.severity,
    candidate_only: true,
    product_write_request_only: productWriteRequestOnly,
    product_write_executed: false,
    reason_codes: uniqueSorted([
      "review_cue_present",
      "dogfooding_record_is_not_truth",
      "dogfooding_record_is_not_proof",
      "dogfooding_record_is_not_promotion_readiness",
      "product_write_denied",
      ...(productWriteRequestOnly
        ? ([
            "product_write_request_recorded_as_review_cue_only",
            "product_write_not_executed",
          ] as const)
        : []),
    ]),
    authority_boundary: createDogfoodingRecordAuthorityBoundaryV01(),
  };
}

function createDogfoodingRecordAuthorityBoundaryV01():
  DogfoodingRecordAuthorityBoundary {
  return {
    contract_only: true,
    dogfooding_ingestion_runtime_now: false,
    dogfooding_write_route_now: false,
    dogfooding_read_route_now: false,
    dogfooding_record_write_now: false,
    db_query_or_write_now: false,
    browser_log_ingestion_now: false,
    session_log_ingestion_now: false,
    raw_conversation_ingestion_now: false,
    telemetry_ingestion_now: false,
    external_analytics_ingestion_now: false,
    durable_state_write_now: false,
    durable_state_apply_now: false,
    formation_receipt_write_now: false,
    promotion_execution_now: false,
    promotion_decision_record_write_now: false,
    proof_or_evidence_record_now: false,
    claim_or_evidence_write_now: false,
    product_write_now: false,
    product_id_allocation_now: false,
    candidate_mutation_now: false,
    rule_mutation_now: false,
    parser_mutation_now: false,
    work_mutation_now: false,
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
    dogfooding_record_is_truth: false,
    dogfooding_record_is_proof: false,
    dogfooding_record_is_promotion_readiness: false,
    dogfooding_record_is_raw_conversation: false,
    dogfooding_record_is_hidden_reasoning: false,
    dogfooding_record_is_telemetry_dump: false,
    product_write_authority: false,
  };
}

function contractReasonCodesForSignal(
  signal: DogfoodingIngestionSignalInput,
): DogfoodingRecordReasonCode[] {
  return uniqueSorted([
    "dogfooding_record_contract_present",
    "dogfooding_signal_present",
    "dogfooding_surface_present",
    "bounded_summary_present",
    ...(signal.source_refs.length > 0 ? (["source_ref_present"] as const) : []),
    ...(signal.feedback_refs.length > 0 ? (["feedback_ref_present"] as const) : []),
    ...(signal.surfacing_preview_refs.length > 0
      ? (["surfacing_preview_ref_present"] as const)
      : []),
    ...(signal.manual_anchor_refs.length > 0 ? (["manual_anchor_ref_present"] as const) : []),
    ...(signal.promotion_decision_refs.length > 0
      ? (["promotion_decision_ref_present"] as const)
      : []),
    ...(signal.formation_receipt_refs.length > 0
      ? (["formation_receipt_ref_present"] as const)
      : []),
    ...(signal.durable_state_refs.length > 0 ? (["durable_state_ref_present"] as const) : []),
    ...(signal.trajectory_refs.length > 0 ? (["trajectory_ref_present"] as const) : []),
    "dogfooding_record_is_bounded_summary_only",
    "dogfooding_record_is_not_truth",
    "dogfooding_record_is_not_proof",
    "dogfooding_record_is_not_promotion_readiness",
    "dogfooding_record_is_not_raw_conversation",
    "dogfooding_record_is_not_hidden_reasoning",
    "dogfooding_record_is_not_telemetry_dump",
    "candidate_not_mutated",
    "durable_state_not_mutated",
    "proof_not_created",
    "evidence_not_created",
    "claim_evidence_not_written",
    "product_write_denied",
  ]);
}

function contractReasonCodesForRecord(
  input: DogfoodingIngestionInput,
  reviewCues: DogfoodingReviewCue[],
): DogfoodingRecordReasonCode[] {
  const hasProductWriteRequest =
    input.product_write_request_only ||
    input.signals.some((signal) => signal.signal_kind === "product_write_request");
  return uniqueSorted([
    "dogfooding_record_contract_present",
    "dogfooding_signal_present",
    "dogfooding_surface_present",
    "bounded_summary_present",
    "operator_actor_ref_present",
    ...(input.signals.some((signal) => signal.source_refs.length > 0)
      ? (["source_ref_present"] as const)
      : []),
    ...(input.signals.some((signal) => signal.feedback_refs.length > 0)
      ? (["feedback_ref_present"] as const)
      : []),
    ...(input.signals.some((signal) => signal.surfacing_preview_refs.length > 0)
      ? (["surfacing_preview_ref_present"] as const)
      : []),
    ...(reviewCues.length > 0
      ? (["review_cue_present"] as const)
      : (["review_cue_missing"] as const)),
    ...(hasProductWriteRequest
      ? ([
          "product_write_request_recorded_as_review_cue_only",
          "product_write_not_executed",
        ] as const)
      : []),
    "dogfooding_record_is_bounded_summary_only",
    "dogfooding_record_is_not_truth",
    "dogfooding_record_is_not_proof",
    "dogfooding_record_is_not_promotion_readiness",
    "dogfooding_record_is_not_raw_conversation",
    "dogfooding_record_is_not_hidden_reasoning",
    "dogfooding_record_is_not_telemetry_dump",
    "candidate_not_mutated",
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
  ]);
}

function defaultReviewCueKindForSignal(
  signalKind: DogfoodingSignalKind,
): DogfoodingReviewCueKind {
  if (signalKind === "missing_context") return "evidence_needed";
  if (signalKind === "stale_context") return "stale_context_review";
  if (signalKind === "source_gap") return "source_gap_review";
  if (signalKind === "wrong_surfacing") return "surfacing_review";
  if (signalKind === "trust_boundary_confusion") return "boundary_confusion";
  if (signalKind === "usability_friction" || signalKind === "confusing_label") {
    return "usability_review";
  }
  return "review_needed";
}

function baseResult(
  input: Partial<DogfoodingIngestionInput> | null,
  overrides: Pick<
    DogfoodingIngestionResult,
    | "status"
    | "record"
    | "review_cues"
    | "rejected_signal_refs"
    | "warnings"
    | "reason_codes"
  >,
): DogfoodingIngestionResult {
  return {
    result_version: DOGFOODING_INGESTION_RESULT_VERSION,
    runtime_version: DOGFOODING_INGESTION_RUNTIME_VERSION,
    contract_version: DOGFOODING_RECORD_RUNTIME_CONTRACT_VERSION,
    scope,
    ingestion_id:
      typeof input?.ingestion_id === "string" && !hasUnsafeString(input.ingestion_id)
        ? input.ingestion_id
        : "dogfooding-ingestion:blocked",
    status: overrides.status,
    record: overrides.record,
    review_cues: overrides.review_cues,
    rejected_signal_refs: uniqueSorted(overrides.rejected_signal_refs),
    warnings: uniqueSorted(overrides.warnings),
    durable_state_mutated: false,
    candidate_mutated: false,
    proof_or_evidence_created: false,
    claim_or_evidence_written: false,
    product_write_executed: false,
    reason_codes: uniqueSorted(overrides.reason_codes),
    authority_boundary: createDogfoodingIngestionAuthorityBoundaryV01(),
  };
}

function blockedResult(
  status: DogfoodingIngestionStatus,
  input: Partial<DogfoodingIngestionInput> | null,
  reasonCodes: readonly DogfoodingIngestionReasonCode[],
): DogfoodingIngestionResult {
  return baseResult(input, {
    status,
    record: null,
    review_cues: [],
    rejected_signal_refs: collectSafeSignalRefs(input),
    warnings: ["Dogfooding ingestion input was blocked before preview build."],
    reason_codes: [...reasonCodes],
  });
}

function collectSafeSignalRefs(input: Partial<DogfoodingIngestionInput> | null): string[] {
  if (!input || !Array.isArray(input.signals)) return [];
  return input.signals
    .map((signal) => (isRecord(signal) ? signal.signal_id : null))
    .filter((signalId): signalId is string => typeof signalId === "string" && isSafeString(signalId));
}

function statusForFailures(failures: readonly string[]): DogfoodingIngestionStatus {
  if (failures.some((failure) => failure.includes("forbidden_authority"))) {
    return "blocked_forbidden_authority";
  }
  if (
    failures.some((failure) =>
      [
        "private_or_raw_payload",
        "raw_conversation",
        "hidden_reasoning",
        "telemetry_dump",
        "local_path",
        "private_url",
        "secret_like_pattern",
      ].some((marker) => failure.includes(marker)),
    )
  ) {
    return "blocked_private_or_raw_payload";
  }
  return "blocked_invalid_input";
}

function reasonCodesForFailures(
  failures: readonly string[],
): DogfoodingIngestionReasonCode[] {
  const reasonCodes: DogfoodingIngestionReasonCode[] = [];
  for (const failure of failures) {
    if (failure.includes("bounded_summary")) reasonCodes.push("bounded_summary_missing");
    if (failure.includes("signal")) reasonCodes.push("dogfooding_signal_missing");
    if (failure.includes("surface")) reasonCodes.push("dogfooding_surface_missing");
    if (failure.includes("operator_actor_ref")) reasonCodes.push("operator_actor_ref_missing");
    if (failure.includes("source_ref")) reasonCodes.push("source_ref_missing");
    if (failure.includes("raw_conversation")) reasonCodes.push("raw_conversation_blocked");
    if (failure.includes("hidden_reasoning")) reasonCodes.push("hidden_reasoning_blocked");
    if (failure.includes("telemetry_dump")) reasonCodes.push("telemetry_dump_blocked");
    if (failure.includes("secret_like_pattern")) reasonCodes.push("secret_like_pattern_blocked");
    if (failure.includes("local_path")) reasonCodes.push("local_path_blocked");
    if (failure.includes("private_url")) reasonCodes.push("private_url_blocked");
    if (failure.includes("private_or_raw_payload")) {
      reasonCodes.push("private_or_raw_payload_blocked");
    }
    if (failure.includes("forbidden_authority")) reasonCodes.push("forbidden_authority_blocked");
  }
  return uniqueSorted([
    ...reasonCodes,
    "explicit_operator_action_required",
    "dogfooding_record_is_not_truth",
    "dogfooding_record_is_not_proof",
    "dogfooding_record_is_not_promotion_readiness",
  ]);
}

function validateReasonCodes(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) return [`${field}_invalid`];
  const failures: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      failures.push(`${field}_item_invalid`);
      continue;
    }
    failures.push(...unsafeStringFailureCodes(item, `${field}_private_or_raw_payload`));
    if (!DogfoodingIngestionReasonCodes.includes(item as DogfoodingIngestionReasonCode)) {
      failures.push(`${field}_unknown`);
    }
  }
  return failures;
}

function validateStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) return [`${field}_invalid`];
  const failures: string[] = [];
  for (const item of value) {
    failures.push(...validateSafeString(item, `${field}_item`));
  }
  return failures;
}

function validateSafeString(value: unknown, field: string): string[] {
  if (typeof value !== "string" || value.trim().length === 0) return [`${field}_missing`];
  return unsafeStringFailureCodes(value, field);
}

function unsafeStringFailureCodes(value: string, field: string): string[] {
  const failures: string[] = [];
  const normalizedValue = value.toLowerCase();
  if (includesMarker(normalizedValue, privateOrRawMarkers)) {
    failures.push(`${field}_private_or_raw_payload`);
  }
  if (includesMarker(normalizedValue, rawConversationMarkers)) {
    failures.push(`${field}_raw_conversation`);
  }
  if (includesMarker(normalizedValue, hiddenReasoningMarkers)) {
    failures.push(`${field}_hidden_reasoning`);
  }
  if (includesMarker(normalizedValue, telemetryMarkers)) {
    failures.push(`${field}_telemetry_dump`);
  }
  if (includesMarker(normalizedValue, privateUrlMarkers)) {
    failures.push(`${field}_private_url`);
  }
  if (includesMarker(normalizedValue, symbolicLocalPathMarkers)) {
    failures.push(`${field}_local_path`);
  }
  if (includesMarker(normalizedValue, secretLikeMarkers)) {
    failures.push(`${field}_secret_like_pattern`);
  }
  return failures;
}

function includesMarker(
  normalizedValue: string,
  markers: readonly string[],
): boolean {
  return markers.some((marker) => normalizedValue.includes(marker.toLowerCase()));
}

function validateAuthorityBoundary(value: unknown, field: string): string[] {
  if (value === undefined) return [];
  if (!isRecord(value)) return [`${field}_invalid`];
  const failures: string[] = [];
  failures.push(...unsafeStringFailureCodes(canonicalJson(value), field));
  for (const key of forbiddenFalseAuthorityFields) {
    if (value[key] === true) failures.push(`${field}_${key}_forbidden_authority`);
  }
  return failures;
}

function isSafeString(value: string): boolean {
  return unsafeStringFailureCodes(value, "value").length === 0 && value.trim().length > 0;
}

function hasUnsafeString(value: string): boolean {
  return !isSafeString(value);
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

void contractRecordReasonCodes;
