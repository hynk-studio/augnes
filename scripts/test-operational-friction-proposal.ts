import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildOperationalFrictionSourceFixtureV01 } from "@/fixtures/vnext/research/operational-friction-proposal-v0-1";
import {
  assertValidPersonalPerspectivePairedEvaluationV01,
  createPersonalPerspectivePairedEvaluationFingerprintV01,
  derivePersonalPerspectivePairedEvaluationIdV01,
} from "@/lib/vnext/context-shadow-navigation";
import {
  assertValidContinuityDynamicsDigestV01,
  assertValidWorkContinuityStateFrameV01,
  buildContinuityDynamicsDigestV01,
  createContinuityDynamicsDigestFingerprintV01,
  createWorkContinuityStateFrameFingerprintV01,
  deriveContinuityDynamicsDigestIdV01,
  deriveWorkContinuityStateFrameIdV01,
} from "@/lib/vnext/continuity-dynamics";
import {
  createEpisodeDeltaProposalFingerprintV01,
  deriveEpisodeDeltaProposalIdV01,
  validateEpisodeDeltaProposalV01,
} from "@/lib/vnext/episode-delta-proposal";
import {
  assertExactOperationalFrictionSourceRelationsV01,
  assertOperationalFrictionMaterialMatchesSourcesV01,
  materializeOperationalFrictionProposalV01,
  type MaterializeOperationalFrictionProposalInputV01,
} from "@/lib/vnext/operational-friction-proposal";
import {
  buildOperationalFrictionProposalProfileV01,
  createOperationalFrictionProposalProfileFingerprintV01,
  createOperationalFrictionSourceBundleFingerprintV01,
  deriveOperationalFrictionObservationIdV01,
  deriveOperationalFrictionProposalProfileIdV01,
  deriveOperationalFrictionSourceBundleIdV01,
  validateOperationalFrictionProposalProfileV01,
} from "@/lib/vnext/operational-friction-proposal-profile";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "@/lib/vnext/review-decision";
import {
  evaluateReviewDecisionStateTransitionEligibilityV01,
  mapEpisodeDeltaCandidateOperationToTransitionOperationV01,
} from "@/lib/vnext/state-transition-eligibility";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { OperationalFrictionProposalProfileV01 } from "@/types/vnext/operational-friction-proposal";

const originalFetch = globalThis.fetch;
let fetchCalls = 0;
globalThis.fetch = (async () => {
  fetchCalls += 1;
  throw new Error("operational friction materialization must not call fetch");
}) as typeof fetch;

try {
  const source = buildOperationalFrictionSourceFixtureV01();
  const sourceBefore = canonicalizeProtocolValueV01(source);
  const frozenSource = deepFreeze(clone(source));
  const result = materializeOperationalFrictionProposalV01(frozenSource);
  assert.equal(canonicalizeProtocolValueV01(frozenSource), sourceBefore);
  assertOperationalFrictionMaterialMatchesSourcesV01(
    source,
    result.profile,
    result.proposal,
  );
  assert.equal(
    validateOperationalFrictionProposalProfileV01(result.profile).status,
    "valid",
  );
  assert.equal(validateEpisodeDeltaProposalV01(result.proposal).status, "valid");
  assert.deepEqual(materializeOperationalFrictionProposalV01(clone(source)), result);
  assert.equal(result.proposal.created_at, source.dynamics_digest.end_boundary.boundary_timestamp);
  assert.equal(result.profile.created_at, result.proposal.created_at);
  assert.equal(result.profile.source_bundle.caller_timestamp_used, false);
  assert.deepEqual(result.profile.source_bundle.context_shadow_projection, {
    source_kind: "personal_perspective_shadow_projection",
    source_version: source.context_shadow_projection.projection_version,
    source_id: source.context_shadow_projection.projection_id,
    source_fingerprint:
      source.context_shadow_projection.integrity.fingerprint,
    source_timestamp: null,
    source_timestamp_basis: "not_serialized_by_source_contract",
  });
  assert.equal(result.profile.source_bundle.ordered_frames.length, source.frames.length);
  assert.deepEqual(
    result.profile.source_bundle.ordered_frames.map((frame) => [
      frame.source_id,
      frame.source_fingerprint,
      frame.source_timestamp,
    ]),
    source.frames.map((frame) => [
      frame.frame_id,
      frame.integrity.fingerprint,
      frame.boundary.boundary_timestamp,
    ]),
  );

  const expectedCodes = [
    "blocking_friction_non_converging",
    "critical_context_omission_candidate",
    "packet_level_review_stale",
    "source_currentness_unknown",
    "verification_preparation_missing",
    "wrong_context_correction_observed",
  ];
  assert.deepEqual(
    result.profile.observations.map((observation) => observation.friction_code).sort(),
    expectedCodes,
  );
  assert.equal(result.profile.observations.length, 6);
  assert.equal(result.profile.candidate_bindings.length, 6);
  assert.deepEqual(candidateDistributionV01(result.profile), {
    agent_plan_delta: 2,
    research_delta: 0,
    validation_delta: 4,
  });
  assert.equal(
    result.profile.candidate_bindings.every(
      (candidate) =>
        candidate.operation === "unknown" &&
        candidate.review_required &&
        candidate.proposal_only &&
        candidate.activation_owner === null &&
        !candidate.semantic_state_target_present,
    ),
    true,
  );
  assert.equal(
    result.proposal.proposed_deltas.every(
      (candidate) =>
        candidate.operation === "unknown" &&
        candidate.review_required &&
        candidate.target_refs.length === 1 &&
        candidate.target_refs[0]?.ref_type === "operational_friction_target",
    ),
    true,
  );
  assertAllFalseAuthorityV01(result.profile.authority_summary, ["proposal_only"]);
  assertAllFalseAuthorityV01(result.proposal.authority_summary);
  assert.equal(result.profile.authority_summary.proposal_only, true);
  assert.equal(result.profile.policy_activation_owner, null);
  assert.equal(result.profile.authority_summary.semantic_transition_eligible, false);

  const critical = observationV01(result.profile, "critical_context_omission_candidate");
  assert.equal(critical.epistemic_status, "bounded_non_causal_candidate");
  assert.equal(critical.causal_contribution, false);
  assert.equal(critical.item_level_credit_or_blame, false);
  assert.ok(critical.exact_count && critical.exact_count > 0);
  assert.ok(critical.paired_evaluation_entry_ids.length > 0);
  assert.ok(critical.attribution_row_ids.length > 0);
  assert.ok(critical.attribution_row_ids.length < source.attribution.rows.length);
  assert.doesNotMatch(JSON.stringify(critical), /omission_harm/u);

  const currentness = observationV01(result.profile, "source_currentness_unknown");
  assert.ok(currentness.exact_count && currentness.exact_count > 0);
  assert.ok(currentness.attribution_row_ids.length > 0);
  const currentnessCandidate = result.profile.candidate_bindings.find((binding) =>
    binding.basis_observation_ids.includes(currentness.observation_id),
  )!;
  assert.equal(currentnessCandidate.delta_family, "validation_delta");
  assert.equal(currentnessCandidate.operation, "unknown");

  const verification = observationV01(result.profile, "verification_preparation_missing");
  assert.equal(
    verification.exact_count,
    source.frames.at(-1)!.dimensions.verification_resolution.observation!
      .unresolved_required_check_count,
  );
  assert.match(verification.exact_count_basis!, /failed=3/u);

  const blocking = observationV01(result.profile, "blocking_friction_non_converging");
  assert.equal(source.dynamics_digest.dynamics.blocking_friction.status, "diverging");
  assert.equal(blocking.causal_contribution, false);
  assert.ok(blocking.limitations.includes("no_global_health_conclusion"));

  const correction = observationV01(result.profile, "wrong_context_correction_observed");
  assert.equal(correction.exact_count, 2);
  assert.equal(correction.item_level_credit_or_blame, false);

  const packet = observationV01(result.profile, "packet_level_review_stale");
  assert.equal(packet.scope, "packet_level_episode_review_only");
  assert.deepEqual(packet.attribution_row_ids, []);
  assert.deepEqual(packet.paired_evaluation_entry_ids, []);
  assert.equal(packet.exact_count, null);

  assert.deepEqual(
    result.profile.unavailable_lanes.map((lane) => lane.lane_code).sort(),
    [
      "causal_contribution",
      "cost_operability_direction",
      "excessive_review_burden",
      "item_level_harm",
      "item_level_helpfulness",
      "model_provider_superiority",
      "policy_benefit",
      "repeated_explanation",
      "task_granularity_mismatch",
      "tool_surface_mismatch",
    ],
  );
  assert.equal(
    result.profile.unavailable_lanes.every((lane) => !lane.false_zero_emitted),
    true,
  );
  assert.equal(
    laneV01(result.profile, "repeated_explanation").status,
    "unavailable",
  );
  assert.equal(
    laneV01(result.profile, "cost_operability_direction").status,
    "unavailable",
  );

  for (const assessment of ["stale", "misleading", "missing", "noisy"] as const) {
    const assessmentResult = materializeOperationalFrictionProposalV01(
      buildOperationalFrictionSourceFixtureV01({ assessment }),
    );
    const code = `packet_level_review_${assessment}`;
    const observation = assessmentResult.profile.observations.find(
      (item) => item.friction_code === code,
    );
    assert.ok(observation, code);
    const binding = assessmentResult.profile.candidate_bindings.find((item) =>
      item.basis_observation_ids.includes(observation.observation_id),
    );
    assert.ok(binding, code);
    assert.equal(
      binding.delta_family,
      assessment === "missing" ? "research_delta" : "validation_delta",
    );
  }

  for (const [status, unresolved, expectedFamily] of [
    ["diverging", [1, 2, 3], "validation_delta"],
    ["stalled", [2, 2, 2], "agent_plan_delta"],
    ["volatile", [3, 1, 2], "validation_delta"],
  ] as const) {
    const dynamicsResult = materializeOperationalFrictionProposalV01(
      buildOperationalFrictionSourceFixtureV01({
        unresolved_counts: unresolved,
      }),
    );
    assert.equal(
      dynamicsResult.profile.observations.some(
        (item) => item.friction_code === "blocking_friction_non_converging",
      ),
      true,
      status,
    );
    const dynamicsObservation = observationV01(
      dynamicsResult.profile,
      "blocking_friction_non_converging",
    );
    assert.equal(
      dynamicsResult.profile.candidate_bindings.find((binding) =>
        binding.basis_observation_ids.includes(
          dynamicsObservation.observation_id,
        ),
      )?.delta_family,
      expectedFamily,
      status,
    );
  }

  const currentOnly = buildOperationalFrictionSourceFixtureV01();
  currentOnly.frames = [currentOnly.frames.at(-1)!];
  currentOnly.dynamics_digest = buildContinuityDynamicsDigestV01({
    workspace_id: currentOnly.workspace_id,
    project_id: currentOnly.project_id,
    frames: currentOnly.frames,
    window_kind: "current_only",
  });
  const currentOnlyResult = materializeOperationalFrictionProposalV01(currentOnly);
  assert.equal(
    currentOnlyResult.profile.observations.some(
      (item) => item.friction_code === "blocking_friction_non_converging",
    ),
    false,
  );
  const noCorrection = materializeOperationalFrictionProposalV01(
    buildOperationalFrictionSourceFixtureV01({
      unresolved_counts: [0, 0, 0],
      wrong_context_correction_count: null,
    }),
  );
  assert.equal(
    noCorrection.profile.observations.some(
      (item) => item.friction_code === "wrong_context_correction_observed",
    ),
    false,
  );

  assertSourceRelationFailuresV01(source);
  assertEpistemicAndCandidateFailuresV01(source, result.profile, result.proposal);
  assertIntegrityAndCompatibilityV01(source, result.profile, result.proposal);
  assertReviewAndTransitionNegativeV01(result.proposal);
  assertSourcePurityV01();

  assert.equal(result.persistence.reads, 0);
  assert.equal(result.persistence.writes, 0);
  assert.equal(result.persistence.database_calls, 0);
  assert.deepEqual(result.external_effects, {
    provider_calls: 0,
    model_calls: 0,
    network_calls: 0,
    github_calls: 0,
    runtime_calls: 0,
  });
  assert.equal(result.created_review_decision, false);
  assert.equal(result.created_state_transition_receipt, false);
  assert.equal(result.created_task_context_packet, false);
  assert.equal(result.created_semantic_state, false);
  assert.equal(result.activated_policy, false);
  assert.equal(fetchCalls, 0);

  console.log(
    JSON.stringify(
      {
        suite: "operational-friction-proposal-v0.1",
        status: "passed",
        materialization_id: result.materialization_id,
        source_bundle_id: result.source_bundle_id,
        source_bundle_fingerprint: result.source_bundle_fingerprint,
        profile_id: result.profile.profile_id,
        profile_fingerprint: result.profile.integrity.fingerprint,
        proposal_id: result.proposal.proposal_id,
        proposal_fingerprint: result.proposal.integrity.fingerprint,
        observation_counts_by_code: Object.fromEntries(
          result.profile.observations.map((observation) => [
            observation.friction_code,
            1,
          ]),
        ),
        unavailable_lanes: result.profile.unavailable_lanes.map(
          (lane) => lane.lane_code,
        ),
        candidate_count: result.profile.candidate_bindings.length,
        candidate_distribution: candidateDistributionV01(result.profile),
        source_purity: "passed",
        zero_effects: "passed",
        real_provider_calls: 0,
      },
      null,
      2,
    ),
  );
} finally {
  globalThis.fetch = originalFetch;
}

function assertSourceRelationFailuresV01(
  source: MaterializeOperationalFrictionProposalInputV01,
): void {
  const crossWorkspace = clone(source);
  crossWorkspace.workspace_id = "workspace:foreign";
  assert.throws(
    () => materializeOperationalFrictionProposalV01(crossWorkspace),
    /operational_friction_workspace_project_mismatch/u,
  );
  const crossProject = clone(source);
  crossProject.project_id = "project:foreign";
  assert.throws(
    () => materializeOperationalFrictionProposalV01(crossProject),
    /operational_friction_workspace_project_mismatch/u,
  );

  const attributionIdMismatch = clone(source);
  attributionIdMismatch.paired_evaluation.later_context_use_attribution.projection_id =
    "context-use-attribution:substituted";
  resignPairedV01(attributionIdMismatch.paired_evaluation);
  assert.throws(
    () => materializeOperationalFrictionProposalV01(attributionIdMismatch),
    /operational_friction_paired_attribution_mismatch/u,
  );
  const attributionFingerprintMismatch = clone(source);
  attributionFingerprintMismatch.paired_evaluation.later_context_use_attribution.projection_fingerprint =
    `sha256:${"f".repeat(64)}`;
  resignPairedV01(attributionFingerprintMismatch.paired_evaluation);
  assert.throws(
    () => materializeOperationalFrictionProposalV01(attributionFingerprintMismatch),
    /operational_friction_paired_attribution_mismatch/u,
  );
  const packetMismatch = clone(source);
  packetMismatch.paired_evaluation.later_context_use_attribution.packet.packet_id =
    "task-context-packet:substituted";
  resignPairedV01(packetMismatch.paired_evaluation);
  assert.throws(
    () => materializeOperationalFrictionProposalV01(packetMismatch),
    /operational_friction_paired_packet_review_mismatch/u,
  );
  const reviewMismatch = clone(source);
  reviewMismatch.paired_evaluation.later_context_use_attribution.review_id =
    "context-use-review:substituted";
  resignPairedV01(reviewMismatch.paired_evaluation);
  assert.throws(
    () => materializeOperationalFrictionProposalV01(reviewMismatch),
    /operational_friction_paired_packet_review_mismatch/u,
  );

  const shadowIdMismatch = clone(source);
  shadowIdMismatch.paired_evaluation.pre_outcome_shadow.projection_id =
    "personal-perspective-shadow:substituted";
  resignPairedV01(shadowIdMismatch.paired_evaluation);
  assert.throws(
    () => materializeOperationalFrictionProposalV01(shadowIdMismatch),
    /operational_friction_paired_evaluation_source_relation_mismatch/u,
  );
  const shadowFingerprintMismatch = clone(source);
  shadowFingerprintMismatch.paired_evaluation.pre_outcome_shadow.projection_fingerprint =
    `sha256:${"d".repeat(64)}`;
  resignPairedV01(shadowFingerprintMismatch.paired_evaluation);
  assert.throws(
    () => materializeOperationalFrictionProposalV01(shadowFingerprintMismatch),
    /operational_friction_paired_evaluation_source_relation_mismatch/u,
  );
  const substitutedShadow = clone(source);
  substitutedShadow.context_shadow_projection =
    buildOperationalFrictionSourceFixtureV01({
      max_shadow_selected: 2,
    }).context_shadow_projection;
  assert.throws(
    () => materializeOperationalFrictionProposalV01(substitutedShadow),
    /operational_friction_paired_evaluation_source_relation_mismatch/u,
  );

  const resealedPairedChain = clone(source);
  const criticalRow = resealedPairedChain.paired_evaluation.rows.find(
    (row) => row.critical_omission_candidate,
  )!;
  criticalRow.critical_omission_candidate = false;
  criticalRow.critical_omission_candidate_rule = null;
  resealedPairedChain.paired_evaluation.summary.critical_omission_candidate_count -= 1;
  resignPairedV01(resealedPairedChain.paired_evaluation);
  const resealedEndFrame = resealedPairedChain.frames.at(-1)!;
  const resealedPairedBinding = resealedEndFrame.source_bindings.find(
    (binding) =>
      binding.source_kind === "personal_perspective_paired_evaluation",
  )!;
  resealedPairedBinding.source_id =
    resealedPairedChain.paired_evaluation.evaluation_id;
  resealedPairedBinding.source_fingerprint =
    resealedPairedChain.paired_evaluation.integrity.fingerprint;
  resignFrameV01(resealedEndFrame);
  resealedPairedChain.dynamics_digest = buildContinuityDynamicsDigestV01({
    workspace_id: resealedPairedChain.workspace_id,
    project_id: resealedPairedChain.project_id,
    frames: resealedPairedChain.frames,
    window_kind: "recent_3",
  });
  assertValidPersonalPerspectivePairedEvaluationV01(
    resealedPairedChain.paired_evaluation,
  );
  resealedPairedChain.frames.forEach(
    assertValidWorkContinuityStateFrameV01,
  );
  assertValidContinuityDynamicsDigestV01(
    resealedPairedChain.dynamics_digest,
  );
  assert.throws(
    () => materializeOperationalFrictionProposalV01(resealedPairedChain),
    /operational_friction_paired_evaluation_source_relation_mismatch/u,
  );

  const frameIdMismatch = clone(source);
  frameIdMismatch.dynamics_digest.ordered_frames[0]!.frame_id =
    "work-continuity-frame:substituted";
  resignDigestV01(frameIdMismatch.dynamics_digest);
  assert.throws(
    () => materializeOperationalFrictionProposalV01(frameIdMismatch),
    /operational_friction_digest_frame_mismatch/u,
  );
  const frameFingerprintMismatch = clone(source);
  frameFingerprintMismatch.dynamics_digest.ordered_frames[0]!.frame_fingerprint =
    `sha256:${"e".repeat(64)}`;
  resignDigestV01(frameFingerprintMismatch.dynamics_digest);
  assert.throws(
    () => materializeOperationalFrictionProposalV01(frameFingerprintMismatch),
    /operational_friction_digest_frame_mismatch/u,
  );

  const frameLineageMismatch = clone(source);
  const endFrame = frameLineageMismatch.frames.at(-1)!;
  const pairedBinding = endFrame.source_bindings.find(
    (binding) =>
      binding.source_kind === "personal_perspective_paired_evaluation",
  )!;
  pairedBinding.source_id = "personal-perspective-paired-evaluation:other";
  resignFrameV01(endFrame);
  frameLineageMismatch.dynamics_digest = buildContinuityDynamicsDigestV01({
    workspace_id: frameLineageMismatch.workspace_id,
    project_id: frameLineageMismatch.project_id,
    frames: frameLineageMismatch.frames,
    window_kind: "recent_3",
  });
  assert.throws(
    () => materializeOperationalFrictionProposalV01(frameLineageMismatch),
    /operational_friction_frame_source_lineage_mismatch/u,
  );

  const missingShadowFrameBinding = clone(source);
  const missingShadowEndFrame = missingShadowFrameBinding.frames.at(-1)!;
  missingShadowEndFrame.source_bindings =
    missingShadowEndFrame.source_bindings.filter(
      (binding) =>
        binding.source_kind !== "personal_perspective_shadow_projection",
    );
  resignFrameV01(missingShadowEndFrame);
  missingShadowFrameBinding.dynamics_digest =
    buildContinuityDynamicsDigestV01({
      workspace_id: missingShadowFrameBinding.workspace_id,
      project_id: missingShadowFrameBinding.project_id,
      frames: missingShadowFrameBinding.frames,
      window_kind: "recent_3",
    });
  assert.throws(
    () => materializeOperationalFrictionProposalV01(missingShadowFrameBinding),
    /operational_friction_frame_source_lineage_mismatch/u,
  );
  const wrongShadowFrameBinding = clone(source);
  const wrongShadowEndFrame = wrongShadowFrameBinding.frames.at(-1)!;
  const shadowBinding = wrongShadowEndFrame.source_bindings.find(
    (binding) =>
      binding.source_kind === "personal_perspective_shadow_projection",
  )!;
  shadowBinding.source_id = "personal-perspective-shadow:other";
  resignFrameV01(wrongShadowEndFrame);
  wrongShadowFrameBinding.dynamics_digest = buildContinuityDynamicsDigestV01({
    workspace_id: wrongShadowFrameBinding.workspace_id,
    project_id: wrongShadowFrameBinding.project_id,
    frames: wrongShadowFrameBinding.frames,
    window_kind: "recent_3",
  });
  assert.throws(
    () => materializeOperationalFrictionProposalV01(wrongShadowFrameBinding),
    /operational_friction_frame_source_lineage_mismatch/u,
  );

  const dynamicsLineageMismatch = clone(source);
  const step = dynamicsLineageMismatch.dynamics_digest.dynamics.blocking_friction
    .step_comparisons[0]!;
  step.from_frame_id = "work-continuity-frame:post-hoc";
  resignDigestV01(dynamicsLineageMismatch.dynamics_digest);
  assert.throws(
    () => materializeOperationalFrictionProposalV01(dynamicsLineageMismatch),
    /operational_friction_dynamics_source_lineage_mismatch/u,
  );

  const chronologyConflict = clone(source);
  chronologyConflict.frames = [
    chronologyConflict.frames[1]!,
    chronologyConflict.frames[0]!,
    chronologyConflict.frames[2]!,
  ];
  chronologyConflict.dynamics_digest.ordered_frames = [
    chronologyConflict.dynamics_digest.ordered_frames[1]!,
    chronologyConflict.dynamics_digest.ordered_frames[0]!,
    chronologyConflict.dynamics_digest.ordered_frames[2]!,
  ];
  chronologyConflict.dynamics_digest.start_boundary = clone(
    chronologyConflict.frames[0]!.boundary,
  );
  resignDigestV01(chronologyConflict.dynamics_digest);
  assert.throws(
    () => materializeOperationalFrictionProposalV01(chronologyConflict),
    /operational_friction_source_chronology_conflict/u,
  );

  const staleSource = clone(source);
  staleSource.attribution.rows[0]!.limitations.push("post-hoc mutation");
  assert.throws(
    () => materializeOperationalFrictionProposalV01(staleSource),
    /operational_friction_attribution_invalid/u,
  );
  const missingFrame = clone(source);
  missingFrame.frames = missingFrame.frames.slice(1);
  assert.throws(
    () => materializeOperationalFrictionProposalV01(missingFrame),
    /operational_friction_required_frame_missing/u,
  );
  const malformed = clone(source);
  (malformed as unknown as Record<string, unknown>).attribution = {};
  assert.throws(
    () => materializeOperationalFrictionProposalV01(malformed as MaterializeOperationalFrictionProposalInputV01),
    /operational_friction_attribution_invalid/u,
  );
  const callerTimestamp = clone(source) as MaterializeOperationalFrictionProposalInputV01 & {
    created_at: string;
  };
  callerTimestamp.created_at = "2099-01-01T00:00:00.000Z";
  assert.throws(
    () => materializeOperationalFrictionProposalV01(callerTimestamp),
    /operational_friction_caller_material_refused/u,
  );

  const postHoc = clone(source);
  const other = buildOperationalFrictionSourceFixtureV01({ assessment: "noisy" });
  postHoc.attribution = other.attribution;
  postHoc.paired_evaluation = other.paired_evaluation;
  assert.throws(
    () => materializeOperationalFrictionProposalV01(postHoc),
    /operational_friction_frame_source_lineage_mismatch/u,
  );
}

function assertEpistemicAndCandidateFailuresV01(
  source: MaterializeOperationalFrictionProposalInputV01,
  profile: OperationalFrictionProposalProfileV01,
  proposal: EpisodeDeltaProposalV01,
): void {
  const packetSmear = clone(profile);
  const packet = packetSmear.observations.find((item) =>
    item.friction_code.startsWith("packet_level_review_"),
  )!;
  packet.attribution_row_ids = [source.attribution.rows[0]!.entry_id];
  packet.observation_id = deriveOperationalFrictionObservationIdV01(packet);
  resignProfileV01(packetSmear);
  assertValidationCodeV01(
    validateOperationalFrictionProposalProfileV01(packetSmear),
    "packet_level_review_scope_conflict",
  );

  const omissionHarm = clone(profile) as OperationalFrictionProposalProfileV01 & {
    observations: Array<Record<string, unknown>>;
  };
  const omission = omissionHarm.observations.find(
    (item) => item.friction_code === "critical_context_omission_candidate",
  )!;
  omission.friction_code =
    "critical_context_omission_harm" as unknown as typeof omission.friction_code;
  resignProfileV01(omissionHarm as OperationalFrictionProposalProfileV01);
  assertValidationCodeV01(
    validateOperationalFrictionProposalProfileV01(omissionHarm),
    "observation_epistemic_boundary_conflict",
  );

  const causal = clone(profile);
  causal.observations[0]!.causal_contribution = true as false;
  resignProfileV01(causal);
  assertValidationCodeV01(
    validateOperationalFrictionProposalProfileV01(causal),
    "observation_epistemic_boundary_conflict",
  );
  const scalar = clone(profile) as OperationalFrictionProposalProfileV01 & {
    friction_score: number;
  };
  scalar.friction_score = 1;
  resignProfileV01(scalar);
  assertValidationCodeV01(
    validateOperationalFrictionProposalProfileV01(scalar),
    "profile_unknown_field",
  );
  const falseZero = clone(profile);
  laneV01(falseZero, "repeated_explanation").false_zero_emitted = true as false;
  resignProfileV01(falseZero);
  assertValidationCodeV01(
    validateOperationalFrictionProposalProfileV01(falseZero),
    "unavailable_lane_boundary_conflict",
  );

  const transitionable = clone(profile);
  transitionable.candidate_bindings[0]!.operation = "revise" as "unknown";
  resignProfileV01(transitionable);
  assertValidationCodeV01(
    validateOperationalFrictionProposalProfileV01(transitionable),
    "candidate_authority_boundary_conflict",
  );
  for (const forbiddenFamily of ["memory_delta", "perspective_delta"] as const) {
    const semantic = clone(profile);
    semantic.candidate_bindings[0]!.delta_family =
      forbiddenFamily as OperationalFrictionProposalProfileV01["candidate_bindings"][number]["delta_family"];
    resignProfileV01(semantic);
    assertValidationCodeV01(
      validateOperationalFrictionProposalProfileV01(semantic),
      "candidate_authority_boundary_conflict",
    );
  }
  const activation = clone(profile);
  activation.candidate_bindings[0]!.activation_owner =
    "policy:forbidden" as unknown as null;
  resignProfileV01(activation);
  assertValidationCodeV01(
    validateOperationalFrictionProposalProfileV01(activation),
    "candidate_authority_boundary_conflict",
  );

  const wrongFamily = clone(proposal);
  const wrongFamilyCandidate = wrongFamily.proposed_deltas[0]!;
  wrongFamilyCandidate.delta_type = "research_delta";
  const wrongFamilyBinding =
    wrongFamily.operational_friction_proposal!.candidate_bindings.find(
      (item) => item.candidate_id === wrongFamilyCandidate.candidate_id,
    )!;
  wrongFamilyBinding.delta_family = "research_delta";
  wrongFamilyBinding.target_class = "bounded_research_hypothesis";
  wrongFamilyCandidate.target_refs[0]!.compatibility_namespace =
    `${wrongFamilyBinding.operation_domain}:${wrongFamilyBinding.target_class}`;
  wrongFamilyBinding.candidate_fingerprint =
    createEpisodeDeltaCandidateFingerprintV01(wrongFamilyCandidate);
  resignProfileV01(wrongFamily.operational_friction_proposal!);
  resignProposalV01(wrongFamily);
  assert.throws(
    () =>
      assertOperationalFrictionMaterialMatchesSourcesV01(
        source,
        wrongFamily.operational_friction_proposal!,
        wrongFamily,
      ),
    /operational_friction_resealed_profile_refused/u,
  );

  const candidatePerCode = new Map<string, number>();
  for (const binding of profile.candidate_bindings) {
    const code = profile.observations.find((observation) =>
      binding.basis_observation_ids.includes(observation.observation_id),
    )!.friction_code;
    candidatePerCode.set(code, (candidatePerCode.get(code) ?? 0) + 1);
  }
  assert.equal([...candidatePerCode.values()].every((count) => count === 1), true);
  assert.equal(
    profile.candidate_bindings.some((binding) =>
      binding.basis_observation_ids.length > 1 &&
      new Set(
        binding.basis_observation_ids.map(
          (id) => profile.observations.find((item) => item.observation_id === id)!.friction_code,
        ),
      ).size > 1,
    ),
    false,
  );

  const injected = clone(proposal);
  injected.proposed_deltas.push({
    ...clone(injected.proposed_deltas[0]!),
    candidate_id: "operational-friction-candidate:unrelated",
  });
  resignProposalV01(injected);
  assertEpisodeValidationCodeV01(
    injected,
    "operational_friction_candidate_count_mismatch",
  );
  const unbound = clone(proposal);
  unbound.operational_friction_proposal!.candidate_bindings.pop();
  resignProfileV01(unbound.operational_friction_proposal!);
  resignProposalV01(unbound);
  assertEpisodeValidationCodeV01(
    unbound,
    "operational_friction_candidate_count_mismatch",
  );
  const wrongTarget = clone(proposal);
  wrongTarget.proposed_deltas[0]!.target_refs[0]!.compatibility_namespace =
    "context_validation:bounded_agent_plan_hypothesis";
  const binding = wrongTarget.operational_friction_proposal!.candidate_bindings.find(
    (item) => item.candidate_id === wrongTarget.proposed_deltas[0]!.candidate_id,
  )!;
  binding.candidate_fingerprint = createEpisodeDeltaCandidateFingerprintV01(
    wrongTarget.proposed_deltas[0]!,
  );
  resignProfileV01(wrongTarget.operational_friction_proposal!);
  resignProposalV01(wrongTarget);
  assertEpisodeValidationCodeV01(
    wrongTarget,
    "operational_friction_candidate_binding_mismatch",
  );
  const fingerprintMismatch = clone(proposal);
  fingerprintMismatch.operational_friction_proposal!.candidate_bindings[0]!.candidate_fingerprint =
    `sha256:${"b".repeat(64)}`;
  resignProfileV01(fingerprintMismatch.operational_friction_proposal!);
  resignProposalV01(fingerprintMismatch);
  assertEpisodeValidationCodeV01(
    fingerprintMismatch,
    "operational_friction_candidate_binding_mismatch",
  );

  const unrelatedBasis = clone(profile);
  const existingBasis = new Set(
    unrelatedBasis.candidate_bindings[0]!.basis_observation_ids,
  );
  const unrelatedObservation = unrelatedBasis.observations.find(
    (observation) => !existingBasis.has(observation.observation_id),
  )!;
  unrelatedBasis.candidate_bindings[0]!.basis_observation_ids = [
    unrelatedObservation.observation_id,
  ];
  resignProfileV01(unrelatedBasis);
  assert.throws(
    () =>
      assertOperationalFrictionMaterialMatchesSourcesV01(
        source,
        unrelatedBasis,
        proposal,
      ),
    /operational_friction_resealed_profile_refused/u,
  );
}

function assertIntegrityAndCompatibilityV01(
  source: MaterializeOperationalFrictionProposalInputV01,
  profile: OperationalFrictionProposalProfileV01,
  proposal: EpisodeDeltaProposalV01,
): void {
  const reordered = buildOperationalFrictionProposalProfileV01({
    profile_kind: profile.profile_kind,
    workspace_id: profile.workspace_id,
    project_id: profile.project_id,
    created_at: profile.created_at,
    source_bundle: clone(profile.source_bundle),
    derivation_rule_version: profile.derivation_rule_version,
    observations: clone(profile.observations).reverse(),
    unavailable_lanes: clone(profile.unavailable_lanes).reverse(),
    candidate_bindings: clone(profile.candidate_bindings).reverse(),
    source_coverage: profile.source_coverage,
    source_currentness: profile.source_currentness,
    uncertainties: clone(profile.uncertainties).reverse(),
    limitations: clone(profile.limitations).reverse(),
    proposal_only_status: "proposal_only",
    policy_activation_owner: null,
    serialized_validation_scope:
      "projection_internal_only_upstream_sources_required_for_relation_proof",
  });
  assert.deepEqual(reordered, profile);

  const changedSource = materializeOperationalFrictionProposalV01(
    buildOperationalFrictionSourceFixtureV01({ assessment: "noisy" }),
  );
  assert.notEqual(changedSource.profile.profile_id, profile.profile_id);
  assert.notEqual(changedSource.proposal.proposal_id, proposal.proposal_id);

  const changedRule = clone(profile);
  const ruleObservation = changedRule.observations[0]!;
  const oldObservationId = ruleObservation.observation_id;
  ruleObservation.derivation_rule_id = `${ruleObservation.derivation_rule_id}.changed`;
  ruleObservation.observation_id = deriveOperationalFrictionObservationIdV01(
    ruleObservation,
  );
  for (const candidate of changedRule.candidate_bindings) {
    candidate.basis_observation_ids = candidate.basis_observation_ids.map((id) =>
      id === oldObservationId ? ruleObservation.observation_id : id,
    );
  }
  resignProfileV01(changedRule);
  assert.notEqual(changedRule.profile_id, profile.profile_id);
  assert.equal(validateOperationalFrictionProposalProfileV01(changedRule).status, "valid");
  assert.throws(
    () =>
      assertOperationalFrictionMaterialMatchesSourcesV01(
        source,
        changedRule,
        proposal,
      ),
    /operational_friction_resealed_profile_refused/u,
  );

  const missingShadowBinding = clone(profile);
  delete (
    missingShadowBinding.source_bundle as Partial<
      OperationalFrictionProposalProfileV01["source_bundle"]
    >
  ).context_shadow_projection;
  assertValidationCodeV01(
    validateOperationalFrictionProposalProfileV01(missingShadowBinding),
    "source_binding_malformed",
  );

  const resealedShadowBinding = clone(profile);
  resealedShadowBinding.source_bundle.context_shadow_projection.source_id =
    "personal-perspective-shadow:resealed";
  resignBundleV01(resealedShadowBinding.source_bundle);
  resignProfileV01(resealedShadowBinding);
  assert.equal(
    validateOperationalFrictionProposalProfileV01(resealedShadowBinding).status,
    "valid",
  );
  assert.throws(
    () =>
      assertOperationalFrictionMaterialMatchesSourcesV01(
        source,
        resealedShadowBinding,
        proposal,
      ),
    /operational_friction_resealed_profile_refused/u,
  );

  const resealedCount = clone(profile);
  const countObservation = resealedCount.observations.find(
    (item) => item.exact_count !== null,
  )!;
  const oldCountId = countObservation.observation_id;
  countObservation.exact_count = countObservation.exact_count! + 1;
  countObservation.observation_id = deriveOperationalFrictionObservationIdV01(
    countObservation,
  );
  for (const candidate of resealedCount.candidate_bindings) {
    candidate.basis_observation_ids = candidate.basis_observation_ids.map((id) =>
      id === oldCountId ? countObservation.observation_id : id,
    );
  }
  resignProfileV01(resealedCount);
  assert.equal(validateOperationalFrictionProposalProfileV01(resealedCount).status, "valid");
  assert.throws(
    () =>
      assertOperationalFrictionMaterialMatchesSourcesV01(
        source,
        resealedCount,
        proposal,
      ),
    /operational_friction_resealed_profile_refused/u,
  );

  const resealedUnavailable = clone(profile);
  resealedUnavailable.unavailable_lanes[0]!.basis += " Resealed.";
  resignProfileV01(resealedUnavailable);
  assert.equal(
    validateOperationalFrictionProposalProfileV01(resealedUnavailable).status,
    "valid",
  );
  assert.throws(
    () =>
      assertOperationalFrictionMaterialMatchesSourcesV01(
        source,
        resealedUnavailable,
        proposal,
      ),
    /operational_friction_resealed_profile_refused/u,
  );

  const authority = clone(profile);
  authority.authority_summary.authorizes_execution = true as false;
  resignProfileV01(authority);
  assertValidationCodeV01(
    validateOperationalFrictionProposalProfileV01(authority),
    "authority_boundary_conflict",
  );
  const activation = clone(profile);
  activation.policy_activation_owner = "operator" as unknown as null;
  resignProfileV01(activation);
  assertValidationCodeV01(
    validateOperationalFrictionProposalProfileV01(activation),
    "profile_boundary_conflict",
  );

  const sourceRelation = clone(proposal);
  sourceRelation.operational_friction_proposal!.source_bundle.attribution.source_id =
    "context-use-attribution:resealed";
  resignBundleV01(sourceRelation.operational_friction_proposal!.source_bundle);
  resignProfileV01(sourceRelation.operational_friction_proposal!);
  resignProposalV01(sourceRelation);
  assertEpisodeValidationCodeV01(
    sourceRelation,
    "operational_friction_proposal_source_ref_missing",
  );

  const missingShadowSourceRef = clone(proposal);
  missingShadowSourceRef.source_refs = missingShadowSourceRef.source_refs.filter(
    (ref) => ref.ref_type !== "personal_perspective_shadow_projection",
  );
  resignProposalV01(missingShadowSourceRef);
  assertEpisodeValidationCodeV01(
    missingShadowSourceRef,
    "operational_friction_proposal_source_ref_missing",
  );

  const missingShadowCompatibilityRef = clone(proposal);
  missingShadowCompatibilityRef.compatibility.external_refs =
    missingShadowCompatibilityRef.compatibility.external_refs.filter(
      (ref) => ref.ref_type !== "personal_perspective_shadow_projection",
    );
  resignProposalV01(missingShadowCompatibilityRef);
  assertEpisodeValidationCodeV01(
    missingShadowCompatibilityRef,
    "operational_friction_compatibility_source_ref_missing",
  );

  const missingShadowContract = clone(proposal);
  missingShadowContract.compatibility.source_contracts =
    missingShadowContract.compatibility.source_contracts.filter(
      (contract) =>
        contract !==
        source.context_shadow_projection.projection_version,
    );
  resignProposalV01(missingShadowContract);
  assertEpisodeValidationCodeV01(
    missingShadowContract,
    "operational_friction_compatibility_contract_missing",
  );

  const profileCollision = clone(proposal);
  profileCollision.source_assessment = {} as EpisodeDeltaProposalV01["source_assessment"];
  resignProposalV01(profileCollision);
  assertEpisodeValidationCodeV01(
    profileCollision,
    "operational_friction_profile_collision",
  );

  const historical = clone(proposal);
  delete historical.operational_friction_proposal;
  historical.proposed_deltas = [];
  historical.observations = [];
  historical.inferences = [];
  historical.uncertainties = [];
  historical.source_refs = [];
  historical.source_status.source_refs = [];
  historical.compatibility.external_refs = [];
  historical.run_receipt_refs = [];
  historical.task_context_packet_ref = null;
  resignProposalV01(historical);
  assert.notEqual(validateEpisodeDeltaProposalV01(historical).status, "valid");
  // Existing protocol conformance retains its fixed historical IDs; this
  // focused check only proves omission of the additive key is not rejected as
  // an unknown/missing core field.
  assert.equal(
    validateEpisodeDeltaProposalV01(historical).errors.some(
      (issue) =>
        issue.code === "operational_friction_proposal_missing" ||
        issue.code === "unknown_core_field",
    ),
    false,
  );
}

function assertReviewAndTransitionNegativeV01(
  proposal: EpisodeDeltaProposalV01,
): void {
  const candidate = proposal.proposed_deltas[0]!;
  assert.equal(
    mapEpisodeDeltaCandidateOperationToTransitionOperationV01(
      candidate.operation,
    ),
    null,
  );
  const decidedAt = new Date(Date.parse(proposal.created_at) + 60_000).toISOString();
  const actorRef = {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "synthetic_boundary_reviewer",
    external_id: "reviewer:operational-friction-negative-proof",
    observed_at: decidedAt,
    trust_class: "user_declaration" as const,
  };
  const decision = buildReviewDecisionV01({
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
    source_proposal: {
      proposal_version: proposal.proposal_version,
      proposal_id: proposal.proposal_id,
      proposal_fingerprint: proposal.integrity.fingerprint,
    },
    candidate: {
      candidate_id: candidate.candidate_id,
      candidate_fingerprint:
        createEpisodeDeltaCandidateFingerprintV01(candidate),
    },
    decision: "accept",
    actor_ref: actorRef,
    authorization_basis_refs: [actorRef],
    decision_basis_material_ids: candidate.basis_material_ids,
    decision_basis_refs: candidate.source_refs,
    rationale_summary:
      "Ephemeral synthetic negative-boundary decision; no durable review is written.",
    decided_at: decidedAt,
    revisit: null,
    requested_transition_intent: null,
    lineage: {
      prior_decisions: [],
      superseding_candidate: null,
      retracted_decision: null,
    },
    compatibility: {
      source_contracts: [
        proposal.proposal_version,
        "review_decision.v0.1",
      ],
      unmapped_fields: [],
      warnings: ["Synthetic in-memory negative proof only."],
      external_refs: [actorRef],
    },
  });
  assert.equal(validateReviewDecisionV01(decision).status, "valid");
  assert.equal(
    validateReviewDecisionAgainstEpisodeDeltaProposalV01(decision, proposal)
      .status,
    "valid",
  );
  assert.equal(decision.requested_transition_intent, null);
  const eligibility = evaluateReviewDecisionStateTransitionEligibilityV01({
    proposal,
    decision,
    current_state_observations: [],
    semantic_commit_gate_evaluation: null,
    prior_review_decisions: [],
    prior_state_transition_receipts: [],
    evaluated_at: decidedAt,
  });
  assert.notEqual(eligibility.status, "eligible");
  assert.ok(
    eligibility.errors.some(
      (issue) => issue.code === "candidate_operation_not_transitionable",
    ),
  );
  assert.ok(
    eligibility.errors.some(
      (issue) => issue.code === "requested_transition_intent_missing",
    ),
  );
  assert.equal(proposal.operational_friction_proposal!.authority_summary.semantic_transition_eligible, false);
}

function assertSourcePurityV01(): void {
  const files = [
    "lib/vnext/operational-friction-proposal.ts",
    "lib/vnext/operational-friction-proposal-profile.ts",
  ];
  const forbidden = [
    /better-sqlite3/u,
    /\/persistence\//u,
    /model-gateway/iu,
    /provider-adapter/iu,
    /app\/api\//u,
    /\/runtime\//u,
    /managed-(?:start|resume|delegation)/iu,
    /operator-mutation/iu,
    /github-client/iu,
    /network-client/iu,
    /\bfetch\s*\(/u,
    /\bprocess\.(?:env|cwd|argv)/u,
    /\bDate\.now\s*\(/u,
    /\bnew Date\s*\(/u,
    /from\s+["']node:fs/u,
  ];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const pattern of forbidden) {
      assert.doesNotMatch(source, pattern, `${file}: ${pattern}`);
    }
  }
}

function observationV01(
  profile: OperationalFrictionProposalProfileV01,
  code: OperationalFrictionProposalProfileV01["observations"][number]["friction_code"],
) {
  const observation = profile.observations.find(
    (item) => item.friction_code === code,
  );
  assert.ok(observation, code);
  return observation;
}

function laneV01(
  profile: OperationalFrictionProposalProfileV01,
  code: OperationalFrictionProposalProfileV01["unavailable_lanes"][number]["lane_code"],
) {
  const lane = profile.unavailable_lanes.find((item) => item.lane_code === code);
  assert.ok(lane, code);
  return lane;
}

function candidateDistributionV01(profile: OperationalFrictionProposalProfileV01) {
  return {
    agent_plan_delta: profile.candidate_bindings.filter(
      (candidate) => candidate.delta_family === "agent_plan_delta",
    ).length,
    research_delta: profile.candidate_bindings.filter(
      (candidate) => candidate.delta_family === "research_delta",
    ).length,
    validation_delta: profile.candidate_bindings.filter(
      (candidate) => candidate.delta_family === "validation_delta",
    ).length,
  };
}

function resignPairedV01(
  paired: MaterializeOperationalFrictionProposalInputV01["paired_evaluation"],
): void {
  paired.evaluation_id = derivePersonalPerspectivePairedEvaluationIdV01(paired);
  paired.integrity.fingerprint =
    createPersonalPerspectivePairedEvaluationFingerprintV01(paired);
}

function resignFrameV01(
  frame: MaterializeOperationalFrictionProposalInputV01["frames"][number],
): void {
  frame.frame_id = deriveWorkContinuityStateFrameIdV01(frame);
  frame.integrity.fingerprint = createWorkContinuityStateFrameFingerprintV01(frame);
}

function resignDigestV01(
  digest: MaterializeOperationalFrictionProposalInputV01["dynamics_digest"],
): void {
  digest.digest_id = deriveContinuityDynamicsDigestIdV01(digest);
  digest.integrity.fingerprint = createContinuityDynamicsDigestFingerprintV01(digest);
}

function resignBundleV01(
  bundle: OperationalFrictionProposalProfileV01["source_bundle"],
): void {
  bundle.bundle_id = deriveOperationalFrictionSourceBundleIdV01(bundle);
  bundle.bundle_fingerprint =
    createOperationalFrictionSourceBundleFingerprintV01(bundle);
}

function resignProfileV01(profile: OperationalFrictionProposalProfileV01): void {
  profile.profile_id = deriveOperationalFrictionProposalProfileIdV01(profile);
  profile.integrity.fingerprint =
    createOperationalFrictionProposalProfileFingerprintV01(profile);
}

function resignProposalV01(proposal: EpisodeDeltaProposalV01): void {
  proposal.proposal_id = deriveEpisodeDeltaProposalIdV01(proposal);
  proposal.integrity.fingerprint =
    createEpisodeDeltaProposalFingerprintV01(proposal);
}

function assertValidationCodeV01(
  validation: ReturnType<typeof validateOperationalFrictionProposalProfileV01>,
  code: string,
): void {
  assert.notEqual(validation.status, "valid", code);
  assert.ok(validation.errors.some((issue) => issue.code === code), JSON.stringify(validation));
}

function assertEpisodeValidationCodeV01(
  proposal: EpisodeDeltaProposalV01,
  code: string,
): void {
  const validation = validateEpisodeDeltaProposalV01(proposal);
  assert.notEqual(validation.status, "valid", code);
  assert.ok(validation.errors.some((issue) => issue.code === code), JSON.stringify(validation));
}

function assertAllFalseAuthorityV01(
  value: object,
  trueKeys: string[] = [],
): void {
  for (const [key, item] of Object.entries(value)) {
    if (key === "notes") continue;
    if (trueKeys.includes(key)) {
      assert.equal(item, true, key);
    } else {
      assert.equal(item, false, key);
    }
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  return Object.freeze(value);
}
