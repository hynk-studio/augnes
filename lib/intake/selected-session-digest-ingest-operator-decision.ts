import {
  SELECTED_SESSION_DIGEST_INGEST_CONTRACT_PREVIEW_VERSION,
  type SelectedSessionDigestIngestContractAuthorityBoundary,
  type SelectedSessionDigestIngestContractPreview,
} from "@/types/selected-session-digest-ingest-contract-preview";
import {
  SELECTED_SESSION_DIGEST_INGEST_OPERATOR_DECISION_PREVIEW_VERSION,
  type SelectedSessionDigestIngestAvailableOperatorDecision,
  type SelectedSessionDigestIngestOperatorDecisionAuthorityBoundary,
  type SelectedSessionDigestIngestOperatorDecisionCarryForward,
  type SelectedSessionDigestIngestOperatorDecisionContractPreviewRefs,
  type SelectedSessionDigestIngestOperatorDecisionEvidenceSummary,
  type SelectedSessionDigestIngestOperatorDecisionInputSummary,
  type SelectedSessionDigestIngestOperatorDecisionPreview,
  type SelectedSessionDigestIngestOperatorDecisionPreviewInput,
  type SelectedSessionDigestIngestOperatorDecisionPreviewStatus,
  type SelectedSessionDigestIngestOperatorDecisionSourceStatus,
  type SelectedSessionDigestIngestOperatorDecisionWouldWritePreview,
  type SelectedSessionDigestIngestOperatorDecisionWriteReadiness,
  type SelectedSessionDigestIngestRecommendedOperatorDecision,
} from "@/types/selected-session-digest-ingest-operator-decision";

const DEFAULT_SCOPE = "project:augnes" as const;
const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;

const AVAILABLE_OPERATOR_DECISIONS: SelectedSessionDigestIngestAvailableOperatorDecision[] =
  [
    "approve_for_future_ingest_write",
    "defer",
    "reject",
    "keep_candidate",
    "request_more_evidence",
  ];

const contractFalseAuthorityFields = [
  "can_persist_decision",
  "can_write_db",
  "can_create_schema",
  "can_create_ingest_record",
  "can_create_ingest_receipt",
  "can_write_selected_session_digest",
  "can_write_memory",
  "can_mutate_memory",
  "can_promote_memory",
  "can_mutate_current_working_perspective",
  "can_write_perspective_unit",
  "can_write_next_work_bias",
  "can_update_continuity_relay",
  "can_mutate_handoff_context",
  "can_apply_handoff_context",
  "can_write_selected_refs_to_live_handoff",
  "can_send_handoff",
  "can_write_dogfood_metrics",
  "can_write_reuse_ledger",
  "can_call_provider_openai",
  "can_call_github",
  "can_execute_codex",
  "can_create_pr",
  "can_merge_pr",
  "can_run_autonomous_action",
  "can_create_graph_or_vector_store",
  "can_create_rag_stack",
  "can_crawl_or_observe_browser",
] as const satisfies readonly (keyof SelectedSessionDigestIngestContractAuthorityBoundary)[];

type ContractPreviewSourceStatus =
  SelectedSessionDigestIngestOperatorDecisionSourceStatus["selected_session_digest_ingest_contract_preview"];

export function buildSelectedSessionDigestIngestOperatorDecisionPreviewV01({
  selected_session_digest_ingest_contract_preview,
  scope,
  as_of,
  source_refs,
}: SelectedSessionDigestIngestOperatorDecisionPreviewInput = {}): SelectedSessionDigestIngestOperatorDecisionPreview {
  const sourcePreviewStatus = getContractPreviewSourceStatus(
    selected_session_digest_ingest_contract_preview,
  );
  const shapeProblems = buildContractPreviewShapeProblems(
    selected_session_digest_ingest_contract_preview,
  );
  const contractPreview = isCompleteContractPreviewShape(
    selected_session_digest_ingest_contract_preview,
  )
    ? selected_session_digest_ingest_contract_preview
    : null;
  const sourceStatus = buildSourceStatus({
    contractPreview,
    sourcePreviewStatus,
  });
  const contractPreviewRefs = buildContractPreviewRefs(contractPreview);
  const wouldWritePreview = buildWouldWriteDecisionRecordPreview({
    contractPreview,
    contractPreviewRefs,
  });
  const carryForward = buildCandidateCarryForward(contractPreview);
  const refusalReasons = buildRefusalReasons({
    contractPreview,
    wouldWritePreview,
  });
  const missingEvidence = uniqueSortedStrings([
    ...(contractPreview?.missing_evidence ?? []),
    ...(contractPreview?.evidence_summary.missing_evidence ?? []),
    ...(contractPreview?.readiness.current_missing_evidence ?? []),
  ]);
  const insufficientDataReasons = buildInsufficientDataReasons({
    contractPreview,
    sourcePreviewStatus,
    shapeProblems,
    wouldWritePreview,
  });
  const blockingReasons = buildBlockingReasons({
    contractPreview,
    sourcePreviewStatus,
    sourceStatus,
    refusalReasons,
  });
  const writeReadiness = buildWriteReadiness({
    contractPreview,
    sourceStatus,
    wouldWritePreview,
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientDataReasons,
  });
  const decisionPreviewStatus = determineDecisionPreviewStatus({
    contractPreview,
    sourcePreviewStatus,
    writeReadiness,
    blockingReasons,
    missingEvidence,
    insufficientDataReasons,
    refusalReasons,
  });
  const recommendedOperatorDecision = determineRecommendedOperatorDecision({
    contractPreview,
    sourcePreviewStatus,
    writeReadiness,
    blockingReasons,
    missingEvidence,
    insufficientDataReasons,
    refusalReasons,
  });
  const evidenceSummary = buildEvidenceSummary({
    contractPreview,
    sourcePreviewStatus,
    sourceStatus,
    wouldWritePreview,
    missingEvidence,
    blockingReasons,
    insufficientDataReasons,
    refusalReasons,
  });

  return {
    runtime: "augnes",
    preview_version:
      SELECTED_SESSION_DIGEST_INGEST_OPERATOR_DECISION_PREVIEW_VERSION,
    scope: scope ?? contractPreview?.scope ?? DEFAULT_SCOPE,
    as_of: as_of ?? contractPreview?.as_of ?? FALLBACK_AS_OF,
    source_refs: buildSourceRefs({
      contractPreview,
      source_refs,
      contractPreviewRefs,
    }),
    decision_preview_status: decisionPreviewStatus,
    recommended_operator_decision: recommendedOperatorDecision,
    available_operator_decisions: AVAILABLE_OPERATOR_DECISIONS,
    input_summary: buildInputSummary({
      contractPreview,
      sourceStatus,
      wouldWritePreview,
      blockingReasons,
      missingEvidence,
      refusalReasons,
      insufficientDataReasons,
    }),
    ingest_contract_preview_refs: contractPreviewRefs,
    source_status: sourceStatus,
    write_readiness: writeReadiness,
    approval_requirements: buildApprovalRequirements(),
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: evidenceSummary,
    would_write_decision_record_preview: wouldWritePreview,
    would_not_write: buildWouldNotWrite(),
    candidate_carry_forward: carryForward,
    review_checklist: buildReviewChecklist(),
    non_goals: buildNonGoals(),
    authority_boundary:
      createSelectedSessionDigestIngestOperatorDecisionAuthorityBoundaryV01(),
    fallback_reason: buildFallbackReason({
      sourcePreviewStatus,
      shapeProblems,
      blockingReasons,
      insufficientDataReasons,
      missingEvidence,
      refusalReasons,
    }),
    notes: buildNotes(),
  };
}

export function createSelectedSessionDigestIngestOperatorDecisionAuthorityBoundaryV01(): SelectedSessionDigestIngestOperatorDecisionAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_persist_decision: false,
    can_write_db: false,
    can_create_schema: false,
    can_create_ingest_decision_record: false,
    can_create_ingest_decision_receipt: false,
    can_create_ingest_record: false,
    can_create_ingest_receipt: false,
    can_write_selected_session_digest: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_mutate_current_working_perspective: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_update_continuity_relay: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
    can_write_dogfood_metrics: false,
    can_write_reuse_ledger: false,
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
      "Selected session digest ingest operator decision preview is read-only and advisory.",
      "It consumes an already-built selected session digest ingest contract preview and does not parse raw digest material.",
      "Even when ready_for_future_decision_record_write is true, this preview cannot create selected digest ingest records, selected digest ingest receipts, memory, Perspective, CWP, relay, or handoff state.",
    ],
  };
}

function getContractPreviewSourceStatus(
  value: unknown,
): ContractPreviewSourceStatus {
  if (!value) return "missing";
  if (!hasContractPreviewVersion(value)) return "wrong_version";
  return buildContractPreviewShapeProblems(value).length > 0
    ? "malformed"
    : "supplied";
}

function hasContractPreviewVersion(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.preview_version ===
      SELECTED_SESSION_DIGEST_INGEST_CONTRACT_PREVIEW_VERSION
  );
}

function isCompleteContractPreviewShape(
  value: unknown,
): value is SelectedSessionDigestIngestContractPreview {
  return (
    hasContractPreviewVersion(value) &&
    buildContractPreviewShapeProblems(value).length === 0
  );
}

function buildContractPreviewShapeProblems(value: unknown): string[] {
  if (!hasContractPreviewVersion(value)) return [];
  if (!isRecord(value)) return ["ingest_contract_preview_malformed"];

  const problems: string[] = [];
  if (
    typeof value.contract_preview_status !== "string" ||
    typeof value.recommended_next_action !== "string" ||
    !Array.isArray(value.source_refs)
  ) {
    problems.push("ingest_contract_preview_status_or_refs_invalid");
  }
  const readiness = recordField(value, "readiness");
  if (
    !readiness ||
    typeof readiness.ready_for_future_ingest_write_scope !== "boolean" ||
    !Array.isArray(readiness.current_blockers) ||
    !Array.isArray(readiness.current_missing_evidence) ||
    !Array.isArray(readiness.current_refusal_reasons) ||
    !Array.isArray(readiness.current_insufficient_data) ||
    !Array.isArray(readiness.current_unsafe_refs)
  ) {
    problems.push("ingest_contract_preview_readiness_invalid");
  }
  const wouldIngest = recordField(value, "would_ingest_material_preview");
  if (
    !wouldIngest ||
    !Array.isArray(wouldIngest.selected_digest_candidate_refs) ||
    !Array.isArray(wouldIngest.selectable_digest_candidate_refs) ||
    !Array.isArray(wouldIngest.evidence_refs) ||
    !Array.isArray(wouldIngest.source_refs) ||
    !Array.isArray(wouldIngest.candidate_summaries)
  ) {
    problems.push("ingest_contract_preview_would_ingest_material_invalid");
  }
  const sourceStatus = recordField(value, "source_status");
  if (
    !sourceStatus ||
    typeof sourceStatus.authority_boundary !== "string" ||
    typeof sourceStatus.intake_preview_write_authority !== "string"
  ) {
    problems.push("ingest_contract_preview_source_status_invalid");
  }
  const evidenceSummary = recordField(value, "evidence_summary");
  if (
    !evidenceSummary ||
    !Array.isArray(evidenceSummary.evidence_refs) ||
    !Array.isArray(evidenceSummary.missing_evidence) ||
    !Array.isArray(evidenceSummary.unsafe_refs)
  ) {
    problems.push("ingest_contract_preview_evidence_summary_invalid");
  }
  const authorityBoundary = recordField(value, "authority_boundary");
  if (
    !authorityBoundary ||
    authorityBoundary.read_only !== true ||
    authorityBoundary.advisory_only !== true ||
    authorityBoundary.source_of_truth !== false ||
    authorityBoundary.derived_read_model !== true
  ) {
    problems.push("ingest_contract_preview_authority_boundary_invalid");
  }
  for (const field of contractFalseAuthorityFields) {
    if (authorityBoundary && authorityBoundary[field] !== false) {
      problems.push(`ingest_contract_preview_authority_field_not_false:${field}`);
    }
  }
  if (
    !Array.isArray(value.blocked_reasons) ||
    !Array.isArray(value.insufficient_data_reasons) ||
    !Array.isArray(value.refusal_reasons) ||
    !Array.isArray(value.missing_evidence)
  ) {
    problems.push("ingest_contract_preview_reason_arrays_invalid");
  }

  return problems.length
    ? uniqueSortedStrings(["ingest_contract_preview_malformed", ...problems])
    : [];
}

function buildSourceStatus({
  contractPreview,
  sourcePreviewStatus,
}: {
  contractPreview: SelectedSessionDigestIngestContractPreview | null;
  sourcePreviewStatus: ContractPreviewSourceStatus;
}): SelectedSessionDigestIngestOperatorDecisionSourceStatus {
  return {
    selected_session_digest_ingest_contract_preview: sourcePreviewStatus,
    contract_preview_status: contractPreview?.contract_preview_status ?? null,
    authority_boundary: contractPreview
      ? contractAuthorityBoundaryValid(contractPreview)
        ? "valid_read_only"
        : "invalid"
      : "missing",
    contract_preview_write_authority: contractPreview
      ? contractWriteAuthorityAllFalse(contractPreview)
        ? "all_false"
        : "invalid"
      : "missing",
  };
}

function buildContractPreviewRefs(
  contractPreview: SelectedSessionDigestIngestContractPreview | null,
): SelectedSessionDigestIngestOperatorDecisionContractPreviewRefs {
  return {
    contract_preview_ref: contractPreview
      ? buildContractPreviewInstanceRef(contractPreview)
      : null,
    contract_preview_version: contractPreview?.preview_version ?? null,
    contract_preview_status: contractPreview?.contract_preview_status ?? null,
    recommended_next_action: contractPreview?.recommended_next_action ?? null,
    intake_preview_ref:
      contractPreview?.would_ingest_material_preview.intake_preview_ref ?? null,
    source_refs: uniqueSortedStrings(contractPreview?.source_refs ?? []).filter(
      hasPublicSafeValue,
    ),
    evidence_refs: uniqueSortedStrings(
      contractPreview?.evidence_summary.evidence_refs ?? [],
    ).filter(hasPublicSafeValue),
  };
}

function buildWouldWriteDecisionRecordPreview({
  contractPreview,
  contractPreviewRefs,
}: {
  contractPreview: SelectedSessionDigestIngestContractPreview | null;
  contractPreviewRefs: SelectedSessionDigestIngestOperatorDecisionContractPreviewRefs;
}): SelectedSessionDigestIngestOperatorDecisionWouldWritePreview {
  const material = contractPreview?.would_ingest_material_preview;
  const selectedRefs = uniqueSortedStrings(
    material?.selected_digest_candidate_refs ?? [],
  ).filter(hasPublicSafeValue);
  const selectableRefs = uniqueSortedStrings(
    material?.selectable_digest_candidate_refs ?? [],
  ).filter(hasPublicSafeValue);
  return {
    proposed_record_kind: contractPreview
      ? "operator_approved_selected_session_digest_ingest_decision_record.v0.1"
      : null,
    proposed_receipt_kind: contractPreview
      ? "operator_approved_selected_session_digest_ingest_decision_write_receipt.v0.1"
      : null,
    proposed_future_ingest_record_kind:
      "selected_session_digest_ingest_record.v0.1",
    proposed_future_ingest_receipt_kind:
      "selected_session_digest_ingest_receipt.v0.1",
    selected_digest_candidate_refs: selectedRefs,
    selectable_digest_candidate_refs: selectableRefs,
    candidate_counts_by_kind:
      material?.candidate_counts_by_kind ?? emptyCandidateCountsByKind(),
    source_kind: material?.source_kind ?? null,
    source_ref: safeNullableRef(material?.source_ref),
    operator_ref: safeNullableRef(material?.operator_ref),
    session_ref: safeNullableRef(material?.session_ref),
    project_ref: safeNullableRef(material?.project_ref),
    source_refs: uniqueSortedStrings(material?.source_refs ?? []).filter(
      hasPublicSafeValue,
    ),
    evidence_refs: uniqueSortedStrings(material?.evidence_refs ?? []).filter(
      hasPublicSafeValue,
    ),
    contract_preview_ref: contractPreviewRefs.contract_preview_ref,
    intake_preview_ref: material?.intake_preview_ref ?? null,
    privacy_review_confirmation_ref: safeNullableRef(
      material?.privacy_review_confirmation_ref,
    ),
    requested_idempotency_key: safeNullableRef(
      material?.requested_idempotency_key,
    ),
    requested_ingest_scope_ref: safeNullableRef(
      material?.requested_ingest_scope_ref,
    ),
    sanitized_candidate_summaries: (material?.candidate_summaries ?? [])
      .filter((candidate) =>
        selectedRefs.includes(safeOutputRef(candidate.candidate_ref)),
      )
      .map((candidate) => ({
        candidate_ref: safeOutputRef(candidate.candidate_ref),
        candidate_kind: safeText(candidate.candidate_kind),
        label: safeText(candidate.label),
        summary: safeText(candidate.summary),
        source_refs: uniqueSortedStrings(candidate.source_refs).filter(
          hasPublicSafeValue,
        ),
        evidence_refs: uniqueSortedStrings(candidate.evidence_refs).filter(
          hasPublicSafeValue,
        ),
      })),
    review_summary: contractPreview
      ? "Operator decision preview can approve only a future ingest write decision record; actual selected digest ingest remains a separate scope."
      : "No ingest contract preview supplied.",
  };
}

function buildCandidateCarryForward(
  contractPreview: SelectedSessionDigestIngestContractPreview | null,
): SelectedSessionDigestIngestOperatorDecisionCarryForward {
  const carry = contractPreview?.carry_forward_review_only_material;
  return {
    review_only_candidate_refs: uniqueSortedStrings(
      carry?.rejected_or_review_only_candidate_refs ?? [],
    ).filter(hasPublicSafeValue),
    review_only_candidate_count: carry?.rejected_or_review_only_count ?? 0,
    review_only_candidate_summaries: (
      carry?.review_only_candidate_summaries ?? []
    ).map((candidate) => ({
      candidate_ref: safeOutputRef(candidate.candidate_ref),
      label: safeText(candidate.label),
      summary: safeText(candidate.summary),
      ingest_preview_only: true,
    })),
    unresolved_contract_blockers: uniqueSortedStrings([
      ...(carry?.unresolved_blockers ?? []),
      ...(contractPreview?.blocked_reasons ?? []),
    ]),
    contract_missing_evidence: uniqueSortedStrings([
      ...(carry?.missing_evidence_candidates ?? []),
      ...(contractPreview?.missing_evidence ?? []),
    ]),
    contract_privacy_review_notes: uniqueSortedStrings(
      carry?.intake_privacy_review_notes.map(safeText) ?? [],
    ),
  };
}

function buildRefusalReasons({
  contractPreview,
  wouldWritePreview,
}: {
  contractPreview: SelectedSessionDigestIngestContractPreview | null;
  wouldWritePreview: SelectedSessionDigestIngestOperatorDecisionWouldWritePreview;
}): string[] {
  const selectable = new Set(
    wouldWritePreview.selectable_digest_candidate_refs.filter(
      hasPublicSafeValue,
    ),
  );
  const selectedUnknown = wouldWritePreview.selected_digest_candidate_refs.filter(
    (ref) => !selectable.has(ref),
  );
  return uniqueSortedStrings([
    ...(contractPreview?.refusal_reasons ?? []),
    ...(contractPreview?.readiness.current_refusal_reasons ?? []),
    ...(contractPreview?.readiness.current_unsafe_refs ?? []),
    ...(contractPreview?.evidence_summary.unsafe_refs ?? []),
    ...(selectedUnknown.length > 0
      ? [
          "selected_digest_candidate_refs_not_subset_of_selectable_refs",
          "unknown_selected_digest_candidate_ref",
        ]
      : []),
    ...unsafeReasonsFromObject(wouldWritePreview),
  ]);
}

function buildInsufficientDataReasons({
  contractPreview,
  sourcePreviewStatus,
  shapeProblems,
  wouldWritePreview,
}: {
  contractPreview: SelectedSessionDigestIngestContractPreview | null;
  sourcePreviewStatus: ContractPreviewSourceStatus;
  shapeProblems: string[];
  wouldWritePreview: SelectedSessionDigestIngestOperatorDecisionWouldWritePreview;
}): string[] {
  return uniqueSortedStrings([
    ...(sourcePreviewStatus === "missing"
      ? ["selected_session_digest_ingest_contract_preview_missing"]
      : []),
    ...(sourcePreviewStatus === "wrong_version"
      ? ["selected_session_digest_ingest_contract_preview_wrong_version"]
      : []),
    ...shapeProblems,
    ...(contractPreview &&
    contractPreview.contract_preview_status !== "ready_for_future_ingest_write_scope"
      ? ["ingest_contract_preview_not_ready_for_future_ingest_write_scope"]
      : []),
    ...(contractPreview &&
    contractPreview.readiness.ready_for_future_ingest_write_scope !== true
      ? ["ingest_contract_readiness_not_ready_for_future_ingest_write_scope"]
      : []),
    ...(contractPreview?.insufficient_data_reasons ?? []),
    ...(contractPreview?.readiness.current_insufficient_data ?? []),
    ...(wouldWritePreview.selected_digest_candidate_refs.length === 0
      ? ["selected_digest_candidate_refs_missing"]
      : []),
    ...(wouldWritePreview.privacy_review_confirmation_ref
      ? []
      : ["privacy_review_confirmation_ref_missing"]),
    ...(wouldWritePreview.requested_idempotency_key
      ? []
      : ["requested_idempotency_key_missing"]),
    ...(wouldWritePreview.source_ref
      ? []
      : ["source_ref_missing_for_ingest_decision"]),
    ...(wouldWritePreview.operator_ref
      ? []
      : ["operator_ref_missing_for_ingest_decision"]),
    ...(wouldWritePreview.session_ref || wouldWritePreview.project_ref
      ? []
      : ["session_or_project_ref_missing_for_ingest_decision"]),
    ...(wouldWritePreview.evidence_refs.length > 0
      ? []
      : ["evidence_refs_missing_for_ingest_decision"]),
  ]);
}

function buildBlockingReasons({
  contractPreview,
  sourcePreviewStatus,
  sourceStatus,
  refusalReasons,
}: {
  contractPreview: SelectedSessionDigestIngestContractPreview | null;
  sourcePreviewStatus: ContractPreviewSourceStatus;
  sourceStatus: SelectedSessionDigestIngestOperatorDecisionSourceStatus;
  refusalReasons: string[];
}): string[] {
  return uniqueSortedStrings([
    ...(sourcePreviewStatus === "wrong_version"
      ? ["blocked_wrong_selected_session_digest_ingest_contract_preview_version"]
      : []),
    ...(sourcePreviewStatus === "malformed"
      ? ["blocked_malformed_selected_session_digest_ingest_contract_preview"]
      : []),
    ...(contractPreview?.contract_preview_status === "blocked"
      ? ["blocked_ingest_contract_preview_status_blocked"]
      : []),
    ...(contractPreview?.blocked_reasons ?? []),
    ...(contractPreview?.readiness.current_blockers ?? []),
    ...(sourceStatus.authority_boundary !== "valid_read_only"
      ? ["blocked_ingest_contract_preview_authority_boundary_invalid"]
      : []),
    ...(sourceStatus.contract_preview_write_authority !== "all_false"
      ? ["blocked_ingest_contract_preview_write_authority_invalid"]
      : []),
    ...refusalReasons,
  ]);
}

function buildWriteReadiness({
  contractPreview,
  sourceStatus,
  wouldWritePreview,
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientDataReasons,
}: {
  contractPreview: SelectedSessionDigestIngestContractPreview | null;
  sourceStatus: SelectedSessionDigestIngestOperatorDecisionSourceStatus;
  wouldWritePreview: SelectedSessionDigestIngestOperatorDecisionWouldWritePreview;
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientDataReasons: string[];
}): SelectedSessionDigestIngestOperatorDecisionWriteReadiness {
  const contractReady =
    contractPreview?.contract_preview_status ===
      "ready_for_future_ingest_write_scope" &&
    contractPreview.readiness.ready_for_future_ingest_write_scope === true;
  const selectedRefsPresent =
    wouldWritePreview.selected_digest_candidate_refs.length > 0 &&
    selectedRefsSubsetOfSelectable(wouldWritePreview);
  const hasPrivacy = Boolean(wouldWritePreview.privacy_review_confirmation_ref);
  const hasIdempotency = Boolean(wouldWritePreview.requested_idempotency_key);
  const readOnlyContract =
    sourceStatus.authority_boundary === "valid_read_only" &&
    sourceStatus.contract_preview_write_authority === "all_false";
  const writeReady =
    Boolean(contractPreview) &&
    contractReady &&
    selectedRefsPresent &&
    hasPrivacy &&
    hasIdempotency &&
    readOnlyContract &&
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    refusalReasons.length === 0 &&
    insufficientDataReasons.length === 0;

  return {
    write_ready: writeReady,
    readiness_label: writeReady
      ? "ready_for_operator_approved_ingest_decision_record_write"
      : "not_ready_for_operator_approved_ingest_decision_record_write",
    requires_valid_ingest_contract_preview: true,
    requires_contract_ready_for_future_ingest_write_scope: true,
    requires_selected_digest_candidate_refs: true,
    requires_privacy_review_confirmation: true,
    requires_idempotency_key: true,
    requires_operator_confirmation: true,
    requires_no_blockers: true,
    requires_no_missing_evidence: true,
    requires_no_refusal_reasons: true,
    requires_read_only_contract_preview: true,
    requires_contract_preview_no_write_performed: true,
    current_blockers: blockingReasons,
    current_missing_evidence: missingEvidence,
    current_refusal_reasons: refusalReasons,
    current_insufficient_data: insufficientDataReasons,
  };
}

function determineDecisionPreviewStatus({
  contractPreview,
  sourcePreviewStatus,
  writeReadiness,
  blockingReasons,
  missingEvidence,
  insufficientDataReasons,
  refusalReasons,
}: {
  contractPreview: SelectedSessionDigestIngestContractPreview | null;
  sourcePreviewStatus: ContractPreviewSourceStatus;
  writeReadiness: SelectedSessionDigestIngestOperatorDecisionWriteReadiness;
  blockingReasons: string[];
  missingEvidence: string[];
  insufficientDataReasons: string[];
  refusalReasons: string[];
}): SelectedSessionDigestIngestOperatorDecisionPreviewStatus {
  if (!contractPreview && sourcePreviewStatus === "missing") {
    return "no_ingest_contract_preview";
  }
  if (blockingReasons.length > 0 || refusalReasons.length > 0) {
    return "blocked";
  }
  if (!contractPreview || sourcePreviewStatus !== "supplied") {
    return "insufficient_data";
  }
  if (missingEvidence.length > 0) return "needs_more_evidence";
  if (writeReadiness.write_ready) {
    return "ready_for_future_decision_record_write";
  }
  if (
    insufficientDataReasons.includes("privacy_review_confirmation_ref_missing") ||
    insufficientDataReasons.includes("selected_digest_candidate_refs_missing") ||
    insufficientDataReasons.includes("requested_idempotency_key_missing")
  ) {
    return "insufficient_data";
  }
  if (contractPreview.contract_preview_status === "keep_preview_only") {
    return "keep_preview_only";
  }
  if (
    contractPreview.readiness.ready_for_operator_review ||
    contractPreview.contract_preview_status === "contract_candidates_available"
  ) {
    return "needs_operator_judgment";
  }
  return "insufficient_data";
}

function determineRecommendedOperatorDecision({
  contractPreview,
  sourcePreviewStatus,
  writeReadiness,
  blockingReasons,
  missingEvidence,
  insufficientDataReasons,
  refusalReasons,
}: {
  contractPreview: SelectedSessionDigestIngestContractPreview | null;
  sourcePreviewStatus: ContractPreviewSourceStatus;
  writeReadiness: SelectedSessionDigestIngestOperatorDecisionWriteReadiness;
  blockingReasons: string[];
  missingEvidence: string[];
  insufficientDataReasons: string[];
  refusalReasons: string[];
}): SelectedSessionDigestIngestRecommendedOperatorDecision {
  if (sourcePreviewStatus !== "supplied" || !contractPreview) {
    return "defer_until_contract_material_supplied";
  }
  if (blockingReasons.length > 0 || refusalReasons.length > 0) {
    return "resolve_blockers_or_unsafe_refs";
  }
  if (missingEvidence.length > 0) return "defer_until_evidence_supplied";
  if (insufficientDataReasons.includes("privacy_review_confirmation_ref_missing")) {
    return "defer_until_privacy_review_confirmed";
  }
  if (insufficientDataReasons.includes("selected_digest_candidate_refs_missing")) {
    return "defer_until_selected_candidate_refs_supplied";
  }
  if (insufficientDataReasons.includes("requested_idempotency_key_missing")) {
    return "defer_until_idempotency_supplied";
  }
  if (writeReadiness.write_ready) return "approve_for_future_ingest_write";
  if (contractPreview.contract_preview_status === "keep_preview_only") {
    return "keep_as_candidate_only";
  }
  return "request_more_evidence";
}

function buildInputSummary({
  contractPreview,
  sourceStatus,
  wouldWritePreview,
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientDataReasons,
}: {
  contractPreview: SelectedSessionDigestIngestContractPreview | null;
  sourceStatus: SelectedSessionDigestIngestOperatorDecisionSourceStatus;
  wouldWritePreview: SelectedSessionDigestIngestOperatorDecisionWouldWritePreview;
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientDataReasons: string[];
}): SelectedSessionDigestIngestOperatorDecisionInputSummary {
  return {
    has_ingest_contract_preview: Boolean(contractPreview),
    contract_preview_status: contractPreview?.contract_preview_status ?? null,
    contract_ready_for_operator_review:
      contractPreview?.readiness.ready_for_operator_review ?? false,
    contract_ready_for_future_ingest_write_scope:
      contractPreview?.readiness.ready_for_future_ingest_write_scope ?? false,
    selected_digest_candidate_ref_count:
      wouldWritePreview.selected_digest_candidate_refs.length,
    selectable_digest_candidate_ref_count:
      wouldWritePreview.selectable_digest_candidate_refs.length,
    source_ref_supplied: Boolean(wouldWritePreview.source_ref),
    operator_ref_supplied: Boolean(wouldWritePreview.operator_ref),
    session_ref_supplied: Boolean(wouldWritePreview.session_ref),
    project_ref_supplied: Boolean(wouldWritePreview.project_ref),
    evidence_ref_count: wouldWritePreview.evidence_refs.length,
    privacy_review_confirmation_ref_supplied: Boolean(
      wouldWritePreview.privacy_review_confirmation_ref,
    ),
    requested_idempotency_key_supplied: Boolean(
      wouldWritePreview.requested_idempotency_key,
    ),
    blocking_reason_count: blockingReasons.length,
    missing_evidence_count: missingEvidence.length,
    refusal_reason_count: refusalReasons.length,
    contract_authority_read_only:
      sourceStatus.authority_boundary === "valid_read_only",
    contract_preview_write_flags_all_false:
      sourceStatus.contract_preview_write_authority === "all_false" &&
      insufficientDataReasons.length >= 0,
  };
}

function buildEvidenceSummary({
  contractPreview,
  sourcePreviewStatus,
  sourceStatus,
  wouldWritePreview,
  missingEvidence,
  blockingReasons,
  insufficientDataReasons,
  refusalReasons,
}: {
  contractPreview: SelectedSessionDigestIngestContractPreview | null;
  sourcePreviewStatus: ContractPreviewSourceStatus;
  sourceStatus: SelectedSessionDigestIngestOperatorDecisionSourceStatus;
  wouldWritePreview: SelectedSessionDigestIngestOperatorDecisionWouldWritePreview;
  missingEvidence: string[];
  blockingReasons: string[];
  insufficientDataReasons: string[];
  refusalReasons: string[];
}): SelectedSessionDigestIngestOperatorDecisionEvidenceSummary {
  return {
    has_ingest_contract_preview: Boolean(contractPreview),
    ingest_contract_preview_version_valid: sourcePreviewStatus === "supplied",
    contract_ready_for_future_ingest_write_scope:
      contractPreview?.readiness.ready_for_future_ingest_write_scope ?? false,
    has_selected_digest_candidate_refs:
      wouldWritePreview.selected_digest_candidate_refs.length > 0,
    selected_refs_subset_of_selectable_refs:
      selectedRefsSubsetOfSelectable(wouldWritePreview),
    has_privacy_review_confirmation_ref: Boolean(
      wouldWritePreview.privacy_review_confirmation_ref,
    ),
    has_idempotency_key: Boolean(wouldWritePreview.requested_idempotency_key),
    has_source_ref: Boolean(wouldWritePreview.source_ref),
    has_operator_ref: Boolean(wouldWritePreview.operator_ref),
    has_session_or_project_ref: Boolean(
      wouldWritePreview.session_ref || wouldWritePreview.project_ref,
    ),
    has_evidence_refs: wouldWritePreview.evidence_refs.length > 0,
    has_missing_evidence: missingEvidence.length > 0,
    has_blockers: blockingReasons.length > 0,
    has_refusal_reasons: refusalReasons.length > 0,
    has_insufficient_data: insufficientDataReasons.length > 0,
    has_unsafe_refs:
      refusalReasons.length > 0 ||
      Boolean(contractPreview?.evidence_summary.has_unsafe_refs),
    source_authority_boundary_valid:
      sourceStatus.authority_boundary === "valid_read_only",
    source_write_authority_false:
      sourceStatus.contract_preview_write_authority === "all_false",
    no_ingest_record_write_confirmed: true,
    no_ingest_receipt_write_confirmed: true,
    no_memory_perspective_handoff_mutation_confirmed: true,
    no_provider_github_codex_confirmed: true,
    evidence_refs: wouldWritePreview.evidence_refs,
    missing_evidence: missingEvidence,
    unsafe_refs: uniqueSortedStrings([
      ...(contractPreview?.evidence_summary.unsafe_refs ?? []),
      ...(contractPreview?.readiness.current_unsafe_refs ?? []),
      ...refusalReasons,
    ]),
  };
}

function buildApprovalRequirements(): string[] {
  return [
    "confirm_ingest_contract_preview_is_selected_session_digest_ingest_contract_preview_v0_1",
    "confirm_contract_preview_ready_for_future_ingest_write_scope",
    "confirm_selected_digest_candidate_refs_are_from_contract_selectable_refs",
    "confirm_privacy_review_confirmation_ref_is_present",
    "confirm_idempotency_key_is_stable_and_public_safe",
    "confirm_source_operator_session_or_project_and_evidence_refs_are_present",
    "confirm_operator_decision_record_is_not_actual_selected_digest_ingest",
    "confirm_no_side_effects_receipt_fields_remain_false_for_actual_ingest_and_state_mutations",
  ];
}

function buildWouldNotWrite(): string[] {
  return [
    "does_not_selected_session_digest_durable_ingest",
    "does_not_create_selected_session_digest_ingest_record",
    "does_not_create_selected_session_digest_ingest_receipt",
    "does_not_write_memory",
    "does_not_mutate_memory",
    "does_not_mutate_current_working_perspective",
    "does_not_write_perspective_unit",
    "does_not_write_next_work_bias",
    "does_not_update_continuity_relay",
    "does_not_mutate_handoff_context",
    "does_not_apply_handoff_context",
    "does_not_write_selected_refs_to_live_handoff",
    "does_not_send_handoff",
    "does_not_write_dogfood_metrics",
    "does_not_write_reuse_ledger",
    "does_not_call_provider_openai",
    "does_not_call_github",
    "does_not_execute_codex",
    "does_not_run_autonomous_actions",
    "does_not_create_graph_vector_rag_crawler_or_browser_observer",
    "does_not_render_workbench_action_buttons",
  ];
}

function buildReviewChecklist(): string[] {
  return [
    "review_contract_preview_status_and_readiness",
    "review_selected_candidate_refs_against_selectable_candidate_refs",
    "review_privacy_confirmation_and_idempotency_refs",
    "review_source_operator_session_or_project_and_evidence_refs",
    "review_no_side_effect_boundaries_before_any_decision_record_write",
    "keep_actual_selected_digest_ingest_for_a_later_separate_scope",
  ];
}

function buildNonGoals(): string[] {
  return [
    "selected_session_digest_durable_ingest",
    "selected_session_digest_ingest_record_write",
    "selected_session_digest_ingest_receipt_write",
    "memory_write",
    "perspective_unit_durable_mutation",
    "next_work_bias_durable_mutation",
    "cwp_mutation",
    "continuity_relay_write",
    "live_handoff_context_apply",
    "selected_refs_live_packet_write",
    "handoff_send",
    "provider_github_codex_call",
    "graph_vector_rag_crawler_browser_observer",
    "workbench_action_buttons",
  ];
}

function buildNotes(): string[] {
  return [
    "Operator approval here can authorize only a local ingest decision record, not the actual selected session digest ingest.",
    "The future selected session digest ingest record and receipt kinds remain future targets only.",
  ];
}

function buildSourceRefs({
  contractPreview,
  source_refs,
  contractPreviewRefs,
}: {
  contractPreview: SelectedSessionDigestIngestContractPreview | null;
  source_refs?: string[];
  contractPreviewRefs: SelectedSessionDigestIngestOperatorDecisionContractPreviewRefs;
}): string[] {
  return uniqueSortedStrings([
    ...(source_refs ?? []),
    ...(contractPreview?.source_refs ?? []),
    contractPreviewRefs.contract_preview_ref ?? "",
    SELECTED_SESSION_DIGEST_INGEST_OPERATOR_DECISION_PREVIEW_VERSION,
  ]).filter(hasPublicSafeValue);
}

function buildFallbackReason({
  sourcePreviewStatus,
  shapeProblems,
  blockingReasons,
  insufficientDataReasons,
  missingEvidence,
  refusalReasons,
}: {
  sourcePreviewStatus: ContractPreviewSourceStatus;
  shapeProblems: string[];
  blockingReasons: string[];
  insufficientDataReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
}): string | null {
  if (sourcePreviewStatus === "missing") return "ingest_contract_preview_missing";
  if (shapeProblems.length > 0) return shapeProblems[0] ?? null;
  if (blockingReasons.length > 0) return blockingReasons[0] ?? null;
  if (refusalReasons.length > 0) return refusalReasons[0] ?? null;
  if (missingEvidence.length > 0) return missingEvidence[0] ?? null;
  if (insufficientDataReasons.length > 0) {
    return insufficientDataReasons[0] ?? null;
  }
  return null;
}

function contractAuthorityBoundaryValid(
  preview: SelectedSessionDigestIngestContractPreview | null,
): boolean {
  const boundary = preview?.authority_boundary;
  return Boolean(
    boundary &&
      boundary.read_only === true &&
      boundary.advisory_only === true &&
      boundary.source_of_truth === false &&
      boundary.derived_read_model === true,
  );
}

function contractWriteAuthorityAllFalse(
  preview: SelectedSessionDigestIngestContractPreview | null,
): boolean {
  const boundary = preview?.authority_boundary;
  if (!boundary) return false;
  return contractFalseAuthorityFields.every((field) => boundary[field] === false);
}

function selectedRefsSubsetOfSelectable(
  preview: SelectedSessionDigestIngestOperatorDecisionWouldWritePreview,
): boolean {
  const selectable = new Set(preview.selectable_digest_candidate_refs);
  return (
    preview.selected_digest_candidate_refs.length > 0 &&
    preview.selected_digest_candidate_refs.every((ref) => selectable.has(ref))
  );
}

function buildContractPreviewInstanceRef(
  preview: SelectedSessionDigestIngestContractPreview,
): string {
  const idempotencyKey =
    preview.would_ingest_material_preview.requested_idempotency_key ??
    "missing_idempotency";
  return safeOutputRef(
    `selected_session_digest_ingest_contract_preview:${preview.scope}:${idempotencyKey}`,
  );
}

function emptyCandidateCountsByKind(): SelectedSessionDigestIngestOperatorDecisionWouldWritePreview["candidate_counts_by_kind"] {
  return {
    session_summary: 0,
    user_goal: 0,
    decision: 0,
    open_question: 0,
    next_action: 0,
    evidence_ref: 0,
    source_ref: 0,
    risk_or_blocker: 0,
    reusable_context: 0,
  };
}

function unsafeReasonsFromObject(value: unknown): string[] {
  const json = JSON.stringify(value ?? {});
  if (!hasUnsafeTextMarker(json)) return [];
  return ["would_write_decision_record_preview_contains_private_marker"];
}

function safeNullableRef(value: unknown): string | null {
  return typeof value === "string" && hasPublicSafeValue(value) ? value : null;
}

function safeOutputRef(value: unknown, fallback = "redacted_ref"): string {
  return typeof value === "string" && hasPublicSafeValue(value)
    ? value
    : fallback;
}

function safeText(value: unknown): string {
  if (typeof value !== "string") return "";
  if (hasUnsafeTextMarker(value)) return "[redacted]";
  return value.length > 220 ? `${value.slice(0, 217)}...` : value;
}

function hasPublicSafeValue(value: unknown): value is string {
  return typeof value === "string" && isPublicSafeRef(value);
}

function isPublicSafeRef(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length > 240) return false;
  if (/[\r\n\t\0]/.test(trimmed)) return false;
  if (trimmed !== value) return false;
  if (trimmed.startsWith("/") || /^[A-Za-z]:/.test(trimmed)) return false;
  if (trimmed.includes("..") || trimmed.includes("\\")) return false;
  if (/(^|[:/@|=])(sk-|ghp_|github_pat_|xoxb-)/i.test(trimmed)) {
    return false;
  }
  if (/(^|[:|=])[a-z][a-z0-9+.-]*:\/\/[^/\s]+@/i.test(trimmed)) {
    return false;
  }
  return !hasUnsafeTextMarker(trimmed);
}

function hasUnsafeTextMarker(value: string): boolean {
  return (
    /(^|[:/@|=])(sk-|ghp_|github_pat_|xoxb-)/i.test(value) ||
    /(^|[:|=])[a-z][a-z0-9+.-]*:\/\/[^/\s]+@/i.test(value) ||
    /password:/i.test(value) ||
    /secret:/i.test(value) ||
    /\/Users\//.test(value) ||
    /\/home\//.test(value) ||
    /\.env/i.test(value) ||
    /raw_text/i.test(value) ||
    /raw_digest/i.test(value) ||
    /raw_excerpt/i.test(value)
  );
}

function uniqueSortedStrings(values: readonly unknown[]): string[] {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ).sort();
}

function recordField(
  value: Record<string, unknown> | unknown,
  field: string,
): Record<string, unknown> | null {
  if (!isRecord(value)) return null;
  const nested = value[field];
  return isRecord(nested) ? nested : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
