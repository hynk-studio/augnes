import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  CODEX_CURRENT_CONTINUITY_ROUTE_MARKER_V01,
  CODEX_CURRENT_CONTINUITY_VERSION_V01,
} from "@/types/vnext/codex-current-continuity";
import {
  REAL_WORK_CONTINUITY_BENEFIT_PILOT_ARTIFACT_VERSION_V01,
  REAL_WORK_CONTINUITY_BENEFIT_PILOT_REPORT_VERSION_V01,
  REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01,
  type RealWorkContinuityBenefitPilotReportV01,
  type RealWorkPilotAuthenticityV01,
  type RealWorkPilotAuthorityBoundaryV01,
  type RealWorkPilotBaselineMaterialIdentityV01,
  type RealWorkPilotConditionV01,
  type RealWorkPilotContinuityMaterialIdentityV01,
  type RealWorkPilotDispositionV01,
  type RealWorkPilotEpisodeFreezeInputV01,
  type RealWorkPilotEpisodeFreezeV01,
  type RealWorkPilotImmediateObservationInputV01,
  type RealWorkPilotImmediateObservationV01,
  type RealWorkPilotLaterOutcomeLabelV01,
  type RealWorkPilotLaterOutcomeReviewInputV01,
  type RealWorkPilotLaterOutcomeReviewV01,
  type RealWorkPilotMeasureDistributionV01,
  type RealWorkPilotMeasureKeyV01,
  type RealWorkPilotMeasureObservationV01,
  type RealWorkPilotMeasureSetV01,
  type RealWorkPilotMeasureValueV01,
  type RealWorkPilotMethodBoundaryV01,
  type RealWorkPilotObservationBasisV01,
  type RealWorkPilotPrivacyEgressClassV01,
  type RealWorkPilotSourceRefKindV01,
  type RealWorkPilotSourceRefV01,
  type RealWorkPilotTaskFamilyV01,
  type RealWorkPilotWorkIdentityV01,
} from "@/types/vnext/real-work-continuity-benefit-pilot";

export const REAL_WORK_PILOT_TASK_FAMILIES_V01 = [
  "resume",
  "verify",
  "decide",
] as const;

export const REAL_WORK_PILOT_ABBA_SCHEDULE_V01 = [
  "B0",
  "C1",
  "C1",
  "B0",
] as const;

export const REAL_WORK_PILOT_C1_OWNER_V01 = Object.freeze({
  projection_version: CODEX_CURRENT_CONTINUITY_VERSION_V01,
  route_marker: CODEX_CURRENT_CONTINUITY_ROUTE_MARKER_V01,
  producer:
    "lib/vnext/codex-current-continuity/codex-current-continuity.ts#readCodexCurrentContinuityV01",
  consumer:
    "apps/augnes_apps/scripts/codex-current-continuity.ts#fetchCurrentContinuity",
} as const);

export const REAL_WORK_PILOT_AUTHORITY_V01 = Object.freeze({
  writes_product_or_core_database: false,
  creates_core_record: false,
  creates_evidence: false,
  creates_proposal: false,
  creates_review_decision: false,
  creates_or_applies_transition: false,
  creates_or_activates_policy: false,
  creates_stage_7_behavior: false,
  changes_context_selection_or_injection: false,
  calls_provider_or_model: false,
  calls_network: false,
  calls_github: false,
  grants_semantic_authority: false,
  grants_execution_authority: false,
  grants_external_effect_authority: false,
  grants_merge_or_promotion_authority: false,
} satisfies RealWorkPilotAuthorityBoundaryV01);

export const REAL_WORK_PILOT_METHOD_V01 = Object.freeze({
  model_as_judge: false,
  scalar_fitness: false,
  rank: false,
  winner: false,
  adaptive_assignment: false,
  causal_contribution_from_presence_or_reference: false,
  harness_owned_real_provider_calls: 0,
  harness_owned_network_calls: 0,
} satisfies RealWorkPilotMethodBoundaryV01);

type MeasureDefinitionV01 = {
  family: RealWorkPilotTaskFamilyV01 | "cross";
  value_kind: "nonnegative_integer" | "boolean" | "privacy_egress_class";
  later_only: boolean;
  exact_receipt_required: boolean;
};

export const REAL_WORK_PILOT_MEASURE_DEFINITIONS_V01 = Object.freeze({
  resume_time_to_first_correct_action_ms: numeric("resume"),
  resume_steps_to_first_correct_action: numeric("resume"),
  resume_repeated_explanation_count: numeric("resume"),
  resume_wrong_context_correction_count: numeric("resume"),
  resume_missing_critical_context_count: numeric("resume"),
  resume_stale_context_direction_error: bool("resume"),
  resume_unnecessary_review_context_burden_steps: numeric("resume"),
  resume_first_meaningful_action_later_confirmed_correct: bool("resume", true),
  verify_required_checks_identified_count: numeric("verify"),
  verify_required_checks_completed_count: numeric("verify"),
  verify_source_lineage_refs_required_count: numeric("verify"),
  verify_source_lineage_refs_covered_count: numeric("verify"),
  verify_skipped_required_checks_count: numeric("verify"),
  verify_false_success: bool("verify"),
  verify_contradiction_or_staleness_detected: bool("verify"),
  verify_unsupported_claim_corrected_or_refused: bool("verify"),
  verify_later_reversal_missing_or_misclassified_context: bool("verify", true),
  decide_time_to_material_decision_ms: numeric("decide"),
  decide_steps_to_material_decision: numeric("decide"),
  decide_review_turns_to_material_decision: numeric("decide"),
  decide_duplicate_candidate_count: numeric("decide"),
  decide_irrelevant_candidate_count: numeric("decide"),
  decide_missing_context_correction_count: numeric("decide"),
  decide_later_correction_or_reversal: bool("decide", true),
  decide_source_candidate_decision_traceability_preserved: bool("decide"),
  decide_uncertainty_opposition_falsifier_preserved: bool("decide"),
  decide_recommendation_assessment_boundary_integrity: bool("decide"),
  cross_manual_interventions_count: numeric("cross"),
  cross_additional_review_steps: numeric("cross"),
  cross_tool_calls_from_existing_safe_receipts: numeric("cross", false, true),
  cross_provider_calls_from_existing_safe_receipts: numeric("cross", false, true),
  cross_latency_ms_from_exact_evidence: numeric("cross", false, true),
  cross_cost_microunits_from_exact_evidence: numeric("cross", false, true),
  cross_privacy_egress_class: privacy(),
  cross_stale_or_harmful_transfer: bool("cross"),
  cross_misleading_confidence_or_false_attention: bool("cross"),
  cross_authority_drift: bool("cross"),
  cross_explanation_protocol_burden_steps: numeric("cross"),
} satisfies Record<RealWorkPilotMeasureKeyV01, MeasureDefinitionV01>);

export const REAL_WORK_PILOT_MEASURE_KEYS_V01 = Object.freeze(
  Object.keys(
    REAL_WORK_PILOT_MEASURE_DEFINITIONS_V01,
  ) as RealWorkPilotMeasureKeyV01[],
);

const PRIVACY_EGRESS_CLASSES = new Set<RealWorkPilotPrivacyEgressClassV01>([
  "local_only_no_egress",
  "ordinary_host_egress",
  "provider_egress_from_existing_receipt",
  "privacy_expansion_candidate",
  "unknown_egress",
]);

const SOURCE_REF_KINDS = new Set<RealWorkPilotSourceRefKindV01>([
  "git_revision",
  "repository_path",
  "task_context_packet",
  "run_receipt",
  "continuity_snapshot",
  "manual_handoff",
  "direct_observation",
  "later_review_material",
  "other_bounded",
]);

const AUTHENTICITY_VALUES = new Set<RealWorkPilotAuthenticityV01>([
  "authentic_real_work",
  "synthetic_test_only",
]);

const LATER_LABELS = new Set<RealWorkPilotLaterOutcomeLabelV01>([
  "helpful",
  "neutral",
  "misleading",
  "harmful_transfer_candidate",
  "insufficient_unknown",
]);

const SHA256 = /^sha256:[a-f0-9]{64}$/u;
const SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{16,}\b/u,
  /\bgh[pousr]_[A-Za-z0-9]{16,}\b/u,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/u,
  /\b(?:OPENAI_API_KEY|API_KEY|ACCESS_TOKEN|CLIENT_SECRET)\s*=/iu,
  /\bAuthorization\s*:\s*(?:Bearer|Basic)\s+/iu,
  /\bCookie\s*:/iu,
  /[?&](?:token|api_key|access_key|signature)=[^&\s]+/iu,
] as const;

const MAX_SOURCE_REFS = 24;
const MAX_LIST_ITEMS = 24;
const MAX_TEXT = 2_000;
const MAX_SHORT_TEXT = 512;

export class RealWorkContinuityBenefitPilotErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "RealWorkContinuityBenefitPilotErrorV01";
  }
}

export function conditionForRealWorkPilotEpisodeV01(
  familyEpisodeIndex: number,
): RealWorkPilotConditionV01 {
  if (!Number.isInteger(familyEpisodeIndex) || familyEpisodeIndex < 1 || familyEpisodeIndex > 4) {
    refuse("real_work_pilot_family_episode_index_invalid");
  }
  return REAL_WORK_PILOT_ABBA_SCHEDULE_V01[familyEpisodeIndex - 1]!;
}

export function freezeRealWorkPilotEpisodeV01(
  value: unknown,
): RealWorkPilotEpisodeFreezeV01 {
  const input = parseFreezeInputV01(value);
  const condition = conditionForRealWorkPilotEpisodeV01(
    input.family_episode_index,
  );
  if (
    (condition === "B0" && input.continuity_material !== null) ||
    (condition === "C1" && input.continuity_material === null)
  ) {
    refuse("real_work_pilot_condition_material_mismatch");
  }
  const workIdentity = createWorkIdentityV01(input);
  const sourceRefs = normalizeSourceRefsV01(input.source_refs);
  const baselineMaterial = normalizeBaselineMaterialV01(
    input.baseline_material,
  );
  const continuityMaterial =
    input.continuity_material === null
      ? null
      : normalizeContinuityMaterialV01(input.continuity_material);
  const pilotId = deriveRealWorkPilotIdV01(input.workspace_id, input.project_id);
  const identityMaterial = {
    pilot_version: REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01,
    pilot_id: pilotId,
    authenticity: input.authenticity,
    task_family: input.task_family,
    family_episode_index: input.family_episode_index,
    condition,
    work_identity: workIdentity,
    source_refs: sourceRefs,
    natural_task_goal: input.natural_task_goal,
    success_or_verification_criteria: input.success_or_verification_criteria,
    known_constraints: input.known_constraints,
    baseline_material: baselineMaterial,
    continuity_material: continuityMaterial,
  };
  const episodeIdentityHash = fingerprintV01(identityMaterial);
  const core: Omit<RealWorkPilotEpisodeFreezeV01, "integrity"> = {
    artifact_version:
      REAL_WORK_CONTINUITY_BENEFIT_PILOT_ARTIFACT_VERSION_V01,
    artifact_kind: "pre_outcome_episode_freeze",
    pilot_version: REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01,
    pilot_id: pilotId,
    episode_id: `rw1-episode_${episodeIdentityHash.slice("sha256:".length, 39)}`,
    authenticity: input.authenticity,
    task_family: input.task_family,
    family_episode_index: input.family_episode_index,
    condition,
    work_identity: workIdentity,
    source_refs: sourceRefs,
    source_frame_fingerprint: fingerprintV01(sourceRefs),
    natural_task_goal: input.natural_task_goal,
    success_or_verification_criteria: [...input.success_or_verification_criteria],
    known_constraints: [...input.known_constraints],
    baseline_material: baselineMaterial,
    continuity_material: continuityMaterial,
    freeze_timestamp: input.freeze_timestamp,
    outcome_known_at_freeze: false,
    authority: structuredClone(REAL_WORK_PILOT_AUTHORITY_V01),
    method: structuredClone(REAL_WORK_PILOT_METHOD_V01),
  };
  return {
    ...core,
    integrity: {
      algorithm: "sha256",
      fingerprint_scope: "episode_freeze_without_integrity",
      fingerprint: fingerprintV01(core),
    },
  };
}

export function assertRealWorkPilotEpisodeFreezeV01(
  value: unknown,
): asserts value is RealWorkPilotEpisodeFreezeV01 {
  const record = requireRecord(value, "real_work_pilot_freeze_not_object");
  assertExactKeys(record, [
    "artifact_version",
    "artifact_kind",
    "pilot_version",
    "pilot_id",
    "episode_id",
    "authenticity",
    "task_family",
    "family_episode_index",
    "condition",
    "work_identity",
    "source_refs",
    "source_frame_fingerprint",
    "natural_task_goal",
    "success_or_verification_criteria",
    "known_constraints",
    "baseline_material",
    "continuity_material",
    "freeze_timestamp",
    "outcome_known_at_freeze",
    "authority",
    "method",
    "integrity",
  ], "real_work_pilot_freeze_keys_invalid");
  const typed = record as unknown as RealWorkPilotEpisodeFreezeV01;
  const rebuilt = freezeRealWorkPilotEpisodeV01({
    authenticity: typed.authenticity,
    task_family: typed.task_family,
    family_episode_index: typed.family_episode_index,
    workspace_id: typed.work_identity?.workspace_id,
    project_id: typed.work_identity?.project_id,
    work_id: typed.work_identity?.work_id,
    source_refs: typed.source_refs,
    natural_task_goal: typed.natural_task_goal,
    success_or_verification_criteria: typed.success_or_verification_criteria,
    known_constraints: typed.known_constraints,
    baseline_material: typed.baseline_material,
    continuity_material: typed.continuity_material,
    freeze_timestamp: typed.freeze_timestamp,
    outcome_known_at_freeze: typed.outcome_known_at_freeze,
  });
  if (canonicalizeProtocolValueV01(rebuilt) !== canonicalizeProtocolValueV01(typed)) {
    refuse("real_work_pilot_freeze_identity_or_fingerprint_invalid");
  }
}

export function recordImmediateRealWorkPilotObservationV01(
  freezeValue: unknown,
  inputValue: unknown,
): RealWorkPilotImmediateObservationV01 {
  assertRealWorkPilotEpisodeFreezeV01(freezeValue);
  const freeze = freezeValue;
  const input = parseImmediateObservationInputV01(inputValue);
  assertJoinScopeV01(freeze, input);
  if (Date.parse(input.observed_at) < Date.parse(freeze.freeze_timestamp)) {
    refuse("real_work_pilot_observation_precedes_freeze");
  }
  const measurements = materializeImmediateMeasureSetV01(
    freeze.task_family,
    input.measurements,
  );
  const core: Omit<RealWorkPilotImmediateObservationV01, "integrity"> = {
    artifact_version:
      REAL_WORK_CONTINUITY_BENEFIT_PILOT_ARTIFACT_VERSION_V01,
    artifact_kind: "immediate_bounded_observation",
    pilot_version: REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01,
    pilot_id: freeze.pilot_id,
    episode_id: freeze.episode_id,
    freeze_fingerprint: freeze.integrity.fingerprint,
    work_identity: structuredClone(freeze.work_identity),
    task_family: freeze.task_family,
    condition: freeze.condition,
    observed_at: input.observed_at,
    measurements,
    harness_owned_real_provider_calls: 0,
    harness_owned_network_calls: 0,
    authority: structuredClone(REAL_WORK_PILOT_AUTHORITY_V01),
  };
  return {
    ...core,
    integrity: {
      algorithm: "sha256",
      fingerprint_scope: "immediate_observation_without_integrity",
      fingerprint: fingerprintV01(core),
    },
  };
}

export function assertRealWorkPilotImmediateObservationV01(
  freezeValue: unknown,
  observationValue: unknown,
): asserts observationValue is RealWorkPilotImmediateObservationV01 {
  assertRealWorkPilotEpisodeFreezeV01(freezeValue);
  const observation = requireRecord(
    observationValue,
    "real_work_pilot_observation_not_object",
  ) as unknown as RealWorkPilotImmediateObservationV01;
  const rebuilt = recordImmediateRealWorkPilotObservationV01(freezeValue, {
    episode_id: observation.episode_id,
    workspace_id: observation.work_identity?.workspace_id,
    project_id: observation.work_identity?.project_id,
    work_id: observation.work_identity?.work_id,
    observed_at: observation.observed_at,
    measurements: observation.measurements,
  });
  if (
    canonicalizeProtocolValueV01(rebuilt) !==
    canonicalizeProtocolValueV01(observation)
  ) {
    refuse("real_work_pilot_observation_identity_or_fingerprint_invalid");
  }
}

export function recordLaterRealWorkPilotOutcomeReviewV01(
  freezeValue: unknown,
  observationValue: unknown,
  inputValue: unknown,
): RealWorkPilotLaterOutcomeReviewV01 {
  assertRealWorkPilotEpisodeFreezeV01(freezeValue);
  assertRealWorkPilotImmediateObservationV01(
    freezeValue,
    observationValue,
  );
  const freeze = freezeValue;
  const observation = observationValue;
  const input = parseLaterOutcomeReviewInputV01(inputValue);
  assertJoinScopeV01(freeze, input);
  if (Date.parse(input.reviewed_at) < Date.parse(observation.observed_at)) {
    refuse("real_work_pilot_review_precedes_observation");
  }
  const laterMeasurements = normalizeLaterMeasurementsV01(
    freeze.task_family,
    observation.measurements,
    input.later_measurements,
  );
  const core: Omit<RealWorkPilotLaterOutcomeReviewV01, "integrity"> = {
    artifact_version:
      REAL_WORK_CONTINUITY_BENEFIT_PILOT_ARTIFACT_VERSION_V01,
    artifact_kind: "later_source_linked_outcome_review",
    pilot_version: REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01,
    pilot_id: freeze.pilot_id,
    episode_id: freeze.episode_id,
    freeze_fingerprint: freeze.integrity.fingerprint,
    immediate_observation_fingerprint: observation.integrity.fingerprint,
    work_identity: structuredClone(freeze.work_identity),
    task_family: freeze.task_family,
    condition: freeze.condition,
    reviewed_at: input.reviewed_at,
    label: input.label,
    source_refs: normalizeSourceRefsV01(input.source_refs),
    later_measurements: laterMeasurements,
    limitations: [...input.limitations],
    causal_contribution: "not_inferred_from_presence_or_reference",
    authority: structuredClone(REAL_WORK_PILOT_AUTHORITY_V01),
  };
  return {
    ...core,
    integrity: {
      algorithm: "sha256",
      fingerprint_scope: "later_outcome_review_without_integrity",
      fingerprint: fingerprintV01(core),
    },
  };
}

export function assertRealWorkPilotLaterOutcomeReviewV01(
  freezeValue: unknown,
  observationValue: unknown,
  reviewValue: unknown,
): asserts reviewValue is RealWorkPilotLaterOutcomeReviewV01 {
  assertRealWorkPilotEpisodeFreezeV01(freezeValue);
  assertRealWorkPilotImmediateObservationV01(
    freezeValue,
    observationValue,
  );
  const review = requireRecord(
    reviewValue,
    "real_work_pilot_review_not_object",
  ) as unknown as RealWorkPilotLaterOutcomeReviewV01;
  const rebuilt = recordLaterRealWorkPilotOutcomeReviewV01(
    freezeValue,
    observationValue,
    {
      episode_id: review.episode_id,
      workspace_id: review.work_identity?.workspace_id,
      project_id: review.work_identity?.project_id,
      work_id: review.work_identity?.work_id,
      reviewed_at: review.reviewed_at,
      label: review.label,
      source_refs: review.source_refs,
      later_measurements: review.later_measurements,
      limitations: review.limitations,
    },
  );
  if (
    canonicalizeProtocolValueV01(rebuilt) !==
    canonicalizeProtocolValueV01(review)
  ) {
    refuse("real_work_pilot_review_identity_or_fingerprint_invalid");
  }
}

export function aggregateRealWorkContinuityBenefitPilotV01(input: {
  freezes: readonly RealWorkPilotEpisodeFreezeV01[];
  observations: readonly RealWorkPilotImmediateObservationV01[];
  reviews: readonly RealWorkPilotLaterOutcomeReviewV01[];
  generated_at: string;
}): RealWorkContinuityBenefitPilotReportV01 {
  requireTimestamp(input.generated_at, "real_work_pilot_report_timestamp_invalid");
  if (input.freezes.length === 0) {
    refuse("real_work_pilot_report_requires_episode_freeze");
  }
  const freezes = input.freezes.map((freeze) => {
    assertRealWorkPilotEpisodeFreezeV01(freeze);
    return freeze;
  });
  const first = freezes[0]!;
  const freezeById = new Map<string, RealWorkPilotEpisodeFreezeV01>();
  const occupiedSlots = new Set<string>();
  for (const freeze of freezes) {
    if (
      freeze.pilot_id !== first.pilot_id ||
      freeze.work_identity.workspace_id !== first.work_identity.workspace_id ||
      freeze.work_identity.project_id !== first.work_identity.project_id
    ) {
      refuse("real_work_pilot_report_cross_project_mismatch");
    }
    if (freezeById.has(freeze.episode_id)) {
      refuse("real_work_pilot_episode_identity_duplicate");
    }
    const slot = `${freeze.task_family}:${freeze.family_episode_index}`;
    if (occupiedSlots.has(slot)) {
      refuse("real_work_pilot_family_schedule_slot_duplicate");
    }
    occupiedSlots.add(slot);
    freezeById.set(freeze.episode_id, freeze);
  }
  if (freezes.length > 12) refuse("real_work_pilot_episode_limit_exceeded");

  const observationById = new Map<string, RealWorkPilotImmediateObservationV01>();
  for (const observation of input.observations) {
    const freeze = freezeById.get(observation.episode_id);
    if (!freeze) refuse("real_work_pilot_observation_without_freeze");
    if (observationById.has(observation.episode_id)) {
      refuse("real_work_pilot_observation_duplicate");
    }
    assertRealWorkPilotImmediateObservationV01(freeze, observation);
    observationById.set(observation.episode_id, observation);
  }

  const reviewById = new Map<string, RealWorkPilotLaterOutcomeReviewV01>();
  for (const review of input.reviews) {
    const freeze = freezeById.get(review.episode_id);
    const observation = observationById.get(review.episode_id);
    if (!freeze || !observation) {
      refuse("real_work_pilot_review_without_prior_stages");
    }
    if (reviewById.has(review.episode_id)) {
      refuse("real_work_pilot_review_duplicate");
    }
    assertRealWorkPilotLaterOutcomeReviewV01(freeze, observation, review);
    reviewById.set(review.episode_id, review);
  }

  const authentic = freezes.filter(
    (freeze) => freeze.authenticity === "authentic_real_work",
  );
  const counts = emptyFamilyConditionCountsV01();
  for (const freeze of authentic) counts[freeze.task_family][freeze.condition] += 1;
  const authenticIds = new Set(authentic.map((freeze) => freeze.episode_id));
  const authenticObservations = [...observationById.values()].filter((value) =>
    authenticIds.has(value.episode_id),
  );
  const authenticReviews = [...reviewById.values()].filter((value) =>
    authenticIds.has(value.episode_id),
  );
  const missingImmediate = authentic
    .filter((freeze) => !observationById.has(freeze.episode_id))
    .map((freeze) => freeze.episode_id)
    .sort();
  const missingLater = authentic
    .filter((freeze) => !reviewById.has(freeze.episode_id))
    .map((freeze) => freeze.episode_id)
    .sort();

  const distributions = {
    resume: buildFamilyMeasureDistributionsV01(
      "resume",
      authentic,
      observationById,
      reviewById,
    ),
    verify: buildFamilyMeasureDistributionsV01(
      "verify",
      authentic,
      observationById,
      reviewById,
    ),
    decide: buildFamilyMeasureDistributionsV01(
      "decide",
      authentic,
      observationById,
      reviewById,
    ),
  } satisfies RealWorkContinuityBenefitPilotReportV01["measure_distributions"];

  const laterLabels = emptyLaterLabelCountsV01();
  for (const review of authenticReviews) {
    laterLabels[review.task_family][review.condition][review.label] += 1;
  }
  const incidents = collectIncidentsV01(
    authentic,
    observationById,
    reviewById,
  );
  const complete =
    authentic.length === 12 &&
    authenticObservations.length === 12 &&
    authenticReviews.length === 12 &&
    REAL_WORK_PILOT_TASK_FAMILIES_V01.every(
      (family) => counts[family].B0 === 2 && counts[family].C1 === 2,
    );
  const disposition = deriveDispositionV01({
    complete,
    incidents,
    laterLabels,
    authentic,
    observationById,
    reviewById,
  });
  const limitations = uniqueStringsV01([
    "RW1 is a bounded within-user ecological pilot, not a definitive randomized trial.",
    "The deterministic ABBA schedule reduces simple order bias but does not remove task heterogeneity or temporal confounds.",
    "Continuity presence or reference does not establish causal contribution.",
    "B0 preserves normal task text, direct source inspection, and ordinary host capabilities, so its exact material may vary with authentic work.",
    authentic.length < 12
      ? `Authentic real-work collection is incomplete (${authentic.length}/12); synthetic test-only records are excluded.`
      : "All twelve authentic schedule slots are frozen.",
    ...authenticReviews.flatMap((review) => review.limitations),
  ]);
  const familyAsymmetries = REAL_WORK_PILOT_TASK_FAMILIES_V01.map((family) =>
    `${family}: B0=${counts[family].B0}, C1=${counts[family].C1}, later_helpful_B0=${laterLabels[family].B0.helpful}, later_helpful_C1=${laterLabels[family].C1.helpful}, later_misleading_or_harmful_B0=${laterLabels[family].B0.misleading + laterLabels[family].B0.harmful_transfer_candidate}, later_misleading_or_harmful_C1=${laterLabels[family].C1.misleading + laterLabels[family].C1.harmful_transfer_candidate}`,
  );
  const allDistributions = Object.values(distributions).flat();
  const core: Omit<RealWorkContinuityBenefitPilotReportV01, "integrity"> = {
    report_version: REAL_WORK_CONTINUITY_BENEFIT_PILOT_REPORT_VERSION_V01,
    pilot_version: REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01,
    pilot_id: first.pilot_id,
    workspace_id: first.work_identity.workspace_id,
    project_id: first.work_identity.project_id,
    generated_at: input.generated_at,
    schedule: {
      families: ["resume", "verify", "decide"],
      per_family: ["B0", "C1", "C1", "B0"],
      maximum_authentic_episodes: 12,
      adaptive_reassignment: false,
    },
    authentic_episode_count: authentic.length,
    synthetic_test_only_excluded_count: freezes.length - authentic.length,
    pilot_complete: complete,
    counts_by_family_condition: counts,
    stage_completeness: {
      frozen: authentic.length,
      immediate_observation: authenticObservations.length,
      later_outcome_review: authenticReviews.length,
      missing_immediate_episode_ids: missingImmediate,
      missing_later_review_episode_ids: missingLater,
    },
    measure_distributions: distributions,
    burden: {
      manual_interventions: allDistributions.filter(
        (entry) => entry.measure === "cross_manual_interventions_count",
      ),
      additional_review_steps: allDistributions.filter(
        (entry) => entry.measure === "cross_additional_review_steps",
      ),
      explanation_protocol_burden: allDistributions.filter(
        (entry) => entry.measure === "cross_explanation_protocol_burden_steps",
      ),
    },
    incidents,
    later_labels_by_family_condition: laterLabels,
    family_specific_asymmetries: familyAsymmetries,
    baseline_comparison: {
      method: "bounded_descriptive_raw_distributions",
      significance_claim: false,
      scalar_score: false,
      global_winner: false,
      notes: REAL_WORK_PILOT_TASK_FAMILIES_V01.map(
        (family) =>
          `${family} retains separate B0 and C1 raw values, missingness, burden, and later labels.`,
      ),
    },
    disposition,
    disposition_authority: "review_material_only",
    limitations_and_confounds: limitations,
    harness_owned_real_provider_calls: 0,
    harness_owned_network_calls: 0,
    authority: structuredClone(REAL_WORK_PILOT_AUTHORITY_V01),
  };
  return {
    ...core,
    integrity: {
      algorithm: "sha256",
      fingerprint_scope: "pilot_report_without_integrity",
      fingerprint: fingerprintV01(core),
    },
  };
}

export function formatRealWorkContinuityBenefitPilotMarkdownV01(
  report: RealWorkContinuityBenefitPilotReportV01,
): string {
  const lines = [
    "# Real-work continuity benefit pilot",
    "",
    `Pilot: \`${report.pilot_id}\``,
    `Disposition: \`${report.disposition}\` (review material only)`,
    `Authentic episodes: ${report.authentic_episode_count}/12`,
    `Synthetic test-only records excluded: ${report.synthetic_test_only_excluded_count}`,
    `Immediate observations: ${report.stage_completeness.immediate_observation}`,
    `Later outcome reviews: ${report.stage_completeness.later_outcome_review}`,
    "Harness-owned real provider calls: 0",
    "Harness-owned network calls: 0",
    "",
    "## Schedule and counts",
    "",
    "| Family | B0 | C1 |",
    "|---|---:|---:|",
    ...REAL_WORK_PILOT_TASK_FAMILIES_V01.map(
      (family) =>
        `| ${family} | ${report.counts_by_family_condition[family].B0} | ${report.counts_by_family_condition[family].C1} |`,
    ),
    "",
    "ABBA is fixed within every family: `B0 → C1 → C1 → B0`. Missing authentic work remains incomplete.",
    "",
    "## Harm and burden visibility",
    "",
    `- Harmful/stale transfer observations: ${renderIds(report.incidents.harmful_or_stale_transfer_episode_ids)}`,
    `- Harmful-transfer labels: ${renderIds(report.incidents.harmful_transfer_label_episode_ids)}`,
    `- Misleading labels: ${renderIds(report.incidents.misleading_label_episode_ids)}`,
    `- Misleading confidence/false attention: ${renderIds(report.incidents.misleading_confidence_or_false_attention_episode_ids)}`,
    `- Authority drift: ${renderIds(report.incidents.authority_drift_episode_ids)}`,
    "",
    "## Family-specific comparison",
    "",
    ...report.family_specific_asymmetries.map((entry) => `- ${entry}`),
    "",
    "## Missingness",
    "",
    `- Missing immediate observations: ${renderIds(report.stage_completeness.missing_immediate_episode_ids)}`,
    `- Missing later reviews: ${renderIds(report.stage_completeness.missing_later_review_episode_ids)}`,
    "",
    "## Limitations and confounds",
    "",
    ...report.limitations_and_confounds.map((entry) => `- ${entry}`),
    "",
    "No significance claim, scalar score, rank, global winner, Evidence, Decision, policy, Transition, promotion, or causal contribution is created by this report.",
    "",
  ];
  return lines.join("\n");
}

function parseFreezeInputV01(value: unknown): RealWorkPilotEpisodeFreezeInputV01 {
  const input = requireRecord(value, "real_work_pilot_freeze_input_not_object");
  assertExactKeys(input, [
    "authenticity",
    "task_family",
    "family_episode_index",
    "workspace_id",
    "project_id",
    "work_id",
    "source_refs",
    "natural_task_goal",
    "success_or_verification_criteria",
    "known_constraints",
    "baseline_material",
    "continuity_material",
    "freeze_timestamp",
    "outcome_known_at_freeze",
  ], "real_work_pilot_freeze_input_keys_invalid");
  if (!AUTHENTICITY_VALUES.has(input.authenticity as RealWorkPilotAuthenticityV01)) {
    refuse("real_work_pilot_authenticity_invalid");
  }
  if (!REAL_WORK_PILOT_TASK_FAMILIES_V01.includes(input.task_family as RealWorkPilotTaskFamilyV01)) {
    refuse("real_work_pilot_task_family_invalid");
  }
  conditionForRealWorkPilotEpisodeV01(input.family_episode_index as number);
  const workspaceId = boundedString(input.workspace_id, "workspace_id", MAX_SHORT_TEXT);
  const projectId = boundedString(input.project_id, "project_id", MAX_SHORT_TEXT);
  const workId = boundedString(input.work_id, "work_id", MAX_SHORT_TEXT);
  const sourceRefs = parseSourceRefsV01(input.source_refs, true);
  const goal = boundedString(input.natural_task_goal, "natural_task_goal", MAX_TEXT);
  const criteria = boundedStringArray(input.success_or_verification_criteria, "success_or_verification_criteria");
  const constraints = boundedStringArray(input.known_constraints, "known_constraints");
  const baseline = normalizeBaselineMaterialV01(input.baseline_material);
  const continuity = input.continuity_material === null
    ? null
    : normalizeContinuityMaterialV01(input.continuity_material);
  const freezeTimestamp = requireTimestamp(input.freeze_timestamp, "real_work_pilot_freeze_timestamp_invalid");
  if (input.outcome_known_at_freeze !== false) {
    refuse("real_work_pilot_hindsight_forbidden_at_freeze");
  }
  return {
    authenticity: input.authenticity as RealWorkPilotAuthenticityV01,
    task_family: input.task_family as RealWorkPilotTaskFamilyV01,
    family_episode_index: input.family_episode_index as 1 | 2 | 3 | 4,
    workspace_id: workspaceId,
    project_id: projectId,
    work_id: workId,
    source_refs: sourceRefs,
    natural_task_goal: goal,
    success_or_verification_criteria: criteria,
    known_constraints: constraints,
    baseline_material: baseline,
    continuity_material: continuity,
    freeze_timestamp: freezeTimestamp,
    outcome_known_at_freeze: false,
  };
}

function parseImmediateObservationInputV01(
  value: unknown,
): RealWorkPilotImmediateObservationInputV01 {
  const input = requireRecord(value, "real_work_pilot_observation_input_not_object");
  assertExactKeys(input, [
    "episode_id",
    "workspace_id",
    "project_id",
    "work_id",
    "observed_at",
    "measurements",
  ], "real_work_pilot_observation_input_keys_invalid");
  return {
    episode_id: boundedString(input.episode_id, "episode_id", MAX_SHORT_TEXT),
    workspace_id: boundedString(input.workspace_id, "workspace_id", MAX_SHORT_TEXT),
    project_id: boundedString(input.project_id, "project_id", MAX_SHORT_TEXT),
    work_id: boundedString(input.work_id, "work_id", MAX_SHORT_TEXT),
    observed_at: requireTimestamp(input.observed_at, "real_work_pilot_observed_at_invalid"),
    measurements: parseMeasureMapV01(input.measurements),
  };
}

function parseLaterOutcomeReviewInputV01(
  value: unknown,
): RealWorkPilotLaterOutcomeReviewInputV01 {
  const input = requireRecord(value, "real_work_pilot_review_input_not_object");
  assertExactKeys(input, [
    "episode_id",
    "workspace_id",
    "project_id",
    "work_id",
    "reviewed_at",
    "label",
    "source_refs",
    "later_measurements",
    "limitations",
  ], "real_work_pilot_review_input_keys_invalid");
  if (!LATER_LABELS.has(input.label as RealWorkPilotLaterOutcomeLabelV01)) {
    refuse("real_work_pilot_later_label_invalid");
  }
  return {
    episode_id: boundedString(input.episode_id, "episode_id", MAX_SHORT_TEXT),
    workspace_id: boundedString(input.workspace_id, "workspace_id", MAX_SHORT_TEXT),
    project_id: boundedString(input.project_id, "project_id", MAX_SHORT_TEXT),
    work_id: boundedString(input.work_id, "work_id", MAX_SHORT_TEXT),
    reviewed_at: requireTimestamp(input.reviewed_at, "real_work_pilot_reviewed_at_invalid"),
    label: input.label as RealWorkPilotLaterOutcomeLabelV01,
    source_refs: parseSourceRefsV01(input.source_refs, true),
    later_measurements: parseMeasureMapV01(input.later_measurements),
    limitations: boundedStringArray(input.limitations, "limitations"),
  };
}

function materializeImmediateMeasureSetV01(
  family: RealWorkPilotTaskFamilyV01,
  supplied: Partial<RealWorkPilotMeasureSetV01>,
): RealWorkPilotMeasureSetV01 {
  const result = {} as RealWorkPilotMeasureSetV01;
  for (const key of REAL_WORK_PILOT_MEASURE_KEYS_V01) {
    const definition = REAL_WORK_PILOT_MEASURE_DEFINITIONS_V01[key];
    const applicable = definition.family === "cross" || definition.family === family;
    const value = supplied[key];
    if (!applicable) {
      if (value?.status === "observed") {
        refuse("real_work_pilot_measure_family_mismatch");
      }
      result[key] = { status: "unknown", reason: "not_applicable_to_task_family" };
      continue;
    }
    if (definition.later_only && value?.status === "observed") {
      refuse("real_work_pilot_later_measure_observed_immediately");
    }
    result[key] = value ?? { status: "unknown", reason: "not_observed" };
  }
  return result;
}

function normalizeLaterMeasurementsV01(
  family: RealWorkPilotTaskFamilyV01,
  immediate: RealWorkPilotMeasureSetV01,
  supplied: Partial<RealWorkPilotMeasureSetV01>,
): Partial<RealWorkPilotMeasureSetV01> {
  const result: Partial<RealWorkPilotMeasureSetV01> = {};
  for (const [rawKey, value] of Object.entries(supplied)) {
    const key = rawKey as RealWorkPilotMeasureKeyV01;
    const definition = REAL_WORK_PILOT_MEASURE_DEFINITIONS_V01[key];
    if (!definition || (definition.family !== "cross" && definition.family !== family)) {
      refuse("real_work_pilot_later_measure_family_mismatch");
    }
    if (immediate[key].status === "observed") {
      refuse("real_work_pilot_later_measure_cannot_rewrite_immediate");
    }
    if (
      value.status === "observed" &&
      !definition.exact_receipt_required &&
      value.basis !== "later_source_linked_review"
    ) {
      refuse("real_work_pilot_later_measure_basis_invalid");
    }
    result[key] = value;
  }
  return result;
}

function parseMeasureMapV01(
  value: unknown,
): Partial<RealWorkPilotMeasureSetV01> {
  const record = requireRecord(value, "real_work_pilot_measure_map_not_object");
  const result: Partial<RealWorkPilotMeasureSetV01> = {};
  for (const [rawKey, rawObservation] of Object.entries(record)) {
    if (!(rawKey in REAL_WORK_PILOT_MEASURE_DEFINITIONS_V01)) {
      refuse("real_work_pilot_measure_key_unknown");
    }
    const key = rawKey as RealWorkPilotMeasureKeyV01;
    result[key] = parseMeasureObservationV01(key, rawObservation);
  }
  return result;
}

function parseMeasureObservationV01(
  key: RealWorkPilotMeasureKeyV01,
  value: unknown,
): RealWorkPilotMeasureObservationV01 {
  const record = requireRecord(value, "real_work_pilot_measure_observation_not_object");
  if (record.status === "unknown") {
    assertExactKeys(record, ["status", "reason"], "real_work_pilot_unknown_measure_keys_invalid");
    return {
      status: "unknown",
      reason: boundedString(record.reason, "unknown_measure_reason", MAX_SHORT_TEXT),
    };
  }
  if (record.status !== "observed") {
    refuse("real_work_pilot_measure_status_invalid");
  }
  assertExactKeys(record, ["status", "value", "basis", "source_refs"], "real_work_pilot_observed_measure_keys_invalid");
  const definition = REAL_WORK_PILOT_MEASURE_DEFINITIONS_V01[key];
  const basis = record.basis as RealWorkPilotObservationBasisV01;
  if (![
    "direct_observation",
    "bounded_human_review",
    "existing_safe_receipt",
    "later_source_linked_review",
  ].includes(basis)) {
    refuse("real_work_pilot_measure_basis_invalid");
  }
  const sourceRefs = parseSourceRefsV01(record.source_refs, true);
  if (definition.exact_receipt_required) {
    if (
      basis !== "existing_safe_receipt" ||
      !sourceRefs.some((ref) => ref.ref_kind === "run_receipt")
    ) {
      refuse("real_work_pilot_exact_receipt_measure_unbound");
    }
  }
  const observedValue = parseMeasureValueV01(definition, record.value);
  return { status: "observed", value: observedValue, basis, source_refs: sourceRefs };
}

function parseMeasureValueV01(
  definition: MeasureDefinitionV01,
  value: unknown,
): RealWorkPilotMeasureValueV01 {
  if (definition.value_kind === "nonnegative_integer") {
    if (!Number.isSafeInteger(value) || (value as number) < 0) {
      refuse("real_work_pilot_numeric_measure_invalid");
    }
    return value as number;
  }
  if (definition.value_kind === "boolean") {
    if (typeof value !== "boolean") refuse("real_work_pilot_boolean_measure_invalid");
    return value;
  }
  if (!PRIVACY_EGRESS_CLASSES.has(value as RealWorkPilotPrivacyEgressClassV01)) {
    refuse("real_work_pilot_privacy_egress_class_invalid");
  }
  return value as RealWorkPilotPrivacyEgressClassV01;
}

function normalizeBaselineMaterialV01(
  value: unknown,
): RealWorkPilotBaselineMaterialIdentityV01 {
  const material = requireRecord(value, "real_work_pilot_baseline_material_not_object");
  assertExactKeys(material, [
    "material_kind",
    "material_ref",
    "material_fingerprint",
    "normal_user_task_text_allowed",
    "direct_source_inspection_allowed",
    "ordinary_host_capabilities_allowed",
    "safety_or_authority_critical_material_withheld",
    "evaluated_c1_projection_included",
  ], "real_work_pilot_baseline_material_keys_invalid");
  if (
    material.material_kind !== "direct_host_manual_handoff" ||
    material.normal_user_task_text_allowed !== true ||
    material.direct_source_inspection_allowed !== true ||
    material.ordinary_host_capabilities_allowed !== true ||
    material.safety_or_authority_critical_material_withheld !== false ||
    material.evaluated_c1_projection_included !== false
  ) {
    refuse("real_work_pilot_baseline_integrity_invalid");
  }
  return {
    material_kind: "direct_host_manual_handoff",
    material_ref: boundedString(material.material_ref, "baseline_material_ref", MAX_SHORT_TEXT),
    material_fingerprint: requireFingerprint(material.material_fingerprint, "baseline_material_fingerprint"),
    normal_user_task_text_allowed: true,
    direct_source_inspection_allowed: true,
    ordinary_host_capabilities_allowed: true,
    safety_or_authority_critical_material_withheld: false,
    evaluated_c1_projection_included: false,
  };
}

function normalizeContinuityMaterialV01(
  value: unknown,
): RealWorkPilotContinuityMaterialIdentityV01 {
  const material = requireRecord(value, "real_work_pilot_continuity_material_not_object");
  assertExactKeys(material, [
    "material_kind",
    "owner",
    "source_status",
    "snapshot_status",
    "snapshot_binding",
    "material_ref",
    "material_fingerprint",
    "automatic_injection",
    "hidden_or_unreviewed_material",
    "policy_injection",
  ], "real_work_pilot_continuity_material_keys_invalid");
  const owner = requireRecord(material.owner, "real_work_pilot_c1_owner_not_object");
  if (
    canonicalizeProtocolValueV01(owner) !==
      canonicalizeProtocolValueV01(REAL_WORK_PILOT_C1_OWNER_V01) ||
    material.material_kind !== "codex_current_continuity_projection" ||
    material.source_status !== "exact" ||
    material.snapshot_status !== "exact" ||
    material.automatic_injection !== false ||
    material.hidden_or_unreviewed_material !== false ||
    material.policy_injection !== false
  ) {
    refuse("real_work_pilot_c1_owner_or_boundary_invalid");
  }
  const snapshotBinding = requireFingerprint(material.snapshot_binding, "continuity_snapshot_binding");
  const materialFingerprint = requireFingerprint(material.material_fingerprint, "continuity_material_fingerprint");
  if (snapshotBinding !== materialFingerprint) {
    refuse("real_work_pilot_c1_snapshot_material_mismatch");
  }
  return {
    material_kind: "codex_current_continuity_projection",
    owner: structuredClone(REAL_WORK_PILOT_C1_OWNER_V01),
    source_status: "exact",
    snapshot_status: "exact",
    snapshot_binding: snapshotBinding,
    material_ref: boundedString(material.material_ref, "continuity_material_ref", MAX_SHORT_TEXT),
    material_fingerprint: materialFingerprint,
    automatic_injection: false,
    hidden_or_unreviewed_material: false,
    policy_injection: false,
  };
}

function parseSourceRefsV01(value: unknown, requireAtLeastOne: boolean): RealWorkPilotSourceRefV01[] {
  if (!Array.isArray(value) || value.length > MAX_SOURCE_REFS || (requireAtLeastOne && value.length === 0)) {
    refuse("real_work_pilot_source_refs_invalid");
  }
  return normalizeSourceRefsV01(value.map((raw) => {
    const ref = requireRecord(raw, "real_work_pilot_source_ref_not_object");
    assertExactKeys(ref, ["ref_kind", "ref", "fingerprint", "revision"], "real_work_pilot_source_ref_keys_invalid");
    if (!SOURCE_REF_KINDS.has(ref.ref_kind as RealWorkPilotSourceRefKindV01)) {
      refuse("real_work_pilot_source_ref_kind_invalid");
    }
    return {
      ref_kind: ref.ref_kind as RealWorkPilotSourceRefKindV01,
      ref: boundedString(ref.ref, "source_ref", MAX_SHORT_TEXT),
      fingerprint: requireFingerprint(ref.fingerprint, "source_ref_fingerprint"),
      revision: ref.revision === null ? null : boundedString(ref.revision, "source_ref_revision", MAX_SHORT_TEXT),
    };
  }));
}

function normalizeSourceRefsV01(refs: readonly RealWorkPilotSourceRefV01[]): RealWorkPilotSourceRefV01[] {
  const normalized = refs.map((ref) => structuredClone(ref)).sort((left, right) =>
    canonicalizeProtocolValueV01(left).localeCompare(canonicalizeProtocolValueV01(right)),
  );
  for (let index = 1; index < normalized.length; index += 1) {
    if (canonicalizeProtocolValueV01(normalized[index - 1]) === canonicalizeProtocolValueV01(normalized[index])) {
      refuse("real_work_pilot_source_ref_duplicate");
    }
  }
  return normalized;
}

function createWorkIdentityV01(input: { workspace_id: string; project_id: string; work_id: string }): RealWorkPilotWorkIdentityV01 {
  return {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    work_id: input.work_id,
    identity_fingerprint: fingerprintV01({
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      work_id: input.work_id,
    }),
  };
}

function assertJoinScopeV01(
  freeze: RealWorkPilotEpisodeFreezeV01,
  input: { episode_id: string; workspace_id: string; project_id: string; work_id: string },
): void {
  if (
    input.episode_id !== freeze.episode_id ||
    input.workspace_id !== freeze.work_identity.workspace_id ||
    input.project_id !== freeze.work_identity.project_id ||
    input.work_id !== freeze.work_identity.work_id
  ) {
    refuse("real_work_pilot_cross_project_or_work_join_refused");
  }
}

function buildFamilyMeasureDistributionsV01(
  family: RealWorkPilotTaskFamilyV01,
  authentic: readonly RealWorkPilotEpisodeFreezeV01[],
  observations: ReadonlyMap<string, RealWorkPilotImmediateObservationV01>,
  reviews: ReadonlyMap<string, RealWorkPilotLaterOutcomeReviewV01>,
): RealWorkPilotMeasureDistributionV01[] {
  const familyEpisodes = authentic.filter((freeze) => freeze.task_family === family);
  return REAL_WORK_PILOT_MEASURE_KEYS_V01.filter((key) => {
    const definition = REAL_WORK_PILOT_MEASURE_DEFINITIONS_V01[key];
    return definition.family === "cross" || definition.family === family;
  }).map((measure) => {
    const distribution: RealWorkPilotMeasureDistributionV01 = {
      measure,
      B0: { observed_values: [], unknown_count: 0 },
      C1: { observed_values: [], unknown_count: 0 },
    };
    for (const freeze of familyEpisodes) {
      const effective = effectiveMeasureObservationV01(
        measure,
        observations.get(freeze.episode_id),
        reviews.get(freeze.episode_id),
      );
      if (effective.status === "observed") {
        distribution[freeze.condition].observed_values.push(effective.value);
      } else {
        distribution[freeze.condition].unknown_count += 1;
      }
    }
    distribution.B0.observed_values.sort(compareMeasureValuesV01);
    distribution.C1.observed_values.sort(compareMeasureValuesV01);
    return distribution;
  });
}

function effectiveMeasureObservationV01(
  key: RealWorkPilotMeasureKeyV01,
  observation: RealWorkPilotImmediateObservationV01 | undefined,
  review: RealWorkPilotLaterOutcomeReviewV01 | undefined,
): RealWorkPilotMeasureObservationV01 {
  const immediate = observation?.measurements[key];
  if (immediate?.status === "observed") return immediate;
  const later = review?.later_measurements[key];
  return later ?? immediate ?? { status: "unknown", reason: "stage_missing" };
}

function collectIncidentsV01(
  authentic: readonly RealWorkPilotEpisodeFreezeV01[],
  observations: ReadonlyMap<string, RealWorkPilotImmediateObservationV01>,
  reviews: ReadonlyMap<string, RealWorkPilotLaterOutcomeReviewV01>,
): RealWorkContinuityBenefitPilotReportV01["incidents"] {
  const authenticEpisodeIds = new Set(
    authentic.map((freeze) => freeze.episode_id),
  );
  const withTrue = (key: RealWorkPilotMeasureKeyV01) => authentic
    .filter((freeze) => {
      const measure = effectiveMeasureObservationV01(
        key,
        observations.get(freeze.episode_id),
        reviews.get(freeze.episode_id),
      );
      return measure.status === "observed" && measure.value === true;
    })
    .map((freeze) => freeze.episode_id)
    .sort();
  return {
    harmful_or_stale_transfer_episode_ids: withTrue("cross_stale_or_harmful_transfer"),
    misleading_confidence_or_false_attention_episode_ids: withTrue("cross_misleading_confidence_or_false_attention"),
    authority_drift_episode_ids: withTrue("cross_authority_drift"),
    harmful_transfer_label_episode_ids: [...reviews.values()]
      .filter(
        (review) =>
          authenticEpisodeIds.has(review.episode_id) &&
          review.label === "harmful_transfer_candidate",
      )
      .map((review) => review.episode_id)
      .sort(),
    misleading_label_episode_ids: [...reviews.values()]
      .filter(
        (review) =>
          authenticEpisodeIds.has(review.episode_id) &&
          review.label === "misleading",
      )
      .map((review) => review.episode_id)
      .sort(),
  };
}

function deriveDispositionV01(input: {
  complete: boolean;
  incidents: RealWorkContinuityBenefitPilotReportV01["incidents"];
  laterLabels: RealWorkContinuityBenefitPilotReportV01["later_labels_by_family_condition"];
  authentic: readonly RealWorkPilotEpisodeFreezeV01[];
  observationById: ReadonlyMap<string, RealWorkPilotImmediateObservationV01>;
  reviewById: ReadonlyMap<string, RealWorkPilotLaterOutcomeReviewV01>;
}): RealWorkPilotDispositionV01 {
  let positiveFamilies = 0;
  let burdenDominantFamilies = 0;
  for (const family of REAL_WORK_PILOT_TASK_FAMILIES_V01) {
    const labels = input.laterLabels[family];
    if (
      labels.C1.helpful > labels.B0.helpful &&
      labels.C1.misleading === 0 &&
      labels.C1.harmful_transfer_candidate === 0
    ) {
      positiveFamilies += 1;
    }
    const b0Burden = sumObservedForFamilyConditionV01(
      input.authentic,
      input.observationById,
      input.reviewById,
      family,
      "B0",
      "cross_additional_review_steps",
    );
    const c1Burden = sumObservedForFamilyConditionV01(
      input.authentic,
      input.observationById,
      input.reviewById,
      family,
      "C1",
      "cross_additional_review_steps",
    );
    if (
      b0Burden !== null &&
      c1Burden !== null &&
      c1Burden > b0Burden &&
      labels.C1.helpful <= labels.B0.helpful
    ) {
      burdenDominantFamilies += 1;
    }
  }
  return deriveRealWorkPilotDispositionFromReviewedSignalsV01({
    complete: input.complete,
    harmful_or_stale_transfer_incidents:
      input.incidents.harmful_or_stale_transfer_episode_ids.length,
    authority_drift_incidents: input.incidents.authority_drift_episode_ids.length,
    harmful_transfer_labels:
      input.incidents.harmful_transfer_label_episode_ids.length,
    positive_family_signals: positiveFamilies,
    burden_dominant_family_signals: burdenDominantFamilies,
  });
}

export function deriveRealWorkPilotDispositionFromReviewedSignalsV01(input: {
  complete: boolean;
  harmful_or_stale_transfer_incidents: number;
  authority_drift_incidents: number;
  harmful_transfer_labels: number;
  positive_family_signals: number;
  burden_dominant_family_signals: number;
}): RealWorkPilotDispositionV01 {
  const counts = Object.values(input).filter(
    (value): value is number => typeof value === "number",
  );
  if (
    counts.some(
      (value) => !Number.isSafeInteger(value) || value < 0,
    ) ||
    input.positive_family_signals > 3 ||
    input.burden_dominant_family_signals > 3
  ) {
    refuse("real_work_pilot_disposition_signal_count_invalid");
  }
  if (!input.complete) return "insufficient_real_work";
  if (
    input.harmful_or_stale_transfer_incidents > 0 ||
    input.authority_drift_incidents > 0 ||
    input.harmful_transfer_labels > 0
  ) {
    return "harm_signal_candidate";
  }
  if (input.positive_family_signals === 3) {
    return "positive_signal_candidate";
  }
  if (input.burden_dominant_family_signals === 3) {
    return "burden_dominant_candidate";
  }
  return "mixed_or_family_specific";
}

function sumObservedForFamilyConditionV01(
  authentic: readonly RealWorkPilotEpisodeFreezeV01[],
  observations: ReadonlyMap<string, RealWorkPilotImmediateObservationV01>,
  reviews: ReadonlyMap<string, RealWorkPilotLaterOutcomeReviewV01>,
  family: RealWorkPilotTaskFamilyV01,
  condition: RealWorkPilotConditionV01,
  key: RealWorkPilotMeasureKeyV01,
): number | null {
  const values = authentic
    .filter((freeze) => freeze.task_family === family && freeze.condition === condition)
    .map((freeze) => effectiveMeasureObservationV01(
      key,
      observations.get(freeze.episode_id),
      reviews.get(freeze.episode_id),
    ));
  if (values.length === 0 || values.some((value) => value.status !== "observed" || typeof value.value !== "number")) {
    return null;
  }
  return values.reduce(
    (sum, value) => sum + (value.status === "observed" && typeof value.value === "number" ? value.value : 0),
    0,
  );
}

function emptyFamilyConditionCountsV01(): RealWorkContinuityBenefitPilotReportV01["counts_by_family_condition"] {
  return {
    resume: { B0: 0, C1: 0 },
    verify: { B0: 0, C1: 0 },
    decide: { B0: 0, C1: 0 },
  };
}

function emptyLaterLabelCountsV01(): RealWorkContinuityBenefitPilotReportV01["later_labels_by_family_condition"] {
  const empty = () => ({
    helpful: 0,
    neutral: 0,
    misleading: 0,
    harmful_transfer_candidate: 0,
    insufficient_unknown: 0,
  });
  return {
    resume: { B0: empty(), C1: empty() },
    verify: { B0: empty(), C1: empty() },
    decide: { B0: empty(), C1: empty() },
  };
}

export function deriveRealWorkPilotIdV01(
  workspaceId: string,
  projectId: string,
): string {
  const hash = fingerprintV01({
    pilot_version: REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01,
    workspace_id: workspaceId,
    project_id: projectId,
  });
  return `rw1-pilot_${hash.slice("sha256:".length, 39)}`;
}

function fingerprintV01(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function numeric(
  family: RealWorkPilotTaskFamilyV01 | "cross",
  laterOnly = false,
  exactReceiptRequired = false,
): MeasureDefinitionV01 {
  return {
    family,
    value_kind: "nonnegative_integer",
    later_only: laterOnly,
    exact_receipt_required: exactReceiptRequired,
  };
}

function bool(
  family: RealWorkPilotTaskFamilyV01 | "cross",
  laterOnly = false,
): MeasureDefinitionV01 {
  return {
    family,
    value_kind: "boolean",
    later_only: laterOnly,
    exact_receipt_required: false,
  };
}

function privacy(): MeasureDefinitionV01 {
  return {
    family: "cross",
    value_kind: "privacy_egress_class",
    later_only: false,
    exact_receipt_required: false,
  };
}

function boundedString(value: unknown, name: string, maximum: number): string {
  if (typeof value !== "string") refuse(`real_work_pilot_${name}_not_string`);
  const normalized = value.trim();
  if (!normalized || Buffer.byteLength(normalized, "utf8") > maximum) {
    refuse(`real_work_pilot_${name}_out_of_bounds`);
  }
  assertPrivacySafeStringV01(normalized);
  return normalized;
}

function boundedStringArray(value: unknown, name: string): string[] {
  if (!Array.isArray(value) || value.length > MAX_LIST_ITEMS) {
    refuse(`real_work_pilot_${name}_invalid`);
  }
  return value.map((entry) => boundedString(entry, name, MAX_SHORT_TEXT));
}

function requireTimestamp(value: unknown, code: string): string {
  if (typeof value !== "string" || parseStrictIsoTimestampV01(value) === null) {
    refuse(code);
  }
  return value;
}

function requireFingerprint(value: unknown, name: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) {
    refuse(`real_work_pilot_${name}_invalid`);
  }
  return value;
}

function requireRecord(value: unknown, code: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    refuse(code);
  }
  return value as Record<string, unknown>;
}

function assertExactKeys(
  record: Record<string, unknown>,
  expected: readonly string[],
  code: string,
): void {
  const actual = Object.keys(record).sort();
  const wanted = [...expected].sort();
  if (canonicalizeProtocolValueV01(actual) !== canonicalizeProtocolValueV01(wanted)) {
    refuse(code);
  }
}

function assertPrivacySafeStringV01(value: string): void {
  if (SECRET_PATTERNS.some((pattern) => pattern.test(value))) {
    refuse("real_work_pilot_secret_like_material_refused");
  }
}

function compareMeasureValuesV01(
  left: RealWorkPilotMeasureValueV01,
  right: RealWorkPilotMeasureValueV01,
): number {
  return canonicalizeProtocolValueV01(left).localeCompare(
    canonicalizeProtocolValueV01(right),
  );
}

function uniqueStringsV01(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function renderIds(values: readonly string[]): string {
  return values.length === 0 ? "none observed" : values.map((value) => `\`${value}\``).join(", ");
}

function refuse(code: string): never {
  throw new RealWorkContinuityBenefitPilotErrorV01(code);
}
