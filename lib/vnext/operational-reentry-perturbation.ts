import {
  canonicalizeProtocolValueV01,
  compareProtocolCanonicalV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  parseStrictIsoTimestampV01,
  scanForbiddenProtocolMaterialV01,
  type ProtocolValidationIssueSinkV01,
} from "@/lib/vnext/protocol-primitives";
import {
  OPERATIONAL_REENTRY_ARM_ROLE_ORDER_V01,
  OPERATIONAL_REENTRY_PERTURBATION_ARM_VERSION_V01,
  OPERATIONAL_REENTRY_PERTURBATION_EVALUATION_VERSION_V01,
  OPERATIONAL_REENTRY_PERTURBATION_SOURCE_VERSION_V01,
  type OperationalReentryArmV01,
  type OperationalReentryConditioningRelationV01,
  type OperationalReentryDownstreamVectorV01,
  type OperationalReentryEvaluationV01,
  type OperationalReentryIntegrityV01,
  type OperationalReentryMaterialBoundaryV01,
  type OperationalReentryParityDimensionV01,
  type OperationalReentryParityRowV01,
  type OperationalReentryResetInputParityRowV01,
  type OperationalReentryResetMatchedArmRoleV01,
  type OperationalReentryResetRelationV01,
  type OperationalReentrySourceV01,
  type OperationalReentryValidationResultV01,
} from "@/types/vnext/operational-reentry-perturbation";

const SHA256 = /^sha256:[a-f0-9]{64}$/u;
const COMMIT = /^[a-f0-9]{40}$/u;
const PRIVATE_PATH = /(?:^|[\s"'])(?:\/(?:Users|home|private|var|tmp|etc)\/|[A-Za-z]:\\)/u;
const PENDING_FINGERPRINT = `sha256:${"0".repeat(64)}`;
const MAX_TEXT = 2000;
const MAX_ITEMS = 128;

export const ACGC_E1_STAGE5_BASELINE_COMMIT_V01 =
  "7c30c83ffc6bc579a8d730f7967244efe8a19214" as const;
export const ACGC_E1_STAGE5_COMPARISON_SOURCE_CASE_ID_V01 =
  "operational-continuation-source-case:fc7df441963e41524d17cbb2" as const;
export const ACGC_E1_STAGE5_COMPARISON_SOURCE_CASE_FINGERPRINT_V01 =
  "sha256:fc7df441963e41524d17cbb206549471e5631f54b035dafe8dee5dc9536204bb" as const;
export const ACGC_E1_FROZEN_SOURCE_CASE_ID_V01 =
  "model-host-succession-frozen-case:dc67815d308cb13562e5ff6d" as const;
export const ACGC_E1_FROZEN_SOURCE_CASE_FINGERPRINT_V01 =
  "sha256:517416caa579ed315365e3e630e37372a6b84d973c239dab66ee35df6c9b4f1e" as const;
export const ACGC_E1_TARGET_ENTRY_ID_V01 =
  "operational-continuation:d26d8d39ca551382d4cb3d13150423b1" as const;
export const ACGC_E1_TARGET_CANDIDATE_ID_V01 =
  "operational-friction-candidate:2b94bab619982ee637ad153e661360f" as const;
export const ACGC_E1_TARGET_CANDIDATE_FINGERPRINT_V01 =
  "sha256:8295ee4fcf01a75fd5787e1bc304e779c35f677be60f1837ad0df4d5dc39b75e" as const;
export const ACGC_E1_SELECTION_ID_V01 =
  "operational-context-selection:03ae0fc97e892842fe4a987f7df1857" as const;
export const ACGC_E1_SELECTION_FINGERPRINT_V01 =
  "sha256:01d3ff9a60642d89a5d93d1d566f2ecde64fbd5fa84a72ca78b73ce67d8f1f6b" as const;
export const ACGC_E1_MATERIALIZATION_ID_V01 =
  "operational-continuation-materialization:5ca70c7ebd16cd4e16d8cdda13d1fb2" as const;
export const ACGC_E1_MATERIALIZATION_FINGERPRINT_V01 =
  "sha256:95bb41643ddb919baf9566bc1e5cb5150f2facf0662ae5f5eb5f4958eb274f44" as const;
export const ACGC_E1_ADMISSION_ID_V01 =
  "operational-continuation-admission:7db88c6dd46effbdddcd862f4c6df85" as const;
export const ACGC_E1_ADMISSION_FINGERPRINT_V01 =
  "sha256:e857c305e225fece315efa9b9b2fd745e8e691c799eda69e77fac3186e42788a" as const;
export const ACGC_E1_EXACT_SOURCE_ID_V01 =
  "operational-reentry-source:0e4f8f50b8c8ae209feebacc82a1703e" as const;
export const ACGC_E1_EXACT_SOURCE_FINGERPRINT_V01 =
  "sha256:9a97c69305aade380958f848c682c8926b780a6bbfcd759df4db153d0b6c1ff1" as const;

const SOURCE_ID_PENDING = "operational-reentry-source:pending";
const ARM_ID_PENDING = "operational-reentry-arm:pending";
const EVALUATION_ID_PENDING = "operational-reentry-evaluation:pending";

const MATERIAL_BOUNDARY: OperationalReentryMaterialBoundaryV01 = Object.freeze({
  bounded: true,
  max_text_characters: 2000,
  max_collection_items: 128,
  raw_prompt_included: false,
  raw_transcript_included: false,
  raw_terminal_output_included: false,
  raw_provider_output_included: false,
  hidden_reasoning_included: false,
  credential_or_secret_included: false,
  private_absolute_path_included: false,
  post_cutoff_material_included: false,
});

const AUTHORITY_SUMMARY = Object.freeze({
  is_canonical_core_record: false,
  is_evidence: false,
  is_proposal: false,
  is_review_decision: false,
  is_transition: false,
  is_policy: false,
  is_context_selector: false,
  is_execution_plan: false,
  writes_database: false,
  mutates_source_records: false,
  mutates_task_context_packet: false,
  mutates_semantic_state: false,
  authorizes_execution: false,
  authorizes_provider_calls: false,
  authorizes_network_use: false,
  authorizes_external_actuation: false,
  authorizes_github_mutation: false,
  authorizes_publication: false,
  authorizes_merge: false,
  claims_actual_use: false,
  claims_support_validation: false,
  claims_outcome_association: false,
  claims_causal_contribution: false,
  claims_general_benefit: false,
  creates_scalar_fitness: false,
  creates_global_winner: false,
  promotes_target_or_policy: false,
  activates_reset_or_fallback: false,
});

const PARITY_DIMENSIONS: OperationalReentryParityDimensionV01[] = [
  "task_goal",
  "success_criteria",
  "non_goals",
  "required_checks",
  "forbidden_actions",
  "data_classification",
  "task_family_identity",
  "frozen_repository_head",
  "initial_worktree_content",
  "construction_cutoff",
  "observation_cutoff_policy",
  "platform",
  "deterministic_adapter_identity",
  "capability_version_and_coverage",
  "operation_approval_policy",
  "verification_owner_set",
  "declared_equal_ceiling",
  "non_target_packet_entries",
  "non_target_downstream_inputs",
];

export type BuildOperationalReentrySourceInputV01 = Omit<
  OperationalReentrySourceV01,
  | "source_version"
  | "source_id"
  | "source_kind"
  | "data_is_synthetic_public_safe"
  | "material_boundary"
  | "integrity"
>;

export type BuildOperationalReentryArmInputV01 = Omit<
  OperationalReentryArmV01,
  | "arm_version"
  | "arm_id"
  | "post_cutoff_material_present"
  | "provider_calls"
  | "model_calls"
  | "network_calls"
  | "product_admission_used"
  | "product_state_mutated"
  | "integrity"
>;

export interface BuildOperationalReentryEvaluationInputV01 {
  source: OperationalReentrySourceV01;
  arms: OperationalReentryArmV01[];
  limitations: string[];
  missing_evidence: string[];
}

export class OperationalReentryPerturbationErrorV01 extends Error {
  constructor(readonly code: string, readonly path = "$") {
    super(code);
    this.name = "OperationalReentryPerturbationErrorV01";
  }
}

export function buildOperationalReentrySourceV01(
  input: BuildOperationalReentrySourceInputV01,
): OperationalReentrySourceV01 {
  const before = canonicalizeProtocolValueV01(input);
  assertExactKeysV01(input, SOURCE_INPUT_KEYS, "$", "operational_reentry_source_unknown_field");
  const source: OperationalReentrySourceV01 = {
    source_version: OPERATIONAL_REENTRY_PERTURBATION_SOURCE_VERSION_V01,
    source_id: SOURCE_ID_PENDING,
    source_kind: "exact_rebuilt_merged_stage5_public_safe_case",
    ...cloneV01(input),
    packet_b_entry_ids: canonicalStringsV01(input.packet_b_entry_ids),
    packet_b_entry_fingerprints: canonicalStringsV01(
      input.packet_b_entry_fingerprints,
    ),
    non_target_packet_entry_ids: canonicalStringsV01(
      input.non_target_packet_entry_ids,
    ),
    non_target_packet_entry_fingerprints: canonicalStringsV01(
      input.non_target_packet_entry_fingerprints,
    ),
    non_target_downstream_input_fingerprints: canonicalStringsV01(
      input.non_target_downstream_input_fingerprints,
    ),
    task: canonicalTaskV01(input.task),
    repository: canonicalRepositoryV01(input.repository),
    data_is_synthetic_public_safe: true,
    material_boundary: cloneV01(MATERIAL_BOUNDARY),
    integrity: pendingIntegrityV01("source_without_integrity_fingerprint"),
  };
  source.source_id = deriveIdV01(source, "source_id", "operational-reentry-source");
  source.integrity.fingerprint = fingerprintV01(source);
  assertValidOperationalReentrySourceV01(source);
  assertInputUnchangedV01(before, input, "operational_reentry_source_input_mutated");
  return source;
}

export function buildOperationalReentryArmV01(
  input: BuildOperationalReentryArmInputV01,
): OperationalReentryArmV01 {
  const before = canonicalizeProtocolValueV01(input);
  assertExactKeysV01(input, ARM_INPUT_KEYS, "$", "operational_reentry_arm_unknown_field");
  if ((input.evidence_class as string) === "observed_live_provider") {
    failV01("operational_reentry_live_provider_evidence_refused", "$.evidence_class");
  }
  const arm: OperationalReentryArmV01 = {
    arm_version: OPERATIONAL_REENTRY_PERTURBATION_ARM_VERSION_V01,
    arm_id: ARM_ID_PENDING,
    ...cloneV01(input),
    task: canonicalTaskV01(input.task),
    repository: canonicalRepositoryV01(input.repository),
    target_entry_ids: canonicalStringsV01(input.target_entry_ids),
    packet_entry_ids: canonicalStringsV01(input.packet_entry_ids),
    packet_entry_fingerprints: canonicalStringsV01(input.packet_entry_fingerprints),
    non_target_downstream_input_fingerprints: canonicalStringsV01(
      input.non_target_downstream_input_fingerprints,
    ),
    downstream: canonicalDownstreamV01(input.downstream),
    post_cutoff_material_present: false,
    provider_calls: 0,
    model_calls: 0,
    network_calls: 0,
    product_admission_used: false,
    product_state_mutated: false,
    integrity: pendingIntegrityV01("arm_without_integrity_fingerprint"),
  };
  arm.arm_id = deriveIdV01(arm, "arm_id", "operational-reentry-arm");
  arm.integrity.fingerprint = fingerprintV01(arm);
  assertValidOperationalReentryArmV01(arm);
  assertInputUnchangedV01(before, input, "operational_reentry_arm_input_mutated");
  return arm;
}

export function buildOperationalReentryEvaluationV01(
  input: BuildOperationalReentryEvaluationInputV01,
): OperationalReentryEvaluationV01 {
  const before = canonicalizeProtocolValueV01(input);
  assertExactKeysV01(
    input,
    new Set(["source", "arms", "limitations", "missing_evidence"]),
    "$",
    "operational_reentry_evaluation_unknown_field",
  );
  assertValidOperationalReentrySourceV01(input.source);
  const arms = canonicalArmsV01(input.arms);
  const armByRole = new Map(arms.map((arm) => [arm.role, arm]));
  const exact = armByRole.get("exact_reentry")!;
  const ablation = armByRole.get("matched_single_item_ablation")!;
  const stale = armByRole.get("stale_or_regime_shift_reset")!;
  const baseline = armByRole.get("existing_one_run_baseline")!;
  assertArmFamilyV01(input.source, exact, ablation, stale, baseline);

  const parity = deriveParityV01(exact, ablation, input.source);
  const removedEntryIds = exact.packet_entry_ids.filter(
    (entryId) => !ablation.packet_entry_ids.includes(entryId),
  );
  const introducedEntryIds = ablation.packet_entry_ids.filter(
    (entryId) => !exact.packet_entry_ids.includes(entryId),
  );
  const nonTargetMaterialEqual = parity.every((row) => row.status === "equal");
  const onlyTargetDifference =
    nonTargetMaterialEqual &&
    canonicalizeProtocolValueV01(removedEntryIds) ===
      canonicalizeProtocolValueV01([input.source.target.packet_entry_id]) &&
    introducedEntryIds.length === 0 &&
    exact.target_entry_ids.length === 1 &&
    ablation.target_entry_ids.length === 0;
  const directComparable = onlyTargetDifference;
  const conditioning = deriveConditioningV01(
    input.source,
    exact,
    ablation,
    directComparable,
  );
  const resetComparison = deriveResetInputParityV01(
    input.source,
    exact,
    ablation,
    stale,
  );
  const staleComparable = deriveStaleComparabilityV01(
    input.source,
    stale,
    resetComparison.inputsEqual,
  );
  const reset = deriveResetV01(input.source, stale, staleComparable);

  const evaluation: OperationalReentryEvaluationV01 = {
    evaluation_version: OPERATIONAL_REENTRY_PERTURBATION_EVALUATION_VERSION_V01,
    evaluation_id: EVALUATION_ID_PENDING,
    evaluation_kind: "pure_rebuildable_single_target_non_authoritative",
    source: cloneV01(input.source),
    arms,
    exact_reentry_ablation_parity: parity,
    single_target_intervention: {
      target_entry_id: input.source.target.packet_entry_id,
      exact_reentry_target_present: true,
      ablation_target_present: false,
      removed_entry_ids: canonicalStringsV01(removedEntryIds),
      introduced_entry_ids: [],
      non_target_material_equal: nonTargetMaterialEqual,
      only_intended_difference_is_target_presence: onlyTargetDifference,
      direct_conditioning_comparable: directComparable,
    },
    stale_regime_relation: {
      matched_arm_role: resetComparison.matchedArmRole,
      input_parity: resetComparison.rows,
      non_stale_regime_inputs_equal: resetComparison.inputsEqual,
      target_identity_preserved:
        stale.target_lineage !== null &&
        canonicalizeProtocolValueV01(stale.target_lineage) ===
          canonicalizeProtocolValueV01(input.source.target),
      explicit_source_bound_pre_outcome_reason:
        stale.stale_relation !== null &&
        stale.stale_relation.applies_before_outcome === true &&
        SHA256.test(stale.stale_relation.source_ref),
      comparable: staleComparable,
    },
    conditioning_relation: conditioning.relation,
    conditioning_basis: conditioning.basis,
    reset_relation: reset.relation,
    reset_basis: reset.basis,
    evidence_ladder: {
      availability: "exact",
      reference: exact.downstream.referenced_source_ids.includes(
        input.source.target.packet_entry_id,
      ) ||
        exact.downstream.referenced_source_ids.includes(
          input.source.target.candidate.record_id,
        )
        ? "exact"
        : "not_observed",
      conditioning_candidate: conditioning.relation,
      support_validation: "unknown",
      outcome_association: "unknown",
      causal_contribution: "unknown",
      reset_behavior: reset.relation,
    },
    evidence_class: "deterministic_fixture_execution",
    deterministic_mechanics_only: true,
    real_provider_or_model_evidence: false,
    empirical_general_benefit_observed: false,
    no_bundle_credit_or_blame: true,
    limitations: canonicalStringsV01(input.limitations),
    missing_evidence: canonicalStringsV01(input.missing_evidence),
    material_boundary: cloneV01(MATERIAL_BOUNDARY),
    authority_summary: cloneV01(AUTHORITY_SUMMARY),
    integrity: pendingIntegrityV01("evaluation_without_integrity_fingerprint"),
  };
  evaluation.evaluation_id = deriveIdV01(
    evaluation,
    "evaluation_id",
    "operational-reentry-evaluation",
  );
  evaluation.integrity.fingerprint = fingerprintV01(evaluation);
  assertValidOperationalReentryEvaluationV01(evaluation);
  assertInputUnchangedV01(before, input, "operational_reentry_evaluation_input_mutated");
  return evaluation;
}

export function validateOperationalReentrySourceV01(
  input: unknown,
): OperationalReentryValidationResultV01 {
  return validationResultV01(() => assertValidOperationalReentrySourceV01(input));
}

export function validateOperationalReentryArmV01(
  input: unknown,
): OperationalReentryValidationResultV01 {
  return validationResultV01(() => assertValidOperationalReentryArmV01(input));
}

export function validateOperationalReentryEvaluationV01(
  input: unknown,
): OperationalReentryValidationResultV01 {
  return validationResultV01(() => assertValidOperationalReentryEvaluationV01(input));
}

function assertValidOperationalReentrySourceV01(
  input: unknown,
): asserts input is OperationalReentrySourceV01 {
  if (!isProtocolRecordV01(input)) failV01("operational_reentry_source_malformed");
  assertExactKeysV01(input, SOURCE_KEYS, "$", "operational_reentry_source_unknown_field");
  if (input.source_version !== OPERATIONAL_REENTRY_PERTURBATION_SOURCE_VERSION_V01) {
    failV01("operational_reentry_source_version_invalid", "$.source_version");
  }
  const source = input as unknown as OperationalReentrySourceV01;
  assertSafeMaterialV01(source);
  assertSourceNestedShapesV01(source);
  if (source.source_kind !== "exact_rebuilt_merged_stage5_public_safe_case") {
    failV01("operational_reentry_source_kind_invalid", "$.source_kind");
  }
  assertExactStage5SourceV01(source);
  assertIntegrityV01(source, "source_id", "operational-reentry-source");
}

function assertValidOperationalReentryArmV01(
  input: unknown,
): asserts input is OperationalReentryArmV01 {
  if (!isProtocolRecordV01(input)) failV01("operational_reentry_arm_malformed");
  assertExactKeysV01(input, ARM_KEYS, "$", "operational_reentry_arm_unknown_field");
  const arm = input as unknown as OperationalReentryArmV01;
  assertSafeMaterialV01(arm);
  assertArmNestedShapesV01(arm);
  if (arm.arm_version !== OPERATIONAL_REENTRY_PERTURBATION_ARM_VERSION_V01) {
    failV01("operational_reentry_arm_version_invalid", "$.arm_version");
  }
  if (!OPERATIONAL_REENTRY_ARM_ROLE_ORDER_V01.includes(arm.role)) {
    failV01("operational_reentry_arm_role_invalid", "$.role");
  }
  if (![
    "deterministic_fixture_execution",
    "synthetic_source_observation",
    "unobserved",
  ].includes(arm.evidence_class)) {
    failV01("operational_reentry_arm_evidence_class_invalid", "$.evidence_class");
  }
  for (const [field, value] of Object.entries({
    provider_calls: arm.provider_calls,
    model_calls: arm.model_calls,
    network_calls: arm.network_calls,
  })) {
    if (value !== 0) failV01("operational_reentry_external_call_refused", `$.${field}`);
  }
  for (const field of [
    "post_cutoff_material_present",
    "product_admission_used",
    "product_state_mutated",
  ] as const) {
    if (arm[field] !== false) failV01("operational_reentry_effect_refused", `$.${field}`);
  }
  assertCanonicalStringArrayV01(arm.target_entry_ids, "$.target_entry_ids");
  assertCanonicalStringArrayV01(arm.packet_entry_ids, "$.packet_entry_ids");
  assertCanonicalStringArrayV01(
    arm.packet_entry_fingerprints,
    "$.packet_entry_fingerprints",
  );
  assertCanonicalStringArrayV01(
    arm.non_target_downstream_input_fingerprints,
    "$.non_target_downstream_input_fingerprints",
  );
  if (arm.packet_entry_ids.length !== arm.packet_entry_fingerprints.length) {
    failV01("operational_reentry_arm_packet_identity_count_mismatch");
  }
  assertDownstreamV01(arm.downstream);
  assertIntegrityV01(arm, "arm_id", "operational-reentry-arm");
}

function assertValidOperationalReentryEvaluationV01(
  input: unknown,
): asserts input is OperationalReentryEvaluationV01 {
  if (!isProtocolRecordV01(input)) failV01("operational_reentry_evaluation_malformed");
  assertExactKeysV01(
    input,
    EVALUATION_KEYS,
    "$",
    "operational_reentry_evaluation_unknown_field",
  );
  const evaluation = input as unknown as OperationalReentryEvaluationV01;
  assertSafeMaterialV01(evaluation);
  assertEvaluationNestedShapesV01(evaluation);
  if (
    evaluation.evaluation_version !==
      OPERATIONAL_REENTRY_PERTURBATION_EVALUATION_VERSION_V01 ||
    evaluation.evaluation_kind !==
      "pure_rebuildable_single_target_non_authoritative"
  ) {
    failV01("operational_reentry_evaluation_identity_invalid");
  }
  assertValidOperationalReentrySourceV01(evaluation.source);
  const arms = canonicalArmsV01(evaluation.arms);
  if (canonicalizeProtocolValueV01(arms) !== canonicalizeProtocolValueV01(evaluation.arms)) {
    failV01("operational_reentry_arm_order_invalid", "$.arms");
  }
  const rebuilt = buildEvaluationDerivedShapeV01({
    source: evaluation.source,
    arms: evaluation.arms,
    limitations: evaluation.limitations,
    missing_evidence: evaluation.missing_evidence,
  });
  for (const key of DERIVED_EVALUATION_KEYS) {
    if (
      canonicalizeProtocolValueV01(evaluation[key]) !==
      canonicalizeProtocolValueV01(rebuilt[key])
    ) {
      failV01("operational_reentry_derived_semantics_invalid", `$.${key}`);
    }
  }
  if (
    evaluation.evidence_class !== "deterministic_fixture_execution" ||
    evaluation.deterministic_mechanics_only !== true ||
    evaluation.evidence_ladder.support_validation !== "unknown" ||
    evaluation.evidence_ladder.outcome_association !== "unknown" ||
    evaluation.evidence_ladder.causal_contribution !== "unknown" ||
    evaluation.real_provider_or_model_evidence !== false ||
    evaluation.empirical_general_benefit_observed !== false ||
    evaluation.no_bundle_credit_or_blame !== true ||
    canonicalizeProtocolValueV01(evaluation.authority_summary) !==
      canonicalizeProtocolValueV01(AUTHORITY_SUMMARY)
  ) {
    failV01("operational_reentry_epistemic_or_authority_overclaim");
  }
  assertCanonicalStringArrayV01(evaluation.limitations, "$.limitations");
  assertCanonicalStringArrayV01(evaluation.missing_evidence, "$.missing_evidence");
  if (evaluation.limitations.length === 0 || evaluation.missing_evidence.length === 0) {
    failV01("operational_reentry_limitations_or_missing_evidence_required");
  }
  assertIntegrityV01(evaluation, "evaluation_id", "operational-reentry-evaluation");
}

function buildEvaluationDerivedShapeV01(
  input: BuildOperationalReentryEvaluationInputV01,
): Pick<
  OperationalReentryEvaluationV01,
  (typeof DERIVED_EVALUATION_KEYS)[number]
> {
  const arms = canonicalArmsV01(input.arms);
  const armByRole = new Map(arms.map((arm) => [arm.role, arm]));
  const exact = armByRole.get("exact_reentry")!;
  const ablation = armByRole.get("matched_single_item_ablation")!;
  const stale = armByRole.get("stale_or_regime_shift_reset")!;
  const baseline = armByRole.get("existing_one_run_baseline")!;
  assertArmFamilyV01(input.source, exact, ablation, stale, baseline);
  const parity = deriveParityV01(exact, ablation, input.source);
  const removed = canonicalStringsV01(
    exact.packet_entry_ids.filter((id) => !ablation.packet_entry_ids.includes(id)),
  );
  const introduced = canonicalStringsV01(
    ablation.packet_entry_ids.filter((id) => !exact.packet_entry_ids.includes(id)),
  );
  const nonTargetEqual = parity.every((row) => row.status === "equal");
  const onlyTarget =
    nonTargetEqual &&
    canonicalizeProtocolValueV01(removed) ===
      canonicalizeProtocolValueV01([input.source.target.packet_entry_id]) &&
    introduced.length === 0 &&
    exact.target_entry_ids.length === 1 &&
    ablation.target_entry_ids.length === 0;
  const conditioning = deriveConditioningV01(
    input.source,
    exact,
    ablation,
    onlyTarget,
  );
  const resetComparison = deriveResetInputParityV01(
    input.source,
    exact,
    ablation,
    stale,
  );
  const staleComparable = deriveStaleComparabilityV01(
    input.source,
    stale,
    resetComparison.inputsEqual,
  );
  const reset = deriveResetV01(input.source, stale, staleComparable);
  return {
    exact_reentry_ablation_parity: parity,
    single_target_intervention: {
      target_entry_id: input.source.target.packet_entry_id,
      exact_reentry_target_present: true,
      ablation_target_present: false,
      removed_entry_ids: removed,
      introduced_entry_ids: [],
      non_target_material_equal: nonTargetEqual,
      only_intended_difference_is_target_presence: onlyTarget,
      direct_conditioning_comparable: onlyTarget,
    },
    stale_regime_relation: {
      matched_arm_role: resetComparison.matchedArmRole,
      input_parity: resetComparison.rows,
      non_stale_regime_inputs_equal: resetComparison.inputsEqual,
      target_identity_preserved:
        stale.target_lineage !== null &&
        canonicalizeProtocolValueV01(stale.target_lineage) ===
          canonicalizeProtocolValueV01(input.source.target),
      explicit_source_bound_pre_outcome_reason:
        stale.stale_relation !== null &&
        stale.stale_relation.applies_before_outcome === true &&
        SHA256.test(stale.stale_relation.source_ref),
      comparable: staleComparable,
    },
    conditioning_relation: conditioning.relation,
    conditioning_basis: conditioning.basis,
    reset_relation: reset.relation,
    reset_basis: reset.basis,
    evidence_ladder: {
      availability: "exact",
      reference:
        exact.downstream.referenced_source_ids.includes(
          input.source.target.packet_entry_id,
        ) ||
        exact.downstream.referenced_source_ids.includes(
          input.source.target.candidate.record_id,
        )
          ? "exact"
          : "not_observed",
      conditioning_candidate: conditioning.relation,
      support_validation: "unknown",
      outcome_association: "unknown",
      causal_contribution: "unknown",
      reset_behavior: reset.relation,
    },
  };
}

function assertSourceNestedShapesV01(source: OperationalReentrySourceV01): void {
  assertRecordRefShapeV01(source.frozen_source_case, "$.frozen_source_case");
  assertRecordRefShapeV01(
    source.parent_comparison_source_case,
    "$.parent_comparison_source_case",
  );
  assertExactKeysV01(source.task, TASK_KEYS, "$.task", "operational_reentry_source_unknown_field");
  assertExactKeysV01(
    source.repository,
    REPOSITORY_KEYS,
    "$.repository",
    "operational_reentry_source_unknown_field",
  );
  assertTargetShapeV01(source.target, "$.target");
  assertExactKeysV01(
    source.baseline,
    BASELINE_KEYS,
    "$.baseline",
    "operational_reentry_source_unknown_field",
  );
  assertRecordRefShapeV01(
    source.baseline.parent_comparison_source_case,
    "$.baseline.parent_comparison_source_case",
  );
  assertExactKeysV01(
    source.stage5_truth,
    STAGE5_TRUTH_KEYS,
    "$.stage5_truth",
    "operational_reentry_source_unknown_field",
  );
  assertMaterialBoundaryShapeV01(source.material_boundary, "$.material_boundary");
  assertIntegrityShapeV01(source.integrity, "$.integrity");
}

function assertArmNestedShapesV01(arm: OperationalReentryArmV01): void {
  assertExactKeysV01(arm.task, TASK_KEYS, "$.task", "operational_reentry_arm_unknown_field");
  assertExactKeysV01(
    arm.repository,
    REPOSITORY_KEYS,
    "$.repository",
    "operational_reentry_arm_unknown_field",
  );
  if (arm.target_lineage !== null) {
    assertTargetShapeV01(arm.target_lineage, "$.target_lineage");
  }
  if (arm.stale_relation !== null) {
    assertExactKeysV01(
      arm.stale_relation,
      STALE_RELATION_KEYS,
      "$.stale_relation",
      "operational_reentry_arm_unknown_field",
    );
    if (
      ![
        "stale",
        "contradicted",
        "superseded",
        "regime_inapplicable",
      ].includes(arm.stale_relation.reason_kind) ||
      typeof arm.stale_relation.target_entry_id !== "string" ||
      arm.stale_relation.target_entry_id.length === 0 ||
      !SHA256.test(arm.stale_relation.source_ref) ||
      parseStrictIsoTimestampV01(arm.stale_relation.reason_observed_at) === null ||
      arm.stale_relation.applies_before_outcome !== true ||
      typeof arm.stale_relation.regime_key !== "string" ||
      arm.stale_relation.regime_key.length === 0
    ) {
      failV01("operational_reentry_stale_relation_invalid", "$.stale_relation");
    }
  }
  assertIntegrityShapeV01(arm.integrity, "$.integrity");
}

function assertEvaluationNestedShapesV01(
  evaluation: OperationalReentryEvaluationV01,
): void {
  assertExactKeysV01(
    evaluation.single_target_intervention,
    SINGLE_TARGET_INTERVENTION_KEYS,
    "$.single_target_intervention",
    "operational_reentry_evaluation_unknown_field",
  );
  assertExactKeysV01(
    evaluation.stale_regime_relation,
    STALE_REGIME_SUMMARY_KEYS,
    "$.stale_regime_relation",
    "operational_reentry_evaluation_unknown_field",
  );
  assertExactKeysV01(
    evaluation.evidence_ladder,
    EVIDENCE_LADDER_KEYS,
    "$.evidence_ladder",
    "operational_reentry_evaluation_unknown_field",
  );
  assertExactKeysV01(
    evaluation.authority_summary,
    AUTHORITY_KEYS,
    "$.authority_summary",
    "operational_reentry_evaluation_unknown_field",
  );
  assertMaterialBoundaryShapeV01(
    evaluation.material_boundary,
    "$.material_boundary",
  );
  assertIntegrityShapeV01(evaluation.integrity, "$.integrity");
  for (let index = 0; index < evaluation.exact_reentry_ablation_parity.length; index += 1) {
    assertExactKeysV01(
      evaluation.exact_reentry_ablation_parity[index],
      PARITY_ROW_KEYS,
      `$.exact_reentry_ablation_parity[${index}]`,
      "operational_reentry_evaluation_unknown_field",
    );
  }
  for (let index = 0; index < evaluation.stale_regime_relation.input_parity.length; index += 1) {
    assertExactKeysV01(
      evaluation.stale_regime_relation.input_parity[index],
      RESET_PARITY_ROW_KEYS,
      `$.stale_regime_relation.input_parity[${index}]`,
      "operational_reentry_evaluation_unknown_field",
    );
  }
}

function assertTargetShapeV01(
  target: OperationalReentrySourceV01["target"],
  path: string,
): void {
  assertExactKeysV01(target, TARGET_KEYS, path, "operational_reentry_target_unknown_field");
  assertExactKeysV01(
    target.external_ref,
    TARGET_EXTERNAL_REF_KEYS,
    `${path}.external_ref`,
    "operational_reentry_target_unknown_field",
  );
  assertExactKeysV01(
    target.currentness,
    TARGET_CURRENTNESS_KEYS,
    `${path}.currentness`,
    "operational_reentry_target_unknown_field",
  );
  for (const [field, value] of Object.entries({
    candidate: target.candidate,
    selection: target.selection,
    materialization: target.materialization,
    admission: target.admission,
    packet_a: target.packet_a,
    packet_b: target.packet_b,
    lineage_run_receipt: target.lineage_run_receipt,
    attribution_projection: target.attribution_projection,
  })) {
    assertRecordRefShapeV01(value, `${path}.${field}`);
  }
  assertExactKeysV01(
    target.attribution_row,
    ATTRIBUTION_ROW_KEYS,
    `${path}.attribution_row`,
    "operational_reentry_target_unknown_field",
  );
}

function assertRecordRefShapeV01(
  ref: unknown,
  path: string,
): asserts ref is OperationalReentrySourceV01["parent_comparison_source_case"] {
  assertExactKeysV01(ref, RECORD_REF_KEYS, path, "operational_reentry_record_ref_unknown_field");
  const record = ref as Record<string, unknown>;
  if (
    typeof record.record_version !== "string" ||
    record.record_version.length === 0 ||
    typeof record.record_id !== "string" ||
    record.record_id.length === 0 ||
    typeof record.record_fingerprint !== "string" ||
    !SHA256.test(record.record_fingerprint)
  ) {
    failV01("operational_reentry_record_ref_invalid", path);
  }
}

function assertMaterialBoundaryShapeV01(value: unknown, path: string): void {
  assertExactKeysV01(
    value,
    MATERIAL_BOUNDARY_KEYS,
    path,
    "operational_reentry_material_boundary_unknown_field",
  );
  if (
    canonicalizeProtocolValueV01(value) !==
    canonicalizeProtocolValueV01(MATERIAL_BOUNDARY)
  ) {
    failV01("operational_reentry_material_boundary_invalid", path);
  }
}

function assertIntegrityShapeV01(value: unknown, path: string): void {
  assertExactKeysV01(
    value,
    INTEGRITY_KEYS,
    path,
    "operational_reentry_integrity_unknown_field",
  );
}

function assertExactStage5SourceV01(source: OperationalReentrySourceV01): void {
  const exactPairs: Array<[unknown, unknown, string]> = [
    [source.source_id, ACGC_E1_EXACT_SOURCE_ID_V01, "source_id"],
    [source.integrity.fingerprint, ACGC_E1_EXACT_SOURCE_FINGERPRINT_V01, "source_fingerprint"],
    [source.merged_stage5_baseline_commit, ACGC_E1_STAGE5_BASELINE_COMMIT_V01, "baseline_commit"],
    [source.frozen_source_case.record_version, "model_host_succession_frozen_case.v0.1", "frozen_source_case_version"],
    [source.frozen_source_case.record_id, ACGC_E1_FROZEN_SOURCE_CASE_ID_V01, "frozen_source_case_id"],
    [source.frozen_source_case.record_fingerprint, ACGC_E1_FROZEN_SOURCE_CASE_FINGERPRINT_V01, "frozen_source_case_fingerprint"],
    [source.parent_comparison_source_case.record_version, "operational_continuation_comparison.v0.1", "comparison_version"],
    [source.parent_comparison_source_case.record_id, ACGC_E1_STAGE5_COMPARISON_SOURCE_CASE_ID_V01, "comparison_source_case_id"],
    [source.parent_comparison_source_case.record_fingerprint, ACGC_E1_STAGE5_COMPARISON_SOURCE_CASE_FINGERPRINT_V01, "comparison_source_case_fingerprint"],
    [source.evaluation_case_id, "evaluation-case:acgc5c-stage-5", "evaluation_case"],
    [source.target.packet_entry_id, ACGC_E1_TARGET_ENTRY_ID_V01, "target_entry"],
    [source.target.external_ref.external_id, ACGC_E1_TARGET_CANDIDATE_ID_V01, "target_external_ref"],
    [source.target.external_ref.source_ref, ACGC_E1_TARGET_CANDIDATE_FINGERPRINT_V01, "target_external_fingerprint"],
    [source.target.candidate.record_id, ACGC_E1_TARGET_CANDIDATE_ID_V01, "candidate_id"],
    [source.target.candidate.record_fingerprint, ACGC_E1_TARGET_CANDIDATE_FINGERPRINT_V01, "candidate_fingerprint"],
    [source.target.selection.record_id, ACGC_E1_SELECTION_ID_V01, "selection_id"],
    [source.target.selection.record_fingerprint, ACGC_E1_SELECTION_FINGERPRINT_V01, "selection_fingerprint"],
    [source.target.materialization.record_id, ACGC_E1_MATERIALIZATION_ID_V01, "materialization_id"],
    [source.target.materialization.record_fingerprint, ACGC_E1_MATERIALIZATION_FINGERPRINT_V01, "materialization_fingerprint"],
    [source.target.admission.record_id, ACGC_E1_ADMISSION_ID_V01, "admission_id"],
    [source.target.admission.record_fingerprint, ACGC_E1_ADMISSION_FINGERPRINT_V01, "admission_fingerprint"],
  ];
  for (const [actual, expected, label] of exactPairs) {
    if (actual !== expected) failV01("operational_reentry_stage5_source_identity_mismatch", `$.${label}`);
  }
  if (!COMMIT.test(source.repository.frozen_head_commit)) {
    failV01("operational_reentry_repository_head_invalid", "$.repository.frozen_head_commit");
  }
  if (
    source.data_is_synthetic_public_safe !== true ||
    source.selected_target_count !== 1 ||
    source.target_disposition !== "selected_effective_accept" ||
    source.target_is_bundle !== false ||
    source.target_budget_excluded !== false ||
    source.target_unresolved !== false
  ) {
    failV01("operational_reentry_target_not_exact_selected_single_item");
  }
  if (
    source.target.attribution_row.actual_use !== "unknown" ||
    source.target.attribution_row.support_validation !== "unknown" ||
    source.target.attribution_row.outcome_association !== "unknown" ||
    source.target.attribution_row.causal_contribution !== "unknown" ||
    source.target.attribution_row.item_level_credit_or_blame !== false ||
    source.stage5_truth.item_actual_use !== "unknown" ||
    source.stage5_truth.support_validation !== "unknown" ||
    source.stage5_truth.outcome_association !== "unknown" ||
    source.stage5_truth.causal_contribution !== "unknown" ||
    source.stage5_truth.item_actual_use_proven_count !== 0 ||
    source.stage5_truth.support_validated_count !== 0 ||
    source.stage5_truth.outcome_associated_count !== 0 ||
    source.stage5_truth.causally_supported_count !== 0 ||
    source.stage5_truth.exact_case_status !== "inconclusive" ||
    source.stage5_truth.bundle_credit_assigned !== false
  ) {
    failV01("operational_reentry_stage5_truth_overclaim");
  }
  if (
    source.baseline.binding_kind !==
      "exact_rebuilt_operational_comparison_one_run_semantics" ||
    source.baseline.scope_is_rebuilt_isolated_semantics !== true ||
    canonicalizeProtocolValueV01(
      source.baseline.parent_comparison_source_case,
    ) !== canonicalizeProtocolValueV01(source.parent_comparison_source_case) ||
    source.baseline.equal_ceiling_fingerprint !==
      source.repository.equal_ceiling_fingerprint ||
    source.continuation_hop !== 1 ||
    source.second_continuation_hop_present !== false ||
    source.baseline.run_count !== 1 ||
    source.baseline.resume_used !== false ||
    source.baseline.operational_continuation_present !== false ||
    source.baseline.packet_b_present !== false ||
    source.baseline.continuation_admission_present !== false ||
    source.baseline.post_cutoff_candidate_material_present !== false
  ) {
    failV01("operational_reentry_stage5_lineage_or_baseline_invalid");
  }
  if (
    source.target.packet_a.record_id === source.target.packet_b.record_id ||
    source.target.packet_a.record_fingerprint === source.target.packet_b.record_fingerprint
  ) {
    failV01("operational_reentry_packet_a_b_relation_invalid");
  }
  if (
    source.workspace_id === source.baseline.workspace_id ||
    source.project_id === source.baseline.project_id ||
    source.work_id !== source.baseline.work_id ||
    source.work_fingerprint !== source.baseline.work_fingerprint ||
    source.evaluation_case_id !== source.baseline.evaluation_case_id
  ) {
    failV01("operational_reentry_baseline_scope_relation_invalid");
  }
  assertCanonicalStringArrayV01(source.packet_b_entry_ids, "$.packet_b_entry_ids");
  assertCanonicalStringArrayV01(source.packet_b_entry_fingerprints, "$.packet_b_entry_fingerprints");
  assertCanonicalStringArrayV01(source.non_target_packet_entry_ids, "$.non_target_packet_entry_ids");
  assertCanonicalStringArrayV01(source.non_target_packet_entry_fingerprints, "$.non_target_packet_entry_fingerprints");
  assertCanonicalStringArrayV01(source.non_target_downstream_input_fingerprints, "$.non_target_downstream_input_fingerprints");
  if (
    source.packet_b_entry_ids.length !== source.packet_b_entry_fingerprints.length ||
    source.non_target_packet_entry_ids.length !== source.non_target_packet_entry_fingerprints.length ||
    !source.packet_b_entry_ids.includes(source.target.packet_entry_id) ||
    source.non_target_packet_entry_ids.includes(source.target.packet_entry_id) ||
    source.packet_b_entry_ids.length !== source.non_target_packet_entry_ids.length + 1
  ) {
    failV01("operational_reentry_packet_target_partition_invalid");
  }
  const sourceTime = parseStrictIsoTimestampV01(source.target.currentness.as_of);
  const construction = parseStrictIsoTimestampV01(source.repository.construction_cutoff);
  const observation = parseStrictIsoTimestampV01(source.repository.observation_cutoff);
  if (
    sourceTime === null ||
    construction === null ||
    observation === null ||
    construction >= observation ||
    sourceTime >= observation
  ) {
    failV01("operational_reentry_source_cutoff_invalid");
  }
  for (const value of allFingerprintsV01(source)) {
    if (!SHA256.test(value)) failV01("operational_reentry_fingerprint_invalid");
  }
}

function assertArmFamilyV01(
  source: OperationalReentrySourceV01,
  exact: OperationalReentryArmV01,
  ablation: OperationalReentryArmV01,
  stale: OperationalReentryArmV01,
  baseline: OperationalReentryArmV01,
): void {
  for (const arm of [exact, ablation, stale, baseline]) {
    if (
      arm.source_id !== source.source_id ||
      arm.source_fingerprint !== source.integrity.fingerprint ||
      arm.evaluation_case_id !== source.evaluation_case_id ||
      arm.work_id !== source.work_id
    ) {
      failV01("operational_reentry_arm_cross_source_or_work_scope", `$.arms.${arm.role}`);
    }
  }
  if (
    baseline.evidence_class !== "synthetic_source_observation" ||
    [exact, ablation, stale].some(
      (arm) =>
        arm.evidence_class !== "deterministic_fixture_execution" &&
        arm.evidence_class !== "unobserved",
    )
  ) {
    failV01("operational_reentry_arm_evidence_class_relation_invalid");
  }
  for (const arm of [exact, ablation, stale]) {
    if (
      arm.workspace_id !== source.workspace_id ||
      arm.project_id !== source.project_id ||
      arm.target_lineage === null ||
      canonicalizeProtocolValueV01(arm.target_lineage) !==
        canonicalizeProtocolValueV01(source.target)
    ) {
      failV01("operational_reentry_target_lineage_mismatch", `$.arms.${arm.role}`);
    }
  }
  if (
    exact.target_entry_ids.length !== 1 ||
    exact.target_entry_ids[0] !== source.target.packet_entry_id ||
    canonicalizeProtocolValueV01(exact.packet_entry_ids) !==
      canonicalizeProtocolValueV01(source.packet_b_entry_ids) ||
    canonicalizeProtocolValueV01(exact.packet_entry_fingerprints) !==
      canonicalizeProtocolValueV01(source.packet_b_entry_fingerprints)
  ) {
    failV01("operational_reentry_exact_target_presence_invalid");
  }
  if (
    ablation.target_entry_ids.length !== 0 ||
    ablation.packet_entry_ids.includes(source.target.packet_entry_id) ||
    ablation.downstream.referenced_source_ids.some((ref) => isTargetRefV01(source, ref))
  ) {
    failV01("operational_reentry_ablation_target_survived");
  }
  if (
    baseline.workspace_id !== source.baseline.workspace_id ||
    baseline.project_id !== source.baseline.project_id ||
    baseline.target_lineage !== null ||
    baseline.target_entry_ids.length !== 0 ||
    baseline.packet_entry_ids.length !== 0 ||
    baseline.packet_entry_fingerprints.length !== 0 ||
    baseline.stale_relation !== null ||
    baseline.downstream.referenced_source_ids.some((ref) => isTargetRefV01(source, ref))
  ) {
    failV01("operational_reentry_one_run_baseline_invalid");
  }
  if (exact.stale_relation !== null || ablation.stale_relation !== null) {
    failV01("operational_reentry_stale_relation_wrong_arm");
  }
  if (stale.stale_relation === null) {
    return;
  }
  if (
    stale.stale_relation.target_entry_id !== source.target.packet_entry_id ||
    !SHA256.test(stale.stale_relation.source_ref)
  ) {
    failV01("operational_reentry_stale_reason_unrelated");
  }
  const staleTargetPresent = stale.target_entry_ids.includes(
    source.target.packet_entry_id,
  );
  if (
    canonicalizeProtocolValueV01(stale.target_entry_ids) !==
      canonicalizeProtocolValueV01(
        staleTargetPresent ? [source.target.packet_entry_id] : [],
      )
  ) {
    failV01("operational_reentry_stale_target_partition_invalid");
  }
  const expectedStaleEntryIds = staleTargetPresent
    ? source.packet_b_entry_ids
    : source.non_target_packet_entry_ids;
  const expectedStaleFingerprints = staleTargetPresent
    ? source.packet_b_entry_fingerprints
    : source.non_target_packet_entry_fingerprints;
  if (
    canonicalizeProtocolValueV01(stale.packet_entry_ids) !==
      canonicalizeProtocolValueV01(expectedStaleEntryIds) ||
    canonicalizeProtocolValueV01(stale.packet_entry_fingerprints) !==
      canonicalizeProtocolValueV01(expectedStaleFingerprints)
  ) {
    failV01("operational_reentry_stale_packet_relation_invalid");
  }
}

function deriveParityV01(
  exact: OperationalReentryArmV01,
  ablation: OperationalReentryArmV01,
  source: OperationalReentrySourceV01,
): OperationalReentryParityRowV01[] {
  const values = parityValuesV01(exact, source);
  const other = parityValuesV01(ablation, source);
  return PARITY_DIMENSIONS.map((dimension) => ({
    dimension,
    status:
      canonicalizeProtocolValueV01(values[dimension]) ===
      canonicalizeProtocolValueV01(other[dimension])
        ? "equal"
        : "not_comparable",
    exact_reentry_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(values[dimension]),
    ),
    ablation_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(other[dimension]),
    ),
  }));
}

function parityValuesV01(
  arm: OperationalReentryArmV01,
  source: OperationalReentrySourceV01,
): Record<OperationalReentryParityDimensionV01, unknown> {
  const target = source.target.packet_entry_id;
  const nonTargetPacketRows = arm.packet_entry_ids
    .map((entryId, index) => ({ entry_id: entryId, fingerprint: arm.packet_entry_fingerprints[index] }))
    .filter((row) => row.entry_id !== target);
  return {
    task_goal: arm.task.goal,
    success_criteria: arm.task.success_criteria,
    non_goals: arm.task.non_goals,
    required_checks: arm.task.required_checks,
    forbidden_actions: arm.task.forbidden_actions,
    data_classification: arm.task.data_classification,
    task_family_identity: arm.task.task_family_key,
    frozen_repository_head: arm.repository.frozen_head_commit,
    initial_worktree_content: arm.repository.initial_worktree_content_fingerprint,
    construction_cutoff: arm.repository.construction_cutoff,
    observation_cutoff_policy: [
      arm.repository.observation_cutoff,
      arm.repository.observation_cutoff_policy,
    ],
    platform: arm.repository.platform,
    deterministic_adapter_identity: arm.repository.deterministic_adapter_identity,
    capability_version_and_coverage: [
      arm.repository.capability_version,
      arm.repository.capability_coverage,
      arm.repository.equal_budget_is_equal_capability,
    ],
    operation_approval_policy: arm.repository.operation_approval_policy_fingerprint,
    verification_owner_set: arm.repository.verification_owner_set_fingerprint,
    declared_equal_ceiling: arm.repository.equal_ceiling_fingerprint,
    non_target_packet_entries: {
      entry_ids: nonTargetPacketRows.map((row) => row.entry_id).sort(),
      entry_fingerprints: arm.packet_entry_fingerprints.filter(
        (fingerprint) =>
          source.non_target_packet_entry_fingerprints.includes(fingerprint),
      ),
    },
    non_target_downstream_inputs: arm.non_target_downstream_input_fingerprints,
  };
}

function deriveResetInputParityV01(
  source: OperationalReentrySourceV01,
  exact: OperationalReentryArmV01,
  ablation: OperationalReentryArmV01,
  stale: OperationalReentryArmV01,
): {
  matchedArmRole: OperationalReentryResetMatchedArmRoleV01;
  rows: OperationalReentryResetInputParityRowV01[];
  inputsEqual: boolean;
} {
  const targetRetained = stale.target_entry_ids.includes(
    source.target.packet_entry_id,
  );
  const matchedArm = targetRetained ? exact : ablation;
  const matchedArmRole: OperationalReentryResetMatchedArmRoleV01 =
    targetRetained ? "exact_reentry" : "matched_single_item_ablation";
  const matchedValues = parityValuesV01(matchedArm, source);
  const resetValues = parityValuesV01(stale, source);
  const rows = PARITY_DIMENSIONS.map((dimension) => ({
    dimension,
    status:
      canonicalizeProtocolValueV01(matchedValues[dimension]) ===
      canonicalizeProtocolValueV01(resetValues[dimension])
        ? ("equal" as const)
        : ("not_comparable" as const),
    matched_arm_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(matchedValues[dimension]),
    ),
    reset_arm_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(resetValues[dimension]),
    ),
  }));
  return {
    matchedArmRole,
    rows,
    inputsEqual: rows.every((row) => row.status === "equal"),
  };
}

function deriveConditioningV01(
  source: OperationalReentrySourceV01,
  exact: OperationalReentryArmV01,
  ablation: OperationalReentryArmV01,
  comparable: boolean,
): { relation: OperationalReentryConditioningRelationV01; basis: string } {
  if (!comparable) {
    return {
      relation: "not_comparable",
      basis: "A and B do not prove exact parity outside one target-entry removal.",
    };
  }
  if (
    exact.evidence_class === "unobserved" ||
    ablation.evidence_class === "unobserved" ||
    exact.downstream.response_status === "unobserved" ||
    ablation.downstream.response_status === "unobserved"
  ) {
    return {
      relation: "unknown",
      basis: "One or both matched downstream fixture observations are unobserved.",
    };
  }
  const exactTargetReferencePresent =
    exact.downstream.referenced_source_ids.includes(
      source.target.packet_entry_id,
    );
  const ablationTargetReferencePresent =
    ablation.downstream.referenced_source_ids.some((ref) =>
      isTargetRefV01(source, ref),
    );
  const exactNonTargetReferences = exact.downstream.referenced_source_ids.filter(
    (ref) => !isTargetRefV01(source, ref),
  );
  const ablationNonTargetReferences =
    ablation.downstream.referenced_source_ids.filter(
      (ref) => !isTargetRefV01(source, ref),
    );
  if (
    canonicalizeProtocolValueV01(exactNonTargetReferences) !==
    canonicalizeProtocolValueV01(ablationNonTargetReferences)
  ) {
    return {
      relation: "not_comparable",
      basis: "A and B contain an unrelated added or removed reference outside the exact target-reference relation.",
    };
  }
  const structuredDelta =
    canonicalizeProtocolValueV01(downstreamBeyondReferenceV01(exact.downstream)) !==
    canonicalizeProtocolValueV01(downstreamBeyondReferenceV01(ablation.downstream));
  if (structuredDelta) {
    return {
      relation: "structured_delta_observed",
      basis: "Under exact single-target parity, at least one bounded structured downstream dimension changed beyond reference presence.",
    };
  }
  if (exactTargetReferencePresent && !ablationTargetReferencePresent) {
    return {
      relation: "reference_only",
      basis: "The exact target reference is present in A and absent from B, canonically equal non-target reference sets are preserved, and no other bounded structured downstream dimension changed.",
    };
  }
  return {
    relation: "no_structured_delta_observed",
    basis: "Target presence and absence produced no supported bounded structured downstream difference.",
  };
}

function deriveStaleComparabilityV01(
  source: OperationalReentrySourceV01,
  arm: OperationalReentryArmV01,
  nonStaleRegimeInputsEqual: boolean,
): boolean {
  const relation = arm.stale_relation;
  if (relation === null) return false;
  const observedAt = parseStrictIsoTimestampV01(relation.reason_observed_at);
  const cutoff = parseStrictIsoTimestampV01(source.repository.observation_cutoff);
  return (
    observedAt !== null &&
    cutoff !== null &&
    observedAt < cutoff &&
    relation.applies_before_outcome === true &&
    nonStaleRegimeInputsEqual &&
    relation.target_entry_id === source.target.packet_entry_id &&
    SHA256.test(relation.source_ref) &&
    arm.target_lineage !== null &&
    canonicalizeProtocolValueV01(arm.target_lineage) ===
      canonicalizeProtocolValueV01(source.target)
  );
}

function deriveResetV01(
  source: OperationalReentrySourceV01,
  arm: OperationalReentryArmV01,
  comparable: boolean,
): { relation: OperationalReentryResetRelationV01; basis: string } {
  if (!comparable) {
    return {
      relation: "not_comparable",
      basis: "The stale/regime source, cutoff, exact target-lineage relation, or matched non-stale/regime input parity is invalid.",
    };
  }
  if (
    arm.evidence_class === "unobserved" ||
    arm.downstream.response_status === "unobserved"
  ) {
    return {
      relation: "unknown",
      basis: "The stale/regime response behavior is unobserved.",
    };
  }
  const targetPersisted =
    arm.target_entry_ids.includes(source.target.packet_entry_id) ||
    arm.packet_entry_ids.includes(source.target.packet_entry_id) ||
    arm.downstream.referenced_source_ids.some((ref) => isTargetRefV01(source, ref)) ||
    arm.downstream.operation_action_classes.some((value) => value.includes("target"));
  if (targetPersisted) {
    return {
      relation: "stale_persistence_candidate",
      basis: "The exact stale or regime-inapplicable target persists in bounded reference, packet, action, or decision-preparation structure.",
    };
  }
  const resetStatuses = new Set([
    "withheld",
    "refused",
    "abstained",
  ]);
  if (resetStatuses.has(arm.downstream.response_status)) {
    return {
      relation: "appropriate_reset_observed",
      basis: "The deterministic fixture explicitly withheld, refused, or abstained from the stale target under matched non-stale/regime inputs.",
    };
  }
  return {
    relation: "unknown",
    basis: "The structured fixture behavior does not establish withholding, refusal, abstention, or persistence.",
  };
}

function canonicalArmsV01(arms: OperationalReentryArmV01[]): OperationalReentryArmV01[] {
  if (!Array.isArray(arms) || arms.length !== OPERATIONAL_REENTRY_ARM_ROLE_ORDER_V01.length) {
    failV01("operational_reentry_four_arm_family_required", "$.arms");
  }
  arms.forEach(assertValidOperationalReentryArmV01);
  const counts = new Map<string, number>();
  for (const arm of arms) counts.set(arm.role, (counts.get(arm.role) ?? 0) + 1);
  for (const role of OPERATIONAL_REENTRY_ARM_ROLE_ORDER_V01) {
    if (counts.get(role) !== 1) failV01("operational_reentry_arm_role_cardinality_invalid", `$.arms.${role}`);
  }
  return [...arms].sort(
    (left, right) =>
      OPERATIONAL_REENTRY_ARM_ROLE_ORDER_V01.indexOf(left.role) -
      OPERATIONAL_REENTRY_ARM_ROLE_ORDER_V01.indexOf(right.role),
  ).map(cloneV01);
}

function canonicalTaskV01<T extends OperationalReentrySourceV01["task"]>(task: T): T {
  return {
    ...cloneV01(task),
    success_criteria: canonicalStringsV01(task.success_criteria),
    non_goals: canonicalStringsV01(task.non_goals),
    required_checks: canonicalStringsV01(task.required_checks),
    forbidden_actions: canonicalStringsV01(task.forbidden_actions),
  } as T;
}

function canonicalRepositoryV01<T extends OperationalReentrySourceV01["repository"]>(
  repository: T,
): T {
  return {
    ...cloneV01(repository),
    capability_coverage: canonicalStringsV01(repository.capability_coverage),
  } as T;
}

function canonicalDownstreamV01(
  downstream: OperationalReentryDownstreamVectorV01,
): OperationalReentryDownstreamVectorV01 {
  return {
    ...cloneV01(downstream),
    referenced_source_ids: canonicalStringsV01(downstream.referenced_source_ids),
    required_check_dispositions: [...downstream.required_check_dispositions]
      .map(cloneV01)
      .sort(compareProtocolCanonicalV01),
    operation_action_classes: canonicalStringsV01(downstream.operation_action_classes),
    blocker_warning_gap_classes: canonicalStringsV01(downstream.blocker_warning_gap_classes),
    changed_artifacts: [...downstream.changed_artifacts]
      .map(cloneV01)
      .sort(compareProtocolCanonicalV01),
    result_limitations: canonicalStringsV01(downstream.result_limitations),
  };
}

function assertDownstreamV01(downstream: OperationalReentryDownstreamVectorV01): void {
  if (!isProtocolRecordV01(downstream)) failV01("operational_reentry_downstream_malformed");
  assertExactKeysV01(
    downstream,
    DOWNSTREAM_KEYS,
    "$.downstream",
    "operational_reentry_downstream_unknown_field",
  );
  for (let index = 0; index < downstream.required_check_dispositions.length; index += 1) {
    const row = downstream.required_check_dispositions[index]!;
    assertExactKeysV01(
      row,
      CHECK_DISPOSITION_KEYS,
      `$.downstream.required_check_dispositions[${index}]`,
      "operational_reentry_downstream_unknown_field",
    );
    if (
      typeof row.check_id !== "string" ||
      !["passed", "failed", "blocked", "skipped", "unknown"].includes(
        row.disposition,
      )
    ) {
      failV01("operational_reentry_check_disposition_invalid");
    }
  }
  for (let index = 0; index < downstream.changed_artifacts.length; index += 1) {
    assertExactKeysV01(
      downstream.changed_artifacts[index],
      CHANGED_ARTIFACT_KEYS,
      `$.downstream.changed_artifacts[${index}]`,
      "operational_reentry_downstream_unknown_field",
    );
  }
  if (
    ![
      "continued",
      "withheld",
      "refused",
      "abstained",
      "unobserved",
    ].includes(downstream.response_status)
  ) {
    failV01("operational_reentry_response_status_invalid");
  }
  if (
    canonicalizeProtocolValueV01(canonicalDownstreamV01(downstream)) !==
    canonicalizeProtocolValueV01(downstream)
  ) {
    failV01("operational_reentry_downstream_not_canonical");
  }
}

function downstreamBeyondReferenceV01(downstream: OperationalReentryDownstreamVectorV01) {
  return {
    required_check_dispositions: downstream.required_check_dispositions,
    operation_action_classes: downstream.operation_action_classes,
    blocker_warning_gap_classes: downstream.blocker_warning_gap_classes,
    changed_artifacts: downstream.changed_artifacts,
    result_limitations: downstream.result_limitations,
    response_status: downstream.response_status,
  };
}

function isTargetRefV01(source: OperationalReentrySourceV01, ref: string): boolean {
  return [
    source.target.packet_entry_id,
    source.target.candidate.record_id,
    source.target.selection.record_id,
    source.target.materialization.record_id,
    source.target.admission.record_id,
  ].includes(ref);
}

function assertIntegrityV01(
  record: object & { integrity: OperationalReentryIntegrityV01 },
  idField: "source_id" | "arm_id" | "evaluation_id",
  prefix: string,
): void {
  if (
    record.integrity.algorithm !== "sha256" ||
    record.integrity.canonicalization !== "augnes-json-c14n-v0_1" ||
    !SHA256.test(record.integrity.fingerprint)
  ) {
    failV01("operational_reentry_integrity_malformed", `$.${idField}`);
  }
  const recordShape = record as unknown as Record<string, unknown>;
  const expectedId = deriveIdV01(recordShape, idField, prefix);
  if (recordShape[idField] !== expectedId) failV01("operational_reentry_id_mismatch", `$.${idField}`);
  if (record.integrity.fingerprint !== fingerprintV01(record)) {
    failV01("operational_reentry_fingerprint_mismatch", "$.integrity.fingerprint");
  }
}

function deriveIdV01(
  record: object,
  idField: string,
  prefix: string,
): string {
  const candidate = cloneV01(record) as Record<string, unknown>;
  candidate[idField] = `${prefix}:pending`;
  const integrity = candidate.integrity as OperationalReentryIntegrityV01;
  integrity.fingerprint = PENDING_FINGERPRINT;
  return `${prefix}:${createProtocolSha256V01(canonicalizeProtocolValueV01(candidate)).slice(7, 39)}`;
}

function fingerprintV01(record: { integrity: OperationalReentryIntegrityV01 }): string {
  const candidate = cloneV01(record);
  candidate.integrity.fingerprint = PENDING_FINGERPRINT;
  return createProtocolSha256V01(canonicalizeProtocolValueV01(candidate));
}

function pendingIntegrityV01(scope: string): OperationalReentryIntegrityV01 {
  return {
    algorithm: "sha256",
    canonicalization: "augnes-json-c14n-v0_1",
    fingerprint_scope: scope,
    fingerprint: PENDING_FINGERPRINT,
  };
}

function assertSafeMaterialV01(value: unknown): void {
  const found: Array<{ code: string; path: string }> = [];
  const sink: ProtocolValidationIssueSinkV01 = {
    error(code, path) {
      if (found.length === 0) found.push({ code, path: path ?? "$" });
    },
    warning() {},
  };
  scanForbiddenProtocolMaterialV01(value, "$", sink, {
    secret_material_message: "Secret-shaped material is forbidden in ACGC-E1.",
    provider_specific_field_message: "Provider identity is forbidden in ACGC-E1.",
    allowed_false_invariant_fields: new Set([
      ...Object.keys(AUTHORITY_SUMMARY),
      ...Object.keys(MATERIAL_BOUNDARY),
      "post_cutoff_material_present",
      "product_admission_used",
      "product_state_mutated",
      "real_provider_or_model_evidence",
      "empirical_general_benefit_observed",
      "target_is_bundle",
      "target_budget_excluded",
      "target_unresolved",
      "second_continuation_hop_present",
      "resume_used",
      "operational_continuation_present",
      "packet_b_present",
      "continuation_admission_present",
      "post_cutoff_candidate_material_present",
      "semantic_transition_eligible",
      "item_level_credit_or_blame",
      "bundle_credit_assigned",
      "equal_budget_is_equal_capability",
    ]),
  });
  if (found[0]) failV01(found[0].code, found[0].path);
  walkBoundsV01(value, "$", new Set());
}

function walkBoundsV01(value: unknown, path: string, seen: Set<object>): void {
  if (typeof value === "string") {
    if (value.length > MAX_TEXT) failV01("operational_reentry_text_bound_exceeded", path);
    if (PRIVATE_PATH.test(value)) failV01("operational_reentry_private_path_refused", path);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ITEMS) failV01("operational_reentry_collection_bound_exceeded", path);
    value.forEach((item, index) => walkBoundsV01(item, `${path}[${index}]`, seen));
    return;
  }
  if (!isProtocolRecordV01(value)) return;
  if (seen.has(value)) failV01("operational_reentry_cyclic_material_refused", path);
  seen.add(value);
  for (const [key, child] of Object.entries(value)) walkBoundsV01(child, `${path}.${key}`, seen);
  seen.delete(value);
}

function allFingerprintsV01(source: OperationalReentrySourceV01): string[] {
  return [
    source.work_fingerprint,
    source.frozen_source_case.record_fingerprint,
    source.parent_comparison_source_case.record_fingerprint,
    source.repository.initial_worktree_content_fingerprint,
    source.repository.operation_approval_policy_fingerprint,
    source.repository.verification_owner_set_fingerprint,
    source.repository.equal_ceiling_fingerprint,
    source.target.external_ref.source_ref,
    source.target.candidate.record_fingerprint,
    source.target.selection.record_fingerprint,
    source.target.materialization.record_fingerprint,
    source.target.admission.record_fingerprint,
    source.target.packet_a.record_fingerprint,
    source.target.packet_b.record_fingerprint,
    source.target.lineage_run_receipt.record_fingerprint,
    source.target.attribution_projection.record_fingerprint,
    source.baseline.work_fingerprint,
    source.baseline.parent_comparison_source_case.record_fingerprint,
    source.baseline.equal_ceiling_fingerprint,
    ...source.packet_b_entry_fingerprints,
    ...source.non_target_packet_entry_fingerprints,
    ...source.non_target_downstream_input_fingerprints,
  ];
}

function canonicalStringsV01(values: string[]): string[] {
  if (!Array.isArray(values)) failV01("operational_reentry_string_collection_invalid");
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))].sort();
}

function assertCanonicalStringArrayV01(values: string[], path: string): void {
  if (
    !Array.isArray(values) ||
    canonicalizeProtocolValueV01(values) !==
      canonicalizeProtocolValueV01(canonicalStringsV01(values))
  ) {
    failV01("operational_reentry_string_collection_not_canonical", path);
  }
}

function assertExactKeysV01(
  value: unknown,
  allowed: ReadonlySet<string>,
  path: string,
  code: string,
): void {
  if (!isProtocolRecordV01(value)) failV01(`${code}_malformed`, path);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) failV01(code, `${path}.${key}`);
  }
}

function assertInputUnchangedV01(before: string, input: unknown, code: string): void {
  if (canonicalizeProtocolValueV01(input) !== before) failV01(code);
}

function validationResultV01(
  run: () => void,
): OperationalReentryValidationResultV01 {
  try {
    run();
    return { status: "valid", errors: [] };
  } catch (error) {
    if (error instanceof OperationalReentryPerturbationErrorV01) {
      return { status: "blocked", errors: [{ code: error.code, path: error.path }] };
    }
    return {
      status: "blocked",
      errors: [{ code: "operational_reentry_validation_failed", path: "$" }],
    };
  }
}

function failV01(code: string, path = "$"): never {
  throw new OperationalReentryPerturbationErrorV01(code, path);
}

function cloneV01<T>(value: T): T {
  return structuredClone(value);
}

const SOURCE_INPUT_KEYS = new Set([
  "merged_stage5_baseline_commit", "workspace_id", "project_id", "work_id",
  "work_fingerprint", "evaluation_case_id", "frozen_source_case", "parent_comparison_source_case", "task",
  "repository", "target", "packet_b_entry_ids", "packet_b_entry_fingerprints",
  "non_target_packet_entry_ids", "non_target_packet_entry_fingerprints",
  "non_target_downstream_input_fingerprints", "selected_target_count",
  "target_disposition", "target_is_bundle", "target_budget_excluded",
  "target_unresolved", "continuation_hop", "second_continuation_hop_present",
  "baseline", "stage5_truth",
]);
const SOURCE_KEYS = new Set([
  ...SOURCE_INPUT_KEYS,
  "source_version", "source_id", "source_kind", "data_is_synthetic_public_safe",
  "material_boundary", "integrity",
]);
const ARM_INPUT_KEYS = new Set([
  "role", "evidence_class", "source_id", "source_fingerprint", "workspace_id",
  "project_id", "work_id", "evaluation_case_id", "task", "repository",
  "target_entry_ids", "packet_entry_ids", "packet_entry_fingerprints",
  "non_target_downstream_input_fingerprints", "target_lineage", "downstream",
  "stale_relation",
]);
const ARM_KEYS = new Set([
  ...ARM_INPUT_KEYS,
  "arm_version", "arm_id", "post_cutoff_material_present", "provider_calls",
  "model_calls", "network_calls", "product_admission_used", "product_state_mutated",
  "integrity",
]);
const DOWNSTREAM_KEYS = new Set([
  "referenced_source_ids", "required_check_dispositions", "operation_action_classes",
  "blocker_warning_gap_classes", "changed_artifacts", "result_limitations",
  "response_status",
]);
const TASK_KEYS = new Set([
  "goal", "success_criteria", "non_goals", "required_checks",
  "forbidden_actions", "data_classification", "task_family_key",
]);
const REPOSITORY_KEYS = new Set([
  "frozen_head_commit", "initial_worktree_content_fingerprint",
  "construction_cutoff", "observation_cutoff", "observation_cutoff_policy",
  "platform", "deterministic_adapter_identity", "capability_version",
  "capability_coverage", "operation_approval_policy_fingerprint",
  "verification_owner_set_fingerprint", "equal_ceiling_fingerprint",
  "equal_budget_is_equal_capability",
]);
const RECORD_REF_KEYS = new Set([
  "record_version", "record_id", "record_fingerprint",
]);
const TARGET_KEYS = new Set([
  "packet_entry_id", "packet_entry_kind", "external_ref", "currentness",
  "candidate", "selection", "materialization", "admission", "packet_a",
  "packet_b", "lineage_run_receipt", "attribution_projection",
  "attribution_row",
]);
const TARGET_EXTERNAL_REF_KEYS = new Set([
  "ref_version", "ref_type", "external_id", "trust_class", "observed_at",
  "source_ref", "compatibility_namespace",
]);
const TARGET_CURRENTNESS_KEYS = new Set(["status", "as_of"]);
const ATTRIBUTION_ROW_KEYS = new Set([
  "presentation", "citation_or_reference", "actual_use", "support_validation",
  "outcome_association", "causal_contribution",
  "selected_by_exact_packet_and_admission_relation", "proposal_only",
  "semantic_transition_eligible", "item_level_credit_or_blame",
]);
const BASELINE_KEYS = new Set([
  "workspace_id", "project_id", "work_id", "work_fingerprint",
  "evaluation_case_id", "binding_kind", "parent_comparison_source_case",
  "equal_ceiling_fingerprint", "scope_is_rebuilt_isolated_semantics",
  "run_count", "resume_used", "operational_continuation_present",
  "packet_b_present", "continuation_admission_present",
  "post_cutoff_candidate_material_present",
]);
const STAGE5_TRUTH_KEYS = new Set([
  "continuation_worked_end_to_end", "exact_target_delivered_and_referenced",
  "item_actual_use", "support_validation", "outcome_association",
  "causal_contribution", "item_actual_use_proven_count",
  "support_validated_count", "outcome_associated_count",
  "causally_supported_count", "exact_case_status", "bundle_credit_assigned",
]);
const STALE_RELATION_KEYS = new Set([
  "reason_kind", "target_entry_id", "source_ref", "reason_observed_at",
  "applies_before_outcome", "regime_key",
]);
const CHECK_DISPOSITION_KEYS = new Set(["check_id", "disposition"]);
const CHANGED_ARTIFACT_KEYS = new Set([
  "artifact_id", "before_hash", "after_hash",
]);
const SINGLE_TARGET_INTERVENTION_KEYS = new Set([
  "target_entry_id", "exact_reentry_target_present", "ablation_target_present",
  "removed_entry_ids", "introduced_entry_ids", "non_target_material_equal",
  "only_intended_difference_is_target_presence", "direct_conditioning_comparable",
]);
const STALE_REGIME_SUMMARY_KEYS = new Set([
  "matched_arm_role", "input_parity", "non_stale_regime_inputs_equal",
  "target_identity_preserved", "explicit_source_bound_pre_outcome_reason", "comparable",
]);
const EVIDENCE_LADDER_KEYS = new Set([
  "availability", "reference", "conditioning_candidate", "support_validation",
  "outcome_association", "causal_contribution", "reset_behavior",
]);
const PARITY_ROW_KEYS = new Set([
  "dimension", "status", "exact_reentry_fingerprint", "ablation_fingerprint",
]);
const RESET_PARITY_ROW_KEYS = new Set([
  "dimension", "status", "matched_arm_fingerprint", "reset_arm_fingerprint",
]);
const INTEGRITY_KEYS = new Set([
  "algorithm", "canonicalization", "fingerprint_scope", "fingerprint",
]);
const MATERIAL_BOUNDARY_KEYS = new Set(Object.keys(MATERIAL_BOUNDARY));
const AUTHORITY_KEYS = new Set(Object.keys(AUTHORITY_SUMMARY));
const EVALUATION_KEYS = new Set([
  "evaluation_version", "evaluation_id", "evaluation_kind", "source", "arms",
  "exact_reentry_ablation_parity", "single_target_intervention",
  "stale_regime_relation", "conditioning_relation", "conditioning_basis",
  "reset_relation", "reset_basis", "evidence_ladder", "evidence_class",
  "deterministic_mechanics_only", "real_provider_or_model_evidence",
  "empirical_general_benefit_observed", "no_bundle_credit_or_blame",
  "limitations", "missing_evidence", "material_boundary", "authority_summary",
  "integrity",
]);
const DERIVED_EVALUATION_KEYS = [
  "exact_reentry_ablation_parity",
  "single_target_intervention",
  "stale_regime_relation",
  "conditioning_relation",
  "conditioning_basis",
  "reset_relation",
  "reset_basis",
  "evidence_ladder",
] as const;
