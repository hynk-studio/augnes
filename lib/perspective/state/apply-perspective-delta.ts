import { createHash } from "node:crypto";

export const DURABLE_PERSPECTIVE_STATE_APPLY_VERSION = "durable_perspective_state_apply.v0.1" as const;
export const DURABLE_PERSPECTIVE_STATE_VERSION = "durable_perspective_state.v0.1" as const;
export const DURABLE_PERSPECTIVE_STATE_APPLY_EVENT_VERSION =
  "durable_perspective_state_apply_event.v0.1" as const;

export type DurablePerspectiveApplyOperation =
  | "add"
  | "refine"
  | "weaken"
  | "reverse"
  | "split"
  | "merge"
  | "retire"
  | "reweight"
  | "reactivate"
  | "unknown";

export type DurablePerspectiveApplyStatus =
  | "applied"
  | "blocked_missing_promotion_decision"
  | "blocked_missing_formation_receipt"
  | "blocked_discarded_formation_receipt"
  | "blocked_formation_receipt_not_written"
  | "blocked_already_applied_receipt"
  | "blocked_missing_source_refs"
  | "blocked_missing_selected_candidates"
  | "blocked_unresolved_tension_loss"
  | "blocked_knowledge_gap_loss"
  | "blocked_forbidden_authority"
  | "blocked_private_or_raw_payload"
  | "blocked_invalid_input"
  | "not_found";

export type DurablePerspectiveStateReasonCode =
  | "promotion_decision_ref_present"
  | "promotion_decision_ref_missing"
  | "formation_receipt_ref_present"
  | "formation_receipt_ref_missing"
  | "formation_receipt_written"
  | "formation_receipt_required_before_state_apply"
  | "formation_receipt_not_written"
  | "formation_receipt_discarded"
  | "formation_receipt_already_applied"
  | "review_record_ref_present"
  | "review_record_ref_missing"
  | "operator_actor_present"
  | "operator_actor_missing"
  | "selected_candidate_ref_present"
  | "selected_candidate_ref_missing"
  | "source_ref_present"
  | "source_ref_missing"
  | "omitted_candidate_preserved"
  | "deferred_candidate_preserved"
  | "prior_thesis_preserved"
  | "retired_claim_preserved"
  | "contradiction_preserved"
  | "unresolved_tension_preserved"
  | "unresolved_tension_resolved_explicitly"
  | "unresolved_tension_loss_blocked"
  | "knowledge_gap_preserved"
  | "knowledge_gap_deferred"
  | "knowledge_gap_closed_explicitly"
  | "knowledge_gap_loss_blocked"
  | "durable_state_applied"
  | "promotion_not_executed"
  | "proof_not_created"
  | "evidence_not_created"
  | "claim_evidence_not_written"
  | "product_write_denied"
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
  | "db_write_executed_for_state_apply_only"
  | "git_ledger_export_not_executed";

export const allowedDurablePerspectiveApplyOperations = [
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

export const allowedDurablePerspectiveStateReasonCodes = [
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

const allowedReasonCodeSet = new Set<string>(allowedDurablePerspectiveStateReasonCodes);

export interface DurablePerspectiveStateAuthorityBoundary {
  durable_perspective_state_apply_now: true;
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
  source_of_truth_created_from_provider: false;
  source_of_truth_created_from_retrieval: false;
  candidate_is_fact: false;
  candidate_is_proof: false;
  candidate_is_accepted_evidence: false;
  provider_output_is_truth: false;
  retrieval_result_is_evidence: false;
  rag_context_is_truth: false;
  feedback_is_truth: false;
  product_write_authority: false;
}

export interface DurablePerspectiveClaimRef {
  claim_ref: string;
  bounded_summary: string;
  source_refs: string[];
  reason_codes: DurablePerspectiveStateReasonCode[];
}

export interface DurablePerspectiveEvidenceRef {
  evidence_ref: string;
  bounded_summary: string;
  source_refs: string[];
  reason_codes: DurablePerspectiveStateReasonCode[];
}

export interface DurablePerspectiveTensionRef {
  tension_ref: string;
  bounded_summary: string;
  source_refs: string[];
  reason_codes: DurablePerspectiveStateReasonCode[];
}

export interface DurablePerspectiveKnowledgeGapRef {
  knowledge_gap_ref: string;
  bounded_summary: string;
  source_refs: string[];
  gap_status: "open" | "deferred" | "closed" | "unknown";
  reason_codes: DurablePerspectiveStateReasonCode[];
}

export interface DurablePerspectiveState {
  state_version: typeof DURABLE_PERSPECTIVE_STATE_VERSION;
  apply_version: typeof DURABLE_PERSPECTIVE_STATE_APPLY_VERSION;
  scope: typeof scope;
  perspective_id: string;
  current_thesis: string;
  prior_theses: string[];
  active_claims: DurablePerspectiveClaimRef[];
  retired_claims: DurablePerspectiveClaimRef[];
  supporting_evidence_refs: string[];
  contradicting_evidence_refs: string[];
  open_tensions: DurablePerspectiveTensionRef[];
  resolved_tensions: DurablePerspectiveTensionRef[];
  knowledge_gaps: DurablePerspectiveKnowledgeGapRef[];
  promotion_history: string[];
  retirement_history: string[];
  formation_receipt_refs: string[];
  salience_state: Record<string, unknown>;
  reuse_conditions: string[];
  created_at: string;
  updated_at: string;
  authority_boundary: DurablePerspectiveStateAuthorityBoundary;
  reason_codes: DurablePerspectiveStateReasonCode[];
  state_fingerprint: string;
}

export interface DurablePerspectiveStateApplyInput {
  apply_version: typeof DURABLE_PERSPECTIVE_STATE_APPLY_VERSION;
  scope: typeof scope;
  apply_event_id: string;
  perspective_id: string;
  promotion_decision_id: string;
  formation_receipt_id: string;
  review_record_ref: string;
  operator_actor_ref: string;
  apply_operation: DurablePerspectiveApplyOperation;
  current_thesis: string;
  prior_state_version: string | null;
  selected_candidate_refs: string[];
  omitted_candidate_refs: string[];
  deferred_candidate_refs: string[];
  supporting_evidence_refs: string[];
  contradicting_evidence_refs: string[];
  open_tensions: DurablePerspectiveTensionRef[];
  resolved_tensions: DurablePerspectiveTensionRef[];
  knowledge_gaps: DurablePerspectiveKnowledgeGapRef[];
  active_claims: DurablePerspectiveClaimRef[];
  retired_claims: DurablePerspectiveClaimRef[];
  salience_state: Record<string, unknown>;
  reuse_conditions: string[];
  reason_codes: DurablePerspectiveStateReasonCode[];
  boundary_notes: string[];
  authority_boundary?: Record<string, unknown>;
  applied_at?: string;
}

export interface DurablePerspectiveStateApplyEvent {
  apply_event_version: typeof DURABLE_PERSPECTIVE_STATE_APPLY_EVENT_VERSION;
  apply_version: typeof DURABLE_PERSPECTIVE_STATE_APPLY_VERSION;
  state_version: typeof DURABLE_PERSPECTIVE_STATE_VERSION;
  scope: typeof scope;
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
  selected_candidate_refs: string[];
  omitted_candidate_refs: string[];
  deferred_candidate_refs: string[];
  unresolved_tensions_preserved: string[];
  knowledge_gaps_preserved: string[];
  durable_state_applied: true;
  formation_receipt_written: true;
  promotion_executed: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  product_write_executed: false;
  reason_codes: DurablePerspectiveStateReasonCode[];
  authority_boundary: DurablePerspectiveStateAuthorityBoundary;
}

export interface DurablePerspectiveStateApplyResult {
  apply_version: typeof DURABLE_PERSPECTIVE_STATE_APPLY_VERSION;
  state_version: typeof DURABLE_PERSPECTIVE_STATE_VERSION;
  apply_event_version: typeof DURABLE_PERSPECTIVE_STATE_APPLY_EVENT_VERSION;
  scope: typeof scope;
  status: DurablePerspectiveApplyStatus;
  state: DurablePerspectiveState | null;
  states: DurablePerspectiveState[];
  apply_event: DurablePerspectiveStateApplyEvent | null;
  apply_events: DurablePerspectiveStateApplyEvent[];
  error_code: DurablePerspectiveApplyStatus | null;
  reason_codes: DurablePerspectiveStateReasonCode[];
  durable_state_applied: boolean;
  formation_receipt_written: boolean;
  promotion_executed: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  product_write_executed: false;
  authority_boundary: DurablePerspectiveStateAuthorityBoundary;
}

export interface DurablePerspectiveStateValidationResult {
  passed: boolean;
  failure_codes: string[];
}

const scope = "project:augnes" as const;

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

export function validateDurablePerspectiveStateApplyInputV01(
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

export function buildDurablePerspectiveStateApplyEventV01(
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

export function buildDurablePerspectiveStateV01(
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

export function createDurablePerspectiveStateFingerprintV01(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function durablePerspectiveStatusForValidationFailuresV01(
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

function isSafeString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !hasUnsafeString(value);
}

function hasUnsafeString(value: string): boolean {
  return unsafeStringPatterns.some((pattern) => pattern.test(value));
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

function uniqueSorted<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort();
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
