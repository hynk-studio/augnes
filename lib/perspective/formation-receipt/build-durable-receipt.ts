import { createHash } from "node:crypto";

export const FORMATION_RECEIPT_BUILDER_VERSION = "formation_receipt_builder.v0.1" as const;
export const FORMATION_RECEIPT_RECORD_VERSION = "formation_receipt_record.v0.1" as const;
export const FORMATION_RECEIPT_ACTIVITY_VERSION = "formation_receipt_activity.v0.1" as const;

export type FormationReceiptStatus =
  | "receipt_candidate"
  | "ready_to_write"
  | "written"
  | "discarded"
  | "blocked_missing_promotion_decision"
  | "blocked_missing_review_record"
  | "blocked_missing_selected_source_refs"
  | "blocked_missing_selected_candidates"
  | "blocked_private_or_raw_payload"
  | "blocked_forbidden_authority"
  | "blocked_invalid_input";

export type FormationReceiptCandidateDisposition = "selected" | "omitted" | "deferred";

export type FormationReceiptCandidateKind =
  | "claim_candidate"
  | "evidence_candidate"
  | "perspective_delta_candidate"
  | "retrieval_candidate"
  | "rag_context_candidate"
  | "provider_candidate_output_ref"
  | "feedback_candidate"
  | "manual_operator_note_summary"
  | "unknown";

export type FormationReceiptActivityKind =
  | "formation_receipt_written"
  | "formation_receipt_read"
  | "formation_receipt_listed"
  | "formation_receipt_discarded"
  | "formation_receipt_rejected_invalid_input"
  | "unknown";

export type FormationReceiptReasonCode =
  | "promotion_decision_ref_present"
  | "promotion_decision_ref_missing"
  | "review_record_ref_present"
  | "review_record_ref_missing"
  | "selected_candidate_ref_present"
  | "selected_candidate_ref_missing"
  | "selected_source_ref_present"
  | "selected_source_ref_missing"
  | "omitted_candidate_preserved"
  | "deferred_candidate_preserved"
  | "unresolved_tension_preserved"
  | "knowledge_gap_preserved"
  | "boundary_acknowledgement_present"
  | "formation_receipt_written"
  | "formation_receipt_required_before_state_apply"
  | "formation_receipt_is_not_proof"
  | "formation_receipt_is_not_evidence"
  | "formation_receipt_is_not_state_apply"
  | "durable_state_not_applied"
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
  | "db_write_executed_for_receipt_only"
  | "git_ledger_export_not_executed";

export interface FormationReceiptAuthorityBoundary {
  formation_receipt_write_now: true;
  durable_perspective_state_apply_now: false;
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
  source_of_truth: false;
  formation_receipt_is_proof: false;
  formation_receipt_is_evidence: false;
  formation_receipt_is_state_apply: false;
  candidate_is_fact: false;
  candidate_is_proof: false;
  candidate_is_accepted_evidence: false;
  provider_output_is_truth: false;
  retrieval_result_is_evidence: false;
  rag_context_is_truth: false;
  feedback_is_truth: false;
  product_write_authority: false;
}

export interface FormationReceiptCandidateRef {
  disposition: FormationReceiptCandidateDisposition;
  candidate_kind: FormationReceiptCandidateKind;
  candidate_ref: string;
  bounded_summary: string;
  source_refs: string[];
  reason_codes: FormationReceiptReasonCode[];
}

export interface FormationReceiptSourceRef {
  source_ref: string;
  bounded_summary: string;
  reason_codes: FormationReceiptReasonCode[];
}

export interface FormationReceiptCreateInput {
  builder_version: typeof FORMATION_RECEIPT_BUILDER_VERSION;
  record_version: typeof FORMATION_RECEIPT_RECORD_VERSION;
  scope: typeof scope;
  receipt_id: string;
  promotion_decision_id: string;
  review_record_ref: string;
  operator_actor_ref: string;
  selected_candidate_refs: FormationReceiptCandidateRef[];
  omitted_candidate_refs: FormationReceiptCandidateRef[];
  deferred_candidate_refs: FormationReceiptCandidateRef[];
  selected_source_refs: FormationReceiptSourceRef[];
  geometry_digest_ref: string;
  agent_substrate_warning_refs: string[];
  context_packet_ref: string;
  feedback_event_refs: string[];
  unresolved_tensions_preserved: string[];
  knowledge_gaps_preserved: string[];
  boundary_acknowledgements: string[];
  reason_codes: FormationReceiptReasonCode[];
  boundary_notes: string[];
  authority_boundary?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface FormationReceiptRecord {
  record_version: typeof FORMATION_RECEIPT_RECORD_VERSION;
  builder_version: typeof FORMATION_RECEIPT_BUILDER_VERSION;
  scope: typeof scope;
  receipt_id: string;
  promotion_decision_id: string;
  review_record_ref: string;
  operator_actor_ref: string;
  receipt_status: FormationReceiptStatus;
  selected_candidate_refs: FormationReceiptCandidateRef[];
  omitted_candidate_refs: FormationReceiptCandidateRef[];
  deferred_candidate_refs: FormationReceiptCandidateRef[];
  selected_source_refs: FormationReceiptSourceRef[];
  geometry_digest_ref: string;
  agent_substrate_warning_refs: string[];
  context_packet_ref: string;
  feedback_event_refs: string[];
  unresolved_tensions_preserved: string[];
  knowledge_gaps_preserved: string[];
  boundary_acknowledgements: string[];
  formation_receipt_written: true;
  durable_state_applied: false;
  promotion_executed: false;
  proof_or_evidence_created: false;
  claim_or_evidence_written: false;
  product_write_executed: false;
  reason_codes: FormationReceiptReasonCode[];
  boundary_notes: string[];
  authority_boundary: FormationReceiptAuthorityBoundary;
  created_at: string;
  updated_at: string;
  discarded_at: string | null;
  discard_reason: string | null;
}

export interface FormationReceiptActivityRecord {
  activity_version: typeof FORMATION_RECEIPT_ACTIVITY_VERSION;
  builder_version: typeof FORMATION_RECEIPT_BUILDER_VERSION;
  scope: typeof scope;
  activity_id: string;
  receipt_id: string;
  activity_kind: FormationReceiptActivityKind;
  actor_ref: string;
  summary: string;
  reason_codes: FormationReceiptReasonCode[];
  created_at: string;
  authority_boundary: FormationReceiptAuthorityBoundary;
}

export interface FormationReceiptValidationResult {
  passed: boolean;
  failure_codes: string[];
}

const scope = "project:augnes" as const;

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

export function validateFormationReceiptCreateInputV01(
  input: unknown,
): FormationReceiptValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { passed: false, failure_codes: ["input_invalid_object"] };
  }
  const value = input as Partial<FormationReceiptCreateInput>;
  const failureCodes: string[] = [];
  if (value.builder_version !== FORMATION_RECEIPT_BUILDER_VERSION) {
    failureCodes.push("builder_version_invalid");
  }
  if (value.record_version !== FORMATION_RECEIPT_RECORD_VERSION) {
    failureCodes.push("record_version_invalid");
  }
  if (value.scope !== scope) failureCodes.push("scope_invalid");
  if (!isSafeString(value.receipt_id)) failureCodes.push("receipt_id_invalid");
  if (!isSafeString(value.promotion_decision_id)) {
    failureCodes.push("promotion_decision_ref_missing");
  }
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

  failureCodes.push(
    ...validateCandidateRefs(selectedCandidates, "selected_candidate_refs", "selected"),
  );
  failureCodes.push(
    ...validateCandidateRefs(omittedCandidates, "omitted_candidate_refs", "omitted"),
  );
  failureCodes.push(
    ...validateCandidateRefs(deferredCandidates, "deferred_candidate_refs", "deferred"),
  );
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

export function buildFormationReceiptRecordV01(
  input: FormationReceiptCreateInput,
): FormationReceiptRecord {
  const validation = validateFormationReceiptCreateInputV01(input);
  if (!validation.passed) {
    throw new Error(`formation_receipt_input_invalid:${validation.failure_codes.join(",")}`);
  }
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

export function createFormationReceiptFingerprintV01(
  recordWithoutFingerprintOrIfUsed: unknown,
): string {
  return createHash("sha256")
    .update(stableStringify(recordWithoutFingerprintOrIfUsed))
    .digest("hex");
}

export function formationReceiptStatusForValidationFailuresV01(
  failureCodes: string[],
): FormationReceiptStatus {
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

function validateCandidateRefs(
  refs: unknown[],
  path: string,
  expectedDisposition: FormationReceiptCandidateDisposition,
): string[] {
  return refs.flatMap((ref, index) => {
    const failureCodes: string[] = [];
    if (!ref || typeof ref !== "object" || Array.isArray(ref)) {
      return [`${path}.${index}_invalid`];
    }
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

function normalizeCandidateRefs(
  refs: FormationReceiptCandidateRef[],
): FormationReceiptCandidateRef[] {
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

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
