import { createHash } from "node:crypto";

import {
  isCandidateIngressPublicSafeRefV01,
  uniqueCandidateIngressStringsV01,
} from "@/lib/intake/candidate-ingress-normalizer";
import { CURRENT_WORKING_PERSPECTIVE_VERSION } from "@/types/current-working-perspective";
import { CONTINUITY_RELAY_RECORD_REVIEW_VERSION } from "@/types/continuity-relay-record-review";
import {
  CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_PREVIEW_VERSION,
  type CurrentWorkingPerspectivePatchEntry,
  type CurrentWorkingPerspectivePatchOperation,
  type CurrentWorkingPerspectivePatchTarget,
  type CurrentWorkingPerspectiveUpdateContractAuthorityBoundary,
  type CurrentWorkingPerspectiveUpdateContractMaterial,
  type CurrentWorkingPerspectiveUpdateContractPreview,
  type CurrentWorkingPerspectiveUpdateContractPreviewInput,
  type CurrentWorkingPerspectiveUpdateContractPreviewStatus,
  type CurrentWorkingPerspectiveUpdateContractRecommendedNextAction,
  type CurrentWorkingPerspectiveUpdateContractReadiness,
} from "@/types/current-working-perspective-update-contract-preview";
import { PERSPECTIVE_NEXT_WORK_BIAS_RECORD_REVIEW_VERSION } from "@/types/perspective-next-work-bias-record-review";
import { PERSPECTIVE_RELAY_UPDATE_DECISION_RECORD_REVIEW_VERSION } from "@/types/perspective-relay-update-decision-record-review";
import { PERSPECTIVE_RELAY_UPDATE_WRITE_CONTRACT_PREVIEW_VERSION } from "@/types/perspective-relay-update-write-contract-preview";
import { PERSPECTIVE_UNIT_RECORD_REVIEW_VERSION } from "@/types/perspective-unit-record-review";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z" as const;
const CWP_CONTRACT_SCOPE = "project:augnes" as const;

export function buildCurrentWorkingPerspectiveUpdateContractPreviewV01({
  current_working_perspective_read,
  current_working_perspective,
  perspective_next_work_bias_record_review,
  perspective_unit_record_review,
  continuity_relay_record_review,
  perspective_relay_update_decision_record_review,
  perspective_relay_update_write_contract_preview,
  requested_operator_ref,
  requested_idempotency_key,
  review_confirmation_ref,
  scope,
  as_of,
  source_refs,
}: CurrentWorkingPerspectiveUpdateContractPreviewInput = {}): CurrentWorkingPerspectiveUpdateContractPreview {
  const cwpSource = resolveCurrentWorkingPerspectiveSource({
    current_working_perspective_read,
    current_working_perspective,
  });
  const cwp = cwpSource.currentWorkingPerspective;
  const perspectiveUnitReview = isPerspectiveUnitRecordReview(
    perspective_unit_record_review,
  )
    ? perspective_unit_record_review
    : null;
  const nextWorkBiasReview = isNextWorkBiasRecordReview(
    perspective_next_work_bias_record_review,
  )
    ? perspective_next_work_bias_record_review
    : null;
  const continuityRelayReview = isContinuityRelayRecordReview(
    continuity_relay_record_review,
  )
    ? continuity_relay_record_review
    : null;
  const decisionReview = isDecisionRecordReview(
    perspective_relay_update_decision_record_review,
  )
    ? perspective_relay_update_decision_record_review
    : null;
  const writeContractPreview = isRelayWriteContractPreview(
    perspective_relay_update_write_contract_preview,
  )
    ? perspective_relay_update_write_contract_preview
    : null;

  const perspectiveUnitRecordRefs = recordRefs(perspectiveUnitReview);
  const nextWorkBiasRecordRefs = recordRefs(nextWorkBiasReview);
  const continuityRelayRecordRefs = recordRefs(continuityRelayReview);
  const decisionRecordRefs = recordRefs(decisionReview);
  const writeContractPreviewRef =
    typeof writeContractPreview?.preview_ref === "string"
      ? writeContractPreview.preview_ref
      : typeof writeContractPreview?.as_of === "string"
        ? `perspective-relay-update-write-contract:${writeContractPreview.as_of}`
        : null;
  const combinedSourceRefs = uniqueCandidateIngressStringsV01([
    ...(source_refs ?? []),
    ...safeStringArray(cwp?.current_frame?.source_refs),
    ...safeStringArray(cwp?.current_thesis?.source_refs),
    ...safeStringArray(perspectiveUnitReview?.source_refs),
    ...safeStringArray(nextWorkBiasReview?.source_refs),
    ...safeStringArray(continuityRelayReview?.source_refs),
    ...safeStringArray(decisionReview?.source_refs),
  ]);
  const evidenceRefs = uniqueCandidateIngressStringsV01([
    ...safeStringArray(perspectiveUnitReview?.evidence_summary?.evidence_refs),
    ...safeStringArray(nextWorkBiasReview?.evidence_summary?.evidence_refs),
    ...safeStringArray(continuityRelayReview?.evidence_summary?.evidence_refs),
    ...perspectiveUnitRecords(perspectiveUnitReview).flatMap((record) =>
      safeStringArray(record.evidence_refs),
    ),
    ...nextWorkBiasRecords(nextWorkBiasReview).flatMap((record) =>
      safeStringArray(record.evidence_refs),
    ),
    ...continuityRelayRecords(continuityRelayReview).flatMap((record) =>
      safeStringArray(record.evidence_refs),
    ),
  ]);
  const refsToValidate = [
    ...combinedSourceRefs,
    ...evidenceRefs,
    ...perspectiveUnitRecordRefs,
    ...nextWorkBiasRecordRefs,
    ...continuityRelayRecordRefs,
    ...decisionRecordRefs,
    ...(writeContractPreviewRef ? [writeContractPreviewRef] : []),
    ...(requested_operator_ref ? [requested_operator_ref] : []),
    ...(requested_idempotency_key ? [requested_idempotency_key] : []),
    ...(review_confirmation_ref ? [review_confirmation_ref] : []),
  ];
  const unsafeRefs = uniqueCandidateIngressStringsV01(
    refsToValidate.filter((ref) => !isCandidateIngressPublicSafeRefV01(ref)),
  );

  const proposedPatchEntries = cwp
    ? buildPatchEntries({
        perspectiveUnitRecords: perspectiveUnitRecords(perspectiveUnitReview),
        nextWorkBiasRecords: nextWorkBiasRecords(nextWorkBiasReview),
        continuityRelayRecords: continuityRelayRecords(continuityRelayReview),
        sourceRefs: combinedSourceRefs,
        evidenceRefs,
      })
    : [];
  const currentCwpRef = cwp
    ? `current-working-perspective:${hashText(
        `${cwp.scope}:${cwp.as_of}:${cwp.perspective_version}`,
      ).slice(0, 16)}`
    : null;
  const contributingRecordRefs = {
    perspective_unit_record_refs: perspectiveUnitRecordRefs,
    next_work_bias_record_refs: nextWorkBiasRecordRefs,
    continuity_relay_record_refs: continuityRelayRecordRefs,
    perspective_relay_update_decision_record_refs: decisionRecordRefs,
    perspective_relay_update_write_contract_preview_ref: writeContractPreviewRef,
  };
  const proposedContract = buildProposedContract({
    currentCwpRef,
    cwpVersion:
      cwp?.perspective_version === CURRENT_WORKING_PERSPECTIVE_VERSION
        ? CURRENT_WORKING_PERSPECTIVE_VERSION
        : null,
    contributingRecordRefs,
    proposedPatchEntries,
    sourceRefs: combinedSourceRefs,
    evidenceRefs,
  });

  const blockingReasons = uniqueCandidateIngressStringsV01([
    ...(cwpSource.malformed ? ["current_working_perspective_material_malformed"] : []),
    ...(cwp && cwp.perspective_version !== CURRENT_WORKING_PERSPECTIVE_VERSION
      ? ["current_working_perspective_version_invalid"]
      : []),
    ...(cwp && cwp.scope !== CWP_CONTRACT_SCOPE
      ? ["current_working_perspective_scope_invalid"]
      : []),
    ...(cwp && !hasReadOnlyCurrentWorkingPerspectiveAuthority(cwp)
      ? ["current_working_perspective_authority_boundary_invalid"]
      : []),
    ...(cwpSource.sourceStatus === "fixture_fallback"
      ? ["current_working_perspective_fixture_fallback_not_writable"]
      : []),
    ...(cwpSource.sourceStatus === "empty_fallback"
      ? ["current_working_perspective_empty_fallback_not_writable"]
      : []),
    ...recordReviewBlockingReasons({
      name: "perspective_unit_record_review",
      supplied: isSupplied(perspective_unit_record_review),
      review: perspectiveUnitReview,
    }),
    ...recordReviewBlockingReasons({
      name: "perspective_next_work_bias_record_review",
      supplied: isSupplied(perspective_next_work_bias_record_review),
      review: nextWorkBiasReview,
    }),
    ...recordReviewBlockingReasons({
      name: "continuity_relay_record_review",
      supplied: isSupplied(continuity_relay_record_review),
      review: continuityRelayReview,
    }),
  ]);
  const missingEvidence = uniqueCandidateIngressStringsV01([
    ...(combinedSourceRefs.length === 0 ? ["source_refs_missing"] : []),
    ...(evidenceRefs.length === 0 ? ["evidence_refs_missing"] : []),
    ...safeStringArray(perspectiveUnitReview?.evidence_summary?.missing_evidence),
    ...safeStringArray(nextWorkBiasReview?.evidence_summary?.missing_evidence),
    ...safeStringArray(continuityRelayReview?.evidence_summary?.missing_evidence),
  ]);
  const refusalReasons = uniqueCandidateIngressStringsV01([
    ...(unsafeRefs.length > 0 ? ["current_working_perspective_update_contract_refs_unsafe"] : []),
  ]);
  const insufficientData = uniqueCandidateIngressStringsV01([
    ...(!cwp ? ["current_working_perspective_material_missing"] : []),
    ...requiredReviewInsufficientReasons({
      name: "perspective_unit_record_review",
      review: perspectiveUnitReview,
    }),
    ...requiredReviewInsufficientReasons({
      name: "perspective_next_work_bias_record_review",
      review: nextWorkBiasReview,
    }),
    ...requiredReviewInsufficientReasons({
      name: "continuity_relay_record_review",
      review: continuityRelayReview,
    }),
    ...(!requested_operator_ref ? ["operator_ref_missing"] : []),
    ...(!requested_idempotency_key ? ["idempotency_key_missing"] : []),
    ...(!review_confirmation_ref ? ["review_confirmation_ref_missing"] : []),
    ...(proposedPatchEntries.length === 0
      ? ["current_working_perspective_update_patch_entries_missing"]
      : []),
  ]);
  const contractReadiness = buildReadiness({
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });
  const status = determineStatus({
    hasCurrentMaterial: Boolean(cwp),
    contractReadiness,
    blockingReasons,
    missingEvidence,
    refusalReasons,
    insufficientData,
  });

  return {
    preview_version: CURRENT_WORKING_PERSPECTIVE_UPDATE_CONTRACT_PREVIEW_VERSION,
    scope: scope ?? cwp?.scope ?? CWP_CONTRACT_SCOPE,
    as_of: as_of ?? cwp?.as_of ?? FALLBACK_AS_OF,
    source_refs: combinedSourceRefs,
    contract_preview_status: status,
    recommended_next_action: determineRecommendedNextAction(status),
    input_summary: {
      has_current_working_perspective_material: Boolean(cwp),
      current_working_perspective_source_status: cwpSource.sourceStatus,
      perspective_unit_valid_record_count:
        perspectiveUnitReview?.input_summary?.valid_record_count ?? 0,
      next_work_bias_valid_record_count:
        nextWorkBiasReview?.input_summary?.valid_record_count ?? 0,
      continuity_relay_valid_record_count:
        continuityRelayReview?.input_summary?.valid_record_count ?? 0,
      proposed_patch_entry_count: proposedPatchEntries.length,
      blocker_count: blockingReasons.length,
      missing_evidence_count: missingEvidence.length,
      refusal_reason_count: refusalReasons.length,
      insufficient_data_reason_count: insufficientData.length,
      review_confirmation_supplied: Boolean(review_confirmation_ref),
      requested_idempotency_key_supplied: Boolean(requested_idempotency_key),
      requested_operator_ref_supplied: Boolean(requested_operator_ref),
    },
    source_status: {
      current_working_perspective: cwpSource.status,
      perspective_unit_record_review: sourceStatusForReview(
        perspective_unit_record_review,
        perspectiveUnitReview,
      ),
      perspective_next_work_bias_record_review: sourceStatusForReview(
        perspective_next_work_bias_record_review,
        nextWorkBiasReview,
      ),
      continuity_relay_record_review: sourceStatusForReview(
        continuity_relay_record_review,
        continuityRelayReview,
      ),
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
    contract_readiness: contractReadiness,
    approval_requirements: [
      "review_current_working_perspective_read_model",
      "confirm_perspective_unit_next_work_bias_and_continuity_relay_records_are_valid",
      "confirm_proposed_patch_entries_are_source_refed",
      "confirm_only_scoped_local_cwp_update_contract_record_and_receipt_may_be_written",
      "confirm_no_live_cwp_relay_handoff_memory_metric_or_external_mutation",
    ],
    blocking_reasons: blockingReasons,
    missing_evidence: missingEvidence,
    refusal_reasons: refusalReasons,
    evidence_summary: {
      has_valid_current_working_perspective_material:
        Boolean(cwp) &&
        cwpSource.sourceStatus !== "fixture_fallback" &&
        cwpSource.sourceStatus !== "empty_fallback" &&
        blockingReasons.every(
          (reason) => !reason.startsWith("current_working_perspective_"),
        ),
      has_perspective_unit_records:
        (perspectiveUnitReview?.input_summary?.valid_record_count ?? 0) > 0,
      has_next_work_bias_records:
        (nextWorkBiasReview?.input_summary?.valid_record_count ?? 0) > 0,
      has_continuity_relay_records:
        (continuityRelayReview?.input_summary?.valid_record_count ?? 0) > 0,
      has_source_refs: combinedSourceRefs.length > 0,
      has_evidence_refs: evidenceRefs.length > 0,
      has_review_confirmation: Boolean(review_confirmation_ref),
      has_idempotency_key: Boolean(requested_idempotency_key),
      has_operator_ref: Boolean(requested_operator_ref),
      has_missing_evidence: missingEvidence.length > 0,
      has_refusal_reasons: refusalReasons.length > 0,
      has_unsafe_refs: unsafeRefs.length > 0,
      source_refs: combinedSourceRefs,
      evidence_refs: evidenceRefs,
      missing_evidence: missingEvidence,
      unsafe_refs: unsafeRefs,
    },
    current_working_perspective_summary: {
      current_cwp_ref: currentCwpRef,
      perspective_version: typeof cwp?.perspective_version === "string"
        ? cwp.perspective_version
        : null,
      scope: typeof cwp?.scope === "string" ? cwp.scope : null,
      as_of: typeof cwp?.as_of === "string" ? cwp.as_of : null,
      source_status: cwpSource.sourceStatus,
      current_frame_summary:
        typeof cwp?.current_frame?.summary === "string"
          ? cwp.current_frame.summary
          : null,
      current_thesis_summary:
        typeof cwp?.current_thesis?.summary === "string"
          ? cwp.current_thesis.summary
          : null,
      active_goal_count: Array.isArray(cwp?.active_goals)
        ? cwp.active_goals.length
        : 0,
      open_question_count: Array.isArray(cwp?.open_questions)
        ? cwp.open_questions.length
        : 0,
      active_risk_count: Array.isArray(cwp?.active_risks)
        ? cwp.active_risks.length
        : 0,
      next_candidate_count: Array.isArray(cwp?.next_candidates)
        ? cwp.next_candidates.length
        : 0,
      staleness_status:
        typeof cwp?.staleness?.status === "string"
          ? cwp.staleness.status
          : null,
    },
    contributing_record_refs: contributingRecordRefs,
    proposed_current_working_perspective_update_contract: proposedContract,
    would_write_current_working_perspective_update_contract_record_preview: {
      proposed_record_kind:
        "current_working_perspective_update_contract_record.v0.1",
      proposed_receipt_kind:
        "current_working_perspective_update_contract_receipt.v0.1",
      proposed_store_kind:
        "current_working_perspective_update_contract_store.v0.1",
      current_cwp_ref: currentCwpRef,
      source_refs: combinedSourceRefs,
      evidence_refs: evidenceRefs,
      contributing_record_refs: contributingRecordRefs,
      proposed_patch_entries: proposedPatchEntries,
      requested_operator_ref: requested_operator_ref ?? null,
      requested_idempotency_key: requested_idempotency_key ?? null,
      review_confirmation_ref: review_confirmation_ref ?? null,
      review_summary:
        "Would write only a scoped local CurrentWorkingPerspective update contract record and receipt; it would not mutate live CWP.",
    },
    operator_review_checklist: [
      "review_current_cwp_source_status",
      "review_all_three_scoped_record_families",
      "review_proposed_patch_entries_by_target",
      "confirm_future_apply_requirements_are_separate",
      "confirm_no_live_cwp_or_handoff_mutation",
    ],
    would_not_write: [
      "does_not_write_live_current_working_perspective",
      "does_not_apply_current_working_perspective_update",
      "does_not_write_perspective_unit_next_work_bias_or_continuity_relay",
      "does_not_apply_live_relay_state",
      "does_not_mutate_apply_or_send_handoff",
      "does_not_write_memory_metrics_or_upstream_ledgers",
      "does_not_call_provider_openai_github_or_codex",
    ],
    non_goals: [
      "live_current_working_perspective_mutation",
      "live_current_working_perspective_apply_route",
      "perspective_unit_write",
      "next_work_bias_write",
      "continuity_relay_write_or_update",
      "handoff_context_apply_or_send",
      "memory_or_metric_write",
      "external_runtime_action",
    ],
    authority_boundary:
      createCurrentWorkingPerspectiveUpdateContractAuthorityBoundaryV01(),
  };
}

export function createCurrentWorkingPerspectiveUpdateContractAuthorityBoundaryV01():
  CurrentWorkingPerspectiveUpdateContractAuthorityBoundary {
  return {
    read_only: true,
    advisory_only: true,
    contract_material_only: true,
    source_of_truth: false,
    derived_read_model: true,
    can_write_db: false,
    can_create_current_working_perspective_update_contract_record: false,
    can_update_current_working_perspective: false,
    can_mutate_current_working_perspective: false,
    can_write_current_working_perspective_live_state: false,
    can_apply_current_working_perspective_update: false,
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
      "Read-only contract preview for a future CurrentWorkingPerspective apply slice.",
      "This preview cannot write DB, mutate live CWP, write scoped record families, apply relay or handoff, write memory/metrics/upstream ledgers, or call external systems.",
    ],
  };
}

function resolveCurrentWorkingPerspectiveSource({
  current_working_perspective_read,
  current_working_perspective,
}: {
  current_working_perspective_read: unknown;
  current_working_perspective: unknown;
}): {
  currentWorkingPerspective: Record<string, any> | null;
  sourceStatus:
    | "runtime"
    | "supplied"
    | "fixture_fallback"
    | "empty_fallback"
    | "missing"
    | "malformed";
  status:
    | "supplied"
    | "runtime"
    | "fixture_fallback"
    | "empty_fallback"
    | "missing"
    | "wrong_version"
    | "wrong_scope"
    | "malformed";
  malformed: boolean;
} {
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
        currentWorkingPerspective: data,
        sourceStatus: sourceStatus as any,
        status:
          sourceStatus === "runtime"
            ? "runtime"
            : sourceStatus === "fixture_fallback"
              ? "fixture_fallback"
              : sourceStatus === "empty_fallback"
                ? "empty_fallback"
                : "supplied",
        malformed: false,
      };
    }
    return {
      currentWorkingPerspective: null,
      sourceStatus: "malformed",
      status: "malformed",
      malformed: true,
    };
  }
  if (isRecord(current_working_perspective)) {
    return {
      currentWorkingPerspective: current_working_perspective,
      sourceStatus: "supplied",
      status:
        current_working_perspective.perspective_version !==
        CURRENT_WORKING_PERSPECTIVE_VERSION
          ? "wrong_version"
          : current_working_perspective.scope !== CWP_CONTRACT_SCOPE
            ? "wrong_scope"
            : "supplied",
      malformed: false,
    };
  }
  if (isSupplied(current_working_perspective_read) || isSupplied(current_working_perspective)) {
    return {
      currentWorkingPerspective: null,
      sourceStatus: "malformed",
      status: "malformed",
      malformed: true,
    };
  }
  return {
    currentWorkingPerspective: null,
    sourceStatus: "missing",
    status: "missing",
    malformed: false,
  };
}

function hasReadOnlyCurrentWorkingPerspectiveAuthority(
  cwp: Record<string, any>,
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

function buildPatchEntries({
  perspectiveUnitRecords,
  nextWorkBiasRecords,
  continuityRelayRecords,
  sourceRefs,
  evidenceRefs,
}: {
  perspectiveUnitRecords: Record<string, any>[];
  nextWorkBiasRecords: Record<string, any>[];
  continuityRelayRecords: Record<string, any>[];
  sourceRefs: string[];
  evidenceRefs: string[];
}): CurrentWorkingPerspectivePatchEntry[] {
  const entries: CurrentWorkingPerspectivePatchEntry[] = [];
  for (const record of perspectiveUnitRecords) {
    const recordRef = record.record_id;
    const unitEntries = Array.isArray(record.perspective_unit_entries)
      ? record.perspective_unit_entries
      : [];
    for (const entry of unitEntries.slice(0, 8)) {
      const directive = String(entry.lifecycle_directive ?? "reinforce");
      entries.push(
        patchEntry({
          target: targetForPerspectiveUnitDirective(directive),
          operation:
            directive === "retire_or_deprioritize"
              ? "deprioritize"
              : directive === "weaken_or_warn"
                ? "warn"
                : "add",
          summary: String(entry.summary ?? `PerspectiveUnit ${entry.perspective_unit_ref}`),
          sourceRecordRefs: [recordRef],
          evidenceRefs: safeStringArray(entry.evidence_refs).length
            ? safeStringArray(entry.evidence_refs)
            : evidenceRefs,
          sourceRefs: safeStringArray(entry.source_refs).length
            ? safeStringArray(entry.source_refs)
            : sourceRefs,
          pressure: entry.review_pressure === "high" ? "high" : "medium",
        }),
      );
    }
  }
  for (const record of nextWorkBiasRecords) {
    const recordRef = record.record_id;
    const biasEntries = Array.isArray(record.next_work_bias_entries)
      ? record.next_work_bias_entries
      : [];
    for (const entry of biasEntries.slice(0, 8)) {
      const directive = String(entry.directive ?? "warn_next_time");
      entries.push(
        patchEntry({
          target: targetForNextWorkBiasDirective(directive),
          operation: directive.includes("drop") ? "deprioritize" : "warn",
          summary: String(entry.summary ?? `NextWorkBias ${entry.bias_ref}`),
          sourceRecordRefs: [recordRef],
          evidenceRefs: safeStringArray(entry.evidence_refs).length
            ? safeStringArray(entry.evidence_refs)
            : evidenceRefs,
          sourceRefs: safeStringArray(entry.source_refs).length
            ? safeStringArray(entry.source_refs)
            : sourceRefs,
          pressure: entry.review_pressure === "high" ? "high" : "medium",
        }),
      );
    }
  }
  for (const record of continuityRelayRecords) {
    const recordRef = record.record_id;
    const relayEntries = Array.isArray(record.continuity_relay_entries)
      ? record.continuity_relay_entries
      : [];
    for (const entry of relayEntries.slice(0, 8)) {
      const directive = String(entry.relay_directive ?? "preserve_anchor");
      entries.push(
        patchEntry({
          target: targetForContinuityRelayDirective(directive),
          operation: directive.includes("preserve") ? "preserve" : "align",
          summary: String(entry.summary ?? `ContinuityRelay ${entry.continuity_relay_ref}`),
          sourceRecordRefs: [recordRef],
          evidenceRefs: safeStringArray(entry.evidence_refs).length
            ? safeStringArray(entry.evidence_refs)
            : evidenceRefs,
          sourceRefs: safeStringArray(entry.source_refs).length
            ? safeStringArray(entry.source_refs)
            : sourceRefs,
          pressure: entry.review_pressure === "high" ? "high" : "medium",
        }),
      );
    }
  }
  return entries.map((entry, index) => ({
    ...entry,
    patch_ref: `cwp-update-contract-patch:${index + 1}:${hashText(
      `${entry.patch_target}:${entry.summary}:${entry.source_record_refs.join(",")}`,
    ).slice(0, 16)}`,
  }));
}

function patchEntry({
  target,
  operation,
  summary,
  sourceRecordRefs,
  evidenceRefs,
  sourceRefs,
  pressure,
}: {
  target: CurrentWorkingPerspectivePatchTarget;
  operation: CurrentWorkingPerspectivePatchOperation;
  summary: string;
  sourceRecordRefs: string[];
  evidenceRefs: string[];
  sourceRefs: string[];
  pressure: "low" | "medium" | "high";
}): CurrentWorkingPerspectivePatchEntry {
  return {
    patch_ref: "pending",
    patch_target: target,
    patch_operation: operation,
    summary,
    source_record_refs: uniqueCandidateIngressStringsV01(sourceRecordRefs),
    evidence_refs: uniqueCandidateIngressStringsV01(evidenceRefs),
    source_refs: uniqueCandidateIngressStringsV01(sourceRefs),
    review_pressure: pressure,
    authority_required: "future_current_working_perspective_apply",
    persistence_horizon: "current_working_perspective_update_contract_record",
  };
}

function targetForPerspectiveUnitDirective(
  directive: string,
): CurrentWorkingPerspectivePatchTarget {
  if (directive === "weaken_or_warn") return "active_risks";
  if (directive === "retire_or_deprioritize") return "rejected_assumptions";
  if (directive === "split_or_review") return "open_questions";
  return "current_thesis";
}

function targetForNextWorkBiasDirective(
  directive: string,
): CurrentWorkingPerspectivePatchTarget {
  if (directive.includes("verification")) return "review_queue_hints";
  if (directive.includes("context")) return "staleness_and_gaps";
  if (directive.includes("drop")) return "active_risks";
  return "next_candidates";
}

function targetForContinuityRelayDirective(
  directive: string,
): CurrentWorkingPerspectivePatchTarget {
  if (directive === "next_focus") return "next_candidates";
  if (directive === "stop_if_missing") return "active_risks";
  if (directive === "warn_anchor") return "open_questions";
  if (directive === "preserve_anchor") return "current_frame";
  return "continuity_relay_alignment";
}

function buildProposedContract({
  currentCwpRef,
  cwpVersion,
  contributingRecordRefs,
  proposedPatchEntries,
  sourceRefs,
  evidenceRefs,
}: {
  currentCwpRef: string | null;
  cwpVersion: "current_working_perspective.v0.1" | null;
  contributingRecordRefs: CurrentWorkingPerspectiveUpdateContractPreview["contributing_record_refs"];
  proposedPatchEntries: CurrentWorkingPerspectivePatchEntry[];
  sourceRefs: string[];
  evidenceRefs: string[];
}): CurrentWorkingPerspectiveUpdateContractMaterial {
  return {
    contract_kind: "current_working_perspective_update_contract.v0.1",
    current_cwp_ref: currentCwpRef,
    source_cwp_version: cwpVersion,
    proposed_update_basis: contributingRecordRefs,
    field_update_contracts: {
      current_frame_update_contract: fieldContract("current_frame", proposedPatchEntries),
      current_thesis_update_contract: fieldContract("current_thesis", proposedPatchEntries),
      active_goals_update_contract: fieldContract("active_goals", proposedPatchEntries),
      accepted_assumptions_update_contract: fieldContract("accepted_assumptions", proposedPatchEntries),
      rejected_assumptions_update_contract: fieldContract("rejected_assumptions", proposedPatchEntries),
      open_questions_update_contract: fieldContract("open_questions", proposedPatchEntries),
      active_risks_update_contract: fieldContract("active_risks", proposedPatchEntries),
      next_candidates_update_contract: fieldContract("next_candidates", proposedPatchEntries),
      review_queue_hints_update_contract: fieldContract("review_queue_hints", proposedPatchEntries),
      staleness_and_gaps_update_contract: fieldContract("staleness_and_gaps", proposedPatchEntries),
      continuity_relay_alignment_contract: fieldContract("continuity_relay_alignment", proposedPatchEntries),
    },
    proposed_patch_entries: proposedPatchEntries,
    expected_cwp_effect_summary: [
      "Creates reviewable contract material for a future CurrentWorkingPerspective apply slice.",
      "Preserves existing CWP material unless source-refed scoped records justify a future patch.",
      "Does not mutate live CurrentWorkingPerspective in this PR.",
    ],
    required_source_refs: sourceRefs,
    required_evidence_refs: evidenceRefs,
    blocked_live_mutations: [
      "current_working_perspective_updated",
      "current_working_perspective_mutated",
      "current_working_perspective_live_state_written",
      "current_working_perspective_update_applied",
      "live_relay_state_applied",
      "handoff_context_applied",
      "memory_promoted",
    ],
    future_apply_requirements: [
      "operator_approved_contract_record",
      "separate_current_working_perspective_apply_slice",
      "fresh_authority_boundary_review",
      "no_handoff_or_memory_promotion_without_separate_contract",
    ],
  };
}

function fieldContract(
  target: CurrentWorkingPerspectivePatchTarget,
  entries: CurrentWorkingPerspectivePatchEntry[],
): CurrentWorkingPerspectiveUpdateContractMaterial["field_update_contracts"]["current_frame_update_contract"] {
  const matching = entries.filter((entry) => entry.patch_target === target);
  return {
    target,
    status: matching.length > 0 ? "proposed_update" : "preserve_existing",
    patch_refs: matching.map((entry) => entry.patch_ref),
    source_record_refs: uniqueCandidateIngressStringsV01(
      matching.flatMap((entry) => entry.source_record_refs),
    ),
    summary:
      matching.length > 0
        ? `${matching.length} source-refed patch entries proposed for ${target}.`
        : `Preserve existing ${target} until a future apply slice has approved source-refed changes.`,
  };
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
}): CurrentWorkingPerspectiveUpdateContractReadiness {
  const writeReady =
    blockingReasons.length === 0 &&
    missingEvidence.length === 0 &&
    refusalReasons.length === 0 &&
    insufficientData.length === 0;
  return {
    write_ready: writeReady,
    readiness_label: writeReady
      ? "ready_for_scoped_local_current_working_perspective_update_contract_record"
      : "not_ready_for_current_working_perspective_update_contract_record",
    requires_current_working_perspective_material: true,
    requires_perspective_unit_record_review: true,
    requires_next_work_bias_record_review: true,
    requires_continuity_relay_record_review: true,
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
  hasCurrentMaterial,
  contractReadiness,
  blockingReasons,
  missingEvidence,
  refusalReasons,
  insufficientData,
}: {
  hasCurrentMaterial: boolean;
  contractReadiness: CurrentWorkingPerspectiveUpdateContractReadiness;
  blockingReasons: string[];
  missingEvidence: string[];
  refusalReasons: string[];
  insufficientData: string[];
}): CurrentWorkingPerspectiveUpdateContractPreviewStatus {
  if (!hasCurrentMaterial) return "no_current_working_perspective_material";
  if (blockingReasons.length > 0 || refusalReasons.length > 0) return "blocked";
  if (missingEvidence.length > 0) return "needs_more_evidence";
  if (insufficientData.length > 0) return "insufficient_data";
  if (contractReadiness.write_ready) {
    return "ready_for_future_current_working_perspective_update_contract_record_write";
  }
  return "ready_for_operator_review";
}

function determineRecommendedNextAction(
  status: CurrentWorkingPerspectiveUpdateContractPreviewStatus,
): CurrentWorkingPerspectiveUpdateContractRecommendedNextAction {
  if (status === "no_current_working_perspective_material") {
    return "supply_current_working_perspective_material";
  }
  if (status === "blocked" || status === "needs_more_evidence") {
    return "resolve_current_working_perspective_update_contract_blockers";
  }
  if (
    status ===
    "ready_for_future_current_working_perspective_update_contract_record_write"
  ) {
    return "write_current_working_perspective_update_contract_record";
  }
  if (status === "keep_preview_only") return "keep_preview_only";
  return "review_current_working_perspective_update_contract";
}

function recordReviewBlockingReasons({
  name,
  supplied,
  review,
}: {
  name: string;
  supplied: boolean;
  review: Record<string, any> | null;
}): string[] {
  if (supplied && !review) return [`${name}_malformed`];
  if (!review) return [];
  return [
    ...(review.review_status === "records_invalid" ? [`${name}_invalid`] : []),
    ...(review.evidence_summary?.has_receipt_side_effect_problem === true
      ? [`${name}_receipt_side_effect_problem`]
      : []),
    ...safeStringArray(review.blocked_reasons),
  ];
}

function requiredReviewInsufficientReasons({
  name,
  review,
}: {
  name: string;
  review: Record<string, any> | null;
}): string[] {
  if (!review) return [`${name}_missing`];
  if (
    !["records_available", "selected_record_found"].includes(
      String(review.review_status),
    ) ||
    Number(review.input_summary?.valid_record_count ?? 0) <= 0 ||
    !Array.isArray(review.records) ||
    review.records.length === 0
  ) {
    return [`${name}_valid_records_missing`];
  }
  return [];
}

function sourceStatusForReview(
  suppliedValue: unknown,
  review: Record<string, any> | null,
): "supplied" | "missing" | "invalid" | "malformed" {
  if (!isSupplied(suppliedValue)) return "missing";
  if (!review) return "malformed";
  return review.review_status === "records_invalid" ? "invalid" : "supplied";
}

function isPerspectiveUnitRecordReview(value: unknown): value is Record<string, any> {
  return (
    isRecord(value) &&
    value.review_version === PERSPECTIVE_UNIT_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.input_summary) &&
    isRecord(value.evidence_summary)
  );
}

function isNextWorkBiasRecordReview(value: unknown): value is Record<string, any> {
  return (
    isRecord(value) &&
    value.review_version === PERSPECTIVE_NEXT_WORK_BIAS_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.input_summary) &&
    isRecord(value.evidence_summary)
  );
}

function isContinuityRelayRecordReview(value: unknown): value is Record<string, any> {
  return (
    isRecord(value) &&
    value.review_version === CONTINUITY_RELAY_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records) &&
    isRecord(value.input_summary) &&
    isRecord(value.evidence_summary)
  );
}

function isDecisionRecordReview(value: unknown): value is Record<string, any> {
  return (
    isRecord(value) &&
    value.review_version === PERSPECTIVE_RELAY_UPDATE_DECISION_RECORD_REVIEW_VERSION &&
    Array.isArray(value.records)
  );
}

function isRelayWriteContractPreview(value: unknown): value is Record<string, any> {
  return (
    isRecord(value) &&
    value.preview_version === PERSPECTIVE_RELAY_UPDATE_WRITE_CONTRACT_PREVIEW_VERSION
  );
}

function perspectiveUnitRecords(review: Record<string, any> | null): Record<string, any>[] {
  return Array.isArray(review?.records) ? review.records.filter(isRecord) : [];
}

function nextWorkBiasRecords(review: Record<string, any> | null): Record<string, any>[] {
  return Array.isArray(review?.records) ? review.records.filter(isRecord) : [];
}

function continuityRelayRecords(review: Record<string, any> | null): Record<string, any>[] {
  return Array.isArray(review?.records) ? review.records.filter(isRecord) : [];
}

function recordRefs(review: Record<string, any> | null): string[] {
  return uniqueCandidateIngressStringsV01(
    (Array.isArray(review?.records) ? review.records : [])
      .map((record) => (isRecord(record) ? record.record_id : null))
      .filter((ref): ref is string => typeof ref === "string"),
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

function hashText(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
