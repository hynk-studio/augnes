import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  HANDOFF_CONTEXT_UPDATE_CONTRACT_PREVIEW_VERSION,
  HANDOFF_CONTEXT_UPDATE_CONTRACT_SCOPE,
  type HandoffContextEntryKind,
  type HandoffContextSection,
  type HandoffContextUpdateContractAuthorityBoundary,
  type HandoffContextUpdateContractEntry,
  type HandoffContextUpdateContractMaterial,
  type HandoffContextUpdateContractPreview,
  type HandoffContextUpdateContractPreviewInput,
  type HandoffContextUpdateContractPreviewStatus,
  type HandoffContextUpdateContractReadiness,
  type HandoffContextUpdateContractRecommendedNextAction,
  type HandoffContextUpdateMode,
} from "@/types/handoff-context-update-contract-preview";
import type { CurrentWorkingPerspectiveRouteIntegrationRead } from "@/types/current-working-perspective-route-integration-read";
import {
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_REVIEW_VERSION,
  type CurrentWorkingPerspectiveRouteIntegrationReadReview,
} from "@/types/current-working-perspective-route-integration-read-review";
import { CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECORD_REVIEW_VERSION } from "@/types/current-working-perspective-route-integration-contract-record-review";
import { CURRENT_WORKING_PERSPECTIVE_APPLY_RECORD_REVIEW_VERSION } from "@/types/current-working-perspective-apply-record-review";
import { CONTINUITY_RELAY_RECORD_REVIEW_VERSION } from "@/types/continuity-relay-record-review";
import { PERSPECTIVE_UNIT_RECORD_REVIEW_VERSION } from "@/types/perspective-unit-record-review";
import { PERSPECTIVE_NEXT_WORK_BIAS_RECORD_REVIEW_VERSION } from "@/types/perspective-next-work-bias-record-review";

type RecordValue = Record<string, unknown>;
type GenericReview = RecordValue & {
  review_status?: string;
  input_summary?: RecordValue;
  evidence_summary?: RecordValue;
  latest_record_summary?: RecordValue | null;
  records?: unknown[];
  source_refs?: string[];
};

const routeIntegrationReadyStatuses = new Set([
  "runtime_with_applied_snapshot_hint",
  "runtime_with_applied_snapshot_overlay_candidate",
  "applied_snapshot_preferred_with_runtime_fallback",
]);

const modes: HandoffContextUpdateMode[] = [
  "route_integrated_cwp_summary",
  "handoff_packet_update_candidate",
  "codex_handoff_context_candidate",
  "keep_existing_handoff_context",
];

const sections: HandoffContextSection[] = [
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

export function buildHandoffContextUpdateContractPreviewV01({
  current_working_perspective_route_integration_read,
  current_working_perspective_route_integration_read_review,
  current_working_perspective_route_integration_contract_record_review,
  current_working_perspective_apply_record_review,
  continuity_relay_record_review,
  perspective_unit_record_review,
  perspective_next_work_bias_record_review,
  existing_handoff_context_read,
  existing_handoff_packet_or_capsule,
  requested_handoff_context_mode,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
  as_of,
  source_refs,
}: HandoffContextUpdateContractPreviewInput = {}):
  HandoffContextUpdateContractPreview {
  const routeRead = isRouteIntegrationRead(
    current_working_perspective_route_integration_read,
  )
    ? current_working_perspective_route_integration_read
    : null;
  const routeReadReview = isRouteIntegrationReadReview(
    current_working_perspective_route_integration_read_review,
  );
  const routeContractReview = isGenericReview(
    current_working_perspective_route_integration_contract_record_review,
    CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_RECORD_REVIEW_VERSION,
  );
  const applyReview = isGenericReview(
    current_working_perspective_apply_record_review,
    CURRENT_WORKING_PERSPECTIVE_APPLY_RECORD_REVIEW_VERSION,
  );
  const continuityReview = isGenericReview(
    continuity_relay_record_review,
    CONTINUITY_RELAY_RECORD_REVIEW_VERSION,
  );
  const perspectiveUnitReview = isGenericReview(
    perspective_unit_record_review,
    PERSPECTIVE_UNIT_RECORD_REVIEW_VERSION,
  );
  const nextWorkBiasReview = isGenericReview(
    perspective_next_work_bias_record_review,
    PERSPECTIVE_NEXT_WORK_BIAS_RECORD_REVIEW_VERSION,
  );
  const mode =
    requested_handoff_context_mode && modes.includes(requested_handoff_context_mode)
      ? requested_handoff_context_mode
      : null;
  const now = as_of ?? routeRead?.as_of ?? new Date().toISOString();
  const requestedSourceRefs = uniqueCandidateIngressStringsV01(source_refs ?? []);
  const evidenceRefs = uniqueCandidateIngressStringsV01([
    ...safeStringArray(routeRead?.evidence_refs),
    ...reviewEvidenceRefs(routeContractReview),
    ...reviewEvidenceRefs(applyReview),
    ...reviewEvidenceRefs(continuityReview),
    ...reviewEvidenceRefs(perspectiveUnitReview),
    ...reviewEvidenceRefs(nextWorkBiasReview),
  ]);
  const sourceRefs = uniqueCandidateIngressStringsV01([
    ...requestedSourceRefs,
    ...safeStringArray(routeRead?.source_refs),
    ...safeStringArray(routeReadReview?.source_refs),
    ...reviewSourceRefs(routeContractReview),
    ...reviewSourceRefs(applyReview),
    ...reviewSourceRefs(continuityReview),
    ...reviewSourceRefs(perspectiveUnitReview),
    ...reviewSourceRefs(nextWorkBiasReview),
    ...evidenceRefs,
  ]);
  const runtimeCwp = routeRead?.runtime_current_working_perspective ?? null;
  const primaryCwp = routeRead?.primary_current_working_perspective ?? null;
  const appliedParticipates = Boolean(routeRead?.applied_current_working_perspective);
  const routeReadRef = routeRead
    ? `current-working-perspective-route-integration-read:${fingerprint({
        status: routeRead.status,
        mode: routeRead.response_mode,
        as_of: routeRead.as_of,
      }).slice(0, 16)}`
    : null;
  const existingHandoffMaterial =
    existing_handoff_context_read ?? existing_handoff_packet_or_capsule ?? null;
  const suppliedRefs = [
    ...sourceRefs,
    ...evidenceRefs,
    ...(requested_operator_ref ? [requested_operator_ref] : []),
    ...(requested_idempotency_key ? [requested_idempotency_key] : []),
    ...(review_confirmation_ref ? [review_confirmation_ref] : []),
  ];
  const unsafeRefs = suppliedRefs.filter(
    (ref) => !isCandidateIngressPublicSafeRefV01(ref),
  );

  const blockingReasons = uniqueCandidateIngressStringsV01([
    ...(isSupplied(current_working_perspective_route_integration_read) && !routeRead
      ? ["current_working_perspective_route_integration_read_malformed"]
      : []),
    ...(routeRead && !routeIntegrationReadyStatuses.has(routeRead.status)
      ? routeRead.status === "runtime_only"
        ? ["current_working_perspective_route_integration_read_runtime_only_not_writable"]
        : ["current_working_perspective_route_integration_read_not_ready"]
      : []),
    ...(routeRead && appliedParticipates && !runtimeCwp
      ? ["runtime_fallback_missing_for_applied_snapshot_participation"]
      : []),
    ...(routeRead && !hasExpectedRouteReadAuthority(routeRead.authority_boundary)
      ? ["current_working_perspective_route_integration_read_authority_boundary_invalid"]
      : []),
    ...(isSupplied(current_working_perspective_route_integration_read_review) &&
    !routeReadReview
      ? ["current_working_perspective_route_integration_read_review_malformed"]
      : []),
    ...(routeReadReview?.review_status === "integration_invalid"
      ? ["current_working_perspective_route_integration_read_review_invalid"]
      : []),
    ...(isSupplied(current_working_perspective_route_integration_contract_record_review) &&
    !routeContractReview
      ? [
          "current_working_perspective_route_integration_contract_record_review_malformed",
        ]
      : []),
    ...reviewBlockingReasons(
      routeContractReview,
      "current_working_perspective_route_integration_contract_record_review",
    ),
    ...(isSupplied(current_working_perspective_apply_record_review) &&
    !applyReview
      ? ["current_working_perspective_apply_record_review_malformed"]
      : []),
    ...reviewBlockingReasons(
      applyReview,
      "current_working_perspective_apply_record_review",
    ),
    ...(isSupplied(continuity_relay_record_review) && !continuityReview
      ? ["continuity_relay_record_review_malformed"]
      : []),
    ...reviewBlockingReasons(continuityReview, "continuity_relay_record_review"),
    ...(isSupplied(perspective_unit_record_review) && !perspectiveUnitReview
      ? ["perspective_unit_record_review_malformed"]
      : []),
    ...reviewBlockingReasons(perspectiveUnitReview, "perspective_unit_record_review"),
    ...(isSupplied(perspective_next_work_bias_record_review) && !nextWorkBiasReview
      ? ["perspective_next_work_bias_record_review_malformed"]
      : []),
    ...reviewBlockingReasons(
      nextWorkBiasReview,
      "perspective_next_work_bias_record_review",
    ),
    ...(mode === "keep_existing_handoff_context"
      ? ["requested_handoff_context_mode_keep_existing_not_writable"]
      : []),
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...(requestedSourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(evidenceRefs.length === 0 ? ["evidence_refs_missing"] : []),
    ...reviewMissingEvidence(routeContractReview),
    ...reviewMissingEvidence(applyReview),
    ...reviewMissingEvidence(continuityReview),
    ...reviewMissingEvidence(perspectiveUnitReview),
    ...reviewMissingEvidence(nextWorkBiasReview),
  ]);
  const refusalReasons = uniqueCandidateIngressStringsV01([
    ...(unsafeRefs.length > 0 ? ["handoff_context_update_contract_refs_unsafe"] : []),
    ...(requested_handoff_context_mode && !mode
      ? ["requested_handoff_context_mode_unsupported"]
      : []),
    ...(containsRawOrPrivateMarkers(existingHandoffMaterial)
      ? ["existing_handoff_material_raw_or_private_refused"]
      : []),
  ]);
  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(!routeRead
      ? ["current_working_perspective_route_integration_read_missing"]
      : []),
    ...(!routeReadReview
      ? ["current_working_perspective_route_integration_read_review_missing"]
      : []),
    ...(!mode ? ["requested_handoff_context_mode_missing"] : []),
    ...(!requested_operator_ref ? ["requested_operator_ref_missing"] : []),
    ...(!requested_idempotency_key ? ["requested_idempotency_key_missing"] : []),
    ...(!review_confirmation_ref ? ["review_confirmation_ref_missing"] : []),
  ]);

  const entries = buildEntries({
    routeRead,
    mode,
    sourceRefs,
    evidenceRefs,
    continuityReview,
    perspectiveUnitReview,
    nextWorkBiasReview,
  });
  const contract =
    routeRead && mode
      ? buildContract({
          routeRead,
          routeReadRef,
          mode,
          entries,
          sourceRefs,
          evidenceRefs,
          existingHandoffMaterial,
          routeContractReview,
          applyReview,
          continuityReview,
          perspectiveUnitReview,
          nextWorkBiasReview,
        })
      : null;
  const ready =
    Boolean(routeRead && routeReadReview && contract && mode) &&
    routeIntegrationReadyStatuses.has(routeRead?.status ?? "") &&
    mode !== "keep_existing_handoff_context" &&
    Boolean(runtimeCwp) &&
    Boolean(requested_operator_ref) &&
    Boolean(requested_idempotency_key) &&
    Boolean(review_confirmation_ref) &&
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    refusalReasons.length === 0 &&
    insufficientData.length === 0;
  const status = determineStatus({
    routeRead,
    contract,
    ready,
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
    mode,
  });
  const readiness = createReadiness({
    ready,
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });
  const runtimeFrame = summarizeCurrentFrame(primaryCwp ?? runtimeCwp);
  const runtimeThesis = summarizeCurrentThesis(primaryCwp ?? runtimeCwp);

  return {
    preview_version: HANDOFF_CONTEXT_UPDATE_CONTRACT_PREVIEW_VERSION,
    scope: HANDOFF_CONTEXT_UPDATE_CONTRACT_SCOPE,
    as_of: now,
    source_refs: sourceRefs,
    contract_preview_status: status,
    recommended_next_action: recommendedAction(status),
    input_summary: {
      has_route_integration_read: Boolean(routeRead),
      has_route_integration_read_review: Boolean(routeReadReview),
      has_route_integration_contract_record_review: Boolean(routeContractReview),
      has_cwp_apply_record_review: Boolean(applyReview),
      has_continuity_relay_record_review: Boolean(continuityReview),
      has_perspective_unit_record_review: Boolean(perspectiveUnitReview),
      has_next_work_bias_record_review: Boolean(nextWorkBiasReview),
      has_existing_handoff_material: Boolean(existingHandoffMaterial),
      requested_handoff_context_mode: mode,
      proposed_entry_count: entries.length,
      blocker_count: blockingReasons.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusalReasons.length,
      insufficient_data_reason_count: insufficientData.length,
      review_confirmation_supplied: Boolean(review_confirmation_ref),
      requested_idempotency_key_supplied: Boolean(requested_idempotency_key),
      requested_operator_ref_supplied: Boolean(requested_operator_ref),
    },
    source_status: {
      current_working_perspective_route_integration_read: routeRead
        ? routeRead.status === "runtime_only"
          ? "runtime_only"
          : "supplied"
        : isSupplied(current_working_perspective_route_integration_read)
          ? "malformed"
          : "missing",
      current_working_perspective_route_integration_read_review: routeReadReview
        ? routeReadReview.review_status === "integration_invalid"
          ? "invalid"
          : "supplied"
        : isSupplied(current_working_perspective_route_integration_read_review)
          ? "malformed"
          : "missing",
      requested_handoff_context_mode: mode
        ? mode === "keep_existing_handoff_context"
          ? "keep_existing_handoff_context"
          : "supplied"
        : "missing",
      review_confirmation_ref: refStatus(review_confirmation_ref),
      requested_idempotency_key: refStatus(requested_idempotency_key),
      requested_operator_ref: refStatus(requested_operator_ref),
    },
    contract_readiness: readiness,
    approval_requirements: [
      "confirm_handoff_context_update_contract_is_scoped_local_only",
      "confirm_no_handoff_apply_or_send_by_this_slice",
      "confirm_no_selected_refs_are_written_to_live_handoff",
      "confirm_route_cwp_snapshot_memory_metrics_and_external_systems_are_not_mutated",
    ],
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_route_integration_read: Boolean(routeRead),
      has_runtime_fallback: Boolean(runtimeCwp),
      has_applied_snapshot_participation: appliedParticipates,
      has_route_integration_read_review: Boolean(routeReadReview),
      has_route_integration_contract_record_review: Boolean(routeContractReview),
      has_scoped_record_context: Boolean(
        continuityReview || perspectiveUnitReview || nextWorkBiasReview,
      ),
      has_source_refs: requestedSourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_missing_evidence: missingEvidence.length > 0,
      has_refusal_reasons: refusalReasons.length > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
    },
    route_integrated_current_working_perspective_summary: {
      read_ref: routeReadRef,
      status: routeRead?.status ?? null,
      response_mode: routeRead?.response_mode ?? null,
      runtime_cwp_ref:
        routeRead?.runtime_current_working_perspective_summary.cwp_ref ?? null,
      applied_snapshot_ref:
        routeRead?.applied_snapshot_metadata.applied_snapshot_ref ?? null,
      current_frame_summary: runtimeFrame,
      current_thesis_summary: runtimeThesis,
      active_goal_count: arrayLength(
        (primaryCwp ?? runtimeCwp)?.active_goals,
      ),
      next_candidate_count: arrayLength(
        (primaryCwp ?? runtimeCwp)?.next_candidates,
      ),
      open_question_count: arrayLength(
        (primaryCwp ?? runtimeCwp)?.open_questions,
      ),
      active_risk_count: arrayLength((primaryCwp ?? runtimeCwp)?.active_risks),
    },
    existing_handoff_context_summary: {
      supplied: Boolean(existingHandoffMaterial),
      material_ref: existingHandoffMaterial
        ? `existing-handoff-material:${fingerprint(existingHandoffMaterial).slice(0, 16)}`
        : null,
      summary: summarizeExistingHandoff(existingHandoffMaterial),
      treated_as_previous_context_only: true,
    },
    proposed_handoff_context_update_contract: contract,
    would_write_handoff_context_update_contract_record_preview: {
      record_version: "handoff_context_update_contract_record.v0.1",
      scope: HANDOFF_CONTEXT_UPDATE_CONTRACT_SCOPE,
      requested_operator_ref: requested_operator_ref ?? null,
      requested_idempotency_key: requested_idempotency_key ?? null,
      review_confirmation_ref: review_confirmation_ref ?? null,
      source_refs: sourceRefs,
      evidence_refs: contract?.required_evidence_refs ?? evidenceRefs,
      source_route_integration_read_ref: contract?.source_route_integration_read_ref ?? null,
      source_runtime_current_working_perspective_ref:
        contract?.source_runtime_current_working_perspective_ref ?? null,
      source_applied_snapshot_ref: contract?.source_applied_snapshot_ref ?? null,
      source_route_integration_contract_record_refs:
        contract?.source_route_integration_contract_record_refs ?? [],
      source_cwp_apply_record_refs: contract?.source_cwp_apply_record_refs ?? [],
      source_continuity_relay_record_refs:
        contract?.source_continuity_relay_record_refs ?? [],
      source_perspective_unit_record_refs:
        contract?.source_perspective_unit_record_refs ?? [],
      source_next_work_bias_record_refs:
        contract?.source_next_work_bias_record_refs ?? [],
      proposed_handoff_context_update_contract: contract,
      proposed_handoff_context_entries: entries,
    },
    operator_review_checklist: [
      "confirm_route_integrated_cwp_read_has_runtime_fallback",
      "confirm_handoff_sections_are_source_refed_and_bounded",
      "confirm_existing_handoff_material_is_previous_context_only",
      "confirm_future_apply_slice_is_required_before any live handoff update",
    ],
    would_not_write: [
      "does_not_apply_handoff_context",
      "does_not_send_handoff",
      "does_not_write_selected_refs_to_live_handoff",
      "does_not_mutate_api_perspective_current_or_upstream_cwp_sources",
      "does_not_write_memory_metrics_ledgers_or_external_systems",
    ],
    non_goals: [
      "no_live_handoff_context_update",
      "no_handoff_packet_send_or_copy_export",
      "no_cwp_route_or_snapshot_mutation",
      "no_perspective_unit_next_work_bias_continuity_relay_write",
    ],
    authority_boundary: createHandoffContextUpdateContractPreviewAuthorityBoundaryV01(),
  };
}

export function createHandoffContextUpdateContractPreviewAuthorityBoundaryV01():
  HandoffContextUpdateContractAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    contract_material_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_handoff_context_update_contract_record: false,
    can_apply_handoff_context_update: false,
    can_mutate_handoff_context: false,
    can_send_handoff: false,
    can_write_selected_refs_to_live_handoff: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
    can_write_route_integration_contract_record: false,
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
      "Preview builds handoff update contract material only.",
      "It cannot apply or send handoff context, write selected refs to live handoff, mutate CWP route state, memory, metrics, or external systems.",
    ],
  };
}

function buildContract({
  routeRead,
  routeReadRef,
  mode,
  entries,
  sourceRefs,
  evidenceRefs,
  existingHandoffMaterial,
  routeContractReview,
  applyReview,
  continuityReview,
  perspectiveUnitReview,
  nextWorkBiasReview,
}: {
  routeRead: CurrentWorkingPerspectiveRouteIntegrationRead;
  routeReadRef: string | null;
  mode: HandoffContextUpdateMode;
  entries: HandoffContextUpdateContractEntry[];
  sourceRefs: string[];
  evidenceRefs: string[];
  existingHandoffMaterial: unknown;
  routeContractReview: GenericReview | null;
  applyReview: GenericReview | null;
  continuityReview: GenericReview | null;
  perspectiveUnitReview: GenericReview | null;
  nextWorkBiasReview: GenericReview | null;
}): HandoffContextUpdateContractMaterial {
  const sectioned = Object.fromEntries(
    sections.map((section) => [
      section,
      entries.filter((entry) => entry.handoff_section === section),
    ]),
  ) as Record<HandoffContextSection, HandoffContextUpdateContractEntry[]>;
  return {
    contract_kind: "handoff_context_update_contract.v0.1",
    handoff_context_family: "augnes_operator_handoff_context",
    source_route_integration_read_ref: routeReadRef,
    source_route_integration_status: routeRead.status,
    source_route_integration_response_mode: routeRead.response_mode,
    source_runtime_current_working_perspective_ref:
      routeRead.runtime_current_working_perspective_summary.cwp_ref,
    source_applied_snapshot_ref:
      routeRead.applied_snapshot_metadata.applied_snapshot_ref,
    source_route_integration_contract_record_refs: uniqueCandidateIngressStringsV01([
      routeRead.contract_summary.record_id,
      latestRecordId(routeContractReview),
    ]),
    source_cwp_apply_record_refs: uniqueCandidateIngressStringsV01([
      routeRead.applied_snapshot_metadata.source_apply_record_ref,
      latestRecordId(applyReview),
    ]),
    source_continuity_relay_record_refs: uniqueCandidateIngressStringsV01([
      latestRecordId(continuityReview),
    ]),
    source_perspective_unit_record_refs: uniqueCandidateIngressStringsV01([
      latestRecordId(perspectiveUnitReview),
    ]),
    source_next_work_bias_record_refs: uniqueCandidateIngressStringsV01([
      latestRecordId(nextWorkBiasReview),
    ]),
    requested_handoff_context_mode: mode,
    proposed_handoff_sections: sectioned,
    proposed_handoff_context_entries: entries,
    proposed_handoff_packet_delta: {
      packet_delta_kind: "handoff_context_update_candidate",
      existing_handoff_material_ref: existingHandoffMaterial
        ? `existing-handoff-material:${fingerprint(existingHandoffMaterial).slice(0, 16)}`
        : null,
      proposed_entry_count: entries.length,
      does_not_apply_or_send: true,
    },
    required_source_refs: sourceRefs,
    required_evidence_refs: evidenceRefs,
    blocked_live_mutations: [
      "handoff_context_apply",
      "handoff_send",
      "selected_refs_live_packet_write",
      "api_perspective_current_route_mutation",
      "memory_metric_or_external_write",
    ],
    future_apply_requirements: [
      "approved_handoff_context_update_contract_record",
      "separate_handoff_context_apply_slice",
      "operator_revalidated_handoff_sections",
      "receipt_audited_no_external_side_effects",
    ],
    operator_acceptance_criteria: [
      "route integrated CWP read is valid and read-only",
      "runtime fallback remains available",
      "handoff sections are source-refed and public-safe",
      "no handoff apply or send occurs in this contract slice",
    ],
    rollback_and_fallback_plan: [
      "discard local contract record before any future apply",
      "keep existing handoff context unchanged",
      "fall back to runtime CWP route material",
    ],
  };
}

function buildEntries({
  routeRead,
  mode,
  sourceRefs,
  evidenceRefs,
  continuityReview,
  perspectiveUnitReview,
  nextWorkBiasReview,
}: {
  routeRead: CurrentWorkingPerspectiveRouteIntegrationRead | null;
  mode: HandoffContextUpdateMode | null;
  sourceRefs: string[];
  evidenceRefs: string[];
  continuityReview: GenericReview | null;
  perspectiveUnitReview: GenericReview | null;
  nextWorkBiasReview: GenericReview | null;
}): HandoffContextUpdateContractEntry[] {
  const cwp = routeRead?.primary_current_working_perspective ?? null;
  const sourceRecordRefs = uniqueCandidateIngressStringsV01([
    routeRead?.contract_summary.record_id,
    routeRead?.applied_snapshot_metadata.source_apply_record_ref,
    routeRead?.applied_snapshot_metadata.source_contract_record_ref,
  ]);
  const entries: HandoffContextUpdateContractEntry[] = [];
  pushEntry(entries, {
    section: "current_frame_section",
    kind: "summarize",
    summary: summarizeCurrentFrame(cwp) ?? "Current frame material is missing.",
    sourceRecordRefs,
    sourceRefs,
    evidenceRefs,
    pressure: "review_current_frame_before_future_handoff_apply",
  });
  pushEntry(entries, {
    section: "current_thesis_section",
    kind: "summarize",
    summary: summarizeCurrentThesis(cwp) ?? "Current thesis material is missing.",
    sourceRecordRefs,
    sourceRefs,
    evidenceRefs,
    pressure: "review_current_thesis_before_future_handoff_apply",
  });
  for (const [index, goal] of safeArray(cwp?.active_goals).slice(0, 5).entries()) {
    pushEntry(entries, {
      section: "active_goals_section",
      kind: "next_action_candidate",
      summary: summarizeAny(goal),
      sourceRecordRefs,
      sourceRefs,
      evidenceRefs,
      pressure: `review_active_goal_${index + 1}`,
    });
  }
  for (const [index, candidate] of safeArray(cwp?.next_candidates).slice(0, 5).entries()) {
    pushEntry(entries, {
      section: "next_candidates_section",
      kind: "next_action_candidate",
      summary: summarizeAny(candidate),
      sourceRecordRefs,
      sourceRefs,
      evidenceRefs,
      pressure: `review_next_candidate_${index + 1}`,
    });
  }
  for (const [index, question] of safeArray(cwp?.open_questions).slice(0, 5).entries()) {
    pushEntry(entries, {
      section: "open_questions_section",
      kind: "review_required",
      summary: summarizeAny(question),
      sourceRecordRefs,
      sourceRefs,
      evidenceRefs,
      pressure: `review_open_question_${index + 1}`,
    });
  }
  for (const [index, risk] of safeArray(cwp?.active_risks).slice(0, 5).entries()) {
    pushEntry(entries, {
      section: "active_risks_section",
      kind: "warn",
      summary: summarizeAny(risk),
      sourceRecordRefs,
      sourceRefs,
      evidenceRefs,
      pressure: `review_active_risk_${index + 1}`,
    });
  }
  pushEntry(entries, {
    section: "route_integration_metadata_section",
    kind: "source_trace",
    summary: `Route integration status ${routeRead?.status ?? "missing"} with response mode ${routeRead?.response_mode ?? "missing"}; requested handoff mode ${mode ?? "missing"}.`,
    sourceRecordRefs,
    sourceRefs,
    evidenceRefs,
    pressure: "verify_route_integration_metadata_before_future_handoff_apply",
  });
  addReviewEntry(entries, continuityReview, "continuity_relay_section", sourceRefs, evidenceRefs);
  addReviewEntry(entries, perspectiveUnitReview, "perspective_units_section", sourceRefs, evidenceRefs);
  addReviewEntry(entries, nextWorkBiasReview, "next_work_bias_section", sourceRefs, evidenceRefs);
  for (const [review, label] of [
    [continuityReview, "ContinuityRelay record review"],
    [perspectiveUnitReview, "PerspectiveUnit record review"],
    [nextWorkBiasReview, "NextWorkBias record review"],
  ] as const) {
    if (!review) {
      pushEntry(entries, {
        section: "blocked_or_missing_context_section",
        kind: "fallback_note",
        summary: `${label} was not supplied; future handoff apply should treat that context as missing unless separately reviewed.`,
        sourceRecordRefs: [],
        sourceRefs,
        evidenceRefs,
        pressure: `${label.toLowerCase().replaceAll(" ", "_")}_missing`,
      });
    }
  }
  pushEntry(entries, {
    section: "operator_review_required_section",
    kind: "review_required",
    summary:
      "Operator approval is required before a local contract record write; a separate future apply slice is required before live handoff context changes.",
    sourceRecordRefs,
    sourceRefs,
    evidenceRefs,
    pressure: "operator_review_required_before_future_apply",
  });
  return entries;
}

function pushEntry(
  entries: HandoffContextUpdateContractEntry[],
  {
    section,
    kind,
    summary,
    sourceRecordRefs,
    sourceRefs,
    evidenceRefs,
    pressure,
  }: {
    section: HandoffContextSection;
    kind: HandoffContextEntryKind;
    summary: string;
    sourceRecordRefs: string[];
    sourceRefs: string[];
    evidenceRefs: string[];
    pressure: string;
  },
): void {
  entries.push({
    entry_ref: `handoff-context-entry:${entries.length + 1}:${fingerprint({
      section,
      kind,
      summary,
    }).slice(0, 12)}`,
    handoff_section: section,
    entry_kind: kind,
    summary: bounded(summary),
    source_record_refs: uniqueCandidateIngressStringsV01(sourceRecordRefs),
    source_refs: sourceRefs,
    evidence_refs: evidenceRefs,
    review_pressure: pressure,
    authority_required: "future_handoff_context_apply",
    persistence_horizon: "handoff_context_update_contract_record",
  });
}

function addReviewEntry(
  entries: HandoffContextUpdateContractEntry[],
  review: GenericReview | null,
  section: HandoffContextSection,
  sourceRefs: string[],
  evidenceRefs: string[],
): void {
  if (!review) return;
  pushEntry(entries, {
    section,
    kind: "source_trace",
    summary: `${section} review status ${review.review_status ?? "unknown"} with valid_record_count ${Number(review.input_summary?.valid_record_count ?? 0)}.`,
    sourceRecordRefs: uniqueCandidateIngressStringsV01([latestRecordId(review)]),
    sourceRefs,
    evidenceRefs,
    pressure: `${section}_review_trace`,
  });
}

function determineStatus({
  routeRead,
  contract,
  ready,
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
  mode,
}: {
  routeRead: CurrentWorkingPerspectiveRouteIntegrationRead | null;
  contract: HandoffContextUpdateContractMaterial | null;
  ready: boolean;
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
  mode: HandoffContextUpdateMode | null;
}): HandoffContextUpdateContractPreviewStatus {
  if (!routeRead) return "no_route_integrated_current_working_perspective_material";
  if (!contract || !mode) return "no_handoff_context_update_material";
  if (refusalReasons.length > 0 || blockingReasons.length > 0) return "blocked";
  if (missingEvidence.length > 0) return "needs_more_evidence";
  if (insufficientData.length > 0) return "insufficient_data";
  if (ready) return "ready_for_future_handoff_context_update_contract_record_write";
  return "ready_for_operator_review";
}

function recommendedAction(
  status: HandoffContextUpdateContractPreviewStatus,
): HandoffContextUpdateContractRecommendedNextAction {
  if (status === "no_route_integrated_current_working_perspective_material") {
    return "supply_route_integrated_current_working_perspective_read";
  }
  if (status === "ready_for_future_handoff_context_update_contract_record_write") {
    return "write_handoff_context_update_contract_record";
  }
  if (status === "blocked" || status === "needs_more_evidence") {
    return "resolve_handoff_context_update_contract_blockers";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "review_handoff_context_update_contract";
}

function createReadiness({
  ready,
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
}: {
  ready: boolean;
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): HandoffContextUpdateContractReadiness {
  return {
    write_ready: ready,
    readiness_label: ready
      ? "ready_for_scoped_local_handoff_context_update_contract_record_write"
      : "not_ready_for_write",
    requires_route_integrated_current_working_perspective: true,
    requires_runtime_fallback: true,
    requires_handoff_context_mode: true,
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

function isRouteIntegrationRead(
  value: unknown,
): value is CurrentWorkingPerspectiveRouteIntegrationRead {
  return (
    isRecord(value) &&
    value.read_version === "current_working_perspective_route_integration_read.v0.1" &&
    value.scope === HANDOFF_CONTEXT_UPDATE_CONTRACT_SCOPE &&
    typeof value.status === "string" &&
    typeof value.response_mode === "string" &&
    isRecord(value.authority_boundary) &&
    isRecord(value.fallback_metadata) &&
    isRecord(value.route_integration_metadata) &&
    isRecord(value.runtime_current_working_perspective_summary) &&
    isRecord(value.applied_snapshot_metadata) &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs)
  );
}

function isRouteIntegrationReadReview(
  value: unknown,
): CurrentWorkingPerspectiveRouteIntegrationReadReview | null {
  return isRecord(value) &&
    value.review_version ===
      CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_READ_REVIEW_VERSION &&
    typeof value.review_status === "string"
    ? (value as unknown as CurrentWorkingPerspectiveRouteIntegrationReadReview)
    : null;
}

function isGenericReview(value: unknown, version: string): GenericReview | null {
  return isRecord(value) &&
    value.review_version === version &&
    typeof value.review_status === "string" &&
    isRecord(value.input_summary) &&
    isRecord(value.evidence_summary)
    ? (value as GenericReview)
    : null;
}

function hasExpectedRouteReadAuthority(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const expected = {
    read_only: true,
    route_integration_read_only: true,
    source_of_truth: false,
    can_write_db: false,
    can_create_schema: false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_mutate_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
    can_write_route_integration_contract_record: false,
    can_write_perspective_unit: false,
    can_write_next_work_bias: false,
    can_write_continuity_relay: false,
    can_update_continuity_relay: false,
    can_apply_live_relay_state: false,
    can_mutate_handoff_context: false,
    can_apply_handoff_context: false,
    can_write_selected_refs_to_live_handoff: false,
    can_send_handoff: false,
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
  };
  return Object.entries(expected).every(([key, expectedValue]) =>
    value[key] === expectedValue,
  );
}

function reviewBlockingReasons(review: GenericReview | null, prefix: string): string[] {
  if (!review) return [];
  return uniqueCandidateIngressStringsV01([
    ...(review.review_status === "records_invalid" ? [`${prefix}_invalid`] : []),
    ...(review.evidence_summary?.has_receipt_side_effect_problem === true
      ? [`${prefix}_receipt_side_effect_problem`]
      : []),
  ]);
}

function reviewMissingEvidence(review: GenericReview | null): string[] {
  return safeStringArray(review?.evidence_summary?.missing_evidence);
}

function reviewEvidenceRefs(review: GenericReview | null): string[] {
  return safeStringArray(review?.evidence_summary?.evidence_refs);
}

function reviewSourceRefs(review: GenericReview | null): string[] {
  return safeStringArray(review?.evidence_summary?.source_refs).concat(
    safeStringArray(review?.source_refs),
  );
}

function latestRecordId(review: GenericReview | null): string | null {
  return stringValue(review?.latest_record_summary?.record_id);
}

function refStatus(value: string | undefined): "supplied" | "missing" | "unsafe" {
  if (!value) return "missing";
  return isCandidateIngressPublicSafeRefV01(value) ? "supplied" : "unsafe";
}

function summarizeCurrentFrame(value: unknown): string | null {
  const frame = isRecord(value) ? value.current_frame : null;
  return isRecord(frame) ? stringValue(frame.summary) : null;
}

function summarizeCurrentThesis(value: unknown): string | null {
  const thesis = isRecord(value) ? value.current_thesis : null;
  return isRecord(thesis) ? stringValue(thesis.summary) : null;
}

function summarizeExistingHandoff(value: unknown): string | null {
  if (!value) return null;
  if (isRecord(value)) {
    return bounded(
      stringValue(value.summary) ??
        stringValue(value.title) ??
        `previous handoff material keys ${Object.keys(value).slice(0, 6).join(", ")}`,
    );
  }
  return bounded(String(value));
}

function containsRawOrPrivateMarkers(value: unknown, seen = new Set<unknown>()): boolean {
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) {
    return value.some((entry) => containsRawOrPrivateMarkers(entry, seen));
  }
  return Object.entries(value as RecordValue).some(([key, nested]) => {
    const normalized = key.toLowerCase();
    return (
      ["raw_text", "raw_report", "raw_excerpt"].includes(normalized) ||
      normalized.includes("private") ||
      normalized.includes("secret") ||
      normalized.includes("token") ||
      normalized.includes("password") ||
      containsRawOrPrivateMarkers(nested, seen)
    );
  });
}

function summarizeAny(value: unknown): string {
  if (isRecord(value)) {
    return bounded(
      stringValue(value.summary) ??
        stringValue(value.title) ??
        stringValue(value.label) ??
        JSON.stringify(value),
    );
  }
  return bounded(String(value));
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isSupplied(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function bounded(value: string): string {
  return value.length > 320 ? `${value.slice(0, 317)}...` : value;
}

function fingerprint(value: unknown): string {
  return Buffer.from(JSON.stringify(value))
    .toString("base64url")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 32);
}
