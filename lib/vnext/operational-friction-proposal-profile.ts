import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  compareProtocolCanonicalV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolNullableTextV01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
  uniqueProtocolStringsV01,
  uniqueProtocolValuesV01,
  validateExternalRefStructureV01,
} from "@/lib/vnext/protocol-primitives";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  OPERATIONAL_FRICTION_CANONICALIZATION_V01,
  OPERATIONAL_FRICTION_CODES_V01,
  OPERATIONAL_FRICTION_DERIVATION_RULE_VERSION_V01,
  OPERATIONAL_FRICTION_MAX_CANDIDATES_V01,
  OPERATIONAL_FRICTION_MAX_OBSERVATIONS_V01,
  OPERATIONAL_FRICTION_PROPOSAL_PROFILE_VERSION_V01,
  OPERATIONAL_FRICTION_SOURCE_BUNDLE_VERSION_V01,
  OPERATIONAL_FRICTION_UNAVAILABLE_LANES_V01,
  type OperationalFrictionAuthoritySummaryV01,
  type OperationalFrictionCandidateBindingV01,
  type OperationalFrictionObservationV01,
  type OperationalFrictionProposalProfileV01,
  type OperationalFrictionProposalValidationResultV01,
  type OperationalFrictionSourceBindingV01,
  type OperationalFrictionSourceBundleV01,
  type OperationalFrictionUnavailableLaneV01,
} from "@/types/vnext/operational-friction-proposal";

const PENDING_PROFILE_ID = "operational-friction-profile:pending";
const PENDING_BUNDLE_ID = "operational-friction-source-bundle:pending";
const PENDING_OBSERVATION_ID = "operational-friction-observation:pending";
const PENDING_FINGERPRINT = `sha256:${"0".repeat(64)}`;
const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/u;
const forbiddenScalarFieldPattern =
  /(?:^|_)(?:severity|priority|score|rank|ranking|winner|health_score|friction_score)(?:_|$)/iu;

const ROOT_KEYS = [
  "profile_version",
  "profile_id",
  "profile_kind",
  "workspace_id",
  "project_id",
  "created_at",
  "source_bundle",
  "derivation_rule_version",
  "observations",
  "unavailable_lanes",
  "candidate_bindings",
  "source_coverage",
  "source_currentness",
  "uncertainties",
  "limitations",
  "proposal_only_status",
  "policy_activation_owner",
  "serialized_validation_scope",
  "authority_summary",
  "integrity",
] as const;
const BUNDLE_KEYS = [
  "bundle_version",
  "bundle_id",
  "bundle_fingerprint",
  "workspace_id",
  "project_id",
  "attribution",
  "paired_evaluation",
  "dynamics_digest",
  "ordered_frames",
  "packet_review_binding",
  "start_boundary_timestamp",
  "end_boundary_timestamp",
  "chronology",
  "caller_timestamp_used",
] as const;
const SOURCE_BINDING_KEYS = [
  "source_kind",
  "source_version",
  "source_id",
  "source_fingerprint",
  "source_timestamp",
  "source_timestamp_basis",
] as const;
const PACKET_REVIEW_KEYS = [
  "packet_version",
  "packet_id",
  "packet_fingerprint",
  "review_version",
  "review_id",
  "review_fingerprint",
] as const;
const OBSERVATION_KEYS = [
  "observation_id",
  "friction_code",
  "scope",
  "operation_domain",
  "epistemic_status",
  "derivation_rule_id",
  "derivation_rule_version",
  "source_refs",
  "attribution_row_ids",
  "paired_evaluation_entry_ids",
  "frame_ids",
  "digest_refs",
  "exact_count",
  "exact_count_basis",
  "causal_contribution",
  "item_level_credit_or_blame",
  "uncertainties",
  "limitations",
] as const;
const UNAVAILABLE_KEYS = [
  "lane_code",
  "status",
  "source_refs",
  "basis",
  "false_zero_emitted",
] as const;
const CANDIDATE_KEYS = [
  "candidate_id",
  "candidate_fingerprint",
  "delta_family",
  "operation",
  "operation_domain",
  "target_class",
  "basis_observation_ids",
  "review_required",
  "proposal_only",
  "activation_owner",
  "semantic_state_target_present",
] as const;
const AUTHORITY_KEYS = [
  "authoritative",
  "is_evidence",
  "is_causal_diagnosis",
  "is_review_decision",
  "is_state_transition_receipt",
  "is_semantic_state",
  "is_operational_policy",
  "proposal_only",
  "activates_policy",
  "policy_activation_owner_present",
  "semantic_transition_eligible",
  "mutates_task_context_packet",
  "mutates_memory",
  "mutates_perspective",
  "writes_database",
  "creates_core_record",
  "authorizes_execution",
  "authorizes_scheduling",
  "authorizes_retry",
  "authorizes_routing",
  "authorizes_context_selection",
  "authorizes_provider_calls",
  "authorizes_network_use",
  "authorizes_external_effects",
  "authorizes_github_mutation",
  "authorizes_publication",
  "authorizes_merge",
] as const;
const INTEGRITY_KEYS = [
  "algorithm",
  "canonicalization",
  "fingerprint_scope",
  "fingerprint",
] as const;

export type OperationalFrictionProposalProfileBuilderInputV01 = Omit<
  OperationalFrictionProposalProfileV01,
  "profile_version" | "profile_id" | "authority_summary" | "integrity"
>;

class OperationalFrictionProfileError extends Error {
  constructor(
    readonly code: string,
    readonly path: string,
    readonly blocked = true,
  ) {
    super(code);
  }
}

export function createOperationalFrictionAuthoritySummaryV01(): OperationalFrictionAuthoritySummaryV01 {
  return {
    authoritative: false,
    is_evidence: false,
    is_causal_diagnosis: false,
    is_review_decision: false,
    is_state_transition_receipt: false,
    is_semantic_state: false,
    is_operational_policy: false,
    proposal_only: true,
    activates_policy: false,
    policy_activation_owner_present: false,
    semantic_transition_eligible: false,
    mutates_task_context_packet: false,
    mutates_memory: false,
    mutates_perspective: false,
    writes_database: false,
    creates_core_record: false,
    authorizes_execution: false,
    authorizes_scheduling: false,
    authorizes_retry: false,
    authorizes_routing: false,
    authorizes_context_selection: false,
    authorizes_provider_calls: false,
    authorizes_network_use: false,
    authorizes_external_effects: false,
    authorizes_github_mutation: false,
    authorizes_publication: false,
    authorizes_merge: false,
  };
}

export function canonicalizeOperationalFrictionProposalValueV01(
  value: unknown,
): string {
  return canonicalizeProtocolValueV01(value);
}

export function createOperationalFrictionSourceExternalRefV01(
  binding: OperationalFrictionSourceBindingV01,
): ExternalRefV01 {
  return normalizeExternalRefPrimitiveV01({
    ref_version: "external_ref.v0.1",
    ref_type: binding.source_kind,
    external_id: binding.source_id,
    observed_at: binding.source_timestamp,
    source_ref: binding.source_fingerprint,
    compatibility_namespace: binding.source_version,
    trust_class: "direct_local_observation",
  });
}

export function deriveOperationalFrictionSourceBundleIdV01(
  bundle: OperationalFrictionSourceBundleV01,
): string {
  const copy = structuredClone(bundle);
  copy.bundle_id = PENDING_BUNDLE_ID;
  copy.bundle_fingerprint = PENDING_FINGERPRINT;
  return idFromFingerprintV01(
    "operational-friction-source-bundle",
    createProtocolSha256V01(canonicalizeProtocolValueV01(copy)),
  );
}

export function createOperationalFrictionSourceBundleFingerprintV01(
  bundle: OperationalFrictionSourceBundleV01,
): string {
  const copy = structuredClone(bundle);
  copy.bundle_fingerprint = PENDING_FINGERPRINT;
  return createProtocolSha256V01(canonicalizeProtocolValueV01(copy));
}

export function deriveOperationalFrictionObservationIdV01(
  observation: OperationalFrictionObservationV01,
): string {
  const copy = structuredClone(observation);
  copy.observation_id = PENDING_OBSERVATION_ID;
  return idFromFingerprintV01(
    "operational-friction-observation",
    createProtocolSha256V01(canonicalizeProtocolValueV01(copy)),
  );
}

export function deriveOperationalFrictionProposalProfileIdV01(
  profile: OperationalFrictionProposalProfileV01,
): string {
  const copy = structuredClone(profile);
  copy.profile_id = PENDING_PROFILE_ID;
  copy.integrity.fingerprint = PENDING_FINGERPRINT;
  return idFromFingerprintV01(
    "operational-friction-profile",
    createProtocolSha256V01(canonicalizeProtocolValueV01(copy)),
  );
}

export function createOperationalFrictionProposalProfileFingerprintV01(
  profile: OperationalFrictionProposalProfileV01,
): string {
  const copy = structuredClone(profile);
  copy.integrity.fingerprint = PENDING_FINGERPRINT;
  return createProtocolSha256V01(canonicalizeProtocolValueV01(copy));
}

export function normalizeOperationalFrictionSourceBundleV01(
  input: OperationalFrictionSourceBundleV01,
): OperationalFrictionSourceBundleV01 {
  const bundle: OperationalFrictionSourceBundleV01 = {
    bundle_version: OPERATIONAL_FRICTION_SOURCE_BUNDLE_VERSION_V01,
    bundle_id: PENDING_BUNDLE_ID,
    bundle_fingerprint: PENDING_FINGERPRINT,
    workspace_id: normalizeProtocolTextV01(input.workspace_id),
    project_id: normalizeProtocolTextV01(input.project_id),
    attribution: normalizeSourceBindingV01(input.attribution),
    paired_evaluation: normalizeSourceBindingV01(input.paired_evaluation),
    dynamics_digest: normalizeSourceBindingV01(input.dynamics_digest),
    ordered_frames: input.ordered_frames.map(normalizeSourceBindingV01),
    packet_review_binding: {
      packet_version: "task_context_packet.v0.1",
      packet_id: normalizeProtocolTextV01(
        input.packet_review_binding.packet_id,
      ),
      packet_fingerprint: normalizeProtocolTextV01(
        input.packet_review_binding.packet_fingerprint,
      ),
      review_version: "context_use_review.v0.1",
      review_id: normalizeProtocolTextV01(
        input.packet_review_binding.review_id,
      ),
      review_fingerprint: normalizeProtocolTextV01(
        input.packet_review_binding.review_fingerprint,
      ),
    },
    start_boundary_timestamp: normalizeProtocolTextV01(
      input.start_boundary_timestamp,
    ),
    end_boundary_timestamp: normalizeProtocolTextV01(
      input.end_boundary_timestamp,
    ),
    chronology: "exact_digest_order_no_interpolation",
    caller_timestamp_used: false,
  };
  bundle.bundle_id = deriveOperationalFrictionSourceBundleIdV01(bundle);
  bundle.bundle_fingerprint =
    createOperationalFrictionSourceBundleFingerprintV01(bundle);
  return bundle;
}

export function buildOperationalFrictionProposalProfileV01(
  input: OperationalFrictionProposalProfileBuilderInputV01,
): OperationalFrictionProposalProfileV01 {
  const profile: OperationalFrictionProposalProfileV01 = {
    profile_version: OPERATIONAL_FRICTION_PROPOSAL_PROFILE_VERSION_V01,
    profile_id: PENDING_PROFILE_ID,
    profile_kind: "derived_rebuildable_proposal_only_material",
    workspace_id: normalizeProtocolTextV01(input.workspace_id),
    project_id: normalizeProtocolTextV01(input.project_id),
    created_at: normalizeProtocolTextV01(input.created_at),
    source_bundle: normalizeOperationalFrictionSourceBundleV01(
      input.source_bundle,
    ),
    derivation_rule_version:
      OPERATIONAL_FRICTION_DERIVATION_RULE_VERSION_V01,
    observations: normalizeObservationsV01(input.observations),
    unavailable_lanes: normalizeUnavailableLanesV01(input.unavailable_lanes),
    candidate_bindings: normalizeCandidateBindingsV01(
      input.candidate_bindings,
    ),
    source_coverage: input.source_coverage,
    source_currentness: input.source_currentness,
    uncertainties: uniqueProtocolStringsV01(input.uncertainties),
    limitations: uniqueProtocolStringsV01(input.limitations),
    proposal_only_status: "proposal_only",
    policy_activation_owner: null,
    serialized_validation_scope:
      "projection_internal_only_upstream_sources_required_for_relation_proof",
    authority_summary: createOperationalFrictionAuthoritySummaryV01(),
    integrity: {
      algorithm: "sha256",
      canonicalization: OPERATIONAL_FRICTION_CANONICALIZATION_V01,
      fingerprint_scope: "profile_without_integrity_fingerprint",
      fingerprint: PENDING_FINGERPRINT,
    },
  };
  profile.profile_id = deriveOperationalFrictionProposalProfileIdV01(profile);
  profile.integrity.fingerprint =
    createOperationalFrictionProposalProfileFingerprintV01(profile);
  const validation = validateOperationalFrictionProposalProfileV01(profile);
  if (validation.status !== "valid") {
    throw new Error(
      validation.errors[0]?.code ?? "operational_friction_profile_invalid",
    );
  }
  return profile;
}

export function normalizeOperationalFrictionProposalProfileV01(
  input: OperationalFrictionProposalProfileV01,
): OperationalFrictionProposalProfileV01 {
  return buildOperationalFrictionProposalProfileV01({
    profile_kind: "derived_rebuildable_proposal_only_material",
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    created_at: input.created_at,
    source_bundle: input.source_bundle,
    derivation_rule_version:
      OPERATIONAL_FRICTION_DERIVATION_RULE_VERSION_V01,
    observations: input.observations,
    unavailable_lanes: input.unavailable_lanes,
    candidate_bindings: input.candidate_bindings,
    source_coverage: input.source_coverage,
    source_currentness: input.source_currentness,
    uncertainties: input.uncertainties,
    limitations: input.limitations,
    proposal_only_status: "proposal_only",
    policy_activation_owner: null,
    serialized_validation_scope:
      "projection_internal_only_upstream_sources_required_for_relation_proof",
  });
}

export function validateOperationalFrictionProposalProfileV01(
  input: unknown,
): OperationalFrictionProposalValidationResultV01 {
  try {
    assertValidOperationalFrictionProposalProfileV01(input);
    return {
      status: "valid",
      normalized_profile_version:
        OPERATIONAL_FRICTION_PROPOSAL_PROFILE_VERSION_V01,
      errors: [],
      warnings: [],
    };
  } catch (error) {
    const issue =
      error instanceof OperationalFrictionProfileError
        ? error
        : new OperationalFrictionProfileError(
            error instanceof Error
              ? error.message
              : "operational_friction_profile_invalid",
            "$",
          );
    return {
      status: issue.blocked ? "blocked" : "invalid",
      normalized_profile_version: isProtocolRecordV01(input)
        ? OPERATIONAL_FRICTION_PROPOSAL_PROFILE_VERSION_V01
        : null,
      errors: [
        {
          severity: "error",
          code: issue.code,
          path: issue.path,
          message: issue.message,
        },
      ],
      warnings: [],
    };
  }
}

export function assertValidOperationalFrictionProposalProfileV01(
  input: unknown,
): asserts input is OperationalFrictionProposalProfileV01 {
  const profile = requireRecordV01(input, "$", "profile_malformed");
  assertExactKeysV01(profile, ROOT_KEYS, "$", "profile_unknown_field");
  if (
    profile.profile_version !==
      OPERATIONAL_FRICTION_PROPOSAL_PROFILE_VERSION_V01 ||
    profile.profile_kind !== "derived_rebuildable_proposal_only_material" ||
    profile.derivation_rule_version !==
      OPERATIONAL_FRICTION_DERIVATION_RULE_VERSION_V01 ||
    profile.proposal_only_status !== "proposal_only" ||
    profile.policy_activation_owner !== null ||
    profile.serialized_validation_scope !==
      "projection_internal_only_upstream_sources_required_for_relation_proof"
  ) {
    failV01("profile_boundary_conflict", "$", false);
  }
  requireStringV01(profile.workspace_id, "$.workspace_id");
  requireStringV01(profile.project_id, "$.project_id");
  requireTimestampV01(profile.created_at, "$.created_at");
  const bundle = assertSourceBundleV01(profile.source_bundle);
  if (
    bundle.workspace_id !== profile.workspace_id ||
    bundle.project_id !== profile.project_id ||
    bundle.end_boundary_timestamp !== profile.created_at
  ) {
    failV01("profile_source_scope_mismatch", "$.source_bundle");
  }
  const observations = requireArrayV01(
    profile.observations,
    "$.observations",
  );
  if (observations.length > OPERATIONAL_FRICTION_MAX_OBSERVATIONS_V01) {
    failV01("observation_bound_exceeded", "$.observations");
  }
  const observationIds = new Set<string>();
  for (const [index, value] of observations.entries()) {
    const observation = assertObservationV01(
      value,
      `$.observations[${index}]`,
    );
    if (observationIds.has(observation.observation_id)) {
      failV01("duplicate_observation", `$.observations[${index}]`);
    }
    observationIds.add(observation.observation_id);
  }
  const unavailable = requireArrayV01(
    profile.unavailable_lanes,
    "$.unavailable_lanes",
  );
  const unavailableCodes = new Set<string>();
  for (const [index, value] of unavailable.entries()) {
    const lane = assertUnavailableLaneV01(
      value,
      `$.unavailable_lanes[${index}]`,
    );
    unavailableCodes.add(lane.lane_code);
  }
  if (
    unavailableCodes.size !== OPERATIONAL_FRICTION_UNAVAILABLE_LANES_V01.length ||
    OPERATIONAL_FRICTION_UNAVAILABLE_LANES_V01.some(
      (code) => !unavailableCodes.has(code),
    )
  ) {
    failV01("unavailable_lane_set_conflict", "$.unavailable_lanes");
  }
  const candidates = requireArrayV01(
    profile.candidate_bindings,
    "$.candidate_bindings",
  );
  if (candidates.length > OPERATIONAL_FRICTION_MAX_CANDIDATES_V01) {
    failV01("candidate_bound_exceeded", "$.candidate_bindings");
  }
  const candidateIds = new Set<string>();
  for (const [index, value] of candidates.entries()) {
    const candidate = assertCandidateBindingV01(
      value,
      `$.candidate_bindings[${index}]`,
    );
    if (candidateIds.has(candidate.candidate_id)) {
      failV01("duplicate_candidate_binding", `$.candidate_bindings[${index}]`);
    }
    candidateIds.add(candidate.candidate_id);
    if (
      candidate.basis_observation_ids.length === 0 ||
      candidate.basis_observation_ids.some((id) => !observationIds.has(id))
    ) {
      failV01(
        "candidate_basis_observation_mismatch",
        `$.candidate_bindings[${index}].basis_observation_ids`,
      );
    }
  }
  if (!['complete', 'partial'].includes(String(profile.source_coverage))) {
    failV01("source_coverage_invalid", "$.source_coverage", false);
  }
  if (!['fresh', 'partial', 'unknown'].includes(String(profile.source_currentness))) {
    failV01("source_currentness_invalid", "$.source_currentness", false);
  }
  assertStringArrayV01(profile.uncertainties, "$.uncertainties");
  assertStringArrayV01(profile.limitations, "$.limitations");
  const authority = requireRecordV01(
    profile.authority_summary,
    "$.authority_summary",
    "authority_malformed",
  );
  assertExactKeysV01(
    authority,
    AUTHORITY_KEYS,
    "$.authority_summary",
    "authority_unknown_field",
  );
  if (
    canonicalizeProtocolValueV01(authority) !==
    canonicalizeProtocolValueV01(createOperationalFrictionAuthoritySummaryV01())
  ) {
    failV01("authority_boundary_conflict", "$.authority_summary");
  }
  assertNoForbiddenScalarFieldsV01(profile);
  const integrity = requireRecordV01(
    profile.integrity,
    "$.integrity",
    "integrity_malformed",
  );
  assertExactKeysV01(
    integrity,
    INTEGRITY_KEYS,
    "$.integrity",
    "integrity_unknown_field",
  );
  const typed = profile as unknown as OperationalFrictionProposalProfileV01;
  if (
    integrity.algorithm !== "sha256" ||
    integrity.canonicalization !== OPERATIONAL_FRICTION_CANONICALIZATION_V01 ||
    integrity.fingerprint_scope !== "profile_without_integrity_fingerprint" ||
    !SHA256_PATTERN.test(String(integrity.fingerprint))
  ) {
    failV01("integrity_invalid", "$.integrity", false);
  }
  if (typed.profile_id !== deriveOperationalFrictionProposalProfileIdV01(typed)) {
    failV01("profile_identity_mismatch", "$.profile_id");
  }
  if (
    typed.integrity.fingerprint !==
    createOperationalFrictionProposalProfileFingerprintV01(typed)
  ) {
    failV01("profile_fingerprint_mismatch", "$.integrity.fingerprint");
  }
}

function normalizeSourceBindingV01(
  input: OperationalFrictionSourceBindingV01,
): OperationalFrictionSourceBindingV01 {
  return {
    source_kind: input.source_kind,
    source_version: normalizeProtocolTextV01(input.source_version),
    source_id: normalizeProtocolTextV01(input.source_id),
    source_fingerprint: normalizeProtocolTextV01(input.source_fingerprint),
    source_timestamp: normalizeProtocolNullableTextV01(input.source_timestamp),
    source_timestamp_basis: input.source_timestamp_basis,
  };
}

function normalizeObservationsV01(
  values: OperationalFrictionObservationV01[],
): OperationalFrictionObservationV01[] {
  return uniqueProtocolValuesV01(
    values.map((input) => {
      const observation: OperationalFrictionObservationV01 = {
        observation_id: PENDING_OBSERVATION_ID,
        friction_code: input.friction_code,
        scope: input.scope,
        operation_domain: input.operation_domain,
        epistemic_status: input.epistemic_status,
        derivation_rule_id: normalizeProtocolTextV01(
          input.derivation_rule_id,
        ),
        derivation_rule_version:
          OPERATIONAL_FRICTION_DERIVATION_RULE_VERSION_V01,
        source_refs: normalizeRefsV01(input.source_refs),
        attribution_row_ids: uniqueProtocolStringsV01(
          input.attribution_row_ids,
        ),
        paired_evaluation_entry_ids: uniqueProtocolStringsV01(
          input.paired_evaluation_entry_ids,
        ),
        frame_ids: uniqueProtocolStringsV01(input.frame_ids),
        digest_refs: normalizeRefsV01(input.digest_refs),
        exact_count: input.exact_count,
        exact_count_basis: normalizeProtocolNullableTextV01(
          input.exact_count_basis,
        ),
        causal_contribution: false,
        item_level_credit_or_blame: false,
        uncertainties: uniqueProtocolStringsV01(input.uncertainties),
        limitations: uniqueProtocolStringsV01(input.limitations),
      };
      observation.observation_id =
        deriveOperationalFrictionObservationIdV01(observation);
      return observation;
    }),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeUnavailableLanesV01(
  values: OperationalFrictionUnavailableLaneV01[],
): OperationalFrictionUnavailableLaneV01[] {
  return uniqueProtocolValuesV01(
    values.map((lane) => ({
      lane_code: lane.lane_code,
      status: lane.status,
      source_refs: normalizeRefsV01(lane.source_refs),
      basis: normalizeProtocolTextV01(lane.basis),
      false_zero_emitted: false as const,
    })),
  ).sort(compareProtocolCanonicalV01);
}

function normalizeCandidateBindingsV01(
  values: OperationalFrictionCandidateBindingV01[],
): OperationalFrictionCandidateBindingV01[] {
  return uniqueProtocolValuesV01(
    values.map((candidate) => ({
      candidate_id: normalizeProtocolTextV01(candidate.candidate_id),
      candidate_fingerprint: normalizeProtocolTextV01(
        candidate.candidate_fingerprint,
      ),
      delta_family: candidate.delta_family,
      operation: "unknown" as const,
      operation_domain: candidate.operation_domain,
      target_class: candidate.target_class,
      basis_observation_ids: uniqueProtocolStringsV01(
        candidate.basis_observation_ids,
      ),
      review_required: true as const,
      proposal_only: true as const,
      activation_owner: null,
      semantic_state_target_present: false as const,
    })),
  ).sort(compareProtocolCanonicalV01);
}

function assertSourceBundleV01(
  input: unknown,
): OperationalFrictionSourceBundleV01 {
  const bundle = requireRecordV01(input, "$.source_bundle", "source_bundle_malformed");
  assertExactKeysV01(
    bundle,
    BUNDLE_KEYS,
    "$.source_bundle",
    "source_bundle_unknown_field",
  );
  if (
    bundle.bundle_version !== OPERATIONAL_FRICTION_SOURCE_BUNDLE_VERSION_V01 ||
    bundle.chronology !== "exact_digest_order_no_interpolation" ||
    bundle.caller_timestamp_used !== false
  ) {
    failV01("source_bundle_boundary_conflict", "$.source_bundle");
  }
  requireStringV01(bundle.workspace_id, "$.source_bundle.workspace_id");
  requireStringV01(bundle.project_id, "$.source_bundle.project_id");
  const attribution = assertSourceBindingV01(
    bundle.attribution,
    "$.source_bundle.attribution",
    "context_use_attribution_projection",
  );
  const paired = assertSourceBindingV01(
    bundle.paired_evaluation,
    "$.source_bundle.paired_evaluation",
    "personal_perspective_paired_evaluation",
  );
  const digest = assertSourceBindingV01(
    bundle.dynamics_digest,
    "$.source_bundle.dynamics_digest",
    "continuity_dynamics_digest",
  );
  if (
    attribution.source_timestamp !== null ||
    paired.source_timestamp !== null ||
    attribution.source_timestamp_basis !== "not_serialized_by_source_contract" ||
    paired.source_timestamp_basis !== "not_serialized_by_source_contract" ||
    digest.source_timestamp_basis !== "exact_boundary_timestamp"
  ) {
    failV01("source_timestamp_basis_conflict", "$.source_bundle");
  }
  const frames = requireArrayV01(
    bundle.ordered_frames,
    "$.source_bundle.ordered_frames",
  );
  if (frames.length < 1 || frames.length > 5) {
    failV01("source_frame_bound_invalid", "$.source_bundle.ordered_frames");
  }
  const frameBindings = frames.map((value, index) =>
    assertSourceBindingV01(
      value,
      `$.source_bundle.ordered_frames[${index}]`,
      "work_continuity_state_frame",
    ),
  );
  if (
    frameBindings.some(
      (frame) => frame.source_timestamp_basis !== "exact_boundary_timestamp",
    )
  ) {
    failV01("frame_timestamp_basis_conflict", "$.source_bundle.ordered_frames");
  }
  for (let index = 1; index < frameBindings.length; index += 1) {
    if (
      Date.parse(frameBindings[index - 1]!.source_timestamp!) >=
      Date.parse(frameBindings[index]!.source_timestamp!)
    ) {
      failV01("source_chronology_conflict", "$.source_bundle.ordered_frames");
    }
  }
  requireTimestampV01(
    bundle.start_boundary_timestamp,
    "$.source_bundle.start_boundary_timestamp",
  );
  requireTimestampV01(
    bundle.end_boundary_timestamp,
    "$.source_bundle.end_boundary_timestamp",
  );
  if (
    frameBindings[0]?.source_timestamp !== bundle.start_boundary_timestamp ||
    frameBindings.at(-1)?.source_timestamp !== bundle.end_boundary_timestamp ||
    digest.source_timestamp !== bundle.end_boundary_timestamp
  ) {
    failV01("source_boundary_conflict", "$.source_bundle");
  }
  const packetReview = requireRecordV01(
    bundle.packet_review_binding,
    "$.source_bundle.packet_review_binding",
    "packet_review_binding_malformed",
  );
  assertExactKeysV01(
    packetReview,
    PACKET_REVIEW_KEYS,
    "$.source_bundle.packet_review_binding",
    "packet_review_binding_unknown_field",
  );
  if (
    packetReview.packet_version !== "task_context_packet.v0.1" ||
    packetReview.review_version !== "context_use_review.v0.1" ||
    !SHA256_PATTERN.test(String(packetReview.packet_fingerprint)) ||
    !SHA256_PATTERN.test(String(packetReview.review_fingerprint))
  ) {
    failV01("packet_review_binding_invalid", "$.source_bundle.packet_review_binding");
  }
  const typed = bundle as unknown as OperationalFrictionSourceBundleV01;
  if (
    typed.bundle_id !== deriveOperationalFrictionSourceBundleIdV01(typed) ||
    typed.bundle_fingerprint !==
      createOperationalFrictionSourceBundleFingerprintV01(typed)
  ) {
    failV01("source_bundle_identity_mismatch", "$.source_bundle");
  }
  return typed;
}

function assertSourceBindingV01(
  input: unknown,
  path: string,
  expectedKind: OperationalFrictionSourceBindingV01["source_kind"],
): OperationalFrictionSourceBindingV01 {
  const binding = requireRecordV01(input, path, "source_binding_malformed");
  assertExactKeysV01(
    binding,
    SOURCE_BINDING_KEYS,
    path,
    "source_binding_unknown_field",
  );
  if (
    binding.source_kind !== expectedKind ||
    !SHA256_PATTERN.test(String(binding.source_fingerprint)) ||
    !['exact_boundary_timestamp', 'not_serialized_by_source_contract'].includes(
      String(binding.source_timestamp_basis),
    )
  ) {
    failV01("source_binding_invalid", path);
  }
  requireStringV01(binding.source_version, `${path}.source_version`);
  requireStringV01(binding.source_id, `${path}.source_id`);
  if (
    binding.source_timestamp !== null &&
    parseStrictIsoTimestampV01(binding.source_timestamp) === null
  ) {
    failV01("source_timestamp_invalid", `${path}.source_timestamp`, false);
  }
  return binding as unknown as OperationalFrictionSourceBindingV01;
}

function assertObservationV01(
  input: unknown,
  path: string,
): OperationalFrictionObservationV01 {
  const observation = requireRecordV01(input, path, "observation_malformed");
  assertExactKeysV01(
    observation,
    OBSERVATION_KEYS,
    path,
    "observation_unknown_field",
  );
  if (
    !OPERATIONAL_FRICTION_CODES_V01.includes(
      observation.friction_code as (typeof OPERATIONAL_FRICTION_CODES_V01)[number],
    ) ||
    observation.derivation_rule_version !==
      OPERATIONAL_FRICTION_DERIVATION_RULE_VERSION_V01 ||
    observation.causal_contribution !== false ||
    observation.item_level_credit_or_blame !== false ||
    !['exact_source_observation', 'bounded_non_causal_candidate'].includes(
      String(observation.epistemic_status),
    )
  ) {
    failV01("observation_epistemic_boundary_conflict", path);
  }
  requireStringV01(observation.derivation_rule_id, `${path}.derivation_rule_id`);
  assertRefsV01(observation.source_refs, `${path}.source_refs`);
  assertRefsV01(observation.digest_refs, `${path}.digest_refs`);
  assertStringArrayV01(observation.attribution_row_ids, `${path}.attribution_row_ids`);
  assertStringArrayV01(
    observation.paired_evaluation_entry_ids,
    `${path}.paired_evaluation_entry_ids`,
  );
  assertStringArrayV01(observation.frame_ids, `${path}.frame_ids`);
  assertStringArrayV01(observation.uncertainties, `${path}.uncertainties`);
  assertStringArrayV01(observation.limitations, `${path}.limitations`);
  const exactCount = observation.exact_count;
  if (
    exactCount !== null &&
    (typeof exactCount !== "number" ||
      !Number.isInteger(exactCount) ||
      exactCount < 0)
  ) {
    failV01("observation_count_invalid", `${path}.exact_count`, false);
  }
  if (
    (observation.exact_count === null) !==
    (observation.exact_count_basis === null)
  ) {
    failV01("observation_count_basis_conflict", path);
  }
  const typed = observation as unknown as OperationalFrictionObservationV01;
  const expectedDomainByCode = {
    critical_context_omission_candidate: "context_validation",
    source_currentness_unknown: "source_currentness_validation",
    verification_preparation_missing: "verification_preparation",
    blocking_friction_non_converging: "continuity_friction_validation",
    wrong_context_correction_observed: "context_correction_preparation",
    packet_level_review_stale: "packet_review_validation",
    packet_level_review_misleading: "packet_review_validation",
    packet_level_review_missing: "packet_review_validation",
    packet_level_review_noisy: "packet_review_validation",
  } as const;
  if (typed.operation_domain !== expectedDomainByCode[typed.friction_code]) {
    failV01("observation_operation_domain_mismatch", path);
  }
  if (
    typed.friction_code === "critical_context_omission_candidate" &&
    (typed.scope !== "paired_evaluation_basis_set" ||
      typed.epistemic_status !== "bounded_non_causal_candidate" ||
      typed.paired_evaluation_entry_ids.length === 0 ||
      typed.exact_count === null)
  ) {
    failV01("critical_omission_candidate_boundary_conflict", path);
  }
  if (
    typed.friction_code === "source_currentness_unknown" &&
    (typed.scope !== "attribution_rows" ||
      typed.attribution_row_ids.length === 0 ||
      typed.exact_count === null)
  ) {
    failV01("unknown_currentness_boundary_conflict", path);
  }
  if (
    typed.friction_code.startsWith("packet_level_review_") &&
    (typed.scope !== "packet_level_episode_review_only" ||
      typed.attribution_row_ids.length !== 0 ||
      typed.paired_evaluation_entry_ids.length !== 0 ||
      typed.exact_count !== null)
  ) {
    failV01("packet_level_review_scope_conflict", path);
  }
  if (
    typed.observation_id !== deriveOperationalFrictionObservationIdV01(typed)
  ) {
    failV01("observation_identity_mismatch", `${path}.observation_id`);
  }
  return typed;
}

function assertUnavailableLaneV01(
  input: unknown,
  path: string,
): OperationalFrictionUnavailableLaneV01 {
  const lane = requireRecordV01(input, path, "unavailable_lane_malformed");
  assertExactKeysV01(
    lane,
    UNAVAILABLE_KEYS,
    path,
    "unavailable_lane_unknown_field",
  );
  if (
    !OPERATIONAL_FRICTION_UNAVAILABLE_LANES_V01.includes(
      lane.lane_code as (typeof OPERATIONAL_FRICTION_UNAVAILABLE_LANES_V01)[number],
    ) ||
    !['unavailable', 'unsupported'].includes(String(lane.status)) ||
    lane.false_zero_emitted !== false
  ) {
    failV01("unavailable_lane_boundary_conflict", path);
  }
  assertRefsV01(lane.source_refs, `${path}.source_refs`);
  requireStringV01(lane.basis, `${path}.basis`);
  return lane as unknown as OperationalFrictionUnavailableLaneV01;
}

function assertCandidateBindingV01(
  input: unknown,
  path: string,
): OperationalFrictionCandidateBindingV01 {
  const candidate = requireRecordV01(input, path, "candidate_binding_malformed");
  assertExactKeysV01(
    candidate,
    CANDIDATE_KEYS,
    path,
    "candidate_binding_unknown_field",
  );
  if (
    !['research_delta', 'validation_delta', 'agent_plan_delta'].includes(
      String(candidate.delta_family),
    ) ||
    candidate.operation !== "unknown" ||
    candidate.review_required !== true ||
    candidate.proposal_only !== true ||
    candidate.activation_owner !== null ||
    candidate.semantic_state_target_present !== false ||
    !SHA256_PATTERN.test(String(candidate.candidate_fingerprint))
  ) {
    failV01("candidate_authority_boundary_conflict", path);
  }
  if (
    ![
      "context_validation",
      "source_currentness_validation",
      "verification_preparation",
      "continuity_friction_validation",
      "context_correction_preparation",
      "packet_review_validation",
    ].includes(String(candidate.operation_domain)) ||
    ![
      "bounded_validation_hypothesis",
      "bounded_research_hypothesis",
      "bounded_agent_plan_hypothesis",
    ].includes(String(candidate.target_class))
  ) {
    failV01("candidate_domain_target_invalid", path, false);
  }
  const expectedTargetClass =
    candidate.delta_family === "research_delta"
      ? "bounded_research_hypothesis"
      : candidate.delta_family === "validation_delta"
        ? "bounded_validation_hypothesis"
        : "bounded_agent_plan_hypothesis";
  if (candidate.target_class !== expectedTargetClass) {
    failV01("candidate_target_class_mismatch", path);
  }
  requireStringV01(candidate.candidate_id, `${path}.candidate_id`);
  assertStringArrayV01(
    candidate.basis_observation_ids,
    `${path}.basis_observation_ids`,
  );
  return candidate as unknown as OperationalFrictionCandidateBindingV01;
}

function normalizeRefsV01(refs: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(
    refs.map((ref) => normalizeExternalRefPrimitiveV01(ref)),
  ).sort(compareExternalRefsV01);
}

function assertRefsV01(input: unknown, path: string): void {
  const refs = requireArrayV01(input, path);
  for (const [index, ref] of refs.entries()) {
    const issues: string[] = [];
    validateExternalRefStructureV01(ref, `${path}[${index}]`, {
      error(code) {
        issues.push(code);
      },
      warning(code) {
        issues.push(code);
      },
    });
    if (issues.length > 0) {
      failV01("source_ref_invalid", `${path}[${index}]`, false);
    }
  }
}

function assertNoForbiddenScalarFieldsV01(value: unknown, path = "$"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoForbiddenScalarFieldsV01(item, `${path}[${index}]`),
    );
    return;
  }
  if (!isProtocolRecordV01(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenScalarFieldPattern.test(key)) {
      failV01("scalar_score_rank_priority_forbidden", `${path}.${key}`);
    }
    assertNoForbiddenScalarFieldsV01(child, `${path}.${key}`);
  }
}

function assertExactKeysV01(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  code: string,
): void {
  const allowedSet = new Set(allowed);
  if (Object.keys(value).some((key) => !allowedSet.has(key))) {
    failV01(code, path, false);
  }
}

function requireRecordV01(
  value: unknown,
  path: string,
  code: string,
): Record<string, unknown> {
  if (!isProtocolRecordV01(value)) failV01(code, path, false);
  return value;
}

function requireArrayV01(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) failV01("collection_malformed", path, false);
  return value;
}

function requireStringV01(value: unknown, path: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) failV01("string_invalid", path, false);
  return normalized;
}

function requireTimestampV01(value: unknown, path: string): string {
  if (parseStrictIsoTimestampV01(value) === null) {
    failV01("timestamp_invalid", path, false);
  }
  return String(value);
}

function assertStringArrayV01(value: unknown, path: string): void {
  const values = requireArrayV01(value, path);
  if (values.some((item) => typeof item !== "string" || item.trim() === "")) {
    failV01("string_collection_invalid", path, false);
  }
  if (new Set(values).size !== values.length) {
    failV01("string_collection_duplicate", path, false);
  }
}

function idFromFingerprintV01(prefix: string, fingerprint: string): string {
  return `${prefix}:${fingerprint.slice("sha256:".length, 38)}`;
}

function failV01(
  code: string,
  path: string,
  blocked = true,
): never {
  throw new OperationalFrictionProfileError(code, path, blocked);
}
