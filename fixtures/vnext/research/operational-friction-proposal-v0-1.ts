import { contextUseAttributionSourceFixture } from "@/fixtures/vnext/protocol/context-use-attribution-projection-v0-1";
import {
  buildContinuityDynamicsDigestV01,
  buildWorkContinuityStateFrameV01,
  type BuildContextUseReviewFrameInputV01,
} from "@/lib/vnext/continuity-dynamics";
import {
  buildPersonalPerspectivePairedEvaluationV01,
  buildPersonalPerspectiveShadowProjectionV01,
} from "@/lib/vnext/context-shadow-navigation";
import { buildContextUseAttributionProjectionV01 } from "@/lib/vnext/context-use-attribution-projection";
import {
  buildContextUseReviewV01,
  deriveContextUseReviewPresentationProvenanceV01,
  validateContextUseReviewRelationsV01,
} from "@/lib/vnext/context-use-review";
import type { MaterializeOperationalFrictionProposalInputV01 } from "@/lib/vnext/operational-friction-proposal";
import { createPersonalPerspectiveScopeLineageRefV01 } from "@/lib/vnext/project-controls/project-controls";
import {
  buildRunReceiptV01,
  validateRunReceiptV01,
} from "@/lib/vnext/run-receipt";
import { buildTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import {
  createVNextOperatorPilotContextUseReviewLogicalIdentityV01,
  createVNextOperatorPilotContextUseReviewRequestFingerprintV01,
  VNEXT_OPERATOR_PILOT_CONTEXT_USE_REVIEW_NAMESPACE_V01,
} from "@/lib/vnext/runtime/operator-pilot-context-use-contract";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type { PersonalPerspectiveContextCandidateV01 } from "@/types/vnext/project-controls";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export type OperationalFrictionSourceRecordChainV01 =
  typeof contextUseAttributionSourceFixture;
type SourceChainV01 = OperationalFrictionSourceRecordChainV01;

export interface OperationalFrictionSourceFixtureOptionsV01 {
  assessment?: "stale" | "misleading" | "missing" | "noisy";
  unresolved_counts?: readonly [number, number, number];
  wrong_context_correction_count?: number | null;
  repeated_explanation_estimate?: number | null;
  max_shadow_selected?: number;
  materialization_final_reviewed_at?: string;
  persisted_source_role?: "semantic_lineage" | "operational_fixture";
}

export interface OperationalFrictionDisposableReviewFixtureV01 {
  materialization_source: MaterializeOperationalFrictionProposalInputV01;
  exact_source_records: Array<{
    prior_task_context_packet: TaskContextPacketV01;
    later_task_context_packet: TaskContextPacketV01;
    source_transition_receipt: SourceChainV01["source_transition_receipt"];
    later_task_run_receipt: RunReceiptV01;
    context_use_review: ContextUseReviewV01;
  }>;
}

export function buildOperationalFrictionSourceFixtureV01(
  options: OperationalFrictionSourceFixtureOptionsV01 = {},
): MaterializeOperationalFrictionProposalInputV01 {
  return buildOperationalFrictionDisposableReviewFixtureV01(options)
    .materialization_source;
}

/**
 * Repository-owned disposable-DB fixture. The ACGC4A materializer still
 * receives only its exact bounded source projections; this companion view
 * exposes the source Records an Operator consumer must seed in an isolated
 * store without expanding the durable proposal payload.
 */
export function buildOperationalFrictionDisposableReviewFixtureV01(
  options: OperationalFrictionSourceFixtureOptionsV01 = {},
): OperationalFrictionDisposableReviewFixtureV01 {
  return buildOperationalFrictionDisposableReviewFixtureFromSourceChainV01(
    contextUseAttributionSourceFixture,
    options,
  );
}

export function buildOperationalFrictionDisposableReviewFixtureFromSourceChainV01(
  sourceChain: OperationalFrictionSourceRecordChainV01,
  options: OperationalFrictionSourceFixtureOptionsV01 = {},
): OperationalFrictionDisposableReviewFixtureV01 {
  const base = buildPersonalPerspectiveSourceChainV01(sourceChain, options);
  const unresolvedCounts = options.unresolved_counts ?? [1, 2, 3];
  const chains = unresolvedCounts.map((unresolved, index) =>
    buildSourceChainV01(base, unresolved, index, options),
  );
  const exact = chains.map((source) => {
    const relation = validateContextUseReviewRelationsV01(
      source.review,
      source.prior_packet,
      source.later_packet,
      source.source_transition_receipt,
      source.later_task_run_receipt,
    );
    if (relation.status !== "valid") {
      const runValidation = validateRunReceiptV01(
        source.later_task_run_receipt,
      );
      throw new Error(
        `operational_friction_disposable_source_relation_invalid:${relation.errors
          .map((issue) => issue.code)
          .join(",")}:run=${runValidation.status}:${runValidation.errors
          .map((issue) => `${issue.code}@${issue.path ?? "$"}`)
          .join(",")}`,
      );
    }
    const attribution = buildContextUseAttributionProjectionV01(source);
    const shadow = buildPersonalPerspectiveShadowProjectionV01(
      shadowInputV01(source, options),
    );
    const paired = buildPersonalPerspectivePairedEvaluationV01(
      shadow,
      attribution,
    );
    const frame = buildWorkContinuityStateFrameV01(
      frameInputV01(source, attribution, shadow),
    );
    return { source, attribution, shadow, paired, frame };
  });
  const frames = exact.map((item) => item.frame);
  const current = exact.at(-1)!;
  const digest = buildContinuityDynamicsDigestV01({
    workspace_id: current.source.review.workspace_id,
    project_id: current.source.review.project_id,
    frames,
    window_kind: "recent_3",
  });
  return {
    materialization_source: {
      workspace_id: current.source.review.workspace_id,
      project_id: current.source.review.project_id,
      attribution: current.attribution,
      context_shadow_projection: current.shadow,
      paired_evaluation: current.paired,
      dynamics_digest: digest,
      frames,
    },
    exact_source_records: chains.map((source) => ({
      prior_task_context_packet: source.prior_packet,
      later_task_context_packet: source.later_packet,
      source_transition_receipt: source.source_transition_receipt,
      later_task_run_receipt: source.later_task_run_receipt,
      context_use_review: source.review,
    })),
  };
}

function buildPersonalPerspectiveSourceChainV01(
  sourceChain: SourceChainV01,
  options: OperationalFrictionSourceFixtureOptionsV01,
): SourceChainV01 {
  const source = clone(sourceChain);
  const scope = personalScopeV01(
    source.review.workspace_id,
    source.review.project_id,
  );
  const personalEntries = [
    personalEntryV01("fresh-a", "fresh", scope),
    personalEntryV01("fresh-b", "fresh", scope),
    personalEntryV01("unknown", "unknown", scope),
  ];
  let priorPacket = clone(source.prior_packet);
  let laterPacket = clone(source.later_packet);
  if (options.persisted_source_role !== "operational_fixture") {
    const priorInput = taskContextPacketBuilderInputV01(source.prior_packet);
    priorInput.selected_context.push(...clone(personalEntries));
    priorInput.constraints.context_budget.max_selected_entries =
      (priorInput.constraints.context_budget.max_selected_entries ?? 0) +
      personalEntries.length;
    priorPacket = buildTaskContextPacketV01(priorInput);
    const laterInput = taskContextPacketBuilderInputV01(source.later_packet);
    laterInput.selected_context.push(...clone(personalEntries));
    laterInput.constraints.context_budget.max_selected_entries =
      (laterInput.constraints.context_budget.max_selected_entries ?? 0) +
      personalEntries.length;
    laterPacket = buildTaskContextPacketV01(laterInput);
  }

  const runInput = runReceiptBuilderInputV01(source.later_task_run_receipt);
  runInput.task_context_packet_ref = {
    ...runInput.task_context_packet_ref!,
    external_id: laterPacket.packet_id,
    source_ref: laterPacket.integrity.fingerprint,
  };
  const replacementDeliveryRef = {
    ...runInput.checks.find(
      (check) => check.check_id === "deterministic_packet_delivery",
    )!.source_refs[0]!,
    external_id: laterPacket.packet_id,
    source_ref: laterPacket.integrity.fingerprint,
  };
  for (const ref of runInput.verifier_refs) {
    if (ref.ref_type === "task_context_packet_delivery") {
      Object.assign(ref, replacementDeliveryRef);
    }
  }
  for (const check of runInput.checks) {
    check.source_refs = check.source_refs.map((ref) =>
      ref.ref_type === "task_context_packet_delivery"
        ? clone(replacementDeliveryRef)
        : ref,
    );
  }
  runInput.external_refs.push(
    ...personalEntries.flatMap((entry) =>
      entry.external_ref ? [clone(entry.external_ref)] : [],
    ),
  );
  const runReceipt = buildRunReceiptV01(runInput);
  assertDisposableSourceRunReceiptV01(runReceipt);

  const reviewInput = contextUseReviewBuilderInputV01(source.review);
  reviewInput.prior_packet = {
    packet_version: priorPacket.packet_version,
    packet_id: priorPacket.packet_id,
    packet_fingerprint: priorPacket.integrity.fingerprint,
  };
  reviewInput.later_packet = {
    packet_version: laterPacket.packet_version,
    packet_id: laterPacket.packet_id,
    packet_fingerprint: laterPacket.integrity.fingerprint,
  };
  reviewInput.later_task_run_receipt = {
    receipt_version: runReceipt.receipt_version,
    receipt_id: runReceipt.receipt_id,
    receipt_fingerprint: runReceipt.integrity.fingerprint,
  };
  const presentation = deriveContextUseReviewPresentationProvenanceV01(
    runReceipt,
  );
  reviewInput.usage.presented = presentation.presented;
  reviewInput.usage_provenance!.presented = presentation.provenance;
  const review = buildContextUseReviewV01(reviewInput);
  return {
    prior_packet: priorPacket,
    later_packet: laterPacket,
    source_transition_receipt: source.source_transition_receipt,
    later_task_run_receipt: runReceipt,
    review,
  };
}

function buildSourceChainV01(
  base: SourceChainV01,
  unresolvedCount: number,
  index: number,
  options: OperationalFrictionSourceFixtureOptionsV01,
): SourceChainV01 {
  const runInput = runReceiptBuilderInputV01(base.later_task_run_receipt);
  const boundedFinalReviewedAt = options.materialization_final_reviewed_at
    ? Date.parse(options.materialization_final_reviewed_at)
    : null;
  const historicalFixtureAnchor = Date.parse("2026-07-18T14:00:00.000Z");
  const exactSourceAnchor =
    Date.parse(base.later_task_run_receipt.recorded_at) + 10 * 60_000;
  const boundedWindowStart = Date.parse(base.later_packet.generated_at);
  if (
    boundedFinalReviewedAt !== null &&
    (!Number.isFinite(boundedFinalReviewedAt) ||
      !Number.isFinite(boundedWindowStart) ||
      boundedFinalReviewedAt - boundedWindowStart < 6)
  ) {
    throw new Error("operational_friction_disposable_time_window_invalid");
  }
  const boundedReviewAt =
    boundedFinalReviewedAt === null
      ? null
      : boundedWindowStart +
        Math.floor(
          ((boundedFinalReviewedAt - boundedWindowStart) * (index + 1)) / 3,
        );
  const boundedRunAt =
    boundedReviewAt === null
      ? Math.max(historicalFixtureAnchor, exactSourceAnchor) +
        index * 10 * 60_000
      : boundedReviewAt - 1;
  if (boundedFinalReviewedAt !== null) {
    runInput.run_id = `${runInput.run_id}:operational-friction-frame-${index}`;
  }
  runInput.recorded_at = new Date(
    boundedRunAt,
  ).toISOString();
  runInput.checks = runInput.checks.filter(
    (check) => !check.check_id.startsWith("friction-required-"),
  );
  runInput.verification.required_check_ids =
    runInput.verification.required_check_ids.filter(
      (checkId) => !checkId.startsWith("friction-required-"),
    );
  for (let checkIndex = 0; checkIndex < 3; checkIndex += 1) {
    const checkId = `friction-required-${checkIndex}`;
    runInput.checks.push({
      check_id: checkId,
      required: true,
      status: checkIndex < unresolvedCount ? "failed" : "passed",
      basis: "observed",
      summary: `Exact deterministic friction check ${checkIndex}.`,
      source_refs: [clone(runInput.verifier_refs[0]!)],
    });
    runInput.verification.required_check_ids.push(checkId);
  }
  runInput.verification.status = unresolvedCount > 0 ? "partial" : "passed";
  runInput.verification.basis = "observed";
  const runReceipt = buildRunReceiptV01(runInput);
  assertDisposableSourceRunReceiptV01(runReceipt);

  const reviewInput = contextUseReviewBuilderInputV01(base.review);
  reviewInput.reviewed_at = new Date(
    boundedReviewAt ?? Date.parse(runReceipt.recorded_at) + 60_000,
  ).toISOString();
  reviewInput.later_task_run_receipt = {
    receipt_version: runReceipt.receipt_version,
    receipt_id: runReceipt.receipt_id,
    receipt_fingerprint: runReceipt.integrity.fingerprint,
  };
  const presentation = deriveContextUseReviewPresentationProvenanceV01(
    runReceipt,
  );
  reviewInput.usage.presented = presentation.presented;
  reviewInput.usage_provenance!.presented = presentation.provenance;
  reviewInput.assessment = options.assessment ?? "stale";
  reviewInput.metrics.wrong_context_correction_count =
    options.wrong_context_correction_count === undefined
      ? 2
      : options.wrong_context_correction_count;
  reviewInput.metrics.repeated_explanation_estimate =
    options.repeated_explanation_estimate === undefined
      ? null
      : options.repeated_explanation_estimate;
  if (options.persisted_source_role === "operational_fixture") {
    bindDisposableReviewToRuntimeV01(reviewInput);
  }
  const review = buildContextUseReviewV01(reviewInput);
  return {
    ...base,
    later_task_run_receipt: runReceipt,
    review,
  };
}

function bindDisposableReviewToRuntimeV01(
  review: ReturnType<typeof contextUseReviewBuilderInputV01>,
): void {
  const sessionId = review.reviewer_authentication_basis_refs[0]?.external_id;
  if (!sessionId) {
    throw new Error("operational_friction_disposable_session_binding_missing");
  }
  const logicalIdentity =
    createVNextOperatorPilotContextUseReviewLogicalIdentityV01(review);
  const requestFingerprint =
    createVNextOperatorPilotContextUseReviewRequestFingerprintV01(review);
  const authenticationFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      action: "record_context_use_review",
      workspace_id: review.workspace_id,
      project_id: review.project_id,
      operator_id: review.reviewer_ref.external_id,
      session_id: sessionId,
      logical_identity: logicalIdentity,
      request_fingerprint: requestFingerprint,
      observed_at: review.reviewed_at,
    }),
  );
  const requestRef = {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "context_use_review_request",
    external_id: logicalIdentity,
    trust_class: "user_declaration" as const,
    observed_at: review.reviewed_at,
    source_ref: requestFingerprint,
    compatibility_namespace:
      VNEXT_OPERATOR_PILOT_CONTEXT_USE_REVIEW_NAMESPACE_V01,
  };
  review.compatibility.external_refs = [requestRef];
  review.reviewer_authentication_basis_refs = [
    {
      ref_version: "external_ref.v0.1",
      ref_type: "local_operator_session_action",
      external_id: sessionId,
      trust_class: "direct_local_observation",
      observed_at: review.reviewed_at,
      source_ref: authenticationFingerprint,
      compatibility_namespace: "augnes.vnext.local-operator-session.v0.1",
    },
  ];
  review.reviewer_ref = {
    ref_version: "external_ref.v0.1",
    ref_type: "local_operator_actor",
    external_id: review.reviewer_ref.external_id,
    trust_class: "user_declaration",
    observed_at: review.reviewed_at,
    source_ref: authenticationFingerprint,
    compatibility_namespace:
      VNEXT_OPERATOR_PILOT_CONTEXT_USE_REVIEW_NAMESPACE_V01,
  };
  if (review.usage_provenance) {
    review.usage_provenance.actually_used =
      review.usage.actually_used === "unknown"
        ? { basis: "unknown", source_refs: [] }
        : { basis: "user_declaration", source_refs: [requestRef] };
    review.usage_provenance.assessment = {
      basis: "user_declaration",
      source_refs: [requestRef],
    };
  }
}

function assertDisposableSourceRunReceiptV01(receipt: RunReceiptV01): void {
  const validation = validateRunReceiptV01(receipt);
  if (validation.status !== "valid") {
    throw new Error(
      `operational_friction_disposable_run_receipt_invalid:${validation.errors
        .map((issue) => `${issue.code}@${issue.path ?? "$"}`)
        .join(",")}`,
    );
  }
}

function frameInputV01(
  source: SourceChainV01,
  attribution: ReturnType<typeof buildContextUseAttributionProjectionV01>,
  shadow: ReturnType<typeof buildPersonalPerspectiveShadowProjectionV01>,
): BuildContextUseReviewFrameInputV01 {
  return {
    boundary_kind: "context_use_review_recorded",
    workspace_id: source.review.workspace_id,
    project_id: source.review.project_id,
    prior_task_context_packet: source.prior_packet,
    later_task_context_packet: source.later_packet,
    source_transition_receipt: source.source_transition_receipt,
    later_task_run_receipt: source.later_task_run_receipt,
    context_use_review: source.review,
    context_use_attribution: attribution,
    context_shadow_projection: shadow,
  };
}

function shadowInputV01(
  source: SourceChainV01,
  options: OperationalFrictionSourceFixtureOptionsV01,
) {
  const scope = personalScopeV01(
    source.review.workspace_id,
    source.review.project_id,
  );
  const selectedCandidates: PersonalPerspectiveContextCandidateV01[] =
    source.later_packet.selected_context
      .filter(
        (entry) =>
          options.persisted_source_role === "operational_fixture" ||
          entry.entry_kind === "memory_ref",
      )
      .map((entry) => ({
        candidate_scope: {
          scope_kind: "canonical_project" as const,
          workspace_id: source.review.workspace_id,
          project_id: source.review.project_id,
        },
        review_status: "reviewed" as const,
        trust_policy_status: "eligible" as const,
        entry: clone(entry),
      }));
  const candidates = selectedCandidates;
  return {
    workspace_id: source.review.workspace_id,
    project_id: source.review.project_id,
    scope,
    candidates,
    baseline_task_context_packet: {
      packet_version: source.later_packet.packet_version,
      packet_id: source.later_packet.packet_id,
      packet_fingerprint: source.later_packet.integrity.fingerprint,
    },
    max_shadow_selected: options.max_shadow_selected ?? 1,
  };
}

function personalEntryV01(
  suffix: string,
  currentness: "fresh" | "unknown",
  scope: ReturnType<typeof personalScopeV01>,
) {
  const externalRef = {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "reviewed_memory",
    external_id: `memory:operational-friction:${suffix}`,
    observed_at: "2026-07-18T00:00:00.000Z",
    trust_class: "direct_local_observation" as const,
    compatibility_namespace: "augnes.operational-friction.fixture.v0.1",
  };
  return {
    entry_id: `memory-entry:operational-friction:${suffix}`,
    entry_kind: "memory_ref" as const,
    source_ref: `memory-source:operational-friction:${suffix}`,
    external_ref: externalRef,
    why_included:
      "Included for exact synthetic source-bound operational-friction conformance.",
    currentness: {
      status: currentness,
      as_of: currentness === "unknown" ? null : "2026-07-18T00:00:00.000Z",
      basis:
        currentness === "unknown"
          ? "Exact synthetic source reports unknown currentness."
          : "Exact synthetic source reports fresh currentness.",
      source_ref:
        currentness === "unknown"
          ? null
          : {
              ...externalRef,
              external_id: `memory-currentness:operational-friction:${suffix}`,
            },
    },
    trust_class: "direct_local_observation" as const,
    compatibility_source_ref: createPersonalPerspectiveScopeLineageRefV01(
      scope,
    )!,
    bounded_summary: `Bounded operational-friction memory ${suffix}.`,
  };
}

function personalScopeV01(workspaceId: string, projectId: string) {
  return {
    effective_scope_version: "personal_perspective_effective_scope.v0.1" as const,
    workspace_id: workspaceId,
    project_id: projectId,
    status: "included" as const,
    configured: true,
    effectively_included: true,
    scope_revision: 1,
    created_at: "2026-07-18T00:00:00.000Z",
    updated_at: "2026-07-18T00:01:00.000Z",
    effective_context_behavior: "eligible_for_normal_context_selection" as const,
    explanation: "Exact project-scoped ACGC4A fixture reuse of ACGC2.",
  };
}

function taskContextPacketBuilderInputV01(packet: TaskContextPacketV01) {
  const {
    packet_version: _version,
    packet_id: _id,
    authority_summary,
    integrity: _integrity,
    ...input
  } = clone(packet);
  return { ...input, authority_notes: authority_summary.notes };
}

function runReceiptBuilderInputV01(receipt: RunReceiptV01) {
  const {
    receipt_version: _version,
    receipt_id: _id,
    trust_summary: _trust,
    authority_summary,
    idempotency_key: _key,
    integrity: _integrity,
    ...input
  } = clone(receipt);
  return { ...input, authority_notes: authority_summary.notes };
}

function contextUseReviewBuilderInputV01(review: ContextUseReviewV01) {
  const {
    review_version: _version,
    review_id: _id,
    material_boundary: _boundary,
    authority_summary,
    integrity: _integrity,
    ...input
  } = clone(review);
  return { ...input, authority_notes: authority_summary.notes };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
