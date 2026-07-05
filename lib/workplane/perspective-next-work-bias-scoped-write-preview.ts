import { createHash } from "node:crypto";

import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  PERSPECTIVE_NEXT_WORK_BIAS_RECORD_VERSION,
  PERSPECTIVE_NEXT_WORK_BIAS_RECEIPT_VERSION,
  PERSPECTIVE_NEXT_WORK_BIAS_SCOPE,
  PERSPECTIVE_NEXT_WORK_BIAS_STORE_VERSION,
} from "@/types/perspective-next-work-bias-write";
import {
  PERSPECTIVE_NEXT_WORK_BIAS_SCOPED_WRITE_PREVIEW_VERSION,
  type PerspectiveNextWorkBiasBucket,
  type PerspectiveNextWorkBiasDirective,
  type PerspectiveNextWorkBiasEntry,
  type PerspectiveNextWorkBiasScopedWriteAuthorityBoundary,
  type PerspectiveNextWorkBiasScopedWritePreview,
  type PerspectiveNextWorkBiasScopedWritePreviewInput,
  type PerspectiveNextWorkBiasScopedWritePreviewStatus,
  type PerspectiveNextWorkBiasScopedWriteReadiness,
  type PerspectiveNextWorkBiasScopedWriteRecommendedNextAction,
} from "@/types/perspective-next-work-bias-scoped-write-preview";
import { PERSPECTIVE_RELAY_UPDATE_CANDIDATE_BRIDGE_PREVIEW_VERSION } from "@/types/perspective-relay-update-candidate-bridge-preview";
import { PERSPECTIVE_RELAY_UPDATE_DECISION_RECORD_REVIEW_VERSION } from "@/types/perspective-relay-update-decision-record-review";
import {
  type PerspectiveRelayUpdateDecisionRecord,
} from "@/types/perspective-relay-update-decision-write";
import { PERSPECTIVE_RELAY_UPDATE_WRITE_CONTRACT_PREVIEW_VERSION } from "@/types/perspective-relay-update-write-contract-preview";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

const bucketToDirective = new Map<
  PerspectiveNextWorkBiasBucket,
  PerspectiveNextWorkBiasDirective
>([
  ["next_work_bias_preserve_next_time", "preserve_next_time"],
  ["next_work_bias_warn_next_time", "warn_next_time"],
  ["next_work_bias_drop_or_deprioritize", "drop_or_deprioritize"],
  ["next_work_bias_verification_bias", "verification_bias"],
  ["next_work_bias_context_diet_bias", "context_diet_bias"],
  ["next_work_bias_handoff_quality_bias", "handoff_quality_bias"],
]);

const validBuckets = new Set(bucketToDirective.keys());

export function buildPerspectiveNextWorkBiasScopedWritePreviewV01({
  perspective_relay_update_write_contract_preview,
  perspective_relay_update_decision_record_review,
  perspective_relay_update_candidate_bridge_preview,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
  scope,
  as_of,
  source_refs,
}: PerspectiveNextWorkBiasScopedWritePreviewInput = {}): PerspectiveNextWorkBiasScopedWritePreview {
  const writeContract = isWriteContractPreview(
    perspective_relay_update_write_contract_preview,
  )
    ? perspective_relay_update_write_contract_preview
    : null;
  const wrongContractVersion =
    isRecord(perspective_relay_update_write_contract_preview) &&
    perspective_relay_update_write_contract_preview.preview_version !==
      PERSPECTIVE_RELAY_UPDATE_WRITE_CONTRACT_PREVIEW_VERSION;
  const decisionReview = isDecisionRecordReview(
    perspective_relay_update_decision_record_review,
  )
    ? perspective_relay_update_decision_record_review
    : null;
  const bridgePreview = isRecord(
    perspective_relay_update_candidate_bridge_preview,
  ) &&
    perspective_relay_update_candidate_bridge_preview.preview_version ===
      PERSPECTIVE_RELAY_UPDATE_CANDIDATE_BRIDGE_PREVIEW_VERSION
    ? perspective_relay_update_candidate_bridge_preview
    : null;
  const validDecisionRecords = decisionReview &&
    ["records_available", "selected_record_found"].includes(
      decisionReview.review_status,
    )
    ? decisionReview.records
    : [];
  const contractSelectedRefs = safeStringArray(
    writeContract?.selected_candidate_refs_by_target?.next_work_bias,
  );
  const contractSelectableRefs = safeStringArray(
    writeContract?.proposed_future_write_contract
      ?.next_work_bias_update_contract?.selected_candidate_refs,
  );
  const nonWritablePerspectiveRefs = safeStringArray(
    writeContract?.selected_candidate_refs_by_target?.perspective_unit,
  );
  const nonWritableRelayRefs = safeStringArray(
    writeContract?.selected_candidate_refs_by_target?.continuity_relay,
  );
  const acceptedDecisionNextWorkBiasRefs = uniqueCandidateIngressStringsV01(
    validDecisionRecords.flatMap((record) =>
      safeStringArray(record.selected_next_work_bias_candidate_refs),
    ),
  );
  const selectedRefs = uniqueCandidateIngressStringsV01(contractSelectedRefs);
  const sourceRefsRaw = uniqueCandidateIngressStringsV01([
    PERSPECTIVE_NEXT_WORK_BIAS_SCOPED_WRITE_PREVIEW_VERSION,
    ...(source_refs ?? []),
    ...safeStringArray(writeContract?.source_refs),
    ...(decisionReview?.source_refs ?? []),
    ...safeStringArray(bridgePreview?.source_refs),
  ]);
  const sourceRefs = sourceRefsRaw.filter(isCandidateIngressPublicSafeRefV01);
  const evidenceRefs = uniqueCandidateIngressStringsV01([
    ...safeStringArray(writeContract?.required_evidence_refs),
    ...safeStringArray(writeContract?.evidence_summary?.evidence_refs),
    ...(decisionReview?.evidence_summary.evidence_refs ?? []),
    ...(isRecord(bridgePreview?.evidence_summary)
      ? safeStringArray(bridgePreview.evidence_summary.evidence_refs)
      : []),
  ]).filter(isCandidateIngressPublicSafeRefV01);
  const entries = buildEntries({
    records: validDecisionRecords,
    selectedRefs,
    evidenceRefs,
    sourceRefs,
  });
  const unsafeRefs = uniqueCandidateIngressStringsV01([
    ...sourceRefsRaw.filter((ref) => !isCandidateIngressPublicSafeRefV01(ref)),
    ...safeStringArray(writeContract?.required_evidence_refs).filter(
      (ref) => !isCandidateIngressPublicSafeRefV01(ref),
    ),
    ...selectedRefs.filter((ref) => !isCandidateIngressPublicSafeRefV01(ref)),
    ...contractSelectableRefs.filter(
      (ref) => !isCandidateIngressPublicSafeRefV01(ref),
    ),
    ...acceptedDecisionNextWorkBiasRefs.filter(
      (ref) => !isCandidateIngressPublicSafeRefV01(ref),
    ),
    ...(requested_operator_ref && !safeRef(requested_operator_ref)
      ? [requested_operator_ref]
      : []),
    ...(requested_idempotency_key && !safeRef(requested_idempotency_key)
      ? [requested_idempotency_key]
      : []),
    ...(review_confirmation_ref && !safeRef(review_confirmation_ref)
      ? [review_confirmation_ref]
      : []),
  ]);
  const contractReady =
    writeContract?.contract_preview_status ===
    "contract_ready_for_future_scoped_write_slice";
  const decisionReviewValid = Boolean(
    decisionReview &&
      ["records_available", "selected_record_found"].includes(
        decisionReview.review_status,
      ) &&
      decisionReview.input_summary.valid_record_count > 0 &&
      decisionReview.records.length > 0 &&
      !decisionReview.evidence_summary.has_receipt_side_effect_problem,
  );
  const blockingReasons = uniqueCandidateIngressStringsV01([
    ...(wrongContractVersion
      ? ["perspective_relay_update_write_contract_preview_version_invalid"]
      : []),
    ...(!writeContract
      ? ["perspective_relay_update_write_contract_preview_missing"]
      : []),
    ...(writeContract && !hasReadOnlyWriteContractAuthority(writeContract)
      ? ["perspective_relay_update_write_contract_authority_boundary_invalid"]
      : []),
    ...(writeContract && !contractReady
      ? ["perspective_relay_update_write_contract_not_ready"]
      : []),
    ...(decisionReview && decisionReview.review_status === "records_invalid"
      ? ["perspective_relay_update_decision_record_review_invalid"]
      : []),
    ...(decisionReview?.blocked_reasons ?? []),
    ...(writeContract?.blocking_reasons ?? []),
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...safeStringArray(writeContract?.evidence_summary?.missing_evidence),
    ...(decisionReview?.evidence_summary.missing_evidence ?? []),
    ...(evidenceRefs.length === 0
      ? ["perspective_next_work_bias_evidence_refs_missing"]
      : []),
  ]);
  const refusalReasons = uniqueCandidateIngressStringsV01([
    ...(unsafeRefs.length > 0 ? ["perspective_next_work_bias_refs_unsafe"] : []),
    ...selectedRefs
      .filter((ref) => !contractSelectableRefs.includes(ref))
      .map(() => "selected_next_work_bias_refs_not_in_contract"),
    ...selectedRefs
      .filter((ref) => !acceptedDecisionNextWorkBiasRefs.includes(ref))
      .map(() => "selected_next_work_bias_refs_not_in_decision_record"),
    ...(entries.length !== selectedRefs.length && selectedRefs.length > 0
      ? ["selected_next_work_bias_entries_missing"]
      : []),
  ]);
  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(!decisionReview ? ["perspective_relay_update_decision_record_review_missing"] : []),
    ...(decisionReview && !decisionReviewValid
      ? ["valid_perspective_relay_update_decision_record_missing"]
      : []),
    ...(selectedRefs.length === 0
      ? ["selected_next_work_bias_candidate_refs_missing"]
      : []),
    ...(!requested_operator_ref ? ["operator_ref_missing"] : []),
    ...(!requested_idempotency_key ? ["idempotency_key_missing"] : []),
    ...(!review_confirmation_ref ? ["review_confirmation_ref_missing"] : []),
    ...(sourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(entries.length === 0 && selectedRefs.length > 0
      ? ["next_work_bias_entries_missing"]
      : []),
    ...(writeContract?.insufficient_data_reasons ?? []),
    ...(decisionReview?.insufficient_data_reasons ?? []),
  ]);
  const writeReadiness = buildWriteReadiness({
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });
  const status = determineStatus({
    hasContract: Boolean(writeContract),
    hasSelectedRefs: selectedRefs.length > 0,
    writeReadiness,
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });

  return {
    preview_version: PERSPECTIVE_NEXT_WORK_BIAS_SCOPED_WRITE_PREVIEW_VERSION,
    scope:
      scope ??
      writeContract?.scope ??
      decisionReview?.scope ??
      PERSPECTIVE_NEXT_WORK_BIAS_SCOPE,
    as_of:
      as_of ?? writeContract?.as_of ?? decisionReview?.as_of ?? FALLBACK_AS_OF,
    source_refs: sourceRefs,
    scoped_write_preview_status: status,
    recommended_next_action: determineRecommendedNextAction(status),
    input_summary: {
      has_write_contract_preview: Boolean(writeContract),
      has_decision_record_review: Boolean(decisionReview),
      has_valid_decision_records: decisionReviewValid,
      selected_next_work_bias_candidate_count: selectedRefs.length,
      non_writable_perspective_unit_candidate_count:
        nonWritablePerspectiveRefs.length,
      non_writable_continuity_relay_candidate_count: nonWritableRelayRefs.length,
      next_work_bias_entry_count: entries.length,
      blocker_count: blockingReasons.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusalReasons.length,
      insufficient_data_reason_count: insufficientData.length,
      review_confirmation_supplied: Boolean(review_confirmation_ref),
      requested_idempotency_key_supplied: Boolean(requested_idempotency_key),
      requested_operator_ref_supplied: Boolean(requested_operator_ref),
    },
    source_status: {
      perspective_relay_update_write_contract_preview: writeContract
        ? "supplied"
        : wrongContractVersion
          ? "wrong_version"
          : isRecord(perspective_relay_update_write_contract_preview)
            ? "malformed"
            : "missing",
      perspective_relay_update_decision_record_review: decisionReview
        ? decisionReviewValid
          ? "supplied"
          : "invalid"
        : isRecord(perspective_relay_update_decision_record_review)
          ? "malformed"
          : "missing",
      selected_next_work_bias_refs:
        selectedRefs.length === 0
          ? "missing"
          : selectedRefs.some((ref) => !isCandidateIngressPublicSafeRefV01(ref))
            ? "unsafe"
            : selectedRefs.some((ref) => !contractSelectableRefs.includes(ref))
              ? "unknown_ref"
              : "supplied",
      review_confirmation_ref: review_confirmation_ref
        ? safeRef(review_confirmation_ref)
          ? "supplied"
          : "unsafe"
        : "missing",
      requested_idempotency_key: requested_idempotency_key
        ? safeRef(requested_idempotency_key)
          ? "supplied"
          : "unsafe"
        : "missing",
      requested_operator_ref: requested_operator_ref
        ? safeRef(requested_operator_ref)
          ? "supplied"
          : "unsafe"
        : "missing",
    },
    write_readiness: writeReadiness,
    approval_requirements: [
      "review_perspective_relay_update_write_contract",
      "confirm_selected_next_work_bias_refs_are_accepted_in_decision_record",
      "confirm_perspective_unit_and_continuity_relay_refs_remain_future_slices",
      "confirm_only_scoped_local_next_work_bias_record_and_receipt_may_be_written",
      "confirm_no_cwp_relay_handoff_memory_metric_or_external_mutation",
    ],
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_valid_write_contract_preview: Boolean(writeContract && contractReady),
      has_valid_decision_record_material: decisionReviewValid,
      has_selected_next_work_bias_refs: selectedRefs.length > 0,
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_review_confirmation: Boolean(review_confirmation_ref),
      has_idempotency_key: Boolean(requested_idempotency_key),
      has_operator_ref: Boolean(requested_operator_ref),
      has_missing_evidence: missingEvidence.length > 0,
      has_refusal_reasons: refusalReasons.length > 0,
      has_unsafe_refs: unsafeRefs.length > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      unsafe_refs: unsafeRefs,
    },
    would_write_perspective_next_work_bias_record_preview: {
      proposed_record_kind: PERSPECTIVE_NEXT_WORK_BIAS_RECORD_VERSION,
      proposed_receipt_kind: PERSPECTIVE_NEXT_WORK_BIAS_RECEIPT_VERSION,
      proposed_store_kind: PERSPECTIVE_NEXT_WORK_BIAS_STORE_VERSION,
      selected_next_work_bias_candidate_refs: selectedRefs,
      selectable_next_work_bias_candidate_refs: contractSelectableRefs,
      non_writable_perspective_unit_candidate_refs: nonWritablePerspectiveRefs,
      non_writable_continuity_relay_candidate_refs: nonWritableRelayRefs,
      next_work_bias_entries: entries,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      source_perspective_relay_update_write_contract_preview_ref:
        writeContract?.preview_version ?? null,
      source_perspective_relay_update_decision_record_refs:
        validDecisionRecords.map((record) => record.record_id),
      requested_operator_ref: safeRef(requested_operator_ref),
      requested_idempotency_key: safeRef(requested_idempotency_key),
      review_confirmation_ref: safeRef(review_confirmation_ref),
      review_summary:
        "Scoped local NextWorkBias record write candidate; PerspectiveUnit, CWP, relay, handoff, memory, metrics, and external effects remain out of scope.",
    },
    selected_next_work_bias_candidates: selectedRefs,
    next_work_bias_entries: entries,
    operator_review_checklist: [
      "review_selected_next_work_bias_entries",
      "confirm_entries_match_accepted_perspective_relay_update_decision_record",
      "confirm_perspective_unit_and_relay_contract_targets_are_not_written_here",
      "confirm_workbench_does_not_call_route_or_render_action_buttons",
    ],
    would_not_write: [
      "does_not_write_perspective_unit",
      "does_not_mutate_current_working_perspective",
      "does_not_update_continuity_relay",
      "does_not_mutate_apply_or_send_handoff",
      "does_not_write_memory_or_metrics",
      "does_not_write_upstream_ledgers",
      "does_not_call_provider_github_or_codex",
    ],
    non_goals: [
      "perspective_unit_write",
      "cwp_mutation",
      "continuity_relay_write",
      "handoff_apply_or_send",
      "memory_write",
      "metric_write",
      "reuse_expected_observed_or_work_episode_write",
      "external_action",
    ],
    authority_boundary:
      createPerspectiveNextWorkBiasScopedWriteAuthorityBoundaryV01(),
  };
}

export function createPerspectiveNextWorkBiasScopedWriteAuthorityBoundaryV01(): PerspectiveNextWorkBiasScopedWriteAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    candidate_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_db: false,
    can_create_perspective_next_work_bias_record: false,
    can_write_next_work_bias: false,
    can_write_perspective_unit: false,
    can_update_current_working_perspective: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_send_handoff: false,
    can_write_memory: false,
    can_write_dogfood_metrics: false,
    can_write_reuse_outcome_ledger: false,
    can_write_expected_observed_delta: false,
    can_write_work_episode: false,
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
      "Preview prepares a scoped local Perspective NextWorkBias record write only.",
      "It cannot write DB, PerspectiveUnit, CWP, continuity relay, handoff, memory, metrics, upstream ledgers, provider, GitHub, Codex, PR, autonomous, graph, vector, RAG, crawler, or browser state.",
    ],
  };
}

function buildEntries({
  records,
  selectedRefs,
  evidenceRefs,
  sourceRefs,
}: {
  records: PerspectiveRelayUpdateDecisionRecord[];
  selectedRefs: string[];
  evidenceRefs: string[];
  sourceRefs: string[];
}): PerspectiveNextWorkBiasEntry[] {
  const summaries = records.flatMap((record) => record.next_work_bias_candidates);
  return selectedRefs.flatMap((selectedRef) => {
    const summary = summaries.find(
      (candidate) => candidate.candidate_ref === selectedRef,
    );
    if (!summary || !validBuckets.has(summary.bucket as PerspectiveNextWorkBiasBucket)) {
      return [];
    }
    const bucket = summary.bucket as PerspectiveNextWorkBiasBucket;
    return [
      {
        bias_ref: `perspective-next-work-bias:${hashText(selectedRef).slice(0, 24)}`,
        source_candidate_ref: selectedRef,
        bucket,
        directive: bucketToDirective.get(bucket) ?? "warn_next_time",
        summary: summary.summary,
        evidence_refs: uniqueCandidateIngressStringsV01([
          ...summary.evidence_refs,
          ...evidenceRefs,
        ]).filter(isCandidateIngressPublicSafeRefV01),
        source_refs: sourceRefs,
        review_pressure: summary.review_pressure,
        status: "active_scoped_next_work_bias",
        persistence_horizon: "local_project_next_work_bias_record",
      },
    ];
  });
}

function buildWriteReadiness({
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
}: {
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): PerspectiveNextWorkBiasScopedWriteReadiness {
  const ready =
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    refusalReasons.length === 0 &&
    insufficientData.length === 0;
  return {
    write_ready: ready,
    readiness_label: ready
      ? "ready_for_scoped_local_next_work_bias_record_write"
      : "not_ready_for_scoped_local_next_work_bias_record_write",
    requires_perspective_relay_update_write_contract: true,
    requires_perspective_relay_update_decision_record: true,
    requires_selected_next_work_bias_refs: true,
    requires_review_confirmation: true,
    requires_idempotency_key: true,
    requires_operator_ref: true,
    requires_source_refs: true,
    requires_evidence_refs: true,
    requires_no_blockers: true,
    current_blockers: blockingReasons,
    current_missing_evidence: missingEvidence,
    current_refusal_reasons: refusalReasons,
    current_insufficient_data: insufficientData,
  };
}

function determineStatus({
  hasContract,
  hasSelectedRefs,
  writeReadiness,
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
}: {
  hasContract: boolean;
  hasSelectedRefs: boolean;
  writeReadiness: PerspectiveNextWorkBiasScopedWriteReadiness;
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): PerspectiveNextWorkBiasScopedWritePreviewStatus {
  if (!hasContract) return "no_perspective_relay_update_write_contract";
  if (writeReadiness.write_ready) {
    return "ready_for_future_perspective_next_work_bias_record_write";
  }
  if (blockingReasons.length > 0 || refusalReasons.length > 0) return "blocked";
  if (missingEvidence.length > 0) return "needs_more_evidence";
  if (hasSelectedRefs && insufficientData.length === 0) {
    return "ready_for_operator_review";
  }
  return "insufficient_data";
}

function determineRecommendedNextAction(
  status: PerspectiveNextWorkBiasScopedWritePreviewStatus,
): PerspectiveNextWorkBiasScopedWriteRecommendedNextAction {
  if (status === "ready_for_future_perspective_next_work_bias_record_write") {
    return "write_perspective_next_work_bias_record";
  }
  if (status === "ready_for_operator_review") {
    return "review_perspective_next_work_bias_scoped_write";
  }
  if (status === "no_perspective_relay_update_write_contract") {
    return "supply_perspective_relay_update_write_contract";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "resolve_perspective_next_work_bias_blockers";
}

function hasReadOnlyWriteContractAuthority(value: Record<string, unknown>): boolean {
  const authority = isRecord(value.authority_boundary)
    ? value.authority_boundary
    : null;
  return Boolean(
    authority &&
      authority.read_only === true &&
      authority.candidate_material_only === true &&
      authority.derived_read_model === true &&
      authority.can_write_perspective_unit === false &&
      authority.can_write_next_work_bias === false &&
      authority.can_update_current_working_perspective === false &&
      authority.can_update_continuity_relay === false &&
      authority.can_mutate_handoff_context === false &&
      authority.can_send_handoff === false &&
      authority.can_write_memory === false &&
      authority.can_write_dogfood_metrics === false &&
      authority.can_call_provider_openai === false &&
      authority.can_call_github === false &&
      authority.can_execute_codex === false,
  );
}

function isWriteContractPreview(value: unknown): value is Record<string, any> {
  return (
    isRecord(value) &&
    value.preview_version ===
      PERSPECTIVE_RELAY_UPDATE_WRITE_CONTRACT_PREVIEW_VERSION &&
    isRecord(value.proposed_future_write_contract) &&
    isRecord(value.selected_candidate_refs_by_target)
  );
}

function isDecisionRecordReview(value: unknown): value is Record<string, any> & {
  records: PerspectiveRelayUpdateDecisionRecord[];
} {
  return (
    isRecord(value) &&
    value.review_version === PERSPECTIVE_RELAY_UPDATE_DECISION_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.input_summary) &&
    isRecord(value.evidence_summary)
  );
}

function safeRef(value: unknown): string | null {
  return isCandidateIngressPublicSafeRefV01(value) ? value : null;
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
