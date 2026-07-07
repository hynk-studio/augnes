import type {
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayCompatibilityFinding,
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract,
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayContractInput,
  ResearchCandidateManualGlobalDogfoodPerspectiveRelayNonWriteConfirmation,
} from "@/types/research-candidate-manual-global-dogfood-perspective-relay-contract";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_CONTRACT_KIND,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_CONTRACT_VERSION,
} from "@/types/research-candidate-manual-global-dogfood-perspective-relay-contract";
import type {
  ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalRecord,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary,
  ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt,
} from "@/types/research-candidate-manual-global-dogfood-next-work-signal-write";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const DEFAULT_OPERATOR_INTENT_LABEL =
  "manual_global_dogfood_perspective_relay_contract_preview";
const DEFAULT_FUTURE_WRITE_MODE =
  "perspective_relay_update_authorization_preview";
const FINGERPRINT_ALGORITHM = "fnv1a32_canonical_json_v0_1" as const;

export function buildResearchCandidateManualGlobalDogfoodPerspectiveRelayContract({
  readback,
  operator_intent_label,
  requested_future_write_mode,
}: ResearchCandidateManualGlobalDogfoodPerspectiveRelayContractInput): ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract {
  const sourceReadback = normalizeReadback(readback);
  const active = sourceReadback.latest_active_committed;
  const receipt = active?.receipt ?? null;
  const record = active?.next_work_signal_record ?? null;
  const sourceReadbackRef = `manual-global-dogfood-next-work-signal-readback:${sourceReadback.scope}:${receipt?.receipt_id ?? "none"}`;
  const fieldGaps = buildFieldGaps({ receipt, record });
  const sourceReadbackNoForbiddenWrites =
    readbackPreservesNoPerspectiveBiasWorkWrites(sourceReadback);
  const selectedContextPresent =
    (record?.selected_candidate_context_refs.length ?? 0) > 0;
  const explanatoryMaterialPresent = Boolean(
    record?.expected_summary?.trim() &&
      record?.observed_summary?.trim() &&
      record?.mismatch_or_gap_summary?.trim(),
  );
  const manualContextNotProofOrEvidence =
    (record?.manual_only_context_refs ?? []).every(
      (ref) => !/^(proof|evidence):/i.test(ref.trim()),
    );
  const blockerReasons = uniqueStrings([
    ...(!active ? ["blocked_no_active_committed_next_work_signal_receipt"] : []),
    ...(!record ? ["blocked_missing_next_work_signal_record"] : []),
    ...fieldGaps.map((gap) => `field_gap:${gap}`),
    ...(!selectedContextPresent
      ? ["selected_candidate_context_refs_missing"]
      : []),
    ...(!explanatoryMaterialPresent
      ? ["expected_observed_mismatch_explanatory_material_missing"]
      : []),
    ...(!manualContextNotProofOrEvidence
      ? ["manual_only_context_refs_must_not_be_treated_as_proof_or_evidence"]
      : []),
    ...(!sourceReadbackNoForbiddenWrites
      ? ["source_readback_has_forbidden_perspective_bias_work_or_metric_write"]
      : []),
  ]);
  const operatorAuthorizationMode =
    blockerReasons.length === 0
      ? "ready_for_future_perspective_relay_write_authorization"
      : "blocked_before_perspective_relay_authorization";
  const candidateReady =
    operatorAuthorizationMode ===
    "ready_for_future_perspective_relay_write_authorization";
  const warningReasons = uniqueStrings([
    ...(record?.warnings ?? []),
    ...(record?.manual_only_context_refs.length
      ? ["manual_only_context_refs_preserved_not_proof_evidence"]
      : []),
    "perspective_relay_contract_preview_only_no_perspective_write",
  ]);
  const authorityBoundary =
    createResearchCandidateManualGlobalDogfoodPerspectiveRelayAuthorityBoundary();
  const nonWriteConfirmation = createPerspectiveRelayNonWriteConfirmation();
  const idempotencyKey = `manual-global-dogfood-perspective-relay-contract:${fingerprint({
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_CONTRACT_VERSION,
    source_next_work_signal_receipt_id: receipt?.receipt_id ?? null,
    source_next_work_signal_record_id:
      record?.next_work_signal_record_id ?? null,
    source_next_work_signal_record_fingerprint:
      record?.next_work_signal_record_fingerprint ?? null,
    source_projection_fingerprint: receipt?.source_projection_fingerprint ?? null,
    source_global_dogfood_ledger_receipt_id:
      receipt?.source_global_dogfood_ledger_receipt_id ?? null,
    source_metric_snapshot_receipt_id:
      receipt?.source_metric_snapshot_receipt_id ?? null,
    source_manual_receipt_id: receipt?.source_manual_receipt_id ?? null,
    source_expected_observed_delta_record_ref:
      receipt?.source_expected_observed_delta_record_ref ?? null,
    source_reuse_outcome_record_ref:
      receipt?.source_reuse_outcome_record_ref ?? null,
    relay_update_label: buildRelayUpdateLabel(record),
    recommended_next_work_label: record?.recommended_next_work_label ?? null,
    rationale: record?.rationale ?? null,
    outcome_label: record?.outcome_label ?? null,
    outcome_signal: record?.outcome_signal ?? null,
    selected_candidate_context_refs:
      record?.selected_candidate_context_refs ?? [],
    source_next_work_candidate_card_ids:
      record?.source_next_work_candidate_card_ids ?? [],
    expected_summary: record?.expected_summary ?? null,
    observed_summary: record?.observed_summary ?? null,
    mismatch_or_gap_summary: record?.mismatch_or_gap_summary ?? null,
  })}`;
  const contractFingerprint = fingerprint({
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_CONTRACT_VERSION,
    scope: sourceReadback.scope,
    source_readback_ref: sourceReadbackRef,
    source_next_work_signal_receipt_id: receipt?.receipt_id ?? null,
    source_next_work_signal_record_id:
      record?.next_work_signal_record_id ?? null,
    source_next_work_signal_record_fingerprint:
      record?.next_work_signal_record_fingerprint ?? null,
    proposed_idempotency_key: idempotencyKey,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    authority_boundary: authorityBoundary,
  });

  return {
    contract_kind:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_CONTRACT_KIND,
    contract_version:
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_CONTRACT_VERSION,
    scope: sourceReadback.scope,
    operator_intent_label: normalizeLabel(operator_intent_label),
    requested_future_write_mode: normalizeLabel(
      requested_future_write_mode,
      DEFAULT_FUTURE_WRITE_MODE,
    ),
    source_next_work_signal_readback_ref: sourceReadbackRef,
    source_next_work_signal_receipt_id: receipt?.receipt_id ?? null,
    source_next_work_signal_record_id:
      record?.next_work_signal_record_id ?? null,
    source_next_work_signal_record_fingerprint:
      record?.next_work_signal_record_fingerprint ?? null,
    source_projection_fingerprint: receipt?.source_projection_fingerprint ?? null,
    source_global_dogfood_ledger_receipt_id:
      receipt?.source_global_dogfood_ledger_receipt_id ?? null,
    source_global_dogfood_ledger_record_id:
      receipt?.source_global_dogfood_ledger_record_id ?? null,
    source_metric_snapshot_receipt_id:
      receipt?.source_metric_snapshot_receipt_id ?? null,
    source_metric_snapshot_record_id:
      receipt?.source_metric_snapshot_record_id ?? null,
    source_manual_receipt_id: receipt?.source_manual_receipt_id ?? null,
    source_handoff_seed_fingerprint:
      receipt?.source_handoff_seed_fingerprint ?? null,
    source_result_text_fingerprint:
      receipt?.source_result_text_fingerprint ?? null,
    source_expected_observed_delta_record_ref:
      receipt?.source_expected_observed_delta_record_ref ?? null,
    source_reuse_outcome_record_ref:
      receipt?.source_reuse_outcome_record_ref ?? null,
    operator_authorization_mode: operatorAuthorizationMode,
    proposed_perspective_relay_mapping: {
      relay_update_label: buildRelayUpdateLabel(record),
      relay_update_rationale: record
        ? `Relay preview from manual next-work signal decision: ${record.rationale}`
        : null,
      recommended_next_work_label: record?.recommended_next_work_label ?? null,
      outcome_label: record?.outcome_label ?? null,
      outcome_signal: record?.outcome_signal ?? null,
      expected_summary: record?.expected_summary ?? null,
      observed_summary: record?.observed_summary ?? null,
      mismatch_or_gap_summary: record?.mismatch_or_gap_summary ?? null,
      selected_candidate_context_refs:
        record?.selected_candidate_context_refs ?? [],
      source_next_work_candidate_card_ids:
        record?.source_next_work_candidate_card_ids ?? [],
      manual_only_context_refs: record?.manual_only_context_refs ?? [],
      source_line: record?.source_line ?? null,
      blockers: blockerReasons,
      warnings: warningReasons,
      can_feed_perspective_relay_update_candidate: candidateReady,
      can_write_perspective_relay_now: false,
      can_promote_perspective_now: false,
      can_write_perspective_memory_now: false,
      can_write_next_work_bias_now: false,
      can_mutate_work_now: false,
    },
    proposed_relay_update_candidate: {
      candidate_kind: "manual_global_dogfood_perspective_relay_update_candidate",
      candidate_status: candidateReady
        ? "ready_for_future_perspective_relay_write_authorization"
        : "blocked_before_perspective_relay_authorization",
      relay_scope_hint: candidateReady ? "manual_global_dogfood_signal" : "blocked",
      reason: candidateReady
        ? "Active committed manual next-work signal decision material can be reviewed for a future separately authorized Perspective relay update."
        : "Source next-work signal decision material lacks the active, explanatory, no-write shape required before Perspective relay authorization.",
      writes_now: false,
      would_promote_perspective: false,
      would_write_memory: false,
      would_write_next_work_bias: false,
    },
    idempotency_contract_preview: {
      proposed_idempotency_key: idempotencyKey,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      would_prevent_duplicate_perspective_relay_write: true,
      durable_id_allocated: false,
      writes_now: false,
    },
    compatibility_findings: buildCompatibilityFindings({
      candidateReady,
      fieldGaps,
      explanatoryMaterialPresent,
      manualContextNotProofOrEvidence,
      sourceReadbackNoForbiddenWrites,
    }),
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
    required_future_authorization: [
      "explicit_operator_acceptance_of_perspective_relay_contract",
      "separate_future_perspective_relay_write_slice",
      "fresh_operator_confirmation_text_for_perspective_relay_write",
      "future_idempotent_perspective_relay_writer_contract",
      "no_perspective_promotion_memory_bias_work_or_proof_write_without_separate_contract",
    ],
    required_future_checks: [
      "confirm_next_work_signal_receipt_is_still_active_committed",
      "confirm_next_work_signal_record_fingerprint_still_matches_readback",
      "confirm_expected_observed_mismatch_material_still_explains_the_relay_update",
      "confirm_manual_only_context_refs_are_not_proof_or_evidence_refs",
      "run_non_target_table_row_count_checks_before_and_after_future_write",
    ],
    non_write_confirmation: nonWriteConfirmation,
    validation: {
      passed:
        candidateReady &&
        nonWriteConfirmation.perspective_relay_written === false &&
        authorityBoundary.can_write_perspective_relay === false,
      contract_fingerprint: contractFingerprint,
      fingerprint_algorithm: FINGERPRINT_ALGORITHM,
      active_committed_next_work_signal_receipt_present: Boolean(active),
      active_committed_next_work_signal_record_present: Boolean(record),
      source_fingerprints_present: fieldGaps.length === 0,
      explanatory_expected_observed_material_present:
        explanatoryMaterialPresent,
      selected_candidate_context_refs_present: selectedContextPresent,
      manual_context_not_proof_or_evidence: manualContextNotProofOrEvidence,
      source_readback_preserves_no_perspective_bias_work_writes:
        sourceReadbackNoForbiddenWrites,
      no_write_authority:
        authorityBoundary.can_write_perspective_relay === false &&
        authorityBoundary.can_write_perspective_state === false &&
        authorityBoundary.can_write_next_work_bias === false &&
        authorityBoundary.can_mutate_work === false,
      blocker_count: blockerReasons.length,
      warning_count: warningReasons.length,
    },
    authority_boundary: authorityBoundary,
    next_recommended_slice: candidateReady
      ? "If accepted locally, implement a separate explicitly authorized idempotent Perspective relay update write slice with row-count validation."
      : "Resolve next-work signal readback blockers before preparing Perspective relay write authorization.",
  };
}

export function createResearchCandidateManualGlobalDogfoodPerspectiveRelayAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodPerspectiveRelayAuthorityBoundary {
  return {
    preview_only: true,
    read_only: true,
    source_of_truth: false,
    can_write_perspective_relay: false,
    can_write_perspective_state: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_write_next_work_bias: false,
    can_write_work_item: false,
    can_mutate_work: false,
    can_write_dogfood_metrics: false,
    can_write_global_dogfood_ledger: false,
    can_write_metric_snapshot: false,
    can_write_next_work_signal_decision: false,
    can_write_proof_or_evidence: false,
    can_execute_codex: false,
    can_call_github: false,
    can_call_providers_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false,
    can_allocate_product_ids: false,
    can_execute_product_write: false,
  };
}

function normalizeReadback(
  value: unknown,
): ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "latest_active_committed" in value &&
    "records_by_receipt" in value &&
    "authority_boundary" in value
  ) {
    return value as ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback;
  }

  return {
    readback_kind:
      "research_candidate_manual_global_dogfood_next_work_signal_readback",
    readback_version:
      "research_candidate_manual_global_dogfood_next_work_signal_readback.v0.1",
    scope: DEFAULT_SCOPE,
    records_by_receipt: [],
    latest_receipts: [],
    latest_active_committed: null,
    count: 0,
    authority_boundary: createMissingSourceAuthorityBoundary(),
    raw_manual_note_text_present: false,
    raw_result_report_text_present: false,
    operator_notes_persisted: false,
    next_work_bias_written: false,
    work_or_perspective_rows_written: false,
    dogfood_metrics_written: false,
    metric_snapshot_mutated: false,
    global_dogfood_ledger_mutated: false,
    proof_or_evidence_rows_written: false,
    perspective_memory_written: false,
    product_write_executed: false,
  };
}

function buildFieldGaps({
  receipt,
  record,
}: {
  receipt: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteReceipt | null;
  record: ResearchCandidateManualGlobalDogfoodNextWorkSignalRecord | null;
}) {
  return uniqueStrings([
    !receipt?.receipt_id ? "source_next_work_signal_receipt_id" : null,
    !record?.next_work_signal_record_id
      ? "source_next_work_signal_record_id"
      : null,
    !record?.next_work_signal_record_fingerprint
      ? "source_next_work_signal_record_fingerprint"
      : null,
    !receipt?.source_projection_fingerprint
      ? "source_projection_fingerprint"
      : null,
    !receipt?.source_global_dogfood_ledger_receipt_id
      ? "source_global_dogfood_ledger_receipt_id"
      : null,
    !receipt?.source_global_dogfood_ledger_record_id
      ? "source_global_dogfood_ledger_record_id"
      : null,
    !receipt?.source_metric_snapshot_receipt_id
      ? "source_metric_snapshot_receipt_id"
      : null,
    !receipt?.source_metric_snapshot_record_id
      ? "source_metric_snapshot_record_id"
      : null,
    !receipt?.source_manual_receipt_id ? "source_manual_receipt_id" : null,
    !receipt?.source_handoff_seed_fingerprint
      ? "source_handoff_seed_fingerprint"
      : null,
    !receipt?.source_result_text_fingerprint
      ? "source_result_text_fingerprint"
      : null,
    !receipt?.source_expected_observed_delta_record_ref
      ? "source_expected_observed_delta_record_ref"
      : null,
    !receipt?.source_reuse_outcome_record_ref
      ? "source_reuse_outcome_record_ref"
      : null,
  ]);
}

function readbackPreservesNoPerspectiveBiasWorkWrites(
  readback: ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback,
) {
  const boundary = readback.authority_boundary;
  return (
    readback.next_work_bias_written === false &&
    readback.work_or_perspective_rows_written === false &&
    readback.dogfood_metrics_written === false &&
    readback.proof_or_evidence_rows_written === false &&
    readback.perspective_memory_written === false &&
    readback.product_write_executed === false &&
    boundary.can_write_next_work_bias === false &&
    boundary.can_write_work_item === false &&
    boundary.can_mutate_work === false &&
    boundary.can_write_perspective_state === false &&
    boundary.can_promote_perspective === false &&
    boundary.can_write_perspective_memory === false &&
    boundary.can_write_dogfood_metrics === false &&
    boundary.can_write_proof_or_evidence === false &&
    boundary.can_execute_product_write === false
  );
}

function buildCompatibilityFindings({
  candidateReady,
  fieldGaps,
  explanatoryMaterialPresent,
  manualContextNotProofOrEvidence,
  sourceReadbackNoForbiddenWrites,
}: {
  candidateReady: boolean;
  fieldGaps: string[];
  explanatoryMaterialPresent: boolean;
  manualContextNotProofOrEvidence: boolean;
  sourceReadbackNoForbiddenWrites: boolean;
}): ResearchCandidateManualGlobalDogfoodPerspectiveRelayCompatibilityFinding[] {
  const findings: ResearchCandidateManualGlobalDogfoodPerspectiveRelayCompatibilityFinding[] = [
    {
      finding_code: candidateReady
        ? "next_work_signal_ready_for_perspective_relay_contract"
        : "next_work_signal_not_ready_for_perspective_relay_contract",
      severity: candidateReady ? "ready" : "blocker",
      applies_to: "manual_global_dogfood_next_work_signal_decision",
      summary: candidateReady
        ? "The active committed manual next-work signal decision can feed a preview-only Perspective relay authorization contract."
        : "The Perspective relay authorization preview is blocked by source readback, explanatory material, or source-shape gaps.",
    },
    {
      finding_code: "perspective_relay_write_requires_future_slice",
      severity: "warning",
      applies_to: "future_perspective_relay_update",
      summary:
        "This preview does not write Perspective relay, Perspective state, Perspective Memory, next-work bias, work status, proof/evidence, metrics, or product state.",
    },
  ];

  if (fieldGaps.length > 0) {
    findings.push({
      finding_code: "perspective_relay_source_field_gaps_present",
      severity: "blocker",
      applies_to: "manual_global_dogfood_next_work_signal_decision",
      summary: `Missing source fields: ${fieldGaps.join(", ")}.`,
    });
  }
  if (!explanatoryMaterialPresent) {
    findings.push({
      finding_code: "perspective_relay_explanatory_material_missing",
      severity: "blocker",
      applies_to: "future_perspective_relay_update",
      summary:
        "Perspective relay preview requires expected, observed, and mismatch/gap material before any future relay authorization.",
    });
  }
  if (!manualContextNotProofOrEvidence) {
    findings.push({
      finding_code: "perspective_relay_manual_context_must_not_be_proof",
      severity: "blocker",
      applies_to: "future_perspective_relay_update",
      summary:
        "Manual-only context refs must remain manual context and cannot be treated as proof/evidence refs.",
    });
  }
  if (!sourceReadbackNoForbiddenWrites) {
    findings.push({
      finding_code: "perspective_relay_source_readback_has_forbidden_write_flags",
      severity: "blocker",
      applies_to: "manual_global_dogfood_next_work_signal_decision",
      summary:
        "The source readback must preserve no Perspective, next-work bias, work, metrics, proof, memory, or product writes before future relay authorization.",
    });
  }
  return findings;
}

function buildRelayUpdateLabel(
  record: ResearchCandidateManualGlobalDogfoodNextWorkSignalRecord | null,
) {
  if (!record?.recommended_next_work_label?.trim()) return null;
  return `manual_global_dogfood_signal:${record.recommended_next_work_label}`;
}

function createPerspectiveRelayNonWriteConfirmation(): ResearchCandidateManualGlobalDogfoodPerspectiveRelayNonWriteConfirmation {
  return {
    perspective_relay_written: false,
    perspective_state_written: false,
    perspective_promoted: false,
    perspective_memory_written: false,
    next_work_bias_written: false,
    work_item_written: false,
    work_mutated: false,
    dogfood_metrics_written: false,
    global_dogfood_ledger_written: false,
    metric_snapshot_written: false,
    next_work_signal_decision_written: false,
    proof_or_evidence_written: false,
    manual_result_records_written: false,
    manual_result_records_mutated: false,
    product_write_executed: false,
    api_write_route_added: false,
    db_schema_or_migration_added: false,
    provider_openai_called: false,
    github_called: false,
    codex_executed: false,
    sources_fetched: false,
    retrieval_rag_embeddings_vector_fts_or_crawler_run: false,
    operator_note_persisted: false,
  };
}

function createMissingSourceAuthorityBoundary(): ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteAuthorityBoundary {
  return {
    can_write_next_work_signal_decision_record: true,
    can_write_next_work_signal_decision_receipt: true,
    can_write_next_work_signal_rollback_metadata: true,
    source_of_truth: false,
    can_write_next_work_bias: false,
    can_write_work_item: false,
    can_mutate_work: false,
    can_write_perspective_state: false,
    can_promote_perspective: false,
    can_write_perspective_memory: false,
    can_write_dogfood_metrics: false,
    can_write_global_dogfood_ledger: false,
    can_mutate_manual_global_dogfood_ledger: false,
    can_write_metric_snapshot: false,
    can_mutate_metric_snapshot: false,
    can_write_proof_or_evidence: false,
    can_execute_codex: false,
    can_call_github: false,
    can_call_providers_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false,
    can_allocate_product_ids: false,
    can_execute_product_write: false,
    persists_raw_manual_note_text: false,
    persists_raw_result_report_text: false,
    persists_operator_notes: false,
  };
}

function normalizeLabel(
  value: string | undefined,
  fallback = DEFAULT_OPERATOR_INTENT_LABEL,
) {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())))];
}

function fingerprint(value: unknown) {
  return `${FINGERPRINT_ALGORITHM}:${fnv1a32(stableJson(value))}`;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}

function fnv1a32(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
