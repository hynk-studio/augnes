import { createHash } from "node:crypto";

import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import type { AppliedCurrentWorkingPerspectiveRead } from "@/lib/perspective/read-applied-current-working-perspective-for-web";
import {
  CURRENT_WORKING_PERSPECTIVE_VERSION,
  type CurrentWorkingPerspective,
} from "@/types/current-working-perspective";
import { CURRENT_WORKING_PERSPECTIVE_APPLY_RECORD_REVIEW_VERSION } from "@/types/current-working-perspective-apply-record-review";
import {
  CURRENT_WORKING_PERSPECTIVE_APPLIED_SNAPSHOT_VERSION,
  CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE,
  type CurrentWorkingPerspectiveAppliedSnapshot,
} from "@/types/current-working-perspective-apply-write";
import {
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_PREVIEW_VERSION,
  type CurrentWorkingPerspectiveRouteIntegrationContractAuthorityBoundary,
  type CurrentWorkingPerspectiveRouteIntegrationContractMaterial,
  type CurrentWorkingPerspectiveRouteIntegrationContractPreview,
  type CurrentWorkingPerspectiveRouteIntegrationContractPreviewInput,
  type CurrentWorkingPerspectiveRouteIntegrationContractPreviewStatus,
  type CurrentWorkingPerspectiveRouteIntegrationContractReadiness,
  type CurrentWorkingPerspectiveRouteIntegrationContractRecommendedNextAction,
  type CurrentWorkingPerspectiveRouteIntegrationMode,
} from "@/types/current-working-perspective-route-integration-contract-preview";
import { CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_REVIEW_VERSION } from "@/types/current-working-perspective-update-contract-record-review";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const CWP_ROUTE_INTEGRATION_SCOPE = "project:augnes" as const;

const modeValues: CurrentWorkingPerspectiveRouteIntegrationMode[] = [
  "runtime_only_with_applied_snapshot_hint",
  "applied_snapshot_overlay_candidate",
  "applied_snapshot_preferred_with_runtime_fallback",
  "keep_runtime_only",
];

export function buildCurrentWorkingPerspectiveRouteIntegrationContractPreviewV01({
  current_working_perspective_read,
  current_working_perspective,
  applied_current_working_perspective_read,
  current_working_perspective_apply_record_review,
  current_working_perspective_update_contract_record_review,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
  requested_route_integration_mode,
  scope,
  as_of,
  source_refs,
}: CurrentWorkingPerspectiveRouteIntegrationContractPreviewInput = {}):
  CurrentWorkingPerspectiveRouteIntegrationContractPreview {
  const runtimeSource = resolveCurrentWorkingPerspectiveSource({
    current_working_perspective_read,
    current_working_perspective,
  });
  const runtimeCwp = runtimeSource.currentWorkingPerspective;
  const runtimeCwpRef = runtimeCwp ? currentWorkingPerspectiveRef(runtimeCwp) : null;
  const appliedRead = isAppliedCurrentWorkingPerspectiveRead(
    applied_current_working_perspective_read,
  )
    ? applied_current_working_perspective_read
    : null;
  const applyReview = isApplyRecordReview(
    current_working_perspective_apply_record_review,
  )
    ? current_working_perspective_apply_record_review
    : null;
  const updateReview = isUpdateContractRecordReview(
    current_working_perspective_update_contract_record_review,
  )
    ? current_working_perspective_update_contract_record_review
    : null;
  const latestSnapshot = appliedRead?.latest_applied_snapshot ?? null;
  const appliedCwp = latestSnapshot?.applied_current_working_perspective ?? null;
  const applyRecordRef =
    appliedRead?.latest_record?.record_id ??
    stringValue(applyReview?.latest_record_summary?.record_id) ??
    stringValue(applyReview?.selected_record_summary?.record_id) ??
    null;
  const applyReviewUsable = isApplyRecordReviewUsable(applyReview);
  const applyReviewRecordRefs = applyRecordRefsFromReview(applyReview);
  const applyReviewSnapshotRefs = applySnapshotRefsFromReview(applyReview);
  const latestAppliedSnapshotSupportedByApplyReview =
    !latestSnapshot ||
    !applyReviewUsable ||
    applyReviewSnapshotRefs.includes(latestSnapshot.applied_snapshot_ref);
  const latestAppliedRecordSupportedByApplyReview =
    !appliedRead?.latest_record?.record_id ||
    !applyReviewUsable ||
    applyReviewRecordRefs.includes(appliedRead.latest_record.record_id);
  const hasLatestAppliedSnapshotSummary =
    Boolean(stringValue(applyReview?.latest_applied_snapshot_summary?.applied_snapshot_ref)) ||
    Boolean(
      stringValue(
        applyReview?.selected_applied_snapshot_summary?.applied_snapshot_ref,
      ),
    );
  const requestedSourceRefs = uniqueCandidateIngressStringsV01(source_refs ?? []);
  const sourceRefs = uniqueCandidateIngressStringsV01([
    ...requestedSourceRefs,
    ...safeStringArray(runtimeCwp?.current_frame?.source_refs),
    ...safeStringArray(runtimeCwp?.current_thesis?.source_refs),
    ...safeStringArray(latestSnapshot?.source_refs),
    ...safeStringArray(applyReview?.source_refs),
    ...safeStringArray(updateReview?.source_refs),
    ...(runtimeCwpRef ? [runtimeCwpRef] : []),
    ...(latestSnapshot?.applied_snapshot_ref
      ? [latestSnapshot.applied_snapshot_ref]
      : []),
  ]);
  const evidenceRefs = uniqueCandidateIngressStringsV01([
    ...safeStringArray(latestSnapshot?.evidence_refs),
    ...safeStringArray(applyReview?.evidence_summary?.evidence_refs),
    ...safeStringArray(updateReview?.evidence_summary?.evidence_refs),
  ]);
  const refsToValidate = [
    ...sourceRefs,
    ...evidenceRefs,
    ...(requested_operator_ref ? [requested_operator_ref] : []),
    ...(requested_idempotency_key ? [requested_idempotency_key] : []),
    ...(review_confirmation_ref ? [review_confirmation_ref] : []),
    ...(requested_route_integration_mode ? [requested_route_integration_mode] : []),
    ...(applyRecordRef ? [applyRecordRef] : []),
  ];
  const unsafeRefs = uniqueCandidateIngressStringsV01(
    refsToValidate.filter((ref) => !isCandidateIngressPublicSafeRefV01(ref)),
  );
  const mode =
    requested_route_integration_mode &&
    modeValues.includes(requested_route_integration_mode)
      ? requested_route_integration_mode
      : null;
  const contract =
    runtimeCwp && latestSnapshot && appliedCwp && mode
      ? buildRouteIntegrationContract({
          runtimeCwpRef,
          latestSnapshot,
          applyRecordRef,
          mode,
        })
      : null;
  const blockingReasons = uniqueCandidateIngressStringsV01([
    ...(runtimeSource.malformed
      ? ["runtime_current_working_perspective_material_malformed"]
      : []),
    ...(runtimeCwp &&
    runtimeCwp.perspective_version !== CURRENT_WORKING_PERSPECTIVE_VERSION
      ? ["runtime_current_working_perspective_version_invalid"]
      : []),
    ...(runtimeCwp && runtimeCwp.scope !== CWP_ROUTE_INTEGRATION_SCOPE
      ? ["runtime_current_working_perspective_scope_invalid"]
      : []),
    ...(runtimeCwp && !hasReadOnlyCurrentWorkingPerspectiveAuthority(runtimeCwp)
      ? ["runtime_current_working_perspective_authority_boundary_invalid"]
      : []),
    ...(runtimeSource.sourceStatus === "fixture_fallback"
      ? ["runtime_current_working_perspective_fixture_fallback_not_writable"]
      : []),
    ...(runtimeSource.sourceStatus === "empty_fallback"
      ? ["runtime_current_working_perspective_empty_fallback_not_writable"]
      : []),
    ...(isSupplied(applied_current_working_perspective_read) && !appliedRead
      ? ["applied_current_working_perspective_read_malformed"]
      : []),
    ...(appliedRead && appliedRead.status !== "latest_applied_snapshot_available"
      ? ["applied_current_working_perspective_snapshot_not_available"]
      : []),
    ...(latestSnapshot && !isAppliedSnapshotLike(latestSnapshot)
      ? ["applied_current_working_perspective_snapshot_malformed"]
      : []),
    ...(latestSnapshot &&
    !isCurrentWorkingPerspectiveLike(
      latestSnapshot.applied_current_working_perspective,
    )
      ? ["applied_current_working_perspective_snapshot_cwp_malformed"]
      : []),
    ...(latestSnapshot && !hasAppliedSnapshotNonRouteAuthority(latestSnapshot)
      ? ["applied_current_working_perspective_snapshot_authority_invalid"]
      : []),
    ...(isSupplied(current_working_perspective_apply_record_review) &&
    !applyReview
      ? ["current_working_perspective_apply_record_review_malformed"]
      : []),
    ...applyRecordReviewInvalidStatusReason(applyReview),
    ...(applyReview && !applyReviewUsable && applyReviewValidRecordCount(applyReview) <= 0
      ? ["current_working_perspective_apply_record_review_valid_records_missing"]
      : []),
    ...(applyReview &&
    (!Array.isArray(applyReview.records) || applyReview.records.length === 0)
      ? ["current_working_perspective_apply_record_review_valid_records_missing"]
      : []),
    ...(applyReview &&
    (!Array.isArray(applyReview.applied_snapshots) ||
      applyReview.applied_snapshots.length === 0)
      ? ["current_working_perspective_apply_record_review_applied_snapshots_missing"]
      : []),
    ...(applyReview && latestSnapshot && !hasLatestAppliedSnapshotSummary
      ? [
          "current_working_perspective_apply_record_review_latest_applied_snapshot_summary_missing",
        ]
      : []),
    ...(applyReview?.evidence_summary?.has_receipt_side_effect_problem === true
      ? ["current_working_perspective_apply_record_receipt_side_effect_problem"]
      : []),
    ...(latestSnapshot && applyReviewUsable && !latestAppliedSnapshotSupportedByApplyReview
      ? [
          "current_working_perspective_applied_snapshot_not_supported_by_apply_record_review",
        ]
      : []),
    ...(appliedRead?.latest_record?.record_id &&
    applyReviewUsable &&
    !latestAppliedRecordSupportedByApplyReview
      ? [
          "current_working_perspective_applied_latest_record_not_supported_by_apply_record_review",
        ]
      : []),
    ...(applyReviewUsable && !applyRecordRef
      ? ["current_working_perspective_apply_record_ref_missing"]
      : []),
    ...(isSupplied(current_working_perspective_update_contract_record_review) &&
    !updateReview
      ? ["current_working_perspective_update_contract_record_review_malformed"]
      : []),
    ...(updateReview?.review_status === "records_invalid"
      ? ["current_working_perspective_update_contract_record_review_invalid"]
      : []),
    ...(updateReview?.evidence_summary?.has_receipt_side_effect_problem === true
      ? [
          "current_working_perspective_update_contract_record_receipt_side_effect_problem",
        ]
      : []),
    ...(mode === "keep_runtime_only"
      ? ["route_integration_mode_keep_runtime_only_not_writable"]
      : []),
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...(requestedSourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(evidenceRefs.length === 0 ? ["evidence_refs_missing"] : []),
    ...safeStringArray(applyReview?.evidence_summary?.missing_evidence),
    ...safeStringArray(updateReview?.evidence_summary?.missing_evidence),
  ]);
  const refusalReasons = uniqueCandidateIngressStringsV01([
    ...(unsafeRefs.length > 0
      ? ["current_working_perspective_route_integration_refs_unsafe"]
      : []),
    ...(requested_route_integration_mode &&
    !modeValues.includes(requested_route_integration_mode)
      ? ["requested_route_integration_mode_unsupported"]
      : []),
  ]);
  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(!runtimeCwp ? ["runtime_current_working_perspective_material_missing"] : []),
    ...(!appliedRead ? ["applied_current_working_perspective_read_missing"] : []),
    ...(!latestSnapshot ? ["applied_current_working_perspective_snapshot_missing"] : []),
    ...(!applyReview ? ["current_working_perspective_apply_record_review_missing"] : []),
    ...(!mode ? ["requested_route_integration_mode_missing"] : []),
    ...(!requested_operator_ref ? ["operator_ref_missing"] : []),
    ...(!requested_idempotency_key ? ["idempotency_key_missing"] : []),
    ...(!review_confirmation_ref ? ["review_confirmation_ref_missing"] : []),
  ]);
  const readiness = buildReadiness({
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });
  const status = determineStatus({
    hasRuntimeCurrentWorkingPerspective: Boolean(runtimeCwp),
    hasAppliedSnapshot: Boolean(latestSnapshot),
    readiness,
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
    mode,
  });

  return {
    preview_version:
      CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_PREVIEW_VERSION,
    scope: scope ?? runtimeCwp?.scope ?? CWP_ROUTE_INTEGRATION_SCOPE,
    as_of: as_of ?? runtimeCwp?.as_of ?? latestSnapshot?.as_of ?? FALLBACK_AS_OF,
    source_refs: sourceRefs,
    contract_preview_status: status,
    recommended_next_action: determineRecommendedNextAction(status, mode),
    input_summary: {
      has_runtime_current_working_perspective_material: Boolean(runtimeCwp),
      has_applied_current_working_perspective_read: Boolean(appliedRead),
      has_latest_applied_snapshot: Boolean(latestSnapshot),
      has_apply_record_review: Boolean(applyReview),
      has_update_contract_record_review: Boolean(updateReview),
      runtime_current_working_perspective_source_status:
        runtimeSource.sourceStatus,
      requested_route_integration_mode: mode,
      applied_snapshot_ref: latestSnapshot?.applied_snapshot_ref ?? null,
      apply_record_ref: applyRecordRef,
      blocker_count: blockingReasons.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusalReasons.length,
      insufficient_data_reason_count: insufficientData.length,
      review_confirmation_supplied: Boolean(review_confirmation_ref),
      requested_idempotency_key_supplied: Boolean(requested_idempotency_key),
      requested_operator_ref_supplied: Boolean(requested_operator_ref),
    },
    source_status: {
      runtime_current_working_perspective: runtimeSource.status,
      applied_current_working_perspective_read: appliedRead
        ? appliedRead.status === "latest_applied_snapshot_available"
          ? "latest_applied_snapshot_available"
          : "no_applied_snapshot"
        : isSupplied(applied_current_working_perspective_read)
          ? "malformed"
          : "missing",
      current_working_perspective_apply_record_review: sourceStatusForReview(
        current_working_perspective_apply_record_review,
        applyReview,
      ),
      current_working_perspective_update_contract_record_review:
        sourceStatusForReview(
          current_working_perspective_update_contract_record_review,
          updateReview,
        ),
      requested_route_integration_mode: mode
        ? mode === "keep_runtime_only"
          ? "keep_runtime_only"
          : "supplied"
        : "missing",
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
    contract_readiness: readiness,
    approval_requirements: [
      "review_runtime_current_working_perspective_material",
      "review_latest_applied_current_working_perspective_snapshot",
      "confirm_apply_record_review_is_valid",
      "confirm_future_route_behavior_preserves_runtime_fallback",
      "confirm_this_contract_does_not_modify_api_perspective_current",
      "confirm_no_upstream_cwp_source_table_handoff_memory_metric_or_external_mutation",
    ],
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_valid_runtime_current_working_perspective_material: Boolean(runtimeCwp),
      has_valid_applied_snapshot:
        Boolean(latestSnapshot) &&
        isAppliedSnapshotLike(latestSnapshot) &&
        hasAppliedSnapshotNonRouteAuthority(latestSnapshot),
      has_valid_apply_record_review:
        isApplyRecordReviewUsable(applyReview),
      has_valid_update_contract_record_review:
        !isSupplied(current_working_perspective_update_contract_record_review) ||
        (Boolean(updateReview) &&
          updateReview?.review_status !== "records_invalid" &&
          updateReview?.evidence_summary?.has_receipt_side_effect_problem !== true),
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
    runtime_current_working_perspective_summary: summarizeCwp(
      runtimeCwp,
      runtimeCwpRef,
      runtimeSource.sourceStatus,
    ),
    applied_current_working_perspective_summary: {
      ...summarizeCwp(
        appliedCwp,
        latestSnapshot?.applied_snapshot_ref ?? null,
        appliedRead?.status ?? "missing",
      ),
      applied_snapshot_ref: latestSnapshot?.applied_snapshot_ref ?? null,
      source_contract_record_ref:
        latestSnapshot?.source_contract_record_ref ?? null,
      applied_patch_count: latestSnapshot?.applied_patch_count ?? 0,
    },
    route_integration_diff_summary: buildDiffSummary({
      runtimeCwp,
      appliedCwp,
      runtimeCwpRef,
      latestSnapshot,
      applyRecordRef,
    }),
    proposed_current_working_perspective_route_integration_contract: contract,
    would_write_current_working_perspective_route_integration_contract_record_preview:
      {
        proposed_record_kind:
          "current_working_perspective_route_integration_contract_record.v0.1",
        proposed_receipt_kind:
          "current_working_perspective_route_integration_contract_receipt.v0.1",
        proposed_store_kind:
          "current_working_perspective_route_integration_contract_store.v0.1",
        route_path: "/api/perspective/current",
        route_family: "current_working_perspective",
        source_runtime_current_working_perspective_ref: runtimeCwpRef,
        source_applied_snapshot_ref: latestSnapshot?.applied_snapshot_ref ?? null,
        source_cwp_apply_record_refs: applyRecordRef ? [applyRecordRef] : [],
        source_cwp_update_contract_record_refs: uniqueCandidateIngressStringsV01([
          ...(latestSnapshot?.source_contract_record_ref
            ? [latestSnapshot.source_contract_record_ref]
            : []),
          ...safeStringArray(
            updateReview?.records?.map((record: any) => record.record_id),
          ),
        ]),
        route_integration_mode: mode,
        proposed_route_integration_contract: contract,
        source_refs: sourceRefs,
        evidence_refs: evidenceRefs,
        requested_operator_ref: requested_operator_ref ?? null,
        requested_idempotency_key: requested_idempotency_key ?? null,
        review_confirmation_ref: review_confirmation_ref ?? null,
        review_summary:
          "Would write only a scoped local CurrentWorkingPerspective route integration contract record and receipt; /api/perspective/current is not modified.",
      },
    operator_review_checklist: [
      "confirm_runtime_current_working_perspective_remains_available_as_fallback",
      "confirm_applied_snapshot_is_valid_and_local",
      "confirm_route_integration_mode_is_not_keep_runtime_only",
      "confirm_future_route_guards_never_write_on_get",
      "confirm_this_pr_does_not_modify_api_perspective_current",
      "confirm_handoff_memory_relay_metrics_and_external_systems_remain_untouched",
    ],
    would_not_write: [
      "does_not_modify_app_api_perspective_current_route",
      "does_not_replace_api_perspective_current_response",
      "does_not_mutate_upstream_current_working_perspective_source_tables",
      "does_not_write_applied_current_working_perspective_snapshots",
      "does_not_write_current_working_perspective_apply_or_update_contract_records",
      "does_not_write_perspective_unit_next_work_bias_or_continuity_relay",
      "does_not_apply_live_relay_state_handoff_or_memory",
      "does_not_write_metrics_or_upstream_ledgers",
      "does_not_call_provider_github_or_codex",
    ],
    non_goals: [
      "api_perspective_current_route_integration",
      "route_response_replacement",
      "upstream_cwp_source_table_mutation",
      "applied_snapshot_write",
      "current_working_perspective_apply_record_write",
      "current_working_perspective_update_contract_record_write",
      "handoff_context_apply_or_send",
      "memory_write",
      "global_metric_update",
      "external_action",
    ],
    authority_boundary:
      createCurrentWorkingPerspectiveRouteIntegrationContractAuthorityBoundaryV01(),
  };
}

export function createCurrentWorkingPerspectiveRouteIntegrationContractAuthorityBoundaryV01():
  CurrentWorkingPerspectiveRouteIntegrationContractAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    contract_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_db: false,
    can_create_current_working_perspective_route_integration_contract_record:
      false,
    can_modify_api_perspective_current_route: false,
    can_replace_current_working_perspective_route_response: false,
    can_update_upstream_current_working_perspective_source_tables: false,
    can_mutate_upstream_current_working_perspective_source_tables: false,
    can_write_applied_current_working_perspective_snapshot: false,
    can_write_current_working_perspective_apply_record: false,
    can_write_current_working_perspective_update_contract_record: false,
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
    notes: [
      "Read-only route integration contract preview for a future /api/perspective/current integration slice.",
      "The preview cannot write DB, modify the route, replace route responses, mutate upstream CWP source tables, write applied snapshots, handoff, memory, metrics, or external systems.",
    ],
  };
}

function buildRouteIntegrationContract({
  runtimeCwpRef,
  latestSnapshot,
  applyRecordRef,
  mode,
}: {
  runtimeCwpRef: string | null;
  latestSnapshot: CurrentWorkingPerspectiveAppliedSnapshot;
  applyRecordRef: string | null;
  mode: CurrentWorkingPerspectiveRouteIntegrationMode;
}): CurrentWorkingPerspectiveRouteIntegrationContractMaterial {
  return {
    contract_kind: "current_working_perspective_route_integration_contract.v0.1",
    route_family: "current_working_perspective",
    route_path: "/api/perspective/current",
    route_version_before: "perspective.current.v0.1",
    current_runtime_cwp_ref: runtimeCwpRef,
    applied_snapshot_ref: latestSnapshot.applied_snapshot_ref,
    applied_snapshot_source_contract_record_ref:
      latestSnapshot.source_contract_record_ref,
    applied_snapshot_source_apply_record_ref: applyRecordRef,
    requested_route_integration_mode: mode,
    proposed_future_route_behavior: futureRouteBehaviorForMode(mode),
    proposed_response_contract: {
      response_version: "perspective.current.route_integration_candidate.v0.1",
      includes_runtime_cwp: true,
      includes_applied_snapshot_metadata: true,
      includes_route_integration_metadata: true,
      includes_authority_boundary: true,
      does_not_include_raw_private_material: true,
    },
    route_integration_guards: {
      require_local_read_marker: true,
      require_project_augnes_scope: true,
      require_safe_applied_snapshot_db_path: true,
      require_schema_existing_for_applied_snapshot_reads: true,
      refuse_private_paths: true,
      refuse_route_replacement_without_approved_record: true,
      preserve_runtime_fallback: true,
      never_write_on_get: true,
    },
    blocked_live_mutations: [
      "api_perspective_current_route_modified",
      "current_working_perspective_route_response_replaced_without_future_slice",
      "upstream_current_working_perspective_source_tables_mutated",
      "applied_current_working_perspective_snapshot_written",
      "handoff_context_mutated_or_sent",
      "memory_or_metrics_written",
      "provider_github_codex_called",
    ],
    future_implementation_requirements: [
      "require_approved_route_integration_contract_record",
      "read_applied_snapshot_only_from_safe_local_path",
      "preserve_runtime_current_working_perspective_fallback",
      "never_create_schema_or_write_on_get",
      "include_route_integration_metadata_and_authority_boundary",
      "prove_private_raw_material_is_not_exposed",
    ],
    rollback_and_fallback_plan: [
      "fall_back_to_runtime_current_working_perspective_on_missing_snapshot",
      "fall_back_to_runtime_current_working_perspective_on_invalid_snapshot",
      "fall_back_to_runtime_current_working_perspective_on_stale_snapshot",
      "disable_applied_snapshot_participation_without_mutating_stored_records",
    ],
    operator_acceptance_criteria: [
      "operator_confirms_snapshot_source_and_freshness",
      "operator_confirms_runtime_fallback_is_preserved",
      "operator_confirms_get_route_remains_read_only",
      "operator_confirms_no_handoff_memory_metric_or_external_side_effect",
    ],
  };
}

function futureRouteBehaviorForMode(
  mode: CurrentWorkingPerspectiveRouteIntegrationMode,
): CurrentWorkingPerspectiveRouteIntegrationContractMaterial["proposed_future_route_behavior"] {
  if (mode === "applied_snapshot_preferred_with_runtime_fallback") {
    return {
      default_mode: "applied_snapshot_preferred_with_runtime_fallback",
      runtime_fallback_behavior:
        "Return runtime CurrentWorkingPerspective if the applied snapshot is missing, stale, invalid, or unreadable.",
      applied_snapshot_participation:
        "Future route may present the latest valid applied snapshot as the preferred read model with explicit metadata.",
      freshness_policy:
        "Require latest local applied snapshot review and freshness metadata before participation.",
      staleness_policy:
        "Mark stale applied snapshots as unavailable and preserve runtime fallback.",
      error_policy:
        "Snapshot read errors are reported in metadata and do not throw away runtime CWP.",
      local_read_auth_policy:
        "Only safe local read paths with existing schema may be used; GET never writes.",
      cache_policy: "no-store for operator-facing route integration reads.",
      response_metadata_policy:
        "Include route integration mode, source snapshot ref, and fallback reason metadata.",
      audit_receipt_policy:
        "Route integration requires a prior scoped local contract record and future route integration receipt.",
    };
  }
  if (mode === "applied_snapshot_overlay_candidate") {
    return {
      default_mode: "runtime_primary_with_applied_overlay_candidate",
      runtime_fallback_behavior:
        "Runtime CurrentWorkingPerspective remains primary response material.",
      applied_snapshot_participation:
        "Future route may include applied snapshot as an overlay candidate, not replacement.",
      freshness_policy:
        "Applied overlay candidate must be latest, valid, scoped to project:augnes, and source-refed.",
      staleness_policy:
        "Stale overlay candidates are omitted or marked unavailable.",
      error_policy:
        "Overlay read errors are metadata only; runtime response remains available.",
      local_read_auth_policy:
        "Only safe local read paths with existing schema may be read.",
      cache_policy: "no-store for operator-facing route integration reads.",
      response_metadata_policy:
        "Include applied snapshot ref and candidate status while preserving runtime primary metadata.",
      audit_receipt_policy:
        "Future route integration must cite an approved route integration contract record.",
    };
  }
  return {
    default_mode: "runtime_primary_with_applied_snapshot_hint",
    runtime_fallback_behavior: "Runtime CurrentWorkingPerspective is primary.",
    applied_snapshot_participation:
      "Future route may include only metadata that a local applied snapshot exists.",
    freshness_policy:
      "Snapshot freshness is summarized as metadata and cannot replace runtime material.",
    staleness_policy: "Stale snapshots are hint-only or omitted.",
    error_policy: "Snapshot read errors are metadata only.",
    local_read_auth_policy:
      "Only safe local read paths with existing schema may be read.",
    cache_policy: "no-store for operator-facing route integration reads.",
    response_metadata_policy:
      "Include applied snapshot availability metadata without route replacement.",
    audit_receipt_policy:
      "Future route integration must cite an approved route integration contract record.",
  };
}

function resolveCurrentWorkingPerspectiveSource({
  current_working_perspective_read,
  current_working_perspective,
}: {
  current_working_perspective_read: unknown;
  current_working_perspective: unknown;
}) {
  if (isRecord(current_working_perspective_read)) {
    const data = isRecord(current_working_perspective_read.data)
      ? current_working_perspective_read.data
      : null;
    const sourceStatus =
      typeof current_working_perspective_read.source_status === "string"
        ? current_working_perspective_read.source_status
        : "malformed";
    if (data) {
      return {
        currentWorkingPerspective: data as CurrentWorkingPerspective,
        sourceStatus: sourceStatus as
          | "runtime"
          | "supplied"
          | "fixture_fallback"
          | "empty_fallback"
          | "missing"
          | "malformed",
        status:
          sourceStatus === "runtime"
            ? "runtime"
            : sourceStatus === "fixture_fallback"
              ? "fixture_fallback"
              : sourceStatus === "empty_fallback"
                ? "empty_fallback"
                : "supplied",
        malformed: false,
      } as const;
    }
    return {
      currentWorkingPerspective: null,
      sourceStatus: "malformed",
      status: "malformed",
      malformed: true,
    } as const;
  }
  if (isCurrentWorkingPerspective(current_working_perspective)) {
    return {
      currentWorkingPerspective: current_working_perspective,
      sourceStatus: "supplied",
      status:
        current_working_perspective.perspective_version !==
        CURRENT_WORKING_PERSPECTIVE_VERSION
          ? "wrong_version"
          : current_working_perspective.scope !== CWP_ROUTE_INTEGRATION_SCOPE
            ? "wrong_scope"
            : "supplied",
      malformed: false,
    } as const;
  }
  if (
    isSupplied(current_working_perspective_read) ||
    isSupplied(current_working_perspective)
  ) {
    return {
      currentWorkingPerspective: null,
      sourceStatus: "malformed",
      status: "malformed",
      malformed: true,
    } as const;
  }
  return {
    currentWorkingPerspective: null,
    sourceStatus: "missing",
    status: "missing",
    malformed: false,
  } as const;
}

function buildReadiness({
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
}: {
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): CurrentWorkingPerspectiveRouteIntegrationContractReadiness {
  const writeReady =
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    refusalReasons.length === 0 &&
    insufficientData.length === 0;
  return {
    write_ready: writeReady,
    readiness_label: writeReady
      ? "ready_for_scoped_local_current_working_perspective_route_integration_contract_record"
      : "not_ready_for_current_working_perspective_route_integration_contract_record",
    requires_runtime_current_working_perspective: true,
    requires_applied_current_working_perspective_snapshot: true,
    requires_apply_record_review: true,
    requires_route_integration_mode: true,
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
  hasRuntimeCurrentWorkingPerspective,
  hasAppliedSnapshot,
  readiness,
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
  mode,
}: {
  hasRuntimeCurrentWorkingPerspective: boolean;
  hasAppliedSnapshot: boolean;
  readiness: CurrentWorkingPerspectiveRouteIntegrationContractReadiness;
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
  mode: CurrentWorkingPerspectiveRouteIntegrationMode | null;
}): CurrentWorkingPerspectiveRouteIntegrationContractPreviewStatus {
  if (!hasRuntimeCurrentWorkingPerspective) {
    return "no_runtime_current_working_perspective_material";
  }
  if (!hasAppliedSnapshot) return "no_applied_current_working_perspective_snapshot";
  if (mode === "keep_runtime_only") return "keep_preview_only";
  if (blockingReasons.length > 0 || refusalReasons.length > 0) return "blocked";
  if (missingEvidence.length > 0) return "needs_more_evidence";
  if (insufficientData.length > 0) return "insufficient_data";
  if (readiness.write_ready) {
    return "ready_for_future_current_working_perspective_route_integration_contract_record_write";
  }
  return "ready_for_operator_review";
}

function determineRecommendedNextAction(
  status: CurrentWorkingPerspectiveRouteIntegrationContractPreviewStatus,
  mode: CurrentWorkingPerspectiveRouteIntegrationMode | null,
): CurrentWorkingPerspectiveRouteIntegrationContractRecommendedNextAction {
  if (status === "no_runtime_current_working_perspective_material") {
    return "supply_runtime_current_working_perspective_material";
  }
  if (status === "no_applied_current_working_perspective_snapshot") {
    return "supply_applied_current_working_perspective_snapshot";
  }
  if (mode === "keep_runtime_only") return "keep_runtime_only";
  if (status === "blocked" || status === "needs_more_evidence") {
    return "resolve_current_working_perspective_route_integration_blockers";
  }
  if (
    status ===
    "ready_for_future_current_working_perspective_route_integration_contract_record_write"
  ) {
    return "write_current_working_perspective_route_integration_contract_record";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "review_current_working_perspective_route_integration_contract";
}

function buildDiffSummary({
  runtimeCwp,
  appliedCwp,
  runtimeCwpRef,
  latestSnapshot,
  applyRecordRef,
}: {
  runtimeCwp: CurrentWorkingPerspective | null;
  appliedCwp: CurrentWorkingPerspective | null;
  runtimeCwpRef: string | null;
  latestSnapshot: CurrentWorkingPerspectiveAppliedSnapshot | null;
  applyRecordRef: string | null;
}) {
  return {
    runtime_cwp_ref: runtimeCwpRef,
    applied_snapshot_ref: latestSnapshot?.applied_snapshot_ref ?? null,
    applied_snapshot_source_contract_record_ref:
      latestSnapshot?.source_contract_record_ref ?? null,
    applied_snapshot_source_apply_record_ref: applyRecordRef,
    frame_summary_changed:
      (runtimeCwp?.current_frame?.summary ?? null) !==
      (appliedCwp?.current_frame?.summary ?? null),
    thesis_summary_changed:
      (runtimeCwp?.current_thesis?.summary ?? null) !==
      (appliedCwp?.current_thesis?.summary ?? null),
    active_goal_delta:
      (appliedCwp?.active_goals?.length ?? 0) -
      (runtimeCwp?.active_goals?.length ?? 0),
    open_question_delta:
      (appliedCwp?.open_questions?.length ?? 0) -
      (runtimeCwp?.open_questions?.length ?? 0),
    active_risk_delta:
      (appliedCwp?.active_risks?.length ?? 0) -
      (runtimeCwp?.active_risks?.length ?? 0),
    next_candidate_delta:
      (appliedCwp?.next_candidates?.length ?? 0) -
      (runtimeCwp?.next_candidates?.length ?? 0),
    applied_patch_count: latestSnapshot?.applied_patch_count ?? 0,
    route_path: "/api/perspective/current" as const,
  };
}

function sourceStatusForReview(
  suppliedValue: unknown,
  review: Record<string, any> | null,
): "supplied" | "missing" | "invalid" | "malformed" {
  if (!isSupplied(suppliedValue)) return "missing";
  if (!review) return "malformed";
  return review.review_status === "records_invalid" ? "invalid" : "supplied";
}

function isAppliedCurrentWorkingPerspectiveRead(
  value: unknown,
): value is AppliedCurrentWorkingPerspectiveRead {
  return (
    isRecord(value) &&
    value.read_version === "applied_current_working_perspective_read.v0.1" &&
    value.scope === CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE &&
    typeof value.status === "string" &&
    isRecord(value.summary) &&
    isRecord(value.authority_boundary) &&
    value.authority_boundary.read_only === true &&
    value.authority_boundary.can_write_db === false &&
    value.authority_boundary.can_create_schema === false &&
    value.authority_boundary.can_mutate_current_working_perspective === false &&
    value.authority_boundary.can_replace_current_working_perspective_route_response ===
      false
  );
}

function isApplyRecordReview(value: unknown): value is Record<string, any> {
  return (
    isRecord(value) &&
    value.review_version === CURRENT_WORKING_PERSPECTIVE_APPLY_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    Array.isArray(value.applied_snapshots) &&
    isRecord(value.input_summary) &&
    isRecord(value.evidence_summary)
  );
}

function isApplyRecordReviewUsable(review: Record<string, any> | null): boolean {
  return Boolean(
    review &&
      [
        "records_available",
        "selected_record_found",
        "selected_applied_snapshot_found",
      ].includes(String(review.review_status)) &&
      applyReviewValidRecordCount(review) > 0 &&
      Array.isArray(review.records) &&
      review.records.length > 0 &&
      Array.isArray(review.applied_snapshots) &&
      review.applied_snapshots.length > 0 &&
      review.evidence_summary?.has_receipt_side_effect_problem !== true,
  );
}

function applyRecordReviewInvalidStatusReason(
  review: Record<string, any> | null,
): string[] {
  if (!review) return [];
  if (review.review_status === "records_invalid") {
    return ["current_working_perspective_apply_record_review_invalid"];
  }
  if (review.review_status === "schema_missing") {
    return ["current_working_perspective_apply_record_review_schema_missing"];
  }
  if (review.review_status === "no_records") {
    return ["current_working_perspective_apply_record_review_no_records"];
  }
  if (review.review_status === "selected_record_missing") {
    return [
      "current_working_perspective_apply_record_review_selected_record_missing",
    ];
  }
  if (review.review_status === "selected_applied_snapshot_missing") {
    return [
      "current_working_perspective_apply_record_review_selected_applied_snapshot_missing",
    ];
  }
  return [];
}

function applyReviewValidRecordCount(review: Record<string, any>): number {
  const count = Number(review.input_summary?.valid_record_count ?? 0);
  return Number.isFinite(count) ? count : 0;
}

function applyRecordRefsFromReview(review: Record<string, any> | null): string[] {
  if (!review) return [];
  return uniqueCandidateIngressStringsV01([
    stringValue(review.latest_record_summary?.record_id),
    stringValue(review.selected_record_summary?.record_id),
    ...safeStringArray(
      Array.isArray(review.record_summaries)
        ? review.record_summaries.map((summary: any) => summary?.record_id)
        : [],
    ),
    ...safeStringArray(
      Array.isArray(review.records)
        ? review.records.map((record: any) => record?.record_id)
        : [],
    ),
  ]);
}

function applySnapshotRefsFromReview(
  review: Record<string, any> | null,
): string[] {
  if (!review) return [];
  return uniqueCandidateIngressStringsV01([
    stringValue(review.latest_applied_snapshot_summary?.applied_snapshot_ref),
    stringValue(review.selected_applied_snapshot_summary?.applied_snapshot_ref),
    ...safeStringArray(
      Array.isArray(review.applied_snapshots)
        ? review.applied_snapshots.map(
            (snapshot: any) => snapshot?.applied_snapshot_ref,
          )
        : [],
    ),
  ]);
}

function isUpdateContractRecordReview(value: unknown): value is Record<string, any> {
  return (
    isRecord(value) &&
    value.review_version ===
      CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.input_summary) &&
    isRecord(value.evidence_summary)
  );
}

function isAppliedSnapshotLike(
  value: unknown,
): value is CurrentWorkingPerspectiveAppliedSnapshot {
  return (
    isRecord(value) &&
    value.snapshot_version === CURRENT_WORKING_PERSPECTIVE_APPLIED_SNAPSHOT_VERSION &&
    value.scope === CURRENT_WORKING_PERSPECTIVE_APPLY_SCOPE &&
    typeof value.applied_snapshot_ref === "string" &&
    typeof value.source_contract_record_ref === "string" &&
    isRecord(value.applied_current_working_perspective) &&
    isCurrentWorkingPerspectiveLike(value.applied_current_working_perspective) &&
    Array.isArray(value.applied_patch_refs) &&
    typeof value.applied_patch_count === "number" &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs) &&
    isRecord(value.authority_boundary)
  );
}

function hasAppliedSnapshotNonRouteAuthority(
  snapshot: CurrentWorkingPerspectiveAppliedSnapshot,
): boolean {
  if (!isRecord(snapshot) || !isRecord(snapshot.authority_boundary)) {
    return false;
  }
  const authority = snapshot.authority_boundary as unknown as Record<
    string,
    unknown
  >;
  const falseFields = [
    "source_of_truth",
    "can_update_upstream_current_working_perspective_source_tables",
    "can_mutate_upstream_current_working_perspective_source_tables",
    "can_replace_current_working_perspective_route_response",
    "can_write_perspective_unit",
    "can_write_next_work_bias",
    "can_write_continuity_relay",
    "can_update_continuity_relay",
    "can_apply_live_relay_state",
    "can_mutate_handoff_context",
    "can_apply_handoff_context",
    "can_write_selected_refs_to_live_handoff",
    "can_send_handoff",
    "can_write_memory",
    "can_mutate_memory",
    "can_promote_memory",
    "can_update_global_dogfood_metrics",
    "can_write_dogfood_metrics",
    "can_write_dogfood_metric_snapshot",
    "can_write_reuse_outcome_ledger",
    "can_write_expected_observed_delta",
    "can_write_work_episode",
    "can_call_provider_openai",
    "can_call_github",
    "can_execute_codex",
    "can_create_pr",
    "can_merge_pr",
    "can_run_autonomous_action",
    "can_create_graph_or_vector_store",
    "can_create_rag_stack",
    "can_crawl_or_observe_browser",
    "can_render_workbench_action_button",
  ];
  return falseFields.every((field) => authority[field] === false);
}

function hasReadOnlyCurrentWorkingPerspectiveAuthority(
  cwp: CurrentWorkingPerspective,
): boolean {
  const authority = cwp.authority_boundary;
  return (
    isRecord(authority) &&
    authority.derived_view_only === true &&
    authority.can_write_db === false &&
    authority.can_add_route === false &&
    authority.can_add_ui === false &&
    authority.can_apply_project_perspective === false &&
    authority.can_mutate_memory === false &&
    authority.can_call_github === false &&
    authority.can_call_openai_or_provider === false &&
    authority.can_execute_codex === false &&
    authority.can_create_branch_or_pr === false
  );
}

function isCurrentWorkingPerspective(value: unknown): value is CurrentWorkingPerspective {
  return (
    isRecord(value) &&
    value.perspective_version === CURRENT_WORKING_PERSPECTIVE_VERSION &&
    typeof value.scope === "string" &&
    isRecord(value.current_frame) &&
    isRecord(value.current_thesis) &&
    Array.isArray(value.active_goals) &&
    Array.isArray(value.accepted_assumptions) &&
    Array.isArray(value.rejected_assumptions) &&
    Array.isArray(value.open_questions) &&
    Array.isArray(value.active_risks) &&
    Array.isArray(value.next_candidates) &&
    isRecord(value.review_queue_hints) &&
    isRecord(value.source_refs) &&
    isRecord(value.staleness) &&
    Array.isArray(value.gaps) &&
    isRecord(value.authority_boundary) &&
    Array.isArray(value.next_phase_notes)
  );
}

function isCurrentWorkingPerspectiveLike(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const authority = isRecord(value.authority_boundary)
    ? value.authority_boundary
    : null;
  return (
    value.runtime === "augnes" &&
    value.perspective_version === "current_working_perspective.v0.1" &&
    value.projection_version === "augnes_delta_projection.v0.1" &&
    value.snapshot_version === "perspective_snapshot.v0.1" &&
    value.scope === CWP_ROUTE_INTEGRATION_SCOPE &&
    typeof value.as_of === "string" &&
    isRecord(value.current_frame) &&
    typeof value.current_frame.summary === "string" &&
    Array.isArray(value.current_frame.source_refs) &&
    isRecord(value.current_thesis) &&
    typeof value.current_thesis.summary === "string" &&
    Array.isArray(value.current_thesis.source_refs) &&
    Array.isArray(value.active_goals) &&
    Array.isArray(value.accepted_assumptions) &&
    Array.isArray(value.rejected_assumptions) &&
    Array.isArray(value.open_questions) &&
    Array.isArray(value.active_risks) &&
    Array.isArray(value.next_candidates) &&
    isRecord(value.research_pressure) &&
    Array.isArray(value.last_major_delta_refs) &&
    isRecord(value.review_queue_hints) &&
    isRecord(value.source_refs) &&
    isRecord(value.staleness) &&
    Array.isArray(value.gaps) &&
    Array.isArray(value.next_phase_notes) &&
    authority !== null &&
    authority.derived_view_only === true &&
    authority.can_write_db === false &&
    authority.can_apply_project_perspective === false &&
    authority.can_mutate_memory === false &&
    authority.can_call_github === false &&
    authority.can_call_openai_or_provider === false &&
    authority.can_execute_codex === false &&
    authority.can_create_branch_or_pr === false
  );
}

function summarizeCwp(
  cwp: CurrentWorkingPerspective | null,
  currentCwpRef: string | null,
  sourceStatus: string,
) {
  return {
    current_cwp_ref: currentCwpRef,
    perspective_version: cwp?.perspective_version ?? null,
    scope: cwp?.scope ?? null,
    as_of: cwp?.as_of ?? null,
    source_status: sourceStatus,
    current_frame_summary: cwp?.current_frame?.summary ?? null,
    current_thesis_summary: cwp?.current_thesis?.summary ?? null,
    active_goal_count: cwp?.active_goals?.length ?? 0,
    open_question_count: cwp?.open_questions?.length ?? 0,
    active_risk_count: cwp?.active_risks?.length ?? 0,
    next_candidate_count: cwp?.next_candidates?.length ?? 0,
    staleness_status: cwp?.staleness?.status ?? null,
  };
}

function currentWorkingPerspectiveRef(cwp: CurrentWorkingPerspective): string {
  return `current-working-perspective:${hashText(
    `${cwp.scope}:${cwp.as_of}:${cwp.perspective_version}`,
  ).slice(0, 16)}`;
}

function safeRef(value: unknown): string | null {
  return isCandidateIngressPublicSafeRefV01(value) ? value : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function isSupplied(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
