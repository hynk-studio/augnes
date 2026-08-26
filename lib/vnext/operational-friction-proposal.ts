import {
  assertValidPersonalPerspectiveShadowProjectionV01,
  assertValidPersonalPerspectivePairedEvaluationV01,
  buildPersonalPerspectivePairedEvaluationV01,
} from "@/lib/vnext/context-shadow-navigation";
import {
  assertValidContinuityDynamicsDigestV01,
  assertValidWorkContinuityStateFrameV01,
  buildContinuityDynamicsDigestV01,
} from "@/lib/vnext/continuity-dynamics";
import { validateContextUseAttributionProjectionV01 } from "@/lib/vnext/context-use-attribution-projection";
import {
  buildEpisodeDeltaProposalV01,
  validateEpisodeDeltaProposalV01,
} from "@/lib/vnext/episode-delta-proposal";
import {
  buildOperationalFrictionProposalProfileV01,
  createOperationalFrictionSourceExternalRefV01,
  deriveOperationalFrictionObservationIdV01,
  normalizeOperationalFrictionSourceBundleV01,
} from "@/lib/vnext/operational-friction-proposal-profile";
import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  compareProtocolCanonicalV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  normalizeExternalRefPrimitiveV01,
  parseStrictIsoTimestampV01,
  uniqueProtocolStringsV01,
  uniqueProtocolValuesV01,
} from "@/lib/vnext/protocol-primitives";
import type { ContextUseAttributionProjectionV01 } from "@/types/vnext/context-use-attribution-projection";
import {
  CONTINUITY_DYNAMICS_DIGEST_VERSION_V01,
  WORK_CONTINUITY_STATE_FRAME_VERSION_V01,
  type ContinuityDynamicsDigestV01,
  type WorkContinuityStateFrameV01,
} from "@/types/vnext/continuity-dynamics";
import {
  PERSONAL_PERSPECTIVE_PAIRED_EVALUATION_VERSION_V01,
  PERSONAL_PERSPECTIVE_SHADOW_PROJECTION_VERSION_V01,
  type PersonalPerspectivePairedEvaluationV01,
  type PersonalPerspectiveShadowProjectionV01,
} from "@/types/vnext/context-shadow-navigation";
import {
  CONTEXT_USE_ATTRIBUTION_PROJECTION_VERSION_V01,
} from "@/types/vnext/context-use-attribution-projection";
import type {
  EpisodeDeltaProposalDeltaCandidateV01,
  EpisodeDeltaProposalInferenceV01,
  EpisodeDeltaProposalObservationV01,
  EpisodeDeltaProposalV01,
} from "@/types/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  OPERATIONAL_FRICTION_DERIVATION_RULE_VERSION_V01,
  OPERATIONAL_FRICTION_PROPOSAL_PROFILE_VERSION_V01,
  OPERATIONAL_FRICTION_SOURCE_BUNDLE_VERSION_V01,
  OPERATIONAL_FRICTION_UNAVAILABLE_LANES_V01,
  type OperationalFrictionCandidateBindingV01,
  type OperationalFrictionCodeV01,
  type OperationalFrictionObservationV01,
  type OperationalFrictionOperationDomainV01,
  type OperationalFrictionProposalProfileV01,
  type OperationalFrictionSourceBindingV01,
  type OperationalFrictionSourceBundleV01,
  type OperationalFrictionTargetClassV01,
  type OperationalFrictionUnavailableLaneV01,
} from "@/types/vnext/operational-friction-proposal";

const SOURCE_MATERIAL_KIND = "operational_friction_source_binding.v0.1";
const FRICTION_MATERIAL_KIND = "operational_friction_observation.v0.1";
export const OPERATIONAL_FRICTION_PROPOSAL_MATERIALIZATION_VERSION_V01 =
  "operational_friction_proposal_materialization.v0.1" as const;
const MATERIALIZER_REF = normalizeExternalRefPrimitiveV01({
  ref_version: "external_ref.v0.1",
  ref_type: "pure_materializer",
  external_id: "materializeOperationalFrictionProposalV01",
  compatibility_namespace:
    OPERATIONAL_FRICTION_PROPOSAL_PROFILE_VERSION_V01,
  trust_class: "direct_local_observation",
});
const MATERIALIZER_INTERPRETER_REF = normalizeExternalRefPrimitiveV01({
  ...MATERIALIZER_REF,
  ref_type: "derived_materializer_interpretation",
  trust_class: "derived_interpretation",
});

export interface MaterializeOperationalFrictionProposalInputV01 {
  workspace_id: string;
  project_id: string;
  attribution: ContextUseAttributionProjectionV01;
  context_shadow_projection: PersonalPerspectiveShadowProjectionV01;
  paired_evaluation: PersonalPerspectivePairedEvaluationV01;
  dynamics_digest: ContinuityDynamicsDigestV01;
  frames: readonly WorkContinuityStateFrameV01[];
}

export interface MaterializeOperationalFrictionProposalResultV01 {
  materialization_version:
    typeof OPERATIONAL_FRICTION_PROPOSAL_MATERIALIZATION_VERSION_V01;
  materialization_id: string;
  future_admission_idempotency_key: string;
  source_bundle_id: string;
  source_bundle_fingerprint: string;
  profile: OperationalFrictionProposalProfileV01;
  proposal: EpisodeDeltaProposalV01;
  persistence: {
    reads: 0;
    writes: 0;
    database_calls: 0;
  };
  external_effects: {
    provider_calls: 0;
    model_calls: 0;
    network_calls: 0;
    github_calls: 0;
    runtime_calls: 0;
  };
  created_review_decision: false;
  created_state_transition_receipt: false;
  created_task_context_packet: false;
  created_semantic_state: false;
  activated_policy: false;
}

export interface OperationalFrictionProposalAdmissionIdentityV01 {
  workspace_id: string;
  project_id: string;
  materialization_version:
    typeof OPERATIONAL_FRICTION_PROPOSAL_MATERIALIZATION_VERSION_V01;
  materialization_id: string;
  source_bundle_id: string;
  source_bundle_fingerprint: string;
  profile_id: string;
  profile_fingerprint: string;
  proposal_id: string;
  proposal_fingerprint: string;
  idempotency_key: string;
}

export interface OperationalFrictionProposalAdmissionIdentityValidationV01 {
  status: "valid" | "invalid";
  errors: string[];
}

type CandidateRuleV01 = {
  delta_family: OperationalFrictionCandidateBindingV01["delta_family"];
  operation_domain: OperationalFrictionOperationDomainV01;
  target_class: OperationalFrictionTargetClassV01;
  title: string;
  proposed_state_summary: string;
};

/**
 * Pure, deterministic ACGC4A materialization. The input contains exact source
 * objects only; there is deliberately no timestamp, persistence adapter,
 * provider, process, environment, filesystem, network, or admission input.
 */
export function materializeOperationalFrictionProposalV01(
  input: MaterializeOperationalFrictionProposalInputV01,
): MaterializeOperationalFrictionProposalResultV01 {
  assertExactMaterializerInputV01(input);
  const before = canonicalizeProtocolValueV01(input);
  const source = structuredClone(input);
  assertExactOperationalFrictionSourceRelationsV01(source);

  const sourceBundle = buildSourceBundleV01(source);
  const observations = deriveFrictionObservationsV01(source, sourceBundle);
  const candidates = materializeCandidatesV01(
    observations,
    source.dynamics_digest,
    sourceBundle,
  );
  const candidateBindings = candidates.map((candidate) => ({
    candidate_id: candidate.candidate_id,
    candidate_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(candidate),
    ),
    delta_family: candidate.delta_type as OperationalFrictionCandidateBindingV01["delta_family"],
    operation: "unknown" as const,
    operation_domain: candidateRuleForObservationV01(
      observations.find((observation) =>
        candidate.basis_material_ids.includes(observation.observation_id),
      )!,
      source.dynamics_digest,
    ).operation_domain,
    target_class: candidateRuleForObservationV01(
      observations.find((observation) =>
        candidate.basis_material_ids.includes(observation.observation_id),
      )!,
      source.dynamics_digest,
    ).target_class,
    basis_observation_ids: [...candidate.basis_material_ids],
    review_required: true as const,
    proposal_only: true as const,
    activation_owner: null,
    semantic_state_target_present: false as const,
  }));
  const currentness = observations.some(
    (observation) =>
      observation.friction_code === "source_currentness_unknown",
  )
    ? "unknown"
    : source.attribution.rows.some((row) =>
          ["stale", "partial"].includes(row.currentness.status),
        )
      ? "partial"
      : "fresh";
  const profile = buildOperationalFrictionProposalProfileV01({
    profile_kind: "derived_rebuildable_proposal_only_material",
    workspace_id: source.workspace_id,
    project_id: source.project_id,
    created_at: sourceBundle.end_boundary_timestamp,
    source_bundle: sourceBundle,
    derivation_rule_version:
      OPERATIONAL_FRICTION_DERIVATION_RULE_VERSION_V01,
    observations,
    unavailable_lanes: deriveUnavailableLanesV01(source, sourceBundle),
    candidate_bindings: candidateBindings,
    source_coverage:
      source.dynamics_digest.completeness.status === "complete" &&
      source.frames.every(
        (frame) => frame.source_completeness.status === "complete",
      )
        ? "complete"
        : "partial",
    source_currentness: currentness,
    uncertainties: uniqueProtocolStringsV01(
      observations.flatMap((observation) => observation.uncertainties),
    ),
    limitations: uniqueProtocolStringsV01([
      "friction_observation_is_not_causal_diagnosis",
      "proposal_candidate_is_not_accepted_policy",
      "serialized_validation_does_not_reprove_upstream_source_facts",
      "no_operational_activation_owner_exists_in_acgc4a",
    ]),
    proposal_only_status: "proposal_only",
    policy_activation_owner: null,
    serialized_validation_scope:
      "projection_internal_only_upstream_sources_required_for_relation_proof",
  });

  const packetRef = bindingRefV01(
    "task_context_packet",
    source.attribution.later_task_context_packet.packet_id,
    source.attribution.later_task_context_packet.packet_fingerprint,
    null,
    source.attribution.later_task_context_packet.packet_version,
  );
  const receiptRef = bindingRefV01(
    "run_receipt",
    source.attribution.later_task_run_receipt.receipt_id,
    source.attribution.later_task_run_receipt.receipt_fingerprint,
    null,
    source.attribution.later_task_run_receipt.receipt_version,
  );
  const reviewRef = bindingRefV01(
    "context_use_review",
    source.attribution.context_use_review.review_id,
    source.attribution.context_use_review.review_fingerprint,
    sourceBundle.end_boundary_timestamp,
    source.attribution.context_use_review.review_version,
  );
  const sourceRefs = sourceBundleRefsV01(sourceBundle);
  const sourceMaterials = buildSourceMaterialsV01(
    sourceBundle,
    sourceRefs,
    receiptRef,
  );
  const frictionMaterials = buildFrictionMaterialsV01(
    observations,
    sourceMaterials,
    sourceBundle.end_boundary_timestamp,
    receiptRef,
  );
  const proposal = buildEpisodeDeltaProposalV01({
    workspace_id: source.workspace_id,
    project_id: source.project_id,
    created_at: sourceBundle.end_boundary_timestamp,
    status: "pending_review",
    bounded_summary:
      "Source-bound operational friction material for bounded review; no policy, semantic state, or activation is created.",
    task_context_packet_ref: packetRef,
    run_receipt_refs: [receiptRef],
    operational_friction_proposal: profile,
    observations: sourceMaterials,
    attestations: [],
    inferences: frictionMaterials,
    proposed_deltas: candidates,
    conflicts: [],
    missing_information: [],
    uncertainties: observations.map((observation) => ({
      uncertainty_id: `operational-friction-uncertainty:${observation.observation_id.split(":").at(-1)}`,
      bounded_summary: observation.uncertainties.join(" "),
      related_material_ids: [observation.observation_id],
      related_delta_ids: candidateBindings
        .filter((binding) =>
          binding.basis_observation_ids.includes(observation.observation_id),
        )
        .map((binding) => binding.candidate_id),
      source_refs: observation.source_refs,
    })),
    limitations: profile.limitations,
    source_status: {
      coverage: profile.source_coverage,
      currentness: profile.source_currentness,
      as_of:
        profile.source_currentness === "unknown" ? null : profile.created_at,
      review_required: true,
      basis:
        "Exact ACGC1 attribution, ACGC2 shadow projection plus rebuilt paired evaluation, and ACGC3A ordered frame/digest relations.",
      source_refs: [...sourceRefs, packetRef, receiptRef, reviewRef],
    },
    source_refs: [...sourceRefs, packetRef, receiptRef, reviewRef],
    compatibility: {
      source_contracts: uniqueProtocolStringsV01([
        OPERATIONAL_FRICTION_PROPOSAL_PROFILE_VERSION_V01,
        OPERATIONAL_FRICTION_SOURCE_BUNDLE_VERSION_V01,
        OPERATIONAL_FRICTION_DERIVATION_RULE_VERSION_V01,
        CONTEXT_USE_ATTRIBUTION_PROJECTION_VERSION_V01,
        PERSONAL_PERSPECTIVE_SHADOW_PROJECTION_VERSION_V01,
        PERSONAL_PERSPECTIVE_PAIRED_EVALUATION_VERSION_V01,
        CONTINUITY_DYNAMICS_DIGEST_VERSION_V01,
        WORK_CONTINUITY_STATE_FRAME_VERSION_V01,
      ]),
      unmapped_fields: [],
      warnings: [
        "Operational review/admission and policy activation remain outside ACGC4A.",
      ],
      external_refs: [...sourceRefs, packetRef, receiptRef, reviewRef],
    },
  });
  const proposalValidation = validateEpisodeDeltaProposalV01(proposal);
  if (proposalValidation.status !== "valid") {
    throw new Error(
      `operational_friction_proposal_invalid:${proposalValidation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  if (canonicalizeProtocolValueV01(input) !== before) {
    throw new Error("operational_friction_source_input_mutated");
  }
  const admissionIdentity =
    deriveOperationalFrictionProposalAdmissionIdentityV01({
      workspace_id: source.workspace_id,
      project_id: source.project_id,
      proposal,
    });
  return {
    materialization_version: admissionIdentity.materialization_version,
    materialization_id: admissionIdentity.materialization_id,
    future_admission_idempotency_key: admissionIdentity.idempotency_key,
    source_bundle_id: admissionIdentity.source_bundle_id,
    source_bundle_fingerprint: admissionIdentity.source_bundle_fingerprint,
    profile,
    proposal,
    persistence: { reads: 0, writes: 0, database_calls: 0 },
    external_effects: {
      provider_calls: 0,
      model_calls: 0,
      network_calls: 0,
      github_calls: 0,
      runtime_calls: 0,
    },
    created_review_decision: false,
    created_state_transition_receipt: false,
    created_task_context_packet: false,
    created_semantic_state: false,
    activated_policy: false,
  };
}

/**
 * Pure ACGC4B admission identity derivation over exact durable ACGC4A material.
 * It deliberately accepts no caller idempotency key, timestamp, process,
 * environment, persistence, runtime, or activation input.
 */
export function deriveOperationalFrictionProposalAdmissionIdentityV01(input: {
  workspace_id: string;
  project_id: string;
  proposal: EpisodeDeltaProposalV01;
}): OperationalFrictionProposalAdmissionIdentityV01 {
  const proposalValidation = validateEpisodeDeltaProposalV01(input.proposal);
  const profile = input.proposal.operational_friction_proposal;
  if (proposalValidation.status !== "valid" || !profile) {
    throw new Error("operational_friction_admission_proposal_invalid");
  }
  if (
    input.workspace_id !== input.proposal.workspace_id ||
    input.project_id !== input.proposal.project_id ||
    input.workspace_id !== profile.workspace_id ||
    input.project_id !== profile.project_id
  ) {
    throw new Error("operational_friction_admission_scope_mismatch");
  }
  const sha256Fields = [
    profile.source_bundle.bundle_fingerprint,
    profile.integrity.fingerprint,
    input.proposal.integrity.fingerprint,
  ];
  if (sha256Fields.some((value) => !isExactProtocolSha256V01(value))) {
    throw new Error("operational_friction_admission_fingerprint_invalid");
  }
  const identityMaterial = {
    source_bundle_id: profile.source_bundle.bundle_id,
    source_bundle_fingerprint: profile.source_bundle.bundle_fingerprint,
    profile_id: profile.profile_id,
    profile_fingerprint: profile.integrity.fingerprint,
    proposal_id: input.proposal.proposal_id,
    proposal_fingerprint: input.proposal.integrity.fingerprint,
  };
  const identityHash = createProtocolSha256V01(
    canonicalizeProtocolValueV01(identityMaterial),
  );
  const identity: OperationalFrictionProposalAdmissionIdentityV01 = {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    materialization_version:
      OPERATIONAL_FRICTION_PROPOSAL_MATERIALIZATION_VERSION_V01,
    materialization_id: `operational-friction-materialization:${identityHash.slice("sha256:".length, 38)}`,
    ...identityMaterial,
    idempotency_key: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        purpose: "future_acgc4b_admission_identity_only",
        ...identityMaterial,
      }),
    ),
  };
  const validation = validateOperationalFrictionProposalAdmissionIdentityV01(
    identity,
  );
  if (validation.status !== "valid") {
    throw new Error(
      `operational_friction_admission_identity_invalid:${validation.errors.join(",")}`,
    );
  }
  return identity;
}

export function validateOperationalFrictionProposalAdmissionIdentityV01(
  value: unknown,
): OperationalFrictionProposalAdmissionIdentityValidationV01 {
  const errors: string[] = [];
  const add = (code: string) => {
    if (!errors.includes(code)) errors.push(code);
  };
  if (!isProtocolRecordV01(value)) {
    return { status: "invalid", errors: ["identity_shape_invalid"] };
  }
  const expectedKeys = [
    "workspace_id",
    "project_id",
    "materialization_version",
    "materialization_id",
    "source_bundle_id",
    "source_bundle_fingerprint",
    "profile_id",
    "profile_fingerprint",
    "proposal_id",
    "proposal_fingerprint",
    "idempotency_key",
  ].sort(compareProtocolCodeUnitsV01);
  if (
    canonicalizeProtocolValueV01(
      Object.keys(value).sort(compareProtocolCodeUnitsV01),
    ) !==
    canonicalizeProtocolValueV01(expectedKeys)
  ) {
    add("identity_shape_invalid");
  }
  for (const field of [
    "workspace_id",
    "project_id",
    "materialization_id",
    "source_bundle_id",
    "profile_id",
    "proposal_id",
  ] as const) {
    if (
      typeof value[field] !== "string" ||
      value[field].trim() !== value[field] ||
      value[field].length < 1
    ) {
      add(`${field}_invalid`);
    }
  }
  if (
    value.materialization_version !==
    OPERATIONAL_FRICTION_PROPOSAL_MATERIALIZATION_VERSION_V01
  ) {
    add("materialization_version_invalid");
  }
  for (const field of [
    "source_bundle_fingerprint",
    "profile_fingerprint",
    "proposal_fingerprint",
    "idempotency_key",
  ] as const) {
    if (!isExactProtocolSha256V01(value[field])) add(`${field}_invalid`);
  }
  if (errors.length === 0) {
    const identityMaterial = {
      source_bundle_id: value.source_bundle_id,
      source_bundle_fingerprint: value.source_bundle_fingerprint,
      profile_id: value.profile_id,
      profile_fingerprint: value.profile_fingerprint,
      proposal_id: value.proposal_id,
      proposal_fingerprint: value.proposal_fingerprint,
    };
    const identityHash = createProtocolSha256V01(
      canonicalizeProtocolValueV01(identityMaterial),
    );
    if (
      value.materialization_id !==
      `operational-friction-materialization:${identityHash.slice("sha256:".length, 38)}`
    ) {
      add("materialization_id_relation_invalid");
    }
    if (
      value.idempotency_key !==
      createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          purpose: "future_acgc4b_admission_identity_only",
          ...identityMaterial,
        }),
      )
    ) {
      add("idempotency_key_relation_invalid");
    }
  }
  return { status: errors.length === 0 ? "valid" : "invalid", errors };
}

function isExactProtocolSha256V01(value: unknown): value is string {
  return typeof value === "string" && /^sha256:[0-9a-f]{64}$/u.test(value);
}

export function assertExactOperationalFrictionSourceRelationsV01(
  input: MaterializeOperationalFrictionProposalInputV01,
): void {
  const attributionValidation = validateContextUseAttributionProjectionV01(
    input.attribution,
  );
  if (attributionValidation.status !== "valid") {
    throw new Error("operational_friction_attribution_invalid");
  }
  try {
    assertValidPersonalPerspectiveShadowProjectionV01(
      input.context_shadow_projection,
    );
  } catch {
    throw new Error("operational_friction_shadow_projection_invalid");
  }
  try {
    assertValidPersonalPerspectivePairedEvaluationV01(input.paired_evaluation);
  } catch {
    throw new Error("operational_friction_paired_evaluation_invalid");
  }
  try {
    assertValidContinuityDynamicsDigestV01(input.dynamics_digest);
    input.frames.forEach(assertValidWorkContinuityStateFrameV01);
  } catch {
    throw new Error("operational_friction_dynamics_source_invalid");
  }
  const scopeValues = [
    input.attribution,
    input.context_shadow_projection,
    input.paired_evaluation,
    input.dynamics_digest,
    ...input.frames,
  ];
  if (
    !input.workspace_id.trim() ||
    !input.project_id.trim() ||
    scopeValues.some(
      (value) =>
        value.workspace_id !== input.workspace_id ||
        value.project_id !== input.project_id,
    )
  ) {
    throw new Error("operational_friction_workspace_project_mismatch");
  }
  const pairedAttribution =
    input.paired_evaluation.later_context_use_attribution;
  if (
    pairedAttribution.projection_id !== input.attribution.projection_id ||
    pairedAttribution.projection_fingerprint !==
      input.attribution.integrity.fingerprint
  ) {
    throw new Error("operational_friction_paired_attribution_mismatch");
  }
  if (
    pairedAttribution.review_id !== input.attribution.context_use_review.review_id ||
    pairedAttribution.packet.packet_id !==
      input.attribution.later_task_context_packet.packet_id ||
    pairedAttribution.packet.packet_fingerprint !==
      input.attribution.later_task_context_packet.packet_fingerprint ||
    pairedAttribution.packet.packet_version !==
      input.attribution.later_task_context_packet.packet_version
  ) {
    throw new Error("operational_friction_paired_packet_review_mismatch");
  }
  let rebuiltPaired: PersonalPerspectivePairedEvaluationV01;
  try {
    rebuiltPaired = buildPersonalPerspectivePairedEvaluationV01(
      input.context_shadow_projection,
      input.attribution,
    );
  } catch {
    throw new Error(
      "operational_friction_paired_evaluation_source_relation_mismatch",
    );
  }
  if (
    canonicalizeProtocolValueV01(rebuiltPaired) !==
    canonicalizeProtocolValueV01(input.paired_evaluation)
  ) {
    throw new Error(
      "operational_friction_paired_evaluation_source_relation_mismatch",
    );
  }
  if (
    input.frames.length !== input.dynamics_digest.ordered_frames.length ||
    input.frames.length < 1
  ) {
    throw new Error("operational_friction_required_frame_missing");
  }
  for (const [index, frame] of input.frames.entries()) {
    const binding = input.dynamics_digest.ordered_frames[index];
    if (
      !binding ||
      binding.frame_id !== frame.frame_id ||
      binding.frame_fingerprint !== frame.integrity.fingerprint ||
      binding.boundary_kind !== frame.boundary.kind ||
      binding.boundary_timestamp !== frame.boundary.boundary_timestamp
    ) {
      throw new Error("operational_friction_digest_frame_mismatch");
    }
    if (
      index > 0 &&
      Date.parse(input.frames[index - 1]!.boundary.boundary_timestamp) >=
        Date.parse(frame.boundary.boundary_timestamp)
    ) {
      throw new Error("operational_friction_source_chronology_conflict");
    }
    if (frame.boundary.caller_timestamp_used !== false) {
      throw new Error("operational_friction_caller_timestamp_refused");
    }
  }
  const first = input.frames[0]!;
  const current = input.frames.at(-1)!;
  if (
    canonicalizeProtocolValueV01(input.dynamics_digest.start_boundary) !==
      canonicalizeProtocolValueV01(first.boundary) ||
    canonicalizeProtocolValueV01(input.dynamics_digest.end_boundary) !==
      canonicalizeProtocolValueV01(current.boundary)
  ) {
    throw new Error("operational_friction_digest_boundary_mismatch");
  }
  if (
    input.dynamics_digest.window.input_frame_count !== input.frames.length ||
    input.dynamics_digest.window.selected_frame_count !== input.frames.length ||
    input.dynamics_digest.window.truncated_to_bound
  ) {
    throw new Error("operational_friction_complete_digest_frame_set_required");
  }
  const rebuiltDigest = buildContinuityDynamicsDigestV01({
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    frames: input.frames,
    window_kind: input.dynamics_digest.window.kind,
  });
  if (
    canonicalizeProtocolValueV01(rebuiltDigest) !==
    canonicalizeProtocolValueV01(input.dynamics_digest)
  ) {
    throw new Error("operational_friction_dynamics_source_lineage_mismatch");
  }
  const hasBinding = (
    kind: string,
    id: string,
    fingerprint: string,
  ) =>
    current.source_bindings.some(
      (binding) =>
        binding.source_kind === kind &&
        binding.source_id === id &&
        binding.source_fingerprint === fingerprint,
    );
  if (
    !hasBinding(
      "context_use_attribution_projection",
      input.attribution.projection_id,
      input.attribution.integrity.fingerprint,
    ) ||
    !hasBinding(
      "personal_perspective_shadow_projection",
      input.context_shadow_projection.projection_id,
      input.context_shadow_projection.integrity.fingerprint,
    ) ||
    !hasBinding(
      "personal_perspective_paired_evaluation",
      input.paired_evaluation.evaluation_id,
      input.paired_evaluation.integrity.fingerprint,
    )
  ) {
    throw new Error("operational_friction_frame_source_lineage_mismatch");
  }
  for (const dynamics of Object.values(input.dynamics_digest.dynamics)) {
    for (const step of dynamics.step_comparisons) {
      const fromIndex = input.frames.findIndex(
        (frame) => frame.frame_id === step.from_frame_id,
      );
      const toIndex = input.frames.findIndex(
        (frame) => frame.frame_id === step.to_frame_id,
      );
      if (fromIndex < 0 || toIndex !== fromIndex + 1) {
        throw new Error("operational_friction_dynamics_source_lineage_mismatch");
      }
    }
  }
}

/**
 * Source-bound relation proof for already serialized material. Unlike the
 * profile-internal validator, this rebuilds from the exact upstream objects
 * and rejects any resealed observation, unavailable lane, candidate, or
 * profile/proposal relation drift.
 */
export function assertOperationalFrictionMaterialMatchesSourcesV01(
  input: MaterializeOperationalFrictionProposalInputV01,
  profile: OperationalFrictionProposalProfileV01,
  proposal: EpisodeDeltaProposalV01,
): void {
  const rebuilt = materializeOperationalFrictionProposalV01(input);
  if (
    canonicalizeProtocolValueV01(profile) !==
    canonicalizeProtocolValueV01(rebuilt.profile)
  ) {
    throw new Error("operational_friction_resealed_profile_refused");
  }
  if (
    canonicalizeProtocolValueV01(proposal) !==
    canonicalizeProtocolValueV01(rebuilt.proposal)
  ) {
    throw new Error("operational_friction_resealed_proposal_refused");
  }
}

function assertExactMaterializerInputV01(input: unknown): asserts input is MaterializeOperationalFrictionProposalInputV01 {
  if (!isProtocolRecordV01(input)) {
    throw new Error("operational_friction_source_bundle_malformed");
  }
  const allowed = new Set([
    "workspace_id",
    "project_id",
    "attribution",
    "context_shadow_projection",
    "paired_evaluation",
    "dynamics_digest",
    "frames",
  ]);
  if (Object.keys(input).some((key) => !allowed.has(key))) {
    throw new Error("operational_friction_caller_material_refused");
  }
  if (!Array.isArray(input.frames)) {
    throw new Error("operational_friction_required_frame_missing");
  }
}

function buildSourceBundleV01(
  input: MaterializeOperationalFrictionProposalInputV01,
): OperationalFrictionSourceBundleV01 {
  const digest = input.dynamics_digest;
  return normalizeOperationalFrictionSourceBundleV01({
    bundle_version: OPERATIONAL_FRICTION_SOURCE_BUNDLE_VERSION_V01,
    bundle_id: "operational-friction-source-bundle:pending",
    bundle_fingerprint: `sha256:${"0".repeat(64)}`,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    attribution: {
      source_kind: "context_use_attribution_projection",
      source_version: input.attribution.projection_version,
      source_id: input.attribution.projection_id,
      source_fingerprint: input.attribution.integrity.fingerprint,
      source_timestamp: null,
      source_timestamp_basis: "not_serialized_by_source_contract",
    },
    context_shadow_projection: {
      source_kind: "personal_perspective_shadow_projection",
      source_version: input.context_shadow_projection.projection_version,
      source_id: input.context_shadow_projection.projection_id,
      source_fingerprint:
        input.context_shadow_projection.integrity.fingerprint,
      source_timestamp: null,
      source_timestamp_basis: "not_serialized_by_source_contract",
    },
    paired_evaluation: {
      source_kind: "personal_perspective_paired_evaluation",
      source_version: input.paired_evaluation.evaluation_version,
      source_id: input.paired_evaluation.evaluation_id,
      source_fingerprint: input.paired_evaluation.integrity.fingerprint,
      source_timestamp: null,
      source_timestamp_basis: "not_serialized_by_source_contract",
    },
    dynamics_digest: {
      source_kind: "continuity_dynamics_digest",
      source_version: digest.digest_version,
      source_id: digest.digest_id,
      source_fingerprint: digest.integrity.fingerprint,
      source_timestamp: digest.end_boundary.boundary_timestamp,
      source_timestamp_basis: "exact_boundary_timestamp",
    },
    ordered_frames: input.frames.map((frame) => ({
      source_kind: "work_continuity_state_frame",
      source_version: frame.frame_version,
      source_id: frame.frame_id,
      source_fingerprint: frame.integrity.fingerprint,
      source_timestamp: frame.boundary.boundary_timestamp,
      source_timestamp_basis: "exact_boundary_timestamp",
    })),
    packet_review_binding: {
      packet_version: input.attribution.later_task_context_packet.packet_version,
      packet_id: input.attribution.later_task_context_packet.packet_id,
      packet_fingerprint:
        input.attribution.later_task_context_packet.packet_fingerprint,
      review_version: input.attribution.context_use_review.review_version,
      review_id: input.attribution.context_use_review.review_id,
      review_fingerprint:
        input.attribution.context_use_review.review_fingerprint,
    },
    start_boundary_timestamp: digest.start_boundary.boundary_timestamp,
    end_boundary_timestamp: digest.end_boundary.boundary_timestamp,
    chronology: "exact_digest_order_no_interpolation",
    caller_timestamp_used: false,
  });
}

function deriveFrictionObservationsV01(
  input: MaterializeOperationalFrictionProposalInputV01,
  bundle: OperationalFrictionSourceBundleV01,
): OperationalFrictionObservationV01[] {
  const observations: OperationalFrictionObservationV01[] = [];
  const attributionRef = createOperationalFrictionSourceExternalRefV01(
    bundle.attribution,
  );
  const shadowRef = createOperationalFrictionSourceExternalRefV01(
    bundle.context_shadow_projection,
  );
  const pairedRef = createOperationalFrictionSourceExternalRefV01(
    bundle.paired_evaluation,
  );
  const digestRef = createOperationalFrictionSourceExternalRefV01(
    bundle.dynamics_digest,
  );
  const currentFrame = input.frames.at(-1)!;
  const currentFrameRef = createOperationalFrictionSourceExternalRefV01(
    bundle.ordered_frames.at(-1)!,
  );
  const criticalRows = input.paired_evaluation.rows.filter(
    (row) => row.critical_omission_candidate === true,
  );
  if (criticalRows.length > 0) {
    observations.push(
      observationV01({
        friction_code: "critical_context_omission_candidate",
        scope: "paired_evaluation_basis_set",
        operation_domain: "context_validation",
        epistemic_status: "bounded_non_causal_candidate",
        derivation_rule_id:
          "critical_omission_candidate_to_bounded_validation_delta.v0.1",
        source_refs: [attributionRef, shadowRef, pairedRef],
        attribution_row_ids: criticalRows.map((row) => row.entry_id),
        paired_evaluation_entry_ids: criticalRows.map((row) => row.entry_id),
        frame_ids: [currentFrame.frame_id],
        digest_refs: [digestRef],
        exact_count: criticalRows.length,
        exact_count_basis:
          "PersonalPerspectivePairedEvaluation rows with critical_omission_candidate=true.",
        uncertainties: [
          "The candidate does not prove omission harm or that the shadow policy was worse.",
        ],
        limitations: [
          "non_causal_candidate_only",
          "no_direct_context_ranking_or_policy_activation",
        ],
      }),
    );
  }
  const unknownRows = input.attribution.rows.filter(
    (row) => row.currentness.status === "unknown",
  );
  if (unknownRows.length > 0) {
    observations.push(
      observationV01({
        friction_code: "source_currentness_unknown",
        scope: "attribution_rows",
        operation_domain: "source_currentness_validation",
        epistemic_status: "exact_source_observation",
        derivation_rule_id:
          "unknown_currentness_to_bounded_revalidation.v0.1",
        source_refs: uniqueRefsV01([
          attributionRef,
          ...unknownRows.flatMap(rowRefsV01),
        ]),
        attribution_row_ids: unknownRows.map((row) => row.entry_id),
        paired_evaluation_entry_ids: [],
        frame_ids: [currentFrame.frame_id],
        digest_refs: [digestRef],
        exact_count: unknownRows.length,
        exact_count_basis:
          "Exact attribution rows whose currentness status is unknown.",
        uncertainties: ["Unknown currentness is not stale currentness."],
        limitations: [
          "no_source_removal_retraction_demotion_or_blacklist",
          "affected_source_refs_preserved",
        ],
      }),
    );
  }
  const verification =
    currentFrame.dimensions.verification_resolution.observation;
  if (verification && verification.unresolved_required_check_count > 0) {
    observations.push(
      observationV01({
        friction_code: "verification_preparation_missing",
        scope: "current_end_frame",
        operation_domain: "verification_preparation",
        epistemic_status: "exact_source_observation",
        derivation_rule_id:
          "unresolved_required_checks_to_verification_plan_delta.v0.1",
        source_refs: [currentFrameRef, digestRef],
        attribution_row_ids: [],
        paired_evaluation_entry_ids: [],
        frame_ids: [currentFrame.frame_id],
        digest_refs: [digestRef],
        exact_count: verification.unresolved_required_check_count,
        exact_count_basis: `failed=${verification.failed_count};blocked=${verification.blocked_count};skipped=${verification.skipped_count};unknown=${verification.unknown_count}`,
        uncertainties: [
          "The exact unresolved count does not establish check order or task failure causality.",
        ],
        limitations: ["proposal_only_verification_preparation_hypothesis"],
      }),
    );
  }
  const blockingStatus = input.dynamics_digest.dynamics.blocking_friction.status;
  const blockingObservation = currentFrame.dimensions.blocking_friction.observation;
  if (
    ["diverging", "stalled", "volatile"].includes(blockingStatus) &&
    input.dynamics_digest.dynamics.blocking_friction.completeness.status ===
      "complete" &&
    blockingObservation &&
    blockingObservation.unresolved_count > 0
  ) {
    observations.push(
      observationV01({
        friction_code: "blocking_friction_non_converging",
        scope: "bounded_dynamics_window",
        operation_domain: "continuity_friction_validation",
        epistemic_status: "exact_source_observation",
        derivation_rule_id: `blocking_friction_${blockingStatus}_candidate_mapping.v0.1`,
        source_refs: [digestRef, currentFrameRef],
        attribution_row_ids: [],
        paired_evaluation_entry_ids: [],
        frame_ids: input.frames.map((frame) => frame.frame_id),
        digest_refs: [digestRef],
        exact_count: blockingObservation.unresolved_count,
        exact_count_basis: `ContinuityDynamicsDigest blocking_friction status=${blockingStatus}.`,
        uncertainties: [
          "The bounded temporal association is not a causal diagnosis or success forecast.",
        ],
        limitations: [
          "no_global_health_conclusion",
          "current_only_and_insufficient_are_not_non_converging_evidence",
        ],
      }),
    );
  }
  const correctionCount =
    currentFrame.dimensions.review_decision_burden.observation
      ?.wrong_context_correction_count ?? null;
  if (correctionCount !== null && correctionCount > 0) {
    observations.push(
      observationV01({
        friction_code: "wrong_context_correction_observed",
        scope: "current_end_frame",
        operation_domain: "context_correction_preparation",
        epistemic_status: "exact_source_observation",
        derivation_rule_id:
          "positive_wrong_context_correction_to_agent_plan_delta.v0.1",
        source_refs: [currentFrameRef, digestRef],
        attribution_row_ids: [],
        paired_evaluation_entry_ids: [],
        frame_ids: [currentFrame.frame_id],
        digest_refs: [digestRef],
        exact_count: correctionCount,
        exact_count_basis:
          "Exact non-null positive wrong_context_correction_count in the current/end frame.",
        uncertainties: [
          "The episode count cannot be attributed to every selected context item.",
        ],
        limitations: ["no_item_level_credit_or_blame"],
      }),
    );
  }
  const assessment = input.attribution.episode_review_context.assessment;
  if (["stale", "misleading", "missing", "noisy"].includes(assessment)) {
    observations.push(
      observationV01({
        friction_code: `packet_level_review_${assessment}` as OperationalFrictionCodeV01,
        scope: "packet_level_episode_review_only",
        operation_domain: "packet_review_validation",
        epistemic_status: "exact_source_observation",
        derivation_rule_id: `packet_level_${assessment}_review_candidate_mapping.v0.1`,
        source_refs: [attributionRef],
        attribution_row_ids: [],
        paired_evaluation_entry_ids: [],
        frame_ids: [currentFrame.frame_id],
        digest_refs: [digestRef],
        exact_count: null,
        exact_count_basis: null,
        uncertainties: [
          "The packet-level assessment is not item-level helpfulness, harm, credit, or blame.",
        ],
        limitations: [
          "packet_level_scope_preserved",
          "no_memory_or_perspective_delta",
        ],
      }),
    );
  }
  return observations.sort(compareProtocolCanonicalV01);
}

function observationV01(
  input: Omit<
    OperationalFrictionObservationV01,
    | "observation_id"
    | "derivation_rule_version"
    | "causal_contribution"
    | "item_level_credit_or_blame"
  >,
): OperationalFrictionObservationV01 {
  const observation: OperationalFrictionObservationV01 = {
    observation_id: "operational-friction-observation:pending",
    ...input,
    source_refs: uniqueRefsV01(input.source_refs),
    attribution_row_ids: uniqueProtocolStringsV01(input.attribution_row_ids),
    paired_evaluation_entry_ids: uniqueProtocolStringsV01(
      input.paired_evaluation_entry_ids,
    ),
    frame_ids: uniqueProtocolStringsV01(input.frame_ids),
    digest_refs: uniqueRefsV01(input.digest_refs),
    derivation_rule_version:
      OPERATIONAL_FRICTION_DERIVATION_RULE_VERSION_V01,
    causal_contribution: false,
    item_level_credit_or_blame: false,
    uncertainties: uniqueProtocolStringsV01(input.uncertainties),
    limitations: uniqueProtocolStringsV01(input.limitations),
  };
  observation.observation_id =
    deriveOperationalFrictionObservationIdV01(observation);
  return observation;
}

function materializeCandidatesV01(
  observations: OperationalFrictionObservationV01[],
  digest: ContinuityDynamicsDigestV01,
  sourceBundle: OperationalFrictionSourceBundleV01,
): EpisodeDeltaProposalDeltaCandidateV01[] {
  const groups = new Map<
    string,
    {
      rule: CandidateRuleV01;
      observations: OperationalFrictionObservationV01[];
    }
  >();
  for (const observation of observations) {
    const rule = candidateRuleForObservationV01(observation, digest);
    const key = [
      observation.friction_code,
      observation.scope,
      rule.operation_domain,
      rule.delta_family,
    ].join("|");
    const existing = groups.get(key);
    if (existing) existing.observations.push(observation);
    else groups.set(key, { rule, observations: [observation] });
  }
  return [...groups.values()]
    .map(({ rule, observations: basis }) => {
      const basisIds = uniqueProtocolStringsV01(
        basis.map((observation) => observation.observation_id),
      );
      const sourceRefs = uniqueRefsV01(
        basis.flatMap((observation) => observation.source_refs),
      );
      const targetIdentity = createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          source_bundle_fingerprint: sourceBundle.bundle_fingerprint,
          operation_domain: rule.operation_domain,
          target_class: rule.target_class,
          basis_observation_ids: basisIds,
        }),
      );
      const operationalTargetRef = normalizeExternalRefPrimitiveV01({
        ref_version: "external_ref.v0.1",
        ref_type: "operational_friction_target",
        external_id: `operational-friction-target:${targetIdentity.slice("sha256:".length, 38)}`,
        observed_at: sourceBundle.end_boundary_timestamp,
        source_ref: sourceBundle.bundle_fingerprint,
        compatibility_namespace: `${rule.operation_domain}:${rule.target_class}`,
        trust_class: "derived_interpretation",
      });
      const candidateIdentity = createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          derivation_rule_version:
            OPERATIONAL_FRICTION_DERIVATION_RULE_VERSION_V01,
          friction_codes: uniqueProtocolStringsV01(
            basis.map((observation) => observation.friction_code),
          ),
          scopes: uniqueProtocolStringsV01(
            basis.map((observation) => observation.scope),
          ),
          delta_family: rule.delta_family,
          operation_domain: rule.operation_domain,
          target_class: rule.target_class,
          basis_observation_ids: basisIds,
          source_refs: sourceRefs,
          operational_target_ref: operationalTargetRef,
        }),
      );
      return {
        candidate_id: `operational-friction-candidate:${candidateIdentity.slice("sha256:".length, 38)}`,
        delta_type: rule.delta_family,
        operation: "unknown",
        title: rule.title,
        current_state: {
          knowledge_status: "known",
          bounded_summary:
            "Exact bounded friction source material is present; no semantic state target is asserted.",
          source_material_ids: basisIds,
          source_refs: sourceRefs,
        },
        proposed_state_summary: rule.proposed_state_summary,
        target_refs: [operationalTargetRef],
        basis_material_ids: basisIds,
        source_refs: sourceRefs,
        uncertainties: uniqueProtocolStringsV01(
          basis.flatMap((observation) => observation.uncertainties),
        ),
        limitations: uniqueProtocolStringsV01([
          ...basis.flatMap((observation) => observation.limitations),
          "proposal_only_no_activation_owner",
          "operation_unknown_non_transitionable",
        ]),
        review_required: true,
      } satisfies EpisodeDeltaProposalDeltaCandidateV01;
    })
    .sort(compareProtocolCanonicalV01);
}

function candidateRuleForObservationV01(
  observation: OperationalFrictionObservationV01,
  digest?: ContinuityDynamicsDigestV01,
): CandidateRuleV01 {
  switch (observation.friction_code) {
    case "critical_context_omission_candidate":
      return {
        delta_family: "validation_delta",
        operation_domain: "context_validation",
        target_class: "bounded_validation_hypothesis",
        title: "Validate the exact critical-omission candidate basis",
        proposed_state_summary:
          "Review a bounded validation or falsification exercise for the exact non-causal basis set.",
      };
    case "source_currentness_unknown":
      return {
        delta_family: "validation_delta",
        operation_domain: "source_currentness_validation",
        target_class: "bounded_validation_hypothesis",
        title: "Revalidate exact sources with unknown currentness",
        proposed_state_summary:
          "Review bounded source retrieval or revalidation without removing, demoting, or blacklisting the source.",
      };
    case "verification_preparation_missing":
      return {
        delta_family: "agent_plan_delta",
        operation_domain: "verification_preparation",
        target_class: "bounded_agent_plan_hypothesis",
        title: "Prepare unresolved required verification",
        proposed_state_summary:
          "Review a bounded verification preparation and ordering hypothesis for the exact unresolved checks.",
      };
    case "blocking_friction_non_converging": {
      const status = digest?.dynamics.blocking_friction.status;
      return status === "stalled"
        ? {
            delta_family: "agent_plan_delta",
            operation_domain: "continuity_friction_validation",
            target_class: "bounded_agent_plan_hypothesis",
            title: "Review a bounded response to stalled blocking friction",
            proposed_state_summary:
              "Review one bounded agent-plan hypothesis without causal diagnosis or success forecast.",
          }
        : {
            delta_family: "validation_delta",
            operation_domain: "continuity_friction_validation",
            target_class: "bounded_validation_hypothesis",
            title: "Validate non-converging blocking friction",
            proposed_state_summary:
              "Review one bounded validation hypothesis for the exact diverging or volatile temporal association.",
          };
    }
    case "wrong_context_correction_observed":
      return {
        delta_family: "agent_plan_delta",
        operation_domain: "context_correction_preparation",
        target_class: "bounded_agent_plan_hypothesis",
        title: "Prepare a bounded wrong-context correction check",
        proposed_state_summary:
          "Review an agent-plan hypothesis for the exact observed correction count without item-level blame.",
      };
    case "packet_level_review_missing":
      return {
        delta_family: "research_delta",
        operation_domain: "packet_review_validation",
        target_class: "bounded_research_hypothesis",
        title: "Research missing packet-level review context",
        proposed_state_summary:
          "Review bounded retrieval or validation of missing packet-level context without item-level attribution.",
      };
    case "packet_level_review_stale":
    case "packet_level_review_misleading":
    case "packet_level_review_noisy":
      return {
        delta_family: "validation_delta",
        operation_domain: "packet_review_validation",
        target_class: "bounded_validation_hypothesis",
        title: "Validate packet-level review friction",
        proposed_state_summary:
          "Review bounded packet-level validation without semantic retraction, promotion, or item-level smear.",
      };
  }
}

function deriveUnavailableLanesV01(
  input: MaterializeOperationalFrictionProposalInputV01,
  bundle: OperationalFrictionSourceBundleV01,
): OperationalFrictionUnavailableLaneV01[] {
  const currentFrame = input.frames.at(-1)!;
  const frameRef = createOperationalFrictionSourceExternalRefV01(
    bundle.ordered_frames.at(-1)!,
  );
  const digestRef = createOperationalFrictionSourceExternalRefV01(
    bundle.dynamics_digest,
  );
  return OPERATIONAL_FRICTION_UNAVAILABLE_LANES_V01.map((lane) => {
    const repeatedKnown =
      lane === "repeated_explanation" &&
      currentFrame.dimensions.review_decision_burden.observation
        ?.repeated_explanation_estimate !== null;
    return {
      lane_code: lane,
      status: repeatedKnown ? "unsupported" : "unavailable",
      source_refs: [frameRef, digestRef],
      basis:
        lane === "cost_operability_direction"
          ? "ACGC3A cost_operability uses no_comparable_basis_v0.1 and serializes no directional observation."
          : repeatedKnown
            ? "The source count exists, but ACGC4A v0.1 defines no reviewed deterministic candidate rule for this lane."
            : "The exact current ACGC1, ACGC2, and ACGC3A source bundle does not independently prove this lane.",
      false_zero_emitted: false,
    } satisfies OperationalFrictionUnavailableLaneV01;
  });
}

function buildSourceMaterialsV01(
  bundle: OperationalFrictionSourceBundleV01,
  sourceRefs: ExternalRefV01[],
  receiptRef: ExternalRefV01,
): EpisodeDeltaProposalObservationV01[] {
  return sourceRefs.map((ref) => ({
    material_id: `operational-friction-source:${createProtocolSha256V01(canonicalizeProtocolValueV01(ref)).slice("sha256:".length, 38)}`,
    material_kind: SOURCE_MATERIAL_KIND,
    bounded_summary: `Exact source binding: ${ref.ref_type}.`,
    event_at: ref.observed_at ?? null,
    observed_at: bundle.end_boundary_timestamp,
    observer_ref: MATERIALIZER_REF,
    trust_class: "direct_local_observation",
    source_run_receipt_refs: [receiptRef],
    source_refs: [ref],
    subject_refs: [ref],
  }));
}

function buildFrictionMaterialsV01(
  observations: OperationalFrictionObservationV01[],
  sourceMaterials: EpisodeDeltaProposalObservationV01[],
  createdAt: string,
  receiptRef: ExternalRefV01,
): EpisodeDeltaProposalInferenceV01[] {
  return observations.map((observation) => ({
    material_id: observation.observation_id,
    material_kind: FRICTION_MATERIAL_KIND,
    bounded_summary: `Derived ${observation.friction_code} under ${observation.derivation_rule_id}; causal contribution and item-level credit or blame remain false.`,
    inferred_at: createdAt,
    interpreter_ref: MATERIALIZER_INTERPRETER_REF,
    trust_class: "derived_interpretation",
    basis_material_ids: sourceMaterials
      .filter((material) =>
        observation.source_refs.some((ref) =>
          material.source_refs.some(
            (candidate) =>
              canonicalizeProtocolValueV01(candidate) ===
              canonicalizeProtocolValueV01(ref),
          ),
        ),
      )
      .map((material) => material.material_id),
    source_run_receipt_refs: [receiptRef],
    source_refs: observation.source_refs,
    subject_refs: observation.source_refs,
  }));
}

function sourceBundleRefsV01(
  bundle: OperationalFrictionSourceBundleV01,
): ExternalRefV01[] {
  return uniqueRefsV01(
    [
      bundle.attribution,
      bundle.context_shadow_projection,
      bundle.paired_evaluation,
      bundle.dynamics_digest,
      ...bundle.ordered_frames,
    ].map(createOperationalFrictionSourceExternalRefV01),
  );
}

function rowRefsV01(
  row: ContextUseAttributionProjectionV01["rows"][number],
): ExternalRefV01[] {
  const refs = [
    row.external_ref,
    row.compatibility_source_ref,
    row.currentness.source_ref,
  ].filter((ref): ref is ExternalRefV01 => ref !== null);
  refs.push(
    bindingRefV01(
      "context_use_attribution_row",
      row.entry_id,
      createProtocolSha256V01(canonicalizeProtocolValueV01(row)),
      row.currentness.as_of,
      "context_use_attribution_row.v0.1",
    ),
  );
  return refs;
}

function bindingRefV01(
  refType: string,
  externalId: string,
  fingerprint: string,
  observedAt: string | null,
  namespace: string,
): ExternalRefV01 {
  return normalizeExternalRefPrimitiveV01({
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: observedAt,
    source_ref: fingerprint,
    compatibility_namespace: namespace,
    trust_class: "direct_local_observation",
  });
}

function uniqueRefsV01(refs: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(refs).sort(compareExternalRefsV01);
}
