import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  REAL_WORK_PILOT_AUTHORITY_V01,
  REAL_WORK_PILOT_TASK_FAMILIES_V01,
  assertRealWorkPilotEpisodeFreezeV01,
} from "@/lib/vnext/real-work-continuity-benefit-pilot";
import {
  REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01,
  type RealWorkPilotAuthenticityV01,
  type RealWorkPilotConditionV01,
  type RealWorkPilotEpisodeFreezeV01,
  type RealWorkPilotTaskFamilyV01,
} from "@/types/vnext/real-work-continuity-benefit-pilot";
import {
  REAL_WORK_CONTINUITY_PRE_ACTION_OVERLAY_ARTIFACT_VERSION_V01,
  REAL_WORK_CONTINUITY_PRE_ACTION_OVERLAY_REPORT_VERSION_V01,
  REAL_WORK_CONTINUITY_PRE_ACTION_OVERLAY_VERSION_V01,
  type RealWorkContinuityPreActionOverlayInputV01,
  type RealWorkContinuityPreActionOverlayMethodBoundaryV01,
  type RealWorkContinuityPreActionOverlayReportV01,
  type RealWorkContinuityPreActionOverlayV01,
  type RealWorkPreActionAmbientOverlapV01,
  type RealWorkPreActionC1RetrievalV01,
  type RealWorkPreActionClassificationBasisV01,
  type RealWorkPreActionConditionIntegrityV01,
  type RealWorkPreActionExposureObservationBasisV01,
  type RealWorkPreActionPresentationChannelV01,
  type RealWorkPreActionPresentationTargetV01,
  type RealWorkPreActionSnapshotPresentedV01,
  type RealWorkPreActionSourceCurrentnessV01,
  type RealWorkPreActionTaskMixDiagnosticV01,
  type RealWorkPreActionTimingBasisV01,
  type RealWorkPreActionWorkDomainV01,
  type RealWorkPreActionWorkPhaseV01,
} from "@/types/vnext/real-work-continuity-pre-action-overlay";

export const REAL_WORK_PRE_ACTION_WORK_DOMAINS_V01 = [
  "software_engineering",
  "research_synthesis",
  "long_form_writing",
  "general_planning",
  "design_context_maintenance",
  "investigation_open_ended",
  "data_analysis_modeling",
  "operational_casework",
  "learning_skill_development",
  "long_running_selection_procurement",
  "mixed",
  "other_bounded",
  "unknown",
] as const satisfies readonly RealWorkPreActionWorkDomainV01[];

export const REAL_WORK_PRE_ACTION_WORK_PHASES_V01 = [
  "orientation",
  "exploration",
  "convergence",
  "production",
  "validation_review",
  "closure_handoff",
  "mixed_or_unknown",
] as const satisfies readonly RealWorkPreActionWorkPhaseV01[];

export const REAL_WORK_PRE_ACTION_CLASSIFICATION_BASES_V01 = [
  "user_declared",
  "source_artifact_bound",
  "bounded_reviewer",
  "unknown",
] as const satisfies readonly RealWorkPreActionClassificationBasisV01[];

export const REAL_WORK_PRE_ACTION_CONDITION_INTEGRITIES_V01 = [
  "valid_for_comparison",
  "confounded",
  "continuity_unavailable",
  "source_currentness_invalid",
  "exposure_unknown",
] as const satisfies readonly RealWorkPreActionConditionIntegrityV01[];

export const REAL_WORK_PRE_ACTION_PRESENTATION_TARGETS_V01 = [
  "user",
  "acting_host",
  "both",
  "not_applicable",
  "unknown",
] as const satisfies readonly RealWorkPreActionPresentationTargetV01[];

export const REAL_WORK_PRE_ACTION_PRESENTATION_CHANNELS_V01 = [
  "exact_tool_projection",
  "host_context",
  "user_supplied",
  "other_bounded",
  "not_applicable",
  "unknown",
] as const satisfies readonly RealWorkPreActionPresentationChannelV01[];

export const REAL_WORK_PRE_ACTION_AMBIENT_OVERLAPS_V01 = [
  "exact_same_snapshot",
  "source_bound_material_overlap",
  "semantic_overlap_candidate",
  "none_observed",
  "unknown",
] as const satisfies readonly RealWorkPreActionAmbientOverlapV01[];

export const REAL_WORK_PRE_ACTION_OVERLAY_METHOD_V01 = Object.freeze({
  actually_used_inferred: false,
  attention_inferred: false,
  causal_contribution_inferred: false,
  helpfulness_inferred: false,
  cognitive_effect_inferred: false,
  causal_task_matching_claim: false,
  statistical_equivalence_claim: false,
  overlay_owned_provider_calls: 0,
  overlay_owned_model_calls: 0,
  overlay_owned_network_calls: 0,
  overlay_owned_github_calls: 0,
} satisfies RealWorkContinuityPreActionOverlayMethodBoundaryV01);

const SOURCE_CURRENTNESS_VALUES = new Set<RealWorkPreActionSourceCurrentnessV01>([
  "exact",
  "stale",
  "partial",
  "unknown",
]);
const C1_RETRIEVAL_VALUES = new Set<RealWorkPreActionC1RetrievalV01>([
  "exact",
  "unavailable",
  "not_applicable",
  "unknown",
]);
const SNAPSHOT_PRESENTED_VALUES = new Set<RealWorkPreActionSnapshotPresentedV01>([
  "yes",
  "no",
  "not_applicable",
  "unknown",
]);
const TIMING_BASES = new Set<RealWorkPreActionTimingBasisV01>([
  "user_attested_before_action",
  "acting_host_attested_before_action",
  "bounded_pre_action_source_record",
]);
const EXPOSURE_OBSERVATION_BASES =
  new Set<RealWorkPreActionExposureObservationBasisV01>([
    "direct_observation",
    "user_declared",
    "acting_host_declared",
    "bounded_source_record",
    "not_applicable",
    "unknown",
  ]);
const WORK_DOMAINS = new Set<RealWorkPreActionWorkDomainV01>(
  REAL_WORK_PRE_ACTION_WORK_DOMAINS_V01,
);
const WORK_PHASES = new Set<RealWorkPreActionWorkPhaseV01>(
  REAL_WORK_PRE_ACTION_WORK_PHASES_V01,
);
const CLASSIFICATION_BASES = new Set<RealWorkPreActionClassificationBasisV01>(
  REAL_WORK_PRE_ACTION_CLASSIFICATION_BASES_V01,
);
const PRESENTATION_TARGETS = new Set<RealWorkPreActionPresentationTargetV01>(
  REAL_WORK_PRE_ACTION_PRESENTATION_TARGETS_V01,
);
const PRESENTATION_CHANNELS = new Set<RealWorkPreActionPresentationChannelV01>(
  REAL_WORK_PRE_ACTION_PRESENTATION_CHANNELS_V01,
);
const AMBIENT_OVERLAPS = new Set<RealWorkPreActionAmbientOverlapV01>(
  REAL_WORK_PRE_ACTION_AMBIENT_OVERLAPS_V01,
);
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
const MAX_SHORT_TEXT = 512;

export class RealWorkContinuityPreActionOverlayErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "RealWorkContinuityPreActionOverlayErrorV01";
  }
}

export function createRealWorkContinuityPreActionOverlayV01(
  freezeValue: unknown,
  inputValue: unknown,
): RealWorkContinuityPreActionOverlayV01 {
  assertRealWorkPilotEpisodeFreezeV01(freezeValue);
  const freeze = freezeValue;
  const input = parseOverlayInputV01(inputValue);
  assertOverlayJoinV01(freeze, input);
  if (Date.parse(input.observed_at) < Date.parse(freeze.freeze_timestamp)) {
    refuse("real_work_pre_action_overlay_observation_precedes_freeze");
  }
  assertExposureShapeV01(freeze, input);
  const conditionIntegrity = deriveRealWorkPreActionConditionIntegrityV01({
    condition: freeze.condition,
    source_currentness: input.source_currentness,
    c1_retrieval: input.c1_retrieval,
    evaluated_snapshot_presented: input.evaluated_snapshot_presented,
    presentation_target: input.presentation_target,
    presentation_channel: input.presentation_channel,
    ambient_overlap: input.ambient_overlap,
  });
  const core: Omit<RealWorkContinuityPreActionOverlayV01, "integrity"> = {
    artifact_version:
      REAL_WORK_CONTINUITY_PRE_ACTION_OVERLAY_ARTIFACT_VERSION_V01,
    artifact_kind: "pre_action_condition_integrity_overlay",
    overlay_version: REAL_WORK_CONTINUITY_PRE_ACTION_OVERLAY_VERSION_V01,
    pilot_version: REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01,
    pilot_id: freeze.pilot_id,
    episode_id: freeze.episode_id,
    freeze_fingerprint: freeze.integrity.fingerprint,
    work_identity: structuredClone(freeze.work_identity),
    task_family: freeze.task_family,
    condition: freeze.condition,
    work_domain: input.work_domain,
    work_domain_classification_basis:
      input.work_domain_classification_basis,
    work_phase: input.work_phase,
    work_phase_classification_basis: input.work_phase_classification_basis,
    source_currentness: input.source_currentness,
    c1_retrieval: input.c1_retrieval,
    evaluated_snapshot_presented: input.evaluated_snapshot_presented,
    retrieved_snapshot_fingerprint: input.retrieved_snapshot_fingerprint,
    presentation_target: input.presentation_target,
    presentation_channel: input.presentation_channel,
    ambient_overlap: input.ambient_overlap,
    exposure_observation_basis: input.exposure_observation_basis,
    observed_at: input.observed_at,
    observed_before_first_meaningful_action: true,
    pre_action_timing_basis: input.pre_action_timing_basis,
    condition_integrity: conditionIntegrity,
    authority: structuredClone(REAL_WORK_PILOT_AUTHORITY_V01),
    method: structuredClone(REAL_WORK_PRE_ACTION_OVERLAY_METHOD_V01),
  };
  return {
    ...core,
    integrity: {
      algorithm: "sha256",
      fingerprint_scope: "pre_action_overlay_without_integrity",
      fingerprint: fingerprintV01(core),
    },
  };
}

export function assertRealWorkContinuityPreActionOverlayV01(
  freezeValue: unknown,
  overlayValue: unknown,
): asserts overlayValue is RealWorkContinuityPreActionOverlayV01 {
  assertRealWorkPilotEpisodeFreezeV01(freezeValue);
  const overlay = requireRecord(
    overlayValue,
    "real_work_pre_action_overlay_not_object",
  ) as unknown as RealWorkContinuityPreActionOverlayV01;
  const rebuilt = createRealWorkContinuityPreActionOverlayV01(freezeValue, {
    pilot_id: overlay.pilot_id,
    episode_id: overlay.episode_id,
    freeze_fingerprint: overlay.freeze_fingerprint,
    workspace_id: overlay.work_identity?.workspace_id,
    project_id: overlay.work_identity?.project_id,
    work_id: overlay.work_identity?.work_id,
    task_family: overlay.task_family,
    condition: overlay.condition,
    work_domain: overlay.work_domain,
    work_domain_classification_basis:
      overlay.work_domain_classification_basis,
    work_phase: overlay.work_phase,
    work_phase_classification_basis: overlay.work_phase_classification_basis,
    source_currentness: overlay.source_currentness,
    c1_retrieval: overlay.c1_retrieval,
    evaluated_snapshot_presented: overlay.evaluated_snapshot_presented,
    retrieved_snapshot_fingerprint: overlay.retrieved_snapshot_fingerprint,
    presentation_target: overlay.presentation_target,
    presentation_channel: overlay.presentation_channel,
    ambient_overlap: overlay.ambient_overlap,
    exposure_observation_basis: overlay.exposure_observation_basis,
    observed_at: overlay.observed_at,
    observed_before_first_meaningful_action:
      overlay.observed_before_first_meaningful_action,
    pre_action_timing_basis: overlay.pre_action_timing_basis,
  });
  if (
    canonicalizeProtocolValueV01(rebuilt) !==
    canonicalizeProtocolValueV01(overlay)
  ) {
    refuse("real_work_pre_action_overlay_identity_or_fingerprint_invalid");
  }
}

export function deriveRealWorkPreActionConditionIntegrityV01(input: {
  condition: RealWorkPilotConditionV01;
  source_currentness: RealWorkPreActionSourceCurrentnessV01;
  c1_retrieval: RealWorkPreActionC1RetrievalV01;
  evaluated_snapshot_presented: RealWorkPreActionSnapshotPresentedV01;
  presentation_target: RealWorkPreActionPresentationTargetV01;
  presentation_channel: RealWorkPreActionPresentationChannelV01;
  ambient_overlap: RealWorkPreActionAmbientOverlapV01;
}): RealWorkPreActionConditionIntegrityV01 {
  if (input.source_currentness !== "exact") {
    return "source_currentness_invalid";
  }
  if (input.condition === "C1") {
    if (input.c1_retrieval === "unavailable") {
      return "continuity_unavailable";
    }
    if (input.c1_retrieval !== "exact") return "exposure_unknown";
    if (input.evaluated_snapshot_presented !== "yes") {
      return "exposure_unknown";
    }
    if (
      input.presentation_target === "unknown" ||
      input.presentation_target === "not_applicable" ||
      input.presentation_channel === "unknown" ||
      input.presentation_channel === "not_applicable"
    ) {
      return "exposure_unknown";
    }
    return "valid_for_comparison";
  }
  if (
    input.ambient_overlap === "exact_same_snapshot" ||
    input.ambient_overlap === "source_bound_material_overlap"
  ) {
    return "confounded";
  }
  if (
    input.ambient_overlap === "semantic_overlap_candidate" ||
    input.ambient_overlap === "unknown"
  ) {
    return "exposure_unknown";
  }
  return "valid_for_comparison";
}

export interface RealWorkPreActionTaskMixObservationV01 {
  episode_id: string;
  condition: RealWorkPilotConditionV01;
  work_domain: RealWorkPreActionWorkDomainV01;
  work_domain_classification_basis: RealWorkPreActionClassificationBasisV01;
  work_phase: RealWorkPreActionWorkPhaseV01;
  work_phase_classification_basis: RealWorkPreActionClassificationBasisV01;
}

export function deriveRealWorkPreActionTaskMixDiagnosticV01(
  observations: readonly RealWorkPreActionTaskMixObservationV01[],
): RealWorkPreActionTaskMixDiagnosticV01 {
  const b0 = observations.filter((value) => value.condition === "B0");
  const c1 = observations.filter((value) => value.condition === "C1");
  const insufficient = observations.some(
    (value) =>
      value.work_domain === "unknown" ||
      value.work_phase === "mixed_or_unknown" ||
      value.work_domain_classification_basis === "unknown" ||
      value.work_phase_classification_basis === "unknown",
  );
  const domainsB0 = uniqueSortedV01(b0.map((value) => value.work_domain));
  const domainsC1 = uniqueSortedV01(c1.map((value) => value.work_domain));
  const phasesB0 = uniqueSortedV01(b0.map((value) => value.work_phase));
  const phasesC1 = uniqueSortedV01(c1.map((value) => value.work_phase));
  const contextsB0 = uniqueSortedV01(
    b0.map((value) => `${value.work_domain}::${value.work_phase}`),
  );
  const contextsC1 = uniqueSortedV01(
    c1.map((value) => `${value.work_domain}::${value.work_phase}`),
  );
  const domainOverlap = intersectionV01(domainsB0, domainsC1);
  const phaseOverlap = intersectionV01(phasesB0, phasesC1);
  const contextOverlap = intersectionV01(contextsB0, contextsC1);
  let label: RealWorkPreActionTaskMixDiagnosticV01["label"];
  const limitations: string[] = [];
  if (b0.length === 0 || c1.length === 0) {
    label = "unknown";
    limitations.push(
      "At least one condition has no valid authentic observation in this task family.",
    );
  } else if (insufficient) {
    label = "unknown";
    limitations.push(
      "At least one valid authentic observation has insufficient domain or phase classification.",
    );
  } else if (contextOverlap.length > 0) {
    label = "observed_overlap";
  } else if (domainOverlap.length > 0 || phaseOverlap.length > 0) {
    label = "partial_overlap";
    limitations.push(
      "Only part of the observed domain and phase mix overlaps across conditions.",
    );
  } else {
    label = "no_observed_overlap";
    limitations.push(
      "Observed valid authentic B0 and C1 domain and phase sets are disjoint.",
    );
  }
  return {
    label,
    valid_authentic_episode_count: { B0: b0.length, C1: c1.length },
    valid_authentic_episode_ids: {
      B0: b0.map((value) => value.episode_id).sort(),
      C1: c1.map((value) => value.episode_id).sort(),
    },
    work_domains: {
      B0: domainsB0,
      C1: domainsC1,
      overlap: domainOverlap,
    },
    work_phases: {
      B0: phasesB0,
      C1: phasesC1,
      overlap: phaseOverlap,
    },
    work_contexts: {
      B0: contextsB0,
      C1: contextsC1,
      overlap: contextOverlap,
    },
    limitations,
    causal_comparability_claim: false,
    statistical_equivalence_claim: false,
  };
}

export function aggregateRealWorkContinuityPreActionOverlayV01(input: {
  freezes: readonly RealWorkPilotEpisodeFreezeV01[];
  overlays: readonly RealWorkContinuityPreActionOverlayV01[];
  generated_at: string;
}): RealWorkContinuityPreActionOverlayReportV01 {
  requireTimestamp(
    input.generated_at,
    "real_work_pre_action_overlay_report_timestamp_invalid",
  );
  if (input.freezes.length === 0) {
    refuse("real_work_pre_action_overlay_report_requires_episode_freeze");
  }
  if (input.freezes.length > 12) {
    refuse("real_work_pre_action_overlay_report_episode_limit_exceeded");
  }
  const freezes = input.freezes.map((value) => {
    assertRealWorkPilotEpisodeFreezeV01(value);
    return value;
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
      refuse("real_work_pre_action_overlay_report_cross_project_mismatch");
    }
    if (freezeById.has(freeze.episode_id)) {
      refuse("real_work_pre_action_overlay_report_episode_duplicate");
    }
    const slot = `${freeze.task_family}:${freeze.family_episode_index}`;
    if (occupiedSlots.has(slot)) {
      refuse("real_work_pre_action_overlay_report_schedule_slot_duplicate");
    }
    occupiedSlots.add(slot);
    freezeById.set(freeze.episode_id, freeze);
  }
  const overlayById = new Map<string, RealWorkContinuityPreActionOverlayV01>();
  for (const overlay of input.overlays) {
    const freeze = freezeById.get(overlay.episode_id);
    if (!freeze) {
      refuse("real_work_pre_action_overlay_without_freeze");
    }
    if (overlayById.has(overlay.episode_id)) {
      refuse("real_work_pre_action_overlay_duplicate");
    }
    assertRealWorkContinuityPreActionOverlayV01(freeze, overlay);
    overlayById.set(overlay.episode_id, overlay);
  }

  const authenticityValues: RealWorkPilotAuthenticityV01[] = [
    "authentic_real_work",
    "synthetic_test_only",
  ];
  const overlayCoverage = {
    authentic_real_work: coverageForAuthenticityV01(
      "authentic_real_work",
      freezes,
      overlayById,
    ),
    synthetic_test_only: coverageForAuthenticityV01(
      "synthetic_test_only",
      freezes,
      overlayById,
    ),
  };
  const domainCoverage = {
    authentic_real_work: emptyDomainCountsV01(),
    synthetic_test_only: emptyDomainCountsV01(),
  };
  const phaseCoverage = {
    authentic_real_work: emptyPhaseCountsV01(),
    synthetic_test_only: emptyPhaseCountsV01(),
  };
  const basisMissingness = {
    authentic_real_work: {
      work_domain_unknown_basis: 0,
      work_phase_unknown_basis: 0,
    },
    synthetic_test_only: {
      work_domain_unknown_basis: 0,
      work_phase_unknown_basis: 0,
    },
  };
  const integrityCounts = {
    authentic_real_work: emptyConditionIntegrityCountsV01(),
    synthetic_test_only: emptyConditionIntegrityCountsV01(),
  };
  const validityIds = {
    authentic_real_work: emptyValidityIdsV01(),
    synthetic_test_only: emptyValidityIdsV01(),
  };
  const presentationTargets = {
    authentic_real_work: emptyPresentationTargetCountsV01(),
    synthetic_test_only: emptyPresentationTargetCountsV01(),
  };
  const presentationChannels = {
    authentic_real_work: emptyPresentationChannelCountsV01(),
    synthetic_test_only: emptyPresentationChannelCountsV01(),
  };
  const ambientOverlaps = {
    authentic_real_work: emptyAmbientOverlapCountsV01(),
    synthetic_test_only: emptyAmbientOverlapCountsV01(),
  };
  for (const authenticity of authenticityValues) {
    for (const freeze of freezes.filter(
      (value) => value.authenticity === authenticity,
    )) {
      const overlay = overlayById.get(freeze.episode_id);
      if (!overlay) continue;
      domainCoverage[authenticity][overlay.work_domain] += 1;
      phaseCoverage[authenticity][overlay.work_phase] += 1;
      if (overlay.work_domain_classification_basis === "unknown") {
        basisMissingness[authenticity].work_domain_unknown_basis += 1;
      }
      if (overlay.work_phase_classification_basis === "unknown") {
        basisMissingness[authenticity].work_phase_unknown_basis += 1;
      }
      integrityCounts[authenticity][overlay.condition][
        overlay.condition_integrity
      ] += 1;
      validityIds[authenticity][overlay.condition_integrity].push(
        overlay.episode_id,
      );
      presentationTargets[authenticity][overlay.presentation_target] += 1;
      presentationChannels[authenticity][overlay.presentation_channel] += 1;
      ambientOverlaps[authenticity][overlay.ambient_overlap] += 1;
    }
    for (const ids of Object.values(validityIds[authenticity])) ids.sort();
  }

  const validAuthenticByFamily = Object.fromEntries(
    REAL_WORK_PILOT_TASK_FAMILIES_V01.map((family) => [
      family,
      [...overlayById.values()]
        .filter((overlay) => {
          const freeze = freezeById.get(overlay.episode_id);
          return (
            freeze?.authenticity === "authentic_real_work" &&
            overlay.task_family === family &&
            overlay.condition_integrity === "valid_for_comparison"
          );
        })
        .map((overlay) => ({
          episode_id: overlay.episode_id,
          condition: overlay.condition,
          work_domain: overlay.work_domain,
          work_domain_classification_basis:
            overlay.work_domain_classification_basis,
          work_phase: overlay.work_phase,
          work_phase_classification_basis:
            overlay.work_phase_classification_basis,
        })),
    ]),
  ) as Record<
    RealWorkPilotTaskFamilyV01,
    RealWorkPreActionTaskMixObservationV01[]
  >;
  const taskMix = {
    resume: deriveRealWorkPreActionTaskMixDiagnosticV01(
      validAuthenticByFamily.resume,
    ),
    verify: deriveRealWorkPreActionTaskMixDiagnosticV01(
      validAuthenticByFamily.verify,
    ),
    decide: deriveRealWorkPreActionTaskMixDiagnosticV01(
      validAuthenticByFamily.decide,
    ),
  };
  const limitations = uniqueSortedV01([
    "RW1A records pre-action exposure and work context; it does not infer actual use, attention, causal contribution, helpfulness, or cognitive effect.",
    "Task-mix diagnostics are descriptive observed-set comparisons, not causal matching or statistical equivalence.",
    "The existing RW1 report and disposition remain the sole current outcome and harm report.",
    overlayCoverage.authentic_real_work.overlay_count === 0
      ? "No authentic real-work overlay is present; authentic episode collection remains unstarted or uncovered."
      : overlayCoverage.authentic_real_work.overlay_count ===
          overlayCoverage.authentic_real_work.frozen_episode_count
        ? "Every frozen authentic episode has exactly one observed overlay."
        : "Authentic overlay coverage is incomplete.",
    ...Object.entries(taskMix).flatMap(([family, diagnostic]) =>
      diagnostic.limitations.map((value) => `${family}: ${value}`),
    ),
  ]);
  const core: Omit<
    RealWorkContinuityPreActionOverlayReportV01,
    "integrity"
  > = {
    report_version:
      REAL_WORK_CONTINUITY_PRE_ACTION_OVERLAY_REPORT_VERSION_V01,
    overlay_version: REAL_WORK_CONTINUITY_PRE_ACTION_OVERLAY_VERSION_V01,
    pilot_version: REAL_WORK_CONTINUITY_BENEFIT_PILOT_VERSION_V01,
    pilot_id: first.pilot_id,
    workspace_id: first.work_identity.workspace_id,
    project_id: first.work_identity.project_id,
    generated_at: input.generated_at,
    overlay_coverage: overlayCoverage,
    domain_coverage: domainCoverage,
    phase_coverage: phaseCoverage,
    classification_basis_missingness: basisMissingness,
    condition_integrity_counts_by_condition: integrityCounts,
    episode_ids_by_validity_state: validityIds,
    presentation_target_coverage: presentationTargets,
    presentation_channel_coverage: presentationChannels,
    ambient_overlap_counts: ambientOverlaps,
    task_mix_diagnostic: taskMix,
    limitations_and_confounds: limitations,
    core_rw1_report_or_disposition_rewrite: false,
    authority: structuredClone(REAL_WORK_PILOT_AUTHORITY_V01),
    method: structuredClone(REAL_WORK_PRE_ACTION_OVERLAY_METHOD_V01),
  };
  return {
    ...core,
    integrity: {
      algorithm: "sha256",
      fingerprint_scope: "pre_action_overlay_report_without_integrity",
      fingerprint: fingerprintV01(core),
    },
  };
}

export function formatRealWorkContinuityPreActionOverlayMarkdownV01(
  report: RealWorkContinuityPreActionOverlayReportV01,
): string {
  const lines = [
    "# RW1A pre-action condition-integrity overlay",
    "",
    `Pilot: \`${report.pilot_id}\``,
    `Authentic overlays: ${report.overlay_coverage.authentic_real_work.overlay_count}/${report.overlay_coverage.authentic_real_work.frozen_episode_count}`,
    `Synthetic test-only overlays: ${report.overlay_coverage.synthetic_test_only.overlay_count}/${report.overlay_coverage.synthetic_test_only.frozen_episode_count}`,
    "Overlay-owned provider calls: 0",
    "Overlay-owned model calls: 0",
    "Overlay-owned network calls: 0",
    "Overlay-owned GitHub calls: 0",
    "",
    "## Condition integrity",
    "",
    "| Condition | Valid | Confounded | Continuity unavailable | Source invalid | Exposure unknown |",
    "|---|---:|---:|---:|---:|---:|",
    ...(["B0", "C1"] as const).map((condition) => {
      const counts =
        report.condition_integrity_counts_by_condition.authentic_real_work[
          condition
        ];
      return `| ${condition} | ${counts.valid_for_comparison} | ${counts.confounded} | ${counts.continuity_unavailable} | ${counts.source_currentness_invalid} | ${counts.exposure_unknown} |`;
    }),
    "",
    "## Task-mix diagnostic",
    "",
    "| Family | Label | Valid B0 | Valid C1 | Domain overlap | Phase overlap |",
    "|---|---|---:|---:|---|---|",
    ...REAL_WORK_PILOT_TASK_FAMILIES_V01.map((family) => {
      const diagnostic = report.task_mix_diagnostic[family];
      return `| ${family} | ${diagnostic.label} | ${diagnostic.valid_authentic_episode_count.B0} | ${diagnostic.valid_authentic_episode_count.C1} | ${renderValuesV01(diagnostic.work_domains.overlap)} | ${renderValuesV01(diagnostic.work_phases.overlap)} |`;
    }),
    "",
    "## Limitations and confounds",
    "",
    ...report.limitations_and_confounds.map((value) => `- ${value}`),
    "",
    "This overlay creates no usefulness disposition, score, rank, winner, significance claim, policy fitness, promotion recommendation, Core record, Evidence, Proposal, Decision, ReviewDecision, or Transition.",
    "",
  ];
  return lines.join("\n");
}

function parseOverlayInputV01(
  value: unknown,
): RealWorkContinuityPreActionOverlayInputV01 {
  const input = requireRecord(
    value,
    "real_work_pre_action_overlay_input_not_object",
  );
  assertExactKeys(
    input,
    [
      "pilot_id",
      "episode_id",
      "freeze_fingerprint",
      "workspace_id",
      "project_id",
      "work_id",
      "task_family",
      "condition",
      "work_domain",
      "work_domain_classification_basis",
      "work_phase",
      "work_phase_classification_basis",
      "source_currentness",
      "c1_retrieval",
      "evaluated_snapshot_presented",
      "retrieved_snapshot_fingerprint",
      "presentation_target",
      "presentation_channel",
      "ambient_overlap",
      "exposure_observation_basis",
      "observed_at",
      "observed_before_first_meaningful_action",
      "pre_action_timing_basis",
    ],
    "real_work_pre_action_overlay_input_keys_invalid",
  );
  if (!REAL_WORK_PILOT_TASK_FAMILIES_V01.includes(input.task_family as never)) {
    refuse("real_work_pre_action_overlay_task_family_invalid");
  }
  if (input.condition !== "B0" && input.condition !== "C1") {
    refuse("real_work_pre_action_overlay_condition_invalid");
  }
  if (!WORK_DOMAINS.has(input.work_domain as RealWorkPreActionWorkDomainV01)) {
    refuse("real_work_pre_action_overlay_work_domain_invalid");
  }
  if (!WORK_PHASES.has(input.work_phase as RealWorkPreActionWorkPhaseV01)) {
    refuse("real_work_pre_action_overlay_work_phase_invalid");
  }
  if (
    !CLASSIFICATION_BASES.has(
      input.work_domain_classification_basis as RealWorkPreActionClassificationBasisV01,
    ) ||
    !CLASSIFICATION_BASES.has(
      input.work_phase_classification_basis as RealWorkPreActionClassificationBasisV01,
    )
  ) {
    refuse("real_work_pre_action_overlay_classification_basis_invalid");
  }
  if (
    !SOURCE_CURRENTNESS_VALUES.has(
      input.source_currentness as RealWorkPreActionSourceCurrentnessV01,
    )
  ) {
    refuse("real_work_pre_action_overlay_source_currentness_invalid");
  }
  if (
    !C1_RETRIEVAL_VALUES.has(
      input.c1_retrieval as RealWorkPreActionC1RetrievalV01,
    )
  ) {
    refuse("real_work_pre_action_overlay_c1_retrieval_invalid");
  }
  if (
    !SNAPSHOT_PRESENTED_VALUES.has(
      input.evaluated_snapshot_presented as RealWorkPreActionSnapshotPresentedV01,
    )
  ) {
    refuse("real_work_pre_action_overlay_snapshot_presented_invalid");
  }
  if (
    !PRESENTATION_TARGETS.has(
      input.presentation_target as RealWorkPreActionPresentationTargetV01,
    )
  ) {
    refuse("real_work_pre_action_overlay_presentation_target_invalid");
  }
  if (
    !PRESENTATION_CHANNELS.has(
      input.presentation_channel as RealWorkPreActionPresentationChannelV01,
    )
  ) {
    refuse("real_work_pre_action_overlay_presentation_channel_invalid");
  }
  if (
    !AMBIENT_OVERLAPS.has(
      input.ambient_overlap as RealWorkPreActionAmbientOverlapV01,
    )
  ) {
    refuse("real_work_pre_action_overlay_ambient_overlap_invalid");
  }
  if (
    !EXPOSURE_OBSERVATION_BASES.has(
      input.exposure_observation_basis as RealWorkPreActionExposureObservationBasisV01,
    )
  ) {
    refuse("real_work_pre_action_overlay_exposure_basis_invalid");
  }
  if (!TIMING_BASES.has(input.pre_action_timing_basis as RealWorkPreActionTimingBasisV01)) {
    refuse("real_work_pre_action_overlay_timing_basis_invalid");
  }
  if (input.observed_before_first_meaningful_action !== true) {
    refuse("real_work_pre_action_overlay_not_before_first_meaningful_action");
  }
  const retrievedSnapshotFingerprint =
    input.retrieved_snapshot_fingerprint === null
      ? null
      : requireFingerprint(
          input.retrieved_snapshot_fingerprint,
          "retrieved_snapshot_fingerprint",
        );
  return {
    pilot_id: boundedString(input.pilot_id, "pilot_id"),
    episode_id: boundedString(input.episode_id, "episode_id"),
    freeze_fingerprint: requireFingerprint(
      input.freeze_fingerprint,
      "freeze_fingerprint",
    ),
    workspace_id: boundedString(input.workspace_id, "workspace_id"),
    project_id: boundedString(input.project_id, "project_id"),
    work_id: boundedString(input.work_id, "work_id"),
    task_family: input.task_family as RealWorkPilotTaskFamilyV01,
    condition: input.condition as RealWorkPilotConditionV01,
    work_domain: input.work_domain as RealWorkPreActionWorkDomainV01,
    work_domain_classification_basis:
      input.work_domain_classification_basis as RealWorkPreActionClassificationBasisV01,
    work_phase: input.work_phase as RealWorkPreActionWorkPhaseV01,
    work_phase_classification_basis:
      input.work_phase_classification_basis as RealWorkPreActionClassificationBasisV01,
    source_currentness:
      input.source_currentness as RealWorkPreActionSourceCurrentnessV01,
    c1_retrieval: input.c1_retrieval as RealWorkPreActionC1RetrievalV01,
    evaluated_snapshot_presented:
      input.evaluated_snapshot_presented as RealWorkPreActionSnapshotPresentedV01,
    retrieved_snapshot_fingerprint: retrievedSnapshotFingerprint,
    presentation_target:
      input.presentation_target as RealWorkPreActionPresentationTargetV01,
    presentation_channel:
      input.presentation_channel as RealWorkPreActionPresentationChannelV01,
    ambient_overlap:
      input.ambient_overlap as RealWorkPreActionAmbientOverlapV01,
    exposure_observation_basis:
      input.exposure_observation_basis as RealWorkPreActionExposureObservationBasisV01,
    observed_at: requireTimestamp(
      input.observed_at,
      "real_work_pre_action_overlay_observed_at_invalid",
    ),
    observed_before_first_meaningful_action: true,
    pre_action_timing_basis:
      input.pre_action_timing_basis as RealWorkPreActionTimingBasisV01,
  };
}

function assertOverlayJoinV01(
  freeze: RealWorkPilotEpisodeFreezeV01,
  input: RealWorkContinuityPreActionOverlayInputV01,
): void {
  if (
    input.pilot_id !== freeze.pilot_id ||
    input.episode_id !== freeze.episode_id ||
    input.freeze_fingerprint !== freeze.integrity.fingerprint ||
    input.workspace_id !== freeze.work_identity.workspace_id ||
    input.project_id !== freeze.work_identity.project_id ||
    input.work_id !== freeze.work_identity.work_id ||
    input.task_family !== freeze.task_family ||
    input.condition !== freeze.condition
  ) {
    refuse("real_work_pre_action_overlay_freeze_join_refused");
  }
}

function assertExposureShapeV01(
  freeze: RealWorkPilotEpisodeFreezeV01,
  input: RealWorkContinuityPreActionOverlayInputV01,
): void {
  if (freeze.condition === "B0") {
    if (
      input.c1_retrieval !== "not_applicable" ||
      input.evaluated_snapshot_presented !== "not_applicable" ||
      input.retrieved_snapshot_fingerprint !== null
    ) {
      refuse("real_work_pre_action_overlay_b0_c1_exposure_fields_invalid");
    }
  } else {
    const exactSnapshot = freeze.continuity_material?.material_fingerprint;
    if (!exactSnapshot) {
      refuse("real_work_pre_action_overlay_c1_freeze_material_missing");
    }
    if (
      input.retrieved_snapshot_fingerprint !== null &&
      input.retrieved_snapshot_fingerprint !== exactSnapshot
    ) {
      refuse("real_work_pre_action_overlay_c1_snapshot_mismatch");
    }
    if (
      (input.c1_retrieval === "exact" ||
        input.evaluated_snapshot_presented === "yes") &&
      input.retrieved_snapshot_fingerprint === null
    ) {
      refuse("real_work_pre_action_overlay_c1_snapshot_binding_required");
    }
    if (
      input.c1_retrieval === "unavailable" &&
      (input.evaluated_snapshot_presented === "yes" ||
        input.retrieved_snapshot_fingerprint !== null)
    ) {
      refuse("real_work_pre_action_overlay_c1_unavailable_shape_invalid");
    }
  }
  const exposureClaimIsBounded = ![
    "unknown",
    "not_applicable",
  ].includes(input.exposure_observation_basis);
  if (
    freeze.condition === "C1" &&
    input.c1_retrieval === "exact" &&
    input.evaluated_snapshot_presented === "yes" &&
    !exposureClaimIsBounded
  ) {
    refuse("real_work_pre_action_overlay_exact_exposure_basis_required");
  }
  if (
    freeze.condition === "B0" &&
    input.ambient_overlap !== "unknown" &&
    !exposureClaimIsBounded
  ) {
    refuse("real_work_pre_action_overlay_b0_overlap_basis_required");
  }
}

function coverageForAuthenticityV01(
  authenticity: RealWorkPilotAuthenticityV01,
  freezes: readonly RealWorkPilotEpisodeFreezeV01[],
  overlayById: ReadonlyMap<string, RealWorkContinuityPreActionOverlayV01>,
): {
  frozen_episode_count: number;
  overlay_count: number;
  missing_overlay_episode_ids: string[];
} {
  const selected = freezes.filter(
    (freeze) => freeze.authenticity === authenticity,
  );
  return {
    frozen_episode_count: selected.length,
    overlay_count: selected.filter((freeze) => overlayById.has(freeze.episode_id))
      .length,
    missing_overlay_episode_ids: selected
      .filter((freeze) => !overlayById.has(freeze.episode_id))
      .map((freeze) => freeze.episode_id)
      .sort(),
  };
}

function emptyDomainCountsV01(): Record<RealWorkPreActionWorkDomainV01, number> {
  return Object.fromEntries(
    REAL_WORK_PRE_ACTION_WORK_DOMAINS_V01.map((value) => [value, 0]),
  ) as Record<RealWorkPreActionWorkDomainV01, number>;
}

function emptyPhaseCountsV01(): Record<RealWorkPreActionWorkPhaseV01, number> {
  return Object.fromEntries(
    REAL_WORK_PRE_ACTION_WORK_PHASES_V01.map((value) => [value, 0]),
  ) as Record<RealWorkPreActionWorkPhaseV01, number>;
}

function emptyConditionIntegrityCountsV01(): Record<
  RealWorkPilotConditionV01,
  Record<RealWorkPreActionConditionIntegrityV01, number>
> {
  const empty = () =>
    Object.fromEntries(
      REAL_WORK_PRE_ACTION_CONDITION_INTEGRITIES_V01.map((value) => [value, 0]),
    ) as Record<RealWorkPreActionConditionIntegrityV01, number>;
  return { B0: empty(), C1: empty() };
}

function emptyValidityIdsV01(): Record<
  RealWorkPreActionConditionIntegrityV01,
  string[]
> {
  return Object.fromEntries(
    REAL_WORK_PRE_ACTION_CONDITION_INTEGRITIES_V01.map((value) => [
      value,
      [] as string[],
    ]),
  ) as Record<RealWorkPreActionConditionIntegrityV01, string[]>;
}

function emptyPresentationTargetCountsV01(): Record<
  RealWorkPreActionPresentationTargetV01,
  number
> {
  return Object.fromEntries(
    REAL_WORK_PRE_ACTION_PRESENTATION_TARGETS_V01.map((value) => [value, 0]),
  ) as Record<RealWorkPreActionPresentationTargetV01, number>;
}

function emptyPresentationChannelCountsV01(): Record<
  RealWorkPreActionPresentationChannelV01,
  number
> {
  return Object.fromEntries(
    REAL_WORK_PRE_ACTION_PRESENTATION_CHANNELS_V01.map((value) => [value, 0]),
  ) as Record<RealWorkPreActionPresentationChannelV01, number>;
}

function emptyAmbientOverlapCountsV01(): Record<
  RealWorkPreActionAmbientOverlapV01,
  number
> {
  return Object.fromEntries(
    REAL_WORK_PRE_ACTION_AMBIENT_OVERLAPS_V01.map((value) => [value, 0]),
  ) as Record<RealWorkPreActionAmbientOverlapV01, number>;
}

function boundedString(value: unknown, name: string): string {
  if (typeof value !== "string") {
    refuse(`real_work_pre_action_overlay_${name}_not_string`);
  }
  const normalized = value.trim();
  if (!normalized || Buffer.byteLength(normalized, "utf8") > MAX_SHORT_TEXT) {
    refuse(`real_work_pre_action_overlay_${name}_out_of_bounds`);
  }
  if (SECRET_PATTERNS.some((pattern) => pattern.test(normalized))) {
    refuse("real_work_pre_action_overlay_secret_like_material_refused");
  }
  return normalized;
}

function requireFingerprint(value: unknown, name: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) {
    refuse(`real_work_pre_action_overlay_${name}_invalid`);
  }
  return value;
}

function requireTimestamp(value: unknown, code: string): string {
  if (typeof value !== "string" || parseStrictIsoTimestampV01(value) === null) {
    refuse(code);
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
  if (
    canonicalizeProtocolValueV01(Object.keys(record).sort()) !==
    canonicalizeProtocolValueV01([...expected].sort())
  ) {
    refuse(code);
  }
}

function uniqueSortedV01<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort();
}

function intersectionV01<T extends string>(
  left: readonly T[],
  right: readonly T[],
): T[] {
  const rightValues = new Set(right);
  return left.filter((value) => rightValues.has(value)).sort();
}

function renderValuesV01(values: readonly string[]): string {
  return values.length === 0 ? "none observed" : values.join(", ");
}

function fingerprintV01(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function refuse(code: string): never {
  throw new RealWorkContinuityPreActionOverlayErrorV01(code);
}
