import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  parseStrictIsoTimestampV01,
  scanForbiddenProtocolMaterialV01,
  type ProtocolValidationIssueSinkV01,
} from "@/lib/vnext/protocol-primitives";
import { validateOperationalContextSelectionV01 } from "@/lib/vnext/operational-context-selection";
import { assertOperationalContinuationAdmissionV01 } from "@/lib/vnext/runtime/source-linked-operational-continuation-lineage";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  MODEL_HOST_SUCCESSION_BENCHMARK_VERSION_V01,
  MODEL_HOST_SUCCESSION_FALLBACK_PLAN_VERSION_V01,
  MODEL_HOST_SUCCESSION_FROZEN_CASE_VERSION_V01,
  MODEL_HOST_SUCCESSION_ROUTE_PROFILE_VERSION_V01,
  MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01,
  type ModelHostSuccessionAdrOwnerGapObservationV01,
  type ModelHostSuccessionArmResultV01,
  type ModelHostSuccessionBenchmarkAuthorityV01,
  type ModelHostSuccessionBenchmarkV01,
  type ModelHostSuccessionCapabilityDeltaValueV01,
  type ModelHostSuccessionCapabilityCoverageRowV01,
  type ModelHostSuccessionEvidenceClassV01,
  type ModelHostSuccessionFallbackPlanV01,
  type ModelHostSuccessionFrozenCaseV01,
  type ModelHostSuccessionIntegrityV01,
  type ModelHostSuccessionPairwiseDeltaV01,
  type ModelHostSuccessionRouteProfileAuthorityV01,
  type ModelHostSuccessionRouteProfileRefV01,
  type ModelHostSuccessionRouteProfileV01,
  type ModelHostSuccessionRouteRoleV01,
  type ModelHostSuccessionStage5TruthV01,
  type ModelHostSuccessionValidationResultV01,
} from "@/types/vnext/model-host-succession-benchmark";
import type { OperationalContinuationAdmissionV01 } from "@/types/vnext/operational-continuation-admission";
import type {
  OperationalContextSelectionV01,
  OperationalContinuationAdmissionIdentityV01,
} from "@/types/vnext/operational-context-selection";
import {
  RUN_RECEIPT_EXECUTION_STATUSES_V01,
  RUN_RECEIPT_VERIFICATION_STATUSES_V01,
} from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const ACGC6A_MERGED_STAGE5_BASELINE_COMMIT_V01 =
  "7c30c83ffc6bc579a8d730f7967244efe8a19214" as const;

const SHA256 = /^sha256:[a-f0-9]{64}$/u;
const COMMIT = /^[a-f0-9]{40}$/u;
const SAFE_ID = /^[A-Za-z0-9:._/-]{1,512}$/u;
const PRIVATE_PATH = /(?:^|[\s"'])(?:\/(?:Users|home|private|var|tmp|etc)\/|[A-Za-z]:\\)/u;
const PENDING_FINGERPRINT = `sha256:${"0".repeat(64)}`;
const MAX_TEXT = 2_000;
const MAX_ITEMS = 128;
const NON_LIVE_EVIDENCE_CLASSES_V01 = Object.freeze([
  "observed_deterministic_execution",
  "simulated_route_contract",
  "unobserved",
] as const satisfies readonly ModelHostSuccessionEvidenceClassV01[]);
const EXECUTION_PROFILES_V01 = Object.freeze([
  "deterministic_zero_model",
  "native_host_managed_model",
] as const);
const ARM_CONTRACT_STATUSES_V01 = Object.freeze([
  "contract_compatible",
  "contract_incompatible",
  "fallback_required",
  "unobserved",
] as const);
const ARM_EXECUTION_STATUSES_V01 = Object.freeze([
  ...RUN_RECEIPT_EXECUTION_STATUSES_V01,
  "unavailable",
  "not_executed",
] as const);
const FALLBACK_SETTLED_STATUSES_V01 = Object.freeze([
  "failed",
  "unavailable",
  "not_executed",
  "contract_incompatible",
  "fallback_required",
] as const satisfies readonly ModelHostSuccessionFallbackPlanV01["failed_arm_ref"]["settled_status"][]);
const REQUIRED_FALLBACK_FRESH_IDENTITIES_V01 = Object.freeze([
  "attachment",
  "browser_decision_session",
  "browser_start_grant",
  "controller",
  "database_scope",
  "host_session",
  "host_thread",
  "host_turn",
  "managed_run",
  "project_scope",
  "provider_thread_if_used",
  "repository_root",
  "start_request",
] as const);

const STAGE5_TRUTH_V01: ModelHostSuccessionStage5TruthV01 = Object.freeze({
  continuation_mechanism_worked_end_to_end: true,
  exact_selected_entry_delivered_and_referenced: true,
  item_actual_use: "unknown",
  support_validation: "unknown",
  outcome_association: "unknown",
  causal_contribution: "unknown",
  task_outcomes_equal_in_deciding_case: true,
  verification_outcomes_equal_in_deciding_case: true,
  structural_coordination_favored: "one_run_baseline",
  complete_path_review_burden_favored: "one_run_baseline",
  usage: "unobserved",
  monetary_cost: "unobserved",
  required_human_intervention: "unobserved",
  genuine_performance_latency: "unobserved",
  exact_case_result: "inconclusive",
  general_benefit_established: false,
  general_failure_established: false,
  packet_b_harmful_transfer_established: false,
  policy_fitness_established: false,
});

const ROUTE_AUTHORITY_V01: ModelHostSuccessionRouteProfileAuthorityV01 =
  Object.freeze({
    automatic_selection_authorized: false,
    activation_authorized: false,
    policy_authorized: false,
    automatic_start_authorized: false,
    automatic_resume_authorized: false,
    automatic_fallback_authorized: false,
    automatic_rollback_authorized: false,
    provider_egress_authorized: false,
    external_effect_authority_granted: false,
  });

const BENCHMARK_AUTHORITY_V01: ModelHostSuccessionBenchmarkAuthorityV01 =
  Object.freeze({
    quality_score_created: false,
    scalar_score_created: false,
    provider_or_model_rank_created: false,
    route_winner_created: false,
    route_selected: false,
    route_promoted_or_demoted: false,
    blacklist_created: false,
    policy_fitness_claimed: false,
    operational_policy_activated: false,
    active_route_pointer_created: false,
    activation_receipt_created: false,
    rollback_receipt_created: false,
    automatic_fallback_authorized: false,
    automatic_rollback_authorized: false,
    automatic_start_authorized: false,
    automatic_resume_authorized: false,
    packet_c_created: false,
    second_continuation_hop_created: false,
    semantic_state_changed: false,
    transition_created: false,
    benchmark_persisted: false,
    benchmark_builder_database_writes: 0,
    benchmark_builder_session_writes: 0,
    benchmark_builder_project_file_writes: 0,
    benchmark_builder_project_commands: 0,
    real_provider_calls: 0,
    network_calls: 0,
    github_calls: 0,
    external_calls: 0,
  });

const MATERIAL_BOUNDARY_V01 = Object.freeze({
  bounded: true,
  raw_prompt_included: false,
  raw_transcript_included: false,
  raw_provider_output_included: false,
  hidden_reasoning_included: false,
  secret_or_credential_included: false,
  private_path_included: false,
  post_cutoff_material_included: false,
} as const);

export interface BuildModelHostSuccessionRouteProfileInputV01 {
  route_role: ModelHostSuccessionRouteRoleV01;
  provider_ref: ExternalRefV01 | null;
  model_ref: ExternalRefV01 | null;
  host_ref: ExternalRefV01;
  adapter_implementation_id: string;
  adapter_implementation_version: string;
  native_host_adapter_version: string;
  capability_version: string;
  execution_profile: "deterministic_zero_model" | "native_host_managed_model";
  provider_egress_policy: "forbidden";
  session_continuity_mode: "fresh_session_no_reuse";
  evidence_class: ModelHostSuccessionEvidenceClassV01;
  supported_operation_classes: string[];
  unsupported_operation_classes: string[];
  capability_coverage: ModelHostSuccessionCapabilityCoverageRowV01[];
  predecessor_route_ref: ModelHostSuccessionRouteProfileRefV01 | null;
  fallback_target_ref: ModelHostSuccessionRouteProfileRefV01 | null;
}

export interface BuildModelHostSuccessionFrozenCaseInputV01 {
  packet_a: TaskContextPacketV01;
  operational_context_selection: OperationalContextSelectionV01;
  acgc5a_materialization_identity: OperationalContinuationAdmissionIdentityV01;
  packet_b: TaskContextPacketV01;
  continuation_admission: OperationalContinuationAdmissionV01;
  frozen_head_commit: string;
  frozen_worktree_content_fingerprint: string;
  construction_cutoff: string;
  observation_cutoff: string;
  platform: string;
}

export type BuildModelHostSuccessionArmResultInputV01 = Omit<
  ModelHostSuccessionArmResultV01,
  "arm_version" | "arm_id" | "integrity"
>;

export type BuildModelHostSuccessionFallbackPlanInputV01 = Omit<
  ModelHostSuccessionFallbackPlanV01,
  "fallback_plan_version" | "fallback_plan_id" | "integrity" |
    "candidate_history_immutable" | "automatic_execution_authorized" |
    "product_route_mutation_authorized" | "policy_activation_authorized" |
    "rollback_activation_authorized"
>;

export interface BuildModelHostSuccessionBenchmarkInputV01 {
  frozen_case: ModelHostSuccessionFrozenCaseV01;
  route_profiles: ModelHostSuccessionRouteProfileV01[];
  arm_results: ModelHostSuccessionArmResultV01[];
  fallback_plan: ModelHostSuccessionFallbackPlanV01;
  fallback_relation: ModelHostSuccessionBenchmarkV01["fallback_relation"];
  trade_offs: string[];
  resource_observation_provenance: string[];
  missing_evidence: string[];
  limitations: string[];
  adr_owner_gap_observations: ModelHostSuccessionAdrOwnerGapObservationV01[];
}

export class ModelHostSuccessionBenchmarkErrorV01 extends Error {
  constructor(readonly code: string, readonly path = "$") {
    super(code);
    this.name = "ModelHostSuccessionBenchmarkErrorV01";
  }
}

export function buildModelHostSuccessionRouteProfileV01(
  input: BuildModelHostSuccessionRouteProfileInputV01,
): ModelHostSuccessionRouteProfileV01 {
  const before = canonicalizeProtocolValueV01(input);
  const supported = canonicalUniqueTextV01(input.supported_operation_classes);
  const unsupported = canonicalUniqueTextV01(input.unsupported_operation_classes);
  if (supported.some((item) => unsupported.includes(item))) {
    failV01("model_host_route_capability_overlap", "$.supported_operation_classes");
  }
  if (input.evidence_class === "observed_live_provider") {
    failV01("model_host_live_provider_evidence_refused", "$.evidence_class");
  }
  if (input.provider_egress_policy !== "forbidden") {
    failV01("model_host_provider_egress_forbidden", "$.provider_egress_policy");
  }
  if (
    input.route_role === "zero_model_fallback" &&
    (input.provider_ref !== null || input.model_ref !== null ||
      input.execution_profile !== "deterministic_zero_model")
  ) {
    failV01("model_host_zero_model_identity_invalid", "$.route_role");
  }
  const profile: ModelHostSuccessionRouteProfileV01 = {
    route_profile_version: MODEL_HOST_SUCCESSION_ROUTE_PROFILE_VERSION_V01,
    route_profile_id: "model-host-succession-route:pending",
    route_role: input.route_role,
    provider_ref: cloneV01(input.provider_ref),
    model_ref: cloneV01(input.model_ref),
    host_ref: cloneV01(input.host_ref),
    adapter_implementation_id: requiredTextV01(
      input.adapter_implementation_id,
      "$.adapter_implementation_id",
    ),
    adapter_implementation_version: requiredTextV01(
      input.adapter_implementation_version,
      "$.adapter_implementation_version",
    ),
    native_host_adapter_version: requiredTextV01(
      input.native_host_adapter_version,
      "$.native_host_adapter_version",
    ),
    capability_version: requiredTextV01(
      input.capability_version,
      "$.capability_version",
    ),
    execution_profile: input.execution_profile,
    provider_egress_policy: input.provider_egress_policy,
    session_continuity_mode: input.session_continuity_mode,
    evidence_class: input.evidence_class,
    supported_operation_classes: supported,
    unsupported_operation_classes: unsupported,
    capability_coverage: canonicalCoverageV01(input.capability_coverage),
    predecessor_route_ref: cloneV01(input.predecessor_route_ref),
    fallback_target_ref: cloneV01(input.fallback_target_ref),
    authority: cloneV01(ROUTE_AUTHORITY_V01),
    integrity: pendingIntegrityV01("route_profile_without_integrity_fingerprint"),
  };
  profile.route_profile_id = deriveIdV01(
    profile,
    "route_profile_id",
    "model-host-succession-route",
  );
  profile.integrity.fingerprint = fingerprintV01(profile);
  assertValidModelHostSuccessionRouteProfileV01(profile);
  if (canonicalizeProtocolValueV01(input) !== before) {
    failV01("model_host_route_input_mutated");
  }
  return profile;
}

export function routeProfileRefV01(
  profile: ModelHostSuccessionRouteProfileV01,
): ModelHostSuccessionRouteProfileRefV01 {
  assertValidModelHostSuccessionRouteProfileV01(profile);
  return {
    route_profile_version: profile.route_profile_version,
    route_profile_id: profile.route_profile_id,
    route_profile_fingerprint: profile.integrity.fingerprint,
    route_role: profile.route_role,
  };
}

export function buildModelHostSuccessionFrozenCaseV01(
  input: BuildModelHostSuccessionFrozenCaseInputV01,
): ModelHostSuccessionFrozenCaseV01 {
  const before = canonicalizeProtocolValueV01(input);
  assertFrozenSourceRelationsV01(input);
  const sourceCaseBinding = rebuildStage5ComparisonBindingV01(input);
  const selected = input.operational_context_selection.selected_rows[0]!;
  const frozenCase: ModelHostSuccessionFrozenCaseV01 = {
    frozen_case_version: MODEL_HOST_SUCCESSION_FROZEN_CASE_VERSION_V01,
    frozen_case_id: "model-host-succession-frozen-case:pending",
    source_case_kind: "exact_rebuilt_merged_stage5_public_safe_case",
    merged_stage5_baseline_commit: ACGC6A_MERGED_STAGE5_BASELINE_COMMIT_V01,
    merged_stage5_comparison_binding: sourceCaseBinding,
    stage5_truth: cloneV01(STAGE5_TRUTH_V01),
    workspace_id: input.packet_b.workspace_id,
    project_id: input.packet_b.project_id,
    task: cloneV01(input.packet_b.task),
    constraints: cloneV01(input.packet_b.constraints),
    packet_a: cloneV01(input.packet_a),
    operational_context_selection: cloneV01(input.operational_context_selection),
    acgc5a_materialization_identity: cloneV01(
      input.acgc5a_materialization_identity,
    ),
    packet_b: cloneV01(input.packet_b),
    packet_b_canonical_bytes_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(input.packet_b),
    ),
    continuation_admission: cloneV01(input.continuation_admission),
    selected_operational_entry: cloneV01(selected),
    repository_state: {
      frozen_head_commit: input.frozen_head_commit,
      frozen_worktree_content_fingerprint:
        input.frozen_worktree_content_fingerprint,
      worktree_status: "clean",
      construction_cutoff: input.construction_cutoff,
      observation_cutoff: input.observation_cutoff,
      platform: requiredTextV01(input.platform, "$.platform"),
    },
    continuation_hop: 1,
    second_continuation_hop_present: false,
    data_is_synthetic_public_safe: true,
    material_boundary: cloneV01(MATERIAL_BOUNDARY_V01),
    integrity: pendingIntegrityV01("frozen_case_without_integrity_fingerprint"),
  };
  assertSafeMaterialV01(frozenCase);
  frozenCase.frozen_case_id = deriveIdV01(
    frozenCase,
    "frozen_case_id",
    "model-host-succession-frozen-case",
  );
  frozenCase.integrity.fingerprint = fingerprintV01(frozenCase);
  assertValidModelHostSuccessionFrozenCaseV01(frozenCase);
  if (canonicalizeProtocolValueV01(input) !== before) {
    failV01("model_host_frozen_case_input_mutated");
  }
  return frozenCase;
}

export function buildModelHostSuccessionArmResultV01(
  input: BuildModelHostSuccessionArmResultInputV01,
): ModelHostSuccessionArmResultV01 {
  const before = canonicalizeProtocolValueV01(input);
  if (input.evidence_class === "observed_live_provider") {
    failV01("model_host_live_provider_evidence_refused", "$.evidence_class");
  }
  const result: ModelHostSuccessionArmResultV01 = {
    arm_version: "model_host_succession_arm_result.v0.1",
    arm_id: "model-host-succession-arm:pending",
    ...cloneV01(input),
    integrity: pendingIntegrityV01("arm_result_without_integrity_fingerprint"),
  };
  result.required_checks = canonicalCheckSummaryV01(result.required_checks);
  result.supported_capability = canonicalUniqueTextV01(result.supported_capability);
  result.unsupported_capability = canonicalUniqueTextV01(result.unsupported_capability);
  result.limitations = canonicalUniqueTextV01(result.limitations);
  result.arm_id = deriveIdV01(
    result,
    "arm_id",
    "model-host-succession-arm",
  );
  result.integrity.fingerprint = fingerprintV01(result);
  assertValidModelHostSuccessionArmResultV01(result);
  if (canonicalizeProtocolValueV01(input) !== before) {
    failV01("model_host_arm_input_mutated");
  }
  return result;
}

export function modelHostSuccessionFallbackArmRefV01(
  arm: ModelHostSuccessionArmResultV01,
): ModelHostSuccessionFallbackPlanV01["failed_arm_ref"] {
  assertValidModelHostSuccessionArmResultV01(arm);
  return {
    arm_id: arm.arm_id,
    arm_fingerprint: arm.integrity.fingerprint,
    settled_status: deriveFallbackSettledStatusV01(arm),
  };
}

export function buildModelHostSuccessionFallbackPlanV01(
  input: BuildModelHostSuccessionFallbackPlanInputV01,
): ModelHostSuccessionFallbackPlanV01 {
  const before = canonicalizeProtocolValueV01(input);
  const plan: ModelHostSuccessionFallbackPlanV01 = {
    fallback_plan_version: MODEL_HOST_SUCCESSION_FALLBACK_PLAN_VERSION_V01,
    fallback_plan_id: "model-host-succession-fallback-plan:pending",
    ...cloneV01(input),
    required_fresh_execution_identities: canonicalUniqueTextV01(
      input.required_fresh_execution_identities,
    ),
    candidate_history_immutable: true,
    automatic_execution_authorized: false,
    product_route_mutation_authorized: false,
    policy_activation_authorized: false,
    rollback_activation_authorized: false,
    integrity: pendingIntegrityV01("fallback_plan_without_integrity_fingerprint"),
  };
  plan.fallback_plan_id = deriveIdV01(
    plan,
    "fallback_plan_id",
    "model-host-succession-fallback-plan",
  );
  plan.integrity.fingerprint = fingerprintV01(plan);
  assertValidModelHostSuccessionFallbackPlanV01(plan);
  if (canonicalizeProtocolValueV01(input) !== before) {
    failV01("model_host_fallback_plan_input_mutated");
  }
  return plan;
}

export function buildModelHostSuccessionBenchmarkV01(
  input: BuildModelHostSuccessionBenchmarkInputV01,
): ModelHostSuccessionBenchmarkV01 {
  const before = canonicalizeProtocolValueV01(input);
  assertValidModelHostSuccessionFrozenCaseV01(input.frozen_case);
  const routeProfiles = canonicalRouteProfilesV01(input.route_profiles);
  const armResults = canonicalArmResultsV01(input.arm_results);
  assertExactRouteMatrixV01(routeProfiles, armResults);
  assertNoCrossArmIdentityReuseV01(armResults);
  assertValidModelHostSuccessionFallbackPlanV01(input.fallback_plan);
  const benchmark: ModelHostSuccessionBenchmarkV01 = {
    benchmark_version: MODEL_HOST_SUCCESSION_BENCHMARK_VERSION_V01,
    benchmark_id: "model-host-succession-benchmark:pending",
    benchmark_kind: "pure_rebuildable_exact_case_non_authoritative",
    frozen_case: cloneV01(input.frozen_case),
    route_profiles: routeProfiles,
    arm_results: armResults,
    fallback_plan: cloneV01(input.fallback_plan),
    fallback_relation: cloneV01(input.fallback_relation),
    pairwise_route_deltas:
      deriveModelHostSuccessionPairwiseRouteDeltasV01(armResults),
    summary: "inconclusive",
    trade_offs: canonicalUniqueTextV01(input.trade_offs),
    resource_observation_provenance: canonicalUniqueTextV01(
      input.resource_observation_provenance,
    ),
    missing_evidence: canonicalUniqueTextV01(input.missing_evidence),
    limitations: canonicalUniqueTextV01(input.limitations),
    adr_owner_gap_observations: canonicalAdrOwnerGapObservationsV01(
      input.adr_owner_gap_observations,
    ),
    material_boundary: cloneV01(MATERIAL_BOUNDARY_V01),
    authority_summary: cloneV01(BENCHMARK_AUTHORITY_V01),
    integrity: pendingIntegrityV01("benchmark_without_integrity_fingerprint"),
  };
  assertFallbackRelationV01(benchmark);
  benchmark.benchmark_id = deriveIdV01(
    benchmark,
    "benchmark_id",
    "model-host-succession-benchmark",
  );
  benchmark.integrity.fingerprint = fingerprintV01(benchmark);
  assertValidModelHostSuccessionBenchmarkV01(benchmark);
  if (canonicalizeProtocolValueV01(input) !== before) {
    failV01("model_host_benchmark_input_mutated");
  }
  return benchmark;
}

export function deriveModelHostSuccessionPairwiseRouteDeltasV01(
  input: ModelHostSuccessionArmResultV01[],
): ModelHostSuccessionPairwiseDeltaV01[] {
  const arms = canonicalArmResultsV01(input);
  const rows: ModelHostSuccessionPairwiseDeltaV01[] = [];
  for (let leftIndex = 0; leftIndex < arms.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < arms.length;
      rightIndex += 1
    ) {
      const left = arms[leftIndex]!;
      const right = arms[rightIndex]!;
      rows.push(
        deriveRouteContractDeltaV01(left, right),
        deriveCapabilityCoverageDeltaV01(left, right),
        {
          left_route_role: left.route_profile_ref.route_role,
          right_route_role: right.route_profile_ref.route_role,
          dimension: "model_quality",
          relation: "unknown",
          left_value: null,
          right_value: null,
          basis:
            "No live provider or model execution occurred, so model quality is unobserved.",
        },
      );
    }
  }
  return canonicalPairwiseDeltasV01(rows);
}

export function validateModelHostSuccessionRouteProfileV01(
  input: unknown,
): ModelHostSuccessionValidationResultV01 {
  return validationResultV01(() =>
    assertValidModelHostSuccessionRouteProfileV01(input),
  );
}

export function validateModelHostSuccessionArmResultV01(
  input: unknown,
): ModelHostSuccessionValidationResultV01 {
  return validationResultV01(() =>
    assertValidModelHostSuccessionArmResultV01(input),
  );
}

export function validateModelHostSuccessionFrozenCaseV01(
  input: unknown,
): ModelHostSuccessionValidationResultV01 {
  return validationResultV01(() =>
    assertValidModelHostSuccessionFrozenCaseV01(input),
  );
}

export function validateModelHostSuccessionFallbackPlanV01(
  input: unknown,
): ModelHostSuccessionValidationResultV01 {
  return validationResultV01(() =>
    assertValidModelHostSuccessionFallbackPlanV01(input),
  );
}

export function validateModelHostSuccessionBenchmarkV01(
  input: unknown,
): ModelHostSuccessionValidationResultV01 {
  return validationResultV01(() =>
    assertValidModelHostSuccessionBenchmarkV01(input),
  );
}

export function assertValidModelHostSuccessionRouteProfileV01(
  input: unknown,
): asserts input is ModelHostSuccessionRouteProfileV01 {
  if (!isProtocolRecordV01(input)) failV01("model_host_route_invalid");
  const profile = input as unknown as ModelHostSuccessionRouteProfileV01;
  assertExactKeysV01(profile, [
    "route_profile_version", "route_profile_id", "route_role", "provider_ref",
    "model_ref", "host_ref", "adapter_implementation_id",
    "adapter_implementation_version", "native_host_adapter_version",
    "capability_version", "execution_profile", "provider_egress_policy",
    "session_continuity_mode", "evidence_class", "supported_operation_classes",
    "unsupported_operation_classes", "capability_coverage",
    "predecessor_route_ref", "fallback_target_ref", "authority", "integrity",
  ], "$");
  if (
    profile.route_profile_version !==
      MODEL_HOST_SUCCESSION_ROUTE_PROFILE_VERSION_V01 ||
    !MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.includes(profile.route_role) ||
    !NON_LIVE_EVIDENCE_CLASSES_V01.includes(
      profile.evidence_class as (typeof NON_LIVE_EVIDENCE_CLASSES_V01)[number],
    ) ||
    !EXECUTION_PROFILES_V01.includes(
      profile.execution_profile as (typeof EXECUTION_PROFILES_V01)[number],
    ) ||
    profile.provider_egress_policy !== "forbidden" ||
    profile.session_continuity_mode !== "fresh_session_no_reuse" ||
    !deepEqualV01(profile.authority, ROUTE_AUTHORITY_V01)
  ) {
    failV01("model_host_route_contract_invalid");
  }
  requiredIdV01(profile.route_profile_id, "$.route_profile_id");
  requiredExternalRefV01(profile.host_ref, "$.host_ref");
  if (profile.provider_ref) requiredExternalRefV01(profile.provider_ref, "$.provider_ref");
  if (profile.model_ref) requiredExternalRefV01(profile.model_ref, "$.model_ref");
  requiredTextV01(profile.adapter_implementation_id, "$.adapter_implementation_id");
  requiredTextV01(profile.adapter_implementation_version, "$.adapter_implementation_version");
  requiredTextV01(profile.native_host_adapter_version, "$.native_host_adapter_version");
  requiredTextV01(profile.capability_version, "$.capability_version");
  if (
    profile.route_role === "zero_model_fallback" &&
    (profile.provider_ref !== null || profile.model_ref !== null ||
      profile.execution_profile !== "deterministic_zero_model")
  ) {
    failV01("model_host_zero_model_identity_invalid");
  }
  const supported = canonicalUniqueTextV01(profile.supported_operation_classes);
  const unsupported = canonicalUniqueTextV01(profile.unsupported_operation_classes);
  const coverage = canonicalCoverageV01(profile.capability_coverage);
  if (
    !deepEqualV01(supported, profile.supported_operation_classes) ||
    !deepEqualV01(unsupported, profile.unsupported_operation_classes) ||
    supported.some((item) => unsupported.includes(item)) ||
    !deepEqualV01(coverage, profile.capability_coverage) ||
    coverage.length !== supported.length + unsupported.length ||
    supported.some(
      (operation) =>
        coverage.find((row) => row.operation_class === operation)?.coverage !==
          "supported",
    ) ||
    unsupported.some(
      (operation) =>
        coverage.find((row) => row.operation_class === operation)?.coverage !==
          "unsupported",
    )
  ) {
    failV01("model_host_route_capability_invalid");
  }
  assertOptionalRouteRefV01(profile.predecessor_route_ref, "$.predecessor_route_ref");
  assertOptionalRouteRefV01(profile.fallback_target_ref, "$.fallback_target_ref");
  assertIdentityV01(profile, "route_profile_id", "model-host-succession-route");
  assertFingerprintV01(profile);
}

export function assertValidModelHostSuccessionFrozenCaseV01(
  input: unknown,
): asserts input is ModelHostSuccessionFrozenCaseV01 {
  if (!isProtocolRecordV01(input)) failV01("model_host_frozen_case_invalid");
  const frozenCase = input as unknown as ModelHostSuccessionFrozenCaseV01;
  assertSafeMaterialV01(frozenCase);
  assertExactKeysV01(frozenCase, [
    "frozen_case_version", "frozen_case_id", "source_case_kind",
    "merged_stage5_baseline_commit", "merged_stage5_comparison_binding",
    "stage5_truth", "workspace_id", "project_id", "task", "constraints",
    "packet_a", "operational_context_selection",
    "acgc5a_materialization_identity", "packet_b",
    "packet_b_canonical_bytes_fingerprint", "continuation_admission",
    "selected_operational_entry", "repository_state", "continuation_hop",
    "second_continuation_hop_present", "data_is_synthetic_public_safe",
    "material_boundary", "integrity",
  ], "$");
  if (
    !isProtocolRecordV01(frozenCase.merged_stage5_comparison_binding) ||
    !isProtocolRecordV01(frozenCase.repository_state)
  ) {
    failV01("model_host_frozen_case_nested_contract_invalid");
  }
  assertExactKeysV01(frozenCase.merged_stage5_comparison_binding, [
    "comparison_version", "source_case_id", "source_case_fingerprint",
  ], "$.merged_stage5_comparison_binding");
  assertExactKeysV01(frozenCase.repository_state, [
    "frozen_head_commit", "frozen_worktree_content_fingerprint",
    "worktree_status", "construction_cutoff", "observation_cutoff",
    "platform",
  ], "$.repository_state");
  if (
    frozenCase.frozen_case_version !==
      MODEL_HOST_SUCCESSION_FROZEN_CASE_VERSION_V01 ||
    frozenCase.source_case_kind !==
      "exact_rebuilt_merged_stage5_public_safe_case" ||
    frozenCase.merged_stage5_baseline_commit !==
      ACGC6A_MERGED_STAGE5_BASELINE_COMMIT_V01 ||
    frozenCase.continuation_hop !== 1 ||
    frozenCase.second_continuation_hop_present !== false ||
    frozenCase.data_is_synthetic_public_safe !== true ||
    frozenCase.workspace_id !== frozenCase.packet_b.workspace_id ||
    frozenCase.project_id !== frozenCase.packet_b.project_id ||
    frozenCase.repository_state.worktree_status !== "clean" ||
    !deepEqualV01(frozenCase.stage5_truth, STAGE5_TRUTH_V01) ||
    !deepEqualV01(frozenCase.material_boundary, MATERIAL_BOUNDARY_V01)
  ) {
    failV01("model_host_frozen_case_contract_invalid");
  }
  assertFrozenSourceRelationsV01({
    packet_a: frozenCase.packet_a,
    operational_context_selection: frozenCase.operational_context_selection,
    acgc5a_materialization_identity:
      frozenCase.acgc5a_materialization_identity,
    packet_b: frozenCase.packet_b,
    continuation_admission: frozenCase.continuation_admission,
    frozen_head_commit: frozenCase.repository_state.frozen_head_commit,
    frozen_worktree_content_fingerprint:
      frozenCase.repository_state.frozen_worktree_content_fingerprint,
    construction_cutoff: frozenCase.repository_state.construction_cutoff,
    observation_cutoff: frozenCase.repository_state.observation_cutoff,
    platform: frozenCase.repository_state.platform,
  });
  if (
    frozenCase.packet_b_canonical_bytes_fingerprint !==
      createProtocolSha256V01(
        canonicalizeProtocolValueV01(frozenCase.packet_b),
      ) ||
    !deepEqualV01(
      frozenCase.selected_operational_entry,
      frozenCase.operational_context_selection.selected_rows[0],
    ) ||
    !deepEqualV01(frozenCase.task, frozenCase.packet_b.task) ||
    !deepEqualV01(frozenCase.constraints, frozenCase.packet_b.constraints) ||
    !deepEqualV01(
      frozenCase.merged_stage5_comparison_binding,
      rebuildStage5ComparisonBindingV01({
        packet_a: frozenCase.packet_a,
        operational_context_selection:
          frozenCase.operational_context_selection,
        acgc5a_materialization_identity:
          frozenCase.acgc5a_materialization_identity,
        packet_b: frozenCase.packet_b,
        continuation_admission: frozenCase.continuation_admission,
        frozen_head_commit:
          frozenCase.repository_state.frozen_head_commit,
        frozen_worktree_content_fingerprint:
          frozenCase.repository_state.frozen_worktree_content_fingerprint,
        construction_cutoff: frozenCase.repository_state.construction_cutoff,
        observation_cutoff: frozenCase.repository_state.observation_cutoff,
        platform: frozenCase.repository_state.platform,
      }),
    )
  ) {
    failV01("model_host_frozen_case_binding_mismatch");
  }
  assertSafeMaterialV01(frozenCase);
  assertIdentityV01(
    frozenCase,
    "frozen_case_id",
    "model-host-succession-frozen-case",
  );
  assertFingerprintV01(frozenCase);
}

export function assertValidModelHostSuccessionArmResultV01(
  input: unknown,
): asserts input is ModelHostSuccessionArmResultV01 {
  if (!isProtocolRecordV01(input)) failV01("model_host_arm_invalid");
  const arm = input as unknown as ModelHostSuccessionArmResultV01;
  assertExactKeysV01(arm, [
    "arm_version", "arm_id", "route_profile_ref", "evidence_class",
    "fresh_identity_proof", "contract_status", "execution_status",
    "verification_status", "required_checks", "supported_capability",
    "unsupported_capability", "unsupported_operation_executed_count",
    "stronger_result_inherited", "silent_fallback_used",
    "continuation_trace", "record_refs", "resource_observations",
    "privacy_egress", "review_burden", "fallback_required",
    "fallback_used", "direct_success_claimed", "predecessor_replay_status",
    "cleanup_recovery_burden", "cleanup_status", "platform_boundary",
    "limitations", "integrity",
  ], "$");
  if (
    arm.arm_version !== "model_host_succession_arm_result.v0.1" ||
    !NON_LIVE_EVIDENCE_CLASSES_V01.includes(
      arm.evidence_class as (typeof NON_LIVE_EVIDENCE_CLASSES_V01)[number],
    ) ||
    !ARM_CONTRACT_STATUSES_V01.includes(
      arm.contract_status as (typeof ARM_CONTRACT_STATUSES_V01)[number],
    ) ||
    !ARM_EXECUTION_STATUSES_V01.includes(
      arm.execution_status as (typeof ARM_EXECUTION_STATUSES_V01)[number],
    ) ||
    !RUN_RECEIPT_VERIFICATION_STATUSES_V01.includes(
      arm.verification_status as (typeof RUN_RECEIPT_VERIFICATION_STATUSES_V01)[number],
    ) ||
    !["none_observed", "unobserved"].includes(arm.privacy_egress) ||
    !["complete", "pending", "unobserved"].includes(arm.cleanup_status) ||
    !["not_applicable", "explicit_fresh_replay_completed"].includes(
      arm.predecessor_replay_status,
    )
  ) {
    failV01("model_host_arm_contract_invalid");
  }
  if (
    !isProtocolRecordV01(arm.fresh_identity_proof) ||
    !isProtocolRecordV01(arm.required_checks) ||
    !isProtocolRecordV01(arm.continuation_trace) ||
    !isProtocolRecordV01(arm.record_refs) ||
    !isProtocolRecordV01(arm.resource_observations) ||
    !isProtocolRecordV01(arm.review_burden)
  ) {
    failV01("model_host_arm_nested_contract_invalid");
  }
  assertExactKeysV01(arm.fresh_identity_proof, [
    "project_scope_fingerprint", "database_scope_fingerprint",
    "repository_root_fingerprint", "attachment_id",
    "attachment_binding_fingerprint", "start_request_fingerprint",
    "start_grant_fingerprint", "managed_run_id",
    "controller_identity_fingerprint",
    "browser_decision_session_identity_fingerprint",
    "host_session_identity_fingerprint", "host_thread_identity_fingerprint",
    "host_turn_identity_fingerprint", "provider_thread_identity_fingerprint",
    "prior_identity_reuse_count", "no_reuse_proven", "resume_used",
    "retry_used",
  ], "$.fresh_identity_proof");
  assertExactKeysV01(arm.required_checks, [
    "passed", "failed", "blocked", "skipped", "unknown",
  ], "$.required_checks");
  assertExactKeysV01(arm.continuation_trace, [
    "packet_b_exact_bytes_delivered", "selected_entry_count",
    "selected_entry_delivered_count",
    "selected_entry_exact_receipt_referenced_count",
    "excluded_candidate_credit_count", "bundle_credit_assigned",
    "packet_level_actual_use_claim", "item_actual_use",
    "support_validation", "outcome_association", "causal_contribution",
  ], "$.continuation_trace");
  assertExactKeysV01(arm.record_refs, [
    "run", "run_receipt", "context_use_review", "context_use_attribution",
  ], "$.record_refs");
  assertExactKeysV01(arm.resource_observations, [
    "provider_calls", "model_calls", "network_calls", "github_calls",
    "external_calls", "usage_units", "monetary_cost_microunits",
    "genuine_latency_ms", "observation_provenance",
  ], "$.resource_observations");
  assertExactKeysV01(arm.review_burden, [
    "review_action_count", "correction_count",
    "required_human_intervention_count",
  ], "$.review_burden");
  for (const [field, value] of Object.entries({
    project_scope_fingerprint:
      arm.fresh_identity_proof.project_scope_fingerprint,
    database_scope_fingerprint:
      arm.fresh_identity_proof.database_scope_fingerprint,
    repository_root_fingerprint:
      arm.fresh_identity_proof.repository_root_fingerprint,
  })) {
    requiredFingerprintV01(value, `$.fresh_identity_proof.${field}`);
  }
  for (const [field, value] of Object.entries({
    attachment_binding_fingerprint:
      arm.fresh_identity_proof.attachment_binding_fingerprint,
    start_request_fingerprint:
      arm.fresh_identity_proof.start_request_fingerprint,
    start_grant_fingerprint:
      arm.fresh_identity_proof.start_grant_fingerprint,
    controller_identity_fingerprint:
      arm.fresh_identity_proof.controller_identity_fingerprint,
    browser_decision_session_identity_fingerprint:
      arm.fresh_identity_proof.browser_decision_session_identity_fingerprint,
    host_session_identity_fingerprint:
      arm.fresh_identity_proof.host_session_identity_fingerprint,
    host_thread_identity_fingerprint:
      arm.fresh_identity_proof.host_thread_identity_fingerprint,
    host_turn_identity_fingerprint:
      arm.fresh_identity_proof.host_turn_identity_fingerprint,
    provider_thread_identity_fingerprint:
      arm.fresh_identity_proof.provider_thread_identity_fingerprint,
  })) {
    if (value !== null) {
      requiredFingerprintV01(value, `$.fresh_identity_proof.${field}`);
    }
  }
  for (const [field, value] of Object.entries({
    attachment_id: arm.fresh_identity_proof.attachment_id,
    managed_run_id: arm.fresh_identity_proof.managed_run_id,
  })) {
    if (value !== null) requiredTextV01(value, `$.fresh_identity_proof.${field}`);
  }
  if (
    !["exact_deterministic_fixture_ledger", "simulated_contract_only", "unobserved"]
      .includes(arm.resource_observations.observation_provenance)
  ) {
    failV01("model_host_arm_resource_provenance_invalid");
  }
  for (const [field, ref] of Object.entries(arm.record_refs)) {
    if (ref !== null && ref !== undefined) {
      assertRecordRefV01(ref, `$.record_refs.${field}`);
    }
  }
  assertRouteRefV01(arm.route_profile_ref, "$.route_profile_ref");
  assertArmExecutionEvidenceV01(arm);
  if (
    arm.fresh_identity_proof.prior_identity_reuse_count !== 0 ||
    arm.fresh_identity_proof.no_reuse_proven !== true ||
    arm.fresh_identity_proof.resume_used !== false ||
    arm.fresh_identity_proof.retry_used !== false ||
    arm.unsupported_operation_executed_count !== 0 ||
    arm.stronger_result_inherited !== false ||
    arm.silent_fallback_used !== false ||
    arm.direct_success_claimed !== false ||
    arm.continuation_trace.excluded_candidate_credit_count !== 0 ||
    arm.continuation_trace.bundle_credit_assigned !== false ||
    arm.continuation_trace.packet_level_actual_use_claim !== "unknown" ||
    arm.continuation_trace.item_actual_use !== "unknown" ||
    arm.continuation_trace.support_validation !== "unknown" ||
    arm.continuation_trace.outcome_association !== "unknown" ||
    arm.continuation_trace.causal_contribution !== "unknown" ||
    arm.resource_observations.provider_calls !== 0 ||
    arm.resource_observations.model_calls !== 0 ||
    arm.resource_observations.network_calls !== 0 ||
    arm.resource_observations.github_calls !== 0 ||
    arm.resource_observations.external_calls !== 0
  ) {
    failV01("model_host_arm_authority_or_reuse_invalid");
  }
  if (
    arm.contract_status === "fallback_required" &&
    arm.fallback_required !== true
  ) {
    failV01("model_host_arm_fallback_binding_invalid");
  }
  if (
    arm.route_profile_ref.route_role !== "predecessor_route_replay" &&
    arm.fallback_used !== false
  ) {
    failV01("model_host_arm_fallback_use_invalid");
  }
  const partition = [
    ...arm.required_checks.passed,
    ...arm.required_checks.failed,
    ...arm.required_checks.blocked,
    ...arm.required_checks.skipped,
    ...arm.required_checks.unknown,
  ];
  if (new Set(partition).size !== partition.length) {
    failV01("model_host_arm_required_check_partition_invalid");
  }
  const canonicalChecks = canonicalCheckSummaryV01(arm.required_checks);
  const supported = canonicalUniqueTextV01(arm.supported_capability);
  const unsupported = canonicalUniqueTextV01(arm.unsupported_capability);
  if (
    !deepEqualV01(canonicalChecks, arm.required_checks) ||
    !deepEqualV01(supported, arm.supported_capability) ||
    !deepEqualV01(unsupported, arm.unsupported_capability) ||
    supported.some((operation) => unsupported.includes(operation)) ||
    !deepEqualV01(canonicalUniqueTextV01(arm.limitations), arm.limitations)
  ) {
    failV01("model_host_arm_collection_invalid");
  }
  if (
    arm.route_profile_ref.route_role === "capability_constrained_simulation" &&
    arm.required_checks.passed.some((check) =>
      arm.unsupported_capability.includes(check))
  ) {
    failV01("model_host_unsupported_required_check_passed");
  }
  assertIdentityV01(arm, "arm_id", "model-host-succession-arm");
  assertFingerprintV01(arm);
}

function assertArmExecutionEvidenceV01(
  arm: ModelHostSuccessionArmResultV01,
): void {
  const proof = arm.fresh_identity_proof;
  const nonExecuted = isNonExecutedArmV01(arm);
  if (nonExecuted) {
    const attachmentPairComplete =
      (proof.attachment_id === null) ===
      (proof.attachment_binding_fingerprint === null);
    const preExecutionSequenceValid =
      (proof.start_request_fingerprint === null || proof.attachment_id !== null) &&
      (proof.browser_decision_session_identity_fingerprint === null ||
        proof.start_request_fingerprint !== null);
    if (
      arm.verification_status !== "not_run" ||
      !attachmentPairComplete ||
      !preExecutionSequenceValid ||
      proof.start_grant_fingerprint !== null ||
      proof.managed_run_id !== null ||
      proof.controller_identity_fingerprint !== null ||
      proof.host_session_identity_fingerprint !== null ||
      proof.host_thread_identity_fingerprint !== null ||
      proof.host_turn_identity_fingerprint !== null ||
      proof.provider_thread_identity_fingerprint !== null ||
      Object.values(arm.record_refs).some((ref) => ref !== null) ||
      arm.continuation_trace.packet_b_exact_bytes_delivered !== false ||
      arm.continuation_trace.selected_entry_count !== 1 ||
      arm.continuation_trace.selected_entry_delivered_count !== 0 ||
      arm.continuation_trace.selected_entry_exact_receipt_referenced_count !== 0 ||
      arm.required_checks.passed.length !== 0 ||
      arm.required_checks.failed.length !== 0 ||
      arm.review_burden.review_action_count !== 0 ||
      arm.review_burden.correction_count !== null ||
      arm.fallback_used !== false ||
      arm.predecessor_replay_status !== "not_applicable" ||
      arm.cleanup_status === "pending"
    ) {
      failV01("model_host_arm_nonexecuted_evidence_invalid");
    }
    return;
  }
  for (const [field, value] of Object.entries({
    attachment_binding_fingerprint: proof.attachment_binding_fingerprint,
    start_request_fingerprint: proof.start_request_fingerprint,
    start_grant_fingerprint: proof.start_grant_fingerprint,
    controller_identity_fingerprint: proof.controller_identity_fingerprint,
    browser_decision_session_identity_fingerprint:
      proof.browser_decision_session_identity_fingerprint,
    host_session_identity_fingerprint: proof.host_session_identity_fingerprint,
    host_thread_identity_fingerprint: proof.host_thread_identity_fingerprint,
    host_turn_identity_fingerprint: proof.host_turn_identity_fingerprint,
  })) {
    requiredFingerprintV01(value, `$.fresh_identity_proof.${field}`);
  }
  requiredTextV01(proof.attachment_id, "$.fresh_identity_proof.attachment_id");
  requiredTextV01(proof.managed_run_id, "$.fresh_identity_proof.managed_run_id");
  if (
    Object.values(arm.record_refs).some((ref) => ref === null) ||
    arm.continuation_trace.packet_b_exact_bytes_delivered !== true ||
    arm.continuation_trace.selected_entry_count !== 1 ||
    arm.continuation_trace.selected_entry_delivered_count !== 1 ||
    arm.continuation_trace.selected_entry_exact_receipt_referenced_count !== 1 ||
    arm.cleanup_status !== "complete"
  ) {
    failV01("model_host_arm_executed_evidence_invalid");
  }
}

export function assertValidModelHostSuccessionFallbackPlanV01(
  input: unknown,
): asserts input is ModelHostSuccessionFallbackPlanV01 {
  if (!isProtocolRecordV01(input)) failV01("model_host_fallback_plan_invalid");
  const plan = input as unknown as ModelHostSuccessionFallbackPlanV01;
  assertExactKeysV01(plan, [
    "fallback_plan_version", "fallback_plan_id", "failed_arm_ref",
    "predecessor_route_ref", "frozen_case_ref", "fallback_reason",
    "fallback_trigger", "benchmark_harness_authorization",
    "required_fresh_execution_identities", "candidate_history_immutable",
    "automatic_execution_authorized", "product_route_mutation_authorized",
    "policy_activation_authorized", "rollback_activation_authorized",
    "integrity",
  ], "$");
  if (
    !isProtocolRecordV01(plan.failed_arm_ref) ||
    !isProtocolRecordV01(plan.frozen_case_ref)
  ) {
    failV01("model_host_fallback_plan_nested_contract_invalid");
  }
  assertExactKeysV01(plan.failed_arm_ref, [
    "arm_id", "arm_fingerprint", "settled_status",
  ], "$.failed_arm_ref");
  assertExactKeysV01(plan.frozen_case_ref, [
    "frozen_case_id", "frozen_case_fingerprint",
  ], "$.frozen_case_ref");
  if (
    plan.fallback_plan_version !==
      MODEL_HOST_SUCCESSION_FALLBACK_PLAN_VERSION_V01 ||
    plan.benchmark_harness_authorization !==
      "explicit_harness_sequence_only" ||
    plan.candidate_history_immutable !== true ||
    plan.automatic_execution_authorized !== false ||
    plan.product_route_mutation_authorized !== false ||
    plan.policy_activation_authorized !== false ||
    plan.rollback_activation_authorized !== false ||
    plan.predecessor_route_ref.route_role !== "predecessor_route_replay" ||
    !FALLBACK_SETTLED_STATUSES_V01.includes(
      plan.failed_arm_ref.settled_status,
    )
  ) {
    failV01("model_host_fallback_plan_contract_invalid");
  }
  assertRouteRefV01(plan.predecessor_route_ref, "$.predecessor_route_ref");
  requiredIdV01(plan.failed_arm_ref.arm_id, "$.failed_arm_ref.arm_id");
  requiredFingerprintV01(
    plan.failed_arm_ref.arm_fingerprint,
    "$.failed_arm_ref.arm_fingerprint",
  );
  requiredIdV01(plan.frozen_case_ref.frozen_case_id, "$.frozen_case_ref.frozen_case_id");
  requiredFingerprintV01(
    plan.frozen_case_ref.frozen_case_fingerprint,
    "$.frozen_case_ref.frozen_case_fingerprint",
  );
  if (
    !deepEqualV01(
      canonicalUniqueTextV01(plan.required_fresh_execution_identities),
      [...REQUIRED_FALLBACK_FRESH_IDENTITIES_V01].sort((left, right) =>
        left.localeCompare(right, "en")),
    )
  ) {
    failV01("model_host_fallback_fresh_identity_set_incomplete");
  }
  requiredTextV01(plan.fallback_reason, "$.fallback_reason");
  requiredTextV01(plan.fallback_trigger, "$.fallback_trigger");
  assertIdentityV01(
    plan,
    "fallback_plan_id",
    "model-host-succession-fallback-plan",
  );
  assertFingerprintV01(plan);
}

export function assertValidModelHostSuccessionBenchmarkV01(
  input: unknown,
): asserts input is ModelHostSuccessionBenchmarkV01 {
  if (!isProtocolRecordV01(input)) failV01("model_host_benchmark_invalid");
  const benchmark = input as unknown as ModelHostSuccessionBenchmarkV01;
  assertExactKeysV01(benchmark, [
    "benchmark_version", "benchmark_id", "benchmark_kind", "frozen_case",
    "route_profiles", "arm_results", "fallback_plan", "fallback_relation",
    "pairwise_route_deltas", "summary", "trade_offs",
    "resource_observation_provenance", "missing_evidence", "limitations",
    "adr_owner_gap_observations", "material_boundary", "authority_summary",
    "integrity",
  ], "$");
  if (!isProtocolRecordV01(benchmark.fallback_relation)) {
    failV01("model_host_benchmark_fallback_relation_invalid");
  }
  assertExactKeysV01(benchmark.fallback_relation, [
    "candidate_arm_id", "predecessor_replay_arm_id",
    "candidate_history_unchanged", "cross_arm_contamination_detected",
    "automatic_execution_used",
  ], "$.fallback_relation");
  if (
    benchmark.benchmark_version !== MODEL_HOST_SUCCESSION_BENCHMARK_VERSION_V01 ||
    benchmark.benchmark_kind !== "pure_rebuildable_exact_case_non_authoritative" ||
    benchmark.summary !== "inconclusive" ||
    !deepEqualV01(benchmark.material_boundary, MATERIAL_BOUNDARY_V01) ||
    !deepEqualV01(benchmark.authority_summary, BENCHMARK_AUTHORITY_V01)
  ) {
    failV01("model_host_benchmark_contract_invalid");
  }
  assertValidModelHostSuccessionFrozenCaseV01(benchmark.frozen_case);
  const profiles = canonicalRouteProfilesV01(benchmark.route_profiles);
  const arms = canonicalArmResultsV01(benchmark.arm_results);
  if (
    !deepEqualV01(profiles, benchmark.route_profiles) ||
    !deepEqualV01(arms, benchmark.arm_results)
  ) {
    failV01("model_host_benchmark_order_invalid");
  }
  assertExactRouteMatrixV01(profiles, arms);
  assertNoCrossArmIdentityReuseV01(arms);
  assertValidModelHostSuccessionFallbackPlanV01(benchmark.fallback_plan);
  assertFallbackRelationV01(benchmark);
  assertAdrOwnerGapObservationsV01(benchmark.adr_owner_gap_observations);
  assertPairwiseRouteDeltasV01(benchmark.pairwise_route_deltas, arms);
  if (
    !deepEqualV01(
      canonicalPairwiseDeltasV01(benchmark.pairwise_route_deltas),
      benchmark.pairwise_route_deltas,
    ) ||
    !deepEqualV01(
      deriveModelHostSuccessionPairwiseRouteDeltasV01(arms),
      benchmark.pairwise_route_deltas,
    ) ||
    !deepEqualV01(
      canonicalUniqueTextV01(benchmark.trade_offs),
      benchmark.trade_offs,
    ) ||
    benchmark.trade_offs.length === 0 ||
    !deepEqualV01(
      canonicalUniqueTextV01(benchmark.resource_observation_provenance),
      benchmark.resource_observation_provenance,
    ) ||
    benchmark.resource_observation_provenance.length === 0 ||
    !deepEqualV01(
      canonicalUniqueTextV01(benchmark.missing_evidence),
      benchmark.missing_evidence,
    ) ||
    !deepEqualV01(
      canonicalUniqueTextV01(benchmark.limitations),
      benchmark.limitations,
    ) ||
    benchmark.limitations.length === 0 ||
    benchmark.missing_evidence.length === 0 ||
    !benchmark.missing_evidence.some((item) => /model quality/iu.test(item))
  ) {
    failV01("model_host_benchmark_evidence_or_delta_invalid");
  }
  assertSafeMaterialV01(benchmark);
  assertIdentityV01(
    benchmark,
    "benchmark_id",
    "model-host-succession-benchmark",
  );
  assertFingerprintV01(benchmark);
}

function rebuildStage5ComparisonBindingV01(
  input: BuildModelHostSuccessionFrozenCaseInputV01,
): ModelHostSuccessionFrozenCaseV01["merged_stage5_comparison_binding"] {
  const sourceCaseMaterial = {
    comparison_version: "operational_continuation_comparison.v0.1" as const,
    merged_stage5_baseline_commit: ACGC6A_MERGED_STAGE5_BASELINE_COMMIT_V01,
    packet_a_id: input.packet_a.packet_id,
    packet_a_fingerprint: input.packet_a.integrity.fingerprint,
    selection_id: input.operational_context_selection.selection_id,
    selection_fingerprint:
      input.operational_context_selection.integrity.fingerprint,
    materialization_id:
      input.acgc5a_materialization_identity.materialization_id,
    materialization_fingerprint:
      input.acgc5a_materialization_identity.materialization_fingerprint,
    packet_b_id: input.packet_b.packet_id,
    packet_b_fingerprint: input.packet_b.integrity.fingerprint,
    admission_id: input.continuation_admission.admission_id,
    admission_fingerprint: input.continuation_admission.integrity.fingerprint,
  };
  const sourceCaseFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(sourceCaseMaterial),
  );
  return {
    comparison_version: "operational_continuation_comparison.v0.1",
    source_case_id:
      `operational-continuation-source-case:${sourceCaseFingerprint.slice(7, 31)}`,
    source_case_fingerprint: sourceCaseFingerprint,
  };
}

function assertFrozenSourceRelationsV01(
  input: BuildModelHostSuccessionFrozenCaseInputV01,
): void {
  if (!COMMIT.test(input.frozen_head_commit)) {
    failV01("model_host_frozen_head_invalid", "$.frozen_head_commit");
  }
  requiredFingerprintV01(
    input.frozen_worktree_content_fingerprint,
    "$.frozen_worktree_content_fingerprint",
  );
  const construction = parseStrictIsoTimestampV01(input.construction_cutoff);
  const observation = parseStrictIsoTimestampV01(input.observation_cutoff);
  if (construction === null || observation === null || observation < construction) {
    failV01("model_host_frozen_cutoff_invalid");
  }
  if (
    validateTaskContextPacketV01(input.packet_a, {
      evaluated_at: input.construction_cutoff,
    }).status !== "valid" ||
    validateTaskContextPacketV01(input.packet_b, {
      evaluated_at: input.construction_cutoff,
    }).status !== "valid" ||
    validateOperationalContextSelectionV01(
      input.operational_context_selection,
    ).status !== "valid"
  ) {
    failV01("model_host_frozen_source_invalid");
  }
  try {
    assertOperationalContinuationAdmissionV01(input.continuation_admission);
  } catch {
    failV01("model_host_frozen_admission_invalid");
  }
  const packetA = input.packet_a;
  const packetB = input.packet_b;
  const selection = input.operational_context_selection;
  const materialization = input.acgc5a_materialization_identity;
  const admission = input.continuation_admission;
  if (
    packetB.constraints.data_classification !== "public_safe" ||
    packetA.workspace_id !== packetB.workspace_id ||
    packetA.project_id !== packetB.project_id ||
    selection.workspace_id !== packetB.workspace_id ||
    selection.project_id !== packetB.project_id ||
    selection.packet_a.record_id !== packetA.packet_id ||
    selection.packet_a.record_fingerprint !== packetA.integrity.fingerprint ||
    materialization.selection_id !== selection.selection_id ||
    materialization.selection_fingerprint !== selection.integrity.fingerprint ||
    materialization.candidate_packet_b_id !== packetB.packet_id ||
    materialization.candidate_packet_b_fingerprint !== packetB.integrity.fingerprint ||
    admission.lineage.packet_a.packet_id !== packetA.packet_id ||
    admission.lineage.packet_a.packet_fingerprint !== packetA.integrity.fingerprint ||
    admission.lineage.packet_b.packet_id !== packetB.packet_id ||
    admission.lineage.packet_b.packet_fingerprint !== packetB.integrity.fingerprint ||
    admission.lineage.continuation_hop !== 1 ||
    admission.operational_context_selection.selection_id !== selection.selection_id ||
    admission.operational_context_selection.selection_fingerprint !==
      selection.integrity.fingerprint ||
    admission.acgc5a_materialization_identity.materialization_id !==
      materialization.materialization_id ||
    admission.acgc5a_materialization_identity.materialization_fingerprint !==
      materialization.materialization_fingerprint ||
    selection.selected_rows.length !== 1
  ) {
    failV01("model_host_frozen_source_binding_mismatch");
  }
  const sourceTimes = [
    packetA.generated_at,
    packetB.generated_at,
    selection.decision_time_cutoff,
    admission.authenticated_action.admitted_at,
  ].map((value) => parseStrictIsoTimestampV01(value));
  if (sourceTimes.some((value) => value === null || value > construction)) {
    failV01("model_host_post_cutoff_material_refused");
  }
  if (!deepEqualV01(packetA.task, packetB.task) ||
      !deepEqualV01(
        packetA.constraints.required_checks,
        packetB.constraints.required_checks,
      ) ||
      !deepEqualV01(
        packetA.constraints.forbidden_actions,
        packetB.constraints.forbidden_actions,
      ) ||
      packetA.constraints.data_classification !==
        packetB.constraints.data_classification) {
    failV01("model_host_task_or_constraint_mismatch");
  }
}

function assertExactRouteMatrixV01(
  profiles: ModelHostSuccessionRouteProfileV01[],
  arms: ModelHostSuccessionArmResultV01[],
): void {
  if (
    profiles.length !== MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.length ||
    arms.length !== MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.length
  ) {
    failV01("model_host_route_matrix_incomplete");
  }
  for (const [index, role] of MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.entries()) {
    const profile = profiles[index];
    const arm = arms[index];
    if (!profile || !arm || profile.route_role !== role ||
        arm.route_profile_ref.route_role !== role ||
        arm.route_profile_ref.route_profile_id !== profile.route_profile_id ||
        arm.route_profile_ref.route_profile_fingerprint !== profile.integrity.fingerprint ||
        arm.evidence_class !== profile.evidence_class) {
      failV01("model_host_route_matrix_binding_invalid");
    }
  }
  const predecessor = profiles.at(-1)!;
  const same = profiles[0]!;
  const constrained = profiles[1]!;
  const alternate = profiles[2]!;
  const zero = profiles[3]!;
  for (const profile of profiles) {
    for (const ref of [profile.predecessor_route_ref, profile.fallback_target_ref]) {
      if (ref === null) continue;
      const target = profiles.find((candidate) =>
        candidate.route_profile_id === ref.route_profile_id);
      if (
        !target ||
        target.route_role !== ref.route_role ||
        target.integrity.fingerprint !== ref.route_profile_fingerprint
      ) {
        failV01("model_host_route_matrix_reference_invalid");
      }
    }
  }
  if (
    !same.predecessor_route_ref ||
    same.predecessor_route_ref.route_profile_id !== predecessor.route_profile_id ||
    !sameIdentityV01(same, predecessor) ||
    same.evidence_class !== "simulated_route_contract" ||
    !constrained.predecessor_route_ref ||
    constrained.predecessor_route_ref.route_profile_id !== predecessor.route_profile_id ||
    constrained.evidence_class !== "simulated_route_contract" ||
    constrained.capability_version === predecessor.capability_version ||
    constrained.supported_operation_classes.length >=
      predecessor.supported_operation_classes.length ||
    constrained.supported_operation_classes.some(
      (operation) =>
        !predecessor.supported_operation_classes.includes(operation),
    ) ||
    predecessor.unsupported_operation_classes.some(
      (operation) =>
        !constrained.unsupported_operation_classes.includes(operation),
    ) ||
    predecessor.supported_operation_classes.some(
      (operation) =>
        !constrained.supported_operation_classes.includes(operation) &&
        !constrained.unsupported_operation_classes.includes(operation),
    ) ||
    !alternate.provider_ref || !alternate.model_ref ||
    deepEqualV01(alternate.provider_ref, predecessor.provider_ref) ||
    deepEqualV01(alternate.model_ref, predecessor.model_ref) ||
    alternate.host_ref.external_id === predecessor.host_ref.external_id ||
    alternate.adapter_implementation_id === predecessor.adapter_implementation_id ||
    alternate.evidence_class !== "simulated_route_contract" ||
    zero.provider_ref !== null || zero.model_ref !== null ||
    zero.execution_profile !== "deterministic_zero_model" ||
    zero.evidence_class !== "observed_deterministic_execution" ||
    zero.fallback_target_ref !== null ||
    predecessor.evidence_class !== "observed_deterministic_execution" ||
    predecessor.predecessor_route_ref !== null ||
    predecessor.fallback_target_ref !== null
  ) {
    failV01("model_host_route_matrix_semantics_invalid");
  }
  for (const [index, arm] of arms.entries()) {
    const profile = profiles[index]!;
    assertValidModelHostSuccessionArmResultV01(arm);
    if (
      !deepEqualV01(arm.supported_capability, profile.supported_operation_classes) ||
      !deepEqualV01(
        arm.unsupported_capability,
        profile.unsupported_operation_classes,
      ) ||
      arm.continuation_trace.selected_entry_count !== 1 ||
      arm.resource_observations.usage_units !== null ||
      arm.resource_observations.monetary_cost_microunits !== null ||
      arm.resource_observations.genuine_latency_ms !== null
    ) {
      failV01("model_host_route_arm_exact_case_invalid");
    }
    const expectsProviderThread =
      !isNonExecutedArmV01(arm) && profile.provider_ref !== null;
    if (
      expectsProviderThread !==
        (arm.fresh_identity_proof.provider_thread_identity_fingerprint !== null)
    ) {
      failV01("model_host_route_provider_thread_binding_invalid");
    }
  }
  const constrainedArm = arms[1]!;
  const sameArm = arms[0]!;
  const alternateArm = arms[2]!;
  const zeroArm = arms[3]!;
  const replayArm = arms[4]!;
  if (
    constrainedArm.fallback_required !== true ||
    constrainedArm.fallback_used !== false ||
    (!isNonExecutedArmV01(constrainedArm) &&
      (constrainedArm.contract_status !== "fallback_required" ||
        constrainedArm.execution_status !== "blocked")) ||
    constrainedArm.required_checks.passed.some((check) =>
      constrainedArm.unsupported_capability.includes(check)) ||
    sameArm.fallback_used !== false ||
    alternateArm.fallback_used !== false ||
    zeroArm.fallback_used !== false ||
    zeroArm.resource_observations.provider_calls !== 0 ||
    zeroArm.resource_observations.model_calls !== 0 ||
    replayArm.fallback_used !== true ||
    replayArm.predecessor_replay_status !== "explicit_fresh_replay_completed" ||
    isNonExecutedArmV01(replayArm)
  ) {
    failV01("model_host_route_arm_semantics_invalid");
  }
}

function assertFallbackRelationV01(
  benchmark: Pick<
    ModelHostSuccessionBenchmarkV01,
    | "frozen_case"
    | "route_profiles"
    | "arm_results"
    | "fallback_plan"
    | "fallback_relation"
  >,
): void {
  const candidate = benchmark.arm_results.find(
    (arm) => arm.route_profile_ref.route_role === "capability_constrained_simulation",
  );
  const replay = benchmark.arm_results.find(
    (arm) => arm.route_profile_ref.route_role === "predecessor_route_replay",
  );
  const predecessorProfile = benchmark.route_profiles.find(
    (profile) => profile.route_role === "predecessor_route_replay",
  );
  const expectedCandidateRef = candidate
    ? modelHostSuccessionFallbackArmRefV01(candidate)
    : null;
  const expectedPredecessorRef = predecessorProfile
    ? routeProfileRefV01(predecessorProfile)
    : null;
  if (
    !candidate || !replay || !predecessorProfile ||
    candidate.fallback_required !== true || candidate.fallback_used !== false ||
    replay.fallback_used !== true ||
    replay.predecessor_replay_status !== "explicit_fresh_replay_completed" ||
    !deepEqualV01(benchmark.fallback_plan.failed_arm_ref, expectedCandidateRef) ||
    !deepEqualV01(
      benchmark.fallback_plan.predecessor_route_ref,
      expectedPredecessorRef,
    ) ||
    !deepEqualV01(
      benchmark.fallback_plan.predecessor_route_ref,
      replay.route_profile_ref,
    ) ||
    benchmark.fallback_plan.frozen_case_ref.frozen_case_id !==
      benchmark.frozen_case.frozen_case_id ||
    benchmark.fallback_plan.frozen_case_ref.frozen_case_fingerprint !==
      benchmark.frozen_case.integrity.fingerprint ||
    benchmark.fallback_relation.candidate_arm_id !== candidate.arm_id ||
    benchmark.fallback_relation.predecessor_replay_arm_id !== replay.arm_id ||
    benchmark.fallback_relation.candidate_history_unchanged !== true ||
    benchmark.fallback_relation.cross_arm_contamination_detected !== false ||
    benchmark.fallback_relation.automatic_execution_used !== false ||
    identityValuesV01(candidate).some((value) =>
      value !== null && identityValuesV01(replay).includes(value))
  ) {
    failV01("model_host_fallback_relation_invalid");
  }
}

function assertNoCrossArmIdentityReuseV01(
  arms: ModelHostSuccessionArmResultV01[],
): void {
  const seen = new Set<string>();
  for (const arm of arms) {
    for (const value of identityValuesV01(arm)) {
      if (value === null) continue;
      if (seen.has(value)) {
        failV01("model_host_cross_arm_identity_reuse_detected");
      }
      seen.add(value);
    }
  }
}

function assertAdrOwnerGapObservationsV01(
  observations: ModelHostSuccessionAdrOwnerGapObservationV01[],
): void {
  if (!Array.isArray(observations) || observations.length !== 6) {
    failV01("model_host_adr_owner_gap_observations_invalid");
  }
  const questions = new Set<string>();
  for (const observation of observations) {
    if (!isProtocolRecordV01(observation)) {
      failV01("model_host_adr_owner_gap_observation_invalid");
    }
    assertExactKeysV01(observation, [
      "question", "observation", "evidence_owner_refs",
      "decision_deferred_to_acgc6b",
    ], "$.adr_owner_gap_observations[]");
    const question = requiredTextV01(
      observation.question,
      "$.adr_owner_gap_observations[].question",
    );
    requiredTextV01(
      observation.observation,
      "$.adr_owner_gap_observations[].observation",
    );
    if (
      questions.has(question) ||
      observation.decision_deferred_to_acgc6b !== true ||
      observation.evidence_owner_refs.length === 0 ||
      !deepEqualV01(
        canonicalUniqueTextV01(observation.evidence_owner_refs),
        observation.evidence_owner_refs,
      )
    ) {
      failV01("model_host_adr_owner_gap_observation_invalid");
    }
    questions.add(question);
  }
}

function canonicalAdrOwnerGapObservationsV01(
  observations: ModelHostSuccessionAdrOwnerGapObservationV01[],
): ModelHostSuccessionAdrOwnerGapObservationV01[] {
  if (!Array.isArray(observations) || observations.length > MAX_ITEMS) {
    failV01("model_host_adr_owner_gap_observations_invalid");
  }
  return observations.map((observation) => {
    if (observation.decision_deferred_to_acgc6b !== true) {
      failV01("model_host_adr_owner_gap_observation_invalid");
    }
    return {
      question: requiredTextV01(
        observation.question,
        "$.adr_owner_gap_observations[].question",
      ),
      observation: requiredTextV01(
        observation.observation,
        "$.adr_owner_gap_observations[].observation",
      ),
      evidence_owner_refs: canonicalUniqueTextV01(
        observation.evidence_owner_refs,
      ),
      decision_deferred_to_acgc6b: true,
    };
  });
}

function canonicalRouteProfilesV01(
  input: ModelHostSuccessionRouteProfileV01[],
): ModelHostSuccessionRouteProfileV01[] {
  const values = input.map((profile) => {
    assertValidModelHostSuccessionRouteProfileV01(profile);
    return cloneV01(profile);
  });
  return values.sort(
    (left, right) =>
      MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.indexOf(left.route_role) -
      MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.indexOf(right.route_role),
  );
}

function canonicalArmResultsV01(
  input: ModelHostSuccessionArmResultV01[],
): ModelHostSuccessionArmResultV01[] {
  const values = input.map((arm) => {
    assertValidModelHostSuccessionArmResultV01(arm);
    return cloneV01(arm);
  });
  return values.sort(
    (left, right) =>
      MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.indexOf(
        left.route_profile_ref.route_role,
      ) - MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.indexOf(
        right.route_profile_ref.route_role,
      ),
  );
}

function deriveRouteContractDeltaV01(
  left: ModelHostSuccessionArmResultV01,
  right: ModelHostSuccessionArmResultV01,
): ModelHostSuccessionPairwiseDeltaV01 {
  const leftStatus = left.contract_status;
  const rightStatus = right.contract_status;
  let relation: ModelHostSuccessionPairwiseDeltaV01["relation"];
  let basis: string;
  if (leftStatus === rightStatus) {
    relation = "equal";
    basis =
      `Both arms have the exact route-contract status ${leftStatus}; this dimension establishes no global route ranking.`;
  } else if (
    (leftStatus === "contract_compatible" &&
      ["fallback_required", "contract_incompatible"].includes(rightStatus)) ||
    (rightStatus === "contract_compatible" &&
      ["fallback_required", "contract_incompatible"].includes(leftStatus))
  ) {
    relation = "tradeoff";
    const narrowStatus = leftStatus === "contract_compatible"
      ? rightStatus
      : leftStatus;
    basis =
      `One arm is contract-compatible while the other has the exact narrow status ${narrowStatus}; this route-contract delta is not a global route ranking.`;
  } else {
    relation = "not_comparable";
    basis =
      "The exact categorical route-contract statuses differ without a bounded compatible-versus-narrow-failure rule; this dimension is not comparable.";
  }
  return {
    left_route_role: left.route_profile_ref.route_role,
    right_route_role: right.route_profile_ref.route_role,
    dimension: "route_contract_status",
    relation,
    left_value: leftStatus,
    right_value: rightStatus,
    basis,
  };
}

function deriveCapabilityCoverageDeltaV01(
  left: ModelHostSuccessionArmResultV01,
  right: ModelHostSuccessionArmResultV01,
): ModelHostSuccessionPairwiseDeltaV01 {
  const leftSupported = new Set(left.supported_capability);
  const rightSupported = new Set(right.supported_capability);
  const leftUniverse = new Set([
    ...left.supported_capability,
    ...left.unsupported_capability,
  ]);
  const rightUniverse = new Set([
    ...right.supported_capability,
    ...right.unsupported_capability,
  ]);
  let relation: ModelHostSuccessionPairwiseDeltaV01["relation"];
  let basis: string;
  if (
    sameStringSetV01(leftSupported, rightSupported) &&
    sameStringSetV01(leftUniverse, rightUniverse)
  ) {
    relation = "equal";
    basis =
      "The exact declared supported and unsupported benchmark operation-class sets are equal; no model capability or route ranking is inferred.";
  } else if (
    sameStringSetV01(leftUniverse, rightUniverse) &&
    strictStringSubsetV01(leftSupported, rightSupported)
  ) {
    relation = "left_narrow_coverage";
    basis =
      "The left arm supports a strict subset of the same explicit benchmark operation-class universe; this is narrow coverage only, not a global route ranking.";
  } else if (
    sameStringSetV01(leftUniverse, rightUniverse) &&
    strictStringSubsetV01(rightSupported, leftSupported)
  ) {
    relation = "right_narrow_coverage";
    basis =
      "The right arm supports a strict subset of the same explicit benchmark operation-class universe; this is narrow coverage only, not a global route ranking.";
  } else {
    relation = "not_comparable";
    basis =
      "The declared benchmark operation-class coverage differs without an exact nested universe; model capability and global route quality remain unobserved.";
  }
  return {
    left_route_role: left.route_profile_ref.route_role,
    right_route_role: right.route_profile_ref.route_role,
    dimension: "capability_coverage",
    relation,
    left_value: capabilityDeltaValueV01(left),
    right_value: capabilityDeltaValueV01(right),
    basis,
  };
}

function capabilityDeltaValueV01(
  arm: ModelHostSuccessionArmResultV01,
): ModelHostSuccessionCapabilityDeltaValueV01 {
  return {
    explicit_operation_class_count:
      arm.supported_capability.length + arm.unsupported_capability.length,
    supported_operation_class_count: arm.supported_capability.length,
    unsupported_operation_class_count: arm.unsupported_capability.length,
    supported_operation_classes_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(arm.supported_capability),
    ),
    unsupported_operation_classes_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(arm.unsupported_capability),
    ),
  };
}

function canonicalPairwiseDeltasV01(
  input: ModelHostSuccessionPairwiseDeltaV01[],
): ModelHostSuccessionPairwiseDeltaV01[] {
  if (!Array.isArray(input)) failV01("model_host_pairwise_delta_invalid");
  if (input.length > MAX_ITEMS) failV01("model_host_pairwise_delta_limit_exceeded");
  const values = cloneV01(input);
  for (const row of values) {
    if (!isProtocolRecordV01(row)) {
      failV01("model_host_pairwise_delta_invalid");
    }
    assertExactKeysV01(row, [
      "left_route_role", "right_route_role", "dimension", "relation",
      "left_value", "right_value", "basis",
    ], "$.pairwise_route_deltas[]");
    requiredTextV01(row.dimension, "$.pairwise_route_deltas.dimension");
    requiredTextV01(row.basis, "$.pairwise_route_deltas.basis");
    if (!MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.includes(row.left_route_role) ||
        !MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.includes(row.right_route_role) ||
        ![
          "equal", "tradeoff", "unknown", "not_comparable",
          "left_narrow_coverage", "right_narrow_coverage",
        ]
          .includes(row.relation) ||
        ![row.left_value, row.right_value].every(isPairwiseDeltaValueV01)) {
      failV01("model_host_pairwise_route_role_invalid");
    }
  }
  return values.sort((left, right) =>
    canonicalizeProtocolValueV01([
      MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.indexOf(left.left_route_role),
      MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.indexOf(left.right_route_role),
      left.dimension,
    ]).localeCompare(canonicalizeProtocolValueV01([
      MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.indexOf(right.left_route_role),
      MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.indexOf(right.right_route_role),
      right.dimension,
    ]), "en"));
}

function assertPairwiseRouteDeltasV01(
  rows: ModelHostSuccessionPairwiseDeltaV01[],
  arms: ModelHostSuccessionArmResultV01[],
): void {
  canonicalPairwiseDeltasV01(rows);
  const expected = new Set<string>();
  for (
    let left = 0;
    left < MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.length;
    left += 1
  ) {
    for (
      let right = left + 1;
      right < MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.length;
      right += 1
    ) {
      for (const dimension of [
        "capability_coverage",
        "model_quality",
        "route_contract_status",
      ]) {
        expected.add(
          `${MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01[left]}|${MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01[right]}|${dimension}`,
        );
      }
    }
  }
  const actual = new Set<string>();
  for (const row of rows) {
    const key = `${row.left_route_role}|${row.right_route_role}|${row.dimension}`;
    if (actual.has(key) || !expected.has(key)) {
      failV01("model_host_pairwise_matrix_invalid");
    }
    if (
      row.dimension === "model_quality" &&
      (row.relation !== "unknown" ||
        row.left_value !== null || row.right_value !== null)
    ) {
      failV01("model_host_pairwise_model_quality_claim_invalid");
    }
    actual.add(key);
  }
  if (actual.size !== expected.size) {
    failV01("model_host_pairwise_matrix_incomplete");
  }
  if (
    !deepEqualV01(
      deriveModelHostSuccessionPairwiseRouteDeltasV01(arms),
      rows,
    )
  ) {
    failV01("model_host_pairwise_source_binding_invalid");
  }
}

function isPairwiseDeltaValueV01(value: unknown): boolean {
  if (
    value === null ||
    ["string", "number", "boolean"].includes(typeof value)
  ) {
    return true;
  }
  if (!isProtocolRecordV01(value)) return false;
  try {
    assertExactKeysV01(value, [
      "explicit_operation_class_count",
      "supported_operation_class_count",
      "unsupported_operation_class_count",
      "supported_operation_classes_fingerprint",
      "unsupported_operation_classes_fingerprint",
    ], "$.pairwise_route_deltas.value");
    const capability = value as unknown as ModelHostSuccessionCapabilityDeltaValueV01;
    if (
      !Number.isInteger(capability.explicit_operation_class_count) ||
      !Number.isInteger(capability.supported_operation_class_count) ||
      !Number.isInteger(capability.unsupported_operation_class_count) ||
      capability.explicit_operation_class_count < 0 ||
      capability.supported_operation_class_count < 0 ||
      capability.unsupported_operation_class_count < 0 ||
      capability.explicit_operation_class_count !==
        capability.supported_operation_class_count +
          capability.unsupported_operation_class_count
    ) {
      return false;
    }
    requiredFingerprintV01(
      capability.supported_operation_classes_fingerprint,
      "$.pairwise_route_deltas.value.supported_operation_classes_fingerprint",
    );
    requiredFingerprintV01(
      capability.unsupported_operation_classes_fingerprint,
      "$.pairwise_route_deltas.value.unsupported_operation_classes_fingerprint",
    );
    return true;
  } catch {
    return false;
  }
}

function sameStringSetV01(left: Set<string>, right: Set<string>): boolean {
  return left.size === right.size && [...left].every((value) => right.has(value));
}

function strictStringSubsetV01(left: Set<string>, right: Set<string>): boolean {
  return left.size < right.size && [...left].every((value) => right.has(value));
}

function canonicalCoverageV01(
  input: ModelHostSuccessionCapabilityCoverageRowV01[],
): ModelHostSuccessionCapabilityCoverageRowV01[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_ITEMS) {
    failV01("model_host_capability_coverage_invalid");
  }
  const values = input.map((row) => ({
    operation_class: requiredTextV01(row.operation_class, "$.capability_coverage.operation_class"),
    coverage: row.coverage,
    basis: requiredTextV01(row.basis, "$.capability_coverage.basis"),
  }));
  if (values.some((row) => row.coverage !== "supported" && row.coverage !== "unsupported") ||
      new Set(values.map((row) => row.operation_class)).size !== values.length) {
    failV01("model_host_capability_coverage_invalid");
  }
  return values.sort((left, right) =>
    left.operation_class.localeCompare(right.operation_class, "en"));
}

function canonicalCheckSummaryV01(
  input: ModelHostSuccessionArmResultV01["required_checks"],
): ModelHostSuccessionArmResultV01["required_checks"] {
  return {
    passed: canonicalUniqueTextV01(input.passed),
    failed: canonicalUniqueTextV01(input.failed),
    blocked: canonicalUniqueTextV01(input.blocked),
    skipped: canonicalUniqueTextV01(input.skipped),
    unknown: canonicalUniqueTextV01(input.unknown),
  };
}

function canonicalUniqueTextV01(input: string[]): string[] {
  if (!Array.isArray(input) || input.length > MAX_ITEMS) {
    failV01("model_host_text_collection_invalid");
  }
  const values = input.map((value) => requiredTextV01(value, "$[]"));
  if (new Set(values).size !== values.length) {
    failV01("model_host_text_collection_duplicate");
  }
  return values.sort((left, right) => left.localeCompare(right, "en"));
}

function sameIdentityV01(
  left: ModelHostSuccessionRouteProfileV01,
  right: ModelHostSuccessionRouteProfileV01,
): boolean {
  return deepEqualV01(left.provider_ref, right.provider_ref) &&
    deepEqualV01(left.model_ref, right.model_ref) &&
    deepEqualV01(left.host_ref, right.host_ref) &&
    left.adapter_implementation_id === right.adapter_implementation_id &&
    left.adapter_implementation_version === right.adapter_implementation_version &&
    left.native_host_adapter_version === right.native_host_adapter_version &&
    left.capability_version === right.capability_version;
}

function isNonExecutedArmV01(arm: ModelHostSuccessionArmResultV01): boolean {
  return arm.execution_status === "unavailable" ||
    arm.execution_status === "not_executed";
}

function deriveFallbackSettledStatusV01(
  arm: ModelHostSuccessionArmResultV01,
): ModelHostSuccessionFallbackPlanV01["failed_arm_ref"]["settled_status"] {
  if (arm.fallback_required !== true || arm.fallback_used !== false) {
    failV01("model_host_fallback_candidate_state_invalid");
  }
  if (arm.contract_status === "fallback_required") return "fallback_required";
  if (arm.contract_status === "contract_incompatible") {
    return "contract_incompatible";
  }
  if (arm.execution_status === "unavailable") return "unavailable";
  if (arm.execution_status === "not_executed") return "not_executed";
  if (arm.execution_status === "failed") return "failed";
  failV01("model_host_fallback_candidate_not_settled");
}

function identityValuesV01(arm: ModelHostSuccessionArmResultV01): Array<string | null> {
  const proof = arm.fresh_identity_proof;
  return [
    proof.project_scope_fingerprint,
    proof.database_scope_fingerprint,
    proof.repository_root_fingerprint,
    proof.attachment_id,
    proof.attachment_binding_fingerprint,
    proof.start_request_fingerprint,
    proof.start_grant_fingerprint,
    proof.managed_run_id,
    proof.controller_identity_fingerprint,
    proof.browser_decision_session_identity_fingerprint,
    proof.host_session_identity_fingerprint,
    proof.host_thread_identity_fingerprint,
    proof.host_turn_identity_fingerprint,
    proof.provider_thread_identity_fingerprint,
  ];
}

function assertSafeMaterialV01(value: unknown): void {
  const errors: Array<{ code: string; path: string }> = [];
  const sink: ProtocolValidationIssueSinkV01 = {
    error(code, path) {
      if (code !== "provider_specific_core_field") {
        errors.push({ code, path: path ?? "$" });
      }
    },
    warning() {},
  };
  scanForbiddenProtocolMaterialV01(value, "$", sink, {
    secret_material_message: "Secret-shaped material is forbidden in ACGC6A.",
    provider_specific_field_message:
      "Provider identity is allowed only as explicit route-contract metadata.",
    allowed_false_invariant_fields: new Set([
      "raw_prompt_included", "raw_transcript_included",
      "raw_terminal_output_included", "raw_provider_output_included",
      "raw_artifact_content_included", "hidden_reasoning_included",
      "secret_or_credential_included", "credential_or_secret_included",
      "token_cookie_or_nonce_included", "absolute_local_path_included",
    ]),
  });
  const serialized = canonicalizeProtocolValueV01(value);
  if (PRIVATE_PATH.test(serialized)) {
    errors.push({ code: "private_path_material_refused", path: "$" });
  }
  if (errors.length > 0) failV01(errors[0]!.code, errors[0]!.path);
}

function requiredExternalRefV01(value: ExternalRefV01, path: string): void {
  if (!isProtocolRecordV01(value) || value.ref_version !== "external_ref.v0.1" ||
      !requiredTextV01(value.ref_type, `${path}.ref_type`) ||
      !requiredTextV01(value.external_id, `${path}.external_id`) ||
      !requiredTextV01(value.trust_class, `${path}.trust_class`) ||
      parseStrictIsoTimestampV01(value.observed_at) === null) {
    failV01("model_host_external_ref_invalid", path);
  }
}

function assertOptionalRouteRefV01(
  value: ModelHostSuccessionRouteProfileRefV01 | null,
  path: string,
): void {
  if (value !== null) assertRouteRefV01(value, path);
}

function assertRouteRefV01(
  value: ModelHostSuccessionRouteProfileRefV01,
  path: string,
): void {
  if (
    !isProtocolRecordV01(value) ||
    value.route_profile_version !== MODEL_HOST_SUCCESSION_ROUTE_PROFILE_VERSION_V01 ||
    !MODEL_HOST_SUCCESSION_ROUTE_ROLE_ORDER_V01.includes(value.route_role) ||
    !SAFE_ID.test(value.route_profile_id) ||
    !SHA256.test(value.route_profile_fingerprint)
  ) {
    failV01("model_host_route_ref_invalid", path);
  }
}

function assertRecordRefV01(
  value: unknown,
  path: string,
): void {
  if (!isProtocolRecordV01(value)) {
    failV01("model_host_record_ref_invalid", path);
  }
  assertExactKeysV01(value, [
    "record_version", "record_id", "record_fingerprint",
  ], path);
  requiredTextV01(value.record_version, `${path}.record_version`);
  requiredIdV01(value.record_id, `${path}.record_id`);
  requiredFingerprintV01(value.record_fingerprint, `${path}.record_fingerprint`);
}

function assertIdentityV01(
  value: object,
  field: string,
  prefix: string,
): void {
  const actual = (value as Record<string, unknown>)[field];
  if (typeof actual !== "string" || actual !== deriveIdV01(value, field, prefix)) {
    failV01("model_host_identity_mismatch", `$.${field}`);
  }
}

function assertFingerprintV01(value: { integrity: ModelHostSuccessionIntegrityV01 }): void {
  if (!SHA256.test(value.integrity.fingerprint) ||
      value.integrity.fingerprint !== fingerprintV01(value)) {
    failV01("model_host_fingerprint_mismatch", "$.integrity.fingerprint");
  }
}

function deriveIdV01(
  value: object,
  field: string,
  prefix: string,
): string {
  const clone = cloneV01(value) as Record<string, unknown>;
  clone[field] = `${prefix}:pending`;
  const integrity = clone.integrity as ModelHostSuccessionIntegrityV01;
  integrity.fingerprint = PENDING_FINGERPRINT;
  return `${prefix}:${createProtocolSha256V01(
    canonicalizeProtocolValueV01(clone),
  ).slice(7, 31)}`;
}

function fingerprintV01(value: { integrity: ModelHostSuccessionIntegrityV01 }): string {
  const clone = cloneV01(value);
  clone.integrity.fingerprint = PENDING_FINGERPRINT;
  return createProtocolSha256V01(canonicalizeProtocolValueV01(clone));
}

function pendingIntegrityV01(scope: string): ModelHostSuccessionIntegrityV01 {
  return {
    algorithm: "sha256",
    canonicalization: "augnes-json-c14n-v0_1",
    fingerprint_scope: scope,
    fingerprint: PENDING_FINGERPRINT,
  };
}

function requiredTextV01(value: unknown, path: string): string {
  if (typeof value !== "string") failV01("model_host_text_invalid", path);
  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_TEXT || PRIVATE_PATH.test(normalized)) {
    failV01("model_host_text_invalid", path);
  }
  return normalized;
}

function requiredIdV01(value: unknown, path: string): void {
  if (typeof value !== "string" || !SAFE_ID.test(value)) {
    failV01("model_host_id_invalid", path);
  }
}

function requiredFingerprintV01(value: unknown, path: string): void {
  if (typeof value !== "string" || !SHA256.test(value)) {
    failV01("model_host_fingerprint_invalid", path);
  }
}

function assertExactKeysV01(
  value: object,
  expected: string[],
  path: string,
): void {
  if (!deepEqualV01(Object.keys(value).sort(), [...expected].sort())) {
    failV01("model_host_unknown_or_missing_field", path);
  }
}

function validationResultV01(
  validate: () => void,
): ModelHostSuccessionValidationResultV01 {
  try {
    validate();
    return { status: "valid", errors: [] };
  } catch (error) {
    return {
      status: "blocked",
      errors: [{
        code: error instanceof ModelHostSuccessionBenchmarkErrorV01
          ? error.code
          : "model_host_succession_invalid",
        path: error instanceof ModelHostSuccessionBenchmarkErrorV01
          ? error.path
          : "$",
      }],
    };
  }
}

function deepEqualV01(left: unknown, right: unknown): boolean {
  return canonicalizeProtocolValueV01(left) === canonicalizeProtocolValueV01(right);
}

function cloneV01<T>(value: T): T {
  return structuredClone(value);
}

function failV01(code: string, path = "$"): never {
  throw new ModelHostSuccessionBenchmarkErrorV01(code, path);
}
