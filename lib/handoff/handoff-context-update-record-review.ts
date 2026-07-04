import {
  APPROVED_HANDOFF_CONTEXT_UPDATE_RECORD_REVIEW_VERSION,
  type ApprovedHandoffContextUpdateApprovedMaterialSummary,
  type ApprovedHandoffContextUpdateNoSideEffectsSummary,
  type ApprovedHandoffContextUpdateRecordAuthoritySummary,
  type ApprovedHandoffContextUpdateRecordCandidateCounts,
  type ApprovedHandoffContextUpdateRecordReview,
  type ApprovedHandoffContextUpdateRecordReviewAuthorityBoundary,
  type ApprovedHandoffContextUpdateRecordReviewEvidenceSummary,
  type ApprovedHandoffContextUpdateRecordReviewInput,
  type ApprovedHandoffContextUpdateRecordReviewStatus,
  type ApprovedHandoffContextUpdateRecordSummary,
} from "@/types/handoff-context-update-record-review";
import {
  OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_RECORD_VERSION,
  OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE,
} from "@/types/handoff-context-update-write";

interface RecordEvaluation {
  summary: ApprovedHandoffContextUpdateRecordSummary;
  valid: boolean;
  sourceRefs: string[];
  evidenceRefs: string[];
  missingEvidence: string[];
}

const zeroCandidateCounts: ApprovedHandoffContextUpdateRecordCandidateCounts = {
  selected_ref_add_count: 0,
  selected_ref_reinforcement_count: 0,
  warning_update_count: 0,
  context_diet_count: 0,
  keep_unknown_count: 0,
  expected_return_signal_count: 0,
  stop_if_missing_count: 0,
  rejected_or_excluded_count: 0,
};

const reviewNonGoals = [
  "Do not create or update operator-approved handoff context update records.",
  "Do not create a DB schema or open a write-capable store.",
  "Do not apply selected refs to a live handoff packet.",
  "Do not mutate live handoff context or send handoffs.",
  "Do not call providers, GitHub, Codex, or autonomous product actions.",
] as const;

export function buildApprovedHandoffContextUpdateRecordReviewV01(
  input: ApprovedHandoffContextUpdateRecordReviewInput,
): ApprovedHandoffContextUpdateRecordReview {
  const asOf = input.as_of ?? new Date(0).toISOString();
  const scope = input.scope ?? OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_SCOPE;
  const suppliedRecords = Array.isArray(input.records) ? input.records : [];
  const selectedRecordId =
    typeof input.selected_record_id === "string" &&
    input.selected_record_id.trim().length > 0
      ? input.selected_record_id
      : null;

  const evaluations = suppliedRecords.map(evaluateRecord);
  const validEvaluations = evaluations.filter((evaluation) => evaluation.valid);
  const allSummaries = evaluations
    .map((evaluation) => evaluation.summary)
    .sort(compareRecordSummariesNewestFirst);
  const validSummaries = validEvaluations
    .map((evaluation) => evaluation.summary)
    .sort(compareRecordSummariesNewestFirst);
  const selectedRecordSummary = selectedRecordId
    ? validSummaries.find((summary) => summary.record_id === selectedRecordId) ??
      null
    : null;
  const latestRecordSummary = validSummaries[0] ?? null;
  const problemRecordIds = uniqueSortedStrings(
    evaluations
      .filter((evaluation) => !evaluation.valid)
      .map((evaluation) => evaluation.summary.record_id),
  );
  const sourceRefs = uniqueSortedStrings([
    ...(input.source_refs ?? []),
    ...validEvaluations.flatMap((evaluation) => evaluation.sourceRefs),
  ]);
  const evidenceRefs = uniqueSortedStrings(
    validEvaluations.flatMap((evaluation) => evaluation.evidenceRefs),
  );
  const missingEvidence = uniqueSortedStrings(
    evaluations.flatMap((evaluation) => evaluation.missingEvidence),
  );
  const approvedMaterialSummary = validSummaries.reduce(
    addCandidateCounts,
    { ...zeroCandidateCounts },
  );
  const evidenceSummary = buildEvidenceSummary({
    suppliedRecordCount: suppliedRecords.length,
    selectedRecordSummary,
    sourceRefs,
    evidenceRefs,
    missingEvidence,
    allSummaries,
    problemRecordIds,
  });
  const reviewStatus = determineReviewStatus({
    suppliedRecordCount: suppliedRecords.length,
    validRecordCount: validSummaries.length,
    selectedRecordId,
    selectedRecordFound: Boolean(selectedRecordSummary),
  });
  const insufficientDataReasons = insufficientReasons({
    suppliedRecordCount: suppliedRecords.length,
    validRecordCount: validSummaries.length,
    selectedRecordId,
    selectedRecordFound: Boolean(selectedRecordSummary),
    storeStatus: input.store_result?.status ?? null,
    problemRecordIds,
  });

  return {
    review_version: APPROVED_HANDOFF_CONTEXT_UPDATE_RECORD_REVIEW_VERSION,
    scope,
    as_of: asOf,
    source_refs: sourceRefs,
    review_status: reviewStatus,
    input_summary: {
      supplied_record_count: suppliedRecords.length,
      valid_record_count: validSummaries.length,
      invalid_record_count: suppliedRecords.length - validSummaries.length,
      selected_record_id: selectedRecordId,
      selected_record_found: Boolean(selectedRecordSummary),
      latest_record_id: latestRecordSummary?.record_id ?? null,
      latest_record_created_at: latestRecordSummary?.created_at ?? null,
      live_handoff_context_mutated_count: allSummaries.filter(
        hasLiveHandoffMutation,
      ).length,
      selected_refs_written_to_live_handoff_count: allSummaries.filter(
        hasSelectedRefsWrittenToLiveHandoff,
      ).length,
      handoff_sent_count: allSummaries.filter(hasHandoffSent).length,
    },
    record_summaries: allSummaries,
    selected_record_summary: selectedRecordSummary,
    approved_material_summary: approvedMaterialSummary,
    evidence_summary: evidenceSummary,
    live_state_boundary: {
      live_handoff_context_mutated: false,
      selected_refs_written_to_live_handoff: false,
      handoff_sent: false,
      review_note:
        "This review summarizes already-written records and does not apply material to live handoff state.",
    },
    operator_review_checklist: [
      "Review the latest operator-approved record id, created_at, and operator refs.",
      "Review selected-ref, warning, context-diet, keep-unknown, and expected-return material as recorded.",
      "Confirm evidence and source refs are present before using the record in a later separately approved slice.",
      "Confirm live handoff context was not mutated, selected refs were not written to a live packet, and no handoff was sent.",
    ],
    blocked_reasons: problemRecordIds.map(
      (recordId) => `problem_record_requires_review:${recordId}`,
    ),
    insufficient_data_reasons: insufficientDataReasons,
    non_goals: [...reviewNonGoals],
    authority_boundary:
      createApprovedHandoffContextUpdateRecordReviewAuthorityBoundaryV01(),
  };
}

export function createApprovedHandoffContextUpdateRecordReviewAuthorityBoundaryV01(): ApprovedHandoffContextUpdateRecordReviewAuthorityBoundary {
  return {
    read_only_record_review: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_write_handoff_context_update_record: false,
    can_write_operator_approved_handoff_context_update_record: false,
    can_mutate_live_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_continuity_relay: false,
    can_update_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_apply_project_perspective: false,
    can_create_promotion_decision: false,
    can_create_formation_receipt: false,
    can_write_dogfood_metrics: false,
    can_update_metrics: false,
    can_write_dogfood_ledger: false,
    can_call_provider_openai: false,
    can_call_github: false,
    can_execute_codex: false,
    can_create_pr: false,
    can_merge_pr: false,
    can_run_autonomous_action: false,
    can_create_graph_or_vector_store: false,
    can_create_rag_stack: false,
    can_crawl_or_observe_browser: false,
    notes: [
      "Read-only review of supplied operator-approved handoff context update records.",
      "The review builder does not open DB handles, create schema, call routes, write records, mutate live handoff context, or send handoffs.",
    ],
  };
}

function evaluateRecord(recordLike: unknown, index: number): RecordEvaluation {
  const record = isRecord(recordLike) ? recordLike : null;
  const recordId =
    asString(record?.record_id) ?? `malformed_record:${index + 1}`;
  const candidateCounts = countRecordCandidates(record);
  const sourceRefs = sourceRefsFromRecord(record);
  const evidenceRefs = evidenceRefsFromRecord(record);
  const missingEvidence = stringArrayFromPath(
    getRecord(record, "evidence_summary"),
    "missing_evidence",
  );
  const authoritySummary = summarizeRecordAuthority(
    getRecord(record, "authority_boundary"),
  );
  const noSideEffectsSummary = summarizeNoSideEffects(
    getRecord(record, "no_side_effects"),
  );
  const problemReasons = recordProblems({
    record,
    authoritySummary,
    noSideEffectsSummary,
  });

  return {
    summary: {
      record_id: recordId,
      idempotency_key: asString(record?.idempotency_key) ?? "",
      created_at: asString(record?.created_at) ?? "",
      operator_ref:
        asString(getRecord(record, "operator_approval")?.operator_ref) ?? null,
      approved_by:
        asString(getRecord(record, "operator_approval")?.approved_by) ?? null,
      operator_decision: asString(record?.operator_decision) ?? null,
      candidate_counts: candidateCounts,
      evidence_ref_count: evidenceRefs.length,
      source_ref_count: sourceRefs.length,
      record_fingerprint: asString(record?.record_fingerprint) ?? null,
      validation_hash:
        asString(getRecord(record, "write_validation")?.validation_hash) ??
        null,
      authority_summary: authoritySummary,
      no_side_effects_summary: noSideEffectsSummary,
      problem_reasons: problemReasons,
    },
    valid: problemReasons.length === 0,
    sourceRefs,
    evidenceRefs,
    missingEvidence,
  };
}

function recordProblems({
  record,
  authoritySummary,
  noSideEffectsSummary,
}: {
  record: Record<string, unknown> | null;
  authoritySummary: ApprovedHandoffContextUpdateRecordAuthoritySummary;
  noSideEffectsSummary: ApprovedHandoffContextUpdateNoSideEffectsSummary;
}): string[] {
  const reasons: string[] = [];
  if (!record) {
    reasons.push("record_malformed");
    return reasons;
  }
  if (
    record.record_version !==
    OPERATOR_APPROVED_HANDOFF_CONTEXT_UPDATE_RECORD_VERSION
  ) {
    reasons.push("record_version_invalid");
  }
  if (!asString(record.record_fingerprint)) {
    reasons.push("record_fingerprint_missing");
  }
  if (!asString(getRecord(record, "write_validation")?.validation_hash)) {
    reasons.push("write_validation_hash_missing");
  }
  for (const [field, value] of Object.entries(authoritySummary)) {
    if (isProblematicRecordAuthorityField(field) && value) {
      reasons.push(`authority_${field}_true`);
    }
  }
  for (const [field, value] of Object.entries(noSideEffectsSummary)) {
    if (value) {
      reasons.push(`no_side_effects_${field}_true`);
    }
  }
  return uniqueSortedStrings(reasons);
}

function summarizeRecordAuthority(
  authority: Record<string, unknown> | null,
): ApprovedHandoffContextUpdateRecordAuthoritySummary {
  return {
    can_write_db: authority?.can_write_db === true,
    can_write_handoff_context_update_record:
      authority?.can_write_handoff_context_update_record === true,
    can_write_operator_approved_handoff_context_update_record:
      authority?.can_write_operator_approved_handoff_context_update_record ===
      true,
    can_mutate_live_handoff_context:
      authority?.can_mutate_live_handoff_context === true,
    can_write_selected_refs_to_live_handoff:
      authority?.can_write_selected_refs_to_live_handoff === true,
    can_send_handoff: authority?.can_send_handoff === true,
    can_write_continuity_relay:
      authority?.can_write_continuity_relay === true,
    can_update_current_working_perspective:
      authority?.can_update_current_working_perspective === true,
    can_write_perspective_unit:
      authority?.can_write_perspective_unit === true,
    can_write_next_work_bias: authority?.can_write_next_work_bias === true,
    can_write_memory: authority?.can_write_memory === true,
    can_mutate_memory: authority?.can_mutate_memory === true,
    can_write_dogfood_metrics:
      authority?.can_write_dogfood_metrics === true,
    can_update_metrics: authority?.can_update_metrics === true,
    can_write_dogfood_ledger:
      authority?.can_write_dogfood_ledger === true,
    can_call_provider_openai:
      authority?.can_call_provider_openai === true,
    can_call_github: authority?.can_call_github === true,
    can_execute_codex: authority?.can_execute_codex === true,
    can_create_pr: authority?.can_create_pr === true,
    can_merge_pr: authority?.can_merge_pr === true,
    can_run_autonomous_action:
      authority?.can_run_autonomous_action === true,
    can_create_graph_or_vector_store:
      authority?.can_create_graph_or_vector_store === true,
    can_create_rag_stack: authority?.can_create_rag_stack === true,
    can_crawl_or_observe_browser:
      authority?.can_crawl_or_observe_browser === true,
  };
}

function summarizeNoSideEffects(
  noSideEffects: Record<string, unknown> | null,
): ApprovedHandoffContextUpdateNoSideEffectsSummary {
  return {
    handoff_context_mutated:
      noSideEffects?.handoff_context_mutated === true,
    selected_refs_written_to_live_handoff:
      noSideEffects?.selected_refs_written_to_live_handoff === true,
    handoff_sent: noSideEffects?.handoff_sent === true,
    continuity_relay_written:
      noSideEffects?.continuity_relay_written === true,
    current_working_perspective_updated:
      noSideEffects?.current_working_perspective_updated === true,
    perspective_unit_written:
      noSideEffects?.perspective_unit_written === true,
    next_work_bias_written:
      noSideEffects?.next_work_bias_written === true,
    memory_mutated: noSideEffects?.memory_mutated === true,
    dogfood_metrics_written:
      noSideEffects?.dogfood_metrics_written === true,
    reuse_ledger_written: noSideEffects?.reuse_ledger_written === true,
    provider_called: noSideEffects?.provider_called === true,
    github_called: noSideEffects?.github_called === true,
    codex_executed: noSideEffects?.codex_executed === true,
    pr_created: noSideEffects?.pr_created === true,
    pr_merged: noSideEffects?.pr_merged === true,
    autonomous_action_run:
      noSideEffects?.autonomous_action_run === true,
    graph_or_vector_store_created:
      noSideEffects?.graph_or_vector_store_created === true,
    rag_stack_created: noSideEffects?.rag_stack_created === true,
    crawler_or_browser_observer_created:
      noSideEffects?.crawler_or_browser_observer_created === true,
  };
}

function countRecordCandidates(
  record: Record<string, unknown> | null,
): ApprovedHandoffContextUpdateRecordCandidateCounts {
  const approved = getRecord(record, "approved_candidate_material");
  const carryForward = getRecord(record, "carry_forward_material");
  return {
    selected_ref_add_count: candidateArray(
      approved?.selected_ref_add_candidates,
    ).length,
    selected_ref_reinforcement_count: candidateArray(
      approved?.selected_ref_reinforcement_candidates,
    ).length,
    warning_update_count: candidateArray(
      approved?.warning_update_candidates,
    ).length,
    context_diet_count: candidateArray(
      approved?.context_diet_candidates,
    ).length,
    keep_unknown_count: candidateArray(
      approved?.keep_unknown_candidates,
    ).length,
    expected_return_signal_count: candidateArray(
      approved?.expected_return_signal_candidates,
    ).length,
    stop_if_missing_count: candidateArray(
      carryForward?.stop_if_missing_candidates,
    ).length,
    rejected_or_excluded_count: candidateArray(
      carryForward?.rejected_or_excluded_candidates,
    ).length,
  };
}

function addCandidateCounts(
  total: ApprovedHandoffContextUpdateApprovedMaterialSummary,
  summary: ApprovedHandoffContextUpdateRecordSummary,
): ApprovedHandoffContextUpdateApprovedMaterialSummary {
  return {
    selected_ref_add_count:
      total.selected_ref_add_count +
      summary.candidate_counts.selected_ref_add_count,
    selected_ref_reinforcement_count:
      total.selected_ref_reinforcement_count +
      summary.candidate_counts.selected_ref_reinforcement_count,
    warning_update_count:
      total.warning_update_count +
      summary.candidate_counts.warning_update_count,
    context_diet_count:
      total.context_diet_count +
      summary.candidate_counts.context_diet_count,
    keep_unknown_count:
      total.keep_unknown_count +
      summary.candidate_counts.keep_unknown_count,
    expected_return_signal_count:
      total.expected_return_signal_count +
      summary.candidate_counts.expected_return_signal_count,
    stop_if_missing_count:
      total.stop_if_missing_count +
      summary.candidate_counts.stop_if_missing_count,
    rejected_or_excluded_count:
      total.rejected_or_excluded_count +
      summary.candidate_counts.rejected_or_excluded_count,
  };
}

function buildEvidenceSummary({
  suppliedRecordCount,
  selectedRecordSummary,
  sourceRefs,
  evidenceRefs,
  missingEvidence,
  allSummaries,
  problemRecordIds,
}: {
  suppliedRecordCount: number;
  selectedRecordSummary: ApprovedHandoffContextUpdateRecordSummary | null;
  sourceRefs: string[];
  evidenceRefs: string[];
  missingEvidence: string[];
  allSummaries: ApprovedHandoffContextUpdateRecordSummary[];
  problemRecordIds: string[];
}): ApprovedHandoffContextUpdateRecordReviewEvidenceSummary {
  return {
    has_records: suppliedRecordCount > 0,
    has_selected_record: Boolean(selectedRecordSummary),
    has_source_refs: sourceRefs.length > 0,
    has_evidence_refs: evidenceRefs.length > 0,
    all_records_have_fingerprints:
      suppliedRecordCount > 0 &&
      allSummaries.every((summary) => Boolean(summary.record_fingerprint)),
    all_records_have_validation_hashes:
      suppliedRecordCount > 0 &&
      allSummaries.every((summary) => Boolean(summary.validation_hash)),
    all_records_confirm_no_live_handoff_mutation:
      allSummaries.every((summary) => !hasLiveHandoffMutation(summary)),
    all_records_confirm_no_handoff_send: allSummaries.every(
      (summary) => !hasHandoffSent(summary),
    ),
    all_records_confirm_no_provider_github_codex: allSummaries.every(
      (summary) => !hasProviderGithubCodexCall(summary),
    ),
    problem_record_ids: problemRecordIds,
    evidence_refs: evidenceRefs,
    source_refs: sourceRefs,
    missing_evidence: missingEvidence,
  };
}

function determineReviewStatus({
  suppliedRecordCount,
  validRecordCount,
  selectedRecordId,
  selectedRecordFound,
}: {
  suppliedRecordCount: number;
  validRecordCount: number;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
}): ApprovedHandoffContextUpdateRecordReviewStatus {
  if (suppliedRecordCount === 0) return "no_records";
  if (validRecordCount === 0) return "invalid_records";
  if (selectedRecordId && selectedRecordFound) {
    return "selected_record_available";
  }
  return "records_available";
}

function insufficientReasons({
  suppliedRecordCount,
  validRecordCount,
  selectedRecordId,
  selectedRecordFound,
  storeStatus,
  problemRecordIds,
}: {
  suppliedRecordCount: number;
  validRecordCount: number;
  selectedRecordId: string | null;
  selectedRecordFound: boolean;
  storeStatus: string | null;
  problemRecordIds: string[];
}): string[] {
  const reasons: string[] = [];
  if (suppliedRecordCount === 0) {
    reasons.push("no_operator_approved_handoff_context_update_records_supplied");
  }
  if (suppliedRecordCount > 0 && validRecordCount === 0) {
    reasons.push("no_valid_operator_approved_records_available");
  }
  if (selectedRecordId && !selectedRecordFound) {
    reasons.push("selected_record_not_found_in_valid_records");
  }
  if (storeStatus && ["schema_missing", "not_found", "refused"].includes(storeStatus)) {
    reasons.push(`store_result_${storeStatus}`);
  }
  for (const recordId of problemRecordIds) {
    reasons.push(`problem_record:${recordId}`);
  }
  return uniqueSortedStrings(reasons);
}

function sourceRefsFromRecord(record: Record<string, unknown> | null): string[] {
  return uniqueSortedStrings([
    ...stringArrayFromPath(record, "source_refs"),
    ...stringArrayFromPath(getRecord(record, "decision_preview_refs"), "source_refs"),
    ...stringArrayFromPath(getRecord(record, "update_preview_refs"), "source_refs"),
    ...candidateRefs(record, "source_refs"),
    ...candidateRefs(record, "source_record_refs"),
  ]);
}

function evidenceRefsFromRecord(
  record: Record<string, unknown> | null,
): string[] {
  return uniqueSortedStrings([
    ...stringArrayFromPath(getRecord(record, "update_preview_refs"), "evidence_refs"),
    ...stringArrayFromPath(getRecord(record, "evidence_summary"), "evidence_refs"),
    ...candidateRefs(record, "evidence_refs"),
  ]);
}

function candidateRefs(
  record: Record<string, unknown> | null,
  refField: string,
): string[] {
  const approved = getRecord(record, "approved_candidate_material");
  const carryForward = getRecord(record, "carry_forward_material");
  const candidates = [
    ...candidateArray(approved?.selected_ref_add_candidates),
    ...candidateArray(approved?.selected_ref_reinforcement_candidates),
    ...candidateArray(approved?.warning_update_candidates),
    ...candidateArray(approved?.context_diet_candidates),
    ...candidateArray(approved?.keep_unknown_candidates),
    ...candidateArray(approved?.expected_return_signal_candidates),
    ...candidateArray(carryForward?.stop_if_missing_candidates),
    ...candidateArray(carryForward?.rejected_or_excluded_candidates),
  ];
  return uniqueSortedStrings(
    candidates.flatMap((candidate) => stringArrayFromPath(candidate, refField)),
  );
}

function hasLiveHandoffMutation(
  summary: ApprovedHandoffContextUpdateRecordSummary,
): boolean {
  return (
    summary.no_side_effects_summary.handoff_context_mutated ||
    summary.authority_summary.can_mutate_live_handoff_context
  );
}

function hasSelectedRefsWrittenToLiveHandoff(
  summary: ApprovedHandoffContextUpdateRecordSummary,
): boolean {
  return (
    summary.no_side_effects_summary.selected_refs_written_to_live_handoff ||
    summary.authority_summary.can_write_selected_refs_to_live_handoff
  );
}

function hasHandoffSent(
  summary: ApprovedHandoffContextUpdateRecordSummary,
): boolean {
  return (
    summary.no_side_effects_summary.handoff_sent ||
    summary.authority_summary.can_send_handoff
  );
}

function hasProviderGithubCodexCall(
  summary: ApprovedHandoffContextUpdateRecordSummary,
): boolean {
  return (
    summary.no_side_effects_summary.provider_called ||
    summary.no_side_effects_summary.github_called ||
    summary.no_side_effects_summary.codex_executed ||
    summary.authority_summary.can_call_provider_openai ||
    summary.authority_summary.can_call_github ||
    summary.authority_summary.can_execute_codex
  );
}

function isProblematicRecordAuthorityField(field: string): boolean {
  return ![
    "can_write_db",
    "can_write_handoff_context_update_record",
    "can_write_operator_approved_handoff_context_update_record",
  ].includes(field);
}

function compareRecordSummariesNewestFirst(
  left: ApprovedHandoffContextUpdateRecordSummary,
  right: ApprovedHandoffContextUpdateRecordSummary,
): number {
  const leftTime = Date.parse(left.created_at);
  const rightTime = Date.parse(right.created_at);
  const leftValid = Number.isFinite(leftTime);
  const rightValid = Number.isFinite(rightTime);
  if (leftValid && rightValid && leftTime !== rightTime) {
    return rightTime - leftTime;
  }
  if (leftValid !== rightValid) return leftValid ? -1 : 1;
  return right.record_id.localeCompare(left.record_id);
}

function candidateArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function stringArrayFromPath(
  record: Record<string, unknown> | null,
  field: string,
): string[] {
  const value = record?.[field];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function getRecord(
  record: Record<string, unknown> | null,
  field: string,
): Record<string, unknown> | null {
  const value = record?.[field];
  return isRecord(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uniqueSortedStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}
