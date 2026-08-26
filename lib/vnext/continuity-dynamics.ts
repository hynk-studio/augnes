import {
  buildPersonalPerspectivePairedEvaluationV01,
  assertValidPersonalPerspectiveShadowProjectionV01,
} from "@/lib/vnext/context-shadow-navigation";
import { validateContextUseAttributionProjectionV01 } from "@/lib/vnext/context-use-attribution-projection";
import { validateContextUseReviewRelationsV01 } from "@/lib/vnext/context-use-review";
import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
  scanForbiddenProtocolMaterialV01,
} from "@/lib/vnext/protocol-primitives";
import { validateRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { validateStateTransitionReceiptV01 } from "@/lib/vnext/state-transition-receipt";
import { validateTaskContextPacketTransitionRelationV01 } from "@/lib/vnext/state-transition-eligibility";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { ContextUseAttributionProjectionV01 } from "@/types/vnext/context-use-attribution-projection";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type {
  BlockingFrictionObservationV01,
  ContextEvidenceQualityObservationV01,
  ContextSelectionPressureObservationV01,
  ContinuityDimensionCompletenessV01,
  ContinuityDimensionDynamicsV01,
  ContinuityDimensionStepV01,
  ContinuityDynamicsAuthoritySummaryV01,
  ContinuityDynamicsDigestV01,
  ContinuityDynamicsIntegrityV01,
  ContinuityDynamicsMaterialBoundaryV01,
  ContinuityDynamicsSourceBindingV01,
  ContinuityDynamicsStatusV01,
  ContinuityDynamicsWindowKindV01,
  ReviewDecisionBurdenObservationV01,
  VerificationResolutionObservationV01,
  WorkContinuityFrameDimensionsV01,
  WorkContinuityStateFrameV01,
} from "@/types/vnext/continuity-dynamics";
import {
  CONTINUITY_DYNAMICS_CANONICALIZATION_V01,
  CONTINUITY_DYNAMICS_DIGEST_VERSION_V01,
  CONTINUITY_DYNAMICS_MAX_FRAMES_V01,
  CONTINUITY_DYNAMICS_MAX_SOURCE_BINDINGS_V01,
  CONTINUITY_DYNAMICS_MAX_TEXT_CHARACTERS_V01,
  WORK_CONTINUITY_STATE_FRAME_VERSION_V01,
} from "@/types/vnext/continuity-dynamics";
import type { PersonalPerspectiveShadowProjectionV01 } from "@/types/vnext/context-shadow-navigation";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const PENDING_ID = "continuity-dynamics:pending";
const PENDING_FINGERPRINT = `sha256:${"0".repeat(64)}`;
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/u;

const FRAME_ROOT_KEYS = [
  "frame_version",
  "frame_id",
  "frame_kind",
  "workspace_id",
  "project_id",
  "boundary",
  "source_bindings",
  "source_completeness",
  "dimensions",
  "material_boundary",
  "authority_summary",
  "integrity",
] as const;

const DIGEST_ROOT_KEYS = [
  "digest_version",
  "digest_id",
  "digest_kind",
  "workspace_id",
  "project_id",
  "window",
  "ordered_frames",
  "start_boundary",
  "end_boundary",
  "dynamics",
  "warnings",
  "completeness",
  "scalar_aggregate_created",
  "material_boundary",
  "authority_summary",
  "integrity",
] as const;

const DIMENSION_KEYS = [
  "verification_resolution",
  "blocking_friction",
  "context_evidence_quality",
  "context_selection_pressure",
  "review_decision_burden",
  "cost_operability",
] as const satisfies readonly (keyof WorkContinuityFrameDimensionsV01)[];

export interface BuildContextUseReviewFrameInputV01 {
  boundary_kind: "context_use_review_recorded";
  workspace_id: string;
  project_id: string;
  prior_task_context_packet: TaskContextPacketV01;
  later_task_context_packet: TaskContextPacketV01;
  source_transition_receipt: StateTransitionReceiptV01;
  later_task_run_receipt: RunReceiptV01;
  context_use_review: ContextUseReviewV01;
  context_use_attribution?: ContextUseAttributionProjectionV01 | null;
  context_shadow_projection?: PersonalPerspectiveShadowProjectionV01 | null;
}

export interface BuildSemanticTransitionFrameInputV01 {
  boundary_kind: "semantic_transition_later_packet";
  workspace_id: string;
  project_id: string;
  prior_task_context_packet: TaskContextPacketV01;
  later_task_context_packet: TaskContextPacketV01;
  source_transition_receipt: StateTransitionReceiptV01;
}

export type BuildWorkContinuityStateFrameInputV01 =
  | BuildContextUseReviewFrameInputV01
  | BuildSemanticTransitionFrameInputV01;

export interface BuildContinuityDynamicsDigestInputV01 {
  workspace_id: string;
  project_id: string;
  frames: readonly WorkContinuityStateFrameV01[];
  window_kind: ContinuityDynamicsWindowKindV01;
}

export function canonicalizeContinuityDynamicsValueV01(value: unknown): string {
  return canonicalizeProtocolValueV01(value);
}

export function deriveWorkContinuityStateFrameIdV01(
  frame: WorkContinuityStateFrameV01,
): string {
  return deriveIdentityValueV01(frame, "work-continuity-frame", "frame_id");
}

export function createWorkContinuityStateFrameFingerprintV01(
  frame: WorkContinuityStateFrameV01,
): string {
  return createFingerprintV01(frame);
}

export function deriveContinuityDynamicsDigestIdV01(
  digest: ContinuityDynamicsDigestV01,
): string {
  return deriveIdentityValueV01(
    digest,
    "continuity-dynamics-digest",
    "digest_id",
  );
}

export function createContinuityDynamicsDigestFingerprintV01(
  digest: ContinuityDynamicsDigestV01,
): string {
  return createFingerprintV01(digest);
}

export function buildWorkContinuityStateFrameV01(
  input: BuildWorkContinuityStateFrameInputV01,
): WorkContinuityStateFrameV01 {
  assertFrameBuilderInputV01(input);
  const inputBefore = canonicalizeProtocolValueV01(input);
  const safeInput = structuredClone(input);
  assertSafeMaterialV01(safeInput);
  const workspaceId = normalizeProtocolTextV01(input.workspace_id);
  const projectId = normalizeProtocolTextV01(input.project_id);

  assertPacketV01(input.prior_task_context_packet);
  assertPacketV01(input.later_task_context_packet);
  assertTransitionV01(input.source_transition_receipt);
  assertScopeV01(workspaceId, projectId, [
    input.prior_task_context_packet,
    input.later_task_context_packet,
    input.source_transition_receipt,
  ]);
  const packetRelation = validateTaskContextPacketTransitionRelationV01(
    input.prior_task_context_packet,
    input.source_transition_receipt,
    input.later_task_context_packet,
  );
  if (packetRelation.status !== "valid") {
    failV01("continuity_dynamics_packet_transition_relation_invalid");
  }

  const priorBinding = packetBindingV01(input.prior_task_context_packet);
  const laterBinding = packetBindingV01(input.later_task_context_packet);
  const transitionBinding = stateTransitionBindingV01(
    input.source_transition_receipt,
  );
  let sourceBindings: ContinuityDynamicsSourceBindingV01[] = [
    priorBinding,
    transitionBinding,
    laterBinding,
  ];
  let dimensions: WorkContinuityFrameDimensionsV01;
  let boundary: WorkContinuityStateFrameV01["boundary"];
  const missing: string[] = [];

  if (input.boundary_kind === "context_use_review_recorded") {
    assertRunReceiptV01(input.later_task_run_receipt);
    assertScopeV01(workspaceId, projectId, [
      input.later_task_run_receipt,
      input.context_use_review,
    ]);
    const relation = validateContextUseReviewRelationsV01(
      input.context_use_review,
      input.prior_task_context_packet,
      input.later_task_context_packet,
      input.source_transition_receipt,
      input.later_task_run_receipt,
    );
    if (relation.status !== "valid") {
      failV01("continuity_dynamics_context_use_review_relation_invalid");
    }
    const reviewBinding = contextUseReviewBindingV01(input.context_use_review);
    const receiptBinding = runReceiptBindingV01(input.later_task_run_receipt);
    sourceBindings = [...sourceBindings, receiptBinding, reviewBinding];

    const attribution = input.context_use_attribution ?? null;
    if (attribution) {
      assertExactAttributionV01(input, attribution);
      sourceBindings.push(attributionBindingV01(attribution));
    } else {
      missing.push("exact_acgc1_context_use_attribution_not_supplied");
    }

    let selectionPressure: ContextSelectionPressureObservationV01 | null = null;
    let selectionBindings: ContinuityDynamicsSourceBindingV01[] = [];
    if (input.context_shadow_projection) {
      if (!attribution) {
        failV01("continuity_dynamics_acgc2_requires_exact_acgc1_attribution");
      }
      assertValidPersonalPerspectiveShadowProjectionV01(
        input.context_shadow_projection,
      );
      const paired = buildPersonalPerspectivePairedEvaluationV01(
        input.context_shadow_projection,
        attribution,
      );
      selectionPressure = {
        baseline_selected_count:
          input.context_shadow_projection.baseline.selection.selected_context
            .length,
        shadow_selected_count:
          input.context_shadow_projection.shadow.selected.length,
        baseline_only_count:
          input.context_shadow_projection.comparison.baseline_only.length,
        shadow_only_count:
          input.context_shadow_projection.comparison.shadow_only.length,
        budget_excluded_count:
          input.context_shadow_projection.shadow.budget.budget_excluded_count,
        duplicate_candidate_count:
          input.context_shadow_projection.candidate_snapshot.collection
            .duplicate_candidate_count,
        duplicate_selected_identity_count:
          input.context_shadow_projection.comparison.duplicate_indicators
            .duplicate_selected_identity_count,
        candidate_completeness:
          input.context_shadow_projection.candidate_snapshot.source_completeness
            .status,
        stop_reason: input.context_shadow_projection.shadow.stop_reason,
        critical_omission_candidate_count:
          paired.summary.critical_omission_candidate_count,
        selection_difference_is_omission_harm: false,
        critical_omission_candidate_is_causal: false,
      };
      selectionBindings = [
        shadowBindingV01(input.context_shadow_projection),
        pairedEvaluationBindingV01(paired),
      ];
      sourceBindings.push(...selectionBindings);
    } else {
      missing.push("exact_acgc2_shadow_comparison_not_supplied");
    }

    dimensions = buildReviewFrameDimensionsV01({
      review: input.context_use_review,
      receipt: input.later_task_run_receipt,
      attribution,
      selection_pressure: selectionPressure,
      selection_bindings: selectionBindings,
    });
    boundary = {
      kind: "context_use_review_recorded",
      boundary_timestamp: input.context_use_review.reviewed_at,
      boundary_source: reviewBinding,
      semantic_discontinuity: null,
      caller_timestamp_used: false,
    };
  } else {
    dimensions = unavailableTransitionDimensionsV01([
      priorBinding,
      transitionBinding,
      laterBinding,
    ]);
    missing.push(
      "run_receipt_not_available_at_transition_packet_boundary",
      "context_use_review_not_available_at_transition_packet_boundary",
      "exact_acgc1_context_use_attribution_not_available_at_transition_packet_boundary",
      "exact_acgc2_shadow_comparison_not_available_at_transition_packet_boundary",
    );
    boundary = {
      kind: "semantic_transition_later_packet",
      boundary_timestamp: input.later_task_context_packet.generated_at,
      boundary_source: laterBinding,
      semantic_discontinuity: {
        transition_receipt_id:
          input.source_transition_receipt.transition_receipt_id,
        transition_receipt_fingerprint:
          input.source_transition_receipt.integrity.fingerprint,
        applied_at: input.source_transition_receipt.applied_at,
        recorded_at: input.source_transition_receipt.recorded_at,
      },
      caller_timestamp_used: false,
    };
  }

  if (sourceBindings.length > CONTINUITY_DYNAMICS_MAX_SOURCE_BINDINGS_V01) {
    failV01("continuity_dynamics_source_binding_bound_exceeded");
  }
  sourceBindings = uniqueSourceBindingsV01(sourceBindings);
  const frame: WorkContinuityStateFrameV01 = {
    frame_version: WORK_CONTINUITY_STATE_FRAME_VERSION_V01,
    frame_id: PENDING_ID,
    frame_kind: "derived_rebuildable_read_only_observation",
    workspace_id: workspaceId,
    project_id: projectId,
    boundary,
    source_bindings: sourceBindings,
    source_completeness: {
      status: missing.length === 0 ? "complete" : "partial",
      missing: uniqueStringsV01(missing),
      chronology: "exact_boundary_order_only",
      intermediate_chronology_proven: false,
      fabricated_historical_frames: false,
    },
    dimensions,
    material_boundary: createMaterialBoundaryV01(),
    authority_summary: createAuthoritySummaryV01(),
    integrity: pendingIntegrityV01(),
  };
  finalizeIdentityV01(frame, "work-continuity-frame", "frame_id");
  assertValidWorkContinuityStateFrameV01(frame);
  if (canonicalizeProtocolValueV01(input) !== inputBefore) {
    failV01("continuity_dynamics_frame_input_mutated");
  }
  return frame;
}

export function buildContinuityDynamicsDigestV01(
  input: BuildContinuityDynamicsDigestInputV01,
): ContinuityDynamicsDigestV01 {
  assertDigestBuilderInputV01(input);
  const inputBefore = canonicalizeProtocolValueV01(input);
  const frames = input.frames.map((frame) => structuredClone(frame));
  frames.forEach(assertValidWorkContinuityStateFrameV01);
  assertScopeV01(input.workspace_id, input.project_id, frames);
  assertOrderedUniqueFramesV01(frames);
  const selection = selectWindowV01(frames, input.window_kind);
  const selected = selection.frames;
  const hasRegimeShift =
    selected.length > 1 &&
    selected.some((frame) => frame.boundary.semantic_discontinuity !== null);
  const dynamics = {
    verification_resolution: buildDirectionalDynamicsV01(
      "verification_resolution",
      selected,
      hasRegimeShift,
      compareVerificationResolutionV01,
    ),
    blocking_friction: buildDirectionalDynamicsV01(
      "blocking_friction",
      selected,
      hasRegimeShift,
      compareBlockingFrictionV01,
    ),
    context_evidence_quality: buildDirectionalDynamicsV01(
      "context_evidence_quality",
      selected,
      hasRegimeShift,
      compareContextEvidenceV01,
    ),
    context_selection_pressure: buildNonDirectionalDynamicsV01(
      "context_selection_pressure",
      selected,
      hasRegimeShift,
    ),
    review_decision_burden: buildNonDirectionalDynamicsV01(
      "review_decision_burden",
      selected,
      hasRegimeShift,
    ),
    cost_operability: buildNonDirectionalDynamicsV01(
      "cost_operability",
      selected,
      hasRegimeShift,
    ),
  } satisfies ContinuityDynamicsDigestV01["dynamics"];

  const missingWarnings = uniqueStringsV01([
    ...selected.flatMap((frame) => frame.source_completeness.missing),
    ...DIMENSION_KEYS.flatMap((key) =>
      dynamics[key].completeness.missing.map(
        (item) => `${key}:${item}`,
      ),
    ),
  ]);
  const warnings = uniqueStringsV01([
    "earlier_history_not_scanned_beyond_bounded_input",
    ...(selected.length > 1
      ? ["intermediate_chronology_not_proven_no_interpolation"]
      : []),
    ...(selection.truncated
      ? ["input_frames_truncated_to_requested_window_bound"]
      : []),
    ...(selection.sinceLastTransition === "not_found_in_bounded_input"
      ? ["exact_transition_not_found_in_bounded_input"]
      : []),
    ...missingWarnings,
  ]);
  const digest: ContinuityDynamicsDigestV01 = {
    digest_version: CONTINUITY_DYNAMICS_DIGEST_VERSION_V01,
    digest_id: PENDING_ID,
    digest_kind: "derived_rebuildable_read_only_dimension_vector",
    workspace_id: normalizeProtocolTextV01(input.workspace_id),
    project_id: normalizeProtocolTextV01(input.project_id),
    window: {
      kind: input.window_kind,
      max_frames: selection.maxFrames,
      input_frame_count: frames.length,
      selected_frame_count: selected.length,
      truncated_to_bound: selection.truncated,
      earlier_history_not_scanned: true,
      since_last_transition: selection.sinceLastTransition,
    },
    ordered_frames: selected.map((frame) => ({
      frame_id: frame.frame_id,
      frame_fingerprint: frame.integrity.fingerprint,
      boundary_kind: frame.boundary.kind,
      boundary_timestamp: frame.boundary.boundary_timestamp,
    })),
    start_boundary: structuredClone(selected[0]!.boundary),
    end_boundary: structuredClone(selected.at(-1)!.boundary),
    dynamics,
    warnings,
    completeness: {
      status: warnings.length === 1 ? "complete" : "partial",
      missing_frame_or_material_warnings: missingWarnings,
      intermediate_chronology_interpolated: false,
    },
    scalar_aggregate_created: false,
    material_boundary: createMaterialBoundaryV01(),
    authority_summary: createAuthoritySummaryV01(),
    integrity: pendingIntegrityV01(),
  };
  finalizeIdentityV01(digest, "continuity-dynamics-digest", "digest_id");
  assertValidContinuityDynamicsDigestV01(digest);
  if (canonicalizeProtocolValueV01(input) !== inputBefore) {
    failV01("continuity_dynamics_digest_input_mutated");
  }
  return digest;
}

export function assertValidWorkContinuityStateFrameV01(
  input: unknown,
): asserts input is WorkContinuityStateFrameV01 {
  if (!isProtocolRecordV01(input)) {
    failV01("continuity_dynamics_frame_invalid");
  }
  assertExactKeysV01(input, FRAME_ROOT_KEYS);
  const frame = input as unknown as WorkContinuityStateFrameV01;
  if (
    frame.frame_version !== WORK_CONTINUITY_STATE_FRAME_VERSION_V01 ||
    frame.frame_kind !== "derived_rebuildable_read_only_observation" ||
    !normalizeProtocolTextV01(frame.workspace_id) ||
    !normalizeProtocolTextV01(frame.project_id) ||
    parseStrictIsoTimestampV01(frame.boundary?.boundary_timestamp) === null ||
    frame.boundary?.caller_timestamp_used !== false ||
    !Array.isArray(frame.source_bindings) ||
    frame.source_bindings.length < 1 ||
    frame.source_bindings.length >
      CONTINUITY_DYNAMICS_MAX_SOURCE_BINDINGS_V01 ||
    frame.source_completeness?.fabricated_historical_frames !== false ||
    canonicalizeProtocolValueV01(frame.authority_summary) !==
      canonicalizeProtocolValueV01(createAuthoritySummaryV01()) ||
    canonicalizeProtocolValueV01(frame.material_boundary) !==
      canonicalizeProtocolValueV01(createMaterialBoundaryV01())
  ) {
    failV01("continuity_dynamics_frame_invalid");
  }
  assertExactKeysV01(
    frame.dimensions as unknown as Record<string, unknown>,
    DIMENSION_KEYS,
  );
  assertBoundaryV01(frame.boundary);
  for (const binding of frame.source_bindings) validateSourceBindingV01(binding);
  const boundaryCanonical = canonicalizeProtocolValueV01(
    frame.boundary.boundary_source,
  );
  if (
    !frame.source_bindings.some(
      (binding) => canonicalizeProtocolValueV01(binding) === boundaryCanonical,
    )
  ) {
    failV01("continuity_dynamics_boundary_source_mismatch");
  }
  if (new Set(frame.source_bindings.map(sourceBindingKeyV01)).size !== frame.source_bindings.length) {
    failV01("continuity_dynamics_source_binding_duplicate");
  }
  validateIdentityV01(frame, "work-continuity-frame", "frame_id");
  assertNoScalarAggregateFieldsV01(frame);
  assertSafeMaterialV01(frame);
  assertTextAndCollectionBoundsV01(frame);
}

function assertBoundaryV01(
  boundary: WorkContinuityStateFrameV01["boundary"],
): void {
  if (!isProtocolRecordV01(boundary)) {
    failV01("continuity_dynamics_boundary_invalid");
  }
  assertExactKeysV01(boundary, [
    "kind",
    "boundary_timestamp",
    "boundary_source",
    "semantic_discontinuity",
    "caller_timestamp_used",
  ]);
  validateSourceBindingV01(boundary.boundary_source);
  if (
    boundary.caller_timestamp_used !== false ||
    boundary.boundary_source.source_timestamp !== boundary.boundary_timestamp
  ) {
    failV01("continuity_dynamics_boundary_invalid");
  }
  if (boundary.kind === "context_use_review_recorded") {
    if (
      boundary.boundary_source.source_kind !== "context_use_review" ||
      boundary.semantic_discontinuity !== null
    ) {
      failV01("continuity_dynamics_boundary_invalid");
    }
    return;
  }
  if (
    boundary.kind !== "semantic_transition_later_packet" ||
    boundary.boundary_source.source_kind !== "task_context_packet" ||
    !isProtocolRecordV01(boundary.semantic_discontinuity)
  ) {
    failV01("continuity_dynamics_boundary_invalid");
  }
  assertExactKeysV01(boundary.semantic_discontinuity, [
    "transition_receipt_id",
    "transition_receipt_fingerprint",
    "applied_at",
    "recorded_at",
  ]);
  if (
    !normalizeProtocolTextV01(
      boundary.semantic_discontinuity.transition_receipt_id,
    ) ||
    !SHA256_PATTERN.test(
      String(boundary.semantic_discontinuity.transition_receipt_fingerprint),
    ) ||
    parseStrictIsoTimestampV01(boundary.semantic_discontinuity.applied_at) ===
      null ||
    parseStrictIsoTimestampV01(boundary.semantic_discontinuity.recorded_at) ===
      null
  ) {
    failV01("continuity_dynamics_boundary_invalid");
  }
}

export function assertValidContinuityDynamicsDigestV01(
  input: unknown,
): asserts input is ContinuityDynamicsDigestV01 {
  if (!isProtocolRecordV01(input)) {
    failV01("continuity_dynamics_digest_invalid");
  }
  assertExactKeysV01(input, DIGEST_ROOT_KEYS);
  const digest = input as unknown as ContinuityDynamicsDigestV01;
  if (
    digest.digest_version !== CONTINUITY_DYNAMICS_DIGEST_VERSION_V01 ||
    digest.digest_kind !==
      "derived_rebuildable_read_only_dimension_vector" ||
    digest.scalar_aggregate_created !== false ||
    !Array.isArray(digest.ordered_frames) ||
    digest.ordered_frames.length < 1 ||
    digest.ordered_frames.length > CONTINUITY_DYNAMICS_MAX_FRAMES_V01 ||
    digest.completeness?.intermediate_chronology_interpolated !== false ||
    canonicalizeProtocolValueV01(digest.authority_summary) !==
      canonicalizeProtocolValueV01(createAuthoritySummaryV01()) ||
    canonicalizeProtocolValueV01(digest.material_boundary) !==
      canonicalizeProtocolValueV01(createMaterialBoundaryV01())
  ) {
    failV01("continuity_dynamics_digest_invalid");
  }
  assertExactKeysV01(
    digest.dynamics as unknown as Record<string, unknown>,
    DIMENSION_KEYS,
  );
  assertBoundaryV01(digest.start_boundary);
  assertBoundaryV01(digest.end_boundary);
  if (
    digest.window.selected_frame_count !== digest.ordered_frames.length ||
    digest.start_boundary.boundary_timestamp !==
      digest.ordered_frames[0]?.boundary_timestamp ||
    digest.end_boundary.boundary_timestamp !==
      digest.ordered_frames.at(-1)?.boundary_timestamp
  ) {
    failV01("continuity_dynamics_digest_window_binding_invalid");
  }
  validateIdentityV01(
    digest,
    "continuity-dynamics-digest",
    "digest_id",
  );
  assertNoScalarAggregateFieldsV01(digest);
  assertSafeMaterialV01(digest);
  assertTextAndCollectionBoundsV01(digest);
}

function buildReviewFrameDimensionsV01(input: {
  review: ContextUseReviewV01;
  receipt: RunReceiptV01;
  attribution: ContextUseAttributionProjectionV01 | null;
  selection_pressure: ContextSelectionPressureObservationV01 | null;
  selection_bindings: ContinuityDynamicsSourceBindingV01[];
}): WorkContinuityFrameDimensionsV01 {
  const receiptBinding = runReceiptBindingV01(input.receipt);
  const reviewBinding = contextUseReviewBindingV01(input.review);
  const requiredChecks = input.receipt.checks.filter((check) => check.required);
  const requiredSkipped = input.receipt.skipped_checks.filter(
    (check) => check.required,
  );
  const verification: VerificationResolutionObservationV01 = {
    passed_count: input.receipt.checks.filter((check) => check.status === "passed")
      .length,
    failed_count: input.receipt.checks.filter((check) => check.status === "failed")
      .length,
    blocked_count: input.receipt.checks.filter((check) => check.status === "blocked")
      .length,
    skipped_count: input.receipt.skipped_checks.length,
    unknown_count: input.receipt.checks.filter((check) => check.status === "unknown")
      .length,
    unresolved_required_check_count:
      requiredChecks.filter((check) => check.status !== "passed").length +
      requiredSkipped.length,
    required_check_count: requiredChecks.length + requiredSkipped.length,
    execution_completed_is_semantic_success: false,
  };
  const unresolvedRequired = requiredChecks.filter(
    (check) => check.status !== "passed",
  );
  const blockerClasses = uniqueStringsV01([
    ...input.receipt.blockers.map((issue) => `blocker:${issue.code}`),
    ...input.receipt.gaps.map((issue) => `gap:${issue.code}`),
    ...unresolvedRequired.map(
      (check) => `required_check:${check.check_id}:${check.status}`,
    ),
    ...requiredSkipped.map(
      (check) => `required_check:${check.check_id}:skipped`,
    ),
  ]);
  const friction: BlockingFrictionObservationV01 = {
    unresolved_count:
      input.receipt.blockers.length +
      input.receipt.gaps.length +
      unresolvedRequired.length +
      requiredSkipped.length,
    blocker_classes: blockerClasses,
    blocker_count: input.receipt.blockers.length,
    gap_count: input.receipt.gaps.length,
    failed_required_check_count: unresolvedRequired.filter(
      (check) => check.status === "failed",
    ).length,
    blocked_required_check_count: unresolvedRequired.filter(
      (check) => check.status === "blocked",
    ).length,
    skipped_required_check_count: requiredSkipped.length,
    unknown_required_check_count: unresolvedRequired.filter(
      (check) => check.status === "unknown",
    ).length,
  };
  const attributionBinding = input.attribution
    ? attributionBindingV01(input.attribution)
    : null;
  const contextEvidence: ContextEvidenceQualityObservationV01 | null =
    input.attribution
      ? {
          selected_item_count: input.attribution.rows.length,
          presentation_known_count: input.attribution.rows.filter(
            (row) => row.presentation.status !== "unknown",
          ).length,
          exact_reference_count: input.attribution.rows.filter(
            (row) => row.citation_or_reference.status === "referenced",
          ).length,
          unknown_actual_use_count: input.attribution.rows.filter(
            (row) => row.actual_use.status === "unknown",
          ).length,
          unknown_support_count: input.attribution.rows.filter(
            (row) => row.support_validation.status === "unknown",
          ).length,
          unknown_outcome_count: input.attribution.rows.filter(
            (row) => row.outcome_association.status === "unknown",
          ).length,
          unknown_causal_count: input.attribution.rows.filter(
            (row) => row.causal_contribution.status === "unknown",
          ).length,
          known_evidence_lane_count: input.attribution.rows.reduce(
            (count, row) =>
              count +
              (row.presentation.status === "unknown" ? 0 : 1) +
              (row.citation_or_reference.status === "unknown" ? 0 : 1),
            0,
          ),
          unknown_evidence_lane_count: input.attribution.rows.reduce(
            (count, row) =>
              count +
              (row.presentation.status === "unknown" ? 1 : 0) +
              (row.actual_use.status === "unknown" ? 1 : 0) +
              (row.citation_or_reference.status === "unknown" ? 1 : 0) +
              (row.support_validation.status === "unknown" ? 1 : 0) +
              (row.outcome_association.status === "unknown" ? 1 : 0) +
              (row.causal_contribution.status === "unknown" ? 1 : 0),
            0,
          ),
          packet_level_assessment:
            input.attribution.episode_review_context.assessment,
          packet_level_assessment_is_item_judgment: false,
        }
      : null;
  const reviewBurden: ReviewDecisionBurdenObservationV01 = {
    correction_count: input.review.corrections.correction_count,
    wrong_context_correction_count:
      input.review.metrics.wrong_context_correction_count,
    repeated_explanation_estimate:
      input.review.metrics.repeated_explanation_estimate,
    missing_critical_context_count:
      input.review.metrics.missing_critical_context_count,
    review_assessment: input.review.assessment,
    subjective_burden_inferred: false,
  };
  return {
    verification_resolution: {
      dimension: "verification_resolution",
      comparison_rule: "unresolved_required_checks_monotonic_v0.1",
      source_bindings: [receiptBinding],
      observation: verification,
      completeness: completeV01(),
    },
    blocking_friction: {
      dimension: "blocking_friction",
      comparison_rule: "unresolved_friction_and_new_classes_v0.1",
      source_bindings: [receiptBinding],
      observation: friction,
      completeness: completeV01(),
    },
    context_evidence_quality: {
      dimension: "context_evidence_quality",
      comparison_rule: "known_lanes_up_unknown_lanes_down_v0.1",
      source_bindings: attributionBinding ? [reviewBinding, attributionBinding] : [reviewBinding],
      observation: contextEvidence,
      completeness: attributionBinding
        ? partialV01([], [
            "actual_use_support_outcome_and_causal_lanes_remain_unknown_without_exact_item_relations",
            "packet_level_review_is_episode_context_only",
          ])
        : unavailableV01("exact_acgc1_context_use_attribution_not_supplied"),
    },
    context_selection_pressure: {
      dimension: "context_selection_pressure",
      comparison_rule: "exact_counts_no_direction_v0.1",
      source_bindings: input.selection_bindings,
      observation: input.selection_pressure,
      completeness: input.selection_pressure
        ? partialV01([], [
            "selection_difference_is_not_omission_harm",
            "critical_omission_candidate_is_non_causal",
            "v0.1_defines_no_directional_quality_rule_for_selection_pressure",
          ])
        : unavailableV01("exact_acgc2_shadow_comparison_not_supplied"),
    },
    review_decision_burden: {
      dimension: "review_decision_burden",
      comparison_rule: "exact_counts_no_direction_v0.1",
      source_bindings: [reviewBinding],
      observation: reviewBurden,
      completeness: partialV01([], [
        "exact_review_counts_are_not_subjective_burden",
        "v0.1_defines_no_directional_burden_rule",
      ]),
    },
    cost_operability: {
      dimension: "cost_operability",
      comparison_rule: "no_comparable_basis_v0.1",
      source_bindings: [receiptBinding],
      observation: null,
      completeness: unavailableV01(
        "no_exact_cross_frame_comparable_cost_latency_cleanup_basis_selected_v0.1",
      ),
    },
  };
}

function unavailableTransitionDimensionsV01(
  sourceBindings: ContinuityDynamicsSourceBindingV01[],
): WorkContinuityFrameDimensionsV01 {
  const unavailable = (dimension: string) =>
    unavailableV01(`${dimension}_not_observable_at_transition_packet_boundary`);
  return {
    verification_resolution: {
      dimension: "verification_resolution",
      comparison_rule: "unresolved_required_checks_monotonic_v0.1",
      source_bindings: sourceBindings,
      observation: null,
      completeness: unavailable("verification_resolution"),
    },
    blocking_friction: {
      dimension: "blocking_friction",
      comparison_rule: "unresolved_friction_and_new_classes_v0.1",
      source_bindings: sourceBindings,
      observation: null,
      completeness: unavailable("blocking_friction"),
    },
    context_evidence_quality: {
      dimension: "context_evidence_quality",
      comparison_rule: "known_lanes_up_unknown_lanes_down_v0.1",
      source_bindings: sourceBindings,
      observation: null,
      completeness: unavailable("context_evidence_quality"),
    },
    context_selection_pressure: {
      dimension: "context_selection_pressure",
      comparison_rule: "exact_counts_no_direction_v0.1",
      source_bindings: sourceBindings,
      observation: null,
      completeness: unavailable("context_selection_pressure"),
    },
    review_decision_burden: {
      dimension: "review_decision_burden",
      comparison_rule: "exact_counts_no_direction_v0.1",
      source_bindings: sourceBindings,
      observation: null,
      completeness: unavailable("review_decision_burden"),
    },
    cost_operability: {
      dimension: "cost_operability",
      comparison_rule: "no_comparable_basis_v0.1",
      source_bindings: sourceBindings,
      observation: null,
      completeness: unavailable("cost_operability"),
    },
  };
}

type DirectionComparatorV01 = (
  left: WorkContinuityStateFrameV01,
  right: WorkContinuityStateFrameV01,
) => ContinuityDimensionStepV01;

function buildDirectionalDynamicsV01(
  dimension: keyof WorkContinuityFrameDimensionsV01,
  frames: WorkContinuityStateFrameV01[],
  hasRegimeShift: boolean,
  compare: DirectionComparatorV01,
): ContinuityDimensionDynamicsV01 {
  const completeness = combineCompletenessV01(
    frames.map((frame) => frame.dimensions[dimension].completeness),
  );
  if (frames.length === 1) {
    return dynamicsV01(
      dimension,
      completeness.status === "unavailable" ? "insufficient" : "current_only",
      [],
      completeness,
      ["one_frame_has_no_temporal_direction"],
      frames,
    );
  }
  const steps = frames.slice(1).map((frame, index) =>
    compare(frames[index]!, frame),
  );
  if (hasRegimeShift) {
    return dynamicsV01(dimension, "regime_shift", steps, completeness, [
      "exact_semantic_transition_discontinuity_preempts_directional_comparison",
      "transition_is_not_improvement_or_success",
    ], frames);
  }
  if (completeness.status === "unavailable") {
    return dynamicsV01(dimension, "insufficient", steps, completeness, [
      "dimension_material_unavailable",
    ], frames);
  }
  return dynamicsV01(
    dimension,
    classifyStepsV01(steps, frames, dimension),
    steps,
    completeness,
    ["observed_frames_only_no_interpolation"],
    frames,
  );
}

function buildNonDirectionalDynamicsV01(
  dimension: keyof WorkContinuityFrameDimensionsV01,
  frames: WorkContinuityStateFrameV01[],
  hasRegimeShift: boolean,
): ContinuityDimensionDynamicsV01 {
  const completeness = combineCompletenessV01(
    frames.map((frame) => frame.dimensions[dimension].completeness),
  );
  if (frames.length > 1 && hasRegimeShift) {
    return dynamicsV01(dimension, "regime_shift", [], completeness, [
      "exact_semantic_transition_discontinuity_present",
      "transition_is_not_improvement_or_success",
      "v0.1_defines_no_directional_rule_for_this_dimension",
    ], frames);
  }
  return dynamicsV01(
    dimension,
    frames.length === 1 && completeness.status !== "unavailable"
      ? "current_only"
      : "insufficient",
    [],
    completeness,
    ["v0.1_defines_no_directional_rule_for_this_dimension"],
    frames,
  );
}

function compareVerificationResolutionV01(
  left: WorkContinuityStateFrameV01,
  right: WorkContinuityStateFrameV01,
): ContinuityDimensionStepV01 {
  const a = left.dimensions.verification_resolution.observation;
  const b = right.dimensions.verification_resolution.observation;
  if (!a || !b) return notComparableStepV01(left, right, "missing_exact_verification_observation");
  const delta = b.unresolved_required_check_count - a.unresolved_required_check_count;
  return stepV01(
    left,
    right,
    delta < 0 ? "improving" : delta > 0 ? "worsening" : "unchanged",
    `unresolved_required_check_count:${a.unresolved_required_check_count}->${b.unresolved_required_check_count}`,
  );
}

function compareBlockingFrictionV01(
  left: WorkContinuityStateFrameV01,
  right: WorkContinuityStateFrameV01,
): ContinuityDimensionStepV01 {
  const a = left.dimensions.blocking_friction.observation;
  const b = right.dimensions.blocking_friction.observation;
  if (!a || !b) return notComparableStepV01(left, right, "missing_exact_blocking_friction_observation");
  const prior = new Set(a.blocker_classes);
  const next = new Set(b.blocker_classes);
  const newClasses = [...next].filter((item) => !prior.has(item)).sort(compareProtocolCodeUnitsV01);
  const removedClasses = [...prior].filter((item) => !next.has(item)).sort(compareProtocolCodeUnitsV01);
  const countDelta = b.unresolved_count - a.unresolved_count;
  const direction =
    countDelta < 0 && newClasses.length === 0
      ? "improving"
      : countDelta > 0 || newClasses.length > 0
        ? countDelta < 0
          ? "mixed"
          : "worsening"
        : countDelta === 0 && newClasses.length === 0 && removedClasses.length === 0
          ? "unchanged"
          : "mixed";
  return stepV01(
    left,
    right,
    direction,
    `unresolved_count:${a.unresolved_count}->${b.unresolved_count};new_classes:${newClasses.join(",") || "none"};removed_classes:${removedClasses.join(",") || "none"}`,
  );
}

function compareContextEvidenceV01(
  left: WorkContinuityStateFrameV01,
  right: WorkContinuityStateFrameV01,
): ContinuityDimensionStepV01 {
  const a = left.dimensions.context_evidence_quality.observation;
  const b = right.dimensions.context_evidence_quality.observation;
  if (!a || !b) return notComparableStepV01(left, right, "missing_exact_context_evidence_observation");
  const knownDelta = b.known_evidence_lane_count - a.known_evidence_lane_count;
  const unknownDelta = b.unknown_evidence_lane_count - a.unknown_evidence_lane_count;
  const direction =
    knownDelta >= 0 && unknownDelta <= 0 && (knownDelta > 0 || unknownDelta < 0)
      ? "improving"
      : knownDelta <= 0 && unknownDelta >= 0 && (knownDelta < 0 || unknownDelta > 0)
        ? "worsening"
        : knownDelta === 0 && unknownDelta === 0
          ? "unchanged"
          : "mixed";
  return stepV01(
    left,
    right,
    direction,
    `known_evidence_lane_count:${a.known_evidence_lane_count}->${b.known_evidence_lane_count};unknown_evidence_lane_count:${a.unknown_evidence_lane_count}->${b.unknown_evidence_lane_count}`,
  );
}

function classifyStepsV01(
  steps: ContinuityDimensionStepV01[],
  frames: WorkContinuityStateFrameV01[],
  dimension: keyof WorkContinuityFrameDimensionsV01,
): ContinuityDynamicsStatusV01 {
  if (steps.some((step) => step.direction === "not_comparable")) return "insufficient";
  const directions = new Set(steps.map((step) => step.direction));
  if (directions.has("mixed") || (directions.has("improving") && directions.has("worsening"))) {
    return "volatile";
  }
  if (directions.has("improving")) return "converging";
  if (directions.has("worsening")) return "diverging";
  if (directions.size === 1 && directions.has("unchanged")) {
    return unresolvedAtEndV01(frames.at(-1)!, dimension)
      ? "stalled"
      : "insufficient";
  }
  return "insufficient";
}

function unresolvedAtEndV01(
  frame: WorkContinuityStateFrameV01,
  dimension: keyof WorkContinuityFrameDimensionsV01,
): boolean {
  if (dimension === "verification_resolution") {
    return (
      frame.dimensions.verification_resolution.observation
        ?.unresolved_required_check_count ?? 0
    ) > 0;
  }
  if (dimension === "blocking_friction") {
    return (frame.dimensions.blocking_friction.observation?.unresolved_count ?? 0) > 0;
  }
  if (dimension === "context_evidence_quality") {
    return (
      frame.dimensions.context_evidence_quality.observation
        ?.unknown_evidence_lane_count ?? 0
    ) > 0;
  }
  return false;
}

function dynamicsV01(
  dimension: keyof WorkContinuityFrameDimensionsV01,
  status: ContinuityDynamicsStatusV01,
  steps: ContinuityDimensionStepV01[],
  completeness: ContinuityDimensionCompletenessV01,
  limitations: string[],
  frames: WorkContinuityStateFrameV01[],
): ContinuityDimensionDynamicsV01 {
  return {
    dimension,
    status,
    comparison_rule: frames[0]!.dimensions[dimension].comparison_rule,
    step_comparisons: steps,
    completeness,
    limitations: uniqueStringsV01(limitations),
  };
}

function stepV01(
  left: WorkContinuityStateFrameV01,
  right: WorkContinuityStateFrameV01,
  direction: ContinuityDimensionStepV01["direction"],
  exactBasis: string,
): ContinuityDimensionStepV01 {
  return {
    from_frame_id: left.frame_id,
    to_frame_id: right.frame_id,
    direction,
    exact_basis: exactBasis,
  };
}

function notComparableStepV01(
  left: WorkContinuityStateFrameV01,
  right: WorkContinuityStateFrameV01,
  basis: string,
): ContinuityDimensionStepV01 {
  return stepV01(left, right, "not_comparable", basis);
}

function selectWindowV01(
  frames: WorkContinuityStateFrameV01[],
  kind: ContinuityDynamicsWindowKindV01,
) {
  if (kind === "current_only") {
    return {
      frames: frames.slice(-1),
      maxFrames: 1 as const,
      truncated: frames.length > 1,
      sinceLastTransition: "not_applicable" as const,
    };
  }
  if (kind === "recent_3") {
    return {
      frames: frames.slice(-3),
      maxFrames: 3 as const,
      truncated: frames.length > 3,
      sinceLastTransition: "not_applicable" as const,
    };
  }
  if (kind === "recent_5") {
    return {
      frames: frames.slice(-5),
      maxFrames: 5 as const,
      truncated: frames.length > 5,
      sinceLastTransition: "not_applicable" as const,
    };
  }
  const bounded = frames.slice(-5);
  let transitionIndex = -1;
  for (let index = bounded.length - 1; index >= 0; index -= 1) {
    if (bounded[index]!.boundary.semantic_discontinuity) {
      transitionIndex = index;
      break;
    }
  }
  return {
    frames: transitionIndex >= 0 ? bounded.slice(transitionIndex) : bounded,
    maxFrames: 5 as const,
    truncated: frames.length > 5 || transitionIndex > 0,
    sinceLastTransition:
      transitionIndex >= 0
        ? ("found_in_bounded_input" as const)
        : ("not_found_in_bounded_input" as const),
  };
}

function assertFrameBuilderInputV01(
  input: BuildWorkContinuityStateFrameInputV01,
): void {
  if (!isProtocolRecordV01(input)) failV01("continuity_dynamics_frame_input_invalid");
  const common = [
    "boundary_kind",
    "workspace_id",
    "project_id",
    "prior_task_context_packet",
    "later_task_context_packet",
    "source_transition_receipt",
  ];
  if (input.boundary_kind === "context_use_review_recorded") {
    assertExactKeysV01(input, [
      ...common,
      "later_task_run_receipt",
      "context_use_review",
      "context_use_attribution",
      "context_shadow_projection",
    ]);
  } else if (input.boundary_kind === "semantic_transition_later_packet") {
    assertExactKeysV01(input, common);
  } else {
    failV01("continuity_dynamics_boundary_kind_invalid");
  }
  if (!normalizeProtocolTextV01(input.workspace_id) || !normalizeProtocolTextV01(input.project_id)) {
    failV01("continuity_dynamics_scope_invalid");
  }
}

function assertDigestBuilderInputV01(
  input: BuildContinuityDynamicsDigestInputV01,
): void {
  if (!isProtocolRecordV01(input)) failV01("continuity_dynamics_digest_input_invalid");
  assertExactKeysV01(input, ["workspace_id", "project_id", "frames", "window_kind"]);
  if (
    !normalizeProtocolTextV01(input.workspace_id) ||
    !normalizeProtocolTextV01(input.project_id) ||
    !Array.isArray(input.frames) ||
    input.frames.length < 1 ||
    input.frames.length > CONTINUITY_DYNAMICS_MAX_FRAMES_V01 ||
    !["current_only", "recent_3", "recent_5", "since_last_transition"].includes(
      String(input.window_kind),
    )
  ) {
    failV01("continuity_dynamics_digest_input_invalid");
  }
}

function assertPacketV01(packet: TaskContextPacketV01): void {
  if (
    validateTaskContextPacketV01(packet, { evaluated_at: packet?.generated_at ?? "" })
      .status !== "valid"
  ) {
    failV01("continuity_dynamics_task_context_packet_invalid");
  }
}

function assertRunReceiptV01(receipt: RunReceiptV01): void {
  if (validateRunReceiptV01(receipt).status !== "valid") {
    failV01("continuity_dynamics_run_receipt_invalid");
  }
}

function assertTransitionV01(receipt: StateTransitionReceiptV01): void {
  if (validateStateTransitionReceiptV01(receipt).status !== "valid") {
    failV01("continuity_dynamics_state_transition_receipt_invalid");
  }
}

function assertExactAttributionV01(
  input: BuildContextUseReviewFrameInputV01,
  attribution: ContextUseAttributionProjectionV01,
): void {
  if (validateContextUseAttributionProjectionV01(attribution).status !== "valid") {
    failV01("continuity_dynamics_acgc1_attribution_invalid");
  }
  const transitionBinding =
    attribution.source_chain.source_transition_receipt;
  const exact =
    transitionBinding !== undefined &&
    attribution.source_chain.source_operational_continuation === undefined &&
    attribution.workspace_id === input.workspace_id &&
    attribution.project_id === input.project_id &&
    attribution.context_use_review.review_id === input.context_use_review.review_id &&
    attribution.context_use_review.review_fingerprint === input.context_use_review.integrity.fingerprint &&
    attribution.later_task_run_receipt.receipt_id === input.later_task_run_receipt.receipt_id &&
    attribution.later_task_run_receipt.receipt_fingerprint === input.later_task_run_receipt.integrity.fingerprint &&
    attribution.later_task_context_packet.packet_id === input.later_task_context_packet.packet_id &&
    attribution.later_task_context_packet.packet_fingerprint === input.later_task_context_packet.integrity.fingerprint &&
    attribution.source_chain.prior_packet.packet_id === input.prior_task_context_packet.packet_id &&
    attribution.source_chain.prior_packet.packet_fingerprint === input.prior_task_context_packet.integrity.fingerprint &&
    transitionBinding.transition_receipt_id === input.source_transition_receipt.transition_receipt_id &&
    transitionBinding.transition_receipt_fingerprint === input.source_transition_receipt.integrity.fingerprint;
  if (!exact) failV01("continuity_dynamics_acgc1_attribution_binding_mismatch");
}

function assertScopeV01(
  workspaceIdInput: string,
  projectIdInput: string,
  values: Array<{ workspace_id: string; project_id: string }>,
): void {
  const workspaceId = normalizeProtocolTextV01(workspaceIdInput);
  const projectId = normalizeProtocolTextV01(projectIdInput);
  if (
    values.some(
      (value) =>
        normalizeProtocolTextV01(value.workspace_id) !== workspaceId ||
        normalizeProtocolTextV01(value.project_id) !== projectId,
    )
  ) {
    failV01("continuity_dynamics_workspace_project_mismatch");
  }
}

function assertOrderedUniqueFramesV01(
  frames: WorkContinuityStateFrameV01[],
): void {
  const ids = new Set<string>();
  const fingerprints = new Set<string>();
  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index]!;
    if (ids.has(frame.frame_id) || fingerprints.has(frame.integrity.fingerprint)) {
      failV01("continuity_dynamics_duplicate_frame_refused");
    }
    ids.add(frame.frame_id);
    fingerprints.add(frame.integrity.fingerprint);
    if (index > 0 && compareFramesV01(frames[index - 1]!, frame) >= 0) {
      failV01("continuity_dynamics_frame_chronology_invalid");
    }
  }
}

function compareFramesV01(
  left: WorkContinuityStateFrameV01,
  right: WorkContinuityStateFrameV01,
): number {
  const leftTime = parseStrictIsoTimestampV01(left.boundary.boundary_timestamp);
  const rightTime = parseStrictIsoTimestampV01(right.boundary.boundary_timestamp);
  if (leftTime === null || rightTime === null) failV01("continuity_dynamics_timestamp_invalid");
  return leftTime === rightTime ? 0 : leftTime < rightTime ? -1 : 1;
}

function packetBindingV01(packet: TaskContextPacketV01): ContinuityDynamicsSourceBindingV01 {
  return sourceBindingV01("task_context_packet", packet.packet_id, packet.integrity.fingerprint, packet.generated_at);
}

function runReceiptBindingV01(receipt: RunReceiptV01): ContinuityDynamicsSourceBindingV01 {
  return sourceBindingV01("run_receipt", receipt.receipt_id, receipt.integrity.fingerprint, receipt.recorded_at);
}

function contextUseReviewBindingV01(review: ContextUseReviewV01): ContinuityDynamicsSourceBindingV01 {
  return sourceBindingV01("context_use_review", review.review_id, review.integrity.fingerprint, review.reviewed_at);
}

function stateTransitionBindingV01(receipt: StateTransitionReceiptV01): ContinuityDynamicsSourceBindingV01 {
  return sourceBindingV01("state_transition_receipt", receipt.transition_receipt_id, receipt.integrity.fingerprint, receipt.recorded_at);
}

function attributionBindingV01(projection: ContextUseAttributionProjectionV01): ContinuityDynamicsSourceBindingV01 {
  return sourceBindingV01("context_use_attribution_projection", projection.projection_id, projection.integrity.fingerprint, null);
}

function shadowBindingV01(projection: PersonalPerspectiveShadowProjectionV01): ContinuityDynamicsSourceBindingV01 {
  return sourceBindingV01("personal_perspective_shadow_projection", projection.projection_id, projection.integrity.fingerprint, null);
}

function pairedEvaluationBindingV01(input: { evaluation_id: string; integrity: { fingerprint: string } }): ContinuityDynamicsSourceBindingV01 {
  return sourceBindingV01("personal_perspective_paired_evaluation", input.evaluation_id, input.integrity.fingerprint, null);
}

function sourceBindingV01(
  sourceKind: ContinuityDynamicsSourceBindingV01["source_kind"],
  sourceId: string,
  fingerprint: string,
  timestamp: string | null,
): ContinuityDynamicsSourceBindingV01 {
  const binding = {
    source_kind: sourceKind,
    source_id: normalizeProtocolTextV01(sourceId),
    source_fingerprint: normalizeProtocolTextV01(fingerprint),
    source_timestamp: timestamp,
  };
  validateSourceBindingV01(binding);
  return binding;
}

function validateSourceBindingV01(binding: ContinuityDynamicsSourceBindingV01): void {
  if (
    !isProtocolRecordV01(binding) ||
    !normalizeProtocolTextV01(binding.source_id) ||
    !SHA256_PATTERN.test(normalizeProtocolTextV01(binding.source_fingerprint)) ||
    (binding.source_timestamp !== null &&
      parseStrictIsoTimestampV01(binding.source_timestamp) === null)
  ) {
    failV01("continuity_dynamics_source_binding_invalid");
  }
  assertExactKeysV01(binding, ["source_kind", "source_id", "source_fingerprint", "source_timestamp"]);
}

function uniqueSourceBindingsV01(
  bindings: ContinuityDynamicsSourceBindingV01[],
): ContinuityDynamicsSourceBindingV01[] {
  const unique = new Map<string, ContinuityDynamicsSourceBindingV01>();
  for (const binding of bindings) {
    const key = sourceBindingKeyV01(binding);
    const canonical = canonicalizeProtocolValueV01(binding);
    const existing = unique.get(key);
    if (existing && canonicalizeProtocolValueV01(existing) !== canonical) {
      failV01("continuity_dynamics_source_binding_conflict");
    }
    if (!existing) unique.set(key, structuredClone(binding));
  }
  return [...unique.values()];
}

function sourceBindingKeyV01(binding: ContinuityDynamicsSourceBindingV01): string {
  return `${binding.source_kind}|${binding.source_id}`;
}

function completeV01(): ContinuityDimensionCompletenessV01 {
  return { status: "complete", missing: [], limitations: [] };
}

function partialV01(
  missing: string[],
  limitations: string[],
): ContinuityDimensionCompletenessV01 {
  return {
    status: "partial",
    missing: uniqueStringsV01(missing),
    limitations: uniqueStringsV01(limitations),
  };
}

function unavailableV01(missing: string): ContinuityDimensionCompletenessV01 {
  return { status: "unavailable", missing: [missing], limitations: [] };
}

function combineCompletenessV01(
  inputs: ContinuityDimensionCompletenessV01[],
): ContinuityDimensionCompletenessV01 {
  const statuses = new Set(inputs.map((input) => input.status));
  return {
    status: statuses.has("unavailable")
      ? "unavailable"
      : statuses.has("partial")
        ? "partial"
        : "complete",
    missing: uniqueStringsV01(inputs.flatMap((input) => input.missing)),
    limitations: uniqueStringsV01(inputs.flatMap((input) => input.limitations)),
  };
}

function createAuthoritySummaryV01(): ContinuityDynamicsAuthoritySummaryV01 {
  return {
    is_canonical_core_record: false,
    is_semantic_state: false,
    is_evidence: false,
    is_policy: false,
    is_proposal: false,
    is_review_decision: false,
    is_transition: false,
    is_context_selector: false,
    writes_database: false,
    mutates_source_records: false,
    mutates_task_context_packet: false,
    selects_context: false,
    activates_policy: false,
    authorizes_execution: false,
    authorizes_provider_calls: false,
    authorizes_network_use: false,
    authorizes_external_actuation: false,
    authorizes_github_mutation: false,
    authorizes_publication: false,
    authorizes_merge: false,
    predicts_work_success: false,
    creates_global_health_score: false,
    notes: [
      "Source Record is not Frame; Frame is not Semantic State or Evaluation Truth.",
      "Dimension direction is not global health, causal contribution, policy, decision, or Transition.",
      "Regime shift identifies only an exact source-linked discontinuity and does not imply improvement or success.",
    ],
  };
}

function createMaterialBoundaryV01(): ContinuityDynamicsMaterialBoundaryV01 {
  return {
    bounded: true,
    max_frames: CONTINUITY_DYNAMICS_MAX_FRAMES_V01,
    max_source_bindings: CONTINUITY_DYNAMICS_MAX_SOURCE_BINDINGS_V01,
    max_text_characters: CONTINUITY_DYNAMICS_MAX_TEXT_CHARACTERS_V01,
    raw_prompt_included: false,
    raw_transcript_included: false,
    raw_terminal_output_included: false,
    raw_provider_output_included: false,
    hidden_reasoning_included: false,
    credential_or_secret_included: false,
    absolute_local_path_included: false,
  };
}

function pendingIntegrityV01(): ContinuityDynamicsIntegrityV01 {
  return {
    algorithm: "sha256",
    canonicalization: CONTINUITY_DYNAMICS_CANONICALIZATION_V01,
    fingerprint_scope: "object_without_integrity_fingerprint",
    fingerprint: PENDING_FINGERPRINT,
  };
}

function finalizeIdentityV01<T extends { integrity: ContinuityDynamicsIntegrityV01 }>(
  value: T,
  prefix: string,
  idField: string,
): void {
  const record = value as unknown as Record<string, unknown> & {
    integrity: ContinuityDynamicsIntegrityV01;
  };
  const identityCopy = structuredClone(record);
  identityCopy[idField] = PENDING_ID;
  delete (identityCopy.integrity as Partial<ContinuityDynamicsIntegrityV01>).fingerprint;
  const identityFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(identityCopy),
  );
  record[idField] = `${prefix}:${identityFingerprint.slice("sha256:".length, 38)}`;
  value.integrity.fingerprint = createFingerprintV01(value);
}

function validateIdentityV01<T extends { integrity: ContinuityDynamicsIntegrityV01 }>(
  value: T,
  prefix: string,
  idField: string,
): void {
  const record = value as unknown as Record<string, unknown> & {
    integrity: ContinuityDynamicsIntegrityV01;
  };
  const actualId = record[idField];
  const expectedId = deriveIdentityValueV01(value, prefix, idField);
  if (
    actualId !== expectedId ||
    value.integrity.algorithm !== "sha256" ||
    value.integrity.canonicalization !== CONTINUITY_DYNAMICS_CANONICALIZATION_V01 ||
    value.integrity.fingerprint_scope !== "object_without_integrity_fingerprint" ||
    createFingerprintV01(value) !== value.integrity.fingerprint
  ) {
    failV01("continuity_dynamics_identity_fingerprint_invalid");
  }
}

function deriveIdentityValueV01<T extends { integrity: ContinuityDynamicsIntegrityV01 }>(
  value: T,
  prefix: string,
  idField: string,
): string {
  const record = value as unknown as Record<string, unknown> & {
    integrity: ContinuityDynamicsIntegrityV01;
  };
  const copy = structuredClone(record);
  copy[idField] = PENDING_ID;
  delete (copy.integrity as Partial<ContinuityDynamicsIntegrityV01>).fingerprint;
  const identityFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(copy),
  );
  return `${prefix}:${identityFingerprint.slice("sha256:".length, 38)}`;
}

function createFingerprintV01<T extends {
  integrity: ContinuityDynamicsIntegrityV01;
}>(value: T): string {
  const copy = structuredClone(value);
  delete (copy.integrity as Partial<ContinuityDynamicsIntegrityV01>).fingerprint;
  return createProtocolSha256V01(canonicalizeProtocolValueV01(copy));
}

function assertSafeMaterialV01(value: unknown): void {
  const issues: string[] = [];
  scanForbiddenProtocolMaterialV01(
    value,
    "$",
    {
      error: (code) => issues.push(code),
      warning: () => {},
    },
    {
      secret_material_message: "Secret-shaped material is forbidden in continuity dynamics.",
      provider_specific_field_message: "Provider-specific identity is allowed only inside ExternalRef source owners.",
      allowed_false_invariant_fields: new Set([
        "raw_prompt_included",
        "raw_transcript_included",
        "raw_terminal_output_included",
        "raw_provider_output_included",
        "hidden_reasoning_included",
        "credential_or_secret_included",
        "credential_or_secret_persisted",
        "secret_material_persisted",
      ]),
      allowed_canonical_identity_paths: new Set([
        "$.later_task_run_receipt.run_id",
      ]),
      additional_forbidden_raw_field_pattern:
        /^(?:raw_provider_output|provider_output|raw_terminal_output|terminal_output)$/u,
    },
  );
  scanStringsV01(value, (text) => {
    if (/^(?:\/Users\/|\/home\/|[A-Za-z]:[\\/]|\\\\)/u.test(text)) {
      issues.push("private_absolute_path");
    }
  });
  if (issues.length > 0) {
    failV01(`continuity_dynamics_material_refused:${uniqueStringsV01(issues).join(",")}`);
  }
}

function assertNoScalarAggregateFieldsV01(value: unknown): void {
  scanEntriesV01(value, (key) => {
    const normalized = key.trim().replace(/[\s-]+/gu, "_").toLowerCase();
    if (
      normalized === "global_health_score" ||
      normalized === "global_fitness_score" ||
      normalized === "health_score" ||
      normalized === "fitness_score" ||
      normalized === "weighted_sum" ||
      normalized === "overall_convergence_percentage" ||
      normalized === "overall_health_percentage"
    ) {
      failV01("continuity_dynamics_scalar_aggregate_forbidden");
    }
  });
}

function assertTextAndCollectionBoundsV01(value: unknown): void {
  scanValuesV01(value, (item) => {
    if (
      typeof item === "string" &&
      item.length > CONTINUITY_DYNAMICS_MAX_TEXT_CHARACTERS_V01
    ) {
      failV01("continuity_dynamics_text_bound_exceeded");
    }
    if (
      Array.isArray(item) &&
      item.length > CONTINUITY_DYNAMICS_MAX_SOURCE_BINDINGS_V01
    ) {
      failV01("continuity_dynamics_collection_bound_exceeded");
    }
  });
}

function assertExactKeysV01(
  value: Record<string, unknown>,
  allowed: readonly string[],
): void {
  const allowedSet = new Set(allowed);
  if (Object.keys(value).some((key) => !allowedSet.has(key))) {
    failV01("continuity_dynamics_unknown_field");
  }
}

function scanStringsV01(value: unknown, visit: (text: string) => void): void {
  if (typeof value === "string") visit(value);
  else if (Array.isArray(value)) value.forEach((item) => scanStringsV01(item, visit));
  else if (isProtocolRecordV01(value)) Object.values(value).forEach((item) => scanStringsV01(item, visit));
}

function scanValuesV01(value: unknown, visit: (value: unknown) => void): void {
  visit(value);
  if (Array.isArray(value)) value.forEach((item) => scanValuesV01(item, visit));
  else if (isProtocolRecordV01(value)) Object.values(value).forEach((item) => scanValuesV01(item, visit));
}

function scanEntriesV01(
  value: unknown,
  visit: (key: string, value: unknown) => void,
): void {
  if (Array.isArray(value)) {
    value.forEach((item) => scanEntriesV01(item, visit));
  } else if (isProtocolRecordV01(value)) {
    for (const [key, item] of Object.entries(value)) {
      visit(key, item);
      scanEntriesV01(item, visit);
    }
  }
}

function uniqueStringsV01(values: string[]): string[] {
  return [...new Set(values)].sort(compareProtocolCodeUnitsV01);
}

function failV01(code: string): never {
  throw new Error(code);
}
