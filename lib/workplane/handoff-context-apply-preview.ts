import {
  containsCandidateIngressUnsafeMarkerV01,
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  HANDOFF_CONTEXT_APPLY_PREVIEW_VERSION,
  HANDOFF_CONTEXT_APPLY_SCOPE,
  type AppliedHandoffContext,
  type AppliedHandoffContextEntry,
  type AppliedHandoffContextEntryKind,
  type AppliedHandoffContextSection,
  type HandoffContextApplyAuthorityBoundary,
  type HandoffContextApplyPlan,
  type HandoffContextApplyPreview,
  type HandoffContextApplyPreviewInput,
  type HandoffContextApplyPreviewStatus,
  type HandoffContextApplyRecommendedNextAction,
} from "@/types/handoff-context-apply-slice-preview";
import {
  HANDOFF_CONTEXT_UPDATE_CONTRACT_RECORD_REVIEW_VERSION,
  type HandoffContextUpdateContractRecordReview,
} from "@/types/handoff-context-update-contract-record-review";
import {
  HANDOFF_CONTEXT_UPDATE_CONTRACT_RECORD_VERSION,
  HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_SCOPE,
  type HandoffContextUpdateContractRecord,
} from "@/types/handoff-context-update-contract-write";
import {
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_REVIEW_VERSION,
  type CurrentWorkingPerspectiveRouteIntegrationReadReview,
} from "@/types/current-working-perspective-route-integration-read-review";
import {
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_VERSION,
  type CurrentWorkingPerspectiveRouteIntegrationRead,
} from "@/types/current-working-perspective-route-integration-read";

type RecordValue = Record<string, unknown>;

const handoffSections: AppliedHandoffContextSection[] = [
  "current_frame_section",
  "current_thesis_section",
  "active_goals_section",
  "next_candidates_section",
  "open_questions_section",
  "active_risks_section",
  "continuity_relay_section",
  "perspective_units_section",
  "next_work_bias_section",
  "route_integration_metadata_section",
  "operator_review_required_section",
  "blocked_or_missing_context_section",
];

const validEntryKinds = new Set<AppliedHandoffContextEntryKind>([
  "preserve",
  "summarize",
  "warn",
  "next_action_candidate",
  "review_required",
  "stop_condition",
  "source_trace",
  "fallback_note",
]);

const usableReviewStatuses = new Set([
  "records_available",
  "selected_record_found",
]);

export function createHandoffContextApplyPreviewAuthorityBoundaryV01():
  HandoffContextApplyAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    apply_preview_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_handoff_context_apply_record: false,
    can_create_applied_handoff_context_snapshot: false,
    can_apply_handoff_context_update_to_local_snapshot: false,
    can_apply_handoff_context_update_live: false,
    can_mutate_handoff_context: false,
    can_send_handoff: false,
    can_copy_export_handoff_packet: false,
    can_write_selected_refs_to_live_handoff: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
    can_write_route_integration_contract_record: false,
    can_write_handoff_context_update_contract_record: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_continuity_relay: false,
    can_update_continuity_relay: false,
    can_apply_live_relay_state: false,
    can_write_memory: false,
    can_mutate_memory: false,
    can_promote_memory: false,
    can_update_global_dogfood_metrics: false,
    can_write_dogfood_metrics: false,
    can_write_dogfood_metric_snapshot: false,
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
    can_render_workbench_action_button: false,
    notes: [
      "Preview only applies handoff context update contract entries in memory.",
      "It cannot write DB, mutate live handoff context, send or copy/export handoff packets, write selected refs, memory, metrics, route state, or external systems.",
    ],
  };
}

export function buildHandoffContextApplyPreviewV01(
  input: HandoffContextApplyPreviewInput = {},
): HandoffContextApplyPreview {
  const asOf = input.as_of ?? new Date().toISOString();
  const sourceRefs = publicSafeRefs(input.source_refs ?? []);
  const requestedOperatorRef = safeRef(input.requested_operator_ref);
  const requestedIdempotencyKey = safeRef(input.requested_idempotency_key);
  const reviewConfirmationRef = safeRef(input.review_confirmation_ref);
  const review = parseContractReview(
    input.handoff_context_update_contract_record_review,
  );
  const directRecord = isContractRecord(
    input.handoff_context_update_contract_record,
  )
    ? input.handoff_context_update_contract_record
    : null;
  const selectedRecord = selectContractRecord({ review, directRecord });
  const entries = selectedRecord?.proposed_handoff_context_entries ?? [];
  const routeRead = parseRouteIntegrationRead(
    input.current_working_perspective_route_integration_read,
  );
  const routeReadReview = parseRouteIntegrationReadReview(
    input.current_working_perspective_route_integration_read_review,
  );
  const existingHandoffUnsafe =
    containsRawOrPrivateMarkers(input.current_handoff_context_read) ||
    containsRawOrPrivateMarkers(input.existing_handoff_packet_or_capsule);
  const evidenceRefs = publicSafeRefs([
    ...(selectedRecord?.evidence_refs ?? []),
    ...entries.flatMap((entry) => entry.evidence_refs),
  ]);
  const missingEvidence: string[] = [];
  const blockers: string[] = [];
  const refusals: string[] = [];
  const insufficientData: string[] = [];

  if (!sourceRefs.length) missingEvidence.push("source_refs_missing");
  if (!evidenceRefs.length) missingEvidence.push("evidence_refs_missing");
  if (!requestedOperatorRef) missingEvidence.push("requested_operator_ref_missing");
  if (!requestedIdempotencyKey) missingEvidence.push("requested_idempotency_key_missing");
  if (!reviewConfirmationRef) missingEvidence.push("review_confirmation_ref_missing");

  if (!isPublicSafeRefArray(input.source_refs ?? [])) {
    refusals.push("unsafe_source_refs_refused");
  }
  for (const [label, value] of [
    ["requested_operator_ref", input.requested_operator_ref],
    ["requested_idempotency_key", input.requested_idempotency_key],
    ["review_confirmation_ref", input.review_confirmation_ref],
  ] as const) {
    if (typeof value === "string" && !safeRef(value)) {
      refusals.push(`${label}_unsafe`);
    }
  }

  if (!review) {
    insufficientData.push("handoff_context_update_contract_record_review_missing");
  } else if (!isUsableReview(review)) {
    blockers.push(...reviewBlockers(review));
  }
  if (review?.evidence_summary?.has_receipt_side_effect_problem === true) {
    blockers.push("handoff_context_update_contract_receipt_side_effect_invalid");
  }
  if (!selectedRecord) {
    insufficientData.push("handoff_context_update_contract_record_missing");
  }
  if (selectedRecord && entries.length === 0) {
    blockers.push("handoff_context_update_contract_entries_missing");
  }
  if (entries.some((entry) => !isContractEntryLike(entry))) {
    blockers.push("handoff_context_update_contract_entries_malformed");
  }
  if (existingHandoffUnsafe) {
    refusals.push("raw_or_private_existing_handoff_material_refused");
  }
  if (input.current_working_perspective_route_integration_read && !routeRead) {
    blockers.push("current_working_perspective_route_integration_read_malformed");
  }
  if (routeRead && !hasRouteIntegrationReadOnlyAuthority(routeRead)) {
    blockers.push("current_working_perspective_route_integration_read_authority_invalid");
  }
  if (input.current_working_perspective_route_integration_read_review && !routeReadReview) {
    blockers.push("current_working_perspective_route_integration_read_review_malformed");
  }
  if (routeReadReview?.review_status === "integration_invalid") {
    blockers.push("current_working_perspective_route_integration_read_review_invalid");
  }

  const applied = selectedRecord && entries.length > 0
    ? buildAppliedHandoffContext({
        record: selectedRecord,
        asOf,
        sourceRefs,
        evidenceRefs,
        previousContextSummary: summarizePreviousContext(
          input.current_handoff_context_read ??
            input.existing_handoff_packet_or_capsule,
        ),
      })
    : null;
  const plan = buildApplyPlan(selectedRecord, applied);
  const allBlockers = uniqueCandidateIngressStringsV01(blockers);
  const allMissingEvidence = uniqueCandidateIngressStringsV01(missingEvidence);
  const allRefusals = uniqueCandidateIngressStringsV01(refusals);
  const allInsufficientData = uniqueCandidateIngressStringsV01(insufficientData);
  const ready =
    Boolean(applied) &&
    allBlockers.length === 0 &&
    allMissingEvidence.length === 0 &&
    allRefusals.length === 0 &&
    allInsufficientData.length === 0;
  const status = determineStatus({
    ready,
    review,
    selectedRecord,
    applied,
    blockers: allBlockers,
    refusals: allRefusals,
    missingEvidence: allMissingEvidence,
    insufficientData: allInsufficientData,
  });
  const recommendedNextAction = recommendedAction(status);
  const sectionCounts = applied?.handoff_sections
    ? countEntriesBySection(applied.applied_entries)
    : {};

  return {
    preview_version: HANDOFF_CONTEXT_APPLY_PREVIEW_VERSION,
    scope: HANDOFF_CONTEXT_APPLY_SCOPE,
    as_of: asOf,
    source_refs: sourceRefs,
    apply_preview_status: status,
    recommended_next_action: recommendedNextAction,
    input_summary: {
      has_contract_record_review: Boolean(review),
      has_contract_record: Boolean(selectedRecord),
      has_current_handoff_context: input.current_handoff_context_read !== undefined,
      has_existing_handoff_packet_or_capsule:
        input.existing_handoff_packet_or_capsule !== undefined,
      has_route_integration_read: Boolean(routeRead),
      has_route_integration_read_review: Boolean(routeReadReview),
      proposed_entry_count: entries.length,
      blocker_count: allBlockers.length,
      missing_evidence_count: allMissingEvidence.length,
      refusal_reason_count: allRefusals.length,
      insufficient_data_reason_count: allInsufficientData.length,
      review_confirmation_supplied: Boolean(reviewConfirmationRef),
      requested_idempotency_key_supplied: Boolean(requestedIdempotencyKey),
      requested_operator_ref_supplied: Boolean(requestedOperatorRef),
    },
    source_status: {
      handoff_context_update_contract_record_review: review
        ? review.review_status === "records_invalid"
          ? "invalid"
          : review.review_status === "schema_missing"
            ? "schema_missing"
            : review.review_status === "no_records"
              ? "no_records"
              : review.review_status === "selected_record_missing"
                ? "selected_record_missing"
                : "supplied"
        : input.handoff_context_update_contract_record_review
          ? "malformed"
          : "missing",
      route_integration_read: routeRead
        ? "supplied"
        : input.current_working_perspective_route_integration_read
          ? "malformed"
          : "missing",
      existing_handoff_material: existingHandoffUnsafe
        ? "unsafe"
        : input.current_handoff_context_read !== undefined ||
            input.existing_handoff_packet_or_capsule !== undefined
          ? "supplied"
          : "missing",
    },
    apply_readiness: {
      write_ready: ready,
      readiness_label: ready ? "ready" : "not_ready",
      requires_handoff_context_update_contract_record: true,
      requires_handoff_context_entries: true,
      requires_review_confirmation: true,
      requires_idempotency_key: true,
      requires_operator_ref: true,
      requires_source_refs: true,
      requires_evidence_refs: true,
      requires_no_blockers: true,
      current_blockers: allBlockers,
      current_missing_evidence: allMissingEvidence,
      current_refusal_reasons: allRefusals,
      current_insufficient_data: allInsufficientData,
    },
    approval_requirements: [
      "operator_must_confirm_scoped_local_handoff_context_apply_record_only",
      "operator_must_confirm_no_handoff_send_copy_export_or_live_mutation",
      "operator_must_confirm_idempotency_key_and_source_evidence_refs",
    ],
    blocking_reasons: allBlockers,
    missing_evidence: allMissingEvidence,
    refusal_reasons: allRefusals,
    evidence_summary: {
      has_contract_record_review: Boolean(review),
      has_contract_record: Boolean(selectedRecord),
      has_handoff_context_entries: entries.length > 0,
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_missing_evidence: allMissingEvidence.length > 0,
      has_receipt_side_effect_problem:
        review?.evidence_summary?.has_receipt_side_effect_problem === true,
      no_live_handoff_mutation_confirmed: true,
      no_handoff_send_confirmed: true,
      no_copy_export_confirmed: true,
      source_refs: uniqueCandidateIngressStringsV01([
        ...sourceRefs,
        ...(selectedRecord?.source_refs ?? []),
      ]),
      evidence_refs: evidenceRefs,
      missing_evidence: allMissingEvidence,
      problem_record_ids: review?.evidence_summary.problem_record_ids ?? [],
    },
    source_contract_summary: {
      record_id: selectedRecord?.record_id ?? null,
      record_fingerprint: selectedRecord?.record_fingerprint ?? null,
      proposed_entry_count: entries.length,
      source_route_integration_read_ref:
        selectedRecord?.source_route_integration_read_ref ?? null,
      source_runtime_current_working_perspective_ref:
        selectedRecord?.source_runtime_current_working_perspective_ref ?? null,
      source_applied_snapshot_ref: selectedRecord?.source_applied_snapshot_ref ?? null,
    },
    current_handoff_context_summary: summarizePreviousContext(
      input.current_handoff_context_read ??
        input.existing_handoff_packet_or_capsule,
    ),
    proposed_applied_handoff_context_summary: {
      handoff_context_version: applied?.handoff_context_version ?? null,
      section_counts: sectionCounts,
      applied_entry_count: applied?.applied_entries.length ?? 0,
      source_contract_record_ref: selectedRecord?.record_id ?? null,
      copy_export_still_pending: true,
      send_still_pending: true,
    },
    proposed_applied_handoff_context: applied,
    proposed_handoff_context_apply_plan: plan,
    proposed_handoff_section_application_summary: sectionCounts,
    would_write_handoff_context_apply_record_preview: {
      record_version: "handoff_context_apply_record.v0.1",
      scope: HANDOFF_CONTEXT_APPLY_SCOPE,
      requested_operator_ref: requestedOperatorRef,
      requested_idempotency_key: requestedIdempotencyKey,
      review_confirmation_ref: reviewConfirmationRef,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      source_handoff_context_update_contract_record_ref:
        selectedRecord?.record_id ?? null,
      source_handoff_context_update_contract_record_refs:
        selectedRecord ? [selectedRecord.record_id] : [],
      source_route_integration_read_ref:
        selectedRecord?.source_route_integration_read_ref ?? null,
      source_runtime_current_working_perspective_ref:
        selectedRecord?.source_runtime_current_working_perspective_ref ?? null,
      source_applied_snapshot_ref: selectedRecord?.source_applied_snapshot_ref ?? null,
      proposed_applied_handoff_context: applied,
      proposed_handoff_context_apply_plan: plan,
    },
    operator_review_checklist: [
      "confirm_apply_uses_only_valid_handoff_context_update_contract_entries",
      "confirm_applied_handoff_context_snapshot_is_local_only",
      "confirm_no_handoff_send_copy_export_or_live_handoff_mutation",
      "confirm_memory_metrics_routes_cwp_relay_and_external_systems_are_not_written",
    ],
    would_not_write: [
      "does_not_send_handoff",
      "does_not_copy_or_export_handoff_packet",
      "does_not_write_selected_refs_to_live_handoff",
      "does_not_mutate_live_handoff_context",
      "does_not_mutate_cwp_route_or_upstream_source_tables",
      "does_not_write_memory_metrics_or_external_systems",
    ],
    non_goals: [
      "no_handoff_send",
      "no_handoff_packet_copy_export",
      "no_live_handoff_context_mutation",
      "no_memory_metric_route_relay_or_external_write",
    ],
    authority_boundary: createHandoffContextApplyPreviewAuthorityBoundaryV01(),
  };
}

function buildAppliedHandoffContext({
  record,
  asOf,
  sourceRefs,
  evidenceRefs,
  previousContextSummary,
}: {
  record: HandoffContextUpdateContractRecord;
  asOf: string;
  sourceRefs: string[];
  evidenceRefs: string[];
  previousContextSummary: AppliedHandoffContext["previous_context_summary"];
}): AppliedHandoffContext {
  const appliedEntries = record.proposed_handoff_context_entries.map(
    (entry, index): AppliedHandoffContextEntry => ({
      applied_entry_ref: `applied-handoff-context-entry:${fingerprint([
        record.record_id,
        entry.entry_ref,
        String(index),
      ]).slice(0, 16)}`,
      source_contract_entry_ref: entry.entry_ref,
      handoff_section: normalizeSection(entry.handoff_section),
      entry_kind: normalizeEntryKind(entry.entry_kind),
      summary: sanitizeSummary(entry.summary) || "Handoff context entry",
      source_record_refs: publicSafeRefs(entry.source_record_refs),
      source_refs: publicSafeRefs([...sourceRefs, ...entry.source_refs]),
      evidence_refs: publicSafeRefs([...evidenceRefs, ...entry.evidence_refs]),
      review_pressure: sanitizeSummary(entry.review_pressure) || "operator_review",
      applied_status: "applied_to_local_handoff_context_snapshot",
      persistence_horizon: "local_project_handoff_context_apply_store",
    }),
  );
  const handoffSections = emptySectionMap();
  for (const entry of appliedEntries) {
    handoffSections[entry.handoff_section].push(entry);
  }
  return {
    handoff_context_version: "applied_handoff_context.v0.1",
    scope: HANDOFF_CONTEXT_APPLY_SCOPE,
    as_of: asOf,
    source_contract_record_ref: record.record_id,
    source_handoff_context_update_contract_record_refs: [record.record_id],
    source_route_integration_read_ref: record.source_route_integration_read_ref,
    source_runtime_current_working_perspective_ref:
      record.source_runtime_current_working_perspective_ref,
    source_applied_snapshot_ref: record.source_applied_snapshot_ref,
    source_refs: uniqueCandidateIngressStringsV01([
      ...sourceRefs,
      ...record.source_refs,
    ]),
    evidence_refs: uniqueCandidateIngressStringsV01([
      ...evidenceRefs,
      ...record.evidence_refs,
    ]),
    handoff_sections: handoffSections,
    applied_entries: appliedEntries,
    previous_context_summary: previousContextSummary,
    apply_metadata: {
      local_snapshot_only: true,
      does_not_send_handoff: true,
      does_not_write_live_packet: true,
      future_copy_export_required: true,
      future_send_required: true,
    },
    authority_boundary: createHandoffContextApplyPreviewAuthorityBoundaryV01(),
  };
}

function buildApplyPlan(
  record: HandoffContextUpdateContractRecord | null,
  applied: AppliedHandoffContext | null,
): HandoffContextApplyPlan {
  const sectionCounts = applied ? countEntriesBySection(applied.applied_entries) : {};
  return {
    plan_version: "handoff_context_apply_plan.v0.1",
    source_contract_record_ref: record?.record_id ?? null,
    entry_count: applied?.applied_entries.length ?? 0,
    section_counts: sectionCounts,
    applied_entry_refs: applied?.applied_entries.map((entry) => entry.applied_entry_ref) ?? [],
    preserves_previous_context_as_previous_context_only: true,
    no_handoff_send_or_copy_export: true,
    no_live_handoff_context_mutation: true,
    future_copy_export_required: true,
    future_send_required: true,
  };
}

function parseContractReview(
  value: unknown,
): HandoffContextUpdateContractRecordReview | null {
  if (!isRecord(value)) return null;
  if (value.review_version !== HANDOFF_CONTEXT_UPDATE_CONTRACT_RECORD_REVIEW_VERSION) {
    return null;
  }
  return value as unknown as HandoffContextUpdateContractRecordReview;
}

function parseRouteIntegrationRead(
  value: unknown,
): CurrentWorkingPerspectiveRouteIntegrationRead | null {
  if (!isRecord(value)) return null;
  if (value.read_version !== CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_VERSION) {
    return null;
  }
  return value as unknown as CurrentWorkingPerspectiveRouteIntegrationRead;
}

function parseRouteIntegrationReadReview(
  value: unknown,
): CurrentWorkingPerspectiveRouteIntegrationReadReview | null {
  if (!isRecord(value)) return null;
  if (
    value.review_version !==
    CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_REVIEW_VERSION
  ) {
    return null;
  }
  return value as unknown as CurrentWorkingPerspectiveRouteIntegrationReadReview;
}

function isUsableReview(review: HandoffContextUpdateContractRecordReview): boolean {
  return (
    usableReviewStatuses.has(review.review_status) &&
    review.input_summary.valid_record_count > 0 &&
    review.records.length > 0 &&
    review.evidence_summary.has_receipt_side_effect_problem !== true
  );
}

function reviewBlockers(review: HandoffContextUpdateContractRecordReview): string[] {
  const reasons: string[] = [];
  if (review.review_status === "records_invalid") {
    reasons.push("handoff_context_update_contract_record_review_invalid");
  }
  if (review.review_status === "schema_missing") {
    reasons.push("handoff_context_update_contract_record_review_schema_missing");
  }
  if (review.review_status === "no_records") {
    reasons.push("handoff_context_update_contract_record_review_no_records");
  }
  if (review.review_status === "selected_record_missing") {
    reasons.push("handoff_context_update_contract_record_review_selected_record_missing");
  }
  if (review.input_summary.valid_record_count <= 0 || review.records.length === 0) {
    reasons.push("handoff_context_update_contract_record_review_valid_records_missing");
  }
  return reasons;
}

function selectContractRecord({
  review,
  directRecord,
}: {
  review: HandoffContextUpdateContractRecordReview | null;
  directRecord: HandoffContextUpdateContractRecord | null;
}): HandoffContextUpdateContractRecord | null {
  if (directRecord) return directRecord;
  if (!review?.records?.length) return null;
  const selectedId = review.selected_record_summary?.record_id ?? null;
  if (selectedId) {
    return review.records.find((record) => record.record_id === selectedId) ?? null;
  }
  const latestId = review.latest_record_summary?.record_id ?? null;
  if (latestId) {
    return review.records.find((record) => record.record_id === latestId) ?? null;
  }
  return review.records
    .slice()
    .sort((a, b) =>
      `${b.created_at}:${b.record_id}`.localeCompare(`${a.created_at}:${a.record_id}`),
    )[0] ?? null;
}

function isContractRecord(value: unknown): value is HandoffContextUpdateContractRecord {
  if (!isRecord(value)) return false;
  return (
    value.record_version === HANDOFF_CONTEXT_UPDATE_CONTRACT_RECORD_VERSION &&
    value.scope === HANDOFF_CONTEXT_UPDATE_CONTRACT_WRITE_SCOPE &&
    typeof value.record_id === "string" &&
    Array.isArray(value.proposed_handoff_context_entries)
  );
}

function isContractEntryLike(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.entry_ref === "string" &&
    handoffSections.includes(normalizeSection(value.handoff_section)) &&
    validEntryKinds.has(normalizeEntryKind(value.entry_kind)) &&
    typeof value.summary === "string" &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs)
  );
}

function hasRouteIntegrationReadOnlyAuthority(
  read: CurrentWorkingPerspectiveRouteIntegrationRead,
): boolean {
  const authority = read.authority_boundary;
  return Boolean(
    authority?.read_only === true &&
      authority.can_write_db === false &&
      authority.can_create_schema === false &&
      authority.can_modify_api_perspective_current_route === false &&
      authority.can_replace_current_working_perspective_route_response === false &&
      authority.can_mutate_handoff_context === false &&
      authority.can_send_handoff === false &&
      authority.can_write_memory === false &&
      authority.can_call_github === false &&
      authority.can_call_provider_openai === false &&
      authority.can_execute_codex === false,
  );
}

function summarizePreviousContext(
  value: unknown,
): AppliedHandoffContext["previous_context_summary"] {
  if (!value || containsRawOrPrivateMarkers(value)) {
    return {
      supplied: Boolean(value),
      preserved_as_previous_context_only: true,
      summary: value ? "Unsafe previous handoff material was refused." : null,
      source_refs: [],
    };
  }
  const record = isRecord(value) ? value : null;
  return {
    supplied: true,
    preserved_as_previous_context_only: true,
    summary:
      sanitizeSummary(record?.summary) ||
      sanitizeSummary(record?.title) ||
      "Previous handoff material supplied and preserved only as previous context.",
    source_refs: publicSafeRefs(
      Array.isArray(record?.source_refs) ? record.source_refs : [],
    ),
  };
}

function determineStatus({
  ready,
  review,
  selectedRecord,
  applied,
  blockers,
  refusals,
  missingEvidence,
  insufficientData,
}: {
  ready: boolean;
  review: HandoffContextUpdateContractRecordReview | null;
  selectedRecord: HandoffContextUpdateContractRecord | null;
  applied: AppliedHandoffContext | null;
  blockers: string[];
  refusals: string[];
  missingEvidence: string[];
  insufficientData: string[];
}): HandoffContextApplyPreviewStatus {
  if (ready) return "ready_for_future_handoff_context_apply_record_write";
  if (!review) return "no_handoff_context_update_contract_record";
  if (!selectedRecord || !applied) return "no_handoff_context_apply_material";
  if (refusals.length || blockers.length) return "blocked";
  if (missingEvidence.length) return "needs_more_evidence";
  if (insufficientData.length) return "insufficient_data";
  return "ready_for_operator_review";
}

function recommendedAction(
  status: HandoffContextApplyPreviewStatus,
): HandoffContextApplyRecommendedNextAction {
  if (status === "ready_for_future_handoff_context_apply_record_write") {
    return "write_handoff_context_apply_record";
  }
  if (status === "no_handoff_context_update_contract_record") {
    return "supply_handoff_context_update_contract_record";
  }
  if (status === "blocked" || status === "needs_more_evidence") {
    return "resolve_handoff_context_apply_blockers";
  }
  if (status === "ready_for_operator_review") {
    return "review_handoff_context_apply_preview";
  }
  return "keep_preview_only";
}

function emptySectionMap(): Record<AppliedHandoffContextSection, AppliedHandoffContextEntry[]> {
  return handoffSections.reduce(
    (acc, section) => {
      acc[section] = [];
      return acc;
    },
    {} as Record<AppliedHandoffContextSection, AppliedHandoffContextEntry[]>,
  );
}

function countEntriesBySection(
  entries: AppliedHandoffContextEntry[],
): Record<string, number> {
  return entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.handoff_section] = (acc[entry.handoff_section] ?? 0) + 1;
    return acc;
  }, {});
}

function normalizeSection(value: unknown): AppliedHandoffContextSection {
  return handoffSections.includes(value as AppliedHandoffContextSection)
    ? (value as AppliedHandoffContextSection)
    : "blocked_or_missing_context_section";
}

function normalizeEntryKind(value: unknown): AppliedHandoffContextEntryKind {
  return validEntryKinds.has(value as AppliedHandoffContextEntryKind)
    ? (value as AppliedHandoffContextEntryKind)
    : "review_required";
}

function publicSafeRefs(values: unknown[]): string[] {
  return uniqueCandidateIngressStringsV01(values).filter(
    isCandidateIngressPublicSafeRefV01,
  );
}

function safeRef(value: unknown): string | null {
  return isCandidateIngressPublicSafeRefV01(value) ? value : null;
}

function isPublicSafeRefArray(values: unknown[]): boolean {
  return values.every(isCandidateIngressPublicSafeRefV01);
}

function sanitizeSummary(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed || containsCandidateIngressUnsafeMarkerV01(trimmed)) return "";
  return trimmed.length > 240 ? `${trimmed.slice(0, 237)}...` : trimmed;
}

function containsRawOrPrivateMarkers(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    return (
      containsCandidateIngressUnsafeMarkerV01(value) ||
      /\b(raw_text|raw_report|raw_excerpt)\b/i.test(value)
    );
  }
  if (Array.isArray(value)) return value.some(containsRawOrPrivateMarkers);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(
    ([key, entry]) =>
      ["raw_text", "raw_report", "raw_excerpt"].includes(key) ||
      containsRawOrPrivateMarkers(entry),
  );
}

function fingerprint(value: unknown): string {
  const json = JSON.stringify(value);
  let hash = 0;
  for (let index = 0; index < json.length; index += 1) {
    hash = (hash * 31 + json.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
