import { createHash } from "node:crypto";

import type {
  DurablePerspectiveClaimRef,
  DurablePerspectiveKnowledgeGapRef,
  DurablePerspectiveState,
  DurablePerspectiveStateAuthorityBoundary,
  DurablePerspectiveTensionRef,
} from "./apply-perspective-delta";

const DURABLE_PERSPECTIVE_STATE_APPLY_VERSION = "durable_perspective_state_apply.v0.1" as const;
const DURABLE_PERSPECTIVE_STATE_VERSION = "durable_perspective_state.v0.1" as const;

const scope = "project:augnes" as const;

function createDurablePerspectiveStateAuthorityBoundaryV01(): DurablePerspectiveStateAuthorityBoundary {
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

export function buildDurablePerspectiveStateReadModelV01(input: DurablePerspectiveState): DurablePerspectiveState {
  return normalizeDurablePerspectiveStateV01(input);
}

export function normalizeDurablePerspectiveStateV01(input: DurablePerspectiveState): DurablePerspectiveState {
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

export function createDurablePerspectiveStateFingerprintV01(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
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
