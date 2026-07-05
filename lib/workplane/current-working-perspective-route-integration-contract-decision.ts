import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_DECISION_PREVIEW_VERSION,
  type CurrentWorkingPerspectiveRouteIntegrationContractDecisionAuthorityBoundary,
  type CurrentWorkingPerspectiveRouteIntegrationContractDecisionPreviewInput,
  type CurrentWorkingPerspectiveRouteIntegrationContractDecisionPreviewStatus,
  type CurrentWorkingPerspectiveRouteIntegrationContractOperatorDecisionIntent,
  type CurrentWorkingPerspectiveRouteIntegrationContractOperatorDecisionPreview,
} from "@/types/current-working-perspective-route-integration-contract-decision";
import {
  CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_PREVIEW_VERSION,
  type CurrentWorkingPerspectiveRouteIntegrationContractPreview,
  type CurrentWorkingPerspectiveRouteIntegrationContractReadiness,
} from "@/types/current-working-perspective-route-integration-contract-preview";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const CWP_ROUTE_INTEGRATION_SCOPE = "project:augnes" as const;

export function buildCurrentWorkingPerspectiveRouteIntegrationContractOperatorDecisionPreviewV01({
  current_working_perspective_route_integration_contract_preview,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
  operator_decision_intent,
  scope,
  as_of,
  source_refs,
}: CurrentWorkingPerspectiveRouteIntegrationContractDecisionPreviewInput = {}):
  CurrentWorkingPerspectiveRouteIntegrationContractOperatorDecisionPreview {
  const contractPreview = isRouteIntegrationContractPreview(
    current_working_perspective_route_integration_contract_preview,
  )
    ? current_working_perspective_route_integration_contract_preview
    : null;
  const sourceRefs = uniqueCandidateIngressStringsV01([
    ...(source_refs ?? []),
    ...safeStringArray(contractPreview?.source_refs),
  ]);
  const evidenceRefs = uniqueCandidateIngressStringsV01(
    safeStringArray(contractPreview?.evidence_summary?.evidence_refs),
  );
  const unsafeRefs = uniqueCandidateIngressStringsV01(
    [
      ...sourceRefs,
      ...evidenceRefs,
      ...(requested_operator_ref ? [requested_operator_ref] : []),
      ...(requested_idempotency_key ? [requested_idempotency_key] : []),
      ...(review_confirmation_ref ? [review_confirmation_ref] : []),
    ].filter((ref) => !isCandidateIngressPublicSafeRefV01(ref)),
  );
  const contractReady =
    contractPreview?.contract_preview_status ===
      "ready_for_future_current_working_perspective_route_integration_contract_record_write" &&
    contractPreview.contract_readiness.write_ready === true;
  const blockingReasons = uniqueCandidateIngressStringsV01([
    ...(isSupplied(current_working_perspective_route_integration_contract_preview) &&
    !contractPreview
      ? ["current_working_perspective_route_integration_contract_preview_malformed"]
      : []),
    ...(contractPreview && !contractReady
      ? ["current_working_perspective_route_integration_contract_preview_not_ready"]
      : []),
    ...(contractPreview?.blocking_reasons ?? []),
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...(contractPreview?.missing_evidence ?? []),
    ...(sourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(evidenceRefs.length === 0 ? ["evidence_refs_missing"] : []),
  ]);
  const refusalReasons = uniqueCandidateIngressStringsV01([
    ...(unsafeRefs.length > 0
      ? ["current_working_perspective_route_integration_decision_refs_unsafe"]
      : []),
    ...(operator_decision_intent &&
    ![
      "approve_for_current_working_perspective_route_integration_contract_record",
      "keep_runtime_only",
      "keep_preview_only",
      "reject",
    ].includes(operator_decision_intent)
      ? ["operator_decision_intent_unsupported"]
      : []),
  ]);
  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(!contractPreview
      ? ["current_working_perspective_route_integration_contract_preview_missing"]
      : []),
    ...(!requested_operator_ref ? ["operator_ref_missing"] : []),
    ...(!requested_idempotency_key ? ["idempotency_key_missing"] : []),
    ...(!review_confirmation_ref ? ["review_confirmation_ref_missing"] : []),
    ...(operator_decision_intent !==
    "approve_for_current_working_perspective_route_integration_contract_record"
      ? ["operator_approval_intent_missing"]
      : []),
  ]);
  const writeReadiness = buildDecisionReadiness({
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });
  const status = determineStatus({
    hasContractPreview: Boolean(contractPreview),
    writeReadiness,
    blockingReasons,
    refusalReasons,
    insufficientData,
  });

  return {
    preview_version:
      CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_DECISION_PREVIEW_VERSION,
    scope: scope ?? contractPreview?.scope ?? CWP_ROUTE_INTEGRATION_SCOPE,
    as_of: as_of ?? contractPreview?.as_of ?? FALLBACK_AS_OF,
    source_refs: sourceRefs,
    decision_preview_status: status,
    recommended_operator_decision: determineRecommendedDecision(status),
    available_operator_decisions: [
      "approve_for_current_working_perspective_route_integration_contract_record",
      "keep_runtime_only",
      "keep_preview_only",
      "reject",
    ],
    input_summary: {
      has_contract_preview: Boolean(contractPreview),
      contract_preview_ready: contractReady,
      operator_decision_intent: operator_decision_intent ?? null,
      requested_operator_ref_supplied: Boolean(requested_operator_ref),
      requested_idempotency_key_supplied: Boolean(requested_idempotency_key),
      review_confirmation_supplied: Boolean(review_confirmation_ref),
      blocker_count: blockingReasons.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusalReasons.length,
      insufficient_data_reason_count: insufficientData.length,
    },
    source_status: {
      current_working_perspective_route_integration_contract_preview:
        contractPreview
          ? contractReady
            ? "supplied"
            : "not_ready"
          : isSupplied(current_working_perspective_route_integration_contract_preview)
            ? "malformed"
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
      operator_decision_intent: operator_decision_intent
        ? operator_decision_intent ===
          "approve_for_current_working_perspective_route_integration_contract_record"
          ? "supplied"
          : "unsupported"
        : "missing",
    },
    write_readiness: writeReadiness,
    approval_requirements: [
      "review_ready_current_working_perspective_route_integration_contract_preview",
      "approve_only_scoped_local_route_integration_contract_record_write",
      "confirm_no_api_perspective_current_route_modification",
      "confirm_no_upstream_cwp_handoff_memory_metric_or_external_mutation",
    ],
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_ready_contract_preview: contractReady,
      has_review_confirmation: Boolean(review_confirmation_ref),
      has_idempotency_key: Boolean(requested_idempotency_key),
      has_operator_ref: Boolean(requested_operator_ref),
      has_approval_intent:
        operator_decision_intent ===
        "approve_for_current_working_perspective_route_integration_contract_record",
      has_missing_evidence: missingEvidence.length > 0,
      has_refusal_reasons: refusalReasons.length > 0,
      source_refs: sourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
    },
    would_write_current_working_perspective_route_integration_contract_decision_preview:
      {
        operator_decision:
          operator_decision_intent ===
          "approve_for_current_working_perspective_route_integration_contract_record"
            ? "approve_for_current_working_perspective_route_integration_contract_record"
            : null,
        requested_operator_ref: requested_operator_ref ?? null,
        requested_idempotency_key: requested_idempotency_key ?? null,
        review_confirmation_ref: review_confirmation_ref ?? null,
        route_path: "/api/perspective/current",
        route_integration_mode:
          contractPreview?.input_summary.requested_route_integration_mode ?? null,
        source_refs: sourceRefs,
        evidence_refs: evidenceRefs,
        contract_preview: contractPreview,
      },
    operator_review_checklist: [
      "confirm_route_integration_contract_preview_is_ready",
      "confirm_operator_decision_is_explicit_approval",
      "confirm_idempotency_and_operator_refs_match_writer_input",
      "confirm_api_perspective_current_modification_remains_future_slice",
    ],
    would_not_write: [
      "does_not_write_record_from_decision_preview",
      "does_not_modify_api_perspective_current_route",
      "does_not_replace_route_response",
      "does_not_write_applied_snapshots_or_apply_records",
      "does_not_apply_handoff_relay_memory_or_metrics",
      "does_not_call_provider_github_or_codex",
    ],
    non_goals: [
      "api_perspective_current_route_integration",
      "route_response_replacement",
      "upstream_cwp_source_table_mutation",
      "applied_snapshot_write",
      "handoff_context_apply",
      "memory_or_metric_write",
      "external_action",
    ],
    authority_boundary:
      createCurrentWorkingPerspectiveRouteIntegrationContractDecisionAuthorityBoundaryV01(),
  };
}

export function createCurrentWorkingPerspectiveRouteIntegrationContractDecisionAuthorityBoundaryV01():
  CurrentWorkingPerspectiveRouteIntegrationContractDecisionAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    operator_decision_preview_only: true,
    source_of_truth: false,
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
      "Read-only operator decision preview for a scoped local CWP route integration contract record.",
      "The writer must still validate and persist the contract record separately.",
    ],
  };
}

function buildDecisionReadiness({
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
  hasContractPreview,
  writeReadiness,
  blockingReasons,
  refusalReasons,
  insufficientData,
}: {
  hasContractPreview: boolean;
  writeReadiness: CurrentWorkingPerspectiveRouteIntegrationContractReadiness;
  blockingReasons: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): CurrentWorkingPerspectiveRouteIntegrationContractDecisionPreviewStatus {
  if (!hasContractPreview) {
    return "no_current_working_perspective_route_integration_contract_preview";
  }
  if (blockingReasons.length > 0 || refusalReasons.length > 0) return "blocked";
  if (insufficientData.length > 0) return "insufficient_data";
  if (writeReadiness.write_ready) {
    return "ready_for_future_current_working_perspective_route_integration_contract_record_write";
  }
  return "ready_for_operator_review";
}

function determineRecommendedDecision(
  status: CurrentWorkingPerspectiveRouteIntegrationContractDecisionPreviewStatus,
):
  CurrentWorkingPerspectiveRouteIntegrationContractOperatorDecisionPreview["recommended_operator_decision"] {
  if (
    status ===
    "ready_for_future_current_working_perspective_route_integration_contract_record_write"
  ) {
    return "approve_for_current_working_perspective_route_integration_contract_record";
  }
  if (status === "blocked") {
    return "resolve_current_working_perspective_route_integration_blockers";
  }
  return "keep_preview_only";
}

function isRouteIntegrationContractPreview(
  value: unknown,
): value is CurrentWorkingPerspectiveRouteIntegrationContractPreview {
  return (
    isRecord(value) &&
    value.preview_version ===
      CURRENT_WORKING_PERSPECTIVE_ROUTE_INTEGRATION_CONTRACT_PREVIEW_VERSION &&
    isRecord(value.contract_readiness) &&
    isRecord(value.proposed_current_working_perspective_route_integration_contract) &&
    isRecord(
      value
        .would_write_current_working_perspective_route_integration_contract_record_preview,
    )
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

function isSupplied(value: unknown): boolean {
  return value !== undefined && value !== null;
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
