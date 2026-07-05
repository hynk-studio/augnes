import type { CodexContextReuseRef } from "@/types/codex-result-feedback-draft";
import type {
  DogfoodReuseCarryForwardCandidates,
  DogfoodReuseExpectedObservedSummary,
  DogfoodReuseProposedClassifications,
} from "@/types/dogfood-reuse-record-proposal";
import {
  DOGFOOD_REUSE_OPERATOR_DECISION_PREVIEW_VERSION,
  type DogfoodReuseOperatorDecisionPreview,
} from "@/types/dogfood-reuse-operator-decision-preview";
import {
  HANDOFF_REUSE_OUTCOME_LEDGER_SCOPE,
  HANDOFF_REUSE_OUTCOME_LEDGER_STORE_VERSION,
  HANDOFF_REUSE_OUTCOME_LEDGER_WRITE_RECEIPT_VERSION,
  type HandoffReuseOutcomeLedgerChecklistConfirmations,
  type HandoffReuseOutcomeLedgerRecord,
  type HandoffReuseOutcomeLedgerStoreResult,
  type HandoffReuseOutcomeLedgerWriteInput,
  type HandoffReuseOutcomeLedgerWriteReceipt,
  type HandoffReuseOutcomeLedgerWriteStatus,
} from "@/types/handoff-reuse-outcome-ledger";
import {
  REUSE_OUTCOME_BRIDGE_OPERATOR_DECISION_PREVIEW_VERSION,
  type ReuseOutcomeBridgeCandidateSummary,
  type ReuseOutcomeBridgeOperatorDecisionPreview,
} from "@/types/reuse-outcome-bridge-decision";
import {
  REUSE_OUTCOME_BRIDGE_LEDGER_WRITE_ADAPTER_VERSION,
  type ReuseOutcomeBridgeLedgerNoSideEffects,
  type ReuseOutcomeBridgeLedgerStoreResult,
  type ReuseOutcomeBridgeLedgerValidationResult,
  type ReuseOutcomeBridgeLedgerWriteInput,
} from "@/types/reuse-outcome-bridge-ledger-write";
import {
  type HandoffReuseOutcomeLedgerDbLike,
  type HandoffReuseOutcomeLedgerListFilters,
  listHandoffReuseOutcomeLedgerRecordsV01,
  readHandoffReuseOutcomeLedgerRecordByIdempotencyKeyV01,
  readHandoffReuseOutcomeLedgerRecordV01,
  writeHandoffReuseOutcomeLedgerRecordV01,
} from "@/lib/dogfooding/handoff-reuse-outcome-ledger";
import {
  isCandidateIngressPublicSafeRefV01,
  sanitizeCandidateIngressSummaryV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";

const allowedRequestedSideEffects = new Set([
  "reuse_outcome_ledger_written",
  "handoff_reuse_outcome_ledger_record_written",
  "handoff_reuse_outcome_ledger_receipt_written",
  "can_write_handoff_reuse_ledger",
  "can_write_dogfood_ledger",
]);

const forbiddenRequestedSideEffectPatterns = [
  /dogfood.*metric|metric.*write|metric.*update/i,
  /work.*episode/i,
  /expected.*observed.*delta/i,
  /memory|perspective|current.*working.*perspective|cwp/i,
  /next.*work.*bias|continuity.*relay/i,
  /handoff.*context|selected.*refs.*live|handoff.*send/i,
  /provider|openai|github|codex/i,
  /\bpr\b.*create|\bpr\b.*merge/i,
  /autonomous|graph|vector|rag|crawler|browser.*observer/i,
];

const rawOrPrivateMarkers = [
  "raw_text",
  "raw_report",
  "raw_excerpt",
  "password",
  "private",
  "token",
  "credential",
  "file://",
  "/users/",
  "/home/",
  "sk-",
  "ghp_",
];

const sampleDefaultMarkers = [
  "sample",
  "fixture",
  "default workbench",
  "default_workbench",
  "workbench:default",
  "workbench:",
];

const allowedReuseCandidateBuckets = new Set([
  "helpful_refs",
  "stale_refs",
  "missing_refs",
  "noisy_refs",
  "misleading_refs",
  "unknown_refs",
  "skipped_or_unverified_check_signals",
  "not_done_signals",
  "expected_observed_mismatch_signals",
  "requirement_progress_gaps",
  "context_feedback_signals",
  "carry_forward_refs",
]);

const allowedReuseCandidateKinds = new Set([
  "helpful_ref",
  "stale_ref",
  "missing_ref",
  "noisy_ref",
  "misleading_ref",
  "unknown_ref",
  "skipped_or_unverified_check_signal",
  "not_done_signal",
  "expected_observed_mismatch_signal",
  "requirement_progress_gap",
  "context_feedback_signal",
  "carry_forward_ref",
]);

export function validateReuseOutcomeBridgeLedgerWriteInputV01(
  input: unknown,
): ReuseOutcomeBridgeLedgerValidationResult {
  const reasons: string[] = [];
  if (!isRecord(input)) {
    return validationResult({
      refusal_reasons: ["input_must_be_object"],
      input: null,
      idempotency_key: null,
    });
  }

  const idempotencyKey = stringValue(input.idempotency_key);
  if (!idempotencyKey || !safeRef(idempotencyKey)) {
    reasons.push("idempotency_key_missing_or_invalid");
  }
  const notes = input.notes;
  if (
    notes !== undefined &&
    (!Array.isArray(notes) ||
      notes.some((note) => typeof note !== "string" || !safeText(note)))
  ) {
    reasons.push("notes_invalid");
  }

  const decisionPreview = isRecord(input.decision_preview)
    ? (input.decision_preview as unknown as ReuseOutcomeBridgeOperatorDecisionPreview)
    : null;
  if (!decisionPreview) {
    reasons.push("decision_preview_missing");
  } else {
    reasons.push(...validateDecisionPreview(decisionPreview));
  }

  const approval = isRecord(input.operator_approval)
    ? input.operator_approval
    : null;
  if (!approval) {
    reasons.push("operator_approval_missing");
  } else {
    reasons.push(...validateApproval(approval, decisionPreview, idempotencyKey));
  }

  if (input.requested_side_effects !== undefined) {
    reasons.push(...validateRequestedSideEffects(input.requested_side_effects));
  }
  if (containsMarker(input, rawOrPrivateMarkers)) {
    reasons.push("raw_or_private_marker_material_refused");
  }
  if (containsMarker(input, sampleDefaultMarkers)) {
    reasons.push("sample_fixture_default_or_workbench_material_refused");
  }

  return validationResult({
    refusal_reasons: uniqueCandidateIngressStringsV01(reasons),
    input:
      reasons.length === 0
        ? (input as unknown as ReuseOutcomeBridgeLedgerWriteInput)
        : null,
    idempotency_key: idempotencyKey,
  });
}

export function writeReuseOutcomeBridgeLedgerRecordV01(
  input: unknown,
  { db }: { db: HandoffReuseOutcomeLedgerDbLike },
): ReuseOutcomeBridgeLedgerStoreResult {
  const validation = validateReuseOutcomeBridgeLedgerWriteInputV01(input);
  if (!validation.ok || !validation.input) {
    return storeResult({
      status: "refused",
      record: null,
      records: [],
      receipt: createRefusedReceipt(validation),
      ledgerResult: null,
      refusalReasons: validation.refusal_reasons,
    });
  }

  const delegatedInput = toHandoffReuseOutcomeLedgerWriteInput(validation.input);
  const ledgerResult = writeHandoffReuseOutcomeLedgerRecordV01(
    delegatedInput,
    db,
  );
  return storeResult({
    status: ledgerResult.status,
    record: ledgerResult.record,
    records: ledgerResult.records,
    receipt: ledgerResult.receipt,
    ledgerResult,
    refusalReasons: ledgerResult.receipt.refusal_reasons,
  });
}

export function refuseReuseOutcomeBridgeLedgerWriteV01(
  input: unknown,
  extraReasons: string[] = [],
): ReuseOutcomeBridgeLedgerStoreResult {
  const validation = validateReuseOutcomeBridgeLedgerWriteInputV01(input);
  const refusedValidation: ReuseOutcomeBridgeLedgerValidationResult = {
    ...validation,
    ok: false,
    refusal_reasons: uniqueCandidateIngressStringsV01([
      ...validation.refusal_reasons,
      ...extraReasons,
    ]),
  };
  return storeResult({
    status: "refused",
    record: null,
    records: [],
    receipt: createRefusedReceipt(refusedValidation),
    ledgerResult: null,
    refusalReasons: refusedValidation.refusal_reasons,
  });
}

export function readReuseOutcomeBridgeLedgerRecordByIdV01(
  recordId: string,
  { db }: { db: HandoffReuseOutcomeLedgerDbLike },
): ReuseOutcomeBridgeLedgerStoreResult {
  return wrapLedgerResult(readHandoffReuseOutcomeLedgerRecordV01(recordId, db));
}

export function readReuseOutcomeBridgeLedgerRecordByIdempotencyKeyV01(
  idempotencyKey: string,
  { db }: { db: HandoffReuseOutcomeLedgerDbLike },
): ReuseOutcomeBridgeLedgerStoreResult {
  return wrapLedgerResult(
    readHandoffReuseOutcomeLedgerRecordByIdempotencyKeyV01(idempotencyKey, db),
  );
}

export function listReuseOutcomeBridgeLedgerRecordsV01(
  filters: HandoffReuseOutcomeLedgerListFilters & {
    work_ref?: string;
    handoff_ref?: string;
  },
  { db }: { db: HandoffReuseOutcomeLedgerDbLike },
): ReuseOutcomeBridgeLedgerStoreResult {
  const result = listHandoffReuseOutcomeLedgerRecordsV01(filters, db);
  if (!result.ok) return wrapLedgerResult(result);
  const records = result.records.filter((record) => {
    if (filters.work_ref && record.feedback_draft_refs.feedback_draft_ref !== filters.work_ref) {
      return false;
    }
    if (
      filters.handoff_ref &&
      record.context_relay_rationale_ref !== filters.handoff_ref
    ) {
      return false;
    }
    return true;
  });
  return storeResult({
    status: "listed",
    record: records[0] ?? null,
    records,
    receipt: result.receipt,
    ledgerResult: { ...result, record: records[0] ?? null, records },
    refusalReasons: [],
  });
}

export function createReuseOutcomeBridgeLedgerNoSideEffectsV01({
  wrote,
}: {
  wrote: boolean;
}): ReuseOutcomeBridgeLedgerNoSideEffects {
  return {
    reuse_outcome_ledger_written: wrote,
    handoff_reuse_outcome_ledger_record_written: wrote,
    handoff_reuse_outcome_ledger_receipt_written: wrote,
    dogfood_metrics_written: false,
    work_episode_written: false,
    expected_observed_delta_written: false,
    memory_mutated: false,
    current_working_perspective_updated: false,
    perspective_unit_written: false,
    next_work_bias_written: false,
    continuity_relay_written: false,
    handoff_context_mutated: false,
    selected_refs_written_to_live_handoff: false,
    handoff_sent: false,
    provider_called: false,
    github_called: false,
    codex_executed: false,
    pr_created: false,
    pr_merged: false,
    autonomous_action_run: false,
    graph_or_vector_store_created: false,
    rag_stack_created: false,
    crawler_or_browser_observer_created: false,
  };
}

function validateDecisionPreview(
  preview: ReuseOutcomeBridgeOperatorDecisionPreview,
): string[] {
  const reasons: string[] = [];
  if (
    preview.preview_version !==
    REUSE_OUTCOME_BRIDGE_OPERATOR_DECISION_PREVIEW_VERSION
  ) {
    reasons.push("decision_preview_version_invalid");
  }
  if (
    preview.decision_preview_status !==
    "ready_for_future_reuse_ledger_write"
  ) {
    reasons.push("decision_preview_not_ready_for_future_reuse_ledger_write");
  }
  if (
    preview.recommended_operator_decision !==
    "approve_for_reuse_outcome_ledger_write"
  ) {
    reasons.push("decision_preview_recommended_decision_not_approve");
  }
  const writeReadiness = preview.write_readiness;
  if (
    !writeReadiness ||
    writeReadiness.write_ready !== true ||
    writeReadiness.current_blockers.length > 0 ||
    writeReadiness.current_missing_evidence.length > 0 ||
    writeReadiness.current_refusal_reasons.length > 0 ||
    writeReadiness.current_insufficient_data.length > 0
  ) {
    reasons.push("decision_preview_write_readiness_invalid");
  }
  if (
    preview.blocking_reasons.length > 0 ||
    preview.missing_evidence.length > 0 ||
    preview.refusal_reasons.length > 0
  ) {
    reasons.push("decision_preview_blockers_missing_or_refusals_present");
  }
  if (!validAuthorityBoundary(preview.authority_boundary)) {
    reasons.push("decision_preview_authority_boundary_invalid");
  }
  if (
    !Array.isArray(preview.source_refs) ||
    preview.source_refs.some((ref) => typeof ref !== "string" || !safeRef(ref))
  ) {
    reasons.push("decision_preview_source_refs_unsafe");
  }

  const material = preview.would_write_reuse_ledger_record_preview;
  const selectedRefs = material.selected_reuse_candidate_refs;
  const selectableRefs = material.selectable_reuse_candidate_refs;
  if (selectedRefs.length === 0) {
    reasons.push("selected_reuse_candidate_refs_missing");
  }
  if (selectedRefs.some((ref) => !safeRef(ref))) {
    reasons.push("selected_reuse_candidate_refs_unsafe");
  }
  if (selectedRefs.some((ref) => !selectableRefs.includes(ref))) {
    reasons.push("selected_reuse_candidate_refs_not_subset_of_selectable_refs");
  }
  if (
    material.selected_reuse_candidate_summaries.some(
      (summary) => !selectedRefs.includes(summary.candidate_ref),
    )
  ) {
    reasons.push("selected_reuse_candidate_summaries_not_selected");
  }
  for (const field of [
    "source_refs",
    "evidence_refs",
    "delta_refs",
    "selected_reuse_candidate_refs",
    "selectable_reuse_candidate_refs",
  ] as const) {
    if (material[field].some((ref) => !safeRef(ref))) {
      reasons.push(`${field}_unsafe`);
    }
  }
  if (material.source_refs.length === 0) reasons.push("source_refs_missing");
  if (material.evidence_refs.length === 0) reasons.push("evidence_refs_missing");
  for (const [field, value] of Object.entries({
    result_ref: material.result_ref,
    result_report_fingerprint: material.result_report_fingerprint,
    work_ref: material.work_ref,
    handoff_ref: material.handoff_ref,
    feedback_draft_ref: material.feedback_draft_ref,
    context_relay_rationale_ref: material.context_relay_rationale_ref,
    continuity_relay_ref: material.continuity_relay_ref,
    requested_operator_ref: material.requested_operator_ref,
    requested_idempotency_key: material.requested_idempotency_key,
    review_confirmation_ref: material.review_confirmation_ref,
  })) {
    if (!value || !safeRef(value)) reasons.push(`${field}_missing_or_unsafe`);
  }
  for (const summary of material.all_reuse_candidate_summaries) {
    if (!allowedReuseCandidateBuckets.has(summary.bucket)) {
      reasons.push("reuse_candidate_summary_bucket_invalid");
    }
    if (!allowedReuseCandidateKinds.has(summary.candidate_kind)) {
      reasons.push("reuse_candidate_summary_kind_invalid");
    }
    if (!validCandidateSummary(summary)) {
      reasons.push("reuse_candidate_summary_invalid");
    }
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function validateApproval(
  approval: Record<string, unknown>,
  decisionPreview: ReuseOutcomeBridgeOperatorDecisionPreview | null,
  idempotencyKey: string | null,
): string[] {
  const reasons: string[] = [];
  if (approval.operator_decision !== "approve_for_reuse_outcome_ledger_write") {
    reasons.push("operator_decision_invalid");
  }
  for (const field of ["approved_by", "operator_ref", "approved_at", "approval_statement"] as const) {
    const value = stringValue(approval[field]);
    if (!value || !safeText(value)) reasons.push(`${field}_missing_or_invalid`);
  }
  const checklist = Array.isArray(approval.checklist_confirmations)
    ? approval.checklist_confirmations.filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  const requirements = decisionPreview?.approval_requirements ?? [];
  for (const requirement of requirements) {
    if (!checklist.includes(requirement)) {
      reasons.push(`checklist_confirmation_missing:${requirement}`);
    }
  }
  if (checklist.length === 0 || requirements.length === 0) {
    reasons.push("checklist_confirmations_missing");
  }
  const material = decisionPreview?.would_write_reuse_ledger_record_preview;
  if (
    material?.requested_operator_ref &&
    approval.operator_ref !== material.requested_operator_ref
  ) {
    reasons.push("operator_ref_mismatch_with_decision_preview");
  }
  if (
    material?.requested_idempotency_key &&
    idempotencyKey !== material.requested_idempotency_key
  ) {
    reasons.push("idempotency_key_mismatch_with_decision_preview");
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function toHandoffReuseOutcomeLedgerWriteInput(
  input: ReuseOutcomeBridgeLedgerWriteInput,
): HandoffReuseOutcomeLedgerWriteInput {
  const preview = toDogfoodReuseOperatorDecisionPreview(input.decision_preview);
  return {
    decision_preview: preview,
    operator_decision: "approve_for_future_write",
    idempotency_key: input.idempotency_key,
    approved_by: input.operator_approval.approved_by,
    operator_ref: input.operator_approval.operator_ref,
    approved_at: input.operator_approval.approved_at,
    checklist_confirmations: buildLedgerChecklistConfirmations(),
    review_note: [
      input.operator_approval.approval_statement,
      ...(input.notes ?? []),
    ]
      .filter(Boolean)
      .join("; "),
  };
}

function toDogfoodReuseOperatorDecisionPreview(
  bridgeDecision: ReuseOutcomeBridgeOperatorDecisionPreview,
): DogfoodReuseOperatorDecisionPreview {
  const material = bridgeDecision.would_write_reuse_ledger_record_preview;
  const selected = material.selected_reuse_candidate_summaries;
  const classifications = selectedClassifications(selected, material.evidence_refs);
  const expectedObservedSummary = expectedObservedSummaryFromDecision(
    bridgeDecision,
  );
  return {
    runtime: "augnes",
    preview_version: DOGFOOD_REUSE_OPERATOR_DECISION_PREVIEW_VERSION,
    scope: bridgeDecision.scope,
    as_of: bridgeDecision.as_of,
    source_refs: uniqueCandidateIngressStringsV01([
      REUSE_OUTCOME_BRIDGE_LEDGER_WRITE_ADAPTER_VERSION,
      ...bridgeDecision.source_refs,
      ...material.source_refs,
      ...material.delta_refs,
    ]),
    proposal_refs: {
      proposal_ref: `reuse-outcome-bridge:${bridgeDecision.preview_version}`,
      proposal_version: bridgeDecision.preview_version,
      proposal_status: "proposal_ready_for_operator_review",
      feedback_draft_ref: material.work_ref,
      result_report_ref: material.result_ref,
      result_report_fingerprint: material.result_report_fingerprint,
      context_relay_rationale_ref: material.handoff_ref,
      continuity_relay_ref: material.continuity_relay_ref,
      source_refs: material.source_refs,
    },
    decision_preview_status: "ready_for_operator_decision",
    recommended_operator_decision: "approve_for_future_write",
    available_operator_decisions: [
      "approve_for_future_write",
      "defer",
      "reject",
      "keep_candidate",
      "request_more_evidence",
    ],
    write_readiness: {
      write_ready: true,
      readiness_label:
        "bridge adapter validated for existing HandoffReuseOutcomeLedger write",
      requires_actual_result_report: true,
      requires_explicit_context_feedback: true,
      requires_operator_confirmation: true,
      requires_no_blockers: true,
      requires_evidence_backing: true,
      requires_skipped_checks_review:
        material.proposed_handoff_quality_signals
          .skipped_or_unverified_checks.length > 0,
      current_blockers: [],
      current_missing_evidence: [],
      confidence: "medium",
    },
    approval_requirements: [
      "actual_result_report_confirmed",
      "result_matches_intended_codex_run",
      "changed_files_and_checks_confirmed",
      "skipped_checks_reviewed_not_counted_as_success",
      "reuse_classifications_evidence_backed",
      "unknown_refs_remain_unknown",
      "carry_forward_candidates_are_candidate_only",
      "no_durable_memory_or_perspective_apply",
      "no_metric_update_expected",
    ],
    blocking_reasons: [],
    missing_evidence: [],
    evidence_summary: {
      has_proposal: true,
      proposal_status: "proposal_ready_for_operator_review",
      has_feedback_draft: true,
      has_result_report: true,
      has_context_rationale: true,
      has_expected_return_signal: true,
      has_observed_return_signal: true,
      has_explicit_context_feedback: true,
      has_skipped_or_unverified_checks:
        material.proposed_handoff_quality_signals
          .skipped_or_unverified_checks.length > 0,
      has_insufficient_data: false,
      has_blocking_reasons: false,
      has_missing_evidence: false,
      evidence_refs: material.evidence_refs,
      missing_evidence: [],
    },
    would_write_preview: {
      proposed_record_kind: "handoff_reuse_outcome_candidate",
      proposed_dogfood_signal_summary: {
        requirement_progress_observed:
          material.proposed_handoff_quality_signals.requirement_progress_gaps,
        checks_observed: [],
        skipped_or_unverified_checks:
          material.proposed_handoff_quality_signals
            .skipped_or_unverified_checks,
        not_done_items: material.proposed_handoff_quality_signals.not_done_items,
        mismatch_summary:
          material.proposed_expected_observed_summary.mismatch_summary,
        context_feedback_signal_present:
          material.proposed_handoff_quality_signals.context_feedback_signals
            .length > 0,
        review_burden_hint: "bridge-derived reuse outcome review",
        handoff_quality_hint: "operator-reviewed bridge material",
      },
      proposed_reuse_bucket_counts: {
        helpful_refs: classifications.helpful_refs.length,
        stale_refs: classifications.stale_refs.length,
        missing_refs: classifications.missing_refs.length,
        noisy_refs: classifications.noisy_refs.length,
        misleading_refs: classifications.misleading_refs.length,
        unknown_refs: classifications.unknown_refs.length,
      },
      proposed_reuse_classifications: classifications,
      proposed_expected_observed_summary: expectedObservedSummary,
      evidence_refs: material.evidence_refs,
      carry_forward_candidates: material.carry_forward_candidates,
      confidence: "medium",
    },
    would_not_write: bridgeDecision.would_not_write,
    candidate_carry_forward: material.carry_forward_candidates,
    review_checklist: bridgeDecision.review_checklist,
    non_goals: bridgeDecision.non_goals,
    authority_boundary: {
      read_only: true,
      candidate_material_only: true,
      source_of_truth: false,
      derived_read_model: true,
      can_persist_decision: false,
      can_write_db: false,
      can_write_dogfood_ledger: false,
      can_update_metrics: false,
      can_mutate_memory: false,
      can_promote_memory: false,
      can_apply_project_perspective: false,
      can_create_promotion_decision: false,
      can_create_formation_receipt: false,
      can_call_provider_openai: false,
      can_call_github: false,
      can_execute_codex: false,
      can_send_handoff: false,
      can_create_pr: false,
      can_merge_pr: false,
      can_run_autonomous_action: false,
      can_create_graph_or_vector_store: false,
      can_create_rag_stack: false,
      can_crawl_or_observe_browser: false,
      notes: [
        "Compatibility preview generated by the reuse outcome bridge ledger adapter after validating bridge operator decision material.",
      ],
    },
    source_status: {
      proposal: "supplied",
      feedback_draft: "supplied",
      codex_result_report: "supplied",
      handoff_context_rationale: "supplied",
      codex_result_report_status: "bridge_delta_record_supplied",
    },
    fallback_reason: null,
    notes: [
      "Compatibility view for the existing HandoffReuseOutcomeLedger writer.",
      "Bridge validation has already refused sample/default/raw material and forbidden side effects before this adapter delegates.",
    ],
  };
}

function selectedClassifications(
  summaries: ReuseOutcomeBridgeCandidateSummary[],
  evidenceRefs: string[],
): DogfoodReuseProposedClassifications {
  const byBucket = (bucket: ReuseOutcomeBridgeCandidateSummary["bucket"]) =>
    summaries
      .filter((summary) => summary.bucket === bucket)
      .map((summary) => toContextReuseRef(summary, evidenceRefs));
  return {
    helpful_refs: byBucket("helpful_refs"),
    stale_refs: byBucket("stale_refs"),
    missing_refs: byBucket("missing_refs"),
    noisy_refs: byBucket("noisy_refs"),
    misleading_refs: byBucket("misleading_refs"),
    unknown_refs: byBucket("unknown_refs"),
    corrections_needed: summaries
      .filter((summary) =>
        [
          "skipped_or_unverified_check_signals",
          "not_done_signals",
          "expected_observed_mismatch_signals",
          "requirement_progress_gaps",
        ].includes(summary.bucket),
      )
      .map((summary) => summary.summary),
    refs_to_preserve_next_time: summaries
      .filter((summary) => summary.bucket === "helpful_refs")
      .map((summary) => summary.summary),
    refs_to_warn_next_time: summaries
      .filter((summary) =>
        ["stale_refs", "missing_refs", "unknown_refs"].includes(summary.bucket),
      )
      .map((summary) => summary.summary),
    refs_to_drop_or_deprioritize: summaries
      .filter((summary) =>
        ["noisy_refs", "misleading_refs"].includes(summary.bucket),
      )
      .map((summary) => summary.summary),
    confidence: "medium",
    review_needed: true,
  };
}

function toContextReuseRef(
  summary: ReuseOutcomeBridgeCandidateSummary,
  evidenceRefs: string[],
): CodexContextReuseRef {
  return {
    ref_id: summary.candidate_ref,
    label: summary.label,
    reason_category: summary.bucket,
    evidence_refs: summary.evidence_refs.length > 0 ? summary.evidence_refs : evidenceRefs,
    summary: summary.summary,
  };
}

function expectedObservedSummaryFromDecision(
  preview: ReuseOutcomeBridgeOperatorDecisionPreview,
): DogfoodReuseExpectedObservedSummary {
  const material = preview.would_write_reuse_ledger_record_preview;
  return {
    matched_expectation_count:
      material.proposed_expected_observed_summary.matched_expectation_count,
    missing_expectation_count:
      material.proposed_expected_observed_summary.missing_expectation_count,
    unexpected_observation_count:
      material.proposed_expected_observed_summary.unexpected_observation_count,
    skipped_or_unverified_check_count:
      material.proposed_expected_observed_summary
        .skipped_or_unverified_check_count,
    changed_files_observed: [],
    checks_observed: [],
    requirement_progress_observed:
      material.proposed_handoff_quality_signals.requirement_progress_gaps,
    missing_expectations:
      material.proposed_handoff_quality_signals.expected_observed_mismatches,
    unexpected_observations:
      material.proposed_reuse_classifications.noisy_refs,
    not_done_items: material.proposed_handoff_quality_signals.not_done_items,
    mismatch_summary:
      material.proposed_expected_observed_summary.mismatch_summary,
    confidence: material.proposed_expected_observed_summary.confidence,
  };
}

function buildLedgerChecklistConfirmations(): HandoffReuseOutcomeLedgerChecklistConfirmations {
  return {
    actual_result_report_confirmed: true,
    result_matches_intended_codex_run: true,
    changed_files_and_checks_confirmed: true,
    skipped_checks_reviewed_not_counted_as_success: true,
    reuse_classifications_evidence_backed: true,
    unknown_refs_remain_unknown: true,
    carry_forward_candidates_are_candidate_only: true,
    no_durable_memory_or_perspective_apply: true,
    no_metric_update_expected: true,
  };
}

function wrapLedgerResult(
  result: HandoffReuseOutcomeLedgerStoreResult,
): ReuseOutcomeBridgeLedgerStoreResult {
  return storeResult({
    status: result.status,
    record: result.record,
    records: result.records,
    receipt: result.receipt,
    ledgerResult: result,
    refusalReasons: result.receipt.refusal_reasons,
  });
}

function storeResult({
  status,
  record,
  records,
  receipt,
  ledgerResult,
  refusalReasons,
}: {
  status: HandoffReuseOutcomeLedgerWriteStatus;
  record: HandoffReuseOutcomeLedgerRecord | null;
  records: HandoffReuseOutcomeLedgerRecord[];
  receipt: HandoffReuseOutcomeLedgerWriteReceipt;
  ledgerResult: HandoffReuseOutcomeLedgerStoreResult | null;
  refusalReasons: string[];
}): ReuseOutcomeBridgeLedgerStoreResult {
  const ok = ["written", "idempotent_existing", "read", "listed"].includes(
    status,
  );
  return {
    adapter_version: REUSE_OUTCOME_BRIDGE_LEDGER_WRITE_ADAPTER_VERSION,
    status,
    ok,
    record,
    records,
    receipt,
    ledger_store_result: ledgerResult,
    error_code: ok ? null : status,
    refusal_reasons: refusalReasons,
    no_side_effects: createReuseOutcomeBridgeLedgerNoSideEffectsV01({
      wrote: status === "written",
    }),
  };
}

function createRefusedReceipt(
  validation: ReuseOutcomeBridgeLedgerValidationResult,
): HandoffReuseOutcomeLedgerWriteReceipt {
  return {
    receipt_version: HANDOFF_REUSE_OUTCOME_LEDGER_WRITE_RECEIPT_VERSION,
    record_id: null,
    idempotency_key: validation.idempotency_key,
    wrote: false,
    idempotent_replay: false,
    created_at: new Date(0).toISOString(),
    refused: true,
    refusal_reasons: validation.refusal_reasons,
    validation_hash: null,
    record_fingerprint: null,
    store_ref: null,
    source_refs: [],
    no_metric_update: true,
    no_memory_mutation: true,
    no_perspective_apply: true,
    no_provider_call: true,
    no_github_call: true,
    no_codex_execution: true,
    no_handoff_send: true,
  };
}

function validationResult({
  refusal_reasons,
  input,
  idempotency_key,
}: Omit<ReuseOutcomeBridgeLedgerValidationResult, "ok">): ReuseOutcomeBridgeLedgerValidationResult {
  return {
    ok: refusal_reasons.length === 0,
    refusal_reasons,
    input,
    idempotency_key,
  };
}

function validateRequestedSideEffects(value: unknown): string[] {
  if (!isRecord(value)) return ["requested_side_effects_invalid"];
  const reasons: string[] = [];
  for (const [key, entry] of Object.entries(value)) {
    if (allowedRequestedSideEffects.has(key)) continue;
    if (isTruthy(entry) || forbiddenRequestedSideEffectPatterns.some((pattern) => pattern.test(key))) {
      reasons.push("requested_side_effect_not_allowed");
    }
  }
  return uniqueCandidateIngressStringsV01(reasons);
}

function validAuthorityBoundary(
  authority: ReuseOutcomeBridgeOperatorDecisionPreview["authority_boundary"],
): boolean {
  return (
    authority.read_only === true &&
    authority.advisory_only === true &&
    authority.source_of_truth === false &&
    authority.can_persist_decision === false &&
    authority.can_write_db === false &&
    authority.can_write_handoff_reuse_ledger === false &&
    authority.can_write_dogfood_ledger === false &&
    authority.can_write_dogfood_metrics === false &&
    authority.can_write_expected_observed_delta === false &&
    authority.can_write_work_episode === false &&
    authority.can_write_memory === false &&
    authority.can_update_current_working_perspective === false &&
    authority.can_write_perspective_unit === false &&
    authority.can_write_next_work_bias === false &&
    authority.can_update_continuity_relay === false &&
    authority.can_mutate_handoff_context === false &&
    authority.can_apply_handoff_context === false &&
    authority.can_send_handoff === false &&
    authority.can_call_provider_openai === false &&
    authority.can_call_github === false &&
    authority.can_execute_codex === false &&
    authority.can_create_pr === false &&
    authority.can_merge_pr === false &&
    authority.can_run_autonomous_action === false &&
    authority.can_create_graph_or_vector_store === false &&
    authority.can_create_rag_stack === false &&
    authority.can_crawl_or_observe_browser === false
  );
}

function validCandidateSummary(
  value: ReuseOutcomeBridgeCandidateSummary,
): boolean {
  return (
    safeRef(value.candidate_ref) &&
    allowedReuseCandidateBuckets.has(value.bucket) &&
    allowedReuseCandidateKinds.has(value.candidate_kind) &&
    safeText(value.bucket) &&
    safeText(value.candidate_kind) &&
    safeText(value.label) &&
    safeText(value.summary) &&
    value.evidence_refs.every(safeRef)
  );
}

function safeRef(value: string): boolean {
  return isCandidateIngressPublicSafeRefV01(value);
}

function safeText(value: unknown): value is string {
  return (
    typeof value === "string" &&
    sanitizeCandidateIngressSummaryV01(value).length > 0 &&
    !containsMarker(value, rawOrPrivateMarkers)
  );
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function containsMarker(value: unknown, markers: readonly string[]): boolean {
  return JSON.stringify(value)
    .toLowerCase()
    .split(/\s+/)
    .some((part) => markers.some((marker) => part.includes(marker)));
}

function isTruthy(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "number") return value > 0;
  if (typeof value !== "string") return false;
  return /^(true|yes|requested|enabled|allow|allowed|write|update|mutate|apply|create|call|execute|send|run)$/i.test(
    value.trim(),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
