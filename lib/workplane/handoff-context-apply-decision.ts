import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import {
  HANDOFF_CONTEXT_APPLY_DECISION_PREVIEW_VERSION,
  type HandoffContextApplyDecisionAuthorityBoundary,
  type HandoffContextApplyOperatorDecisionPreview,
  type HandoffContextApplyOperatorDecisionPreviewInput,
} from "@/types/handoff-context-apply-slice-decision";
import {
  HANDOFF_CONTEXT_APPLY_PREVIEW_VERSION,
  type HandoffContextApplyPreview,
} from "@/types/handoff-context-apply-slice-preview";

type RecordValue = Record<string, unknown>;

export function createHandoffContextApplyDecisionAuthorityBoundaryV01():
  HandoffContextApplyDecisionAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    decision_preview_only: true,
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
      "Decision preview only records operator intent for a future scoped local Handoff Context apply record write.",
      "It cannot write DB, mutate live handoff context, send or copy/export packets, memory, metrics, routes, or external systems.",
    ],
  };
}

export function buildHandoffContextApplyOperatorDecisionPreviewV01(
  input: HandoffContextApplyOperatorDecisionPreviewInput = {},
): HandoffContextApplyOperatorDecisionPreview {
  const asOf = input.as_of ?? new Date().toISOString();
  const sourceRefs = publicSafeRefs(input.source_refs ?? []);
  const preview = parseApplyPreview(input.handoff_context_apply_preview);
  const requestedOperatorRef = safeRef(input.requested_operator_ref);
  const requestedIdempotencyKey = safeRef(input.requested_idempotency_key);
  const reviewConfirmationRef = safeRef(input.review_confirmation_ref);
  const blockers: string[] = [];
  const missingEvidence: string[] = [];
  const refusals: string[] = [];
  const insufficientData: string[] = [];

  if (!preview) insufficientData.push("handoff_context_apply_preview_missing");
  if (preview && preview.apply_preview_status !== "ready_for_future_handoff_context_apply_record_write") {
    blockers.push("handoff_context_apply_preview_not_ready");
  }
  if (input.operator_decision_intent !== "approve_for_handoff_context_apply_record") {
    blockers.push("operator_decision_intent_not_approve_for_handoff_context_apply_record");
  }
  if (!requestedOperatorRef) missingEvidence.push("requested_operator_ref_missing");
  if (!requestedIdempotencyKey) missingEvidence.push("requested_idempotency_key_missing");
  if (!reviewConfirmationRef) missingEvidence.push("review_confirmation_ref_missing");
  if (!sourceRefs.length) missingEvidence.push("source_refs_missing");
  for (const [label, value] of [
    ["requested_operator_ref", input.requested_operator_ref],
    ["requested_idempotency_key", input.requested_idempotency_key],
    ["review_confirmation_ref", input.review_confirmation_ref],
  ] as const) {
    if (typeof value === "string" && !safeRef(value)) {
      refusals.push(`${label}_unsafe`);
    }
  }

  const allBlockers = uniqueCandidateIngressStringsV01(blockers);
  const allMissingEvidence = uniqueCandidateIngressStringsV01(missingEvidence);
  const allRefusals = uniqueCandidateIngressStringsV01(refusals);
  const allInsufficientData = uniqueCandidateIngressStringsV01(insufficientData);
  const ready =
    Boolean(preview) &&
    allBlockers.length === 0 &&
    allMissingEvidence.length === 0 &&
    allRefusals.length === 0 &&
    allInsufficientData.length === 0;

  return {
    preview_version: HANDOFF_CONTEXT_APPLY_DECISION_PREVIEW_VERSION,
    scope: input.scope ?? "project:augnes",
    as_of: asOf,
    source_refs: sourceRefs,
    decision_preview_status: ready
      ? "ready_for_future_handoff_context_apply_record_write"
      : allBlockers.length || allRefusals.length
        ? "blocked"
        : allMissingEvidence.length
          ? "ready_for_operator_review"
          : "insufficient_data",
    recommended_operator_decision: ready
      ? "approve_for_handoff_context_apply_record"
      : input.operator_decision_intent === "reject"
        ? "reject"
        : "keep_preview_only",
    available_operator_decisions: [
      "approve_for_handoff_context_apply_record",
      "keep_preview_only",
      "reject",
    ],
    input_summary: {
      has_apply_preview: Boolean(preview),
      apply_preview_status: preview?.apply_preview_status ?? null,
      operator_decision_intent: input.operator_decision_intent ?? null,
      proposed_entry_count:
        preview?.proposed_applied_handoff_context_summary.applied_entry_count ?? 0,
      blocker_count: allBlockers.length,
      missing_evidence_count: allMissingEvidence.length,
      refusal_reason_count: allRefusals.length,
      insufficient_data_reason_count: allInsufficientData.length,
      requested_operator_ref_supplied: Boolean(requestedOperatorRef),
      requested_idempotency_key_supplied: Boolean(requestedIdempotencyKey),
      review_confirmation_supplied: Boolean(reviewConfirmationRef),
    },
    source_status: {
      apply_preview: preview
        ? preview.apply_preview_status ===
          "ready_for_future_handoff_context_apply_record_write"
          ? "supplied"
          : "not_ready"
        : input.handoff_context_apply_preview
          ? "malformed"
          : "missing",
      operator_decision_intent:
        input.operator_decision_intent === "approve_for_handoff_context_apply_record"
          ? "approve"
          : input.operator_decision_intent === "reject"
            ? "reject"
            : input.operator_decision_intent === "keep_preview_only"
              ? "keep_preview_only"
              : "missing",
      authority_boundary: preview?.authority_boundary?.can_write_db === false
        ? "valid_read_only"
        : preview
          ? "invalid"
          : "missing",
    },
    write_readiness: {
      write_ready: ready,
      readiness_label: ready ? "ready" : "not_ready",
      requires_apply_preview: true,
      requires_approval_intent: true,
      requires_review_confirmation: true,
      requires_idempotency_key: true,
      requires_operator_ref: true,
      requires_no_blockers: true,
      current_blockers: allBlockers,
      current_missing_evidence: allMissingEvidence,
      current_refusal_reasons: allRefusals,
      current_insufficient_data: allInsufficientData,
    },
    approval_requirements: [
      "operator_must_approve_scoped_local_handoff_context_apply_record",
      "operator_must_confirm_no_handoff_send_copy_export_or_live_mutation",
    ],
    blocking_reasons: allBlockers,
    missing_evidence: allMissingEvidence,
    refusal_reasons: allRefusals,
    evidence_summary: {
      has_apply_preview: Boolean(preview),
      apply_preview_ready:
        preview?.apply_preview_status ===
        "ready_for_future_handoff_context_apply_record_write",
      has_source_refs: sourceRefs.length > 0,
      has_evidence_refs:
        (preview?.evidence_summary.evidence_refs.length ?? 0) > 0,
      authority_boundary_valid:
        preview?.authority_boundary.can_write_db === false &&
        preview.authority_boundary.can_send_handoff === false,
      no_live_handoff_mutation_confirmed: true,
      no_handoff_send_confirmed: true,
      no_copy_export_confirmed: true,
      source_refs: uniqueCandidateIngressStringsV01([
        ...sourceRefs,
        ...(preview?.source_refs ?? []),
      ]),
      evidence_refs: preview?.evidence_summary.evidence_refs ?? [],
      missing_evidence: allMissingEvidence,
    },
    would_write_handoff_context_apply_decision_preview: {
      decision_kind: "handoff_context_apply_operator_decision_preview.v0.1",
      requested_operator_ref: requestedOperatorRef,
      requested_idempotency_key: requestedIdempotencyKey,
      review_confirmation_ref: reviewConfirmationRef,
      contract_preview: preview,
    },
    operator_review_checklist: [
      "confirm_apply_preview_is_ready",
      "confirm_operator_intent_approves_only_scoped_local_apply_record",
      "confirm_no_handoff_send_copy_export_or_live_mutation",
    ],
    would_not_write: [
      "does_not_write_apply_record",
      "does_not_apply_live_handoff_context",
      "does_not_send_or_copy_export_handoff_packet",
      "does_not_call_external_systems",
    ],
    non_goals: [
      "no_live_handoff_context_update",
      "no_handoff_send",
      "no_handoff_packet_copy_export",
      "no_memory_metric_route_or_external_write",
    ],
    authority_boundary: createHandoffContextApplyDecisionAuthorityBoundaryV01(),
  };
}

function parseApplyPreview(value: unknown): HandoffContextApplyPreview | null {
  if (!isRecord(value)) return null;
  if (value.preview_version !== HANDOFF_CONTEXT_APPLY_PREVIEW_VERSION) return null;
  return value as unknown as HandoffContextApplyPreview;
}

function publicSafeRefs(values: unknown[]): string[] {
  return uniqueCandidateIngressStringsV01(values).filter(
    isCandidateIngressPublicSafeRefV01,
  );
}

function safeRef(value: unknown): string | null {
  return isCandidateIngressPublicSafeRefV01(value) ? value : null;
}

function isRecord(value: unknown): value is RecordValue {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
